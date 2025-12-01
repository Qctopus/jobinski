/**
 * ComparisonTable - Reusable comparison tables with styling
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
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  columns,
  data,
  highlightFirst = false,
  striped = true,
  compact = false,
  className = ''
}) => {
  const alignClass = (align?: string) => {
    if (align === 'center') return 'text-center';
    if (align === 'right') return 'text-right';
    return 'text-left';
  };

  const cellPadding = compact ? 'px-3 py-1.5' : 'px-4 py-2.5';

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col, i) => (
              <th 
                key={col.key}
                className={`${cellPadding} text-xs font-semibold text-gray-600 uppercase tracking-wider ${alignClass(col.align)}`}
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
                hover:bg-gray-50 transition-colors
              `}
            >
              {columns.map((col, j) => (
                <td 
                  key={col.key}
                  className={`${cellPadding} text-sm ${alignClass(col.align)} ${j === 0 ? 'font-medium text-gray-900' : 'text-gray-600'}`}
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

// Preset formatters
export const formatters = {
  percent: (value: number) => value !== undefined ? `${value.toFixed(0)}%` : '—',
  
  change: (value: number) => {
    if (value === undefined) return '—';
    const isPositive = value > 2;
    const isNegative = value < -2;
    const color = isPositive ? 'text-emerald-600' : isNegative ? 'text-red-600' : 'text-gray-500';
    const sign = value > 0 ? '+' : '';
    return <span className={color}>{sign}{value.toFixed(0)}pp</span>;
  },

  gap: (value: number) => {
    if (value === undefined) return '—';
    const isPositive = value > 0;
    const isNegative = value < 0;
    const color = isPositive ? 'text-emerald-600' : isNegative ? 'text-red-600' : 'text-gray-500';
    const sign = value > 0 ? '+' : '';
    return <span className={color}>{sign}{value.toFixed(0)}pp</span>;
  },

  number: (value: number) => value !== undefined ? value.toLocaleString() : '—',

  trend: (value: number) => {
    if (value === undefined) return <Minus className="h-4 w-4 text-gray-400" />;
    if (value > 5) return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    if (value < -5) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  },

  rank: (value: number) => value ? `#${value}` : '—',

  days: (value: number) => value !== undefined ? `${value.toFixed(0)}d` : '—',

  agency: (value: string, row: any) => (
    <div className="flex items-center gap-2">
      {row.isYou && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">You</span>}
      <span>{value}</span>
    </div>
  )
};

// Mini comparison table for inline use
interface MiniTableProps {
  title: string;
  rows: Array<{ label: string; value: string | number; comparison?: string | number }>;
}

export const MiniTable: React.FC<MiniTableProps> = ({ title, rows }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">{title}</h4>
      <div className="space-y-1">
        {rows.map((row, i) => (
          <div key={i} className="flex justify-between items-center text-sm">
            <span className="text-gray-600">{row.label}</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{row.value}</span>
              {row.comparison !== undefined && (
                <span className="text-xs text-gray-400">({row.comparison})</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

