import React, { useState, useMemo, useEffect } from 'react';
import { BillOfMaterials, BillOfMaterialsItem, InventoryItem, Product, ProductType, User, WorkOrder, WorkOrderStatus, CompanySettings, Permission, ProductionStep } from '../types';
import EmptyState from './EmptyState';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import BOMModal from './BOMModal';
import WorkOrderModal from './WorkOrderModal';
import WorkOrderDetailModal from './WorkOrderDetailModal';

// Props Interface
interface ManufacturingViewProps {
    products: Product[];
    inventoryStock: InventoryItem[];
    billsOfMaterials: BillOfMaterials[];
    workOrders: WorkOrder[];
    onSaveBOM: (bom: Omit<BillOfMaterials, 'id'> | BillOfMaterials) => void;
    onDeleteBOM: (bomId: string) => void;
    onCreateWorkOrder: (workOrder: Omit<WorkOrder, 'id'>) => void;
    onCompleteWorkOrder: (workOrderId: string) => Promise<void>;
    onUpdateWorkOrderStatus: (workOrderId: string, status: WorkOrderStatus) => void;
    onUpdateWorkOrderSteps: (workOrderId: string, steps: ProductionStep[]) => void;
    currentUser: User;
    companySettings: CompanySettings;
    hasPermission: (permission: Permission) => boolean;
    theme: 'light' | 'dark' | 'system';
    loadData: () => Promise<void>;
}

const getWorkOrderStatusClass = (status: WorkOrderStatus) => {
    switch(status) {
        case WorkOrderStatus.Completed: return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
        case WorkOrderStatus.InProgress: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
        case WorkOrderStatus.Pending: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
        default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
    }
}

const currencyFormatter = (value: number) => `${value.toLocaleString('vi-VN')}đ`;
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1942'];

// Sub-components
const StatCard: React.FC<{ title: string; value: string; description?: string }> = ({ title, value, description }) => (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-md">
        <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{value}</p>
        {description && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{description}</p>}
    </div>
);

