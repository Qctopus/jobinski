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
  Brain, TrendingUp, Download, Filter, 
  ArrowUp, ArrowDown, AlertCircle, Clock, Zap, MapPin, Users, Calendar, ChevronDown, Eye
} from 'lucide-react';
import { DashboardMetrics, ProcessedJobData, FilterOptions } from '../types';
import { JOB_CLASSIFICATION_DICTIONARY } from '../dictionary';
import { getAgencyPeerGroup, getPeerAgencies } from '../config/peerGroups';
import { getAgencyLogo } from '../utils/agencyLogos';
import { SurgeDetector } from '../services/analytics/SurgeDetector';
import { CategoryShiftAnalyzer } from '../services/analytics/CategoryShiftAnalyzer';
import { parseISO, subWeeks, subMonths, format } from 'date-fns';
import { useTimeframe } from '../contexts/TimeframeContext';

// Components
import MandateAlignmentSummary from './categories/MandateAlignmentSummary';
import CategoryCompositionPanel from './categories/CategoryCompositionPanel';
import CategoryDrillDown from './CategoryDrillDown';
import CategoryEvolutionChart from './categories/CategoryEvolutionChart';
import AgencyCategoryDominance from './categories/AgencyCategoryDominance';
import AgencyCategoryProfile from './categories/AgencyCategoryProfile';
import CategoryActivityInsights from './categories/CategoryActivityInsights';

// Helper to get beautiful category name and color from dictionary
const getCategoryInfo = (categoryIdOrName: string) => {
  // Try to find by id first, then by name
  const cat = JOB_CLASSIFICATION_DICTIONARY.find(
    c => c.id === categoryIdOrName || c.name === categoryIdOrName
  );
  if (cat) {
    return { name: cat.name, color: cat.color, id: cat.id };
  }
  // Fallback: convert slug to title case
  const fallbackName = categoryIdOrName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(' And ', ' & ');
  return { name: fallbackName, color: '#6B7280', id: categoryIdOrName };
};

interface CategoryInsightsProps {
  metrics: DashboardMetrics;
  marketMetrics: DashboardMetrics;
  data: ProcessedJobData[];
  filters: FilterOptions;
  isAgencyView: boolean;
}

