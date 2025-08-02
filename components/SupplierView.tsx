import React, { useState, useEffect, useMemo } from 'react';
import { Supplier, PurchaseOrder, PurchaseOrderStatus, PaymentStatus, User, NavView, Permission, EnrichedSupplier, Product } from '../types';
import { useConfirm } from '../contexts/ConfirmContext';
import { useToast } from '../contexts/ToastContext';
import EmptyState from './EmptyState';
import AddEditSupplierModal from './AddEditSupplierModal';
import { useSortableData, SortConfig } from '../hooks/useSortableData';
import Header from './Header';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter';

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

interface SupplierViewProps {
    suppliers: Supplier[];
    purchaseOrders: PurchaseOrder[];
    products: Product[];
    onUpdatePaymentStatus: (poId: string, amountToPay: number) => Promise<void>;
    currentUser: User;
    onNavigate: (view: NavView, params?: any) => void;
    initialSupplierId: string | null;
    onClearInitialSelection: () => void;
    hasPermission: (permission: Permission) => boolean;
    onSaveSupplier: (supplier: Omit<Supplier, 'id'> | Supplier) => Promise<any>;
    onDeleteSupplier: (supplierId: string) => Promise<any>;
    loadData: () => Promise<void>;
}

const currencyFormatter = (value: number) => `${value.toLocaleString('vi-VN')}đ`;

const SortableHeader = <T,>({
  label,
  sortKey,
  requestSort,
  sortConfig,
}: {
  label: string;
  sortKey: keyof T;
  requestSort: (key: keyof T) => void;
  sortConfig: SortConfig<T> | null;
}) => {
  const isSorted = sortConfig?.key === sortKey;
  const direction = isSorted ? sortConfig.direction : undefined;
  return (
    <button
      type="button"
      onClick={() => requestSort(sortKey)}
      className="flex items-center gap-1 group"
    >
      {label}
      <span className="opacity-0 group-hover:opacity-100 transition-opacity">
        {direction === 'ascending' ? '▲' : direction === 'descending' ? '▼' : '↕'}
      </span>
      {isSorted && <span className="opacity-100">{direction === 'ascending' ? '▲' : '▼'}</span>}
    </button>
  );
};

