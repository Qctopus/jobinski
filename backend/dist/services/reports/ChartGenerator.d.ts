import { AgencyReportMetrics, BenchmarkMetrics, CompetitiveIntelligence, ChartData } from '../../types/reports';
export interface ReportCharts {
    postingTrendChart: ChartData;
    gradeDistributionChart: ChartData;
    categoryDistributionChart: ChartData;
    geographicDistributionChart: ChartData;
    staffTypeChart: ChartData;
}
export declare class ChartGenerator {
    generateAllCharts(metrics: AgencyReportMetrics, benchmarks: BenchmarkMetrics, competitive: CompetitiveIntelligence): ReportCharts;
    private generatePostingTrendChart;
    private generateGradeDistributionChart;
    private generateCategoryDistributionChart;
    private generateGeographicDistributionChart;
    private generateStaffTypeChart;
    private formatMonth;
    private generateColorPalette;
}
export default ChartGenerator;
//# sourceMappingURL=ChartGenerator.d.ts.map