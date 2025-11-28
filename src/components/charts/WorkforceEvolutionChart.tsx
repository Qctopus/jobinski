import React from 'react';
import { WorkforceCompositionTimeline } from '../../services/analytics/WorkforceAnalyzer';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface WorkforceEvolutionChartProps {
  timeline: WorkforceCompositionTimeline[];
  metric: 'seniority' | 'location' | 'skills';
  height?: number;
}

/**
 * Workforce Evolution Timeline Chart
 * Shows how workforce composition has changed over time
 * Phase 2 Tab 5 implementation
 */
export const WorkforceEvolutionChart: React.FC<WorkforceEvolutionChartProps> = ({
  timeline,
  metric,
  height = 400
}) => {
  // Transform data based on selected metric
  const chartData = timeline.map(t => {
    const dataPoint: any = { period: t.period };
    
    if (metric === 'seniority') {
      dataPoint.Junior = t.seniority_distribution.junior.percentage;
      dataPoint.Mid = t.seniority_distribution.mid.percentage;
      dataPoint.Senior = t.seniority_distribution.senior.percentage;
      dataPoint.Executive = t.seniority_distribution.executive.percentage;
    } else if (metric === 'location') {
      dataPoint.Headquarters = t.location_mix.headquarters.percentage;
      dataPoint.Field = t.location_mix.field.percentage;
      dataPoint.Regional = t.location_mix.regional.percentage;
      dataPoint['Home-based'] = t.location_mix.home_based.percentage;
    } else if (metric === 'skills') {
      dataPoint.Technical = t.skill_domain_mix.technical.percentage;
      dataPoint.Operational = t.skill_domain_mix.operational.percentage;
      dataPoint.Strategic = t.skill_domain_mix.strategic.percentage;
      dataPoint.Mixed = t.skill_domain_mix.mixed.percentage;
    }
    
    return dataPoint;
  });
  
  const getLines = () => {
    if (metric === 'seniority') {
      return [
        { key: 'Junior', color: '#10B981', name: 'Junior' },
        { key: 'Mid', color: '#3B82F6', name: 'Mid-Level' },
        { key: 'Senior', color: '#F59E0B', name: 'Senior' },
        { key: 'Executive', color: '#EF4444', name: 'Executive' }
      ];
    } else if (metric === 'location') {
      return [
        { key: 'Headquarters', color: '#3B82F6', name: 'Headquarters' },
        { key: 'Field', color: '#10B981', name: 'Field' },
        { key: 'Regional', color: '#F59E0B', name: 'Regional' },
        { key: 'Home-based', color: '#8B5CF6', name: 'Home-based' }
      ];
    } else {
      return [
        { key: 'Technical', color: '#3B82F6', name: 'Technical' },
        { key: 'Operational', color: '#10B981', name: 'Operational' },
        { key: 'Strategic', color: '#F59E0B', name: 'Strategic' },
        { key: 'Mixed', color: '#8B5CF6', name: 'Mixed' }
      ];
    }
  };
  
  const lines = getLines();
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const sorted = [...payload].sort((a, b) => b.value - a.value);
      
      return (
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4 shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          <div className="space-y-1">
            {sorted.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span>{entry.name}</span>
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
  
  const getTitle = () => {
    if (metric === 'seniority') return 'Seniority Mix Evolution';
    if (metric === 'location') return 'Location Strategy Evolution';
    return 'Skill Domain Evolution';
  };
  
  return (
    <div className="bg-white rounded-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">{getTitle()}</h3>
        <p className="text-sm text-gray-600">
          How workforce composition has changed over time (percentage of total)
        </p>
      </div>
      
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="period" 
            tick={{ fontSize: 12 }}
            stroke="#6B7280"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="#6B7280"
            label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6B7280' } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ fontSize: '14px' }}
            iconType="line"
          />
          
          {lines.map(line => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              stroke={line.color}
              strokeWidth={3}
              name={line.name}
              dot={{ fill: line.color, r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      
      {/* Key insights */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {(() => {
          const latest = chartData[chartData.length - 1];
          const earliest = chartData[0];
          
          if (!latest || !earliest) return null;
          
          const sortedLatest = lines
            .map(l => ({ name: l.name, value: latest[l.key] || 0 }))
            .sort((a, b) => b.value - a.value);
          
          const biggestChange = lines
            .map(l => ({
              name: l.name,
              change: (latest[l.key] || 0) - (earliest[l.key] || 0)
            }))
            .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))[0];
          
          return (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm text-blue-700 mb-1">Current Leader</div>
                <div className="text-lg font-bold text-blue-900">{sortedLatest[0].name}</div>
                <div className="text-sm text-blue-600 mt-1">
                  {sortedLatest[0].value.toFixed(1)}% of workforce
                </div>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="text-sm text-purple-700 mb-1">Biggest Shift</div>
                <div className="text-lg font-bold text-purple-900">{biggestChange.name}</div>
                <div className={`text-sm mt-1 ${
                  biggestChange.change > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {biggestChange.change > 0 ? '↗' : '↘'} {Math.abs(biggestChange.change).toFixed(1)}% change
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-sm text-green-700 mb-1">Diversity Score</div>
                <div className="text-2xl font-bold text-green-900">
                  {(() => {
                    // Calculate entropy for diversity
                    const values = lines.map(l => latest[l.key] || 0);
                    let entropy = 0;
                    values.forEach(v => {
                      if (v > 0) entropy -= (v/100) * Math.log2(v/100);
                    });
                    return (entropy * 50).toFixed(0); // Scale to 0-100
                  })()}
                </div>
                <div className="text-xs text-green-600 mt-1">
                  Higher = more balanced
                </div>
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
};

export default WorkforceEvolutionChart;




