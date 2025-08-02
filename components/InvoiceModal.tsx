
import React, { useState } from 'react';
import { Order, OrderStatus, PaymentStatus, Customer, CompanySettings, NavView } from '../types';

const getStatusClass = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.Completed: return 'bg-green-100 text-green-800';
    case OrderStatus.Processing: return 'bg-yellow-100 text-yellow-800';
    case OrderStatus.Pending: return 'bg-blue-100 text-blue-800';
    case OrderStatus.Cancelled: return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

interface InvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
    customers: Customer[];
    companySettings: CompanySettings;
    onNavigate: (view: NavView, params?: any) => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, order, customers, companySettings, onNavigate }) => {
    const [viewMode, setViewMode] = useState<'invoice' | 'delivery'>('invoice');

    if (!isOpen || !order) return null;

    const customer = customers.find(c => c.id === order.customerId);

    const handlePrint = () => {
        window.print();
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 printable-area-container">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl flex flex-col max-h-[95vh]">
                <div className="flex justify-between items-center p-5 border-b no-print">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-800">Chi tiết đơn hàng: {order.id}</h3>
                        <div className="mt-2 flex items-center space-x-1 p-1 bg-gray-200 rounded-lg">
                            <button onClick={() => setViewMode('invoice')} className={`px-3 py-1 text-sm rounded-md ${viewMode === 'invoice' ? 'bg-white shadow' : ''}`}>Hóa đơn</button>
                            <button onClick={() => setViewMode('delivery')} className={`px-3 py-1 text-sm rounded-md ${viewMode === 'delivery' ? 'bg-white shadow' : ''}`}>Phiếu Giao Hàng</button>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl font-light">&times;</button>
                </div>
                
                <div className="flex-grow overflow-y-auto printable-area">
                    <div className="p-6 md:p-8 font-sans">
                        <header className="flex justify-between items-start pb-6 mb-6 border-b">
                            <div className="flex items-center gap-4">
                                {companySettings.logoUrl ? (
                                    <img src={companySettings.logoUrl} alt="Company Logo" className="w-16 h-16 object-contain" />
                                ) : (
                                    <svg className="w-16 h-16 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                                    </svg>
                                )}
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{companySettings.name}</h1>
                                    <p className="text-sm text-gray-500">{companySettings.address}</p>
                                    <p className="text-sm text-gray-500">{companySettings.email} | {companySettings.phone}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h2 className="text-3xl font-bold uppercase text-gray-800">{viewMode === 'invoice' ? 'Hoá Đơn' : 'Phiếu Giao Hàng'}</h2>
                                <p className="text-sm text-gray-600">Mã ĐH: <span className="font-semibold text-gray-800">{order.id}</span></p>
                                <p className="text-sm text-gray-600">Ngày: <span className="font-semibold text-gray-800">{order.date}</span></p>
                            </div>
                        </header>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Thông tin khách hàng:</h3>
                                <p className="text-lg font-bold text-gray-800">{order.customerName}</p>
                                {customer && <p className="text-sm text-gray-600 mt-1">{customer.address}</p>}
                                {viewMode === 'invoice' && <p className="text-sm text-gray-600 mt-1">Phương thức TT: <span className="font-semibold">{order.paymentMethod}</span></p>}
                            </div>
                            <div className="text-right flex flex-col items-end">
                                <div className="mb-2">
                                     <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Trạng thái đơn hàng:</h3>
                                     <span className={`px-3 py-1 text-sm leading-5 font-semibold rounded-full ${getStatusClass(order.status)}`}>
                                        {order.status}
                                    </span>
                                </div>
                                {viewMode === 'invoice' && (
                                    order.paymentStatus === PaymentStatus.Paid ? (
                                        <div className="mt-2 text-xl font-bold text-green-600 border-2 border-green-600 rounded-md py-1 px-3 inline-block transform -rotate-6">
                                            ĐÃ THANH TOÁN
                                        </div>
                                    ) : (
                                        <div className="mt-2 text-xl font-bold text-red-600 border-2 border-red-600 rounded-md py-1 px-3 inline-block transform -rotate-6">
                                            CHƯA THANH TOÁN
                                        </div>
                                    )
                                )}
                            </div>
                        </div>

                        <div>
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4 font-semibold uppercase">Sản phẩm</th>
                                        <th className="text-center py-3 px-4 font-semibold uppercase">Số lượng</th>
                                        {viewMode === 'invoice' && <th className="text-right py-3 px-4 font-semibold uppercase">Đơn giá</th>}
                                        {viewMode === 'invoice' && <th className="text-right py-3 px-4 font-semibold uppercase">Thành tiền</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.items.map(item => (
                                        <tr key={item.productId} className="border-b">
                                            <td className="py-3 px-4">
                                                <button onClick={() => { onNavigate('PRODUCT', { productId: item.productId }); onClose(); }} className="hover:underline text-primary-600 text-left">
                                                  {item.productName}
                                                </button>
                                            </td>
                                            <td className="text-center py-3 px-4">{item.quantity}</td>
                                            {viewMode === 'invoice' && <td className="text-right py-3 px-4">{item.price.toLocaleString('vi-VN')}đ</td>}
                                            {viewMode === 'invoice' && <td className="text-right py-3 px-4 font-medium">{(item.price * item.quantity).toLocaleString('vi-VN')}đ</td>}
                                        </tr>
                                    ))}
                                </tbody>
                                {viewMode === 'invoice' && (
                                    <tfoot>
                                        <tr className="font-semibold">
                                            <td colSpan={2}></td>
                                            <td className="text-right py-2 px-4 text-gray-700">Tổng cộng:</td>
                                            <td className="text-right py-2 px-4 text-gray-800">{order.subtotal.toLocaleString('vi-VN')}đ</td>
                                        </tr>
                                        {order.discount > 0 && (
                                            <tr className="font-semibold">
                                                <td colSpan={2}></td>
                                                <td className="text-right py-2 px-4 text-gray-700">Chiết khấu:</td>
                                                <td className="text-right py-2 px-4 text-gray-800">- {order.discount.toLocaleString('vi-VN')}đ</td>
                                            </tr>
                                        )}
                                        {order.tax > 0 && (
                                             <tr className="font-semibold">
                                                <td colSpan={2}></td>
                                                <td className="text-right py-2 px-4 text-gray-700">Thuế (VAT {order.taxRate}%):</td>
                                                <td className="text-right py-2 px-4 text-gray-800">+ {order.tax.toLocaleString('vi-VN')}đ</td>
                                            </tr>
                                        )}
                                        <tr className="font-bold text-primary-600">
                                            <td colSpan={2}></td>
                                            <td className="text-right py-3 px-4 text-lg border-t-2 border-gray-400">Thanh toán:</td>
                                            <td className="text-right py-3 px-4 text-lg border-t-2 border-gray-400">{order.total.toLocaleString('vi-VN')}đ</td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                        
                        <footer className="text-center mt-12 pt-6 border-t text-xs text-gray-500">
                            <p>{companySettings.invoiceFooter}</p>
                             {viewMode === 'invoice' && <p className="mt-1">Vui lòng kiểm tra hàng hóa trước khi thanh toán.</p>}
                             {viewMode === 'delivery' && <p className="mt-1">Người nhận vui lòng kiểm tra số lượng và tình trạng sản phẩm khi nhận hàng.</p>}
                        </footer>
                    </div>
                </div>

                <div className="p-5 border-t bg-gray-50 text-right space-x-2 no-print">
                    <button onClick={handlePrint} className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex-shrink-0 inline-flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                        <span>In chứng từ</span>
                    </button>
                    <button onClick={onClose} className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">Đóng</button>
                </div>
            </div>
        </div>
    );
};

export default InvoiceModal;
