import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Product, Supplier, User, InventoryItem, ProductType, NavView, Permission, Order, OrderStatus, InventoryMovement, InventoryMovementType } from '../types';
import { useConfirm } from '../contexts/ConfirmContext';
import { useToast } from '../contexts/ToastContext';
import EmptyState from './EmptyState';
import AddEditProductModal from './AddEditProductModal';
import AddEditSupplierModal from './AddEditSupplierModal';
import PrintBarcodesModal from './PrintBarcodesModal';
import { useSortableData, SortConfig } from '../hooks/useSortableData';
import { useAnimatedCounter } from '../hooks/useAnimatedCounter';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ProductViewProps {
    products: Product[];
    suppliers: Supplier[];
    inventoryStock: InventoryItem[];
    inventoryMovements: InventoryMovement[];
    currentUser: User;
    onNavigate: (view: NavView, params?: any) => void;
    initialProductId: string | null;
    onClearInitialSelection: () => void;
    hasPermission: (permission: Permission) => boolean;
    orders: Order[];
    onSaveProduct: (product: Omit<Product, 'id'> | Product) => Promise<any>;
    onDeleteProduct: (productId: string) => Promise<any>;
    onSaveSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<any>;
    loadData: () => Promise<void>;
}


const getMovementTypeClass = (type: InventoryMovementType) => {
    switch (type) {
        case InventoryMovementType.PurchaseReceipt:
        case InventoryMovementType.TransferIn:
        case InventoryMovementType.SalesReturn:
        case InventoryMovementType.ProductionReceipt:
            return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
        case InventoryMovementType.SalesIssue:
        case InventoryMovementType.TransferOut:
        case InventoryMovementType.ProductionIssue:
            return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
        case InventoryMovementType.Adjustment:
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
        default:
            return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
    }
};

