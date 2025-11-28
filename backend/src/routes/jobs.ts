import { Router, Request, Response } from 'express';
import { JobService } from '../services/JobService';
import { GetJobsQuery, UpdateCategoryRequest, ClassifyJobRequest, ApiResponse } from '../types';
import Joi from 'joi';

const router = Router();
const jobService = new JobService();

// Validation schemas
const getJobsSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  category: Joi.string().optional(),
  agency: Joi.string().optional(),
  confidence_min: Joi.number().min(0).max(100).optional(),
  confidence_max: Joi.number().min(0).max(100).optional(),
  user_corrected: Joi.boolean().optional(),
  search: Joi.string().optional(),
  sort_by: Joi.string().valid('date', 'confidence', 'title', 'posting_date', 'classified_at').optional(),
  sort_order: Joi.string().valid('asc', 'desc').optional()
});

const updateCategorySchema = Joi.object({
  primary_category: Joi.string().required(),
  user_id: Joi.string().optional(),
  reason: Joi.string().optional()
});

const classifyJobSchema = Joi.object({
  job_id: Joi.number().integer().required(),
  force_reclassify: Joi.boolean().optional()
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

/**
 * PUT /api/jobs/:id/category
 * Update job category (user correction)
 */
router.put('/:id/category', async (req: Request, res: Response) => {
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

    // Validate request body
    const { error, value } = updateCategorySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body',
        message: error.details[0]?.message || 'Validation error',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    const { primary_category, user_id, reason }: UpdateCategoryRequest = value;

    await jobService.updateJobCategory(jobId, primary_category, user_id, reason);

    return res.json({
      success: true,
      message: 'Job category updated successfully',
      timestamp: new Date().toISOString()
    } as ApiResponse);

  } catch (error) {
    console.error('Error in PUT /jobs/:id/category:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update job category',
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
});

/**
 * POST /api/jobs/classify
 * Classify a single job
 */
router.post('/classify', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { error, value } = classifyJobSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body',
        message: error.details[0]?.message || 'Validation error',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    const { job_id, force_reclassify }: ClassifyJobRequest = value;

    const classification = await jobService.classifyJob(job_id, force_reclassify);

    return res.json({
      success: true,
      data: classification,
      message: 'Job classified successfully',
      timestamp: new Date().toISOString()
    } as ApiResponse);

  } catch (error) {
    console.error('Error in POST /jobs/classify:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to classify job',
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
});

/**
 * POST /api/jobs/classify/batch
 * Batch classify multiple unclassified jobs
 */
router.post('/classify/batch', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.body.limit) || 100;
    
    if (limit < 1 || limit > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Invalid limit',
        message: 'Limit must be between 1 and 1000',
        timestamp: new Date().toISOString()
      } as ApiResponse);
    }

    const result = await jobService.batchClassifyJobs(limit);

    return res.json({
      success: true,
      data: result,
      message: `Batch classification completed: ${result.processed} processed, ${result.errors} errors`,
      timestamp: new Date().toISOString()
    } as ApiResponse);

  } catch (error) {
    console.error('Error in POST /jobs/classify/batch:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to batch classify jobs',
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
});

/**
 * GET /api/jobs/stats
 * Get classification statistics
 */
router.get('/stats/classification', async (req: Request, res: Response) => {
  try {
    const stats = await jobService.getClassificationStats();

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    } as ApiResponse);

  } catch (error) {
    console.error('Error in GET /jobs/stats/classification:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch classification statistics',
      timestamp: new Date().toISOString()
    } as ApiResponse);
  }
});

export default router;





