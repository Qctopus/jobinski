/**
 * GeographicSection - Streamlined: removed redundant cards, expanded treemap
 */

import React from 'react';
import { Globe, MapPin, Building2 } from 'lucide-react';
import { GeographicMetrics } from '../../../services/analytics/IntelligenceBriefEngine';
import { ComparisonTable, formatters, TrendIndicator } from './shared';

interface GeographicSectionProps {
  data: GeographicMetrics;
  agencyName?: string;
}

// Improved waffle chart (10x10 grid) - handles all types properly
const WaffleChart: React.FC<{
  data: Array<{ type: string; percentage: number; color: string; change?: number }>;
  size?: number;
}> = ({ data, size = 100 }) => {
  const cellSize = size / 10;
  const cells: { color: string; type: string }[] = [];
  
  // Sort by percentage descending so larger types fill first
  const sortedData = [...data].sort((a, b) => b.percentage - a.percentage);
  
  for (const item of sortedData) {
    // Round, but ensure at least 1 cell for types with >0 count
    const cellCount = item.percentage > 0 ? Math.max(1, Math.round(item.percentage)) : 0;
    for (let i = 0; i < cellCount && cells.length < 100; i++) {
      cells.push({ color: item.color, type: item.type });
    }
  }
  while (cells.length < 100) cells.push({ color: '#E5E7EB', type: 'Empty' });

  return (
    <div className="grid gap-px" style={{ gridTemplateColumns: `repeat(10, ${cellSize - 1}px)`, width: size, height: size }}>
      {cells.map((cell, i) => (
        <div key={i} className="rounded-sm group relative" 
          style={{ backgroundColor: cell.color, width: cellSize - 1, height: cellSize - 1 }}>
          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
            <div className="bg-gray-900 text-white text-[9px] px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap">
              {cell.type}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Full-width treemap - fixed text overlap
const TreemapChart: React.FC<{
  data: Array<{ region: string; percentage: number; count: number }>;
  height?: number;
}> = ({ data, height = 50 }) => {
  const sortedData = [...data].sort((a, b) => b.percentage - a.percentage).slice(0, 6);
  const total = sortedData.reduce((sum, d) => sum + d.percentage, 0);
  const colors = ['#10B981', '#059669', '#047857', '#14B8A6', '#0D9488', '#0F766E'];
  
  return (
    <div className="w-full">
      {/* Treemap bars */}
      <div className="w-full rounded-lg overflow-hidden flex" style={{ height }}>
        {sortedData.map((item, i) => {
          const width = (item.percentage / total) * 100;
          return (
            <div key={i} className="relative group h-full transition-opacity hover:opacity-80"
              style={{ width: `${width}%`, backgroundColor: colors[i % colors.length], minWidth: '2px' }}>
              {/* Tooltip only - no inline text to avoid overlap */}
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap">
                  {item.region}: {item.percentage.toFixed(0)}% ({item.count})
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* Labels below - full region names, no truncation */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
        {sortedData.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
            <span className="text-gray-600">{item.region}</span>
            <span className="font-semibold text-gray-900 tabular-nums">{item.percentage.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const GeographicSection: React.FC<GeographicSectionProps> = ({ data, agencyName }) => {
  const subject = agencyName || 'The market';
  const locationTypes = data.locationTypeDistribution.map(d => ({
    type: d.type, percentage: d.percentage, color: d.color, change: d.change
  }));

  const narrative = `Field positions represent ${data.fieldRatio.toFixed(0)}% of ${agencyName ? subject.toLowerCase() + "'s" : 'market'} hiring.`;

  const categoryFieldColumns = agencyName ? [
    { key: 'categoryName', header: 'Category', align: 'left' as const, width: '45%' },
    { key: 'yourFieldPct', header: 'Field%', align: 'right' as const, format: formatters.percent },
    { key: 'marketFieldPct', header: 'Mkt', align: 'right' as const, format: formatters.percent },
    { key: 'difference', header: 'Δ', align: 'right' as const, format: formatters.gap }
  ] : [
    { key: 'categoryName', header: 'Category', align: 'left' as const, width: '60%' },
    { key: 'yourFieldPct', header: 'Field%', align: 'right' as const, format: formatters.percent }
  ];

  const gradeByLocationColumns = [
    { key: 'locationType', header: 'Location', align: 'left' as const },
    { key: 'seniorPct', header: 'Sr', align: 'right' as const, format: formatters.percent },
    { key: 'midPct', header: 'Mid', align: 'right' as const, format: formatters.percent },
    { key: 'juniorPct', header: 'Jr', align: 'right' as const, format: formatters.percent }
  ];

  return (
    <section className="border-b border-gray-200">
      <div className="h-0.5 bg-gradient-to-r from-green-500 to-emerald-500" />
      
      <div className="px-6 py-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-7 w-7 rounded-lg bg-green-100 flex items-center justify-center">
            <Globe className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Geographic Intelligence</h2>
            <p className="text-xs text-gray-500">{narrative}</p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 mb-4">
          {/* Left: Waffle + Stats */}
          <div className="col-span-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <h3 className="text-[10px] font-semibold text-gray-600 uppercase mb-2">Location Type Mix</h3>
              <div className="flex gap-3">
                <WaffleChart data={locationTypes} size={80} />
                <div className="space-y-1.5 text-[10px]">
                  {/* Show all 4 location types - even if 0% */}
                  {locationTypes.map((t, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: t.color }} />
                      <span className="text-gray-600 min-w-14">{t.type}</span>
                      <span className={`font-semibold tabular-nums ${t.percentage > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                        {t.percentage.toFixed(0)}%
                      </span>
                      {t.change !== undefined && Math.abs(t.change) > 2 && (
                        <span className={`text-[9px] ${t.change > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {t.change > 0 ? '+' : ''}{t.change.toFixed(0)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-[9px] text-gray-400 mt-2">Each cell = 1%</div>
            </div>
            
            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-green-50 rounded p-2 text-center border border-green-100">
                <div className="text-lg font-bold text-green-900">{data.fieldRatio.toFixed(0)}%</div>
                <div className="text-[9px] text-green-600">Field</div>
                {Math.abs(data.fieldRatio - data.previousFieldRatio) > 3 && (
                  <TrendIndicator value={data.fieldRatio - data.previousFieldRatio} format="pp" size="sm" />
                )}
              </div>
              <div className="bg-blue-50 rounded p-2 text-center border border-blue-100">
                <div className="text-lg font-bold text-blue-900">{data.topLocations.length}</div>
                <div className="text-[9px] text-blue-600">Locations</div>
                {data.newLocations.length > 0 && (
                  <span className="text-[9px] text-emerald-600">+{data.newLocations.length} new</span>
                )}
              </div>
            </div>
          </div>

          {/* Middle: Top locations */}
          <div className="col-span-4">
            <h3 className="text-[10px] font-semibold text-gray-600 uppercase mb-2 flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Top Locations
            </h3>
            <div className="bg-gray-50 rounded-lg p-2 max-h-44 overflow-y-auto space-y-0.5">
              {data.topLocations.slice(0, 8).map((loc, i) => {
                const lower = loc.location.toLowerCase();
                const isHQ = lower.includes('new york') || lower.includes('geneva') || lower.includes('rome') || lower.includes('vienna');
                const isRemote = lower.includes('home') || lower.includes('remote');
                const badge = isHQ ? 'HQ' : isRemote ? 'REM' : 'FLD';
                const badgeClass = isHQ ? 'bg-blue-100 text-blue-700' : isRemote ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700';
                
                return (
                  <div key={i} className="flex items-center justify-between text-xs bg-white rounded px-2 py-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-400 w-3 tabular-nums">{i + 1}</span>
                      <span className={`text-[8px] font-medium px-1 py-0.5 rounded ${badgeClass}`}>{badge}</span>
                      <span className="text-gray-700 truncate max-w-24">{loc.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-gray-900 tabular-nums">{loc.count}</span>
                      {loc.change !== 0 && (
                        <span className={`text-[10px] ${loc.change > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {loc.change > 0 ? '+' : ''}{loc.change}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Tables - expanded, no scrollbars */}
          <div className="col-span-5 space-y-3">
            <div>
              <h3 className="text-[10px] font-semibold text-gray-600 uppercase mb-1">Field % by Category</h3>
              <div className="rounded border border-gray-200 overflow-hidden">
                <ComparisonTable columns={categoryFieldColumns} data={data.categoryFieldPatterns.slice(0, 6)} striped compact />
              </div>
            </div>
            <div>
              <h3 className="text-[10px] font-semibold text-gray-600 uppercase mb-1 flex items-center gap-1">
                <Building2 className="h-3 w-3" /> Grade by Location
              </h3>
              <div className="rounded border border-gray-200 overflow-hidden">
                <ComparisonTable columns={gradeByLocationColumns} data={data.gradeByLocationType} striped compact />
              </div>
            </div>
          </div>
        </div>

        {/* Full-width Regional Treemap - more space for labels */}
        {data.regionDistribution.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-3">
            <h3 className="text-[10px] font-semibold text-gray-600 uppercase mb-2 flex items-center gap-1">
              <Globe className="h-3 w-3" /> Regional Distribution
            </h3>
            <TreemapChart data={data.regionDistribution} height={44} />
          </div>
        )}
      </div>
    </section>
  );
};
