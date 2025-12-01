/**
 * CategorySection - Category analysis with tables
 */

import React from 'react';
import { Layers, TrendingUp, TrendingDown, Crown, Clock } from 'lucide-react';
import { CategoryMetrics } from '../../../services/analytics/IntelligenceBriefEngine';
import { HorizontalBars, ComparisonTable, formatters, TrendIndicator } from './shared';

interface CategorySectionProps {
  data: CategoryMetrics;
  agencyName?: string;
}

export const CategorySection: React.FC<CategorySectionProps> = ({ data, agencyName }) => {
  const narrative = generateNarrative(data, agencyName);

  // Category distribution with growth indicators
  const categoryBarsData = data.topCategories.slice(0, 8).map(cat => ({
    label: cat.name,
    value: cat.count,
    percentage: cat.percentage,
    color: cat.growthRate > 30 ? '#10B981' : cat.growthRate < -20 ? '#EF4444' : '#3B82F6',
    previousPercentage: cat.previousCount > 0 ? (cat.previousCount / (data.topCategories.reduce((s, c) => s + c.previousCount, 0) || 1)) * 100 : undefined
  }));

  // Competitive position table columns
  const competitiveColumns = [
    { key: 'name', header: 'Category', align: 'left' as const, width: '25%' },
    { key: 'totalJobs', header: 'Jobs', align: 'right' as const, format: formatters.number },
    { key: 'leader', header: 'Leader', align: 'left' as const, format: (v: string) => (
      <span className="flex items-center gap-1">
        <Crown className="h-3 w-3 text-amber-500" />
        {v}
      </span>
    )},
    { key: 'leaderShare', header: 'Share', align: 'right' as const, format: formatters.percent },
    { key: 'second', header: '#2', align: 'left' as const },
    { key: 'secondShare', header: 'Share', align: 'right' as const, format: formatters.percent },
    { key: 'gap', header: 'Gap', align: 'right' as const, format: formatters.gap }
  ];

  // Application window table columns
  const windowColumns = [
    { key: 'name', header: 'Category', align: 'left' as const },
    { key: 'avgWindow', header: 'Avg Window', align: 'right' as const, format: formatters.days },
    { key: 'marketAvg', header: 'Market', align: 'right' as const, format: formatters.days },
    { key: 'assessment', header: 'Assessment', align: 'left' as const, format: (v: string) => (
      <span className={`text-xs px-2 py-0.5 rounded ${
        v.includes('Faster') ? 'bg-emerald-50 text-emerald-700' :
        v.includes('Slower') ? 'bg-red-50 text-red-700' :
        'bg-gray-50 text-gray-600'
      }`}>
        {v}
      </span>
    )}
  ];

  return (
    <section className="px-6 py-5 border-b border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="h-5 w-5 text-indigo-500" />
        <h2 className="text-lg font-semibold text-gray-900">Category Intelligence</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Category Distribution Bars */}
        <div className="lg:col-span-2 bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Category Distribution
          </h3>
          <HorizontalBars 
            data={categoryBarsData}
            showChange={true}
            barHeight={24}
          />
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-emerald-500" />
              <span>Growing &gt;30%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span>Stable</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500" />
              <span>Declining</span>
            </div>
          </div>
        </div>

        {/* Narrative + Quick Stats */}
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed text-sm">{narrative}</p>

          <div className="bg-indigo-50 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-indigo-600 uppercase mb-2">Concentration</h4>
            <div className="text-2xl font-bold text-indigo-900">{data.concentration.top3Share.toFixed(0)}%</div>
            <div className="text-xs text-indigo-600">Top 3 categories</div>
            {Math.abs(data.concentration.top3Share - data.concentration.previousTop3Share) > 3 && (
              <TrendIndicator 
                value={data.concentration.top3Share - data.concentration.previousTop3Share} 
                format="pp" 
                size="sm" 
              />
            )}
          </div>

          {/* Growing/Declining Summary */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-emerald-50 rounded-lg p-2">
              <div className="flex items-center gap-1 text-xs text-emerald-600 mb-1">
                <TrendingUp className="h-3 w-3" />
                Growing
              </div>
              {data.fastestGrowing.slice(0, 2).map((cat, i) => (
                <div key={i} className="text-xs text-gray-700 truncate">
                  {cat.name} <span className="text-emerald-600">+{cat.growthRate.toFixed(0)}%</span>
                </div>
              ))}
            </div>
            <div className="bg-red-50 rounded-lg p-2">
              <div className="flex items-center gap-1 text-xs text-red-600 mb-1">
                <TrendingDown className="h-3 w-3" />
                Declining
              </div>
              {data.declining.slice(0, 2).map((cat, i) => (
                <div key={i} className="text-xs text-gray-700 truncate">
                  {cat.name} <span className="text-red-600">-{cat.declineRate.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Competitive Position Table */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Crown className="h-4 w-4 text-amber-500" />
          Competitive Position by Category
        </h3>
        <p className="text-xs text-gray-500 mb-2">
          Who leads each category and by how much?
        </p>
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <ComparisonTable 
            columns={competitiveColumns}
            data={data.competitivePosition}
            striped
            compact
          />
        </div>
      </div>

      {/* Application Windows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Application Windows by Category
          </h3>
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <ComparisonTable 
              columns={windowColumns}
              data={data.applicationWindows.filter(w => w.avgWindow > 0)}
              striped
              compact
            />
          </div>
        </div>

        {/* Top Categories Detail */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Top Categories Detail</h3>
          <div className="space-y-2">
            {data.topCategories.slice(0, 5).map((cat, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{cat.name}</div>
                  <div className="text-xs text-gray-500">
                    {cat.count} positions • {cat.percentage.toFixed(0)}% of total
                  </div>
                </div>
                <div className="text-right">
                  <TrendIndicator value={cat.growthRate} size="sm" />
                  {agencyName && cat.yourRank && (
                    <div className="text-xs text-gray-500 mt-1">
                      Your rank: #{cat.yourRank} ({cat.yourShare.toFixed(0)}%)
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

function generateNarrative(data: CategoryMetrics, agencyName?: string): string {
  const top = data.topCategories[0];
  if (!top) return 'No category data available.';
  
  let narrative = `${top.name} dominates at ${top.percentage.toFixed(0)}% of volume (${top.count.toLocaleString()} positions)`;
  
  if (top.growthRate > 50) {
    narrative += `, growing from ${top.previousCount} in the prior period`;
  }
  narrative += '.';
  
  // Leadership context
  narrative += ` ${top.marketLeader} leads this category with ${top.leaderShare.toFixed(0)}% share`;
  
  const second = data.competitivePosition.find(c => c.category === top.id);
  if (second && second.gap < 5) {
    narrative += `, closely followed by ${second.second} (${second.secondShare.toFixed(0)}%)`;
  }
  narrative += '.';
  
  // Tightest competition
  const closest = data.competitivePosition.find(c => c.gap < 3 && c.gap > 0);
  if (closest) {
    narrative += ` The tightest competition is in ${closest.name}, where ${closest.leader} leads by just ${closest.gap.toFixed(0)}pp.`;
  }
  
  return narrative;
}

