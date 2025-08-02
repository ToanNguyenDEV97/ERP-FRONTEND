import React, { useState, useEffect, useRef } from 'react';
import { Notification, NavView, NotificationIconType, NotificationType } from '../types';
import { timeSince } from '../utils';

interface NotificationsPopoverProps {
    notifications: Notification[];
    onNavigate: (view: NavView, params?: any) => void;
    onMarkOneRead: (id: string) => void;
    onMarkAllRead: () => void;
}

const Icon: React.FC<{ type: NotificationIconType, className?: string }> = ({ type, className = "h-6 w-6" }) => {
    const icons: Record<NotificationIconType, React.ReactNode> = {
        ShoppingCartIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c.51 0 .962-.343 1.087-.835l1.838-5.513a1.875 1.875 0 0 0-1.087-2.336H6.61a1.875 1.875 0 0 0-1.087 2.336L6.25 14.25Z" />,
        ArchiveBoxXMarkIcon: <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125 2.25 2.25m0 0 2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />,
        CheckCircleIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />,
        TruckIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.508 1.129-1.125V12a1.875 1.875 0 0 0-1.875-1.875h-1.5a1.875 1.875 0 0 0-1.875 1.875v.75m-12-3.375V11.25a1.875 1.875 0 0 1 1.875-1.875h8.25c.655 0 1.233.256 1.664.684m-1.664.684a1.875 1.875 0 0 1 0 2.652M5.25 12V9" />,
        CreditCardIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15A2.25 2.25 0 0 0 2.25 6.75v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />,
        ArrowUturnLeftIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />,
        DocumentCheckIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 0 1 9 9v.375M10.125 2.25A3.375 3.375 0 0 1 13.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 0 1 3.375 3.375M9 15l2.25 2.25L15 12" />,
        WrenchScrewdriverIcon: <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.83-5.83a2.652 2.652 0 0 0-1.42.42Z M7.25 10.75l6 6m-3.837-10.42a2.652 2.652 0 0 1 3.75 0l1.83 1.83c.53.53.53 1.38 0 1.91l-4.59 4.59a2.652 2.652 0 0 1-3.75 0L3 16.25l1.83-1.83c.53-.53 1.38-.53 1.91 0l2.51 2.51" />,
    };
    return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>{icons[type]}</svg>
}

const getIconBgClass = (type: NotificationType) => {
    switch (type) {
        case NotificationType.SUCCESS:
            return 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300';
        case NotificationType.WARNING:
            return 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-600 dark:text-yellow-300';
        case NotificationType.ERROR:
            return 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-300';
        case NotificationType.INFO:
        default:
            return 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300';
    }
};

export const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({ notifications, onNavigate, onMarkOneRead, onMarkAllRead }) => {
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);
    const unreadCount = notifications.filter(n => !n.isRead).length;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = (notification: Notification) => {
        if (notification.nav) {
            onNavigate(notification.nav.view, notification.nav.params);
        }
        onMarkOneRead(notification.id);
        setIsOpen(false);
    }
    
    const handleMarkAll = () => {
        onMarkAllRead();
    }

    return (
        <div className="relative" ref={popoverRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="relative text-slate-600 dark:text-slate-300 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-800"></span>
                )}
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50 animate-fadeIn">
                    <div className="flex justify-between items-center p-3 border-b dark:border-slate-700">
                        <h3 className="font-semibold text-slate-800 dark:text-slate-100">Thông báo</h3>
                        {unreadCount > 0 && (
                            <button onClick={handleMarkAll} className="text-sm text-primary-600 hover:underline">Đánh dấu tất cả đã đọc</button>
                        )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map(n => (
                                <div key={n.id} onClick={() => handleNotificationClick(n)} className={`flex items-start gap-3 p-3 border-b border-slate-100 dark:border-slate-700/50 cursor-pointer ${n.isRead ? 'opacity-70 hover:opacity-100' : 'bg-primary-50 dark:bg-primary-900/30'} hover:bg-slate-100 dark:hover:bg-slate-700/50`}>
                                    <div className={`flex-shrink-0 mt-1 p-1.5 rounded-full ${getIconBgClass(n.type)}`}>
                                      <Icon type={n.icon} className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">{n.title}</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-300">{n.message}</p>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{timeSince(n.timestamp)}</p>
                                    </div>
                                    {!n.isRead && (
                                        <div className="w-2.5 h-2.5 bg-primary-500 rounded-full self-center flex-shrink-0"></div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center p-8 text-slate-500 dark:text-slate-400">
                                <p>Không có thông báo nào.</p>
                            </div>
                        )}
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-700/50 text-center">
                        <button className="text-sm font-semibold text-primary-600 w-full hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-md">Xem tất cả</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default NotificationsPopover;