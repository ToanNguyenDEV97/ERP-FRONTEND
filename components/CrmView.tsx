import React, { useState, useEffect, useMemo } from 'react';
import Header from './Header';
import { Customer, Order, OrderStatus, PaymentStatus, User, NavView, PaymentMethod, Permission } from '../types';
import { useConfirm } from '../contexts/ConfirmContext';
import { useToast } from '../contexts/ToastContext';
import EmptyState from './EmptyState';
import AddEditCustomerModal from './AddEditCustomerModal';
import { useSortableData, SortConfig } from '../hooks/useSortableData';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter';

interface CrmViewProps {
    customers: Customer[];
    orders: Order[];
    initialCustomerId: string | null;
    onClearInitialCustomer: () => void;
    onUpdateOrderPaymentStatus: (orderId: string, amountToPay: number, options?: { paymentMethod?: PaymentMethod; isBulk?: boolean; }) => Promise<{ success: boolean; message?: string; }>;
    currentUser: User;
    onNavigate: (view: NavView, params?: any) => void;
    hasPermission: (permission: Permission) => boolean;
    onSaveCustomer: (customer: Omit<Customer, 'id' | 'since'> | Customer) => Promise<any>;
    onDeleteCustomer: (customerId: string) => Promise<any>;
    loadData: () => Promise<void>;
}

interface EnrichedCustomer extends Customer {
    totalSpent: number;
    debt: number;
    orderCount: number;
}


const getStatusClass = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.Completed: return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
    case OrderStatus.Processing: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
    case OrderStatus.Pending: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
    case OrderStatus.Cancelled: return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
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

const SortableHeader = <T,>({
  label,
  sortKey,
  requestSort,
  sortConfig,
  className = ''
}: {
  label: string;
  sortKey: keyof T;
  requestSort: (key: keyof T) => void;
  sortConfig: SortConfig<T> | null;
  className?: string;
}) => {
  const isSorted = sortConfig?.key === sortKey;
  const direction = isSorted ? sortConfig.direction : undefined;
  return (
    <button
      type="button"
      onClick={() => requestSort(sortKey)}
      className={`flex items-center gap-1 group ${className}`}
    >
      {label}
      <span className="opacity-0 group-hover:opacity-100 transition-opacity">
        {direction === 'ascending' ? '▲' : direction === 'descending' ? '▼' : '↕'}
      </span>
      {isSorted && <span className="opacity-100">{direction === 'ascending' ? '▲' : '▼'}</span>}
    </button>
  );
};


