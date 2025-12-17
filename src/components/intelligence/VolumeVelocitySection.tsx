/**
 * Volume & Velocity Section
 * 
 * Displays hiring volume metrics, weekly velocity trends, and period comparisons.
 */

import React from 'react';
import { Activity, TrendingUp, TrendingDown, Clock, Zap } from 'lucide-react';
import { VolumeMetrics } from '../../services/analytics/IntelligenceInsightsEngine';
import { GeneratedNarrative } from '../../services/analytics/NarrativeGenerator';
import { InlineSparkline, MetricBadge, TrendArrow, NarrativeBlock } from './shared';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface VolumeVelocitySectionProps {
  metrics: VolumeMetrics;
  narrative: GeneratedNarrative;
  isAgencyView: boolean;
  agencyName: string;
}

const VolumeVelocitySection: React.FC<VolumeVelocitySectionProps> = ({
  metrics,
  narrative,
  isAgencyView,
  agencyName
}) => {
  const {
    totalPositions,
    previousPeriodPositions,
    volumeChange,
    weeklyVelocity,
    previousWeeklyVelocity,
    velocityChange,
    vs12moAvg,
    weeklyBreakdown,
    accelerationPattern,
    peakWeek
  } = metrics;

  // Prepare chart data
  const chartData = weeklyBreakdown.map(w => ({
    week: w.week,
    positions: w.count
  }));

  const subject = isAgencyView ? agencyName : 'Market';

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Section Header */}
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <Activity className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Hiring Volume & Velocity</h3>
            <p className="text-xs text-gray-500">Positions posted and hiring momentum</p>
          </div>
        </div>
        <InlineSparkline 
          data={weeklyBreakdown.map(w => w.count)}
          width={100}
          height={32}
          color="auto"
        />
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Narrative Block */}
        <NarrativeBlock
          body={narrative.body}
          callouts={narrative.callouts}
          variant="subtle"
          size="sm"
          className="mb-5"
        />

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <MetricBadge
            label="Total Positions"
            value={totalPositions}
            change={volumeChange}
            format="number"
            size="md"
            variant="highlight"
          />
          
          <MetricBadge
            label="Weekly Velocity"
            value={`${weeklyVelocity.toFixed(1)}/wk`}
            change={velocityChange}
            format="number"
            size="md"
          />
          
          <MetricBadge
            label="vs 12-mo Avg"
            value={vs12moAvg > 0 ? `+${vs12moAvg.toFixed(0)}%` : `${vs12moAvg.toFixed(0)}%`}
            format="number"
            size="md"
            variant={vs12moAvg > 10 ? 'positive' : vs12moAvg < -10 ? 'negative' : 'neutral'}
          />
          
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Momentum
            </div>
            <div className="flex items-center gap-2">
              {accelerationPattern === 'accelerating' ? (
                <>
                  <Zap className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-semibold text-emerald-600">Accelerating</span>
                </>
              ) : accelerationPattern === 'decelerating' ? (
                <>
                  <TrendingDown className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-semibold text-amber-600">Slowing</span>
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-600">Steady</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Weekly Volume Chart */}
        {chartData.length > 1 && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Weekly Breakdown
              </span>
              {peakWeek && (
                <span className="text-xs text-blue-600">
                  Peak: {peakWeek.week} ({peakWeek.count} positions)
                </span>
              )}
            </div>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis 
                    dataKey="week" 
                    tick={{ fontSize: 10, fill: '#6B7280' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: number) => [`${value} positions`, 'Volume']}
                    labelFormatter={(label) => `Week of ${label}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="positions" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    fill="url(#volumeGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Comparison Footer */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-gray-600">Prior period:</span>
            <span className="font-semibold text-gray-800">{previousPeriodPositions.toLocaleString()} positions</span>
            <TrendArrow value={volumeChange} size="xs" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-600">Velocity:</span>
            <span className="font-semibold text-gray-800">{previousWeeklyVelocity.toFixed(1)}/wk</span>
            <TrendArrow value={velocityChange} size="xs" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolumeVelocitySection;







