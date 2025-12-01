/**
 * HeaderMetrics - Metrics row with period info for the Intelligence Brief
 * Note: Main header (agency + title) is now handled by TabHeader component
 */

import React from 'react';
import { MetricCard } from './shared';
import { KeyMetric } from '../../../services/analytics/IntelligenceBriefEngine';

interface HeaderMetricsProps {
  metrics: KeyMetric[];
  periodLabel: string;
  comparisonLabel: string;
}

export const HeaderMetrics: React.FC<HeaderMetricsProps> = ({
  metrics,
  periodLabel,
  comparisonLabel
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-600">
          <span className="font-medium">{periodLabel}</span>
          <span className="text-gray-400 mx-2">•</span> 
          <span className="text-gray-500">Trends compare to {comparisonLabel}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {metrics.map((metric, i) => (
          <MetricCard key={i} metric={metric} size="sm" />
        ))}
      </div>
    </div>
  );
};