const CustomerDetailView: React.FC<{ customer: Customer, orders: Order[], onBack: () => void, onNavigate: (view: NavView, params?: any) => void; }> = ({ customer, orders, onBack, onNavigate }) => {
    const customerOrders = useMemo(() => {
        return orders
            .filter(order => order.customerId === customer.id)
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [customer.id, orders]);

    const customerStats = useMemo(() => {
        const totalSpent = customerOrders
            .filter(o => o.status === OrderStatus.Completed)
            .reduce((sum, order) => sum + order.amountPaid, 0);
        return {
            totalSpent,
            totalOrders: customerOrders.length,
            lastOrderDate: customerOrders.length > 0 ? customerOrders[0].date : 'N/A',
        };
    }, [customerOrders]);

    return (
        <div>
            <Header title={customer.name} onBack={onBack} />
             <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md mb-8">
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Thông tin chi tiết</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-800 dark:text-slate-200">
                    <div><strong>Email:</strong> {customer.email}</div>
                    <div><strong>Điện thoại:</strong> {customer.phone}</div>
                    <div><strong>Phân loại:</strong> <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${customer.type === 'B2B' ? 'bg-indigo-100 text-indigo-800' : 'bg-pink-100 text-pink-800'}`}>{customer.type}</span></div>
                    <div><strong>Thành viên từ:</strong> {customer.since}</div>
                    <div className="md:col-span-2"><strong>Địa chỉ:</strong> {customer.address}</div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-md"><p className="text-sm text-slate-500 dark:text-slate-400">Tổng chi tiêu</p><p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{customerStats.totalSpent.toLocaleString('vi-VN')}đ</p></div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-md"><p className="text-sm text-slate-500 dark:text-slate-400">Tổng số đơn hàng</p><p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{customerStats.totalOrders}</p></div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-md"><p className="text-sm text-slate-500 dark:text-slate-400">Đơn hàng cuối</p><p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{customerStats.lastOrderDate}</p></div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Lịch sử đơn hàng</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white dark:bg-slate-800">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Mã ĐH</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Ngày</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Tổng tiền</th>
                                <th className="py-3 px-4 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Trạng thái ĐH</th>
                                <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Thanh toán</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {customerOrders.map(order => (
                                <tr key={order.id} className="hover:bg-primary-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="py-4 px-4 text-sm font-medium text-primary-600 dark:text-primary-400">
                                        <button onClick={() => onNavigate('SALES', { orderId: order.id })} className="hover:underline">
                                            {order.id}
                                        </button>
                                    </td>
                                    <td className="py-4 px-4 text-sm text-slate-500 dark:text-slate-400">{order.date}</td>
                                    <td className="py-4 px-4 text-sm font-semibold text-slate-800 dark:text-slate-200">{order.total.toLocaleString('vi-VN')}đ</td>
                                    <td className="py-4 px-4 text-center">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(order.status)}`}>{order.status}</span>
                                    </td>
                                     <td className="py-4 px-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                        <div>{order.paymentMethod}</div>
                                        <div className={`mt-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusClass(order.paymentStatus)}`}>
                                        {order.paymentStatus}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {customerOrders.length === 0 && (
                        <EmptyState 
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                            title="Chưa có đơn hàng"
                            message="Khách hàng này chưa có đơn hàng nào được ghi nhận trong hệ thống."
                        />
                     )}
                </div>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; onClick?: () => void; }> = ({ title, value, icon, onClick }) => (
    <div onClick={onClick} className={`bg-white dark:bg-slate-800 p-5 rounded-xl shadow-md flex items-start justify-between text-left transition-all duration-300 hover:-translate-y-1 ${onClick ? 'cursor-pointer hover:shadow-lg' : ''}`}>
        <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{value}</p>
        </div>
        <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-700">
            {icon}
        </div>
    </div>
);

const CrmView: React.FC<CrmViewProps> = ({ customers, orders, initialCustomerId, onClearInitialCustomer, onUpdateOrderPaymentStatus, currentUser, onNavigate, hasPermission, onSaveCustomer, onDeleteCustomer, loadData }) => {
    const [view, setView] = useState<'list' | 'detail'>('list');
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'All' | 'B2C' | 'B2B'>('All');
    const [filterDebt, setFilterDebt] = useState(false);

    const confirm = useConfirm();
    
    useEffect(() => {
        loadData();
    }, [loadData]);
    
    useEffect(() => {
        if(initialCustomerId) {
            setSelectedCustomerId(initialCustomerId);
            setView('detail');
            onClearInitialCustomer();
        }
    }, [initialCustomerId, onClearInitialCustomer]);

     const enrichedCustomers: EnrichedCustomer[] = useMemo(() => {
        return customers.map(customer => {
            const customerOrders = orders.filter(o => o.customerId === customer.id);
            const completedOrders = customerOrders.filter(o => o.status === OrderStatus.Completed);
            
            const totalSpent = completedOrders.reduce((sum, order) => sum + order.total, 0);
            const debt = completedOrders.reduce((sum, order) => sum + (order.total - order.amountPaid), 0);
            
            return {
                ...customer,
                totalSpent,
                debt,
                orderCount: customerOrders.length
            };
        });
    }, [customers, orders]);

    const filteredCustomers = useMemo(() => {
        return enrichedCustomers
            .filter(c => filterType === 'All' || c.type === filterType)
            .filter(c => !filterDebt || c.debt > 0)
            .filter(c => 
                c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.phone.toLowerCase().includes(searchTerm.toLowerCase())
            );
    }, [enrichedCustomers, searchTerm, filterType, filterDebt]);

    const { items: sortedCustomers, requestSort, sortConfig } = useSortableData(filteredCustomers, { key: 'name', direction: 'ascending'});
    
    const stats = useMemo(() => {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const newThisMonth = customers.filter(c => c.since >= firstDayOfMonth).length;
        const b2bCount = customers.filter(c => c.type === 'B2B').length;
        const withDebt = enrichedCustomers.filter(c => c.debt > 0).length;

        return {
            total: customers.length,
            newThisMonth,
            b2b: b2bCount,
            b2c: customers.length - b2bCount,
            withDebt,
        }
    }, [customers, enrichedCustomers]);
    
    const animatedTotal = useAnimatedCounter(stats.total);
    const animatedNew = useAnimatedCounter(stats.newThisMonth);
    const animatedDebt = useAnimatedCounter(stats.withDebt);

    const handleSelectCustomer = (customerId: string) => {
        setSelectedCustomerId(customerId);
        setView('detail');
    };

    const handleBackToList = () => {
        setSelectedCustomerId(null);
        setView('list');
    };

    const handleOpenAddModal = () => {
        setCustomerToEdit(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (customer: Customer) => {
        setCustomerToEdit(customer);
        setIsModalOpen(true);
    };

    const handleDeleteCustomer = async (customerId: string) => {
        const isConfirmed = await confirm({
            title: 'Xác nhận xóa khách hàng',
            message: 'Bạn có chắc chắn muốn xóa khách hàng này? Mọi dữ liệu liên quan có thể bị ảnh hưởng.',
            variant: 'danger',
            confirmText: 'Xóa khách hàng'
        });

        if (isConfirmed) {
            await onDeleteCustomer(customerId);
        }
    };
    
    const handleSaveCustomer = async (customerData: Omit<Customer, 'id' | 'since'> | Customer) => {
        const result = await onSaveCustomer(customerData);
        if (result.success) {
            setIsModalOpen(false);
        }
    };
    
    const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

    if (view === 'detail' && selectedCustomer) {
        return <CustomerDetailView customer={selectedCustomer} orders={orders} onBack={handleBackToList} onNavigate={onNavigate} />;
    }

  return (
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Tổng số khách hàng" value={String(animatedTotal)} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 016-6h6a6 6 0 016 6v1h-1.5M15 21h-3M15 21h3m-6-15a4 4 0 11-8 0 4 4 0 018 0z"/></svg>} />
            <StatCard title="Khách hàng mới (Tháng này)" value={String(animatedNew)} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>} />
            <StatCard title="Phân loại" value={`${stats.b2b} B2B / ${stats.b2c} B2C`} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>} />
            <StatCard title="Khách hàng có công nợ" value={String(animatedDebt)} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>} onClick={() => setFilterDebt(prev => !prev)} />
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <div className="w-full md:w-1/3 relative">
                    <input type="text" placeholder="Tìm kiếm khách hàng..." className="w-full pl-10 pr-4 py-2 border dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    <svg className="w-5 h-5 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                 <div className="flex items-center gap-2 w-full md:w-auto">
                    <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="px-3 py-2 border dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700">
                        <option value="All">Tất cả phân loại</option>
                        <option value="B2C">Cá nhân (B2C)</option>
                        <option value="B2B">Doanh nghiệp (B2B)</option>
                    </select>
                    {hasPermission('CREATE_CUSTOMER') && (
                        <button onClick={handleOpenAddModal} className="w-full md:w-auto px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center justify-center space-x-2">
                            <span>Thêm khách hàng</span>
                        </button>
                    )}
                </div>
            </div>
            {customers.length > 0 ? (
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-slate-800">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                    <tr>
                        <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"><SortableHeader label="Tên khách hàng" sortKey="name" requestSort={requestSort} sortConfig={sortConfig}/></th>
                        <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Điện thoại</th>
                        <th className="py-3 px-6 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"><SortableHeader label="Tổng chi tiêu" sortKey="totalSpent" requestSort={requestSort} sortConfig={sortConfig}/></th>
                        <th className="py-3 px-6 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"><SortableHeader label="Công nợ" sortKey="debt" requestSort={requestSort} sortConfig={sortConfig}/></th>
                        <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"><SortableHeader label="Ngày tham gia" sortKey="since" requestSort={requestSort} sortConfig={sortConfig}/></th>
                        <th className="py-3 px-6 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Hành động</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {sortedCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-primary-50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="py-4 px-6 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                            <button onClick={() => handleSelectCustomer(customer.id)} className="hover:text-primary-600 dark:hover:text-primary-400 hover:underline">
                                {customer.name}
                            </button>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{customer.phone}</td>
                        <td className="py-4 px-6 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 text-right">{customer.totalSpent.toLocaleString('vi-VN')}đ</td>
                        <td className={`py-4 px-6 whitespace-nowrap text-sm text-right font-semibold ${customer.debt > 0 ? 'text-red-600' : 'text-slate-500 dark:text-slate-400'}`}>{customer.debt > 0 ? customer.debt.toLocaleString('vi-VN') + 'đ' : '-'}</td>
                        <td className="py-4 px-6 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{customer.since}</td>
                        <td className="py-4 px-6 whitespace-nowrap text-sm text-center space-x-2">
                        {hasPermission('EDIT_CUSTOMER') && <button onClick={() => handleOpenEditModal(customer)} className="text-blue-600 hover:text-blue-900 font-medium transition-transform active:scale-95">Sửa</button>}
                        {hasPermission('DELETE_CUSTOMER') && <button onClick={() => handleDeleteCustomer(customer.id)} className="text-red-600 hover:text-red-900 font-medium transition-transform active:scale-95">Xóa</button>}
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            ) : (
            <EmptyState
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                title="Chưa có khách hàng"
                message="Bắt đầu quản lý khách hàng của bạn bằng cách thêm khách hàng đầu tiên."
                action={hasPermission('CREATE_CUSTOMER') ? { text: 'Thêm khách hàng', onClick: handleOpenAddModal } : undefined}
            />
            )}
        </div>
      </div>
      {hasPermission('CREATE_CUSTOMER') && (
      <AddEditCustomerModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCustomer}
        customerToEdit={customerToEdit}
      />
      )}
    </>
  );
};

export default React.memo(CrmView);