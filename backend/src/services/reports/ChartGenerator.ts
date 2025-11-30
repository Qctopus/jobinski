/**
 * Chart Generator Service
 * Generates chart data for the report
 */

import {
  AgencyReportMetrics,
  BenchmarkMetrics,
  CompetitiveIntelligence,
  ChartData
} from '../../types/reports';

export interface ReportCharts {
  postingTrendChart: ChartData;
  gradeDistributionChart: ChartData;
  categoryDistributionChart: ChartData;
  geographicDistributionChart: ChartData;
  staffTypeChart: ChartData;
}

export class ChartGenerator {

  /**
   * Generate all chart data for the report
   */
  generateAllCharts(
    metrics: AgencyReportMetrics,
    benchmarks: BenchmarkMetrics,
    competitive: CompetitiveIntelligence
  ): ReportCharts {
    return {
      postingTrendChart: this.generatePostingTrendChart(metrics),
      gradeDistributionChart: this.generateGradeDistributionChart(metrics),
      categoryDistributionChart: this.generateCategoryDistributionChart(metrics),
      geographicDistributionChart: this.generateGeographicDistributionChart(metrics),
      staffTypeChart: this.generateStaffTypeChart(metrics)
    };
  }

  /**
   * Posting volume trend over time
   */
  private generatePostingTrendChart(metrics: AgencyReportMetrics): ChartData {
    const monthlyData = metrics.temporalAnalysis.postingsByMonth;
    
    return {
      type: 'line',
      title: 'Posting Volume Trend',
      labels: monthlyData.map(m => this.formatMonth(m.month)),
      datasets: [{
        label: 'Postings',
        data: monthlyData.map(m => m.count),
        borderColor: '#0468B1',
        backgroundColor: 'rgba(4, 104, 177, 0.1)',
        fill: true
      }]
    };
  }

  /**
   * Grade distribution bar chart
   */
  private generateGradeDistributionChart(metrics: AgencyReportMetrics): ChartData {
    const gradeData = metrics.workforceComposition.gradeDistribution.slice(0, 10);
    
    return {
      type: 'bar',
      title: 'Grade Distribution',
      labels: gradeData.map(g => g.grade),
      datasets: [{
        label: 'Positions',
        data: gradeData.map(g => g.count),
        backgroundColor: this.generateColorPalette(gradeData.length)
      }]
    };
  }

  /**
   * Category distribution pie chart
   */
  private generateCategoryDistributionChart(metrics: AgencyReportMetrics): ChartData {
    const categoryData = metrics.categoryAnalysis.distribution.slice(0, 8);
    
    return {
      type: 'pie',
      title: 'Category Distribution',
      labels: categoryData.map(c => c.category),
      datasets: [{
        label: 'Positions',
        data: categoryData.map(c => c.count),
        backgroundColor: this.generateColorPalette(categoryData.length)
      }]
    };
  }

  /**
   * Geographic distribution chart
   */
  private generateGeographicDistributionChart(metrics: AgencyReportMetrics): ChartData {
    const regionData = metrics.geographicAnalysis.regionDistribution.slice(0, 8);
    
    return {
      type: 'bar',
      title: 'Geographic Distribution',
      labels: regionData.map(r => r.region),
      datasets: [{
        label: 'Positions',
        data: regionData.map(r => r.count),
        backgroundColor: this.generateColorPalette(regionData.length)
      }]
    };
  }

  /**
   * Staff type distribution chart
   */
  private generateStaffTypeChart(metrics: AgencyReportMetrics): ChartData {
    const staffData = metrics.workforceComposition.staffTypeBreakdown;
    
    const labels = ['International', 'National', 'Consultant', 'Intern', 'Other'];
    const data = [
      staffData.international.count,
      staffData.national.count,
      staffData.consultant.count,
      staffData.intern.count,
      staffData.other.count
    ].filter(d => d > 0);

    const dataValues = [
      staffData.international.count,
      staffData.national.count,
      staffData.consultant.count,
      staffData.intern.count,
      staffData.other.count
    ];
    const filteredLabels = labels.filter((_, i) => (dataValues[i] ?? 0) > 0);

    return {
      type: 'doughnut',
      title: 'Staff Type Breakdown',
      labels: filteredLabels,
      datasets: [{
        label: 'Positions',
        data,
        backgroundColor: ['#0468B1', '#28A745', '#FFC107', '#17A2B8', '#6C757D']
      }]
    };
  }

  /**
   * Format month string for display
   */
  private formatMonth(monthStr: string | undefined): string {
    if (!monthStr) return 'N/A';
    const parts = monthStr.split('-');
    const year = parts[0] || 'N/A';
    const month = parts[1] || '01';
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = parseInt(month, 10) - 1;
    return `${monthNames[monthIndex] || month} ${year}`;
  }

  /**
   * Generate a color palette
   */
  private generateColorPalette(count: number): string[] {
    const colors = [
      '#0468B1', '#1CABE2', '#28A745', '#FFC107', '#DC3545',
      '#6F42C1', '#FD7E14', '#20C997', '#E83E8C', '#17A2B8'
    ];
    return colors.slice(0, count);
  }
}

export default ChartGenerator;
