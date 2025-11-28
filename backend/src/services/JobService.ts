import pool from '../config/database';
import { JobData, ClassificationResult, UserFeedback, GetJobsQuery, PaginatedResponse, ClassificationStats } from '../types';
import { ClassificationService } from './ClassificationService';

export class JobService {
  private classificationService: ClassificationService;

  constructor() {
    this.classificationService = ClassificationService.getInstance();
  }

  /**
   * Get jobs with optional filtering and pagination
   */
  async getJobs(query: GetJobsQuery = {}): Promise<PaginatedResponse<JobData>> {
    const {
      page = 1,
      limit = 20,
      category,
      agency,
      confidence_min,
      confidence_max,
      user_corrected,
      search,
      sort_by = 'posting_date',
      sort_order = 'desc'
    } = query;

    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    // Build WHERE conditions
    if (category) {
      conditions.push(`primary_category = $${++paramCount}`);
      values.push(category);
    }

    if (agency) {
      conditions.push(`(short_agency ILIKE $${++paramCount} OR long_agency ILIKE $${++paramCount})`);
      values.push(`%${agency}%`, `%${agency}%`);
      paramCount++;
    }

    if (confidence_min !== undefined) {
      conditions.push(`classification_confidence >= $${++paramCount}`);
      values.push(confidence_min);
    }

    if (confidence_max !== undefined) {
      conditions.push(`classification_confidence <= $${++paramCount}`);
      values.push(confidence_max);
    }

    if (user_corrected !== undefined) {
      conditions.push(`is_user_corrected = $${++paramCount}`);
      values.push(user_corrected);
    }

    if (search) {
      conditions.push(`(title ILIKE $${++paramCount} OR description ILIKE $${++paramCount} OR job_labels ILIKE $${++paramCount})`);
      values.push(`%${search}%`, `%${search}%`, `%${search}%`);
      paramCount += 2;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Validate sort column
    const validSortColumns = ['posting_date', 'classification_confidence', 'title', 'classified_at'];
    const sortColumn = validSortColumns.includes(sort_by) ? sort_by : 'posting_date';
    const sortDirection = sort_order === 'asc' ? 'ASC' : 'DESC';

    try {
      // Get total count
      const countQuery = `SELECT COUNT(*) FROM jobs ${whereClause}`;
      const countResult = await pool.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      // Get jobs - only query columns that exist in the database
      const jobsQuery = `
        SELECT 
          id, title, description, job_labels, short_agency, long_agency,
          duty_station, duty_country, duty_continent, country_code,
          eligible_nationality, hs_min_exp, bachelor_min_exp, master_min_exp,
          up_grade, pipeline, department, posting_date, apply_until, url,
          languages, uniquecode, ideal_candidate, job_labels_vectorized,
          job_candidate_vectorized, created_at, updated_at, archived,
          sectoral_category
        FROM jobs 
        ${whereClause}
        ORDER BY ${sortColumn} ${sortDirection}
        LIMIT $${++paramCount} OFFSET $${++paramCount}
      `;

      values.push(limit, offset);

      const result = await pool.query(jobsQuery, values);

      // Map rows and add classification in-memory
      const jobs = result.rows.map(row => {
        const baseJob = this.mapRowToJob(row);
        // Classify the job in-memory
        const classification = this.classificationService.classifyJob(baseJob);
        return {
          ...baseJob,
          primary_category: classification.primary,
          classification_confidence: classification.confidence,
          secondary_categories: classification.secondary.map(s => s.category),
          classification_reasoning: classification.reasoning,
          is_ambiguous_category: classification.flags.ambiguous || false,
          emerging_terms_found: classification.flags.emergingTerms || []
        };
      });

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

    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw new Error(`Failed to fetch jobs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a single job by ID
   */
  async getJobById(id: number): Promise<JobData | null> {
    try {
      const query = `
        SELECT 
          id, title, description, job_labels, short_agency, long_agency,
          duty_station, duty_country, up_grade, posting_date, apply_until, url,
          primary_category, secondary_categories, classification_confidence,
          classification_reasoning, is_user_corrected, user_corrected_by,
          user_corrected_at, classified_at, is_ambiguous_category, emerging_terms_found
        FROM jobs 
        WHERE id = $1
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToJob(result.rows[0]);

    } catch (error) {
      console.error('Error fetching job by ID:', error);
      throw new Error(`Failed to fetch job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Classify a single job
   */
  async classifyJob(jobId: number, forceReclassify: boolean = false): Promise<ClassificationResult> {
    try {
      const job = await this.getJobById(jobId);
      if (!job) {
        throw new Error(`Job with ID ${jobId} not found`);
      }

      // Skip if already classified and not forcing reclassification
      if (job.primary_category && !forceReclassify) {
        return {
          primary: job.primary_category,
          confidence: job.classification_confidence || 0,
          secondary: job.secondary_categories?.map(cat => ({ category: cat, confidence: 0 })) || [],
          reasoning: job.classification_reasoning || [],
          flags: {}
        };
      }

      // Classify the job
      const classification = this.classificationService.classifyJob(job);

      // Save classification results
      await this.saveClassification(jobId, classification, 'auto');

      return classification;

    } catch (error) {
      console.error('Error classifying job:', error);
      throw new Error(`Failed to classify job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update job category (user correction)
   */
  async updateJobCategory(jobId: number, primaryCategory: string, userId?: string, reason?: string): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get current job data
      const jobResult = await client.query('SELECT primary_category FROM jobs WHERE id = $1', [jobId]);
      if (jobResult.rows.length === 0) {
        throw new Error(`Job with ID ${jobId} not found`);
      }

      const originalCategory = jobResult.rows[0].primary_category;

      // Update job with user correction
      const updateQuery = `
        UPDATE jobs 
        SET 
          primary_category = $1,
          is_user_corrected = true,
          user_corrected_by = $2,
          user_corrected_at = NOW(),
          classification_confidence = 100,
          classification_reasoning = $3
        WHERE id = $4
      `;

      const reasoning = ['User corrected classification'];
      await client.query(updateQuery, [primaryCategory, userId, JSON.stringify(reasoning), jobId]);

      // Log the correction in user_feedback table
      if (originalCategory !== primaryCategory) {
        const feedbackQuery = `
          INSERT INTO user_feedback (job_id, original_category, corrected_category, user_id, reason, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
        `;
        await client.query(feedbackQuery, [jobId, originalCategory, primaryCategory, userId, reason]);
      }

      // Log in classification_log
      const logQuery = `
        INSERT INTO classification_log 
        (job_id, classification_type, primary_category, confidence, reasoning, classified_by, created_at)
        VALUES ($1, 'user_correction', $2, 100, $3, $4, NOW())
      `;
      await client.query(logQuery, [jobId, primaryCategory, JSON.stringify(reasoning), userId]);

      await client.query('COMMIT');

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating job category:', error);
      throw new Error(`Failed to update job category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      client.release();
    }
  }

  /**
   * Get classification statistics
   */
  async getClassificationStats(): Promise<ClassificationStats> {
    try {
      const statsQuery = `
        SELECT 
          COUNT(*) as total_jobs,
          COUNT(primary_category) as classified_jobs,
          COUNT(CASE WHEN is_user_corrected = true THEN 1 END) as user_corrected_jobs,
          AVG(classification_confidence) as avg_confidence,
          COUNT(CASE WHEN classification_confidence < 50 THEN 1 END) as low_confidence_count
        FROM jobs
      `;

      const categoryQuery = `
        SELECT primary_category, COUNT(*) as count
        FROM jobs
        WHERE primary_category IS NOT NULL
        GROUP BY primary_category
        ORDER BY count DESC
      `;

      const [statsResult, categoryResult] = await Promise.all([
        pool.query(statsQuery),
        pool.query(categoryQuery)
      ]);

      const stats = statsResult.rows[0];
      const categoryDistribution: Record<string, number> = {};

      categoryResult.rows.forEach(row => {
        categoryDistribution[row.primary_category] = parseInt(row.count);
      });

      return {
        total_jobs: parseInt(stats.total_jobs),
        classified_jobs: parseInt(stats.classified_jobs),
        user_corrected_jobs: parseInt(stats.user_corrected_jobs),
        avg_confidence: parseFloat(stats.avg_confidence) || 0,
        low_confidence_count: parseInt(stats.low_confidence_count),
        category_distribution: categoryDistribution
      };

    } catch (error) {
      console.error('Error fetching classification stats:', error);
      throw new Error(`Failed to fetch classification stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Batch classify multiple jobs
   */
  async batchClassifyJobs(limit: number = 100): Promise<{ processed: number; errors: number }> {
    try {
      // Get unclassified jobs
      const query = `
        SELECT id, title, description, job_labels, short_agency, long_agency,
               duty_station, duty_country, up_grade, posting_date, apply_until, url
        FROM jobs 
        WHERE primary_category IS NULL
        LIMIT $1
      `;

      const result = await pool.query(query, [limit]);
      const jobs = result.rows.map(row => this.mapRowToJob(row));

      let processed = 0;
      let errors = 0;

      for (const job of jobs) {
        try {
          if (job.id) {
            const classification = this.classificationService.classifyJob(job);
            await this.saveClassification(job.id, classification, 'batch');
            processed++;
          }
        } catch (error) {
          console.error(`Error classifying job ${job.id}:`, error);
          errors++;
        }
      }

      console.log(`Batch classification completed: ${processed} processed, ${errors} errors`);
      return { processed, errors };

    } catch (error) {
      console.error('Error in batch classification:', error);
      throw new Error(`Failed to batch classify jobs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Save classification results to database
   */
  private async saveClassification(jobId: number, classification: ClassificationResult, type: string): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Update job with classification
      const updateQuery = `
        UPDATE jobs 
        SET 
          primary_category = $1,
          secondary_categories = $2,
          classification_confidence = $3,
          classification_reasoning = $4,
          classified_at = NOW(),
          is_ambiguous_category = $5,
          emerging_terms_found = $6
        WHERE id = $7
      `;

      const secondaryCategories = classification.secondary.map(s => s.category);
      const isAmbiguous = classification.flags.ambiguous || false;
      const emergingTerms = classification.flags.emergingTerms || [];

      await client.query(updateQuery, [
        classification.primary,
        JSON.stringify(secondaryCategories),
        classification.confidence,
        JSON.stringify(classification.reasoning),
        isAmbiguous,
        JSON.stringify(emergingTerms),
        jobId
      ]);

      // Log classification
      const logQuery = `
        INSERT INTO classification_log 
        (job_id, classification_type, primary_category, secondary_categories, confidence, reasoning, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `;

      await client.query(logQuery, [
        jobId,
        type,
        classification.primary,
        JSON.stringify(secondaryCategories),
        classification.confidence,
        JSON.stringify(classification.reasoning)
      ]);

      await client.query('COMMIT');

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Map database row to JobData object
   */
  private mapRowToJob(row: any): JobData {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      job_labels: row.job_labels || '',
      short_agency: row.short_agency,
      long_agency: row.long_agency,
      duty_station: row.duty_station,
      duty_country: row.duty_country,
      duty_continent: row.duty_continent,
      country_code: row.country_code,
      eligible_nationality: row.eligible_nationality,
      hs_min_exp: row.hs_min_exp,
      bachelor_min_exp: row.bachelor_min_exp,
      master_min_exp: row.master_min_exp,
      up_grade: row.up_grade,
      pipeline: row.pipeline,
      department: row.department,
      posting_date: row.posting_date,
      apply_until: row.apply_until,
      url: row.url,
      languages: row.languages,
      uniquecode: row.uniquecode,
      ideal_candidate: row.ideal_candidate,
      job_labels_vectorized: row.job_labels_vectorized,
      job_candidate_vectorized: row.job_candidate_vectorized,
      created_at: row.created_at,
      updated_at: row.updated_at,
      archived: row.archived,
      sectoral_category: row.sectoral_category
    };
  }
}

export default JobService;









