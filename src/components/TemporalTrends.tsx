import React, { useMemo } from 'react';
import { LineChart, AreaChart, BarChart, PostedVsOpenChart } from './charts';
import { TrendingUp, TrendingDown, Calendar, Clock, Zap, AlertTriangle, Eye, BarChart3 } from 'lucide-react';
import { ProcessedJobData, FilterOptions } from '../types';
import { JOB_CLASSIFICATION_DICTIONARY } from '../dictionary';
import { useDataProcessing } from '../contexts/DataProcessingContext';

interface TemporalTrendsProps {
  data: ProcessedJobData[];
  filters: FilterOptions;
}

const TemporalTrends: React.FC<TemporalTrendsProps> = ({ data, filters }) => {
  const dataProcessing = useDataProcessing();
  
  const isAgencyView = filters.selectedAgency !== 'all';
  
  // For temporal trends: 
  // - Agency view: Use filtered data to show internal trends
  // - Market view: Use unfiltered data to show market trends
  const dataToAnalyze = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      return [];
    }
    if (isAgencyView) {
      // Show agency's internal temporal patterns
      if (!dataProcessing || !dataProcessing.getFilteredData) {
        return [];
      }
      try {
        const result = dataProcessing.getFilteredData(data, filters);
        return Array.isArray(result) ? result : [];
      } catch (error) {
        console.error('Error filtering temporal data:', error);
        return [];
      }
    } else {
      // Show market-wide temporal patterns
      return data;
    }
  }, [data, filters, dataProcessing, isAgencyView]);

  const temporalAnalysis = useMemo(() => {
    if (!dataToAnalyze || !Array.isArray(dataToAnalyze) || dataToAnalyze.length === 0 || !dataProcessing || !dataProcessing.getTemporalTrends) {
      return {
        agencyTimeSeries: [],
        categoryTimeSeries: [],
        seasonalPatterns: [],
        trendSummary: {},
        emergingCategories: [],
        decliningCategories: [],
        velocityIndicators: []
      };
    }
    try {
      const result = dataProcessing.getTemporalTrends(dataToAnalyze, 18); // 18 months of data
      return result || {
        agencyTimeSeries: [],
        categoryTimeSeries: [],
        seasonalPatterns: [],
        trendSummary: {},
        emergingCategories: [],
        decliningCategories: [],
        velocityIndicators: []
      };
    } catch (error) {
      console.error('Error analyzing temporal trends:', error);
      return {
        agencyTimeSeries: [],
        categoryTimeSeries: [],
        seasonalPatterns: [],
        trendSummary: {},
        emergingCategories: [],
        decliningCategories: [],
        velocityIndicators: []
      };
    }
  }, [dataToAnalyze, dataProcessing]);

  // Calculate Posted vs Open job timeline
  const postedVsOpenAnalysis = useMemo(() => {
    if (!dataToAnalyze || !Array.isArray(dataToAnalyze) || dataToAnalyze.length === 0 || !dataProcessing?.temporalAnalyzer) {
      return [];
    }
    try {
      const result = dataProcessing.temporalAnalyzer.calculateTemporalMetrics(dataToAnalyze, 'month');
      // Convert EnhancedTemporalMetrics to TemporalSnapshot format
      const avgJobsPerPeriod = result.length > 0 
        ? result.reduce((sum, r) => sum + r.jobs_posted_this_period, 0) / result.length 
        : 0;
      
      return result.map(r => ({
        period: r.period,
        jobs_posted: r.jobs_posted_this_period,
        jobs_open: r.jobs_open_end_of_period,
        jobs_closed: r.jobs_closed_this_period,
        net_opening_change: r.net_change,
        market_saturation: r.market_saturation_index > 1.5 ? 'high' as const : 
                          r.market_saturation_index < 0.8 ? 'low' as const : 
                          'medium' as const,
        avg_jobs_per_period: avgJobsPerPeriod
      })) || [];
    } catch (error) {
      console.error('Error calculating posted vs open timeline:', error);
      return [];
    }
  }, [dataToAnalyze, dataProcessing]);

  const getCategoryColor = (categoryName: string) => {
    const category = JOB_CLASSIFICATION_DICTIONARY.find(cat => cat.name === categoryName);
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
        {/* Market Growth Rate */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="h-5 w-5 text-un-blue" />
            <div className={`text-2xl font-bold ${(() => {
              const recentTotal = temporalAnalysis.agencyTimeSeries.slice(-3).reduce((sum, month) => sum + (month.total || 0), 0);
              const earlierTotal = temporalAnalysis.agencyTimeSeries.slice(0, 3).reduce((sum, month) => sum + (month.total || 0), 0);
              const growthRate = earlierTotal > 0 ? ((recentTotal - earlierTotal) / earlierTotal * 100) : 0;
              return growthRate > 0 ? 'text-green-600' : growthRate < 0 ? 'text-red-600' : 'text-gray-600';
            })()}`}>
              {(() => {
                const recentTotal = temporalAnalysis.agencyTimeSeries.slice(-3).reduce((sum, month) => sum + (month.total || 0), 0);
                const earlierTotal = temporalAnalysis.agencyTimeSeries.slice(0, 3).reduce((sum, month) => sum + (month.total || 0), 0);
                const growthRate = earlierTotal > 0 ? ((recentTotal - earlierTotal) / earlierTotal * 100) : 0;
                return growthRate > 0 ? `+${growthRate.toFixed(1)}%` : `${growthRate.toFixed(1)}%`;
              })()}
            </div>
          </div>
          <div className="text-sm font-medium text-gray-900 mb-1">
            {isAgencyView ? 'Agency Growth' : 'Market Growth'}
          </div>
          <div className="text-xs text-gray-500">
            {isAgencyView ? 'vs. previous quarter' : 'Overall hiring trend'}
          </div>
        </div>

        {/* Most Active Category */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <Zap className="h-5 w-5 text-yellow-600" />
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-900">
                {(() => {
                  if (temporalAnalysis.categoryTimeSeries.length === 0) return 'No data';
                  const recentMonth = temporalAnalysis.categoryTimeSeries[temporalAnalysis.categoryTimeSeries.length - 1];
                  const categories = Object.entries(recentMonth).filter(([key]) => key !== 'month');
                  if (categories.length === 0) return 'No data';
                  const topCategory = categories.reduce((max, curr) => curr[1] > max[1] ? curr : max);
                  return `${topCategory[1]} jobs`;
                })()}
              </div>
            </div>
          </div>
          <div className="text-sm font-medium text-gray-900 mb-1">
            Top Category
          </div>
          <div className="text-xs text-gray-500 leading-tight">
            {(() => {
              if (temporalAnalysis.categoryTimeSeries.length === 0) return 'No data available';
              const recentMonth = temporalAnalysis.categoryTimeSeries[temporalAnalysis.categoryTimeSeries.length - 1];
              const categories = Object.entries(recentMonth).filter(([key]) => key !== 'month');
              if (categories.length === 0) return 'No data available';
              const topCategory = categories.reduce((max, curr) => curr[1] > max[1] ? curr : max);
              return topCategory[0];
            })()}
          </div>
        </div>

        {/* Peak Season Info */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <Calendar className="h-5 w-5 text-blue-600" />
            <div className="text-2xl font-bold text-blue-600">
              {temporalAnalysis.seasonalPatterns.length > 0 
                ? temporalAnalysis.seasonalPatterns.reduce((max, month) => 
                    month.totalJobs > max.totalJobs ? month : max, temporalAnalysis.seasonalPatterns[0]).monthName
                : 'N/A'
              }
            </div>
          </div>
          <div className="text-sm font-medium text-gray-900 mb-1">
            Peak Season
          </div>
          <div className="text-xs text-gray-500">
            {temporalAnalysis.seasonalPatterns.length > 0 
              ? `${temporalAnalysis.seasonalPatterns.reduce((max, month) => 
                  month.totalJobs > max.totalJobs ? month : max, temporalAnalysis.seasonalPatterns[0]).totalJobs} avg jobs`
              : 'Historical average'
            }
          </div>
        </div>

        {/* Fastest Growing */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <Eye className="h-5 w-5 text-green-600" />
            <div className="text-right">
              <div className="text-lg font-semibold text-green-600">
                {(() => {
                  const velocityIndicators = temporalAnalysis?.velocityIndicators || temporalAnalysis?.emergingTrends?.velocityIndicators || [];
                  const fastestGrowing = velocityIndicators
                    .filter(v => v && v.trend === 'rising')
                    .sort((a, b) => b.acceleration - a.acceleration)[0];
                  
                  if (!fastestGrowing) return 'No growth';
                  
                  const displayVelocity = Math.min(fastestGrowing.acceleration, 500);
                  if (fastestGrowing.acceleration > 500) {
                    return '500%+';
                  }
                  return `+${displayVelocity.toFixed(0)}%`;
                })()}
              </div>
            </div>
          </div>
          <div className="text-sm font-medium text-gray-900 mb-1">
            Fastest Growing
          </div>
          <div className="text-xs text-gray-500 leading-tight">
            {(() => {
              const velocityIndicators = temporalAnalysis?.velocityIndicators || temporalAnalysis?.emergingTrends?.velocityIndicators || [];
              const fastestGrowing = velocityIndicators
                .filter(v => v && v.trend === 'rising')
                .sort((a, b) => b.acceleration - a.acceleration)[0];
              
              if (!fastestGrowing) return 'All categories stable';
              
              return fastestGrowing.category;
            })()}
          </div>
        </div>
      </div>

      {/* Posted vs Open Jobs Timeline - NEW FEATURE */}
      {postedVsOpenAnalysis && postedVsOpenAnalysis.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-6 w-6 text-purple-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Jobs Posted vs Jobs Open for Applications</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Shows the difference between NEW jobs posted each month and TOTAL jobs accepting applications
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <PostedVsOpenChart snapshots={postedVsOpenAnalysis} />
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-xs font-semibold text-blue-800 uppercase">Jobs Posted</div>
                <div className="text-xs text-blue-700 mt-1">NEW opportunities that month</div>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-xs font-semibold text-green-800 uppercase">Jobs Open</div>
                <div className="text-xs text-green-700 mt-1">TOTAL accepting applications</div>
              </div>
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="text-xs font-semibold text-purple-800 uppercase">Market Saturation</div>
                <div className="text-xs text-purple-700 mt-1">High/Medium/Low indicator</div>
              </div>
            </div>
          </div>
        </div>
      )}

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
            {(temporalAnalysis?.agencyTimeSeries?.length || 0) > 0 ? (
              <LineChart
                data={temporalAnalysis.agencyTimeSeries.map(item => ({
                  ...item,
                  month: formatMonthLabel(item.month)
                }))}
                xAxisKey="month"
                dataKey={topAgencies[0] || 'total'}
                height={400}
                color={agencyColors[0] || '#3B82F6'}
                additionalLines={topAgencies.slice(1).map((agency, index) => ({
                  dataKey: agency,
                  name: agency.length > 15 ? agency.substring(0, 12) + '...' : agency,
                  stroke: agencyColors[index + 1] || '#94A3B8',
                  strokeWidth: 2
                }))}
                tooltipLabelFormatter={(label) => `Month: ${label}`}
                tooltipFormatter={(value: any, name: any) => [`${value} jobs`, name]}
                dotSize={3}
              />
            ) : (
              <div className="flex items-center justify-center h-96 text-gray-500">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No agency timeline data available</p>
                  <p className="text-sm mt-1">Check data filters and date range</p>
                </div>
              </div>
            )}
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
            {(temporalAnalysis?.categoryTimeSeries?.length || 0) > 0 ? (
              <AreaChart
                data={temporalAnalysis.categoryTimeSeries.map(item => ({
                  ...item,
                  month: formatMonthLabel(item.month)
                }))}
                xAxisKey="month"
                dataKey={topCategories[0] || 'default'}
                height={400}
                color={getCategoryColor(topCategories[0]) || '#3B82F6'}
                fillOpacity={0.6}
                stacked={true}
                additionalAreas={topCategories.slice(1).map((category) => ({
                  dataKey: category,
                  name: category.length > 20 ? category.substring(0, 17) + '...' : category,
                  fill: getCategoryColor(category),
                  stroke: getCategoryColor(category),
                  fillOpacity: 0.6,
                  stackId: "1"
                }))}
                tooltipLabelFormatter={(label) => `Month: ${label}`}
                tooltipFormatter={(value: any, name: any) => [`${value} jobs`, name]}
              />
            ) : (
              <div className="flex items-center justify-center h-96 text-gray-500">
                <div className="text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No category evolution data available</p>
                  <p className="text-sm mt-1">Check data filters and date range</p>
                </div>
              </div>
            )}
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
          {(temporalAnalysis?.seasonalPatterns?.length || 0) > 0 ? (
            <BarChart
              data={temporalAnalysis.seasonalPatterns}
              dataKey="totalJobs"
              xAxisKey="monthName"
              height={300}
              color="#009edb"
              tooltipFormatter={(value: any) => [`${value} jobs`, 'Total Jobs']}
              tooltipLabelFormatter={(label) => `${label} (seasonal average)`}
            />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No seasonal pattern data available</p>
                <p className="text-sm mt-1">Need more historical data for analysis</p>
              </div>
            </div>
          )}
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
              {(temporalAnalysis?.emergingCategories?.length || 0) > 0 ? (
                (temporalAnalysis.emergingCategories || []).map((category, index) => (
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
              {(temporalAnalysis?.decliningCategories?.length || 0) > 0 ? (
                (temporalAnalysis.decliningCategories || []).map((category, index) => (
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
              {(temporalAnalysis?.velocityIndicators?.length || 0) > 0 ? (
                (temporalAnalysis.velocityIndicators || []).slice(0, 6).map((indicator, index) => (
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
                {(temporalAnalysis?.emergingCategories?.length || 0) > 0 && (
                  <li>• {temporalAnalysis.emergingCategories.length} new categories emerged recently</li>
                )}
                {(temporalAnalysis?.seasonalPatterns?.length || 0) > 0 && (
                  <li>• Peak hiring occurs in {temporalAnalysis.seasonalPatterns.reduce((max, month) => 
                    month.totalJobs > max.totalJobs ? month : max, temporalAnalysis.seasonalPatterns[0]).monthName}</li>
                )}
                {(() => {
                  const velocityIndicators = temporalAnalysis?.velocityIndicators || temporalAnalysis?.emergingTrends?.velocityIndicators || [];
                  const risingCount = velocityIndicators.filter(v => v && v.trend === 'rising').length;
                  return risingCount > 0 && (
                    <li>• {risingCount} categories showing rapid growth</li>
                  );
                })()}
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