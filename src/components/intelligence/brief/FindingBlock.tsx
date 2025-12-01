/**
 * Finding Block
 * 
 * Self-contained strategic finding with:
 * - Bold headline
 * - Narrative paragraph
 * - Optional comparison table
 * - Italic implication
 */

import React from 'react';
import { StrategicFinding } from '../../../services/analytics/IntelligenceBriefGenerator';
import ComparisonTable from './ComparisonTable';

interface FindingBlockProps {
  finding: StrategicFinding;
  index: number;
}

const FindingBlock: React.FC<FindingBlockProps> = ({ finding, index }) => {
  return (
    <div className="py-6 border-b border-gray-100 last:border-0">
      {/* Headline */}
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        {finding.headline}
      </h3>

      {/* Narrative */}
      <p className="text-sm leading-relaxed text-gray-700 mb-4">
        {finding.narrative}
      </p>

      {/* Comparison Table */}
      {finding.comparisonData && finding.comparisonData.length > 1 && (
        <div className="my-4 bg-gray-50 rounded-lg p-4">
          <ComparisonTable rows={finding.comparisonData} />
        </div>
      )}

      {/* Implication */}
      <p className="text-sm italic text-gray-600 mt-4">
        <span className="font-medium not-italic text-gray-700">Consider: </span>
        {finding.implication}
      </p>
    </div>
  );
};

export default FindingBlock;

