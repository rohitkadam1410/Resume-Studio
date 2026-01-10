'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Toast } from '@/components/Toast';

// ... (retain interfaces)

interface EditSuggestion {
    target_text: string;
    new_content: string;
    action: string;
    rationale?: string;
}

interface SectionAnalysis {
    section_name: string;
    original_text?: string;
    gaps: string[];
    suggestions?: string[];
    edits: EditSuggestion[];
}

interface SavedResume {
    id: number;
    filename: string;
    original_text: string;
    tailored_text: string;
    tailored_sections: SectionAnalysis[];
    created_at: string;
    initial_score?: number;
    projected_score?: number;
}

export default function ResumeViewerPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    const [resume, setResume] = useState<SavedResume | null>(null);
    const [sections, setSections] = useState<SectionAnalysis[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [viewMode, setViewMode] = useState<'edit' | 'preview'>('preview'); // Default to preview
    const [isDownloading, setIsDownloading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    useEffect(() => {
        const fetchResume = async () => {
            if (!id) return;
            try {
                const token = localStorage.getItem('auth_token');
                if (!token) {
                    router.push('/login');
                    return;
                }

                const response = await fetch(`http://localhost:8000/api/resume/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setResume(data);
                    setSections(data.tailored_sections);
                } else {
                    console.error('Failed to fetch resume');
                    router.push('/tracker'); // Redirect if not found
                }
            } catch (error) {
                console.error('Error fetching resume:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchResume();
    }, [id, router]);

    const handleUpdateSuggestion = (sectionIndex: number, editIndex: number, newValue: string) => {
        if (!sections) return;
        const newSections = [...sections];
        newSections[sectionIndex].edits[editIndex].new_content = newValue;
        setSections(newSections);
    };

    const handleSaveChanges = async () => {
        if (!sections || !resume) return;

        setIsSaving(true);
        try {
            // Reconstruct tailored text
            const tailoredText = sections.map(s => {
                let text = s.original_text || "";
                s.edits.forEach(edit => {
                    text = text.replace(edit.target_text, edit.new_content);
                });
                return text;
            }).join('\n\n');

            const token = localStorage.getItem('auth_token');
            const response = await fetch(`http://localhost:8000/api/resume/${resume.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    filename: resume.filename,
                    original_text: resume.original_text,
                    tailored_text: tailoredText,
                    tailored_sections: sections
                }),
            });

            if (response.ok) {
                // data not needed if not used, or just await response.json() if side-effect
                await response.json();
                setResume(prev => prev ? { ...prev, tailored_text: tailoredText, tailored_sections: sections } : null);
                setToast({ message: 'Changes saved successfully!', type: 'success' });
                setViewMode('preview');
            } else {
                setToast({ message: 'Failed to save changes.', type: 'error' });
            }
        } catch (error) {
            console.error('Error saving changes:', error);
            setToast({ message: 'Error saving changes.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownload = async () => {
        if (!sections || !resume) return;

        setIsDownloading(true);
        try {
            const response = await fetch('http://localhost:8000/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filename: resume.filename,
                    sections: sections
                }),
            });
            const data = await response.json();
            if (data.download_url) {
                const link = document.createElement('a');
                link.href = data.download_url;
                link.download = data.pdf_path ? data.pdf_path.split(/[\\/]/).pop() : 'resume.docx';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                alert("Failed to generate download link. File might be missing.");
            }
        } catch (error) {
            console.error("Error downloading:", error);
            alert("Error downloading file.");
        } finally {
            setIsDownloading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!resume || !sections) return null;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                    <Link href="/tracker" className="text-slate-500 hover:text-slate-800 transition-colors">
                        ← Back to Tracker
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {resume.filename}
                    </h1>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg items-center space-x-2">
                    <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm disabled:opacity-70`}
                    >
                        {isDownloading ? (
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : (
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        )}
                        Word
                    </button>
                    <div className="h-6 w-px bg-slate-300 mx-1"></div>
                    <button
                        onClick={() => setViewMode('preview')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === 'preview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Preview & Compare
                    </button>
                    <button
                        onClick={() => setViewMode('edit')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${viewMode === 'edit' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Edit Suggestions
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-3 space-y-8">
                    {/* ... (edit mode logic remains same/wrapped) ... */}

                    {
                        viewMode === 'preview' && (
                            <div className="grid grid-cols-2 gap-6 h-[calc(100vh-200px)] animate-fade-in-up">
                                <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col bg-white">
                                    <div className="bg-slate-50 p-3 border-b border-slate-200 font-bold text-slate-500 uppercase text-xs tracking-wider">Original</div>
                                    <div className="p-6 overflow-y-auto flex-1 whitespace-pre-wrap text-sm text-slate-600 font-mono">
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

                                <div className="border border-green-200 rounded-xl overflow-hidden flex flex-col shadow-lg shadow-green-100 bg-white">
                                    <div className="bg-green-50 p-3 border-b border-green-200 font-bold text-green-700 uppercase text-xs tracking-wider flex justify-between">
                                        <span>Tailored Version</span>
                                    </div>
                                    <div className="p-6 overflow-y-auto flex-1 text-sm text-slate-800 font-medium">
                                        {sections.map((section, idx) => {
                                            let content = section.original_text || "";
                                            if (section.edits) {
                                                section.edits.forEach(edit => {
                                                    if (edit.target_text && edit.new_content) {
                                                        content = content.split(edit.target_text).join(edit.new_content);
                                                    }
                                                });
                                            }

                                            // Formatting helper for bullets
                                            const renderContent = (text: string) => {
                                                if (!text) return null;
                                                // Normalize newlines and ensure bullets like '•' have a preceding newline if they are inline
                                                const normalizedText = text
                                                    .replace(/\r\n/g, '\n')
                                                    .replace(/\r/g, '\n')
                                                    .replace(/([^\n])\s*([•\-\*])\s+/g, '$1\n$2 ');

                                                // Check if text has markdown style bullets
                                                const hasBullets = normalizedText.match(/(^|\n)\s*[\*\-\•]\s/);

                                                if (!hasBullets) return <div className="whitespace-pre-wrap">{text}</div>;

                                                // Split by lines
                                                const lines = normalizedText.split('\n');
                                                const elements: React.ReactNode[] = [];
                                                let inList = false;
                                                let listItems: string[] = [];

                                                lines.forEach((line, i) => {
                                                    const trimmed = line.trim();
                                                    const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ');

                                                    if (isBullet) {
                                                        inList = true;
                                                        // Remove bullet marker
                                                        listItems.push(trimmed.replace(/^[\*\-\•]\s+/, ''));
                                                    } else {
                                                        if (inList) {
                                                            // Close list
                                                            elements.push(
                                                                <ul key={`ul-${i}`} className="list-disc list-inside space-y-1 my-2 ps-4">
                                                                    {listItems.map((item, liIdx) => <li key={liIdx}>{item}</li>)}
                                                                </ul>
                                                            );
                                                            inList = false;
                                                            listItems = [];
                                                        }
                                                        if (trimmed) elements.push(<p key={`p-${i}`} className="my-1">{line}</p>);
                                                    }
                                                });

                                                // Flush remaining list
                                                if (inList && listItems.length > 0) {
                                                    elements.push(
                                                        <ul key={`ul-end`} className="list-disc list-inside space-y-1 my-2 ps-4">
                                                            {listItems.map((item, liIdx) => <li key={liIdx}>{item}</li>)}
                                                        </ul>
                                                    );
                                                }

                                                return <div>{elements}</div>;
                                            };

                                            const handleCopySection = (text: string) => {
                                                if (navigator.clipboard && window.isSecureContext) {
                                                    navigator.clipboard.writeText(text).then(() => {
                                                        setToast({ message: 'Section content copied!', type: 'success' });
                                                    }, (err) => {
                                                        console.error('Async: Could not copy text: ', err);
                                                        fallbackCopyTextToClipboard(text);
                                                    });
                                                } else {
                                                    fallbackCopyTextToClipboard(text);
                                                }
                                            };

                                            const fallbackCopyTextToClipboard = (text: string) => {
                                                const textArea = document.createElement("textarea");
                                                textArea.value = text;
                                                textArea.style.top = "0";
                                                textArea.style.left = "0";
                                                textArea.style.position = "fixed";
                                                document.body.appendChild(textArea);
                                                textArea.focus();
                                                textArea.select();
                                                try {
                                                    document.execCommand('copy');
                                                    setToast({ message: 'Section content copied!', type: 'success' });
                                                } catch (err) {
                                                    console.error('Fallback: Oops, unable to copy', err);
                                                    setToast({ message: 'Unable to copy to clipboard.', type: 'error' });
                                                }
                                                document.body.removeChild(textArea);
                                            };

                                            return (
                                                <div key={idx} className="mb-6 last:mb-0 group/section">
                                                    <div className="flex justify-between items-center mb-2 border-b border-indigo-50 pb-1">
                                                        <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-widest">
                                                            {section.section_name}
                                                        </h4>
                                                        <button
                                                            onClick={() => handleCopySection(content)}
                                                            className="text-slate-400 hover:text-indigo-600 transition-colors opacity-0 group-hover/section:opacity-100 p-1"
                                                            title="Copy to clipboard"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                                        </button>
                                                    </div>
                                                    <div className="leading-relaxed">
                                                        {renderContent(content)}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {
                        viewMode === 'edit' && (
                            <div className="space-y-8 animate-fade-in-up">
                                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-blue-800 text-sm">
                                    Edit the suggestions below. Click &quot;Save Changes&quot; to update your tailored resume.
                                </div>

                                <div className="space-y-6">
                                    {sections.map((section, sectionIdx) => (
                                        <div key={sectionIdx} className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                            <h3 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">{section.section_name}</h3>

                                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-sm leading-relaxed text-slate-700 whitespace-pre-wrap font-sans">
                                                {(() => {
                                                    if (!section.original_text) {
                                                        return section.edits.length === 0 ?
                                                            <p className="italic text-slate-400">No edits suggested.</p> :
                                                            section.edits.map((edit, editIdx) => (
                                                                <div key={editIdx} className="mb-4 border-b pb-4 last:border-0">
                                                                    <div className="line-through decoration-red-400 decoration-2 opacity-60 text-slate-500 mb-1">{edit.target_text}</div>
                                                                    <textarea
                                                                        className="w-full p-2 bg-green-50 border border-green-200 rounded text-green-800 text-sm focus:ring-2 focus:ring-green-500/20 outline-none"
                                                                        value={edit.new_content}
                                                                        onChange={(e) => handleUpdateSuggestion(sectionIdx, editIdx, e.target.value)}
                                                                    />
                                                                </div>
                                                            ));
                                                    }

                                                    const text = section.original_text;
                                                    const elements = [];
                                                    let lastIndex = 0;

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
                                                                    onChange={(e) => handleUpdateSuggestion(sectionIdx, edit.origIdx, e.target.value)}
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

                                <div className="fixed bottom-8 right-8">
                                    <button
                                        onClick={handleSaveChanges}
                                        disabled={isSaving}
                                        className={`px-8 py-4 rounded-full font-bold text-lg shadow-2xl transition-all transform hover:scale-105
                            ${isSaving ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                                    >
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        )
                    }

                </div>

                {/* Right Sidebar - Scorecard */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 transition-all duration-500">
                        <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl animate-fade-in-up">
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-slate-100 flex items-center">
                                    <svg className="w-5 h-5 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                    Scorecard
                                </h3>
                                <p className="text-slate-400 text-sm mt-1">Analysis results.</p>
                            </div>

                            <div className="space-y-6">
                                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-slate-400 text-sm">Initial Match</span>
                                        <span className="text-2xl font-bold text-white">{resume.initial_score || 0}%</span>
                                    </div>
                                    <div className="w-full bg-slate-800 rounded-full h-2">
                                        <div className="bg-slate-500 h-2 rounded-full transition-all duration-1000" style={{ width: `${resume.initial_score || 0}%` }}></div>
                                    </div>
                                </div>

                                <div className="relative p-6 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl shadow-lg border border-indigo-500 overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
                                    </div>

                                    <div className="relative z-10 flex flex-col items-center text-center">
                                        <div className="text-indigo-200 text-sm font-bold uppercase tracking-wider mb-2">Projected Score</div>
                                        <div className="text-6xl font-extrabold text-white mb-2 tracking-tight drop-shadow-md">
                                            {resume.projected_score || 0}%
                                        </div>
                                        <div className="text-indigo-100 text-sm font-medium">After Improvements</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
