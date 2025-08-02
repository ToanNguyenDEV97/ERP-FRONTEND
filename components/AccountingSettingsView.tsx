import React, { useState, useEffect } from 'react';
import { AccountingPeriod, TaxRate, Account, AccountType } from '../types';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';

interface AccountingSettingsViewProps {
    accountingPeriods: AccountingPeriod[];
    taxRates: TaxRate[];
    chartOfAccounts: Account[];
    onUpdateAccountingPeriods: (periods: AccountingPeriod[]) => void;
    onUpdateTaxRates: (rates: TaxRate[]) => void;
    onUpdateChartOfAccounts: (accounts: Account[]) => void;
}

const AddEditAccountModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (account: Omit<Account, 'id'>) => void;
    accountToEdit: Account | null;
}> = ({ isOpen, onClose, onSave, accountToEdit }) => {
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        type: AccountType.Expense,
    });

    useEffect(() => {
        if (isOpen) {
            if (accountToEdit) {
                setFormData({
                    code: accountToEdit.code,
                    name: accountToEdit.name,
                    type: accountToEdit.type,
                });
            } else {
                setFormData({ code: '', name: '', type: AccountType.Expense });
            }
        }
    }, [isOpen, accountToEdit]);
    
    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[51] flex justify-center items-center p-4">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-md">
                 <div className="flex justify-between items-center p-5 border-b dark:border-slate-700">
                    <h3 className="text-xl font-semibold">{accountToEdit ? 'Chỉnh sửa' : 'Thêm'} Tài khoản</h3>
                    <button type="button" onClick={onClose} className="text-3xl">&times;</button>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Số hiệu TK*</label>
                        <input type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} required className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">Tên tài khoản*</label>
                        <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-1">Loại tài khoản*</label>
                        <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as AccountType})} required className="w-full px-3 py-2 border rounded-lg">
                           {Object.values(AccountType).map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex justify-end p-5 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 rounded-lg">Hủy</button>
                    <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg">Lưu</button>
                </div>
            </form>
        </div>
    )
}


