import React, { useMemo } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, Calendar, Clock, Zap, AlertTriangle, Eye } from 'lucide-react';
import { ProcessedJobData, FilterOptions } from '../types';
import { JobAnalyticsProcessor, JOB_CATEGORIES } from '../services/dataProcessor';

interface TemporalTrendsProps {
  data: ProcessedJobData[];
  filters: FilterOptions;
}

const TemporalTrends: React.FC<TemporalTrendsProps> = ({ data, filters }) => {
  const processor = useMemo(() => new JobAnalyticsProcessor(), []);
  
  const isAgencyView = filters.selectedAgency !== 'all';
  
  // For temporal trends: 
  // - Agency view: Use filtered data to show internal trends
  // - Market view: Use unfiltered data to show market trends
  const dataToAnalyze = useMemo(() => {
    if (isAgencyView) {
      // Show agency's internal temporal patterns
      return processor.applyFilters(data, filters);
    } else {
      // Show market-wide temporal patterns
      return data;
    }
  }, [data, filters, processor, isAgencyView]);

  const temporalAnalysis = useMemo(() => {
    return processor.calculateTemporalTrends(dataToAnalyze, 18); // 18 months of data
  }, [dataToAnalyze, processor]);

  const getCategoryColor = (categoryName: string) => {
    const category = JOB_CATEGORIES.find(cat => cat.name === categoryName);
    return category?.color || '#94A3B8';
  };

  const formatMonthLabel = (month: string) => {
    try {
      const [year, monthNum] = month.split('-');
      const date = new Date(parseInt(year), parseInt(monthNum) - 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    } catch {
      return month;
    }
  };

  const getTopAgencies = () => {
    if (temporalAnalysis.agencyTimeSeries.length === 0) return [];
    const sampleMonth = temporalAnalysis.agencyTimeSeries[0];
    return Object.keys(sampleMonth).filter(key => key !== 'month' && key !== 'total').slice(0, 5);
  };

  const getTopCategories = () => {
    if (temporalAnalysis.categoryTimeSeries.length === 0) return [];
    const sampleMonth = temporalAnalysis.categoryTimeSeries[0];
    return Object.keys(sampleMonth).filter(key => key !== 'month').slice(0, 6);
  };

  const agencyColors = ['#009edb', '#0077be', '#4db8e8', '#72c8f0', '#a1d8f7'];
  const topAgencies = getTopAgencies();
  const topCategories = getTopCategories();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Temporal Trends Analysis</h2>
        <div className="text-sm text-gray-600">
          {temporalAnalysis.agencyTimeSeries.length} months of hiring data
        </div>
      </div>

      {/* Key Temporal Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="metric-card">
          <div className="metric-value">
            {temporalAnalysis.emergingTrends.newCategories.length}
          </div>
          <div className="metric-label">
            <Zap className="h-4 w-4 mr-1" />
            New Categories
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-value">
            {temporalAnalysis.emergingTrends.velocityIndicators.filter(v => v.trend === 'rising').length}
          </div>
          <div className="metric-label">
            <TrendingUp className="h-4 w-4 mr-1" />
            Rising Trends
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-value">
            {temporalAnalysis.seasonalPatterns.length > 0 
              ? temporalAnalysis.seasonalPatterns.reduce((max, month) => 
                  month.totalJobs > max.totalJobs ? month : max, temporalAnalysis.seasonalPatterns[0]).monthName
              : 'N/A'
            }
          </div>
          <div className="metric-label">
            <Calendar className="h-4 w-4 mr-1" />
            Peak Hiring Month
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-value">
            {temporalAnalysis.emergingTrends.velocityIndicators.length > 0
              ? Math.round(temporalAnalysis.emergingTrends.velocityIndicators[0].acceleration)
              : 0
            }%
          </div>
          <div className="metric-label">
            <Eye className="h-4 w-4 mr-1" />
            Top Velocity
          </div>
        </div>
      </div>

      {/* Main Temporal Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Agency Hiring Trends */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-un-blue" />
                <h3 className="text-lg font-semibold text-gray-900">Agency Hiring Trends</h3>
              </div>
              <span className="text-sm text-gray-500">Monthly job postings</span>
            </div>
          </div>
          
          <div className="p-6">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={temporalAnalysis.agencyTimeSeries.map(item => ({
                ...item,
                month: formatMonthLabel(item.month)
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={12} />
                <Tooltip 
                  labelFormatter={(label) => `Month: ${label}`}
                  formatter={(value: any, name: any) => [`${value} jobs`, name]}
                />
                {topAgencies.map((agency, index) => (
                  <Line
                    key={agency}
                    type="monotone"
                    dataKey={agency}
                    stroke={agencyColors[index] || '#94A3B8'}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name={agency.length > 15 ? agency.substring(0, 12) + '...' : agency}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Evolution */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-un-blue" />
                <h3 className="text-lg font-semibold text-gray-900">Category Evolution</h3>
              </div>
              <span className="text-sm text-gray-500">Shifting priorities</span>
            </div>
          </div>
          
          <div className="p-6">
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={temporalAnalysis.categoryTimeSeries.map(item => ({
                ...item,
                month: formatMonthLabel(item.month)
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis fontSize={12} />
                <Tooltip 
                  labelFormatter={(label) => `Month: ${label}`}
                  formatter={(value: any, name: any) => [`${value} jobs`, name]}
                />
                {topCategories.map((category, index) => (
                  <Area
                    key={category}
                    type="monotone"
                    dataKey={category}
                    stackId="1"
                    stroke={getCategoryColor(category)}
                    fill={getCategoryColor(category)}
                    fillOpacity={0.6}
                    name={category.length > 20 ? category.substring(0, 17) + '...' : category}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Seasonal Patterns */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 text-un-blue" />
              <h3 className="text-lg font-semibold text-gray-900">Seasonal Hiring Patterns</h3>
            </div>
            <span className="text-sm text-gray-500">Peak months and categories</span>
          </div>
        </div>
        
        <div className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={temporalAnalysis.seasonalPatterns}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="monthName" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip 
                formatter={(value: any) => [`${value} jobs`, 'Total Jobs']}
                labelFormatter={(label) => `${label} (seasonal average)`}
              />
              <Bar dataKey="totalJobs" fill="#009edb" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Emerging Trends Detection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* New Categories */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Zap className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">New Categories</h3>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {temporalAnalysis.emergingTrends.newCategories.length > 0 ? (
                temporalAnalysis.emergingTrends.newCategories.map((category, index) => (
                  <div key={category.category} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getCategoryColor(category.category) }}
                      />
                      <div>
                        <div className="font-medium text-gray-900">
                          {category.category.length > 25 ? category.category.substring(0, 22) + '...' : category.category}
                        </div>
                        <div className="text-xs text-gray-500">
                          First seen: {formatMonthLabel(category.firstAppeared)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-green-600">
                        {category.growth} jobs
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No new categories detected in recent months
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Declining Categories */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Declining Categories</h3>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {temporalAnalysis.emergingTrends.decliningCategories.length > 0 ? (
                temporalAnalysis.emergingTrends.decliningCategories.map((category, index) => (
                  <div key={category.category} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getCategoryColor(category.category) }}
                      />
                      <div>
                        <div className="font-medium text-gray-900">
                          {category.category.length > 25 ? category.category.substring(0, 22) + '...' : category.category}
                        </div>
                        <div className="text-xs text-gray-500">
                          Last active: {category.lastSeen}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-red-600">
                        -{category.decline.toFixed(0)}%
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No significant declining trends detected
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Velocity Indicators */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-yellow-600" />
              <h3 className="text-lg font-semibold text-gray-900">Velocity Indicators</h3>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {temporalAnalysis.emergingTrends.velocityIndicators.length > 0 ? (
                temporalAnalysis.emergingTrends.velocityIndicators.slice(0, 6).map((indicator, index) => (
                  <div key={indicator.category} className={`flex items-center justify-between p-3 rounded-lg ${
                    indicator.trend === 'rising' ? 'bg-green-50' : 
                    indicator.trend === 'falling' ? 'bg-red-50' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center">
                        {indicator.trend === 'rising' ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : indicator.trend === 'falling' ? (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {indicator.category.length > 20 ? indicator.category.substring(0, 17) + '...' : indicator.category}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {indicator.trend} trend
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${
                        indicator.trend === 'rising' ? 'text-green-600' : 
                        indicator.trend === 'falling' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {indicator.acceleration.toFixed(0)}%
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No significant velocity changes detected
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Insights Summary */}
      <div className="bg-gradient-to-r from-un-blue to-blue-600 rounded-lg shadow text-white">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Temporal Insights Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Key Trends</h4>
              <ul className="text-sm space-y-1 opacity-90">
                {temporalAnalysis.emergingTrends.newCategories.length > 0 && (
                  <li>• {temporalAnalysis.emergingTrends.newCategories.length} new categories emerged recently</li>
                )}
                {temporalAnalysis.seasonalPatterns.length > 0 && (
                  <li>• Peak hiring occurs in {temporalAnalysis.seasonalPatterns.reduce((max, month) => 
                    month.totalJobs > max.totalJobs ? month : max, temporalAnalysis.seasonalPatterns[0]).monthName}</li>
                )}
                {temporalAnalysis.emergingTrends.velocityIndicators.filter(v => v.trend === 'rising').length > 0 && (
                  <li>• {temporalAnalysis.emergingTrends.velocityIndicators.filter(v => v.trend === 'rising').length} categories showing rapid growth</li>
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Strategic Implications</h4>
              <ul className="text-sm space-y-1 opacity-90">
                <li>• Monitor new categories for emerging skill demands</li>
                <li>• Plan recruitment cycles around seasonal patterns</li>
                <li>• Capitalize on declining competition in falling categories</li>
                <li>• Invest early in high-velocity growth areas</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemporalTrends; 