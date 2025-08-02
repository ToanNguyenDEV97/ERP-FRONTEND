import React from 'react';
import { NavItemType, User } from '../types';

interface MainHeaderProps {
  activeNavItem?: NavItemType;
  onSearchClick: () => void;
  children?: React.ReactNode;
  currentUser: User;
}

const MainHeader: React.FC<MainHeaderProps> = ({ activeNavItem, onSearchClick, children, currentUser }) => {
  return (
    <div className="mb-8 flex justify-between items-center">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">{activeNavItem?.label || 'ERP System'}</h1>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 mt-1">
                {activeNavItem?.id === 'DASHBOARD' ? `Chào mừng trở lại, ${currentUser.name}!` : `Quản lý ${activeNavItem?.label.toLowerCase()} của bạn tại đây.`}
            </p>
        </div>
        <div className="flex items-center gap-4">
            <button 
                onClick={onSearchClick} 
                className="hidden md:flex items-center space-x-2 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <span>Tìm kiếm...</span>
                <kbd className="ml-4 px-2 py-1 text-xs font-sans font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-md">⌘K</kbd>
            </button>
            {children}
        </div>
    </div>
  );
};

export default MainHeader;
