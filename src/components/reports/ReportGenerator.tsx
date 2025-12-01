/**
 * Report Generator Component
 * UI for generating and downloading agency HR intelligence reports
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Download, 
  CheckCircle, 
  AlertCircle,
  Clock,
  BarChart3,
  Trash2,
  ChevronRight,
  Loader2,
  Building2,
  MapPin,
  TrendingUp,
  Users,
  Briefcase
} from 'lucide-react';
import { getAgencyLogo } from '../../utils/agencyLogos';

// Lazy load pdfmake to avoid initialization issues
let pdfMakeInstance: any = null;

const getPdfMake = async () => {
  if (pdfMakeInstance) return pdfMakeInstance;
  
  const pdfMake = (await import('pdfmake/build/pdfmake')).default;
  const pdfFonts = await import('pdfmake/build/vfs_fonts');
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || (pdfFonts as any).default?.pdfMake?.vfs || {};
  
  pdfMakeInstance = pdfMake;
  return pdfMake;
};

interface Agency {
  agency: string;
  jobCount: number;
}

interface ReportPreview {
  totalPostings: number;
  activePostings: number;
  countries: number;
  categories: number;
  estimatedPages: number;
  estimatedGenerationTime: string;
}

interface GeneratedReport {
  reportId: string;
  agency: string;
  generatedAt: string;
}

interface GenerateReportResponse {
  success: boolean;
  reportId?: string;
  reportUrl?: string;
  generatedAt: string;
  agency: string;
  pageCount: number;
  processingTime?: number;
  error?: string;
}

interface ReportGeneratorProps {
  onViewReport?: (agency: string) => void;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({ onViewReport }) => {
  // State
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [selectedAgency, setSelectedAgency] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('2025-10-01');
  const [endDate, setEndDate] = useState<string>('2025-11-30');
  const [includeRawData, setIncludeRawData] = useState<boolean>(true);
  
  const [preview, setPreview] = useState<ReportPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
  
  const [generating, setGenerating] = useState<boolean>(false);
  const [generationResult, setGenerationResult] = useState<GenerateReportResponse | null>(null);
  
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [loadingReports, setLoadingReports] = useState<boolean>(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const loadAgencies = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/reports/agencies`);
      const data = await response.json();
      if (data.success) {
        setAgencies(data.data);
      }
    } catch (error) {
      console.error('Error loading agencies:', error);
    }
  }, [API_BASE]);

  const loadReports = useCallback(async () => {
    setLoadingReports(true);
    try {
      const response = await fetch(`${API_BASE}/reports/list`);
      const data = await response.json();
      if (data.success) {
        setReports(data.data);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoadingReports(false);
    }
  }, [API_BASE]);

  const loadPreview = useCallback(async (agency: string) => {
    setLoadingPreview(true);
    try {
      const response = await fetch(
        `${API_BASE}/reports/preview/${encodeURIComponent(agency)}?startDate=${startDate}&endDate=${endDate}`
      );
      const data = await response.json();
      if (data.success) {
        setPreview(data.data.preview);
      }
    } catch (error) {
      console.error('Error loading preview:', error);
    } finally {
      setLoadingPreview(false);
    }
  }, [API_BASE, startDate, endDate]);

  // Load agencies on mount
  useEffect(() => {
    loadAgencies();
    loadReports();
  }, [loadAgencies, loadReports]);

  // Load preview when agency changes
  useEffect(() => {
    if (selectedAgency) {
      loadPreview(selectedAgency);
    } else {
      setPreview(null);
    }
  }, [selectedAgency, loadPreview]);

  const generateReport = async () => {
    if (!selectedAgency) return;
    
    setGenerating(true);
    setGenerationResult(null);
    
    try {
      const response = await fetch(`${API_BASE}/reports/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agency: selectedAgency,
          reportPeriod: { startDate, endDate },
          sections: ['all'],
          format: 'pdf',
          includeRawData
        })
      });
      
      const result = await response.json();
      setGenerationResult(result);
      
      if (result.success) {
        loadReports();
        // Auto-download the report
        await downloadReport(result.reportId);
      }
    } catch (error) {
      setGenerationResult({
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        generatedAt: new Date().toISOString(),
        agency: selectedAgency,
        pageCount: 0
      });
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = async (reportId: string) => {
    setDownloadingId(reportId);
    try {
      const response = await fetch(`${API_BASE}/reports/download/${reportId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        // Lazy load pdfmake and generate PDF
        const pdfMake = await getPdfMake();
        const pdfDocGenerator = pdfMake.createPdf(data.data);
        
        // Get the agency name from the report
        const report = reports.find(r => r.reportId === reportId);
        const fileName = `${report?.agency || 'Agency'}_HR_Report_${new Date().toISOString().split('T')[0]}.pdf`;
        
        pdfDocGenerator.download(fileName);
      } else {
        console.error('Failed to get PDF definition');
        alert('Failed to download report. Please try again.');
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download report. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const deleteReport = async (reportId: string) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    
    try {
      await fetch(`${API_BASE}/reports/${reportId}`, { method: 'DELETE' });
      loadReports();
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const selectedAgencyData = agencies.find(a => a.agency === selectedAgency);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Agency HR Intelligence Reports</h1>
              <p className="text-gray-500 text-sm">Generate comprehensive monthly analytics reports for UN agencies</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Generator */}
          <div className="lg:col-span-2 space-y-6">
            {/* Generate Report Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  <h2 className="font-semibold text-gray-900">Generate New Report</h2>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Agency Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Agency
                  </label>
                  <select
                    value={selectedAgency}
                    onChange={(e) => setSelectedAgency(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  >
                    <option value="">-- Select an agency --</option>
                    {agencies.map((a) => (
                      <option key={a.agency} value={a.agency}>
                        {a.agency} ({a.jobCount} jobs)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Agency Logo Preview */}
                {selectedAgency && selectedAgencyData && (
                  <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
                    <img
                      src={getAgencyLogo(selectedAgency) || '/logo/logo/UN.png'}
                      alt={selectedAgency}
                      className="w-14 h-14 object-contain bg-white rounded-lg p-2 shadow-sm"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/logo/logo/UN.png';
                      }}
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{selectedAgency}</h3>
                      <p className="text-purple-700 text-sm font-medium">
                        {selectedAgencyData.jobCount} job postings in period
                      </p>
                    </div>
                    {loadingPreview && (
                      <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                    )}
                  </div>
                )}

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Options */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="includeRawData"
                    checked={includeRawData}
                    onChange={(e) => setIncludeRawData(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="includeRawData" className="text-sm text-gray-600">
                    Include detailed job listings appendix
                  </label>
                </div>

                {/* Preview Stats */}
                {selectedAgency && preview && !loadingPreview && (
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-100">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Briefcase className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{preview.totalPostings}</div>
                      <div className="text-xs text-gray-500 mt-1">Total Jobs</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-100">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{preview.activePostings}</div>
                      <div className="text-xs text-gray-500 mt-1">Active</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-100">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <MapPin className="w-4 h-4 text-orange-500" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{preview.countries}</div>
                      <div className="text-xs text-gray-500 mt-1">Countries</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-100">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Users className="w-4 h-4 text-purple-500" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{preview.categories}</div>
                      <div className="text-xs text-gray-500 mt-1">Categories</div>
                    </div>
                  </div>
                )}

                {/* Report Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  {/* View Visual Report Button - NEW */}
                  <button
                    onClick={() => onViewReport?.(selectedAgency)}
                    disabled={!selectedAgency}
                    className={`py-4 rounded-lg font-semibold text-base flex items-center justify-center gap-3 transition-all ${
                      selectedAgency
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <BarChart3 className="w-5 h-5" />
                    View Visual Report
                  </button>
                  
                  {/* Generate PDF Button */}
                  <button
                    onClick={generateReport}
                    disabled={!selectedAgency || generating}
                    className={`py-4 rounded-lg font-semibold text-base flex items-center justify-center gap-3 transition-all ${
                      selectedAgency && !generating
                        ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText className="w-5 h-5" />
                        Download PDF
                      </>
                    )}
                  </button>
                </div>

                {/* Generation Result */}
                {generationResult && (
                  <div className={`p-4 rounded-lg ${
                    generationResult.success 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    {generationResult.success ? (
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-green-800">Report Generated Successfully!</h4>
                          <p className="text-sm text-green-700 mt-1">
                            {generationResult.pageCount} pages • Generated in {generationResult.processingTime}ms
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-red-800">Generation Failed</h4>
                          <p className="text-sm text-red-700 mt-1">{generationResult.error}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Report History */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <h2 className="font-semibold text-gray-900">Generated Reports</h2>
                  <span className="px-2 py-0.5 bg-gray-200 rounded-full text-xs text-gray-600 font-medium">
                    {reports.length}
                  </span>
                </div>
              </div>
              
              <div className="divide-y divide-gray-100">
                {loadingReports ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                  </div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="text-gray-500">No reports generated yet</p>
                    <p className="text-sm text-gray-400 mt-1">Generate your first report above</p>
                  </div>
                ) : (
                  reports.map((report) => (
                    <div
                      key={report.reportId}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={getAgencyLogo(report.agency) || '/logo/logo/UN.png'}
                          alt={report.agency}
                          className="w-10 h-10 object-contain bg-gray-100 rounded-lg p-1"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/logo/logo/UN.png';
                          }}
                        />
                        <div>
                          <h4 className="font-medium text-gray-900">{report.agency}</h4>
                          <p className="text-xs text-gray-500">{formatDate(report.generatedAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => downloadReport(report.reportId)}
                          disabled={downloadingId === report.reportId}
                          className="flex items-center gap-2 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors text-sm font-medium"
                        >
                          {downloadingId === report.reportId ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                          PDF
                        </button>
                        <button
                          onClick={() => deleteReport(report.reportId)}
                          className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Info & Stats */}
          <div className="space-y-6">
            {/* Report Contents Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-600" />
                Report Contents
              </h3>
              <ul className="space-y-3 text-sm">
                {[
                  'Executive Summary with KPIs',
                  'Hiring Activity Overview & Trends',
                  'Workforce Composition Analysis',
                  'Category & Skills Intelligence',
                  'Geographic Intelligence',
                  'Competitive Peer Analysis',
                  'Strategic Recommendations',
                  'Job Listings Appendix'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-gray-600">
                    <ChevronRight className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Data Info Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Available Data
              </h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Total Jobs</span>
                  <span className="font-semibold text-gray-900">
                    {agencies.reduce((sum, a) => sum + a.jobCount, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Agencies</span>
                  <span className="font-semibold text-gray-900">{agencies.length}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-500">Data Source</span>
                  <span className="font-semibold text-green-600 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    SQLite Cache
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-4 text-center">
                Use the sync button in the top navigation to fetch new jobs
              </p>
            </div>

            {/* Help Card */}
            <div className="bg-purple-50 rounded-xl border border-purple-100 p-6">
              <h3 className="font-semibold text-purple-900 mb-3">💡 Quick Tips</h3>
              <ul className="text-sm text-purple-800 space-y-2">
                <li>• Select an agency to see preview statistics</li>
                <li>• Reports are generated as downloadable PDFs</li>
                <li>• Include appendix for detailed job listings</li>
                <li>• Reports typically take 10-30 seconds</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;
