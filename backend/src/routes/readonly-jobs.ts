import { Router, Request, Response } from 'express';
import { ReadOnlyJobService } from '../services/ReadOnlyJobService';
import { GetJobsQuery, ApiResponse } from '../types';
import Joi from 'joi';

const router = Router();
const jobService = new ReadOnlyJobService();

// Validation schemas for read-only operations
const getJobsSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(25000).optional(),
  agency: Joi.string().optional(),
  search: Joi.string().optional(),
  status: Joi.string().valid('active', 'expired', 'closing_soon', 'archived', 'all').optional(),
  sort_by: Joi.string().valid('id', 'title', 'posting_date').optional(),
  sort_order: Joi.string().valid('asc', 'desc').optional()
});

/**
 * GET /api/jobs
 * Get jobs with optional filtering and pagination
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const { error, value } = getJobsSchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        message: error.details[0]?.message || 'Validation error',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    const query: GetJobsQuery = value;
    const result = await jobService.getJobs(query);

    return res.json(result);

  } catch (error) {
    console.error('Error in GET /jobs:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch jobs',
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
});

/**
 * GET /api/jobs/stats/basic
 * Get basic statistics from the database
 */
router.get('/stats/basic', async (req: Request, res: Response) => {
  try {
    const stats = await jobService.getBasicStats();

    return res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    } as ApiResponse);

  } catch (error) {
    console.error('Error in GET /jobs/stats/basic:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch statistics',
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
});

/**
 * GET /api/jobs/structure
 * Get database table structure for debugging
 */
router.get('/structure', async (req: Request, res: Response) => {
  try {
    const structure = await jobService.getTableStructure();

    return res.json({
      success: true,
      data: structure,
      timestamp: new Date().toISOString()
    } as ApiResponse);

  } catch (error) {
    console.error('Error in GET /jobs/structure:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch table structure',
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
});

/**
 * GET /api/jobs/:id
 * Get a specific job by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const jobId = parseInt(req.params.id || '');
    if (isNaN(jobId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid job ID',
        message: 'Job ID must be a valid number',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    const job = await jobService.getJobById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found',
        message: `Job with ID ${jobId} not found`,
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    return res.json({
      success: true,
      data: job,
      timestamp: new Date().toISOString()
    } as ApiResponse);

  } catch (error) {
    console.error('Error in GET /jobs/:id:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch job',
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
});

export default router;

