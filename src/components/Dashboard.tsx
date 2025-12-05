import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Users, Briefcase, Target, Activity, HelpCircle, Globe, Calendar, TrendingUp, ChevronDown, Zap } from 'lucide-react';
import { ProcessedJobData, FilterOptions, TIME_RANGE_CONFIG } from '../types';
import { useDashboardData } from '../hooks/useDashboardData';
import { TimeframeProvider, useTimeframe } from '../contexts/TimeframeContext';
import { getAgencyLogo } from '../utils/agencyLogos';
import CategoryInsights from './CategoryInsightsNew';
import WorkforceStructure from './WorkforceStructure';
import Skills from './Skills';
import IntelligenceBrief from './intelligence/IntelligenceBrief';
import GeographyIntelligence from './GeographyIntelligence';
import { CompactJobBrowser } from './CompactJobBrowser';
import { parseISO, format } from 'date-fns';


interface DashboardProps {
  data: ProcessedJobData[];
  dashboardData?: any; // Pre-computed analytics from backend
}

type TabType = 'overview' | 'categories' | 'workforce' | 'geography' | 'skills' | 'jobs';

// Inner dashboard component that uses TimeframeContext
const DashboardContent: React.FC<DashboardProps & { filters: FilterOptions; setFilters: React.Dispatch<React.SetStateAction<FilterOptions>> }> = ({ 
  data, 
  dashboardData, 
  filters, 
  setFilters 
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview'); // Default to Overview for better first impression
  
  const [showAgencyDropdown, setShowAgencyDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use the custom hook for dashboard data
  const {
    isAgencyView,
    selectedAgencyName,
    filteredData,
    metrics,
    marketMetrics
  } = useDashboardData(data, filters);

  // Use timeframe context for period information
  const { primaryPeriod, comparisonPeriod, getPeriodLabel, getComparisonLabel } = useTimeframe();

  // Data collection start date
  const dataStartDate = 'Oct 1, 2025';

  // Time range options for the dropdown
  const timeRangeOptions: { value: FilterOptions['timeRange']; label: string; sublabel: string }[] = [
    { value: '4weeks', label: 'Last 4 weeks', sublabel: 'vs prior 4 weeks' },
    { value: '8weeks', label: 'Last 8 weeks', sublabel: 'vs prior 8 weeks' },
    { value: '3months', label: 'Last 3 months', sublabel: 'vs prior 3 months' },
    { value: '6months', label: 'Last 6 months', sublabel: 'vs prior 6 months' },
    { value: '1year', label: 'Last 12 months', sublabel: 'vs prior 12 months' },
    { value: 'all', label: 'All time', sublabel: 'since Oct 2025' }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAgencyDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Get unique agencies for the selector - always compute from transformed data
  // This ensures Secretariat breakdown (OCHA, OHCHR, etc.) is applied
  const agencies = useMemo(() => {
    const agencySet = new Set<string>();
    data.forEach(job => {
      const agency = job.short_agency || job.long_agency;
      if (agency && agency.trim()) agencySet.add(agency);
    });
    return Array.from(agencySet).sort();
  }, [data]);

  const tabs = [
    {
      id: 'overview' as TabType,
      name: 'Intelligence',
      icon: <Zap className="h-5 w-5" />,
      description: 'Strategic intelligence brief — key findings, interpretations, and signals to watch'
    },
    {
      id: 'categories' as TabType,
      name: 'Categories',
      icon: <Target className="h-5 w-5" />,
      description: 'Deep-dive into job categories'
    },
    {
      id: 'workforce' as TabType,
      name: 'Workforce Structure',
      icon: <Users className="h-5 w-5" />,
      description: 'Organizational shape, grade distribution, and workforce evolution'
    },
    {
      id: 'geography' as TabType,
      name: 'Geography',
      icon: <Globe className="h-5 w-5" />,
      description: 'ICSC hardship classifications, operational footprint, and localization analysis'
    },
    {
      id: 'skills' as TabType,
      name: 'Skills',
      icon: <Briefcase className="h-5 w-5" />,
      description: 'Comprehensive skills analysis and insights'
    },
    {
      id: 'jobs' as TabType,
      name: 'Job Browser',
      icon: <HelpCircle className="h-5 w-5" />,
      description: 'Browse jobs and provide classification feedback to improve the system'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <IntelligenceBrief
            jobs={data}
            timeRange={filters.timeRange}
            selectedAgency={isAgencyView ? selectedAgencyName : undefined}
          />
        );

      case 'categories':
        return (
          <CategoryInsights
            metrics={isAgencyView ? metrics : marketMetrics}
            marketMetrics={marketMetrics}
            data={data}
            filters={filters}
            isAgencyView={isAgencyView}
          />
        );

      case 'workforce':
        return (
          <WorkforceStructure
            data={data}
            filters={filters}
          />
        );

      case 'geography':
        return (
          <GeographyIntelligence
            data={data}
            filters={filters}
          />
        );

      case 'skills':
        return (
          <Skills
            data={data}
            filters={filters}
          />
        );

      case 'jobs':
        return <CompactJobBrowser data={filteredData} />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full px-8 xl:px-12 py-4">
        <div className="max-w-[1400px] mx-auto">
          {/* Header */}
          <div className="mb-4">
            {/* Top Row - Agency & Time Filter */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {/* Agency Selection Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowAgencyDropdown(!showAgencyDropdown)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-gray-400 transition-colors"
                  >
                    {filters.selectedAgency === 'all' ? (
                      <>
                        <span>🌍</span>
                        <span className="font-medium">Market View</span>
                      </>
                    ) : (
                      <>
                        {getAgencyLogo(filters.selectedAgency) ? (
                          <img
                            src={getAgencyLogo(filters.selectedAgency)!}
                            alt={filters.selectedAgency}
                            className="h-4 w-4 object-contain"
                          />
                        ) : (
                          <span>🏢</span>
                        )}
                        <span className="font-medium">{filters.selectedAgency}</span>
                      </>
                    )}
                    <ChevronDown className="h-3 w-3 text-gray-400" />
                  </button>

                  {showAgencyDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                      <button
                        onClick={() => {
                          setFilters(prev => ({ ...prev, selectedAgency: 'all' }));
                          setShowAgencyDropdown(false);
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors border-b border-gray-100"
                      >
                        <span>🌍</span>
                        <span className="font-medium">Market View</span>
                      </button>
                      {agencies.map(agency => (
                        <button
                          key={agency}
                          onClick={() => {
                            setFilters(prev => ({ ...prev, selectedAgency: agency }));
                            setShowAgencyDropdown(false);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors"
                        >
                          {getAgencyLogo(agency) ? (
                            <img
                              src={getAgencyLogo(agency)!}
                              alt={agency}
                              className="h-4 w-4 object-contain"
                            />
                          ) : (
                            <span>🏢</span>
                          )}
                          <span className="font-medium">{agency}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Enhanced Time Filter */}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <select
                    value={filters.timeRange}
                    onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value as FilterOptions['timeRange'] }))}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white font-medium text-gray-700"
                  >
                    {timeRangeOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Agency/Market Context - Right aligned */}
              <div className="flex items-center gap-2">
                {isAgencyView ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full">
                    {getAgencyLogo(selectedAgencyName) && (
                      <img
                        src={getAgencyLogo(selectedAgencyName)!}
                        alt={selectedAgencyName}
                        className="h-5 w-5 object-contain"
                      />
                    )}
                    <span className="text-sm font-medium text-blue-700">{selectedAgencyName}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full">
                    <img
                      src="/logo/logo/United_Nations.png"
                      alt="UN System"
                      className="h-5 w-5 object-contain"
                    />
                    <span className="text-sm font-medium text-slate-700">UN Talent Market</span>
                  </div>
                )}
              </div>
            </div>

            {/* Context Bar - Shows what data is being analyzed */}
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg border border-slate-200 px-4 py-3">
              <div className="flex items-center justify-between">
                {/* Stats */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
                      <Briefcase className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-900">{metrics.totalJobs.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">positions</div>
                    </div>
                  </div>
                  {!isAgencyView && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100">
                        <Users className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-900">{metrics.totalAgencies}</div>
                        <div className="text-xs text-gray-500">agencies</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Time Context */}
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                      {filters.timeRange === 'all' 
                        ? `All data since ${dataStartDate}`
                        : `${format(primaryPeriod.start, 'MMM d')} - ${format(primaryPeriod.end, 'MMM d, yyyy')}`
                      }
                    </span>
                  </div>
                  {comparisonPeriod && filters.timeRange !== 'all' && (
                    <div className="flex items-center gap-2 justify-end mt-1">
                      <TrendingUp className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        Trends compare to {format(comparisonPeriod.start, 'MMM d')} - {format(comparisonPeriod.end, 'MMM d')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${activeTab === tab.id
                        ? 'border-un-blue text-un-blue'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab descriptions */}
            <div className="px-6 py-3 bg-gray-50">
              <div className="text-sm text-gray-600">
                {tabs.find(tab => tab.id === activeTab)?.description}
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard wrapper with TimeframeProvider
const Dashboard: React.FC<DashboardProps> = ({ data, dashboardData }) => {
  const [filters, setFilters] = useState<FilterOptions>({
    selectedAgency: 'all',
    timeRange: '3months' // Default to 3 months for more focused analysis
  });

  return (
    <TimeframeProvider timeRange={filters.timeRange}>
      <DashboardContent 
        data={data} 
        dashboardData={dashboardData} 
        filters={filters} 
        setFilters={setFilters} 
      />
    </TimeframeProvider>
  );
};

export default Dashboard; 