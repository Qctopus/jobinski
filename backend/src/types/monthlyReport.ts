/**
 * Types for Monthly Report Data
 * Used by MonthlyReportDataAggregator and ReportGenerator
 */

import { StrategicRecommendation } from './reports';

export interface MonthlyReportData {
    reportPeriod: MonthlyReportPeriod;
    agency: MonthlyReportAgency;
    executiveSummary: ExecutiveSummary;
    competitive: CompetitiveData;
    temporal: TemporalData;
    workforce: WorkforceData;
    categories: CategoryData;
    skills: SkillsData;
    recommendations: ReportRecommendation[];
    benchmarks: ReportBenchmarks;
    dataFreshness: {
        lastSync: string;
        jobCount: number;
        agencyCount: number;
    };
}

export interface MonthlyReportPeriod {
    month: string;
    startDate: string;
    endDate: string;
    generatedAt: string;
}

export interface MonthlyReportAgency {
    shortName: string;
    longName: string;
    tier: number;
    peerGroup: string;
    logoUrl?: string;
}

export interface ExecutiveSummary {
    totalPostings: number;
    momChange: number;
    marketShareRank: number;
    totalAgencies: number;
    avgApplicationWindow: number;
    marketAvgWindow: number;
    hiringVelocity: number;
    competitiveScore: number;
    keyFindings: string[];
    comparisonTable: ComparisonTableItem[];
    radarData: RadarData;
}

export interface ComparisonTableItem {
    metric: string;
    yourAgency: string | number;
    marketAvg: string | number;
    topPerformer: { value: string | number; agency: string };
    yourRank: number | string;
}

export interface RadarData {
    dimensions: string[];
    yourScores: number[];
    marketAvgScores: number[];
}

export interface CompetitiveData {
    marketShare: number;
    marketShareTrend: MarketShareTrendItem[];
    topCompetitors: TopCompetitorItem[];
    talentWarZones: TalentWarZoneItem[];
    strategicSignals: StrategicSignalItem[];
    positioningMatrix: PositioningMatrixItem[];
}

export interface MarketShareTrendItem {
    period: string;
    share: number;
}

export interface TopCompetitorItem {
    agency: string;
    volume: number;
    growth: number;
    categoryOverlap: number;
    threatLevel: 'high' | 'medium' | 'low';
}

export interface TalentWarZoneItem {
    category: string;
    yourShare: number;
    leaderAgency: string;
    leaderShare: number;
    competitorCount: number;
    intensity: 'high' | 'medium' | 'low';
}

export interface StrategicSignalItem {
    type: 'warning' | 'opportunity' | 'action';
    title: string;
    description: string;
}

export interface PositioningMatrixItem {
    agency: string;
    volume: number;
    growthRate: number;
    categoryDiversity: number;
    tier: number;
    isYou: boolean;
}

export interface TemporalData {
    postedVsOpen: PostedVsOpenItem[];
    seasonalPattern: SeasonalPattern;
    applicationWindows: ApplicationWindows;
    hiringVelocityTrend: HiringVelocityTrendItem[];
}

export interface PostedVsOpenItem {
    period: string;
    posted: number;
    open: number;
    closed: number;
    netChange: number;
}

export interface SeasonalPattern {
    highMonths: string[];
    lowMonths: string[];
    currentVsTypical: number;
    heatmapData: HeatmapDataItem[];
}

export interface HeatmapDataItem {
    month: string;
    year: number;
    value: number;
}

export interface ApplicationWindows {
    urgent: WindowStats;
    normal: WindowStats;
    extended: WindowStats;
    long: WindowStats;
    marketComparison: {
        yourDistribution: number[];
        marketDistribution: number[];
    };
}

export interface WindowStats {
    count: number;
    percentage: number;
}

export interface HiringVelocityTrendItem {
    period: string;
    velocity: number;
    momentum: 'accelerating' | 'decelerating' | 'steady';
}

export interface WorkforceData {
    seniorityDistribution: SeniorityDistItem[];
    seniorityTrend: SeniorityTrendItem[];
    contractTypes: ContractTypeStats;
    geographic: GeographicStats;
    topLocations: TopLocationItem[];
    locationMapData: any[];
}

export interface SeniorityDistItem {
    level: string;
    count: number;
    percentage: number;
    marketAvg: number;
}

export interface SeniorityTrendItem {
    period: string;
    executive: number;
    senior: number;
    mid: number;
    entry: number;
    intern: number;
}

