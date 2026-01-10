import React from 'react';
import { SectionAnalysis } from '../../types';

interface ResumePreviewProps {
    sections: SectionAnalysis[];
    onEditClick: () => void;
    onStartOver: () => void;
    onDownload: () => void;
    isDownloading: boolean;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({
    sections, onEditClick, onStartOver, onDownload, isDownloading
}) => {
    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-slate-800">Final Digital Resume</h3>
                <button
                    onClick={onEditClick}
                    className="text-indigo-600 hover:underline font-medium"
                >
                    ← Back to Editing
                </button>
            </div>

            <div className="grid grid-cols-2 gap-6 h-[600px]">
                {/* Original */}
                <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col">
                    <div className="bg-slate-50 p-3 border-b border-slate-200 font-bold text-slate-500 uppercase text-xs tracking-wider">Original</div>
                    <div className="p-4 overflow-y-auto bg-slate-50/50 flex-1 whitespace-pre-wrap text-sm text-slate-600 font-mono">
                        {sections.map((section, idx) => (
                            <div key={idx} className="mb-6 last:mb-0">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-200 pb-1">
                                    {section.section_name}
                                </h4>
                                <div className="leading-relaxed">
                                    {section.original_text}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tailored */}
                <div className="border border-green-200 rounded-xl overflow-hidden flex flex-col shadow-lg shadow-green-100">
                    <div className="bg-green-50 p-3 border-b border-green-200 font-bold text-green-700 uppercase text-xs tracking-wider flex justify-between">
                        <span>Tailored Version</span>
                        <span className="bg-green-200 text-green-800 px-2 rounded-full text-[10px]">Ready</span>
                    </div>
                    <div className="p-4 overflow-y-auto bg-white flex-1 whitespace-pre-wrap text-sm text-slate-800 font-medium">
                        {sections.map((section, idx) => {
                            let content = section.original_text || "";
                            if (section.edits) {
                                section.edits.forEach(edit => {
                                    if (edit.target_text && edit.new_content && edit.status !== 'rejected') {
                                        content = content.replace(edit.target_text, edit.new_content);
                                    }
                                });
                            }
                            return (
                                <div key={idx} className="mb-6 last:mb-0">
                                    <h4 className="text-xs font-bold text-green-700 uppercase tracking-widest mb-2 border-b border-green-100 pb-1">
                                        {section.section_name}
                                    </h4>
                                    <div className="leading-relaxed">
                                        {content}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-blue-800 text-sm">
                <strong>Note:</strong> This resume is now saved to your profile. You can access it anytime from the sidebar.
            </div>

            <button
                onClick={onStartOver}
                className="w-full py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors"
            >
                Start New Tailoring
            </button>

            <div className="mt-4 flex justify-center">
                <button
                    onClick={onDownload}
                    disabled={isDownloading}
                    className={`px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-lg flex items-center
                    ${isDownloading ? 'opacity-70 cursor-wait' : ''}`}
                >
                    {isDownloading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Download Word Resume
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
