import React from 'react';
import { SectionAnalysis } from '../../types';

interface AnalysisReviewProps {
    sections: SectionAnalysis[];
    isAuthenticated: boolean;
    isSaving: boolean;
    onSaveClick: () => void;
    onUpdateSuggestion: (sectionIndex: number, editIndex: number, newValue: string) => void;
    onSuggestionStatus: (sectionIndex: number, editIndex: number, newStatus: 'accepted' | 'rejected' | 'pending') => void;
}

export const AnalysisReview: React.FC<AnalysisReviewProps> = ({
    sections, isAuthenticated, isSaving, onSaveClick,
    onUpdateSuggestion, onSuggestionStatus
}) => {
    return (
        <div className="pt-4 space-y-8 animate-fade-in-up">
            <div className="flex items-center">
                <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold mr-3">3</span>
                <label className="text-lg font-semibold text-slate-800">Review Analysis & Suggestions</label>
            </div>
            <p className="text-slate-600">Review the AI&apos;s analysis for each section. Check the identified gaps and edit the suggestions before saving.</p>

            <div className="space-y-8">
                {sections.map((section, sectionIdx) => (
                    <div key={sectionIdx} className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <h3 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">{section.section_name}</h3>

                        {/* Gaps */}
                        {section.gaps && section.gaps.length > 0 && (
                            <div className="mb-6 bg-orange-50 p-4 rounded-xl border border-orange-100">
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

            <button
                onClick={onSaveClick}
                disabled={isSaving}
                className={`w-full py-4 px-6 rounded-xl font-bold text-lg shadow-lg transition-all transform duration-200 mt-6
            ${isSaving
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                        : 'bg-green-600 hover:bg-green-700 text-white hover:shadow-green-500/30 hover:-translate-y-0.5 active:translate-y-0'
                    }`}
            >
                {isSaving ? 'Saving...' : (isAuthenticated ? 'Save to Tracker & View' : 'Login to Save')}
            </button>
        </div>
    );
};
