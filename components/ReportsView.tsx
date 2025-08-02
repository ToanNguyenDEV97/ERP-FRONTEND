import React, { useState, useMemo, useEffect } from 'react';
import { Order, Product, JournalEntry, Customer, User, InventoryItem, PurchaseOrder, PaymentStatus, PurchaseOrderStatus, OrderStatus, Supplier, NavView } from '../types';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Papa from 'papaparse';
import ExportReportModal, { ColumnDefinition } from './ExportReportModal';

// Props for the main view
interface ReportsViewProps {
    orders: Order[];
    products: Product[];
    inventoryStock: InventoryItem[];
    journalEntries: JournalEntry[];
    purchaseOrders: PurchaseOrder[];
    customers: Customer[];
    suppliers: Supplier[];
    currentUser: User;
    theme: 'light' | 'dark' | 'system';
    onNavigate: (view: NavView, params?: any) => void;
    loadData: () => Promise<void>;
}

// --- HELPER COMPONENTS & CONSTANTS ---
const ReportCard: React.FC<{ title: string; value: string; description?: string }> = ({ title, value, description }) => (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-lg shadow-md">
        <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{value}</p>
        {description && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{description}</p>}
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1942', '#8884d8'];
const currencyFormatter = (value: number) => `${value.toLocaleString('vi-VN')}đ`;

const ReportDetailModal: React.FC<{
    title: string;
    orders: Order[];
    onClose: () => void;
    onNavigate: (view: NavView, params?: any) => void;
}> = ({ title, orders, onClose, onNavigate }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[101] flex justify-center items-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-5 border-b dark:border-slate-700">
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-3xl font-light">&times;</button>
                </div>
                <div className="p-5 flex-grow overflow-y-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700">
                            <tr>
                                <th className="py-2 px-3 text-left">Mã ĐH</th>
                                <th className="py-2 px-3 text-left">Khách hàng</th>
                                <th className="py-2 px-3 text-left">Ngày</th>
                                <th className="py-2 px-3 text-right">Tổng tiền</th>
                                <th className="py-2 px-3 text-center"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-slate-700">
                            {orders.map(order => (
                                <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="py-2 px-3 font-mono text-primary-600">{order.id}</td>
                                    <td className="py-2 px-3">{order.customerName}</td>
                                    <td className="py-2 px-3">{order.date}</td>
                                    <td className="py-2 px-3 text-right font-semibold">{currencyFormatter(order.total)}</td>
                                    <td className="py-2 px-3 text-center">
                                        <button 
                                            onClick={() => { onNavigate('SALES', { orderId: order.id }); onClose(); }} 
                                            className="text-primary-600 hover:underline text-xs"
                                        >
                                            Xem
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-right">
                    <button onClick={onClose} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Đóng</button>
                </div>
            </div>
        </div>
    );
};


// --- NEW BI DASHBOARD COMPONENT ---

const BIDashboard: React.FC<{
    orders: Order[];
    products: Product[];
    journalEntries: JournalEntry[];
    customers: Customer[];
    chartColors: any;
    isDark: boolean;
    onNavigate: (view: NavView, params?: any) => void;
}> = ({ orders, products, journalEntries, customers, chartColors, isDark, onNavigate }) => {
    
    const productMap = useMemo(() => products.reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
    }, {} as Record<string, Product>), [products]);

    const { kpis, trendData, revenueByProductType, topProfitableProducts } = useMemo(() => {
        const completedOrders = orders.filter(o => o.status === OrderStatus.Completed);

        // --- KPI Calculations ---
        const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
        
        let totalCogs = 0;
        completedOrders.forEach(order => {
            order.items.forEach(item => {
                totalCogs += (productMap[item.productId]?.cost || 0) * item.quantity;
            });
        });

        const otherExpenses = journalEntries
            .flatMap(je => je.lines)
            .filter(line => line.accountCode?.startsWith('6') && line.accountCode !== '632') // General expenses, not COGS
            .reduce((sum, line) => sum + line.debit, 0);


        const grossProfit = totalRevenue - totalCogs;
        const netProfit = grossProfit - otherExpenses;
        const avgOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
        
        const newCustomerIds = new Set(
            completedOrders
                .map(o => customers.find(c => c.id === o.customerId))
                .filter(c => c && new Date(c.since) >= new Date(orders[orders.length-1]?.date || '1970-01-01')) // A bit simplified
                .map(c => c!.id)
        );

        // --- Chart Data Calculations ---
        const dailyData: Record<string, { revenue: number, profit: number }> = {};
        completedOrders.forEach(order => {
            if (!dailyData[order.date]) {
                dailyData[order.date] = { revenue: 0, profit: 0 };
            }
            let orderCogs = 0;
            order.items.forEach(item => orderCogs += (productMap[item.productId]?.cost || 0) * item.quantity);
            
            dailyData[order.date].revenue += order.total;
            dailyData[order.date].profit += (order.total - orderCogs);
        });
        const finalTrendData = Object.keys(dailyData).sort().map(date => ({ date, DoanhThu: dailyData[date].revenue, 'Lợi Nhuận Gộp': dailyData[date].profit }));
        
        const revByProdType = completedOrders.reduce((acc, order) => {
            order.items.forEach(item => {
                const type = productMap[item.productId]?.productType || 'Khác';
                acc[type] = (acc[type] || 0) + item.price * item.quantity;
            });
            return acc;
        }, {} as Record<string, number>);
        const finalRevByProdType = Object.entries(revByProdType).map(([name, value]) => ({ name, value }));
        
        const profitByProduct = completedOrders.reduce((acc, order) => {
            order.items.forEach(item => {
                const product = productMap[item.productId];
                if(product) {
                    if (!acc[product.id]) {
                        acc[product.id] = { id: product.id, name: product.name, profit: 0 };
                    }
                    acc[product.id].profit += (item.price - product.cost) * item.quantity;
                }
            });
            return acc;
        }, {} as Record<string, { id: string, name: string, profit: number }>);
        const topProfitProducts = Object.values(profitByProduct).sort((a,b) => b.profit - a.profit).slice(0, 5);

        return {
            kpis: {
                totalRevenue,
                netProfit,
                newCustomers: newCustomerIds.size,
                avgOrderValue,
            },
            trendData: finalTrendData,
            revenueByProductType: finalRevByProdType,
            topProfitableProducts: topProfitProducts
        };
    }, [orders, products, journalEntries, customers, productMap]);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ReportCard title="Tổng Doanh Thu" value={currencyFormatter(kpis.totalRevenue)} />
                <ReportCard title="Lợi Nhuận Ròng" value={currencyFormatter(kpis.netProfit)} />
                <ReportCard title="Khách Hàng Mới" value={kpis.newCustomers.toLocaleString('vi-VN')} />
                <ReportCard title="Giá Trị Đơn Trung Bình" value={currencyFormatter(Math.round(kpis.avgOrderValue))} />
            </div>
             <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Doanh thu & Lợi nhuận gộp theo thời gian</h3>
                <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={trendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                        <XAxis dataKey="date" stroke={chartColors.axis} />
                        <YAxis tickFormatter={(value) => `${(value as number / 1000000)}M`} stroke={chartColors.axis} />
                        <Tooltip content={<CustomTooltip formatter={currencyFormatter} isDark={isDark} />} />
                        <Legend wrapperStyle={{ color: chartColors.axis }} />
                        <Line type="monotone" dataKey="DoanhThu" stroke="#2563eb" strokeWidth={2} name="Doanh Thu" />
                        <Line type="monotone" dataKey="Lợi Nhuận Gộp" stroke="#10b981" strokeWidth={2} name="Lợi Nhuận Gộp"/>
                    </LineChart>
                </ResponsiveContainer>
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Phân bổ Doanh thu theo Loại sản phẩm</h3>
                    <ResponsiveContainer width="100%" height={300}>
                         <PieChart>
                             <Pie data={revenueByProductType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                {revenueByProductType.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                             </Pie>
                             <Tooltip formatter={currencyFormatter} content={<CustomTooltip formatter={currencyFormatter} isDark={isDark} />} />
                         </PieChart>
                     </ResponsiveContainer>
                </div>
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Top 5 Sản phẩm Lợi nhuận cao nhất</h3>
                     <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-700/50"><tr className="border-b dark:border-slate-700"><th className="text-left p-2">Sản phẩm</th><th className="text-right p-2">Lợi nhuận</th></tr></thead>
                            <tbody>
                                {topProfitableProducts.map(p => (
                                    <tr key={p.id} className="border-b dark:border-slate-700">
                                        <td className="p-2">
                                            <button onClick={() => onNavigate('PRODUCT', { productId: p.id })} className="hover:underline text-left text-primary-600">
                                                {p.name}
                                            </button>
                                        </td>
                                        <td className="text-right p-2 font-semibold text-blue-600">{currencyFormatter(p.profit)}</td>
                                    </tr>
                                ))}
                                {topProfitableProducts.length === 0 && <tr><td colSpan={2} className="text-center p-4 text-slate-500 dark:text-slate-400">Không có dữ liệu.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}


// --- REPORT SECTIONS ---

const SalesReports: React.FC<{ 
    orders: Order[]; 
    onOpenExportModal: (title: string, data: any[], columns: ColumnDefinition[]) => void;
    chartColors: any;
    isDark: boolean;
    onNavigate: (view: NavView, params?: any) => void;
}> = ({ orders, onOpenExportModal, chartColors, isDark, onNavigate }) => {
    const [detailModalData, setDetailModalData] = useState<{ title: string; orders: Order[] } | null>(null);

    const { revenue, totalOrders, avgOrderValue, monthlyRevenue, topProducts, topCustomers } = useMemo(() => {
        const completedOrders = orders.filter(o => o.status === 'Đã hoàn thành');
        const totalRevenue = completedOrders.reduce((sum, order) => sum + order.total, 0);
        const numOrders = completedOrders.length;

        const revenueByMonth = completedOrders.reduce((acc, order) => {
            const month = order.date.substring(0, 7); // 'YYYY-MM'
            acc[month] = (acc[month] || 0) + order.total;
            return acc;
        }, {} as Record<string, number>);

        const monthlyData = Object.keys(revenueByMonth).sort().map(month => ({
            month,
            monthLabel: `T${parseInt(month.substring(5, 7))}/${month.substring(2, 4)}`,
            DoanhThu: revenueByMonth[month],
        }));

        const productSales = completedOrders.flatMap(o => o.items).reduce((acc, item) => {
            if (!acc[item.productId]) {
                acc[item.productId] = { id: item.productId, name: item.productName, quantity: 0, revenue: 0 };
            }
            acc[item.productId].quantity += item.quantity;
            acc[item.productId].revenue += item.price * item.quantity;
            return acc;
        }, {} as Record<string, {id: string, name: string, quantity: number, revenue: number}>);

        const topProductsData = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

        const customerSales = completedOrders.reduce((acc, order) => {
             if (!acc[order.customerId]) {
                acc[order.customerId] = { id: order.customerId, name: order.customerName, revenue: 0, orders: 0 };
            }
            acc[order.customerId].revenue += order.total;
            acc[order.customerId].orders += 1;
            return acc;
        }, {} as Record<string, {id: string, name: string, revenue: number, orders: number}>);

        const topCustomersData = Object.values(customerSales).sort((a,b) => b.revenue - a.revenue).slice(0, 10);
        
        return {
            revenue: totalRevenue,
            totalOrders: numOrders,
            avgOrderValue: numOrders > 0 ? totalRevenue / numOrders : 0,
            monthlyRevenue: monthlyData,
            topProducts: topProductsData,
            topCustomers: topCustomersData,
        };
    }, [orders]);
    
    const handleBarClick = (data: any) => {
        if (!data || !data.activePayload || data.activePayload.length === 0) return;
        const payload = data.activePayload[0].payload;
        const month = payload.month; // e.g., '2024-07'

        const ordersInMonth = orders.filter(o => o.date.startsWith(month) && o.status === 'Đã hoàn thành');
        
        setDetailModalData({
            title: `Chi tiết Đơn hàng ${payload.monthLabel}`,
            orders: ordersInMonth,
        });
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ReportCard title="Tổng Doanh Thu" value={currencyFormatter(revenue)} />
                <ReportCard title="Tổng Số Đơn Hàng" value={totalOrders.toLocaleString('vi-VN')} />
                <ReportCard title="Giá Trị Đơn Hàng Trung Bình" value={currencyFormatter(Math.round(avgOrderValue))} />
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Doanh thu theo tháng</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyRevenue} onClick={handleBarClick} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                        <XAxis dataKey="monthLabel" stroke={chartColors.axis} />
                        <YAxis tickFormatter={(value) => `${(value as number / 1000000)}M`} stroke={chartColors.axis} />
                        <Tooltip content={<CustomTooltip formatter={currencyFormatter} isDark={isDark} />} />
                        <Legend wrapperStyle={{ color: chartColors.axis }} />
                        <Bar dataKey="DoanhThu" fill="#2563eb" radius={[4, 4, 0, 0]} style={{ cursor: 'pointer' }}/>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Top sản phẩm bán chạy</h3>
                        <button onClick={() => onOpenExportModal('Top sản phẩm bán chạy (theo doanh thu)', topProducts, [
                            { key: 'id', label: 'Mã Sản phẩm' },
                            { key: 'name', label: 'Tên Sản phẩm' },
                            { key: 'quantity', label: 'Số lượng đã bán' },
                            { key: 'revenue', label: 'Doanh thu' },
                        ])} className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">Xuất Báo cáo</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-700/50"><tr className="border-b dark:border-slate-700"><th className="text-left p-2">Sản phẩm</th><th className="text-center p-2">Đã bán</th><th className="text-right p-2">Doanh thu</th></tr></thead>
                            <tbody>
                                {topProducts.map(p => <tr key={p.id} className="border-b dark:border-slate-700">
                                    <td className="p-2"><button onClick={() => onNavigate('PRODUCT', { productId: p.id })} className="hover:underline text-primary-600">{p.name}</button></td>
                                    <td className="text-center p-2">{p.quantity}</td>
                                    <td className="text-right p-2 font-semibold">{currencyFormatter(p.revenue)}</td>
                                </tr>)}
                                {topProducts.length === 0 && <tr><td colSpan={3} className="text-center p-4 text-slate-500 dark:text-slate-400">Không có dữ liệu.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Top khách hàng chi tiêu</h3>
                         <button onClick={() => onOpenExportModal('Top khách hàng chi tiêu', topCustomers, [
                            { key: 'id', label: 'Mã Khách hàng' },
                            { key: 'name', label: 'Tên Khách hàng' },
                            { key: 'orders', label: 'Tổng số đơn' },
                            { key: 'revenue', label: 'Tổng chi tiêu' },
                        ])} className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">Xuất Báo cáo</button>
                    </div>
                     <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-700/50"><tr className="border-b dark:border-slate-700"><th className="text-left p-2">Khách hàng</th><th className="text-center p-2">Số đơn</th><th className="text-right p-2">Tổng chi tiêu</th></tr></thead>
                            <tbody>
                                {topCustomers.map(c => <tr key={c.id} className="border-b dark:border-slate-700">
                                    <td className="p-2"><button onClick={() => onNavigate('CRM', { customerId: c.id })} className="hover:underline text-primary-600">{c.name}</button></td>
                                    <td className="text-center p-2">{c.orders}</td>
                                    <td className="text-right p-2 font-semibold">{currencyFormatter(c.revenue)}</td>
                                </tr>)}
                                {topCustomers.length === 0 && <tr><td colSpan={3} className="text-center p-4 text-slate-500 dark:text-slate-400">Không có dữ liệu.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            {detailModalData && (
                <ReportDetailModal 
                    title={detailModalData.title}
                    orders={detailModalData.orders}
                    onClose={() => setDetailModalData(null)}
                    onNavigate={onNavigate}
                />
            )}
        </div>
    );
};

const ProfitReports: React.FC<{ 
    orders: Order[]; 
    products: Product[]; 
    journalEntries: JournalEntry[];
    onOpenExportModal: (title: string, data: any[], columns: ColumnDefinition[]) => void;
    onNavigate: (view: NavView, params?: any) => void;
}> = ({ orders, products, journalEntries, onOpenExportModal, onNavigate }) => {
    const { revenue, cogs, grossProfit, profitMargin, otherExpenses, netProfit, profitByProduct } = useMemo(() => {
        const completedOrders = orders.filter(o => o.status === 'Đã hoàn thành');
        const productCostMap = products.reduce((acc, p) => {
            acc[p.id] = p.cost;
            return acc;
        }, {} as Record<string, number>);

        let totalRevenue = 0;
        let totalCogs = 0;
        const productsProfit: Record<string, {id: string, name: string, revenue: number, cogs: number, profit: number}> = {};

        completedOrders.forEach(order => {
            let orderCogs = 0;
            order.items.forEach(item => {
                const cost = productCostMap[item.productId] || 0;
                const itemCogs = cost * item.quantity;
                const itemRevenue = item.price * item.quantity;
                
                orderCogs += itemCogs;

                if (!productsProfit[item.productId]) {
                     productsProfit[item.productId] = { id: item.productId, name: item.productName, revenue: 0, cogs: 0, profit: 0 };
                }
                productsProfit[item.productId].cogs += itemCogs;
                productsProfit[item.productId].revenue += itemRevenue;
            });

            totalRevenue += order.total;
            totalCogs += orderCogs;
        });
        
        Object.keys(productsProfit).forEach(key => {
            productsProfit[key].profit = productsProfit[key].revenue - productsProfit[key].cogs;
        });

        const totalOtherExpenses = journalEntries
            .flatMap(je => je.lines)
            .filter(line => line.accountCode?.startsWith('6') && line.accountCode !== '632')
            .reduce((sum, line) => sum + line.debit, 0);
        
        const grossProfitValue = totalRevenue - totalCogs;

        return {
            revenue: totalRevenue,
            cogs: totalCogs,
            grossProfit: grossProfitValue,
            profitMargin: totalRevenue > 0 ? (grossProfitValue / totalRevenue) * 100 : 0,
            otherExpenses: totalOtherExpenses,
            netProfit: grossProfitValue - totalOtherExpenses,
            profitByProduct: Object.values(productsProfit).sort((a,b) => b.profit - a.profit).slice(0,10)
        };
    }, [orders, products, journalEntries]);
    
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <ReportCard title="Doanh Thu" value={currencyFormatter(revenue)} />
                 <ReportCard title="Giá Vốn Hàng Bán (COGS)" value={currencyFormatter(cogs)} />
                 <ReportCard title="Lợi Nhuận Gộp" value={currencyFormatter(grossProfit)} description={`Tỷ suất: ${profitMargin.toFixed(1)}%`} />
                 <ReportCard title="Lợi Nhuận Ròng" value={currencyFormatter(netProfit)} description={`Chi phí khác: ${currencyFormatter(otherExpenses)}`} />
            </div>
             <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Top 10 sản phẩm lợi nhuận nhất</h3>
                    <button onClick={() => onOpenExportModal('Top 10 sản phẩm lợi nhuận nhất', profitByProduct, [
                        { key: 'id', label: 'Mã sản phẩm' },
                        { key: 'name', label: 'Tên sản phẩm' },
                        { key: 'revenue', label: 'Doanh thu' },
                        { key: 'cogs', label: 'Giá vốn' },
                        { key: 'profit', label: 'Lợi nhuận' },
                    ])} className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">Xuất Báo cáo</button>
                </div>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700/50"><tr className="border-b dark:border-slate-700"><th className="text-left p-2">Sản phẩm</th><th className="text-right p-2">Doanh thu</th><th className="text-right p-2">Giá vốn</th><th className="text-right p-2">Lợi nhuận</th></tr></thead>
                        <tbody>
                            {profitByProduct.map(p => <tr key={p.id} className="border-b dark:border-slate-700">
                                <td className="p-2"><button onClick={() => onNavigate('PRODUCT', { productId: p.id })} className="hover:underline text-primary-600">{p.name}</button></td>
                                <td className="text-right p-2 text-green-600">{currencyFormatter(p.revenue)}</td>
                                <td className="text-right p-2 text-red-600">{currencyFormatter(p.cogs)}</td>
                                <td className="text-right p-2 font-semibold text-blue-600">{currencyFormatter(p.profit)}</td>
                            </tr>)}
                            {profitByProduct.length === 0 && <tr><td colSpan={4} className="text-center p-4 text-slate-500 dark:text-slate-400">Không có dữ liệu.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const InventoryReports: React.FC<{ 
    products: Product[]; 
    inventoryStock: InventoryItem[];
    onOpenExportModal: (title: string, data: any[], columns: ColumnDefinition[]) => void;
    onNavigate: (view: NavView, params?: any) => void;
}> = ({ products, inventoryStock, onOpenExportModal, onNavigate }) => {
    const { totalValue, totalUnits, lowStockItems, mostValuableItems } = useMemo(() => {
        const productMap = products.reduce((acc, p) => {
            acc[p.id] = p;
            return acc;
        }, {} as Record<string, Product>);

        const totalStockByProduct = inventoryStock.reduce((acc, item) => {
            acc[item.productId] = (acc[item.productId] || 0) + item.stock;
            return acc;
        }, {} as Record<string, number>);

        let value = 0;
        let units = 0;
        inventoryStock.forEach(item => {
            const product = productMap[item.productId];
            if (product) {
                value += item.stock * product.cost;
                units += item.stock;
            }
        });
        
        const lowStock = products.filter(p => (totalStockByProduct[p.id] || 0) < p.minStock);

        const valuableItems = products.map(p => {
            const totalStock = totalStockByProduct[p.id] || 0;
            return {
                id: p.id,
                sku: p.sku,
                name: p.name,
                stock: totalStock,
                value: totalStock * p.cost,
            };
        }).sort((a,b) => b.value - a.value).slice(0, 10);
        
        return {
            totalValue: value,
            totalUnits: units,
            lowStockItems: lowStock.map(p => ({ ...p, stock: totalStockByProduct[p.id] || 0 })),
            mostValuableItems: valuableItems
        };
    }, [products, inventoryStock]);

    return (
         <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ReportCard title="Tổng Giá Trị Tồn Kho" value={currencyFormatter(totalValue)} description="Tính theo giá nhập" />
                <ReportCard title="Tổng Số Lượng Tồn Kho" value={totalUnits.toLocaleString('vi-VN')} description="sản phẩm" />
                <ReportCard title="Sản phẩm dưới định mức" value={lowStockItems.length.toLocaleString('vi-VN')} description="SKUs cần chú ý"/>
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Sản phẩm sắp hết hàng</h3>
                        <button onClick={() => onOpenExportModal('Sản phẩm sắp hết hàng', lowStockItems, [
                            { key: 'id', label: 'Mã sản phẩm' },
                            { key: 'sku', label: 'SKU' },
                            { key: 'name', label: 'Tên sản phẩm' },
                            { key: 'stock', label: 'Tồn kho hiện tại' },
                            { key: 'minStock', label: 'Tồn kho tối thiểu' },
                        ])} className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">Xuất Báo cáo</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-700/50"><tr className="border-b dark:border-slate-700"><th className="text-left p-2">Sản phẩm</th><th className="text-center p-2">Tồn kho</th><th className="text-center p-2">Định mức</th></tr></thead>
                            <tbody>
                                {lowStockItems.map(p => <tr key={p.id} className="bg-yellow-50 dark:bg-yellow-900/30 border-b dark:border-slate-700">
                                    <td className="p-2"><button onClick={() => onNavigate('PRODUCT', { productId: p.id })} className="hover:underline text-primary-600">{p.name}</button></td>
                                    <td className="text-center p-2 font-bold text-red-600">{p.stock}</td>
                                    <td className="text-center p-2">{p.minStock}</td>
                                </tr>)}
                                {lowStockItems.length === 0 && <tr><td colSpan={3} className="text-center p-4 text-slate-500 dark:text-slate-400">Không có sản phẩm nào sắp hết hàng.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Top sản phẩm giá trị nhất</h3>
                        <button onClick={() => onOpenExportModal('Top sản phẩm giá trị nhất trong kho', mostValuableItems, [
                            { key: 'id', label: 'Mã sản phẩm' },
                            { key: 'sku', label: 'SKU' },
                            { key: 'name', label: 'Tên sản phẩm' },
                            { key: 'stock', label: 'Tồn kho' },
                            { key: 'value', label: 'Tổng giá trị' },
                        ])} className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">Xuất Báo cáo</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-700/50"><tr className="border-b dark:border-slate-700"><th className="text-left p-2">Sản phẩm</th><th className="text-center p-2">Tồn kho</th><th className="text-right p-2">Tổng giá trị</th></tr></thead>
                            <tbody>
                                {mostValuableItems.map(p => <tr key={p.id} className="border-b dark:border-slate-700">
                                    <td className="p-2"><button onClick={() => onNavigate('PRODUCT', { productId: p.id })} className="hover:underline text-primary-600">{p.name}</button></td>
                                    <td className="text-center p-2">{p.stock}</td>
                                    <td className="text-right p-2 font-semibold">{currencyFormatter(p.value)}</td>
                                </tr>)}
                                {mostValuableItems.length === 0 && <tr><td colSpan={3} className="text-center p-4 text-slate-500 dark:text-slate-400">Không có dữ liệu.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PurchasingReports: React.FC<{
    purchaseOrders: PurchaseOrder[];
    onOpenExportModal: (title: string, data: any[], columns: ColumnDefinition[]) => void;
    onNavigate: (view: NavView, params?: any) => void;
}> = ({ purchaseOrders, onOpenExportModal, onNavigate }) => {
    const { totalValue, totalPOs, purchasesBySupplier, topPurchasedProducts } = useMemo(() => {
        const receivedPOs = purchaseOrders.filter(po => po.status === PurchaseOrderStatus.Received);
        const value = receivedPOs.reduce((sum, po) => sum + po.total, 0);
        
        const bySupplier = receivedPOs.reduce((acc, po) => {
            if (!acc[po.supplierId]) {
                acc[po.supplierId] = { id: po.supplierId, name: po.supplierName, total: 0 };
            }
            acc[po.supplierId].total += po.total;
            return acc;
        }, {} as Record<string, {id: string, name: string, total: number}>);
        const supplierData = Object.values(bySupplier).sort((a,b) => b.total - a.total).slice(0, 10);

        const byProduct = receivedPOs.flatMap(po => po.items).reduce((acc, item) => {
            if (!acc[item.productId]) {
                acc[item.productId] = { id: item.productId, name: item.productName, quantity: 0, total: 0 };
            }
            acc[item.productId].quantity += item.quantity;
            acc[item.productId].total += item.quantity * item.cost;
            return acc;
        }, {} as Record<string, {id: string, name: string, quantity: number, total: number}>);
        const productData = Object.values(byProduct).sort((a,b) => b.total - a.total).slice(0, 10);

        return {
            totalValue: value,
            totalPOs: receivedPOs.length,
            purchasesBySupplier: supplierData,
            topPurchasedProducts: productData,
        };
    }, [purchaseOrders]);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ReportCard title="Tổng Giá Trị Đã Mua" value={currencyFormatter(totalValue)} description="Chỉ tính các đơn đã nhận hàng" />
                <ReportCard title="Tổng Đơn Mua Hàng" value={totalPOs.toLocaleString('vi-VN')} />
                <ReportCard title="Số Lượng NCC" value={new Set(purchaseOrders.map(p => p.supplierId)).size.toLocaleString('vi-VN')} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">Chi tiêu theo NCC</h3>
                         <button onClick={() => onOpenExportModal('Chi tiêu theo NCC', purchasesBySupplier, [
                            { key: 'id', label: 'Mã NCC' }, { key: 'name', label: 'Tên NCC' }, { key: 'total', label: 'Tổng chi tiêu' }
                        ])} className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm">Xuất Báo cáo</button>
                     </div>
                     <div className="overflow-x-auto"><table className="w-full text-sm">
                        <tbody>{purchasesBySupplier.map(s => <tr key={s.id} className="border-b"><td className="p-2"><button onClick={() => onNavigate('SUPPLIER', { supplierId: s.id })} className="hover:underline text-primary-600">{s.name}</button></td><td className="text-right p-2 font-semibold">{currencyFormatter(s.total)}</td></tr>)}</tbody>
                    </table></div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                     <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">Top sản phẩm nhập nhiều</h3>
                        <button onClick={() => onOpenExportModal('Top sản phẩm nhập nhiều (theo giá trị)', topPurchasedProducts, [
                            { key: 'id', label: 'Mã sản phẩm' }, { key: 'name', label: 'Tên sản phẩm' }, { key: 'quantity', label: 'Số lượng nhập' }, { key: 'total', label: 'Tổng giá trị nhập' }
                        ])} className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm">Xuất Báo cáo</button>
                    </div>
                     <div className="overflow-x-auto"><table className="w-full text-sm">
                        <tbody>{topPurchasedProducts.map(p => <tr key={p.id} className="border-b"><td className="p-2"><button onClick={() => onNavigate('PRODUCT', { productId: p.id })} className="hover:underline text-primary-600">{p.name}</button></td><td className="text-right p-2 font-semibold">{currencyFormatter(p.total)}</td></tr>)}</tbody>
                    </table></div>
                </div>
            </div>
        </div>
    );
};


const DebtReports: React.FC<{
    orders: Order[];
    purchaseOrders: PurchaseOrder[];
    onOpenExportModal: (title: string, data: any[], columns: ColumnDefinition[]) => void;
}> = ({ orders, purchaseOrders, onOpenExportModal }) => {
    const { receivableData, totalReceivable } = useMemo(() => {
        const unpaidOrders = orders.filter(o => o.status === OrderStatus.Completed && o.paymentStatus !== PaymentStatus.Paid);
        const debtByCustomer = unpaidOrders.reduce((acc, order) => {
            const debt = order.total - order.amountPaid;
            if (debt > 0) {
                if (!acc[order.customerId]) acc[order.customerId] = { id: order.customerId, name: order.customerName, totalDebt: 0, orderCount: 0 };
                acc[order.customerId].totalDebt += debt;
                acc[order.customerId].orderCount += 1;
            }
            return acc;
        }, {} as Record<string, {id: string, name: string, totalDebt: number, orderCount: number}>);
        const data = Object.values(debtByCustomer).sort((a,b) => b.totalDebt - a.totalDebt);
        return { receivableData: data, totalReceivable: data.reduce((sum, item) => sum + item.totalDebt, 0) };
    }, [orders]);

     const { payableData, totalPayable } = useMemo(() => {
        const unpaidPOs = purchaseOrders.filter(po => po.status === PurchaseOrderStatus.Received && po.paymentStatus !== PaymentStatus.Paid);
        const debtBySupplier = unpaidPOs.reduce((acc, po) => {
            const debt = po.total - po.amountPaid;
             if (debt > 0) {
                if (!acc[po.supplierId]) acc[po.supplierId] = { id: po.supplierId, name: po.supplierName, totalDebt: 0, orderCount: 0 };
                acc[po.supplierId].totalDebt += debt;
                acc[po.supplierId].orderCount += 1;
            }
            return acc;
        }, {} as Record<string, {id: string, name: string, totalDebt: number, orderCount: number}>);
        const data = Object.values(debtBySupplier).sort((a,b) => b.totalDebt - a.totalDebt);
        return { payableData: data, totalPayable: data.reduce((sum, item) => sum + item.totalDebt, 0) };
    }, [purchaseOrders]);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ReportCard title="Tổng Công nợ Phải thu" value={currencyFormatter(totalReceivable)} description={`${receivableData.length} khách hàng`} />
                <ReportCard title="Tổng Công nợ Phải trả" value={currencyFormatter(totalPayable)} description={`${payableData.length} nhà cung cấp`} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-semibold text-yellow-800 dark:text-yellow-400">Công nợ phải thu</h3><button onClick={() => onOpenExportModal('Công nợ phải thu', receivableData, [
                        { key: 'id', label: 'Mã khách hàng' }, { key: 'name', label: 'Tên khách hàng' }, { key: 'orderCount', label: 'Số đơn nợ' }, { key: 'totalDebt', label: 'Tổng nợ' }
                    ])} className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm">Xuất Báo cáo</button></div>
                     <div className="overflow-x-auto"><table className="w-full text-sm"><tbody>{receivableData.map(d => <tr key={d.id} className="border-b"><td className="p-2">{d.name}</td><td className="text-right p-2 font-semibold text-yellow-800">{currencyFormatter(d.totalDebt)}</td></tr>)}</tbody></table></div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                     <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-semibold text-red-800 dark:text-red-400">Công nợ phải trả</h3><button onClick={() => onOpenExportModal('Công nợ phải trả', payableData, [
                         { key: 'id', label: 'Mã NCC' }, { key: 'name', label: 'Tên NCC' }, { key: 'orderCount', label: 'Số đơn nợ' }, { key: 'totalDebt', label: 'Tổng nợ' }
                     ])} className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm">Xuất Báo cáo</button></div>
                     <div className="overflow-x-auto"><table className="w-full text-sm"><tbody>{payableData.map(d => <tr key={d.id} className="border-b"><td className="p-2">{d.name}</td><td className="text-right p-2 font-semibold text-red-800">{currencyFormatter(d.totalDebt)}</td></tr>)}</tbody></table></div>
                </div>
            </div>
        </div>
    );
};

const ReportsView: React.FC<ReportsViewProps> = (props) => {
    const { orders, products, inventoryStock, journalEntries, purchaseOrders, customers, suppliers, currentUser, theme, onNavigate, loadData } = props;
    
    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const [activeTab, setActiveTab] = useState('dashboard');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [exportModalConfig, setExportModalConfig] = useState<{ title: string; data: any[]; columns: ColumnDefinition[] } | null>(null);

    const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const chartColors = useMemo(() => ({
      axis: isDark ? '#94a3b8' : '#64748b',
      grid: isDark ? '#334155' : '#e2e8f0',
    }), [isDark]);


    const filteredData = useMemo(() => {
        const { start, end } = dateRange;
        if (!start && !end) return { filteredOrders: orders, filteredJournalEntries: journalEntries, filteredPurchaseOrders: purchaseOrders };
        
        const startDate = start ? new Date(start) : null;
        const endDate = end ? new Date(end) : null;
        if(startDate) startDate.setHours(0,0,0,0);
        if(endDate) endDate.setHours(23,59,59,999);

        const filterByDate = (dateStr: string) => {
            if (!dateStr) return false;
            const itemDate = new Date(dateStr);
            if (startDate && itemDate < startDate) return false;
            if (endDate && itemDate > endDate) return false;
            return true;
        };

        const filteredOrders = orders.filter(o => filterByDate(o.date));
        const filteredJournalEntries = journalEntries.filter(t => filterByDate(t.date));
        const filteredPurchaseOrders = purchaseOrders.filter(p => filterByDate(p.orderDate));

        return { filteredOrders, filteredJournalEntries, filteredPurchaseOrders };
    }, [orders, journalEntries, purchaseOrders, dateRange]);
    
    const handleOpenExportModal = (title: string, data: any[], columns: ColumnDefinition[]) => {
        setExportModalConfig({ title, data, columns });
    };

    const handleConfirmExport = (config: { format: 'csv' | 'xlsx', columns: ColumnDefinition[], includeTitle: boolean }) => {
        if (!exportModalConfig) return;
        const filename = `${exportModalConfig.title.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
        
        let dataToExport = exportModalConfig.data;
        if(config.includeTitle) {
            const titleRow: any = {};
            // Create a title row spanning the first column
            titleRow[config.columns[0].label] = exportModalConfig.title;
            // Add two empty rows after the title for spacing
            dataToExport = [titleRow, {}, ...exportModalConfig.data];
        }

        const headers = config.columns.map(c => c.label);
        const csvData = dataToExport.map(row => {
            const newRow: { [key: string]: any } = {};
            config.columns.forEach(col => {
                newRow[col.label] = row[col.key] ?? '';
            });
            return newRow;
        });

        const csv = Papa.unparse({ fields: headers, data: csvData });
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setExportModalConfig(null);
    };

    const TABS = [
        { id: 'dashboard', label: 'BI Dashboard' },
        { id: 'sales', label: 'Bán hàng' },
        { id: 'profit', label: 'Lợi nhuận' },
        { id: 'purchasing', label: 'Mua hàng' },
        { id: 'inventory', label: 'Tồn kho' },
        { id: 'debt', label: 'Công nợ'},
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <BIDashboard orders={filteredData.filteredOrders} products={products} journalEntries={filteredData.filteredJournalEntries} customers={customers} chartColors={chartColors} isDark={isDark} onNavigate={onNavigate} />;
            case 'sales':
                return <SalesReports orders={filteredData.filteredOrders} onOpenExportModal={handleOpenExportModal} chartColors={chartColors} isDark={isDark} onNavigate={onNavigate} />;
            case 'profit':
                return <ProfitReports orders={filteredData.filteredOrders} products={products} journalEntries={filteredData.filteredJournalEntries} onOpenExportModal={handleOpenExportModal} onNavigate={onNavigate} />;
            case 'purchasing':
                return <PurchasingReports purchaseOrders={filteredData.filteredPurchaseOrders} onOpenExportModal={handleOpenExportModal} onNavigate={onNavigate} />;
            case 'inventory':
                return <InventoryReports products={products} inventoryStock={inventoryStock} onOpenExportModal={handleOpenExportModal} onNavigate={onNavigate} />;
            case 'debt':
                return <DebtReports orders={filteredData.filteredOrders} purchaseOrders={filteredData.filteredPurchaseOrders} onOpenExportModal={handleOpenExportModal} />;
            default:
                return null;
        }
    };

    return (
        <>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md mb-8">
                <div className="flex flex-col border-b dark:border-slate-700 pb-4 mb-4 gap-4">
                    <nav className="flex space-x-2 p-1 bg-slate-100 dark:bg-slate-700/50 rounded-lg overflow-x-auto">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-300 whitespace-nowrap ${activeTab === tab.id ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-slate-100 shadow' : 'text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-slate-100'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                     {activeTab !== 'inventory' && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-2 w-full">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 shrink-0 sm:self-center">Lọc theo ngày:</label>
                            <input type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} className="w-full sm:w-auto px-3 py-1.5 border dark:border-slate-600 rounded-lg text-sm text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-700"/>
                            <span className="text-slate-500 dark:text-slate-400 hidden sm:block self-center">-</span>
                            <input type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} className="w-full sm:w-auto px-3 py-1.5 border dark:border-slate-600 rounded-lg text-sm text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-700"/>
                            <button onClick={() => setDateRange({start: '', end: ''})} className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 self-end sm:self-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 4l16 16" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
                {renderContent()}
            </div>
            {exportModalConfig && (
                <ExportReportModal
                    isOpen={!!exportModalConfig}
                    onClose={() => setExportModalConfig(null)}
                    reportConfig={exportModalConfig}
                    onConfirmExport={handleConfirmExport}
                />
            )}
        </>
    );
};

export default React.memo(ReportsView);