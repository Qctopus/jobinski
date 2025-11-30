/**
 * DataQualityMonitor - Admin tab for monitoring data pipeline health
 * 
 * This is an internal admin tab for data engineers to monitor the health of the
 * UN Jobs database and identify issues from the 11-step processing pipeline.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { 
  RefreshCw, Download, Filter, AlertTriangle, CheckCircle, 
  Info, Settings, ChevronDown
} from 'lucide-react';
import { dataQualityService } from '../../../services/dataQuality/DataQualityService';
import { 
  DataQualitySummary, 
  QualityMonitorFilters,
  IssueType,
  IssueSeverity,
  PipelineStep
} from '../../../types/dataQuality';
import { HealthScoreCard } from './HealthScoreCard';
import { IssueSummaryCards } from './IssueSummaryCards';
import { PipelineHealthPanel } from './PipelineHealthPanel';
import { LanguageIssuesPanel } from './LanguageIssuesPanel';
import { ScraperExtractorPanel } from './ScraperExtractorPanel';
import { GeoMappingPanel } from './GeoMappingPanel';
import { DuplicateDetectionPanel } from './DuplicateDetectionPanel';
import { ClassificationQualityPanel } from './ClassificationQualityPanel';
import { GradeDateValidationPanel } from './GradeDateValidationPanel';
import { AgencyQualityTable } from './AgencyQualityTable';

interface DataQualityMonitorProps {
  data: any[];
}

type TabId = 'overview' | 'pipeline' | 'language' | 'scraper' | 'geo' | 'duplicates' | 'classification' | 'validation' | 'agencies';

interface Tab {
  id: TabId;
  name: string;
  icon: React.ReactNode;
}

export const DataQualityMonitor: React.FC<DataQualityMonitorProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [filters, setFilters] = useState<QualityMonitorFilters>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Analyze data quality
  const summary = useMemo(() => {
    return dataQualityService.analyzeDataQuality(data);
  }, [data]);
  
  // Handle refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => setIsRefreshing(false), 500);
  }, []);
  
  // Handle issue type selection
  const handleSelectIssue = useCallback((issueType: IssueType) => {
    setFilters(prev => ({ ...prev, issueType }));
    // Navigate to appropriate tab based on issue type
    if (['non_english_content'].includes(issueType)) {
      setActiveTab('language');
    } else if (['short_description', 'empty_description', 'boilerplate_content', 'truncated_content'].includes(issueType)) {
      setActiveTab('scraper');
    } else if (['unmatched_duty_station', 'missing_country', 'missing_continent'].includes(issueType)) {
      setActiveTab('geo');
    } else if (['potential_duplicate', 'same_uniquecode'].includes(issueType)) {
      setActiveTab('duplicates');
    } else if (['low_classification_confidence', 'null_sectoral_category'].includes(issueType)) {
      setActiveTab('classification');
    } else if (['invalid_grade', 'missing_grade', 'date_parse_error', 'date_anomaly'].includes(issueType)) {
      setActiveTab('validation');
    }
  }, []);
  
  // Export summary as JSON
  const handleExport = useCallback(() => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      summary: {
        ...summary,
        lastRefreshed: summary.lastRefreshed.toISOString()
      }
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-quality-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [summary]);
  
  const tabs: Tab[] = [
    { id: 'overview', name: 'Overview', icon: <Settings className="h-4 w-4" /> },
    { id: 'pipeline', name: 'Pipeline Health', icon: <RefreshCw className="h-4 w-4" /> },
    { id: 'language', name: 'Language Issues', icon: <span className="text-sm">🌐</span> },
    { id: 'scraper', name: 'Scraper/Extractor', icon: <span className="text-sm">🕷️</span> },
    { id: 'geo', name: 'Geo Mapping', icon: <span className="text-sm">📍</span> },
    { id: 'duplicates', name: 'Duplicates', icon: <span className="text-sm">🔄</span> },
    { id: 'classification', name: 'Classification', icon: <span className="text-sm">🏷️</span> },
    { id: 'validation', name: 'Grade & Dates', icon: <span className="text-sm">📊</span> },
    { id: 'agencies', name: 'Agency Quality', icon: <span className="text-sm">🏢</span> },
  ];
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <HealthScoreCard summary={summary} />
            <IssueSummaryCards summary={summary} onSelectIssue={handleSelectIssue} />
          </div>
        );
      case 'pipeline':
        return (
          <PipelineHealthPanel 
            agencyHealth={summary.agencyPipelineHealth} 
            openAIPatterns={summary.openAIFailurePatterns}
          />
        );
      case 'language':
        return <LanguageIssuesPanel languageIssues={summary.languageIssues} />;
      case 'scraper':
        return <ScraperExtractorPanel issues={summary.scraperExtractorIssues} />;
      case 'geo':
        return (
          <GeoMappingPanel 
            unmappedLocations={summary.unmappedLocations}
            missingCountryCount={summary.byIssueType.missing_country || 0}
            missingContinentCount={summary.byIssueType.missing_continent || 0}
          />
        );
      case 'duplicates':
        return <DuplicateDetectionPanel duplicateGroups={summary.duplicateGroups} />;
      case 'classification':
        return <ClassificationQualityPanel data={data} summary={summary} />;
      case 'validation':
        return (
          <GradeDateValidationPanel 
            unrecognizedGrades={summary.unrecognizedGrades}
            dateAnomalies={summary.dateAnomalies}
          />
        );
      case 'agencies':
        return <AgencyQualityTable agencyStats={summary.byAgency} />;
      default:
        return null;
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Settings className="h-6 w-6 text-amber-700" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Data Quality Monitor</h1>
                <p className="text-sm text-slate-500">
                  Pipeline diagnostics for {data.length.toLocaleString()} jobs
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Last refreshed */}
              <span className="text-sm text-slate-500">
                Last refreshed: {summary.lastRefreshed.toLocaleTimeString()}
              </span>
              
              {/* Refresh button */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="text-sm font-medium">Refresh</span>
              </button>
              
              {/* Export button */}
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span className="text-sm font-medium">Export</span>
              </button>
            </div>
          </div>
          
          {/* Quick Stats Bar */}
          <div className="mt-4 flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span className="text-slate-600">
                {summary.cleanJobs.toLocaleString()} clean records
              </span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-slate-600">
                {summary.jobsWithIssues.toLocaleString()} with issues
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-rose-500" />
              <span className="text-slate-600">
                {summary.criticalIssues} critical
              </span>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="border-b border-slate-200 overflow-x-auto">
            <nav className="flex px-4" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-amber-500 text-amber-700'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.name}</span>
                  {tab.id === 'pipeline' && summary.agencyPipelineHealth.some(a => a.healthScore < 80) && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">
                      ⚠
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
          
          {/* Tab Content */}
          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>
        
        {/* Footer Info */}
        <div className="text-center text-xs text-slate-400 mt-8">
          <p>
            Pipeline: backup → scraper → extractor → geo → jobexp → lang → clean → labelor → bertizer → categorizer → import
          </p>
          <p className="mt-1">
            This tab is diagnostic only (read-only). Fixes must be applied in the pipeline scripts.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DataQualityMonitor;


