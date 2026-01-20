import React, { useState } from 'react';
import { SectionAnalysis, RoleAnalysis, ResumeDiagnosis } from '../../types';

interface AnalysisReviewProps {
    roleAnalysis?: RoleAnalysis;
    diagnosis?: ResumeDiagnosis;
    proposedTitle?: string;
    proposedSummary?: string;
    sections: SectionAnalysis[];
    isAuthenticated: boolean;
    isSaving: boolean;
    onSaveClick: () => void;
    onUpdateSuggestion: (sectionIndex: number, editIndex: number, newValue: string) => void;
    onSuggestionStatus: (sectionIndex: number, editIndex: number, newStatus: 'accepted' | 'rejected' | 'pending') => void;
}

export const AnalysisReview: React.FC<AnalysisReviewProps> = ({
    roleAnalysis, diagnosis, proposedTitle, proposedSummary,
    sections, isAuthenticated, isSaving, onSaveClick,
    onUpdateSuggestion, onSuggestionStatus
}) => {
    const [step, setStep] = useState<'analysis' | 'improvements'>('analysis');

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (step === 'analysis') {
        return (
            <div className="pt-4 space-y-8 animate-fade-in-up">
                <div className="flex items-center">
                    <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold mr-3">3</span>
                    <label className="text-lg font-semibold text-slate-800">Review Analysis</label>
                </div>
                <p className="text-slate-600">Review the AI&apos;s analysis for each section and identify the key gaps.</p>

                {/* Role Analysis Card */}
                {roleAnalysis && (
                    <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 shadow-sm mb-6">
                        <h3 className="text-xl font-bold text-indigo-800 mb-4 border-b border-indigo-200 pb-2">Step 1: Role & Recruiter Analysis</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide mb-1">Core Role Identity</p>
                                <p className="text-slate-700 font-medium">{roleAnalysis.identity}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide mb-1">Seniority Signals</p>
                                <div className="flex flex-wrap gap-2">
                                    {roleAnalysis.seniority_signals.map((signal, i) => (
                                        <span key={i} className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-md border border-indigo-200">{signal}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide mb-1">Top ATS Keyword Clusters</p>
                                <div className="flex flex-wrap gap-2">
                                    {roleAnalysis.keywords.map((kw, i) => (
                                        <span key={i} className="px-2 py-1 bg-white text-slate-700 text-sm rounded-md border border-indigo-100 shadow-sm">{kw}</span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide mb-1">Industry Context</p>
                                <p className="text-slate-600 text-sm">{roleAnalysis.industry_context}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide mb-1">Geographic Context</p>
                                <p className="text-slate-600 text-sm">{roleAnalysis.geographic_expectations}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Diagnosis Card */}
                {diagnosis && (
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Step 2: Resume Diagnosis</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                <h4 className="flex items-center text-green-700 font-bold mb-3">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Strong Matches
                                </h4>
                                <ul className="space-y-1">
                                    {diagnosis.strong_matches.map((item, i) => (
                                        <li key={i} className="flex items-start text-sm text-slate-700">
                                            <span className="mr-2 text-green-500">•</span> {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                <h4 className="flex items-center text-red-700 font-bold mb-3">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    Critical Gaps & Risks
                                </h4>
                                <ul className="space-y-1">
                                    {diagnosis.gaps.map((item, i) => (
                                        <li key={i} className="flex items-start text-sm text-slate-700">
                                            <span className="mr-2 text-red-500">•</span> {item}
                                        </li>
                                    ))}
                                    {diagnosis.ats_risks.map((item, i) => (
                                        <li key={`risk-${i}`} className="flex items-start text-sm text-slate-700">
                                            <span className="mr-2 text-orange-500">⚠</span> {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-8">
                    {sections.map((section, sectionIdx) => (
                        <div key={sectionIdx} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">{section.section_name}</h3>

                            {/* Gaps ONLY */}
                            {section.gaps && section.gaps.length > 0 ? (
                                <div className="mb-0 bg-orange-50 p-4 rounded-xl border border-orange-100">
                                    <h4 className="text-sm font-bold uppercase text-orange-600 tracking-wide mb-2 flex items-center">
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                        Identified Gaps
                                    </h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                                        {section.gaps.map((gap, i) => (
                                            <li key={i}>{gap}</li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <p className="text-slate-500 italic text-sm">No specific gaps identified for this section.</p>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        onClick={() => { setStep('improvements'); scrollToTop(); }}
                        className="py-3 px-8 rounded-xl font-bold text-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg transition-all transform hover:-translate-y-0.5"
                    >
                        Next: View Improvements →
                    </button>
                </div>
            </div>
        );
    }

    // Step === 'improvements'
    return (
        <div className="pt-4 space-y-8 animate-fade-in-up">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <span className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold mr-3">4</span>
                    <label className="text-lg font-semibold text-slate-800">Review & Apply Improvements</label>
                </div>
                <button
                    onClick={() => { setStep('analysis'); scrollToTop(); }}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold flex items-center"
                >
                    ← Back to Analysis
                </button>
            </div>
            <p className="text-slate-600">Review the suggested improvements and edit the content before saving your new resume.</p>

            {/* Proposed Title & Summary Callout */}
            {(proposedTitle || proposedSummary) && (
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-2xl shadow-lg mb-8 text-white">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Target Role Positioning</h3>
                    {proposedTitle && (
                        <div className="mb-4">
                            <p className="text-xs text-slate-400 mb-1">Proposed Professional Title</p>
                            <p className="text-2xl font-bold text-white tracking-tight">{proposedTitle}</p>
                        </div>
                    )}
                    {proposedSummary && (
                        <div>
                            <p className="text-xs text-slate-400 mb-1">Optimized Profil Summary</p>
                            <p className="text-slate-300 leading-relaxed italic border-l-4 border-indigo-500 pl-4">{proposedSummary}</p>
                        </div>
                    )}
                </div>
            )}


            <div className="space-y-8">
                {sections.map((section, sectionIdx) => (
                    <div key={sectionIdx} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">{section.section_name}</h3>

                        {/* Gaps ONLY */}
                        {section.gaps && section.gaps.length > 0 && (
                            <div className="mb-6 bg-orange-50 p-4 rounded-xl border border-orange-100 opacity-70">
                                <h4 className="text-sm font-bold uppercase text-orange-600 tracking-wide mb-2 flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    Identified Gaps (Reference)
                                </h4>
                                <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                                    {section.gaps.map((gap, i) => (
                                        <li key={i}>{gap}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Suggestions */}
                        {section.suggestions && section.suggestions.length > 0 && (
                            <div className="mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <h4 className="text-sm font-bold uppercase text-blue-600 tracking-wide mb-2 flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Strategic Advice
                                </h4>
                                <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                                    {section.suggestions.map((suggestion, i) => (
                                        <li key={i}>{suggestion}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Edits */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-sm leading-relaxed text-slate-700 whitespace-pre-wrap font-sans">
                            {(() => {
                                if (!section.original_text) {
                                    return section.edits.length === 0 ?
                                        <p className="italic text-slate-400">No edits suggested.</p> :
                                        section.edits.map((edit, editIdx) => (
                                            <div key={editIdx} className={`mb-4 border-b pb-4 last:border-0 rounded-lg p-3 transition-colors ${edit.status === 'accepted' ? 'bg-green-50 border-green-100' : edit.status === 'rejected' ? 'bg-slate-100 opacity-60' : 'bg-white'}`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className={`text-xs font-bold uppercase tracking-wider ${edit.status === 'accepted' ? 'text-green-600' : edit.status === 'rejected' ? 'text-slate-500' : 'text-indigo-500'}`}>
                                                        {edit.status === 'accepted' ? '✓ Accepted' : edit.status === 'rejected' ? '✕ Rejected' : 'Suggestion'}
                                                    </span>
                                                    <div className="flex space-x-1">
                                                        {edit.status !== 'accepted' && (
                                                            <button
                                                                onClick={() => onSuggestionStatus(sectionIdx, editIdx, 'accepted')}
                                                                className="p-1 hover:bg-green-100 text-green-600 rounded"
                                                                title="Accept"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                                            </button>
                                                        )}
                                                        {edit.status !== 'rejected' && (
                                                            <button
                                                                onClick={() => onSuggestionStatus(sectionIdx, editIdx, 'rejected')}
                                                                className="p-1 hover:bg-red-100 text-red-500 rounded"
                                                                title="Reject"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                            </button>
                                                        )}
                                                        {edit.status !== 'pending' && (
                                                            <button
                                                                onClick={() => onSuggestionStatus(sectionIdx, editIdx, 'pending')}
                                                                className="p-1 hover:bg-slate-200 text-slate-400 rounded"
                                                                title="Reset"
                                                            >
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="line-through decoration-red-400 decoration-2 opacity-60 text-slate-500 mb-1 text-xs">{edit.target_text}</div>
                                                <textarea
                                                    className={`w-full p-2 border rounded text-sm focus:ring-2 outline-none ${edit.status === 'rejected' ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-green-50 border-green-200 text-green-800 focus:ring-green-500/20'}`}
                                                    value={edit.new_content}
                                                    onChange={(e) => onUpdateSuggestion(sectionIdx, editIdx, e.target.value)}
                                                    disabled={edit.status === 'rejected'}
                                                />
                                            </div>
                                        ));
                                }

                                const text = section.original_text;
                                const elements = [];
                                let lastIndex = 0;

                                // Find edits positions
                                const sortedEdits = [...section.edits].map((e, i) => {
                                    const pos = text.indexOf(e.target_text);
                                    return { ...e, origIdx: i, pos };
                                }).filter(e => e.pos !== -1).sort((a, b) => a.pos - b.pos);

                                // Filter overlapping edits
                                const validEdits = [];
                                let currentCoverageLimit = -1;
                                for (const edit of sortedEdits) {
                                    if (edit.pos >= currentCoverageLimit) {
                                        validEdits.push(edit);
                                        currentCoverageLimit = edit.pos + edit.target_text.length;
                                    }
                                }

                                validEdits.forEach((edit) => {
                                    if (edit.pos > lastIndex) {
                                        elements.push(<span key={`pre-${edit.origIdx}`}>{text.substring(lastIndex, edit.pos)}</span>);
                                    }

                                    elements.push(
                                        <span key={`edit-${edit.origIdx}`} className="mx-1 inline-block align-top">
                                            <span className="line-through decoration-red-400 decoration-2 opacity-60 text-slate-500 mr-1 bg-red-50/50 px-1 rounded">
                                                {edit.target_text}
                                            </span>
                                            <textarea
                                                className="inline-block min-w-[300px] w-full max-w-full p-2 bg-green-50 border border-green-200 text-green-800 rounded text-sm mt-1 focus:ring-2 focus:ring-green-500/20 outline-none resize-y"
                                                rows={Math.max(2, Math.ceil(edit.new_content.length / 60))}
                                                value={edit.new_content}
                                                onChange={(e) => onUpdateSuggestion(sectionIdx, edit.origIdx, e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </span>
                                    );
                                    lastIndex = edit.pos + edit.target_text.length;
                                });

                                if (lastIndex < text.length) {
                                    elements.push(<span key="end">{text.substring(lastIndex)}</span>);
                                }

                                return elements;
                            })()}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex gap-4 pt-6">
                <button
                    onClick={() => { setStep('analysis'); scrollToTop(); }}
                    className="flex-1 py-4 px-6 rounded-xl font-bold text-lg border-2 border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
                >
                    ← Back to Analysis
                </button>
                <button
                    onClick={onSaveClick}
                    disabled={isSaving}
                    className={`flex-[2] py-4 px-6 rounded-xl font-bold text-lg shadow-lg transition-all transform duration-200
                ${isSaving
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                            : 'bg-green-600 hover:bg-green-700 text-white hover:shadow-green-500/30 hover:-translate-y-0.5 active:translate-y-0'
                        }`}
                >
                    {isSaving ? 'Saving...' : (isAuthenticated ? 'Save to Tracker & View' : 'Login to Save')}
                </button>
            </div>
        </div>
    );
};
