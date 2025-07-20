import React, { useState } from 'react';
import { FileText, Database, MapPin } from 'lucide-react';
import FileUploader from './components/FileUploader';
import Dashboard from './components/Dashboard';
import { ProcessedJobData } from './types';
import { parseCSVData } from './utils/dataProcessor';
import { JobAnalyticsProcessor } from './services/dataProcessor';

function App() {
  const [processedData, setProcessedData] = useState<ProcessedJobData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileLoad = async (csvData: string) => {
    setLoading(true);
    setError(null);
    
    try {
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

  // If no data is loaded, show the file uploader
  if (processedData.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                UN Jobs Analytics Dashboard
              </h1>
              <p className="text-xl text-gray-600">
                Understanding what agencies are hiring for across the UN system
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Load your UN jobs CSV data to unlock powerful insights about recruitment patterns
              </p>
            </div>
            
            <FileUploader onFileLoad={handleFileLoad} loading={loading} />
            
            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show the analytics dashboard once data is loaded
  return <Dashboard data={processedData} />;
}

export default App; 