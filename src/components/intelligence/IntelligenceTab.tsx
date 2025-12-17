/**
 * Intelligence Tab
 * 
 * Main container component for the Intelligence Tab.
 * Displays comprehensive cross-dimensional insights in a single scrollable page.
 */

import React, { useMemo } from 'react';
import { ProcessedJobData, FilterOptions } from '../../types';
import { useTimeframe } from '../../contexts/TimeframeContext';
import { IntelligenceInsightsEngine, intelligenceEngine } from '../../services/analytics/IntelligenceInsightsEngine';
import { AnomalyDetector, anomalyDetector } from '../../services/analytics/AnomalyDetector';
import { createNarrativeGenerator, NarrativeOptions } from '../../services/analytics/NarrativeGenerator';

import ExecutiveBriefing from './ExecutiveBriefing';
import VolumeVelocitySection from './VolumeVelocitySection';
import WorkforcePatternSection from './WorkforcePatternSection';
import GeographicIntelSection from './GeographicIntelSection';
import CategoryIntelSection from './CategoryIntelSection';
import CompetitiveIntelSection from './CompetitiveIntelSection';
import AnomaliesSignalsSection from './AnomaliesSignalsSection';

interface IntelligenceTabProps {
  data: ProcessedJobData[];
  filters: FilterOptions;
  isAgencyView: boolean;
  selectedAgencyName: string;
}

const IntelligenceTab: React.FC<IntelligenceTabProps> = ({
  data,
  filters,
  isAgencyView,
  selectedAgencyName
}) => {
  const { primaryPeriod, comparisonPeriod } = useTimeframe();

  // Initialize the intelligence engine and calculate all metrics
  const insights = useMemo(() => {
    // Initialize engine
    intelligenceEngine.initialize(
      data,
      filters.timeRange,
      isAgencyView ? selectedAgencyName : undefined
    );

    // Calculate all metrics
    const volumeMetrics = intelligenceEngine.calculateVolumeMetrics();
    const workforceMetrics = intelligenceEngine.calculateWorkforcePatterns();
    const geographicMetrics = intelligenceEngine.calculateGeographicMetrics();
    const categoryMetrics = intelligenceEngine.calculateCategoryMetrics();
    const competitiveMetrics = intelligenceEngine.calculateCompetitiveMetrics();
    const executiveSummary = intelligenceEngine.generateExecutiveSummary();

    // Initialize anomaly detector
    anomalyDetector.initialize(
      intelligenceEngine.getCurrentJobs(),
      intelligenceEngine.getPreviousJobs(),
      intelligenceEngine.getAllTimeJobs(),
      data, // Full market data
      isAgencyView ? selectedAgencyName : undefined
    );

    const anomalies = anomalyDetector.detectAllAnomalies();

    // Update anomaly count in executive summary
    executiveSummary.anomalyCount = anomalies.length;

    // Create narrative generator
    const narrativeOptions: NarrativeOptions = {
      agencyName: isAgencyView ? selectedAgencyName : undefined,
      periodLabel: primaryPeriod.label,
      isAgencyView,
      includeComparisons: comparisonPeriod !== null
    };

    const narrativeGenerator = createNarrativeGenerator(narrativeOptions);

    return {
      volumeMetrics,
      workforceMetrics,
      geographicMetrics,
      categoryMetrics,
      competitiveMetrics,
      executiveSummary,
      anomalies,
      narrativeGenerator,
      currentPeriod: intelligenceEngine.getCurrentPeriod(),
      previousPeriod: intelligenceEngine.getPreviousPeriod(),
      currentJobs: intelligenceEngine.getCurrentJobs(),
      previousJobs: intelligenceEngine.getPreviousJobs(),
      marketJobs: data
    };
  }, [data, filters.timeRange, isAgencyView, selectedAgencyName, primaryPeriod, comparisonPeriod]);

  const {
    volumeMetrics,
    workforceMetrics,
    geographicMetrics,
    categoryMetrics,
    competitiveMetrics,
    executiveSummary,
    anomalies,
    narrativeGenerator,
    currentPeriod,
    currentJobs,
    marketJobs
  } = insights;

  // Generate narratives for each section
  const volumeNarrative = useMemo(() => 
    narrativeGenerator.generateVolumeNarrative(volumeMetrics),
    [narrativeGenerator, volumeMetrics]
  );

  const workforceNarrative = useMemo(() => 
    narrativeGenerator.generateWorkforceNarrative(workforceMetrics),
    [narrativeGenerator, workforceMetrics]
  );

  const geographyNarrative = useMemo(() => 
    narrativeGenerator.generateGeographyNarrative(geographicMetrics),
    [narrativeGenerator, geographicMetrics]
  );

  const categoryNarrative = useMemo(() => 
    narrativeGenerator.generateCategoryNarrative(categoryMetrics),
    [narrativeGenerator, categoryMetrics]
  );

  const competitiveNarrative = useMemo(() => 
    isAgencyView ? narrativeGenerator.generateCompetitiveNarrative(competitiveMetrics) : null,
    [narrativeGenerator, competitiveMetrics, isAgencyView]
  );

  const executiveNarrative = useMemo(() =>
    narrativeGenerator.generateExecutiveNarrative(executiveSummary),
    [narrativeGenerator, executiveSummary]
  );

  return (
    <div className="space-y-6">
      {/* Section 1: Executive Briefing */}
      <ExecutiveBriefing
        summary={executiveSummary}
        narrative={executiveNarrative}
        isAgencyView={isAgencyView}
        agencyName={selectedAgencyName}
        periodLabel={currentPeriod?.label || ''}
        totalJobs={currentJobs.length}
        marketJobs={marketJobs.length}
      />

      {/* Section 2: Hiring Volume & Velocity */}
      <VolumeVelocitySection
        metrics={volumeMetrics}
        narrative={volumeNarrative}
        isAgencyView={isAgencyView}
        agencyName={selectedAgencyName}
      />

      {/* Section 3: Workforce Structure Patterns */}
      <WorkforcePatternSection
        metrics={workforceMetrics}
        narrative={workforceNarrative}
        isAgencyView={isAgencyView}
        agencyName={selectedAgencyName}
        currentJobs={currentJobs}
        marketJobs={marketJobs}
      />

      {/* Section 4: Geographic Intelligence */}
      <GeographicIntelSection
        metrics={geographicMetrics}
        narrative={geographyNarrative}
        isAgencyView={isAgencyView}
        agencyName={selectedAgencyName}
      />

      {/* Section 5: Category Intelligence */}
      <CategoryIntelSection
        metrics={categoryMetrics}
        narrative={categoryNarrative}
        isAgencyView={isAgencyView}
        agencyName={selectedAgencyName}
      />

      {/* Section 6: Competitive Intelligence (Agency View Only) */}
      {isAgencyView && competitiveNarrative && (
        <CompetitiveIntelSection
          metrics={competitiveMetrics}
          narrative={competitiveNarrative}
          agencyName={selectedAgencyName}
        />
      )}

      {/* Section 7: Anomalies & Signals */}
      <AnomaliesSignalsSection
        anomalies={anomalies}
        isAgencyView={isAgencyView}
        agencyName={selectedAgencyName}
      />
    </div>
  );
};

export default IntelligenceTab;







