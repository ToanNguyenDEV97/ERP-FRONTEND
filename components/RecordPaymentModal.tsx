import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';

interface RecordPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (amount: number) => void;
    totalDue: number;
    partyName: string;
}

const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({ isOpen, onClose, onSave, totalDue, partyName }) => {
    const [amount, setAmount] = useState(totalDue);
    const { addToast } = useToast();

    useEffect(() => {
        if (isOpen) {
            setAmount(totalDue);
        }
    }, [isOpen, totalDue]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (amount <= 0 || amount > totalDue) {
            addToast(`Số tiền thanh toán phải lớn hơn 0 và không vượt quá số nợ còn lại (${totalDue.toLocaleString('vi-VN')}đ).`, 'error');
            return;
        }
        onSave(amount);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex justify-center items-center p-4 modal-content-container">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-md modal-content">
                <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Ghi nhận thanh toán</h3>
                    <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 text-3xl font-light">&times;</button>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Khách hàng</label>
                        <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">{partyName}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Số tiền còn nợ</label>
                        <p className="mt-1 text-base font-bold text-red-600">{totalDue.toLocaleString('vi-VN')}đ</p>
                    </div>
                    <div>
                        <label htmlFor="payment-amount" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Số tiền thanh toán<span className="text-red-500">*</span></label>
                        <input
                            id="payment-amount"
                            type="number"
                            value={amount}
                            onChange={e => setAmount(parseFloat(e.target.value))}
                            required
                            min="1"
                            max={totalDue}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </div>
                <div className="flex justify-end p-5 border-t bg-slate-50 dark:bg-slate-800/50 rounded-b-lg space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Hủy</button>
                    <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">Lưu thanh toán</button>
                </div>
            </form>
        </div>
    );
};

export default RecordPaymentModal;
