"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ApplicationForm from '../../components/ApplicationForm';
import ApplicationList from '../../components/ApplicationList';

export default function TrackerPage() {
  const router = useRouter();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
      setIsLoading(false);
    }
  }, [router]);

  const handleApplicationAdded = () => {
    setRefreshTrigger(prev => prev + 1);
    setShowForm(false); // Hide form after adding
  };

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Application Tracker
          </h1>
          <p className="text-sm text-slate-500 mt-1">Track and manage your job applications</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-indigo-500/30 font-semibold flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>{showForm ? 'Cancel' : 'Add Application'}</span>
        </button>
      </div>

      {showForm && (
        <div className="mb-8 animate-fade-in-up">
          <ApplicationForm onApplicationAdded={handleApplicationAdded} />
        </div>
      )}

      <ApplicationList refreshTrigger={refreshTrigger} />
    </div>
  );
}
