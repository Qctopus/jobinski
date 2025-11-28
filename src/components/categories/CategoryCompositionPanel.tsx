/**
 * Category Composition Panel
 * 
 * Shows category distribution with peer/market comparison.
 * Uses neutral language - "composition" not "market share".
 */

import React from 'react';
import { BarChart3, AlertCircle, Info } from 'lucide-react';

interface CategoryCompositionData {
  category: string;
  yourPercentage: number;
  yourCount?: number;
  peerPercentage: number;
  marketPercentage: number;
  deviation: 'significantly_higher' | 'higher' | 'similar' | 'lower' | 'significantly_lower';
}

interface CategoryCompositionPanelProps {
  yourMix: Array<{ category: string; percentage: number; count: number }>;
  peerMix: Array<{ category: string; percentage: number; count: number }>;
  marketMix: Array<{ category: string; percentage: number; count: number }>;
  deviations: CategoryCompositionData[];
  isAgencyView: boolean;
  agencyName?: string;
  peerGroupName?: string;
  onCategoryClick?: (category: string) => void;
}

const CategoryCompositionPanel: React.FC<CategoryCompositionPanelProps> = ({
  yourMix,
  peerMix,
  marketMix,
  deviations,
  isAgencyView,
  agencyName,
  peerGroupName,
  onCategoryClick
}) => {
  // Filter to show only significant categories
  const significantDeviations = deviations
    .filter(d => d.yourPercentage > 1 || d.peerPercentage > 1)
    .slice(0, 12);

  // Separate into notable deviations
  const abovePeers = significantDeviations
    .filter(d => d.deviation === 'significantly_higher' || d.deviation === 'higher')
    .slice(0, 4);
  
  const belowPeers = significantDeviations
    .filter(d => d.deviation === 'significantly_lower' || d.deviation === 'lower')
    .slice(0, 4);

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-indigo-500" />
          <h3 className="text-sm font-semibold text-gray-900">Category Composition</h3>
          {isAgencyView && peerGroupName && (
            <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
              vs {peerGroupName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            {isAgencyView ? 'You' : 'Top Categories'}
          </span>
          {isAgencyView && (
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
              Peer Avg
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* Main distribution comparison */}
        <div className="space-y-3 mb-6">
          {(isAgencyView ? yourMix : marketMix).slice(0, 8).map(item => {
            const peerItem = peerMix.find(p => p.category === item.category);
            const peerPct = peerItem?.percentage || 0;
            
            return (
              <div 
                key={item.category}
                className="group cursor-pointer"
                onClick={() => onCategoryClick?.(item.category)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-700 group-hover:text-blue-600 transition-colors truncate max-w-[200px]">
                    {item.category}
                  </span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-semibold text-gray-900">{item.percentage.toFixed(1)}%</span>
                    {isAgencyView && (
                      <span className="text-gray-400">vs {peerPct.toFixed(1)}%</span>
                    )}
                  </div>
                </div>
                
                {/* Comparison bar */}
                <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="absolute h-full bg-blue-500 rounded-full transition-all group-hover:bg-blue-600"
                    style={{ width: `${Math.min(item.percentage * 2, 100)}%` }}
                  />
                  {isAgencyView && peerPct > 0 && (
                    <div 
                      className="absolute h-full w-0.5 bg-gray-400"
                      style={{ left: `${Math.min(peerPct * 2, 100)}%` }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Deviation insights - only for agency view */}
        {isAgencyView && (abovePeers.length > 0 || belowPeers.length > 0) && (
          <div className="pt-4 border-t border-gray-100">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-1">
              <Info className="h-3 w-3" />
              Composition Insights
            </h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Over-indexed */}
              {abovePeers.length > 0 && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                  <div className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide mb-2">
                    💡 You Focus More On
                  </div>
                  <div className="space-y-1.5">
                    {abovePeers.map(d => (
                      <div 
                        key={d.category}
                        className="flex items-center justify-between text-xs cursor-pointer hover:bg-blue-100 rounded px-1 -mx-1"
                        onClick={() => onCategoryClick?.(d.category)}
                      >
                        <span className="text-gray-700 truncate max-w-[150px]">
                          {d.category}
                        </span>
                        <span className="text-blue-600 font-medium">
                          +{(d.yourPercentage - d.peerPercentage).toFixed(0)}pp
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-blue-600 mt-2 italic">
                    May reflect mandate priorities or strategic focus
                  </p>
                </div>
              )}

              {/* Under-indexed */}
              {belowPeers.length > 0 && (
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                  <div className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide mb-2">
                    ⚠️ Lower Than Peers
                  </div>
                  <div className="space-y-1.5">
                    {belowPeers.map(d => (
                      <div 
                        key={d.category}
                        className="flex items-center justify-between text-xs cursor-pointer hover:bg-amber-100 rounded px-1 -mx-1"
                        onClick={() => onCategoryClick?.(d.category)}
                      >
                        <span className="text-gray-700 truncate max-w-[150px]">
                          {d.category}
                        </span>
                        <span className="text-amber-600 font-medium">
                          {(d.yourPercentage - d.peerPercentage).toFixed(0)}pp
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-amber-600 mt-2 italic">
                    Review if this reflects mandate or potential gap
                  </p>
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <div className="mt-3 flex items-start gap-2 text-[10px] text-gray-500">
              <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>
                Differences from peer averages are not inherently good or bad—they may reflect 
                your unique mandate, programme priorities, or organizational structure.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryCompositionPanel;

