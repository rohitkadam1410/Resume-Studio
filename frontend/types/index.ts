export interface EditSuggestion {
    target_text: string;
    new_content: string;
    action: string;
    rationale?: string;
    status?: 'pending' | 'accepted' | 'rejected';
}

export interface ToastState {
    message: string;
    type: 'success' | 'error' | 'info';
}

export interface SectionAnalysis {
    section_name: string;
    original_text?: string;
    gaps: string[];
    suggestions?: string[];
    edits: EditSuggestion[];
}

export interface ResumeSaveData {
    filename: string;
    original_text: string;
    tailored_text: string;
    tailored_sections: SectionAnalysis[];
    company_name: string;
    job_role: string;
    job_description: string;
    initial_score: number;
    projected_score: number;
}

export interface UsageResponse {
    usage_count: number;
    is_unlimited: boolean;
    remaining: number;
}

export interface JdResponse {
    job_description?: string;
    company?: string;
    role?: string;
}

export interface RoleAnalysis {
    identity: string;
    keywords: string[];
    seniority_signals: string[];
    industry_context: string;
    geographic_expectations: string;
}

export interface ResumeDiagnosis {
    strong_matches: string[];
    gaps: string[];
    misalignments: string[];
    ats_risks: string[];
}

export interface AnalyzeResponse {
    role_analysis?: RoleAnalysis;
    diagnosis?: ResumeDiagnosis;
    proposed_title?: string;
    proposed_summary?: string;
    sections?: SectionAnalysis[];
    filename: string;
    initial_score?: number;
    projected_score?: number;
    company_name?: string;
    job_title?: string;
}

export interface GenerateResponse {
    download_url?: string;
    pdf_path?: string;
}
