'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Toast } from '@/components/Toast';

// Key for persisting pre-login state
const TEMP_STATE_KEY = 'tailor_temp_state';

interface EditSuggestion {
    target_text: string;
    new_content: string;
    action: string;
    rationale?: string;
    status?: 'pending' | 'accepted' | 'rejected';
}

interface SectionAnalysis {
    section_name: string;
    original_text?: string;
    gaps: string[];
    suggestions?: string[];
    edits: EditSuggestion[];
}

export default function TailorPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [jobDescription, setJobDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState('');
    const [status, setStatus] = useState('');

    // JD Fetch State
    const [jdMode, setJdMode] = useState<'text' | 'url'>('text');
    const [jdUrl, setJdUrl] = useState('');
    const [isFetchingJd, setIsFetchingJd] = useState(false);
    const [sections, setSections] = useState<SectionAnalysis[] | null>(null);
    const [uploadedFilename, setUploadedFilename] = useState('');
    const [initialScore, setInitialScore] = useState(0);
    const [projectedScore, setProjectedScore] = useState(0);

    // Job Metadata State
    const [companyName, setCompanyName] = useState('');
    const [jobRole, setJobRole] = useState('');

    // Save/View State
    const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
    const [isSaving, setIsSaving] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [savedResumeId, setSavedResumeId] = useState<number | null>(null);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    // Trial tracking
    const [usageCount, setUsageCount] = useState(0);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [showTrialWarning, setShowTrialWarning] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Check authentication and usage count on mount
    // Check authentication, usage count, and restore state on mount
    useEffect(() => {
        // 1. Check Auth & Usage
        const checkStatus = async () => {
            const token = localStorage.getItem('auth_token');
            setIsAuthenticated(!!token);

            try {
                const headers: HeadersInit = {};
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const res = await fetch('http://localhost:8000/api/usage', { headers });
                if (res.ok) {
                    const data = await res.json();
                    setUsageCount(data.usage_count);
                    // If backend says we are over limit and not unlimited, enforce it
                    if (!data.is_unlimited && data.remaining === 0) {
                        setUsageCount(2); // Local marker for limit reached
                    }
                }
            } catch (err) {
                console.error("Failed to sync usage:", err);
            }
        };

        checkStatus();

        // 2. Restore pending state if returning from login
        const savedState = localStorage.getItem(TEMP_STATE_KEY);
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                if (parsed.sections) setSections(parsed.sections);
                if (parsed.jobDescription) setJobDescription(parsed.jobDescription);
                if (parsed.companyName) setCompanyName(parsed.companyName);
                if (parsed.jobRole) setJobRole(parsed.jobRole);
                if (parsed.uploadedFilename) setUploadedFilename(parsed.uploadedFilename);
                if (parsed.initialScore) setInitialScore(parsed.initialScore);
                if (parsed.projectedScore) setProjectedScore(parsed.projectedScore);

                // If we have restored sections, we probably want to show the Save modal if that's where they left off
                // Or at least show the sections
                setToast({ message: "Resumed your session!", type: 'success' });

                // Clear it so we don't restore it again inappropriately
                localStorage.removeItem(TEMP_STATE_KEY);
            } catch (e) {
                console.error("Failed to restore state", e);
            }
        }

        // Check for passed JD from Tracker (lower priority if temp state exists)
        const savedJD = localStorage.getItem('tailor_jd');
        if (savedJD && !savedState) {
            setJobDescription(savedJD);
            localStorage.removeItem('tailor_jd');
        }
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleFetchJd = async () => {
        if (!jdUrl) return;
        setIsFetchingJd(true);
        try {
            const formData = new FormData();
            formData.append('url', jdUrl);

            const response = await fetch('http://localhost:8000/fetch-jd', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (data.job_description) {
                setJobDescription(data.job_description);
                if (data.company) setCompanyName(data.company);
                if (data.role) setJobRole(data.role);
                setJdMode('text'); // Switch back to text view to show result
            }
        } catch (error) {
            console.error('Error fetching JD:', error);
            setToast({ message: 'Failed to fetch Job Description. Please check the URL.', type: 'error' });
        } finally {
            setIsFetchingJd(false);
        }
    };

    const handleAnalyze = async () => {
        if (!file || !jobDescription) return;

        // Check trial limit for non-authenticated users
        if (!isAuthenticated && usageCount >= 2) {
            router.push('/login');
            return;
        }

        setIsLoading(true);
        setStatus('Uploading and Analyzing...');
        setDownloadUrl('');
        setSections(null);

        const formData = new FormData();
        formData.append('resume', file);
        formData.append('job_description', jobDescription);

        try {
            const token = localStorage.getItem('auth_token');
            const headers: HeadersInit = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('http://localhost:8000/analyze', {
                method: 'POST',
                headers: headers,
                body: formData,
            });

            if (response.status === 403) {
                setUsageCount(2); // Force limit reached state
                setToast({ message: 'Free trial limit reached. Please login.', type: 'error' });
                setStatus('Free trial limit reached.');
                setIsLoading(false);
                return;
            }

            const data = await response.json();
            if (data.sections) {
                // Initialize status for all edits
                const initializedSections = data.sections.map((sec: any) => ({
                    ...sec,
                    edits: sec.edits.map((edit: any) => ({ ...edit, status: 'pending' }))
                }));
                setSections(initializedSections);
                setUploadedFilename(data.filename);
                setInitialScore(data.initial_score || 0);
                setProjectedScore(data.projected_score || 0);

                // Auto-fill metadata (only if not already set or if it was unknown)
                if (data.company_name && data.company_name !== "Unknown Company") {
                    if (!companyName || companyName === "Unknown Company") setCompanyName(data.company_name);
                }
                if (data.job_title && data.job_title !== "Unknown Role") {
                    if (!jobRole || jobRole === "Unknown Role") setJobRole(data.job_title);
                }

                // Increment local usage count to reflect the new analysis
                if (!isAuthenticated) {
                    setUsageCount(prev => prev + 1);
                }

                setStatus('Analysis complete! Please review the suggestions below.');
                setToast({ message: 'Analysis complete!', type: 'success' });
            } else {
                setStatus('Something went wrong during analysis. Please try again.');
                console.log(data);
            }
        } catch (error) {
            console.error('Error analyzing file:', error);
            setStatus('Error connecting to server.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!sections || !uploadedFilename) return;

        setIsDownloading(true);
        setStatus('Generating Word Document...');

        try {
            const response = await fetch('http://localhost:8000/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filename: uploadedFilename,
                    // Filter out rejected edits for the backend generator
                    sections: sections.map(sec => ({
                        ...sec,
                        edits: sec.edits.filter(e => e.status !== 'rejected')
                    }))
                }),
            });
            const data = await response.json();
            if (data.download_url) {
                // Trigger download
                const link = document.createElement('a');
                link.href = data.download_url;
                link.download = data.pdf_path ? data.pdf_path.split(/[\\/]/).pop() : 'resume.docx';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setStatus('Download started!');
            } else {
                setToast({ message: "Failed to generate download link.", type: 'error' });
                setStatus('Download failed.');
            }
        } catch (error) {
            console.error("Error downloading:", error);
            setToast({ message: "Error downloading file.", type: 'error' });
            setStatus('Download failed.');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleUpdateSuggestion = (sectionIndex: number, editIndex: number, newValue: string) => {
        if (!sections) return;
        const newSections = [...sections];
        newSections[sectionIndex].edits[editIndex].new_content = newValue;
        // If user edits text, essentially they are engaging with it, but we can leave status as is
        // or auto-accept. Let's leave it manual for now.
        setSections(newSections);
    };

    const handleSuggestionStatus = (sectionIndex: number, editIndex: number, newStatus: 'accepted' | 'rejected' | 'pending') => {
        if (!sections) return;
        const newSections = [...sections];
        newSections[sectionIndex].edits[editIndex].status = newStatus;
        setSections(newSections);
    };

    const handleSaveResume = async (overrideCompanyName?: string, overrideJobRole?: string) => {
        if (!sections) return;

        if (!isAuthenticated) {
            // Persist state before redirecting
            const stateToSave = {
                sections,
                jobDescription,
                companyName: overrideCompanyName || companyName,
                jobRole: overrideJobRole || jobRole,
                uploadedFilename,
                initialScore,
                projectedScore
            };
            localStorage.setItem(TEMP_STATE_KEY, JSON.stringify(stateToSave));

            setToast({ message: "Please login to save. Redirecting...", type: 'info' });
            setTimeout(() => router.push('/login'), 1000);
            return;
        }

        setIsSaving(true);
        setStatus('Saving to your profile...');

        // Use overrides if provided, otherwise fall back to state
        const finalCompany = overrideCompanyName || companyName;
        const finalRole = overrideJobRole || jobRole;

        try {
            // Construct tailored text from sections
            const tailoredText = sections.map(s => {
                let text = s.original_text || "";
                s.edits.forEach(edit => {
                    if (edit.status === 'rejected') return; // Skip rejected edits
                    // Simple replacement for text reconstruction (approximate for display)
                    // In a real app we'd need better reconstruction logic or return it from backend
                    text = text.replace(edit.target_text, edit.new_content);
                });
                return text;
            }).join('\n\n');

            const originalText = sections.map(s => s.original_text).join('\n\n');

            const response = await fetch('http://localhost:8000/api/resume/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify({
                    filename: uploadedFilename,
                    original_text: originalText,
                    tailored_text: tailoredText,
                    tailored_sections: sections,
                    company_name: finalCompany,
                    job_role: finalRole,
                    job_description: jobDescription,
                    initial_score: initialScore,
                    projected_score: projectedScore
                }),
            });

            const data = await response.json();
            if (data.id) {
                setSavedResumeId(data.id);
                // Also create application ID alert if returned?
                if (data.application_id) {
                    console.log("Application created:", data.application_id);
                } else if (finalCompany && finalRole) {
                    console.warn("Application NOT created despite company/role provided");
                }

                setViewMode('preview');
                setStatus('Resume saved successfully!');
            } else {
                setStatus('Failed to save resume.');
            }
        } catch (error) {
            console.error('Error saving:', error);
            setStatus('Error connecting to server.');
        } finally {
            setIsSaving(false);
        }
    };

    // Helper for Score Color
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 bg-green-100 border-green-200';
        if (score >= 50) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
        return 'text-red-600 bg-red-100 border-red-200';
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">

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
                        onClick={() => {
                            localStorage.removeItem('auth_token');
                            window.location.reload(); // Hard reload to reset state and re-check IP usage
                        }}
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Main Content Area (Left) */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="text-center lg:text-left mb-8">
                        <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Tailor your resume in seconds.</h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            Upload your existing PDF resume and the job description you are targeting.
                            Review our AI&apos;s suggestions before generating your final resume.
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                        <div className="p-8 md:p-10 space-y-8">

                            {/* Step 1: Upload */}
                            <div className={`transition-all duration-300 ${isLoading || sections || downloadUrl ? 'opacity-50 pointer-events-none' : ''}`}>
                                <div className="flex items-center mb-4">
                                    <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold mr-3">1</span>
                                    <label className="text-lg font-semibold text-slate-800">Upload Resume (PDF)</label>
                                </div>

                                <div className="relative group">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileChange}
                                        className="block w-full text-sm text-slate-500
                    file:mr-4 file:py-3 file:px-6
                    file:rounded-xl file:border-0
                    file:text-sm file:font-semibold
                    file:bg-indigo-50 file:text-indigo-700
                    file:transition-colors
                    hover:file:bg-indigo-100
                    cursor-pointer"
                                    />
                                    {!file && (
                                        <p className="mt-2 text-sm text-slate-400 pl-2">Max file size: 10MB</p>
                                    )}
                                    {file && (
                                        <p className="mt-2 text-sm text-green-600 pl-2 font-medium">✓ {file.name}</p>
                                    )}
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Step 2: Job Description */}
                            <div className={`transition-all duration-300 ${isLoading || sections || downloadUrl ? 'opacity-50 pointer-events-none' : ''}`}>
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
                                                onClick={handleFetchJd}
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

                            {/* Action Area: Analyze */}
                            {!sections && !downloadUrl && (
                                <div className="pt-4">
                                    <button
                                        onClick={handleAnalyze}
                                        disabled={isLoading || !file || !jobDescription}
                                        className={`w-full py-4 px-6 rounded-xl font-bold text-lg shadow-lg transition-all transform duration-200
                    ${isLoading
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                                : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0'
                                            }`}
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center justify-center">
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                {status || 'Processing...'}
                                            </span>
                                        ) : 'Start Gap Analysis'}
                                    </button>
                                </div>
                            )}

                            {/* Step 3: Review & Edit */}
                            {sections && !savedResumeId && (
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
                                                                                        onClick={() => handleSuggestionStatus(sectionIdx, editIdx, 'accepted')}
                                                                                        className="p-1 hover:bg-green-100 text-green-600 rounded"
                                                                                        title="Accept"
                                                                                    >
                                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                                                                    </button>
                                                                                )}
                                                                                {edit.status !== 'rejected' && (
                                                                                    <button
                                                                                        onClick={() => handleSuggestionStatus(sectionIdx, editIdx, 'rejected')}
                                                                                        className="p-1 hover:bg-red-100 text-red-500 rounded"
                                                                                        title="Reject"
                                                                                    >
                                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                                                    </button>
                                                                                )}
                                                                                {edit.status !== 'pending' && (
                                                                                    <button
                                                                                        onClick={() => handleSuggestionStatus(sectionIdx, editIdx, 'pending')}
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
                                                                            onChange={(e) => handleUpdateSuggestion(sectionIdx, editIdx, e.target.value)}
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

                                    <button
                                        onClick={() => setShowSaveModal(true)}
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
                            )}

                            {/* Comparison / Preview View */}
                            {viewMode === 'preview' && sections && (
                                <div className="space-y-6 animate-fade-in-up">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-2xl font-bold text-slate-800">Final Digital Resume</h3>
                                        <button
                                            onClick={() => setViewMode('edit')}
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
                                                                content = content.split(edit.target_text).join(edit.new_content);
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
                                        onClick={() => {
                                            if (fileInputRef.current) fileInputRef.current.value = '';
                                            setFile(null);
                                            setJobDescription('');
                                            setSections(null);
                                            setViewMode('edit');
                                            setSavedResumeId(null);
                                            setStatus('');
                                        }}
                                        className="w-full py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                                    >
                                        Start New Tailoring
                                    </button>
                                </div>
                            )}


                            {/* Success Area - Removed PDF Download */}
                            {viewMode === 'preview' && sections && (
                                <div className="mt-4 flex justify-center">
                                    <button
                                        onClick={handleDownload}
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
                            )}


                            {status && !downloadUrl && !sections && <p className="text-center text-slate-500 mt-4 animate-pulse">{status}</p>}
                        </div>
                    </div>

                    <p className="text-center text-slate-400 mt-12 text-sm">
                        Powered by GPT-4 and Advanced Resume Logic. Private & Secure.
                    </p>
                </div >

                {/* Right Sidebar - Scorecard */}
                < div className="lg:col-span-1" >
                    <div className="sticky top-24 transition-all duration-500">
                        {(sections || initialScore > 0) ? (
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
                        ) : (
                            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm opacity-60 pointer-events-none grayscale">
                                <div className="text-center space-y-3">
                                    <div className="w-12 h-12 bg-slate-100 rounded-full mx-auto flex items-center justify-center text-slate-300">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                    </div>
                                    <h3 className="font-bold text-slate-400">No Analysis Yet</h3>
                                    <p className="text-xs text-slate-400">Upload a resume and JD to see your scorecard here.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Save Modal */}
            {showSaveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Save Application</h3>
                        <p className="text-slate-600 mb-6 text-sm">Review the details below before saving to your tracker.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Company Name</label>
                                <input
                                    type="text"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    className="w-full p-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                    placeholder="e.g. Google"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Job Role</label>
                                <input
                                    type="text"
                                    value={jobRole}
                                    onChange={(e) => setJobRole(e.target.value)}
                                    className="w-full p-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                                    placeholder="e.g. Senior Software Engineer"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setShowSaveModal(false)}
                                className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setShowSaveModal(false);
                                    handleSaveResume();
                                }}
                                className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all hover:-translate-y-0.5"
                            >
                                Save Resume
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
