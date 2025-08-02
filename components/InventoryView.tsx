import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Product, InventoryMovement, Supplier, InventoryMovementType, InventoryAdjustment, InventoryAdjustmentItem, User, UserRole, InventoryItem, StockTransfer, StockTransferItem, CompanySettings, NavView, StockTransferStatus, Permission } from '../types';
import EmptyState from './EmptyState';
import { useToast } from '../contexts/ToastContext';
import AddEditInventoryAdjustmentModal from './AddEditInventoryAdjustmentModal';
import AddEditStockTransferModal from './AddEditStockTransferModal';
import { useSortableData, SortConfig } from '../hooks/useSortableData';
import { timeSince } from '../utils';

// Props Interface
interface InventoryViewProps {
    products: Product[];
    inventoryStock: InventoryItem[];
    inventoryMovements: InventoryMovement[];
    suppliers: Supplier[];
    inventoryAdjustments: InventoryAdjustment[];
    onCreateAdjustment: (warehouse: string, notes: string, items: { productId: string; actualStock: number }[]) => void;
    stockTransfers: StockTransfer[];
    onCreateStockTransfer: (fromWarehouse: string, toWarehouse: string, items: StockTransferItem[], notes?: string) => void;
    currentUser: User;
    companySettings: CompanySettings;
    onNavigate: (view: NavView, params?: any) => void;
    hasPermission: (permission: Permission) => boolean;
    loadData: () => Promise<void>;
}

// Helper functions and components
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

const SortableHeader = <T,>({ label, sortKey, requestSort, sortConfig }: { label: string; sortKey: keyof T; requestSort: (key: keyof T) => void; sortConfig: SortConfig<T> | null; }) => {
    const isSorted = sortConfig?.key === sortKey;
    const direction = isSorted ? sortConfig.direction : undefined;
    return (
        <button type="button" onClick={() => requestSort(sortKey)} className="flex items-center gap-1 group">
        {label}
        <span className="opacity-0 group-hover:opacity-100 transition-opacity">
            {direction === 'ascending' ? '▲' : direction === 'descending' ? '▼' : '↕'}
        </span>
        {isSorted && <span className="opacity-100">{direction === 'ascending' ? '▲' : '▼'}</span>}
        </button>
    );
};

