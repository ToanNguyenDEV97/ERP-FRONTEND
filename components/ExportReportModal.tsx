import React, { useState, useEffect } from 'react';
import { useConfirm } from '../contexts/ConfirmContext';
import { useToast } from '../contexts/ToastContext';

export interface ColumnDefinition {
    key: string;
    label: string;
}

interface ExportReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    reportConfig: {
        title: string;
        data: any[];
        columns: ColumnDefinition[];
    };
    onConfirmExport: (config: {
        format: 'csv' | 'xlsx';
        columns: ColumnDefinition[];
        includeTitle: boolean;
    }) => void;
}

type ReportTemplates = Record<string, ColumnDefinition[]>;

const ExportReportModal: React.FC<ExportReportModalProps> = ({ isOpen, onClose, reportConfig, onConfirmExport }) => {
    const [selectedColumns, setSelectedColumns] = useState<ColumnDefinition[]>([]);
    const [availableColumns, setAvailableColumns] = useState<ColumnDefinition[]>([]);
    const [format, setFormat] = useState<'csv' | 'xlsx'>('csv');
    const [includeTitle, setIncludeTitle] = useState(true);

    // --- NEW TEMPLATE STATE ---
    const [templates, setTemplates] = useState<ReportTemplates>({});
    const [selectedTemplate, setSelectedTemplate] = useState<string>('custom');

    const confirm = useConfirm();
    const { addToast } = useToast();

    // Load templates from localStorage on mount
    useEffect(() => {
        try {
            const savedTemplates = localStorage.getItem('reportExportTemplates');
            if (savedTemplates) {
                setTemplates(JSON.parse(savedTemplates));
            }
        } catch (error) {
            console.error("Failed to load export templates from localStorage", error);
        }
    }, []);

    // Effect to reset state and apply templates when modal opens or config changes
    useEffect(() => {
        if (isOpen) {
            if (selectedTemplate === 'custom') {
                setSelectedColumns(reportConfig.columns);
                setAvailableColumns([]);
            } else {
                applyTemplate(selectedTemplate);
            }
        }
    }, [isOpen, reportConfig, selectedTemplate]);
    
    const applyTemplate = (templateName: string) => {
        const templateColumns = templates[templateName];
        if (templateColumns) {
            const allColumnKeys = new Set(reportConfig.columns.map(c => c.key));
            const templateColumnKeys = new Set(templateColumns.map(c => c.key));

            const validTemplateColumns = templateColumns.filter(c => allColumnKeys.has(c.key));

            const newAvailable = reportConfig.columns.filter(c => !templateColumnKeys.has(c.key));

            setSelectedColumns(validTemplateColumns);
            setAvailableColumns(newAvailable);
        }
    }

    const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const templateName = e.target.value;
        setSelectedTemplate(templateName);
        if (templateName === 'custom') {
            setSelectedColumns(reportConfig.columns);
            setAvailableColumns([]);
        } else {
            applyTemplate(templateName);
        }
    };
    
    const handleSaveTemplate = async () => {
        const templateName = prompt("Nhập tên cho mẫu xuất báo cáo mới:", `Mẫu của ${reportConfig.title}`);
        if (templateName && templateName.trim()) {
            const newTemplates: ReportTemplates = {
                ...templates,
                [templateName.trim()]: selectedColumns
            };
            setTemplates(newTemplates);
            localStorage.setItem('reportExportTemplates', JSON.stringify(newTemplates));
            setSelectedTemplate(templateName.trim());
            addToast(`Đã lưu mẫu "${templateName.trim()}" thành công.`, 'success');
        }
    };

    const handleDeleteTemplate = async () => {
        if (selectedTemplate === 'custom') return;
        
        const isConfirmed = await confirm({
            title: "Xác nhận Xóa Mẫu",
            message: `Bạn có chắc chắn muốn xóa mẫu "${selectedTemplate}" không?`,
            variant: 'danger',
            confirmText: 'Xóa'
        });

        if (isConfirmed) {
            const { [selectedTemplate]: _, ...remainingTemplates } = templates;
            setTemplates(remainingTemplates);
            localStorage.setItem('reportExportTemplates', JSON.stringify(remainingTemplates));
            setSelectedTemplate('custom');
            addToast(`Đã xóa mẫu "${selectedTemplate}".`, 'info');
        }
    };

    const handleAddColumn = (column: ColumnDefinition) => {
        setSelectedColumns(prev => [...prev, column]);
        setAvailableColumns(prev => prev.filter(c => c.key !== column.key));
        setSelectedTemplate('custom');
    };
    
    const handleRemoveColumn = (column: ColumnDefinition) => {
        setAvailableColumns(prev => [...prev, column]);
        setSelectedColumns(prev => prev.filter(c => c.key !== column.key));
        setSelectedTemplate('custom');
    };

    const moveColumn = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= selectedColumns.length) return;
        
        const newSelected = [...selectedColumns];
        [newSelected[index], newSelected[newIndex]] = [newSelected[newIndex], newSelected[index]]; // Swap
        setSelectedColumns(newSelected);
        setSelectedTemplate('custom');
    };

    const handleExport = () => {
        onConfirmExport({
            format,
            columns: selectedColumns,
            includeTitle,
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex justify-center items-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-5 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Tùy chỉnh Xuất Báo cáo</h3>
                    <button onClick={onClose} className="text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-3xl font-light">&times;</button>
                </div>

                <div className="p-6 space-y-6 flex-grow overflow-y-auto">
                    {/* NEW TEMPLATE SECTION */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border dark:border-slate-600">
                        <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">Quản lý Mẫu</h4>
                        <div className="flex items-center gap-2">
                             <select value={selectedTemplate} onChange={handleTemplateChange} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                                <option value="custom">-- Tùy chỉnh hiện tại --</option>
                                {Object.keys(templates).map(name => <option key={name} value={name}>{name}</option>)}
                            </select>
                            <button onClick={handleSaveTemplate} className="px-3 py-2 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-200 shrink-0">Lưu mẫu mới</button>
                            <button onClick={handleDeleteTemplate} disabled={selectedTemplate === 'custom'} className="p-2 bg-red-50 text-red-600 dark:bg-red-900/40 dark:text-red-300 rounded-lg hover:bg-red-100 disabled:opacity-30 disabled:cursor-not-allowed shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    </div>
                
                    <div>
                        <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">Chọn và Sắp xếp Cột Dữ liệu</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h5 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Các cột có sẵn</h5>
                                <div className="border dark:border-slate-600 rounded-lg p-2 h-48 overflow-y-auto">
                                    {availableColumns.length > 0 ? (
                                        <ul>
                                            {availableColumns.map(col => (
                                                <li key={col.key} onClick={() => handleAddColumn(col)} className="flex justify-between items-center p-1.5 hover:bg-primary-50 dark:hover:bg-primary-900/40 rounded cursor-pointer text-sm">
                                                    <span>{col.label}</span>
                                                    <span className="text-primary-500 font-bold">&#8594;</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-center text-sm text-slate-400 dark:text-slate-500 pt-4">Đã chọn tất cả các cột.</p>
                                    )}
                                </div>
                            </div>
                            <div>
                                <h5 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Các cột sẽ xuất (theo thứ tự)</h5>
                                <div className="border dark:border-slate-600 rounded-lg p-2 h-48 overflow-y-auto">
                                    {selectedColumns.length > 0 ? (
                                        <ul>
                                            {selectedColumns.map((col, index) => (
                                                <li key={col.key} className="flex justify-between items-center p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded text-sm">
                                                    <span onClick={() => handleRemoveColumn(col)} className="text-red-500 font-bold mr-2 cursor-pointer">&#8592;</span>
                                                    <span className="flex-grow">{col.label}</span>
                                                    <div className="flex gap-1">
                                                        <button onClick={() => moveColumn(index, 'up')} disabled={index === 0} className="disabled:opacity-20">&#9650;</button>
                                                        <button onClick={() => moveColumn(index, 'down')} disabled={index === selectedColumns.length - 1} className="disabled:opacity-20">&#9660;</button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ): (
                                        <p className="text-center text-sm text-slate-400 dark:text-slate-500 pt-4">Chưa chọn cột nào.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-2">Tùy chọn Khác</h4>
                         <div className="space-y-2">
                             <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={includeTitle} onChange={(e) => setIncludeTitle(e.target.checked)} className="h-4 w-4 text-primary-600 focus:ring-primary-500 rounded" />
                                <span>Bao gồm tiêu đề báo cáo trong file xuất</span>
                            </label>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="format" value="csv" checked={format === 'csv'} onChange={() => setFormat('csv')} className="h-4 w-4 text-primary-600 focus:ring-primary-500" />
                                    <span>CSV (.csv)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer text-slate-400">
                                    <input type="radio" name="format" value="xlsx" checked={format === 'xlsx'} onChange={() => setFormat('xlsx')} className="h-4 w-4 text-primary-600 focus:ring-primary-500" disabled />
                                    <span>Excel (.xlsx) (sắp có)</span>
                                </label>
                            </div>
                         </div>
                    </div>
                </div>

                <div className="flex justify-end p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 space-x-2">
                    <button onClick={onClose} className="px-5 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500">Hủy</button>
                    <button onClick={handleExport} disabled={selectedColumns.length === 0} className="px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-slate-400 disabled:cursor-not-allowed">
                        Xác nhận & Xuất File
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExportReportModal;
