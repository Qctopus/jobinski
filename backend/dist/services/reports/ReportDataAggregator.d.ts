import { AgencyReportMetrics, BenchmarkMetrics, CompetitiveIntelligence } from '../../types/reports';
export declare class ReportDataAggregator {
    aggregateAgencyMetrics(agency: string, startDate: string, endDate: string): Promise<AgencyReportMetrics>;
    calculateBenchmarks(agency: string, startDate: string, endDate: string): Promise<BenchmarkMetrics>;
    calculateCompetitiveIntelligence(agency: string, startDate: string, endDate: string): Promise<CompetitiveIntelligence>;
    private getAgencyJobs;
    private getPreviousPeriodJobs;
    private getAllJobs;
    private getUniqueAgencies;
    private getAgencyInfo;
    private calculateVolumeMetrics;
    private calculateApplicationMetrics;
    private calculateWorkforceComposition;
    private calculateGradeDistribution;
    private calculateSeniorityDistribution;
    private inferSeniority;
    private calculateStaffTypeBreakdown;
    private calculateLocationDistribution;
    private calculateLanguageRequirements;
    private calculateCategoryAnalysis;
    private calculateDiversityIndex;
    private calculateGeographicAnalysis;
    private inferRegion;
    private calculateTemporalAnalysis;
    private calculateMarketAverages;
    private calculatePeerAverages;
    private calculateIndustryStandards;
    private analyzeCompetitors;
    private analyzeCategoryCompetition;
}
export default ReportDataAggregator;
//# sourceMappingURL=ReportDataAggregator.d.ts.map