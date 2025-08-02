import React from 'react';
import { Order, NavView } from '../types';

const currencyFormatter = (value: number) => `${value.toLocaleString('vi-VN')}đ`;

interface ReportDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    config: {
        title: string;
        data: any[];
        columns: { key: string; label: string; format?: (val: any) => string; }[];
        onRowClick?: (row: any) => void;
    } | null;
}

const ReportDetailModal: React.FC<ReportDetailModalProps> = ({ isOpen, onClose, config }) => {
    if (!isOpen || !config) return null;

    const { title, data, columns, onRowClick } = config;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[101] flex justify-center items-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-5 border-b dark:border-slate-700">
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-3xl font-light">&times;</button>
                </div>
                <div className="p-5 flex-grow overflow-y-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700">
                            <tr>
                                {columns.map(col => (
                                    <th key={col.key} className={`py-2 px-3 ${col.key === 'total' ? 'text-right' : 'text-left'}`}>{col.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-slate-700">
                            {data.map((row, rowIndex) => (
                                <tr key={rowIndex} onClick={() => onRowClick && onRowClick(row)} className={onRowClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50' : ''}>
                                    {columns.map(col => (
                                        <td key={col.key} className={`py-2 px-3 ${col.key === 'total' ? 'text-right font-semibold' : ''}`}>
                                            {col.format ? col.format(row[col.key]) : row[col.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                     {data.length === 0 && <div className="text-center p-8 text-slate-500">Không có dữ liệu chi tiết.</div>}
                </div>
                <div className="p-4 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-right">
                    <button onClick={onClose} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Đóng</button>
                </div>
            </div>
        </div>
    );
};

export default ReportDetailModal;
