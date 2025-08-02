import React, { useState, useEffect, useMemo } from 'react';
import { BillOfMaterials, BillOfMaterialsItem, Product, ProductType } from '../types';
import { useToast } from '../contexts/ToastContext';

interface BOMModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (bom: Omit<BillOfMaterials, 'id'> | BillOfMaterials) => void;
    products: Product[];
    bomToEdit: BillOfMaterials | null;
}

const BOMModal: React.FC<BOMModalProps> = ({ isOpen, onClose, onSave, products, bomToEdit }) => {
    const { addToast } = useToast();
    const [name, setName] = useState('');
    const [productId, setProductId] = useState('');
    const [items, setItems] = useState<Partial<BillOfMaterialsItem>[]>([{ productId: '', quantity: 1 }]);

    const finishedGoods = useMemo(() => products.filter(p => p.productType === ProductType.FinishedGood), [products]);
    const rawMaterials = useMemo(() => products.filter(p => p.productType === ProductType.RawMaterial), [products]);

    useEffect(() => {
        if (isOpen) {
            if (bomToEdit) {
                setName(bomToEdit.name);
                setProductId(bomToEdit.productId);
                setItems(bomToEdit.items);
            } else {
                setName('');
                setProductId('');
                setItems([{ productId: '', quantity: 1 }]);
            }
        }
    }, [isOpen, bomToEdit]);

    const totalCost = useMemo(() => {
        return items.reduce((total, item) => {
            const product = rawMaterials.find(p => p.id === item.productId);
            if (!product || !item.quantity) return total;
            const wasteFactor = 1 + ((item.waste || 0) / 100);
            return total + (product.cost * item.quantity * wasteFactor);
        }, 0);
    }, [items, rawMaterials]);

    const handleItemChange = (index: number, field: keyof BillOfMaterialsItem, value: any) => {
        const newItems = [...items];
        const currentItem = { ...newItems[index] };
        newItems[index] = { ...currentItem, [field]: value };

        if (field === 'productId') {
            const product = rawMaterials.find(p => p.id === value);
            newItems[index].productName = product?.name;
            newItems[index].cost = product?.cost;
        }
        setItems(newItems);
    };

    const handleAddItem = () => setItems([...items, { productId: '', quantity: 1 }]);
    const handleRemoveItem = (index: number) => {
        if (items.length > 1) setItems(items.filter((_, i) => i !== index));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validItems = items.filter(i => i.productId && i.quantity && i.quantity > 0) as BillOfMaterialsItem[];

        if (!name || !productId || validItems.length === 0) {
            addToast('Vui lòng điền đầy đủ thông tin: Tên BOM, Thành phẩm, và ít nhất một NVL.', 'error');
            return;
        }

        const bomData = {
            name,
            productId,
            items: validItems,
            totalCost, // This will be recalculated in the API but good to have here
            lastUpdated: new Date().toISOString().split('T')[0],
        };

        if (bomToEdit) {
            onSave({ ...bomToEdit, ...bomData });
        } else {
            onSave(bomData);
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-5 border-b dark:border-slate-700">
                    <h3 className="text-xl font-semibold">{bomToEdit ? 'Chỉnh sửa' : 'Tạo'} Định mức Nguyên vật liệu</h3>
                    <button type="button" onClick={onClose} className="text-3xl">&times;</button>
                </div>
                <div className="p-5 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Tên Định mức*</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 border rounded-lg" />
                        </div>
                        <div>
                             <label className="block text-sm font-medium mb-1">Thành phẩm*</label>
                            <select value={productId} onChange={e => setProductId(e.target.value)} required className="w-full px-3 py-2 border rounded-lg">
                                <option value="" disabled>Chọn thành phẩm</option>
                                {finishedGoods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="border-t pt-4">
                        <h4 className="font-semibold mb-2">Danh sách Nguyên vật liệu</h4>
                        {items.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-center">
                                <select value={item.productId} onChange={e => handleItemChange(index, 'productId', e.target.value)} className="col-span-5 px-3 py-2 border rounded-lg text-sm">
                                    <option value="" disabled>Chọn NVL</option>
                                    {rawMaterials.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                <input type="number" value={item.quantity || ''} onChange={e => handleItemChange(index, 'quantity', parseFloat(e.target.value))} min="0.01" step="0.01" className="col-span-2 px-3 py-2 border rounded-lg text-center" placeholder="SL" />
                                <div className="col-span-2 text-right pr-2">{rawMaterials.find(p => p.id === item.productId)?.cost.toLocaleString() || 0}đ</div>
                                <input type="number" value={item.waste || ''} onChange={e => handleItemChange(index, 'waste', parseFloat(e.target.value))} min="0" className="col-span-2 px-3 py-2 border rounded-lg text-center" placeholder="Hao hụt %" />
                                <button type="button" onClick={() => handleRemoveItem(index)} className="col-span-1 text-red-500 p-2">&times;</button>
                            </div>
                        ))}
                        <button type="button" onClick={handleAddItem} className="text-sm font-medium text-primary-600 hover:underline mt-2">+ Thêm NVL</button>
                    </div>
                </div>
                <div className="flex justify-between items-center p-5 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <div className="font-bold">Tổng chi phí NVL: <span className="text-primary-600">{totalCost.toLocaleString('vi-VN')}đ</span></div>
                    <div className="space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 rounded-lg">Hủy</button>
                        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg">Lưu</button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default BOMModal;
