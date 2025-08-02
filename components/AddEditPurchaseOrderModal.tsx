import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PurchaseOrder, PurchaseOrderItem, Supplier, Product, PurchaseOrderStatus, PaymentStatus, CompanySettings, TaxRate } from '../types';
import { useToast } from '../contexts/ToastContext';

interface AddEditPurchaseOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (po: Omit<PurchaseOrder, 'id'> | PurchaseOrder) => void;
    poToEdit: PurchaseOrder | null;
    suppliers: Supplier[];
    products: Product[];
    companySettings: CompanySettings;
    taxRates: TaxRate[];
}

const AddEditPurchaseOrderModal: React.FC<AddEditPurchaseOrderModalProps> = ({
    isOpen, onClose, onSave, poToEdit, suppliers, products, companySettings, taxRates
}) => {
    const { addToast } = useToast();
    const [poData, setPoData] = useState<Partial<Omit<PurchaseOrder, 'id' | 'items'>>>({});
    const [items, setItems] = useState<Partial<PurchaseOrderItem>[]>([{ productId: '', quantity: 1, cost: 0 }]);
    
    const isEditMode = !!poToEdit;

    useEffect(() => {
        if (isOpen) {
            const defaultTax = taxRates.find(t => t.isDefault) || taxRates[0];
            if (isEditMode) {
                const { items: poItems, ...rest } = poToEdit;
                setPoData(rest);
                setItems(poItems.map(item => ({...item}))); // Create a copy
            } else {
                setPoData({
                    supplierId: '',
                    warehouse: companySettings.warehouses[0]?.name || '',
                    taxRate: defaultTax?.rate || 0,
                });
                setItems([{ productId: '', quantity: 1, cost: 0 }]);
            }
        }
    }, [isOpen, poToEdit, isEditMode, companySettings.warehouses, taxRates]);
    
    const handleItemChange = (index: number, field: keyof PurchaseOrderItem, value: any) => {
        const newItems = [...items];
        const currentItem = { ...newItems[index] };
        newItems[index] = { ...currentItem, [field]: value };

        if (field === 'productId') {
            const product = products.find(p => p.id === value);
            newItems[index].productName = product?.name || '';
            newItems[index].cost = product?.cost || 0;
            if(!newItems[index].quantity) {
                newItems[index].quantity = 1;
            }
        }
        setItems(newItems);
    };

    const handleAddItem = () => setItems([...items, { productId: '', quantity: 1, cost: 0 }]);
    const handleRemoveItem = (index: number) => {
        if (items.length > 1) setItems(items.filter((_, i) => i !== index));
    };

    const { subtotal, tax, total } = useMemo(() => {
        const currentSubtotal = items.reduce((sum, item) => sum + (item.cost || 0) * (item.quantity || 0), 0);
        const taxRate = poData.taxRate || 0;
        const taxAmount = currentSubtotal * (taxRate / 100);
        const finalTotal = currentSubtotal + taxAmount;
        return { subtotal: currentSubtotal, tax: taxAmount, total: finalTotal };
    }, [items, poData.taxRate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const supplier = suppliers.find(s => s.id === poData.supplierId);
        const validItems = items.filter(i => i.productId && i.quantity && i.quantity > 0);

        if (!supplier || !poData.warehouse || validItems.length === 0) {
            addToast('Vui lòng chọn NCC, kho và thêm ít nhất một sản phẩm hợp lệ.', 'error');
            return;
        }

        const finalItems: PurchaseOrderItem[] = validItems.map(item => ({
            productId: item.productId!,
            productName: products.find(p => p.id === item.productId)?.name || '',
            quantity: item.quantity!,
            cost: item.cost!,
        }));
        
        const finalPOData: Omit<PurchaseOrder, 'id'> = {
            supplierId: supplier.id,
            supplierName: supplier.name,
            orderDate: poToEdit?.orderDate || new Date().toISOString().split('T')[0],
            items: finalItems,
            subtotal: subtotal,
            tax: tax,
            taxRate: poData.taxRate || 0,
            total: total,
            status: poToEdit?.status || PurchaseOrderStatus.Draft,
            paymentStatus: poToEdit?.paymentStatus || PaymentStatus.Unpaid,
            amountPaid: poToEdit?.amountPaid || 0,
            warehouse: poData.warehouse!,
        };

        onSave(poToEdit ? { ...poToEdit, ...finalPOData } : finalPOData);
    };

    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 modal-content-container">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col modal-content">
                <div className="flex justify-between items-center p-5 border-b border-slate-200">
                    <h3 className="text-xl font-semibold text-slate-800">{isEditMode ? `Chỉnh sửa Đơn Mua Hàng ${poToEdit.id}` : 'Tạo Đơn Mua Hàng Mới'}</h3>
                    <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-3xl font-light">&times;</button>
                </div>
                
                <div className="p-5 space-y-4 flex-grow overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700">Nhà cung cấp</label>
                            <select value={poData.supplierId} onChange={e => setPoData({...poData, supplierId: e.target.value})} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                                <option value="" disabled>Chọn nhà cung cấp</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-slate-700">Nhập về kho</label>
                            <select value={poData.warehouse} onChange={e => setPoData({...poData, warehouse: e.target.value})} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                                {companySettings.warehouses.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <h4 className="font-semibold mb-2 text-slate-800">Danh sách sản phẩm</h4>
                        {items.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-center">
                                <select value={item.productId} onChange={e => handleItemChange(index, 'productId', e.target.value)} className="col-span-12 md:col-span-5 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                                    <option value="" disabled>Chọn sản phẩm</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                <input type="number" value={item.quantity || ''} onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value, 10))} min="1" className="col-span-4 md:col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-center" placeholder="SL" />
                                <input type="number" value={item.cost || ''} onChange={e => handleItemChange(index, 'cost', parseFloat(e.target.value))} className="col-span-5 md:col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-right" placeholder="Giá nhập" />
                                <div className="col-span-2 md:col-span-2 text-right font-semibold text-slate-700 pr-2">
                                    {((item.cost || 0) * (item.quantity || 0)).toLocaleString('vi-VN')}đ
                                </div>
                                <button type="button" onClick={() => handleRemoveItem(index)} className="col-span-1 text-red-500 p-2 text-2xl font-light hover:text-red-700">&times;</button>
                            </div>
                        ))}
                        <button type="button" onClick={handleAddItem} className="text-sm text-primary-600 font-semibold hover:text-primary-800 mt-2">+ Thêm sản phẩm</button>
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                        <div className="w-full md:w-1/3 space-y-2">
                             <div className="flex justify-between items-center"><span className="text-slate-600">Tổng cộng:</span><span className="font-semibold">{subtotal.toLocaleString('vi-VN')}đ</span></div>
                             <div className="flex items-center gap-2">
                                <span className="text-slate-600 shrink-0">Thuế (VAT):</span>
                                <select value={poData.taxRate} onChange={e => setPoData({...poData, taxRate: parseFloat(e.target.value)})} className="w-full px-2 py-1 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500">
                                    {taxRates.map(rate => <option key={rate.id} value={rate.rate}>{rate.name}</option>)}
                                </select>
                                <span className="font-semibold text-slate-700 ml-auto shrink-0">+ {tax.toLocaleString('vi-VN')}đ</span>
                            </div>
                             <div className="flex justify-between items-center text-xl font-bold border-t pt-2"><span className="text-slate-800">Thành tiền:</span><span className="text-primary-600">{total.toLocaleString('vi-VN')}đ</span></div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end p-5 border-t border-slate-200 bg-slate-50 space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300">Hủy</button>
                    <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Lưu</button>
                </div>
            </form>
        </div>
    );
};

export default AddEditPurchaseOrderModal;