/**
 * Strategic Findings Section
 * 
 * 4-5 self-contained insight blocks, each with:
 * - Headline (the insight)
 * - Context paragraph (what the data shows and means)
 * - Optional comparison table
 * - Implication (what to consider)
 */

import React from 'react';
import { StrategicFinding } from '../../../services/analytics/IntelligenceBriefGenerator';
import FindingBlock from './FindingBlock';

interface StrategicFindingsProps {
  findings: StrategicFinding[];
}

const StrategicFindings: React.FC<StrategicFindingsProps> = ({ findings }) => {
  if (!findings || findings.length === 0) {
    return null;
  }

  return (
    <section className="mb-12">
      {/* Section Header */}
      <div className="mb-6 pb-4 border-b-2 border-gray-200">
        <h2 className="text-lg font-bold text-gray-900">
          Strategic Findings
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Key patterns and their implications
        </p>
      </div>

      {/* Finding Blocks */}
      <div className="divide-y divide-gray-100">
        {findings.map((finding, index) => (
          <FindingBlock 
            key={index} 
            finding={finding} 
            index={index} 
          />
        ))}
      </div>
    </section>
  );
};

export default StrategicFindings;