const ManufacturingDashboard: React.FC<{
    workOrders: WorkOrder[];
    billsOfMaterials: BillOfMaterials[];
    theme: 'light' | 'dark' | 'system';
}> = ({ workOrders, billsOfMaterials, theme }) => {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const chartColors = useMemo(() => ({
      axis: isDark ? '#94a3b8' : '#64748b',
      grid: isDark ? '#334155' : '#e2e8f0',
    }), [isDark]);

    const { kpis, monthlyProductionData, bomCostDistribution } = useMemo(() => {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const monthlyOrders = workOrders.filter(wo => new Date(wo.creationDate) >= firstDayOfMonth);
        
        const completedThisMonth = monthlyOrders.filter(wo => wo.status === WorkOrderStatus.Completed);
        const totalProduced = completedThisMonth.reduce((sum, wo) => sum + wo.quantityToProduce, 0);
        const totalScheduled = monthlyOrders.reduce((sum, wo) => sum + wo.quantityToProduce, 0);

        const costDist = billsOfMaterials.flatMap(bom => bom.items).reduce((acc, item) => {
            const cost = item.cost * item.quantity * (1 + (item.waste || 0) / 100);
            acc[item.productName] = (acc[item.productName] || 0) + cost;
            return acc;
        }, {} as Record<string, number>);

        const bomCostData = Object.entries(costDist)
            .sort((a,b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, value]) => ({ name, value }));
        
        return {
            kpis: {
                pending: workOrders.filter(wo => wo.status === WorkOrderStatus.Pending).length,
                inProgress: workOrders.filter(wo => wo.status === WorkOrderStatus.InProgress).length,
                completedMonth: completedThisMonth.length,
            },
            monthlyProductionData: [{
                name: `Tháng ${now.getMonth() + 1}`,
                'Đã hoàn thành': totalProduced,
                'Chờ & Đang SX': totalScheduled - totalProduced,
            }],
            bomCostDistribution: bomCostData
        };
    }, [workOrders, billsOfMaterials]);

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Lệnh SX đang chờ" value={kpis.pending.toString()} />
                <StatCard title="Lệnh SX đang thực hiện" value={kpis.inProgress.toString()} />
                <StatCard title="Hoàn thành trong tháng" value={kpis.completedMonth.toString()} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                     <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Tiến độ sản xuất tháng này</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={monthlyProductionData} layout="vertical" barSize={40}>
                            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                            <XAxis type="number" stroke={chartColors.axis} />
                            <YAxis type="category" dataKey="name" stroke={chartColors.axis} width={80} />
                            <Tooltip formatter={(value: number) => `${value.toLocaleString()} sản phẩm`} />
                            <Legend />
                            <Bar dataKey="Đã hoàn thành" stackId="a" fill="#10b981" radius={[0, 4, 4, 0]} />
                            <Bar dataKey="Chờ & Đang SX" stackId="a" fill="#3b82f6" radius={[4, 0, 0, 4]}/>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                 <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Top 5 NVL chi phí cao</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={bomCostDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                {bomCostDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={currencyFormatter} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

const WorkOrderList: React.FC<{
    workOrders: WorkOrder[];
    onOpenDetail: (wo: WorkOrder) => void;
}> = ({ workOrders, onOpenDetail }) => {

    const calculateProgress = (wo: WorkOrder) => {
        if (wo.status === WorkOrderStatus.Completed) return 100;
        if (wo.status === WorkOrderStatus.Pending) return 0;
        const completedSteps = wo.productionSteps.filter(s => s.completed).length;
        return (completedSteps / wo.productionSteps.length) * 100;
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full">
                <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs uppercase text-slate-500 dark:text-slate-400">
                    <tr>
                        <th className="py-3 px-6 text-left">Mã LSX</th>
                        <th className="py-3 px-6 text-left">Thành phẩm</th>
                        <th className="py-3 px-6 text-right">Số lượng</th>
                        <th className="py-3 px-6 text-left">Ngày tạo</th>
                        <th className="py-3 px-6 text-left w-1/4">Tiến độ</th>
                        <th className="py-3 px-6 text-center">Trạng thái</th>
                    </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-700 text-sm">
                    {workOrders.map(wo => {
                        const progress = calculateProgress(wo);
                        return (
                        <tr key={wo.id} onClick={() => onOpenDetail(wo)} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer">
                            <td className="py-4 px-6 font-medium text-primary-600">{wo.id}</td>
                            <td className="py-4 px-6">{wo.productName}</td>
                            <td className="py-4 px-6 text-right font-semibold">{wo.quantityToProduce}</td>
                            <td className="py-4 px-6">{wo.creationDate}</td>
                            <td className="py-4 px-6">
                                <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-2.5">
                                    <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                </div>
                            </td>
                            <td className="py-4 px-6 text-center">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getWorkOrderStatusClass(wo.status)}`}>{wo.status}</span>
                            </td>
                        </tr>
                    )})}
                </tbody>
            </table>
            {workOrders.length === 0 && <EmptyState icon={<svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>} title="Chưa có lệnh sản xuất" message="Tạo lệnh sản xuất mới để bắt đầu." />}
        </div>
    );
};

const BOMList: React.FC<{
    boms: BillOfMaterials[];
    products: Product[];
    onEdit: (bom: BillOfMaterials) => void;
    onDelete: (bom: BillOfMaterials) => void;
    hasPermission: (p: Permission) => boolean;
}> = ({ boms, products, onEdit, onDelete, hasPermission }) => {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full">
                <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs uppercase text-slate-500 dark:text-slate-400">
                    <tr>
                        <th className="py-3 px-6 text-left">Tên Định mức</th>
                        <th className="py-3 px-6 text-left">Thành phẩm</th>
                        <th className="py-3 px-6 text-center">Số NVL</th>
                        <th className="py-3 px-6 text-right">Tổng chi phí ước tính</th>
                        <th className="py-3 px-6 text-center">Hành động</th>
                    </tr>
                </thead>
                <tbody className="divide-y dark:divide-slate-700 text-sm">
                    {boms.map(bom => (
                        <tr key={bom.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                            <td className="py-4 px-6 font-medium">{bom.name}</td>
                            <td className="py-4 px-6">{products.find(p => p.id === bom.productId)?.name}</td>
                            <td className="py-4 px-6 text-center">{bom.items.length}</td>
                            <td className="py-4 px-6 text-right font-semibold">{currencyFormatter(bom.totalCost)}</td>
                            <td className="py-4 px-6 text-center space-x-2">
                                {hasPermission('MANAGE_BOM') && (
                                    <>
                                        <button onClick={() => onEdit(bom)} className="text-blue-600 hover:underline font-medium">Sửa</button>
                                        <button onClick={() => onDelete(bom)} className="text-red-600 hover:underline font-medium">Xóa</button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {boms.length === 0 && <EmptyState icon={<svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} title="Chưa có định mức NVL" message="Tạo định mức NVL để bắt đầu quản lý sản xuất." />}
        </div>
    );
};


// Main Component
const ManufacturingView: React.FC<ManufacturingViewProps> = (props) => {
    const { 
        billsOfMaterials, workOrders, onSaveBOM, onDeleteBOM, onCreateWorkOrder, onCompleteWorkOrder, onUpdateWorkOrderStatus,
        products, currentUser, companySettings, hasPermission, inventoryStock, onUpdateWorkOrderSteps, theme, loadData
    } = props;
    
    useEffect(() => {
        loadData();
    }, [loadData]);

    const [activeTab, setActiveTab] = useState('dashboard');
    const [isBomModalOpen, setBomModalOpen] = useState(false);
    const [isWorkOrderModalOpen, setWorkOrderModalOpen] = useState(false);
    const [isWorkOrderDetailOpen, setWorkOrderDetailOpen] = useState(false);
    const [bomToEdit, setBomToEdit] = useState<BillOfMaterials | null>(null);
    const [selectedWO, setSelectedWO] = useState<WorkOrder | null>(null);
    
    const confirm = useConfirm();
    
    const handleEditBOM = (bom: BillOfMaterials) => {
        setBomToEdit(bom);
        setBomModalOpen(true);
    };

    const handleDeleteBOMClick = async (bom: BillOfMaterials) => {
        const isConfirmed = await confirm({
            title: 'Xóa Định mức NVL',
            message: `Bạn có chắc chắn muốn xóa BOM "${bom.name}" không?`,
            variant: 'danger',
            confirmText: 'Xóa'
        });
        if(isConfirmed) {
            onDeleteBOM(bom.id);
        }
    };

    const handleOpenWODetail = (wo: WorkOrder) => {
        setSelectedWO(wo);
        setWorkOrderDetailOpen(true);
    }
    
    const TABS = [
        { id: 'dashboard', label: 'Tổng quan' },
        { id: 'work_orders', label: 'Lệnh Sản Xuất' },
        { id: 'bom', label: 'Định mức NVL (BOM)' },
    ];

    const renderContent = () => {
        switch(activeTab) {
            case 'dashboard':
                return <ManufacturingDashboard workOrders={workOrders} billsOfMaterials={billsOfMaterials} theme={theme} />;
            case 'work_orders':
                return (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Danh sách Lệnh Sản Xuất</h3>
                            {hasPermission('CREATE_WORK_ORDER') && (
                                <button onClick={() => setWorkOrderModalOpen(true)} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Tạo Lệnh Sản Xuất</button>
                            )}
                        </div>
                        <WorkOrderList workOrders={workOrders} onOpenDetail={handleOpenWODetail} />
                    </div>
                );
            case 'bom':
                 return (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Danh sách Định mức NVL (BOM)</h3>
                            {hasPermission('MANAGE_BOM') && (
                                <button onClick={() => {setBomToEdit(null); setBomModalOpen(true);}} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Tạo Định mức</button>
                            )}
                        </div>
                        <BOMList boms={billsOfMaterials} products={products} onEdit={handleEditBOM} onDelete={handleDeleteBOMClick} hasPermission={hasPermission} />
                    </div>
                );
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
            {hasPermission('MANAGE_BOM') && <BOMModal isOpen={isBomModalOpen} onClose={() => setBomModalOpen(false)} onSave={onSaveBOM} products={products} bomToEdit={bomToEdit} />}
            {hasPermission('CREATE_WORK_ORDER') && <WorkOrderModal isOpen={isWorkOrderModalOpen} onClose={() => setWorkOrderModalOpen(false)} onCreate={onCreateWorkOrder} billsOfMaterials={billsOfMaterials} products={products} companySettings={companySettings}/>}
            {isWorkOrderDetailOpen && selectedWO && (
                <WorkOrderDetailModal 
                    isOpen={isWorkOrderDetailOpen}
                    onClose={() => setWorkOrderDetailOpen(false)}
                    workOrder={selectedWO}
                    billsOfMaterials={billsOfMaterials}
                    inventoryStock={inventoryStock}
                    onUpdateStatus={onUpdateWorkOrderStatus}
                    onComplete={onCompleteWorkOrder}
                    onUpdateSteps={onUpdateWorkOrderSteps}
                    hasPermission={hasPermission}
                />
            )}
        </>
    );
};

export default React.memo(ManufacturingView);
