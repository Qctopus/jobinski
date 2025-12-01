/**
 * MetricCard - Individual metric display component
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { KeyMetric } from '../../../../services/analytics/IntelligenceBriefEngine';

interface MetricCardProps {
  metric: KeyMetric;
  size?: 'sm' | 'md' | 'lg';
}

export const MetricCard: React.FC<MetricCardProps> = ({ metric, size = 'md' }) => {
  const sizeClasses = {
    sm: { value: 'text-lg', label: 'text-xs', padding: 'px-3 py-2' },
    md: { value: 'text-2xl', label: 'text-sm', padding: 'px-4 py-3' },
    lg: { value: 'text-3xl', label: 'text-base', padding: 'px-5 py-4' }
  };

  const { value: valueSize, label: labelSize, padding } = sizeClasses[size];

  const getTrendIcon = () => {
    if (!metric.trend) return null;
    if (metric.trend === 'up') return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    if (metric.trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-3 w-3 text-gray-400" />;
  };

  const getChangeColor = () => {
    if (!metric.change) return 'text-gray-500';
    return metric.change > 0 ? 'text-emerald-600' : 'text-red-600';
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${padding} flex flex-col`}>
      <div className="flex items-center gap-2">
        <span className={`font-bold text-gray-900 ${valueSize}`}>
          {metric.value}
        </span>
        {getTrendIcon()}
      </div>
      <span className={`text-gray-500 ${labelSize} mt-1`}>
        {metric.label}
      </span>
      {metric.change !== undefined && (
        <span className={`text-xs ${getChangeColor()} mt-0.5`}>
          {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
        </span>
      )}
      {metric.comparison && (
        <span className="text-xs text-gray-400 mt-0.5">
          {metric.comparison}
        </span>
      )}
    </div>
  );
};

