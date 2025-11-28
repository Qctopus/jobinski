import React, { useMemo, useState } from 'react';
import { Brain, TrendingUp, TrendingDown, Award, Eye, BarChart3, Zap, Filter, Search, X, Download, Target, Activity, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { PieChart, BCGMatrixChart, CategoryEvolutionChart } from './charts';
import { DashboardMetrics, ProcessedJobData, FilterOptions } from '../types';
import { JOB_CLASSIFICATION_DICTIONARY } from '../dictionary';
import { useDataProcessing } from '../contexts/DataProcessingContext';
import CategoryDrillDown from './CategoryDrillDown';
import CategoryComparison from './CategoryComparison';
import { subWeeks, parseISO, format } from 'date-fns';

interface CategoryInsightsProps {
  metrics: DashboardMetrics;
  marketMetrics: DashboardMetrics;
  data: ProcessedJobData[];
  filters: FilterOptions;
  isAgencyView: boolean;
}

const CategoryInsights: React.FC<CategoryInsightsProps> = ({
  metrics,
  marketMetrics,
  data,
  filters,
  isAgencyView
}) => {
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownCategoryId, setDrillDownCategoryId] = useState<string>('');
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [confidenceFilter, setConfidenceFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [timePeriod, setTimePeriod] = useState<'month' | 'quarter'>('month');

  // Get data processing services
  const dataProcessing = useDataProcessing();

  // Calculate category evolution analytics
  const categoryAnalytics = useMemo(() => {
    if (!dataProcessing?.categoryEvolutionAnalyzer) return null;

    try {
      const performance = dataProcessing.categoryEvolutionAnalyzer.calculateCategoryPerformance(data);
      const evolution = dataProcessing.categoryEvolutionAnalyzer.calculateCategoryEvolution(data, 'month');

      // Build BCG Matrix from performance data
      const avgGrowth = performance.reduce((sum, p) => sum + p.growth_rate_3m, 0) / performance.length;
      const avgShare = performance.reduce((sum, p) => sum + p.your_market_share, 0) / performance.length;

      const matrix = {
        stars: performance.filter(p => p.growth_rate_3m >= avgGrowth && p.your_market_share >= avgShare),
        question_marks: performance.filter(p => p.growth_rate_3m >= avgGrowth && p.your_market_share < avgShare),
        cash_cows: performance.filter(p => p.growth_rate_3m < avgGrowth && p.your_market_share >= avgShare),
        dogs: performance.filter(p => p.growth_rate_3m < avgGrowth && p.your_market_share < avgShare)
      };

      return { performance, evolution, matrix };
    } catch (error) {
      console.error('Error calculating category analytics:', error);
      return null;
    }
  }, [data, dataProcessing]);

  // Handle category clicks
  const handleCategoryClick = (categoryIdentifier: string) => {
    console.log('Category clicked:', categoryIdentifier);

    // Try multiple matching strategies - could be either name or ID
    let category = JOB_CLASSIFICATION_DICTIONARY.find(cat =>
      cat.name === categoryIdentifier ||
      cat.id === categoryIdentifier ||
      cat.name.toLowerCase() === categoryIdentifier.toLowerCase() ||
      cat.id.toLowerCase() === categoryIdentifier.toLowerCase()
    );

    if (category) {
      console.log('Opening drill-down for category:', category.name);

      setDrillDownCategoryId(category.id);
      setDrillDownOpen(true);
    } else {
      console.error('No matching category found for:', categoryIdentifier);
      console.log('Available categories:', JOB_CLASSIFICATION_DICTIONARY.map(cat => ({ id: cat.id, name: cat.name })));
    }
  };

  // Get category color helper
  const getCategoryColor = (categoryName: string) => {
    const category = JOB_CLASSIFICATION_DICTIONARY.find(cat => cat.name === categoryName);
    return category?.color || '#6B7280';
  };

  // Key insights based on data
  const keyInsights = useMemo(() => {
    const insights = [];

    if (metrics.topCategories.length > 0) {
      const topCategory = metrics.topCategories[0];

      if (isAgencyView) {
        const marketCategory = marketMetrics.categoryInsights.find(c => c.category === topCategory.category);
        const isMarketLeader = marketCategory?.leadingAgency === filters.selectedAgency;

        insights.push({
          icon: <Award className="h-5 w-5" />,
          title: `Our specialty: ${topCategory.category}`,
          description: `${topCategory.count} positions (${topCategory.percentage.toFixed(1)}% of our portfolio)`,
          type: isMarketLeader ? 'success' : 'info',
          action: () => handleCategoryClick(topCategory.category)
        });
      } else {
        insights.push({
          icon: <BarChart3 className="h-5 w-5" />,
          title: `${topCategory.category} leads the market`,
          description: `${topCategory.count} positions (${topCategory.percentage.toFixed(1)}% of all jobs)`,
          type: 'success',
          action: () => handleCategoryClick(topCategory.category)
        });
      }
    }

    // Market concentration insight
    const top3Share = metrics.topCategories.slice(0, 3).reduce((sum, cat) => sum + cat.percentage, 0);
    if (top3Share > 60) {
      insights.push({
        icon: <Zap className="h-5 w-5" />,
        title: 'High market concentration',
        description: `Top 3 categories represent ${top3Share.toFixed(1)}% of all positions`,
        type: 'warning',
        action: undefined
      });
    }

    // Emerging categories insight
    if (metrics.emergingCategories.length > 0) {
      const fastestGrowing = metrics.emergingCategories
        .sort((a, b) => b.growthRate - a.growthRate)[0];

      insights.push({
        icon: <TrendingUp className="h-5 w-5" />,
        title: 'Fastest growing area',
        description: `${fastestGrowing.category} (+${fastestGrowing.growthRate.toFixed(0)}% growth)`,
        type: 'info',
        action: () => handleCategoryClick(fastestGrowing.category)
      });
    }

    return insights;
  }, [metrics, marketMetrics, isAgencyView, filters.selectedAgency]);

  // Enhanced filtering logic
  const filteredCategoryData = useMemo(() => {
    let filtered = [...(isAgencyView ? metrics.categoryInsights : marketMetrics.categoryInsights)];

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(category =>
        category.category.toLowerCase().includes(search)
      );
    }

    // Apply confidence filter (get confidence from data)
    if (confidenceFilter !== 'all') {
      const categoryConfidence = new Map<string, number[]>();
      data.forEach(job => {
        if (job.primary_category && job.classification_confidence) {
          const existing = categoryConfidence.get(job.primary_category) || [];
          categoryConfidence.set(job.primary_category, [...existing, job.classification_confidence]);
        }
      });

      filtered = filtered.filter(category => {
        const confidences = categoryConfidence.get(category.category) || [];
        const avgConfidence = confidences.length > 0
          ? confidences.reduce((sum: number, conf: number) => sum + conf, 0) / confidences.length
          : 50;

        switch (confidenceFilter) {
          case 'high': return avgConfidence >= 70;
          case 'medium': return avgConfidence >= 40 && avgConfidence < 70;
          case 'low': return avgConfidence < 40;
          default: return true;
        }
      });
    }

    // Apply category selection filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(category =>
        selectedCategories.includes(category.category)
      );
    }

    return filtered;
  }, [metrics.categoryInsights, marketMetrics.categoryInsights, isAgencyView, searchTerm, confidenceFilter, selectedCategories, data]);

  // Market leadership analysis
  const marketLeadership = useMemo(() => {
    return marketMetrics.categoryInsights.slice(0, 8).map(category => {
      const topAgency = category.agencies?.[0];
      let ourShare = 0;

      if (isAgencyView && filters.selectedAgency) {
        const ourAgencyData = category.agencies.find((a: any) => a.agency === filters.selectedAgency);
        ourShare = ourAgencyData?.percentage || 0;
      }

      return {
        category: category.category,
        leader: topAgency?.agency || 'Unknown',
        leaderPercentage: topAgency?.percentage || 0,
        ourShare: isAgencyView ? ourShare : 0,
        totalJobs: category.totalJobs,
        color: getCategoryColor(category.category),
        isOurCategory: isAgencyView && topAgency?.agency === filters.selectedAgency,
        competitive: isAgencyView && ourShare > 0 && ourShare >= (topAgency?.percentage || 0) * 0.7
      };
    });
  }, [marketMetrics.categoryInsights, isAgencyView, filters.selectedAgency]);

  // Chart data preparation
  const categoryChartData = useMemo(() => {
    return metrics.topCategories.slice(0, 8).map(category => ({
      name: category.category,
      value: category.count,
      percentage: category.percentage,
      color: getCategoryColor(category.category)
    }));
  }, [metrics.topCategories]);

  // Calculate 4-week period comparison for categories
  const categoryTrends = useMemo(() => {
    const now = new Date();
    const fourWeeksAgo = subWeeks(now, 4);
    const eightWeeksAgo = subWeeks(now, 8);

    const recentCounts = new Map<string, number>();
    const previousCounts = new Map<string, number>();

    data.forEach(job => {
      try {
        const postingDate = parseISO(job.posting_date);
        const category = job.primary_category;

        if (postingDate >= fourWeeksAgo) {
          recentCounts.set(category, (recentCounts.get(category) || 0) + 1);
        } else if (postingDate >= eightWeeksAgo) {
          previousCounts.set(category, (previousCounts.get(category) || 0) + 1);
        }
      } catch { /* skip */ }
    });

    const trends = new Map<string, { current: number; previous: number; growth: number; trend: 'up' | 'down' | 'stable' }>();
    
    const allCategories = new Set([...recentCounts.keys(), ...previousCounts.keys()]);
    allCategories.forEach(category => {
      const current = recentCounts.get(category) || 0;
      const previous = previousCounts.get(category) || 0;
      const growth = previous > 0 ? ((current - previous) / previous) * 100 : (current > 0 ? 100 : 0);
      const trend = Math.abs(growth) < 5 ? 'stable' : growth > 0 ? 'up' : 'down';
      
      trends.set(category, { current, previous, growth, trend });
    });

    // Summary stats
    const growing = Array.from(trends.entries())
      .filter(([, t]) => t.trend === 'up')
      .sort((a, b) => b[1].growth - a[1].growth)
      .slice(0, 3);
    
    const declining = Array.from(trends.entries())
      .filter(([, t]) => t.trend === 'down')
      .sort((a, b) => a[1].growth - b[1].growth)
      .slice(0, 3);

    return {
      trends,
      growing,
      declining,
      periodLabel: `${format(fourWeeksAgo, 'MMM d')} - ${format(now, 'MMM d')} vs prior 4 weeks`
    };
  }, [data]);

  const getInsightStyle = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-200 bg-green-50 text-green-800';
      case 'warning': return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'info': return 'border-blue-200 bg-blue-50 text-blue-800';
      default: return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  // Export functionality
  const exportCategoryReport = () => {
    const exportData = filteredCategoryData.map(category => ({
      Category: category.category,
      'Total Jobs': category.totalJobs,
      'Market Share (%)': ((category.totalJobs / (isAgencyView ? marketMetrics.totalJobs : metrics.totalJobs)) * 100).toFixed(2),
      'Leading Agency': category.leadingAgency,
      'Growth Rate (%)': category.growthRate.toFixed(1),
      'Skill Demand': category.skillDemand,
      'Recent Appearances': category.recentAppearances
    }));

    // Add category analytics summary
    const summary = [
      ['Category Intelligence Report'],
      [`Generated: ${new Date().toLocaleDateString()}`],
      [`View: ${isAgencyView ? `${filters.selectedAgency} Agency View` : 'Market Overview'}`],
      [`Total Categories: ${filteredCategoryData.length}`],
      [`Filters Applied: ${[confidenceFilter !== 'all', selectedCategories.length > 0, searchTerm.trim()].filter(Boolean).length}`],
      [''],
      ['Category Details:']
    ];

    const csvContent = [
      ...summary.map(row => row.join(',')),
      ['Category', 'Total Jobs', 'Market Share (%)', 'Leading Agency', 'Growth Rate (%)', 'Skill Demand', 'Recent Appearances'].join(','),
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `category_intelligence_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to get timeframe label
  const getTimeframeLabel = () => {
    switch (filters.timeRange) {
      case '3months': return 'Last 3 Months';
      case '6months': return 'Last 6 Months';
      case '1year': return 'Last 12 Months';
      default: return 'All Available Data';
    }
  };

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="bg-white rounded-lg border border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-indigo-600" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">Category Intelligence</h2>
              <p className="text-xs text-gray-500">
                {isAgencyView ? 'Portfolio & positioning' : 'Market-wide analysis'} — <span className="font-medium">{getTimeframeLabel()}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors text-xs font-medium ${
                showFilters ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
              {(confidenceFilter !== 'all' || selectedCategories.length > 0 || searchTerm.trim()) && (
                <span className="bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5">
                  {[confidenceFilter !== 'all', selectedCategories.length > 0, searchTerm.trim()].filter(Boolean).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setComparisonOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-xs font-medium"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Compare
            </button>
            <button
              onClick={exportCategoryReport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-xs font-medium"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Recent Trends - Clearly labeled as rolling 4-week comparison */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm font-semibold text-gray-800">Recent Trends</span>
            <span className="text-xs text-gray-500">— Last 4 weeks vs prior 4 weeks</span>
          </div>
          <div className="text-[10px] text-gray-400">
            {categoryTrends.growing.length} growing • {categoryTrends.declining.length} declining
          </div>
        </div>
        
        <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top Growing */}
          <div className="border border-green-100 rounded-lg p-3 bg-green-50/50">
            <div className="flex items-center gap-1.5 mb-2">
              <ArrowUp className="h-3.5 w-3.5 text-green-600" />
              <span className="text-xs font-semibold text-green-700">Fastest Growing</span>
            </div>
            <div className="space-y-1.5">
              {categoryTrends.growing.slice(0, 3).map(([category, trend]) => (
                <div 
                  key={category} 
                  className="flex items-center justify-between cursor-pointer hover:bg-green-100 rounded px-2 py-1 -mx-1"
                  onClick={() => handleCategoryClick(category)}
                >
                  <span className="text-xs text-gray-700 truncate flex-1 mr-2">
                    {category.length > 25 ? category.slice(0, 25) + '...' : category}
                  </span>
                  <span className="text-xs font-bold text-green-600">+{trend.growth.toFixed(0)}%</span>
                </div>
              ))}
              {categoryTrends.growing.length === 0 && (
                <span className="text-xs text-gray-400 italic">No significant growth</span>
            )}
          </div>
          </div>

          {/* Top Declining */}
          <div className="border border-orange-100 rounded-lg p-3 bg-orange-50/50">
            <div className="flex items-center gap-1.5 mb-2">
              <ArrowDown className="h-3.5 w-3.5 text-orange-600" />
              <span className="text-xs font-semibold text-orange-700">Declining</span>
            </div>
            <div className="space-y-1.5">
              {categoryTrends.declining.slice(0, 3).map(([category, trend]) => (
                <div 
                  key={category} 
                  className="flex items-center justify-between cursor-pointer hover:bg-orange-100 rounded px-2 py-1 -mx-1"
                  onClick={() => handleCategoryClick(category)}
                >
                  <span className="text-xs text-gray-700 truncate flex-1 mr-2">
                    {category.length > 25 ? category.slice(0, 25) + '...' : category}
                  </span>
                  <span className="text-xs font-bold text-orange-600">{trend.growth.toFixed(0)}%</span>
                </div>
              ))}
              {categoryTrends.declining.length === 0 && (
                <span className="text-xs text-gray-400 italic">No significant decline</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Compact Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Search */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Category name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 w-full text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Confidence Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Confidence</label>
              <select
                value={confidenceFilter}
                onChange={(e) => setConfidenceFilter(e.target.value as any)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Levels</option>
                <option value="high">High (≥70%)</option>
                <option value="medium">Medium (40-69%)</option>
                <option value="low">Low (&lt;40%)</option>
              </select>
            </div>

            {/* Category Multi-Select */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Categories</label>
              <select
                onChange={(e) => {
                  const category = e.target.value;
                  if (category && !selectedCategories.includes(category)) {
                    setSelectedCategories(prev => [...prev, category]);
                  }
                  e.target.value = '';
                }}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Add category...</option>
                {JOB_CLASSIFICATION_DICTIONARY.map(cat => (
                  <option key={cat.id} value={cat.name} disabled={selectedCategories.includes(cat.name)}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {selectedCategories.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {selectedCategories.map(category => (
                    <span key={category} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] rounded">
                      {category.length > 15 ? category.slice(0, 15) + '...' : category}
                      <button onClick={() => setSelectedCategories(prev => prev.filter(c => c !== category))} className="hover:text-blue-600">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between items-center">
            <span className="text-xs text-gray-500">
              {filteredCategoryData.length} shown
              {filteredCategoryData.length !== (isAgencyView ? metrics.categoryInsights : marketMetrics.categoryInsights).length &&
                ` / ${(isAgencyView ? metrics.categoryInsights : marketMetrics.categoryInsights).length}`
              }
            </span>
            <button
              onClick={() => { setSearchTerm(''); setConfidenceFilter('all'); setSelectedCategories([]); }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Key Insights - Compact horizontal strip */}
      <div className="flex items-stretch gap-3 overflow-x-auto pb-1">
        {keyInsights.map((insight, index) => (
          <div
            key={index}
            className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border ${getInsightStyle(insight.type)} ${
              insight.action ? 'cursor-pointer hover:shadow-sm transition-shadow' : ''
            }`}
            onClick={insight.action}
          >
            <div className="p-1.5 bg-white/50 rounded flex-shrink-0">
              {React.cloneElement(insight.icon as React.ReactElement, { className: 'h-4 w-4' })}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-xs">{insight.title}</h3>
              <p className="text-[10px] opacity-80 truncate max-w-[180px]">{insight.description}</p>
            </div>
            {insight.action && <span className="text-[10px] opacity-60">→</span>}
          </div>
        ))}
      </div>

      {/* Main Analytics Grid - COMPACT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category Distribution Chart */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              {isAgencyView ? 'Portfolio Distribution' : 'Market Distribution'}
            </h3>
            <span className="text-[10px] text-gray-400">{categoryChartData.length} categories</span>
          </div>

          <div className="p-3">
            {categoryChartData.length > 0 ? (
              <PieChart
                data={categoryChartData}
                height={220}
                showLabels={true}
                onSliceClick={(data) => handleCategoryClick(data.name)}
                className="cursor-pointer"
              />
            ) : (
              <div className="flex items-center justify-center h-48 text-gray-500">
                <div className="text-center">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No data</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Market Position Analysis */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-2.5 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">
              {isAgencyView ? 'Competitive Position' : 'Market Leaders'}
            </h3>
          </div>

          <div className="p-3 max-h-[280px] overflow-y-auto">
            <div className="space-y-2">
              {marketLeadership.map((item) => {
                const trend = categoryTrends.trends.get(item.category);
                return (
                  <div
                    key={item.category}
                    className={`p-2.5 rounded border transition-all cursor-pointer hover:shadow-sm ${
                      item.isOurCategory ? 'border-blue-200 bg-blue-50' : 'border-gray-100 hover:border-gray-200'
                    }`}
                    onClick={() => handleCategoryClick(item.category)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-gray-900 truncate flex items-center gap-1">
                            {item.category.length > 20 ? item.category.slice(0, 20) + '...' : item.category}
                            {item.isOurCategory && <span className="text-blue-600">👑</span>}
                          </div>
                          <div className="text-[10px] text-gray-500">{item.totalJobs} jobs • {item.leader.slice(0, 10)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {trend && trend.trend !== 'stable' && (
                          <span className={`text-[10px] font-medium ${trend.trend === 'up' ? 'text-green-600' : 'text-orange-500'}`}>
                            {trend.trend === 'up' ? '+' : ''}{trend.growth.toFixed(0)}%
                          </span>
                        )}
                        <span className="text-xs font-semibold text-gray-700">{item.leaderPercentage.toFixed(0)}%</span>
                      </div>
                    </div>
                    {isAgencyView && item.ourShare > 0 && (
                      <div className="mt-1.5 pt-1.5 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-[10px] text-gray-500">Our share:</span>
                        <span className="text-[10px] font-medium text-blue-600">{item.ourShare.toFixed(1)}%</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* BCG Matrix - COMPACT */}
      {categoryAnalytics?.matrix && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-2.5 border-b border-gray-200 flex items-center gap-2">
            <Target className="h-4 w-4 text-purple-600" />
            <h3 className="text-sm font-semibold text-gray-900">BCG Matrix</h3>
            <span className="text-[10px] text-gray-400 ml-auto">Strategic positioning</span>
          </div>
          <div className="p-3">
            <BCGMatrixChart matrix={categoryAnalytics.matrix} />
            <div className="mt-3 grid grid-cols-4 gap-2">
              <div className="p-1.5 bg-yellow-50 border border-yellow-200 rounded text-center">
                <div className="text-[10px] font-semibold text-yellow-800">⭐ Stars</div>
              </div>
              <div className="p-1.5 bg-blue-50 border border-blue-200 rounded text-center">
                <div className="text-[10px] font-semibold text-blue-800">❓ Questions</div>
              </div>
              <div className="p-1.5 bg-green-50 border border-green-200 rounded text-center">
                <div className="text-[10px] font-semibold text-green-800">💰 Cash Cows</div>
              </div>
              <div className="p-1.5 bg-gray-50 border border-gray-200 rounded text-center">
                <div className="text-[10px] font-semibold text-gray-800">🐕 Dogs</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Evolution - COMPACT */}
      {categoryAnalytics?.evolution && categoryAnalytics.evolution.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-semibold text-gray-900">Evolution Timeline</h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTimePeriod('month')}
                className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
                  timePeriod === 'month' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setTimePeriod('quarter')}
                className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
                  timePeriod === 'quarter' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Quarterly
              </button>
            </div>
          </div>
          <div className="p-3">
            <CategoryEvolutionChart evolution={categoryAnalytics.evolution} />
          </div>
        </div>
      )}

      {/* Detailed Category Table - COMPACT */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-900">Category Deep Dive</h3>
          </div>
          <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Click to explore →</span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {isAgencyView ? 'Our Jobs' : 'Total Jobs'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Market Share
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leading Agency
                </th>
                {isAgencyView && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Our Position
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Growth Trend
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCategoryData
                .slice(0, 15)
                .map(category => {
                  let ourAgencyData: any = null;
                  if (isAgencyView && filters.selectedAgency) {
                    ourAgencyData = category.agencies.find((a: any) => a.agency === filters.selectedAgency) || null;
                  }

                  return (
                    <tr
                      key={category.category}
                      className={`${ourAgencyData && ourAgencyData.percentage > 10 ? 'bg-blue-50' : ''
                        } hover:bg-gray-50 cursor-pointer group transition-colors`}
                      onClick={() => handleCategoryClick(category.category)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getCategoryColor(category.category) }}
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                              {category.category}
                              {ourAgencyData && ourAgencyData.percentage > 20 && <span className="text-blue-600">👑</span>}
                              <Eye className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="text-xs text-gray-500">
                              {isAgencyView
                                ? `${((category.totalJobs / marketMetrics.totalJobs) * 100).toFixed(1)}% of total market`
                                : `${((category.totalJobs / metrics.totalJobs) * 100).toFixed(1)}% of all jobs`
                              }
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {category.totalJobs.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {((category.totalJobs / (isAgencyView ? marketMetrics.totalJobs : metrics.totalJobs)) * 100).toFixed(1)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{category.leadingAgency}</div>
                      </td>
                      {isAgencyView && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {ourAgencyData ? (
                            <div className="text-sm">
                              <span className="font-medium text-blue-600">
                                {ourAgencyData.percentage.toFixed(1)}%
                              </span>
                              <div className="text-xs text-gray-500">
                                {ourAgencyData.count} jobs
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">Not active</span>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${category.growthRate > 10 ? 'text-green-600' :
                            category.growthRate < -10 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                          {category.growthRate > 0 ? '+' : ''}{category.growthRate.toFixed(0)}%
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Emerging Categories */}
      {metrics.emergingCategories.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Emerging Categories
            </h3>
            <p className="text-sm text-gray-600 mt-1">Fast-growing areas showing significant momentum</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics.emergingCategories.map((category, index) => (
                <div
                  key={category.category}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleCategoryClick(category.category)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getCategoryColor(category.category) }}
                      />
                      <span className="font-medium text-sm text-gray-900">{category.category}</span>
                    </div>
                    {category.isNew && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        NEW
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-green-600 font-semibold text-sm">
                      +{category.growthRate.toFixed(0)}% growth
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    {category.isNew ? 'First appeared in recent months' : 'Showing strong upward trend'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Category Drill-Down Modal */}
      <CategoryDrillDown
        isOpen={drillDownOpen}
        onClose={() => setDrillDownOpen(false)}
        categoryId={drillDownCategoryId}
        data={data}
        filters={filters}
        agencyName={isAgencyView ? filters.selectedAgency : undefined}
      />

      {/* Category Comparison Modal */}
      <CategoryComparison
        isOpen={comparisonOpen}
        onClose={() => setComparisonOpen(false)}
        data={data}
      />
    </div>
  );
};

export default CategoryInsights;