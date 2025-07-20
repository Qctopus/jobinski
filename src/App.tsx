import React, { useState, useMemo } from 'react';
import { Download, BarChart3, Settings } from 'lucide-react';
import FileUploader from './components/FileUploader';
import DashboardOverview from './components/DashboardOverview';
import FilterPanel from './components/FilterPanel';
import AgencyBenchmarking from './components/AgencyBenchmarking';
import DetailedAnalytics from './components/DetailedAnalytics';
import UNCareerIntelligence from './components/UNCareerIntelligence';
import { ProcessedJobData, FilterOptions } from './types';
import { 
  parseCSVData, 
  processJobData, 
  calculateDashboardMetrics, 
  applyFilters, 
  exportToCSV, 
  generateInsights 
} from './utils/dataProcessor';

type TabType = 'overview' | 'agency-benchmarking' | 'workforce-intelligence' | 'detailed-analytics';

function App() {
  const [processedData, setProcessedData] = useState<ProcessedJobData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<FilterOptions>({
    agencies: [],
    grades: [],
    countries: [],
    continents: [],
    dateRange: { start: '', end: '' },
    searchTerm: ''
  });

  const filteredData = useMemo(() => {
    return applyFilters(processedData, filters);
  }, [processedData, filters]);

  const metrics = useMemo(() => {
    return calculateDashboardMetrics(filteredData);
  }, [filteredData]);

  const insights = useMemo(() => {
    return generateInsights(filteredData);
  }, [filteredData]);

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

  const handleClearFilters = () => {
    setFilters({
      agencies: [],
      grades: [],
      countries: [],
      continents: [],
      dateRange: { start: '', end: '' },
      searchTerm: ''
    });
  };

  const handleExportData = () => {
    exportToCSV(filteredData, `un_jobs_filtered_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <DashboardOverview metrics={metrics} insights={insights} />;
      
      case 'agency-benchmarking':
        return <AgencyBenchmarking data={filteredData} />;
      
      case 'workforce-intelligence':
        return <UNCareerIntelligence data={filteredData} />;
      
      case 'detailed-analytics':
        return <DetailedAnalytics data={filteredData} />;
      
      default:
        return <DashboardOverview metrics={metrics} insights={insights} />;
    }
  };

  if (processedData.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                UN Jobs Market Analytics Dashboard
              </h1>
              <p className="text-xl text-gray-600">
                Comprehensive insights for UN agency HR departments
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                UN Jobs Market Analytics
              </h1>
              <p className="text-sm text-gray-600">
                {filteredData.length.toLocaleString()} of {processedData.length.toLocaleString()} jobs shown
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn-secondary ${showFilters ? 'bg-gray-200' : ''}`}
              >
                <Settings className="h-4 w-4 mr-2" />
                Filters
              </button>
              
              <button
                onClick={handleExportData}
                className="btn-primary"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - Filters */}
          {showFilters && (
            <div className="lg:w-80 order-2 lg:order-1">
              <FilterPanel
                data={processedData}
                filters={filters}
                onFiltersChange={setFilters}
                onClearFilters={handleClearFilters}
              />
            </div>
          )}

          {/* Main Content */}
          <div className={`flex-1 order-1 lg:order-2 ${showFilters ? '' : 'max-w-none'}`}>
            {/* Navigation Tabs */}
            <div className="mb-6">
              <nav className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`nav-tab ${
                    activeTab === 'overview' ? 'nav-tab-active' : 'nav-tab-inactive'
                  }`}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('agency-benchmarking')}
                  className={`nav-tab ${
                    activeTab === 'agency-benchmarking' ? 'nav-tab-active' : 'nav-tab-inactive'
                  }`}
                >
                  Agency Benchmarking
                </button>
                <button
                  onClick={() => setActiveTab('workforce-intelligence')}
                  className={`nav-tab ${
                    activeTab === 'workforce-intelligence' ? 'nav-tab-active' : 'nav-tab-inactive'
                  }`}
                >
                  UN Career Intelligence
                </button>
                <button
                  onClick={() => setActiveTab('detailed-analytics')}
                  className={`nav-tab ${
                    activeTab === 'detailed-analytics' ? 'nav-tab-active' : 'nav-tab-inactive'
                  }`}
                >
                  Detailed Analytics
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App; 