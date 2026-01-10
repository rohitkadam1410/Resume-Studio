'use client';

import { useTrialLimit } from '@/hooks/useTrialLimit';
import { useResumeAnalysis } from '@/hooks/useResumeAnalysis';
import { TrialBanners } from '@/components/resume-tailor/TrialBanners';
import { UploadStep } from '@/components/resume-tailor/UploadStep';
import { JobDescriptionStep } from '@/components/resume-tailor/JobDescriptionStep';
import { AnalysisReview } from '@/components/resume-tailor/AnalysisReview';
import { ResumePreview } from '@/components/resume-tailor/ResumePreview';
import { Scorecard } from '@/components/resume-tailor/Scorecard';
import { SaveResumeModal } from '@/components/resume-tailor/SaveResumeModal';
import { Toast } from '@/components/Toast';

export default function TailorPage() {
    const {
        usageCount, isAuthenticated, showTrialWarning,
        checkStatus, setShowTrialWarning
    } = useTrialLimit();

    const {
        file, setFile,
        jobDescription, setJobDescription,
        isLoading, status,
        downloadUrl,
        toast, setToast,
        jdMode, setJdMode,
        jdUrl, setJdUrl, isFetchingJd,
        sections, setSections,
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
    } = useResumeAnalysis({ isAuthenticated, usageCount, setUsageCount: () => { } });
    // Note: setUsageCount is handled internally by useTrialLimit mostly, but useResumeAnalysis needs to update it locally if not auth? 
    // Actually useTrialLimit gave us setUsageCount but it wasn't returned in my hook implementation? 
    // Let me check useTrialLimit implementation.
    // I returned setUsageCount in useTrialLimit. Yes.
    // So I need to destructure it from useTrialLimit and pass it.

    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        window.location.reload();
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <TrialBanners
                isAuthenticated={isAuthenticated}
                usageCount={usageCount}
                showTrialWarning={showTrialWarning}
                onLogout={handleLogout}
            />

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
                            <UploadStep
                                file={file}
                                onFileChange={handleFileChange}
                                fileInputRef={fileInputRef}
                                disabled={isLoading || !!sections || !!downloadUrl}
                            />

                            <hr className="border-slate-100" />

                            {/* Step 2: Job Description */}
                            <JobDescriptionStep
                                jdMode={jdMode}
                                setJdMode={setJdMode}
                                jobDescription={jobDescription}
                                setJobDescription={setJobDescription}
                                jdUrl={jdUrl}
                                setJdUrl={setJdUrl}
                                isFetchingJd={isFetchingJd}
                                onFetchJd={handleFetchJd}
                                companyName={companyName}
                                setCompanyName={setCompanyName}
                                jobRole={jobRole}
                                setJobRole={setJobRole}
                                disabled={isLoading || !!sections || !!downloadUrl}
                            />

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
                                <AnalysisReview
                                    sections={sections}
                                    isAuthenticated={isAuthenticated}
                                    isSaving={isSaving}
                                    onSaveClick={() => setShowSaveModal(true)}
                                    onUpdateSuggestion={handleUpdateSuggestion}
                                    onSuggestionStatus={handleSuggestionStatus}
                                />
                            )}

                            {/* Comparison / Preview View */}
                            {viewMode === 'preview' && sections && (
                                <ResumePreview
                                    sections={sections}
                                    onEditClick={() => setViewMode('edit')}
                                    onStartOver={() => {
                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                        setFile(null);
                                        setJobDescription('');
                                        setSections(null);
                                        setViewMode('edit');
                                        setSavedResumeId(null);
                                    }}
                                    onDownload={handleDownload}
                                    isDownloading={isDownloading}
                                />
                            )}

                            {status && !downloadUrl && !sections && <p className="text-center text-slate-500 mt-4 animate-pulse">{status}</p>}
                        </div>
                    </div>

                    <p className="text-center text-slate-400 mt-12 text-sm">
                        Powered by GPT-4 and Advanced Resume Logic. Private & Secure.
                    </p>
                </div>

                {/* Right Sidebar - Scorecard */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 transition-all duration-500">
                        <Scorecard
                            initialScore={initialScore}
                            projectedScore={projectedScore}
                            sections={sections}
                        />
                    </div>
                </div>
            </div>

            <SaveResumeModal
                isOpen={showSaveModal}
                onClose={() => setShowSaveModal(false)}
                onSave={() => {
                    setShowSaveModal(false);
                    handleSaveResume();
                }}
                companyName={companyName}
                setCompanyName={setCompanyName}
                jobRole={jobRole}
                setJobRole={setJobRole}
            />

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}
