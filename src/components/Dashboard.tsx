import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import { Building2, TrendingUp, Calendar, Users, Target, Lightbulb, Activity } from 'lucide-react';
import { ProcessedJobData, FilterOptions } from '../types';
import { JobAnalyticsProcessor, JOB_CATEGORIES } from '../services/dataProcessor';
// import CategoryInsights from './CategoryInsights';

interface DashboardProps {
  data: ProcessedJobData[];
}

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const [filters, setFilters] = useState<FilterOptions>({
    selectedAgency: 'all',
    timeRange: '1year'
  });

  const processor = useMemo(() => new JobAnalyticsProcessor(), []);
  
  const metrics = useMemo(() => {
    console.log('Dashboard: Calculating metrics for', data.length, 'jobs');
    const result = processor.calculateDashboardMetrics(data, filters);
    console.log('Dashboard: Metrics calculated:', {
      totalJobs: result.totalJobs,
      totalAgencies: result.totalAgencies,
      topCategoriesCount: result.topCategories.length,
      topCategories: result.topCategories.slice(0, 3)
    });
    return result;
  }, [data, filters, processor]);

  const agencies = useMemo(() => {
    const agencySet = new Set(data.map(job => job.short_agency || job.long_agency));
    return Array.from(agencySet).sort();
  }, [data]);

  // Prepare data for charts
  const topCategoriesChartData = useMemo(() => {
    return metrics.topCategories.map(item => ({
      category: item.category.length > 20 ? item.category.substring(0, 17) + '...' : item.category,
      fullCategory: item.category,
      jobs: item.count,
      percentage: item.percentage
    }));
  }, [metrics.topCategories]);

  const agencyCategoryData = useMemo(() => {
    const topAgencies = metrics.agencyInsights.slice(0, 8);
    const topCategories = metrics.topCategories.slice(0, 6).map(c => c.category);
    
    return topAgencies.map(agency => {
      const categoryData: any = { agency: agency.agency.length > 15 ? agency.agency.substring(0, 12) + '...' : agency.agency, fullAgency: agency.agency };
      
      topCategories.forEach(category => {
        const categoryCount = agency.topCategories.find(tc => tc.category === category)?.count || 0;
        categoryData[category] = categoryCount;
      });
      
      return categoryData;
    });
  }, [metrics.agencyInsights, metrics.topCategories]);

  const timeSeriesChartData = useMemo(() => {
    return metrics.timeSeriesData.slice(-12).map(item => {
      const [year, month] = item.period.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      
      return {
        period: monthName,
        ...item.categories,
        total: item.total
      };
    });
  }, [metrics.timeSeriesData]);

  const getCategoryColor = (categoryName: string) => {
    const category = JOB_CATEGORIES.find(cat => cat.name === categoryName);
    return category?.color || '#94A3B8';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              UN Jobs Analytics Dashboard
            </h1>
            <p className="text-xl text-gray-600">
              Understanding what agencies are hiring for across the UN system
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
                    <option value="all">All Agencies</option>
                    {agencies.map(agency => (
                      <option key={agency} value={agency}>{agency}</option>
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
                    <option value="3months">Last 3 Months</option>
                    <option value="6months">Last 6 Months</option>
                    <option value="1year">Last Year</option>
                    <option value="all">All Time</option>
                  </select>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="flex gap-6 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-un-blue">{metrics.totalJobs.toLocaleString()}</div>
                  <div className="text-gray-600">Total Jobs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-un-blue">{metrics.totalAgencies}</div>
                  <div className="text-gray-600">Agencies</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-un-blue">{metrics.topCategories.length}</div>
                  <div className="text-gray-600">Categories</div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Insight Panels */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
            {/* Panel 1: Job Category Analysis */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Target className="h-6 w-6 text-un-blue" />
                    <h3 className="text-lg font-semibold text-gray-900">What are we hiring for?</h3>
                  </div>
                  <span className="text-sm text-gray-500">Top Job Categories</span>
                </div>
              </div>
              
              <div className="p-6">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={topCategoriesChartData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      dataKey="category" 
                      type="category" 
                      width={150}
                      fontSize={12}
                    />
                    <Tooltip 
                      formatter={(value: any, name: any) => [value, 'Job Postings']}
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

            {/* Panel 2: Agency vs Category Heat Map */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="h-6 w-6 text-un-blue" />
                    <h3 className="text-lg font-semibold text-gray-900">Agency Specializations</h3>
                  </div>
                  <span className="text-sm text-gray-500">Who hires for what</span>
                </div>
              </div>
              
              <div className="p-6">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={agencyCategoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="agency" 
                      fontSize={11}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis fontSize={12} />
                    <Tooltip 
                      labelFormatter={(label: any) => {
                        const item = agencyCategoryData.find(d => d.agency === label);
                        return item?.fullAgency || label;
                      }}
                    />
                    {metrics.topCategories.slice(0, 4).map((category, index) => (
                      <Bar
                        key={category.category}
                        dataKey={category.category}
                        stackId="a"
                        fill={getCategoryColor(category.category)}
                        name={category.category}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Panel 3: Trending Categories */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-6 w-6 text-un-blue" />
                    <h3 className="text-lg font-semibold text-gray-900">Category Trends</h3>
                  </div>
                  <span className="text-sm text-gray-500">Over time</span>
                </div>
              </div>
              
              <div className="p-6">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={timeSeriesChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    {metrics.topCategories.slice(0, 5).map((category, index) => (
                      <Line
                        key={category.category}
                        type="monotone"
                        dataKey={category.category}
                        stroke={getCategoryColor(category.category)}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        name={category.category}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Panel 4: Emerging Skills Demand */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lightbulb className="h-6 w-6 text-un-blue" />
                    <h3 className="text-lg font-semibold text-gray-900">Emerging Demands</h3>
                  </div>
                  <span className="text-sm text-gray-500">Growth indicators</span>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {metrics.emergingCategories.map((category, index) => (
                    <div key={category.category} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: getCategoryColor(category.category) }}
                        />
                        <div>
                          <div className="font-medium text-gray-900">{category.category}</div>
                          {category.isNew && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              New Category
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span className="text-green-600 font-semibold">
                          +{category.growthRate.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Category Intelligence Component */}
          {/* CategoryInsights temporarily disabled for debugging
          <CategoryInsights 
            metrics={metrics}
            data={data}
            filters={filters}
          />
          */}

          {/* Agency Performance Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Activity className="h-6 w-6 text-un-blue" />
                <h3 className="text-lg font-semibold text-gray-900">Agency Performance Overview</h3>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Jobs
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Top Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Specializations
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {metrics.agencyInsights.slice(0, 10).map((agency, index) => (
                    <tr key={agency.agency}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{agency.agency}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{agency.totalJobs.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getCategoryColor(agency.topCategories[0]?.category) }}
                          />
                          <div className="text-sm text-gray-900">
                            {agency.topCategories[0]?.category}
                          </div>
                          <span className="text-xs text-gray-500">
                            ({agency.topCategories[0]?.percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {agency.specializations.map(spec => (
                            <span
                              key={spec}
                              className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800"
                            >
                              {spec}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 