import React, { useState } from 'react';
import { FileText, Database, Calendar, MapPin } from 'lucide-react';
import FileUploader from './components/FileUploader';
import { ProcessedJobData } from './types';
import { parseCSVData, processJobData } from './utils/dataProcessor';

function App() {
  const [processedData, setProcessedData] = useState<ProcessedJobData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileLoad = async (csvData: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const parsed = await parseCSVData(csvData);
      const processed = processJobData(parsed);
      
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
                UN Jobs Data Viewer
              </h1>
              <p className="text-xl text-gray-600">
                Load your UN jobs CSV data to get started
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

  // Show basic data overview once loaded
  const totalJobs = processedData.length;
  const agencies = new Set(processedData.map(job => job.short_agency || job.long_agency)).size;
  const countries = new Set(processedData.map(job => job.duty_country)).size;
  const recentJobs = processedData.slice(0, 10); // Show first 10 jobs

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              UN Jobs Data Loaded Successfully
            </h1>
            <p className="text-xl text-gray-600">
              Your CSV data has been processed and is ready for analysis
            </p>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <Database className="h-12 w-12 text-un-blue mx-auto mb-4" />
              <div className="text-3xl font-bold text-gray-900">{totalJobs.toLocaleString()}</div>
              <div className="text-gray-600">Total Job Postings</div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <FileText className="h-12 w-12 text-un-blue mx-auto mb-4" />
              <div className="text-3xl font-bold text-gray-900">{agencies}</div>
              <div className="text-gray-600">UN Agencies</div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <MapPin className="h-12 w-12 text-un-blue mx-auto mb-4" />
              <div className="text-3xl font-bold text-gray-900">{countries}</div>
              <div className="text-gray-600">Countries</div>
            </div>
          </div>

          {/* Sample Data Preview */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Data Preview</h2>
              <p className="text-sm text-gray-600">Showing first 10 job postings from your data</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Posted Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentJobs.map((job, index) => (
                    <tr key={job.id || index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{job.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{job.short_agency || job.long_agency}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{job.duty_station}</div>
                        <div className="text-sm text-gray-500">{job.duty_country}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {job.up_grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {job.formatted_posting_date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Load New Data Button */}
          <div className="mt-8 text-center">
            <button
              onClick={() => {
                setProcessedData([]);
                setError(null);
              }}
              className="btn-secondary"
            >
              Load Different CSV File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App; 