/**
 * Report Generation Services
 * Exports all report-related services
 */

export { ReportGeneratorService } from './ReportGeneratorService';
export { ReportDataAggregator } from './ReportDataAggregator';
export { InsightGenerator } from './InsightGenerator';
export { ChartGenerator } from './ChartGenerator';
export { PDFGenerator } from './PDFGenerator';

// Utilities
export { getAgencyLogo, getAgencyLogoAbsolutePath, getAgencyColor } from './utils/agencyLogos';
export { 
  getAgencyPeerGroup, 
  getPeerAgencies, 
  getAgencyTier, 
  arePeerAgencies, 
  getAgenciesInTier, 
  getPeerGroupDescription,
  PEER_GROUPS,
  SECRETARIAT_ENTITIES
} from './utils/peerGroups';





