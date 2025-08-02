import React, { useState, useEffect } from 'react';
import { Warehouse } from '../types';

interface AddEditWarehouseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (warehouse: { name: string }) => void;
    warehouseToEdit: Warehouse | null;
}

const AddEditWarehouseModal: React.FC<AddEditWarehouseModalProps> = ({ isOpen, onClose, onSave, warehouseToEdit }) => {
    const [name, setName] = useState('');

    useEffect(() => {
        if (isOpen) {
            setName(warehouseToEdit ? warehouseToEdit.name : '');
        }
    }, [isOpen, warehouseToEdit]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSave({ name: name.trim() });
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[51] flex justify-center items-center p-4 modal-content-container">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-2xl w-full max-w-md modal-content">
                <div className="flex justify-between items-center p-5 border-b border-slate-200">
                    <h3 className="text-xl font-semibold text-slate-800">{warehouseToEdit ? 'Chỉnh sửa Kho hàng' : 'Thêm Kho hàng mới'}</h3>
                    <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-3xl font-light">&times;</button>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tên kho<span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Ví dụ: Kho chính, Kho Hà Nội"
                            autoFocus
                        />
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

export default AddEditWarehouseModal;
