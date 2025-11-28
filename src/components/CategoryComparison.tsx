import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Users, 
  MapPin, 
  Building2,
  Clock,
  BarChart3,
  Target,
  Globe,
  GraduationCap,
  X,
  Plus,
  Minus
} from 'lucide-react';
import { ProcessedJobData, CategoryAnalytics } from '../types';
import { JOB_CLASSIFICATION_DICTIONARY } from '../dictionary';
import { useDataProcessing } from '../contexts/DataProcessingContext';
import { RadarChart, BarChart, LineChart } from './charts';

interface CategoryComparisonProps {
  data: ProcessedJobData[];
  isOpen: boolean;
  onClose: () => void;
}

const CategoryComparison: React.FC<CategoryComparisonProps> = ({
  data,
  isOpen,
  onClose
}) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Digital & Technology', 'Climate & Environment']);
  const [comparisonMode, setComparisonMode] = useState<'overview' | 'trends' | 'competition' | 'requirements'>('overview');
  const { processor } = useDataProcessing();

  // Calculate analytics for selected categories
  const categoryAnalytics = useMemo(() => {
    const analytics: { [category: string]: CategoryAnalytics | null } = {};
    
    selectedCategories.forEach(category => {
      analytics[category] = processor.calculateCategoryAnalytics(data, category);
    });
    
    return analytics;
  }, [data, selectedCategories, processor]);

  // Available categories for selection
  const availableCategories = useMemo(() => {
    return JOB_CLASSIFICATION_DICTIONARY.map(cat => cat.name).filter(name => !selectedCategories.includes(name));
  }, [selectedCategories]);

  const addCategory = (category: string) => {
    if (selectedCategories.length < 4) {
      setSelectedCategories(prev => [...prev, category]);
    }
  };

  const removeCategory = (category: string) => {
    if (selectedCategories.length > 1) {
      setSelectedCategories(prev => prev.filter(cat => cat !== category));
    }
  };

  const getCategoryColor = (categoryName: string) => {
    const category = JOB_CLASSIFICATION_DICTIONARY.find(cat => cat.name === categoryName);
    return category?.color || '#6B7280';
  };

  // Prepare comparison data
  const comparisonData = useMemo(() => {
    const validAnalytics = selectedCategories
      .map(cat => ({ category: cat, analytics: categoryAnalytics[cat] }))
      .filter(item => item.analytics !== null);

    return {
      metrics: validAnalytics.map(({ category, analytics }) => ({
        category,
        totalJobs: analytics!.gradeBreakdown.totalPositions,
        growthRate: analytics!.growthRate.categoryGrowthRate,
        avgConfidence: analytics!.classificationQuality.avgConfidence,
        urgencyRate: analytics!.urgencyAnalysis.urgencyRate,
        weeklyVelocity: analytics!.postingVelocity.avgJobsPerWeek,
        seniorPositions: analytics!.gradeBreakdown.seniorityBreakdown.find(s => s.level === 'Senior')?.percentage || 0,
        multilingualRate: analytics!.languageRequirements.multilingualPercentage,
        avgApplicationWindow: analytics!.avgDaysToDeadline.avg,
        color: getCategoryColor(category)
      })),
      
      radarData: validAnalytics.map(({ category, analytics }) => ({
        category,
        data: [
          { axis: 'Volume', value: Math.min(100, (analytics!.gradeBreakdown.totalPositions / 50) * 100) },
          { axis: 'Growth', value: Math.max(0, Math.min(100, analytics!.growthRate.categoryGrowthRate + 50)) },
          { axis: 'Quality', value: analytics!.classificationQuality.avgConfidence },
          { axis: 'Urgency', value: 100 - analytics!.urgencyAnalysis.urgencyRate },
          { axis: 'Seniority', value: analytics!.gradeBreakdown.seniorityBreakdown.find(s => s.level === 'Senior')?.percentage || 0 },
          { axis: 'Languages', value: Math.min(100, analytics!.languageRequirements.multilingualPercentage * 2) }
        ],
        color: getCategoryColor(category)
      })),

      trends: validAnalytics.map(({ category, analytics }) => ({
        category,
        monthlyData: analytics!.monthlyTrend.monthlyData.map(item => ({
          month: item.month,
          value: item.count,
          category
        })),
        color: getCategoryColor(category)
      })),

      agencies: validAnalytics.map(({ category, analytics }) => ({
        category,
        concentration: analytics!.agencyConcentration[0]?.percentage || 0,
        topAgency: analytics!.agencyConcentration[0]?.agency || 'Unknown',
        competitiveness: 100 - (analytics!.agencyConcentration[0]?.percentage || 100),
        totalAgencies: analytics!.agencyConcentration.length
      }))
    };
  }, [selectedCategories, categoryAnalytics]);

  const modes = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'trends', label: 'Trends', icon: TrendingUp },
    { id: 'competition', label: 'Competition', icon: Target },
    { id: 'requirements', label: 'Requirements', icon: GraduationCap }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-full max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Category Comparison</h2>
              <p className="text-gray-600 mt-1">
                Compare workforce trends across {selectedCategories.length} categories
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          {/* Category Selection */}
          <div className="mt-6">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="text-sm font-medium text-gray-700">Selected Categories:</span>
              {selectedCategories.map(category => (
                <div 
                  key={category}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                  style={{ backgroundColor: `${getCategoryColor(category)}15`, borderColor: getCategoryColor(category) }}
                >
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: getCategoryColor(category) }}
                  />
                  <span className="text-sm font-medium">{category}</span>
                  {selectedCategories.length > 1 && (
                    <button
                      onClick={() => removeCategory(category)}
                      className="p-0.5 hover:bg-red-100 rounded"
                    >
                      <Minus className="h-3 w-3 text-red-600" />
                    </button>
                  )}
                </div>
              ))}
              
              {selectedCategories.length < 4 && availableCategories.length > 0 && (
                <div className="relative">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        addCategory(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="pl-8 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Add category...</option>
                    {availableCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <Plus className="absolute left-2.5 top-2.5 h-3 w-3 text-gray-400 pointer-events-none" />
                </div>
              )}
            </div>

            {/* Mode Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              {modes.map(mode => {
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.id}
                    onClick={() => setComparisonMode(mode.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      comparisonMode === mode.id
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {mode.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {comparisonMode === 'overview' && (
            <div className="space-y-8">
              {/* Key Metrics Comparison */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Key Metrics Comparison</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total Jobs</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Growth Rate</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avg Confidence</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Urgency Rate</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Weekly Volume</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Senior %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {comparisonData.metrics.map((metric, index) => (
                        <tr key={metric.category} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: metric.color }}
                              />
                              <span className="font-medium text-gray-900">{metric.category}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center font-medium text-gray-900">
                            {metric.totalJobs.toLocaleString()}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`font-medium ${
                              metric.growthRate > 0 ? 'text-green-600' : metric.growthRate < 0 ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {metric.growthRate > 0 ? '+' : ''}{metric.growthRate}%
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`font-medium ${
                              metric.avgConfidence >= 70 ? 'text-green-600' : metric.avgConfidence >= 40 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {metric.avgConfidence}%
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`font-medium ${
                              metric.urgencyRate >= 30 ? 'text-red-600' : metric.urgencyRate >= 15 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {metric.urgencyRate}%
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center font-medium text-gray-900">
                            {metric.weeklyVelocity}
                          </td>
                          <td className="px-4 py-4 text-center font-medium text-gray-900">
                            {metric.seniorPositions.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Radar Chart Comparison */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Multi-dimensional Comparison</h3>
                <div className="h-96">
                  <RadarChart
                    data={comparisonData.radarData}
                    height={400}
                    dataLines={selectedCategories.map((category, index) => ({
                      dataKey: category.replace(/\s+/g, ''),
                      name: category,
                      stroke: ['#3B82F6', '#10B981', '#F59E0B'][index] || '#6B7280',
                      fill: ['#3B82F6', '#10B981', '#F59E0B'][index] || '#6B7280',
                      fillOpacity: 0.1
                    }))}
                  />
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <p><strong>Volume:</strong> Relative job count | <strong>Growth:</strong> Recent growth trend</p>
                  <p><strong>Quality:</strong> Classification confidence | <strong>Urgency:</strong> Application timeline pressure</p>
                  <p><strong>Seniority:</strong> Senior position percentage | <strong>Languages:</strong> Multilingual requirement frequency</p>
                </div>
              </div>

              {/* Comparative Bar Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Volume Comparison</h3>
                  <BarChart
                    data={comparisonData.metrics.map(m => ({
                      name: m.category.split(' ')[0],
                      value: m.totalJobs,
                      color: m.color
                    }))}
                    height={300}
                    dataKey="value"
                    xAxisKey="name"
                  />
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Growth Rate Comparison</h3>
                  <BarChart
                    data={comparisonData.metrics.map(m => ({
                      name: m.category.split(' ')[0],
                      value: Math.max(-50, Math.min(100, m.growthRate + 50)), // Normalize for display
                      color: m.growthRate > 0 ? '#10B981' : '#EF4444'
                    }))}
                    height={300}
                    dataKey="value"
                    xAxisKey="name"
                  />
                </div>
              </div>
            </div>
          )}

          {comparisonMode === 'trends' && (
            <div className="space-y-8">
              {/* Monthly Trends Comparison */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Posting Trends</h3>
                <div className="h-96">
                  <LineChart
                    data={comparisonData.trends.flatMap(trend => 
                      trend.monthlyData.map(item => ({
                        ...item,
                        category: trend.category
                      }))
                    )}
                    height={400}
                    dataKey="count"
                    xAxisKey="month"
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-4">
                  {comparisonData.trends.map(trend => (
                    <div key={trend.category} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: trend.color }}
                      />
                      <span className="text-sm text-gray-700">{trend.category}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Velocity and Volatility Comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Posting Velocity</h3>
                  <div className="space-y-4">
                    {comparisonData.metrics.map(metric => (
                      <div key={metric.category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: metric.color }}
                          />
                          <span className="text-sm font-medium">{metric.category}</span>
                        </div>
                        <span className="text-sm font-bold">{metric.weeklyVelocity} jobs/week</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Windows</h3>
                  <div className="space-y-4">
                    {comparisonData.metrics.map(metric => (
                      <div key={metric.category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: metric.color }}
                          />
                          <span className="text-sm font-medium">{metric.category}</span>
                        </div>
                        <span className="text-sm font-bold">{metric.avgApplicationWindow} days avg</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {comparisonMode === 'competition' && (
            <div className="space-y-8">
              {/* Agency Competition Analysis */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Market Competition Analysis</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Market Leader</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Concentration</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Competitiveness</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total Agencies</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {comparisonData.agencies.map(agency => (
                        <tr key={agency.category} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: getCategoryColor(agency.category) }}
                              />
                              <span className="font-medium text-gray-900">{agency.category}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center font-medium text-gray-900">
                            {agency.topAgency}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`font-medium ${
                              agency.concentration > 50 ? 'text-red-600' : agency.concentration > 30 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {agency.concentration.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`font-medium ${
                              agency.competitiveness > 70 ? 'text-green-600' : agency.competitiveness > 50 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {agency.competitiveness.toFixed(0)}%
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center font-medium text-gray-900">
                            {agency.totalAgencies}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <p><strong>Concentration:</strong> Market share of leading agency</p>
                  <p><strong>Competitiveness:</strong> How distributed the market is (100% = highly competitive)</p>
                </div>
              </div>

              {/* Market Concentration Visualization */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Concentration Index</h3>
                <BarChart
                  data={comparisonData.agencies.map(a => ({
                    name: a.category.split(' ')[0],
                    value: a.concentration,
                    color: a.concentration > 50 ? '#EF4444' : a.concentration > 30 ? '#F59E0B' : '#10B981'
                  }))}
                  height={300}
                  dataKey="value"
                  xAxisKey="name"
                />
                <div className="mt-4 flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <span>High concentration (&gt;50%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                    <span>Medium concentration (30-50%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <span>Competitive market (&lt;30%)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {comparisonMode === 'requirements' && (
            <div className="space-y-8">
              {/* Language Requirements Comparison */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Language Requirements</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Multilingual Positions %</h4>
                    <BarChart
                      data={comparisonData.metrics.map(m => ({
                        name: m.category.split(' ')[0],
                        value: m.multilingualRate,
                        color: m.color
                      }))}
                      height={250}
                      dataKey="value"
                      xAxisKey="name"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Language Complexity</h4>
                    <div className="space-y-3">
                      {comparisonData.metrics.map(metric => (
                        <div key={metric.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: metric.color }}
                            />
                            <span className="text-sm font-medium">{metric.category}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold">{metric.multilingualRate.toFixed(1)}%</span>
                            <p className="text-xs text-gray-600">multilingual</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Seniority Requirements */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Seniority Profile</h3>
                <BarChart
                  data={comparisonData.metrics.map(m => ({
                    name: m.category.split(' ')[0],
                    value: m.seniorPositions,
                    color: m.color
                  }))}
                  height={300}
                  dataKey="value"
                  xAxisKey="name"
                />
                <div className="mt-4 text-sm text-gray-600">
                  <p>Percentage of senior-level positions in each category</p>
                </div>
              </div>

              {/* Application Window Patterns */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Application Timeline Patterns</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Average Application Window</h4>
                    <div className="space-y-3">
                      {comparisonData.metrics.map(metric => (
                        <div key={metric.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: metric.color }}
                            />
                            <span className="text-sm font-medium">{metric.category}</span>
                          </div>
                          <span className="text-sm font-bold">{metric.avgApplicationWindow} days</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Urgency Rates</h4>
                    <div className="space-y-3">
                      {comparisonData.metrics.map(metric => (
                        <div key={metric.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: metric.color }}
                            />
                            <span className="text-sm font-medium">{metric.category}</span>
                          </div>
                          <div className="text-right">
                            <span className={`text-sm font-bold ${
                              metric.urgencyRate >= 30 ? 'text-red-600' : metric.urgencyRate >= 15 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {metric.urgencyRate}%
                            </span>
                            <p className="text-xs text-gray-600">urgent jobs</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryComparison;
