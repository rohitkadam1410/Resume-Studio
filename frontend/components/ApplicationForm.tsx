"use client";
import React, { useState } from 'react';

export default function ApplicationForm({ onApplicationAdded }: { onApplicationAdded: () => void }) {
    const [companyName, setCompanyName] = useState('');
    const [jobRole, setJobRole] = useState('');
    const [jobLink, setJobLink] = useState('');
    const [status, setStatus] = useState('Applied');
    const [jobDescription, setJobDescription] = useState('');
    const [resume, setResume] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [fetchingJD, setFetchingJD] = useState(false);

    const handleFetchJD = async () => {
        if (!jobLink) return;
        setFetchingJD(true);
        try {
            const token = localStorage.getItem('auth_token');
            const formData = new FormData();
            formData.append('url', jobLink);
            const res = await fetch('http://localhost:8000/fetch-jd', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });
            const data = await res.json();
            if (data.job_description) {
                setJobDescription(data.job_description);
                if (data.company) setCompanyName(data.company);
                if (data.role) setJobRole(data.role);
            } else {
                alert("Could not fetch JD. Please paste manually.");
            }
        } catch (error) {
            console.error("Error fetching JD:", error);
            alert("Error fetching JD");
        } finally {
            setFetchingJD(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resume) {
            alert("Please upload the resume used for this application.");
            return;
        }
        setLoading(true);

        const formData = new FormData();
        formData.append('company_name', companyName);
        formData.append('job_role', jobRole);
        formData.append('job_link', jobLink);
        formData.append('status', status);
        formData.append('job_description', jobDescription);
        formData.append('resume', resume);

        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('http://localhost:8000/applications', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });
            if (res.ok) {
                // Clear form
                setCompanyName('');
                setJobRole('');
                setJobLink('');
                setStatus('Applied');
                setJobDescription('');
                setResume(null);
                onApplicationAdded();
            } else {
                alert("Failed to save application.");
            }
        } catch (error) {
            console.error("Error saving application:", error);
            alert("Error saving application");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Add New Application</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company Name</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Job Role</label>
                        <input
                            type="text"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border"
                            value={jobRole}
                            onChange={(e) => setJobRole(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Job Link</label>
                    <div className="flex">
                        <input
                            type="url"
                            className="mt-1 flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border"
                            value={jobLink}
                            onChange={(e) => setJobLink(e.target.value)}
                            placeholder="https://linkedin.com/jobs/..."
                        />
                        <button
                            type="button"
                            onClick={handleFetchJD}
                            disabled={fetchingJD || !jobLink}
                            className="mt-1 px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {fetchingJD ? 'Fetching...' : 'Fetch JD'}
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Job Description</label>
                    <textarea
                        rows={4}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border"
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste JD here or use Fetch button..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Select Resume</label>
                        <input
                            type="file"
                            accept=".pdf"
                            required
                            onChange={(e) => setResume(e.target.files ? e.target.files[0] : null)}
                            className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border"
                        >
                            <option>Applied</option>
                            <option>Interview</option>
                            <option>Offer</option>
                            <option>Rejected</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Add Application'}
                    </button>
                </div>
            </form>
        </div>
    );
}
