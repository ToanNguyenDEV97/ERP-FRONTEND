import React, { useState, useEffect } from 'react';
import { useAddressConfirmationState } from '../contexts/AddressConfirmContext';
import { useToast } from '../contexts/ToastContext';

const PencilIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block ml-1 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" />
    </svg>
);

const AddressConfirmationModal: React.FC = () => {
    const { confirmationState, resolveConfirmation } = useAddressConfirmationState();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const { addToast } = useToast();

    useEffect(() => {
        if (confirmationState?.customer) {
            setName(confirmationState.customer.name || '');
            setPhone(confirmationState.customer.phone || '');
            setAddress(confirmationState.customer.address || '');
        }
    }, [confirmationState]);

    if (!confirmationState) return null;

    const { order, customer } = confirmationState;

    const handleConfirm = () => {
        if (!name.trim() || !phone.trim() || !address.trim()) {
            addToast('Vui lòng điền đầy đủ tên, số điện thoại và địa chỉ.', 'error');
            return;
        }
        resolveConfirmation({
            name: name.trim(),
            phone: phone.trim(),
            address: address.trim(),
        });
    };

    const handleCancel = () => {
        resolveConfirmation(null);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[99] flex justify-center items-center p-4 modal-content-container" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg modal-content">
                <div className="p-6">
                    <div className="flex items-start">
                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 sm:mx-0 sm:h-10 sm:w-10">
                            <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 16.382V5.618a1 1 0 00-1.447-.894L15 7m0 10V7m0 0L9 4" />
                            </svg>
                        </div>
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-slate-100" id="modal-title">
                                Xác nhận thông tin giao hàng
                            </h3>
                            <div className="mt-4 space-y-4">
                                <p className="text-sm text-gray-600 dark:text-slate-300">
                                    Vui lòng kiểm tra và cập nhật (nếu cần) thông tin cho đơn hàng <strong className="text-gray-800 dark:text-slate-100">{order.id}</strong>.
                                </p>
                                
                                <div className="space-y-4">
                                     <div>
                                        <label htmlFor="customer-name" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                                            Tên khách hàng <PencilIcon />
                                        </label>
                                        <input
                                            id="customer-name"
                                            type="text"
                                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Nhập tên khách hàng"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="customer-phone" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                                            Số điện thoại <PencilIcon />
                                        </label>
                                        <input
                                            id="customer-phone"
                                            type="tel"
                                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="Nhập số điện thoại"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="delivery-address" className="block text-sm font-medium text-gray-700 dark:text-slate-300">
                                            Địa chỉ giao hàng <PencilIcon />
                                        </label>
                                        <textarea
                                            id="delivery-address"
                                            rows={3}
                                            className="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            placeholder="Nhập địa chỉ chi tiết (số nhà, đường, phường/xã, quận/huyện, tỉnh/TP)"
                                        />
                                         {(!customer.address || customer.address.trim() === 'Tại cửa hàng') && (
                                            <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">Khách hàng này chưa có địa chỉ. Vui lòng cập nhật.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 dark:bg-slate-800/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
                    <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm"
                        onClick={handleConfirm}
                    >
                        Xác nhận và Giao hàng
                    </button>
                    <button
                        type="button"
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-slate-600 shadow-sm px-4 py-2 bg-white dark:bg-slate-700 text-base font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        onClick={handleCancel}
                    >
                        Hủy
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddressConfirmationModal;
