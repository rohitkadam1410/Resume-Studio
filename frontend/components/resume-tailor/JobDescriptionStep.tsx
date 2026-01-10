import React from 'react';

interface JobDescriptionStepProps {
    jdMode: 'text' | 'url';
    setJdMode: (mode: 'text' | 'url') => void;
    jobDescription: string;
    setJobDescription: (jd: string) => void;
    jdUrl: string;
    setJdUrl: (url: string) => void;
    isFetchingJd: boolean;
    onFetchJd: () => void;
    companyName: string;
    setCompanyName: (name: string) => void;
    jobRole: string;
    setJobRole: (role: string) => void;
    disabled: boolean;
}

export const JobDescriptionStep: React.FC<JobDescriptionStepProps> = ({
    jdMode, setJdMode, jobDescription, setJobDescription,
    jdUrl, setJdUrl, isFetchingJd, onFetchJd,
    companyName, setCompanyName, jobRole, setJobRole,
    disabled
}) => {
    return (
        <div className={`transition-all duration-300 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold mr-3">2</span>
                    <label className="text-lg font-semibold text-slate-800">Job Description</label>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setJdMode('text')}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${jdMode === 'text' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Paste Text
                    </button>
                    <button
                        onClick={() => setJdMode('url')}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${jdMode === 'url' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Fetch URL
                    </button>
                </div>
            </div>

            {jdMode === 'text' ? (
                <textarea
                    className="w-full p-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-slate-700 placeholder:text-slate-400 min-h-[200px] resize-y"
                    placeholder="Paste the full job description here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                />
            ) : (
                <div className="space-y-3">
                    <div className="flex space-x-2">
                        <input
                            type="url"
                            placeholder="Paste LinkedIn or Indeed job URL..."
                            className="flex-1 p-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-slate-700 placeholder:text-slate-400"
                            value={jdUrl}
                            onChange={(e) => setJdUrl(e.target.value)}
                        />
                        <button
                            onClick={onFetchJd}
                            disabled={isFetchingJd || !jdUrl}
                            className="px-6 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isFetchingJd ? 'Fetching...' : 'Fetch'}
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 pl-1">
                        Or <button onClick={() => setJdMode('text')} className="text-indigo-600 hover:underline">paste text manually</button> if the specific site isn&apos;t supported.
                    </p>
                </div>
            )}

            {/* Metadata Inputs (Auto-filled or Manual) */}
            <div className="grid grid-cols-2 gap-4 mt-6 border-t border-slate-100 pt-4">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Company Name</label>
                    <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-700 placeholder:text-slate-400"
                        placeholder="e.g. Acme Corp (Optional)"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Job Role</label>
                    <input
                        type="text"
                        value={jobRole}
                        onChange={(e) => setJobRole(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-700 placeholder:text-slate-400"
                        placeholder="e.g. Product Manager (Optional)"
                    />
                </div>
            </div>
        </div>
    );
};
