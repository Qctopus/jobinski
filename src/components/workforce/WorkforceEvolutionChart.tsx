/**
 * Workforce Evolution Chart
 * 
 * Shows how workforce structure is changing over time.
 * Compares current period to previous period.
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend, LineChart, Line, ComposedChart, Area } from 'recharts';
import { WorkforceEvolution, WorkforceShift } from '../../services/analytics/WorkforceStructureAnalyzer';
import { TrendingUp, TrendingDown, AlertTriangle, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { format } from 'date-fns';

interface WorkforceEvolutionChartProps {
  data: WorkforceEvolution;
}

const WorkforceEvolutionChart: React.FC<WorkforceEvolutionChartProps> = ({ data }) => {
  const { periods, shifts } = data;

  // Prepare comparison data
  const hasTwoPeriods = periods.length >= 2;
  const current = hasTwoPeriods ? periods[periods.length - 1] : periods[0];
  const previous = hasTwoPeriods ? periods[0] : null;

  // Calculate changes
  const volumeChange = previous && previous.totalPositions > 0
    ? ((current.totalPositions - previous.totalPositions) / previous.totalPositions) * 100
    : 0;

  const staffRatioChange = previous ? current.staffRatio - previous.staffRatio : 0;
  const fieldRatioChange = previous ? current.fieldRatio - previous.fieldRatio : 0;

  // Pyramid comparison data
  const pyramidComparisonData = current.pyramid.map(tier => {
    const prevTier = previous?.pyramid.find(p => p.tier === tier.tier);
    return {
      tier: tier.tier,
      current: tier.count,
      previous: prevTier?.count || 0,
      currentPerc: tier.percentage,
      previousPerc: prevTier?.percentage || 0,
      change: (tier.percentage) - (prevTier?.percentage || 0),
      color: tier.color
    };
  }).reverse();

  // Shift icon and color (compact)
  const getShiftIcon = (direction: 'up' | 'down') => {
    return direction === 'up' 
      ? <ArrowUp className="h-3 w-3 text-green-600" />
      : <ArrowDown className="h-3 w-3 text-red-600" />;
  };

  const getMagnitudeColor = (magnitude: 'major' | 'moderate' | 'minor') => {
    switch (magnitude) {
      case 'major': return 'bg-red-100 text-red-800 border-red-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'minor': return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const ChangeIndicator: React.FC<{ value: number; suffix?: string }> = ({ value, suffix = '' }) => {
    if (Math.abs(value) < 0.1) {
      return <span className="text-gray-500 flex items-center gap-1"><Minus className="h-3 w-3" /> No change</span>;
    }
    return (
      <span className={`flex items-center gap-1 ${value > 0 ? 'text-green-600' : 'text-red-600'}`}>
        {value > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
        {Math.abs(value).toFixed(1)}{suffix}
      </span>
    );
  };

  return (
    <div className="space-y-3">
      {/* Compact Key Metrics */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-[10px] text-gray-500">Volume</div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-gray-900">{current.totalPositions.toLocaleString()}</span>
            <span className="text-[9px]"><ChangeIndicator value={volumeChange} suffix="%" /></span>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-[10px] text-gray-500">Staff Ratio</div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-gray-900">{current.staffRatio.toFixed(0)}%</span>
            <span className="text-[9px]"><ChangeIndicator value={staffRatioChange} suffix="pp" /></span>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-[10px] text-gray-500">Field</div>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-gray-900">{current.fieldRatio.toFixed(0)}%</span>
            <span className="text-[9px]"><ChangeIndicator value={fieldRatioChange} suffix="pp" /></span>
          </div>
        </div>
      </div>

      {/* Compact Pyramid Comparison */}
      {hasTwoPeriods && (
        <div className="bg-gray-50 rounded-lg p-2">
          <div className="text-[10px] font-medium text-gray-600 mb-1">Grade Distribution Change</div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={pyramidComparisonData}
                layout="vertical"
                margin={{ top: 5, right: 15, left: 80, bottom: 5 }}
              >
                <XAxis type="number" tick={{ fontSize: 9 }} />
                <YAxis type="category" dataKey="tier" width={75} tick={{ fontSize: 9 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white border border-gray-200 rounded p-2 shadow-lg text-xs">
                          <div className="font-medium">{d.tier}</div>
                          <div className="flex gap-2 mt-1">
                            <span className="text-gray-500">Prev: {d.previous}</span>
                            <span className="text-gray-700">Now: {d.current}</span>
                            <span className={d.change > 0 ? 'text-green-600' : d.change < 0 ? 'text-red-600' : 'text-gray-500'}>
                              {d.change > 0 ? '+' : ''}{d.change.toFixed(1)}pp
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '9px' }} />
                <Bar dataKey="previous" fill="#CBD5E1" name="Previous" radius={[0, 3, 3, 0]} />
                <Bar dataKey="current" name="Current" radius={[0, 3, 3, 0]}>
                  {pyramidComparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Compact Detected Shifts */}
      {shifts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {shifts.map((shift, idx) => (
            <div 
              key={idx}
              className={`rounded px-2 py-1 text-[10px] flex items-center gap-1 ${getMagnitudeColor(shift.magnitude)}`}
            >
              {getShiftIcon(shift.direction)}
              <span className="font-medium">{shift.type}</span>
              <span className={`px-1 py-0.5 rounded text-[9px] ${
                shift.magnitude === 'major' ? 'bg-red-200' :
                shift.magnitude === 'moderate' ? 'bg-yellow-200' :
                'bg-blue-200'
              }`}>
                {shift.magnitude}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkforceEvolutionChart;

