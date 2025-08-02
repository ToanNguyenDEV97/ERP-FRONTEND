import React from 'react';
import { JournalEntry, Customer, Supplier, CompanySettings } from '../types';
import { docTienBangChu } from '../utils';

interface PaymentVoucherModalProps {
    isOpen: boolean;
    onClose: () => void;
    voucherInfo: {
        transaction: JournalEntry;
        party: Customer | Supplier;
        type: 'thu' | 'chi';
    };
    companySettings: CompanySettings;
}

const PaymentVoucherModal: React.FC<PaymentVoucherModalProps> = ({ isOpen, onClose, voucherInfo, companySettings }) => {
    if (!isOpen) return null;

    const { transaction, party, type } = voucherInfo;
    const amount = transaction.lines.reduce((sum, line) => sum + line.debit, 0);


    const handlePrint = () => {
        window.print();
    };
    
    const amountInWords = docTienBangChu(amount) + " đồng chẵn";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex justify-center items-center p-4 printable-area-container">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-3xl flex flex-col max-h-[95vh]">
                <div className="flex justify-between items-center p-5 border-b dark:border-slate-700 no-print">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-slate-100">
                        {type === 'thu' ? 'Phiếu Thu' : 'Phiếu Chi'} - {transaction.id}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200 text-3xl font-light">&times;</button>
                </div>

                <div className="flex-grow overflow-y-auto printable-area bg-white">
                    <div className="p-8 font-serif text-sm text-black">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-bold">{companySettings.name}</h4>
                                <p>{companySettings.address}</p>
                            </div>
                            <div className="text-center">
                                <p className="font-bold">Mẫu số 01 - TT</p>
                                <p className="text-xs">(Ban hành theo Thông tư số 200/2014/TT-BTC ngày 22/12/2014 của Bộ Tài chính)</p>
                            </div>
                        </div>

                        <div className="text-center my-6">
                            <h2 className="text-3xl font-bold uppercase">{type === 'thu' ? 'Phiếu Thu' : 'Phiếu Chi'}</h2>
                            <p className="font-medium">Ngày {new Date(transaction.date).getDate()} tháng {new Date(transaction.date).getMonth() + 1} năm {new Date(transaction.date).getFullYear()}</p>
                            <div className="flex justify-center items-center gap-4 mt-1">
                                <span>Số: {transaction.id}</span>
                                <div className="text-left text-xs">
                                    <p>Nợ: {type === 'thu' ? '111, 112' : '331'}</p>
                                    <p>Có: {type === 'thu' ? '131, 511' : '111, 112'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex">
                                <span className="w-48 inline-block font-medium shrink-0">Họ và tên người {type === 'thu' ? 'nộp' : 'nhận'} tiền:</span> 
                                <span className="border-b border-dotted border-black flex-grow">{party.name}</span>
                            </div>
                             <div className="flex">
                                <span className="w-48 inline-block font-medium shrink-0">Địa chỉ:</span> 
                                <span className="border-b border-dotted border-black flex-grow">{party.address}</span>
                            </div>
                              <div className="flex">
                                <span className="w-48 inline-block font-medium shrink-0">Lý do {type === 'thu' ? 'nộp' : 'chi'}:</span> 
                                <span className="border-b border-dotted border-black flex-grow">{transaction.description}</span>
                            </div>
                            <div className="flex">
                                <span className="w-48 inline-block font-medium shrink-0">Số tiền:</span> 
                                <span className="border-b border-dotted border-black flex-grow font-bold">{amount.toLocaleString('vi-VN')} VNĐ</span>
                            </div>
                             <div className="flex">
                                <span className="w-48 inline-block font-medium shrink-0">(Viết bằng chữ):</span> 
                                <span className="border-b border-dotted border-black flex-grow italic font-medium">{amountInWords}.</span>
                            </div>
                             <div className="flex">
                                <span className="w-48 inline-block font-medium shrink-0">Kèm theo:</span> 
                                <span className="border-b border-dotted border-black flex-grow">........................................... Chứng từ gốc.</span>
                            </div>
                        </div>
                        
                        <div className="mt-12 grid grid-cols-5 gap-4 text-center font-bold">
                            <div>
                                <p>Giám đốc</p>
                                <p className="italic text-xs font-normal">(Ký, họ tên, đóng dấu)</p>
                            </div>
                             <div>
                                <p>Kế toán trưởng</p>
                                <p className="italic text-xs font-normal">(Ký, họ tên)</p>
                            </div>
                            <div>
                                <p>Người lập phiếu</p>
                                <p className="italic text-xs font-normal">(Ký, họ tên)</p>
                            </div>
                             <div>
                                <p>{type === 'thu' ? 'Người nộp tiền' : 'Người nhận tiền'}</p>
                                <p className="italic text-xs font-normal">(Ký, họ tên)</p>
                            </div>
                             <div>
                                <p>Thủ quỹ</p>
                                <p className="italic text-xs font-normal">(Ký, họ tên)</p>
                            </div>
                        </div>
                         <div className="mt-8">
                             <p className="italic">Đã {type === 'thu' ? 'nhận' : 'nhận'} đủ số tiền (viết bằng chữ): <strong className="not-italic">{amountInWords}.</strong></p>
                         </div>
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

export default PaymentVoucherModal;