import React, { useState, useEffect } from 'react';
import { Product, Supplier, ProductType } from '../types';
import { useToast } from '../contexts/ToastContext';

interface AddEditProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (product: Omit<Product, 'id'> | Product) => void;
    productToEdit?: Product | null;
    suppliers: Supplier[];
    onAddNewSupplier: () => void;
}

const AddEditProductModal: React.FC<AddEditProductModalProps> = ({ 
    isOpen, onClose, onSave, productToEdit, suppliers, 
    onAddNewSupplier
}) => {
    const { addToast } = useToast();
    const [formData, setFormData] = useState<Omit<Product, 'id' | 'imageUrl'>>({
        name: '', sku: '', price: 0, cost: 0, supplierId: '',
        minStock: 10, productType: ProductType.Standard, category: ''
    });

    useEffect(() => {
        if (productToEdit) {
            const { imageUrl, ...rest } = productToEdit;
            setFormData(rest);
        } else {
            setFormData({
                name: '', sku: '', price: 0, cost: 0, supplierId: '',
                minStock: 10, productType: ProductType.Standard, category: ''
            });
        }
    }, [productToEdit, isOpen]);


    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const type = e.target.getAttribute('type');

        const newFormData: any = { ...formData, [name]: type === 'number' ? parseFloat(value) : value };

        // Logic to adjust fields based on product type
        if (name === 'productType') {
            if (value === ProductType.FinishedGood) {
                newFormData.cost = 0;
                newFormData.supplierId = '';
            } else if (value === ProductType.RawMaterial) {
                newFormData.price = 0;
            }
        }

        setFormData(newFormData);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const isSupplierRequired = formData.productType === ProductType.Standard || formData.productType === ProductType.RawMaterial;
        if(!formData.name || !formData.sku || (isSupplierRequired && !formData.supplierId)) {
            addToast("Vui lòng điền đầy đủ các trường bắt buộc (Tên, SKU, Nhà cung cấp).", "error", "Thông tin không hợp lệ");
            return;
        }
        onSave(productToEdit ? { ...productToEdit, ...formData } : formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 modal-content-container">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col modal-content">
                <div className="flex justify-between items-center p-5 border-b">
                    <h3 className="text-xl font-semibold text-gray-800">{productToEdit ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</h3>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl font-light">&times;</button>
                </div>
                <div className="p-5 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm*</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">SKU*</label>
                            <input type="text" name="sku" value={formData.sku} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Loại sản phẩm*</label>
                            <select name="productType" value={formData.productType} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                                {Object.values(ProductType).map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Giá bán (VNĐ)</label>
                            <input type="number" name="price" value={formData.price} onChange={handleChange} required disabled={formData.productType === ProductType.RawMaterial} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Giá nhập (VNĐ)</label>
                            <input type="number" name="cost" value={formData.cost} onChange={handleChange} required disabled={formData.productType === ProductType.FinishedGood} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nhà cung cấp*</label>
                            <div className="flex items-center gap-2">
                                <select name="supplierId" value={formData.supplierId} onChange={handleChange} required disabled={formData.productType === ProductType.FinishedGood} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-slate-100">
                                    <option value="" disabled>Chọn NCC</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                                <button type="button" onClick={onAddNewSupplier} className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 shrink-0" disabled={formData.productType === ProductType.FinishedGood}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                </button>
                            </div>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tồn kho tối thiểu</label>
                            <input type="number" name="minStock" value={formData.minStock} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                            <input type="text" name="category" value={formData.category || ''} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                        </div>
                    </div>
                </div>
                <div className="flex justify-end p-5 border-t bg-gray-50 rounded-b-lg space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Hủy</button>
                    <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Lưu</button>
                </div>
            </form>
        </div>
    );
};

export default AddEditProductModal;