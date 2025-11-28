import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { CategoryEvolution } from '../../services/analytics/CategoryEvolutionAnalyzer';

interface CategoryEvolutionChartProps {
  evolution: CategoryEvolution[];
  onCategoryClick?: (category: string) => void;
  limit?: number;
}

/**
 * Category Evolution Timeline Chart
 * Shows how categories have evolved over time
 * Phase 2 Tab 2 implementation
 */
export const CategoryEvolutionChart: React.FC<CategoryEvolutionChartProps> = ({ 
  evolution, 
  onCategoryClick,
  limit = 10 
}) => {
  // Sort by current volume (most recent period)
  const sortedEvolution = [...evolution]
    .map(e => ({
      ...e,
      currentVolume: e.timeline.length > 0 ? e.timeline[e.timeline.length - 1].job_count : 0
    }))
    .sort((a, b) => b.currentVolume - a.currentVolume)
    .slice(0, limit);
  
  const getStatusColor = (status: string) => {
    const colors = {
      emerging: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-300' },
      core: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300' },
      mature: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-300' },
      declining: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-300' }
    };
    return colors[status as keyof typeof colors] || colors.mature;
  };
  
  const getIntensityColor = (intensity: string) => {
    const colors = {
      low: 'text-green-600',
      medium: 'text-yellow-600',
      high: 'text-red-600'
    };
    return colors[intensity as keyof typeof colors] || colors.medium;
  };
  
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'growing': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'stable': return <Minus className="h-4 w-4 text-gray-600" />;
      default: return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };
  
  return (
    <div className="bg-white rounded-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Category Evolution Timeline</h3>
        <p className="text-sm text-gray-600">
          How categories have changed over time (top {limit} by volume)
        </p>
      </div>
      
      <div className="space-y-4">
        {sortedEvolution.map(category => {
          const statusColors = getStatusColor(category.strategic_status);
          const recentPeriods = category.timeline.slice(-6); // Last 6 periods
          const latestPeriod = recentPeriods[recentPeriods.length - 1];
          
          return (
            <div 
              key={category.category}
              onClick={() => onCategoryClick?.(category.category)}
              className={`border-2 ${statusColors.border} ${statusColors.bg} rounded-xl p-4 hover:shadow-lg transition-all cursor-pointer`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-gray-900 truncate">{category.category}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors.bg} ${statusColors.text} border ${statusColors.border}`}>
                      {category.strategic_status}
                    </span>
                    <span className={`text-xs font-semibold ${getIntensityColor(category.competitive_intensity)}`}>
                      {category.competitive_intensity} competition
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{latestPeriod?.job_count || 0}</div>
                  <div className="text-xs text-gray-600">current</div>
                </div>
              </div>
              
              {/* Timeline */}
              <div className="mb-3">
                <div className="flex items-end gap-1 h-16">
                  {recentPeriods.map((period, index) => {
                    const maxVolume = Math.max(...recentPeriods.map(p => p.job_count));
                    const height = maxVolume > 0 ? (period.job_count / maxVolume) * 100 : 10;
                    const barColor = 
                      period.trend === 'growing' ? 'bg-green-500' :
                      period.trend === 'declining' ? 'bg-red-500' :
                      'bg-gray-400';
                    
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-1">
                        <div 
                          className={`w-full ${barColor} rounded-t transition-all hover:opacity-80`}
                          style={{ height: `${height}%` }}
                          title={`${period.period}: ${period.job_count} jobs (${period.market_share}% share)`}
                        />
                        <div className="text-xs text-gray-500 truncate w-full text-center">
                          {period.period.split('-')[1] || period.period.slice(-2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Trend Summary */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {getTrendIcon(latestPeriod?.trend || 'stable')}
                  <span className="text-gray-700 capitalize">{latestPeriod?.trend || 'stable'} trend</span>
                </div>
                <div className="text-gray-600">
                  <span className="font-semibold">{latestPeriod?.market_share || 0}%</span> market share
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="font-semibold text-purple-700">Emerging:</span>
            <span className="text-gray-600 ml-1">New or rapidly growing</span>
          </div>
          <div>
            <span className="font-semibold text-blue-700">Core:</span>
            <span className="text-gray-600 ml-1">Established growth areas</span>
          </div>
          <div>
            <span className="font-semibold text-green-700">Mature:</span>
            <span className="text-gray-600 ml-1">Stable, high volume</span>
          </div>
          <div>
            <span className="font-semibold text-red-700">Declining:</span>
            <span className="text-gray-600 ml-1">Reduced activity</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryEvolutionChart;




