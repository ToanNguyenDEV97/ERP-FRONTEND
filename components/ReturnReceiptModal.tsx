import React from 'react';
import { SalesReturn, Order, Customer, CompanySettings } from '../types';
import { docTienBangChu } from '../utils';

interface ReturnReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    salesReturn: SalesReturn | null;
    order: Order | undefined;
    customer: Customer | undefined;
    companySettings: CompanySettings;
}

const ReturnReceiptModal: React.FC<ReturnReceiptModalProps> = ({ isOpen, onClose, salesReturn, order, customer, companySettings }) => {
    if (!isOpen || !salesReturn) return null;

    const handlePrint = () => {
        window.print();
    };

    const amountInWords = docTienBangChu(salesReturn.totalRefund) + " đồng.";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex justify-center items-center p-4 printable-area-container">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl flex flex-col max-h-[95vh]">
                <div className="flex justify-between items-center p-5 border-b dark:border-slate-700 no-print">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-slate-100">
                        Phiếu Trả Hàng - {salesReturn.id}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200 text-3xl font-light">&times;</button>
                </div>

                <div className="flex-grow overflow-y-auto printable-area bg-white">
                    <div className="p-8 font-sans text-sm text-black">
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
                                    <h1 className="text-xl font-bold text-gray-900">{companySettings.name}</h1>
                                    <p className="text-xs text-gray-500">{companySettings.address}</p>
                                    <p className="text-xs text-gray-500">{companySettings.email} | {companySettings.phone}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h2 className="text-3xl font-bold uppercase text-gray-800">Phiếu Trả Hàng</h2>
                                <p className="text-sm text-gray-600">Số: <span className="font-semibold text-gray-800">{salesReturn.id}</span></p>
                                <p className="text-sm text-gray-600">Ngày: <span className="font-semibold text-gray-800">{salesReturn.date}</span></p>
                            </div>
                        </header>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">Thông tin khách hàng:</h3>
                                <p className="text-lg font-bold text-gray-800">{salesReturn.customerName}</p>
                                {customer && <p className="text-sm text-gray-600 mt-1">{customer.address}</p>}
                                <p className="text-sm text-gray-600 mt-1">Đơn hàng gốc: <span className="font-semibold">{salesReturn.originalOrderId}</span></p>
                            </div>
                        </div>

                        <div>
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4 font-semibold uppercase">Sản phẩm</th>
                                        <th className="text-center py-3 px-4 font-semibold uppercase">Số lượng trả</th>
                                        <th className="text-right py-3 px-4 font-semibold uppercase">Đơn giá</th>
                                        <th className="text-right py-3 px-4 font-semibold uppercase">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {salesReturn.items.map(item => (
                                        <tr key={item.productId} className="border-b">
                                            <td className="py-3 px-4">{item.productName}</td>
                                            <td className="text-center py-3 px-4">{item.quantity}</td>
                                            <td className="text-right py-3 px-4">{item.price.toLocaleString('vi-VN')}đ</td>
                                            <td className="text-right py-3 px-4 font-medium">{(item.price * item.quantity).toLocaleString('vi-VN')}đ</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="font-bold text-primary-600">
                                        <td colSpan={2}></td>
                                        <td className="text-right py-3 px-4 text-lg border-t-2 border-gray-400">Tổng tiền hoàn trả:</td>
                                        <td className="text-right py-3 px-4 text-lg border-t-2 border-gray-400">{salesReturn.totalRefund.toLocaleString('vi-VN')}đ</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <p className="mt-4 text-sm"><i>(Bằng chữ: {amountInWords})</i></p>

                        <div className="mt-16 grid grid-cols-3 gap-4 text-center font-semibold">
                            <div>
                                <p>Khách hàng</p>
                                <p className="italic text-xs font-normal">(Ký, họ tên)</p>
                            </div>
                            <div>
                                <p>Nhân viên kho</p>
                                <p className="italic text-xs font-normal">(Ký, họ tên)</p>
                            </div>
                            <div>
                                <p>Người lập phiếu</p>
                                <p className="italic text-xs font-normal">(Ký, họ tên)</p>
                            </div>
                        </div>

                        <footer className="text-center mt-12 pt-6 border-t text-xs text-gray-500">
                            <p>{companySettings.invoiceFooter}</p>
                        </footer>
                    </div>
                </div>

                <div className="p-5 border-t bg-gray-50 dark:bg-slate-800/50 text-right space-x-2 no-print">
                    <button onClick={handlePrint} className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">In Phiếu</button>
                    <button onClick={onClose} className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Đóng</button>
                </div>
            </div>
        </div>
    );
};

export default ReturnReceiptModal;
