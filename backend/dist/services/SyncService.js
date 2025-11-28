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
exports.SyncService = void 0;
const database_1 = __importDefault(require("../config/database"));
const sqlite_1 = __importStar(require("../config/sqlite"));
const JobClassificationService_1 = require("./JobClassificationService");
class SyncService {
    constructor() {
        this.classifier = new JobClassificationService_1.JobClassificationService();
    }
    async fullSync() {
        const startTime = Date.now();
        console.log('🔄 Starting full sync from PostgreSQL...');
        try {
            (0, sqlite_1.initializeDatabase)();
            sqlite_1.default.prepare('UPDATE sync_metadata SET status = ?, last_sync_at = ? WHERE id = 1')
                .run('syncing', new Date().toISOString());
            console.log('📥 Fetching jobs from PostgreSQL (with deduplication)...');
            const result = await database_1.default.query(`
        SELECT DISTINCT ON (COALESCE(url, id::text)) *
        FROM jobs
        ORDER BY COALESCE(url, id::text), id DESC
      `);
            const jobs = result.rows;
            console.log(`📊 Fetched ${jobs.length} unique jobs from PostgreSQL (deduplicated by URL)`);
            console.log('🗑️ Clearing local cache...');
            sqlite_1.default.exec('DELETE FROM jobs');
            const insertStmt = sqlite_1.default.prepare(`
        INSERT INTO jobs (
          id, title, description, job_labels, short_agency, long_agency,
          duty_station, duty_country, duty_continent, country_code,
          eligible_nationality, hs_min_exp, bachelor_min_exp, master_min_exp,
          up_grade, pipeline, department, posting_date, apply_until,
          url, languages, uniquecode, ideal_candidate, sectoral_category,
          archived, created_at, updated_at,
          primary_category, secondary_categories, classification_confidence,
          classification_reasoning, seniority_level, location_type,
          skill_domains, status, is_active, is_expired, days_remaining,
          urgency, application_window_days, formatted_posting_date,
          formatted_apply_until, processed_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `);
            console.log('⚙️ Processing and inserting jobs...');
            const BATCH_SIZE = 500;
            let processedCount = 0;
            const sanitize = (val) => {
                if (val === undefined || val === null)
                    return null;
                if (typeof val === 'boolean')
                    return val ? 1 : 0;
                if (typeof val === 'number')
                    return isNaN(val) ? null : val;
                if (typeof val === 'string')
                    return val;
                if (typeof val === 'object')
                    return JSON.stringify(val);
                return String(val);
            };
            const insertMany = sqlite_1.default.transaction((jobsBatch) => {
                for (const job of jobsBatch) {
                    const processed = this.processJob(job);
                    insertStmt.run(sanitize(processed.id), sanitize(processed.title) || '', sanitize(processed.description) || '', sanitize(processed.job_labels) || '', sanitize(processed.short_agency) || '', sanitize(processed.long_agency) || '', sanitize(processed.duty_station) || '', sanitize(processed.duty_country) || '', sanitize(processed.duty_continent) || '', sanitize(processed.country_code) || '', sanitize(processed.eligible_nationality) || '', sanitize(processed.hs_min_exp), sanitize(processed.bachelor_min_exp), sanitize(processed.master_min_exp), sanitize(processed.up_grade) || '', sanitize(processed.pipeline) || '', sanitize(processed.department) || '', sanitize(processed.posting_date) || '', sanitize(processed.apply_until) || '', sanitize(processed.url) || '', sanitize(processed.languages) || '', sanitize(processed.uniquecode) || '', sanitize(processed.ideal_candidate) || '', sanitize(processed.sectoral_category) || '', processed.archived ? 1 : 0, sanitize(processed.created_at) || '', sanitize(processed.updated_at) || '', sanitize(processed.primary_category) || '', JSON.stringify(processed.secondary_categories || []), sanitize(processed.classification_confidence), JSON.stringify(processed.classification_reasoning || []), sanitize(processed.seniority_level) || '', sanitize(processed.location_type) || '', JSON.stringify(processed.skill_domains || []), sanitize(processed.status) || '', processed.is_active ? 1 : 0, processed.is_expired ? 1 : 0, sanitize(processed.days_remaining) || 0, sanitize(processed.urgency) || '', sanitize(processed.application_window_days) || 0, sanitize(processed.formatted_posting_date) || '', sanitize(processed.formatted_apply_until) || '', new Date().toISOString());
                }
            });
            for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
                const batch = jobs.slice(i, i + BATCH_SIZE);
                insertMany(batch);
                processedCount += batch.length;
                console.log(`  Processed ${processedCount}/${jobs.length} jobs...`);
            }
            console.log('📊 Pre-computing analytics...');
            await this.precomputeAnalytics();
            const duration = Date.now() - startTime;
            sqlite_1.default.prepare('UPDATE sync_metadata SET status = ?, last_sync_at = ?, total_jobs = ?, sync_duration_ms = ? WHERE id = 1')
                .run('completed', new Date().toISOString(), processedCount, duration);
            console.log(`✅ Sync completed: ${processedCount} jobs in ${duration}ms`);
            return {
                success: true,
                totalJobs: jobs.length,
                processedJobs: processedCount,
                duration
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            console.error('❌ Sync failed:', error);
            sqlite_1.default.prepare('UPDATE sync_metadata SET status = ? WHERE id = 1')
                .run('failed');
            return {
                success: false,
                totalJobs: 0,
                processedJobs: 0,
                duration,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    processJob(job) {
        const postingDate = this.parseDate(job.posting_date);
        const applyUntil = this.parseDate(job.apply_until);
        const now = new Date();
        const daysRemaining = applyUntil
            ? Math.ceil((applyUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            : 0;
        const isArchived = Boolean(job.archived) && Number(job.archived) !== 0;
        const isExpired = isArchived || daysRemaining < 0;
        const isActive = !isExpired && daysRemaining >= 0;
        let status;
        if (isArchived)
            status = 'archived';
        else if (daysRemaining < 0)
            status = 'expired';
        else if (daysRemaining <= 3)
            status = 'closing_soon';
        else
            status = 'active';
        const urgency = daysRemaining < 7 ? 'urgent' : daysRemaining <= 30 ? 'normal' : 'extended';
        const applicationWindowDays = postingDate && applyUntil
            ? Math.ceil((applyUntil.getTime() - postingDate.getTime()) / (1000 * 60 * 60 * 24))
            : 0;
        const classification = this.classifier.classifyJob({
            title: job.title || '',
            description: job.description || '',
            job_labels: job.job_labels || '',
            up_grade: job.up_grade || ''
        });
        const seniorityLevel = this.classifier.getSeniorityLevel(job.up_grade || '', job.title || '');
        const locationType = this.getLocationType(job.duty_country || '', job.duty_station || '');
        const skillDomains = this.extractSkillDomains(job.job_labels || '');
        return {
            ...job,
            primary_category: classification.primary,
            secondary_categories: classification.secondary.map(s => s.category),
            classification_confidence: classification.confidence,
            classification_reasoning: classification.reasoning,
            seniority_level: seniorityLevel,
            location_type: locationType,
            skill_domains: skillDomains,
            status,
            is_active: isActive,
            is_expired: isExpired,
            days_remaining: daysRemaining,
            urgency,
            application_window_days: applicationWindowDays,
            formatted_posting_date: postingDate ? this.formatDate(postingDate) : '',
            formatted_apply_until: applyUntil ? this.formatDate(applyUntil) : ''
        };
    }
    async precomputeAnalytics() {
        const cacheAnalytics = (key, data) => {
            const stmt = sqlite_1.default.prepare(`
        INSERT OR REPLACE INTO analytics_cache (cache_key, data, created_at, expires_at)
        VALUES (?, ?, ?, ?)
      `);
            const now = new Date();
            const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            stmt.run(key, JSON.stringify(data), now.toISOString(), expires.toISOString());
        };
        console.log('  Computing overview metrics...');
        const overviewMetrics = this.computeOverviewMetrics();
        cacheAnalytics('dashboard:overview', overviewMetrics);
        console.log('  Computing category analytics...');
        const categoryAnalytics = this.computeCategoryAnalytics();
        cacheAnalytics('dashboard:categories', categoryAnalytics);
        console.log('  Computing agency analytics...');
        const agencyAnalytics = this.computeAgencyAnalytics();
        cacheAnalytics('dashboard:agencies', agencyAnalytics);
        console.log('  Computing temporal trends...');
        const temporalTrends = this.computeTemporalTrends();
        cacheAnalytics('dashboard:temporal', temporalTrends);
        console.log('  Computing workforce analytics...');
        const workforceAnalytics = this.computeWorkforceAnalytics();
        cacheAnalytics('dashboard:workforce', workforceAnalytics);
        console.log('  Computing skills analytics...');
        const skillsAnalytics = this.computeSkillsAnalytics();
        cacheAnalytics('dashboard:skills', skillsAnalytics);
        console.log('  Computing competitive intelligence...');
        const competitiveIntel = this.computeCompetitiveIntelligence();
        cacheAnalytics('dashboard:competitive', competitiveIntel);
        console.log('  ✅ All analytics cached');
    }
    computeOverviewMetrics() {
        const stats = sqlite_1.default.prepare(`
      SELECT 
        COUNT(*) as total_jobs,
        COUNT(DISTINCT short_agency) as total_agencies,
        COUNT(DISTINCT duty_country) as total_countries,
        COUNT(DISTINCT department) as total_departments,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_jobs,
        SUM(CASE WHEN status = 'closing_soon' THEN 1 ELSE 0 END) as closing_soon,
        SUM(CASE WHEN status = 'expired' OR status = 'archived' THEN 1 ELSE 0 END) as expired_jobs,
        AVG(classification_confidence) as avg_confidence,
        AVG(application_window_days) as avg_window
      FROM jobs
    `).get();
        const topCategories = sqlite_1.default.prepare(`
      SELECT primary_category, COUNT(*) as count
      FROM jobs
      WHERE primary_category IS NOT NULL
      GROUP BY primary_category
      ORDER BY count DESC
      LIMIT 10
    `).all();
        const totalWithCategory = topCategories.reduce((sum, c) => sum + c.count, 0);
        const topCategoriesWithPercentage = topCategories.map(c => ({
            category: c.primary_category,
            count: c.count,
            percentage: totalWithCategory > 0 ? (c.count / totalWithCategory) * 100 : 0
        }));
        const topAgencies = sqlite_1.default.prepare(`
      SELECT short_agency as agency, COUNT(*) as count
      FROM jobs
      WHERE short_agency IS NOT NULL AND short_agency != ''
      GROUP BY short_agency
      ORDER BY count DESC
      LIMIT 10
    `).all();
        const monthlyTrends = sqlite_1.default.prepare(`
      SELECT 
        strftime('%Y-%m', posting_date) as month,
        COUNT(*) as count
      FROM jobs
      WHERE posting_date >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', posting_date)
      ORDER BY month
    `).all();
        let monthOverMonthGrowth = 0;
        if (monthlyTrends.length >= 2) {
            const current = monthlyTrends[monthlyTrends.length - 1]?.count || 0;
            const previous = monthlyTrends[monthlyTrends.length - 2]?.count || 0;
            monthOverMonthGrowth = previous > 0 ? ((current - previous) / previous) * 100 : 0;
        }
        return {
            totalJobs: stats.total_jobs,
            totalAgencies: stats.total_agencies,
            totalCountries: stats.total_countries,
            totalDepartments: stats.total_departments,
            activeJobs: stats.active_jobs,
            closingSoon: stats.closing_soon,
            expiredJobs: stats.expired_jobs,
            avgConfidence: Math.round(stats.avg_confidence || 0),
            avgApplicationWindow: Math.round(stats.avg_window || 0),
            topCategories: topCategoriesWithPercentage,
            topAgencies,
            monthlyTrends,
            monthOverMonthGrowth: Math.round(monthOverMonthGrowth * 10) / 10
        };
    }
    computeCategoryAnalytics() {
        const categories = sqlite_1.default.prepare(`
      SELECT 
        primary_category,
        COUNT(*) as total,
        AVG(classification_confidence) as avg_confidence,
        COUNT(DISTINCT short_agency) as agencies_count,
        COUNT(DISTINCT duty_country) as countries_count
      FROM jobs
      WHERE primary_category IS NOT NULL
      GROUP BY primary_category
      ORDER BY total DESC
    `).all();
        const totalJobs = categories.reduce((sum, c) => sum + c.total, 0);
        const categoryBySeniority = sqlite_1.default.prepare(`
      SELECT 
        primary_category,
        seniority_level,
        COUNT(*) as count
      FROM jobs
      WHERE primary_category IS NOT NULL AND seniority_level IS NOT NULL
      GROUP BY primary_category, seniority_level
    `).all();
        const categoryTrends = sqlite_1.default.prepare(`
      SELECT 
        primary_category,
        strftime('%Y-%m', posting_date) as month,
        COUNT(*) as count
      FROM jobs
      WHERE posting_date >= date('now', '-6 months') AND primary_category IS NOT NULL
      GROUP BY primary_category, strftime('%Y-%m', posting_date)
      ORDER BY primary_category, month
    `).all();
        return {
            categories: categories.map(c => ({
                category: c.primary_category,
                total: c.total,
                percentage: totalJobs > 0 ? (c.total / totalJobs) * 100 : 0,
                avgConfidence: Math.round(c.avg_confidence || 0),
                agenciesCount: c.agencies_count,
                countriesCount: c.countries_count
            })),
            categoryBySeniority,
            categoryTrends,
            totalCategories: categories.length
        };
    }
    computeAgencyAnalytics() {
        const agencies = sqlite_1.default.prepare(`
      SELECT 
        short_agency as agency,
        COUNT(*) as total_jobs,
        COUNT(DISTINCT primary_category) as categories_count,
        COUNT(DISTINCT duty_country) as countries_count,
        AVG(application_window_days) as avg_window
      FROM jobs
      WHERE short_agency IS NOT NULL AND short_agency != ''
      GROUP BY short_agency
      ORDER BY total_jobs DESC
    `).all();
        const totalJobs = agencies.reduce((sum, a) => sum + a.total_jobs, 0);
        const agencyByCategory = sqlite_1.default.prepare(`
      SELECT 
        short_agency as agency,
        primary_category,
        COUNT(*) as count
      FROM jobs
      WHERE short_agency IS NOT NULL AND primary_category IS NOT NULL
      GROUP BY short_agency, primary_category
    `).all();
        const agencyTrends = sqlite_1.default.prepare(`
      SELECT 
        short_agency as agency,
        strftime('%Y-%m', posting_date) as month,
        COUNT(*) as count
      FROM jobs
      WHERE posting_date >= date('now', '-6 months') AND short_agency IS NOT NULL
      GROUP BY short_agency, strftime('%Y-%m', posting_date)
      ORDER BY agency, month
    `).all();
        return {
            agencies: agencies.map(a => ({
                agency: a.agency,
                totalJobs: a.total_jobs,
                marketShare: totalJobs > 0 ? (a.total_jobs / totalJobs) * 100 : 0,
                categoriesCount: a.categories_count,
                countriesCount: a.countries_count,
                avgWindow: Math.round(a.avg_window || 0)
            })),
            agencyByCategory,
            agencyTrends,
            totalAgencies: agencies.length
        };
    }
    computeTemporalTrends() {
        const monthlyPostings = sqlite_1.default.prepare(`
      SELECT 
        strftime('%Y-%m', posting_date) as month,
        COUNT(*) as total,
        COUNT(DISTINCT short_agency) as agencies,
        COUNT(DISTINCT primary_category) as categories
      FROM jobs
      WHERE posting_date >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', posting_date)
      ORDER BY month
    `).all();
        const seasonalPatterns = sqlite_1.default.prepare(`
      SELECT 
        strftime('%m', posting_date) as month_num,
        COUNT(*) as count
      FROM jobs
      GROUP BY strftime('%m', posting_date)
      ORDER BY month_num
    `).all();
        const categoryTimeSeries = sqlite_1.default.prepare(`
      SELECT 
        strftime('%Y-%m', posting_date) as month,
        primary_category,
        COUNT(*) as count
      FROM jobs
      WHERE posting_date >= date('now', '-12 months') AND primary_category IS NOT NULL
      GROUP BY strftime('%Y-%m', posting_date), primary_category
      ORDER BY month
    `).all();
        const agencyTimeSeries = sqlite_1.default.prepare(`
      SELECT 
        strftime('%Y-%m', posting_date) as month,
        short_agency as agency,
        COUNT(*) as count
      FROM jobs
      WHERE posting_date >= date('now', '-12 months') AND short_agency IS NOT NULL
      GROUP BY strftime('%Y-%m', posting_date), short_agency
      ORDER BY month
    `).all();
        return {
            monthlyPostings,
            seasonalPatterns,
            categoryTimeSeries,
            agencyTimeSeries
        };
    }
    computeWorkforceAnalytics() {
        const gradeDistribution = sqlite_1.default.prepare(`
      SELECT up_grade, COUNT(*) as count
      FROM jobs
      WHERE up_grade IS NOT NULL AND up_grade != ''
      GROUP BY up_grade
      ORDER BY count DESC
    `).all();
        const seniorityDistribution = sqlite_1.default.prepare(`
      SELECT seniority_level, COUNT(*) as count
      FROM jobs
      WHERE seniority_level IS NOT NULL
      GROUP BY seniority_level
      ORDER BY count DESC
    `).all();
        const locationTypeDistribution = sqlite_1.default.prepare(`
      SELECT location_type, COUNT(*) as count
      FROM jobs
      WHERE location_type IS NOT NULL
      GROUP BY location_type
      ORDER BY count DESC
    `).all();
        const countryDistribution = sqlite_1.default.prepare(`
      SELECT duty_country, COUNT(*) as count
      FROM jobs
      WHERE duty_country IS NOT NULL AND duty_country != ''
      GROUP BY duty_country
      ORDER BY count DESC
      LIMIT 20
    `).all();
        const experienceStats = sqlite_1.default.prepare(`
      SELECT 
        AVG(bachelor_min_exp) as avg_bachelor_exp,
        AVG(master_min_exp) as avg_master_exp,
        MIN(bachelor_min_exp) as min_bachelor_exp,
        MAX(bachelor_min_exp) as max_bachelor_exp
      FROM jobs
      WHERE bachelor_min_exp IS NOT NULL
    `).get();
        return {
            gradeDistribution,
            seniorityDistribution,
            locationTypeDistribution,
            countryDistribution,
            experienceStats: {
                avgBachelorExp: Math.round(experienceStats?.avg_bachelor_exp || 0),
                avgMasterExp: Math.round(experienceStats?.avg_master_exp || 0),
                minBachelorExp: experienceStats?.min_bachelor_exp || 0,
                maxBachelorExp: experienceStats?.max_bachelor_exp || 0
            }
        };
    }
    computeSkillsAnalytics() {
        const jobs = sqlite_1.default.prepare(`
      SELECT job_labels FROM jobs WHERE job_labels IS NOT NULL AND job_labels != ''
    `).all();
        const skillFrequency = new Map();
        jobs.forEach(job => {
            const skills = (job.job_labels || '').split(',').map((s) => s.trim()).filter((s) => s);
            skills.forEach((skill) => {
                skillFrequency.set(skill, (skillFrequency.get(skill) || 0) + 1);
            });
        });
        const topSkills = Array.from(skillFrequency.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 50)
            .map(([skill, count]) => ({ skill, count }));
        const skillsByCategory = sqlite_1.default.prepare(`
      SELECT primary_category, job_labels
      FROM jobs
      WHERE primary_category IS NOT NULL AND job_labels IS NOT NULL
    `).all();
        const categorySkillMap = new Map();
        skillsByCategory.forEach(job => {
            if (!categorySkillMap.has(job.primary_category)) {
                categorySkillMap.set(job.primary_category, new Map());
            }
            const catSkills = categorySkillMap.get(job.primary_category);
            const skills = (job.job_labels || '').split(',').map((s) => s.trim()).filter((s) => s);
            skills.forEach((skill) => {
                catSkills.set(skill, (catSkills.get(skill) || 0) + 1);
            });
        });
        const topSkillsByCategory = [];
        categorySkillMap.forEach((skills, category) => {
            const categoryTopSkills = Array.from(skills.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([skill, count]) => ({ skill, count }));
            topSkillsByCategory.push({ category, skills: categoryTopSkills });
        });
        return {
            topSkills,
            totalUniqueSkills: skillFrequency.size,
            avgSkillsPerJob: jobs.length > 0
                ? Math.round(Array.from(skillFrequency.values()).reduce((a, b) => a + b, 0) / jobs.length * 10) / 10
                : 0,
            topSkillsByCategory
        };
    }
    computeCompetitiveIntelligence() {
        const agencyPositioning = sqlite_1.default.prepare(`
      SELECT 
        short_agency as agency,
        COUNT(*) as volume,
        COUNT(DISTINCT primary_category) as diversity,
        COUNT(DISTINCT duty_country) as reach,
        AVG(application_window_days) as avg_window
      FROM jobs
      WHERE short_agency IS NOT NULL AND short_agency != ''
      GROUP BY short_agency
      ORDER BY volume DESC
    `).all();
        const totalVolume = agencyPositioning.reduce((sum, a) => sum + a.volume, 0);
        const categoryDominance = sqlite_1.default.prepare(`
      SELECT 
        primary_category,
        short_agency as agency,
        COUNT(*) as count
      FROM jobs
      WHERE primary_category IS NOT NULL AND short_agency IS NOT NULL
      GROUP BY primary_category, short_agency
    `).all();
        const categoryLeaders = [];
        const categoryAgencyMap = new Map();
        categoryDominance.forEach(row => {
            if (!categoryAgencyMap.has(row.primary_category)) {
                categoryAgencyMap.set(row.primary_category, []);
            }
            categoryAgencyMap.get(row.primary_category).push({ agency: row.agency, count: row.count });
        });
        categoryAgencyMap.forEach((agencies, category) => {
            agencies.sort((a, b) => b.count - a.count);
            if (agencies[0]) {
                categoryLeaders.push({
                    category,
                    leadingAgency: agencies[0].agency,
                    leadingCount: agencies[0].count,
                    totalInCategory: agencies.reduce((sum, a) => sum + a.count, 0)
                });
            }
        });
        return {
            agencyPositioning: agencyPositioning.map(a => ({
                agency: a.agency,
                volume: a.volume,
                marketShare: totalVolume > 0 ? (a.volume / totalVolume) * 100 : 0,
                categoryDiversity: a.diversity,
                geographicReach: a.reach,
                avgProcessingTime: Math.round(a.avg_window || 0)
            })),
            categoryDominance: categoryLeaders,
            marketConcentration: this.calculateMarketConcentration(agencyPositioning, totalVolume)
        };
    }
    calculateMarketConcentration(agencies, total) {
        if (total === 0)
            return { herfindahlIndex: 0, top3Share: 0, top5Share: 0 };
        const shares = agencies.map(a => (a.volume / total) * 100);
        const herfindahlIndex = shares.reduce((sum, s) => sum + (s * s), 0) / 10000;
        return {
            herfindahlIndex: Math.round(herfindahlIndex * 1000) / 1000,
            top3Share: shares.slice(0, 3).reduce((sum, s) => sum + s, 0),
            top5Share: shares.slice(0, 5).reduce((sum, s) => sum + s, 0),
            top10Share: shares.slice(0, 10).reduce((sum, s) => sum + s, 0)
        };
    }
    parseDate(dateStr) {
        if (!dateStr || dateStr === 'N/A')
            return null;
        const parsed = new Date(dateStr);
        return isNaN(parsed.getTime()) ? null : parsed;
    }
    formatDate(date) {
        return date.toISOString().split('T')[0] || '';
    }
    getLocationType(country, station) {
        const hqCountries = ['United States', 'Switzerland', 'Austria', 'Italy', 'France', 'Belgium', 'Netherlands', 'Kenya', 'Thailand'];
        const stationLower = (station || '').toLowerCase();
        if (stationLower.includes('home') || stationLower.includes('remote'))
            return 'Remote';
        if (hqCountries.some(c => country?.includes(c)))
            return 'HQ';
        return 'Field';
    }
    extractSkillDomains(labels) {
        const domains = [];
        const labelsLower = labels.toLowerCase();
        const domainKeywords = {
            'Technical': ['software', 'data', 'IT', 'programming', 'engineering', 'analysis'],
            'Management': ['management', 'coordination', 'leadership', 'planning', 'strategy'],
            'Communication': ['communication', 'writing', 'presentation', 'advocacy', 'outreach'],
            'Operational': ['logistics', 'operations', 'procurement', 'administration', 'finance']
        };
        Object.entries(domainKeywords).forEach(([domain, keywords]) => {
            if (keywords.some(k => labelsLower.includes(k.toLowerCase()))) {
                domains.push(domain);
            }
        });
        return domains;
    }
    getSyncStatus() {
        return sqlite_1.default.prepare('SELECT * FROM sync_metadata WHERE id = 1').get();
    }
}
exports.SyncService = SyncService;
exports.default = SyncService;
//# sourceMappingURL=SyncService.js.map