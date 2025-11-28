import React from 'react';
import { CompetitiveEvolution } from '../../services/analytics/CompetitiveEvolutionTracker';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MarketShareEvolutionChartProps {
  evolution: CompetitiveEvolution[];
  height?: number;
  highlightAgency?: string;
}

/**
 * Market Share Evolution Chart
 * Shows how agencies' market share has changed over time
 * Phase 2 Tab 4 implementation
 */
export const MarketShareEvolutionChart: React.FC<MarketShareEvolutionChartProps> = ({
  evolution,
  height = 400,
  highlightAgency
}) => {
  // Transform data for stacked area chart
  const periods = evolution[0]?.timeline.map(t => t.period) || [];
  
  const chartData = periods.map(period => {
    const dataPoint: any = { period };
    evolution.forEach(agency => {
      const timePoint = agency.timeline.find(t => t.period === period);
      dataPoint[agency.agency] = timePoint?.market_share || 0;
    });
    return dataPoint;
  });
  
  // Generate colors for agencies
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16'
  ];
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      // Sort by market share
      const sorted = [...payload].sort((a, b) => b.value - a.value);
      
      return (
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4 shadow-lg max-h-96 overflow-y-auto">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          <div className="space-y-1">
            {sorted.map((entry, index) => (
              <div key={index} className="flex items-center justify-between gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className={`${entry.dataKey === highlightAgency ? 'font-bold' : ''}`}>
                    {entry.dataKey}
                  </span>
                </div>
                <span className="font-semibold">{entry.value.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="bg-white rounded-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Market Share Evolution</h3>
        <p className="text-sm text-gray-600">
          How agency market share has changed over time (stacked view shows total market composition)
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="period" 
            tick={{ fontSize: 12 }}
            stroke="#6B7280"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="#6B7280"
            label={{ value: 'Market Share (%)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6B7280' } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ fontSize: '12px' }}
            iconType="square"
          />
          
          {evolution.map((agency, index) => (
            <Area
              key={agency.agency}
              type="monotone"
              dataKey={agency.agency}
              stackId="1"
              stroke={colors[index % colors.length]}
              fill={colors[index % colors.length]}
              fillOpacity={agency.agency === highlightAgency ? 0.8 : 0.6}
              strokeWidth={agency.agency === highlightAgency ? 3 : 1}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
      
      {/* Key insights */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {(() => {
          const latest = chartData[chartData.length - 1];
          const agencies = evolution.map(e => ({
            agency: e.agency,
            currentShare: latest?.[e.agency] || 0,
            momentum: e.timeline[e.timeline.length - 1]?.momentum || 'steady'
          })).sort((a, b) => b.currentShare - a.currentShare);
          
          const leader = agencies[0];
          const accelerating = agencies.filter(a => a.momentum === 'accelerating');
          const decelerating = agencies.filter(a => a.momentum === 'decelerating');
          
          return (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm text-blue-700 mb-1">Market Leader</div>
                <div className="text-lg font-bold text-blue-900 truncate" title={leader?.agency}>
                  {leader?.agency || 'N/A'}
                </div>
                <div className="text-sm text-blue-600 mt-1">
                  {leader?.currentShare.toFixed(1)}% market share
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-sm text-green-700 mb-1">Accelerating</div>
                <div className="text-2xl font-bold text-green-900">
                  {accelerating.length}
                </div>
                <div className="text-xs text-green-600 mt-1">
                  {accelerating.length > 0 ? `${accelerating[0].agency}${accelerating.length > 1 ? ' +' + (accelerating.length - 1) : ''}` : 'None'}
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-sm text-red-700 mb-1">Decelerating</div>
                <div className="text-2xl font-bold text-red-900">
                  {decelerating.length}
                </div>
                <div className="text-xs text-red-600 mt-1">
                  {decelerating.length > 0 ? `${decelerating[0].agency}${decelerating.length > 1 ? ' +' + (decelerating.length - 1) : ''}` : 'None'}
                </div>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
};

export default MarketShareEvolutionChart;