const AccountingSettingsView: React.FC<AccountingSettingsViewProps> = (props) => {
    const { 
        accountingPeriods, taxRates, chartOfAccounts,
        onUpdateAccountingPeriods, onUpdateTaxRates, onUpdateChartOfAccounts
    } = props;
    const { addToast } = useToast();
    const confirm = useConfirm();
    const [isAccountModalOpen, setAccountModalOpen] = useState(false);
    const [accountToEdit, setAccountToEdit] = useState<Account | null>(null);
    const [newTaxRate, setNewTaxRate] = useState({ name: '', rate: '' });

    // Handlers for Accounting Periods
    const handleAddPeriod = () => {
        const lastPeriod = accountingPeriods.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0];
        const startDate = lastPeriod ? new Date(lastPeriod.endDate) : new Date();
        if(lastPeriod) startDate.setDate(startDate.getDate() + 1);
        
        const newPeriod: AccountingPeriod = {
            id: `P${Date.now()}`,
            name: `Kỳ ${accountingPeriods.length + 1}`,
            startDate: startDate.toISOString().split('T')[0],
            endDate: new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).toISOString().split('T')[0], // End of the month
            status: 'Mở',
        };
        onUpdateAccountingPeriods([...accountingPeriods, newPeriod]);
        addToast('Đã thêm kỳ kế toán mới.', 'success');
    };
    
    const handleClosePeriod = async (periodId: string) => {
        const isConfirmed = await confirm({
            title: 'Xác nhận Đóng sổ',
            message: 'Bạn có chắc chắn muốn đóng sổ kỳ kế toán này? Sau khi đóng, các giao dịch trong kỳ sẽ không thể thay đổi.',
            variant: 'danger',
            confirmText: 'Đóng sổ'
        });
        if(isConfirmed) {
            onUpdateAccountingPeriods(accountingPeriods.map(p => p.id === periodId ? {...p, status: 'Đã đóng'} : p));
            addToast('Đã đóng sổ kỳ kế toán thành công.', 'success');
        }
    }

    // Handlers for Tax Rates
    const handleAddTaxRate = () => {
        const rate = parseFloat(newTaxRate.rate);
        if(!newTaxRate.name.trim() || isNaN(rate) || rate < 0){
            addToast('Vui lòng nhập tên và % thuế hợp lệ.', 'error');
            return;
        }
        const newRate: TaxRate = {
            id: `T${Date.now()}`,
            name: newTaxRate.name,
            rate: rate,
            isDefault: false
        };
        onUpdateTaxRates([...taxRates, newRate]);
        setNewTaxRate({ name: '', rate: ''});
        addToast('Đã thêm thuế suất mới.', 'success');
    };
    const handleSetDefaultTax = (rateId: string) => {
        onUpdateTaxRates(taxRates.map(t => ({...t, isDefault: t.id === rateId})));
        addToast('Đã cập nhật thuế suất mặc định.', 'success');
    }
    const handleDeleteTaxRate = async (rateId: string) => {
        const rate = taxRates.find(t => t.id === rateId);
        if (rate?.isDefault) {
            addToast('Không thể xóa thuế suất mặc định.', 'warning');
            return;
        }
        const isConfirmed = await confirm({ title: 'Xóa thuế suất', message: `Bạn có chắc muốn xóa "${rate?.name}"?`, variant: 'danger' });
        if(isConfirmed) {
            onUpdateTaxRates(taxRates.filter(t => t.id !== rateId));
            addToast('Đã xóa thuế suất.', 'success');
        }
    }

    // Handlers for Chart of Accounts
    const handleSaveAccount = (accountData: Omit<Account, 'id'>) => {
        if(accountToEdit){
            onUpdateChartOfAccounts(chartOfAccounts.map(acc => acc.id === accountToEdit.id ? {...acc, ...accountData} : acc));
            addToast('Cập nhật tài khoản thành công.', 'success');
        } else {
            const newAccount: Account = { id: `acc-${Date.now()}`, ...accountData };
            onUpdateChartOfAccounts([...chartOfAccounts, newAccount]);
            addToast('Thêm tài khoản mới thành công.', 'success');
        }
    }
    const handleDeleteAccount = async (account: Account) => {
        if(account.isSystemAccount) {
            addToast('Không thể xóa tài khoản hệ thống.', 'error');
            return;
        }
        const isConfirmed = await confirm({ title: 'Xóa tài khoản', message: `Bạn có chắc muốn xóa tài khoản "${account.name}"?`, variant: 'danger' });
        if(isConfirmed) {
            onUpdateChartOfAccounts(chartOfAccounts.filter(acc => acc.id !== account.id));
            addToast('Đã xóa tài khoản.', 'success');
        }
    }


    return (
        <div className="space-y-10">
            {/* Chart of Accounts Section */}
            <div className="grid grid-cols-1 gap-x-8 md:grid-cols-3">
                <div className="px-4 sm:px-0">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Hệ thống Tài khoản</h2>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Quản lý danh sách các tài khoản kế toán của doanh nghiệp.</p>
                </div>
                <div className="bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-900/5 sm:rounded-xl md:col-span-2 p-6">
                    <div className="flex justify-end">
                        <button onClick={() => { setAccountToEdit(null); setAccountModalOpen(true); }} className="mb-4 text-sm font-medium text-primary-600 hover:text-primary-800">+ Thêm tài khoản mới</button>
                    </div>
                    <div className="overflow-x-auto max-h-96">
                        <table className="min-w-full">
                            <thead className="bg-slate-50 dark:bg-slate-700/50 sticky top-0">
                                <tr>
                                    <th className="py-2 px-4 text-left text-xs font-medium text-slate-500 uppercase">Số hiệu</th>
                                    <th className="py-2 px-4 text-left text-xs font-medium text-slate-500 uppercase">Tên tài khoản</th>
                                    <th className="py-2 px-4 text-left text-xs font-medium text-slate-500 uppercase">Loại</th>
                                    <th className="py-2 px-4 text-center text-xs font-medium text-slate-500 uppercase">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {chartOfAccounts.sort((a,b) => a.code.localeCompare(b.code)).map(acc => (
                                    <tr key={acc.id}>
                                        <td className="py-2 px-4 font-mono">{acc.code}</td>
                                        <td className="py-2 px-4 font-medium">{acc.name}</td>
                                        <td className="py-2 px-4 text-sm text-slate-500">{acc.type}</td>
                                        <td className="py-2 px-4 text-center text-sm space-x-2">
                                            <button onClick={() => { setAccountToEdit(acc); setAccountModalOpen(true); }} className="text-blue-600 hover:underline">Sửa</button>
                                            <button onClick={() => handleDeleteAccount(acc)} disabled={acc.isSystemAccount} className="text-red-600 hover:underline disabled:text-slate-400 disabled:no-underline">Xóa</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Accounting Periods Section */}
            <div className="grid grid-cols-1 gap-x-8 md:grid-cols-3">
                <div className="px-4 sm:px-0">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Kỳ Kế toán</h2>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Quản lý các kỳ kế toán và thực hiện đóng sổ cuối kỳ.</p>
                </div>
                <div className="bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-900/5 sm:rounded-xl md:col-span-2 p-6">
                     <button onClick={handleAddPeriod} className="mb-4 text-sm font-medium text-primary-600 hover:text-primary-800">+ Thêm kỳ mới</button>
                    <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                        {accountingPeriods.map(p => (
                            <li key={p.id} className="py-3 flex items-center justify-between">
                                <div>
                                    <p className="font-medium">{p.name}</p>
                                    <p className="text-sm text-slate-500">{p.startDate} - {p.endDate}</p>
                                </div>
                                {p.status === 'Mở' ? (
                                    <button onClick={() => handleClosePeriod(p.id)} className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600">Đóng sổ</button>
                                ): (
                                    <span className="px-3 py-1 text-sm bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 rounded">Đã đóng</span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

             {/* Tax Rates Section */}
            <div className="grid grid-cols-1 gap-x-8 md:grid-cols-3">
                <div className="px-4 sm:px-0">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Thuế suất</h2>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Cấu hình các mức thuế suất (VAT...) áp dụng cho đơn hàng.</p>
                </div>
                 <div className="bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-900/5 sm:rounded-xl md:col-span-2 p-6">
                    <div className="space-y-2 mb-4 border-b pb-4 dark:border-slate-700">
                        {taxRates.map(t => (
                            <div key={t.id} className="py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-md px-2">
                                <div>
                                    <p className="font-medium">{t.name} ({t.rate}%)</p>
                                    {t.isDefault && <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Mặc định</span>}
                                </div>
                                <div className="space-x-3">
                                    {!t.isDefault && <button onClick={() => handleSetDefaultTax(t.id)} className="text-sm text-blue-600 hover:underline">Đặt mặc định</button>}
                                    <button onClick={() => handleDeleteTaxRate(t.id)} className="text-sm text-red-600 hover:underline">Xóa</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="space-y-3">
                         <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200">Thêm thuế suất mới</h4>
                         <div className="flex items-center gap-2">
                             <input type="text" placeholder="Tên thuế, VD: VAT 5%" value={newTaxRate.name} onChange={e => setNewTaxRate({...newTaxRate, name: e.target.value})} className="flex-grow px-3 py-1.5 border rounded-lg text-sm" />
                             <input type="number" placeholder="% Thuế" value={newTaxRate.rate} onChange={e => setNewTaxRate({...newTaxRate, rate: e.target.value})} className="w-24 px-3 py-1.5 border rounded-lg text-sm" />
                             <button onClick={handleAddTaxRate} className="px-4 py-1.5 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700">Thêm</button>
                         </div>
                    </div>
                </div>
            </div>

            <AddEditAccountModal 
                isOpen={isAccountModalOpen}
                onClose={() => setAccountModalOpen(false)}
                onSave={handleSaveAccount}
                accountToEdit={accountToEdit}
            />
        </div>
    );
};

export default AccountingSettingsView;