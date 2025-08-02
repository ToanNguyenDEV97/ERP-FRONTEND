import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import InvoiceModal from './InvoiceModal';
import { Order, OrderStatus, OrderItem, Customer, Product, NavView, PaymentMethod, PaymentStatus, SalesReturn, SalesReturnItem, SalesReturnStatus, Quotation, QuotationItem, QuotationStatus, User, UserRole, InventoryItem, CompanySettings, Permission, TaxRate } from '../types';
import AddEditCustomerModal from './AddEditCustomerModal';
import { useToast } from '../contexts/ToastContext';
import BarcodeScannerModal from './BarcodeScannerModal';
import QuotationModal from './QuotationModal';
import AddEditOrderModal from './AddEditOrderModal';
import { useSortableData, SortConfig } from '../hooks/useSortableData';
import { useConfirm } from '../contexts/ConfirmContext';
import ReturnModal from './ReturnModal';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter';
import * as api from '../api';
import RecordPaymentModal from './RecordPaymentModal';

interface SalesViewProps {
    orders: Order[];
    customers: Customer[];
    products: Product[];
    inventoryStock: InventoryItem[];
    onNavigate: (view: NavView, params?: any) => void;
    salesReturns: SalesReturn[];
    onHandleReturn: (order: Order, itemsToReturn: SalesReturnItem[], totalRefund: number) => void;
    onPrintSalesReturn: (salesReturn: SalesReturn) => void;
    onUpdateOrderStatus: (orderId: string, status: OrderStatus, options?: { skipConfirm?: boolean; isBulk?: boolean; }) => Promise<{ success: boolean; message?: string; }>;
    onUpdateOrderPaymentStatus: (orderId: string, amount: number, options?: { paymentMethod?: PaymentMethod; isBulk?: boolean; }) => Promise<{ success: boolean; message?: string; }>;
    onHandleCreateAndCompleteOrder: (order: Omit<Order, 'id'>) => void;
    onSaveOrder: (order: Omit<Order, 'id'> | Order) => Promise<{ success: boolean; [key: string]: any; }>;
    onSaveCustomer: (customer: Omit<Customer, 'id' | 'since'>) => Promise<any>;
    // Quotation Props
    quotations: Quotation[];
    onHandleCreateQuotation: (quotation: Omit<Quotation, 'id'>) => void;
    onHandleUpdateQuotation: (quotation: Quotation) => void;
    onHandleDeleteQuotation: (quotationId: string) => void;
    onHandleUpdateQuotationStatus: (quotationId: string, status: QuotationStatus) => void;
    onHandleConvertQuotationToOrder: (quotationId: string) => void;
    // Navigation Props
    initialOrderId: string | null;
    onClearInitialSelection: () => void;
    currentUser: User;
    companySettings: CompanySettings;
    hasPermission: (permission: Permission) => boolean;
    taxRates: TaxRate[];
    loadData: () => Promise<void>;
}

// HELPER FUNCTIONS & COMPONENTS
const getStatusClass = (status: OrderStatus | SalesReturnStatus | QuotationStatus) => {
  switch (status) {
    case OrderStatus.Completed:
    case SalesReturnStatus.Completed:
    case QuotationStatus.Accepted:
    case QuotationStatus.Converted:
        return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
    case OrderStatus.Processing: 
    case QuotationStatus.Sent:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
    case OrderStatus.Pending: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
    case OrderStatus.Cancelled:
    case QuotationStatus.Rejected:
         return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
    case QuotationStatus.Draft:
        return 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
    default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
  }
};

const getPaymentStatusClass = (status: PaymentStatus) => {
  switch (status) {
    case PaymentStatus.Paid: return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
    case PaymentStatus.Unpaid: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
    case PaymentStatus.PartiallyPaid: return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300';
    default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
  }
};


const StatCardIcon = ({ iconName }: { iconName: string }) => {
    const icons: { [key: string]: React.ReactNode } = {
        revenue: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />,
        orders: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
        pending: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
        returns: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 15v-1a4 4 0 00-4-4H8m0 0l-3 3m3-3l3 3m0 0v-2a4 4 0 014-4h2" />,
    };
    return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">{icons[iconName]}</svg>;
}

const Pagination: React.FC<{
    totalItems: number;
    itemsPerPage: number;
    currentPage: number;
    onPageChange: (page: number) => void;
}> = ({ totalItems, itemsPerPage, currentPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }

    return (
        <div className="flex justify-center items-center space-x-2 mt-4">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                Trước
            </button>
            {pageNumbers.map(number => (
                <button key={number} onClick={() => onPageChange(number)} className={`px-3 py-1 rounded-md transition-colors ${currentPage === number ? 'bg-primary-600 text-white' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'}`}>
                    {number}
                </button>
            ))}
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 rounded-md bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                Sau
            </button>
        </div>
    );
};

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


