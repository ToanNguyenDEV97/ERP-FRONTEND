import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Order, OrderStatus, Product, InventoryItem, NavView, User, Customer, PurchaseOrder, Quotation, JournalEntry, Supplier, PurchaseOrderStatus, PaymentStatus } from '../types';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter';

// Props updated to include suppliers and journal entries for comprehensive calculations
interface DashboardViewProps {
    orders: Order[];
    products: Product[];
    inventoryStock: InventoryItem[];
    customers: Customer[];
    purchaseOrders: PurchaseOrder[];
    quotations: Quotation[];
    journalEntries: JournalEntry[];
    suppliers: Supplier[];
    theme: 'light' | 'dark' | 'system';
    onNavigate: (view: NavView, params?: any) => void;
    currentUser: User;
    loadData: () => Promise<void>;
}

const timeSince = (date: string): string => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 0) return "tương lai";
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " năm trước";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " tháng trước";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " ngày trước";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " giờ trước";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " phút trước";
    return "vài giây trước";
};

// --- Custom Reusable Components ---
const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; onNavigate?: () => void; }> = ({ title, value, icon, onNavigate }) => (
    <div onClick={onNavigate} className={`bg-white dark:bg-slate-800 p-5 rounded-xl shadow-md flex items-start justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${onNavigate ? 'cursor-pointer' : ''}`}>
        <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{value}</p>
        </div>
        <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-700">
            {icon}
        </div>
    </div>
);

