import React from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from 'lucide-react';
import { PeriodComparison, SubPeriodData } from '../../contexts/TimeframeContext';

// ============================================================================
// TREND BADGE - Compact indicator showing % change
// ============================================================================

interface TrendBadgeProps {
  comparison: PeriodComparison;
  size?: 'xs' | 'sm' | 'md';
  showValue?: boolean;
  invertColors?: boolean; // For metrics where down is good (e.g., urgent rate)
  className?: string;
}

export const TrendBadge: React.FC<TrendBadgeProps> = ({
  comparison,
  size = 'sm',
  showValue = true,
  invertColors = false,
  className = ''
}) => {
  if (!comparison.hasComparison) {
    return (
      <span className={`inline-flex items-center text-gray-400 ${className}`}>
        <span className={`${size === 'xs' ? 'text-[10px]' : size === 'sm' ? 'text-xs' : 'text-sm'}`}>
          N/A
        </span>
      </span>
    );
  }

  const isPositive = invertColors ? comparison.trend === 'down' : comparison.trend === 'up';
  const isNegative = invertColors ? comparison.trend === 'up' : comparison.trend === 'down';

  const sizeClasses = {
    xs: 'text-[10px] gap-0.5',
    sm: 'text-xs gap-0.5',
    md: 'text-sm gap-1'
  };

  const iconSizes = {
    xs: 'h-2.5 w-2.5',
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5'
  };

  const colorClasses = isPositive
    ? 'text-green-600 bg-green-50'
    : isNegative
    ? 'text-red-600 bg-red-50'
    : 'text-gray-500 bg-gray-50';

  const Icon = comparison.trend === 'up' ? ArrowUp : comparison.trend === 'down' ? ArrowDown : Minus;

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded font-medium ${sizeClasses[size]} ${colorClasses} ${className}`}
    >
      <Icon className={iconSizes[size]} />
      {showValue && (
        <span>
          {comparison.trend === 'up' ? '+' : ''}
          {comparison.changePercent.toFixed(1)}%
        </span>
      )}
    </span>
  );
};

// ============================================================================
// SPARKLINE - Mini trend chart
// ============================================================================

interface SparklineProps {
  data: SubPeriodData[] | number[];
  width?: number;
  height?: number;
  color?: string;
  showDots?: boolean;
  className?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 80,
  height = 24,
  color = '#3B82F6',
  showDots = false,
  className = ''
}) => {
  const values = data.map(d => (typeof d === 'number' ? d : d.value));
  
  if (values.length === 0 || values.every(v => v === 0)) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width, height }}>
        <span className="text-[10px] text-gray-400">No data</span>
      </div>
    );
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  
  const padding = 2;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  
  const points = values.map((value, index) => {
    const x = padding + (index / (values.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((value - min) / range) * chartHeight;
    return { x, y, value };
  });

  const pathD = points
    .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  // Determine trend color
  const trendColor = values[values.length - 1] >= values[0] ? '#10B981' : '#EF4444';
  const finalColor = color === 'auto' ? trendColor : color;

  return (
    <svg width={width} height={height} className={className}>
      <path
        d={pathD}
        fill="none"
        stroke={finalColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDots && points.map((point, i) => (
        <circle
          key={i}
          cx={point.x}
          cy={point.y}
          r={2}
          fill={i === points.length - 1 ? finalColor : 'white'}
          stroke={finalColor}
          strokeWidth={1}
        />
      ))}
    </svg>
  );
};

// ============================================================================
// COMPACT METRIC CARD - Information-dense metric display
// ============================================================================

interface CompactMetricProps {
  label: string;
  value: string | number;
  comparison?: PeriodComparison;
  sparklineData?: SubPeriodData[] | number[];
  sublabel?: string;
  icon?: React.ReactNode;
  invertTrend?: boolean;
  className?: string;
}

export const CompactMetric: React.FC<CompactMetricProps> = ({
  label,
  value,
  comparison,
  sparklineData,
  sublabel,
  icon,
  invertTrend = false,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-3 ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            {icon && <span className="text-gray-400 flex-shrink-0">{icon}</span>}
            <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide truncate">
              {label}
            </span>
          </div>
          
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-gray-900">{value}</span>
            {comparison && (
              <TrendBadge comparison={comparison} size="xs" invertColors={invertTrend} />
            )}
          </div>
          
          {sublabel && (
            <span className="text-[10px] text-gray-400 mt-0.5 block">{sublabel}</span>
          )}
        </div>
        
        {sparklineData && sparklineData.length > 1 && (
          <Sparkline data={sparklineData} width={60} height={28} color="auto" />
        )}
      </div>
    </div>
  );
};

// ============================================================================
// METRIC ROW - Horizontal compact metric for tables/lists
// ============================================================================

interface MetricRowProps {
  label: string;
  value: string | number;
  comparison?: PeriodComparison;
  sublabel?: string;
  invertTrend?: boolean;
}

export const MetricRow: React.FC<MetricRowProps> = ({
  label,
  value,
  comparison,
  sublabel,
  invertTrend = false
}) => {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <span className="text-xs text-gray-600">{label}</span>
        {sublabel && (
          <span className="text-[10px] text-gray-400 ml-1">({sublabel})</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-900">{value}</span>
        {comparison && (
          <TrendBadge comparison={comparison} size="xs" invertColors={invertTrend} />
        )}
      </div>
    </div>
  );
};

// ============================================================================
// PERIOD HEADER - Shows current analysis period
// ============================================================================

interface PeriodHeaderProps {
  primaryLabel: string;
  comparisonLabel?: string;
  dataRange?: { earliest: Date; latest: Date } | null;
  className?: string;
}

export const PeriodHeader: React.FC<PeriodHeaderProps> = ({
  primaryLabel,
  comparisonLabel,
  dataRange,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-3 text-xs ${className}`}>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
        <span className="text-gray-600">{primaryLabel}</span>
      </div>
      {comparisonLabel && (
        <>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-300"></span>
            <span className="text-gray-400">{comparisonLabel}</span>
          </div>
        </>
      )}
      {dataRange && (
        <span className="text-gray-400 ml-auto text-[10px]">
          Data: {dataRange.earliest.toLocaleDateString()} - {dataRange.latest.toLocaleDateString()}
        </span>
      )}
    </div>
  );
};

