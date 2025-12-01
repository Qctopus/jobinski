"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportGeneratorService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
const ReportDataAggregator_1 = require("./ReportDataAggregator");
const InsightGenerator_1 = require("./InsightGenerator");
const PDFGenerator_1 = require("./PDFGenerator");
const sqlite_1 = __importDefault(require("../../config/sqlite"));
class ReportGeneratorService {
    constructor() {
        this.dataAggregator = new ReportDataAggregator_1.ReportDataAggregator();
        this.insightGenerator = new InsightGenerator_1.InsightGenerator();
        const publicDir = path.join(__dirname, '../../../../public');
        this.pdfGenerator = new PDFGenerator_1.PDFGenerator(publicDir);
        this.reportsDir = path.join(__dirname, '../../../../reports');
        if (!fs.existsSync(this.reportsDir)) {
            fs.mkdirSync(this.reportsDir, { recursive: true });
        }
    }
    async generateReport(request) {
        const startTime = Date.now();
        const reportId = (0, uuid_1.v4)();
        console.log(`[ReportGenerator] Starting report generation for ${request.agency}`);
        console.log(`[ReportGenerator] Period: ${request.reportPeriod.startDate} to ${request.reportPeriod.endDate}`);
        try {
            console.log('[ReportGenerator] Step 1: Aggregating agency metrics...');
            const agencyMetrics = await this.dataAggregator.aggregateAgencyMetrics(request.agency, request.reportPeriod.startDate, request.reportPeriod.endDate);
            if (agencyMetrics.volumeMetrics.totalPostings === 0) {
                return {
                    success: false,
                    error: `No job postings found for ${request.agency} in the specified period`,
                    generatedAt: new Date().toISOString(),
                    agency: request.agency,
                    pageCount: 0
                };
            }
            console.log('[ReportGenerator] Step 2: Calculating benchmarks...');
            const benchmarks = await this.dataAggregator.calculateBenchmarks(request.agency, request.reportPeriod.startDate, request.reportPeriod.endDate);
            console.log('[ReportGenerator] Step 3: Analyzing competitive landscape...');
            const competitiveIntelligence = await this.dataAggregator.calculateCompetitiveIntelligence(request.agency, request.reportPeriod.startDate, request.reportPeriod.endDate);
            console.log('[ReportGenerator] Step 4: Generating insights...');
            const insights = this.insightGenerator.generateInsights(agencyMetrics, benchmarks, competitiveIntelligence);
            console.log('[ReportGenerator] Step 5: Generating recommendations...');
            const recommendations = this.insightGenerator.generateRecommendations(agencyMetrics, benchmarks, competitiveIntelligence);
            let rawJobsData;
            if (request.includeRawData) {
                console.log('[ReportGenerator] Step 6: Fetching raw job data...');
                rawJobsData = await this.getRawJobData(request.agency, request.reportPeriod.startDate, request.reportPeriod.endDate);
            }
            const metadata = {
                reportId,
                agency: request.agency,
                agencyLongName: agencyMetrics.agencyInfo.longName,
                reportTitle: `${request.agency} Monthly HR Intelligence Report`,
                reportPeriod: {
                    startDate: request.reportPeriod.startDate,
                    endDate: request.reportPeriod.endDate,
                    displayPeriod: this.formatDisplayPeriod(request.reportPeriod.startDate, request.reportPeriod.endDate)
                },
                generatedAt: new Date().toISOString(),
                generatedBy: 'UN Jobs Analytics Platform',
                version: '1.0.0',
                pageCount: request.includeRawData ? 15 : 12,
                dataPoints: agencyMetrics.volumeMetrics.totalPostings
            };
            const reportData = {
                metadata,
                agencyMetrics,
                benchmarks,
                competitiveIntelligence,
                insights,
                recommendations,
                rawJobsData
            };
            console.log('[ReportGenerator] Step 7: Generating PDF...');
            const pdfDocDefinition = this.pdfGenerator.generatePDFDocument(reportData);
            const jsonPath = path.join(this.reportsDir, `${reportId}.json`);
            fs.writeFileSync(jsonPath, JSON.stringify(reportData, null, 2));
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
        }
        catch (error) {
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
    async getReportData(reportId) {
        const jsonPath = path.join(this.reportsDir, `${reportId}.json`);
        if (!fs.existsSync(jsonPath)) {
            return null;
        }
        const data = fs.readFileSync(jsonPath, 'utf-8');
        return JSON.parse(data);
    }
    async getPDFDefinition(reportId) {
        const pdfDefPath = path.join(this.reportsDir, `${reportId}-def.json`);
        if (!fs.existsSync(pdfDefPath)) {
            return null;
        }
        const data = fs.readFileSync(pdfDefPath, 'utf-8');
        return JSON.parse(data);
    }
    async listReports() {
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
            }
            catch (e) {
                console.warn(`Could not parse report file: ${file}`);
            }
        }
        return reports.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
    }
    async deleteReport(reportId) {
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
    async getAvailableAgencies() {
        const result = sqlite_1.default.prepare(`
      SELECT 
        short_agency as agency,
        COUNT(*) as count
      FROM jobs 
      WHERE short_agency IS NOT NULL
        AND short_agency != ''
      GROUP BY short_agency
      HAVING COUNT(*) >= 1
      ORDER BY count DESC
    `).all();
        return result.map(row => ({
            agency: row.agency,
            jobCount: row.count
        }));
    }
    formatDisplayPeriod(startDate, endDate) {
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
    async getRawJobData(agency, startDate, endDate) {
        const jobs = sqlite_1.default.prepare(`
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
    `).all(`%${agency}%`, `%${agency}%`, startDate, endDate);
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
exports.ReportGeneratorService = ReportGeneratorService;
exports.default = ReportGeneratorService;
//# sourceMappingURL=ReportGeneratorService.js.map