import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Quotation, QuotationItem, Customer, Product, QuotationStatus, CompanySettings, TaxRate } from '../types';
import { useToast } from '../contexts/ToastContext';
import { useHardwareScanner } from '../hooks/useHardwareScanner';
import BarcodeScannerModal from './BarcodeScannerModal';
import { docTienBangChu } from '../utils';

interface QuotationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveQuotation?: (quotation: Omit<Quotation, 'id'> | Quotation) => void;
    customers: Customer[];
    products: Product[];
    quotationToEdit: Quotation | null;
    isPrintMode?: boolean;
    companySettings?: CompanySettings;
    taxRates: TaxRate[];
}

const ScanIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V6a2 2 0 012-2h2M4 16v2a2 2 0 002 2h2M16 4h2a2 2 0 012 2v2M16 20h2a2 2 0 002-2v-2" />
    </svg>
);

const QuotationModal: React.FC<QuotationModalProps> = ({
    isOpen,
    onClose,
    onSaveQuotation,
    customers,
    products,
    quotationToEdit,
    isPrintMode = false,
    companySettings,
    taxRates,
}) => {
    const { addToast } = useToast();
    const [formData, setFormData] = useState<Partial<Quotation>>({});
    const [items, setItems] = useState<Partial<QuotationItem>[]>([{ productId: '', quantity: 1 }]);
    const [discountValue, setDiscountValue] = useState(0);
    const [discountType, setDiscountType] = useState<'amount' | 'percentage'>('amount');
    const [isScannerOpen, setScannerOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const defaultTax = taxRates.find(t => t.isDefault) || taxRates[0];
            if (quotationToEdit) {
                setFormData(quotationToEdit);
                setItems(quotationToEdit.items || [{ productId: '', quantity: 1 }]);
                setDiscountValue(quotationToEdit.discount || 0);
                setDiscountType('amount'); // default to amount for simplicity on edit
            } else {
                const today = new Date();
                const expiry = new Date(today);
                expiry.setDate(today.getDate() + 7);

                setFormData({
                    customerId: '',
                    date: today.toISOString().split('T')[0],
                    expiryDate: expiry.toISOString().split('T')[0],
                    notes: '',
                    status: QuotationStatus.Draft,
                    taxRate: defaultTax?.rate || 0,
                });
                setItems([{ productId: '', quantity: 1 }]);
                setDiscountValue(0);
                setDiscountType('amount');
            }
        }
    }, [isOpen, quotationToEdit, taxRates]);

    const handleScan = useCallback((scannedSku: string) => {
        const product = products.find(p => p.sku === scannedSku);
        if (!product) {
            addToast(`Không tìm thấy sản phẩm với SKU: ${scannedSku}`, 'warning');
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
    
    useHardwareScanner({ onScan: handleScan, isEnabled: isOpen && !isPrintMode });

    const handleItemChange = (index: number, field: keyof QuotationItem, value: any) => {
        const newItems = [...items];
        const currentItem = { ...newItems[index] };
        newItems[index] = { ...currentItem, [field]: value };

        if (field === 'productId') {
            const product = products.find(p => p.id === value);
            newItems[index].productName = product?.name || '';
            newItems[index].price = product?.price || 0;
        }
        setItems(newItems);
    };

    const handleAddItem = () => setItems([...items, { productId: '', quantity: 1 }]);
    const handleRemoveItem = (index: number) => {
        if (items.length > 1) setItems(items.filter((_, i) => i !== index));
    };

    const subtotal = useMemo(() => {
        return items.reduce((sum, item) => {
            return sum + (item.price || 0) * (item.quantity || 0);
        }, 0);
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
        const taxRate = formData.taxRate || 0;
        const taxAmount = subtotalAfterDisc * (taxRate / 100);
        
        return { 
            calculatedDiscount: discountAmount, 
            subtotalAfterDiscount: subtotalAfterDisc,
            calculatedTax: taxAmount,
            finalTotal: subtotalAfterDisc + taxAmount,
        };
    }, [subtotal, discountValue, discountType, formData.taxRate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const customer = customers.find(c => c.id === formData.customerId);
        if (!customer || items.some(i => !i.productId || !i.quantity || i.quantity <= 0)) {
            addToast('Vui lòng chọn khách hàng và điền đủ thông tin sản phẩm.', 'error');
            return;
        }

        const finalItems: QuotationItem[] = items
            .filter(i => i.productId && i.quantity && i.quantity > 0)
            .map(item => ({
                productId: item.productId!,
                productName: products.find(p => p.id === item.productId)?.name || '',
                quantity: item.quantity!,
                price: item.price!,
            }));

        const quotationData: Omit<Quotation, 'id'> = {
            ...formData,
            customerId: customer.id,
            customerName: customer.name,
            items: finalItems,
            subtotal,
            discount: calculatedDiscount,
            tax: calculatedTax,
            taxRate: formData.taxRate || 0,
            total: finalTotal,
            status: quotationToEdit ? quotationToEdit.status : QuotationStatus.Draft,
        } as Omit<Quotation, 'id'>;
        
        if (onSaveQuotation) {
           onSaveQuotation(quotationToEdit ? { ...quotationToEdit, ...quotationData } : quotationData);
        }
        onClose();
    };

    const handlePrint = () => window.print();

    if (!isOpen) return null;

    if (isPrintMode && quotationToEdit && companySettings) {
        const customer = customers.find(c => c.id === quotationToEdit.customerId);
        const amountInWords = docTienBangChu(quotationToEdit.total) + " đồng.";

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 printable-area-container">
                <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl flex flex-col max-h-[95vh]">
                    <div className="flex justify-between items-center p-5 border-b no-print">
                        <h3 className="text-xl font-semibold">Báo giá: {quotationToEdit.id}</h3>
                        <button onClick={onClose} className="text-3xl text-slate-400 hover:text-slate-600">&times;</button>
                    </div>
                    <div className="flex-grow overflow-y-auto printable-area">
                        <div className="p-8 font-sans text-sm" style={{ width: '210mm', minHeight: '297mm', margin: 'auto' }}>
                             <header className="flex justify-between items-start pb-6 mb-6 border-b">
                                <div className="flex items-center gap-4">
                                    {companySettings.logoUrl ? (
                                        <img src={companySettings.logoUrl} alt="Company Logo" className="w-20 h-20 object-contain" />
                                    ) : (
                                        <div className="w-20 h-20 bg-slate-100 flex items-center justify-center">
                                            <svg className="w-12 h-12 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                        </div>
                                    )}
                                    <div>
                                        <h1 className="text-xl font-bold uppercase text-slate-800">{companySettings.name}</h1>
                                        <p className="text-xs text-slate-600">{companySettings.address}</p>
                                        <p className="text-xs text-slate-600">ĐT: {companySettings.phone} - Email: {companySettings.email}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h2 className="text-3xl font-bold uppercase text-primary-700">{companySettings.quotationTitle}</h2>
                                    <p className="text-xs text-slate-600">Số: <span className="font-semibold text-slate-800">{quotationToEdit.id}</span></p>
                                    <p className="text-xs text-slate-600">Ngày: <span className="font-semibold text-slate-800">{quotationToEdit.date}</span></p>
                                </div>
                            </header>
                             <div className="mb-6">
                                <h3 className="text-base font-semibold text-slate-700 mb-2">Kính gửi: {quotationToEdit.customerName}</h3>
                                {customer && <p className="text-xs text-slate-600">Địa chỉ: {customer.address}</p>}
                                {customer && <p className="text-xs text-slate-600">Điện thoại: {customer.phone}</p>}
                            </div>
                            <table className="w-full text-xs">
                                <thead className="bg-slate-100">
                                    <tr className="border">
                                        <th className="text-center py-2 px-1 font-semibold border">STT</th>
                                        <th className="text-left py-2 px-2 font-semibold border">Tên sản phẩm / Dịch vụ</th>
                                        <th className="text-center py-2 px-1 font-semibold border">SL</th>
                                        <th className="text-right py-2 px-2 font-semibold border">Đơn giá</th>
                                        <th className="text-right py-2 px-2 font-semibold border">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {quotationToEdit.items.map((item, index) => (
                                        <tr key={item.productId} className="border">
                                            <td className="text-center py-1 px-1 border">{index + 1}</td>
                                            <td className="py-1 px-2 border">{item.productName}</td>
                                            <td className="text-center py-1 px-1 border">{item.quantity}</td>
                                            <td className="text-right py-1 px-2 border">{item.price.toLocaleString('vi-VN')}</td>
                                            <td className="text-right py-1 px-2 border font-medium">{(item.price * item.quantity).toLocaleString('vi-VN')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="flex justify-end mt-2">
                                <div className="w-1/2">
                                    <div className="flex justify-between py-1 border-b"><span className="text-slate-600">Cộng tiền hàng:</span><span className="font-semibold">{quotationToEdit.subtotal.toLocaleString('vi-VN')} đ</span></div>
                                    {quotationToEdit.discount > 0 && <div className="flex justify-between py-1 border-b"><span className="text-slate-600">Chiết khấu:</span><span className="font-semibold">- {quotationToEdit.discount.toLocaleString('vi-VN')} đ</span></div>}
                                     {(quotationToEdit.tax ?? 0) > 0 && <div className="flex justify-between py-1 border-b"><span className="text-slate-600">Thuế (VAT {quotationToEdit.taxRate}%):</span><span className="font-semibold">+ {quotationToEdit.tax!.toLocaleString('vi-VN')} đ</span></div>}
                                    <div className="flex justify-between py-1 bg-slate-100 px-2 mt-1 rounded"><span className="font-bold text-slate-800">TỔNG CỘNG:</span><span className="font-bold text-primary-700">{quotationToEdit.total.toLocaleString('vi-VN')} đ</span></div>
                                </div>
                            </div>
                             <p className="mt-2 text-sm"><i>(Bằng chữ: {amountInWords})</i></p>

                             <div className="mt-6 grid grid-cols-2 gap-6 text-xs">
                                <div>
                                    <h4 className="font-bold mb-1">THÔNG TIN CHUYỂN KHOẢN</h4>
                                    <p className="whitespace-pre-wrap">{companySettings.bankDetails}</p>
                                </div>
                                 <div>
                                    <h4 className="font-bold mb-1">ĐIỀU KHOẢN & ĐIỀU KIỆN</h4>
                                    <p className="whitespace-pre-wrap">{companySettings.quotationTerms}</p>
                                </div>
                             </div>
                            
                            <div className="mt-20 grid grid-cols-3 gap-4 text-center">
                                <div><p className="font-bold">Người lập phiếu</p><p className="text-xs italic">(Ký, họ tên)</p></div>
                                <div><p className="font-bold">Kế toán</p><p className="text-xs italic">(Ký, họ tên)</p></div>
                                <div><p className="font-bold">Khách hàng</p><p className="text-xs italic">(Ký, họ tên)</p></div>
                            </div>
                        </div>
                    </div>
                    <div className="p-5 border-t bg-slate-50 text-right space-x-2 no-print">
                        <button onClick={handlePrint} className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">In</button>
                        <button onClick={onClose} className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Đóng</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 modal-content-container">
                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col modal-content">
                    <div className="flex justify-between items-center p-5 border-b border-slate-200">
                        <h3 className="text-xl font-semibold text-slate-800">{quotationToEdit ? 'Chỉnh sửa Báo giá' : 'Tạo Báo giá mới'}</h3>
                        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-3xl font-light">&times;</button>
                    </div>
                    <div className="p-5 space-y-4 flex-grow overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-slate-700">Khách hàng</label>
                                <select value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value})} required className="w-full px-3 py-2 border rounded-lg">
                                    <option value="" disabled>Chọn khách hàng</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-slate-700">Ngày báo giá</label>
                                <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full px-3 py-2 border rounded-lg"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-slate-700">Ngày hết hạn</label>
                                <input type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg"/>
                            </div>
                        </div>
                        <div className="border-t pt-4">
                            <h4 className="font-semibold mb-2">Danh sách sản phẩm</h4>
                            {items.map((item, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-center">
                                    <select value={item.productId} onChange={e => handleItemChange(index, 'productId', e.target.value)} className="col-span-12 md:col-span-5 px-3 py-2 border rounded-lg">
                                        <option value="" disabled>Chọn sản phẩm</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                    <input type="number" value={item.quantity || ''} onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value, 10))} min="1" className="col-span-4 md:col-span-2 px-3 py-2 border rounded-lg text-center" placeholder="SL" />
                                    <input type="number" value={item.price || ''} onChange={e => handleItemChange(index, 'price', parseFloat(e.target.value))} className="col-span-5 md:col-span-2 px-3 py-2 border rounded-lg text-right" placeholder="Đơn giá" />
                                    <div className="col-span-2 md:col-span-2 text-right font-semibold text-slate-700 pr-2">{((item.price || 0) * (item.quantity || 0)).toLocaleString('vi-VN')}đ</div>
                                    <button type="button" onClick={() => handleRemoveItem(index)} className="col-span-1 text-red-500 p-2 text-2xl font-light hover:text-red-700">&times;</button>
                                </div>
                            ))}
                            <div className="flex items-center gap-4 mt-2">
                                <button type="button" onClick={handleAddItem} className="text-sm text-primary-600 font-semibold hover:text-primary-800">+ Thêm sản phẩm</button>
                                <button type="button" onClick={() => setScannerOpen(true)} className="flex items-center gap-1 text-sm text-green-600 font-semibold hover:text-green-800"><ScanIcon /> Quét mã</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                             <div>
                                <label className="block text-sm font-medium mb-1 text-slate-700">Ghi chú</label>
                                <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={4} className="w-full px-3 py-2 border rounded-lg" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center"><span className="text-slate-600">Tổng cộng:</span><span className="font-semibold">{subtotal.toLocaleString('vi-VN')}đ</span></div>
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-600 shrink-0">Chiết khấu:</span>
                                    <input type="number" value={discountValue} onChange={e => setDiscountValue(parseFloat(e.target.value))} min="0" className="w-full px-2 py-1 border rounded-lg" />
                                    <select value={discountType} onChange={e => setDiscountType(e.target.value as any)} className="px-2 py-1 border rounded-lg text-sm">
                                        <option value="amount">VNĐ</option>
                                        <option value="percentage">%</option>
                                    </select>
                                    <span className="font-semibold text-red-600 ml-auto shrink-0">- {calculatedDiscount.toLocaleString('vi-VN')}đ</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-600 shrink-0">Thuế (VAT):</span>
                                    <select value={formData.taxRate} onChange={e => setFormData({...formData, taxRate: parseFloat(e.target.value)})} className="w-full px-2 py-1 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500">
                                        {taxRates.map(rate => <option key={rate.id} value={rate.rate}>{rate.name}</option>)}
                                    </select>
                                     <span className="font-semibold text-slate-700 ml-auto shrink-0">+ {calculatedTax.toLocaleString('vi-VN')}đ</span>
                                </div>
                                <div className="flex justify-between items-center text-xl font-bold border-t pt-2"><span className="text-slate-800">Thành tiền:</span><span className="text-primary-600">{finalTotal.toLocaleString('vi-VN')}đ</span></div>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end p-5 border-t bg-slate-50 space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 rounded-lg">Hủy</button>
                        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg">Lưu Báo giá</button>
                    </div>
                </form>
            </div>
            <BarcodeScannerModal isOpen={isScannerOpen} onClose={() => setScannerOpen(false)} onScanSuccess={handleScan} />
        </>
    );
};

export default QuotationModal;