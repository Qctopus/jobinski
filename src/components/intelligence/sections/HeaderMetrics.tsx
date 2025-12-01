/**
 * HeaderMetrics - Enhanced metrics row with vibrant sparklines
 * Features: Colorful area sparklines, gradient fills, prominent trends
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';
import { KeyMetric } from '../../../services/analytics/IntelligenceBriefEngine';

interface HeaderMetricsProps {
  metrics: KeyMetric[];
  periodLabel: string;
  comparisonLabel: string;
}

// Vibrant sparkline with area fill - takes full width of card
const VibrantSparkline: React.FC<{ 
  trend: 'up' | 'down' | 'stable'; 
  color: string;
  gradientId: string;
}> = ({ trend, color, gradientId }) => {
  const width = 100;
  const height = 32;
  
  // More dramatic sparkline patterns
  const points = trend === 'up' 
    ? [[0, 28], [15, 22], [30, 24], [45, 16], [60, 18], [75, 10], [90, 12], [100, 6]] 
    : trend === 'down'
    ? [[0, 6], [15, 10], [30, 8], [45, 16], [60, 14], [75, 22], [90, 20], [100, 28]]
    : [[0, 16], [15, 14], [30, 18], [45, 15], [60, 17], [75, 14], [90, 16], [100, 15]];
  
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;
  
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="absolute bottom-0 left-0 right-0">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <path d={areaPath} fill={`url(#${gradientId})`} />
      {/* Line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* End dot */}
      <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="3" fill={color} />
    </svg>
  );
};

// Enhanced metric card with full-width colorful sparklines
const EnhancedMetricCard: React.FC<{ metric: KeyMetric; index: number }> = ({ metric, index }) => {
  const isUp = metric.trend === 'up';
  const isDown = metric.trend === 'down';
  
  // Vibrant color schemes
  const colorSchemes = [
    { bg: 'bg-gradient-to-br from-blue-50 to-blue-100/50', border: 'border-l-blue-500', sparkline: '#3B82F6', accent: 'blue' },
    { bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50', border: 'border-l-emerald-500', sparkline: '#10B981', accent: 'emerald' },
    { bg: 'bg-gradient-to-br from-purple-50 to-purple-100/50', border: 'border-l-purple-500', sparkline: '#8B5CF6', accent: 'purple' },
    { bg: 'bg-gradient-to-br from-amber-50 to-amber-100/50', border: 'border-l-amber-500', sparkline: '#F59E0B', accent: 'amber' },
    { bg: 'bg-gradient-to-br from-indigo-50 to-indigo-100/50', border: 'border-l-indigo-500', sparkline: '#6366F1', accent: 'indigo' },
  ];
  
  // Override with trend-based colors for significant changes
  let colorScheme = colorSchemes[index % colorSchemes.length];
  if (metric.change !== undefined && Math.abs(metric.change) > 10) {
    if (isUp) {
      colorScheme = { bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50', border: 'border-l-emerald-500', sparkline: '#10B981', accent: 'emerald' };
    } else if (isDown) {
      colorScheme = { bg: 'bg-gradient-to-br from-red-50 to-red-100/50', border: 'border-l-red-500', sparkline: '#EF4444', accent: 'red' };
    }
  }

  const getTrendIcon = () => {
    if (!metric.trend) return null;
    if (metric.trend === 'up') return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    if (metric.trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-3 w-3 text-gray-400" />;
  };

  const getChangeColor = () => {
    if (!metric.change) return 'text-gray-500';
    if (metric.change > 5) return 'text-emerald-600';
    if (metric.change < -5) return 'text-red-600';
    return 'text-gray-500';
  };

  const getChangeBg = () => {
    if (!metric.change) return 'bg-gray-100';
    if (metric.change > 5) return 'bg-emerald-100';
    if (metric.change < -5) return 'bg-red-100';
    return 'bg-gray-100';
  };

  const gradientId = `sparkline-gradient-${index}`;

  return (
    <div className={`${colorScheme.bg} rounded-xl border border-gray-200/80 border-l-4 ${colorScheme.border} px-4 py-3 flex flex-col hover:shadow-lg transition-all duration-200 relative overflow-hidden min-h-[88px]`}>
      {/* Full-width sparkline at bottom */}
      <VibrantSparkline 
        trend={metric.trend || 'stable'} 
        color={colorScheme.sparkline} 
        gradientId={gradientId}
      />
      
      {/* Content - on top of sparkline */}
      <div className="relative z-10 flex-1 flex flex-col justify-between">
        {/* Main value row */}
        <div className="flex items-start justify-between gap-2">
          <span className="font-bold text-gray-900 text-2xl tabular-nums tracking-tight">
            {metric.value}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            {getTrendIcon()}
            {metric.change !== undefined && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md shadow-sm ${getChangeBg()} ${getChangeColor()} tabular-nums`}>
                {metric.change > 0 ? '+' : ''}{metric.change.toFixed(0)}%
              </span>
            )}
          </div>
        </div>
        
        {/* Label and comparison */}
        <div className="mt-1">
          <span className="text-xs text-gray-700 font-semibold">
            {metric.label}
          </span>
          {metric.comparison && (
            <span className="text-[10px] text-gray-500 block mt-0.5">
              {metric.comparison}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export const HeaderMetrics: React.FC<HeaderMetricsProps> = ({
  metrics,
  periodLabel,
  comparisonLabel
}) => {
  // Determine grid columns based on number of metrics
  const gridCols = metrics.length <= 4 
    ? 'grid-cols-2 sm:grid-cols-4' 
    : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5';

  return (
    <div className="bg-gradient-to-r from-slate-50 via-white to-blue-50/30 border-b border-gray-200 px-6 py-4">
      {/* Period info header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-blue-100 flex items-center justify-center">
            <Calendar className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-sm text-gray-800">
            <span className="font-semibold">{periodLabel}</span>
          </p>
        </div>
        <p className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
          Comparing to {comparisonLabel}
        </p>
      </div>

      {/* Metrics grid - fills available horizontal space */}
      <div className={`grid ${gridCols} gap-4`}>
        {metrics.map((metric, i) => (
          <EnhancedMetricCard key={i} metric={metric} index={i} />
        ))}
      </div>
    </div>
  );
};
