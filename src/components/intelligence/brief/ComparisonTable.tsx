/**
 * Comparison Table
 * 
 * Clean, minimal comparison table for strategic findings.
 * Max 5 columns, clear headers, subtle highlighting.
 */

import React from 'react';
import { ComparisonRow } from '../../../services/analytics/IntelligenceBriefGenerator';

interface ComparisonTableProps {
  rows: ComparisonRow[];
  className?: string;
}

const ComparisonTable: React.FC<ComparisonTableProps> = ({ rows, className = '' }) => {
  if (!rows || rows.length === 0) return null;

  // Extract headers from first row
  const headers = rows[0]?.values.map(v => v.header) || [];

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            {headers.map((header, index) => (
              <th
                key={index}
                className={`py-2 px-3 text-left font-medium text-gray-600 ${
                  index === 0 ? 'pl-0' : ''
                }`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(1).map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-gray-100 last:border-0">
              {row.values.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={`py-2.5 px-3 ${
                    cellIndex === 0 ? 'pl-0 text-gray-700' : 'text-gray-900'
                  } ${cell.highlight ? 'font-semibold text-blue-700 bg-blue-50/50' : ''}`}
                >
                  {cell.value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ComparisonTable;

