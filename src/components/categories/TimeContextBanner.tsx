/**
 * Time Context Banner
 * 
 * Shows clear time period labels for comparisons.
 * Addresses Issue 6: Clarify time comparisons throughout the tab.
 */

import React from 'react';
import { Calendar, AlertTriangle, Clock } from 'lucide-react';

interface TimeContextBannerProps {
  currentPeriod: string;
  comparisonPeriod: string;
  comparisonType: '4weeks' | '8weeks' | '3months';
}

export const TimeContextBanner: React.FC<TimeContextBannerProps> = ({
  currentPeriod,
  comparisonPeriod,
  comparisonType
}) => {
  const comparisonLabel = 
    comparisonType === '4weeks' ? '4 weeks' : 
    comparisonType === '8weeks' ? '8 weeks' : '3 months';
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Calendar className="h-4 w-4 text-blue-600" />
        <div className="flex items-center gap-2 text-sm">
          <span className="text-blue-800">
            <strong>Current:</strong> {currentPeriod}
          </span>
          <span className="text-blue-400">vs</span>
          <span className="text-blue-800">
            <strong>Previous:</strong> {comparisonPeriod}
          </span>
        </div>
      </div>
      <div className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
        {comparisonLabel} comparison
      </div>
    </div>
  );
};

interface DataAvailabilityWarningProps {
  hasPreviousData: boolean;
  previousCount: number;
  currentCount: number;
}

export const DataAvailabilityWarning: React.FC<DataAvailabilityWarningProps> = ({
  hasPreviousData,
  previousCount,
  currentCount
}) => {
  if (!hasPreviousData || previousCount === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
        <span className="text-sm text-amber-800">
          No data available for comparison period. Showing current period only.
        </span>
      </div>
    );
  }
  
  if (previousCount < currentCount * 0.5) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
        <span className="text-sm text-amber-800">
          Limited data in comparison period ({previousCount} vs {currentCount} positions). 
          Trends may not be fully representative.
        </span>
      </div>
    );
  }
  
  return null;
};

interface ComparisonPeriodSelectorProps {
  value: '4weeks' | '8weeks' | '3months';
  onChange: (value: '4weeks' | '8weeks' | '3months') => void;
}

export const ComparisonPeriodSelector: React.FC<ComparisonPeriodSelectorProps> = ({
  value,
  onChange
}) => {
  return (
    <div className="flex items-center gap-4 bg-white rounded-lg border border-gray-200 px-4 py-3">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Comparison Period:</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange('4weeks')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            value === '4weeks'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Last 4 Weeks
        </button>
        <button
          onClick={() => onChange('8weeks')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            value === '8weeks'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Last 8 Weeks
        </button>
        <button
          onClick={() => onChange('3months')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            value === '3months'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Last 3 Months
        </button>
      </div>
      <div className="ml-auto text-xs text-gray-500">
        Comparing current period vs previous equivalent period
      </div>
    </div>
  );
};

export default TimeContextBanner;














