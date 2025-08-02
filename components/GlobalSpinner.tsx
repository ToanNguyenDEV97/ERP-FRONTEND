import React from 'react';

const GlobalSpinner: React.FC<{ isProcessing: boolean }> = ({ isProcessing }) => {
    if (!isProcessing) return null;

    return (
        <div className="fixed top-4 right-4 z-[200]">
            <div className="bg-white dark:bg-slate-700 p-2 rounded-full shadow-lg flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-200 pr-2">Đang xử lý...</span>
            </div>
        </div>
    );
};

export default GlobalSpinner;
