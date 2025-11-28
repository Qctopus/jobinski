import React from 'react';
import { TemporalSnapshot } from '../../utils/temporalAnalysis';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PostedVsOpenChartProps {
  snapshots: TemporalSnapshot[];
  height?: number;
}

/**
 * Jobs Posted vs Jobs Open Chart
 * Shows the difference between new postings and total open positions
 * Phase 2 Tab 3 implementation
 */
export const PostedVsOpenChart: React.FC<PostedVsOpenChartProps> = ({ 
  snapshots, 
  height = 400 
}) => {
  // Format data for the chart
  const chartData = snapshots.map(snapshot => ({
    period: snapshot.period,
    posted: snapshot.jobs_posted,
    open: snapshot.jobs_open,
    closed: snapshot.jobs_closed,
    netChange: snapshot.net_opening_change,
    saturation: snapshot.market_saturation === 'high' ? 'High' : 
                 snapshot.market_saturation === 'low' ? 'Low' : 'Medium'
  }));
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4 shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-blue-600">● Jobs Posted:</span>
              <span className="font-semibold">{data.posted}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-green-600">● Jobs Open:</span>
              <span className="font-semibold">{data.open}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-red-600">● Jobs Closed:</span>
              <span className="font-semibold">{data.closed}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 mt-2 flex items-center justify-between gap-4">
              <span className="text-gray-700">Net Change:</span>
              <span className={`font-semibold ${data.netChange > 0 ? 'text-green-600' : data.netChange < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                {data.netChange > 0 ? '+' : ''}{data.netChange}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-700">Market Saturation:</span>
              <span className={`font-semibold ${
                data.saturation === 'High' ? 'text-red-600' : 
                data.saturation === 'Low' ? 'text-green-600' : 
                'text-yellow-600'
              }`}>
                {data.saturation}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="bg-white rounded-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Jobs Posted vs Jobs Open</h3>
        <p className="text-sm text-gray-600">
          Posted = New job openings that period. Open = Total jobs accepting applications (including from previous periods)
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="period" 
            tick={{ fontSize: 12 }}
            stroke="#6B7280"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#6B7280"
            label={{ value: 'Number of Jobs', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6B7280' } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ fontSize: '14px' }}
            iconType="circle"
          />
          
          {/* Jobs Open (Line) */}
          <Line
            type="monotone"
            dataKey="open"
            stroke="#10B981"
            strokeWidth={3}
            name="Jobs Open (Total)"
            dot={{ fill: '#10B981', r: 4 }}
            activeDot={{ r: 6 }}
          />
          
          {/* Jobs Posted (Bar) */}
          <Bar
            dataKey="posted"
            fill="#3B82F6"
            name="Jobs Posted (New)"
            radius={[8, 8, 0, 0]}
            opacity={0.8}
          />
          
          {/* Jobs Closed (Bar) */}
          <Bar
            dataKey="closed"
            fill="#EF4444"
            name="Jobs Closed"
            radius={[8, 8, 0, 0]}
            opacity={0.6}
          />
        </ComposedChart>
      </ResponsiveContainer>
      
      {/* Key insights */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {(() => {
          const latest = chartData[chartData.length - 1];
          const previous = chartData[chartData.length - 2];
          const avgOpen = chartData.reduce((sum, d) => sum + d.open, 0) / chartData.length;
          const avgPosted = chartData.reduce((sum, d) => sum + d.posted, 0) / chartData.length;
          
          return (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-sm text-green-700 mb-1">Current Open Positions</div>
                <div className="text-2xl font-bold text-green-900">{latest?.open || 0}</div>
                <div className="text-xs text-green-600 mt-1">
                  {previous && latest.open > previous.open 
                    ? `↗ +${latest.open - previous.open} from last period`
                    : previous && latest.open < previous.open
                      ? `↘ ${latest.open - previous.open} from last period`
                      : '→ Stable'}
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm text-blue-700 mb-1">Avg New Postings/Period</div>
                <div className="text-2xl font-bold text-blue-900">{Math.round(avgPosted)}</div>
                <div className="text-xs text-blue-600 mt-1">
                  Latest: {latest?.posted || 0} 
                  ({latest && avgPosted > 0 ? ((latest.posted / avgPosted) * 100).toFixed(0) : 0}% of avg)
                </div>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="text-sm text-purple-700 mb-1">Market Saturation</div>
                <div className="text-2xl font-bold text-purple-900">{latest?.saturation || 'Medium'}</div>
                <div className="text-xs text-purple-600 mt-1">
                  {latest?.open || 0} open vs {Math.round(avgOpen)} avg
                </div>
              </div>
            </>
          );
        })()}
      </div>
      
      {/* Explanation */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Understanding the Difference</h4>
        <div className="text-xs text-gray-700 space-y-1">
          <p>• <strong>Jobs Posted:</strong> Brand new job openings announced in that period</p>
          <p>• <strong>Jobs Open:</strong> Total jobs accepting applications (includes jobs from previous periods still open)</p>
          <p>• <strong>Jobs Closed:</strong> Positions that reached their application deadline</p>
          <p>• <strong>Net Change:</strong> Posted minus Closed (shows if market is expanding or contracting)</p>
        </div>
      </div>
    </div>
  );
};

export default PostedVsOpenChart;




