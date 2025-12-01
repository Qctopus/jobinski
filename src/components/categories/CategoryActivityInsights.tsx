/**
 * Category Activity & Insights
 * 
 * Combined view of category details and hiring surges.
 * Provides actionable insights for both market and agency views.
 */

import React, { useMemo, useState } from 'react';
import { 
  Zap, MapPin, TrendingUp, TrendingDown, Clock, Users, Building2,
  ArrowUp, ArrowDown, AlertCircle, Target, Eye, Filter, Flame
} from 'lucide-react';
import { ProcessedJobData } from '../../types';
import { JOB_CLASSIFICATION_DICTIONARY } from '../../dictionary';
import { getAgencyLogo } from '../../utils/agencyLogos';
import { SurgeDetector, HiringSurge } from '../../services/analytics/SurgeDetector';

interface CategoryActivityInsightsProps {
  data: ProcessedJobData[];
  isAgencyView: boolean;
  agencyName?: string;
  onCategoryClick?: (category: string) => void;
}

const getCategoryInfo = (categoryId: string) => {
  const cat = JOB_CLASSIFICATION_DICTIONARY.find(c => c.id === categoryId || c.name === categoryId);
  return {
    name: cat?.name || categoryId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    color: cat?.color || '#6B7280',
    id: cat?.id || categoryId
  };
};

type ViewFilter = 'all' | 'hot' | 'growing' | 'declining' | 'slow-fill';

