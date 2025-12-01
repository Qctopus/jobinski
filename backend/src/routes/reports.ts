/**
 * Reports API Routes
 * Endpoints for generating and managing agency HR intelligence reports
 */

import express, { Request, Response } from 'express';
import { ReportGeneratorService } from '../services/reports/ReportGeneratorService';
import { GenerateReportRequest } from '../types/reports';
import { MonthlyReportDataAggregator } from '../services/reports/MonthlyReportDataAggregator';
import { HTMLReportGenerator } from '../services/reports/HTMLReportGenerator';

const router = express.Router();
const reportService = new ReportGeneratorService();
const monthlyReportAggregator = new MonthlyReportDataAggregator();
const htmlReportGenerator = new HTMLReportGenerator();

/**
 * POST /api/reports/generate
 * Generate a new agency report
 */
router.post('/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const request: GenerateReportRequest = {
      agency: req.body.agency,
      reportPeriod: {
        startDate: req.body.reportPeriod?.startDate || '2025-10-01',
        endDate: req.body.reportPeriod?.endDate || '2025-11-30'
      },
      sections: req.body.sections || ['all'],
      format: req.body.format || 'pdf',
      includeRawData: req.body.includeRawData !== false
    };

    // Validate required fields
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
    } else {
      res.status(400).json(result);
    }
    
  } catch (error) {
    console.error('[Reports API] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/reports/list
 * List all generated reports
 */
router.get('/list', async (req: Request, res: Response): Promise<void> => {
  try {
    const reports = await reportService.listReports();
    res.json({
      success: true,
      data: reports,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Reports API] Error listing reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list reports',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/reports/agencies
 * Get list of available agencies for report generation
 */
router.get('/agencies', async (req: Request, res: Response): Promise<void> => {
  try {
    const agencies = await reportService.getAvailableAgencies();
    res.json({
      success: true,
      data: agencies,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Reports API] Error fetching agencies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agencies',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/reports/preview/:agency
 * Get a quick preview of what the report would contain (without generating PDF)
 */
router.get('/preview/:agency', async (req: Request, res: Response): Promise<void> => {
  try {
    const agency = req.params.agency;
    const startDate = (req.query.startDate as string) || '2025-10-01';
    const endDate = (req.query.endDate as string) || '2025-11-30';
    
    // Use SQLite for preview stats
    const db = require('../config/sqlite').default;
    const today = new Date().toISOString().split('T')[0]; // Just the date part YYYY-MM-DD
    
    // Note: We ignore 'archived' flag as it's incorrectly set in source data
    // A job is considered active if its deadline is today or in the future
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
    `).get(today, `%${agency}%`, `%${agency}%`, startDate, endDate) as any;
    
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
  } catch (error) {
    console.error('[Reports API] Error generating preview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate preview',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/reports/:reportId
 * Get report data by ID
 */
router.get('/:reportId', async (req: Request, res: Response): Promise<void> => {
  try {
    const reportId = req.params.reportId as string;
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
  } catch (error) {
    console.error('[Reports API] Error fetching report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch report',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/reports/download/:reportId
 * Get PDF definition for rendering
 */
router.get('/download/:reportId', async (req: Request, res: Response): Promise<void> => {
  try {
    const reportId = req.params.reportId as string;
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
  } catch (error) {
    console.error('[Reports API] Error downloading report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download report',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * DELETE /api/reports/:reportId
 * Delete a report
 */
router.delete('/:reportId', async (req: Request, res: Response): Promise<void> => {
  try {
    const reportId = req.params.reportId as string;
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
  } catch (error) {
    console.error('[Reports API] Error deleting report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete report',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/reports/generate-html
 * Generate an executive-grade HTML report with interactive visualizations
 */
router.post('/generate-html', async (req: Request, res: Response): Promise<void> => {
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
    
    // Step 1: Generate standard report data using existing service
    const request: GenerateReportRequest = {
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
    
    // Step 2: Get the report data
    const reportData = await reportService.getReportData(result.reportId);
    if (!reportData) {
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve report data',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    // Step 3: Transform to MonthlyReportData format
    const monthlyData = await monthlyReportAggregator.transformToMonthlyReport(
      reportData,
      startDate,
      endDate
    );
    
    // Step 4: Generate HTML
    const htmlContent = htmlReportGenerator.generateHTMLReport(monthlyData);
    
    const processingTime = Date.now() - startTime;
    console.log(`[Reports API] HTML report generated in ${processingTime}ms`);
    
    // Return HTML directly
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="${agency}-monthly-report-${new Date().toISOString().split('T')[0]}.html"`);
    res.send(htmlContent);
    
  } catch (error) {
    console.error('[Reports API] Error generating HTML report:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate HTML report',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/reports/html/:agency
 * Quick endpoint to generate HTML report for an agency
 */
router.get('/html/:agency', async (req: Request, res: Response): Promise<void> => {
  try {
    const agency = req.params.agency as string;
    const startDate = (req.query.startDate as string) || '2025-10-01';
    const endDate = (req.query.endDate as string) || '2025-11-30';
    
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
    
    // Generate standard report data
    const request: GenerateReportRequest = {
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
    
    // Transform and generate HTML
    const monthlyData = await monthlyReportAggregator.transformToMonthlyReport(
      reportData,
      startDate,
      endDate
    );
    
    const htmlContent = htmlReportGenerator.generateHTMLReport(monthlyData);
    
    const processingTime = Date.now() - startTime;
    console.log(`[Reports API] Quick HTML report generated in ${processingTime}ms`);
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="${agency}-monthly-report.html"`);
    res.send(htmlContent);
    
  } catch (error) {
    console.error('[Reports API] Error generating HTML report:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate HTML report',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/reports/html-download/:agency
 * Download HTML report as a file
 */
router.get('/html-download/:agency', async (req: Request, res: Response): Promise<void> => {
  try {
    const agency = req.params.agency as string;
    const startDate = (req.query.startDate as string) || '2025-10-01';
    const endDate = (req.query.endDate as string) || '2025-11-30';
    
    if (!agency) {
      res.status(400).json({
        success: false,
        error: 'Agency name is required',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    console.log(`[Reports API] HTML download for ${agency}`);
    
    // Generate report data
    const request: GenerateReportRequest = {
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
    
    // Transform and generate HTML
    const monthlyData = await monthlyReportAggregator.transformToMonthlyReport(
      reportData,
      startDate,
      endDate
    );
    
    const htmlContent = htmlReportGenerator.generateHTMLReport(monthlyData);
    
    // Set download headers
    const filename = `${agency}-HR-Intelligence-Report-${new Date().toISOString().split('T')[0]}.html`;
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(htmlContent);
    
  } catch (error) {
    console.error('[Reports API] Error downloading HTML report:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to download HTML report',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/reports/monthly-data/:agency
 * Get the enhanced MonthlyReportData JSON (for debugging or custom frontends)
 */
router.get('/monthly-data/:agency', async (req: Request, res: Response): Promise<void> => {
  try {
    const agency = req.params.agency as string;
    const startDate = (req.query.startDate as string) || '2025-10-01';
    const endDate = (req.query.endDate as string) || '2025-11-30';
    
    if (!agency) {
      res.status(400).json({
        success: false,
        error: 'Agency name is required',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    // Generate report data
    const request: GenerateReportRequest = {
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
    
    // Transform to enhanced format
    const monthlyData = await monthlyReportAggregator.transformToMonthlyReport(
      reportData,
      startDate,
      endDate
    );
    
    res.json({
      success: true,
      data: monthlyData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[Reports API] Error getting monthly data:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get monthly data',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
