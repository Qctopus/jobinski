/**
 * MetricBadge Component
 * 
 * Compact badge for displaying a metric with change indicator.
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export interface MetricBadgeProps {
  label: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  format?: 'number' | 'percent' | 'days' | 'currency';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'positive' | 'negative' | 'neutral' | 'highlight';
  showChangeIcon?: boolean;
  className?: string;
}

const MetricBadge: React.FC<MetricBadgeProps> = ({
  label,
  value,
  change,
  changeLabel,
  format = 'number',
  size = 'md',
  variant = 'default',
  showChangeIcon = true,
  className = ''
}) => {
  const formatValue = (v: number | string): string => {
    if (typeof v === 'string') return v;
    
    switch (format) {
      case 'percent':
        return `${v.toFixed(0)}%`;
      case 'days':
        return `${v.toFixed(0)}d`;
      case 'currency':
        return `$${v.toLocaleString()}`;
      default:
        return v.toLocaleString();
    }
  };

  const sizeStyles = {
    xs: { container: 'px-2 py-1', label: 'text-[9px]', value: 'text-xs', change: 'text-[9px]' },
    sm: { container: 'px-2.5 py-1.5', label: 'text-[10px]', value: 'text-sm', change: 'text-[10px]' },
    md: { container: 'px-3 py-2', label: 'text-[10px]', value: 'text-base', change: 'text-xs' },
    lg: { container: 'px-4 py-3', label: 'text-xs', value: 'text-xl', change: 'text-sm' }
  };

  const variantStyles = {
    default: 'bg-gray-50 border-gray-200',
    positive: 'bg-emerald-50 border-emerald-200',
    negative: 'bg-red-50 border-red-200',
    neutral: 'bg-slate-50 border-slate-200',
    highlight: 'bg-blue-50 border-blue-200'
  };

  const labelColors = {
    default: 'text-gray-500',
    positive: 'text-emerald-600',
    negative: 'text-red-600',
    neutral: 'text-slate-500',
    highlight: 'text-blue-600'
  };

  const getChangeColor = (): string => {
    if (change === undefined) return 'text-gray-500';
    if (Math.abs(change) < 2) return 'text-gray-500';
    return change > 0 ? 'text-emerald-600' : 'text-red-500';
  };

  const getChangeIcon = () => {
    if (change === undefined || !showChangeIcon) return null;
    if (Math.abs(change) < 2) return <Minus className="h-3 w-3" />;
    return change > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />;
  };

  const styles = sizeStyles[size];
  const currentVariant = variant === 'default' && change !== undefined
    ? (change > 5 ? 'positive' : change < -5 ? 'negative' : 'default')
    : variant;

  return (
    <div className={`rounded-lg border ${variantStyles[currentVariant]} ${styles.container} ${className}`}>
      <div className={`${styles.label} font-semibold uppercase tracking-wide ${labelColors[currentVariant]} mb-0.5`}>
        {label}
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className={`${styles.value} font-bold text-gray-900`}>
          {formatValue(value)}
        </span>
        {change !== undefined && (
          <span className={`${styles.change} font-medium ${getChangeColor()} flex items-center gap-0.5`}>
            {getChangeIcon()}
            {changeLabel || `${change > 0 ? '+' : ''}${change.toFixed(0)}%`}
          </span>
        )}
      </div>
    </div>
  );
};

export default MetricBadge;





