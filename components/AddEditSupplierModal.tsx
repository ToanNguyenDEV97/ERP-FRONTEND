import React, { useState, useEffect } from 'react';
import { Supplier } from '../types';

interface AddEditSupplierModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (supplier: Omit<Supplier, 'id'>) => void;
    supplierToEdit?: Supplier | null;
}

const AddEditSupplierModal: React.FC<AddEditSupplierModalProps> = ({ isOpen, onClose, onSave, supplierToEdit }) => {
    const [name, setName] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');

    useEffect(() => {
        if (supplierToEdit) {
            setName(supplierToEdit.name);
            setContactPerson(supplierToEdit.contactPerson);
            setEmail(supplierToEdit.email);
            setPhone(supplierToEdit.phone);
            setAddress(supplierToEdit.address);
        } else {
            setName(''); setContactPerson(''); setEmail(''); setPhone(''); setAddress('');
        }
    }, [supplierToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, contactPerson, email, phone, address });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 modal-content-container">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-2xl w-full sm:max-w-lg modal-content">
                <div className="flex justify-between items-center p-5 border-b border-slate-200">
                    <h3 className="text-xl font-semibold text-slate-800">{supplierToEdit ? 'Chỉnh sửa nhà cung cấp' : 'Thêm nhà cung cấp'}</h3>
                    <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-3xl font-light">&times;</button>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tên nhà cung cấp</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Người liên hệ</label>
                        <input type="text" value={contactPerson} onChange={e => setContactPerson(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Điện thoại</label>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ</label>
                        <input type="text" value={address} onChange={e => setAddress(e.target.value)} required className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                </div>
                <div className="flex justify-end p-5 border-t bg-slate-50 rounded-b-lg space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors">Hủy</button>
                    <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">Lưu</button>
                </div>
            </form>
        </div>
    );
};

export default AddEditSupplierModal;
