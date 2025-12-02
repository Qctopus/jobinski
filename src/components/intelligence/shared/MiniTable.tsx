/**
 * MiniTable Component
 * 
 * Compact table for displaying structured data with comparisons.
 */

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export interface MiniTableColumn {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  format?: 'number' | 'percent' | 'string' | 'change';
  width?: string;
}

export interface MiniTableRow {
  id: string;
  [key: string]: string | number | undefined;
}

export interface MiniTableProps {
  columns: MiniTableColumn[];
  data: MiniTableRow[];
  showRowNumbers?: boolean;
  highlightFirstRow?: boolean;
  maxRows?: number;
  emptyMessage?: string;
  className?: string;
}

const MiniTable: React.FC<MiniTableProps> = ({
  columns,
  data,
  showRowNumbers = false,
  highlightFirstRow = false,
  maxRows = 10,
  emptyMessage = 'No data available',
  className = ''
}) => {
  const displayData = data.slice(0, maxRows);

  const formatValue = (value: string | number | undefined, format: MiniTableColumn['format']): React.ReactNode => {
    if (value === undefined || value === null) return '—';
    
    switch (format) {
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value;
      case 'percent':
        return typeof value === 'number' ? `${value.toFixed(0)}%` : value;
      case 'change':
        if (typeof value !== 'number') return value;
        const isPositive = value > 0;
        const isNeutral = Math.abs(value) < 1;
        const Icon = isNeutral ? Minus : isPositive ? ArrowUpRight : ArrowDownRight;
        const color = isNeutral ? 'text-gray-500' : isPositive ? 'text-emerald-600' : 'text-red-500';
        return (
          <span className={`inline-flex items-center gap-0.5 ${color} font-medium`}>
            <Icon className="h-3 w-3" />
            {isPositive && !isNeutral ? '+' : ''}{value.toFixed(0)}%
          </span>
        );
      default:
        return value;
    }
  };

  if (displayData.length === 0) {
    return (
      <div className={`text-center text-xs text-gray-400 py-4 ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-100">
            {showRowNumbers && (
              <th className="py-2 px-2 text-left text-gray-400 font-medium w-8">#</th>
            )}
            {columns.map(col => (
              <th 
                key={col.key}
                className={`py-2 px-2 text-gray-500 font-semibold ${
                  col.align === 'right' ? 'text-right' : 
                  col.align === 'center' ? 'text-center' : 'text-left'
                }`}
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayData.map((row, index) => (
            <tr 
              key={row.id}
              className={`border-b border-gray-50 ${
                highlightFirstRow && index === 0 ? 'bg-blue-50' : ''
              } hover:bg-gray-50 transition-colors`}
            >
              {showRowNumbers && (
                <td className="py-2 px-2 text-gray-400 font-medium">
                  {index + 1}
                </td>
              )}
              {columns.map(col => (
                <td 
                  key={col.key}
                  className={`py-2 px-2 ${
                    col.align === 'right' ? 'text-right' : 
                    col.align === 'center' ? 'text-center' : 'text-left'
                  } ${index === 0 && highlightFirstRow ? 'font-semibold text-blue-700' : 'text-gray-700'}`}
                >
                  {formatValue(row[col.key], col.format)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      {data.length > maxRows && (
        <div className="text-center text-[10px] text-gray-400 pt-2">
          Showing {maxRows} of {data.length} rows
        </div>
      )}
    </div>
  );
};

export default MiniTable;


