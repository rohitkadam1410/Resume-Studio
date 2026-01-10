import Link from 'next/link';
import React from 'react';

interface TrialBannersProps {
    isAuthenticated: boolean;
    usageCount: number;
    showTrialWarning: boolean;
    onLogout: () => void;
}

export const TrialBanners: React.FC<TrialBannersProps> = ({ isAuthenticated, usageCount, showTrialWarning, onLogout }) => {
    return (
        <>
            {/* Small Trial Indicator - Top Right */}
            {!isAuthenticated ? (
                <div className="fixed top-4 right-4 z-50 animate-fade-in">
                    <Link
                        href="/login"
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-sm font-semibold">
                            {usageCount === 0 && "Login • 2 free daily uses"}
                            {usageCount === 1 && "Login • 1 daily use left"}
                            {usageCount >= 2 && "Login Required"}
                        </span>
                        {usageCount < 2 && (
                            <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-bold">
                                {2 - usageCount}
                            </span>
                        )}
                    </Link>
                </div>
            ) : (
                <div className="fixed top-4 right-4 z-50 animate-fade-in">
                    <button
                        onClick={onLogout}
                        className="flex items-center space-x-2 px-4 py-2 bg-white text-slate-600 rounded-full shadow-md hover:shadow-lg transition-all hover:bg-slate-50 border border-slate-200"
                    >
                        <span className="text-sm font-bold">Logout</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    </button>
                </div>
            )}

            {/* Trial Warning Banner */}
            {!isAuthenticated && showTrialWarning && usageCount < 2 && (
                <div className="mb-6 p-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-lg border border-amber-400 animate-fade-in-up">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <svg className="w-6 h-6 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div>
                                <p className="text-white font-bold">Trial Limit Notice</p>
                                <p className="text-white/90 text-sm">
                                    You have <span className="font-bold">1 free daily use</span> remaining.
                                    Login or create an account for unlimited access!
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/login"
                            className="ml-4 px-6 py-2 bg-white text-orange-600 rounded-lg font-bold hover:bg-orange-50 transition-colors whitespace-nowrap"
                        >
                            Login Now
                        </Link>
                    </div>
                </div>
            )}

            {/* Limit Reached - Redirect Banner */}
            {!isAuthenticated && usageCount >= 2 && (
                <div className="mb-6 p-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl shadow-xl border border-red-400 animate-fade-in-up">
                    <div className="text-center text-white">
                        <div className="mb-4">
                            <svg className="w-16 h-16 mx-auto text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-extrabold mb-2">Free Trial Limit Reached</h3>
                        <p className="text-white/90 mb-6">
                            You&apos;ve used your 2 free daily tailorings! Create a free account to continue with unlimited access.
                        </p>
                        <Link
                            href="/login"
                            className="inline-block px-8 py-3 bg-white text-red-600 rounded-xl font-bold text-lg hover:bg-red-50 transition-all transform hover:scale-105 shadow-lg"
                        >
                            Create Free Account →
                        </Link>
                    </div>
                </div>
            )}
        </>
    );
};
