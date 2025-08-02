import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Order, OrderItem, Customer, Product, PaymentMethod, PaymentStatus, InventoryItem, OrderStatus, CompanySettings, TaxRate } from '../types';
import { useToast } from '../contexts/ToastContext';
import { useHardwareScanner } from '../hooks/useHardwareScanner';
import BarcodeScannerModal from './BarcodeScannerModal';

// Props Interface
interface AddEditOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (order: Omit<Order, 'id'> | Order) => void;
    onSaveAndComplete?: (order: Omit<Order, 'id'>) => void;
    orderToEdit: Order | null;
    customers: Customer[];
    products: Product[];
    inventoryStock: InventoryItem[];
    onAddNewCustomer: () => void;
    companySettings: CompanySettings;
    taxRates: TaxRate[];
}

const ScanIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2M16 4h2a2 2 0 012 2v2M16 20h2a2 2 0 002-2v-2" />
    </svg>
);


const AddEditOrderModal: React.FC<AddEditOrderModalProps> = ({
    isOpen, onClose, onSave, onSaveAndComplete, orderToEdit, customers, products, inventoryStock, onAddNewCustomer, companySettings, taxRates
}) => {
    const { addToast } = useToast();
    const [orderData, setOrderData] = useState<Partial<Order>>({});
    const [items, setItems] = useState<Partial<OrderItem>[]>([{ productId: '', quantity: 1 }]);
    const [discountValue, setDiscountValue] = useState(0);
    const [discountType, setDiscountType] = useState<'amount' | 'percentage'>('amount');
    const [isScannerOpen, setScannerOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const isEditMode = !!orderToEdit;

    useEffect(() => {
        if (isOpen) {
            setIsSaving(false); // Reset saving state when modal opens
            const defaultTax = taxRates.find(t => t.isDefault) || taxRates[0];
            if (isEditMode) {
                setOrderData(orderToEdit);
                setItems(orderToEdit.items.map(item => ({...item}))); // Create a copy
                setDiscountValue(orderToEdit.discount || 0);
                setDiscountType('amount');
            } else {
                setOrderData({
                    customerId: 'KH_VL',
                    paymentMethod: PaymentMethod.Cash,
                    warehouse: companySettings.warehouses[0]?.name || '',
                    taxRate: defaultTax?.rate || 0,
                });
                setItems([{ productId: '', quantity: 1 }]);
                setDiscountValue(0);
                setDiscountType('amount');
            }
        }
    }, [isOpen, orderToEdit, isEditMode, companySettings.warehouses, taxRates]);

    const handleScan = useCallback((scannedSku: string) => {
        const product = products.find(p => p.sku === scannedSku);
        if (!product) {
            addToast(`Không tìm thấy sản phẩm với mã SKU: ${scannedSku}`, 'warning');
            return;
        }
        addToast(`Đã quét: ${product.name}`, 'success');
        
        setItems(prevItems => {
            const existingItemIndex = prevItems.findIndex(item => item.productId === product.id);
            if (existingItemIndex !== -1) {
                const newItems = [...prevItems];
                newItems[existingItemIndex].quantity = (newItems[existingItemIndex].quantity || 0) + 1;
                return newItems;
            } else {
                const emptyItemIndex = prevItems.findIndex(item => !item.productId);
                if (emptyItemIndex !== -1) {
                    const newItems = [...prevItems];
                    newItems[emptyItemIndex] = { productId: product.id, quantity: 1, price: product.price, productName: product.name };
                    return newItems;
                }
                return [...prevItems, { productId: product.id, quantity: 1, price: product.price, productName: product.name }];
            }
        });
    }, [products, addToast]);
    
    useHardwareScanner({ onScan: handleScan, isEnabled: isOpen });

    const handleItemChange = (index: number, field: keyof OrderItem, value: any) => {
        const newItems = [...items];
        const currentItem = { ...newItems[index] };
        newItems[index] = { ...currentItem, [field]: value };

        if (field === 'productId') {
            const product = products.find(p => p.id === value);
            newItems[index].productName = product?.name || '';
            newItems[index].price = product?.price || 0;
            if(!newItems[index].quantity) {
                newItems[index].quantity = 1;
            }
        }
        setItems(newItems);
    };

    const handleAddItem = () => setItems([...items, { productId: '', quantity: 1 }]);
    const handleRemoveItem = (index: number) => {
        if (items.length > 1) setItems(items.filter((_, i) => i !== index));
    };
    
    const getStockForProduct = (productId: string, warehouse: string) => {
        const item = inventoryStock.find(s => s.productId === productId && s.warehouse === warehouse);
        return item?.stock || 0;
    }

    const subtotal = useMemo(() => {
        return items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
    }, [items]);

    const { calculatedDiscount, subtotalAfterDiscount, calculatedTax, finalTotal } = useMemo(() => {
        const value = discountValue || 0;
        let discountAmount = 0;
        if (discountType === 'percentage') {
            const clampedValue = Math.max(0, Math.min(100, value));
            discountAmount = subtotal * (clampedValue / 100);
        } else {
            discountAmount = Math.max(0, Math.min(value, subtotal));
        }

        const subtotalAfterDisc = subtotal - discountAmount;
        const taxRate = orderData.taxRate || 0;
        const taxAmount = subtotalAfterDisc * (taxRate / 100);
        
        return { 
            calculatedDiscount: discountAmount, 
            subtotalAfterDiscount: subtotalAfterDisc,
            calculatedTax: taxAmount,
            finalTotal: subtotalAfterDisc + taxAmount,
        };
    }, [subtotal, discountValue, discountType, orderData.taxRate]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSaving) return;

        const customer = customers.find(c => c.id === orderData.customerId);
        const validItems = items.filter(i => i.productId && i.quantity && i.quantity > 0);

        if (!customer || validItems.length === 0) {
            addToast('Vui lòng chọn khách hàng và thêm ít nhất một sản phẩm hợp lệ.', 'error');
            return;
        }

        const finalItems: OrderItem[] = validItems.map(item => ({
            productId: item.productId!,
            productName: products.find(p => p.id === item.productId)?.name || '',
            quantity: item.quantity!,
            price: item.price!,
        }));

        setIsSaving(true);
        try {
            if (isEditMode) {
                 const updatedOrder: Order = {
                    ...orderToEdit,
                    ...orderData,
                    items: finalItems,
                    subtotal,
                    discount: calculatedDiscount,
                    tax: calculatedTax,
                    taxRate: orderData.taxRate || 0,
                    total: finalTotal,
                };
                await onSave(updatedOrder);
            } else {
                const newOrder: Omit<Order, 'id'> = {
                    customerId: customer.id,
                    customerName: customer.name,
                    date: new Date().toISOString().split('T')[0],
                    items: finalItems,
                    subtotal,
                    discount: calculatedDiscount,
                    tax: calculatedTax,
                    taxRate: orderData.taxRate || 0,
                    total: finalTotal,
                    status: OrderStatus.Pending,
                    paymentMethod: orderData.paymentMethod || PaymentMethod.Cash,
                    paymentStatus: PaymentStatus.Unpaid,
                    amountPaid: 0,
                    warehouse: orderData.warehouse || (companySettings.warehouses[0]?.name || ''),
                };
                await onSave(newOrder);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveAndCompleteClick = async () => {
        if (isSaving) return;
        const customer = customers.find(c => c.id === orderData.customerId);
        const validItems = items.filter(i => i.productId && i.quantity && i.quantity > 0);

        if (!customer || validItems.length === 0) {
            addToast('Vui lòng chọn khách hàng và thêm ít nhất một sản phẩm hợp lệ.', 'error');
            return;
        }

        const finalItems: OrderItem[] = validItems.map(item => ({
            productId: item.productId!,
            productName: products.find(p => p.id === item.productId)?.name || '',
            quantity: item.quantity!,
            price: item.price!,
        }));

        const newOrderData: Omit<Order, 'id'> = {
            customerId: customer.id,
            customerName: customer.name,
            date: new Date().toISOString().split('T')[0],
            items: finalItems,
            subtotal,
            discount: calculatedDiscount,
            tax: calculatedTax,
            taxRate: orderData.taxRate || 0,
            total: finalTotal,
            status: OrderStatus.Pending, // Will be overridden by the handler
            paymentMethod: orderData.paymentMethod || PaymentMethod.Cash,
            paymentStatus: PaymentStatus.Unpaid, // Will be overridden
            amountPaid: 0, // Will be overridden
            warehouse: orderData.warehouse || (companySettings.warehouses[0]?.name || ''),
        };
        
        if (onSaveAndComplete) {
            setIsSaving(true);
            try {
                await onSaveAndComplete(newOrderData);
                onClose();
            } finally {
                setIsSaving(false);
            }
        }
    };

    if (!isOpen) return null;
    
    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 modal-content-container">
                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col modal-content">
                    {/* Header */}
                    <div className="flex justify-between items-center p-5 border-b border-slate-200">
                        <h3 className="text-xl font-semibold text-slate-800">{isEditMode ? `Chỉnh sửa đơn hàng ${orderToEdit.id}` : 'Tạo đơn hàng mới'}</h3>
                        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-3xl font-light">&times;</button>
                    </div>
                    {/* Body */}
                    <div className="p-5 space-y-4 flex-grow overflow-y-auto">
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-slate-700">Khách hàng</label>
                                <div className="flex items-center gap-2">
                                    <select value={orderData.customerId} onChange={e => setOrderData({...orderData, customerId: e.target.value})} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                    <button type="button" onClick={onAddNewCustomer} className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-slate-700">Phương thức thanh toán</label>
                                <select value={orderData.paymentMethod} onChange={e => setOrderData({...orderData, paymentMethod: e.target.value as PaymentMethod})} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                                    {Object.values(PaymentMethod).map(method => <option key={method} value={method}>{method}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-slate-700">Xuất từ kho</label>
                                <select value={orderData.warehouse} onChange={e => setOrderData({...orderData, warehouse: e.target.value})} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                                    {companySettings.warehouses.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="border-t border-slate-200 pt-4">
                            <h4 className="font-semibold mb-2 text-slate-800">Danh sách sản phẩm</h4>
                            {items.map((item, index) => {
                                const currentStock = getStockForProduct(item.productId!, orderData.warehouse!);
                                const originalItem = isEditMode ? orderToEdit.items.find(i => i.productId === item.productId) : undefined;
                                const originalQuantity = originalItem ? originalItem.quantity : 0;
                                const availableStock = isEditMode ? currentStock + originalQuantity : currentStock;
                                const hasStockIssue = item.quantity! > availableStock;

                                return (
                                <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-start">
                                    <div className="col-span-12 md:col-span-5">
                                        <select value={item.productId} onChange={e => handleItemChange(index, 'productId', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                                            <option value="" disabled>Chọn sản phẩm</option>
                                            {products.map(p => <option key={p.id} value={p.id}>{`${p.name} (Tồn: ${getStockForProduct(p.id, orderData.warehouse!)})`}</option>)}
                                        </select>
                                         {item.productId && hasStockIssue && (
                                            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                                Tồn kho không đủ (chỉ còn {availableStock})
                                            </p>
                                        )}
                                    </div>
                                    <input type="number" value={item.quantity || ''} onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value,10))} min="1" className="col-span-4 md:col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-center self-center" placeholder="SL" />
                                    <input type="number" value={item.price || ''} onChange={e => handleItemChange(index, 'price', parseFloat(e.target.value))} className="col-span-5 md:col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-right self-center" placeholder="Đơn giá" />
                                    <div className="col-span-2 md:col-span-2 text-right font-semibold text-slate-700 pr-2 self-center">
                                        {((item.price || 0) * (item.quantity || 0)).toLocaleString('vi-VN')}đ
                                    </div>
                                    <button type="button" onClick={() => handleRemoveItem(index)} className="col-span-1 text-red-500 p-2 text-2xl font-light hover:text-red-700 self-center">&times;</button>
                                </div>
                            )})}
                            <div className="flex items-center gap-4 mt-2">
                                <button type="button" onClick={handleAddItem} className="text-sm text-primary-600 font-semibold hover:text-primary-800">+ Thêm sản phẩm</button>
                                <button type="button" onClick={() => setScannerOpen(true)} className="flex items-center gap-1 text-sm text-green-600 font-semibold hover:text-green-800"><ScanIcon /> Quét mã</button>
                            </div>
                        </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                            <div>{/* Spacer */}</div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center"><span className="text-slate-600">Tổng cộng:</span><span className="font-semibold">{subtotal.toLocaleString('vi-VN')}đ</span></div>
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-600 shrink-0">Chiết khấu:</span>
                                    <input type="number" value={discountValue} onChange={e => setDiscountValue(parseFloat(e.target.value))} min="0" className="w-full px-2 py-1 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500" />
                                    <select value={discountType} onChange={e => setDiscountType(e.target.value as any)} className="px-2 py-1 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500">
                                        <option value="amount">VNĐ</option>
                                        <option value="percentage">%</option>
                                    </select>
                                    <span className="font-semibold text-red-600 ml-auto shrink-0">- {calculatedDiscount.toLocaleString('vi-VN')}đ</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-600 shrink-0">Thuế (VAT):</span>
                                    <select value={orderData.taxRate} onChange={e => setOrderData({...orderData, taxRate: parseFloat(e.target.value)})} className="w-full px-2 py-1 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500">
                                        {taxRates.map(rate => <option key={rate.id} value={rate.rate}>{rate.name}</option>)}
                                    </select>
                                     <span className="font-semibold text-slate-700 ml-auto shrink-0">+ {calculatedTax.toLocaleString('vi-VN')}đ</span>
                                </div>
                                <div className="flex justify-between items-center text-xl font-bold border-t pt-2"><span className="text-slate-800">Thành tiền:</span><span className="text-primary-600">{finalTotal.toLocaleString('vi-VN')}đ</span></div>
                            </div>
                        </div>

                    </div>
                    {/* Footer */}
                    <div className="flex justify-end p-5 border-t border-slate-200 bg-slate-50 space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300" disabled={isSaving}>Hủy</button>
                        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-slate-400" disabled={isSaving}>
                            {isSaving ? 'Đang lưu...' : (isEditMode ? 'Lưu thay đổi' : 'Lưu đơn hàng')}
                        </button>
                        {!isEditMode && onSaveAndComplete && (
                            <button 
                                type="button" 
                                onClick={handleSaveAndCompleteClick} 
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:bg-slate-400"
                                disabled={isSaving}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {isSaving ? 'Đang xử lý...' : 'Thanh toán & Hoàn tất'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
            <BarcodeScannerModal
                isOpen={isScannerOpen}
                onClose={() => setScannerOpen(false)}
                onScanSuccess={handleScan}
            />
        </>
    );
};

export default AddEditOrderModal;