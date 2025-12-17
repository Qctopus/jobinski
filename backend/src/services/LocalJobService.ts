import db from '../config/sqlite';

interface GetJobsQuery {
  page?: number;
  limit?: number;
  category?: string;
  agency?: string;
  search?: string;
  status?: 'active' | 'expired' | 'closing_soon' | 'archived' | 'all';
  country?: string;
  grade?: string;
  sort_by?: 'posting_date' | 'confidence' | 'title' | 'days_remaining';
  sort_order?: 'asc' | 'desc';
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
}

/**
 * LocalJobService - Serves pre-processed jobs from local SQLite database
 * All heavy processing is done during sync, so queries are fast
 */
export class LocalJobService {
  /**
   * Get jobs with filtering and pagination
   */
  getJobs(query: GetJobsQuery = {}): PaginatedResponse<any> {
    const {
      page = 1,
      limit = 50,
      category,
      agency,
      search,
      status,
      country,
      grade,
      sort_by = 'posting_date',
      sort_order = 'desc'
    } = query;

    const conditions: string[] = [];
    const params: any[] = [];

    // Build WHERE conditions
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

    // Validate sort column
    const validSortColumns = ['posting_date', 'classification_confidence', 'title', 'days_remaining', 'id'];
    const sortColumn = sort_by === 'confidence' ? 'classification_confidence' : 
                       validSortColumns.includes(sort_by) ? sort_by : 'posting_date';
    const sortDirection = sort_order === 'asc' ? 'ASC' : 'DESC';

    // Get total count
    const countResult = db.prepare(`SELECT COUNT(*) as count FROM jobs ${whereClause}`).get(...params) as any;
    const total = countResult?.count || 0;

    // Get paginated jobs
    const offset = (page - 1) * limit;
    const jobs = db.prepare(`
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
    `).all(...params, limit, offset) as any[];

    // Parse JSON fields
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

  /**
   * Get a single job by ID
   */
  getJobById(id: number): any {
    const job = db.prepare(`
      SELECT * FROM jobs WHERE id = ?
    `).get(id) as any;

    if (!job) return null;

    return {
      ...job,
      secondary_categories: this.safeJsonParse(job.secondary_categories, []),
      classification_reasoning: this.safeJsonParse(job.classification_reasoning, []),
      skill_domains: this.safeJsonParse(job.skill_domains, []),
      is_active: Boolean(job.is_active),
      is_expired: Boolean(job.is_expired)
    };
  }

  /**
   * Get distinct values for filters
   */
  getFilterOptions(): any {
    const categories = db.prepare(`
      SELECT DISTINCT primary_category as value, COUNT(*) as count
      FROM jobs WHERE primary_category IS NOT NULL
      GROUP BY primary_category ORDER BY count DESC
    `).all();

    const agencies = db.prepare(`
      SELECT DISTINCT short_agency as value, COUNT(*) as count
      FROM jobs WHERE short_agency IS NOT NULL AND short_agency != ''
      GROUP BY short_agency ORDER BY count DESC
    `).all();

    const countries = db.prepare(`
      SELECT DISTINCT duty_country as value, COUNT(*) as count
      FROM jobs WHERE duty_country IS NOT NULL AND duty_country != ''
      GROUP BY duty_country ORDER BY count DESC LIMIT 50
    `).all();

    const grades = db.prepare(`
      SELECT DISTINCT up_grade as value, COUNT(*) as count
      FROM jobs WHERE up_grade IS NOT NULL AND up_grade != ''
      GROUP BY up_grade ORDER BY count DESC LIMIT 30
    `).all();

    const statuses = db.prepare(`
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

  /**
   * Get basic stats
   */
  getBasicStats(): any {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_jobs,
        COUNT(DISTINCT short_agency) as total_agencies,
        COUNT(DISTINCT duty_country) as total_countries,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_jobs
      FROM jobs
    `).get() as any;

    return stats;
  }

  /**
   * Check if local database has data
   */
  hasData(): boolean {
    const result = db.prepare('SELECT COUNT(*) as count FROM jobs').get() as any;
    return result?.count > 0;
  }

  /**
   * Get sync status
   */
  getSyncStatus(): any {
    return db.prepare('SELECT * FROM sync_metadata WHERE id = 1').get();
  }

  private safeJsonParse(value: string | null, defaultValue: any): any {
    if (!value) return defaultValue;
    try {
      return JSON.parse(value);
    } catch {
      return defaultValue;
    }
  }
}

export default LocalJobService;
















