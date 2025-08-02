import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { PurchaseOrder, PurchaseOrderStatus, PurchaseOrderItem, Supplier, Product, PaymentStatus, User, UserRole, CompanySettings, NavView, Permission, TaxRate } from '../types';
import { useToast } from '../contexts/ToastContext';
import EmptyState from './EmptyState';
import AddEditPurchaseOrderModal from './AddEditPurchaseOrderModal';
import PurchaseOrderModal from './PurchaseOrderModal';
import { useSortableData, SortConfig } from '../hooks/useSortableData';
import * as api from '../api';
import { useConfirm } from '../contexts/ConfirmContext';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter';


interface PurchasingViewProps {
    purchaseOrders: PurchaseOrder[];
    suppliers: Supplier[];
    products: Product[];
    onUpdateStatus: (poId: string, status: PurchaseOrderStatus, options?: { skipConfirm?: boolean }) => void;
    onUpdatePaymentStatus: (poId: string, amountToPay: number) => void;
    onCreatePO: (po: Omit<PurchaseOrder, 'id'>) => void;
    onUpdatePO: (po: PurchaseOrder) => void;
    onDeletePO: (poId: string) => void;
    initialParams?: {
        poId?: string | null;
        action?: string;
        productId?: string;
        supplierId?: string;
        quantity?: number;
    };
    onClearInitialSelection: () => void;
    currentUser: User;
    companySettings: CompanySettings;
    onNavigate: (view: NavView, params?: any) => void;
    hasPermission: (permission: Permission) => boolean;
    taxRates: TaxRate[];
    loadData: () => Promise<void>;
}

const getStatusClass = (status: PurchaseOrderStatus) => {
  switch (status) {
    case PurchaseOrderStatus.Received: return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
    case PurchaseOrderStatus.Ordered: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
    case PurchaseOrderStatus.Draft: return 'bg-gray-200 text-gray-800 dark:bg-slate-700 dark:text-slate-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200';
  }
};

const getPaymentStatusClass = (status: PaymentStatus) => {
  switch (status) {
    case PaymentStatus.Paid: return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
    case PaymentStatus.Unpaid: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
    case PaymentStatus.PartiallyPaid: return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-200';
  }
};

const StatCardIcon = ({ iconName }: { iconName: string }) => {
    const icons: { [key: string]: React.ReactNode } = {
        spending: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />,
        debt: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15A2.25 2.25 0 0 0 2.25 6.75v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />,
        pending: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
        draft: <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />,
    };
    return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">{icons[iconName]}</svg>;
}


