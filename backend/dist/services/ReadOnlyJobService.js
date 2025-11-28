"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadOnlyJobService = void 0;
const database_1 = __importDefault(require("../config/database"));
class ReadOnlyJobService {
    async getJobs(query = {}) {
        const { page = 1, limit = 20, agency, search, status = 'all', sort_by = 'id', sort_order = 'desc' } = query;
        const offset = (page - 1) * limit;
        const conditions = [];
        const values = [];
        let paramCount = 0;
        if (agency) {
            conditions.push(`(
        LOWER(COALESCE(short_agency, '')) ILIKE LOWER($${++paramCount}) OR 
        LOWER(COALESCE(long_agency, '')) ILIKE LOWER($${++paramCount})
      )`);
            values.push(`%${agency}%`, `%${agency}%`);
            paramCount++;
        }
        if (search) {
            conditions.push(`(
        LOWER(COALESCE(title, '')) ILIKE LOWER($${++paramCount}) OR 
        LOWER(COALESCE(description, '')) ILIKE LOWER($${++paramCount})
      )`);
            values.push(`%${search}%`, `%${search}%`);
            paramCount++;
        }
        if (status && status !== 'all') {
            if (status === 'active') {
                conditions.push(`(
          CASE 
            WHEN apply_until IS NULL OR apply_until = '' OR apply_until = 'N/A' THEN false
            ELSE CAST(apply_until AS timestamp) > NOW()
          END
          AND CAST(COALESCE(archived, 0) AS int) = 0
        )`);
            }
            else if (status === 'expired') {
                conditions.push(`(
          CASE 
            WHEN apply_until IS NULL OR apply_until = '' OR apply_until = 'N/A' THEN true
            ELSE CAST(apply_until AS timestamp) <= NOW()
          END
          OR CAST(COALESCE(archived, 0) AS int) = 1
        )`);
            }
            else if (status === 'closing_soon') {
                conditions.push(`(
          CASE 
            WHEN apply_until IS NULL OR apply_until = '' OR apply_until = 'N/A' THEN false
            ELSE 
              CAST(apply_until AS timestamp) > NOW() AND 
              CAST(apply_until AS timestamp) <= NOW() + INTERVAL '3 days'
          END
          AND CAST(COALESCE(archived, 0) AS int) = 0
        )`);
            }
            else if (status === 'archived') {
                conditions.push(`(CAST(COALESCE(archived, 0) AS int) = 1)`);
            }
        }
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        const validSortColumns = ['id', 'title', 'posting_date'];
        const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'id';
        const sortDirection = sort_order === 'asc' ? 'ASC' : 'DESC';
        try {
            const countQuery = `SELECT COUNT(*) FROM jobs ${whereClause}`;
            const countResult = await database_1.default.query(countQuery, values);
            const total = parseInt(countResult.rows[0].count);
            const jobsQuery = `
        SELECT *
        FROM jobs 
        ${whereClause}
        ORDER BY ${sortColumn} ${sortDirection}
        LIMIT $${++paramCount} OFFSET $${++paramCount}
      `;
            values.push(limit, offset);
            const result = await database_1.default.query(jobsQuery, values);
            const jobs = result.rows.map(row => this.mapRowToJob(row));
            return {
                success: true,
                data: jobs,
                timestamp: new Date().toISOString(),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        }
        catch (error) {
            console.error('Error fetching jobs:', error);
            throw new Error(`Failed to fetch jobs: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getJobById(id) {
        try {
            const query = `SELECT * FROM jobs WHERE id = $1`;
            const result = await database_1.default.query(query, [id]);
            if (result.rows.length === 0) {
                return null;
            }
            return this.mapRowToJob(result.rows[0]);
        }
        catch (error) {
            console.error('Error fetching job by ID:', error);
            throw new Error(`Failed to fetch job: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getBasicStats() {
        try {
            const statsQuery = `
        SELECT 
          COUNT(*) as total_jobs,
          COUNT(DISTINCT COALESCE(short_agency, long_agency)) as total_agencies,
          COUNT(DISTINCT duty_country) as total_countries
        FROM jobs
      `;
            const agencyQuery = `
        SELECT 
          COALESCE(short_agency, long_agency, 'Unknown') as agency,
          COUNT(*) as count
        FROM jobs
        WHERE COALESCE(short_agency, long_agency) IS NOT NULL
        GROUP BY COALESCE(short_agency, long_agency)
        ORDER BY count DESC
        LIMIT 10
      `;
            const [statsResult, agencyResult] = await Promise.all([
                database_1.default.query(statsQuery),
                database_1.default.query(agencyQuery)
            ]);
            const stats = statsResult.rows[0];
            const topAgencies = {};
            agencyResult.rows.forEach(row => {
                topAgencies[row.agency] = parseInt(row.count);
            });
            return {
                total_jobs: parseInt(stats.total_jobs),
                total_agencies: parseInt(stats.total_agencies),
                total_countries: parseInt(stats.total_countries),
                top_agencies: topAgencies
            };
        }
        catch (error) {
            console.error('Error fetching basic stats:', error);
            throw new Error(`Failed to fetch stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getTableStructure() {
        try {
            const query = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'jobs' AND table_schema = 'public'
        ORDER BY ordinal_position
      `;
            const result = await database_1.default.query(query);
            return result.rows;
        }
        catch (error) {
            console.error('Error fetching table structure:', error);
            throw new Error(`Failed to fetch table structure: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    calculateJobStatus(applyUntil, archived = false) {
        const now = new Date();
        const deadline = new Date(applyUntil);
        const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        let status;
        if (archived) {
            status = 'archived';
        }
        else if (daysRemaining < 0) {
            status = 'expired';
        }
        else if (daysRemaining <= 3) {
            status = 'closing_soon';
        }
        else {
            status = 'active';
        }
        const urgency = daysRemaining < 7 ? 'urgent' :
            daysRemaining <= 30 ? 'normal' :
                'extended';
        return {
            is_active: !archived && daysRemaining >= 0,
            is_expired: archived || daysRemaining < 0,
            days_remaining: daysRemaining,
            status,
            urgency
        };
    }
    mapRowToJob(row) {
        const statusInfo = this.calculateJobStatus(row.apply_until, Boolean(row.archived) && Number(row.archived) !== 0);
        return {
            id: row.id,
            title: row.title || '',
            description: row.description || '',
            job_labels: row.job_labels || '',
            short_agency: row.short_agency || '',
            long_agency: row.long_agency || '',
            duty_station: row.duty_station || '',
            duty_country: row.duty_country || '',
            up_grade: row.up_grade || '',
            posting_date: row.posting_date,
            apply_until: row.apply_until,
            url: row.url || '',
            ...statusInfo,
            archived: Boolean(row.archived) && Number(row.archived) !== 0,
            primary_category: row.primary_category || row.sectoral_category || null,
            secondary_categories: row.secondary_categories || [],
            classification_confidence: row.classification_confidence || null,
            classification_reasoning: row.classification_reasoning || [],
            is_user_corrected: row.is_user_corrected || false,
            user_corrected_by: row.user_corrected_by || null,
            user_corrected_at: row.user_corrected_at || null,
            classified_at: row.classified_at || null,
            is_ambiguous_category: row.is_ambiguous_category || false,
            emerging_terms_found: row.emerging_terms_found || []
        };
    }
}
exports.ReadOnlyJobService = ReadOnlyJobService;
exports.default = ReadOnlyJobService;
//# sourceMappingURL=ReadOnlyJobService.js.map