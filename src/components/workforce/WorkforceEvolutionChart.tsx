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

  // Shift icon and color
  const getShiftIcon = (direction: 'up' | 'down') => {
    return direction === 'up' 
      ? <ArrowUp className="h-4 w-4 text-green-600" />
      : <ArrowDown className="h-4 w-4 text-red-600" />;
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
    <div className="space-y-6">
      {/* Period Context */}
      {hasTwoPeriods && previous && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
          <div className="flex items-center justify-between text-xs">
            <div>
              <span className="text-gray-500">Previous Period:</span>
              <span className="ml-2 text-gray-700 font-medium">
                {format(previous.startDate, 'MMM d')} - {format(previous.endDate, 'MMM d, yyyy')}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Current Period:</span>
              <span className="ml-2 text-gray-700 font-medium">
                {format(current.startDate, 'MMM d')} - {format(current.endDate, 'MMM d, yyyy')}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="text-xs text-gray-500 mb-1">Hiring Volume</div>
          <div className="flex items-end justify-between">
            <div className="text-xl font-bold text-gray-900">
              {current.totalPositions.toLocaleString()}
            </div>
            <ChangeIndicator value={volumeChange} suffix="%" />
          </div>
          {previous && (
            <div className="text-[10px] text-gray-400 mt-1">
              vs {previous.totalPositions.toLocaleString()} previous
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="text-xs text-gray-500 mb-1">Staff Ratio</div>
          <div className="flex items-end justify-between">
            <div className="text-xl font-bold text-gray-900">
              {current.staffRatio.toFixed(1)}%
            </div>
            <ChangeIndicator value={staffRatioChange} suffix="pp" />
          </div>
          {previous && (
            <div className="text-[10px] text-gray-400 mt-1">
              vs {previous.staffRatio.toFixed(1)}% previous
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="text-xs text-gray-500 mb-1">Field Deployment</div>
          <div className="flex items-end justify-between">
            <div className="text-xl font-bold text-gray-900">
              {current.fieldRatio.toFixed(1)}%
            </div>
            <ChangeIndicator value={fieldRatioChange} suffix="pp" />
          </div>
          {previous && (
            <div className="text-[10px] text-gray-400 mt-1">
              vs {previous.fieldRatio.toFixed(1)}% previous
            </div>
          )}
        </div>
      </div>

      {/* Pyramid Comparison Chart */}
      {hasTwoPeriods && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-medium text-gray-900 mb-4">Grade Distribution Change</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={pyramidComparisonData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 120, bottom: 10 }}
              >
                <XAxis type="number" />
                <YAxis type="category" dataKey="tier" width={110} tick={{ fontSize: 12 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
                          <div className="font-semibold text-gray-900">{d.tier}</div>
                          <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                            <div>
                              <div className="text-gray-500">Previous</div>
                              <div className="font-medium">{d.previous} ({d.previousPerc.toFixed(1)}%)</div>
                            </div>
                            <div>
                              <div className="text-gray-500">Current</div>
                              <div className="font-medium">{d.current} ({d.currentPerc.toFixed(1)}%)</div>
                            </div>
                          </div>
                          <div className={`mt-2 text-sm font-medium ${d.change > 0 ? 'text-green-600' : d.change < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                            Change: {d.change > 0 ? '+' : ''}{d.change.toFixed(1)}pp
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                <Bar dataKey="previous" fill="#CBD5E1" name="Previous Period" radius={[0, 4, 4, 0]} />
                <Bar dataKey="current" name="Current Period" radius={[0, 4, 4, 0]}>
                  {pyramidComparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Detected Shifts */}
      {shifts.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Detected Workforce Shifts
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shifts.map((shift, idx) => (
              <div 
                key={idx}
                className={`rounded-lg border p-4 ${getMagnitudeColor(shift.magnitude)}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {getShiftIcon(shift.direction)}
                  <span className="font-semibold">{shift.type}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    shift.magnitude === 'major' ? 'bg-red-200' :
                    shift.magnitude === 'moderate' ? 'bg-yellow-200' :
                    'bg-blue-200'
                  }`}>
                    {shift.magnitude}
                  </span>
                </div>
                <p className="text-sm">{shift.description}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-center">
          <Minus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">No significant workforce shifts detected between periods</p>
          <p className="text-sm text-gray-500 mt-1">
            The workforce structure appears stable within the comparison period
          </p>
        </div>
      )}

      {/* Interpretation Guide */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <h4 className="font-medium text-indigo-900 mb-2">Understanding Workforce Evolution</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-indigo-800">
          <div>
            <div className="font-medium mb-1">Volume Changes</div>
            <p className="text-indigo-700">
              Changes in total positions indicate overall hiring activity. 
              Large increases may signal expansion, decreases may indicate restructuring.
            </p>
          </div>
          <div>
            <div className="font-medium mb-1">Staff Ratio Shifts</div>
            <p className="text-indigo-700">
              Movement toward more staff positions suggests stabilization; 
              toward non-staff suggests flexibility or cost management focus.
            </p>
          </div>
          <div>
            <div className="font-medium mb-1">Geographic Shifts</div>
            <p className="text-indigo-700">
              Increasing field deployment indicates program delivery focus; 
              HQ concentration suggests policy or coordination emphasis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkforceEvolutionChart;

