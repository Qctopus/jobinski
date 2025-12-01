"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ReportGeneratorService_1 = require("../services/reports/ReportGeneratorService");
const MonthlyReportDataAggregator_1 = require("../services/reports/MonthlyReportDataAggregator");
const HTMLReportGenerator_1 = require("../services/reports/HTMLReportGenerator");
const router = express_1.default.Router();
const reportService = new ReportGeneratorService_1.ReportGeneratorService();
const monthlyReportAggregator = new MonthlyReportDataAggregator_1.MonthlyReportDataAggregator();
const htmlReportGenerator = new HTMLReportGenerator_1.HTMLReportGenerator();
router.post('/generate', async (req, res) => {
    try {
        const request = {
            agency: req.body.agency,
            reportPeriod: {
                startDate: req.body.reportPeriod?.startDate || '2025-10-01',
                endDate: req.body.reportPeriod?.endDate || '2025-11-30'
            },
            sections: req.body.sections || ['all'],
            format: req.body.format || 'pdf',
            includeRawData: req.body.includeRawData !== false
        };
        if (!request.agency) {
            res.status(400).json({
                success: false,
                error: 'Agency name is required',
                timestamp: new Date().toISOString()
            });
            return;
        }
        console.log(`[Reports API] Generate report request for ${request.agency}`);
        const result = await reportService.generateReport(request);
        if (result.success) {
            res.json(result);
        }
        else {
            res.status(400).json(result);
        }
    }
    catch (error) {
        console.error('[Reports API] Error:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Internal server error',
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/list', async (req, res) => {
    try {
        const reports = await reportService.listReports();
        res.json({
            success: true,
            data: reports,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('[Reports API] Error listing reports:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to list reports',
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/agencies', async (req, res) => {
    try {
        const agencies = await reportService.getAvailableAgencies();
        res.json({
            success: true,
            data: agencies,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('[Reports API] Error fetching agencies:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch agencies',
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/preview/:agency', async (req, res) => {
    try {
        const agency = req.params.agency;
        const startDate = req.query.startDate || '2025-10-01';
        const endDate = req.query.endDate || '2025-11-30';
        const db = require('../config/sqlite').default;
        const today = new Date().toISOString().split('T')[0];
        const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_postings,
        SUM(CASE WHEN date(apply_until) >= date(?) THEN 1 ELSE 0 END) as active_postings,
        COUNT(DISTINCT duty_country) as countries,
        COUNT(DISTINCT COALESCE(primary_category, sectoral_category)) as categories
      FROM jobs 
      WHERE (LOWER(short_agency) LIKE LOWER(?) OR LOWER(long_agency) LIKE LOWER(?))
        AND date(posting_date) >= date(?) 
        AND date(posting_date) <= date(?)
    `).get(today, `%${agency}%`, `%${agency}%`, startDate, endDate);
        res.json({
            success: true,
            data: {
                agency,
                period: { startDate, endDate },
                preview: {
                    totalPostings: stats?.total_postings || 0,
                    activePostings: stats?.active_postings || 0,
                    countries: stats?.countries || 0,
                    categories: stats?.categories || 0,
                    estimatedPages: 12,
                    estimatedGenerationTime: '10-30 seconds'
                }
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('[Reports API] Error generating preview:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate preview',
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/:reportId', async (req, res) => {
    try {
        const reportId = req.params.reportId;
        const reportData = await reportService.getReportData(reportId);
        if (!reportData) {
            res.status(404).json({
                success: false,
                error: 'Report not found',
                timestamp: new Date().toISOString()
            });
            return;
        }
        res.json({
            success: true,
            data: reportData,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('[Reports API] Error fetching report:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch report',
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/download/:reportId', async (req, res) => {
    try {
        const reportId = req.params.reportId;
        const pdfDef = await reportService.getPDFDefinition(reportId);
        if (!pdfDef) {
            res.status(404).json({
                success: false,
                error: 'Report not found',
                timestamp: new Date().toISOString()
            });
            return;
        }
        res.json({
            success: true,
            data: pdfDef,
            format: 'pdfmake-definition',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('[Reports API] Error downloading report:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to download report',
            timestamp: new Date().toISOString()
        });
    }
});
router.delete('/:reportId', async (req, res) => {
    try {
        const reportId = req.params.reportId;
        const deleted = await reportService.deleteReport(reportId);
        if (!deleted) {
            res.status(404).json({
                success: false,
                error: 'Report not found',
                timestamp: new Date().toISOString()
            });
            return;
        }
        res.json({
            success: true,
            message: 'Report deleted successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('[Reports API] Error deleting report:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete report',
            timestamp: new Date().toISOString()
        });
    }
});
router.post('/generate-html', async (req, res) => {
    try {
        const agency = req.body.agency;
        const startDate = req.body.reportPeriod?.startDate || '2025-10-01';
        const endDate = req.body.reportPeriod?.endDate || '2025-11-30';
        if (!agency) {
            res.status(400).json({
                success: false,
                error: 'Agency name is required',
                timestamp: new Date().toISOString()
            });
            return;
        }
        console.log(`[Reports API] Generating HTML report for ${agency}`);
        const startTime = Date.now();
        const request = {
            agency,
            reportPeriod: { startDate, endDate },
            sections: ['all'],
            format: 'html',
            includeRawData: false
        };
        const result = await reportService.generateReport(request);
        if (!result.success || !result.reportId) {
            res.status(400).json({
                success: false,
                error: result.error || 'Failed to generate report data',
                timestamp: new Date().toISOString()
            });
            return;
        }
        const reportData = await reportService.getReportData(result.reportId);
        if (!reportData) {
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve report data',
                timestamp: new Date().toISOString()
            });
            return;
        }
        const monthlyData = await monthlyReportAggregator.transformToMonthlyReport(reportData, startDate, endDate);
        const htmlContent = htmlReportGenerator.generateHTMLReport(monthlyData);
        const processingTime = Date.now() - startTime;
        console.log(`[Reports API] HTML report generated in ${processingTime}ms`);
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `inline; filename="${agency}-monthly-report-${new Date().toISOString().split('T')[0]}.html"`);
        res.send(htmlContent);
    }
    catch (error) {
        console.error('[Reports API] Error generating HTML report:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate HTML report',
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/html/:agency', async (req, res) => {
    try {
        const agency = req.params.agency;
        const startDate = req.query.startDate || '2025-10-01';
        const endDate = req.query.endDate || '2025-11-30';
        if (!agency) {
            res.status(400).json({
                success: false,
                error: 'Agency name is required',
                timestamp: new Date().toISOString()
            });
            return;
        }
        console.log(`[Reports API] Quick HTML report for ${agency}`);
        const startTime = Date.now();
        const request = {
            agency,
            reportPeriod: { startDate, endDate },
            sections: ['all'],
            format: 'html',
            includeRawData: false
        };
        const result = await reportService.generateReport(request);
        if (!result.success || !result.reportId) {
            res.status(400).json({
                success: false,
                error: result.error || 'Failed to generate report data',
                timestamp: new Date().toISOString()
            });
            return;
        }
        const reportData = await reportService.getReportData(result.reportId);
        if (!reportData) {
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve report data',
                timestamp: new Date().toISOString()
            });
            return;
        }
        const monthlyData = await monthlyReportAggregator.transformToMonthlyReport(reportData, startDate, endDate);
        const htmlContent = htmlReportGenerator.generateHTMLReport(monthlyData);
        const processingTime = Date.now() - startTime;
        console.log(`[Reports API] Quick HTML report generated in ${processingTime}ms`);
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `inline; filename="${agency}-monthly-report.html"`);
        res.send(htmlContent);
    }
    catch (error) {
        console.error('[Reports API] Error generating HTML report:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate HTML report',
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/html-download/:agency', async (req, res) => {
    try {
        const agency = req.params.agency;
        const startDate = req.query.startDate || '2025-10-01';
        const endDate = req.query.endDate || '2025-11-30';
        if (!agency) {
            res.status(400).json({
                success: false,
                error: 'Agency name is required',
                timestamp: new Date().toISOString()
            });
            return;
        }
        console.log(`[Reports API] HTML download for ${agency}`);
        const request = {
            agency,
            reportPeriod: { startDate, endDate },
            sections: ['all'],
            format: 'html',
            includeRawData: false
        };
        const result = await reportService.generateReport(request);
        if (!result.success || !result.reportId) {
            res.status(400).json({
                success: false,
                error: result.error || 'Failed to generate report data',
                timestamp: new Date().toISOString()
            });
            return;
        }
        const reportData = await reportService.getReportData(result.reportId);
        if (!reportData) {
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve report data',
                timestamp: new Date().toISOString()
            });
            return;
        }
        const monthlyData = await monthlyReportAggregator.transformToMonthlyReport(reportData, startDate, endDate);
        const htmlContent = htmlReportGenerator.generateHTMLReport(monthlyData);
        const filename = `${agency}-HR-Intelligence-Report-${new Date().toISOString().split('T')[0]}.html`;
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(htmlContent);
    }
    catch (error) {
        console.error('[Reports API] Error downloading HTML report:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to download HTML report',
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/monthly-data/:agency', async (req, res) => {
    try {
        const agency = req.params.agency;
        const startDate = req.query.startDate || '2025-10-01';
        const endDate = req.query.endDate || '2025-11-30';
        if (!agency) {
            res.status(400).json({
                success: false,
                error: 'Agency name is required',
                timestamp: new Date().toISOString()
            });
            return;
        }
        const request = {
            agency,
            reportPeriod: { startDate, endDate },
            sections: ['all'],
            format: 'html',
            includeRawData: false
        };
        const result = await reportService.generateReport(request);
        if (!result.success || !result.reportId) {
            res.status(400).json({
                success: false,
                error: result.error || 'Failed to generate report data',
                timestamp: new Date().toISOString()
            });
            return;
        }
        const reportData = await reportService.getReportData(result.reportId);
        if (!reportData) {
            res.status(500).json({
                success: false,
                error: 'Failed to retrieve report data',
                timestamp: new Date().toISOString()
            });
            return;
        }
        const monthlyData = await monthlyReportAggregator.transformToMonthlyReport(reportData, startDate, endDate);
        res.json({
            success: true,
            data: monthlyData,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('[Reports API] Error getting monthly data:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get monthly data',
            timestamp: new Date().toISOString()
        });
    }
});
exports.default = router;
//# sourceMappingURL=reports.js.map