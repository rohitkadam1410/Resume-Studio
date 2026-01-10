import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../services/api';
import { SectionAnalysis, ToastState } from '../types';

const TEMP_STATE_KEY = 'tailor_temp_state';

interface UseResumeAnalysisProps {
    isAuthenticated: boolean;
    usageCount: number;
    setUsageCount: React.Dispatch<React.SetStateAction<number>>;
}

export const useResumeAnalysis = ({ isAuthenticated, usageCount, setUsageCount }: UseResumeAnalysisProps) => {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [jobDescription, setJobDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [downloadUrl, setDownloadUrl] = useState('');
    const [status, setStatus] = useState('');
    const [toast, setToast] = useState<ToastState | null>(null);

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

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Restore state logic
    useEffect(() => {
        // Restore pending state if returning from login
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

                setToast({ message: "Resumed your session!", type: 'success' });
                localStorage.removeItem(TEMP_STATE_KEY);
            } catch (e) {
                console.error("Failed to restore state", e);
            }
        }

        // Check for passed JD from Tracker
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
            const data = await api.fetchJD(jdUrl);
            if (data.job_description) {
                setJobDescription(data.job_description);
                if (data.company) setCompanyName(data.company);
                if (data.role) setJobRole(data.role);
                setJdMode('text');
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

        if (!isAuthenticated && usageCount >= 2) {
            router.push('/login');
            return;
        }

        setIsLoading(true);
        setStatus('Uploading and Analyzing...');
        setDownloadUrl('');
        setSections(null);

        try {
            const token = localStorage.getItem('auth_token');
            const data = await api.analyzeResume(file, jobDescription, token);

            if (data.sections) {
                const initializedSections = data.sections.map((sec) => ({
                    ...sec,
                    edits: sec.edits.map((edit) => ({ ...edit, status: 'pending' as const }))
                }));
                setSections(initializedSections);
                setUploadedFilename(data.filename);
                setInitialScore(data.initial_score || 0);
                setProjectedScore(data.projected_score || 0);

                if (data.company_name && data.company_name !== "Unknown Company") {
                    if (!companyName || companyName === "Unknown Company") setCompanyName(data.company_name);
                }
                if (data.job_title && data.job_title !== "Unknown Role") {
                    if (!jobRole || jobRole === "Unknown Role") setJobRole(data.job_title);
                }

                if (!isAuthenticated) {
                    setUsageCount(prev => prev + 1);
                }

                setStatus('Analysis complete! Please review the suggestions below.');
                setToast({ message: 'Analysis complete!', type: 'success' });
            } else {
                setStatus('Something went wrong during analysis. Please try again.');
            }
        } catch (error: any) {
            if (error.message === 'LIMIT_REACHED') {
                setUsageCount(2);
                setToast({ message: 'Free trial limit reached. Please login.', type: 'error' });
                setStatus('Free trial limit reached.');
            } else {
                console.error('Error analyzing file:', error);
                setStatus('Error connecting to server.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!sections || !uploadedFilename) return;

        setIsDownloading(true);
        setStatus('Generating Word Document...');

        try {
            const data = await api.generateResume(uploadedFilename, sections);
            if (data.download_url) {
                const link = document.createElement('a');
                link.href = data.download_url;
                link.download = data.pdf_path ? data.pdf_path.split(/[\\/]/).pop() || 'resume.docx' : 'resume.docx';
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

    const handleSaveResume = async (overrideCompanyName?: string, overrideJobRole?: string) => {
        if (!sections) return;

        if (!isAuthenticated) {
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

        const finalCompany = overrideCompanyName || companyName;
        const finalRole = overrideJobRole || jobRole;

        try {
            const tailoredText = sections.map(s => {
                let text = s.original_text || "";
                s.edits.forEach(edit => {
                    if (edit.status === 'rejected') return;
                    text = text.replace(edit.target_text, edit.new_content);
                });
                return text;
            }).join('\n\n');

            const originalText = sections.map(s => s.original_text || "").join('\n\n');
            const token = localStorage.getItem('auth_token') || "";

            const data = await api.saveResume({
                filename: uploadedFilename,
                original_text: originalText,
                tailored_text: tailoredText,
                tailored_sections: sections,
                company_name: finalCompany,
                job_role: finalRole,
                job_description: jobDescription,
                initial_score: initialScore,
                projected_score: projectedScore
            }, token);

            if (data.id) {
                setSavedResumeId(data.id);
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

    const handleUpdateSuggestion = (sectionIndex: number, editIndex: number, newValue: string) => {
        if (!sections) return;
        const newSections = [...sections];
        newSections[sectionIndex].edits[editIndex].new_content = newValue;
        setSections(newSections);
    };

    const handleSuggestionStatus = (sectionIndex: number, editIndex: number, newStatus: 'accepted' | 'rejected' | 'pending') => {
        if (!sections) return;
        const newSections = [...sections];
        newSections[sectionIndex].edits[editIndex].status = newStatus;
        setSections(newSections);
    };

    return {
        file, setFile,
        jobDescription, setJobDescription,
        isLoading, status,
        downloadUrl, setDownloadUrl,
        toast, setToast,
        jdMode, setJdMode,
        jdUrl, setJdUrl, isFetchingJd,
        sections, setSections,
        uploadedFilename,
        initialScore, projectedScore,
        companyName, setCompanyName,
        jobRole, setJobRole,
        viewMode, setViewMode,
        isSaving, isDownloading,
        savedResumeId, setSavedResumeId,
        showSaveModal, setShowSaveModal,
        fileInputRef,
        handleFileChange,
        handleFetchJd,
        handleAnalyze,
        handleDownload,
        handleSaveResume,
        handleUpdateSuggestion,
        handleSuggestionStatus
    };
};
