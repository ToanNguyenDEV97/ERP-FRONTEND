import React, { useState, useEffect, useMemo } from 'react';
import { Order, SalesReturn, SalesReturnItem } from '../types';
import { useToast } from '../contexts/ToastContext';

interface ReturnModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
    onSaveReturn: (order: Order, itemsToReturn: SalesReturnItem[], totalRefund: number) => void;
    salesReturns: SalesReturn[];
}

const ReturnModal: React.FC<ReturnModalProps> = ({ isOpen, onClose, order, onSaveReturn, salesReturns }) => {
    const { addToast } = useToast();
    const [itemsToReturn, setItemsToReturn] = useState<Record<string, number>>({});

    const previouslyReturnedQuantities = useMemo(() => {
        if (!order) return {};
        const relevantReturns = salesReturns.filter(r => r.originalOrderId === order.id);
        const quantities: Record<string, number> = {};
        for (const item of order.items) {
            quantities[item.productId] = relevantReturns.reduce((sum, currentReturn) => {
                const returnedItem = currentReturn.items.find(ri => ri.productId === item.productId);
                return sum + (returnedItem ? returnedItem.quantity : 0);
            }, 0);
        }
        return quantities;
    }, [order, salesReturns]);

    useEffect(() => {
        if (isOpen && order) {
            // Initialize itemsToReturn with 0 for each product
            const initialQuantities: Record<string, number> = {};
            order.items.forEach(item => {
                initialQuantities[item.productId] = 0;
            });
            setItemsToReturn(initialQuantities);
        }
    }, [isOpen, order]);

    const handleQuantityChange = (productId: string, value: string, max: number) => {
        const newQuantity = parseInt(value, 10);
        if (isNaN(newQuantity)) {
            setItemsToReturn(prev => ({ ...prev, [productId]: 0 }));
        } else if (newQuantity < 0) {
            setItemsToReturn(prev => ({ ...prev, [productId]: 0 }));
        } else if (newQuantity > max) {
            addToast(`Số lượng trả không thể vượt quá ${max}`, 'warning');
            setItemsToReturn(prev => ({ ...prev, [productId]: max }));
        } else {
            setItemsToReturn(prev => ({ ...prev, [productId]: newQuantity }));
        }
    };

    const totalRefund = useMemo(() => {
        if (!order) return 0;
        return order.items.reduce((sum, item) => {
            const quantityToReturn = itemsToReturn[item.productId] || 0;
            return sum + (quantityToReturn * item.price);
        }, 0);
    }, [order, itemsToReturn]);
    
    const handleSubmit = () => {
        if (!order) return;
        
        const finalItemsToReturn: SalesReturnItem[] = Object.entries(itemsToReturn)
            .filter(([, quantity]) => quantity > 0)
            .map(([productId, quantity]) => {
                const originalItem = order.items.find(item => item.productId === productId);
                return {
                    productId,
                    productName: originalItem?.productName || 'N/A',
                    quantity,
                    price: originalItem?.price || 0,
                };
            });

        if (finalItemsToReturn.length === 0) {
            addToast('Vui lòng nhập số lượng cho ít nhất một sản phẩm cần trả.', 'error');
            return;
        }

        onSaveReturn(order, finalItemsToReturn, totalRefund);
        onClose();
    };

    if (!isOpen || !order) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex justify-center items-center p-4 modal-content-container">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col modal-content">
                <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Tạo Phiếu Trả Hàng cho Đơn Hàng #{order.id}</h3>
                    <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 text-3xl font-light">&times;</button>
                </div>

                <div className="p-5 space-y-4 flex-grow overflow-y-auto">
                    <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 px-2">
                        <div className="col-span-4">Sản phẩm</div>
                        <div className="col-span-2 text-right">Đơn giá</div>
                        <div className="col-span-2 text-center">Đã mua</div>
                        <div className="col-span-2 text-center">Đã trả</div>
                        <div className="col-span-2 text-center">Số lượng trả</div>
                    </div>
                    <div className="space-y-2">
                        {order.items.map(item => {
                            const previouslyReturned = previouslyReturnedQuantities[item.productId] || 0;
                            const maxReturnable = item.quantity - previouslyReturned;
                            return (
                                <div key={item.productId} className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <div className="col-span-4 text-sm font-medium text-slate-800 dark:text-slate-200">{item.productName}</div>
                                    <div className="col-span-2 text-right text-sm text-slate-600 dark:text-slate-300">{item.price.toLocaleString('vi-VN')}đ</div>
                                    <div className="col-span-2 text-center text-sm">{item.quantity}</div>
                                    <div className="col-span-2 text-center text-sm text-red-600">{previouslyReturned}</div>
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            value={itemsToReturn[item.productId] || 0}
                                            onChange={(e) => handleQuantityChange(item.productId, e.target.value, maxReturnable)}
                                            min="0"
                                            max={maxReturnable}
                                            disabled={maxReturnable <= 0}
                                            className="w-full px-2 py-1 text-center border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 disabled:bg-slate-100 dark:disabled:bg-slate-600"
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-lg flex justify-between items-center">
                    <p className="text-lg font-bold">Tổng tiền hoàn trả: <span className="text-primary-600">{totalRefund.toLocaleString('vi-VN')}đ</span></p>
                    <div className="space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">Hủy</button>
                        <button type="button" onClick={handleSubmit} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">Xác nhận Trả hàng</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReturnModal;
