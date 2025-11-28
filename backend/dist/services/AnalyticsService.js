"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const sqlite_1 = __importDefault(require("../config/sqlite"));
class AnalyticsService {
    getCachedAnalytics(key) {
        const result = sqlite_1.default.prepare(`
      SELECT data, created_at, expires_at FROM analytics_cache WHERE cache_key = ?
    `).get(key);
        if (!result)
            return null;
        try {
            return {
                data: JSON.parse(result.data),
                createdAt: result.created_at,
                expiresAt: result.expires_at,
                isFresh: new Date(result.expires_at) > new Date()
            };
        }
        catch {
            return null;
        }
    }
    getOverview() {
        const cached = this.getCachedAnalytics('dashboard:overview');
        if (cached)
            return cached;
        return this.computeOverviewLive();
    }
    getCategoryAnalytics() {
        const cached = this.getCachedAnalytics('dashboard:categories');
        if (cached)
            return cached;
        return this.computeCategoryAnalyticsLive();
    }
    getAgencyAnalytics() {
        const cached = this.getCachedAnalytics('dashboard:agencies');
        if (cached)
            return cached;
        return this.computeAgencyAnalyticsLive();
    }
    getTemporalTrends() {
        const cached = this.getCachedAnalytics('dashboard:temporal');
        if (cached)
            return cached;
        return this.computeTemporalTrendsLive();
    }
    getWorkforceAnalytics() {
        const cached = this.getCachedAnalytics('dashboard:workforce');
        if (cached)
            return cached;
        return this.computeWorkforceAnalyticsLive();
    }
    getSkillsAnalytics() {
        const cached = this.getCachedAnalytics('dashboard:skills');
        if (cached)
            return cached;
        return this.computeSkillsAnalyticsLive();
    }
    getCompetitiveIntelligence() {
        const cached = this.getCachedAnalytics('dashboard:competitive');
        if (cached)
            return cached;
        return this.computeCompetitiveIntelLive();
    }
    getAllDashboardData() {
        return {
            overview: this.getOverview(),
            categories: this.getCategoryAnalytics(),
            agencies: this.getAgencyAnalytics(),
            temporal: this.getTemporalTrends(),
            workforce: this.getWorkforceAnalytics(),
            skills: this.getSkillsAnalytics(),
            competitive: this.getCompetitiveIntelligence()
        };
    }
    getFilteredAnalytics(agency, timeRange) {
        if (!agency || agency === 'all') {
            return this.getAllDashboardData();
        }
        return this.computeAgencyFilteredAnalytics(agency);
    }
    computeOverviewLive() {
        const stats = sqlite_1.default.prepare(`
      SELECT 
        COUNT(*) as total_jobs,
        COUNT(DISTINCT short_agency) as total_agencies,
        COUNT(DISTINCT duty_country) as total_countries,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_jobs,
        AVG(classification_confidence) as avg_confidence
      FROM jobs
    `).get();
        const topCategories = sqlite_1.default.prepare(`
      SELECT primary_category as category, COUNT(*) as count
      FROM jobs WHERE primary_category IS NOT NULL
      GROUP BY primary_category ORDER BY count DESC LIMIT 10
    `).all();
        const total = topCategories.reduce((sum, c) => sum + c.count, 0);
        return {
            data: {
                totalJobs: stats.total_jobs,
                totalAgencies: stats.total_agencies,
                totalCountries: stats.total_countries,
                activeJobs: stats.active_jobs,
                avgConfidence: Math.round(stats.avg_confidence || 0),
                topCategories: topCategories.map(c => ({
                    category: c.category,
                    count: c.count,
                    percentage: total > 0 ? (c.count / total) * 100 : 0
                }))
            },
            createdAt: new Date().toISOString(),
            isFresh: true
        };
    }
    computeCategoryAnalyticsLive() {
        const categories = sqlite_1.default.prepare(`
      SELECT 
        primary_category as category,
        COUNT(*) as total,
        AVG(classification_confidence) as avg_confidence,
        COUNT(DISTINCT short_agency) as agencies_count
      FROM jobs
      WHERE primary_category IS NOT NULL
      GROUP BY primary_category
      ORDER BY total DESC
    `).all();
        const totalJobs = categories.reduce((sum, c) => sum + c.total, 0);
        return {
            data: {
                categories: categories.map(c => ({
                    category: c.category,
                    total: c.total,
                    percentage: totalJobs > 0 ? (c.total / totalJobs) * 100 : 0,
                    avgConfidence: Math.round(c.avg_confidence || 0),
                    agenciesCount: c.agencies_count
                }))
            },
            createdAt: new Date().toISOString(),
            isFresh: true
        };
    }
    computeAgencyAnalyticsLive() {
        const agencies = sqlite_1.default.prepare(`
      SELECT 
        short_agency as agency,
        COUNT(*) as total_jobs,
        COUNT(DISTINCT primary_category) as categories_count,
        COUNT(DISTINCT duty_country) as countries_count
      FROM jobs
      WHERE short_agency IS NOT NULL AND short_agency != ''
      GROUP BY short_agency
      ORDER BY total_jobs DESC
    `).all();
        const totalJobs = agencies.reduce((sum, a) => sum + a.total_jobs, 0);
        return {
            data: {
                agencies: agencies.map(a => ({
                    agency: a.agency,
                    totalJobs: a.total_jobs,
                    marketShare: totalJobs > 0 ? (a.total_jobs / totalJobs) * 100 : 0,
                    categoriesCount: a.categories_count,
                    countriesCount: a.countries_count
                }))
            },
            createdAt: new Date().toISOString(),
            isFresh: true
        };
    }
    computeTemporalTrendsLive() {
        const monthlyPostings = sqlite_1.default.prepare(`
      SELECT 
        strftime('%Y-%m', posting_date) as month,
        COUNT(*) as total
      FROM jobs
      WHERE posting_date >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', posting_date)
      ORDER BY month
    `).all();
        return {
            data: { monthlyPostings },
            createdAt: new Date().toISOString(),
            isFresh: true
        };
    }
    computeWorkforceAnalyticsLive() {
        const gradeDistribution = sqlite_1.default.prepare(`
      SELECT up_grade as grade, COUNT(*) as count
      FROM jobs WHERE up_grade IS NOT NULL AND up_grade != ''
      GROUP BY up_grade ORDER BY count DESC LIMIT 20
    `).all();
        const seniorityDistribution = sqlite_1.default.prepare(`
      SELECT seniority_level, COUNT(*) as count
      FROM jobs WHERE seniority_level IS NOT NULL
      GROUP BY seniority_level ORDER BY count DESC
    `).all();
        return {
            data: { gradeDistribution, seniorityDistribution },
            createdAt: new Date().toISOString(),
            isFresh: true
        };
    }
    computeSkillsAnalyticsLive() {
        const jobs = sqlite_1.default.prepare(`
      SELECT job_labels FROM jobs WHERE job_labels IS NOT NULL AND job_labels != '' LIMIT 5000
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
        return {
            data: { topSkills, totalUniqueSkills: skillFrequency.size },
            createdAt: new Date().toISOString(),
            isFresh: true
        };
    }
    computeCompetitiveIntelLive() {
        const agencyPositioning = sqlite_1.default.prepare(`
      SELECT 
        short_agency as agency,
        COUNT(*) as volume,
        COUNT(DISTINCT primary_category) as diversity
      FROM jobs
      WHERE short_agency IS NOT NULL AND short_agency != ''
      GROUP BY short_agency
      ORDER BY volume DESC
      LIMIT 20
    `).all();
        const totalVolume = agencyPositioning.reduce((sum, a) => sum + a.volume, 0);
        return {
            data: {
                agencyPositioning: agencyPositioning.map(a => ({
                    agency: a.agency,
                    volume: a.volume,
                    marketShare: totalVolume > 0 ? (a.volume / totalVolume) * 100 : 0,
                    categoryDiversity: a.diversity
                }))
            },
            createdAt: new Date().toISOString(),
            isFresh: true
        };
    }
    computeAgencyFilteredAnalytics(agency) {
        const stats = sqlite_1.default.prepare(`
      SELECT 
        COUNT(*) as total_jobs,
        COUNT(DISTINCT duty_country) as total_countries,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_jobs,
        AVG(classification_confidence) as avg_confidence,
        AVG(application_window_days) as avg_window
      FROM jobs
      WHERE short_agency = ? OR long_agency = ?
    `).get(agency, agency);
        const categories = sqlite_1.default.prepare(`
      SELECT primary_category as category, COUNT(*) as count
      FROM jobs 
      WHERE (short_agency = ? OR long_agency = ?) AND primary_category IS NOT NULL
      GROUP BY primary_category ORDER BY count DESC
    `).all(agency, agency);
        const countries = sqlite_1.default.prepare(`
      SELECT duty_country as country, COUNT(*) as count
      FROM jobs 
      WHERE (short_agency = ? OR long_agency = ?) AND duty_country IS NOT NULL
      GROUP BY duty_country ORDER BY count DESC LIMIT 10
    `).all(agency, agency);
        const gradeDistribution = sqlite_1.default.prepare(`
      SELECT up_grade as grade, COUNT(*) as count
      FROM jobs 
      WHERE (short_agency = ? OR long_agency = ?) AND up_grade IS NOT NULL
      GROUP BY up_grade ORDER BY count DESC LIMIT 15
    `).all(agency, agency);
        const marketTotal = sqlite_1.default.prepare('SELECT COUNT(*) as count FROM jobs').get()?.count || 0;
        const marketShare = marketTotal > 0 ? (stats.total_jobs / marketTotal) * 100 : 0;
        const agencyRank = sqlite_1.default.prepare(`
      SELECT COUNT(*) + 1 as rank FROM (
        SELECT short_agency, COUNT(*) as cnt FROM jobs 
        WHERE short_agency IS NOT NULL GROUP BY short_agency
        HAVING cnt > (SELECT COUNT(*) FROM jobs WHERE short_agency = ? OR long_agency = ?)
      )
    `).get(agency, agency);
        return {
            overview: {
                data: {
                    totalJobs: stats.total_jobs,
                    totalCountries: stats.total_countries,
                    activeJobs: stats.active_jobs,
                    avgConfidence: Math.round(stats.avg_confidence || 0),
                    avgApplicationWindow: Math.round(stats.avg_window || 0),
                    marketShare,
                    marketRank: agencyRank?.rank || 0,
                    topCategories: categories.map(c => ({
                        category: c.category,
                        count: c.count,
                        percentage: stats.total_jobs > 0 ? (c.count / stats.total_jobs) * 100 : 0
                    }))
                },
                createdAt: new Date().toISOString(),
                isFresh: true
            },
            categories: {
                data: { categories },
                createdAt: new Date().toISOString(),
                isFresh: true
            },
            workforce: {
                data: { gradeDistribution, countries },
                createdAt: new Date().toISOString(),
                isFresh: true
            }
        };
    }
}
exports.AnalyticsService = AnalyticsService;
exports.default = AnalyticsService;
//# sourceMappingURL=AnalyticsService.js.map