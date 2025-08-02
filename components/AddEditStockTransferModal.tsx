import React, { useState, useEffect, useMemo } from 'react';
import { Product, InventoryItem, CompanySettings, StockTransferItem } from '../types';
import { useToast } from '../contexts/ToastContext';

interface AddEditStockTransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (fromWarehouse: string, toWarehouse: string, items: StockTransferItem[], notes?: string) => void;
    products: Product[];
    inventoryStock: InventoryItem[];
    companySettings: CompanySettings;
}

const AddEditStockTransferModal: React.FC<AddEditStockTransferModalProps> = ({
    isOpen, onClose, onCreate, products, inventoryStock, companySettings
}) => {
    const { addToast } = useToast();
    const [fromWarehouse, setFromWarehouse] = useState(companySettings.warehouses[0]?.name || '');
    const [toWarehouse, setToWarehouse] = useState(companySettings.warehouses[1]?.name || '');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState<Partial<StockTransferItem>[]>([{ productId: '', quantity: 1 }]);

    useEffect(() => {
        if (isOpen) {
            setFromWarehouse(companySettings.warehouses[0]?.name || '');
            setToWarehouse(companySettings.warehouses.find(w => w.name !== companySettings.warehouses[0]?.name)?.name || '');
            setNotes('');
            setItems([{ productId: '', quantity: 1 }]);
        }
    }, [isOpen, companySettings.warehouses]);
    
    const getStock = (productId: string, warehouse: string) => {
        return inventoryStock.find(s => s.productId === productId && s.warehouse === warehouse)?.stock || 0;
    };

    const handleItemChange = (index: number, field: keyof StockTransferItem, value: any) => {
        const newItems = [...items];
        const currentItem = { ...newItems[index] };
        newItems[index] = { ...currentItem, [field]: value };

        if (field === 'productId') {
            const product = products.find(p => p.id === value);
            newItems[index].productName = product?.name || '';
            if(!newItems[index].quantity) {
                newItems[index].quantity = 1;
            }
        }
        
        if (field === 'quantity' && typeof value === 'string') {
            newItems[index].quantity = parseInt(value, 10) || 1;
        }

        setItems(newItems);
    };

    const handleAddItem = () => setItems([...items, { productId: '', quantity: 1 }]);
    const handleRemoveItem = (index: number) => {
        if (items.length > 1) setItems(items.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!fromWarehouse || !toWarehouse || fromWarehouse === toWarehouse) {
            addToast('Vui lòng chọn kho xuất và kho nhập khác nhau.', 'error');
            return;
        }

        const validItems = items.filter(i => i.productId && i.quantity && i.quantity > 0);
        if (validItems.length === 0) {
            addToast('Vui lòng thêm ít nhất một sản phẩm hợp lệ.', 'error');
            return;
        }

        for (const item of validItems) {
            const stock = getStock(item.productId!, fromWarehouse);
            if (item.quantity! > stock) {
                addToast(`Không đủ tồn kho cho sản phẩm "${item.productName}". Chỉ còn ${stock} tại ${fromWarehouse}.`, 'error');
                return;
            }
        }
        
        const itemsToCreate = validItems.map(item => ({
            productId: item.productId!,
            productName: item.productName!,
            quantity: item.quantity!,
        }));

        onCreate(fromWarehouse, toWarehouse, itemsToCreate, notes);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 modal-content-container">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col modal-content">
                <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Tạo Phiếu Chuyển Kho</h3>
                    <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 text-3xl font-light">&times;</button>
                </div>

                <div className="p-5 space-y-4 flex-grow overflow-y-auto">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Từ Kho</label>
                            <select value={fromWarehouse} onChange={e => setFromWarehouse(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                                {companySettings.warehouses.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Đến Kho</label>
                            <select value={toWarehouse} onChange={e => setToWarehouse(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                                <option value="" disabled>Chọn kho đến</option>
                                {companySettings.warehouses.filter(w => w.name !== fromWarehouse).map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                            </select>
                        </div>
                         <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Ghi chú</label>
                            <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="VD: Điều chuyển hàng cho chi nhánh mới" />
                        </div>
                    </div>

                     <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                        <h4 className="font-semibold mb-2 text-slate-800 dark:text-slate-200">Chi tiết sản phẩm</h4>
                         {items.map((item, index) => {
                             const availableStock = getStock(item.productId!, fromWarehouse);
                             const hasStockIssue = item.quantity! > availableStock;
                             return (
                                <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-start">
                                    <div className="col-span-12 md:col-span-8">
                                        <select value={item.productId} onChange={e => handleItemChange(index, 'productId', e.target.value)} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-sm">
                                            <option value="" disabled>Chọn sản phẩm</option>
                                            {products.map(p => <option key={p.id} value={p.id}>{`${p.name} (Tồn: ${getStock(p.id, fromWarehouse)})`}</option>)}
                                        </select>
                                        {item.productId && hasStockIssue && <p className="text-xs text-red-600 mt-1">Không đủ tồn kho (còn {availableStock})</p>}
                                    </div>
                                    <input type="number" value={item.quantity || ''} onChange={e => handleItemChange(index, 'quantity', e.target.value)} min="1" className="col-span-8 md:col-span-3 px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-center self-center" placeholder="SL" />
                                    <button type="button" onClick={() => handleRemoveItem(index)} className="col-span-4 md:col-span-1 text-red-500 p-2 text-2xl font-light hover:text-red-700 self-center">&times;</button>
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

export default AddEditStockTransferModal;
