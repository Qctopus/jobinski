/**
 * HiringVolumeSection - Volume & velocity with charts
 */

import React from 'react';
import { TrendingUp, TrendingDown, Activity, Calendar, BarChart3 } from 'lucide-react';
import { VolumeMetrics } from '../../../services/analytics/IntelligenceBriefEngine';
import { WeeklyVolumeChart, TrendIndicator, MiniTable } from './shared';

interface HiringVolumeSectionProps {
  data: VolumeMetrics;
  agencyName?: string;
}

export const HiringVolumeSection: React.FC<HiringVolumeSectionProps> = ({ data, agencyName }) => {
  const subject = agencyName || 'The UN system';
  const periodWeeks = data.weeklyData.length || 13;

  // Generate narrative
  const narrative = generateNarrative(data, subject, periodWeeks);

  return (
    <section className="px-6 py-5 border-b border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-5 w-5 text-blue-500" />
        <h2 className="text-lg font-semibold text-gray-900">Hiring Volume & Momentum</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Narrative + Key Stats */}
        <div className="lg:col-span-1 space-y-4">
          <p className="text-gray-700 leading-relaxed">{narrative}</p>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-900">{data.total.toLocaleString()}</div>
              <div className="text-xs text-blue-600">Total Positions</div>
              <TrendIndicator value={data.change} size="sm" />
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-amber-900">{data.weeklyAverage.toFixed(0)}</div>
              <div className="text-xs text-amber-600">Weekly Average</div>
              <TrendIndicator value={data.velocityChange} size="sm" />
            </div>
          </div>

          {/* Velocity Indicator */}
          <div className={`rounded-lg p-3 flex items-center gap-3 ${
            data.accelerationPattern === 'accelerating' ? 'bg-emerald-50' :
            data.accelerationPattern === 'decelerating' ? 'bg-red-50' : 'bg-gray-50'
          }`}>
            {data.accelerationPattern === 'accelerating' ? (
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            ) : data.accelerationPattern === 'decelerating' ? (
              <TrendingDown className="h-5 w-5 text-red-600" />
            ) : (
              <Activity className="h-5 w-5 text-gray-600" />
            )}
            <div>
              <div className="text-sm font-medium text-gray-900">
                {data.accelerationPattern === 'accelerating' ? 'Accelerating' :
                 data.accelerationPattern === 'decelerating' ? 'Decelerating' : 'Steady'} Velocity
              </div>
              <div className="text-xs text-gray-500">
                {data.distribution.secondHalf.toFixed(0)}% of positions in second half of period
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Volume Chart */}
        <div className="lg:col-span-2 bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Weekly Posting Volume
            </h3>
            <span className="text-xs text-gray-500">
              Peak: {data.peakWeek.week} ({data.peakWeek.count} positions)
            </span>
          </div>
          <WeeklyVolumeChart 
            data={data.weeklyData}
            peakWeek={data.peakWeek}
            avgLine={data.weeklyAverage}
            height={160}
            highlightPeak={true}
          />
        </div>
      </div>

      {/* Period Comparison */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <MiniTable 
          title="Period Comparison"
          rows={[
            { label: 'Current Period', value: data.total.toLocaleString() },
            { label: 'Prior Period', value: data.previousTotal.toLocaleString() },
            { label: 'Change', value: `${data.change > 0 ? '+' : ''}${data.change.toFixed(0)}%` }
          ]}
        />
        <MiniTable 
          title="Weekly Velocity"
          rows={[
            { label: 'Current Average', value: `${data.weeklyAverage.toFixed(0)}/wk` },
            { label: 'Prior Average', value: `${data.previousWeeklyAverage.toFixed(1)}/wk` },
            { label: 'vs 12mo Average', value: `${data.vs12MonthAvg > 0 ? '+' : ''}${data.vs12MonthAvg.toFixed(0)}%` }
          ]}
        />
        <MiniTable 
          title="Distribution"
          rows={[
            { label: 'First Half', value: `${data.distribution.firstHalf.toFixed(0)}%` },
            { label: 'Second Half', value: `${data.distribution.secondHalf.toFixed(0)}%` },
            { label: 'Pattern', value: data.accelerationPattern }
          ]}
        />
      </div>
    </section>
  );
};

function generateNarrative(data: VolumeMetrics, subject: string, weeks: number): string {
  let narrative = `${subject} posted ${data.total.toLocaleString()} positions over ${weeks} weeks`;
  narrative += ` — averaging ${data.weeklyAverage.toFixed(0)} per week`;
  
  if (Math.abs(data.velocityChange) > 20) {
    narrative += `, ${data.velocityChange > 0 ? 'up from' : 'down from'} ${data.previousWeeklyAverage.toFixed(1)}/week in the prior period`;
  }
  narrative += '.';
  
  if (data.accelerationPattern !== 'steady') {
    const pctSecondHalf = data.distribution.secondHalf.toFixed(0);
    narrative += ` Hiring velocity ${data.accelerationPattern === 'accelerating' ? 'accelerated' : 'decelerated'} through the period`;
    narrative += `, with ${pctSecondHalf}% of positions posted in the ${data.accelerationPattern === 'accelerating' ? 'final' : 'first'} half.`;
  }
  
  if (data.peakWeek.count > data.weeklyAverage * 1.3) {
    const pctAboveAvg = ((data.peakWeek.count / data.weeklyAverage - 1) * 100).toFixed(0);
    narrative += ` The peak week (${data.peakWeek.week}) saw ${data.peakWeek.count} positions — ${pctAboveAvg}% above the period average.`;
  }
  
  return narrative;
}