// ============================================================================
// COMPARISON BAR - Visual comparison between two values
// ============================================================================

interface ComparisonBarProps {
  current: number;
  previous: number;
  label: string;
  maxValue?: number;
  showChange?: boolean;
  className?: string;
}

export const ComparisonBar: React.FC<ComparisonBarProps> = ({
  current,
  previous,
  label,
  maxValue,
  showChange = true,
  className = ''
}) => {
  const max = maxValue || Math.max(current, previous) * 1.1;
  const currentWidth = (current / max) * 100;
  const previousWidth = (previous / max) * 100;
  const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600">{label}</span>
        {showChange && previous > 0 && (
          <span className={`text-[10px] font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '+' : ''}{change.toFixed(1)}%
          </span>
        )}
      </div>
      <div className="relative h-4 bg-gray-100 rounded overflow-hidden">
        {/* Previous period (background) */}
        <div
          className="absolute inset-y-0 left-0 bg-gray-300 rounded-r opacity-50"
          style={{ width: `${previousWidth}%` }}
        />
        {/* Current period (foreground) */}
        <div
          className={`absolute inset-y-0 left-0 rounded-r ${
            current >= previous ? 'bg-blue-500' : 'bg-orange-400'
          }`}
          style={{ width: `${currentWidth}%` }}
        />
        {/* Values */}
        <div className="absolute inset-0 flex items-center justify-between px-2 text-[10px] font-medium">
          <span className="text-white drop-shadow">{current}</span>
          <span className="text-gray-500">{previous}</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MINI STAT - Ultra compact stat display
// ============================================================================

interface MiniStatProps {
  value: string | number;
  label: string;
  trend?: 'up' | 'down' | 'stable';
  className?: string;
}

export const MiniStat: React.FC<MiniStatProps> = ({
  value,
  label,
  trend,
  className = ''
}) => {
  return (
    <div className={`text-center ${className}`}>
      <div className="flex items-center justify-center gap-1">
        <span className="text-lg font-bold text-gray-900">{value}</span>
        {trend && trend !== 'stable' && (
          <span className={`${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
            {trend === 'up' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          </span>
        )}
      </div>
      <span className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</span>
    </div>
  );
};





