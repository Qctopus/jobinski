/**
 * Utilities Barrel Export
 * 
 * Consolidates all utility exports for cleaner imports.
 */

// Formatters
export * from './formatters';

// Grade Classification
export { 
  classifyGrade,
  getTierColor,
  getConsolidatedTier,
  PYRAMID_TIERS,
  NON_STAFF_CATEGORIES,
  SERVICE_AGREEMENT_INFO
} from './gradeClassification';
export type {
  GradeTier,
  ContractType,
  StaffCategory,
  ServiceAgreementType,
  GradeAnalysis
} from './gradeClassification';

// Location Classification
export * from './locationClassification';

// Category Utilities
export * from './categoryUtils';

// Temporal Analysis
export * from './temporalAnalysis';

// Agency Logos
export { getAgencyLogo, getAgenciesWithLogos } from './agencyLogos';

// Data Processing (CSV parsing)
export { parseCSVData } from './dataProcessor';

// Classification Admin
export * from './classificationAdmin';

// Correction Persistence
export * from './correctionPersistence';

