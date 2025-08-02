import React, { useState, useEffect } from 'react';
import { Customer } from '../types';

interface AddEditCustomerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (customer: Omit<Customer, 'id' | 'since'>) => void;
    customerToEdit?: Customer | null;
}

const AddEditCustomerModal: React.FC<AddEditCustomerModalProps> = ({ isOpen, onClose, onSave, customerToEdit }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [type, setType] = useState<'B2C' | 'B2B'>('B2C');

    useEffect(() => {
        if (customerToEdit) {
            setName(customerToEdit.name);
            setEmail(customerToEdit.email);
            setPhone(customerToEdit.phone);
            setAddress(customerToEdit.address);
            setType(customerToEdit.type);
        } else {
            setName(''); setEmail(''); setPhone(''); setAddress(''); setType('B2C');
        }
    }, [customerToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, email, phone, address, type });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[51] flex justify-center items-center p-4 modal-content-container">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-2xl w-full sm:max-w-md modal-content">
                <div className="flex justify-between items-center p-5 border-b border-slate-200">
                    <h3 className="text-xl font-semibold text-slate-800">{customerToEdit ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}</h3>
                    <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-3xl font-light">&times;</button>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tên khách hàng<span className="text-red-500">*</span></label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Điện thoại<span className="text-red-500">*</span></label>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ</label>
                        <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phân loại</label>
                        <select value={type} onChange={e => setType(e.target.value as 'B2C' | 'B2B')} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                            <option value="B2C">Cá nhân (B2C)</option>
                            <option value="B2B">Doanh nghiệp (B2B)</option>
                        </select>
                    </div>
                </div>
                <div className="flex justify-end p-5 border-t border-slate-200 bg-slate-50 rounded-b-lg space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors">Hủy</button>
                    <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">Lưu</button>
                </div>
            </form>
        </div>
    );
};

export default AddEditCustomerModal;