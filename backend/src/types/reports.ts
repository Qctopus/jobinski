/**
 * Types for UN Agency Monthly HR Intelligence Reports
 * Simplified version for practical report generation
 */

// ============================================
// REQUEST/RESPONSE TYPES
// ============================================

export interface GenerateReportRequest {
  agency: string;
  reportPeriod: {
    startDate: string;
    endDate: string;
  };
  sections?: ReportSection[];
  format?: 'pdf' | 'html';
  includeRawData?: boolean;
}

export interface GenerateReportResponse {
  success: boolean;
  reportUrl?: string;
  reportId?: string;
  generatedAt: string;
  agency: string;
  pageCount: number;
  error?: string;
  processingTime?: number;
}

export type ReportSection = 
  | 'all'
  | 'executive_summary'
  | 'hiring_activity'
  | 'workforce_composition'
  | 'category_intelligence'
  | 'geographic_intelligence'
  | 'competitive_intelligence'
  | 'strategic_insights'
  | 'appendix';

// ============================================
// AGENCY METRICS - Simplified
// ============================================

export interface AgencyReportMetrics {
  agencyInfo: {
    shortName: string;
    longName: string;
    logoPath: string | null;
    peerGroup: string;
    tier: number;
  };

  volumeMetrics: {
    totalPostings: number;
    activePostings: number;
    closingSoonPostings: number;
    expiredPostings: number;
    newPostingsThisMonth: number;
    previousMonthPostings: number;
    monthOverMonthChange: number;
  };

  applicationMetrics: {
    avgApplicationWindow: number;
    medianApplicationWindow: number;
    minApplicationWindow: number;
    maxApplicationWindow: number;
    urgentPositionsCount: number;
    urgentPositionsPercentage: number;
  };

  workforceComposition: {
    gradeDistribution: GradeDistributionItem[];
    seniorityDistribution: SeniorityDistributionItem[];
    staffTypeBreakdown: StaffTypeBreakdown;
    locationDistribution?: DutyStationItem[];
    languageRequirements?: any;
  };

  categoryAnalysis: {
    distribution: CategoryDistributionItem[];
    trendingCategories: string[];
    emergingCategories: string[];
    categoryDiversity: number;
  };

  geographicAnalysis: {
    regionDistribution: RegionDistributionItem[];
    topDutyStations: DutyStationItem[];
    hqVsFieldRatio: {
      hq: { count: number; percentage: number };
      field: { count: number; percentage: number };
      remote: { count: number; percentage: number };
    };
  };

  temporalAnalysis: {
    postingsByMonth: MonthlyPostingItem[];
    weekdayDistribution?: { weekday: string; count: number }[];
    peakPostingDay: string;
  };
}

export interface GradeDistributionItem {
  grade: string;
  count: number;
  percentage: number;
}

export interface SeniorityDistributionItem {
  level: string;
  count: number;
  percentage: number;
}

export interface StaffTypeBreakdown {
  international: { count: number; percentage: number };
  national: { count: number; percentage: number };
  consultant: { count: number; percentage: number };
  intern: { count: number; percentage: number };
  other: { count: number; percentage: number };
}

export interface CategoryDistributionItem {
  category: string;
  count: number;
  percentage: number;
}

export interface DutyStationItem {
  station: string;
  count: number;
  percentage: number;
}

export interface RegionDistributionItem {
  region: string;
  count: number;
  percentage: number;
}

export interface MonthlyPostingItem {
  month: string;
  count: number;
}

// ============================================
// BENCHMARK METRICS - Simplified
// ============================================

export interface BenchmarkMetrics {
  marketAverages: {
    avgPostingsPerAgency: number;
    avgApplicationWindow: number;
    avgActivePositions: number;
    marketTotalVolume: number;
  };
  peerAverages: {
    avgPostingsPerPeer: number;
    totalPeersActive: number;
    peerGroupVolume: number;
  };
  industryStandards: {
    targetApplicationWindow: number;
    targetActivePositionRatio: number;
    targetCategoryDiversity: number;
  };
}

// ============================================
// COMPETITIVE INTELLIGENCE - Simplified
// ============================================

export interface CompetitiveIntelligence {
  marketPosition: {
    marketRank: number;
    totalAgenciesInMarket: number;
    marketShare: number;
    volumeVsMarketAverage: number;
  };
  
  peerGroupComparison: {
    peerGroupName: string;
    peerGroupTier: number;
    peerAgencies: string[];
    yourRankInGroup: number;
    avgPostingsInGroup: number;
    yourPostings: number;
    performanceVsPeers: 'above' | 'at' | 'below';
  };

  competitorAnalysis: CompetitorAnalysisItem[];
  categoryCompetition: CategoryCompetitionItem[];
}

export interface CompetitorAnalysisItem {
  agency: string;
  volume: number;
  categoryOverlap: number;
  competitionLevel: 'high' | 'medium' | 'low';
}

export interface CategoryCompetitionItem {
  category: string;
  agencyShare: number;
  totalMarketVolume: number;
  competitorsCount: number;
  agencyRank: number;
}

// ============================================
// INSIGHTS & RECOMMENDATIONS
// ============================================

export interface ReportInsights {
  volumeInsights: Insight[];
  competitiveInsights: Insight[];
  strategicInsights: Insight[];
}

export interface Insight {
  type: 'positive' | 'negative' | 'neutral' | 'warning';
  title: string;
  description: string;
  metric?: string;
  value?: number | string;
  recommendation?: string;
}

export interface StrategicRecommendation {
  priority: 'high' | 'medium' | 'low';
  area: string;
  recommendation: string;
  rationale: string;
  impact: string;
  timeline?: string;
}

// ============================================
// REPORT DATA STRUCTURE
// ============================================

export interface ReportData {
  metadata: ReportMetadata;
  agencyMetrics: AgencyReportMetrics;
  benchmarks: BenchmarkMetrics;
  competitiveIntelligence: CompetitiveIntelligence;
  insights: ReportInsights;
  recommendations: StrategicRecommendation[];
  rawJobsData?: RawJobSummary[];
}

export interface ReportMetadata {
  reportId: string;
  agency: string;
  agencyLongName: string;
  reportTitle: string;
  reportPeriod: {
    startDate: string;
    endDate: string;
    displayPeriod: string;
  };
  generatedAt: string;
  generatedBy: string;
  version: string;
  pageCount: number;
  dataPoints: number;
}

export interface RawJobSummary {
  id: number;
  title: string;
  grade: string;
  location: string;
  postingDate: string;
  deadline: string;
  status: string;
  category: string;
}

// ============================================
// PDF STYLES
// ============================================

export interface PDFStyles {
  header: any;
  subheader: any;
  body: any;
  caption: any;
  tableHeader: any;
  tableCell: any;
  metric: any;
  metricLabel: any;
  insight: any;
  recommendation: any;
}

// ============================================
// CHART DATA
// ============================================

export interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'radar' | 'doughnut';
  title: string;
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    fill?: boolean;
  }[];
  options?: any;
}

export const AGENCY_COLORS: Record<string, string> = {
  'UNDP': '#0468B1',
  'UNICEF': '#1CABE2',
  'WFP': '#C62127',
  'UNHCR': '#0072BC',
  'WHO': '#009FDA',
  'FAO': '#006EA5',
  'UNESCO': '#0072BC',
  'default': '#0468B1'
};
