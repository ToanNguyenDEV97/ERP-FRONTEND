import React, { useState, useMemo, useEffect } from 'react';
import { JournalEntry, JournalEntryLine, Account, AccountType, User, Order, Customer, PurchaseOrder, Supplier, OrderStatus, PaymentStatus, PurchaseOrderStatus, Permission, NavView } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useToast } from '../contexts/ToastContext';
import EmptyState from './EmptyState';

// --- PROPS INTERFACE ---
interface AccountingViewProps {
    journalEntries: JournalEntry[];
    onCreateJournalEntry: (journalEntry: Omit<JournalEntry, 'id'>) => void;
    currentUser: User;
    orders: Order[];
    customers: Customer[];
    purchaseOrders: PurchaseOrder[];
    suppliers: Supplier[];
    onUpdateOrderPaymentStatus: (orderId: string, amountToPay: number) => void;
    onUpdatePurchaseOrderPaymentStatus: (poId: string, amountToPay: number) => void;
    theme: 'light' | 'dark' | 'system';
    hasPermission: (permission: Permission) => boolean;
    chartOfAccounts: Account[];
    onNavigate: (view: NavView, params?: any) => void;
    initialParams?: { tab?: string };
    onClearInitialSelection: () => void;
    loadData: () => Promise<void>;
}

// --- SUB-COMPONENTS ---

