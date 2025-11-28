/**
 * Category Composition Panel
 * 
 * Shows category distribution with peer/market comparison.
 * Uses neutral language - "composition" not "market share".
 * Now with proper category colors from dictionary.
 */

import React from 'react';
import { BarChart3, AlertCircle, Info } from 'lucide-react';
import { JOB_CLASSIFICATION_DICTIONARY } from '../../dictionary';

// Helper to get category info from dictionary
const getCategoryInfo = (categoryIdOrName: string) => {
  const cat = JOB_CLASSIFICATION_DICTIONARY.find(
    c => c.id === categoryIdOrName || c.name === categoryIdOrName
  );
  if (cat) return { name: cat.name, color: cat.color, id: cat.id };
  
  const fallbackName = categoryIdOrName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(' And ', ' & ');
  return { name: fallbackName, color: '#6B7280', id: categoryIdOrName };
};

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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-indigo-500" />
          <h3 className="text-base font-semibold text-gray-900">Category Composition</h3>
          {isAgencyView && peerGroupName && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              vs {peerGroupName}
            </span>
          )}
        </div>
        {isAgencyView && (
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"></div>
              You
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-0.5 h-3 bg-gray-400"></div>
              Peer Avg
            </span>
          </div>
        )}
      </div>

      <div className="p-5">
        {/* Main distribution comparison */}
        <div className="space-y-4 mb-6">
          {(isAgencyView ? yourMix : marketMix).slice(0, 10).map(item => {
            const catInfo = getCategoryInfo(item.category);
            const peerItem = peerMix.find(p => p.category === item.category);
            const peerPct = peerItem?.percentage || 0;
            
            return (
              <div 
                key={item.category}
                className="group cursor-pointer"
                onClick={() => onCategoryClick?.(item.category)}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: catInfo.color }}
                    />
                    <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                      {catInfo.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-semibold text-gray-900 tabular-nums">{item.percentage.toFixed(1)}%</span>
                    {isAgencyView && (
                      <span className="text-gray-400 tabular-nums text-xs">({peerPct.toFixed(1)}%)</span>
                    )}
                  </div>
                </div>
                
                {/* Colored comparison bar */}
                <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="absolute h-full rounded-full transition-all group-hover:brightness-110"
                    style={{ 
                      width: `${Math.min(item.percentage * 2.5, 100)}%`,
                      backgroundColor: catInfo.color
                    }}
                  />
                  {isAgencyView && peerPct > 0 && (
                    <div 
                      className="absolute h-full w-1 bg-gray-700 rounded-full opacity-60"
                      style={{ left: `${Math.min(peerPct * 2.5, 100)}%` }}
                      title={`Peer average: ${peerPct.toFixed(1)}%`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Deviation insights - only for agency view */}
        {isAgencyView && (abovePeers.length > 0 || belowPeers.length > 0) && (
          <div className="pt-5 border-t border-gray-100">
            <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Info className="h-4 w-4 text-gray-400" />
              Composition Insights
            </h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Over-indexed */}
              {abovePeers.length > 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                  <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">💡</span>
                    You Focus More On
                  </div>
                  <div className="space-y-2">
                    {abovePeers.map(d => {
                      const catInfo = getCategoryInfo(d.category);
                      return (
                        <div 
                          key={d.category}
                          className="flex items-center justify-between text-sm cursor-pointer hover:bg-white/50 rounded-lg px-2 py-1 -mx-2"
                          onClick={() => onCategoryClick?.(d.category)}
                        >
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: catInfo.color }}
                            />
                            <span className="text-gray-700 truncate max-w-[140px]">
                              {catInfo.name}
                            </span>
                          </div>
                          <span className="text-blue-600 font-semibold">
                            +{(d.yourPercentage - d.peerPercentage).toFixed(0)}pp
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-blue-600/80 mt-3 italic">
                    May reflect mandate priorities
                  </p>
                </div>
              )}

              {/* Under-indexed */}
              {belowPeers.length > 0 && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
                  <div className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <span className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center">⚠️</span>
                    Lower Than Peers
                  </div>
                  <div className="space-y-2">
                    {belowPeers.map(d => {
                      const catInfo = getCategoryInfo(d.category);
                      return (
                        <div 
                          key={d.category}
                          className="flex items-center justify-between text-sm cursor-pointer hover:bg-white/50 rounded-lg px-2 py-1 -mx-2"
                          onClick={() => onCategoryClick?.(d.category)}
                        >
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: catInfo.color }}
                            />
                            <span className="text-gray-700 truncate max-w-[140px]">
                              {catInfo.name}
                            </span>
                          </div>
                          <span className="text-amber-600 font-semibold">
                            {(d.yourPercentage - d.peerPercentage).toFixed(0)}pp
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-amber-600/80 mt-3 italic">
                    Review if this is intentional
                  </p>
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <div className="mt-4 flex items-start gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
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
