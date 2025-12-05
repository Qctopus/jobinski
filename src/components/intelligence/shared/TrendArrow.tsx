/**
 * TrendArrow Component
 * 
 * Simple trend indicator arrow with optional value.
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react';

export interface TrendArrowProps {
  value: number;
  format?: 'percent' | 'number' | 'pp';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showValue?: boolean;
  showIcon?: boolean;
  threshold?: number;
  variant?: 'default' | 'compact' | 'badge';
  reverseColors?: boolean; // For cases where lower is better
  className?: string;
}

const TrendArrow: React.FC<TrendArrowProps> = ({
  value,
  format = 'percent',
  size = 'sm',
  showValue = true,
  showIcon = true,
  threshold = 2,
  variant = 'default',
  reverseColors = false,
  className = ''
}) => {
  const isPositive = value > 0;
  const isNeutral = Math.abs(value) < threshold;
  
  // Determine color based on value and reverseColors
  let colorClass: string;
  if (isNeutral) {
    colorClass = 'text-gray-500';
  } else if (reverseColors) {
    colorClass = isPositive ? 'text-red-500' : 'text-emerald-600';
  } else {
    colorClass = isPositive ? 'text-emerald-600' : 'text-red-500';
  }

  const sizeStyles = {
    xs: { icon: 'h-3 w-3', text: 'text-[10px]' },
    sm: { icon: 'h-3.5 w-3.5', text: 'text-xs' },
    md: { icon: 'h-4 w-4', text: 'text-sm' },
    lg: { icon: 'h-5 w-5', text: 'text-base' }
  };

  const getIcon = () => {
    if (isNeutral) {
      return variant === 'compact' ? <ArrowRight className={sizeStyles[size].icon} /> : <Minus className={sizeStyles[size].icon} />;
    }
    if (variant === 'compact') {
      return isPositive 
        ? <ArrowUpRight className={sizeStyles[size].icon} />
        : <ArrowDownRight className={sizeStyles[size].icon} />;
    }
    return isPositive 
      ? <TrendingUp className={sizeStyles[size].icon} />
      : <TrendingDown className={sizeStyles[size].icon} />;
  };

  const formatValue = (): string => {
    const absValue = Math.abs(value);
    const sign = isPositive && !isNeutral ? '+' : '';
    
    switch (format) {
      case 'percent':
        return `${sign}${value.toFixed(0)}%`;
      case 'pp':
        return `${sign}${value.toFixed(1)}pp`;
      default:
        return `${sign}${value.toFixed(0)}`;
    }
  };

  if (variant === 'badge') {
    const bgColor = isNeutral 
      ? 'bg-gray-100' 
      : reverseColors
        ? (isPositive ? 'bg-red-100' : 'bg-emerald-100')
        : (isPositive ? 'bg-emerald-100' : 'bg-red-100');
    
    return (
      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${bgColor} ${colorClass} font-medium ${sizeStyles[size].text} ${className}`}>
        {showIcon && getIcon()}
        {showValue && formatValue()}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-0.5 ${colorClass} font-semibold ${sizeStyles[size].text} ${className}`}>
      {showIcon && getIcon()}
      {showValue && formatValue()}
    </span>
  );
};

export default TrendArrow;





