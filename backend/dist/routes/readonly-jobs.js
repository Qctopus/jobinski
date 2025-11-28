"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ReadOnlyJobService_1 = require("../services/ReadOnlyJobService");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
const jobService = new ReadOnlyJobService_1.ReadOnlyJobService();
const getJobsSchema = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).optional(),
    limit: joi_1.default.number().integer().min(1).max(25000).optional(),
    agency: joi_1.default.string().optional(),
    search: joi_1.default.string().optional(),
    status: joi_1.default.string().valid('active', 'expired', 'closing_soon', 'archived', 'all').optional(),
    sort_by: joi_1.default.string().valid('id', 'title', 'posting_date').optional(),
    sort_order: joi_1.default.string().valid('asc', 'desc').optional()
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
router.get('/stats/basic', async (req, res) => {
    try {
        const stats = await jobService.getBasicStats();
        return res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error in GET /jobs/stats/basic:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to fetch statistics',
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/structure', async (req, res) => {
    try {
        const structure = await jobService.getTableStructure();
        return res.json({
            success: true,
            data: structure,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error in GET /jobs/structure:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: 'Failed to fetch table structure',
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
exports.default = router;
//# sourceMappingURL=readonly-jobs.js.map