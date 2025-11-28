"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const JobService_1 = require("../services/JobService");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
const jobService = new JobService_1.JobService();
const getJobsSchema = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).optional(),
    limit: joi_1.default.number().integer().min(1).max(100).optional(),
    category: joi_1.default.string().optional(),
    agency: joi_1.default.string().optional(),
    confidence_min: joi_1.default.number().min(0).max(100).optional(),
    confidence_max: joi_1.default.number().min(0).max(100).optional(),
    user_corrected: joi_1.default.boolean().optional(),
    search: joi_1.default.string().optional(),
    sort_by: joi_1.default.string().valid('date', 'confidence', 'title', 'posting_date', 'classified_at').optional(),
    sort_order: joi_1.default.string().valid('asc', 'desc').optional()
});
const updateCategorySchema = joi_1.default.object({
    primary_category: joi_1.default.string().required(),
    user_id: joi_1.default.string().optional(),
    reason: joi_1.default.string().optional()
});
const classifyJobSchema = joi_1.default.object({
    job_id: joi_1.default.number().integer().required(),
    force_reclassify: joi_1.default.boolean().optional()
});
router.get('/', async (req, res) => {
    try {
        const { error, value } = getJobsSchema.validate(req.query);
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Invalid query parameters',
                message: error.details[0]?.message || 'Validation error',
                timestamp: new Date().toISOString()
            });
        }
        const query = value;
        const result = await jobService.getJobs(query);
        return res.json(result);
    }
    catch (error) {
        console.error('Error in GET /jobs:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to fetch jobs',
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const jobId = parseInt(req.params.id || '');
        if (isNaN(jobId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid job ID',
                message: 'Job ID must be a valid number',
                timestamp: new Date().toISOString()
            });
        }
        const job = await jobService.getJobById(jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                error: 'Job not found',
                message: `Job with ID ${jobId} not found`,
                timestamp: new Date().toISOString()
            });
        }
        return res.json({
            success: true,
            data: job,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error in GET /jobs/:id:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to fetch job',
            timestamp: new Date().toISOString()
        });
    }
});
router.put('/:id/category', async (req, res) => {
    try {
        const jobId = parseInt(req.params.id || '');
        if (isNaN(jobId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid job ID',
                message: 'Job ID must be a valid number',
                timestamp: new Date().toISOString()
            });
        }
        const { error, value } = updateCategorySchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request body',
                message: error.details[0]?.message || 'Validation error',
                timestamp: new Date().toISOString()
            });
        }
        const { primary_category, user_id, reason } = value;
        await jobService.updateJobCategory(jobId, primary_category, user_id, reason);
        return res.json({
            success: true,
            message: 'Job category updated successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error in PUT /jobs/:id/category:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to update job category',
            timestamp: new Date().toISOString()
        });
    }
});
router.post('/classify', async (req, res) => {
    try {
        const { error, value } = classifyJobSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request body',
                message: error.details[0]?.message || 'Validation error',
                timestamp: new Date().toISOString()
            });
        }
        const { job_id, force_reclassify } = value;
        const classification = await jobService.classifyJob(job_id, force_reclassify);
        return res.json({
            success: true,
            data: classification,
            message: 'Job classified successfully',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error in POST /jobs/classify:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to classify job',
            timestamp: new Date().toISOString()
        });
    }
});
router.post('/classify/batch', async (req, res) => {
    try {
        const limit = parseInt(req.body.limit) || 100;
        if (limit < 1 || limit > 1000) {
            return res.status(400).json({
                success: false,
                error: 'Invalid limit',
                message: 'Limit must be between 1 and 1000',
                timestamp: new Date().toISOString()
            });
        }
        const result = await jobService.batchClassifyJobs(limit);
        return res.json({
            success: true,
            data: result,
            message: `Batch classification completed: ${result.processed} processed, ${result.errors} errors`,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error in POST /jobs/classify/batch:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to batch classify jobs',
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/stats/classification', async (req, res) => {
    try {
        const stats = await jobService.getClassificationStats();
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error in GET /jobs/stats/classification:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to fetch classification statistics',
            timestamp: new Date().toISOString()
        });
    }
});
exports.default = router;
//# sourceMappingURL=jobs.js.map