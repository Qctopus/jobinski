/**
 * Time Comparison Selector
 * 
 * Reusable component for selecting comparison time periods.
 * Used across Categories and Workforce Structure tabs for consistency.
 * Matches the subdued style of the Intelligence tab.
 */

import React from 'react';
import { ChevronDown } from 'lucide-react';

export type ComparisonPeriod = '4weeks' | '8weeks' | '3months';

interface TimeComparisonSelectorProps {
  value: ComparisonPeriod;
  onChange: (value: ComparisonPeriod) => void;
  compact?: boolean;
}

const TimeComparisonSelector: React.FC<TimeComparisonSelectorProps> = ({
  value,
  onChange,
  compact = false
}) => {
  // Both compact and full versions now use the same dropdown style
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500">Analysis period:</span>
      <div className="relative inline-flex">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as ComparisonPeriod)}
          className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-1 pr-8 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="4weeks">Last 4 weeks</option>
          <option value="8weeks">Last 8 weeks</option>
          <option value="3months">Last 3 months</option>
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
};

export default TimeComparisonSelector;

