/**
 * Categories Tab - UN Workforce Intelligence Hub
 * 
 * A mandate-aligned workforce analytics dashboard for UN agency HR heads.
 * Focus: Composition, alignment, peer benchmarking, and funding signals.
 * 
 * NOT a competitive market analysis tool - a workforce intelligence hub.
 */

import React, { useMemo, useState } from 'react';
import { 
  Brain, TrendingUp, Eye, Download, Filter, 
  ArrowUp, ArrowDown, AlertCircle
} from 'lucide-react';
import { DashboardMetrics, ProcessedJobData, FilterOptions } from '../types';
import { JOB_CLASSIFICATION_DICTIONARY } from '../dictionary';
import { getAgencyPeerGroup, getPeerAgencies } from '../config/peerGroups';
import { SurgeDetector } from '../services/analytics/SurgeDetector';
import { CategoryShiftAnalyzer } from '../services/analytics/CategoryShiftAnalyzer';
import { parseISO, subWeeks, subMonths, format } from 'date-fns';

// Components
import MandateAlignmentSummary from './categories/MandateAlignmentSummary';
import HiringSurgeAlerts from './categories/HiringSurgeAlerts';
import CategoryCompositionPanel from './categories/CategoryCompositionPanel';
import CategoryDrillDown from './CategoryDrillDown';
import CategoryEvolutionChart from './categories/CategoryEvolutionChart';

interface CategoryInsightsProps {
  metrics: DashboardMetrics;
  marketMetrics: DashboardMetrics;
  data: ProcessedJobData[];
  filters: FilterOptions;
  isAgencyView: boolean;
}

// Helper to get period boundaries
const getPeriodBoundaries = (comparisonType: '4weeks' | '8weeks' | '3months') => {
  const now = new Date();
  
  switch (comparisonType) {
    case '4weeks':
      return {
        currentStart: subWeeks(now, 4),
        currentEnd: now,
        previousStart: subWeeks(now, 8),
        previousEnd: subWeeks(now, 4),
        currentLabel: `${format(subWeeks(now, 4), 'MMM d')} - ${format(now, 'MMM d')}`,
        previousLabel: `${format(subWeeks(now, 8), 'MMM d')} - ${format(subWeeks(now, 4), 'MMM d')}`
      };
    case '8weeks':
      return {
        currentStart: subWeeks(now, 8),
        currentEnd: now,
        previousStart: subWeeks(now, 16),
        previousEnd: subWeeks(now, 8),
        currentLabel: `${format(subWeeks(now, 8), 'MMM d')} - ${format(now, 'MMM d')}`,
        previousLabel: `${format(subWeeks(now, 16), 'MMM d')} - ${format(subWeeks(now, 8), 'MMM d')}`
      };
    case '3months':
      return {
        currentStart: subMonths(now, 3),
        currentEnd: now,
        previousStart: subMonths(now, 6),
        previousEnd: subMonths(now, 3),
        currentLabel: `${format(subMonths(now, 3), 'MMM d')} - ${format(now, 'MMM d')}`,
        previousLabel: `${format(subMonths(now, 6), 'MMM d')} - ${format(subMonths(now, 3), 'MMM d')}`
      };
  }
};