const CustomTooltip = ({ active, payload, label, formatter, isDark }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className={`p-3 rounded-lg shadow-lg text-sm border ${isDark ? 'bg-slate-800 text-slate-200 border-slate-600' : 'bg-white text-slate-700 border-slate-200'}`}>
                <p className="font-semibold">{label}</p>
                {payload.map((pld: any, index: number) => (
                    <p key={index} style={{ color: pld.color }}>
                        {`${pld.name}: ${formatter(pld.value)}`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const Icon = ({ path, className = "w-6 h-6" }: { path: string, className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d={path} /></svg>
);

const currencyFormatter = (value: number) => `${value.toLocaleString('vi-VN')}đ`;

// --- Main Dashboard Component ---
const DashboardView: React.FC<DashboardViewProps> = (props) => {
  const { orders, products, inventoryStock, customers, purchaseOrders, journalEntries, theme, currentUser, onNavigate, loadData } = props;
  const [activePeriod, setActivePeriod] = useState('Tháng này');
  
  useEffect(() => {
    loadData();
  }, [loadData]);

  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const chartColors = useMemo(() => ({
    axis: isDark ? '#94a3b8' : '#64748b',
    grid: isDark ? '#334155' : '#e2e8f0',
  }), [isDark]);

  const productMap = useMemo(() => products.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
  }, {} as Record<string, Product>), [products]);

  const { filteredOrders, filteredPurchaseOrders } = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (activePeriod) {
        case 'Tuần này':
            startDate = new Date(now.setDate(now.getDate() - (now.getDay() || 7) + 1));
            break;
        case 'Năm nay':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        case 'Tháng này':
        default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
    }
    startDate.setHours(0, 0, 0, 0);

    return {
        filteredOrders: orders.filter(o => new Date(o.date) >= startDate),
        filteredPurchaseOrders: purchaseOrders.filter(po => new Date(po.orderDate) >= startDate),
    };
  }, [orders, purchaseOrders, activePeriod]);
  
  const analyticsData = useMemo(() => {
    const completedOrders = filteredOrders.filter(o => o.status === OrderStatus.Completed);
    
    // KPIs
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);
    let grossProfit = 0;
    completedOrders.forEach(o => {
        o.items.forEach(item => {
            const product = productMap[item.productId];
            if (product) grossProfit += (item.price - product.cost) * item.quantity;
        });
    });
    
    const receivables = orders.filter(o => o.status === OrderStatus.Completed && o.paymentStatus !== PaymentStatus.Paid).reduce((sum, o) => sum + (o.total - o.amountPaid), 0);
    const payables = purchaseOrders.filter(po => po.status === PurchaseOrderStatus.Received && po.paymentStatus !== PaymentStatus.Paid).reduce((sum, po) => sum + (po.total - po.amountPaid), 0);
    
    // Lists & Feeds
    const revenueByDay = completedOrders.reduce((acc, order) => {
        const day = order.date;
        acc[day] = (acc[day] || 0) + order.total;
        return acc;
    }, {} as Record<string, number>);
    const revenueTrendData = Object.keys(revenueByDay).sort().map(date => ({ date, DoanhThu: revenueByDay[date] }));

    const totalStockByProduct = inventoryStock.reduce((acc, item) => {
        acc[item.productId] = (acc[item.productId] || 0) + item.stock;
        return acc;
    }, {} as Record<string, number>);
    const lowStockItems = products.filter(p => (totalStockByProduct[p.id] || 0) < p.minStock)
                                .map(p => ({...p, stock: totalStockByProduct[p.id] || 0 }))
                                .slice(0, 5);

    const pendingOrders = orders.filter(o => o.status === OrderStatus.Pending || o.status === OrderStatus.Processing)
                                .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                .slice(0,5);

    const topProfitableProducts = Object.values(completedOrders.reduce((acc, order) => {
        order.items.forEach(item => {
            const product = productMap[item.productId];
            if (product) {
                if (!acc[product.id]) acc[product.id] = { id: product.id, name: product.name, profit: 0 };
                acc[product.id].profit += (item.price - product.cost) * item.quantity;
            }
        });
        return acc;
    }, {} as Record<string, { id: string, name: string, profit: number }>)).sort((a,b) => b.profit - a.profit).slice(0, 5);
    
    const activities = [
        ...orders.map(o => ({ type: 'order' as const, data: o, timestamp: o.date })),
        ...purchaseOrders.map(po => ({ type: 'po' as const, data: po, timestamp: po.orderDate })),
        ...customers.map(c => ({ type: 'customer' as const, data: c, timestamp: c.since }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);


    return { totalRevenue, grossProfit, receivables, payables, revenueTrendData, lowStockItems, pendingOrders, topProfitableProducts, activities };
  }, [filteredOrders, filteredPurchaseOrders, productMap, inventoryStock, orders, purchaseOrders, customers, products]);

  const animatedRevenue = useAnimatedCounter(analyticsData.totalRevenue);
  const animatedProfit = useAnimatedCounter(analyticsData.grossProfit);
  const animatedReceivables = useAnimatedCounter(analyticsData.receivables);
  const animatedPayables = useAnimatedCounter(analyticsData.payables);

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Chào mừng trở lại, {currentUser.name}!</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Đây là tổng quan nhanh về hoạt động kinh doanh của bạn.</p>
            </div>
             <div className="flex items-center flex-wrap justify-end gap-2 p-1 bg-slate-200/60 dark:bg-slate-800 rounded-lg md:rounded-full">
                {['Tuần này', 'Tháng này', 'Năm nay'].map(period => (
                    <button key={period} onClick={() => setActivePeriod(period)}
                        className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors duration-300 focus:outline-none ${ activePeriod === period ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-slate-100 shadow-md' : 'bg-transparent text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-slate-100' }`}>
                        {period}
                    </button>
                ))}
            </div>
        </div>

        {/* Main KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title={`Doanh thu (${activePeriod})`} value={currencyFormatter(animatedRevenue)} icon={<Icon path="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" className="w-6 h-6 text-green-500"/>} />
            <StatCard title={`Lợi nhuận gộp (${activePeriod})`} value={currencyFormatter(animatedProfit)} icon={<Icon path="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" className="w-6 h-6 text-blue-500"/>} />
            <StatCard title="Phải thu khách hàng" value={currencyFormatter(animatedReceivables)} icon={<Icon path="M15 9h-3m-3 0h3m0 0v3m0-3V6m3 3v3m-3-3h-3m-3 6h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" className="w-6 h-6 text-yellow-500"/>} onNavigate={() => onNavigate('ACCOUNTING', {tab: 'debt'})} />
            <StatCard title="Phải trả NCC" value={currencyFormatter(animatedPayables)} icon={<Icon path="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15A2.25 2.25 0 0 0 2.25 6.75v10.5A2.25 2.25 0 0 0 4.5 19.5Z" className="w-6 h-6 text-red-500"/>} onNavigate={() => onNavigate('ACCOUNTING', {tab: 'debt'})}/>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Xu hướng Doanh thu</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.revenueTrendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid}/>
                        <XAxis dataKey="date" stroke={chartColors.axis} />
                        <YAxis stroke={chartColors.axis} tickFormatter={(value) => `${(value as number / 1000000)}M`}/>
                        <Tooltip content={<CustomTooltip formatter={currencyFormatter} isDark={isDark} />} />
                        <Bar dataKey="DoanhThu" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Hoạt động gần đây</h3>
                <ul className="space-y-4">
                    {analyticsData.activities.map(activity => {
                        let text: string;
                        let navParams: { view: NavView, params?: any };
                        switch (activity.type) {
                            case 'order':
                                text = `Đơn hàng mới #${activity.data.id} của ${activity.data.customerName}`;
                                navParams = { view: 'SALES', params: { orderId: activity.data.id } };
                                break;
                            case 'po':
                                text = `Đơn mua hàng #${activity.data.id} tới ${activity.data.supplierName}`;
                                navParams = { view: 'PURCHASING', params: { poId: activity.data.id } };
                                break;
                            case 'customer':
                                text = `Khách hàng mới: ${activity.data.name}`;
                                navParams = { view: 'CRM', params: { customerId: activity.data.id } };
                                break;
                            default:
                                return null;
                        }

                        return (
                            <li key={`${activity.type}-${activity.data.id}`} className="flex items-start gap-3">
                                <div className="mt-1 flex-shrink-0 w-3 h-3 bg-primary-500 rounded-full"></div>
                                <div>
                                    <button onClick={() => onNavigate(navParams.view, navParams.params)} className="text-sm font-medium text-slate-800 dark:text-slate-200 hover:underline text-left">{text}</button>
                                    <p className="text-xs text-slate-500">{timeSince(activity.timestamp)}</p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>

        {/* Secondary Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                 <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Top 5 Sản phẩm Lợi nhuận cao</h3>
                 <div className="space-y-3">
                    {analyticsData.topProfitableProducts.map(p => (
                        <div key={p.id} className="flex justify-between items-center text-sm">
                            <button onClick={() => onNavigate('PRODUCT', { productId: p.id })} className="font-medium text-primary-600 hover:underline line-clamp-1">{p.name}</button>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">{currencyFormatter(p.profit)}</span>
                        </div>
                    ))}
                    {analyticsData.topProfitableProducts.length === 0 && <p className="text-sm text-slate-500">Chưa có dữ liệu.</p>}
                 </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                 <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Sản phẩm sắp hết hàng</h3>
                 <div className="space-y-3">
                    {analyticsData.lowStockItems.map(p => (
                        <div key={p.id} className="flex justify-between items-center text-sm">
                            <button onClick={() => onNavigate('PURCHASING', { action: 'create', productId: p.id, supplierId: p.supplierId })} className="font-medium text-primary-600 hover:underline line-clamp-1">{p.name}</button>
                            <span className="font-semibold text-red-600 dark:text-red-400">Còn {p.stock}</span>
                        </div>
                    ))}
                    {analyticsData.lowStockItems.length === 0 && <p className="text-sm text-slate-500">Không có sản phẩm nào sắp hết hàng.</p>}
                 </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                 <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Đơn hàng chờ xử lý</h3>
                 <div className="space-y-3">
                    {analyticsData.pendingOrders.map(o => (
                        <div key={o.id} className="flex justify-between items-center text-sm">
                            <button onClick={() => onNavigate('SALES', { orderId: o.id })} className="font-medium text-primary-600 hover:underline line-clamp-1">#{o.id} - {o.customerName}</button>
                            <span className={`font-semibold text-xs px-2 py-1 rounded-full ${o.status === OrderStatus.Pending ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>{o.status}</span>
                        </div>
                    ))}
                    {analyticsData.pendingOrders.length === 0 && <p className="text-sm text-slate-500">Không có đơn hàng nào đang chờ.</p>}
                 </div>
            </div>
        </div>
    </div>
  );
};

export default React.memo(DashboardView);