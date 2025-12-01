/**
 * Analytics Services Barrel Export
 * 
 * Consolidates all analytics service exports for cleaner imports.
 */

// Core Analytics
export { AnomalyDetector } from './AnomalyDetector';
export { MetricsCalculator } from './MetricsCalculator';
export { TemporalAnalyzer } from './TemporalAnalyzer';
export { SurgeDetector } from './SurgeDetector';

// Category Analysis
export { CategoryEvolutionAnalyzer } from './CategoryEvolutionAnalyzer';
export { CategoryShiftAnalyzer } from './CategoryShiftAnalyzer';

// Competitive Analysis
export { CompetitiveAnalyzer } from './CompetitiveAnalyzer';
export { CompetitiveEvolutionTracker } from './CompetitiveEvolutionTracker';

// Geographic Analysis
export { GeographyIntelligenceAnalyzer } from './GeographyIntelligenceAnalyzer';

// Workforce Analysis
export { GradePyramidAnalyzer } from './GradePyramidAnalyzer';
export { WorkforceAnalyzer } from './WorkforceAnalyzer';
export { WorkforceStructureAnalyzer } from './WorkforceStructureAnalyzer';

// Skills Analysis
export { SkillDemandAnalyzer } from './SkillDemandAnalyzer';

// Intelligence & Narrative Generation
export { IntelligenceBriefEngine } from './IntelligenceBriefEngine';
export { IntelligenceBriefGenerator, briefGenerator } from './IntelligenceBriefGenerator';
export { NarrativeGenerator, createNarrativeGenerator } from './NarrativeGenerator';

// Intelligence Insights Engine (types and engine)
export * from './IntelligenceInsightsEngine';

