/**
 * CategorySection - Fixed BCG matrix size, cleaner layout
 */

import React from 'react';
import { Layers, TrendingUp, TrendingDown, Crown, Clock, Zap, Minus } from 'lucide-react';
import { CategoryMetrics } from '../../../services/analytics/IntelligenceBriefEngine';
import { ComparisonTable, formatters, TrendIndicator } from './shared';

interface CategorySectionProps {
  data: CategoryMetrics;
  agencyName?: string;
}

// Growth badge
const GrowthBadge: React.FC<{ rate: number }> = ({ rate }) => {
  if (rate > 30) return <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700"><TrendingUp className="h-2.5 w-2.5" />+{rate.toFixed(0)}%</span>;
  if (rate > 10) return <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600"><TrendingUp className="h-2.5 w-2.5" />+{rate.toFixed(0)}%</span>;
  if (rate < -20) return <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700"><TrendingDown className="h-2.5 w-2.5" />{rate.toFixed(0)}%</span>;
  if (rate < -5) return <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-600"><TrendingDown className="h-2.5 w-2.5" />{rate.toFixed(0)}%</span>;
  return <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-600"><Minus className="h-2.5 w-2.5" />{rate > 0 ? '+' : ''}{rate.toFixed(0)}%</span>;
};

// Inline bar row with growth
const CategoryRow: React.FC<{
  rank: number; name: string; count: number; percentage: number; maxPct: number; growth: number; color: string;
}> = ({ rank, name, count, percentage, maxPct, growth, color }) => {
  const barWidth = (percentage / maxPct) * 100;
  const borderColor = growth > 30 ? 'border-l-emerald-500' : growth < -20 ? 'border-l-red-500' : 'border-l-blue-500';
  
  return (
    <div className={`relative flex items-center gap-2 px-2 py-1.5 border-l-3 ${borderColor} hover:bg-gray-50 rounded-r`}>
      <div className="absolute inset-y-0 left-0 opacity-10 rounded-r" style={{ width: `${barWidth}%`, backgroundColor: color }} />
      <span className="text-[10px] text-gray-400 w-4 tabular-nums relative z-10">#{rank}</span>
      <span className="w-2 h-2 rounded-full flex-shrink-0 relative z-10" style={{ backgroundColor: color }} />
      <span className="text-xs font-medium text-gray-800 truncate flex-1 relative z-10">{name}</span>
      <span className="text-xs font-semibold text-gray-900 tabular-nums w-10 text-right relative z-10">{count.toLocaleString()}</span>
      <span className="text-[10px] text-gray-500 tabular-nums w-8 text-right relative z-10">{percentage.toFixed(0)}%</span>
      <div className="w-16 relative z-10"><GrowthBadge rate={growth} /></div>
    </div>
  );
};