// getPeriodBoundaries removed - now using global timeframe context

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
  const [shiftPeriod, setShiftPeriod] = useState<12 | 6 | 3>(6);

  // Use global timeframe context
  const { primaryPeriod, comparisonPeriod: contextComparisonPeriod } = useTimeframe();

  const agencyName = isAgencyView ? filters.selectedAgency : null;
  const peerAgencies = useMemo(() => agencyName ? getPeerAgencies(agencyName) : [], [agencyName]);
  const peerGroupInfo = useMemo(() => agencyName ? getAgencyPeerGroup(agencyName) : null, [agencyName]);

  // Calculate period boundaries from global timeframe
  const periodBoundaries = useMemo(() => ({
    currentStart: primaryPeriod.start,
    currentEnd: primaryPeriod.end,
    previousStart: contextComparisonPeriod?.start || primaryPeriod.start,
    previousEnd: contextComparisonPeriod?.end || primaryPeriod.start,
    currentLabel: `${format(primaryPeriod.start, 'MMM d')} - ${format(primaryPeriod.end, 'MMM d')}`,
    previousLabel: contextComparisonPeriod 
      ? `${format(contextComparisonPeriod.start, 'MMM d')} - ${format(contextComparisonPeriod.end, 'MMM d')}`
      : 'No comparison'
  }), [primaryPeriod, contextComparisonPeriod]);

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
    <div className="space-y-4">
      {/* Header - Matching Intelligence tab style */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isAgencyView && agencyName ? (
            getAgencyLogo(agencyName) ? (
              <img src={getAgencyLogo(agencyName)!} alt={agencyName} className="h-5 w-5 object-contain" />
            ) : (
              <Brain className="h-4 w-4 text-blue-600" />
            )
          ) : (
            <img src="/logo/logo/United_Nations.png" alt="UN System" className="h-5 w-5 object-contain" />
          )}
          <div>
            <span className="text-sm font-semibold text-gray-800">Category Analysis</span>
            <span className="text-xs text-gray-500 ml-2">
              {isAgencyView ? `${agencyName} composition` : 'UN System hiring patterns'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded transition-colors ${
              showFilters ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
            title="Chart options"
          >
            <Filter className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={exportReport}
            className="p-1.5 rounded text-gray-400 hover:text-gray-600 transition-colors"
            title="Export data"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      
      {/* Period Context - now controlled by global filter */}
      <div className="text-xs text-gray-500 flex items-center gap-4 px-1">
        <span>{recentTrends.currentTotalCount.toLocaleString()} jobs in current period</span>
        {contextComparisonPeriod && (
          <>
            <span>•</span>
            <span><span className="font-medium text-gray-500">Trends compare to:</span> {periodBoundaries.previousLabel}</span>
          </>
        )}
      </div>

      {/* Collapsible options */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-6">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Evolution Chart Period</label>
              <div className="flex gap-1">
                {([3, 6, 12] as const).map((months) => (
                  <button
                    key={months}
                    onClick={() => setShiftPeriod(months)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      shiftPeriod === months
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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

      {/* Data Warning - Harmonized */}
      {!recentTrends.hasPreviousData && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center gap-4">
          <div className="p-2 bg-amber-100 rounded-lg">
            <AlertCircle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800">Limited comparison data</p>
            <p className="text-sm text-amber-600">No data available for the previous period. Trends shown for current period only.</p>
          </div>
        </div>
      )}

      {/* Category Trends - Harmonized Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Growing Categories */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-green-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500 rounded-lg shadow-sm">
                  <ArrowUp className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-emerald-900">Growing</h3>
                  <p className="text-xs text-emerald-600">{recentTrends.growing.length} categories up</p>
                </div>
              </div>
              <div className="text-xs text-emerald-600 bg-white/60 px-2 py-1 rounded-lg">
                vs prior period
              </div>
            </div>
          </div>
          <div className="p-4 space-y-2">
            {recentTrends.growing.slice(0, 4).map(([category, trend]) => {
              const catInfo = getCategoryInfo(category);
              return (
                <div 
                  key={category} 
                  className="flex items-center justify-between bg-gray-50 hover:bg-emerald-50 rounded-lg px-4 py-3 cursor-pointer transition-colors group"
                  onClick={() => handleCategoryClick(category)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: catInfo.color }}
                    />
                    <span className="text-sm font-medium text-gray-800 truncate group-hover:text-emerald-700">
                      {catInfo.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 tabular-nums">{trend.current}</span>
                    <span className="text-sm font-bold text-emerald-600 tabular-nums bg-emerald-100 px-2 py-0.5 rounded">
                      +{trend.growth.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
            {recentTrends.growing.length === 0 && (
              <div className="text-center py-6 text-sm text-gray-400">
                No significant growth in this period
              </div>
            )}
          </div>
        </div>

        {/* Declining Categories */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500 rounded-lg shadow-sm">
                  <ArrowDown className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-amber-900">Declining</h3>
                  <p className="text-xs text-amber-600">{recentTrends.declining.length} categories down</p>
                </div>
              </div>
              <div className="text-xs text-amber-600 bg-white/60 px-2 py-1 rounded-lg">
                vs prior period
              </div>
            </div>
          </div>
          <div className="p-4 space-y-2">
            {recentTrends.declining.slice(0, 4).map(([category, trend]) => {
              const catInfo = getCategoryInfo(category);
              return (
                <div 
                  key={category} 
                  className="flex items-center justify-between bg-gray-50 hover:bg-amber-50 rounded-lg px-4 py-3 cursor-pointer transition-colors group"
                  onClick={() => handleCategoryClick(category)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: catInfo.color }}
                    />
                    <span className="text-sm font-medium text-gray-800 truncate group-hover:text-amber-700">
                      {catInfo.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 tabular-nums">{trend.current}</span>
                    <span className="text-sm font-bold text-amber-600 tabular-nums bg-amber-100 px-2 py-0.5 rounded">
                      {trend.growth.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
            {recentTrends.declining.length === 0 && (
              <div className="text-center py-6 text-sm text-gray-400">
                No significant decline in this period
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Activity & Insights - Replaces Hiring Surge Alerts + Category Details */}
      <CategoryActivityInsights
        data={data}
        isAgencyView={isAgencyView}
        agencyName={agencyName || undefined}
        onCategoryClick={handleCategoryClick}
      />

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

      {/* Agency Category Dominance - Only shown in market view */}
      {!isAgencyView && (
        <AgencyCategoryDominance
          data={data}
          isAgencyView={isAgencyView}
          selectedAgency={agencyName || undefined}
        />
      )}

      {/* Agency Category Profile - Only shown in agency view */}
      {isAgencyView && agencyName && (
        <AgencyCategoryProfile
          agencyData={data.filter(j => (j.short_agency || j.long_agency) === agencyName)}
          marketData={data}
          agencyName={agencyName}
        />
      )}

      {/* Category Shift Narrative - Harmonized */}
      {shiftAnalysis.narrativeInsight && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-500" />
            <h3 className="text-base font-semibold text-gray-900">Category Evolution</h3>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full ml-2">
              {shiftPeriod} months
            </span>
          </div>
          <div className="p-5">
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              {shiftAnalysis.narrativeInsight}
            </p>
            {(shiftAnalysis.topGrowing.length > 0 || shiftAnalysis.topDeclining.length > 0) && (
              <div className="flex flex-wrap gap-2">
                {shiftAnalysis.topGrowing.slice(0, 3).map(shift => {
                  const catInfo = getCategoryInfo(shift.category);
                  return (
                    <button 
                      key={shift.category}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg cursor-pointer hover:bg-emerald-100 transition-colors"
                      onClick={() => handleCategoryClick(shift.category)}
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: catInfo.color }} />
                      <span className="truncate max-w-[120px]">{catInfo.name}</span>
                      <span className="font-semibold">+{shift.percentagePointChange.toFixed(0)}pp</span>
                    </button>
                  );
                })}
                {shiftAnalysis.topDeclining.slice(0, 2).map(shift => {
                  const catInfo = getCategoryInfo(shift.category);
                  return (
                    <button 
                      key={shift.category}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors"
                      onClick={() => handleCategoryClick(shift.category)}
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: catInfo.color }} />
                      <span className="truncate max-w-[120px]">{catInfo.name}</span>
                      <span className="font-semibold">{shift.percentagePointChange.toFixed(0)}pp</span>
                    </button>
                  );
                })}
              </div>
            )}
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