const SalesView: React.FC<SalesViewProps> = (props) => {
    const { orders, customers, products, inventoryStock, onNavigate, salesReturns, onHandleReturn, onPrintSalesReturn, onUpdateOrderStatus, onUpdateOrderPaymentStatus, onHandleCreateAndCompleteOrder, onSaveOrder, onSaveCustomer,
            quotations, onHandleCreateQuotation, onHandleUpdateQuotation, onHandleDeleteQuotation, onHandleUpdateQuotationStatus, onHandleConvertQuotationToOrder,
            initialOrderId, onClearInitialSelection, currentUser, companySettings, hasPermission, taxRates, loadData } = props;

    useEffect(() => {
        loadData();
    }, [loadData]);

    const [searchTerm, setSearchTerm] = useState('');
    const [activeStatus, setActiveStatus] = useState<OrderStatus | 'All'>('All');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [isInvoiceModalOpen, setInvoiceModalOpen] = useState(false);
    const [isReturnModalOpen, setReturnModalOpen] = useState(false);
    const [isQuotationModalOpen, setQuotationModalOpen] = useState(false);
    const [isPrintQuotationModalOpen, setPrintQuotationModalOpen] = useState(false);
    const [isAddCustomerModalOpen, setAddCustomerModalOpen] = useState(false);
    const [isStatusMenuOpen, setStatusMenuOpen] = useState(false);
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);

    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [orderToReturn, setOrderToReturn] = useState<Order | null>(null);
    const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
    const [quotationToPrint, setQuotationToPrint] = useState<Quotation | null>(null);
    const [orderForPayment, setOrderForPayment] = useState<Order | null>(null);
    
    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
    
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 7;

    const [openActionMenu, setOpenActionMenu] = useState<{ id: string | null, openUp: boolean }>({ id: null, openUp: false });
    const actionMenuRef = useRef<HTMLDivElement>(null);
    const statusMenuRef = useRef<HTMLDivElement>(null);
    const [activeTab, setActiveTab] = useState<'orders' | 'quotations' | 'returns'>('orders');
    
    const { addToast } = useToast();
    const confirm = useConfirm();

    const handleStatusChange = (status: OrderStatus | 'All') => {
        setActiveStatus(status);
        setCurrentPage(1);
        setStatusMenuOpen(false); // Close dropdown on selection
    };

    const handleDateChange = (field: 'start' | 'end', value: string) => {
        setDateRange(prev => ({ ...prev, [field]: value }));
        setCurrentPage(1);
    };

    const dynamicStatsData = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const todayOrders = orders.filter(o => o.date === todayStr);
        
        const revenueToday = orders
            .filter(o => o.date === todayStr && o.status === OrderStatus.Completed)
            .reduce((sum, order) => sum + order.total, 0);

        const pendingOrdersCount = orders.filter(o => o.status === OrderStatus.Pending).length;
        const totalReturnsCount = salesReturns.length;

        return {
            todayStr,
            todayOrders,
            revenueToday,
            pendingOrdersCount,
            totalReturnsCount
        };
    }, [orders, salesReturns]);

    const animatedRevenue = useAnimatedCounter(dynamicStatsData.revenueToday);
    const animatedOrders = useAnimatedCounter(dynamicStatsData.todayOrders.length);
    const animatedPending = useAnimatedCounter(dynamicStatsData.pendingOrdersCount);
    const animatedReturns = useAnimatedCounter(dynamicStatsData.totalReturnsCount);
    
    const dynamicStats = [
        { title: "Doanh thu hôm nay", value: `${animatedRevenue.toLocaleString('vi-VN')}đ`, icon: 'revenue', color: 'green', detail: `Từ ${dynamicStatsData.todayOrders.filter(o => o.status === OrderStatus.Completed).length} đơn`, onClick: () => { setDateRange({ start: dynamicStatsData.todayStr, end: dynamicStatsData.todayStr }); setActiveStatus(OrderStatus.Completed); } },
        { title: "Đơn hàng hôm nay", value: String(animatedOrders), icon: 'orders', color: 'blue', detail: `${dynamicStatsData.todayOrders.length} đơn hàng mới`, onClick: () => { setDateRange({ start: dynamicStatsData.todayStr, end: dynamicStatsData.todayStr }); setActiveStatus('All'); } },
        { title: "Chờ xử lý", value: String(animatedPending), icon: 'pending', color: 'yellow', detail: `${dynamicStatsData.pendingOrdersCount} đơn hàng`, onClick: () => { setDateRange({ start: '', end: '' }); setActiveStatus(OrderStatus.Pending); } },
        { title: "Hàng bị trả lại", value: String(animatedReturns), icon: 'returns', color: 'red', detail: `${dynamicStatsData.totalReturnsCount} phiếu trả`, onClick: () => setActiveTab('returns') }
    ];

    const filteredOrders = useMemo(() => {
        return orders
          .filter(order => activeStatus === 'All' || order.status === activeStatus)
          .filter(order => 
            order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .filter(order => {
              if (!dateRange.start && !dateRange.end) return true;
              const orderDate = new Date(order.date);
              const startDate = dateRange.start ? new Date(dateRange.start) : null;
              const endDate = dateRange.end ? new Date(dateRange.end) : null;
              if (startDate && orderDate < startDate) return false;
              if (endDate && orderDate > endDate) return false;
              return true;
          });
    }, [orders, activeStatus, searchTerm, dateRange]);
    
     const filteredQuotations = useMemo(() => {
        return quotations.filter(q =>
            q.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.customerName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [quotations, searchTerm]);

    const { items: sortedOrders, requestSort: requestSortOrders, sortConfig: sortConfigOrders } = useSortableData(filteredOrders, { key: 'date', direction: 'descending' });
    const { items: sortedQuotations, requestSort: requestSortQuotations, sortConfig: sortConfigQuotations } = useSortableData(filteredQuotations, { key: 'date', direction: 'descending' });


    const paginatedOrders = useMemo(() => {
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        return sortedOrders.slice(indexOfFirstItem, indexOfLastItem);
    }, [sortedOrders, currentPage, itemsPerPage]);

     const sortedReturns = useMemo(() => {
        return salesReturns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [salesReturns]);

    const handleOpenInvoice = useCallback((order: Order) => {
        setSelectedOrder(order);
        setInvoiceModalOpen(true);
        setOpenActionMenu({ id: null, openUp: false });
    }, []);

    // Clear selection when filters or page change
    useEffect(() => {
        setSelectedOrderIds([]);
    }, [currentPage, activeStatus, dateRange, activeTab, searchTerm]);

    useEffect(() => {
        if (initialOrderId) {
            const order = orders.find(o => o.id === initialOrderId);
            if (order) {
                handleOpenInvoice(order);
                onClearInitialSelection();
            }
        }
    }, [initialOrderId, orders, onClearInitialSelection, handleOpenInvoice]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
                setOpenActionMenu({ id: null, openUp: false });
            }
            if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
                setStatusMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleToggleMenu = (event: React.MouseEvent, item: Order | Quotation) => {
        const button = event.currentTarget as HTMLElement;
        if (openActionMenu.id === item.id) {
            setOpenActionMenu({ id: null, openUp: false });
            return;
        }

        let menuItemsCount = 1;
        if ('status' in item) { // Type guard for Order
            const order = item as Order;
            if (order.status === OrderStatus.Pending) menuItemsCount = 4;
            if (order.status === OrderStatus.Processing) menuItemsCount = 3;
            if (order.status === OrderStatus.Completed) menuItemsCount++;
            if (order.paymentStatus !== PaymentStatus.Paid) menuItemsCount++;
        }
        
        const menuItemHeight = 40; 
        const estimatedMenuHeight = menuItemsCount * menuItemHeight;
        const scrollContainer = button.closest('.overflow-y-auto');
        const containerRect = scrollContainer?.getBoundingClientRect() || { top: 0, bottom: window.innerHeight };
        const buttonRect = button.getBoundingClientRect();
        const spaceBelow = containerRect.bottom - buttonRect.bottom;
        const spaceAbove = buttonRect.top - containerRect.top;
        const openUp = spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow;

        setOpenActionMenu({ id: item.id, openUp });
    };
    
    const handleOpenCreate = () => {
        setEditingOrder(null);
        setCreateModalOpen(true);
    };

    const handleOpenEdit = (order: Order) => {
        setEditingOrder(order);
        setEditModalOpen(true);
        setOpenActionMenu({ id: null, openUp: false });
    };

    const handleOpenReturnModal = (order: Order) => {
        setOrderToReturn(order);
        setReturnModalOpen(true);
        setOpenActionMenu({ id: null, openUp: false });
    };
    
    const handleOpenCreateQuotation = () => {
        setEditingQuotation(null);
        setQuotationModalOpen(true);
    };

    const handleOpenEditQuotation = (quotation: Quotation) => {
        setEditingQuotation(quotation);
        setQuotationModalOpen(true);
        setOpenActionMenu({id: null, openUp: false});
    };
    
    const handleOpenPrintQuotation = (quotation: Quotation) => {
        setQuotationToPrint(quotation);
        setPrintQuotationModalOpen(true);
        setOpenActionMenu({id: null, openUp: false});
    };

    const handleSaveAndCloseModal = async (orderData: Omit<Order, 'id'> | Order) => {
        const result = await onSaveOrder(orderData);
        if (result.success) {
            if ('id' in orderData) {
                setEditModalOpen(false);
                setEditingOrder(null);
            } else {
                setCreateModalOpen(false);
            }
        }
    };

    const handleSaveCustomer = async (customerData: Omit<Customer, 'id' | 'since'>) => {
        const result = await onSaveCustomer(customerData);
        if (result.success) {
            setAddCustomerModalOpen(false);
        }
    };

    const handleOpenPaymentModal = (order: Order) => {
        setOrderForPayment(order);
        setPaymentModalOpen(true);
        setOpenActionMenu({ id: null, openUp: false });
    };

    const handleSavePayment = (amount: number) => {
        if (orderForPayment) {
            onUpdateOrderPaymentStatus(orderForPayment.id, amount);
        }
        setPaymentModalOpen(false);
        setOrderForPayment(null);
    };
    
    // --- NEW: Bulk Action Handlers ---
    const selectedOrders = useMemo(() => {
        return orders.filter(o => selectedOrderIds.includes(o.id));
    }, [orders, selectedOrderIds]);

    const bulkActionsState = useMemo(() => {
        if (selectedOrders.length === 0) return {
            canMarkAsProcessing: false,
            canMarkAsCompleted: false,
            canMarkAsPaid: false,
            canCancel: false,
        };
        return {
            canMarkAsProcessing: hasPermission('UPDATE_ORDER_STATUS') && selectedOrders.some(o => o.status === OrderStatus.Pending),
            canMarkAsCompleted: hasPermission('UPDATE_ORDER_STATUS') && selectedOrders.some(o => o.status === OrderStatus.Pending || o.status === OrderStatus.Processing),
            canMarkAsPaid: hasPermission('PROCESS_ORDER_PAYMENT') && selectedOrders.some(o => o.paymentStatus !== PaymentStatus.Paid),
            canCancel: hasPermission('CANCEL_ORDER') && selectedOrders.some(o => o.status !== OrderStatus.Cancelled),
        };
    }, [selectedOrders, hasPermission]);


    const handleBulkAction = async (action: 'processing' | 'completed' | 'paid' | 'cancelled') => {
        const actionMap = {
            processing: {
                status: OrderStatus.Processing,
                title: 'Xác nhận Giao hàng',
                message: (count: number) => `Bạn có chắc muốn chuyển ${count} đơn hàng sang trạng thái "Đang giao" không?`,
                filter: (o: Order) => o.status === OrderStatus.Pending,
            },
            completed: {
                status: OrderStatus.Completed,
                title: 'Xác nhận Hoàn thành',
                message: (count: number) => `Bạn có chắc muốn hoàn thành ${count} đơn hàng không? Thao tác này sẽ cập nhật tồn kho.`,
                 filter: (o: Order) => o.status === OrderStatus.Pending || o.status === OrderStatus.Processing,
            },
            paid: {
                title: 'Xác nhận Thanh toán',
                message: (count: number) => `Bạn có chắc muốn đánh dấu ${count} đơn hàng là "Đã thanh toán" không?`,
                filter: (o: Order) => o.paymentStatus !== PaymentStatus.Paid,
            },
            cancelled: {
                status: OrderStatus.Cancelled,
                title: 'Xác nhận Hủy',
                message: (count: number) => `Bạn có chắc muốn hủy ${count} đơn hàng đã chọn không?`,
                filter: (o: Order) => o.status !== OrderStatus.Cancelled,
                variant: 'danger',
            },
        };

        const currentAction = actionMap[action];
        const applicableOrders = selectedOrders.filter(currentAction.filter);

        if (applicableOrders.length === 0) {
            addToast(`Không có đơn hàng nào trong lựa chọn có thể ${action === 'paid' ? 'thanh toán' : 'cập nhật'}`, 'info');
            return;
        }

        const isConfirmed = await confirm({
            title: currentAction.title,
            message: currentAction.message(applicableOrders.length),
            confirmText: 'Xác nhận',
            variant: (currentAction as any).variant || 'info'
        });

        if (!isConfirmed) return;

        let results;
        if (action === 'paid') {
            results = await Promise.all(applicableOrders.map(order => {
                const amountToPay = order.total - order.amountPaid;
                return onUpdateOrderPaymentStatus(order.id, amountToPay, { isBulk: true });
            }));
        } else {
             results = await Promise.all(applicableOrders.map(order =>
                onUpdateOrderStatus(order.id, (currentAction as { status: OrderStatus }).status, { skipConfirm: true, isBulk: true })
            ));
        }
        
        const successCount = results.filter(r => r.success).length;
        addToast(`Đã xử lý thành công ${successCount}/${applicableOrders.length} đơn hàng.`, 'success', 'Thao tác hàng loạt');
        setSelectedOrderIds([]);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedOrderIds(paginatedOrders.map(o => o.id));
        } else {
            setSelectedOrderIds([]);
        }
    };

    const handleSelectOne = (orderId: string) => {
        setSelectedOrderIds(prev =>
            prev.includes(orderId)
                ? prev.filter(id => id !== orderId)
                : [...prev, orderId]
        );
    };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {dynamicStats.map((item, index) => (
             <button key={index} onClick={item.onClick} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-md flex items-start justify-between text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg w-full">
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{item.title}</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{item.value}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{item.detail}</p>
                </div>
                <div className={`p-3 rounded-full bg-${item.color}-100 dark:bg-${item.color}-900/50 text-${item.color}-600 dark:text-${item.color}-400`}>
                    <StatCardIcon iconName={item.icon}/>
                </div>
            </button>
        ))}
      </div>
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-md">
            <div className="border-b border-slate-200 dark:border-slate-700">
                <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto" aria-label="Tabs">
                    <button onClick={() => setActiveTab('orders')} className={`${activeTab === 'orders' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                        Danh sách đơn hàng
                    </button>
                    <button onClick={() => setActiveTab('quotations')} className={`${activeTab === 'quotations' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                        Báo giá
                    </button>
                    <button onClick={() => setActiveTab('returns')} className={`${activeTab === 'returns' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                        Danh sách trả hàng
                    </button>
                </nav>
            </div>
        
            <div className="mt-6">
                {activeTab === 'orders' && (
                    <>
                        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                            {/* Left side: Search */}
                            <div className="w-full md:w-1/3 relative">
                                <input type="text" placeholder="Tìm kiếm đơn hàng..." className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                                 <svg className="w-5 h-5 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            </div>
                            {/* Right side: Filters & Actions */}
                            <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
                                <div className="flex items-center space-x-2 w-full md:w-auto">
                                    <input type="date" value={dateRange.start} onChange={e => handleDateChange('start', e.target.value)} className="w-full sm:w-auto px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"/>
                                    <span className="text-slate-500 dark:text-slate-400">-</span>
                                    <input type="date" value={dateRange.end} onChange={e => handleDateChange('end', e.target.value)} className="w-full sm:w-auto px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500"/>
                                </div>
                                
                                {/* Responsive Status Filter */}
                                <div className="w-full md:w-auto">
                                    {/* Desktop: Button Group */}
                                    <div className="hidden md:flex items-center flex-wrap gap-1 p-1 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                                        {(['All', ...Object.values(OrderStatus)]).map(status => (
                                            <button
                                                key={status}
                                                type="button"
                                                onClick={() => handleStatusChange(status as any)}
                                                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors duration-300 ${ activeStatus === status ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-slate-100 shadow' : 'text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-slate-100'}`}>
                                                {status === 'All' ? 'Tất cả' : status}
                                            </button>
                                        ))}
                                    </div>
                                    {/* Mobile: Dropdown */}
                                    <div ref={statusMenuRef} className="relative md:hidden">
                                        <button
                                            type="button"
                                            onClick={() => setStatusMenuOpen(!isStatusMenuOpen)}
                                            className="w-full flex items-center justify-between px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        >
                                            <span className="font-semibold">{activeStatus === 'All' ? 'Tất cả trạng thái' : activeStatus}</span>
                                            <svg className={`w-5 h-5 text-slate-400 transition-transform ${isStatusMenuOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                        </button>
                                        {isStatusMenuOpen && (
                                            <div className="absolute top-full mt-1 w-full bg-white dark:bg-slate-700 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 z-10">
                                                <ul>
                                                    {(['All', ...Object.values(OrderStatus)]).map(status => (
                                                        <li key={status}>
                                                            <a
                                                                href="#"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    handleStatusChange(status as any);
                                                                }}
                                                                className={`block w-full text-left px-4 py-2 text-sm ${activeStatus === status ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 font-semibold' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600'}`}
                                                            >
                                                                {status === 'All' ? 'Tất cả' : status}
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {hasPermission('CREATE_ORDER') && (
                                <button onClick={handleOpenCreate} className="w-full md:w-auto px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200 ease-in-out hover:shadow-lg active:scale-95 flex items-center justify-center space-x-2 flex-shrink-0">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                                    <span>Tạo đơn</span>
                                </button>
                                )}
                            </div>
                        </div>

                        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${selectedOrderIds.length > 0 ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                            {selectedOrderIds.length > 0 && (
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-primary-50 dark:bg-primary-900/30 p-3 rounded-lg mb-4 border border-primary-200 dark:border-primary-500/30 gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-primary-700 dark:text-primary-200">
                                            Đã chọn {selectedOrderIds.length} đơn hàng
                                        </span>
                                        <button onClick={() => setSelectedOrderIds([])} className="text-primary-600 dark:text-primary-300 hover:text-primary-800 p-1 rounded-full text-sm">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button onClick={() => handleBulkAction('processing')} disabled={!bulkActionsState.canMarkAsProcessing} className="px-3 py-1.5 border border-yellow-500 text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg text-sm hover:bg-yellow-200 dark:hover:bg-yellow-900/60 disabled:opacity-50 disabled:cursor-not-allowed">Chuyển Giao hàng</button>
                                        <button onClick={() => handleBulkAction('completed')} disabled={!bulkActionsState.canMarkAsCompleted} className="px-3 py-1.5 border border-blue-500 text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 rounded-lg text-sm hover:bg-blue-200 dark:hover:bg-blue-900/60 disabled:opacity-50 disabled:cursor-not-allowed">Hoàn thành</button>
                                        <button onClick={() => handleBulkAction('paid')} disabled={!bulkActionsState.canMarkAsPaid} className="px-3 py-1.5 border border-green-500 text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/40 rounded-lg text-sm hover:bg-green-200 dark:hover:bg-green-900/60 disabled:opacity-50 disabled:cursor-not-allowed">Đã thanh toán</button>
                                        <button onClick={() => handleBulkAction('cancelled')} disabled={!bulkActionsState.canCancel} className="px-3 py-1.5 border border-red-500 text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40 rounded-lg text-sm hover:bg-red-200 dark:hover:bg-red-900/60 disabled:opacity-50 disabled:cursor-not-allowed">Hủy đơn</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                          <table className="min-w-full bg-white dark:bg-slate-800">
                            <thead className="bg-slate-50 dark:bg-slate-700/50">
                              <tr>
                                {hasPermission('UPDATE_ORDER_STATUS') && <th className="py-3 px-4 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        className="rounded border-slate-300 dark:border-slate-500 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                                        checked={selectedOrderIds.length > 0 && selectedOrderIds.length === paginatedOrders.length && paginatedOrders.length > 0}
                                        ref={el => {
                                            if (el) {
                                                el.indeterminate = selectedOrderIds.length > 0 && selectedOrderIds.length < paginatedOrders.length;
                                            }
                                        }}
                                        onChange={handleSelectAll}
                                        disabled={paginatedOrders.length === 0}
                                    />
                                </th>}
                                <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"><SortableHeader label="Mã ĐH" sortKey="id" requestSort={requestSortOrders} sortConfig={sortConfigOrders}/></th>
                                <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"><SortableHeader label="Khách hàng" sortKey="customerName" requestSort={requestSortOrders} sortConfig={sortConfigOrders}/></th>
                                <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"><SortableHeader label="Ngày" sortKey="date" requestSort={requestSortOrders} sortConfig={sortConfigOrders}/></th>
                                <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"><SortableHeader label="Tổng tiền" sortKey="total" requestSort={requestSortOrders} sortConfig={sortConfigOrders}/></th>
                                <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"><SortableHeader label="Thanh toán" sortKey="paymentStatus" requestSort={requestSortOrders} sortConfig={sortConfigOrders}/></th>
                                <th className="py-3 px-6 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"><SortableHeader label="Trạng thái ĐH" sortKey="status" requestSort={requestSortOrders} sortConfig={sortConfigOrders}/></th>
                                <th className="py-3 px-6 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hành động</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                              {paginatedOrders.map((order) => (
                                <tr key={order.id} className={`transition-colors duration-200 ${selectedOrderIds.includes(order.id) ? 'bg-primary-100 dark:bg-primary-900/50' : 'hover:bg-primary-50 dark:hover:bg-slate-700/50'}`}>
                                  {hasPermission('UPDATE_ORDER_STATUS') && <td className="py-4 px-4 text-center">
                                     <input 
                                        type="checkbox"
                                        className="rounded border-slate-300 dark:border-slate-500 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                                        checked={selectedOrderIds.includes(order.id)}
                                        onChange={() => handleSelectOne(order.id)}
                                    />
                                  </td>}
                                  <td className="py-4 px-6 whitespace-nowrap text-sm font-medium">
                                      <button onClick={() => handleOpenInvoice(order)} className="text-primary-600 dark:text-primary-400 hover:underline">
                                        {order.id}
                                      </button>
                                  </td>
                                  <td className="py-4 px-6 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                                    <button onClick={() => onNavigate('CRM', { customerId: order.customerId })} className="hover:text-primary-600 dark:hover:text-primary-400 hover:underline">
                                        {order.customerName}
                                    </button>
                                  </td>
                                  <td className="py-4 px-6 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{order.date}</td>
                                  <td className="py-4 px-6 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300 font-semibold">{order.total.toLocaleString('vi-VN')}đ</td>
                                  <td className="py-4 px-6 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                    <div>{order.paymentMethod}</div>
                                    <div className={`mt-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusClass(order.paymentStatus)}`}>
                                      {order.paymentStatus}
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 whitespace-nowrap text-center">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.status)}`}>
                                      {order.status}
                                    </span>
                                  </td>
                                  <td className="py-4 px-6 whitespace-nowrap text-sm font-medium text-center relative">
                                    <button onClick={(e) => handleToggleMenu(e, order)} className="text-slate-500 dark:text-slate-400 hover:text-primary-600 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                                    </button>
                                    {openActionMenu.id === order.id && (
                                        <div ref={actionMenuRef} className={`absolute right-0 w-48 bg-white dark:bg-slate-700 rounded-md shadow-lg z-20 border border-slate-200 dark:border-slate-600 ${openActionMenu.openUp ? 'bottom-full mb-1' : 'top-full mt-2'}`}>
                                            <a href="#" onClick={(e) => { e.preventDefault(); handleOpenInvoice(order); }} className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600">Xem & In hóa đơn</a>
                                             {hasPermission('PROCESS_ORDER_PAYMENT') && order.paymentStatus !== PaymentStatus.Paid && (
                                                <a href="#" onClick={(e) => { e.preventDefault(); handleOpenPaymentModal(order); }} className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600">Ghi nhận Thanh toán</a>
                                            )}
                                            {(hasPermission('UPDATE_ORDER_STATUS') || hasPermission('EDIT_ORDER') || hasPermission('CANCEL_ORDER')) && <hr className="my-1 border-slate-100 dark:border-slate-600"/>}

                                            {hasPermission('UPDATE_ORDER_STATUS') && order.status === OrderStatus.Pending && (
                                                <a href="#" onClick={(e) => { e.preventDefault(); onUpdateOrderStatus(order.id, OrderStatus.Processing); setOpenActionMenu({id: null, openUp: false});}} className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600">Xác nhận & Giao hàng</a>
                                            )}
                                            {hasPermission('EDIT_ORDER') && order.status === OrderStatus.Pending && (
                                                 <a href="#" onClick={(e) => { e.preventDefault(); handleOpenEdit(order); }} className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600">Chỉnh sửa</a>
                                            )}
                                             {hasPermission('UPDATE_ORDER_STATUS') && order.status === OrderStatus.Processing && (
                                                <a href="#" onClick={(e) => { e.preventDefault(); onUpdateOrderStatus(order.id, OrderStatus.Completed); setOpenActionMenu({id: null, openUp: false});}} className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600">Giao hàng thành công</a>
                                            )}
                                             {hasPermission('CANCEL_ORDER') && (order.status === OrderStatus.Pending || order.status === OrderStatus.Processing) && (
                                                <a href="#" onClick={(e) => { e.preventDefault(); onUpdateOrderStatus(order.id, OrderStatus.Cancelled); setOpenActionMenu({id: null, openUp: false});}} className="block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50">Hủy đơn hàng</a>
                                            )}
                                            {hasPermission('CREATE_RETURN') && order.status === OrderStatus.Completed && (
                                                <>
                                                    <hr className="my-1 border-slate-100 dark:border-slate-600"/>
                                                    <a href="#" onClick={(e) => { e.preventDefault(); handleOpenReturnModal(order); }} className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600">Tạo phiếu trả hàng</a>
                                                </>
                                            )}
                                        </div>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {sortedOrders.length === 0 && (
                             <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                                Không tìm thấy đơn hàng nào.
                             </div>
                          )}
                        </div>
                        <Pagination 
                            totalItems={sortedOrders.length}
                            itemsPerPage={itemsPerPage}
                            currentPage={currentPage}
                            onPageChange={setCurrentPage}
                        />
                    </>
                )}
                 {activeTab === 'quotations' && (
                     <>
                        <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                            <div className="w-full md:w-2/3 relative">
                                <input type="text" placeholder="Tìm kiếm báo giá..." className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                                 <svg className="w-5 h-5 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            </div>
                            {hasPermission('CREATE_QUOTATION') && (
                            <button onClick={handleOpenCreateQuotation} className="w-full md:w-auto px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200 ease-in-out hover:shadow-lg active:scale-95 flex items-center justify-center space-x-2 flex-shrink-0">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                <span>Tạo báo giá mới</span>
                            </button>
                            )}
                        </div>
                         <div className="overflow-x-auto">
                           <table className="min-w-full bg-white dark:bg-slate-800">
                            <thead className="bg-slate-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase"><SortableHeader label="Mã BG" sortKey="id" requestSort={requestSortQuotations} sortConfig={sortConfigQuotations}/></th>
                                    <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase"><SortableHeader label="Khách hàng" sortKey="customerName" requestSort={requestSortQuotations} sortConfig={sortConfigQuotations}/></th>
                                    <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase"><SortableHeader label="Ngày tạo" sortKey="date" requestSort={requestSortQuotations} sortConfig={sortConfigQuotations}/></th>
                                    <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase"><SortableHeader label="Ngày hết hạn" sortKey="expiryDate" requestSort={requestSortQuotations} sortConfig={sortConfigQuotations}/></th>
                                    <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase"><SortableHeader label="Tổng tiền" sortKey="total" requestSort={requestSortQuotations} sortConfig={sortConfigQuotations}/></th>
                                    <th className="py-3 px-6 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase"><SortableHeader label="Trạng thái" sortKey="status" requestSort={requestSortQuotations} sortConfig={sortConfigQuotations}/></th>
                                    <th className="py-3 px-6 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Hành động</th>
                                </tr>
                            </thead>
                             <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {sortedQuotations.map((q) => (
                                    <tr key={q.id} className="hover:bg-primary-50 dark:hover:bg-slate-700/50 transition-colors duration-200">
                                        <td className="py-4 px-6 text-sm font-medium text-primary-600 dark:text-primary-400">{q.id}</td>
                                        <td className="py-4 px-6 text-sm">{q.customerName}</td>
                                        <td className="py-4 px-6 text-sm">{q.date}</td>
                                        <td className="py-4 px-6 text-sm">{q.expiryDate}</td>
                                        <td className="py-4 px-6 text-sm font-semibold">{q.total.toLocaleString('vi-VN')}đ</td>
                                        <td className="py-4 px-6 text-center">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(q.status)}`}>
                                                {q.status}
                                                {q.status === QuotationStatus.Converted && q.createdOrderId && ` (${q.createdOrderId})`}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-center relative">
                                             <button onClick={(e) => handleToggleMenu(e, q)} className="text-slate-500 dark:text-slate-400 hover:text-primary-600 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                                            </button>
                                            {openActionMenu.id === q.id && (
                                                <div ref={actionMenuRef} className={`absolute right-0 w-48 bg-white dark:bg-slate-700 rounded-md shadow-lg z-20 border border-slate-200 dark:border-slate-600 ${openActionMenu.openUp ? 'bottom-full mb-1' : 'top-full mt-2'}`}>
                                                    <a href="#" onClick={(e)=>{e.preventDefault(); handleOpenPrintQuotation(q)}} className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600">Xem & In báo giá</a>
                                                    {(hasPermission('UPDATE_QUOTATION_STATUS') || hasPermission('EDIT_QUOTATION') || hasPermission('DELETE_QUOTATION')) && <hr className="my-1 border-slate-100 dark:border-slate-600"/>}
                                                    {hasPermission('UPDATE_QUOTATION_STATUS') && q.status === QuotationStatus.Draft && (
                                                        <a href="#" onClick={(e) => { e.preventDefault(); onHandleUpdateQuotationStatus(q.id, QuotationStatus.Sent); setOpenActionMenu({id:null, openUp:false});}} className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600">Gửi báo giá</a>
                                                    )}
                                                    {hasPermission('EDIT_QUOTATION') && q.status === QuotationStatus.Draft && (
                                                        <a href="#" onClick={(e) => { e.preventDefault(); handleOpenEditQuotation(q);}} className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600">Chỉnh sửa</a>
                                                    )}
                                                     {hasPermission('DELETE_QUOTATION') && q.status === QuotationStatus.Draft && (
                                                        <a href="#" onClick={(e) => { e.preventDefault(); onHandleDeleteQuotation(q.id); setOpenActionMenu({id:null, openUp:false});}} className="block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50">Xóa báo giá</a>
                                                    )}
                                                    {hasPermission('UPDATE_QUOTATION_STATUS') && q.status === QuotationStatus.Sent && (
                                                        <>
                                                            <a href="#" onClick={(e) => { e.preventDefault(); onHandleUpdateQuotationStatus(q.id, QuotationStatus.Accepted); setOpenActionMenu({id:null, openUp:false});}} className="block px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/50">Khách chấp nhận</a>
                                                            <a href="#" onClick={(e) => { e.preventDefault(); onHandleUpdateQuotationStatus(q.id, QuotationStatus.Rejected); setOpenActionMenu({id:null, openUp:false});}} className="block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50">Khách từ chối</a>
                                                        </>
                                                    )}
                                                     {hasPermission('CREATE_ORDER') && q.status === QuotationStatus.Accepted && (
                                                        <a href="#" onClick={(e) => { e.preventDefault(); onHandleConvertQuotationToOrder(q.id); setOpenActionMenu({id:null, openUp:false});}} className="block px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50">Tạo đơn hàng</a>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                             </tbody>
                           </table>
                           {sortedQuotations.length === 0 && <div className="text-center py-10 text-slate-500 dark:text-slate-400">Không có báo giá nào.</div>}
                        </div>
                     </>
                 )}
                 {activeTab === 'returns' && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white dark:bg-slate-800">
                            <thead className="bg-slate-50 dark:bg-slate-700/50">
                                <tr>
                                    <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Mã phiếu trả</th>
                                    <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Đơn hàng gốc</th>
                                    <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Khách hàng</th>
                                    <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Ngày trả</th>
                                    <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Tổng tiền hoàn</th>
                                    <th className="py-3 px-6 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Trạng thái</th>
                                    <th className="py-3 px-6 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {sortedReturns.map(sr => (
                                    <tr key={sr.id} className="hover:bg-primary-50 dark:hover:bg-slate-700/50 transition-colors duration-200">
                                        <td className="py-4 px-6 text-sm font-medium text-primary-600 dark:text-primary-400">{sr.id}</td>
                                        <td className="py-4 px-6 text-sm text-slate-500 dark:text-slate-400">{sr.originalOrderId}</td>
                                        <td className="py-4 px-6 text-sm text-slate-900 dark:text-slate-100">{sr.customerName}</td>
                                        <td className="py-4 px-6 text-sm text-slate-500 dark:text-slate-400">{sr.date}</td>
                                        <td className="py-4 px-6 text-sm font-semibold">{sr.totalRefund.toLocaleString('vi-VN')}đ</td>
                                        <td className="py-4 px-6 text-center">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(sr.status)}`}>
                                                {sr.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <button onClick={() => onPrintSalesReturn(sr)} className="text-blue-600 hover:underline text-sm font-medium transition-transform active:scale-95">In Phiếu</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {sortedReturns.length === 0 && (
                            <div className="text-center py-10 text-slate-500 dark:text-slate-400">Không có phiếu trả hàng nào.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
        
        <AddEditOrderModal
            isOpen={isCreateModalOpen || isEditModalOpen}
            onClose={() => {
                setCreateModalOpen(false);
                setEditModalOpen(false);
                setEditingOrder(null);
            }}
            onSave={handleSaveAndCloseModal}
            orderToEdit={editingOrder}
            customers={customers}
            products={products}
            inventoryStock={inventoryStock}
            onAddNewCustomer={() => hasPermission('CREATE_CUSTOMER') && setAddCustomerModalOpen(true)}
            onSaveAndComplete={onHandleCreateAndCompleteOrder}
            companySettings={companySettings}
            taxRates={taxRates}
        />
        
        <InvoiceModal isOpen={isInvoiceModalOpen} onClose={() => setInvoiceModalOpen(false)} order={selectedOrder} customers={customers} companySettings={companySettings} onNavigate={onNavigate} />
        {hasPermission('CREATE_CUSTOMER') && <AddEditCustomerModal isOpen={isAddCustomerModalOpen} onClose={() => setAddCustomerModalOpen(false)} onSave={handleSaveCustomer} />}
        
        <QuotationModal 
            isOpen={isQuotationModalOpen}
            onClose={() => setQuotationModalOpen(false)}
            onSaveQuotation={editingQuotation ? onHandleUpdateQuotation : onHandleCreateQuotation}
            customers={customers}
            products={products}
            quotationToEdit={editingQuotation}
            companySettings={companySettings}
            taxRates={taxRates}
        />
        <QuotationModal 
            isOpen={isPrintQuotationModalOpen}
            onClose={() => setPrintQuotationModalOpen(false)}
            customers={customers}
            products={products}
            quotationToEdit={quotationToPrint}
            isPrintMode={true}
            companySettings={companySettings}
            taxRates={taxRates}
        />
        <ReturnModal
            isOpen={isReturnModalOpen}
            onClose={() => setReturnModalOpen(false)}
            order={orderToReturn}
            onSaveReturn={onHandleReturn}
            salesReturns={salesReturns}
        />
        <RecordPaymentModal
            isOpen={isPaymentModalOpen}
            onClose={() => setPaymentModalOpen(false)}
            onSave={handleSavePayment}
            totalDue={orderForPayment ? orderForPayment.total - orderForPayment.amountPaid : 0}
            partyName={orderForPayment?.customerName || ''}
        />

    </>
  );
};

export default React.memo(SalesView);