import React, { useState, useEffect } from 'react';
import { BillOfMaterials, CompanySettings, Product, ProductType, WorkOrder, WorkOrderStatus } from '../types';
import { useToast } from '../contexts/ToastContext';

interface WorkOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (workOrder: Omit<WorkOrder, 'id'>) => void;
    billsOfMaterials: BillOfMaterials[];
    products: Product[];
    companySettings: CompanySettings;
}

const WorkOrderModal: React.FC<WorkOrderModalProps> = ({ isOpen, onClose, onCreate, billsOfMaterials, products, companySettings }) => {
    const { addToast } = useToast();
    const [productId, setProductId] = useState('');
    const [bomId, setBomId] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [warehouse, setWarehouse] = useState(companySettings.warehouses[0]?.name || '');
    const [notes, setNotes] = useState('');

    const finishedGoodsWithBOM = React.useMemo(() => {
        const bomProductIds = new Set(billsOfMaterials.map(b => b.productId));
        return products.filter(p => p.productType === ProductType.FinishedGood && bomProductIds.has(p.id));
    }, [products, billsOfMaterials]);

    const availableBOMs = React.useMemo(() => {
        return billsOfMaterials.filter(b => b.productId === productId);
    }, [billsOfMaterials, productId]);

    useEffect(() => {
        if (availableBOMs.length > 0 && !availableBOMs.find(b => b.id === bomId)) {
            setBomId(availableBOMs[0].id);
        }
    }, [availableBOMs, bomId]);
    
    useEffect(() => {
        if (!isOpen) {
            setProductId('');
            setBomId('');
            setQuantity(1);
            setWarehouse(companySettings.warehouses[0]?.name || '');
            setNotes('');
        }
    }, [isOpen, companySettings]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const product = products.find(p => p.id === productId);
        if (!product || !bomId || quantity <= 0 || !warehouse) {
            addToast('Vui lòng điền đầy đủ thông tin.', 'error');
            return;
        }

        const workOrderData: Omit<WorkOrder, 'id'> = {
            productId,
            productName: product.name,
            quantityToProduce: quantity,
            bomId,
            status: WorkOrderStatus.Pending,
            creationDate: new Date().toISOString().split('T')[0],
            warehouse,
            notes,
            estimatedCost: 0, // This will be calculated in the API
            productionSteps: [] // API will add default steps
        };
        onCreate(workOrderData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-lg">
                <div className="flex justify-between items-center p-5 border-b dark:border-slate-700">
                    <h3 className="text-xl font-semibold">Tạo Lệnh Sản Xuất</h3>
                    <button type="button" onClick={onClose} className="text-3xl">&times;</button>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Thành phẩm cần sản xuất*</label>
                        <select value={productId} onChange={e => setProductId(e.target.value)} required className="w-full px-3 py-2 border rounded-lg">
                            <option value="" disabled>Chọn thành phẩm</option>
                            {finishedGoodsWithBOM.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">Định mức NVL (BOM)*</label>
                        <select value={bomId} onChange={e => setBomId(e.target.value)} required disabled={!productId} className="w-full px-3 py-2 border rounded-lg disabled:bg-slate-100">
                            <option value="" disabled>Chọn BOM</option>
                            {availableBOMs.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Số lượng cần sản xuất*</label>
                            <input type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value, 10))} required min="1" className="w-full px-3 py-2 border rounded-lg" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium mb-1">Kho*</label>
                            <select value={warehouse} onChange={e => setWarehouse(e.target.value)} required className="w-full px-3 py-2 border rounded-lg">
                                {companySettings.warehouses.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Ghi chú</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                </div>
                <div className="flex justify-end p-5 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 rounded-lg">Hủy</button>
                    <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg">Tạo Lệnh</button>
                </div>
            </form>
        </div>
    );
};

export default WorkOrderModal;