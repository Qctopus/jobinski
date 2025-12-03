/**
 * DistributionChart - Donut and bar charts for distributions
 */

import React from 'react';

interface DistributionItem {
  label: string;
  value: number;
  percentage: number;
  color: string;
  previousPercentage?: number;
}

interface DonutChartProps {
  data: DistributionItem[];
  size?: number;
  thickness?: number;
  showCenter?: boolean;
  centerLabel?: string;
  centerValue?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  size = 160,
  thickness = 32,
  showCenter = true,
  centerLabel,
  centerValue
}) => {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let currentOffset = 0;
  const segments = data.map((item) => {
    const percentage = item.percentage / 100;
    const segmentLength = circumference * percentage;
    const offset = currentOffset;
    currentOffset += segmentLength;

    return {
      ...item,
      strokeDasharray: `${segmentLength} ${circumference - segmentLength}`,
      strokeDashoffset: -offset
    };
  });

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {segments.map((segment, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={segment.color}
            strokeWidth={thickness}
            strokeDasharray={segment.strokeDasharray}
            strokeDashoffset={segment.strokeDashoffset}
            strokeLinecap="butt"
            className="transition-all duration-300"
          />
        ))}
      </svg>
      {showCenter && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {centerValue && <span className="text-2xl font-bold text-gray-900">{centerValue}</span>}
          {centerLabel && <span className="text-sm text-gray-500">{centerLabel}</span>}
        </div>
      )}
    </div>
  );
};

interface HorizontalBarsProps {
  data: DistributionItem[];
  showValues?: boolean;
  showChange?: boolean;
  maxBarWidth?: number;
  barHeight?: number;
}

export const HorizontalBars: React.FC<HorizontalBarsProps> = ({
  data,
  showValues = true,
  showChange = true,
  barHeight = 24
}) => {
  const maxValue = Math.max(...data.map(d => d.percentage), 0.01);

  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-32 flex-shrink-0">
            <span className="text-sm text-gray-700">{item.label}</span>
          </div>
          <div className="flex-1 relative">
            <div className="w-full bg-gray-100 rounded-full" style={{ height: barHeight }}>
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${(item.percentage / maxValue) * 100}%`,
                  backgroundColor: item.color,
                  minWidth: item.percentage > 0 ? '8px' : 0
                }}
              />
            </div>
            {item.previousPercentage !== undefined && showChange && (
              <div 
                className="absolute top-0 h-full border-l-2 border-gray-400 opacity-50"
                style={{ left: `${(item.previousPercentage / maxValue) * 100}%` }}
              />
            )}
          </div>
          {showValues && (
            <div className="w-20 flex-shrink-0 text-right">
              <span className="text-sm font-medium text-gray-900">
                {item.percentage.toFixed(0)}%
              </span>
              {showChange && item.previousPercentage !== undefined && (
                <span className={`text-xs ml-1 ${
                  item.percentage > item.previousPercentage + 2 ? 'text-emerald-600' :
                  item.percentage < item.previousPercentage - 2 ? 'text-red-600' :
                  'text-gray-400'
                }`}>
                  ({item.percentage > item.previousPercentage ? '+' : ''}{(item.percentage - item.previousPercentage).toFixed(0)})
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Stacked bar comparison
interface StackedBarProps {
  current: DistributionItem[];
  previous: DistributionItem[];
  labels?: { current: string; previous: string };
  height?: number;
}

export const StackedBarComparison: React.FC<StackedBarProps> = ({
  current,
  previous,
  labels = { current: 'Current', previous: 'Prior' },
  height = 28
}) => {
  const renderBar = (data: DistributionItem[], label: string) => (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500 w-16">{label}</span>
      <div className="flex-1 flex rounded-lg overflow-hidden" style={{ height }}>
        {data.map((item, i) => (
          <div
            key={i}
            className="relative group"
            style={{ 
              width: `${item.percentage}%`, 
              backgroundColor: item.color,
              minWidth: item.percentage > 0 ? '2px' : 0
            }}
          >
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
              <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                {item.label}: {item.percentage.toFixed(0)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-2">
      {renderBar(current, labels.current)}
      {renderBar(previous, labels.previous)}
      
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2">
        {current.map((item, i) => (
          <div key={i} className="flex items-center gap-1 text-xs">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
            <span className="text-gray-600">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};



