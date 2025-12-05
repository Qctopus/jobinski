import { Router, Request, Response } from 'express';
import { AnalyticsService } from '../services/AnalyticsService';
import { LocalJobService } from '../services/LocalJobService';
import { SyncService } from '../services/SyncService';
import { initializeDatabase } from '../config/sqlite';
import Joi from 'joi';

const router = Router();

// Initialize services
let analyticsService: AnalyticsService;
let jobService: LocalJobService;
let syncService: SyncService;

// Lazy initialization
function getServices() {
  if (!analyticsService) {
    initializeDatabase();
    analyticsService = new AnalyticsService();
    jobService = new LocalJobService();
    syncService = new SyncService();
  }
  return { analyticsService, jobService, syncService };
}

// Validation schemas
const getJobsSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(50000).optional(), // Allow fetching all jobs - SQLite is fast
  category: Joi.string().optional(),
  agency: Joi.string().optional(),
  search: Joi.string().optional(),
  status: Joi.string().valid('active', 'expired', 'closing_soon', 'archived', 'all').optional(),
  country: Joi.string().optional(),
  grade: Joi.string().optional(),
  sort_by: Joi.string().valid('posting_date', 'confidence', 'title', 'days_remaining').optional(),
  sort_order: Joi.string().valid('asc', 'desc').optional()
});

/**
 * GET /api/dashboard/overview
 * Get dashboard overview metrics (pre-computed)
 */
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const { analyticsService } = getServices();
    const agency = req.query.agency as string | undefined;
    
    if (agency && agency !== 'all') {
      const filtered = analyticsService.getFilteredAnalytics(agency);
      return res.json({
        success: true,
        data: filtered.overview?.data || {},
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    const overview = analyticsService.getOverview();
    return res.json({
      success: true,
      data: overview?.data || {},
      cached: !!overview?.createdAt,
      cachedAt: overview?.createdAt,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in GET /dashboard/overview:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch overview',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/dashboard/categories
 * Get category analytics
 */
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const { analyticsService } = getServices();
    const categories = analyticsService.getCategoryAnalytics();
    return res.json({
      success: true,
      data: categories?.data || {},
      cached: !!categories?.createdAt,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in GET /dashboard/categories:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/dashboard/agencies
 * Get agency analytics
 */
router.get('/agencies', async (req: Request, res: Response) => {
  try {
    const { analyticsService } = getServices();
    const agencies = analyticsService.getAgencyAnalytics();
    return res.json({
      success: true,
      data: agencies?.data || {},
      cached: !!agencies?.createdAt,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in GET /dashboard/agencies:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch agencies',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/dashboard/temporal
 * Get temporal trends
 */
router.get('/temporal', async (req: Request, res: Response) => {
  try {
    const { analyticsService } = getServices();
    const temporal = analyticsService.getTemporalTrends();
    return res.json({
      success: true,
      data: temporal?.data || {},
      cached: !!temporal?.createdAt,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in GET /dashboard/temporal:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch temporal trends',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/dashboard/workforce
 * Get workforce analytics
 */
router.get('/workforce', async (req: Request, res: Response) => {
  try {
    const { analyticsService } = getServices();
    const workforce = analyticsService.getWorkforceAnalytics();
    return res.json({
      success: true,
      data: workforce?.data || {},
      cached: !!workforce?.createdAt,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in GET /dashboard/workforce:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch workforce analytics',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/dashboard/skills
 * Get skills analytics
 */
router.get('/skills', async (req: Request, res: Response) => {
  try {
    const { analyticsService } = getServices();
    const skills = analyticsService.getSkillsAnalytics();
    return res.json({
      success: true,
      data: skills?.data || {},
      cached: !!skills?.createdAt,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in GET /dashboard/skills:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch skills analytics',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/dashboard/competitive
 * Get competitive intelligence
 */
router.get('/competitive', async (req: Request, res: Response) => {
  try {
    const { analyticsService } = getServices();
    const competitive = analyticsService.getCompetitiveIntelligence();
    return res.json({
      success: true,
      data: competitive?.data || {},
      cached: !!competitive?.createdAt,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in GET /dashboard/competitive:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch competitive intelligence',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/dashboard/all
 * Get all dashboard data in one request (for initial load)
 */
router.get('/all', async (req: Request, res: Response) => {
  try {
    const { analyticsService, jobService } = getServices();
    const agency = req.query.agency as string | undefined;

    // Check if we have data
    if (!jobService.hasData()) {
      return res.status(503).json({
        success: false,
        error: 'No data available',
        message: 'Please run sync first: npm run sync',
        timestamp: new Date().toISOString()
      });
    }

    let allData;
    if (agency && agency !== 'all') {
      allData = analyticsService.getFilteredAnalytics(agency);
    } else {
      allData = analyticsService.getAllDashboardData();
    }

    return res.json({
      success: true,
      data: allData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in GET /dashboard/all:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/dashboard/jobs
 * Get paginated jobs (fast, from local SQLite)
 */
router.get('/jobs', async (req: Request, res: Response) => {
  try {
    const { error, value } = getJobsSchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        message: error.details[0]?.message,
        timestamp: new Date().toISOString()
      });
    }

    const { jobService } = getServices();
    const result = jobService.getJobs(value);
    return res.json(result);
  } catch (error) {
    console.error('Error in GET /dashboard/jobs:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch jobs',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/dashboard/jobs/:id
 * Get single job by ID
 */
router.get('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const jobId = parseInt(req.params.id || '0');
    if (isNaN(jobId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid job ID',
        timestamp: new Date().toISOString()
      });
    }

    const { jobService } = getServices();
    const job = jobService.getJobById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
        timestamp: new Date().toISOString()
      });
    }

    return res.json({
      success: true,
      data: job,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in GET /dashboard/jobs/:id:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch job',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/dashboard/filters
 * Get filter options
 */
router.get('/filters', async (req: Request, res: Response) => {
  try {
    const { jobService } = getServices();
    const filters = jobService.getFilterOptions();
    return res.json({
      success: true,
      data: filters,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in GET /dashboard/filters:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch filters',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/dashboard/sync-status
 * Get sync status
 */
router.get('/sync-status', async (req: Request, res: Response) => {
  try {
    const { jobService } = getServices();
    const status = jobService.getSyncStatus();
    const hasData = jobService.hasData();

    return res.json({
      success: true,
      data: {
        ...status,
        hasData,
        needsSync: !hasData || status?.status === 'never_synced' || status?.status === 'failed'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in GET /dashboard/sync-status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch sync status',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/dashboard/sync
 * Trigger a bidirectional sync (pulls from Neon, processes, pushes classifications back)
 */
router.post('/sync', (req: Request, res: Response) => {
  try {
    const { syncService } = getServices();
    
    // Start sync in background
    res.json({
      success: true,
      message: 'Bidirectional sync started (Neon ↔ Local)',
      timestamp: new Date().toISOString()
    });

    // Run bidirectional sync (non-blocking response already sent)
    syncService.fullBidirectionalSync().then(result => {
      console.log('Bidirectional sync completed:', result);
      if (result.neonUpdated !== undefined) {
        console.log(`📤 Updated ${result.neonUpdated} classifications in Neon`);
      }
    }).catch(err => {
      console.error('Sync failed:', err);
    });

  } catch (error) {
    console.error('Error in POST /dashboard/sync:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start sync',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;

