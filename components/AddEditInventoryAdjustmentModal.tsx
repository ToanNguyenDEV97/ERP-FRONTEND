import React, { useState, useEffect, useMemo } from 'react';
import { Product, InventoryItem, CompanySettings } from '../types';
import { useToast } from '../contexts/ToastContext';

interface AdjustmentItem {
    productId: string;
    productName: string;
    systemStock: number;
    actualStock: number;
}

interface AddEditInventoryAdjustmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (warehouse: string, notes: string, items: { productId: string; actualStock: number }[]) => void;
    products: Product[];
    inventoryStock: InventoryItem[];
    companySettings: CompanySettings;
}

const AddEditInventoryAdjustmentModal: React.FC<AddEditInventoryAdjustmentModalProps> = ({
    isOpen, onClose, onCreate, products, inventoryStock, companySettings
}) => {
    const { addToast } = useToast();
    const [warehouse, setWarehouse] = useState(companySettings.warehouses[0]?.name || '');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<AdjustmentItem[]>([{ productId: '', productName: '', systemStock: 0, actualStock: 0 }]);

    useEffect(() => {
        if (isOpen) {
            setWarehouse(companySettings.warehouses[0]?.name || '');
            setNotes('');
            setItems([{ productId: '', productName: '', systemStock: 0, actualStock: 0 }]);
        }
    }, [isOpen, companySettings.warehouses]);

    const stockInWarehouse = useMemo(() => {
        return inventoryStock.filter(s => s.warehouse === warehouse);
    }, [inventoryStock, warehouse]);

    const handleItemChange = (index: number, field: keyof AdjustmentItem, value: any) => {
        const newItems = [...items];
        const currentItem = { ...newItems[index] };
        newItems[index] = { ...currentItem, [field]: value };

        if (field === 'productId') {
            const product = products.find(p => p.id === value);
            newItems[index].productName = product?.name || '';
            const stockItem = stockInWarehouse.find(s => s.productId === value);
            newItems[index].systemStock = stockItem?.stock || 0;
            newItems[index].actualStock = stockItem?.stock || 0; // Default actual to system
        }

        if (field === 'actualStock' && typeof value === 'string') {
            newItems[index].actualStock = parseInt(value, 10) || 0;
        }

        setItems(newItems);
    };

    const handleAddItem = () => setItems([...items, { productId: '', productName: '', systemStock: 0, actualStock: 0 }]);
    const handleRemoveItem = (index: number) => {
        if (items.length > 1) setItems(items.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validItems = items.filter(i => i.productId && i.actualStock >= 0);
        if (!warehouse || validItems.length === 0) {
            addToast('Vui lòng chọn kho và thêm ít nhất một sản phẩm hợp lệ.', 'error');
            return;
        }

        const itemsToCreate = validItems.map(item => ({
            productId: item.productId,
            actualStock: item.actualStock,
        }));

        onCreate(warehouse, notes, itemsToCreate);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 modal-content-container">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col modal-content">
                <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Tạo Phiếu Kiểm Kho</h3>
                    <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 text-3xl font-light">&times;</button>
                </div>

                <div className="p-5 space-y-4 flex-grow overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Kho kiểm kê</label>
                            <select value={warehouse} onChange={e => setWarehouse(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                                {companySettings.warehouses.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                            </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Ghi chú</label>
                            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="VD: Kiểm kê định kỳ cuối tháng" />
                        </div>
                    </div>
                    
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                        <h4 className="font-semibold mb-2 text-slate-800 dark:text-slate-200">Chi tiết kiểm kê</h4>
                        <div className="grid grid-cols-12 gap-2 mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                            <div className="col-span-5">Sản phẩm</div>
                            <div className="col-span-2 text-center">Tồn hệ thống</div>
                            <div className="col-span-2 text-center">Tồn thực tế</div>
                            <div className="col-span-2 text-center">Chênh lệch</div>
                        </div>
                        {items.map((item, index) => {
                            const difference = item.actualStock - item.systemStock;
                            return (
                                <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-center">
                                    <select value={item.productId} onChange={e => handleItemChange(index, 'productId', e.target.value)} className="col-span-12 md:col-span-5 px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-sm">
                                        <option value="" disabled>Chọn sản phẩm</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                    <div className="col-span-4 md:col-span-2 px-3 py-2 text-center font-semibold text-slate-700 dark:text-slate-300">{item.systemStock}</div>
                                    <input type="number" value={item.actualStock} onChange={e => handleItemChange(index, 'actualStock', e.target.value)} min="0" className="col-span-4 md:col-span-2 px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-center" />
                                    <div className={`col-span-3 md:col-span-2 text-center font-bold ${difference > 0 ? 'text-green-600' : difference < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                                        {difference > 0 ? `+${difference}` : difference}
                                    </div>
                                    <button type="button" onClick={() => handleRemoveItem(index)} className="col-span-1 text-red-500 p-2 text-2xl font-light hover:text-red-700">&times;</button>
                                </div>
                            )
                        })}
                        <button type="button" onClick={handleAddItem} className="text-sm text-primary-600 font-semibold hover:text-primary-800 mt-2">+ Thêm dòng</button>
                    </div>
                </div>

                <div className="flex justify-end p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Hủy</button>
                    <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">Tạo Phiếu</button>
                </div>
            </form>
        </div>
    );
};

export default AddEditInventoryAdjustmentModal;
