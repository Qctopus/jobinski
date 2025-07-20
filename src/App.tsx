import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import { ProcessedJobData } from './types';
import { parseCSVData } from './utils/dataProcessor';
import { JobAnalyticsProcessor } from './services/dataProcessor';

function App() {
  const [processedData, setProcessedData] = useState<ProcessedJobData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load CSV data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Load the jobs.csv file from the public directory
        const response = await fetch('/jobs.csv');
        if (!response.ok) {
          throw new Error('Failed to load jobs data');
        }
        
        const csvData = await response.text();
        const parsed = await parseCSVData(csvData);
        
        // Use the enhanced analytics processor
        const processor = new JobAnalyticsProcessor();
        const processed = processor.processJobData(parsed);
        
        setProcessedData(processed);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to process data');
        console.error('Error processing CSV:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading UN Jobs Data</h2>
          <p className="text-gray-600">Processing job categories and analytics...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-red-800 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show the analytics dashboard once data is loaded
  return <Dashboard data={processedData} />;
}

export default App; 