// --- NEW SUB-COMPONENTS ---
const InventoryOverview: React.FC<{
    products: Product[],
    inventoryStock: InventoryItem[],
    inventoryMovements: InventoryMovement[],
    onNavigate: (view: NavView, params?: any) => void;
}> = ({ products, inventoryStock, inventoryMovements, onNavigate }) => {
    const { totalValue, totalSkus, totalItems, lowStockItems } = useMemo(() => {
        const productMap = products.reduce((acc, p) => {
            acc[p.id] = p;
            return acc;
        }, {} as Record<string, Product>);
        
        const totalStockByProduct = inventoryStock.reduce((acc, item) => {
            acc[item.productId] = (acc[item.productId] || 0) + item.stock;
            return acc;
        }, {} as Record<string, number>);

        const value = inventoryStock.reduce((sum, item) => {
            const product = productMap[item.productId];
            return sum + (item.stock * (product?.cost || 0));
        }, 0);

        const items = inventoryStock.reduce((sum, item) => sum + item.stock, 0);
        
        const lowStock = products.filter(p => (totalStockByProduct[p.id] || 0) < p.minStock);

        return {
            totalValue: value,
            totalSkus: products.length,
            totalItems: items,
            lowStockItems: lowStock.map(p => ({ ...p, stock: totalStockByProduct[p.id] || 0 })),
        };
    }, [products, inventoryStock]);

    const recentMovements = inventoryMovements.slice(0, 5);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-md"><p className="text-sm text-slate-500 dark:text-slate-400">Tổng giá trị tồn kho</p><p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totalValue.toLocaleString('vi-VN')}đ</p></div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-md"><p className="text-sm text-slate-500 dark:text-slate-400">Tổng số SKU</p><p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totalSkus}</p></div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-md"><p className="text-sm text-slate-500 dark:text-slate-400">SKU sắp hết hàng</p><p className="text-2xl font-bold text-red-600 dark:text-red-400">{lowStockItems.length}</p></div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-md"><p className="text-sm text-slate-500 dark:text-slate-400">Tổng số lượng sản phẩm</p><p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totalItems.toLocaleString('vi-VN')}</p></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Sản phẩm sắp hết hàng</h3>
                    {lowStockItems.length > 0 ? (
                        <ul className="space-y-3">
                            {lowStockItems.slice(0, 5).map(item => (
                                <li key={item.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <button onClick={() => onNavigate('PRODUCT', { productId: item.id })} className="font-medium text-primary-600 hover:underline">{item.name}</button>
                                    <span className="text-sm font-semibold">Tồn: <span className="text-red-600">{item.stock}</span> / {item.minStock}</span>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-slate-500">Không có sản phẩm nào sắp hết hàng.</p>}
                </div>
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Hoạt động kho gần đây</h3>
                    {recentMovements.length > 0 ? (
                        <ul className="space-y-3">
                            {recentMovements.map(m => (
                                <li key={m.id} className="flex items-center justify-between text-sm">
                                    <div>
                                        <p className="font-medium">{m.productName}</p>
                                        <p className="text-xs text-slate-500">{timeSince(m.date)} - {m.referenceId}</p>
                                    </div>
                                    <span className={`font-bold ${m.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>{m.quantityChange > 0 ? '+' : ''}{m.quantityChange}</span>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-slate-500">Chưa có hoạt động nào.</p>}
                </div>
            </div>
        </div>
    );
};

const InventoryReports: React.FC<{
    products: Product[],
    inventoryStock: InventoryItem[],
    suppliers: Supplier[],
    onNavigate: (view: NavView, params?: any) => void;
}> = ({ products, inventoryStock, suppliers, onNavigate }) => {
    const [activeReport, setActiveReport] = useState('low_stock');
    
    const { lowStockItems, valuationData, totalValue } = useMemo(() => {
        const productMap = products.reduce((acc, p) => {
            acc[p.id] = p;
            return acc;
        }, {} as Record<string, Product>);
        
        const totalStockByProduct = inventoryStock.reduce((acc, item) => {
            acc[item.productId] = (acc[item.productId] || 0) + item.stock;
            return acc;
        }, {} as Record<string, number>);

        const lowStock = products
            .filter(p => (totalStockByProduct[p.id] || 0) < p.minStock)
            .map(p => ({
                ...p,
                stock: totalStockByProduct[p.id] || 0,
                supplierName: suppliers.find(s => s.id === p.supplierId)?.name || 'N/A'
            }));
            
        const valuation = inventoryStock.map(item => {
            const product = productMap[item.productId];
            if (!product) return null;
            return {
                ...item,
                productName: product.name,
                sku: product.sku,
                cost: product.cost,
                totalValue: item.stock * product.cost
            };
        }).filter(Boolean) as (InventoryItem & { productName: string; sku: string; cost: number; totalValue: number; })[];
        
        const value = valuation.reduce((sum, item) => sum + item.totalValue, 0);

        return { lowStockItems: lowStock, valuationData: valuation, totalValue: value };
    }, [products, inventoryStock, suppliers]);

    return (
        <div>
             <div className="border-b border-slate-200 dark:border-slate-700 mb-4">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => setActiveReport('low_stock')} className={`${activeReport === 'low_stock' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'} whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}>Hàng sắp hết</button>
                    <button onClick={() => setActiveReport('valuation')} className={`${activeReport === 'valuation' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'} whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}>Định giá tồn kho</button>
                </nav>
            </div>
            {activeReport === 'low_stock' && (
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs uppercase">
                            <tr>
                                <th className="py-2 px-3 text-left">Sản phẩm</th>
                                <th className="py-2 px-3 text-center">Tồn kho</th>
                                <th className="py-2 px-3 text-center">Định mức</th>
                                <th className="py-2 px-3 text-center">Cần nhập</th>
                                <th className="py-2 px-3 text-left">Nhà cung cấp</th>
                                <th className="py-2 px-3 text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lowStockItems.map(p => (
                                <tr key={p.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="py-2 px-3 font-medium">{p.name}</td>
                                    <td className="py-2 px-3 text-center text-red-600 font-bold">{p.stock}</td>
                                    <td className="py-2 px-3 text-center">{p.minStock}</td>
                                    <td className="py-2 px-3 text-center font-semibold text-yellow-600">{p.minStock - p.stock}</td>
                                    <td className="py-2 px-3">{p.supplierName}</td>
                                    <td className="py-2 px-3 text-center">
                                        <button onClick={() => onNavigate('PURCHASING', { action: 'create', productId: p.id, supplierId: p.supplierId, quantity: p.minStock - p.stock })} className="text-sm text-primary-600 hover:underline">Tạo Đơn Mua Hàng</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {lowStockItems.length === 0 && <p className="text-center text-slate-500 py-8">Không có sản phẩm nào sắp hết hàng.</p>}
                </div>
            )}
            {activeReport === 'valuation' && (
                 <div className="overflow-x-auto">
                    <table className="min-w-full">
                         <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs uppercase">
                            <tr>
                                <th className="py-2 px-3 text-left">Sản phẩm</th>
                                <th className="py-2 px-3 text-left">Kho</th>
                                <th className="py-2 px-3 text-right">Số lượng</th>
                                <th className="py-2 px-3 text-right">Giá vốn</th>
                                <th className="py-2 px-3 text-right">Tổng giá trị</th>
                            </tr>
                        </thead>
                        <tbody>
                            {valuationData.map(item => (
                                <tr key={`${item.productId}-${item.warehouse}`} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="py-2 px-3 font-medium">{item.productName}</td>
                                    <td className="py-2 px-3">{item.warehouse}</td>
                                    <td className="py-2 px-3 text-right font-semibold">{item.stock}</td>
                                    <td className="py-2 px-3 text-right">{item.cost.toLocaleString('vi-VN')}đ</td>
                                    <td className="py-2 px-3 text-right font-bold">{item.totalValue.toLocaleString('vi-VN')}đ</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-slate-100 dark:bg-slate-700">
                            <tr>
                                <td colSpan={4} className="py-3 px-3 text-right font-bold text-lg">TỔNG GIÁ TRỊ TỒN KHO</td>
                                <td className="py-3 px-3 text-right font-bold text-lg text-primary-600">{totalValue.toLocaleString('vi-VN')}đ</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    );
};


// Sub-components for each original tab
const InventoryList: React.FC<{ 
    products: Product[],
    inventoryStock: InventoryItem[],
    companySettings: CompanySettings,
    onNavigate: (view: NavView, params?: any) => void;
}> = ({ products, inventoryStock, companySettings, onNavigate }) => {
    const [warehouseFilter, setWarehouseFilter] = useState('All');
    
    const productsByWarehouse = useMemo(() => {
        const expanded: (Product & { stock: number; warehouse: string })[] = [];
        inventoryStock.forEach(stockItem => {
            const product = products.find(p => p.id === stockItem.productId);
            if (product) {
                expanded.push({ ...product, stock: stockItem.stock, warehouse: stockItem.warehouse });
            }
        });
        return expanded;
    }, [products, inventoryStock]);
    
    const { items: sortedProducts, requestSort, sortConfig } = useSortableData(productsByWarehouse, { key: 'name', direction: 'ascending'});

    const filteredProducts = useMemo(() => {
        if (warehouseFilter === 'All') return sortedProducts;
        return sortedProducts.filter(p => p.warehouse === warehouseFilter);
    }, [sortedProducts, warehouseFilter]);

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Tồn kho chi tiết</h3>
                <div className="flex items-center gap-2">
                    <label htmlFor="warehouse-filter" className="text-sm font-medium text-slate-700 dark:text-slate-300">Lọc theo kho:</label>
                    <select
                        id="warehouse-filter"
                        value={warehouseFilter}
                        onChange={e => setWarehouseFilter(e.target.value)}
                        className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        <option value="All">Tất cả kho</option>
                        {companySettings.warehouses.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                    </select>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-slate-800">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                            <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"><SortableHeader label="Sản phẩm" sortKey="name" requestSort={requestSort} sortConfig={sortConfig}/></th>
                            <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"><SortableHeader label="Kho" sortKey="warehouse" requestSort={requestSort} sortConfig={sortConfig}/></th>
                            <th className="py-3 px-6 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"><SortableHeader label="Tồn kho" sortKey="stock" requestSort={requestSort} sortConfig={sortConfig}/></th>
                            <th className="py-3 px-6 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"><SortableHeader label="Định mức" sortKey="minStock" requestSort={requestSort} sortConfig={sortConfig}/></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {filteredProducts.map(p => (
                            <tr key={`${p.id}-${p.warehouse}`} className="hover:bg-primary-50 dark:hover:bg-slate-700/50">
                                <td className="py-4 px-6 text-sm font-medium">
                                    <button onClick={() => onNavigate('PRODUCT', { productId: p.id })} className="hover:underline text-primary-600 text-left">
                                        {p.name}
                                    </button>
                                </td>
                                <td className="py-4 px-6 text-sm text-slate-600 dark:text-slate-300">{p.warehouse}</td>
                                <td className="py-4 px-6 text-sm text-right font-bold">
                                    <span className={p.stock < p.minStock ? 'text-red-600' : 'text-slate-800 dark:text-slate-200'}>
                                        {p.stock}
                                    </span>
                                </td>
                                <td className="py-4 px-6 text-sm text-right text-slate-500 dark:text-slate-400">{p.minStock}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredProducts.length === 0 && <EmptyState icon={<svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>} title="Không có dữ liệu tồn kho" message="Kho này chưa có sản phẩm nào." />}
            </div>
        </div>
    );
};

const MovementHistory: React.FC<{ movements: InventoryMovement[]; onNavigate: (view: NavView, params?: any) => void; }> = ({ movements, onNavigate }) => {
    const { items: sortedMovements, requestSort, sortConfig } = useSortableData(movements, { key: 'date', direction: 'descending'});

    const handleReferenceClick = (referenceId: string) => {
        if (referenceId.startsWith('DH')) {
            onNavigate('SALES', { orderId: referenceId });
        } else if (referenceId.startsWith('PO')) {
            onNavigate('PURCHASING', { poId: referenceId });
        } else if (referenceId.startsWith('SR')) {
            // Future enhancement: navigate to specific return on sales tab
            onNavigate('SALES', {});
        }
        // Other types like ADJ, ST will stay on the inventory page
    };


    return (
        <div>
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Lịch sử Xuất/Nhập kho</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-slate-800">
                     <thead className="bg-slate-50 dark:bg-slate-700/50">
                         <tr>
                            <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase"><SortableHeader label="Ngày" sortKey="date" requestSort={requestSort} sortConfig={sortConfig} /></th>
                            <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase"><SortableHeader label="Sản phẩm" sortKey="productName" requestSort={requestSort} sortConfig={sortConfig} /></th>
                            <th className="py-3 px-6 text-center text-xs font-medium text-slate-500 dark:text-slate-400 uppercase"><SortableHeader label="Loại" sortKey="type" requestSort={requestSort} sortConfig={sortConfig} /></th>
                            <th className="py-3 px-6 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase"><SortableHeader label="Thay đổi" sortKey="quantityChange" requestSort={requestSort} sortConfig={sortConfig} /></th>
                            <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Kho</th>
                            <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Tham chiếu</th>
                         </tr>
                     </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {sortedMovements.map(m => (
                            <tr key={m.id} className="hover:bg-primary-50 dark:hover:bg-slate-700/50">
                                <td className="py-4 px-6 text-sm">{m.date}</td>
                                <td className="py-4 px-6 text-sm font-medium">{m.productName}</td>
                                <td className="py-4 px-6 text-center">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getMovementTypeClass(m.type)}`}>{m.type}</span>
                                </td>
                                <td className={`py-4 px-6 text-right text-sm font-bold ${m.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange}
                                </td>
                                <td className="py-4 px-6 text-sm">{m.fromWarehouse || m.toWarehouse}</td>
                                <td className="py-4 px-6 text-sm">
                                    <button onClick={() => handleReferenceClick(m.referenceId)} className="text-primary-600 font-mono hover:underline">
                                        {m.referenceId}
                                    </button>
                                </td>
                            </tr>
                        ))}
                      </tbody>
                </table>
                 {sortedMovements.length === 0 && <EmptyState icon={<svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>} title="Chưa có lịch sử" message="Chưa có hoạt động xuất nhập kho nào được ghi nhận." />}
            </div>
        </div>
    )
};

const AdjustmentsList: React.FC<{ adjustments: InventoryAdjustment[] }> = ({ adjustments }) => {
    return (
        <div>
             <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Danh sách Phiếu Kiểm kê</h3>
             <div className="space-y-4">
                {adjustments.map(adj => (
                    <div key={adj.id} className="p-4 border rounded-lg dark:border-slate-700">
                        <div className="flex justify-between items-center mb-2">
                            <p className="font-bold text-primary-600">{adj.id}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Ngày: {adj.date} | Kho: {adj.warehouse}</p>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 italic mb-2">"{adj.notes}"</p>
                        <table className="w-full text-sm">
                            <thead><tr className="bg-slate-50 dark:bg-slate-700/50"><th className="text-left p-2">Sản phẩm</th><th className="text-center p-2">Hệ thống</th><th className="text-center p-2">Thực tế</th><th className="text-center p-2">Chênh lệch</th></tr></thead>
                            <tbody className="divide-y dark:divide-slate-700">
                                {adj.items.map(item => (
                                    <tr key={item.productId}>
                                        <td className="p-2">{item.productName}</td>
                                        <td className="text-center p-2">{item.systemStock}</td>
                                        <td className="text-center p-2 font-bold">{item.actualStock}</td>
                                        <td className={`text-center p-2 font-bold ${item.difference > 0 ? 'text-green-600' : 'text-red-600'}`}>{item.difference > 0 ? `+${item.difference}` : item.difference}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
                 {adjustments.length === 0 && <EmptyState icon={<svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>} title="Chưa có phiếu kiểm kê" message="Tạo phiếu kiểm kê để điều chỉnh tồn kho." />}
             </div>
        </div>
    )
};

const TransfersList: React.FC<{ transfers: StockTransfer[] }> = ({ transfers }) => {
    return (
         <div>
             <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Danh sách Phiếu Chuyển kho</h3>
             <div className="space-y-4">
                {transfers.map(t => (
                    <div key={t.id} className="p-4 border rounded-lg dark:border-slate-700">
                        <div className="flex justify-between items-center mb-2">
                             <p className="font-bold text-primary-600">{t.id}</p>
                             <p className="text-sm text-slate-500 dark:text-slate-400">Ngày: {t.date}</p>
                        </div>
                        <p className="font-semibold text-slate-700 dark:text-slate-200">{t.fromWarehouse} &rarr; {t.toWarehouse}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300 italic mb-2">"{t.notes}"</p>
                        <ul className="text-sm list-disc list-inside">
                            {t.items.map(item => <li key={item.productId}>{item.productName}: {item.quantity}</li>)}
                        </ul>
                    </div>
                ))}
                {transfers.length === 0 && <EmptyState icon={<svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>} title="Chưa có phiếu chuyển kho" message="Tạo phiếu chuyển kho để di chuyển hàng hóa giữa các kho." />}
            </div>
        </div>
    )
};

// Main Component
const InventoryView: React.FC<InventoryViewProps> = (props) => {
    const { products, inventoryStock, inventoryMovements, suppliers, inventoryAdjustments, onCreateAdjustment, stockTransfers, onCreateStockTransfer, currentUser, companySettings, onNavigate, hasPermission, loadData } = props;
    
    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const [activeTab, setActiveTab] = useState('overview');
    const [isAdjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
    const [isTransferModalOpen, setTransferModalOpen] = useState(false);

    const TABS = [
        { id: 'overview', label: 'Tổng quan' },
        { id: 'list', label: 'Tồn kho Chi tiết' },
        { id: 'reports', label: 'Báo cáo' },
        { id: 'history', label: 'Lịch sử Xuất/Nhập' },
        { id: 'adjustments', label: 'Kiểm kê' },
        { id: 'transfers', label: 'Chuyển kho' },
    ];

    const renderContent = () => {
        switch(activeTab) {
            case 'overview':
                return <InventoryOverview products={products} inventoryStock={inventoryStock} inventoryMovements={inventoryMovements} onNavigate={onNavigate} />;
            case 'list':
                return <InventoryList products={products} inventoryStock={inventoryStock} companySettings={companySettings} onNavigate={onNavigate} />;
            case 'reports':
                return <InventoryReports products={products} inventoryStock={inventoryStock} suppliers={suppliers} onNavigate={onNavigate} />;
            case 'history':
                return <MovementHistory movements={inventoryMovements} onNavigate={onNavigate} />;
            case 'adjustments':
                 return (
                        <>
                            {hasPermission('CREATE_ADJUSTMENT') && <div className="flex justify-end mb-4"><button onClick={() => setAdjustmentModalOpen(true)} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Tạo Phiếu Kiểm kê</button></div>}
                            <AdjustmentsList adjustments={inventoryAdjustments} />
                        </>
                    );
            case 'transfers':
                return (
                         <>
                            {hasPermission('CREATE_TRANSFER') && <div className="flex justify-end mb-4"><button onClick={() => setTransferModalOpen(true)} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Tạo Phiếu Chuyển kho</button></div>}
                            <TransfersList transfers={stockTransfers} />
                        </>
                    );
            default:
                return null;
        }
    }

    return (
        <>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                <div className="border-b border-slate-200 dark:border-slate-700">
                    <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto" aria-label="Tabs">
                         {TABS.map(tab => (
                            <button 
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)} 
                                className={`${activeTab === tab.id ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                            >
                                {tab.label}
                            </button>
                         ))}
                    </nav>
                </div>
                <div className="mt-6">
                    {renderContent()}
                </div>
            </div>
            {hasPermission('CREATE_ADJUSTMENT') && <AddEditInventoryAdjustmentModal isOpen={isAdjustmentModalOpen} onClose={() => setAdjustmentModalOpen(false)} onCreate={onCreateAdjustment} products={products} inventoryStock={inventoryStock} companySettings={companySettings} />}
            {hasPermission('CREATE_TRANSFER') && <AddEditStockTransferModal isOpen={isTransferModalOpen} onClose={() => setTransferModalOpen(false)} onCreate={onCreateStockTransfer} products={products} inventoryStock={inventoryStock} companySettings={companySettings} />}
        </>
    );
};

export default React.memo(InventoryView);