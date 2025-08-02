import React, { useState } from 'react';
import { PurchaseOrder, PurchaseOrderStatus, PaymentStatus, CompanySettings, NavView } from '../types';
import RecordPaymentModal from './RecordPaymentModal';
import { useConfirm } from '../contexts/ConfirmContext';

interface PurchaseOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    purchaseOrder: PurchaseOrder | null;
    onUpdateStatus: (poId: string, status: PurchaseOrderStatus) => void;
    onUpdatePaymentStatus: (poId: string, amountToPay: number) => void;
    companySettings: CompanySettings;
    canPerformActions: boolean;
    onNavigate: (view: NavView, params?: any) => void;
}

const getStatusClass = (status: PurchaseOrderStatus) => {
  switch (status) {
    case PurchaseOrderStatus.Received: return 'bg-green-100 text-green-800';
    case PurchaseOrderStatus.Ordered: return 'bg-blue-100 text-blue-800';
    case PurchaseOrderStatus.Draft: return 'bg-gray-200 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getPaymentStatusClass = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.Paid: return 'bg-green-100 text-green-800';
      case PaymentStatus.Unpaid: return 'bg-yellow-100 text-yellow-800';
      case PaymentStatus.PartiallyPaid: return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({ 
    isOpen, onClose, purchaseOrder, onUpdateStatus, onUpdatePaymentStatus, companySettings, canPerformActions, onNavigate
}) => {
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const confirm = useConfirm();

    if (!isOpen || !purchaseOrder) return null;

    const handlePrint = () => {
        window.print();
    }

    const handleStatusUpdate = async (newStatus: PurchaseOrderStatus) => {
        if (!purchaseOrder) return;
        
        if (newStatus === PurchaseOrderStatus.Received) {
             const isConfirmed = await confirm({
                title: 'Xác nhận Nhận hàng',
                message: 'Bạn có chắc chắn muốn xác nhận đã nhận đủ hàng? Hành động này sẽ cập nhật tồn kho.',
                confirmText: 'Xác nhận',
            });
            if (isConfirmed) {
                onUpdateStatus(purchaseOrder.id, newStatus);
                onClose(); // Close modal after action
            }
        } else {
             onUpdateStatus(purchaseOrder.id, newStatus);
             onClose(); // Also close for other status updates like 'Ordered'
        }
    };

    const handleSavePayment = (amount: number) => {
        onUpdatePaymentStatus(purchaseOrder.id, amount);
        setPaymentModalOpen(false);
        onClose(); // Close the detail modal after payment
    };

    const totalDue = purchaseOrder.total - purchaseOrder.amountPaid;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 printable-area-container">
                <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl flex flex-col max-h-[95vh]">
                    <div className="flex justify-between items-center p-5 border-b no-print">
                        <h3 className="text-xl font-semibold text-gray-800">Chi tiết Đơn Mua Hàng: {purchaseOrder.id}</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl font-light">&times;</button>
                    </div>
                    
                    <div className="flex-grow overflow-y-auto printable-area">
                        <div className="p-6 md:p-8 font-sans">
                            <header className="flex justify-between items-start pb-6 mb-6 border-b">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-800">Nhà cung cấp</h2>
                                    <button onClick={() => { onNavigate('SUPPLIER', { supplierId: purchaseOrder.supplierId }); onClose(); }} className="font-semibold text-gray-700 hover:underline text-left">
                                      {purchaseOrder.supplierName}
                                    </button>
                                </div>
                                <div className="text-right">
                                    <h1 className="text-3xl font-bold uppercase text-gray-800">Đơn Mua Hàng</h1>
                                    <p className="text-sm text-gray-600">Mã PO: <span className="font-semibold text-gray-800">{purchaseOrder.id}</span></p>
                                    <p className="text-sm text-gray-600">Ngày đặt: <span className="font-semibold text-gray-800">{purchaseOrder.orderDate}</span></p>
                                </div>
                            </header>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Giao đến</h3>
                                    <p className="font-bold text-gray-800">{companySettings.name}</p>
                                    <p className="text-sm text-gray-600 mt-1">{companySettings.address}</p>
                                    <p className="text-sm text-gray-600 mt-1">Kho: {purchaseOrder.warehouse}</p>
                                </div>
                                <div className="text-right">
                                     <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Trạng thái</h3>
                                     <span className={`px-3 py-1 text-sm leading-5 font-semibold rounded-full ${getStatusClass(purchaseOrder.status)}`}>
                                        {purchaseOrder.status}
                                    </span>
                                     <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2 mt-2">Thanh toán</h3>
                                     <span className={`px-3 py-1 text-sm leading-5 font-semibold rounded-full ${getPaymentStatusClass(purchaseOrder.paymentStatus)}`}>
                                        {purchaseOrder.paymentStatus}
                                    </span>
                                </div>
                            </div>

                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4 font-semibold uppercase">Sản phẩm</th>
                                        <th className="text-center py-3 px-4 font-semibold uppercase">Số lượng</th>
                                        <th className="text-right py-3 px-4 font-semibold uppercase">Giá nhập</th>
                                        <th className="text-right py-3 px-4 font-semibold uppercase">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {purchaseOrder.items.map(item => (
                                        <tr key={item.productId} className="border-b">
                                            <td className="py-3 px-4">
                                                <button onClick={() => { onNavigate('PRODUCT', { productId: item.productId }); onClose(); }} className="hover:underline text-primary-600 text-left">
                                                    {item.productName}
                                                </button>
                                            </td>
                                            <td className="text-center py-3 px-4">{item.quantity}</td>
                                            <td className="text-right py-3 px-4">{item.cost.toLocaleString('vi-VN')}đ</td>
                                            <td className="text-right py-3 px-4 font-medium">{(item.cost * item.quantity).toLocaleString('vi-VN')}đ</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="font-semibold">
                                        <td colSpan={2}></td>
                                        <td className="text-right py-2 px-4 text-gray-700">Tổng cộng:</td>
                                        <td className="text-right py-2 px-4 text-gray-800">{purchaseOrder.subtotal.toLocaleString('vi-VN')}đ</td>
                                    </tr>
                                     {purchaseOrder.tax > 0 && (
                                        <tr className="font-semibold">
                                            <td colSpan={2}></td>
                                            <td className="text-right py-2 px-4 text-gray-700">Thuế (VAT {purchaseOrder.taxRate}%):</td>
                                            <td className="text-right py-2 px-4 text-gray-800">+ {purchaseOrder.tax.toLocaleString('vi-VN')}đ</td>
                                        </tr>
                                    )}
                                    <tr className="font-bold text-primary-600">
                                        <td colSpan={2}></td>
                                        <td className="text-right py-3 px-4 text-lg border-t-2 border-gray-400">Tổng cộng:</td>
                                        <td className="text-right py-3 px-4 text-lg border-t-2 border-gray-400">{purchaseOrder.total.toLocaleString('vi-VN')}đ</td>
                                    </tr>
                                     {purchaseOrder.amountPaid > 0 &&
                                        <>
                                            <tr className="font-semibold">
                                                <td colSpan={2}></td>
                                                <td className="text-right py-2 px-4 text-gray-700">Đã thanh toán:</td>
                                                <td className="text-right py-2 px-4 text-green-600">{purchaseOrder.amountPaid.toLocaleString('vi-VN')}đ</td>
                                            </tr>
                                            <tr className="font-semibold">
                                                <td colSpan={2}></td>
                                                <td className="text-right py-2 px-4 text-gray-700">Còn lại:</td>
                                                <td className="text-right py-2 px-4 text-red-600">{totalDue.toLocaleString('vi-VN')}đ</td>
                                            </tr>
                                        </>
                                     }
                                </tfoot>
                            </table>

                             <footer className="text-center mt-12 pt-6 border-t text-xs text-gray-500">
                                <p>Cảm ơn sự hợp tác của Quý nhà cung cấp!</p>
                            </footer>
                        </div>
                    </div>

                    <div className="p-5 border-t bg-gray-50 flex justify-between items-center no-print">
                         <div className="flex items-center gap-2">
                             <button onClick={handlePrint} className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700">In</button>
                         </div>
                         <div className="flex items-center gap-2">
                            {canPerformActions && purchaseOrder.status === PurchaseOrderStatus.Draft && (
                                <button onClick={() => handleStatusUpdate(PurchaseOrderStatus.Ordered)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Xác nhận Đặt hàng</button>
                            )}
                            {canPerformActions && purchaseOrder.status === PurchaseOrderStatus.Ordered && (
                                <button onClick={() => handleStatusUpdate(PurchaseOrderStatus.Received)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Xác nhận Đã nhận hàng</button>
                            )}
                             {canPerformActions && purchaseOrder.status === PurchaseOrderStatus.Received && purchaseOrder.paymentStatus !== PaymentStatus.Paid && (
                                <button onClick={() => setPaymentModalOpen(true)} className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">Ghi nhận thanh toán</button>
                            )}
                            <button onClick={onClose} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Đóng</button>
                         </div>
                    </div>
                </div>
            </div>

            {isPaymentModalOpen && (
                <RecordPaymentModal
                    isOpen={isPaymentModalOpen}
                    onClose={() => setPaymentModalOpen(false)}
                    onSave={handleSavePayment}
                    totalDue={totalDue}
                    partyName={purchaseOrder.supplierName}
                />
            )}
        </>
    );
};

export default PurchaseOrderModal;
