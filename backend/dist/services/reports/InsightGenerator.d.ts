import { AgencyReportMetrics, BenchmarkMetrics, CompetitiveIntelligence, ReportInsights, StrategicRecommendation } from '../../types/reports';
export declare class InsightGenerator {
    generateInsights(metrics: AgencyReportMetrics, benchmarks: BenchmarkMetrics, competitive: CompetitiveIntelligence): ReportInsights;
    generateRecommendations(metrics: AgencyReportMetrics, benchmarks: BenchmarkMetrics, competitive: CompetitiveIntelligence): StrategicRecommendation[];
    private generateVolumeInsights;
    private generateCompetitiveInsights;
    private generateStrategicInsights;
}
export default InsightGenerator;
//# sourceMappingURL=InsightGenerator.d.ts.map