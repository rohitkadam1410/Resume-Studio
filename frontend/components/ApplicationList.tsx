"use client";
import React, { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

interface Application {
    id: number;
    company_name: string;
    job_role: string;
    job_link: string;
    date_applied: string;
    status: string;
    resume_path: string;
    job_description?: string;
    saved_resume_id?: number;
}

export default function ApplicationList({ refreshTrigger }: { refreshTrigger: number }) {
    const [applications, setApplications] = useState<Application[]>([]);
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [timeline, setTimeline] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const router = useRouter();

    const statusOptions = ['Started', 'Applied', 'Interview', 'Offered', 'Rejected'];

    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        fetch('http://localhost:8000/applications', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => {
                if (res.status === 401) {
                    localStorage.removeItem('auth_token');
                    router.push('/login');
                    throw new Error("Unauthorized");
                }
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setApplications(data);
                } else {
                    console.error("Invalid response from applications:", data);
                }
            })
            .catch(err => {
                if (err.message !== "Unauthorized") {
                    console.error("Error fetching applications:", err);
                }
            });
    }, [refreshTrigger, router]);

    const fetchTimeline = async (appId: number) => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`http://localhost:8000/applications/${appId}/timeline`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            setTimeline(data);
        } catch (error) {
            console.error('Error fetching timeline:', error);
        }
    };

    const handleViewDetails = (app: Application) => {
        setSelectedApp(app);
        fetchTimeline(app.id);
    };

    const handleAddComment = async () => {
        if (!selectedApp || !newComment.trim()) return;

        try {
            const token = localStorage.getItem('auth_token');
            const formData = new FormData();
            formData.append('title', 'Note');
            formData.append('description', newComment);

            const response = await fetch(`http://localhost:8000/applications/${selectedApp.id}/timeline`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            if (response.ok) {
                setNewComment('');
                fetchTimeline(selectedApp.id);
            }
        } catch (error) {
            console.error('Error adding comment:', error);
        }
    };

    const handleTailor = (app: Application) => {
        if (app.job_description) {
            localStorage.setItem('tailor_jd', app.job_description);
            router.push('/tailor');
        } else {
            alert("No Job Description available for this application.");
        }
    };

    const handleDelete = async (app: Application) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete the application for ${app.job_role} at ${app.company_name}?`
        );

        if (!confirmed) return;

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`http://localhost:8000/applications/${app.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                // Remove from local state
                setApplications(applications.filter(a => a.id !== app.id));
            } else {
                alert('Failed to delete application');
            }
        } catch (error) {
            console.error('Error deleting application:', error);
            alert('Error deleting application');
        }
    };

    const handleStatusChange = async (app: Application, newStatus: string) => {
        try {
            const token = localStorage.getItem('auth_token');
            const formData = new FormData();
            formData.append('status', newStatus);

            const response = await fetch(`http://localhost:8000/applications/${app.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            if (response.ok) {
                // Update local state
                setApplications(applications.map(a =>
                    a.id === app.id ? { ...a, status: newStatus } : a
                ));
            } else {
                alert('Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Error updating status');
        }
    };

    return (
        <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Application History</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-700 text-left text-xs font-semibold text-gray-600 dark:text-gray-200 uppercase tracking-wider">
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Company</th>
                            <th className="px-6 py-3">Role</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Resume</th>
                            <th className="px-6 py-3">Link</th>
                            <th className="px-6 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {applications.map((app) => (
                            <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                    {new Date(app.date_applied).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                    {app.company_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                    {app.job_role}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <select
                                        value={app.status}
                                        onChange={(e) => handleStatusChange(app, e.target.value)}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-full border-2 cursor-pointer transition-colors
                                            ${app.status === 'Started' ? 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100' :
                                                app.status === 'Applied' ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100' :
                                                    app.status === 'Interview' ? 'bg-yellow-50 text-yellow-800 border-yellow-200 hover:bg-yellow-100' :
                                                        app.status === 'Rejected' ? 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100' :
                                                            'bg-green-50 text-green-800 border-green-200 hover:bg-green-100'}`}
                                    >
                                        {statusOptions.map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {app.saved_resume_id ? (
                                        <button
                                            onClick={() => router.push(`/resumes/${app.saved_resume_id}`)}
                                            className="text-indigo-600 hover:text-indigo-900 font-medium underline"
                                        >
                                            View Resume
                                        </button>
                                    ) : (
                                        <span className="text-gray-400 text-xs italic">Not Tailored</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400">
                                    {app.job_link && (
                                        <a href={app.job_link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                            View
                                        </a>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center space-x-3">
                                        <button
                                            onClick={() => handleViewDetails(app)}
                                            className="inline-flex items-center px-3 py-1.5 bg-slate-50 text-slate-700 rounded-md hover:bg-slate-100 font-medium transition-colors"
                                        >
                                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            Details
                                        </button>
                                        <button
                                            onClick={() => handleTailor(app)}
                                            className="inline-flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 font-medium transition-colors"
                                        >
                                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                            Tailor
                                        </button>
                                        <button
                                            onClick={() => handleDelete(app)}
                                            className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-700 rounded-md hover:bg-red-100 font-medium transition-colors"
                                        >
                                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {applications.length === 0 && (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                        No applications tracked yet.
                    </div>
                )}
            </div>

            {/* Details Modal */}
            {selectedApp && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">{selectedApp.job_role}</h2>
                                <p className="text-slate-600">{selectedApp.company_name}</p>
                            </div>
                            <button
                                onClick={() => setSelectedApp(null)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[50vh]">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Timeline & Notes</h3>

                            {timeline.length === 0 ? (
                                <p className="text-slate-500 text-sm italic">No timeline events yet.</p>
                            ) : (
                                <div className="space-y-4">
                                    {timeline.map((event, idx) => (
                                        <div key={idx} className="flex space-x-3">
                                            <div className="flex-shrink-0">
                                                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div className="flex-1 bg-slate-50 rounded-lg p-4">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-semibold text-slate-900 text-sm">{event.title}</h4>
                                                    <span className="text-xs text-slate-500">
                                                        {new Date(event.date).toLocaleString()}
                                                    </span>
                                                </div>
                                                {event.description && (
                                                    <p className="text-sm text-slate-600">{event.description}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-slate-200 bg-slate-50">
                            <h4 className="font-semibold text-slate-900 mb-3">Add a Note</h4>
                            <div className="flex space-x-3">
                                <input
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                                    placeholder="Type your note..."
                                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                />
                                <button
                                    onClick={handleAddComment}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                                >
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
