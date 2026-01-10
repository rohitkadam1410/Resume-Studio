import React, { useEffect } from 'react';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info';
    onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColors = {
        success: 'bg-emerald-500',
        error: 'bg-red-500',
        info: 'bg-indigo-500'
    };

    return (
        <div className={`fixed top-24 right-8 z-[100] px-6 py-4 rounded-xl shadow-2xl text-white font-medium transform transition-all animate-fade-in-up flex items-center gap-3 min-w-[300px] ${bgColors[type]}`}>
            {type === 'success' && (
                <div className="bg-white/20 p-1 rounded-full">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                </div>
            )}
            {type === 'error' && (
                <div className="bg-white/20 p-1 rounded-full">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
            )}
            <span className="flex-1 text-sm">{message}</span>
            <button onClick={onClose} className="opacity-60 hover:opacity-100 transition-opacity p-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>
    );
};