// Category Momentum Chart - shows hiring trend momentum for each category
const CategoryMomentum: React.FC<{
  categories: Array<{ name: string; share: number; growth: number; count: number; color: string }>;
}> = ({ categories }) => {
  const maxGrowth = Math.max(...categories.map(c => Math.abs(c.growth)), 30);
  const sorted = [...categories].sort((a, b) => b.growth - a.growth);
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 h-full">
      <div className="text-[10px] font-semibold text-gray-600 uppercase mb-2">Hiring Momentum</div>
      <div className="space-y-1.5">
        {sorted.slice(0, 6).map((cat, i) => {
          const barWidth = Math.min(Math.abs(cat.growth) / maxGrowth * 100, 100);
          const isPositive = cat.growth > 0;
          
          return (
            <div key={i} className="group">
              <div className="flex items-center gap-2 text-[10px]">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="text-gray-700 truncate flex-1 max-w-20" title={cat.name}>{cat.name}</span>
                <span className={`font-semibold tabular-nums ${isPositive ? 'text-emerald-600' : cat.growth < -5 ? 'text-red-600' : 'text-gray-500'}`}>
                  {isPositive ? '+' : ''}{cat.growth.toFixed(0)}%
                </span>
              </div>
              {/* Bar */}
              <div className="flex items-center h-2 mt-0.5">
                <div className="w-1/2 flex justify-end">
                  {!isPositive && (
                    <div className="h-1.5 rounded-l bg-red-400 transition-all" style={{ width: `${barWidth}%` }} />
                  )}
                </div>
                <div className="w-px h-3 bg-gray-300 flex-shrink-0" />
                <div className="w-1/2">
                  {isPositive && (
                    <div className="h-1.5 rounded-r bg-emerald-400 transition-all" style={{ width: `${barWidth}%` }} />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[8px] text-gray-400 mt-2">
        <span>← Declining</span>
        <span>Growing →</span>
      </div>
    </div>
  );
};

export const CategorySection: React.FC<CategorySectionProps> = ({ data, agencyName }) => {
  const maxPct = Math.max(...data.topCategories.map(c => c.percentage), 1);
  const colors = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1', '#EF4444', '#14B8A6'];

  const narrative = data.topCategories[0] 
    ? `${data.topCategories[0].name} dominates at ${data.topCategories[0].percentage.toFixed(0)}% of volume.`
    : '';

  const competitiveColumns = [
    { key: 'name', header: 'Category', align: 'left' as const, width: '30%' },
    { key: 'totalJobs', header: 'Jobs', align: 'right' as const, format: formatters.number },
    { key: 'leader', header: 'Leader', align: 'left' as const },
    { key: 'leaderShare', header: '%', align: 'right' as const, format: formatters.percent },
    { key: 'gap', header: 'Gap', align: 'right' as const, format: formatters.gap }
  ];

  const windowColumns = [
    { key: 'name', header: 'Category', align: 'left' as const },
    { key: 'avgWindow', header: 'Window', align: 'right' as const, format: formatters.days },
    { key: 'assessment', header: '', align: 'left' as const, format: (v: string) => (
      <span className={`text-[9px] px-1 py-0.5 rounded ${v?.includes('Faster') ? 'bg-emerald-100 text-emerald-700' : v?.includes('Slower') ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{v}</span>
    )}
  ];

  return (
    <section className="border-b border-gray-200">
      <div className="h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500" />
      
      <div className="px-6 py-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-7 w-7 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Layers className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Category Intelligence</h2>
            <p className="text-xs text-gray-500">{narrative}</p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-3 mb-3">
          {/* Left: Category distribution - more compact */}
          <div className="col-span-5 bg-gray-50 rounded-lg p-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-[10px] font-semibold text-gray-600 uppercase">Category Distribution</h3>
              <div className="flex items-center gap-2 text-[8px]">
                <span className="flex items-center gap-0.5"><span className="w-1.5 h-0.5 bg-emerald-500" /> Growing</span>
                <span className="flex items-center gap-0.5"><span className="w-1.5 h-0.5 bg-amber-500" /> Stable</span>
                <span className="flex items-center gap-0.5"><span className="w-1.5 h-0.5 bg-red-500" /> Declining</span>
              </div>
            </div>
            <div className="space-y-0.5">
              {data.topCategories.slice(0, 8).map((cat, i) => (
                <CategoryRow key={i} rank={i + 1} name={cat.name} count={cat.count} percentage={cat.percentage}
                  maxPct={maxPct} growth={cat.growthRate} color={colors[i % colors.length]} />
              ))}
            </div>
          </div>

          {/* Middle: Momentum Chart - expanded */}
          <div className="col-span-4">
            <CategoryMomentum categories={data.topCategories.slice(0, 8).map((cat, i) => ({
              name: cat.name, share: cat.percentage, growth: cat.growthRate, count: cat.count, color: colors[i % colors.length]
            }))} />
          </div>

          {/* Right: Stats column - tighter */}
          <div className="col-span-3 space-y-2">
            <div className="bg-indigo-50 rounded-lg p-2 border border-indigo-100">
              <div className="text-[9px] font-semibold text-indigo-600 uppercase">Concentration</div>
              <div className="text-lg font-bold text-indigo-900">{data.concentration.top3Share.toFixed(0)}%</div>
              <div className="text-[9px] text-indigo-600">Top 3 categories</div>
              {Math.abs(data.concentration.top3Share - data.concentration.previousTop3Share) > 3 && (
                <TrendIndicator value={data.concentration.top3Share - data.concentration.previousTop3Share} format="pp" size="sm" />
              )}
            </div>
            
            <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-100">
              <div className="text-[9px] font-semibold text-emerald-600 uppercase flex items-center gap-1"><Zap className="h-2.5 w-2.5" /> Fastest Growing</div>
              {data.fastestGrowing.slice(0, 2).map((cat, i) => (
                <div key={i} className="text-[10px] text-gray-700 truncate">
                  {cat.name} <span className="text-emerald-600 font-medium">+{cat.growthRate.toFixed(0)}%</span>
                </div>
              ))}
            </div>
            
            <div className="bg-red-50 rounded-lg p-2 border border-red-100">
              <div className="text-[9px] font-semibold text-red-600 uppercase flex items-center gap-1"><TrendingDown className="h-2.5 w-2.5" /> Declining</div>
              {data.declining.slice(0, 2).map((cat, i) => (
                <div key={i} className="text-[10px] text-gray-700 truncate">
                  {cat.name} <span className="text-red-600 font-medium">-{cat.declineRate.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom: Tables - expanded, no scroll limits */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-[10px] font-semibold text-gray-600 uppercase mb-1.5 flex items-center gap-1">
              <Crown className="h-3 w-3 text-amber-500" /> Competitive Position
            </h3>
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <ComparisonTable columns={competitiveColumns} data={data.competitivePosition.slice(0, 6)} striped compact />
            </div>
          </div>
          <div>
            <h3 className="text-[10px] font-semibold text-gray-600 uppercase mb-1.5 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Application Windows
            </h3>
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <ComparisonTable columns={windowColumns} data={data.applicationWindows.filter(w => w.avgWindow > 0).slice(0, 6)} striped compact />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
