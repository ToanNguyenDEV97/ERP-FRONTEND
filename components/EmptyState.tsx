import React from 'react';

interface EmptyStateProps {
    icon: React.ReactNode;
    title: string;
    message: string;
    action?: {
        text: string;
        onClick: () => void;
    }
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, message, action }) => {
    return (
        <div className="text-center py-10 px-4 sm:px-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-500 dark:text-primary-400">
                {icon}
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{message}</p>
            {action && (
                <div className="mt-6">
                    <button
                        type="button"
                        onClick={action.onClick}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                        {action.text}
                    </button>
                </div>
            )}
        </div>
    );
}

export default EmptyState;
