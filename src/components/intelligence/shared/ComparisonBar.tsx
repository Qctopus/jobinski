/**
 * ComparisonBar Component
 * 
 * Visual comparison between two values with labels.
 */

import React from 'react';

export interface ComparisonBarProps {
  label: string;
  value1: number;
  value1Label?: string;
  value2: number;
  value2Label?: string;
  format?: 'percent' | 'number' | 'days';
  showDiff?: boolean;
  color1?: string;
  color2?: string;
  maxValue?: number;
  className?: string;
}

const ComparisonBar: React.FC<ComparisonBarProps> = ({
  label,
  value1,
  value1Label = 'You',
  value2,
  value2Label = 'Market',
  format = 'percent',
  showDiff = true,
  color1 = '#3B82F6',
  color2 = '#9CA3AF',
  maxValue,
  className = ''
}) => {
  const max = maxValue ?? Math.max(value1, value2, 1);
  const width1 = (value1 / max) * 100;
  const width2 = (value2 / max) * 100;
  const diff = value1 - value2;

  const formatValue = (v: number): string => {
    switch (format) {
      case 'percent':
        return `${v.toFixed(0)}%`;
      case 'days':
        return `${v.toFixed(0)}d`;
      default:
        return v.toLocaleString();
    }
  };

  const getDiffLabel = (): string => {
    const absDiff = Math.abs(diff);
    switch (format) {
      case 'percent':
        return `${diff > 0 ? '+' : ''}${diff.toFixed(0)}pp`;
      case 'days':
        return `${diff > 0 ? '+' : ''}${diff.toFixed(0)}d`;
      default:
        return `${diff > 0 ? '+' : ''}${absDiff.toLocaleString()}`;
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600 font-medium">{label}</span>
        <div className="flex items-center gap-3">
          <span className="font-semibold text-gray-800">
            {formatValue(value1)}
          </span>
          <span className="text-gray-400">vs</span>
          <span className="text-gray-600">
            {formatValue(value2)}
          </span>
          {showDiff && Math.abs(diff) > 0.5 && (
            <span className={`text-[10px] font-medium ${
              diff > 0 ? 'text-emerald-600' : 'text-red-500'
            }`}>
              ({getDiffLabel()})
            </span>
          )}
        </div>
      </div>
      
      {/* Bars */}
      <div className="flex gap-1 h-2">
        {/* Your value */}
        <div className="flex-1 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${width1}%`, backgroundColor: color1 }}
          />
        </div>
        {/* Market value */}
        <div className="flex-1 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${width2}%`, backgroundColor: color2 }}
          />
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex justify-between text-[9px] text-gray-400">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: color1 }} />
          <span>{value1Label}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: color2 }} />
          <span>{value2Label}</span>
        </div>
      </div>
    </div>
  );
};

export default ComparisonBar;







