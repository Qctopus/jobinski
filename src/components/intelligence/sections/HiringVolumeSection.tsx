/**
 * HiringVolumeSection - Streamlined volume & velocity
 * Integrated acceleration, combined weekly chart with detail, reduced whitespace
 */

import React from 'react';
import { TrendingUp, TrendingDown, BarChart3, ChevronUp, ChevronDown, Minus } from 'lucide-react';
import { VolumeMetrics } from '../../../services/analytics/IntelligenceBriefEngine';
import { TrendIndicator } from './shared';

interface HiringVolumeSectionProps {
  data: VolumeMetrics;
  agencyName?: string;
}

// Combined bar chart with inline labels
const WeeklyBarChart: React.FC<{
  data: Array<{ week: string; count: number }>;
  peakWeek?: { week: string; count: number };
  avgLine?: number;
  height?: number;
}> = ({ data, peakWeek, avgLine, height = 100 }) => {
  if (!data || data.length === 0) return null;
  
  const max = Math.max(...data.map(d => d.count), 1);
  
  return (
    <div className="w-full">
      {/* Bars with labels */}
      <div className="flex items-end gap-1" style={{ height }}>
        {data.map((item, i) => {
          const barHeight = (item.count / max) * height;
          const isPeak = peakWeek && item.week === peakWeek.week;
          
          return (
            <div key={i} className="flex-1 flex flex-col items-center group relative">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                <div className="bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap">
                  <div className="font-medium">{item.week}</div>
                  <div>{item.count} positions</div>
                </div>
              </div>
              
              {/* Value label on top */}
              <span className="text-[10px] text-gray-500 mb-1 tabular-nums font-medium">
                {item.count}
              </span>
              
              {/* Bar */}
              <div 
                className={`w-full rounded-t transition-all ${isPeak ? 'bg-amber-500' : 'bg-blue-500'} hover:opacity-80`}
                style={{ height: `${Math.max(barHeight * 0.7, 4)}px` }}
              />
              
              {/* Week label */}
              <span className="text-[9px] text-gray-400 mt-1 truncate w-full text-center">
                {item.week.replace('Week ', 'W').replace('Nov ', '').replace('Dec ', '')}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Average line indicator */}
      {avgLine !== undefined && (
        <div className="flex items-center justify-between mt-2 text-[10px] border-t border-dashed border-amber-400 pt-1">
          <span className="text-amber-600 font-medium">Avg: {avgLine.toFixed(0)}/wk</span>
          {peakWeek && (
            <span className="text-gray-500">
              Peak: <span className="font-medium text-amber-600">{peakWeek.week}</span> ({peakWeek.count})
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// Compact stat with integrated trend
const StatBox: React.FC<{
  value: string | number;
  label: string;
  change?: number;
  sublabel?: string;
  color?: 'blue' | 'amber' | 'emerald' | 'purple';
}> = ({ value, label, change, sublabel, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-50 border-blue-100 text-blue-600',
    amber: 'bg-amber-50 border-amber-100 text-amber-600',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-600',
    purple: 'bg-purple-50 border-purple-100 text-purple-600'
  };
  
  return (
    <div className={`${colors[color]} rounded-lg p-2.5 border text-center`}>
      <div className="text-xl font-bold text-gray-900 tabular-nums">{value}</div>
      <div className="text-xs font-medium">{label}</div>
      {change !== undefined && <TrendIndicator value={change} size="sm" />}
      {sublabel && <div className="text-[10px] text-gray-500 mt-0.5">{sublabel}</div>}
    </div>
  );
};

export const HiringVolumeSection: React.FC<HiringVolumeSectionProps> = ({ data, agencyName }) => {
  const subject = agencyName || 'The UN system';
  const periodWeeks = data.weeklyData.length || 4;
  const isAccelerating = data.accelerationPattern === 'accelerating';
  const isDecelerating = data.accelerationPattern === 'decelerating';

  // Short narrative
  const narrative = `${subject} posted ${data.total.toLocaleString()} positions over ${periodWeeks} weeks — averaging ${data.weeklyAverage.toFixed(0)} per week.`;

  return (
    <section className="border-b border-gray-200">
      <div className="h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500" />
      
      <div className="px-6 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-blue-100 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Hiring Volume & Momentum</h2>
              <p className="text-xs text-gray-500">{narrative}</p>
            </div>
          </div>
          
          {/* Integrated momentum badge */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
            isAccelerating ? 'bg-emerald-100 text-emerald-700' :
            isDecelerating ? 'bg-red-100 text-red-700' : 
            'bg-gray-100 text-gray-600'
          }`}>
            {isAccelerating ? <ChevronUp className="h-4 w-4" /> : 
             isDecelerating ? <ChevronDown className="h-4 w-4" /> : 
             <Minus className="h-3 w-3" />}
            <span>{isAccelerating ? 'Accelerating' : isDecelerating ? 'Decelerating' : 'Steady'}</span>
            <span className="text-xs opacity-75">({data.distribution.secondHalf.toFixed(0)}% in 2nd half)</span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Left: Stats grid */}
          <div className="col-span-3 grid grid-cols-2 gap-2">
            <StatBox 
              value={data.total.toLocaleString()} 
              label="Total Positions" 
              change={data.change}
              sublabel={`vs ${data.previousTotal.toLocaleString()} prior`}
              color="blue"
            />
            <StatBox 
              value={`${data.weeklyAverage.toFixed(0)}/wk`} 
              label="Weekly Avg" 
              change={data.velocityChange}
              sublabel={`vs ${data.previousWeeklyAverage.toFixed(0)}/wk prior`}
              color="amber"
            />
            <StatBox 
              value={`${data.vs12MonthAvg > 0 ? '+' : ''}${data.vs12MonthAvg.toFixed(0)}%`} 
              label="vs 12mo Avg" 
              color={data.vs12MonthAvg > 0 ? 'emerald' : 'purple'}
            />
            <StatBox 
              value={`${data.distribution.secondHalf.toFixed(0)}%`} 
              label="2nd Half Share" 
              color={data.distribution.secondHalf > 55 ? 'emerald' : data.distribution.secondHalf < 45 ? 'purple' : 'blue'}
            />
          </div>

          {/* Right: Combined weekly chart */}
          <div className="col-span-9 bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Weekly Posting Volume
              </h3>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-blue-500" /> Volume</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-500" /> Peak</span>
              </div>
            </div>
            <WeeklyBarChart 
              data={data.weeklyData}
              peakWeek={data.peakWeek}
              avgLine={data.weeklyAverage}
              height={90}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