const ProductDetailView: React.FC<{
    product: Product;
    suppliers: Supplier[];
    inventoryStock: InventoryItem[];
    inventoryMovements: InventoryMovement[];
    orders: Order[];
    onBack: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onPrintBarcode: () => void;
    hasPermission: (p: Permission) => boolean;
    onNavigate: (view: NavView, params?: any) => void;
}> = ({ product, suppliers, inventoryStock, inventoryMovements, orders, onBack, onEdit, onDelete, onPrintBarcode, hasPermission, onNavigate }) => {
    
    const [activeTab, setActiveTab] = useState('overview');

    const productStats = useMemo(() => {
        const stockByWarehouse = inventoryStock.filter(item => item.productId === product.id);
        const totalStock = stockByWarehouse.reduce((sum, item) => sum + item.stock, 0);
        const inventoryValue = totalStock * product.cost;
        const profit = product.price > 0 && product.cost > 0 ? product.price - product.cost : 0;
        return { stockByWarehouse, totalStock, inventoryValue, profit };
    }, [inventoryStock, product]);

    const supplier = suppliers.find(s => s.id === product.supplierId);
    
    const recentSales = useMemo(() => {
        return orders
            .filter(order => order.status === OrderStatus.Completed && order.items.some(item => item.productId === product.id))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10);
    }, [orders, product.id]);

    const productMovements = useMemo(() => {
        return inventoryMovements
            .filter(m => m.productId === product.id)
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 20);
    }, [inventoryMovements, product.id]);
    
    const salesDataForChart = useMemo(() => {
        const salesByDate: { [date: string]: number } = {};
        orders
            .filter(order => order.status === OrderStatus.Completed && order.items.some(item => item.productId === product.id))
            .forEach(order => {
                const item = order.items.find(i => i.productId === product.id);
                if (item) {
                    salesByDate[order.date] = (salesByDate[order.date] || 0) + item.quantity;
                }
            });
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        return Object.entries(salesByDate)
            .map(([date, quantity]) => ({ date, quantity }))
            .filter(d => new Date(d.date) >= thirtyDaysAgo)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [orders, product.id]);

    return (
        <div className="animate-fadeIn">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 rounded-full bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{product.name}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">{product.sku}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-2 self-end sm:self-center">
                    {hasPermission('EDIT_PRODUCT') && <button onClick={onEdit} className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm">Sửa sản phẩm</button>}
                    {hasPermission('PRINT_BARCODE') && <button onClick={onPrintBarcode} className="px-4 py-2 text-sm font-medium bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600">In mã vạch</button>}
                    {hasPermission('DELETE_PRODUCT') && <button onClick={onDelete} className="px-4 py-2 text-sm font-medium bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-500/50 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/60">Xóa</button>}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                            </div>
                            <h3 className="text-xl font-semibold">Thông tin chung</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-slate-500">Loại SP:</span><span className="font-semibold text-slate-700 dark:text-slate-200">{product.productType}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Danh mục:</span><span className="font-semibold text-slate-700 dark:text-slate-200">{product.category || 'N/A'}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Giá bán:</span><span className="font-semibold text-slate-700 dark:text-slate-200">{product.price > 0 ? `${product.price.toLocaleString('vi-VN')}đ` : '-'}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Giá nhập:</span><span className="font-semibold text-slate-700 dark:text-slate-200">{product.cost > 0 ? `${product.cost.toLocaleString('vi-VN')}đ` : '-'}</span></div>
                             <div className="flex justify-between"><span className="text-slate-500">Lợi nhuận:</span><span className="font-semibold text-green-600">{productStats.profit > 0 ? `${productStats.profit.toLocaleString('vi-VN')}đ` : '-'}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">NCC:</span><button onClick={() => supplier && onNavigate('SUPPLIER', { supplierId: product.supplierId })} className="font-semibold text-primary-600 hover:underline">{supplier?.name || 'N/A'}</button></div>
                        </div>
                    </div>
                     <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                        <h3 className="text-xl font-semibold mb-4">Tồn kho</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between font-bold text-lg border-b pb-2 mb-2"><span className="text-slate-800 dark:text-slate-100">Tổng tồn kho:</span><span className={`${productStats.totalStock < product.minStock ? 'text-red-500' : 'text-slate-800 dark:text-slate-100'}`}>{productStats.totalStock}</span></div>
                            {productStats.stockByWarehouse.map(s => <li key={s.warehouse} className="flex justify-between text-sm"><span className="text-slate-600 dark:text-slate-300">{s.warehouse}:</span><span className="font-semibold">{s.stock}</span></li>)}
                            {productStats.stockByWarehouse.length === 0 && <p className="text-sm text-slate-500">Chưa có thông tin tồn kho.</p>}
                             <div className="flex justify-between pt-2 border-t mt-2"><span className="text-slate-500">Định mức tối thiểu:</span><span className="font-semibold text-slate-700 dark:text-slate-200">{product.minStock}</span></div>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                        <h3 className="text-xl font-semibold mb-4">Lịch sử bán hàng (30 ngày gần nhất)</h3>
                         <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={salesDataForChart} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" strokeDashoffset={5} strokeOpacity={0.5} vertical={false}/>
                                <XAxis dataKey="date" tick={{fontSize: 12}}/>
                                <YAxis allowDecimals={false}/>
                                <Tooltip contentStyle={{backgroundColor: 'rgba(255, 255, 255, 0.8)'}}/>
                                <Bar dataKey="quantity" fill="#0ea5e9" name="Số lượng bán" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md">
                         <div className="p-6">
                             <div className="overflow-x-auto max-h-80">
                                 <h3 className="text-xl font-semibold mb-4">Lịch sử xuất/nhập kho gần đây</h3>
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-white dark:bg-slate-800">
                                        <tr className="border-b dark:border-slate-700">
                                            <th className="text-left py-2">Ngày</th>
                                            <th className="text-left py-2">Loại</th>
                                            <th className="text-right py-2">Thay đổi</th>
                                            <th className="text-left py-2 pl-4">Tham chiếu</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {productMovements.map(m => (
                                            <tr key={m.id}>
                                                <td className="py-2">{m.date}</td>
                                                <td className="py-2"><span className={`px-1.5 py-0.5 text-xs font-semibold rounded-full ${getMovementTypeClass(m.type)}`}>{m.type}</span></td>
                                                <td className={`py-2 text-right font-bold ${m.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>{m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}</td>
                                                <td className="py-2 pl-4 font-mono">{m.referenceId}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {productMovements.length === 0 && <p className="text-sm text-slate-500 text-center py-4">Chưa có lịch sử xuất/nhập kho.</p>}
                            </div>
                         </div>
                    </div>
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
        <div className="p-3 rounded-full bg-slate-100 dark:bg-slate-700">{icon}</div>
    </div>
);

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


const ProductView: React.FC<ProductViewProps> = (props) => {
    const { products, suppliers, inventoryStock, inventoryMovements, currentUser, onNavigate, initialProductId, onClearInitialSelection, hasPermission, orders, loadData, onSaveProduct, onDeleteProduct, onSaveSupplier } = props;
    
    // --- MODAL STATES ---
    const [isProductModalOpen, setProductModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState<Product | null>(null);
    const [isSupplierModalOpen, setSupplierModalOpen] = useState(false);
    
    // --- LIST VIEW STATES ---
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [isPrintModalOpen, setPrintModalOpen] = useState(false);
    const [filterType, setFilterType] = useState<ProductType | 'All'>('All');
    const [filterCategory, setFilterCategory] = useState<string | 'All'>('All');
    const [filterSupplier, setFilterSupplier] = useState<string | 'All'>('All');
    const [filterLowStock, setFilterLowStock] = useState<boolean>(false);
    
    const confirm = useConfirm();
    
    useEffect(() => {
        loadData();
    }, [loadData]);

    // DERIVED STATE
    const selectedProduct = useMemo(() => 
        initialProductId ? products.find(p => p.id === initialProductId) : null,
      [products, initialProductId]
    );

    const enrichedProducts = useMemo(() => {
        return products.map(p => {
            const totalStock = inventoryStock
                .filter(s => s.productId === p.id)
                .reduce((sum, item) => sum + item.stock, 0);
            return { ...p, totalStock };
        });
    }, [products, inventoryStock]);
    
    const { categories, dashboardStats } = useMemo(() => {
        const totalValue = enrichedProducts.reduce((sum, p) => sum + p.totalStock * p.cost, 0);
        const lowStockItems = enrichedProducts.filter(p => p.totalStock < p.minStock);
        
        const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))] as string[];

        let highestProfit = -Infinity;
        let highestProfitProduct: Product | null = null;
        products.forEach(p => {
            if (p.price > 0 && p.cost > 0) {
                const profit = p.price - p.cost;
                if (profit > highestProfit) {
                    highestProfit = profit;
                    highestProfitProduct = p;
                }
            }
        });

        return {
            categories: uniqueCategories,
            dashboardStats: {
                totalSkus: products.length,
                totalValue,
                lowStockCount: lowStockItems.length,
                highestProfitProduct,
            }
        };
    }, [products, enrichedProducts]);

    const animatedValue = useAnimatedCounter(dashboardStats.totalValue);
    const animatedSkus = useAnimatedCounter(dashboardStats.totalSkus);
    const animatedLowStock = useAnimatedCounter(dashboardStats.lowStockCount);

    const filteredProducts = useMemo(() => {
        return enrichedProducts.filter(p =>
            (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (filterType === 'All' || p.productType === filterType) &&
            (filterCategory === 'All' || p.category === filterCategory) &&
            (filterSupplier === 'All' || p.supplierId === filterSupplier) &&
            (!filterLowStock || p.totalStock < p.minStock)
        );
    }, [enrichedProducts, searchTerm, filterType, filterCategory, filterSupplier, filterLowStock]);

    const { items: sortedProducts, requestSort, sortConfig } = useSortableData(filteredProducts, { key: 'name', direction: 'ascending'});
    
    const supplierMap = useMemo(() => {
        return suppliers.reduce((acc, s) => {
            acc[s.id] = s.name;
            return acc;
        }, {} as Record<string, string>);
    }, [suppliers]);

    useEffect(() => {
        setSelectedProductIds([]);
    }, [searchTerm, filterType, filterSupplier, filterLowStock, filterCategory]);

    // --- MODAL HANDLERS ---
    const handleOpenAddModal = () => {
        setProductToEdit(null);
        setProductModalOpen(true);
    };
    
    const handleOpenEditModal = (product: Product) => {
        setProductToEdit(product);
        setProductModalOpen(true);
    };

    const handleSaveProductAndClose = async (productData: Omit<Product, 'id'> | Product) => {
        const result = await onSaveProduct(productData);
        if (result.success) {
            setProductModalOpen(false);
        }
    };
    
    const handleSaveSupplierAndClose = async (supplierData: Omit<Supplier, 'id'>) => {
        const result = await onSaveSupplier(supplierData);
        if (result.success) {
            setSupplierModalOpen(false);
        }
    };

    const handleDeleteClick = async (productId: string) => {
        const isConfirmed = await confirm({
            title: "Xác nhận xóa sản phẩm", message: "Bạn có chắc chắn muốn xóa sản phẩm này?",
            variant: "danger", confirmText: "Xóa sản phẩm"
        });
        if (isConfirmed) {
            await onDeleteProduct(productId);
            onClearInitialSelection(); // Go back to list view if in detail view
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) setSelectedProductIds(sortedProducts.map(p => p.id));
        else setSelectedProductIds([]);
    };

    const handleSelectOne = (productId: string) => {
        setSelectedProductIds(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
    };

    const handleDeleteSelected = async () => {
        const isConfirmed = await confirm({
            title: `Xóa ${selectedProductIds.length} sản phẩm`,
            message: "Bạn có chắc chắn muốn xóa các sản phẩm đã chọn? Hành động này không thể hoàn tác.",
            variant: "danger",
            confirmText: "Xóa"
        });
        if (isConfirmed) {
            for(const id of selectedProductIds) {
                await onDeleteProduct(id);
            }
        }
    };

    const productsToPrint = useMemo(() => products.filter(p => selectedProductIds.includes(p.id)), [products, selectedProductIds]);
    
    if (selectedProduct) {
        return <ProductDetailView
            product={selectedProduct}
            suppliers={suppliers}
            inventoryStock={inventoryStock}
            inventoryMovements={inventoryMovements}
            orders={orders}
            onBack={onClearInitialSelection}
            onEdit={() => handleOpenEditModal(selectedProduct)}
            onDelete={() => handleDeleteClick(selectedProduct.id)}
            onPrintBarcode={() => {
                setSelectedProductIds([selectedProduct.id]);
                setPrintModalOpen(true);
            }}
            hasPermission={hasPermission}
            onNavigate={onNavigate}
        />;
    }

  return (
    <>
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Tổng số SKU" value={String(animatedSkus)} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>} />
                <StatCard title="Tổng giá trị kho" value={`${animatedValue.toLocaleString('vi-VN')}đ`} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>} />
                <StatCard title="Sắp hết hàng" value={String(animatedLowStock)} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} onClick={() => setFilterLowStock(prev => !prev)} />
                <StatCard title="Lợi nhuận cao nhất" value={dashboardStats.highestProfitProduct?.name || 'N/A'} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>} onClick={() => dashboardStats.highestProfitProduct && onNavigate('PRODUCT', { productId: dashboardStats.highestProfitProduct.id })} />
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                    <div className="w-full md:w-1/3 relative">
                        <input type="text" placeholder="Tìm theo Tên hoặc SKU..." className="w-full pl-10 pr-4 py-2 border dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                        <svg className="w-5 h-5 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                </div>
                 <div className="flex flex-wrap items-center gap-2 mb-4">
                    <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="w-full sm:w-auto px-3 py-2 border dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700">
                       <option value="All">Tất cả loại SP</option>
                       {Object.values(ProductType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                     <select value={filterCategory} onChange={e => setFilterCategory(e.target.value as any)} className="w-full sm:w-auto px-3 py-2 border dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700">
                       <option value="All">Tất cả danh mục</option>
                       {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                     <select value={filterSupplier} onChange={e => setFilterSupplier(e.target.value)} className="w-full sm:w-auto px-3 py-2 border dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700">
                       <option value="All">Tất cả NCC</option>
                       {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                     <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-lg bg-slate-100 dark:bg-slate-700/50">
                        <input type="checkbox" checked={filterLowStock} onChange={e => setFilterLowStock(e.target.checked)} className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500" />
                        <span className="text-sm font-medium">Hàng sắp hết</span>
                    </label>
                </div>
                 <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        {hasPermission('PRINT_BARCODE') && <button onClick={() => setPrintModalOpen(true)} disabled={selectedProductIds.length === 0} className="px-3 py-1.5 border rounded-lg text-sm flex items-center gap-2 disabled:opacity-50">In mã vạch ({selectedProductIds.length})</button>}
                        {hasPermission('DELETE_PRODUCT') && <button onClick={handleDeleteSelected} disabled={selectedProductIds.length === 0} className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50">Xóa ({selectedProductIds.length})</button>}
                    </div>
                    {hasPermission('CREATE_PRODUCT') && (
                    <button onClick={handleOpenAddModal} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2">+ Thêm Sản phẩm</button>
                    )}
                </div>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white dark:bg-slate-800">
                        <thead className="bg-gray-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="py-3 px-4 w-12 text-center"><input type="checkbox" onChange={handleSelectAll} checked={selectedProductIds.length > 0 && selectedProductIds.length === sortedProducts.length && sortedProducts.length > 0} /></th>
                                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"><SortableHeader label="Tên sản phẩm" sortKey="name" requestSort={requestSort} sortConfig={sortConfig} /></th>
                                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"><SortableHeader label="Phân loại" sortKey="category" requestSort={requestSort} sortConfig={sortConfig} /></th>
                                <th className="py-3 px-6 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"><SortableHeader label="Tồn kho" sortKey="totalStock" requestSort={requestSort} sortConfig={sortConfig} /></th>
                                <th className="py-3 px-6 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider"><SortableHeader label="Giá bán" sortKey="price" requestSort={requestSort} sortConfig={sortConfig} /></th>
                                <th className="py-3 px-6 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Nhà Cung Cấp</th>
                                <th className="py-3 px-6 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                            {sortedProducts.map((product) => {
                                const isLowStock = product.totalStock < product.minStock;
                                return (
                                    <tr key={product.id} className={`transition-colors ${selectedProductIds.includes(product.id) ? 'bg-primary-50 dark:bg-primary-900/40' : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'}`}>
                                        <td className="py-4 px-4 text-center"><input type="checkbox" checked={selectedProductIds.includes(product.id)} onChange={() => handleSelectOne(product.id)} /></td>
                                        <td className="py-4 px-6 text-sm">
                                            <div className="font-medium text-gray-900 dark:text-slate-100 cursor-pointer hover:text-primary-600" onClick={() => onNavigate('PRODUCT', { productId: product.id })}>{product.name}</div>
                                            <div className="text-gray-500 font-mono text-xs">{product.sku}</div>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-gray-500 dark:text-slate-400">{product.category}</td>
                                        <td className="py-4 px-6 text-sm text-right font-bold"><span className={isLowStock ? 'text-red-600' : 'text-gray-800 dark:text-slate-200'}>{product.totalStock}</span> {isLowStock && <span title="Tồn kho dưới định mức tối thiểu" className="text-yellow-500">⚠️</span>}</td>
                                        <td className="py-4 px-6 text-sm text-gray-500 dark:text-slate-300 text-right">{product.price > 0 ? `${product.price.toLocaleString('vi-VN')}đ` : '-'}</td>
                                        <td className="py-4 px-6 text-sm text-gray-500 dark:text-slate-400">{product.supplierId ? supplierMap[product.supplierId] : 'N/A'}</td>
                                        <td className="py-4 px-6 text-center text-sm font-medium space-x-2">
                                            <button onClick={() => onNavigate('PRODUCT', { productId: product.id })} className="text-blue-600 hover:underline">Chi tiết</button>
                                            {hasPermission('EDIT_PRODUCT') && <button onClick={() => handleOpenEditModal(product)} className="text-indigo-600 hover:underline">Sửa</button>}
                                            {hasPermission('DELETE_PRODUCT') && <button onClick={() => handleDeleteClick(product.id)} className="text-red-600 hover:underline">Xóa</button>}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {sortedProducts.length === 0 && (
                    <EmptyState
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>}
                        title="Không tìm thấy sản phẩm" message="Chưa có sản phẩm nào khớp với bộ lọc của bạn."
                        action={hasPermission('CREATE_PRODUCT') ? { text: 'Thêm sản phẩm mới', onClick: handleOpenAddModal } : undefined}
                    />
                )}
            </div>
      </div>
      {hasPermission('CREATE_PRODUCT') && <AddEditProductModal isOpen={isProductModalOpen} onClose={() => setProductModalOpen(false)} onSave={handleSaveProductAndClose} productToEdit={productToEdit} suppliers={suppliers} onAddNewSupplier={() => setSupplierModalOpen(true)} />}
      {hasPermission('CREATE_PRODUCT') && <AddEditSupplierModal isOpen={isSupplierModalOpen} onClose={() => setSupplierModalOpen(false)} onSave={handleSaveSupplierAndClose} />}
      {hasPermission('PRINT_BARCODE') && <PrintBarcodesModal isOpen={isPrintModalOpen} onClose={() => setPrintModalOpen(false)} products={productsToPrint} />}
    </>
  );
};

export default React.memo(ProductView);