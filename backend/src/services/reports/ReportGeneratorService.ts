/**
 * Report Generator Service
 * Main orchestration service for generating agency reports
 */

import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  GenerateReportRequest,
  GenerateReportResponse,
  ReportData,
  ReportMetadata,
  RawJobSummary
} from '../../types/reports';
import { ReportDataAggregator } from './ReportDataAggregator';
import { InsightGenerator } from './InsightGenerator';
import { PDFGenerator } from './PDFGenerator';
import db from '../../config/sqlite';

export class ReportGeneratorService {
  private dataAggregator: ReportDataAggregator;
  private insightGenerator: InsightGenerator;
  private pdfGenerator: PDFGenerator;
  private reportsDir: string;

  constructor() {
    this.dataAggregator = new ReportDataAggregator();
    this.insightGenerator = new InsightGenerator();
    
    // Set up paths
    const publicDir = path.join(__dirname, '../../../../public');
    this.pdfGenerator = new PDFGenerator(publicDir);
    this.reportsDir = path.join(__dirname, '../../../../reports');
    
    // Ensure reports directory exists
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  /**
   * Generate a complete agency report
   */
  async generateReport(request: GenerateReportRequest): Promise<GenerateReportResponse> {
    const startTime = Date.now();
    const reportId = uuidv4();
    
    console.log(`[ReportGenerator] Starting report generation for ${request.agency}`);
    console.log(`[ReportGenerator] Period: ${request.reportPeriod.startDate} to ${request.reportPeriod.endDate}`);

    try {
      // Step 1: Aggregate all metrics
      console.log('[ReportGenerator] Step 1: Aggregating agency metrics...');
      const agencyMetrics = await this.dataAggregator.aggregateAgencyMetrics(
        request.agency,
        request.reportPeriod.startDate,
        request.reportPeriod.endDate
      );

      if (agencyMetrics.volumeMetrics.totalPostings === 0) {
        return {
          success: false,
          error: `No job postings found for ${request.agency} in the specified period`,
          generatedAt: new Date().toISOString(),
          agency: request.agency,
          pageCount: 0
        };
      }

      // Step 2: Calculate benchmarks
      console.log('[ReportGenerator] Step 2: Calculating benchmarks...');
      const benchmarks = await this.dataAggregator.calculateBenchmarks(
        request.agency,
        request.reportPeriod.startDate,
        request.reportPeriod.endDate
      );

      // Step 3: Calculate competitive intelligence
      console.log('[ReportGenerator] Step 3: Analyzing competitive landscape...');
      const competitiveIntelligence = await this.dataAggregator.calculateCompetitiveIntelligence(
        request.agency,
        request.reportPeriod.startDate,
        request.reportPeriod.endDate
      );

      // Step 4: Generate insights
      console.log('[ReportGenerator] Step 4: Generating insights...');
      const insights = this.insightGenerator.generateInsights(
        agencyMetrics,
        benchmarks,
        competitiveIntelligence
      );

      // Step 5: Generate recommendations
      console.log('[ReportGenerator] Step 5: Generating recommendations...');
      const recommendations = this.insightGenerator.generateRecommendations(
        agencyMetrics,
        benchmarks,
        competitiveIntelligence
      );

      // Step 6: Get raw job data if requested
      let rawJobsData: RawJobSummary[] | undefined;
      if (request.includeRawData) {
        console.log('[ReportGenerator] Step 6: Fetching raw job data...');
        rawJobsData = await this.getRawJobData(
          request.agency,
          request.reportPeriod.startDate,
          request.reportPeriod.endDate
        );
      }

      // Step 7: Create report metadata
      const metadata: ReportMetadata = {
        reportId,
        agency: request.agency,
        agencyLongName: agencyMetrics.agencyInfo.longName,
        reportTitle: `${request.agency} Monthly HR Intelligence Report`,
        reportPeriod: {
          startDate: request.reportPeriod.startDate,
          endDate: request.reportPeriod.endDate,
          displayPeriod: this.formatDisplayPeriod(
            request.reportPeriod.startDate,
            request.reportPeriod.endDate
          )
        },
        generatedAt: new Date().toISOString(),
        generatedBy: 'UN Jobs Analytics Platform',
        version: '1.0.0',
        pageCount: request.includeRawData ? 15 : 12,
        dataPoints: agencyMetrics.volumeMetrics.totalPostings
      };

      // Step 8: Assemble report data
      const reportData: ReportData = {
        metadata,
        agencyMetrics,
        benchmarks,
        competitiveIntelligence,
        insights,
        recommendations,
        rawJobsData
      };

      // Step 9: Generate PDF document definition
      console.log('[ReportGenerator] Step 7: Generating PDF...');
      const pdfDocDefinition = this.pdfGenerator.generatePDFDocument(reportData);

      // Step 10: Save report data as JSON (for potential re-generation)
      const jsonPath = path.join(this.reportsDir, `${reportId}.json`);
      fs.writeFileSync(jsonPath, JSON.stringify(reportData, null, 2));

      // Step 11: Save PDF definition (to be rendered by frontend or PDF service)
      const pdfDefPath = path.join(this.reportsDir, `${reportId}-def.json`);
      fs.writeFileSync(pdfDefPath, JSON.stringify(pdfDocDefinition, null, 2));

      const processingTime = Date.now() - startTime;
      console.log(`[ReportGenerator] Report generated successfully in ${processingTime}ms`);

      return {
        success: true,
        reportId,
        reportUrl: `/api/reports/download/${reportId}`,
        generatedAt: metadata.generatedAt,
        agency: request.agency,
        pageCount: metadata.pageCount,
        processingTime
      };

    } catch (error) {
      console.error('[ReportGenerator] Error generating report:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        generatedAt: new Date().toISOString(),
        agency: request.agency,
        pageCount: 0
      };
    }
  }

  /**
   * Get report data by ID
   */
  async getReportData(reportId: string): Promise<ReportData | null> {
    const jsonPath = path.join(this.reportsDir, `${reportId}.json`);
    
    if (!fs.existsSync(jsonPath)) {
      return null;
    }

    const data = fs.readFileSync(jsonPath, 'utf-8');
    return JSON.parse(data) as ReportData;
  }

  /**
   * Get PDF definition by ID
   */
  async getPDFDefinition(reportId: string): Promise<object | null> {
    const pdfDefPath = path.join(this.reportsDir, `${reportId}-def.json`);
    
    if (!fs.existsSync(pdfDefPath)) {
      return null;
    }

    const data = fs.readFileSync(pdfDefPath, 'utf-8');
    return JSON.parse(data);
  }

  /**
   * List available reports
   */
  async listReports(): Promise<{ reportId: string; agency: string; generatedAt: string }[]> {
    const files = fs.readdirSync(this.reportsDir)
      .filter(f => f.endsWith('.json') && !f.endsWith('-def.json'));
    
    const reports = [];
    for (const file of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(this.reportsDir, file), 'utf-8'));
        reports.push({
          reportId: data.metadata.reportId,
          agency: data.metadata.agency,
          generatedAt: data.metadata.generatedAt
        });
      } catch (e) {
        console.warn(`Could not parse report file: ${file}`);
      }
    }
    
    return reports.sort((a, b) => 
      new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    );
  }

  /**
   * Delete a report
   */
  async deleteReport(reportId: string): Promise<boolean> {
    const jsonPath = path.join(this.reportsDir, `${reportId}.json`);
    const pdfDefPath = path.join(this.reportsDir, `${reportId}-def.json`);
    
    let deleted = false;
    
    if (fs.existsSync(jsonPath)) {
      fs.unlinkSync(jsonPath);
      deleted = true;
    }
    
    if (fs.existsSync(pdfDefPath)) {
      fs.unlinkSync(pdfDefPath);
      deleted = true;
    }
    
    return deleted;
  }

  /**
   * Get list of available agencies with accurate job counts (from SQLite)
   */
  async getAvailableAgencies(): Promise<{ agency: string; jobCount: number }[]> {
    // Get distinct agencies from short_agency field (primary identifier) from SQLite
    const result = db.prepare(`
      SELECT 
        short_agency as agency,
        COUNT(*) as count
      FROM jobs 
      WHERE short_agency IS NOT NULL
        AND short_agency != ''
      GROUP BY short_agency
      HAVING COUNT(*) >= 1
      ORDER BY count DESC
    `).all() as any[];
    
    return result.map(row => ({
      agency: row.agency,
      jobCount: row.count
    }));
  }

  // =========================================
  // PRIVATE HELPER METHODS
  // =========================================

  private formatDisplayPeriod(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    if (start.getFullYear() === end.getFullYear()) {
      if (start.getMonth() === end.getMonth()) {
        return `${months[start.getMonth()]} ${start.getFullYear()}`;
      }
      return `${months[start.getMonth()]} - ${months[end.getMonth()]} ${end.getFullYear()}`;
    }
    
    return `${months[start.getMonth()]} ${start.getFullYear()} - ${months[end.getMonth()]} ${end.getFullYear()}`;
  }

  private async getRawJobData(
    agency: string,
    startDate: string,
    endDate: string
  ): Promise<RawJobSummary[]> {
    // Use SQLite for raw job data
    const jobs = db.prepare(`
      SELECT 
        id,
        title,
        up_grade as grade,
        duty_station as location,
        posting_date,
        apply_until,
        COALESCE(primary_category, sectoral_category, 'Uncategorized') as category,
        status,
        archived
      FROM jobs 
      WHERE (LOWER(short_agency) LIKE LOWER(?) OR LOWER(long_agency) LIKE LOWER(?))
        AND posting_date >= ? 
        AND posting_date <= ?
      ORDER BY posting_date DESC
      LIMIT 200
    `).all(`%${agency}%`, `%${agency}%`, startDate, endDate) as any[];
    
    return jobs.map(row => ({
      id: row.id,
      title: row.title,
      grade: row.grade || 'N/A',
      location: row.location || 'N/A',
      postingDate: row.posting_date,
      deadline: row.apply_until,
      status: row.status || 'Unknown',
      category: row.category
    }));
  }
}

export default ReportGeneratorService;

