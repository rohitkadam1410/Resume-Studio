import { AnalyzeResponse, GenerateResponse, JdResponse, ResumeSaveData, UsageResponse, SectionAnalysis } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const getHeaders = (token?: string | null, isMultipart: boolean = false): HeadersInit => {
    const headers: HeadersInit = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    if (!isMultipart) {
        // multipart/form-data boundary is set automatically by browser
        headers['Content-Type'] = 'application/json';
    }
    return headers;
};

export const api = {
    checkUsage: async (token?: string | null): Promise<UsageResponse> => {
        const headers = getHeaders(token);
        // Remove Content-Type for GET requests usually, but standard fetch handles it.
        // Explicitly cleaning it up for correctness if we were being strict, but empty {} is fine.
        const res = await fetch(`${API_BASE_URL}/api/usage`, { headers });
        if (!res.ok) throw new Error('Failed to fetch usage');
        return res.json();
    },

    fetchJD: async (url: string): Promise<JdResponse> => {
        const formData = new FormData();
        formData.append('url', url);
        const res = await fetch(`${API_BASE_URL}/fetch-jd`, {
            method: 'POST',
            body: formData,
        });
        if (!res.ok) throw new Error('Failed to fetch JD');
        return res.json();
    },

    analyzeResume: async (file: File, jobDescription: string, token?: string | null): Promise<AnalyzeResponse> => {
        const formData = new FormData();
        formData.append('resume', file);
        formData.append('job_description', jobDescription);

        const res = await fetch(`${API_BASE_URL}/analyze`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}, // No Content-Type for FormData
            body: formData,
        });

        if (res.status === 403) {
            throw new Error('LIMIT_REACHED');
        }
        if (!res.ok) throw new Error('Analysis failed');
        return res.json();
    },

    generateResume: async (filename: string, sections: SectionAnalysis[]): Promise<GenerateResponse> => {
        const res = await fetch(`${API_BASE_URL}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filename,
                sections: sections.map(sec => ({
                    ...sec,
                    edits: sec.edits.filter(e => e.status !== 'rejected')
                }))
            }),
        });
        if (!res.ok) throw new Error('Generation failed');
        return res.json();
    },

    saveResume: async (data: ResumeSaveData, token: string): Promise<{ id: number; application_id?: number }> => {
        const res = await fetch(`${API_BASE_URL}/api/resume/save`, {
            method: 'POST',
            headers: getHeaders(token),
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Save failed');
        return res.json();
    }
};
