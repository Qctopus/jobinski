/**
 * WeeklyVolumeChart - Bar chart with sparkline for weekly volume
 */

import React from 'react';
import { WeeklyData } from '../../../../services/analytics/IntelligenceBriefEngine';

interface WeeklyVolumeChartProps {
  data: WeeklyData[];
  peakWeek?: { week: string; count: number };
  avgLine?: number;
  height?: number;
  showLabels?: boolean;
  showAxis?: boolean;
  barColor?: string;
  highlightPeak?: boolean;
}

export const WeeklyVolumeChart: React.FC<WeeklyVolumeChartProps> = ({
  data,
  peakWeek,
  avgLine,
  height = 120,
  showLabels = true,
  showAxis = true,
  barColor = '#3B82F6',
  highlightPeak = true
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={`w-full flex items-center justify-center bg-gray-50 rounded-lg`} style={{ height }}>
        <span className="text-gray-400 text-sm">No weekly data available</span>
      </div>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const chartHeight = showLabels ? height - 24 : height;

  return (
    <div className="w-full">
      <div className="relative flex items-end" style={{ height: chartHeight }}>
        {/* Average line */}
        {avgLine !== undefined && (
          <div 
            className="absolute left-0 right-0 border-t-2 border-dashed border-amber-400 z-10 pointer-events-none"
            style={{ bottom: `${(avgLine / maxCount) * chartHeight}px` }}
          >
            <span className="absolute right-0 -top-4 text-xs text-amber-600 bg-white px-1 rounded">
              avg: {avgLine.toFixed(0)}
            </span>
          </div>
        )}

        {/* Bars Container */}
        <div className="flex items-end w-full h-full gap-1">
          {data.map((week, i) => {
            const barHeightPx = (week.count / maxCount) * chartHeight;
            const isPeak = highlightPeak && peakWeek && week.week === peakWeek.week;
            
            return (
              <div 
                key={week.week || i} 
                className="flex-1 flex flex-col items-center justify-end group relative h-full"
              >
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                  <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                    <div className="font-medium">{week.week}</div>
                    <div>{week.count} positions</div>
                  </div>
                </div>
                
                {/* Bar */}
                <div 
                  className={`w-full rounded-t transition-all duration-200 group-hover:opacity-80 ${isPeak ? 'ring-2 ring-offset-1 ring-amber-400' : ''}`}
                  style={{ 
                    height: `${Math.max(barHeightPx, 4)}px`,
                    backgroundColor: isPeak ? '#F59E0B' : barColor
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* X-axis labels */}
      {showLabels && (
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>{data[0]?.week}</span>
          {data.length > 6 && <span>{data[Math.floor(data.length / 2)]?.week}</span>}
          <span>{data[data.length - 1]?.week}</span>
        </div>
      )}

      {/* Legend */}
      {highlightPeak && peakWeek && (
        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: barColor }} />
            <span>Weekly volume</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-amber-500" />
            <span>Peak: {peakWeek.week} ({peakWeek.count})</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Sparkline version for inline use
interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  showDots?: boolean;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 80,
  height = 24,
  color = '#3B82F6',
  showDots = false
}) => {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 4);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDots && data.map((value, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * (height - 4);
        const isLast = i === data.length - 1;
        return (
          <circle 
            key={i}
            cx={x} 
            cy={y} 
            r={isLast ? 3 : 2} 
            fill={isLast ? color : 'white'}
            stroke={color}
            strokeWidth="1.5"
          />
        );
      })}
    </svg>
  );
};

