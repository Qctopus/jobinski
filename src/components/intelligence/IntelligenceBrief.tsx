/**
 * IntelligenceBrief - Main container for the Intelligence Tab
 * 
 * A comprehensive intelligence brief combining narrative structure with rich visualizations.
 * Includes cross-dimensional analysis and deep competitive insights.
 */

import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { Zap } from 'lucide-react';
import { ProcessedJobData } from '../../types';
import { IntelligenceBriefEngine, IntelligenceBriefData } from '../../services/analytics/IntelligenceBriefEngine';
import { TabHeader } from '../shared';
import {
  HeaderMetrics,
  ExecutiveSummary,
  HiringVolumeSection,
  WorkforcePatternSection,
  GeographicSection,
  CategorySection,
  CompetitiveSection,
  SignalsSection
} from './sections';

interface IntelligenceBriefProps {
  jobs: ProcessedJobData[];
  timeRange: string;
  selectedAgency?: string;
}

export const IntelligenceBrief: React.FC<IntelligenceBriefProps> = ({
  jobs,
  timeRange,
  selectedAgency
}) => {
  // Generate the intelligence brief data
  const briefData = useMemo<IntelligenceBriefData | null>(() => {
    if (!jobs || jobs.length === 0) return null;

    try {
      const engine = new IntelligenceBriefEngine();
      return engine.generate(jobs, timeRange, selectedAgency);
    } catch (error) {
      console.error('Error generating intelligence brief:', error);
      return null;
    }
  }, [jobs, timeRange, selectedAgency]);

  if (!briefData) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-gray-400 text-lg mb-2">No data available</div>
          <div className="text-gray-500 text-sm">
            Select a time range with job data to generate the intelligence brief
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Standardized Tab Header */}
      <TabHeader
        agencyName={briefData.agencyName}
        tabTitle="Intelligence Brief"
        stats={`${briefData.volume.total.toLocaleString()} positions`}
        isAgencyView={briefData.isAgencyView}
        icon={<Zap className="h-5 w-5" />}
      />
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header Metrics */}
        <HeaderMetrics
          metrics={briefData.headerMetrics}
          periodLabel={briefData.periodLabel}
          comparisonLabel={briefData.comparisonLabel}
        />

      {/* Main Content */}
      <div className="divide-y divide-gray-200">
        {/* Section 1: Executive Summary */}
        <ExecutiveSummary data={briefData.executiveSummary} />

        {/* Section 2: Hiring Volume & Momentum */}
        <HiringVolumeSection 
          data={briefData.volume} 
          agencyName={briefData.agencyName} 
        />

        {/* Section 3: Workforce Composition Patterns */}
        <WorkforcePatternSection 
          data={briefData.workforce} 
          agencyName={briefData.agencyName} 
        />

        {/* Section 4: Geographic Intelligence */}
        <GeographicSection 
          data={briefData.geographic} 
          agencyName={briefData.agencyName} 
        />

        {/* Section 5: Category Intelligence */}
        <CategorySection 
          data={briefData.category} 
          agencyName={briefData.agencyName} 
        />

        {/* Section 6: Competitive Intelligence */}
        <CompetitiveSection 
          data={briefData.competitive} 
          agencyName={briefData.agencyName} 
        />

        {/* Section 7: Signals & Watchlist */}
        <SignalsSection signals={briefData.signals} />
      </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            Generated {format(briefData.generatedAt, 'MMM d, yyyy \'at\' h:mm a')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default IntelligenceBrief;