const CategoryActivityInsights: React.FC<CategoryActivityInsightsProps> = ({
  data,
  isAgencyView,
  agencyName,
  onCategoryClick
}) => {
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');

  // Analyze categories with surge detection
  const analysis = useMemo(() => {
    const detector = new SurgeDetector();
    const surgeAnalysis = detector.detectSurges(data, 6);
    
    // Build category stats
    const categoryStats = new Map<string, {
      count: number;
      jobs: ProcessedJobData[];
      longOpen: number;
      agencies: Set<string>;
      grades: Map<string, number>;
      locations: Map<string, number>;
      trend: { current: number; previous: number; growth: number };
    }>();

    // Get date boundaries for trend analysis
    const now = new Date();
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(now.getMonth() - 3);
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    data.forEach(job => {
      const category = job.primary_category || 'Other';
      const agency = job.short_agency || job.long_agency || 'Unknown';
      
      if (!categoryStats.has(category)) {
        categoryStats.set(category, {
          count: 0,
          jobs: [],
          longOpen: 0,
          agencies: new Set(),
          grades: new Map(),
          locations: new Map(),
          trend: { current: 0, previous: 0, growth: 0 }
        });
      }
      
      const stats = categoryStats.get(category)!;
      stats.count++;
      stats.jobs.push(job);
      stats.agencies.add(agency);
      
      if (job.application_window_days > 60) {
        stats.longOpen++;
      }
      
      // Grade tracking
      const grade = job.up_grade || 'Unknown';
      stats.grades.set(grade, (stats.grades.get(grade) || 0) + 1);
      
      // Location tracking
      const location = job.duty_country || job.duty_station || 'Unknown';
      stats.locations.set(location, (stats.locations.get(location) || 0) + 1);
      
      // Trend tracking
      const postDate = new Date(job.posting_date || '');
      if (postDate >= threeMonthsAgo) {
        stats.trend.current++;
      } else if (postDate >= sixMonthsAgo) {
        stats.trend.previous++;
      }
    });

    // Calculate growth rates and enrich with surge data
    const enrichedCategories = Array.from(categoryStats.entries()).map(([category, stats]) => {
      const growth = stats.trend.previous > 0 
        ? ((stats.trend.current - stats.trend.previous) / stats.trend.previous) * 100
        : stats.trend.current > 0 ? 100 : 0;
      
      // Find related surges
      const relatedSurges = surgeAnalysis.surges.filter(s => s.category === category);
      const categorySurge = surgeAnalysis.byCategorysuges.find(s => s.category === category);
      
      // Top grades
      const topGrades = Array.from(stats.grades.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([grade, count]) => ({ grade, count, pct: (count / stats.count) * 100 }));
      
      // Top locations
      const topLocations = Array.from(stats.locations.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([location, count]) => ({ location, count }));
      
      // Is this category "hot" (multiple surges or high growth)
      const isHot = relatedSurges.length >= 2 || growth > 50 || (categorySurge && categorySurge.totalSurge > 2);
      
      return {
        category,
        catInfo: getCategoryInfo(category),
        count: stats.count,
        percentage: (stats.count / data.length) * 100,
        agencyCount: stats.agencies.size,
        topAgencies: Array.from(stats.agencies).slice(0, 5),
        longOpen: stats.longOpen,
        longOpenPct: (stats.longOpen / stats.count) * 100,
        topGrades,
        topLocations,
        growth,
        isGrowing: growth > 10,
        isDeclining: growth < -10,
        isHot,
        surges: relatedSurges,
        categorySurge
      };
    }).sort((a, b) => b.count - a.count);

    return {
      categories: enrichedCategories,
      totalSurges: surgeAnalysis.surges.length,
      hotCategories: enrichedCategories.filter(c => c.isHot).length
    };
  }, [data]);

  // Apply filter
  const filteredCategories = useMemo(() => {
    switch (viewFilter) {
      case 'hot':
        return analysis.categories.filter(c => c.isHot);
      case 'growing':
        return analysis.categories.filter(c => c.isGrowing);
      case 'declining':
        return analysis.categories.filter(c => c.isDeclining);
      case 'slow-fill':
        return analysis.categories.filter(c => c.longOpenPct > 10);
      default:
        return analysis.categories;
    }
  }, [analysis.categories, viewFilter]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header with filter tabs */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-indigo-500" />
            <h3 className="text-sm font-semibold text-gray-800">
              {isAgencyView ? `${agencyName} Category Activity` : 'Market Category Activity'}
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {analysis.hotCategories > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">
                <Flame className="h-3 w-3" />
                {analysis.hotCategories} hot
              </span>
            )}
            <span>{analysis.categories.length} categories</span>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1">
          {[
            { id: 'all', label: 'All', icon: null },
            { id: 'hot', label: 'Hot', icon: <Flame className="h-3 w-3" />, color: 'text-orange-600' },
            { id: 'growing', label: 'Growing', icon: <TrendingUp className="h-3 w-3" />, color: 'text-emerald-600' },
            { id: 'declining', label: 'Declining', icon: <TrendingDown className="h-3 w-3" />, color: 'text-amber-600' },
            { id: 'slow-fill', label: 'Slow-Fill', icon: <Clock className="h-3 w-3" />, color: 'text-red-500' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setViewFilter(tab.id as ViewFilter)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                viewFilter === tab.id 
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200' 
                  : `text-gray-500 hover:text-gray-700 hover:bg-gray-100 ${tab.color || ''}`
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Cards Grid */}
      <div className="p-4">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No categories match the selected filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredCategories.slice(0, 12).map((cat) => (
              <div
                key={cat.category}
                onClick={() => onCategoryClick?.(cat.category)}
                className={`relative bg-white rounded-lg border p-3 cursor-pointer transition-all hover:shadow-md hover:border-gray-300 ${
                  cat.isHot ? 'border-orange-200 bg-orange-50/30' : 'border-gray-200'
                }`}
              >
                {/* Hot badge */}
                {cat.isHot && (
                  <div className="absolute -top-1.5 -right-1.5 flex items-center gap-0.5 px-1.5 py-0.5 bg-orange-500 text-white text-[9px] font-bold rounded-full shadow-sm">
                    <Flame className="h-2.5 w-2.5" />
                    HOT
                  </div>
                )}

                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.catInfo.color }}
                    />
                    <span className="text-sm font-semibold text-gray-800 truncate">
                      {cat.catInfo.name}
                    </span>
                  </div>
                  {(cat.isGrowing || cat.isDeclining) && (
                    <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      cat.isGrowing ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {cat.isGrowing ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
                      {Math.abs(cat.growth).toFixed(0)}%
                    </div>
                  )}
                </div>

                {/* Main stats */}
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold text-gray-900">{cat.count}</span>
                  <span className="text-xs text-gray-500">
                    positions ({cat.percentage.toFixed(1)}%)
                  </span>
                </div>

                {/* Quick info row */}
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                  {!isAgencyView && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {cat.agencyCount} agencies
                    </span>
                  )}
                  {cat.topLocations[0] && (
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="h-3 w-3" />
                      {cat.topLocations[0].location}
                    </span>
                  )}
                </div>

                {/* Grades */}
                {cat.topGrades.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {cat.topGrades.map(g => (
                      <span key={g.grade} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                        {g.grade} <span className="text-gray-400">{g.pct.toFixed(0)}%</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Insights row */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Surge indicator */}
                  {cat.surges.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">
                      <Zap className="h-2.5 w-2.5" />
                      {cat.surges.length} surge{cat.surges.length > 1 ? 's' : ''}
                      {cat.surges[0] && !isAgencyView && (
                        <span className="text-amber-600">({cat.surges[0].agency})</span>
                      )}
                    </div>
                  )}
                  
                  {/* Slow-fill indicator */}
                  {cat.longOpen > 0 && (
                    <div className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded">
                      <Clock className="h-2.5 w-2.5" />
                      {cat.longOpen} slow-fill
                    </div>
                  )}
                </div>

                {/* Market view: Show top hiring agencies */}
                {!isAgencyView && cat.surges.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <div className="text-[10px] text-gray-500 mb-1">Active hiring:</div>
                    <div className="flex items-center gap-1 flex-wrap">
                      {cat.surges.slice(0, 3).map((surge, idx) => (
                        <span 
                          key={idx}
                          className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-gray-50 border border-gray-200 rounded"
                        >
                          {getAgencyLogo(surge.agency) && (
                            <img src={getAgencyLogo(surge.agency)!} alt="" className="h-3 w-3 object-contain" />
                          )}
                          <span className="text-gray-700">{surge.agency}</span>
                          <span className="text-amber-600 font-medium">{surge.surgeMultiplier.toFixed(1)}×</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Agency view: Show competition */}
                {isAgencyView && cat.surges.filter(s => s.agency !== agencyName).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <div className="text-[10px] text-gray-500 mb-1">Competition alert:</div>
                    <div className="flex items-center gap-1 flex-wrap">
                      {cat.surges.filter(s => s.agency !== agencyName).slice(0, 2).map((surge, idx) => (
                        <span 
                          key={idx}
                          className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-red-50 border border-red-200 rounded"
                        >
                          {getAgencyLogo(surge.agency) && (
                            <img src={getAgencyLogo(surge.agency)!} alt="" className="h-3 w-3 object-contain" />
                          )}
                          <span className="text-red-700">{surge.agency} surge</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {filteredCategories.length > 12 && (
          <div className="mt-4 text-center text-xs text-gray-500">
            +{filteredCategories.length - 12} more categories
          </div>
        )}
      </div>

      {/* Summary insights footer */}
      {analysis.totalSurges > 0 && (
        <div className="px-4 py-3 bg-amber-50 border-t border-amber-100">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-amber-800">
              <strong>{analysis.totalSurges} hiring surge{analysis.totalSurges > 1 ? 's' : ''} detected</strong> — 
              {isAgencyView 
                ? ' Watch for talent competition in hot categories. Consider accelerating your recruitment timeline.'
                : ' Multiple agencies showing unusual hiring activity. These categories may indicate new funding or strategic shifts.'
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryActivityInsights;

