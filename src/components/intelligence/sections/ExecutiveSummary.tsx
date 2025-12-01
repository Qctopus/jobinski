/**
 * ExecutiveSummary - Prose briefing with vital signs
 */

import React from 'react';
import { Zap } from 'lucide-react';
import { ExecutiveSummary as ExecutiveSummaryData } from '../../../services/analytics/IntelligenceBriefEngine';
import { MetricCard } from './shared';

interface ExecutiveSummaryProps {
  data: ExecutiveSummaryData;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ data }) => {
  return (
    <section className="bg-gradient-to-br from-slate-50 to-white border-b border-gray-200">
      <div className="px-6 py-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-gray-900">Executive Briefing</h2>
        </div>

        {/* Narrative Paragraphs */}
        <div className="prose prose-slate max-w-none">
          {data.paragraphs.map((paragraph, i) => (
            <p key={i} className="text-gray-700 leading-relaxed mb-4 last:mb-0">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Vital Signs Row */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Key Indicators</span>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {data.vitalSigns.slice(0, 6).map((metric, i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-100 px-3 py-2 text-center">
                <div className="text-lg font-bold text-gray-900">{metric.value}</div>
                <div className="text-xs text-gray-500">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

