import React from 'react';
import { TalentWarZone } from '../../services/analytics/CompetitiveEvolutionTracker';
import { Flame, Target, Shield, TrendingDown } from 'lucide-react';

interface TalentWarZonesHeatmapProps {
  warZones: TalentWarZone[];
  onCategoryClick?: (category: string) => void;
  limit?: number;
}

/**
 * Talent War Zones Heatmap
 * Shows competitive intensity by category
 * Phase 2 Tab 4 implementation
 */
export const TalentWarZonesHeatmap: React.FC<TalentWarZonesHeatmapProps> = ({
  warZones,
  onCategoryClick,
  limit = 15
}) => {
  const getIntensityColor = (intensity: number) => {
    if (intensity >= 8) return { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-700', icon: 'text-red-600' };
    if (intensity >= 6) return { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-700', icon: 'text-orange-600' };
    if (intensity >= 4) return { bg: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-700', icon: 'text-yellow-600' };
    return { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-700', icon: 'text-green-600' };
  };
  
  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'attack': return <Target className="h-5 w-5" />;
      case 'defend': return <Shield className="h-5 w-5" />;
      case 'maintain': return <Flame className="h-5 w-5" />;
      case 'exit': return <TrendingDown className="h-5 w-5" />;
      default: return <Flame className="h-5 w-5" />;
    }
  };
  
  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'attack': return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Attack' };
      case 'defend': return { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Defend' };
      case 'maintain': return { bg: 'bg-green-100', text: 'text-green-700', label: 'Maintain' };
      case 'exit': return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Exit' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Unknown' };
    }
  };
  
  const displayedZones = warZones.slice(0, limit);
  
  return (
    <div className="bg-white rounded-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Talent War Zones</h3>
        <p className="text-sm text-gray-600">
          Categories with highest competition intensity (top {limit})
        </p>
      </div>
      
      <div className="space-y-3">
        {displayedZones.map(zone => {
          const intensityColors = getIntensityColor(zone.competition_intensity);
          const recommendationColors = getRecommendationColor(zone.strategic_recommendation);
          const RecommendationIcon = () => getRecommendationIcon(zone.strategic_recommendation);
          
          return (
            <div
              key={zone.category}
              onClick={() => onCategoryClick?.(zone.category)}
              className={`border-2 ${intensityColors.border} ${intensityColors.bg} rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 mb-1">{zone.category}</h4>
                  <div className="flex items-center gap-3 text-sm">
                    <span className={`font-semibold ${intensityColors.text}`}>
                      Intensity: {zone.competition_intensity.toFixed(1)}/10
                    </span>
                    <span className="text-gray-600">
                      {zone.agencies_competing} agencies
                    </span>
                  </div>
                </div>
                
                <div className={`px-3 py-1 rounded-lg ${recommendationColors.bg} flex items-center gap-2`}>
                  <RecommendationIcon />
                  <span className={`text-sm font-semibold ${recommendationColors.text}`}>
                    {recommendationColors.label}
                  </span>
                </div>
              </div>
              
              {/* Market leader */}
              <div className="mb-3 pb-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-600">Market Leader</span>
                    <div className="font-semibold text-gray-900">{zone.leader.agency}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-600">Share</span>
                    <div className="font-semibold text-gray-900">{zone.leader.market_share.toFixed(1)}%</div>
                  </div>
                </div>
              </div>
              
              {/* Your position */}
              {zone.your_position.rank > 0 && (
                <div className="mb-3 pb-3 border-b border-gray-200">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <span className="text-xs text-gray-600">Your Rank</span>
                      <div className="font-semibold text-gray-900">#{zone.your_position.rank}</div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-600">Your Share</span>
                      <div className="font-semibold text-gray-900">{zone.your_position.market_share.toFixed(1)}%</div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-600">Trend</span>
                      <div className={`font-semibold ${
                        zone.your_position.trend === 'gaining' ? 'text-green-600' :
                        zone.your_position.trend === 'losing' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {zone.your_position.trend === 'gaining' ? '↗' : zone.your_position.trend === 'losing' ? '↘' : '→'}
                        {' '}{zone.your_position.trend}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Recent activity */}
              {(zone.recent_entries.length > 0 || zone.recent_exits.length > 0) && (
                <div className="grid grid-cols-2 gap-4 text-xs">
                  {zone.recent_entries.length > 0 && (
                    <div>
                      <span className="text-gray-600">Recent Entries:</span>
                      <div className="text-green-700 font-medium mt-1">
                        {zone.recent_entries.slice(0, 2).join(', ')}
                        {zone.recent_entries.length > 2 && ` +${zone.recent_entries.length - 2}`}
                      </div>
                    </div>
                  )}
                  {zone.recent_exits.length > 0 && (
                    <div>
                      <span className="text-gray-600">Recent Exits:</span>
                      <div className="text-red-700 font-medium mt-1">
                        {zone.recent_exits.slice(0, 2).join(', ')}
                        {zone.recent_exits.length > 2 && ` +${zone.recent_exits.length - 2}`}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="font-semibold text-blue-700">Attack:</span>
            <span className="text-gray-600 ml-1">Invest to gain share</span>
          </div>
          <div>
            <span className="font-semibold text-purple-700">Defend:</span>
            <span className="text-gray-600 ml-1">Protect your position</span>
          </div>
          <div>
            <span className="font-semibold text-green-700">Maintain:</span>
            <span className="text-gray-600 ml-1">Sustain current effort</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Exit:</span>
            <span className="text-gray-600 ml-1">Consider withdrawal</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TalentWarZonesHeatmap;




