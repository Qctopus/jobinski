/**
 * ComparisonTable - Enhanced reusable comparison tables with styling
 * Features: Tabular-nums, reduced padding, left-border accents
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TableColumn {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  format?: (value: any, row: any) => React.ReactNode;
}

interface ComparisonTableProps {
  columns: TableColumn[];
  data: Record<string, any>[];
  highlightFirst?: boolean;
  striped?: boolean;
  compact?: boolean;
  className?: string;
  showRowBorder?: boolean;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  columns,
  data,
  highlightFirst = false,
  striped = true,
  compact = false,
  className = '',
  showRowBorder = false
}) => {
  const alignClass = (align?: string) => {
    if (align === 'center') return 'text-center';
    if (align === 'right') return 'text-right';
    return 'text-left';
  };

  const cellPadding = compact ? 'px-2 py-1' : 'px-3 py-2';

  // Row accent colors based on index
  const accentColors = ['border-l-blue-500', 'border-l-indigo-500', 'border-l-purple-500', 'border-l-pink-500', 'border-l-emerald-500'];

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th 
                key={col.key}
                className={`${cellPadding} text-[10px] font-semibold text-gray-600 uppercase tracking-wider ${alignClass(col.align)}`}
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {data.map((row, i) => (
            <tr 
              key={i} 
              className={`
                ${striped && i % 2 === 1 ? 'bg-gray-50/50' : ''}
                ${highlightFirst && i === 0 ? 'bg-blue-50/50' : ''}
                ${showRowBorder ? `border-l-2 ${accentColors[i % accentColors.length]}` : ''}
                hover:bg-gray-50 transition-colors
              `}
            >
              {columns.map((col, j) => (
                <td 
                  key={col.key}
                  className={`${cellPadding} text-xs ${alignClass(col.align)} ${j === 0 ? 'font-medium text-gray-900' : 'text-gray-600'} tabular-nums`}
                >
                  {col.format ? col.format(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Preset formatters with improved styling
export const formatters = {
  percent: (value: number) => value !== undefined ? (
    <span className="tabular-nums">{value.toFixed(0)}%</span>
  ) : '—',
  
  change: (value: number) => {
    if (value === undefined) return '—';
    const isPositive = value > 2;
    const isNegative = value < -2;
    const color = isPositive ? 'text-emerald-600' : isNegative ? 'text-red-600' : 'text-gray-500';
    const sign = value > 0 ? '+' : '';
    return <span className={`${color} tabular-nums font-medium`}>{sign}{value.toFixed(0)}pp</span>;
  },

  gap: (value: number) => {
    if (value === undefined) return '—';
    const isPositive = value > 0;
    const isNegative = value < 0;
    const color = isPositive ? 'text-emerald-600' : isNegative ? 'text-red-600' : 'text-gray-500';
    const sign = value > 0 ? '+' : '';
    return <span className={`${color} tabular-nums font-medium`}>{sign}{value.toFixed(0)}pp</span>;
  },

  number: (value: number) => value !== undefined ? (
    <span className="tabular-nums">{value.toLocaleString()}</span>
  ) : '—',

  trend: (value: number) => {
    if (value === undefined) return <Minus className="h-3.5 w-3.5 text-gray-400" />;
    if (value > 5) return <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />;
    if (value < -5) return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
    return <Minus className="h-3.5 w-3.5 text-gray-400" />;
  },

  rank: (value: number) => value ? (
    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-semibold text-gray-700 tabular-nums">
      #{value}
    </span>
  ) : '—',

  days: (value: number) => value !== undefined ? (
    <span className="tabular-nums">{value.toFixed(0)}d</span>
  ) : '—',

  agency: (value: string, row: any) => (
    <div className="flex items-center gap-1.5">
      {row.isYou && <span className="text-[9px] bg-purple-100 text-purple-700 px-1 py-0.5 rounded font-medium">You</span>}
      <span className="truncate">{value}</span>
    </div>
  ),

  badge: (value: string, color: 'emerald' | 'amber' | 'red' | 'blue' | 'gray' = 'gray') => {
    const colors = {
      emerald: 'bg-emerald-100 text-emerald-700',
      amber: 'bg-amber-100 text-amber-700',
      red: 'bg-red-100 text-red-700',
      blue: 'bg-blue-100 text-blue-700',
      gray: 'bg-gray-100 text-gray-700'
    };
    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${colors[color]}`}>
        {value}
      </span>
    );
  }
};

// Mini comparison table for inline use - enhanced
interface MiniTableProps {
  title: string;
  rows: Array<{ label: string; value: string | number; comparison?: string | number }>;
  accentColor?: 'blue' | 'emerald' | 'amber' | 'purple' | 'indigo';
}

export const MiniTable: React.FC<MiniTableProps> = ({ title, rows, accentColor = 'blue' }) => {
  const borderColors = {
    blue: 'border-l-blue-500',
    emerald: 'border-l-emerald-500',
    amber: 'border-l-amber-500',
    purple: 'border-l-purple-500',
    indigo: 'border-l-indigo-500'
  };

  return (
    <div className={`bg-gray-50 rounded-lg p-2.5 border-l-2 ${borderColors[accentColor]}`}>
      <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">{title}</h4>
      <div className="space-y-0.5">
        {rows.map((row, i) => (
          <div key={i} className="flex justify-between items-center text-xs py-0.5">
            <span className="text-gray-500">{row.label}</span>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-gray-900 tabular-nums">{row.value}</span>
              {row.comparison !== undefined && (
                <span className="text-[10px] text-gray-400 tabular-nums">({row.comparison})</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
