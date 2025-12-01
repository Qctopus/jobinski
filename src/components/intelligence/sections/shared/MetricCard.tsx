/**
 * MetricCard - Enhanced individual metric display component
 * Features: Tabular-nums, border accents, subtle backgrounds
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { KeyMetric } from '../../../../services/analytics/IntelligenceBriefEngine';

interface MetricCardProps {
  metric: KeyMetric;
  size?: 'sm' | 'md' | 'lg';
  showSparkline?: boolean;
}

// Mini sparkline background
const SparklineBackground: React.FC<{ trend?: 'up' | 'down' | 'flat' | 'stable'; height: number }> = ({ trend, height }) => {
  const color = trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#94A3B8';
  const values = trend === 'up' 
    ? [20, 30, 25, 40, 35, 50, 45, 60]
    : trend === 'down'
    ? [60, 55, 45, 40, 35, 30, 25, 20]
    : [35, 40, 35, 38, 42, 35, 40, 38];
  
  const max = Math.max(...values);
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100;
    const y = height - (v / max) * (height * 0.6);
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg 
      width="100%" 
      height={height}
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
      className="absolute bottom-0 left-0 right-0 opacity-15"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const MetricCard: React.FC<MetricCardProps> = ({ metric, size = 'md', showSparkline = true }) => {
  const sizeClasses = {
    sm: { value: 'text-lg', label: 'text-[10px]', padding: 'px-2.5 py-2', height: 48 },
    md: { value: 'text-2xl', label: 'text-xs', padding: 'px-3 py-2.5', height: 64 },
    lg: { value: 'text-3xl', label: 'text-sm', padding: 'px-4 py-3', height: 80 }
  };

  const { value: valueSize, label: labelSize, padding, height } = sizeClasses[size];

  const getTrendIcon = () => {
    if (!metric.trend) return null;
    const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5';
    if (metric.trend === 'up') return <TrendingUp className={`${iconSize} text-emerald-500`} />;
    if (metric.trend === 'down') return <TrendingDown className={`${iconSize} text-red-500`} />;
    return <Minus className={`${iconSize} text-gray-400`} />;
  };

  const getChangeColor = () => {
    if (!metric.change) return 'text-gray-500';
    return metric.change > 0 ? 'text-emerald-600' : 'text-red-600';
  };

  const getBorderColor = () => {
    if (!metric.trend) return 'border-l-blue-500';
    if (metric.trend === 'up') return 'border-l-emerald-500';
    if (metric.trend === 'down') return 'border-l-red-500';
    return 'border-l-gray-300';
  };

  const getBgColor = () => {
    if (!metric.trend) return 'bg-white';
    if (metric.trend === 'up') return 'bg-emerald-50/30';
    if (metric.trend === 'down') return 'bg-red-50/30';
    return 'bg-white';
  };

  return (
    <div className={`${getBgColor()} rounded-lg border border-gray-200 border-l-4 ${getBorderColor()} ${padding} flex flex-col relative overflow-hidden hover:shadow-sm transition-shadow`}>
      {/* Sparkline background */}
      {showSparkline && <SparklineBackground trend={metric.trend} height={height} />}
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-1.5">
          <span className={`font-bold text-gray-900 ${valueSize} tabular-nums tracking-tight`}>
            {metric.value}
          </span>
          {getTrendIcon()}
        </div>
        <span className={`text-gray-500 ${labelSize} font-medium mt-0.5 block`}>
          {metric.label}
        </span>
        {metric.change !== undefined && (
          <span className={`text-[10px] ${getChangeColor()} font-semibold tabular-nums mt-0.5 block`}>
            {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
          </span>
        )}
        {metric.comparison && (
          <span className="text-[10px] text-gray-400 mt-0.5 block">
            {metric.comparison}
          </span>
        )}
      </div>
    </div>
  );
};
