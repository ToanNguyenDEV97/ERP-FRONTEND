import React, { useState, useMemo } from 'react';
import { WorkOrder, BillOfMaterials, InventoryItem, WorkOrderStatus, Permission, ProductionStep } from '../types';

interface WorkOrderDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    workOrder: WorkOrder | null;
    billsOfMaterials: BillOfMaterials[];
    inventoryStock: InventoryItem[];
    onUpdateStatus: (workOrderId: string, status: WorkOrderStatus) => void;
    onComplete: (workOrderId: string) => Promise<void>;
    onUpdateSteps: (workOrderId: string, steps: ProductionStep[]) => void;
    hasPermission: (permission: Permission) => boolean;
}

const WorkOrderDetailModal: React.FC<WorkOrderDetailModalProps> = ({
    isOpen, onClose, workOrder, billsOfMaterials, inventoryStock, onUpdateStatus, onComplete, onUpdateSteps, hasPermission
}) => {
    if (!isOpen || !workOrder) return null;

    const bom = billsOfMaterials.find(b => b.id === workOrder.bomId);

    const materialAvailability = useMemo(() => {
        if (!bom) return [];
        return bom.items.map(item => {
            const required = item.quantity * workOrder.quantityToProduce * (1 + (item.waste || 0) / 100);
            const available = inventoryStock.find(s => s.productId === item.productId && s.warehouse === workOrder.warehouse)?.stock || 0;
            return {
                ...item,
                required: Math.ceil(required),
                available,
                isAvailable: available >= required,
            };
        });
    }, [bom, workOrder, inventoryStock]);

    const allMaterialsAvailable = materialAvailability.every(m => m.isAvailable);
    
    const handleStepToggle = (index: number) => {
        const newSteps = [...workOrder.productionSteps];
        newSteps[index].completed = !newSteps[index].completed;
        onUpdateSteps(workOrder.id, newSteps);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-5 border-b dark:border-slate-700">
                    <h3 className="text-xl font-semibold">Chi tiết Lệnh Sản Xuất #{workOrder.id}</h3>
                    <button type="button" onClick={onClose} className="text-3xl">&times;</button>
                </div>
                <div className="flex-grow overflow-y-auto p-6 space-y-6">
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div><span className="font-semibold text-slate-500">Thành phẩm:</span><p>{workOrder.productName}</p></div>
                        <div><span className="font-semibold text-slate-500">Số lượng:</span><p>{workOrder.quantityToProduce}</p></div>
                        <div><span className="font-semibold text-slate-500">Trạng thái:</span><p>{workOrder.status}</p></div>
                        <div><span className="font-semibold text-slate-500">Ngày tạo:</span><p>{workOrder.creationDate}</p></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-semibold mb-2">Danh sách Nguyên vật liệu</h4>
                            <div className="border rounded-lg max-h-64 overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-700/50 sticky top-0"><tr><th className="p-2 text-left">NVL</th><th className="p-2 text-center">Cần</th><th className="p-2 text-center">Có</th></tr></thead>
                                    <tbody>
                                        {materialAvailability.map(m => (
                                            <tr key={m.productId} className={`border-t ${!m.isAvailable ? 'bg-red-50 dark:bg-red-900/30' : ''}`}>
                                                <td className="p-2">{m.productName}</td>
                                                <td className="p-2 text-center">{m.required}</td>
                                                <td className={`p-2 text-center font-bold ${m.isAvailable ? 'text-green-600' : 'text-red-600'}`}>{m.available}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {!allMaterialsAvailable && <p className="text-xs text-red-500 mt-1">Cảnh báo: Không đủ nguyên vật liệu trong kho.</p>}
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">Quy trình Sản xuất</h4>
                            <div className="space-y-2">
                                {workOrder.productionSteps.map((step, index) => (
                                    <label key={index} className="flex items-center p-2 bg-slate-100 dark:bg-slate-700/50 rounded-lg cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={step.completed}
                                            onChange={() => handleStepToggle(index)}
                                            disabled={workOrder.status === WorkOrderStatus.Completed || !hasPermission('UPDATE_WORK_ORDER_STEPS')}
                                            className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500"
                                        />
                                        <span className={`ml-3 ${step.completed ? 'line-through text-slate-500' : ''}`}>{step.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                 <div className="flex justify-end p-5 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 rounded-lg">Đóng</button>
                    {hasPermission('UPDATE_WORK_ORDER_STATUS') && workOrder.status === WorkOrderStatus.Pending && (
                        <button onClick={() => onUpdateStatus(workOrder.id, WorkOrderStatus.InProgress)} disabled={!allMaterialsAvailable} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-slate-400">Bắt đầu Sản xuất</button>
                    )}
                    {hasPermission('COMPLETE_WORK_ORDER') && workOrder.status === WorkOrderStatus.InProgress && (
                        <button onClick={() => onComplete(workOrder.id)} className="px-4 py-2 bg-green-600 text-white rounded-lg">Hoàn thành</button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WorkOrderDetailModal;