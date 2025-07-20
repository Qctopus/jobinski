import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell, PieChart, Pie } from 'recharts';
import { Building2, TrendingUp, Calendar, Users, Target, Lightbulb, Activity, MapPin, Award, Briefcase } from 'lucide-react';
import { ProcessedJobData, FilterOptions } from '../types';
import { JobAnalyticsProcessor, JOB_CATEGORIES } from '../services/dataProcessor';
import CategoryInsights from './CategoryInsights';

interface DashboardProps {
  data: ProcessedJobData[];
}

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
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

  // Process data and calculate metrics
  const processedData = useMemo(() => {
    return processor.processJobData(data);
  }, [data, processor]);

  const metrics = useMemo(() => {
    return processor.calculateDashboardMetrics(processedData, filters);
  }, [processedData, filters, processor]);

  // Determine if we're in agency-specific or market view
  const isAgencyView = filters.selectedAgency !== 'all';
  const selectedAgencyName = filters.selectedAgency;

  // Prepare data for charts based on view type
  const topCategoriesChartData = useMemo(() => {
    const chartData = metrics.topCategories.map(item => ({
      category: item.category.length > 20 ? item.category.substring(0, 17) + '...' : item.category,
      fullCategory: item.category,
      jobs: item.count,
      percentage: item.percentage
    }));
    return chartData;
  }, [metrics.topCategories]);

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

  // Market insights for cross-agency view
  const marketInsights = useMemo(() => {
    if (isAgencyView) return null;
    
    return {
      topAgencies: metrics.agencyInsights.slice(0, 6),
      categoryLeaders: metrics.categoryInsights.slice(0, 5)
    };
  }, [isAgencyView, metrics]);

  const getCategoryColor = (categoryName: string) => {
    const category = JOB_CATEGORIES.find(cat => cat.name === categoryName);
    return category?.color || '#94A3B8';
  };

  const formatLocationData = (locationStrategy: Record<string, number>) => {
    return Object.entries(locationStrategy)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([location, count]) => ({ location, count }));
  };

  const formatGradeData = (gradeDistribution: Record<string, number>) => {
    return Object.entries(gradeDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([grade, count]) => ({ grade, count }));
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

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="metric-card">
              <div className="metric-value">{metrics.totalJobs}</div>
              <div className="metric-label">
                <Briefcase className="h-4 w-4 mr-1" />
                Total Positions
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-value">
                {isAgencyView ? metrics.totalDepartments : metrics.totalAgencies}
              </div>
              <div className="metric-label">
                <Building2 className="h-4 w-4 mr-1" />
                {isAgencyView ? 'Departments' : 'Agencies'}
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-value">{metrics.topCategories.length}</div>
              <div className="metric-label">
                <Target className="h-4 w-4 mr-1" />
                Active Categories
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-value">
                {metrics.topCategories[0]?.percentage.toFixed(1)}%
              </div>
              <div className="metric-label">
                <Award className="h-4 w-4 mr-1" />
                Top Category Share
              </div>
            </div>
          </div>

          {/* Main Dashboard Panels - Agency-Aware */}
          {isAgencyView ? (
            // AGENCY VIEW: Internal Analysis
            <>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
                {/* Agency Panel 1: Our Job Categories */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Target className="h-6 w-6 text-un-blue" />
                        <h3 className="text-lg font-semibold text-gray-900">Our Hiring Focus</h3>
                      </div>
                      <span className="text-sm text-gray-500">What we're hiring for</span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={topCategoriesChartData} layout="horizontal" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        type="number" 
                        domain={[0, 'dataMax']}
                        tickFormatter={(value) => Math.round(value).toString()}
                      />
                      <YAxis 
                        dataKey="category" 
                        type="category" 
                        width={150}
                        fontSize={12}
                      />
                      <Tooltip 
                        formatter={(value: any, name: any) => [`${value} positions`, 'Positions']}
                        labelFormatter={(label: any) => {
                          const item = topCategoriesChartData.find(d => d.category === label);
                          return item?.fullCategory || label;
                        }}
                      />
                      <Bar dataKey="jobs" radius={4}>
                        {topCategoriesChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getCategoryColor(entry.fullCategory)} />
                        ))}
                      </Bar>
                    </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Agency Panel 2: Our Department Breakdown */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-6 w-6 text-un-blue" />
                        <h3 className="text-lg font-semibold text-gray-900">Department Activity</h3>
                      </div>
                      <span className="text-sm text-gray-500">Internal breakdown</span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={agencyInsights?.departmentBreakdown || []} margin={{ bottom: 80 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="department" 
                          fontSize={11}
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis fontSize={12} />
                        <Tooltip 
                          formatter={(value: any, name: any) => [`${value} positions`, 'Positions']}
                        />
                        <Bar 
                          dataKey="totalJobs" 
                          fill="#009edb"
                          name="Positions"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Agency Panel 3: Geographic & Grade Strategy */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-6 w-6 text-un-blue" />
                        <h3 className="text-lg font-semibold text-gray-900">Our Location Strategy</h3>
                      </div>
                      <span className="text-sm text-gray-500">Where we hire</span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={formatLocationData(agencyInsights?.locationStrategy || {})} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis 
                          dataKey="location" 
                          type="category" 
                          width={120}
                          fontSize={11}
                        />
                        <Tooltip formatter={(value: any) => [`${value} positions`, 'Positions']} />
                        <Bar dataKey="count" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Award className="h-6 w-6 text-un-blue" />
                        <h3 className="text-lg font-semibold text-gray-900">Our Grade Distribution</h3>
                      </div>
                      <span className="text-sm text-gray-500">Seniority levels</span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={formatGradeData(agencyInsights?.gradeDistribution || {})}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="grade" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip formatter={(value: any) => [`${value} positions`, 'Positions']} />
                        <Bar dataKey="count" fill="#8B5CF6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // MARKET VIEW: Cross-Agency Analysis
            <>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
                {/* Market Panel 1: Overall Categories */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Target className="h-6 w-6 text-un-blue" />
                        <h3 className="text-lg font-semibold text-gray-900">Market Hiring Trends</h3>
                      </div>
                      <span className="text-sm text-gray-500">System-wide categories</span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={topCategoriesChartData} layout="horizontal" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        type="number" 
                        domain={[0, 'dataMax']}
                        tickFormatter={(value) => Math.round(value).toString()}
                      />
                      <YAxis 
                        dataKey="category" 
                        type="category" 
                        width={150}
                        fontSize={12}
                      />
                      <Tooltip 
                        formatter={(value: any, name: any) => [`${value} jobs`, 'Total positions']}
                        labelFormatter={(label: any) => {
                          const item = topCategoriesChartData.find(d => d.category === label);
                          return item?.fullCategory || label;
                        }}
                      />
                      <Bar dataKey="jobs" radius={4}>
                        {topCategoriesChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getCategoryColor(entry.fullCategory)} />
                        ))}
                      </Bar>
                    </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Market Panel 2: Agency Leaders */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Users className="h-6 w-6 text-un-blue" />
                        <h3 className="text-lg font-semibold text-gray-900">Leading Agencies</h3>
                      </div>
                      <span className="text-sm text-gray-500">Most active hirers</span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={marketInsights?.topAgencies || []} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis 
                          dataKey="agency" 
                          type="category" 
                          width={100}
                          fontSize={11}
                        />
                        <Tooltip formatter={(value: any) => [`${value} positions`, 'Total positions']} />
                        <Bar dataKey="totalJobs" fill="#F59E0B" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Market Panel 3: Category Leaders */}
              <div className="bg-white rounded-lg shadow mb-8">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Lightbulb className="h-6 w-6 text-un-blue" />
                      <h3 className="text-lg font-semibold text-gray-900">Category Leadership</h3>
                    </div>
                    <span className="text-sm text-gray-500">Which agencies lead in what</span>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {marketInsights?.categoryLeaders.map((category, index) => (
                      <div key={category.category} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: getCategoryColor(category.category) }}
                          ></div>
                          <h4 className="font-semibold text-gray-900">{category.category}</h4>
                        </div>
                        <div className="text-sm text-gray-600 mb-1">
                          Led by: <span className="font-medium">{category.leadingAgency}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {category.totalJobs} total positions
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Category Intelligence Component - Universal */}
          <CategoryInsights 
            metrics={metrics}
            data={processedData}
            filters={filters}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 