export interface ContractTypeStats {
    staff: { count: number; percentage: number };
    serviceAgreement: { count: number; percentage: number };
    consultant: { count: number; percentage: number };
    intern: { count: number; percentage: number };
    trend: ContractTypeTrendItem[];
}

export interface ContractTypeTrendItem {
    period: string;
    staff: number;
    consultant: number;
    intern: number;
}

export interface GeographicStats {
    hq: { count: number; percentage: number };
    regional: { count: number; percentage: number };
    field: { count: number; percentage: number };
    remote: { count: number; percentage: number };
}

export interface TopLocationItem {
    location: string;
    count: number;
    change: number;
    trend: 'stable' | 'up' | 'down';
}

export interface CategoryData {
    distribution: CategoryDistItem[];
    bcgMatrix: BCGMatrix;
    emerging: EmergingCategoryItem[];
    declining: DecliningCategoryItem[];
    timeline: CategoryTimelineItem[];
    dominanceTable: DominanceTableItem[];
}

export interface CategoryDistItem {
    category: string;
    count: number;
    percentage: number;
    growth: number;
    marketShare: number;
    marketLeader: string;
    yourRank: number;
}

export interface BCGMatrix {
    stars: BCGMatrixItem[];
    questionMarks: BCGMatrixItem[];
    cashCows: BCGMatrixItem[];
    dogs: BCGMatrixItem[];
}

export interface BCGMatrixItem {
    category: string;
    growth: number;
    share: number;
}

export interface EmergingCategoryItem {
    category: string;
    growth: number;
    agencies: number;
}

export interface DecliningCategoryItem {
    category: string;
    decline: number;
}

export interface CategoryTimelineItem {
    period: string;
    [key: string]: number | string;
}

export interface DominanceTableItem {
    category: string;
    yourShare: number;
    marketLeader: string;
    leaderShare: number;
    yourRank: number;
    trend: 'up' | 'down' | 'stable';
}

export interface SkillsData {
    topSkills: TopSkillItem[];
    emerging: any[];
    languages: LanguageData;
    skillBubbleData: SkillBubbleItem[];
}

export interface TopSkillItem {
    skill: string;
    demand: number;
    growth: number;
    yourVsMarket: number;
    category: string;
}

export interface LanguageData {
    required: LanguageItem[];
    desired: any[];
    multilingualRate: number;
    marketComparison: {
        yourRate: number;
        marketRate: number;
    };
}

export interface LanguageItem {
    language: string;
    count: number;
    percentage: number;
}

export interface SkillBubbleItem {
    skill: string;
    demand: number;
    growth: number;
    agenciesCount: number;
    category: string;
}

export interface ReportRecommendation {
    priority: 'high' | 'medium' | 'low';
    area: string;
    title: string;
    rationale: string;
    impact: string;
    timeline: 'immediate' | 'quarter' | 'year'; // Updated to match determineTimeline in aggregator
}

export interface ReportBenchmarks {
    marketAverages: {
        postingsPerAgency: number;
        avgApplicationWindow: number;
        seniorRatio: number;
        consultantRatio: number;
        categoryDiversity: number;
    };
    topPerformer: {
        agency: string;
        metrics: {
            volume: number;
            marketShare: number;
            applicationWindow: number;
            categoryCount: number;
        }
    };
    peerGroupAverages: {
        postings: number;
        growth: number;
        applicationWindow: number;
    };
}

export const AGENCY_BRAND_COLORS: Record<string, { primary: string; secondary: string }> = {
    'UNDP': { primary: '#0468B1', secondary: '#003366' },
    'UNICEF': { primary: '#1CABE2', secondary: '#374EA2' },
    'WFP': { primary: '#C62127', secondary: '#8A1519' },
    'UNHCR': { primary: '#0072BC', secondary: '#004C7E' },
    'WHO': { primary: '#009FDA', secondary: '#005C8A' },
    'FAO': { primary: '#006EA5', secondary: '#004669' },
    'UNESCO': { primary: '#0072BC', secondary: '#004C7E' },
    'default': { primary: '#0468B1', secondary: '#003366' }
};

export const UN_DESIGN_TOKENS = {
    colors: {
        blue: '#009EDB',
        navy: '#00477E',
        orange: '#F5A623',
        green: '#34C759',
        red: '#FF3B30',
        gray: '#666666'
    }
};
