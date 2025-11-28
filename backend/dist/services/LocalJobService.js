"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalJobService = void 0;
const sqlite_1 = __importDefault(require("../config/sqlite"));
class LocalJobService {
    getJobs(query = {}) {
        const { page = 1, limit = 50, category, agency, search, status, country, grade, sort_by = 'posting_date', sort_order = 'desc' } = query;
        const conditions = [];
        const params = [];
        if (category && category !== 'all') {
            conditions.push('primary_category = ?');
            params.push(category);
        }
        if (agency && agency !== 'all') {
            conditions.push('(short_agency = ? OR long_agency = ?)');
            params.push(agency, agency);
        }
        if (search) {
            conditions.push('(title LIKE ? OR job_labels LIKE ? OR description LIKE ?)');
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        if (status && status !== 'all') {
            conditions.push('status = ?');
            params.push(status);
        }
        if (country) {
            conditions.push('duty_country = ?');
            params.push(country);
        }
        if (grade) {
            conditions.push('up_grade LIKE ?');
            params.push(`%${grade}%`);
        }
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const validSortColumns = ['posting_date', 'classification_confidence', 'title', 'days_remaining', 'id'];
        const sortColumn = sort_by === 'confidence' ? 'classification_confidence' :
            validSortColumns.includes(sort_by) ? sort_by : 'posting_date';
        const sortDirection = sort_order === 'asc' ? 'ASC' : 'DESC';
        const countResult = sqlite_1.default.prepare(`SELECT COUNT(*) as count FROM jobs ${whereClause}`).get(...params);
        const total = countResult?.count || 0;
        const offset = (page - 1) * limit;
        const jobs = sqlite_1.default.prepare(`
      SELECT 
        id, title, description, job_labels, short_agency, long_agency,
        duty_station, duty_country, duty_continent, up_grade, department,
        posting_date, apply_until, url, languages,
        primary_category, secondary_categories, classification_confidence,
        classification_reasoning, seniority_level, location_type, skill_domains,
        status, is_active, is_expired, days_remaining, urgency,
        application_window_days, formatted_posting_date, formatted_apply_until
      FROM jobs 
      ${whereClause}
      ORDER BY ${sortColumn} ${sortDirection}
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);
        const processedJobs = jobs.map(job => ({
            ...job,
            secondary_categories: this.safeJsonParse(job.secondary_categories, []),
            classification_reasoning: this.safeJsonParse(job.classification_reasoning, []),
            skill_domains: this.safeJsonParse(job.skill_domains, []),
            is_active: Boolean(job.is_active),
            is_expired: Boolean(job.is_expired)
        }));
        return {
            success: true,
            data: processedJobs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            },
            timestamp: new Date().toISOString()
        };
    }
    getJobById(id) {
        const job = sqlite_1.default.prepare(`
      SELECT * FROM jobs WHERE id = ?
    `).get(id);
        if (!job)
            return null;
        return {
            ...job,
            secondary_categories: this.safeJsonParse(job.secondary_categories, []),
            classification_reasoning: this.safeJsonParse(job.classification_reasoning, []),
            skill_domains: this.safeJsonParse(job.skill_domains, []),
            is_active: Boolean(job.is_active),
            is_expired: Boolean(job.is_expired)
        };
    }
    getFilterOptions() {
        const categories = sqlite_1.default.prepare(`
      SELECT DISTINCT primary_category as value, COUNT(*) as count
      FROM jobs WHERE primary_category IS NOT NULL
      GROUP BY primary_category ORDER BY count DESC
    `).all();
        const agencies = sqlite_1.default.prepare(`
      SELECT DISTINCT short_agency as value, COUNT(*) as count
      FROM jobs WHERE short_agency IS NOT NULL AND short_agency != ''
      GROUP BY short_agency ORDER BY count DESC
    `).all();
        const countries = sqlite_1.default.prepare(`
      SELECT DISTINCT duty_country as value, COUNT(*) as count
      FROM jobs WHERE duty_country IS NOT NULL AND duty_country != ''
      GROUP BY duty_country ORDER BY count DESC LIMIT 50
    `).all();
        const grades = sqlite_1.default.prepare(`
      SELECT DISTINCT up_grade as value, COUNT(*) as count
      FROM jobs WHERE up_grade IS NOT NULL AND up_grade != ''
      GROUP BY up_grade ORDER BY count DESC LIMIT 30
    `).all();
        const statuses = sqlite_1.default.prepare(`
      SELECT status as value, COUNT(*) as count
      FROM jobs GROUP BY status ORDER BY count DESC
    `).all();
        return {
            categories,
            agencies,
            countries,
            grades,
            statuses
        };
    }
    getBasicStats() {
        const stats = sqlite_1.default.prepare(`
      SELECT 
        COUNT(*) as total_jobs,
        COUNT(DISTINCT short_agency) as total_agencies,
        COUNT(DISTINCT duty_country) as total_countries,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_jobs
      FROM jobs
    `).get();
        return stats;
    }
    hasData() {
        const result = sqlite_1.default.prepare('SELECT COUNT(*) as count FROM jobs').get();
        return result?.count > 0;
    }
    getSyncStatus() {
        return sqlite_1.default.prepare('SELECT * FROM sync_metadata WHERE id = 1').get();
    }
    safeJsonParse(value, defaultValue) {
        if (!value)
            return defaultValue;
        try {
            return JSON.parse(value);
        }
        catch {
            return defaultValue;
        }
    }
}
exports.LocalJobService = LocalJobService;
exports.default = LocalJobService;
//# sourceMappingURL=LocalJobService.js.map