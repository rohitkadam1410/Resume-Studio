import React from 'react';
import { SectionAnalysis } from '../../types';

interface ScorecardProps {
    initialScore: number;
    projectedScore: number;
    sections: SectionAnalysis[] | null;
}

export const Scorecard: React.FC<ScorecardProps> = ({ initialScore, projectedScore, sections }) => {
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 bg-green-100 border-green-200';
        if (score >= 50) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
        return 'text-red-600 bg-red-100 border-red-200';
    };

    if (!(sections || initialScore > 0)) {
        return (
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm opacity-60 pointer-events-none grayscale">
                <div className="text-center space-y-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-full mx-auto flex items-center justify-center text-slate-300">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    </div>
                    <h3 className="font-bold text-slate-400">No Analysis Yet</h3>
                    <p className="text-xs text-slate-400">Upload a resume and JD to see your scorecard here.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl animate-fade-in-up">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-slate-100 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    Scorecard
                </h3>
                <p className="text-slate-400 text-sm mt-1">Live analysis against JD.</p>
            </div>

            <div className="space-y-6">
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-slate-300 text-sm font-medium">Initial Match</span>
                        <span className={`text-2xl font-bold ${getScoreColor(initialScore).split(' ')[0]}`}>{initialScore}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                        <div className={`h-2 rounded-full ${getScoreColor(initialScore).replace('text-', 'bg-').split(' ')[1]}`} style={{ width: `${initialScore}%` }}></div>
                    </div>
                </div>

                <div className="p-4 bg-white/5 rounded-xl border border-white/10 relative overflow-hidden">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-green-400 text-sm font-bold">Projected Match</span>
                        <span className="text-3xl font-bold text-green-400">{projectedScore}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-3">
                        <div className="h-3 rounded-full bg-gradient-to-r from-green-500 to-green-300 shadow-[0_0_10px_rgba(34,197,94,0.5)]" style={{ width: `${projectedScore}%` }}></div>
                    </div>
                    <p className="text-xs text-green-500/80 mt-3 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                        After applying AI suggestions
                    </p>
                </div>
            </div>
        </div>
    );
};
