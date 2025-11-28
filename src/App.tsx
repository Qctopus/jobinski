import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import { LearningDashboard } from './components/LearningDashboard';
import { ProcessedJobData } from './types';
import { LoadingState, AppError, createAppError } from './types/common';
import { dashboardApi } from './services/api/DashboardApi';
import { DataProcessingProvider } from './contexts/DataProcessingContext';
import ErrorBoundary from './components/error-boundaries/ErrorBoundary';
import DataErrorBoundary from './components/error-boundaries/DataErrorBoundary';
import LoadingSpinner from './components/loading/LoadingSpinner';
import { DashboardSkeleton } from './components/loading/LoadingSkeleton';

function App() {
  const [processedData, setProcessedData] = useState<ProcessedJobData[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({ status: 'idle' });
  const [error, setError] = useState<AppError | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [currentView, setCurrentView] = useState<'dashboard' | 'learning'>('dashboard');
  const [syncStatus, setSyncStatus] = useState<any>(null);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoadingState({ status: 'loading', progress: 0 });
      setError(null);
      setProgress(0);

      try {
        console.log('🚀 Loading data from backend...');
        
        // Step 1: Check sync status
        setProgress(10);
        console.log('📊 Checking sync status...');
        
        let statusResponse;
        try {
          statusResponse = await dashboardApi.getSyncStatus();
        } catch (err) {
          // If sync status fails, the backend might not be running
          throw createAppError(
            'Cannot connect to backend. Make sure the server is running on port 5000.',
            'CONNECTION_ERROR',
            true,
            { error: err }
          );
        }

        setSyncStatus(statusResponse.data);

        if (!statusResponse.data?.hasData) {
          throw createAppError(
            'No data available. Please run sync first: cd backend && npm run sync:dev',
            'NO_DATA',
            true,
            { syncStatus: statusResponse.data }
          );
        }

        console.log(`✅ Backend has ${statusResponse.data.total_jobs} jobs available`);

        // Step 2: Load pre-computed dashboard data
        setProgress(30);
        console.log('📊 Loading pre-computed analytics...');
        
        const allDataResponse = await dashboardApi.getAllDashboardData();
        
        if (!allDataResponse.success) {
          throw createAppError(
            'Failed to load dashboard data',
            'API_ERROR',
            true,
            { response: allDataResponse }
          );
        }

        setDashboardData(allDataResponse.data);
        console.log('✅ Dashboard analytics loaded');

        // Step 3: Load ALL jobs for Job Browser
        setProgress(60);
        console.log('📋 Loading all jobs...');
        
        // Load all jobs - backend SQLite makes this fast now
        const jobsResponse = await dashboardApi.getJobs({
          page: 1,
          limit: 50000, // Load all jobs - SQLite cache makes this fast
          sort_by: 'posting_date',
          sort_order: 'desc'
        });

        if (!jobsResponse.success) {
          throw createAppError(
            'Failed to load jobs',
            'API_ERROR',
            true,
            { response: jobsResponse }
          );
        }

        // Transform jobs - backend data already has most fields processed
        // Use 'as any' to avoid strict type checking since backend provides all needed fields
        const transformedJobs = jobsResponse.data.map((job: any) => ({
          // Core fields
          id: String(job.id),
          url: job.url || '',
          title: job.title || '',
          description: job.description || '',
          duty_station: job.duty_station || '',
          duty_country: job.duty_country || '',
          duty_continent: job.duty_continent || '',
          country_code: job.country_code || '',
          eligible_nationality: job.eligible_nationality || '',
          hs_min_exp: job.hs_min_exp || null,
          bachelor_min_exp: job.bachelor_min_exp || null,
          master_min_exp: job.master_min_exp || null,
          up_grade: job.up_grade || '',
          pipeline: job.pipeline || '',
          department: job.department || '',
          long_agency: job.long_agency || '',
          short_agency: job.short_agency || '',
          posting_date: job.posting_date || '',
          apply_until: job.apply_until || '',
          languages: job.languages || '',
          uniquecode: job.uniquecode || '',
          ideal_candidate: job.ideal_candidate || '',
          job_labels: job.job_labels || '',
          job_labels_vectorized: job.job_labels_vectorized || '',
          job_candidate_vectorized: job.job_candidate_vectorized || '',
          created_at: job.created_at || '',
          updated_at: job.updated_at || '',
          archived: Boolean(job.archived),
          sectoral_category: job.sectoral_category || '',
          
          // Processed fields from backend
          primary_category: job.primary_category || 'operations-administration',
          secondary_categories: job.secondary_categories || [],
          classification_confidence: job.classification_confidence || 50,
          classification_reasoning: job.classification_reasoning || [],
          is_ambiguous_category: false,
          emerging_terms_found: [],
          
          // Status fields
          status: job.status || 'active',
          is_active: Boolean(job.is_active),
          is_expired: Boolean(job.is_expired),
          days_remaining: job.days_remaining || 0,
          urgency: job.urgency || 'normal',
          application_window_days: job.application_window_days || 30,
          formatted_posting_date: job.formatted_posting_date || '',
          formatted_apply_until: job.formatted_apply_until || '',
          
          // Analytics fields with defaults
          seniority_level: job.seniority_level || 'Mid',
          location_type: job.location_type || 'Field',
          skill_domain: 'Mixed',
          posting_month: job.posting_date ? new Date(job.posting_date).toLocaleString('default', { month: 'short' }) : '',
          posting_year: job.posting_date ? new Date(job.posting_date).getFullYear() : new Date().getFullYear(),
          posting_quarter: 'Q1',
          grade_level: 'Mid',
          grade_numeric: 3,
          is_consultant: false,
          geographic_region: 'Global',
          geographic_subregion: '',
          is_conflict_zone: false,
          is_developing_country: false,
          relevant_experience: 0,
          language_count: (job.languages || '').split(',').filter((l: string) => l.trim()).length,
          is_home_based: (job.duty_station || '').toLowerCase().includes('home')
        })) as ProcessedJobData[];

        setProcessedData(transformedJobs);
        console.log(`✅ Loaded ${transformedJobs.length} jobs for Job Browser`);

        // Complete!
        setProgress(100);
        setLoadingState({ status: 'success' });

        console.log('🎉 All data loaded successfully!');

      } catch (err) {
        console.error('❌ Loading failed:', err);
        handleLoadingError(err);
      }
    };

    const handleLoadingError = (err: any) => {
      let appError: AppError;
      if (err instanceof Error && 'code' in err) {
        appError = err as AppError;
      } else if (err instanceof Error) {
        appError = createAppError(
          err.message || 'Failed to load data',
          'UNKNOWN_ERROR',
          true,
          { originalError: err.name }
        );
      } else {
        appError = createAppError(
          'An unexpected error occurred',
          'UNKNOWN_ERROR',
          true,
          { error: String(err) }
        );
      }

      setError(appError);
      setLoadingState({ status: 'error', error: appError });
    };

    loadData();
  }, []);

  const handleRetry = async () => {
    setProcessedData([]);
    setDashboardData(null);
    setError(null);
    setProgress(0);
    setLoadingState({ status: 'idle' });
    
    // Trigger re-load by updating a dependency (this will cause useEffect to re-run)
    window.location.reload();
  };

  // Render loading state
  if (loadingState.status === 'loading' || loadingState.status === 'idle') {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="mb-6">
                <img
                  src="/UNDP_logo.png"
                  alt="UNDP"
                  className="h-12 w-auto mx-auto mb-4"
                />
                <h1 className="text-3xl font-bold text-gray-900">Baro Talent Analytics</h1>
                <p className="text-gray-600 mt-2">Loading dashboard data...</p>
              </div>

              <LoadingSpinner
                size="xl"
                variant="analytics"
                message={
                  progress < 30 ? "Connecting to backend..." :
                  progress < 60 ? "Loading analytics..." :
                  progress < 90 ? "Loading jobs..." :
                  "Almost ready..."
                }
                progress={progress}
                showProgress={true}
              />
            </div>

            {/* Show skeleton while loading */}
            <DashboardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (loadingState.status === 'error' || error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="mb-6">
            <img
              src="/UNDP_logo.png"
              alt="UNDP"
              className="h-12 w-auto mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Data</h1>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 font-medium mb-2">{error?.message || 'An error occurred'}</p>
            {error?.code === 'NO_DATA' && (
              <div className="text-sm text-red-600 mt-2">
                <p className="mb-2">To sync data from PostgreSQL, run:</p>
                <code className="bg-red-100 px-2 py-1 rounded">cd backend && npm run sync:dev</code>
              </div>
            )}
            {error?.code === 'CONNECTION_ERROR' && (
              <div className="text-sm text-red-600 mt-2">
                <p className="mb-2">Make sure the backend server is running:</p>
                <code className="bg-red-100 px-2 py-1 rounded">cd backend && npm run start</code>
              </div>
            )}
          </div>

          <button
            onClick={handleRetry}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show the analytics dashboard once data is loaded
  return (
    <ErrorBoundary
      level="application"
      onError={(error, errorInfo) => {
        console.error('Application Error:', error, errorInfo);
      }}
    >
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <img src="/UNDP_logo.png" alt="UNDP" className="h-8 w-auto" />
                <span className="ml-3 text-xl font-semibold text-gray-900">Baro Talent Analytics</span>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${currentView === 'dashboard'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Analytics Dashboard
                </button>
                <button
                  onClick={() => setCurrentView('learning')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${currentView === 'learning'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Learning Dashboard
                </button>
                {/* Data source indicator */}
                <div className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-300">
                  🗄️ SQLite Cache
                  {syncStatus?.total_jobs && (
                    <span className="ml-1">({syncStatus.total_jobs.toLocaleString()} jobs)</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Content */}
        <DataProcessingProvider>
          <DataErrorBoundary onRetry={handleRetry}>
            {currentView === 'dashboard' ? (
              <Dashboard data={processedData} dashboardData={dashboardData} />
            ) : (
              <LearningDashboard />
            )}
          </DataErrorBoundary>
        </DataProcessingProvider>
      </div>
    </ErrorBoundary>
  );
}

export default App;
