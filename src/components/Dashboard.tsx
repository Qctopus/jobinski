import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Building2, Calendar, Users, Target, Award, Briefcase, BarChart3, Clock, Eye, Activity, TrendingUp, Zap, AlertTriangle } from 'lucide-react';
import { ProcessedJobData, FilterOptions } from '../types';
import { JobAnalyticsProcessor, JOB_CATEGORIES } from '../services/dataProcessor';
import CategoryInsights from './CategoryInsights';
import TemporalTrends from './TemporalTrends';
import CompetitiveIntel from './CompetitiveIntel';
import ExecutiveSummary from './ExecutiveSummary';
import AgencyBenchmarking from './AgencyBenchmarking';
import WorkforceComposition from './WorkforceComposition';
import Skills from './Skills';


interface DashboardProps {
  data: ProcessedJobData[];
}

type TabType = 'overview' | 'categories' | 'temporal' | 'competitive' | 'workforce' | 'benchmarking' | 'skills' | 'summary';

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [filters, setFilters] = useState<FilterOptions>({
    selectedAgency: 'all',
    timeRange: 'all'
  });

  const processor = useMemo(() => new JobAnalyticsProcessor(), []);
  
  // Get unique agencies for the selector
  const agencies = useMemo(() => {
    const agencySet = new Set<string>();
    data.forEach(job => {
      const agency = job.short_agency || job.long_agency;
      if (agency) agencySet.add(agency);
    });
    return Array.from(agencySet).sort();
  }, [data]);

  // Data is already processed in App; avoid re-processing here
  const processedData = useMemo(() => data, [data]);

  // Calculate metrics based on view type
  const isAgencyView = filters.selectedAgency !== 'all';
  const selectedAgencyName = filters.selectedAgency;

  // For agency view: use filtered metrics for internal insights
  // For market view: use filtered metrics for everything
  const metrics = useMemo(() => {
    return processor.calculateDashboardMetrics(processedData, filters);
  }, [processedData, filters, processor]);

  // For market-level insights: always use unfiltered data to avoid "100% agency" problem
  const marketMetrics = useMemo(() => {
    return processor.calculateDashboardMetrics(processedData, { 
      selectedAgency: 'all', 
      timeRange: filters.timeRange 
    });
  }, [processedData, filters.timeRange, processor]);

  // Additional derived datasets for headline KPIs
  const filteredForDistinct = useMemo(() => {
    return processor.applyFilters(processedData, filters);
  }, [processedData, filters, processor]);

  const distinctCategoriesCount = useMemo(() => {
    const set = new Set<string>();
    filteredForDistinct.forEach(j => set.add(j.primary_category));
    return set.size;
  }, [filteredForDistinct]);

  const topCategoryShare = useMemo(() => {
    return metrics.topCategories.length > 0 ? metrics.topCategories[0].percentage : 0;
  }, [metrics.topCategories]);

  // Market-wide competitive intel and trends for KPIs
  const competitiveMarket = useMemo(() => {
    return processor.calculateCompetitiveIntelligence(processedData, true);
  }, [processedData, processor]);

  const marketTrends = useMemo(() => {
    return processor.calculateTemporalTrends(processedData, 12);
  }, [processedData, processor]);

  const topAgencyMarket = useMemo(() => {
    const top = competitiveMarket.agencyPositioning[0];
    return { name: top?.agency || 'N/A', share: top?.marketShare || 0 };
  }, [competitiveMarket]);

  const monthOverMonthGrowth = useMemo(() => {
    const ts = marketTrends.agencyTimeSeries;
    if (!ts || ts.length < 2) return 0;
    const prev = ts[ts.length - 2].total || 0;
    const curr = ts[ts.length - 1].total || 0;
    return prev > 0 ? ((curr - prev) / prev) * 100 : 0;
  }, [marketTrends]);

  // Agency-focused KPIs
  const agencyFilteredData = filteredForDistinct;

  const medianApplicationWindow = useMemo(() => {
    if (agencyFilteredData.length === 0) return 0;
    const arr = agencyFilteredData
      .map(j => j.application_window_days)
      .filter(n => typeof n === 'number')
      .sort((a, b) => a - b);
    if (arr.length === 0) return 0;
    const mid = Math.floor(arr.length / 2);
    return arr.length % 2 ? arr[mid] : Math.round((arr[mid - 1] + arr[mid]) / 2);
  }, [agencyFilteredData]);

  const urgentRate = useMemo(() => {
    if (agencyFilteredData.length === 0) return 0;
    const urgent = agencyFilteredData.filter(j => j.application_window_days < 14).length;
    return (urgent / agencyFilteredData.length) * 100;
  }, [agencyFilteredData]);

  const seniorityMix = useMemo(() => {
    const classified = agencyFilteredData.filter(j => !!j.seniority_level);
    if (classified.length === 0) return 0;
    const seniorExec = classified.filter(j => j.seniority_level === 'Senior' || j.seniority_level === 'Executive').length;
    return (seniorExec / classified.length) * 100;
  }, [agencyFilteredData]);

  const distinctDepartmentsCount = useMemo(() => {
    const set = new Set<string>();
    agencyFilteredData.forEach(j => set.add(j.department || 'Unknown'));
    return set.size;
  }, [agencyFilteredData]);

  const agencyMarketShare = useMemo(() => {
    const total = marketMetrics.totalJobs || 0;
    return total > 0 ? (agencyFilteredData.length / total) * 100 : 0;
  }, [agencyFilteredData.length, marketMetrics.totalJobs]);

  const agencyRank = useMemo(() => {
    if (!isAgencyView) return null;
    const idx = competitiveMarket.agencyPositioning.findIndex(a => a.agency === selectedAgencyName);
    return idx >= 0 ? idx + 1 : null;
  }, [isAgencyView, competitiveMarket, selectedAgencyName]);

  const categoriesWeLead = useMemo(() => {
    if (!isAgencyView) return 0;
    return competitiveMarket.categoryDominance.filter(c => c.leadingAgency === selectedAgencyName).length;
  }, [isAgencyView, competitiveMarket, selectedAgencyName]);

  // Prepare data for charts based on view type
  const topCategoriesChartData = useMemo(() => {
    const source = metrics.topCategories.length > 0 ? metrics.topCategories : (() => {
      const counts = new Map<string, number>();
      filteredForDistinct.forEach(j => counts.set(j.primary_category, (counts.get(j.primary_category) || 0) + 1));
      return Array.from(counts.entries()).map(([category, count]) => ({ category, count, percentage: 0 }))
        .sort((a, b) => b.count - a.count).slice(0, 10);
    })();

    return source.map(item => ({
      category: item.category.length > 20 ? item.category.substring(0, 17) + '...' : item.category,
      fullCategory: item.category,
      jobs: Number(item.count) || 0,
      percentage: Number(item.percentage) || 0
    }));
  }, [metrics.topCategories, filteredForDistinct]);

  // Direct chart data with robust fallbacks and debugging
  const marketCategoriesChartData = useMemo(() => {
    console.log('Building market categories chart data from:', marketMetrics.topCategories);
    
    if (!marketMetrics.topCategories || marketMetrics.topCategories.length === 0) {
      console.warn('No market categories found, creating fallback data');
      // Fallback: compute directly from data
      const categoryMap = new Map<string, number>();
      const filteredData = processor.applyFilters(processedData, { selectedAgency: 'all', timeRange: filters.timeRange });
      
      filteredData.forEach(job => {
        const cat = job.primary_category || 'General';
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
      });
      
      const total = filteredData.length;
      const fallbackData = Array.from(categoryMap.entries())
        .map(([category, count]) => ({
          category: category.length > 20 ? category.substring(0, 17) + '...' : category,
          fullCategory: category,
          count: count,
          percentage: total > 0 ? (count / total) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      console.log('Fallback categories data:', fallbackData);
      return fallbackData;
    }
    
    const chartData = marketMetrics.topCategories.slice(0, 10).map(item => ({
      category: item.category.length > 20 ? item.category.substring(0, 17) + '...' : item.category,
      fullCategory: item.category,
      count: Number(item.count) || 0,
      percentage: Number(item.percentage) || 0
    }));
    
    console.log('Market categories chart data:', chartData);
    return chartData;
  }, [marketMetrics.topCategories, processedData, filters.timeRange, processor]);

  const leadingAgenciesChartData = useMemo(() => {
    console.log('Building leading agencies chart data from:', marketMetrics.agencyInsights);
    
    if (!marketMetrics.agencyInsights || marketMetrics.agencyInsights.length === 0) {
      console.warn('No agency insights found, creating fallback data');
      // Fallback: compute directly from data
      const agencyMap = new Map<string, number>();
      const filteredData = processor.applyFilters(processedData, { selectedAgency: 'all', timeRange: filters.timeRange });
      
      filteredData.forEach(job => {
        const agency = job.short_agency || job.long_agency || 'Unknown';
        agencyMap.set(agency, (agencyMap.get(agency) || 0) + 1);
      });
      
      const total = filteredData.length;
      const fallbackData = Array.from(agencyMap.entries())
        .map(([agency, count]) => ({
          agency: agency.length > 15 ? agency.substring(0, 12) + '...' : agency,
          fullAgency: agency,
          count: count,
          share: total > 0 ? (count / total) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
      
      console.log('Fallback agencies data:', fallbackData);
      return fallbackData;
    }
    
    const total = marketMetrics.totalJobs || 1;
    const chartData = marketMetrics.agencyInsights.slice(0, 8).map(a => ({
      agency: a.agency.length > 15 ? a.agency.substring(0, 12) + '...' : a.agency,
      fullAgency: a.agency,
      count: Number(a.totalJobs) || 0,
      share: (Number(a.totalJobs) || 0) / total * 100
    }));
    
    console.log('Leading agencies chart data:', chartData);
    return chartData;
  }, [marketMetrics.agencyInsights, marketMetrics.totalJobs, processedData, filters.timeRange, processor]);

  // Agency-specific insights
  const agencyInsights = useMemo(() => {
    if (!isAgencyView) return null;
    
    const agencyData = metrics.agencyInsights.find(a => a.agency === selectedAgencyName);
    if (!agencyData) return null;

    return {
      ...agencyData,
      departmentBreakdown: agencyData.departments.slice(0, 8),
      locationStrategy: processedData
        .filter(job => (job.short_agency || job.long_agency) === selectedAgencyName)
        .reduce((acc, job) => {
          const country = job.duty_country || 'Unknown';
          const locationType = job.location_type;
          const key = `${country} (${locationType})`;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      gradeDistribution: processedData
        .filter(job => (job.short_agency || job.long_agency) === selectedAgencyName)
        .reduce((acc, job) => {
          const grade = job.up_grade || 'Unknown';
          acc[grade] = (acc[grade] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
    };
  }, [isAgencyView, selectedAgencyName, metrics.agencyInsights, processedData]);

  // Market insights for cross-agency view (always use unfiltered data)
  const marketInsights = useMemo(() => {
    return {
      topAgencies: marketMetrics.agencyInsights.slice(0, 6),
      categoryLeaders: marketMetrics.categoryInsights.slice(0, 5)
    };
  }, [marketMetrics]);

  const getCategoryColor = (categoryName: string) => {
    const category = JOB_CATEGORIES.find(cat => cat.name === categoryName);
    return category?.color || '#94A3B8';
  };

  const formatLocationData = (locationStrategy: Record<string, number>) => {
    return Object.entries(locationStrategy)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([location, count]) => ({ location, count: Number(count) || 0 }));
  };

  const formatGradeData = (gradeDistribution: Record<string, number>) => {
    return Object.entries(gradeDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([grade, count]) => ({ grade, count }));
  };

  // Agency-specific: top countries and location-type mix
  const agencyTopCountries = useMemo(() => {
    const map = new Map<string, number>();
    agencyFilteredData.forEach(j => {
      const c = j.duty_country || 'Unknown';
      map.set(c, (map.get(c) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([country, count]) => ({ country, count: Number(count) || 0 }));
  }, [agencyFilteredData]);

  const locationTypeMix = useMemo(() => {
    const map = new Map<string, number>();
    agencyFilteredData.forEach(j => {
      const t = j.location_type || 'Unknown';
      map.set(t, (map.get(t) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort(([,a], [,b]) => b - a)
      .map(([type, count]) => ({ type, count: Number(count) || 0 }));
  }, [agencyFilteredData]);

  // Market averages for comparison (always calculate from full market data)
  const marketAverages = useMemo(() => {
    const allMarketData = processor.applyFilters(processedData, { 
      selectedAgency: 'all', 
      timeRange: filters.timeRange 
    });

    // Market average application window
    const allWindows = allMarketData
      .map(j => j.application_window_days)
      .filter(n => typeof n === 'number')
      .sort((a, b) => a - b);
    const marketMedianWindow = allWindows.length > 0 
      ? (allWindows.length % 2 
          ? allWindows[Math.floor(allWindows.length / 2)] 
          : Math.round((allWindows[Math.floor(allWindows.length / 2) - 1] + allWindows[Math.floor(allWindows.length / 2)]) / 2))
      : 0;

    // Market average urgent rate
    const marketUrgentCount = allMarketData.filter(j => j.application_window_days < 14).length;
    const marketUrgentRate = allMarketData.length > 0 ? (marketUrgentCount / allMarketData.length) * 100 : 0;

    // Market average seniority mix
    const marketClassified = allMarketData.filter(j => !!j.seniority_level);
    const marketSeniorExec = marketClassified.filter(j => j.seniority_level === 'Senior' || j.seniority_level === 'Executive').length;
    const marketSeniorityMix = marketClassified.length > 0 ? (marketSeniorExec / marketClassified.length) * 100 : 0;

    return {
      medianApplicationWindow: marketMedianWindow,
      urgentRate: marketUrgentRate,
      seniorityMix: marketSeniorityMix
    };
  }, [processedData, filters.timeRange, processor]);

  const tabs = [
    {
      id: 'overview' as TabType,
      name: 'Overview',
      icon: <BarChart3 className="h-5 w-5" />,
      description: 'Executive command center for actionable insights and strategic decisions'
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
      id: 'benchmarking' as TabType,
      name: 'Benchmarking',
      icon: <Activity className="h-5 w-5" />,
      description: 'Agency performance comparison'
    },
    {
      id: 'skills' as TabType,
      name: 'Skills',
      icon: <Briefcase className="h-5 w-5" />,
      description: 'Comprehensive skills analysis and insights'
    },
    {
      id: 'summary' as TabType,
      name: 'Executive',
      icon: <Award className="h-5 w-5" />,
      description: 'Strategic insights and recommendations'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
                        {/* Enhanced KPI Cards with trend indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="metric-card">
                <div className="metric-value">{metrics.totalJobs}</div>
                <div className="metric-trend">
                  <span className="text-green-600 text-sm">↗ +{monthOverMonthGrowth.toFixed(0)}% vs last month</span>
                </div>
                <div className="metric-label">
                  <Briefcase className="h-4 w-4 mr-1" />
                  {isAgencyView ? 'Agency Job Postings' : 'Total Job Postings'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {isAgencyView ? `${selectedAgencyName} positions` : 'All agencies combined'}
                </div>
              </div>
              
              <div className="metric-card">
                <div className="metric-value">{isAgencyView ? agencyMarketShare.toFixed(1) + '%' : metrics.totalAgencies}</div>
                <div className="metric-trend">
                  <span className="text-yellow-600 text-sm">
                    {isAgencyView ? (agencyMarketShare > 5 ? 'Strong' : 'Growing') : 'High'}
                  </span>
                </div>
                <div className="metric-label">
                  <Users className="h-4 w-4 mr-1" />
                  {isAgencyView ? 'Market Share' : 'Competition Level'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {isAgencyView ? 'Share of total market' : `${metrics.totalAgencies} active agencies`}
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-value">
                  {isAgencyView ? (agencyRank ? `#${agencyRank}` : 'Unranked') : `${(marketMetrics.topCategories[0]?.percentage || 0).toFixed(1)}%`}
                </div>
                <div className="metric-trend">
                  <span className="text-blue-600 text-sm">
                    {isAgencyView ? (agencyRank && agencyRank <= 5 ? '↗ Top 5' : '→ Stable') : '↗ Leading'}
                  </span>
                </div>
                <div className="metric-label">
                  <Award className="h-4 w-4 mr-1" />
                  {isAgencyView ? 'Market Ranking' : 'Top Category Share'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {isAgencyView ? 'Among all agencies' : `${marketMetrics.topCategories[0]?.category || 'Leading category'}`}
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-value">{isAgencyView ? medianApplicationWindow : Math.round(urgentRate)}</div>
                <div className="metric-trend">
                  <span className={`text-sm ${isAgencyView ? 'text-green-600' : urgentRate > 25 ? 'text-orange-600' : 'text-green-600'}`}>
                    {isAgencyView ? '2 days faster' : urgentRate > 25 ? 'High urgency' : 'Moderate'}
                  </span>
                </div>
                <div className="metric-label">
                  <Target className="h-4 w-4 mr-1" />
                  {isAgencyView ? 'Avg. App. Window' : 'Urgent Hiring Rate'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {isAgencyView ? 'Days to apply' : '% positions &lt;14 days'}
                </div>
              </div>
            </div>

            {/* Main Dashboard Panels (2x2 grid) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Panel 1: Market Pulse */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {isAgencyView ? `${selectedAgencyName} Activity` : 'Market Pulse'}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {isAgencyView ? 'Your agency hiring trends and focus areas' : 'Recent hiring activity and market hotspots'}
                  </p>
                </div>
                <div className="p-6">
                  <div className="space-y-5">
                    {/* Growth velocity with better context */}
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {isAgencyView ? 'Agency Growth (vs last month)' : 'Market Growth (vs last month)'}
                        </span>
                        <span className="text-xl font-bold text-green-600">+{monthOverMonthGrowth.toFixed(0)}%</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {isAgencyView 
                          ? `${selectedAgencyName} posted ${monthOverMonthGrowth > 0 ? 'more' : 'fewer'} positions compared to last month`
                          : `UN system posted ${monthOverMonthGrowth > 0 ? 'more' : 'fewer'} positions compared to last month`
                        }
                      </div>
                    </div>
                    
                    {/* Top categories with actual counts */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">
                        {isAgencyView ? 'Our Top Categories' : 'Hot Categories'}
                      </h4>
                      <div className="space-y-2">
                        {(isAgencyView ? metrics.topCategories : marketMetrics.topCategories).slice(0, 3).map((category, index) => (
                          <div key={category.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-700">
                                {category.category.length > 18 ? category.category.substring(0, 15) + '...' : category.category}
                              </span>
                              <div className="text-xs text-gray-500">
                                {category.count} positions ({(category.percentage || 0).toFixed(1)}%)
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-bold text-green-600">#{index + 1}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Geographic focus */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">
                        {isAgencyView ? 'Our Geographic Focus' : 'Geographic Hotspots'}
                      </h4>
                      <div className="space-y-2">
                        {(isAgencyView ? agencyTopCountries : 
                          // For market view, calculate global hotspots
                          Object.entries(processedData.reduce((acc, job) => {
                            const country = job.duty_country || 'Unknown';
                            acc[country] = (acc[country] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>))
                          .sort(([,a], [,b]) => b - a)
                          .slice(0, 3)
                          .map(([country, count]) => ({ country, count }))
                        ).slice(0, 3).map((country, index) => (
                          <div key={country.country} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-700">{country.country}</span>
                              <div className="text-xs text-gray-500">Primary duty station</div>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-bold text-blue-600">{country.count}</span>
                              <div className="text-xs text-gray-500">positions</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Panel 2: Competitive Landscape */}
                  <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                    <Eye className="h-6 w-6 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Competitive Landscape</h3>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Market share and positioning</p>
                        </div>
                <div className="p-6">
                  {/* Agency market share pie chart data (top 6 agencies) */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{topAgencyMarket.share.toFixed(1)}%</div>
                        <div className="text-sm text-gray-600">Market Leader</div>
                        <div className="text-xs text-gray-500">{topAgencyMarket.name}</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{isAgencyView ? agencyMarketShare.toFixed(1) : '---'}%</div>
                        <div className="text-sm text-gray-600">{isAgencyView ? 'Our Share' : 'Your Share'}</div>
                        <div className="text-xs text-green-600">{isAgencyView ? (agencyRank ? `#${agencyRank} position` : 'Unranked') : 'Select agency'}</div>
                      </div>
                    </div>
                    
                    {/* Top agencies breakdown */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Top Agencies</h4>
                      <div className="space-y-2">
                        {marketInsights?.topAgencies.slice(0, 4).map((agency, index) => (
                          <div key={agency.agency} className={`flex items-center justify-between p-2 rounded ${
                            isAgencyView && agency.agency === selectedAgencyName ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                          }`}>
                            <span className="text-sm text-gray-700">
                              {isAgencyView && agency.agency === selectedAgencyName ? '👑 ' : ''}{agency.agency.length > 15 ? agency.agency.substring(0, 12) + '...' : agency.agency}
                            </span>
                            <span className="text-sm font-medium">{((agency.totalJobs / marketMetrics.totalJobs) * 100).toFixed(1)}%</span>
                          </div>
                        ))}
                        </div>
                    </div>
                  </div>
                </div>
              </div>

                            {/* Panel 3: Strategic Insights */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <Zap className="h-6 w-6 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Strategic Insights</h3>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {isAgencyView ? 'Actionable insights for your agency' : 'Key market opportunities and trends'}
                  </p>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {/* Insight 1: Opportunity */}
                    <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-1">
                          {isAgencyView ? 'Growth Opportunity' : 'Market Opportunity'}
                        </div>
                        <div className="text-sm text-gray-700 mb-2">
                          {isAgencyView 
                            ? `${metrics.topCategories[0]?.category || 'Top category'} represents ${(metrics.topCategories[0]?.percentage || 0).toFixed(1)}% of your hiring`
                            : `${marketMetrics.topCategories[0]?.category || 'Climate & Environment'} category growing +${monthOverMonthGrowth.toFixed(0)}% this month`
                          }
                        </div>
                        <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded inline-block">
                          {isAgencyView 
                            ? `Consider expanding in ${metrics.topCategories[1]?.category || 'other areas'}`
                            : `+${(marketMetrics.topCategories[0]?.count || 12)} new positions available`
                          }
                        </div>
                      </div>
                    </div>
                    
                    {/* Insight 2: Competition */}
                    <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-1">
                          {isAgencyView ? 'Competitive Positioning' : 'Competition Alert'}
                        </div>
                        <div className="text-sm text-gray-700 mb-2">
                          {isAgencyView 
                            ? `You rank #${agencyRank || 'N/A'} with ${agencyMarketShare.toFixed(1)}% market share`
                            : `${topAgencyMarket.name} leads with ${topAgencyMarket.share.toFixed(1)}% market share`
                          }
                        </div>
                        <div className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded inline-block">
                          {isAgencyView 
                            ? agencyRank && agencyRank <= 5 ? 'Maintain leadership position' : 'Focus on key differentiators'
                            : 'Monitor hiring patterns closely'
                          }
                        </div>
                      </div>
                    </div>
                    
                    {/* Insight 3: Geographic/Operational */}
                    <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-1">
                          {isAgencyView ? 'Operational Efficiency' : 'Regional Trend'}
                        </div>
                        <div className="text-sm text-gray-700 mb-2">
                          {isAgencyView 
                            ? `${medianApplicationWindow} days average application window vs ${urgentRate.toFixed(0)}% urgent positions`
                            : `Strong activity in ${(isAgencyView ? agencyTopCountries : 
                                Object.entries(processedData.reduce((acc, job) => {
                                  const country = job.duty_country || 'Unknown';
                                  acc[country] = (acc[country] || 0) + 1;
                                  return acc;
                                }, {} as Record<string, number>))
                                .sort(([,a], [,b]) => b - a)[0]?.[0] || 'key regions'
                              )}`
                          }
                        </div>
                        <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded inline-block">
                          {isAgencyView 
                            ? medianApplicationWindow < 21 ? 'Efficient hiring process' : 'Consider streamlining timelines'
                            : 'Consider strategic positioning'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

                            {/* Panel 4: Performance Snapshot */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <Activity className="h-6 w-6 text-orange-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Performance Snapshot</h3>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {isAgencyView ? 'Agency efficiency and workforce indicators' : 'Market efficiency and hiring patterns'}
                  </p>
                </div>
                <div className="p-6">
                  {isAgencyView ? (
                    /* Agency view: Show agency vs market comparison */
                    <div className="space-y-4">
                      <div className="text-sm text-gray-600 text-center mb-4">
                        <span className="font-medium text-blue-600">{selectedAgencyName}</span> vs <span className="font-medium text-gray-700">Market Average</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-6">
                        {/* Application Window Comparison */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-center mb-3">
                            <div className="text-lg font-bold text-gray-900">{medianApplicationWindow} days</div>
                            <div className="text-sm font-medium text-gray-700">Application Window</div>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <div className="text-center">
                              <div className="text-blue-600 font-semibold">{medianApplicationWindow}</div>
                              <div className="text-gray-500">You</div>
                            </div>
                            <div className="text-center">
                              <div className="text-gray-600 font-semibold">{marketAverages.medianApplicationWindow}</div>
                              <div className="text-gray-500">Market</div>
                            </div>
                          </div>
                          <div className="mt-2 text-center">
                            <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                              medianApplicationWindow < marketAverages.medianApplicationWindow 
                                ? 'bg-green-100 text-green-700' 
                                : medianApplicationWindow > marketAverages.medianApplicationWindow 
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-blue-100 text-blue-700'
                            }`}>
                              {medianApplicationWindow < marketAverages.medianApplicationWindow 
                                ? `✓ ${marketAverages.medianApplicationWindow - medianApplicationWindow} days faster` 
                                : medianApplicationWindow > marketAverages.medianApplicationWindow 
                                  ? `⚠ ${medianApplicationWindow - marketAverages.medianApplicationWindow} days slower`
                                  : '→ Same as market'
                              }
                            </div>
                          </div>
                        </div>
                        
                        {/* Senior Positions Comparison */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-center mb-3">
                            <div className="text-lg font-bold text-gray-900">{seniorityMix.toFixed(0)}%</div>
                            <div className="text-sm font-medium text-gray-700">Senior+ Positions</div>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <div className="text-center">
                              <div className="text-blue-600 font-semibold">{seniorityMix.toFixed(0)}%</div>
                              <div className="text-gray-500">You</div>
                            </div>
                            <div className="text-center">
                              <div className="text-gray-600 font-semibold">{marketAverages.seniorityMix.toFixed(0)}%</div>
                              <div className="text-gray-500">Market</div>
                            </div>
                          </div>
                          <div className="mt-2 text-center">
                            <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                              seniorityMix > marketAverages.seniorityMix + 5
                                ? 'bg-purple-100 text-purple-700' 
                                : seniorityMix < marketAverages.seniorityMix - 5
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-700'
                            }`}>
                              {seniorityMix > marketAverages.seniorityMix + 5
                                ? '🎯 Leadership focused' 
                                : seniorityMix < marketAverages.seniorityMix - 5
                                  ? '📈 Entry-mid focused'
                                  : '→ Market aligned'
                              }
                            </div>
                          </div>
                        </div>
                        
                        {/* Urgent Hiring Comparison */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-center mb-3">
                            <div className="text-lg font-bold text-gray-900">{urgentRate.toFixed(0)}%</div>
                            <div className="text-sm font-medium text-gray-700">Urgent Hiring</div>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <div className="text-center">
                              <div className="text-blue-600 font-semibold">{urgentRate.toFixed(0)}%</div>
                              <div className="text-gray-500">You</div>
                            </div>
                            <div className="text-center">
                              <div className="text-gray-600 font-semibold">{marketAverages.urgentRate.toFixed(0)}%</div>
                              <div className="text-gray-500">Market</div>
                            </div>
                          </div>
                          <div className="mt-2 text-center">
                            <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                              urgentRate < marketAverages.urgentRate 
                                ? 'bg-green-100 text-green-700' 
                                : urgentRate > marketAverages.urgentRate + 10
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {urgentRate < marketAverages.urgentRate 
                                ? '😌 Less pressure' 
                                : urgentRate > marketAverages.urgentRate + 10
                                  ? '🚨 High pressure'
                                  : '⚡ Similar pressure'
                              }
                            </div>
                          </div>
                        </div>
                        
                        {/* Geographic Reach */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-center mb-3">
                            <div className="text-lg font-bold text-gray-900">{agencyTopCountries.length}</div>
                            <div className="text-sm font-medium text-gray-700">Countries Active</div>
                          </div>
                          <div className="text-xs text-gray-500 text-center mb-2">
                            Geographic presence
                          </div>
                          <div className="text-center">
                            <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                              agencyTopCountries.length > 20 
                                ? 'bg-green-100 text-green-700' 
                                : agencyTopCountries.length > 10
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-purple-100 text-purple-700'
                            }`}>
                              {agencyTopCountries.length > 20 
                                ? '🌍 Global reach' 
                                : agencyTopCountries.length > 10
                                  ? '🌏 Regional focus'
                                  : '🎯 Specialized scope'
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Additional bottom metrics for agency view */}
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-lg font-semibold text-gray-900">{categoriesWeLead}</div>
                            <div className="text-xs text-gray-600">Categories Leading</div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-gray-900">{distinctCategoriesCount}</div>
                            <div className="text-xs text-gray-600">Categories Active</div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-gray-900">{locationTypeMix.length}</div>
                            <div className="text-xs text-gray-600">Location Types</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Market view: Show overall market metrics */
                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-gray-900 mb-1">{marketAverages.medianApplicationWindow}</div>
                        <div className="text-sm font-medium text-gray-700 mb-1">Avg Application Window</div>
                        <div className="text-xs text-gray-500 mb-2">Days to apply (market median)</div>
                        <div className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full inline-block">
                          {marketAverages.medianApplicationWindow < 21 ? '✓ Fast market' : marketAverages.medianApplicationWindow < 35 ? '→ Standard pace' : '⚠ Extended timelines'}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-gray-900 mb-1">{marketAverages.seniorityMix.toFixed(0)}%</div>
                        <div className="text-sm font-medium text-gray-700 mb-1">Senior+ Positions</div>
                        <div className="text-xs text-gray-500 mb-2">Executive & Senior roles</div>
                        <div className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full inline-block">
                          {marketAverages.seniorityMix > 40 ? '🎯 Leadership heavy' : marketAverages.seniorityMix > 25 ? '→ Balanced mix' : '📈 Entry-mid focus'}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-gray-900 mb-1">{marketAverages.urgentRate.toFixed(0)}%</div>
                        <div className="text-sm font-medium text-gray-700 mb-1">Urgent Hiring Rate</div>
                        <div className="text-xs text-gray-500 mb-2">Positions with &lt;14 days</div>
                        <div className="text-xs px-2 py-1 rounded-full inline-block" style={{
                          backgroundColor: marketAverages.urgentRate > 30 ? '#FEF3C7' : marketAverages.urgentRate > 15 ? '#DBEAFE' : '#D1FAE5',
                          color: marketAverages.urgentRate > 30 ? '#92400E' : marketAverages.urgentRate > 15 ? '#1E40AF' : '#065F46'
                        }}>
                          {marketAverages.urgentRate > 30 ? '🚨 High pressure' : marketAverages.urgentRate > 15 ? '⚡ Moderate pace' : '😌 Relaxed timing'}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="text-2xl font-bold text-gray-900 mb-1">{distinctCategoriesCount}</div>
                        <div className="text-sm font-medium text-gray-700 mb-1">Active Categories</div>
                        <div className="text-xs text-gray-500 mb-2">Distinct job categories</div>
                        <div className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full inline-block">
                          {distinctCategoriesCount > 15 ? '🌟 Highly diverse' : distinctCategoriesCount > 8 ? '→ Well diversified' : '🎯 Focused scope'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Conditional alert banner for urgent items */}
            {(urgentRate > 30 || Math.abs(monthOverMonthGrowth) > 25 || (isAgencyView && agencyMarketShare < 3)) && (
              <div className={`border rounded-lg p-5 ${
                urgentRate > 40 || Math.abs(monthOverMonthGrowth) > 50 || (isAgencyView && agencyMarketShare < 1) 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle className={`h-6 w-6 ${
                    urgentRate > 40 || Math.abs(monthOverMonthGrowth) > 50 || (isAgencyView && agencyMarketShare < 1)
                      ? 'text-red-600' 
                      : 'text-yellow-600'
                  }`} />
                  <h4 className={`font-semibold text-lg ${
                    urgentRate > 40 || Math.abs(monthOverMonthGrowth) > 50 || (isAgencyView && agencyMarketShare < 1)
                      ? 'text-red-800' 
                      : 'text-yellow-800'
                  }`}>
                    {urgentRate > 40 || Math.abs(monthOverMonthGrowth) > 50 || (isAgencyView && agencyMarketShare < 1)
                      ? 'Critical Attention Required' 
                      : 'Strategic Alert'
                    }
                  </h4>
                </div>
                <div className={`text-sm space-y-2 ${
                  urgentRate > 40 || Math.abs(monthOverMonthGrowth) > 50 || (isAgencyView && agencyMarketShare < 1)
                    ? 'text-red-700' 
                    : 'text-yellow-700'
                }`}>
                  {urgentRate > 30 && (
                    <div className="flex items-start gap-2">
                      <span className="font-medium">⏰ Hiring Pressure:</span>
                      <span>{urgentRate.toFixed(0)}% of positions have application deadlines within 14 days. This indicates either high demand or potential process inefficiencies.</span>
                    </div>
                  )}
                  {Math.abs(monthOverMonthGrowth) > 25 && (
                    <div className="flex items-start gap-2">
                      <span className="font-medium">📈 Market Volatility:</span>
                      <span>
                        {monthOverMonthGrowth > 0 
                          ? `+${monthOverMonthGrowth.toFixed(0)}% increase in ${isAgencyView ? 'agency' : 'market'} hiring vs last month - prepare for increased competition.`
                          : `${monthOverMonthGrowth.toFixed(0)}% decrease in ${isAgencyView ? 'agency' : 'market'} hiring vs last month - market may be cooling.`
                        }
                      </span>
                    </div>
                  )}
                  {isAgencyView && agencyMarketShare < 3 && (
                    <div className="flex items-start gap-2">
                      <span className="font-medium">🎯 Market Position:</span>
                      <span>Current market share of {agencyMarketShare.toFixed(1)}% suggests opportunities for strategic growth and increased visibility.</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <span className="font-medium">🔍 Recommendation:</span>
                    <span>
                      {isAgencyView 
                        ? `Focus on ${metrics.topCategories[0]?.category || 'your top category'} where you have ${(metrics.topCategories[0]?.percentage || 0).toFixed(1)}% concentration.`
                        : `Monitor ${topAgencyMarket.name} (${topAgencyMarket.share.toFixed(1)}% market leader) for strategic insights.`
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'categories':
        return (
          <CategoryInsights 
            metrics={isAgencyView ? metrics : marketMetrics}
            marketMetrics={marketMetrics}
            data={processedData}
            filters={filters}
            isAgencyView={isAgencyView}
          />
        );

      case 'temporal':
        return (
          <TemporalTrends 
            data={processedData}
            filters={filters}
          />
        );

      case 'competitive':
        return (
          <CompetitiveIntel 
            data={processedData}
            filters={filters}
          />
        );

      case 'workforce':
        return (
          <WorkforceComposition 
            data={processedData}
            filters={filters}
          />
        );

      case 'benchmarking':
        return (
          <AgencyBenchmarking 
            data={processedData}
            filters={filters}
          />
        );

      case 'skills':
        return (
          <Skills 
            data={processedData}
            filters={filters}
          />
        );

      case 'summary':
        return (
          <ExecutiveSummary 
            data={processedData}
            filters={filters}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {isAgencyView ? `${selectedAgencyName} - Internal Analytics` : 'UN Jobs Market Analytics'}
            </h1>
            <p className="text-xl text-gray-600">
              {isAgencyView 
                ? `Internal hiring insights and strategic analysis for ${selectedAgencyName}`
                : 'Understanding hiring patterns across the UN system'
              }
            </p>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Agency Selector */}
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-gray-500" />
                  <select
                    value={filters.selectedAgency}
                    onChange={(e) => setFilters(prev => ({ ...prev, selectedAgency: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-un-blue focus:border-transparent"
                  >
                    <option value="all">🌍 Market View - All Agencies</option>
                    {agencies.map(agency => (
                      <option key={agency} value={agency}>🏢 {agency} - Internal View</option>
                    ))}
                  </select>
                </div>

                {/* Time Range Selector */}
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <select
                    value={filters.timeRange}
                    onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value as any }))}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-un-blue focus:border-transparent"
                  >
                    <option value="all">All Time</option>
                    <option value="1year">Last 12 Months</option>
                    <option value="6months">Last 6 Months</option>
                    <option value="3months">Last 3 Months</option>
                  </select>
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                {isAgencyView ? `${metrics.totalJobs} positions • ${metrics.totalDepartments} departments` : `${metrics.totalJobs} positions • ${metrics.totalAgencies} agencies`}
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
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

export default Dashboard; 