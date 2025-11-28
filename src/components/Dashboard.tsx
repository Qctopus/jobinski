import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Clock, Eye, Users, Briefcase, Target, Activity, HelpCircle } from 'lucide-react';
import { ProcessedJobData, FilterOptions } from '../types';
import { useDashboardData } from '../hooks/useDashboardData';
import { TimeframeProvider } from '../contexts/TimeframeContext';
import { getAgencyLogo } from '../utils/agencyLogos';
import CategoryInsights from './CategoryInsightsNew';
import TemporalTrends from './TemporalTrends';
import CompetitiveIntel from './CompetitiveIntel';
import WorkforceComposition from './WorkforceComposition';
import Skills from './Skills';
import MarketIntelligence from './overview/MarketIntelligence';
import { CompactJobBrowser } from './CompactJobBrowser';


interface DashboardProps {
  data: ProcessedJobData[];
  dashboardData?: any; // Pre-computed analytics from backend
}

type TabType = 'overview' | 'categories' | 'temporal' | 'competitive' | 'workforce' | 'skills' | 'jobs';

// Inner dashboard component that uses TimeframeContext
const DashboardContent: React.FC<DashboardProps & { filters: FilterOptions; setFilters: React.Dispatch<React.SetStateAction<FilterOptions>> }> = ({ 
  data, 
  dashboardData, 
  filters, 
  setFilters 
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview'); // Default to Overview for better first impression
  
  // Use pre-computed agencies list when available
  const precomputedAgencies = dashboardData?.agencies?.data;
  
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

  // Get unique agencies for the selector - prefer precomputed list
  const agencies = useMemo(() => {
    // Use precomputed agencies if available
    if (precomputedAgencies?.agencies) {
      return precomputedAgencies.agencies.map((a: any) => a.agency);
    }
    // Fallback to computing from data
    const agencySet = new Set<string>();
    data.forEach(job => {
      const agency = job.short_agency || job.long_agency;
      if (agency) agencySet.add(agency);
    });
    return Array.from(agencySet).sort();
  }, [data, precomputedAgencies]);

  const tabs = [
    {
      id: 'overview' as TabType,
      name: 'Intelligence',
      icon: <Activity className="h-5 w-5" />,
      description: 'Executive briefing — what\'s changing across the UN talent market'
    },
    {
      id: 'categories' as TabType,
      name: 'Categories',
      icon: <Target className="h-5 w-5" />,
      description: 'Deep-dive into job categories'
    },
    {
      id: 'temporal' as TabType,
      name: 'Trends',
      icon: <Clock className="h-5 w-5" />,
      description: 'Time-based analysis and forecasting'
    },
    {
      id: 'competitive' as TabType,
      name: 'Intelligence',
      icon: <Eye className="h-5 w-5" />,
      description: 'Competitive landscape and positioning'
    },
    {
      id: 'workforce' as TabType,
      name: 'Workforce',
      icon: <Users className="h-5 w-5" />,
      description: 'Workforce composition and strategic analysis'
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
          <MarketIntelligence
            data={data}
            filteredData={filteredData}
            filters={filters}
            metrics={metrics}
            marketMetrics={marketMetrics}
              isAgencyView={isAgencyView}
              selectedAgencyName={selectedAgencyName}
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

      case 'temporal':
        return (
          <TemporalTrends
            data={data}
            filters={filters}
          />
        );

      case 'competitive':
        return (
          <CompetitiveIntel
            data={data}
            filters={filters}
          />
        );

      case 'workforce':
        return (
          <WorkforceComposition
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
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            {/* Clean Integrated Header */}
            <div className="flex items-center justify-between mb-8">
              {/* Left side - App Branding */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <img
                    src="/UNDP_logo.png"
                    alt="UNDP"
                    className="h-10 w-auto"
                  />
                  <div className="flex flex-col">
                    <h1 className="text-xl font-bold text-gray-900 leading-tight">
                      Baro Talent
                    </h1>
                    <p className="text-xs text-gray-600 leading-tight">
                      Data Viewer
                    </p>
                  </div>
                </div>

                {/* Integrated Agency Selection */}
                <div className="flex items-center gap-3">
                  <div className="h-8 w-px bg-gray-300"></div>
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
                      <svg className="h-3 w-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
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

                  {/* Time Filter */}
                  <select
                    value={filters.timeRange}
                    onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value as any }))}
                    className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Time</option>
                    <option value="3months">3 Months</option>
                    <option value="6months">6 Months</option>
                    <option value="1year">1 Year</option>
                  </select>
                </div>
              </div>

              {/* Right side - MOFA Branding */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">Funded by</span>
                <img
                  src="/MOFA.png"
                  alt="Ministry of Foreign Affairs"
                  className="h-6 w-auto"
                />
              </div>
            </div>

            {/* Dynamic Page Title */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {isAgencyView && getAgencyLogo(selectedAgencyName) && (
                  <img
                    src={getAgencyLogo(selectedAgencyName)!}
                    alt={selectedAgencyName}
                    className="h-16 w-16 object-contain"
                  />
                )}
                <div className="flex flex-col">
                  <h2 className="text-4xl font-bold text-gray-900">
                    {isAgencyView ? selectedAgencyName : 'Talent Analytics'}
                  </h2>
                  <p className="text-lg text-gray-600 mt-1">
                    {isAgencyView
                      ? 'Internal Analytics & Strategic Insights'
                      : 'Data-driven insights for strategic workforce planning'
                    }
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {metrics.totalJobs}
                </div>
                <div className="text-sm text-gray-600">
                  positions {!isAgencyView && `• ${metrics.totalAgencies} agencies`}
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
    timeRange: 'all'
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