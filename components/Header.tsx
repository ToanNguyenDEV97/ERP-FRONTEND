import React from 'react';

interface HeaderProps {
  title: string;
  onBack?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onBack }) => {
  return (
    <div className="mb-8">
        <div className="flex items-center gap-4">
            {onBack && (
                <button onClick={onBack} className="p-2 rounded-full bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors shadow-sm border border-slate-200 dark:border-slate-600">
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                </button>
            )}
            <div>
                 <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">{title}</h1>
                 {!onBack && <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">Chào mừng trở lại, đây là tổng quan nhanh về hoạt động kinh doanh của bạn.</p>}
            </div>
        </div>
     
    </div>
  );
};

export default Header;
