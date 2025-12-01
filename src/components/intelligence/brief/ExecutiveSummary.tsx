/**
 * Executive Summary Section
 * 
 * 3-4 flowing paragraphs covering:
 * 1. Volume & Position
 * 2. Strategic Shifts
 * 3. Competitive Context
 * 4. Key Tension or Risk
 * 
 * Followed by compact key metrics row.
 */

import React from 'react';
import { ExecutiveSummary as ExecutiveSummaryType } from '../../../services/analytics/IntelligenceBriefGenerator';
import KeyMetricsRow from './KeyMetricsRow';

interface ExecutiveSummaryProps {
  summary: ExecutiveSummaryType;
  agencyName?: string;
  periodLabel: string;
}

const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  summary,
  agencyName,
  periodLabel
}) => {
  return (
    <section className="mb-12">
      {/* Section Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          {agencyName ? `${agencyName} Intelligence Brief` : 'UN Talent Market Brief'}
        </h2>
        <p className="text-sm text-gray-500">
          {periodLabel}
        </p>
      </div>

      {/* Narrative Paragraphs */}
      <div className="prose prose-sm max-w-none">
        {summary.paragraphs.map((paragraph, index) => (
          <p 
            key={index} 
            className="text-base leading-relaxed text-gray-700 mb-4"
          >
            {paragraph}
          </p>
        ))}
      </div>

      {/* Key Metrics Row */}
      <KeyMetricsRow metrics={summary.keyMetrics} />
    </section>
  );
};

export default ExecutiveSummary;