const StatCard: React.FC<{ title: string; value: string; color: string; icon: React.ReactNode; onClick?: () => void }> = ({ title, value, color, icon, onClick }) => (
    <div onClick={onClick} className={`bg-white dark:bg-slate-800 p-5 rounded-xl shadow-md flex items-center transition-all duration-300 hover:-translate-y-1 ${onClick ? 'cursor-pointer hover:shadow-lg' : ''}`}>
        <div className={`p-3 rounded-full bg-${color}-100 dark:bg-${color}-900/50 text-${color}-600 dark:text-${color}-400 mr-4`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
            <p className={`text-2xl font-bold text-slate-800 dark:text-slate-100`}>{value}</p>
        </div>
    </div>
);

const AccountingDashboard: React.FC<{
    orders: Order[];
    purchaseOrders: PurchaseOrder[];
    journalEntries: JournalEntry[];
    chartOfAccounts: Account[];
    chartColors: any;
    onTabChange: (tab: string) => void;
}> = ({ orders, purchaseOrders, journalEntries, chartOfAccounts, chartColors, onTabChange }) => {
    
    const { receivables, payables, monthlyRevenue, monthlyExpense, recentTransactions, cashFlowData } = useMemo(() => {
        const ar = orders
            .filter(o => o.status === OrderStatus.Completed && o.paymentStatus !== PaymentStatus.Paid)
            .reduce((sum, o) => sum + (o.total - o.amountPaid), 0);
        
        const ap = purchaseOrders
            .filter(po => po.status === PurchaseOrderStatus.Received && po.paymentStatus !== PaymentStatus.Paid)
            .reduce((sum, po) => sum + (po.total - po.amountPaid), 0);

        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        
        let mRevenue = 0;
        let mExpense = 0;
        const dailyData: { [date: string]: { Thu: number, Chi: number } } = {};

        journalEntries.forEach(je => {
            const isThisMonth = je.date >= firstDayOfMonth;
            if(isThisMonth) {
                je.lines.forEach(line => {
                    const account = chartOfAccounts.find(a => a.id === line.accountId);
                    if(account?.type === AccountType.Revenue) mRevenue += line.credit;
                    if(account?.type === AccountType.Expense) mExpense += line.debit;
                })
            }
             je.lines.forEach(line => {
                const account = chartOfAccounts.find(a => a.id === line.accountId);
                if (account) {
                    if (!dailyData[je.date]) { dailyData[je.date] = { Thu: 0, Chi: 0 }; }
                    if (account.type === AccountType.Revenue) { dailyData[je.date].Thu += line.credit; } 
                    else if (account.type === AccountType.Expense) { dailyData[je.date].Chi += line.debit; }
                }
            });
        });
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

        const sortedChartData = Object.keys(dailyData)
            .filter(date => date >= thirtyDaysAgoStr)
            .sort((a,b) => new Date(a).getTime() - new Date(b).getTime())
            .map(date => ({ name: date, ...dailyData[date] }));

        return {
            receivables: ar,
            payables: ap,
            monthlyRevenue: mRevenue,
            monthlyExpense: mExpense,
            recentTransactions: journalEntries.slice(0, 5),
            cashFlowData: sortedChartData
        }
    }, [orders, purchaseOrders, journalEntries, chartOfAccounts]);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <StatCard onClick={() => onTabChange('receivables')} title="Công nợ phải thu" value={`${receivables.toLocaleString('vi-VN')}đ`} color="yellow" icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
                 <StatCard onClick={() => onTabChange('payables')} title="Công nợ phải trả" value={`${payables.toLocaleString('vi-VN')}đ`} color="red" icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H4a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>} />
                 <StatCard title="Doanh thu tháng này" value={`${monthlyRevenue.toLocaleString('vi-VN')}đ`} color="green" icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} />
                 <StatCard title="Chi phí tháng này" value={`${monthlyExpense.toLocaleString('vi-VN')}đ`} color="orange" icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                     <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Dòng tiền 30 ngày qua</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={cashFlowData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                            <XAxis dataKey="name" stroke={chartColors.axis} tick={{fontSize: 12}} />
                            <YAxis tickFormatter={(value) => `${(value as number / 1000000)}M`} stroke={chartColors.axis} />
                            <Tooltip contentStyle={chartColors.tooltip} formatter={(value: number) => `${value.toLocaleString('vi-VN')}đ`}/>
                            <Legend wrapperStyle={{ color: chartColors.axis }}/>
                            <Line type="monotone" dataKey="Thu" stroke="#10b981" strokeWidth={2} />
                            <Line type="monotone" dataKey="Chi" stroke="#ef4444" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
                    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Giao dịch gần đây</h3>
                    <ul className="space-y-3">
                        {recentTransactions.map(je => (
                            <li key={je.id} className="border-b dark:border-slate-700 pb-2 last:border-b-0">
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-1">{je.description}</p>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500 dark:text-slate-400">{je.date}</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-300">{je.lines[0].debit.toLocaleString('vi-VN')}đ</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    )
}

const JournalEntriesView: React.FC<{
    journalEntries: JournalEntry[];
    openModal: () => void;
    canManage: boolean;
}> = ({ journalEntries, openModal, canManage }) => {
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Sổ Nhật ký chung</h3>
                {canManage && <button onClick={openModal} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">+ Ghi sổ</button>}
            </div>
             <div className="overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-slate-800">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                            <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Ngày</th>
                            <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Số CT</th>
                            <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Diễn giải</th>
                            <th className="py-3 px-6 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">TK Nợ / TK Có</th>
                            <th className="py-3 px-6 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Số tiền</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {journalEntries.map(je => (
                            <tr key={je.id} className="hover:bg-primary-50 dark:hover:bg-slate-700/50">
                                <td className="py-4 px-6 text-sm">{je.date}</td>
                                <td className="py-4 px-6 text-sm font-mono text-primary-600">{je.referenceId || je.id}</td>
                                <td className="py-4 px-6 text-sm font-medium">{je.description}</td>
                                <td className="py-4 px-6 text-sm">
                                    {je.lines.map(line => (
                                        <div key={`${line.accountId}-${line.debit}-${line.credit}`} className="font-mono">{line.debit > 0 ? `Nợ: ${line.accountCode}` : `    Có: ${line.accountCode}`}</div>
                                    ))}
                                </td>
                                <td className="py-4 px-6 text-sm font-bold text-right">
                                    {je.lines.reduce((sum, l) => sum + l.debit, 0).toLocaleString('vi-VN')}đ
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {journalEntries.length === 0 && <EmptyState icon={<div/>} title="Chưa có bút toán" message="Bắt đầu ghi sổ để theo dõi." />}
            </div>
        </div>
    );
};

const GeneralLedgerView: React.FC<{
    chartOfAccounts: Account[];
    journalEntries: JournalEntry[];
}> = ({ chartOfAccounts, journalEntries }) => {
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

    const accountBalances = useMemo(() => {
        const balances: Record<string, number> = {};
        chartOfAccounts.forEach(acc => balances[acc.id] = 0);
        
        journalEntries.forEach(je => {
            je.lines.forEach(line => {
                const account = chartOfAccounts.find(a => a.id === line.accountId);
                if (account) {
                     const amount = (account.type === AccountType.Asset || account.type === AccountType.Expense)
                        ? line.debit - line.credit
                        : line.credit - line.debit;
                    balances[line.accountId] += amount;
                }
            })
        });
        return balances;
    }, [chartOfAccounts, journalEntries]);

    if (selectedAccount) {
        const transactions = journalEntries
            .flatMap(je => je.lines
                .filter(l => l.accountId === selectedAccount.id)
                .map(l => ({...l, date: je.date, description: je.description, ref: je.referenceId}))
            )
            .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        let runningBalance = 0;
        const isDebitPositive = selectedAccount.type === AccountType.Asset || selectedAccount.type === AccountType.Expense;

        return (
            <div>
                 <button onClick={() => setSelectedAccount(null)} className="mb-4 text-sm font-semibold text-primary-600 hover:underline">&larr; Quay lại Sổ Cái</button>
                 <h3 className="text-xl font-semibold mb-2">Sổ chi tiết: {selectedAccount.name} ({selectedAccount.code})</h3>
                 <p className="mb-4 text-slate-600 dark:text-slate-300">Số dư cuối kỳ: <span className="font-bold text-slate-800 dark:text-slate-100">{accountBalances[selectedAccount.id].toLocaleString('vi-VN')}đ</span></p>

                 <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="py-2 px-3 text-left text-xs font-medium text-slate-500 uppercase">Ngày</th>
                                <th className="py-2 px-3 text-left text-xs font-medium text-slate-500 uppercase">Diễn giải</th>
                                <th className="py-2 px-3 text-right text-xs font-medium text-slate-500 uppercase">Nợ</th>
                                <th className="py-2 px-3 text-right text-xs font-medium text-slate-500 uppercase">Có</th>
                                <th className="py-2 px-3 text-right text-xs font-medium text-slate-500 uppercase">Số dư</th>
                            </tr>
                        </thead>
                         <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {transactions.map((line, index) => {
                                const amount = isDebitPositive ? line.debit - line.credit : line.credit - line.debit;
                                runningBalance += amount;
                                return (
                                    <tr key={`${line.accountId}-${index}-${line.ref}`}>
                                        <td className="py-2 px-3 text-sm">{line.date}</td>
                                        <td className="py-2 px-3 text-sm">{line.description} {line.ref && `(${line.ref})`}</td>
                                        <td className="py-2 px-3 text-sm text-right font-mono text-green-600">{line.debit > 0 ? line.debit.toLocaleString('vi-VN') : ''}</td>
                                        <td className="py-2 px-3 text-sm text-right font-mono text-red-600">{line.credit > 0 ? line.credit.toLocaleString('vi-VN') : ''}</td>
                                        <td className="py-2 px-3 text-sm text-right font-mono font-semibold">{runningBalance.toLocaleString('vi-VN')}đ</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        )
    }

    return (
         <div className="space-y-6">
             {Object.values(AccountType).map(type => (
                 <div key={type}>
                     <h3 className="text-lg font-semibold mb-2 capitalize text-slate-800 dark:text-slate-200">{type}</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                         {chartOfAccounts.filter(acc => acc.type === type).sort((a,b)=> a.code.localeCompare(b.code)).map(account => (
                             <button onClick={() => setSelectedAccount(account)} key={account.id} className="p-3 border dark:border-slate-700 rounded-lg text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                 <div className="flex justify-between items-center">
                                     <span className="font-medium text-slate-700 dark:text-slate-300">{account.code} - {account.name}</span>
                                     <span className="font-bold text-slate-900 dark:text-slate-100">{accountBalances[account.id].toLocaleString('vi-VN')}đ</span>
                                 </div>
                             </button>
                         ))}
                     </div>
                 </div>
             ))}
         </div>
    );
};

// --- NEW FINANCIAL REPORT COMPONENTS ---
const ProfitAndLossView: React.FC<{
    journalEntries: JournalEntry[];
    chartOfAccounts: Account[];
}> = ({ journalEntries, chartOfAccounts }) => {
    const [period, setPeriod] = useState<'month' | 'quarter'>('month');

    const { revenue, cogs, grossProfit, expenses, netProfit } = useMemo(() => {
        const now = new Date();
        let startDate: Date;

        if (period === 'month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else { // quarter
            const quarter = Math.floor(now.getMonth() / 3);
            startDate = new Date(now.getFullYear(), quarter * 3, 1);
        }
        
        const filteredEntries = journalEntries.filter(je => new Date(je.date) >= startDate);

        let rev = 0, cgs = 0, exp = 0;
        
        filteredEntries.forEach(je => {
            je.lines.forEach(line => {
                const account = chartOfAccounts.find(a => a.id === line.accountId);
                if (account) {
                    if (account.type === AccountType.Revenue) rev += line.credit;
                    else if (account.code === '632') cgs += line.debit; // COGS
                    else if (account.type === AccountType.Expense) exp += line.debit;
                }
            });
        });
        
        const gp = rev - cgs;
        const np = gp - exp;

        return { revenue: rev, cogs: cgs, grossProfit: gp, expenses: exp, netProfit: np };
    }, [journalEntries, chartOfAccounts, period]);

    const PNLRow: React.FC<{ label: string; value: number; isTotal?: boolean; isSub?: boolean; isNegative?: boolean }> = ({ label, value, isTotal = false, isSub = false, isNegative = false }) => (
        <div className={`flex justify-between py-2 ${isTotal ? 'border-t-2 font-bold' : 'border-b'} ${isSub ? 'pl-4' : ''}`}>
            <span className={isTotal ? 'text-lg' : ''}>{label}</span>
            <span className={`${isTotal ? 'text-lg' : ''} ${isNegative ? 'text-red-600' : ''}`}>
                {value.toLocaleString('vi-VN')}đ
            </span>
        </div>
    );

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Báo cáo Kết quả Kinh doanh</h3>
                <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                    <button onClick={() => setPeriod('month')} className={`px-3 py-1.5 rounded-md text-sm ${period === 'month' ? 'bg-white dark:bg-slate-700 shadow' : ''}`}>Tháng này</button>
                    <button onClick={() => setPeriod('quarter')} className={`px-3 py-1.5 rounded-md text-sm ${period === 'quarter' ? 'bg-white dark:bg-slate-700 shadow' : ''}`}>Quý này</button>
                </div>
            </div>
            <div className="p-4 border dark:border-slate-700 rounded-lg space-y-2">
                <PNLRow label="Tổng Doanh thu" value={revenue} />
                <PNLRow label="Giá vốn hàng bán (COGS)" value={cogs} isSub />
                <PNLRow label="Lợi nhuận gộp" value={grossProfit} isTotal />
                <PNLRow label="Chi phí hoạt động" value={expenses} isSub />
                <PNLRow label="Lợi nhuận ròng" value={netProfit} isTotal isNegative={netProfit < 0} />
            </div>
        </div>
    );
};

const TrialBalanceView: React.FC<{
    chartOfAccounts: Account[];
    journalEntries: JournalEntry[];
}> = ({ chartOfAccounts, journalEntries }) => {
    const balances = useMemo(() => {
        const accBalances = chartOfAccounts.map(account => {
            const { totalDebit, totalCredit } = journalEntries.reduce((totals, entry) => {
                entry.lines.forEach(line => {
                    if (line.accountId === account.id) {
                        totals.totalDebit += line.debit;
                        totals.totalCredit += line.credit;
                    }
                });
                return totals;
            }, { totalDebit: 0, totalCredit: 0 });

            const isDebitPositive = account.type === AccountType.Asset || account.type === AccountType.Expense;
            const balance = totalDebit - totalCredit;

            return {
                ...account,
                debit: isDebitPositive ? (balance > 0 ? balance : 0) : (balance < 0 ? -balance : 0),
                credit: isDebitPositive ? (balance < 0 ? -balance : 0) : (balance > 0 ? balance : 0),
            };
        });

        const totalDebit = accBalances.reduce((sum, acc) => sum + acc.debit, 0);
        const totalCredit = accBalances.reduce((sum, acc) => sum + acc.credit, 0);

        return { accounts: accBalances, totalDebit, totalCredit };
    }, [chartOfAccounts, journalEntries]);

    return (
        <div>
            <h3 className="text-xl font-semibold mb-4">Bảng Cân đối thử</h3>
            <div className="overflow-x-auto border dark:border-slate-700 rounded-lg">
                <table className="min-w-full">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                            <th className="py-2 px-3 text-left text-xs font-medium text-slate-500 uppercase">Số hiệu TK</th>
                            <th className="py-2 px-3 text-left text-xs font-medium text-slate-500 uppercase">Tên tài khoản</th>
                            <th className="py-2 px-3 text-right text-xs font-medium text-slate-500 uppercase">Nợ</th>
                            <th className="py-2 px-3 text-right text-xs font-medium text-slate-500 uppercase">Có</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {balances.accounts.filter(a => a.debit > 0 || a.credit > 0).map(acc => (
                            <tr key={acc.id}>
                                <td className="py-2 px-3 text-sm font-mono">{acc.code}</td>
                                <td className="py-2 px-3 text-sm">{acc.name}</td>
                                <td className="py-2 px-3 text-sm text-right font-mono">{acc.debit > 0 ? acc.debit.toLocaleString('vi-VN') : ''}</td>
                                <td className="py-2 px-3 text-sm text-right font-mono">{acc.credit > 0 ? acc.credit.toLocaleString('vi-VN') : ''}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-slate-100 dark:bg-slate-700 font-bold">
                        <tr>
                            <td colSpan={2} className="py-3 px-3 text-right">TỔNG CỘNG</td>
                            <td className="py-3 px-3 text-right font-mono">{balances.totalDebit.toLocaleString('vi-VN')}</td>
                            <td className="py-3 px-3 text-right font-mono">{balances.totalCredit.toLocaleString('vi-VN')}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};


// --- MAIN COMPONENT ---
const AccountingView: React.FC<AccountingViewProps> = (props) => {
    const { 
        journalEntries, onCreateJournalEntry, currentUser, theme, hasPermission, 
        chartOfAccounts, onNavigate, initialParams, onClearInitialSelection,
        orders, customers, purchaseOrders, suppliers, loadData
    } = props;
    
    useEffect(() => {
        loadData();
    }, [loadData]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');

    useEffect(() => {
        if (initialParams?.tab === 'debt') {
            setActiveTab('receivables');
            onClearInitialSelection();
        }
    }, [initialParams, onClearInitialSelection]);

    const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    const chartColors = useMemo(() => ({
      axis: isDark ? '#94a3b8' : '#64748b', 
      grid: isDark ? '#334155' : '#e2e8f0',
      tooltip: {
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
          color: isDark ? '#cbd5e1' : '#334155',
          border: `1px solid ${isDark ? '#475569' : '#e2e8f0'}`,
          borderRadius: '0.5rem'
      }
    }), [isDark]);

    const TABS = [
        { id: 'dashboard', label: 'Tổng quan' },
        { id: 'journal', label: 'Nhật ký chung' },
        { id: 'ledger', label: 'Sổ Cái' },
        { id: 'receivables', label: 'Công nợ Phải thu' },
        { id: 'payables', label: 'Công nợ Phải trả' },
        { id: 'pnl', label: 'Báo cáo KQKD' },
        { id: 'trial_balance', label: 'Bảng Cân đối thử' },
    ];

    const renderContent = () => {
        switch(activeTab) {
            case 'dashboard': return <AccountingDashboard orders={orders} purchaseOrders={purchaseOrders} journalEntries={journalEntries} chartOfAccounts={chartOfAccounts} chartColors={chartColors} onTabChange={setActiveTab}/>;
            case 'journal': return <JournalEntriesView journalEntries={journalEntries} openModal={() => setIsModalOpen(true)} canManage={hasPermission('MANAGE_TRANSACTIONS')} />;
            case 'ledger': return <GeneralLedgerView chartOfAccounts={chartOfAccounts} journalEntries={journalEntries} />;
            case 'receivables': return <DebtView type="receivable" orders={orders} customers={customers} onNavigate={onNavigate} />;
            case 'payables': return <DebtView type="payable" purchaseOrders={purchaseOrders} suppliers={suppliers} onNavigate={onNavigate} />;
            case 'pnl': return <ProfitAndLossView journalEntries={journalEntries} chartOfAccounts={chartOfAccounts} />;
            case 'trial_balance': return <TrialBalanceView journalEntries={journalEntries} chartOfAccounts={chartOfAccounts} />;
            default: return null;
        }
    }

  return (
    <>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md">
            <div className="border-b border-slate-200 dark:border-slate-700">
                <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto" aria-label="Tabs">
                    {TABS.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`${activeTab === tab.id ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="mt-6">
                {renderContent()}
            </div>
        </div>
         {isModalOpen && hasPermission('MANAGE_TRANSACTIONS') && (
            <AddJournalEntryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={onCreateJournalEntry}
                chartOfAccounts={chartOfAccounts}
            />
        )}
    </>
  );
};

// --- DEBT VIEW COMPONENT (Receivables/Payables) ---

interface DebtViewProps {
    type: 'receivable' | 'payable';
    orders?: Order[];
    purchaseOrders?: PurchaseOrder[];
    customers?: Customer[];
    suppliers?: Supplier[];
    onNavigate: (view: NavView, params?: any) => void;
}

const DebtView: React.FC<DebtViewProps> = ({ type, orders, purchaseOrders, customers, suppliers, onNavigate }) => {
    const debtData = useMemo(() => {
        if (type === 'receivable' && orders && customers) {
            const unpaidOrders = orders.filter(o => o.status === OrderStatus.Completed && o.paymentStatus !== PaymentStatus.Paid);
            const debtByCustomer = unpaidOrders.reduce((acc, order) => {
                const debt = order.total - order.amountPaid;
                if (debt > 0) {
                    if (!acc[order.customerId]) {
                        acc[order.customerId] = { orders: [], totalDebt: 0 };
                    }
                    acc[order.customerId].orders.push(order);
                    acc[order.customerId].totalDebt += debt;
                }
                return acc;
            }, {} as { [key: string]: { orders: Order[], totalDebt: number } });

            return Object.keys(debtByCustomer).map(customerId => {
                const customerInfo = customers.find(c => c.id === customerId);
                return {
                    partyId: customerId,
                    partyName: customerInfo?.name || 'Không rõ',
                    totalDebt: debtByCustomer[customerId].totalDebt,
                    unpaidCount: debtByCustomer[customerId].orders.length,
                    oldestDate: debtByCustomer[customerId].orders.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0].date,
                };
            }).sort((a,b) => b.totalDebt - a.totalDebt);
        }
        if (type === 'payable' && purchaseOrders && suppliers) {
             const payablePOs = purchaseOrders.filter(po => po.status === PurchaseOrderStatus.Received && po.paymentStatus !== PaymentStatus.Paid);
             const debtBySupplier = payablePOs.reduce((acc, po) => {
                 const debt = po.total - po.amountPaid;
                 if (debt > 0) {
                    if (!acc[po.supplierId]) acc[po.supplierId] = { pos: [], totalDebt: 0 };
                    acc[po.supplierId].pos.push(po);
                    acc[po.supplierId].totalDebt += debt;
                 }
                 return acc;
             }, {} as { [key: string]: { pos: PurchaseOrder[], totalDebt: number } });
             return Object.keys(debtBySupplier).map(supplierId => {
                 const supplierInfo = suppliers.find(s => s.id === supplierId);
                 return {
                     partyId: supplierId,
                     partyName: supplierInfo?.name || 'Không rõ',
                     totalDebt: debtBySupplier[supplierId].totalDebt,
                     unpaidCount: debtBySupplier[supplierId].pos.length,
                     oldestDate: debtBySupplier[supplierId].pos.sort((a,b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime())[0].orderDate,
                 }
             }).sort((a,b) => b.totalDebt - a.totalDebt);
        }
        return [];
    }, [type, orders, customers, purchaseOrders, suppliers]);
    
    const totalDebt = debtData.reduce((sum, item) => sum + item.totalDebt, 0);
    const title = type === 'receivable' ? 'Công nợ Phải thu' : 'Công nợ Phải trả';

    return (
        <div>
            <div className={`mb-6 bg-${type === 'receivable' ? 'yellow' : 'red'}-50 dark:bg-${type === 'receivable' ? 'yellow' : 'red'}-900/30 border-l-4 border-${type === 'receivable' ? 'yellow' : 'red'}-400 p-4 rounded-r-lg`}>
                <p className={`text-sm text-${type === 'receivable' ? 'yellow' : 'red'}-700 dark:text-${type === 'receivable' ? 'yellow' : 'red'}-300`}>Tổng {title}</p>
                <p className={`text-2xl font-bold text-${type === 'receivable' ? 'yellow' : 'red'}-800 dark:text-${type === 'receivable' ? 'yellow' : 'red'}-200`}>{totalDebt.toLocaleString('vi-VN')}đ</p>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                            <th className="py-2 px-3 text-left text-xs font-medium text-slate-500 uppercase">{type === 'receivable' ? 'Khách hàng' : 'Nhà cung cấp'}</th>
                            <th className="py-2 px-3 text-right text-xs font-medium text-slate-500 uppercase">Tổng nợ</th>
                            <th className="py-2 px-3 text-center text-xs font-medium text-slate-500 uppercase">Số hóa đơn nợ</th>
                            <th className="py-2 px-3 text-left text-xs font-medium text-slate-500 uppercase">Ngày nợ cũ nhất</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-700">
                        {debtData.map(d => (
                            <tr key={d.partyId} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                <td className="py-3 px-3">
                                    <button onClick={() => onNavigate(type === 'receivable' ? 'CRM' : 'SUPPLIER', type === 'receivable' ? { customerId: d.partyId } : { supplierId: d.partyId })} className="font-medium text-primary-600 hover:underline">{d.partyName}</button>
                                </td>
                                <td className="py-3 px-3 text-right font-bold text-red-600">{d.totalDebt.toLocaleString('vi-VN')}đ</td>
                                <td className="py-3 px-3 text-center">{d.unpaidCount}</td>
                                <td className="py-3 px-3">{d.oldestDate}</td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
                 {debtData.length === 0 && <EmptyState icon={<div/>} title="Không có công nợ" message={`Tất cả các hóa đơn đều đã được thanh toán.`} />}
            </div>
        </div>
    );
}

// --- ADD JOURNAL ENTRY MODAL ---

interface AddJournalEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (entry: Omit<JournalEntry, 'id'>) => void;
    chartOfAccounts: Account[];
}
const AddJournalEntryModal: React.FC<AddJournalEntryModalProps> = ({ isOpen, onClose, onSave, chartOfAccounts }) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [lines, setLines] = useState<Partial<JournalEntryLine>[]>([
        { accountId: '', debit: 0, credit: 0 },
        { accountId: '', debit: 0, credit: 0 },
    ]);
    const { addToast } = useToast();

    useEffect(() => {
        if (!isOpen) {
            setDate(new Date().toISOString().split('T')[0]);
            setDescription('');
            setLines([{ accountId: '', debit: 0, credit: 0 }, { accountId: '', debit: 0, credit: 0 }]);
        }
    }, [isOpen]);

    const { totalDebit, totalCredit, isBalanced } = useMemo(() => {
        const debit = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
        const credit = lines.reduce((sum, line) => sum + (line.credit || 0), 0);
        return { totalDebit: debit, totalCredit: credit, isBalanced: debit === credit && debit > 0 };
    }, [lines]);

    const handleLineChange = (index: number, field: keyof JournalEntryLine, value: any) => {
        const newLines = [...lines];
        const currentLine = { ...newLines[index] };
        newLines[index] = { ...currentLine, [field]: value };

        if (field === 'accountId') {
            const account = chartOfAccounts.find(a => a.id === value);
            newLines[index].accountCode = account?.code;
            newLines[index].accountName = account?.name;
        } else if (field === 'debit' && parseFloat(value) > 0) {
             newLines[index].credit = 0;
        } else if (field === 'credit' && parseFloat(value) > 0) {
            newLines[index].debit = 0;
        }
        setLines(newLines);
    }
    const addLine = () => setLines([...lines, { accountId: '', debit: 0, credit: 0 }]);
    const removeLine = (index: number) => setLines(lines.filter((_, i) => i !== index));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isBalanced) {
            addToast('Tổng Nợ và Tổng Có phải bằng nhau và lớn hơn 0.', 'error');
            return;
        }
        const validLines = lines.filter(l => l.accountId && (l.debit || 0) + (l.credit || 0) > 0) as JournalEntryLine[];
        if (validLines.length < 2) {
            addToast('Bút toán phải có ít nhất 2 dòng.', 'error');
            return;
        }
        onSave({ date, description, lines: validLines });
        onClose();
    };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[51] flex justify-center items-center p-4">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                 <div className="flex justify-between items-center p-5 border-b dark:border-slate-700">
                    <h3 className="text-xl font-semibold">Ghi sổ Nhật ký chung</h3>
                    <button type="button" onClick={onClose} className="text-3xl">&times;</button>
                </div>
                 <div className="p-5 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Ngày</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full px-3 py-2 border rounded-lg" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium mb-1">Diễn giải</label>
                            <input type="text" value={description} onChange={e => setDescription(e.target.value)} required className="w-full px-3 py-2 border rounded-lg" />
                        </div>
                    </div>
                    <div className="border-t pt-2">
                        {lines.map((line, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-center">
                                <select value={line.accountId} onChange={e => handleLineChange(index, 'accountId', e.target.value)} required className="col-span-5 px-3 py-2 border rounded-lg text-sm">
                                    <option value="" disabled>Chọn tài khoản</option>
                                    {chartOfAccounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                                </select>
                                <input type="number" value={line.debit || ''} onChange={e => handleLineChange(index, 'debit', parseFloat(e.target.value) || 0)} min="0" className="col-span-3 px-3 py-2 border rounded-lg text-right" placeholder="Nợ" />
                                <input type="number" value={line.credit || ''} onChange={e => handleLineChange(index, 'credit', parseFloat(e.target.value) || 0)} min="0" className="col-span-3 px-3 py-2 border rounded-lg text-right" placeholder="Có" />
                                <button type="button" onClick={() => removeLine(index)} className="col-span-1 text-red-500 p-2">&times;</button>
                            </div>
                        ))}
                        <button type="button" onClick={addLine} className="text-sm font-medium text-primary-600 hover:underline mt-2">+ Thêm dòng</button>
                    </div>
                 </div>
                <div className="flex justify-between items-center p-5 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <div className={`font-mono text-sm ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                        <p>Nợ: {totalDebit.toLocaleString('vi-VN')}</p>
                        <p>Có: {totalCredit.toLocaleString('vi-VN')}</p>
                    </div>
                    <div className="space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 rounded-lg">Hủy</button>
                        <button type="submit" disabled={!isBalanced} className="px-4 py-2 bg-primary-600 text-white rounded-lg disabled:bg-slate-400">Lưu</button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default React.memo(AccountingView);
