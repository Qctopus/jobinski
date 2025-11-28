"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AnalyticsService_1 = require("../services/AnalyticsService");
const LocalJobService_1 = require("../services/LocalJobService");
const SyncService_1 = require("../services/SyncService");
const sqlite_1 = require("../config/sqlite");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
let analyticsService;
let jobService;
let syncService;
function getServices() {
    if (!analyticsService) {
        (0, sqlite_1.initializeDatabase)();
        analyticsService = new AnalyticsService_1.AnalyticsService();
        jobService = new LocalJobService_1.LocalJobService();
        syncService = new SyncService_1.SyncService();
    }
    return { analyticsService, jobService, syncService };
}
const getJobsSchema = joi_1.default.object({
    page: joi_1.default.number().integer().min(1).optional(),
    limit: joi_1.default.number().integer().min(1).max(50000).optional(),
    category: joi_1.default.string().optional(),
    agency: joi_1.default.string().optional(),
    search: joi_1.default.string().optional(),
    status: joi_1.default.string().valid('active', 'expired', 'closing_soon', 'archived', 'all').optional(),
    country: joi_1.default.string().optional(),
    grade: joi_1.default.string().optional(),
    sort_by: joi_1.default.string().valid('posting_date', 'confidence', 'title', 'days_remaining').optional(),
    sort_order: joi_1.default.string().valid('asc', 'desc').optional()
});
router.get('/overview', async (req, res) => {
    try {
        const { analyticsService } = getServices();
        const agency = req.query.agency;
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
    }
    catch (error) {
        console.error('Error in GET /dashboard/overview:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch overview',
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/categories', async (req, res) => {
    try {
        const { analyticsService } = getServices();
        const categories = analyticsService.getCategoryAnalytics();
        return res.json({
            success: true,
            data: categories?.data || {},
            cached: !!categories?.createdAt,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error in GET /dashboard/categories:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch categories',
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/agencies', async (req, res) => {
    try {
        const { analyticsService } = getServices();
        const agencies = analyticsService.getAgencyAnalytics();
        return res.json({
            success: true,
            data: agencies?.data || {},
            cached: !!agencies?.createdAt,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error in GET /dashboard/agencies:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch agencies',
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/temporal', async (req, res) => {
    try {
        const { analyticsService } = getServices();
        const temporal = analyticsService.getTemporalTrends();
        return res.json({
            success: true,
            data: temporal?.data || {},
            cached: !!temporal?.createdAt,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error in GET /dashboard/temporal:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch temporal trends',
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/workforce', async (req, res) => {
    try {
        const { analyticsService } = getServices();
        const workforce = analyticsService.getWorkforceAnalytics();
        return res.json({
            success: true,
            data: workforce?.data || {},
            cached: !!workforce?.createdAt,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error in GET /dashboard/workforce:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch workforce analytics',
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/skills', async (req, res) => {
    try {
        const { analyticsService } = getServices();
        const skills = analyticsService.getSkillsAnalytics();
        return res.json({
            success: true,
            data: skills?.data || {},
            cached: !!skills?.createdAt,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error in GET /dashboard/skills:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch skills analytics',
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/competitive', async (req, res) => {
    try {
        const { analyticsService } = getServices();
        const competitive = analyticsService.getCompetitiveIntelligence();
        return res.json({
            success: true,
            data: competitive?.data || {},
            cached: !!competitive?.createdAt,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error in GET /dashboard/competitive:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch competitive intelligence',
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/all', async (req, res) => {
    try {
        const { analyticsService, jobService } = getServices();
        const agency = req.query.agency;
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
        }
        else {
            allData = analyticsService.getAllDashboardData();
        }
        return res.json({
            success: true,
            data: allData,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error in GET /dashboard/all:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard data',
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/jobs', async (req, res) => {
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
    }
    catch (error) {
        console.error('Error in GET /dashboard/jobs:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch jobs',
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/jobs/:id', async (req, res) => {
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
    }
    catch (error) {
        console.error('Error in GET /dashboard/jobs/:id:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch job',
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/filters', async (req, res) => {
    try {
        const { jobService } = getServices();
        const filters = jobService.getFilterOptions();
        return res.json({
            success: true,
            data: filters,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Error in GET /dashboard/filters:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch filters',
            timestamp: new Date().toISOString()
        });
    }
});
router.get('/sync-status', async (req, res) => {
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
    }
    catch (error) {
        console.error('Error in GET /dashboard/sync-status:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch sync status',
            timestamp: new Date().toISOString()
        });
    }
});
router.post('/sync', (req, res) => {
    try {
        const { syncService } = getServices();
        res.json({
            success: true,
            message: 'Sync started',
            timestamp: new Date().toISOString()
        });
        syncService.fullSync().then(result => {
            console.log('Sync completed:', result);
        }).catch(err => {
            console.error('Sync failed:', err);
        });
    }
    catch (error) {
        console.error('Error in POST /dashboard/sync:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to start sync',
            timestamp: new Date().toISOString()
        });
    }
});
exports.default = router;
//# sourceMappingURL=dashboard.js.map