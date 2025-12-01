/**
 * Key Metrics Row
 * 
 * Compact horizontal row of 4 key metrics with subtle styling.
 * Appears below executive summary prose.
 */

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { KeyMetric } from '../../../services/analytics/IntelligenceBriefGenerator';

interface KeyMetricsRowProps {
  metrics: KeyMetric[];
}

const KeyMetricsRow: React.FC<KeyMetricsRowProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 mt-6 border-t border-gray-200">
      {metrics.map((metric, index) => (
        <div key={index} className="text-center">
          <div className="text-[11px] uppercase tracking-wider text-gray-500 mb-1">
            {metric.label}
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-lg font-semibold text-gray-900">
              {metric.value}
            </span>
            {metric.change && (
              <span className={`inline-flex items-center text-xs font-medium ${
                metric.changeDirection === 'up' 
                  ? 'text-emerald-600' 
                  : metric.changeDirection === 'down' 
                  ? 'text-amber-600' 
                  : 'text-gray-500'
              }`}>
                {metric.changeDirection === 'up' && <ArrowUpRight className="h-3 w-3" />}
                {metric.changeDirection === 'down' && <ArrowDownRight className="h-3 w-3" />}
                {metric.changeDirection === 'neutral' && <Minus className="h-3 w-3" />}
                {metric.change}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KeyMetricsRow;

