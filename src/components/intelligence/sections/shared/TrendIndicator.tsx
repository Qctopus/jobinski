/**
 * TrendIndicator - Up/down/stable badges with percentage change
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from 'lucide-react';

interface TrendIndicatorProps {
  value: number;
  label?: string;
  format?: 'percent' | 'number' | 'pp';
  size?: 'sm' | 'md' | 'lg';
  threshold?: number;
  showIcon?: boolean;
  showArrow?: boolean;
}

export const TrendIndicator: React.FC<TrendIndicatorProps> = ({
  value,
  label,
  format = 'percent',
  size = 'md',
  threshold = 2,
  showIcon = true,
  showArrow = false
}) => {
  const isPositive = value > threshold;
  const isNegative = value < -threshold;
  const isNeutral = !isPositive && !isNegative;

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const getColorClasses = () => {
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

  return (
    <span className={`inline-flex items-center gap-1 rounded-md border ${getColorClasses()} ${sizeClasses[size]} font-medium`}>
      {getIcon()}
      <span>{formatValue()}</span>
      {label && <span className="text-gray-500 ml-1">{label}</span>}
    </span>
  );
};

// Simple color-coded value for tables
interface ChangeValueProps {
  value: number;
  format?: 'percent' | 'number' | 'pp';
  threshold?: number;
}

export const ChangeValue: React.FC<ChangeValueProps> = ({
  value,
  format = 'percent',
  threshold = 2
}) => {
  const isPositive = value > threshold;
  const isNegative = value < -threshold;

  const getColor = () => {
    if (isPositive) return 'text-emerald-600';
    if (isNegative) return 'text-red-600';
    return 'text-gray-500';
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

  return <span className={getColor()}>{formatValue()}</span>;
};