const CategoryInsightsNew: React.FC<CategoryInsightsProps> = ({
  metrics,
  marketMetrics,
  data,
  filters,
  isAgencyView
}) => {
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownCategoryId, setDrillDownCategoryId] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [comparisonPeriod, setComparisonPeriod] = useState<'4weeks' | '8weeks' | '3months'>('4weeks');
  const [shiftPeriod, setShiftPeriod] = useState<12 | 6 | 3>(6);

  const agencyName = isAgencyView ? filters.selectedAgency : null;
  const peerAgencies = useMemo(() => agencyName ? getPeerAgencies(agencyName) : [], [agencyName]);
  const peerGroupInfo = useMemo(() => agencyName ? getAgencyPeerGroup(agencyName) : null, [agencyName]);

  // Calculate period boundaries based on comparison period
  const periodBoundaries = useMemo(() => getPeriodBoundaries(comparisonPeriod), [comparisonPeriod]);

  // Surge detection
  const surgeAnalysis = useMemo(() => {
    const detector = new SurgeDetector();
    return detector.detectSurges(data, 6);
  }, [data]);

  // Category shift analysis
  const shiftAnalysis = useMemo(() => {
    const analyzer = new CategoryShiftAnalyzer();
    return analyzer.analyzeShifts(data, agencyName, shiftPeriod);
  }, [data, agencyName, shiftPeriod]);

  // Category comparison data
  const categoryComparison = useMemo(() => {
    const analyzer = new CategoryShiftAnalyzer();
    if (agencyName && peerAgencies.length > 0) {
      return analyzer.compareCategoryMix(data, agencyName, peerAgencies);
    }
    
    // Market view - just show overall distribution
    const counts = new Map<string, number>();
    data.forEach(job => {
      const cat = job.primary_category;
      counts.set(cat, (counts.get(cat) || 0) + 1);
    });
    
    const total = data.length || 1;
    const marketMix = Array.from(counts.entries())
      .map(([category, count]) => ({ category, count, percentage: (count / total) * 100 }))
      .sort((a, b) => b.count - a.count);
    
    return { yourMix: marketMix, peerMix: marketMix, marketMix, deviations: [] };
  }, [data, agencyName, peerAgencies]);

  // Recent trends based on selected comparison period
  const recentTrends = useMemo(() => {
    const { currentStart, currentEnd, previousStart, previousEnd } = periodBoundaries;

    const relevantData = isAgencyView && agencyName
      ? data.filter(job => (job.short_agency || job.long_agency) === agencyName)
      : data;

    const recentCounts = new Map<string, number>();
    const previousCounts = new Map<string, number>();
    let currentTotalCount = 0;
    let previousTotalCount = 0;

    relevantData.forEach(job => {
      try {
        const postingDate = parseISO(job.posting_date);
        const category = job.primary_category;

        if (postingDate >= currentStart && postingDate <= currentEnd) {
          recentCounts.set(category, (recentCounts.get(category) || 0) + 1);
          currentTotalCount++;
        } else if (postingDate >= previousStart && postingDate < previousEnd) {
          previousCounts.set(category, (previousCounts.get(category) || 0) + 1);
          previousTotalCount++;
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

    const growing = Array.from(trends.entries())
      .filter(([, t]) => t.trend === 'up' && t.current >= 3)
      .sort((a, b) => b[1].growth - a[1].growth)
      .slice(0, 4);
    
    const declining = Array.from(trends.entries())
      .filter(([, t]) => t.trend === 'down' && t.previous >= 3)
      .sort((a, b) => a[1].growth - b[1].growth)
      .slice(0, 4);

    return { 
      trends, 
      growing, 
      declining, 
      currentTotalCount, 
      previousTotalCount,
      hasPreviousData: previousTotalCount > 0
    };
  }, [data, isAgencyView, agencyName, periodBoundaries]);

  // Category deep dive data
  const categoryDeepDive = useMemo(() => {
    const relevantData = isAgencyView && agencyName
      ? data.filter(job => (job.short_agency || job.long_agency) === agencyName)
      : data;

    // Count by category
    const categoryCounts = new Map<string, ProcessedJobData[]>();
    relevantData.forEach(job => {
      const cat = job.primary_category;
      if (!categoryCounts.has(cat)) categoryCounts.set(cat, []);
      categoryCounts.get(cat)!.push(job);
    });

    // Market-wide counts for context
    const marketCounts = new Map<string, number>();
    data.forEach(job => {
      const cat = job.primary_category;
      marketCounts.set(cat, (marketCounts.get(cat) || 0) + 1);
    });

    // Build deep dive cards
    const cards = Array.from(categoryCounts.entries())
      .map(([category, jobs]) => {
        const trend = recentTrends.trends.get(category);
        
        // Grade distribution
        const gradeCounts = new Map<string, number>();
        jobs.forEach(job => {
          const grade = job.up_grade || 'Unknown';
          gradeCounts.set(grade, (gradeCounts.get(grade) || 0) + 1);
        });
        const gradeDistribution = Array.from(gradeCounts.entries())
          .map(([grade, count]) => ({ grade, count, percentage: (count / jobs.length) * 100 }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 4);

        // Location distribution
        const locationCounts = new Map<string, number>();
        jobs.forEach(job => {
          const location = job.duty_country || job.duty_station || 'Unknown';
          locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
        });
        const topLocations = Array.from(locationCounts.entries())
          .map(([location, count]) => ({ location, count, percentage: (count / jobs.length) * 100 }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);

        // Positions open long
        const longOpen = jobs.filter(job => job.application_window_days > 60).length;

        // Find related surge
        const relatedSurge = surgeAnalysis.surges.find(s => 
          s.category === category && s.agency !== agencyName
        );

        return {
          category,
          count: jobs.length,
          percentage: (jobs.length / relevantData.length) * 100,
          systemTotal: marketCounts.get(category) || 0,
          trend,
          gradeDistribution,
          topLocations,
          longOpenCount: longOpen,
          relatedSurge,
          color: JOB_CLASSIFICATION_DICTIONARY.find(c => c.name === category)?.color || '#6B7280'
        };
      })
      .sort((a, b) => b.count - a.count);

    return cards;
  }, [data, isAgencyView, agencyName, recentTrends, surgeAnalysis]);

  // Just use categoryDeepDive directly (search removed in favor of comparison period)
  const filteredCategories = categoryDeepDive;

  // Handle category click
  const handleCategoryClick = (categoryName: string) => {
    const category = JOB_CLASSIFICATION_DICTIONARY.find(cat =>
      cat.name === categoryName || cat.id === categoryName
    );
    if (category) {
      setDrillDownCategoryId(category.id);
      setDrillDownOpen(true);
    }
  };

  // Export functionality
  const exportReport = () => {
    const exportData = categoryDeepDive.map(cat => ({
      Category: cat.category,
      'Position Count': cat.count,
      'Share (%)': cat.percentage.toFixed(2),
      'System Total': cat.systemTotal,
      'Trend': cat.trend?.trend || 'N/A',
      'Growth (%)': cat.trend?.growth?.toFixed(1) || 'N/A',
      'Long Open (>60d)': cat.longOpenCount
    }));

    const csvContent = [
      ['Category Composition Report'],
      [`Generated: ${new Date().toLocaleDateString()}`],
      [`View: ${isAgencyView ? agencyName : 'Market Overview'}`],
      [''],
      Object.keys(exportData[0] || {}).join(','),
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `category_composition_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-5">
      {/* Compact Header with Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-indigo-600" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Categories</h2>
            <p className="text-sm text-gray-500">
              {isAgencyView ? `${agencyName} workforce composition` : 'UN System hiring patterns'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Period selector inline */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            {(['4weeks', '8weeks', '3months'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setComparisonPeriod(period)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  comparisonPeriod === period
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {period === '4weeks' ? '4W' : period === '8weeks' ? '8W' : '3M'}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${
              showFilters ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Filter className="h-4 w-4" />
          </button>
          <button
            onClick={exportReport}
            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Evolution period filter - collapsible */}
      {showFilters && (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-6">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Evolution Chart Period</label>
              <div className="flex gap-1">
                {([3, 6, 12] as const).map((months) => (
                  <button
                    key={months}
                    onClick={() => setShiftPeriod(months)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      shiftPeriod === months
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-600 border border-gray-300 hover:border-indigo-400'
                    }`}
                  >
                    {months}M
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visual Summary Dashboard */}
      <MandateAlignmentSummary 
        data={data} 
        agency={agencyName} 
        isAgencyView={isAgencyView}
        periodStart={periodBoundaries.currentStart}
        periodEnd={periodBoundaries.currentEnd}
        periodLabel={periodBoundaries.currentLabel}
      />

      {/* Data Warning if needed */}
      {!recentTrends.hasPreviousData && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Limited comparison data</p>
            <p className="text-xs text-amber-600">No data available for the previous period. Showing current period only.</p>
          </div>
        </div>
      )}

      {/* Category Trends - Visual Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Growing Categories */}
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-5 border border-emerald-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500 rounded-lg">
                <ArrowUp className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-emerald-900">Growing</h3>
                <p className="text-xs text-emerald-600">{recentTrends.growing.length} categories trending up</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {recentTrends.growing.slice(0, 4).map(([category, trend]) => (
              <div 
                key={category} 
                className="flex items-center justify-between bg-white/60 hover:bg-white rounded-lg px-3 py-2 cursor-pointer transition-colors"
                onClick={() => handleCategoryClick(category)}
              >
                <span className="text-sm text-gray-800 truncate flex-1 mr-3">
                  {category.length > 25 ? category.slice(0, 25) + '...' : category}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 tabular-nums">{trend.current}</span>
                  <span className="text-sm font-bold text-emerald-600 tabular-nums">+{trend.growth.toFixed(0)}%</span>
                </div>
              </div>
            ))}
            {recentTrends.growing.length === 0 && (
              <div className="text-center py-4 text-sm text-emerald-600/60">
                No significant growth in this period
              </div>
            )}
          </div>
        </div>

        {/* Declining Categories */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500 rounded-lg">
                <ArrowDown className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-900">Declining</h3>
                <p className="text-xs text-amber-600">{recentTrends.declining.length} categories trending down</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {recentTrends.declining.slice(0, 4).map(([category, trend]) => (
              <div 
                key={category} 
                className="flex items-center justify-between bg-white/60 hover:bg-white rounded-lg px-3 py-2 cursor-pointer transition-colors"
                onClick={() => handleCategoryClick(category)}
              >
                <span className="text-sm text-gray-800 truncate flex-1 mr-3">
                  {category.length > 25 ? category.slice(0, 25) + '...' : category}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 tabular-nums">{trend.current}</span>
                  <span className="text-sm font-bold text-amber-600 tabular-nums">{trend.growth.toFixed(0)}%</span>
                </div>
              </div>
            ))}
            {recentTrends.declining.length === 0 && (
              <div className="text-center py-4 text-sm text-amber-600/60">
                No significant decline in this period
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hiring Surge Alerts */}
      {surgeAnalysis.surges.length > 0 && (
        <HiringSurgeAlerts
          surges={surgeAnalysis.surges}
          categorySurges={surgeAnalysis.byCategorysuges}
          timeframe={surgeAnalysis.timeframe}
          isAgencyView={isAgencyView}
          yourAgency={agencyName || undefined}
        />
      )}

      {/* Category Composition Panel */}
      <CategoryCompositionPanel
        yourMix={categoryComparison.yourMix}
        peerMix={categoryComparison.peerMix}
        marketMix={categoryComparison.marketMix}
        deviations={categoryComparison.deviations}
        isAgencyView={isAgencyView}
        agencyName={agencyName || undefined}
        peerGroupName={peerGroupInfo?.name}
        onCategoryClick={handleCategoryClick}
      />

      {/* Category Shift Narrative */}
      {shiftAnalysis.narrativeInsight && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-1">
                Category Evolution — {shiftPeriod} Month View
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {shiftAnalysis.narrativeInsight}
              </p>
              {shiftAnalysis.topGrowing.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {shiftAnalysis.topGrowing.slice(0, 3).map(shift => (
                    <span 
                      key={shift.category}
                      className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full cursor-pointer hover:bg-green-200"
                      onClick={() => handleCategoryClick(shift.category)}
                    >
                      {shift.category.slice(0, 20)} +{shift.percentagePointChange.toFixed(0)}pp
                    </span>
                  ))}
                  {shiftAnalysis.topDeclining.slice(0, 2).map(shift => (
                    <span 
                      key={shift.category}
                      className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full cursor-pointer hover:bg-amber-200"
                      onClick={() => handleCategoryClick(shift.category)}
                    >
                      {shift.category.slice(0, 20)} {shift.percentagePointChange.toFixed(0)}pp
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Category Evolution Chart (Issue 5) */}
      <CategoryEvolutionChart 
        data={data}
        months={shiftPeriod}
        chartType="line"
        agency={agencyName}
      />

      {/* Category Deep Dive Cards */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-900">Category Details</h3>
          </div>
          <span className="text-[10px] text-gray-400">
            {filteredCategories.length} categories • Click to explore
          </span>
        </div>

        <div className="p-4 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredCategories.slice(0, 12).map(cat => (
            <div
              key={cat.category}
              className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => handleCategoryClick(cat.category)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div 
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600">
                    {cat.category}
                  </span>
                </div>
                {cat.trend && cat.trend.trend !== 'stable' && (
                  <span className={`text-xs font-medium ${cat.trend.trend === 'up' ? 'text-green-600' : 'text-amber-600'}`}>
                    {cat.trend.trend === 'up' ? '+' : ''}{cat.trend.growth.toFixed(0)}%
                  </span>
                )}
              </div>

              <div className="flex items-baseline justify-between mb-2">
                <span className="text-2xl font-bold text-gray-900">{cat.count}</span>
                <span className="text-xs text-gray-500">
                  {cat.percentage.toFixed(1)}% of {isAgencyView ? 'your' : 'all'} positions
                </span>
              </div>

              {/* Grade and location preview */}
              <div className="space-y-1 text-[10px] text-gray-500">
                {cat.gradeDistribution.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Grades:</span>
                    {cat.gradeDistribution.slice(0, 3).map((g, i) => (
                      <span key={g.grade} className="text-gray-600">
                        {g.grade.slice(0, 5)} ({g.percentage.toFixed(0)}%){i < 2 && cat.gradeDistribution.length > i + 1 ? ',' : ''}
                      </span>
                    ))}
                  </div>
                )}
                {cat.topLocations.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-400">Top:</span>
                    <span className="text-gray-600 truncate">{cat.topLocations[0].location}</span>
                  </div>
                )}
              </div>

              {/* Attention flags */}
              {(cat.longOpenCount > 0 || cat.relatedSurge) && (
                <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
                  {cat.longOpenCount > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-600">
                      <AlertCircle className="h-3 w-3" />
                      {cat.longOpenCount} open &gt;60 days
                    </div>
                  )}
                  {cat.relatedSurge && (
                    <div className="flex items-center gap-1 text-[10px] text-blue-600">
                      <TrendingUp className="h-3 w-3" />
                      {cat.relatedSurge.agency} surge ({cat.relatedSurge.surgeMultiplier.toFixed(1)}x)
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredCategories.length > 12 && (
          <div className="px-4 py-3 border-t border-gray-100 text-center">
            <span className="text-xs text-gray-500">
              +{filteredCategories.length - 12} more categories • Use search to filter
            </span>
          </div>
        )}
      </div>

      {/* Category Drill-Down Modal */}
      <CategoryDrillDown
        isOpen={drillDownOpen}
        onClose={() => setDrillDownOpen(false)}
        categoryId={drillDownCategoryId}
        data={data}
        filters={filters}
        agencyName={isAgencyView ? agencyName || undefined : undefined}
      />
    </div>
  );
};

export default CategoryInsightsNew;

