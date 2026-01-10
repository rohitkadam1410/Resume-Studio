'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Check authentication status
        const token = localStorage.getItem('auth_token');
        setIsAuthenticated(!!token);
    }, [pathname]);

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        setIsAuthenticated(false);
        router.push('/');
    };

    const isActive = (path: string) => pathname === path;

    return (
        <div className={`${isCollapsed ? 'w-20' : 'w-64'} h-full bg-slate-900 text-white flex flex-col shadow-xl transition-all duration-300`}>
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                {!isCollapsed && (
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-lg">R</div>
                        <span className="text-xl font-bold tracking-tight">Resume Tailor</span>
                    </div>
                )}
                {isCollapsed && (
                    <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-lg mx-auto">R</div>
                )}
            </div>

            <nav className="flex-1 px-4 py-6 space-y-2">
                <Link
                    href="/"
                    className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-lg transition-colors ${isActive('/') ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                    title="Resume Tailor"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    {!isCollapsed && <span className="font-medium">Resume Tailor</span>}
                </Link>

                <Link
                    href="/tracker"
                    className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-lg transition-colors ${isAuthenticated
                            ? (isActive('/tracker') ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white')
                            : 'text-slate-600 opacity-50 cursor-not-allowed'
                        }`}
                    title={isAuthenticated ? "Tracker" : "Login required"}
                    onClick={(e) => {
                        if (!isAuthenticated) {
                            e.preventDefault();
                            router.push('/login');
                        }
                    }}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                    {!isCollapsed && <span className="font-medium">Tracker {!isAuthenticated && '🔒'}</span>}
                </Link>

                {/* Login/Logout Button */}
                {isAuthenticated ? (
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-lg transition-colors text-slate-400 hover:bg-slate-800 hover:text-white`}
                        title="Logout"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        {!isCollapsed && <span className="font-medium">Logout</span>}
                    </button>
                ) : (
                    <Link
                        href="/login"
                        className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 rounded-lg transition-colors ${isActive('/login') ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                        title="Login"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                        {!isCollapsed && <span className="font-medium">Login</span>}
                    </Link>
                )}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="w-full flex items-center justify-center px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                    title={isCollapsed ? 'Expand' : 'Collapse'}
                >
                    <svg className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                    {!isCollapsed && <span className="ml-2 text-sm">Collapse</span>}
                </button>
            </div>
        </div>
    );
}
