import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NavView } from '../types';
import * as api from '../api';

interface GlobalSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (view: NavView, params?: any) => void;
}

const ResultIcon: React.FC<{ type: api.GlobalSearchResultItem['type'] }> = ({ type }) => {
    const icons = {
        'Khách hàng': <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
        'Sản phẩm': <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>,
        'Đơn hàng': <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
        'Đơn mua hàng': <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>,
        'Nhà cung cấp': <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 016-6h6a6 6 0 016 6v1h-1.5M15 21h-3M15 21h3m-6-15a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    };
    return icons[type] || null;
};

const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
    isOpen, onClose, onNavigate
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const [searchResults, setSearchResults] = useState<api.GlobalSearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const flatResults = useMemo(() => {
        return searchResults.flatMap(group => group.results);
    }, [searchResults]);

    useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setSearchResults([]);
            setActiveIndex(0);
        }
    }, [isOpen]);
    
    useEffect(() => {
        setActiveIndex(0);
        if (searchTerm.length < 2) {
            setSearchResults([]);
            return;
        }

        const handler = setTimeout(async () => {
            setIsLoading(true);
            const results = await api.globalSearch(searchTerm);
            setSearchResults(results);
            setIsLoading(false);
        }, 300); // Debounce API calls

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (flatResults.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => (prev + 1) % flatResults.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => (prev - 1 + flatResults.length) % flatResults.length);
        } else if (e.key === 'Enter') {
            if (flatResults[activeIndex]) {
                handleSelect(flatResults[activeIndex]);
            }
        }
    }, [activeIndex, flatResults, onNavigate, onClose]);

    const handleSelect = (result: api.GlobalSearchResultItem) => {
        onNavigate(result.nav.view, result.nav.params);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-start pt-20 sm:pt-32" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-xl transform transition-all" onClick={e => e.stopPropagation()}>
                <div className="relative">
                    <svg className="absolute top-1/2 left-4 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    <input
                        type="text"
                        placeholder="Tìm kiếm khách hàng, sản phẩm, đơn hàng..."
                        className="w-full pl-12 pr-4 py-4 border-b border-slate-200 dark:border-slate-700 bg-transparent text-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                    />
                     {isLoading && <div className="absolute top-1/2 right-4 -translate-y-1/2 animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>}
                </div>
                
                <div className="max-h-[60vh] overflow-y-auto">
                    {searchTerm.length >= 2 && !isLoading && (
                        flatResults.length > 0 ? (
                            searchResults.map((group, groupIndex) => (
                                <div key={group.type} className="p-2">
                                    <h3 className="text-xs font-semibold uppercase text-slate-400 dark:text-slate-500 px-4 py-1">{group.type}</h3>
                                    <ul>
                                        {group.results.map((result) => {
                                            const globalIndex = flatResults.findIndex(r => r.id === result.id && r.type === result.type);
                                            return (
                                                <li key={result.id + result.type} 
                                                    onClick={() => handleSelect(result)}
                                                    onMouseEnter={() => setActiveIndex(globalIndex)}
                                                    className={`flex items-center space-x-4 p-3 mx-2 rounded-lg cursor-pointer ${activeIndex === globalIndex ? 'bg-primary-100 dark:bg-primary-900/50' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                                                >
                                                    <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300"><ResultIcon type={result.type as any}/></div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800 dark:text-slate-100">{result.title}</p>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400">{result.description}</p>
                                                    </div>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </div>
                            ))
                        ) : (
                            <div className="text-center p-16 text-slate-500 dark:text-slate-400">
                                <p className="font-semibold">Không tìm thấy kết quả</p>
                                <p className="text-sm mt-1">Thử tìm kiếm với từ khóa khác.</p>
                            </div>
                        )
                    )}
                     {searchTerm.length < 2 && (
                        <div className="text-center p-16 text-slate-400 dark:text-slate-500">
                           <p>Nhập ít nhất 2 ký tự để bắt đầu tìm kiếm.</p>
                        </div>
                    )}
                </div>

                 <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-2 text-xs text-slate-500 dark:text-slate-400 rounded-b-xl flex justify-end items-center">
                    <kbd className="px-2 py-1.5 text-xs font-sans font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md">↑</kbd>
                    <kbd className="px-2 py-1.5 text-xs font-sans font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md ml-1">↓</kbd>
                    <span className="ml-2">để điều hướng,</span>
                     <kbd className="px-2 py-1.5 text-xs font-sans font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md ml-2">↵</kbd>
                    <span className="ml-2">để chọn,</span>
                     <kbd className="px-2 py-1.5 text-xs font-sans font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md ml-2">ESC</kbd>
                    <span className="ml-2">để thoát.</span>
                 </div>
            </div>
        </div>
    );
};

export default GlobalSearchModal;
