/**
 * TrendIndicator - Enhanced up/down/stable badges with percentage change
 * Features: Tabular-nums, improved visual hierarchy, multiple styles
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown, ChevronUp, ChevronDown } from 'lucide-react';

interface TrendIndicatorProps {
  value: number;
  label?: string;
  format?: 'percent' | 'number' | 'pp';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  threshold?: number;
  showIcon?: boolean;
  showArrow?: boolean;
  variant?: 'badge' | 'pill' | 'text' | 'compact';
}

export const TrendIndicator: React.FC<TrendIndicatorProps> = ({
  value,
  label,
  format = 'percent',
  size = 'md',
  threshold = 2,
  showIcon = true,
  showArrow = false,
  variant = 'badge'
}) => {
  const isPositive = value > threshold;
  const isNegative = value < -threshold;
  const isNeutral = !isPositive && !isNegative;

  const sizeClasses = {
    xs: 'text-[10px] px-1 py-0.5',
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const iconSizes = {
    xs: 'h-2.5 w-2.5',
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const getColorClasses = () => {
    if (variant === 'text') {
      if (isPositive) return 'text-emerald-600';
      if (isNegative) return 'text-red-600';
      return 'text-gray-500';
    }
    if (variant === 'pill') {
      if (isPositive) return 'bg-emerald-100 text-emerald-700';
      if (isNegative) return 'bg-red-100 text-red-700';
      return 'bg-gray-100 text-gray-600';
    }
    if (variant === 'compact') {
      if (isPositive) return 'text-emerald-600';
      if (isNegative) return 'text-red-600';
      return 'text-gray-400';
    }
    // Default badge variant
    if (isPositive) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (isNegative) return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-gray-50 text-gray-600 border-gray-200';
  };

  const getIcon = () => {
    if (!showIcon && !showArrow) return null;
    
    if (showArrow) {
      if (isPositive) return <ArrowUp className={`${iconSizes[size]} text-emerald-600`} />;
      if (isNegative) return <ArrowDown className={`${iconSizes[size]} text-red-600`} />;
      return <Minus className={`${iconSizes[size]} text-gray-400`} />;
    }

    if (variant === 'compact') {
      if (isPositive) return <ChevronUp className={`${iconSizes[size]} text-emerald-600`} />;
      if (isNegative) return <ChevronDown className={`${iconSizes[size]} text-red-600`} />;
      return <Minus className={`${iconSizes[size]} text-gray-400`} />;
    }

    if (isPositive) return <TrendingUp className={`${iconSizes[size]} text-emerald-600`} />;
    if (isNegative) return <TrendingDown className={`${iconSizes[size]} text-red-600`} />;
    return <Minus className={`${iconSizes[size]} text-gray-400`} />;
  };

  const formatValue = () => {
    const sign = value > 0 ? '+' : '';
    switch (format) {
      case 'percent':
        return `${sign}${value.toFixed(0)}%`;
      case 'pp':
        return `${sign}${value.toFixed(0)}pp`;
      case 'number':
        return `${sign}${value.toFixed(0)}`;
      default:
        return `${sign}${value.toFixed(1)}`;
    }
  };

  if (variant === 'text') {
    return (
      <span className={`inline-flex items-center gap-0.5 font-semibold tabular-nums ${getColorClasses()}`}>
        {getIcon()}
        {formatValue()}
        {label && <span className="text-gray-500 ml-1 font-normal">{label}</span>}
      </span>
    );
  }

  if (variant === 'compact') {
    return (
      <span className={`inline-flex items-center font-semibold tabular-nums ${getColorClasses()}`}>
        {getIcon()}
        <span className="text-[10px]">{formatValue()}</span>
      </span>
    );
  }

  const baseClasses = variant === 'pill' 
    ? 'rounded-full' 
    : 'rounded-md border';

  return (
    <span className={`inline-flex items-center gap-1 ${baseClasses} ${getColorClasses()} ${sizeClasses[size]} font-semibold tabular-nums`}>
      {getIcon()}
      <span>{formatValue()}</span>
      {label && <span className="text-gray-500 ml-1 font-normal">{label}</span>}
    </span>
  );
};

// Simple color-coded value for tables
interface ChangeValueProps {
  value: number;
  format?: 'percent' | 'number' | 'pp';
  threshold?: number;
  showSign?: boolean;
}

export const ChangeValue: React.FC<ChangeValueProps> = ({
  value,
  format = 'percent',
  threshold = 2,
  showSign = true
}) => {
  const isPositive = value > threshold;
  const isNegative = value < -threshold;

  const getColor = () => {
    if (isPositive) return 'text-emerald-600';
    if (isNegative) return 'text-red-600';
    return 'text-gray-500';
  };

  const formatValue = () => {
    const sign = showSign && value > 0 ? '+' : '';
    switch (format) {
      case 'percent':
        return `${sign}${value.toFixed(0)}%`;
      case 'pp':
        return `${sign}${value.toFixed(0)}pp`;
      case 'number':
        return `${sign}${value.toFixed(0)}`;
      default:
        return `${sign}${value.toFixed(1)}`;
    }
  };

  return <span className={`${getColor()} font-semibold tabular-nums`}>{formatValue()}</span>;
};

// Growth pill badge for use in lists
interface GrowthPillProps {
  value: number;
  size?: 'xs' | 'sm' | 'md';
}

export const GrowthPill: React.FC<GrowthPillProps> = ({ value, size = 'sm' }) => {
  const isGrowing = value > 10;
  const isDeclining = value < -10;
  const isFlat = !isGrowing && !isDeclining;

  const sizeClasses = {
    xs: 'text-[9px] px-1 py-0.5',
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5'
  };

  const colorClasses = isGrowing 
    ? 'bg-emerald-100 text-emerald-700' 
    : isDeclining 
    ? 'bg-red-100 text-red-700' 
    : 'bg-amber-100 text-amber-700';

  const icon = isGrowing 
    ? <TrendingUp className={size === 'xs' ? 'h-2 w-2' : 'h-2.5 w-2.5'} />
    : isDeclining 
    ? <TrendingDown className={size === 'xs' ? 'h-2 w-2' : 'h-2.5 w-2.5'} />
    : <Minus className={size === 'xs' ? 'h-2 w-2' : 'h-2.5 w-2.5'} />;

  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full font-semibold tabular-nums ${colorClasses} ${sizeClasses[size]}`}>
      {icon}
      {value > 0 ? '+' : ''}{value.toFixed(0)}%
    </span>
  );
};