const PurchasingView: React.FC<PurchasingViewProps> = ({ purchaseOrders, suppliers, products, onUpdateStatus, onUpdatePaymentStatus, onCreatePO, onUpdatePO, onDeletePO, initialParams, onClearInitialSelection, currentUser, companySettings, onNavigate, hasPermission, taxRates, loadData }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeStatus, setActiveStatus] = useState<PurchaseOrderStatus | 'All'>('All');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [selectedPoIds, setSelectedPoIds] = useState<string[]>([]);
    
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [isDetailModalOpen, setDetailModalOpen] = useState(false);
    const [poToEdit, setPoToEdit] = useState<PurchaseOrder | null>(null);
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
    const [openActionMenu, setOpenActionMenu] = useState<{ id: string | null, openUp: boolean }>({ id: null, openUp: false });

    const { addToast } = useToast();
    const confirm = useConfirm();
    const actionMenuRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Effect to handle VIEWING a PO from navigation
    useEffect(() => {
        if (initialParams?.poId) {
            const po = purchaseOrders.find(p => p.id === initialParams.poId);
            if (po) {
                setSelectedPO(po);
                setDetailModalOpen(true);
            }
        }
    }, [initialParams?.poId, purchaseOrders]);

    // Effect to handle CREATING a PO from navigation (e.g., from Reports page)
    useEffect(() => {
        if (initialParams?.action !== 'create' || !initialParams.productId || products.length === 0 || suppliers.length === 0) {
            return;
        }

        const product = products.find(p => p.id === initialParams.productId);
        const supplier = suppliers.find(s => s.id === initialParams.supplierId);

        if (product && supplier) {
            const quantityToOrder = initialParams.quantity ? Math.max(1, initialParams.quantity) : product.minStock;
            
            const newPoForEditing: Partial<PurchaseOrder> = {
                supplierId: supplier.id, supplierName: supplier.name,
                items: [{ productId: product.id, productName: product.name, quantity: quantityToOrder, cost: product.cost }],
                warehouse: companySettings.warehouses[0]?.name || ''
            };
            setPoToEdit(newPoForEditing as PurchaseOrder);
            setCreateModalOpen(true);
        } else {
            addToast('Không tìm thấy sản phẩm hoặc nhà cung cấp.', 'error');
        }
        onClearInitialSelection();
    }, [initialParams, products, suppliers, companySettings, addToast, onClearInitialSelection]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
                setOpenActionMenu({ id: null, openUp: false });
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Derived State and Data for UI
    const dynamicStatsData = useMemo(() => {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

        const receivedThisMonth = purchaseOrders.filter(p => p.status === PurchaseOrderStatus.Received && p.receivedDate && p.receivedDate >= firstDayOfMonth);
        const totalSpending = receivedThisMonth.reduce((sum, po) => sum + po.total, 0);
        
        const payables = purchaseOrders
            .filter(po => po.status === PurchaseOrderStatus.Received && po.paymentStatus !== PaymentStatus.Paid)
            .reduce((sum, po) => sum + (po.total - po.amountPaid), 0);
            
        return {
            totalSpending,
            payables,
            pendingReceipts: purchaseOrders.filter(p => p.status === PurchaseOrderStatus.Ordered).length,
            drafts: purchaseOrders.filter(p => p.status === PurchaseOrderStatus.Draft).length
        };
    }, [purchaseOrders]);

    const animatedSpending = useAnimatedCounter(dynamicStatsData.totalSpending);
    const animatedPayables = useAnimatedCounter(dynamicStatsData.payables);
    const animatedPending = useAnimatedCounter(dynamicStatsData.pendingReceipts);
    const animatedDrafts = useAnimatedCounter(dynamicStatsData.drafts);

    const dynamicStats = [
        { title: "Chi tiêu tháng này", value: `${animatedSpending.toLocaleString('vi-VN')}đ`, icon: 'spending', color: 'green' },
        { title: "Công nợ phải trả", value: `${animatedPayables.toLocaleString('vi-VN')}đ`, icon: 'debt', color: 'red', nav: 'ACCOUNTING', params: { tab: 'payables' } },
        { title: "Đơn hàng chờ nhận", value: String(animatedPending), icon: 'pending', color: 'blue' },
        { title: "Đơn hàng dự thảo", value: String(animatedDrafts), icon: 'draft', color: 'yellow' }
    ];

    const filteredPOs = useMemo(() => {
        return purchaseOrders
            .filter(po => activeStatus === 'All' || po.status === activeStatus)
            .filter(po => 
                po.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                po.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .filter(po => {
                if (!dateRange.start && !dateRange.end) return true;
                const poDate = new Date(po.orderDate);
                const startDate = dateRange.start ? new Date(dateRange.start) : null;
                const endDate = dateRange.end ? new Date(dateRange.end) : null;
                if (startDate && poDate < startDate) return false;
                if (endDate && poDate > endDate) return false;
                return true;
            });
    }, [purchaseOrders, searchTerm, activeStatus, dateRange]);

    const { items: sortedPOs, requestSort, sortConfig } = useSortableData(filteredPOs, { key: 'orderDate', direction: 'descending' });
    
    // UI Handlers
    const handleCloseCreateModal = useCallback(() => {
        setCreateModalOpen(false);
        setPoToEdit(null);
        if (initialParams) onClearInitialSelection();
    }, [initialParams, onClearInitialSelection]);

    const handleOpenCreateModal = () => { setPoToEdit(null); setCreateModalOpen(true); };
    
    const handleToggleMenu = (event: React.MouseEvent, po: PurchaseOrder) => {
        if (openActionMenu.id === po.id) { setOpenActionMenu({ id: null, openUp: false }); return; }
        const button = event.currentTarget as HTMLElement;
        const scrollContainer = button.closest('.overflow-x-auto');
        const containerRect = scrollContainer?.getBoundingClientRect() || { top: 0, bottom: window.innerHeight };
        const buttonRect = button.getBoundingClientRect();
        const spaceBelow = containerRect.bottom - buttonRect.bottom;
        const openUp = spaceBelow < 150 && (buttonRect.top - containerRect.top > spaceBelow); // Estimate menu height
        setOpenActionMenu({ id: po.id, openUp });
    };
    
    // Data Action Handlers
    const handleSavePO = useCallback(async (poData: Omit<PurchaseOrder, 'id'> | PurchaseOrder) => {
        if ('id' in poData) { await onUpdatePO(poData); } 
        else { await onCreatePO(poData); }
        handleCloseCreateModal();
    }, [onCreatePO, onUpdatePO, handleCloseCreateModal]);
    
    // Bulk Actions
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) setSelectedPoIds(sortedPOs.map(o => o.id));
        else setSelectedPoIds([]);
    };
    const handleSelectOne = (poId: string) => {
        setSelectedPoIds(prev => prev.includes(poId) ? prev.filter(id => id !== poId) : [...prev, poId]);
    };

    const handleBulkMarkAsOrdered = async () => {
        const draftPOs = sortedPOs.filter(po => selectedPoIds.includes(po.id) && po.status === PurchaseOrderStatus.Draft);
        if(draftPOs.length === 0) {
            addToast('Không có đơn hàng nháp nào được chọn để đặt hàng.', 'info');
            return;
        }
        const isConfirmed = await confirm({
            title: 'Xác nhận Đặt hàng hàng loạt',
            message: `Bạn có chắc chắn muốn đặt ${draftPOs.length} đơn hàng đã chọn không?`,
            confirmText: 'Xác nhận'
        });
        if(isConfirmed) {
            draftPOs.forEach(po => onUpdateStatus(po.id, PurchaseOrderStatus.Ordered, { skipConfirm: true }));
            addToast(`Đã gửi đặt hàng cho ${draftPOs.length} đơn hàng.`, 'success');
            setSelectedPoIds([]);
        }
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {dynamicStats.map((item) => (
                    <div key={item.title} onClick={() => item.nav && onNavigate(item.nav as NavView, item.params)} className={`bg-white dark:bg-slate-800 p-5 rounded-xl shadow-md flex items-center transition-transform duration-300 hover:-translate-y-1 ${item.nav ? 'cursor-pointer' : ''}`}>
                        <div className={`p-3 rounded-full bg-${item.color}-100 dark:bg-${item.color}-900/50 text-${item.color}-600 dark:text-${item.color}-400 mr-4`}>
                            <StatCardIcon iconName={item.icon}/>
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{item.title}</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{item.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                     <div className="w-full md:w-1/3 relative">
                        <input type="text" placeholder="Tìm theo Mã PO, Tên NCC..." className="w-full pl-10 pr-4 py-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                         <svg className="w-5 h-5 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
                        <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="px-3 py-1.5 border rounded-lg text-sm bg-white dark:bg-slate-700"/>
                        <span className="text-slate-500">-</span>
                        <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="px-3 py-1.5 border rounded-lg text-sm bg-white dark:bg-slate-700"/>
                        <select value={activeStatus} onChange={e => setActiveStatus(e.target.value as any)} className="px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-700">
                            <option value="All">Tất cả trạng thái</option>
                            {Object.values(PurchaseOrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {hasPermission('CREATE_PO') && (
                        <button onClick={handleOpenCreateModal} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2 shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                            <span>Tạo đơn</span>
                        </button>
                        )}
                    </div>
                </div>

                 {selectedPoIds.length > 0 && hasPermission('UPDATE_PO_STATUS') && (
                    <div className="bg-primary-50 dark:bg-primary-900/30 p-3 rounded-lg mb-4 border border-primary-200 dark:border-primary-500/30 flex items-center justify-between">
                        <span className="text-sm font-semibold text-primary-700 dark:text-primary-200">{selectedPoIds.length} đơn hàng được chọn</span>
                        <button onClick={handleBulkMarkAsOrdered} className="px-3 py-1.5 border border-blue-500 text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 rounded-lg text-sm">Xác nhận Đặt hàng</button>
                    </div>
                )}


                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white dark:bg-slate-800">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="py-3 px-4"><input type="checkbox" onChange={handleSelectAll} checked={selectedPoIds.length === sortedPOs.length && sortedPOs.length > 0} /></th>
                                <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase"><span className="flex items-center gap-1 group">Mã PO</span></th>
                                <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase"><span className="flex items-center gap-1 group">Nhà cung cấp</span></th>
                                <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase"><span className="flex items-center gap-1 group">Ngày đặt</span></th>
                                <th className="py-3 px-6 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase"><span className="flex items-center gap-1 group justify-end">Tổng tiền</span></th>
                                <th className="py-3 px-6 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase"><span className="flex items-center gap-1 group justify-center">Thanh toán</span></th>
                                <th className="py-3 px-6 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase"><span className="flex items-center gap-1 group justify-center">Trạng thái</span></th>
                                <th className="py-3 px-6 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {sortedPOs.map(po => (
                                <tr key={po.id} className={`transition-colors ${selectedPoIds.includes(po.id) ? 'bg-primary-50 dark:bg-primary-900/40' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                                    <td className="py-4 px-4"><input type="checkbox" checked={selectedPoIds.includes(po.id)} onChange={() => handleSelectOne(po.id)} /></td>
                                    <td className="py-4 px-6 text-sm font-medium">
                                        <button onClick={() => { setSelectedPO(po); setDetailModalOpen(true); }} className="text-primary-600 dark:text-primary-400 hover:underline">{po.id}</button>
                                    </td>
                                    <td className="py-4 px-6 text-sm">
                                        <button onClick={() => onNavigate('SUPPLIER', { supplierId: po.supplierId })} className="hover:underline text-left">{po.supplierName}</button>
                                    </td>
                                    <td className="py-4 px-6 text-sm">{po.orderDate}</td>
                                    <td className="py-4 px-6 text-sm text-right font-semibold">{po.total.toLocaleString('vi-VN')}đ</td>
                                    <td className="py-4 px-6 text-center"><span className={`px-2 inline-flex text-xs font-semibold rounded-full ${getPaymentStatusClass(po.paymentStatus)}`}>{po.paymentStatus}</span></td>
                                    <td className="py-4 px-6 text-center"><span className={`px-2 inline-flex text-xs font-semibold rounded-full ${getStatusClass(po.status)}`}>{po.status}</span></td>
                                    <td className="py-4 px-6 text-center relative">
                                         <button onClick={(e) => handleToggleMenu(e, po)} className="text-slate-500 dark:text-slate-400 hover:text-primary-600 p-1 rounded-full"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg></button>
                                         {openActionMenu.id === po.id && (
                                            <div ref={actionMenuRef} className={`absolute right-0 w-48 bg-white dark:bg-slate-700 rounded-md shadow-lg z-20 text-left ${openActionMenu.openUp ? 'bottom-full mb-1' : 'top-full mt-2'}`}>
                                                <a href="#" onClick={(e) => { e.preventDefault(); setSelectedPO(po); setDetailModalOpen(true); setOpenActionMenu({id:null, openUp: false}); }} className="block px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-600">Xem & In</a>
                                                {hasPermission('PROCESS_PO_PAYMENT') && po.paymentStatus !== PaymentStatus.Paid && po.status === PurchaseOrderStatus.Received && <a href="#" onClick={(e) => { e.preventDefault(); onUpdatePaymentStatus(po.id, po.total - po.amountPaid); setOpenActionMenu({id:null, openUp: false}); }} className="block px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-600">Thanh toán đủ</a>}
                                                {hasPermission('EDIT_PO') && po.status === PurchaseOrderStatus.Draft && <a href="#" onClick={(e) => { e.preventDefault(); setPoToEdit(po); setCreateModalOpen(true); setOpenActionMenu({id:null, openUp: false}); }} className="block px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-600">Sửa</a>}
                                                {hasPermission('DELETE_PO') && po.status === PurchaseOrderStatus.Draft && <a href="#" onClick={(e) => { e.preventDefault(); onDeletePO(po.id); setOpenActionMenu({id:null, openUp: false});}} className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50">Xóa</a>}
                                            </div>
                                         )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {sortedPOs.length === 0 && (
                        <EmptyState 
                            icon={<svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}
                            title="Chưa có đơn mua hàng"
                            message="Bắt đầu quản lý việc mua hàng bằng cách tạo đơn hàng đầu tiên."
                            action={hasPermission('CREATE_PO') ? { text: "Tạo đơn mua hàng", onClick: handleOpenCreateModal } : undefined}
                        />
                    )}
                </div>
            </div>
            {hasPermission('CREATE_PO') && (
                <AddEditPurchaseOrderModal
                    isOpen={isCreateModalOpen}
                    onClose={handleCloseCreateModal}
                    onSave={handleSavePO}
                    poToEdit={poToEdit}
                    suppliers={suppliers}
                    products={products}
                    companySettings={companySettings}
                    taxRates={taxRates}
                />
            )}
            <PurchaseOrderModal
                isOpen={isDetailModalOpen}
                onClose={() => {
                    setDetailModalOpen(false);
                    setSelectedPO(null);
                    if (initialParams && initialParams.poId) onClearInitialSelection();
                }}
                purchaseOrder={selectedPO}
                onUpdateStatus={onUpdateStatus}
                onUpdatePaymentStatus={onUpdatePaymentStatus}
                companySettings={companySettings}
                canPerformActions={hasPermission('UPDATE_PO_STATUS') || hasPermission('PROCESS_PO_PAYMENT')}
                onNavigate={onNavigate}
            />
        </>
    );
};

export default React.memo(PurchasingView);