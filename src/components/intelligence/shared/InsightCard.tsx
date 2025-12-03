/**
 * InsightCard Component
 * 
 * Reusable card for displaying insights with narrative text,
 * metrics, and optional visualizations.
 */

import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Info, CheckCircle, Minus } from 'lucide-react';

export interface InsightCardProps {
  title?: string;
  narrative: string | string[];
  metrics?: {
    label: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
  }[];
  variant?: 'default' | 'highlight' | 'warning' | 'success' | 'info';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

const InsightCard: React.FC<InsightCardProps> = ({
  title,
  narrative,
  metrics,
  variant = 'default',
  size = 'md',
  icon,
  children,
  className = ''
}) => {
  const variantStyles = {
    default: 'bg-white border-gray-200',
    highlight: 'bg-blue-50 border-blue-200',
    warning: 'bg-amber-50 border-amber-200',
    success: 'bg-emerald-50 border-emerald-200',
    info: 'bg-slate-50 border-slate-200'
  };

  const sizeStyles = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5'
  };

  const narrativeSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const narrativeArray = Array.isArray(narrative) ? narrative : [narrative];

  return (
    <div className={`rounded-lg border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {/* Header */}
      {(title || icon) && (
        <div className="flex items-center gap-2 mb-2">
          {icon}
          {title && (
            <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
          )}
        </div>
      )}

      {/* Narrative */}
      <div className={`${narrativeSize[size]} text-gray-700 leading-relaxed space-y-2`}>
        {narrativeArray.map((text, index) => (
          <p key={index}>{text}</p>
        ))}
      </div>

      {/* Metrics */}
      {metrics && metrics.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-4">
          {metrics.map((metric, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{metric.label}:</span>
              <span className="text-sm font-semibold text-gray-800">
                {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
              </span>
              {metric.change !== undefined && (
                <span className={`flex items-center gap-0.5 text-xs font-medium ${
                  metric.change > 0 ? 'text-emerald-600' : 
                  metric.change < 0 ? 'text-red-500' : 'text-gray-500'
                }`}>
                  {metric.change > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : metric.change < 0 ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : (
                    <Minus className="h-3 w-3" />
                  )}
                  {metric.changeLabel || `${metric.change > 0 ? '+' : ''}${metric.change.toFixed(0)}%`}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Optional children for custom content */}
      {children && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
};

export default InsightCard;