const SupplierDetailView: React.FC<{ 
    supplier: EnrichedSupplier, 
    purchaseOrders: PurchaseOrder[], 
    products: Product[],
    onBack: () => void, 
    onNavigate: (view: NavView, params?: any) => void; 
    onEdit: (supplier: Supplier) => void;
    onDelete: (supplierId: string) => void;
    hasPermission: (permission: Permission) => boolean;
}> = ({ supplier, purchaseOrders, products, onBack, onNavigate, onEdit, onDelete, hasPermission }) => {
    const [activeTab, setActiveTab] = useState('POs');
    
    const supplierPOs = useMemo(() => {
        return purchaseOrders
            .filter(po => po.supplierId === supplier.id)
            .sort((a,b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
    }, [supplier.id, purchaseOrders]);
    
    const suppliedProducts = useMemo(() => {
        return products.filter(p => p.supplierId === supplier.id);
    }, [supplier.id, products]);

    return (
        <div className="animate-fadeIn">
            <Header title={supplier.name} onBack={onBack} />
            
             <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md flex-grow">
                    <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Thông tin liên hệ</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <div><strong>Người liên hệ:</strong> {supplier.contactPerson}</div>
                        <div><strong>Điện thoại:</strong> {supplier.phone}</div>
                        <div><strong>Email:</strong> {supplier.email}</div>
                        <div><strong>Địa chỉ:</strong> {supplier.address}</div>
                    </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center">
                    <button onClick={() => onEdit(supplier)} className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm">Sửa</button>
                    <button onClick={() => onDelete(supplier.id)} className="px-4 py-2 text-sm font-medium bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-500/50 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/60">Xóa</button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-md"><p className="text-sm text-slate-500 dark:text-slate-400">Tổng chi tiêu</p><p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{currencyFormatter(supplier.totalSpent)}</p></div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-md"><p className="text-sm text-slate-500 dark:text-slate-400">Công nợ phải trả</p><p className="text-2xl font-bold text-red-600 dark:text-red-400">{currencyFormatter(supplier.debt)}</p></div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-md"><p className="text-sm text-slate-500 dark:text-slate-400">Tổng số đơn mua</p><p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{supplier.poCount}</p></div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md">
                 <div className="border-b border-slate-200 dark:border-slate-700">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        <button onClick={() => setActiveTab('POs')} className={`${activeTab === 'POs' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Lịch sử Mua hàng ({supplierPOs.length})</button>
                        <button onClick={() => setActiveTab('Products')} className={`${activeTab === 'Products' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Sản phẩm Cung cấp ({suppliedProducts.length})</button>
                    </nav>
                </div>
                <div className="mt-4">
                    {activeTab === 'POs' && (
                        <div className="overflow-x-auto">
                             <table className="min-w-full">
                                <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs uppercase">
                                    <tr>
                                        <th className="py-2 px-3 text-left">Mã PO</th><th className="py-2 px-3 text-left">Ngày</th>
                                        <th className="py-2 px-3 text-right">Tổng tiền</th><th className="py-2 px-3 text-center">Trạng thái</th>
                                        <th className="py-2 px-3 text-center">Thanh toán</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {supplierPOs.map(po => (
                                        <tr key={po.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                            <td className="py-2 px-3"><button onClick={() => onNavigate('PURCHASING', { poId: po.id })} className="font-medium text-primary-600 hover:underline">{po.id}</button></td>
                                            <td className="py-2 px-3">{po.orderDate}</td>
                                            <td className="py-2 px-3 text-right font-semibold">{currencyFormatter(po.total)}</td>
                                            <td className="py-2 px-3 text-center"><span className={`px-2 inline-flex text-xs font-semibold rounded-full ${getStatusClass(po.status)}`}>{po.status}</span></td>
                                            <td className="py-2 px-3 text-center"><span className={`px-2 inline-flex text-xs font-semibold rounded-full ${getPaymentStatusClass(po.paymentStatus)}`}>{po.paymentStatus}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                             {supplierPOs.length === 0 && <EmptyState icon={<div/>} title="Chưa có đơn mua hàng" message="Chưa có đơn mua hàng nào cho nhà cung cấp này." />}
                        </div>
                    )}
                     {activeTab === 'Products' && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs uppercase">
                                    <tr>
                                        <th className="py-2 px-3 text-left">SKU</th><th className="py-2 px-3 text-left">Tên sản phẩm</th>
                                        <th className="py-2 px-3 text-right">Giá nhập</th><th className="py-2 px-3 text-center">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {suppliedProducts.map(p => (
                                        <tr key={p.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                            <td className="py-2 px-3 font-mono">{p.sku}</td>
                                            <td className="py-2 px-3">{p.name}</td>
                                            <td className="py-2 px-3 text-right">{currencyFormatter(p.cost)}</td>
                                            <td className="py-2 px-3 text-center">
                                                <button onClick={() => onNavigate('PRODUCT', { productId: p.id })} className="text-sm text-primary-600 hover:underline">Xem chi tiết</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {suppliedProducts.length === 0 && <EmptyState icon={<div/>} title="Chưa có sản phẩm" message="Nhà cung cấp này chưa cung cấp sản phẩm nào." />}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; }> = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-md flex items-start justify-between text-left transition-all duration-300 hover:-translate-y-1">
        <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{value}</p>
        </div>
        <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-700">
            {icon}
        </div>
    </div>
);


const SupplierView: React.FC<SupplierViewProps> = ({ suppliers, purchaseOrders, products, onUpdatePaymentStatus, currentUser, onNavigate, initialSupplierId, onClearInitialSelection, hasPermission, onSaveSupplier, onDeleteSupplier, loadData }) => {
    const [view, setView] = useState<'list' | 'detail'>('list');
    const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const confirm = useConfirm();
    const { addToast } = useToast();

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (initialSupplierId) {
            setSelectedSupplierId(initialSupplierId);
            setView('detail');
            onClearInitialSelection();
        }
    }, [initialSupplierId, onClearInitialSelection]);

    const enrichedSuppliers: EnrichedSupplier[] = useMemo(() => {
        return suppliers.map(supplier => {
            const supplierPOs = purchaseOrders.filter(po => po.supplierId === supplier.id);
            const receivedPOs = supplierPOs.filter(po => po.status === PurchaseOrderStatus.Received);
            
            const totalSpent = receivedPOs.reduce((sum, po) => sum + po.total, 0);
            const debt = receivedPOs.reduce((sum, po) => sum + (po.total - po.amountPaid), 0);
            
            return { ...supplier, totalSpent, debt, poCount: supplierPOs.length };
        });
    }, [suppliers, purchaseOrders]);

    const filteredSuppliers = useMemo(() => {
        return enrichedSuppliers.filter(s =>
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [enrichedSuppliers, searchTerm]);

    const { items: sortedSuppliers, requestSort, sortConfig } = useSortableData(filteredSuppliers, { key: 'name', direction: 'ascending'});
    
    const stats = useMemo(() => {
        const totalDebt = enrichedSuppliers.reduce((sum, s) => sum + s.debt, 0);
        return { total: suppliers.length, totalDebt };
    }, [suppliers, enrichedSuppliers]);

    const animatedTotal = useAnimatedCounter(stats.total);
    const animatedDebt = useAnimatedCounter(stats.totalDebt);

    const handleSelectSupplier = (supplierId: string) => {
        setSelectedSupplierId(supplierId);
        setView('detail');
    };

    const handleBackToList = () => {
        setSelectedSupplierId(null);
        setView('list');
    };

    const handleOpenAddModal = () => {
        setSupplierToEdit(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (supplier: Supplier) => {
        setSupplierToEdit(supplier);
        setIsModalOpen(true);
    };
    
    const handleDeleteSupplier = async (supplierId: string) => {
        const isConfirmed = await confirm({
            title: 'Xóa Nhà Cung Cấp',
            message: 'Bạn có chắc chắn muốn xóa nhà cung cấp này? Mọi dữ liệu liên quan có thể bị ảnh hưởng.',
            variant: 'danger',
            confirmText: 'Xóa'
        });
        if (isConfirmed) {
            const result = await onDeleteSupplier(supplierId);
            if (result.success) {
                setView('list');
            }
        }
    };

    const handleSaveSupplier = async (supplierData: Omit<Supplier, 'id'> | Supplier) => {
        const result = await onSaveSupplier(supplierData);
        if (result.success) {
            setIsModalOpen(false);
        }
    };
    
    const selectedSupplier = enrichedSuppliers.find(s => s.id === selectedSupplierId);

    if (view === 'detail' && selectedSupplier) {
        return <SupplierDetailView 
                    supplier={selectedSupplier} 
                    purchaseOrders={purchaseOrders} 
                    products={products}
                    onBack={handleBackToList} 
                    onNavigate={onNavigate} 
                    onEdit={handleOpenEditModal}
                    onDelete={handleDeleteSupplier}
                    hasPermission={hasPermission}
                />;
    }

    return (
        <>
            <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Tổng số NCC" value={String(animatedTotal)} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 016-6h6a6 6 0 016 6v1h-1.5M15 21h-3M15 21h3m-6-15a4 4 0 11-8 0 4 4 0 018 0z"/></svg>} />
                    <StatCard title="Tổng nợ phải trả" value={currencyFormatter(animatedDebt)} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15A2.25 2.25 0 0 0 2.25 6.75v10.5A2.25 2.25 0 0 0 4.5 19.5Z" /></svg>} />
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                     <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                        <div className="w-full md:w-1/3 relative">
                            <input type="text" placeholder="Tìm kiếm nhà cung cấp..." className="w-full pl-10 pr-4 py-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            <svg className="w-5 h-5 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                        <button onClick={handleOpenAddModal} className="w-full md:w-auto px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">+ Thêm NCC</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                           <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs uppercase">
                                <tr>
                                    <th className="py-2 px-3 text-left"><SortableHeader label="Tên NCC" sortKey="name" requestSort={requestSort} sortConfig={sortConfig}/></th>
                                    <th className="py-2 px-3 text-left">Người liên hệ</th>
                                    <th className="py-2 px-3 text-right"><SortableHeader label="Tổng chi tiêu" sortKey="totalSpent" requestSort={requestSort} sortConfig={sortConfig}/></th>
                                    <th className="py-2 px-3 text-right"><SortableHeader label="Công nợ" sortKey="debt" requestSort={requestSort} sortConfig={sortConfig}/></th>
                                    <th className="py-2 px-3 text-center">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedSuppliers.map(s => (
                                    <tr key={s.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="py-3 px-3"><button onClick={() => handleSelectSupplier(s.id)} className="font-medium text-primary-600 hover:underline">{s.name}</button></td>
                                        <td className="py-3 px-3">{s.contactPerson}</td>
                                        <td className="py-3 px-3 text-right">{currencyFormatter(s.totalSpent)}</td>
                                        <td className={`py-3 px-3 text-right font-semibold ${s.debt > 0 ? 'text-red-600' : ''}`}>{s.debt > 0 ? currencyFormatter(s.debt) : '-'}</td>
                                        <td className="py-3 px-3 text-center space-x-2">
                                            <button onClick={() => handleOpenEditModal(s)} className="text-sm text-blue-600 hover:underline">Sửa</button>
                                            <button onClick={() => handleDeleteSupplier(s.id)} className="text-sm text-red-600 hover:underline">Xóa</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {sortedSuppliers.length === 0 && <EmptyState icon={<div/>} title="Chưa có nhà cung cấp" message="Thêm nhà cung cấp đầu tiên để bắt đầu." action={{ text: 'Thêm NCC', onClick: handleOpenAddModal }}/>}
                    </div>
                </div>
            </div>
            <AddEditSupplierModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveSupplier}
                supplierToEdit={supplierToEdit}
            />
        </>
    );
};

export default React.memo(SupplierView);