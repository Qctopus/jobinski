import pool from '../config/database';
import { neonPool } from '../config/neonDatabase';
import db, { initializeDatabase } from '../config/sqlite';
import { JobClassificationService } from './JobClassificationService';
import { getEffectiveAgency } from '../config/secretariatEntities';

interface SyncResult {
  success: boolean;
  totalJobs: number;
  processedJobs: number;
  duration: number;
  error?: string;
}

/**
 * SyncService - Bidirectional sync between databases
 * 
 * Data Flow:
 * 1. Azure PostgreSQL (source API) → Local SQLite (processing & cache)
 * 2. Local SQLite → Neon PostgreSQL (powers Vercel deployment)
 * 
 * The 'pool' connects to Azure (or primary source database)
 * The 'neonPool' connects to Neon (production database for Vercel)
 */
export class SyncService {
  private classifier: JobClassificationService;

  constructor() {
    this.classifier = new JobClassificationService();
  }

  /**
   * Full sync from PostgreSQL to SQLite
   */
  async fullSync(): Promise<SyncResult> {
    const startTime = Date.now();
    console.log('🔄 Starting full sync from PostgreSQL...');

    try {
      // Initialize SQLite if needed
      initializeDatabase();

      // Update sync status
      db.prepare('UPDATE sync_metadata SET status = ?, last_sync_at = ? WHERE id = 1')
        .run('syncing', new Date().toISOString());

      // Fetch all jobs from PostgreSQL - deduplicate by URL, keeping the most recent (highest ID)
      console.log('📥 Fetching jobs from PostgreSQL (with deduplication)...');
      const result = await pool.query(`
        SELECT DISTINCT ON (COALESCE(url, id::text)) *
        FROM jobs
        ORDER BY COALESCE(url, id::text), id DESC
      `);
      const jobs = result.rows;
      console.log(`📊 Fetched ${jobs.length} unique jobs from PostgreSQL (deduplicated by URL)`);

      // Clear existing data and insert fresh
      console.log('🗑️ Clearing local cache...');
      db.exec('DELETE FROM jobs');

      // Prepare insert statement
      const insertStmt = db.prepare(`
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

      // Process jobs in batches
      console.log('⚙️ Processing and inserting jobs...');
      const BATCH_SIZE = 500;
      let processedCount = 0;

      // Helper to sanitize values for SQLite
      const sanitize = (val: any): string | number | null => {
        if (val === undefined || val === null) return null;
        if (typeof val === 'boolean') return val ? 1 : 0;
        if (typeof val === 'number') return isNaN(val) ? null : val;
        if (typeof val === 'string') return val;
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val);
      };

      // Use transaction for faster inserts
      const insertMany = db.transaction((jobsBatch: any[]) => {
        for (const job of jobsBatch) {
          const processed = this.processJob(job);
          insertStmt.run(
            sanitize(processed.id),
            sanitize(processed.title) || '',
            sanitize(processed.description) || '',
            sanitize(processed.job_labels) || '',
            sanitize(processed.short_agency) || '',
            sanitize(processed.long_agency) || '',
            sanitize(processed.duty_station) || '',
            sanitize(processed.duty_country) || '',
            sanitize(processed.duty_continent) || '',
            sanitize(processed.country_code) || '',
            sanitize(processed.eligible_nationality) || '',
            sanitize(processed.hs_min_exp),
            sanitize(processed.bachelor_min_exp),
            sanitize(processed.master_min_exp),
            sanitize(processed.up_grade) || '',
            sanitize(processed.pipeline) || '',
            sanitize(processed.department) || '',
            sanitize(processed.posting_date) || '',
            sanitize(processed.apply_until) || '',
            sanitize(processed.url) || '',
            sanitize(processed.languages) || '',
            sanitize(processed.uniquecode) || '',
            sanitize(processed.ideal_candidate) || '',
            sanitize(processed.sectoral_category) || '',
            processed.archived ? 1 : 0,
            sanitize(processed.created_at) || '',
            sanitize(processed.updated_at) || '',
            sanitize(processed.primary_category) || '',
            JSON.stringify(processed.secondary_categories || []),
            sanitize(processed.classification_confidence),
            JSON.stringify(processed.classification_reasoning || []),
            sanitize(processed.seniority_level) || '',
            sanitize(processed.location_type) || '',
            JSON.stringify(processed.skill_domains || []),
            sanitize(processed.status) || '',
            processed.is_active ? 1 : 0,
            processed.is_expired ? 1 : 0,
            sanitize(processed.days_remaining) || 0,
            sanitize(processed.urgency) || '',
            sanitize(processed.application_window_days) || 0,
            sanitize(processed.formatted_posting_date) || '',
            sanitize(processed.formatted_apply_until) || '',
            new Date().toISOString()
          );
        }
      });

      // Process in batches
      for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
        const batch = jobs.slice(i, i + BATCH_SIZE);
        insertMany(batch);
        processedCount += batch.length;
        console.log(`  Processed ${processedCount}/${jobs.length} jobs...`);
      }

      // Pre-compute and cache analytics
      console.log('📊 Pre-computing analytics...');
      await this.precomputeAnalytics();

      const duration = Date.now() - startTime;

      // Update sync metadata
      db.prepare('UPDATE sync_metadata SET status = ?, last_sync_at = ?, total_jobs = ?, sync_duration_ms = ? WHERE id = 1')
        .run('completed', new Date().toISOString(), processedCount, duration);

      console.log(`✅ Sync completed: ${processedCount} jobs in ${duration}ms`);

      return {
        success: true,
        totalJobs: jobs.length,
        processedJobs: processedCount,
        duration
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('❌ Sync failed:', error);

      db.prepare('UPDATE sync_metadata SET status = ? WHERE id = 1')
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

  /**
   * Sync all data to Neon PostgreSQL (production database for Vercel)
   * This pushes the processed/classified jobs from local SQLite to Neon
   */
  /**
   * Sync all data to Neon PostgreSQL (production database for Vercel)
   * This pushes the processed/classified jobs from local SQLite to Neon
   * Uses bulk UPSERT for better performance
   */
  async syncToNeon(): Promise<{ success: boolean; updated: number; inserted: number; error?: string }> {
    if (!neonPool) {
      console.log('⚠️ Neon database not configured - skipping Neon sync');
      console.log('   Set NEON_DATABASE_URL in .env to enable Neon sync');
      return { success: true, updated: 0, inserted: 0 };
    }

    console.log('🔄 Syncing data to Neon PostgreSQL (Vercel production)...');

    try {
      // Get ALL jobs from SQLite - sync everything regardless of classification status
      const jobs = db.prepare(`
        SELECT * FROM jobs
      `).all() as any[];

      console.log(`📊 Found ${jobs.length} jobs to sync to Neon`);

      if (jobs.length === 0) {
        return { success: true, updated: 0, inserted: 0 };
      }

      let processedCount = 0;
      // Increased batch size because we're doing bulk inserts now
      // Postgres param limit is 65535. With ~22 params per row, we can safely do ~2000 rows.
      // Keeping it at 500 to be safe and responsive.
      const BATCH_SIZE = 500;

      for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
        const batch = jobs.slice(i, i + BATCH_SIZE);

        // Construct bulk query
        const values: any[] = [];
        const placeholders: string[] = [];

        batch.forEach((job, index) => {
          const offset = index * 20; // 20 parameters per row
          placeholders.push(`(
            $${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6},
            $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12},
            $${offset + 13}, $${offset + 14}, $${offset + 15}, $${offset + 16}, $${offset + 17}, $${offset + 18},
            $${offset + 19}, $${offset + 20}, NOW()
          )`);

          values.push(
            job.id,
            job.title || '',
            job.description || '',
            job.job_labels || '',
            job.short_agency || '',
            job.long_agency || '',
            job.duty_station || '',
            job.duty_country || '',
            job.duty_continent || '',
            job.country_code || '',
            job.up_grade || '',
            job.pipeline || '',
            job.department || '',
            job.posting_date,
            job.apply_until,
            job.url || '',
            job.languages || '',
            job.uniquecode || '',
            job.primary_category, // sectoral_category
            job.archived ? 1 : 0,
            // created_at is NOW() in SQL
          );
        });

        const query = `
          INSERT INTO jobs (
            id, title, description, job_labels, short_agency, long_agency,
            duty_station, duty_country, duty_continent, country_code,
            up_grade, pipeline, department, posting_date, apply_until,
            url, languages, uniquecode, sectoral_category, archived,
            updated_at
          ) VALUES ${placeholders.join(', ')}
          ON CONFLICT (id) DO UPDATE SET
            sectoral_category = EXCLUDED.sectoral_category,
            archived = EXCLUDED.archived,
            updated_at = NOW()
        `;

        try {
          await neonPool.query(query, values);
          processedCount += batch.length;

          if (processedCount % 1000 === 0 || processedCount >= jobs.length) {
            console.log(`📤 Synced ${Math.min(processedCount, jobs.length)}/${jobs.length} jobs to Neon`);
          }
        } catch (e: any) {
          console.error(`❌ Failed to sync batch ${i} to ${i + BATCH_SIZE}:`, e.message);
          // If batch fails, we could fallback to individual processing or just log.
          // For now, logging error.
        }
      }

      console.log(`✅ Neon sync complete: ${processedCount} jobs processed`);
      return { success: true, updated: processedCount, inserted: 0 }; // Cannot distinguish upsert counts easily in bulk

    } catch (error) {
      console.error('❌ Failed to sync to Neon:', error);
      return {
        success: false,
        updated: 0,
        inserted: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Full bidirectional sync:
   * 1. Azure PostgreSQL (source) → Local SQLite (with processing/classification)
   * 2. Local SQLite → Neon PostgreSQL (production for Vercel)
   */
  async fullBidirectionalSync(): Promise<SyncResult & { neonUpdated?: number; neonInserted?: number }> {
    console.log('═'.repeat(60));
    console.log('🔄 Starting bidirectional sync...');
    console.log('   Step 1: Azure → Local SQLite');
    console.log('   Step 2: Local SQLite → Neon (Vercel production)');
    console.log('═'.repeat(60));

    // Step 1: Pull from Azure (source) to local SQLite
    const syncResult = await this.fullSync();

    if (!syncResult.success) {
      console.error('❌ Azure sync failed - aborting Neon sync');
      return syncResult;
    }

    console.log('');
    console.log('─'.repeat(60));

    // Step 2: Push from local SQLite to Neon (for Vercel)
    const neonResult = await this.syncToNeon();

    console.log('═'.repeat(60));
    console.log('✅ Bidirectional sync complete!');
    console.log(`   Azure → SQLite: ${syncResult.processedJobs} jobs`);
    console.log(`   SQLite → Neon: ${neonResult.updated} updated, ${neonResult.inserted} inserted`);
    console.log('═'.repeat(60));

    return {
      ...syncResult,
      neonUpdated: neonResult.updated,
      neonInserted: neonResult.inserted
    };
  }

  /**
   * Process a single job - classify and compute derived fields
   */
  private processJob(job: any): any {
    // Parse dates
    const postingDate = this.parseDate(job.posting_date);
    const applyUntil = this.parseDate(job.apply_until);
    const now = new Date();

    // Calculate status fields
    const daysRemaining = applyUntil
      ? Math.ceil((applyUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // archived can be boolean, number (0/1), or string ('0'/'1') due to Postgres bigint
    const isArchived = job.archived === true || job.archived === 'true' || job.archived === 1 || job.archived === '1';
    const isExpired = isArchived || daysRemaining < 0;
    const isActive = !isExpired && daysRemaining >= 0;

    let status: string;
    if (isArchived) status = 'archived';
    else if (daysRemaining < 0) status = 'expired';
    else if (daysRemaining <= 3) status = 'closing_soon';
    else status = 'active';

    const urgency = daysRemaining < 7 ? 'urgent' : daysRemaining <= 30 ? 'normal' : 'extended';

    // Calculate application window
    const applicationWindowDays = postingDate && applyUntil
      ? Math.ceil((applyUntil.getTime() - postingDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Classify the job
    const classification = this.classifier.classifyJob({
      title: job.title || '',
      description: job.description || '',
      job_labels: job.job_labels || '',
      up_grade: job.up_grade || ''
    });

    // Determine seniority level
    const seniorityLevel = this.classifier.getSeniorityLevel(job.up_grade || '', job.title || '');

    // Determine location type
    const locationType = this.getLocationType(job.duty_country || '', job.duty_station || '');

    // Extract skill domains
    const skillDomains = this.extractSkillDomains(job.job_labels || '');

    // Apply Secretariat breakdown - offices like OCHA, OHCHR become separate entities
    const effectiveAgency = getEffectiveAgency(job.short_agency || '', job.department || '');

    return {
      ...job,
      archived: isArchived,  // Override with properly parsed boolean (fixes bigint string issue)
      short_agency: effectiveAgency,  // Override with effective agency (may be OCHA, OHCHR, etc.)
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

  /**
   * Pre-compute analytics and cache them
   */
  private async precomputeAnalytics(): Promise<void> {
    const cacheAnalytics = (key: string, data: any) => {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO analytics_cache (cache_key, data, created_at, expires_at)
        VALUES (?, ?, ?, ?)
      `);
      const now = new Date();
      const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
      stmt.run(key, JSON.stringify(data), now.toISOString(), expires.toISOString());
    };

    // 1. Overview metrics
    console.log('  Computing overview metrics...');
    const overviewMetrics = this.computeOverviewMetrics();
    cacheAnalytics('dashboard:overview', overviewMetrics);

    // 2. Category analytics
    console.log('  Computing category analytics...');
    const categoryAnalytics = this.computeCategoryAnalytics();
    cacheAnalytics('dashboard:categories', categoryAnalytics);

    // 3. Agency analytics
    console.log('  Computing agency analytics...');
    const agencyAnalytics = this.computeAgencyAnalytics();
    cacheAnalytics('dashboard:agencies', agencyAnalytics);

    // 4. Temporal trends
    console.log('  Computing temporal trends...');
    const temporalTrends = this.computeTemporalTrends();
    cacheAnalytics('dashboard:temporal', temporalTrends);

    // 5. Workforce composition
    console.log('  Computing workforce analytics...');
    const workforceAnalytics = this.computeWorkforceAnalytics();
    cacheAnalytics('dashboard:workforce', workforceAnalytics);

    // 6. Skills analytics
    console.log('  Computing skills analytics...');
    const skillsAnalytics = this.computeSkillsAnalytics();
    cacheAnalytics('dashboard:skills', skillsAnalytics);

    // 7. Competitive intelligence
    console.log('  Computing competitive intelligence...');
    const competitiveIntel = this.computeCompetitiveIntelligence();
    cacheAnalytics('dashboard:competitive', competitiveIntel);

    console.log('  ✅ All analytics cached');
  }

  // ============ ANALYTICS COMPUTATION METHODS ============

  private computeOverviewMetrics(): any {
    const stats = db.prepare(`
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
    `).get() as any;

    // Top categories
    const topCategories = db.prepare(`
      SELECT primary_category, COUNT(*) as count
      FROM jobs
      WHERE primary_category IS NOT NULL
      GROUP BY primary_category
      ORDER BY count DESC
      LIMIT 10
    `).all() as any[];

    const totalWithCategory = topCategories.reduce((sum, c) => sum + c.count, 0);
    const topCategoriesWithPercentage = topCategories.map(c => ({
      category: c.primary_category,
      count: c.count,
      percentage: totalWithCategory > 0 ? (c.count / totalWithCategory) * 100 : 0
    }));

    // Top agencies
    const topAgencies = db.prepare(`
      SELECT short_agency as agency, COUNT(*) as count
      FROM jobs
      WHERE short_agency IS NOT NULL AND short_agency != ''
      GROUP BY short_agency
      ORDER BY count DESC
      LIMIT 10
    `).all() as any[];

    // Monthly trends (last 6 months)
    const monthlyTrends = db.prepare(`
      SELECT 
        strftime('%Y-%m', posting_date) as month,
        COUNT(*) as count
      FROM jobs
      WHERE posting_date >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', posting_date)
      ORDER BY month
    `).all() as any[];

    // Calculate month-over-month growth
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

  private computeCategoryAnalytics(): any {
    // Category distribution with details
    const categories = db.prepare(`
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
    `).all() as any[];

    const totalJobs = categories.reduce((sum, c) => sum + c.total, 0);

    // Category by seniority
    const categoryBySeniority = db.prepare(`
      SELECT 
        primary_category,
        seniority_level,
        COUNT(*) as count
      FROM jobs
      WHERE primary_category IS NOT NULL AND seniority_level IS NOT NULL
      GROUP BY primary_category, seniority_level
    `).all() as any[];

    // Category trends (last 6 months)
    const categoryTrends = db.prepare(`
      SELECT 
        primary_category,
        strftime('%Y-%m', posting_date) as month,
        COUNT(*) as count
      FROM jobs
      WHERE posting_date >= date('now', '-6 months') AND primary_category IS NOT NULL
      GROUP BY primary_category, strftime('%Y-%m', posting_date)
      ORDER BY primary_category, month
    `).all() as any[];

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

  private computeAgencyAnalytics(): any {
    // Agency breakdown
    const agencies = db.prepare(`
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
    `).all() as any[];

    const totalJobs = agencies.reduce((sum, a) => sum + a.total_jobs, 0);

    // Agency by category
    const agencyByCategory = db.prepare(`
      SELECT 
        short_agency as agency,
        primary_category,
        COUNT(*) as count
      FROM jobs
      WHERE short_agency IS NOT NULL AND primary_category IS NOT NULL
      GROUP BY short_agency, primary_category
    `).all() as any[];

    // Agency trends
    const agencyTrends = db.prepare(`
      SELECT 
        short_agency as agency,
        strftime('%Y-%m', posting_date) as month,
        COUNT(*) as count
      FROM jobs
      WHERE posting_date >= date('now', '-6 months') AND short_agency IS NOT NULL
      GROUP BY short_agency, strftime('%Y-%m', posting_date)
      ORDER BY agency, month
    `).all() as any[];

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

  private computeTemporalTrends(): any {
    // Monthly posting trends
    const monthlyPostings = db.prepare(`
      SELECT 
        strftime('%Y-%m', posting_date) as month,
        COUNT(*) as total,
        COUNT(DISTINCT short_agency) as agencies,
        COUNT(DISTINCT primary_category) as categories
      FROM jobs
      WHERE posting_date >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', posting_date)
      ORDER BY month
    `).all() as any[];

    // Seasonal patterns (by month name)
    const seasonalPatterns = db.prepare(`
      SELECT 
        strftime('%m', posting_date) as month_num,
        COUNT(*) as count
      FROM jobs
      GROUP BY strftime('%m', posting_date)
      ORDER BY month_num
    `).all() as any[];

    // Category trends over time
    const categoryTimeSeries = db.prepare(`
      SELECT 
        strftime('%Y-%m', posting_date) as month,
        primary_category,
        COUNT(*) as count
      FROM jobs
      WHERE posting_date >= date('now', '-12 months') AND primary_category IS NOT NULL
      GROUP BY strftime('%Y-%m', posting_date), primary_category
      ORDER BY month
    `).all() as any[];

    // Agency time series
    const agencyTimeSeries = db.prepare(`
      SELECT 
        strftime('%Y-%m', posting_date) as month,
        short_agency as agency,
        COUNT(*) as count
      FROM jobs
      WHERE posting_date >= date('now', '-12 months') AND short_agency IS NOT NULL
      GROUP BY strftime('%Y-%m', posting_date), short_agency
      ORDER BY month
    `).all() as any[];

    return {
      monthlyPostings,
      seasonalPatterns,
      categoryTimeSeries,
      agencyTimeSeries
    };
  }

  private computeWorkforceAnalytics(): any {
    // Grade distribution
    const gradeDistribution = db.prepare(`
      SELECT up_grade, COUNT(*) as count
      FROM jobs
      WHERE up_grade IS NOT NULL AND up_grade != ''
      GROUP BY up_grade
      ORDER BY count DESC
    `).all() as any[];

    // Seniority distribution
    const seniorityDistribution = db.prepare(`
      SELECT seniority_level, COUNT(*) as count
      FROM jobs
      WHERE seniority_level IS NOT NULL
      GROUP BY seniority_level
      ORDER BY count DESC
    `).all() as any[];

    // Location type distribution
    const locationTypeDistribution = db.prepare(`
      SELECT location_type, COUNT(*) as count
      FROM jobs
      WHERE location_type IS NOT NULL
      GROUP BY location_type
      ORDER BY count DESC
    `).all() as any[];

    // Geographic distribution
    const countryDistribution = db.prepare(`
      SELECT duty_country, COUNT(*) as count
      FROM jobs
      WHERE duty_country IS NOT NULL AND duty_country != ''
      GROUP BY duty_country
      ORDER BY count DESC
      LIMIT 20
    `).all() as any[];

    // Experience requirements
    const experienceStats = db.prepare(`
      SELECT 
        AVG(bachelor_min_exp) as avg_bachelor_exp,
        AVG(master_min_exp) as avg_master_exp,
        MIN(bachelor_min_exp) as min_bachelor_exp,
        MAX(bachelor_min_exp) as max_bachelor_exp
      FROM jobs
      WHERE bachelor_min_exp IS NOT NULL
    `).get() as any;

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

  private computeSkillsAnalytics(): any {
    // Get all job labels and parse skills
    const jobs = db.prepare(`
      SELECT job_labels FROM jobs WHERE job_labels IS NOT NULL AND job_labels != ''
    `).all() as any[];

    const skillFrequency = new Map<string, number>();

    jobs.forEach(job => {
      const skills = (job.job_labels || '').split(',').map((s: string) => s.trim()).filter((s: string) => s);
      skills.forEach((skill: string) => {
        skillFrequency.set(skill, (skillFrequency.get(skill) || 0) + 1);
      });
    });

    const topSkills = Array.from(skillFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([skill, count]) => ({ skill, count }));

    // Skills by category
    const skillsByCategory = db.prepare(`
      SELECT primary_category, job_labels
      FROM jobs
      WHERE primary_category IS NOT NULL AND job_labels IS NOT NULL
    `).all() as any[];

    const categorySkillMap = new Map<string, Map<string, number>>();

    skillsByCategory.forEach(job => {
      if (!categorySkillMap.has(job.primary_category)) {
        categorySkillMap.set(job.primary_category, new Map());
      }
      const catSkills = categorySkillMap.get(job.primary_category)!;
      const skills = (job.job_labels || '').split(',').map((s: string) => s.trim()).filter((s: string) => s);
      skills.forEach((skill: string) => {
        catSkills.set(skill, (catSkills.get(skill) || 0) + 1);
      });
    });

    const topSkillsByCategory: any[] = [];
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

  private computeCompetitiveIntelligence(): any {
    // Market positioning
    const agencyPositioning = db.prepare(`
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
    `).all() as any[];

    const totalVolume = agencyPositioning.reduce((sum, a) => sum + a.volume, 0);

    // Category dominance
    const categoryDominance = db.prepare(`
      SELECT 
        primary_category,
        short_agency as agency,
        COUNT(*) as count
      FROM jobs
      WHERE primary_category IS NOT NULL AND short_agency IS NOT NULL
      GROUP BY primary_category, short_agency
    `).all() as any[];

    // Find leading agency per category
    const categoryLeaders: any[] = [];
    const categoryAgencyMap = new Map<string, { agency: string; count: number }[]>();

    categoryDominance.forEach(row => {
      if (!categoryAgencyMap.has(row.primary_category)) {
        categoryAgencyMap.set(row.primary_category, []);
      }
      categoryAgencyMap.get(row.primary_category)!.push({ agency: row.agency, count: row.count });
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

  private calculateMarketConcentration(agencies: any[], total: number): any {
    if (total === 0) return { herfindahlIndex: 0, top3Share: 0, top5Share: 0 };

    const shares = agencies.map(a => (a.volume / total) * 100);
    const herfindahlIndex = shares.reduce((sum, s) => sum + (s * s), 0) / 10000;

    return {
      herfindahlIndex: Math.round(herfindahlIndex * 1000) / 1000,
      top3Share: shares.slice(0, 3).reduce((sum, s) => sum + s, 0),
      top5Share: shares.slice(0, 5).reduce((sum, s) => sum + s, 0),
      top10Share: shares.slice(0, 10).reduce((sum, s) => sum + s, 0)
    };
  }

  // ============ HELPER METHODS ============

  private parseDate(dateStr: string): Date | null {
    if (!dateStr || dateStr === 'N/A') return null;
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0] || '';
  }

  private getLocationType(country: string, station: string): string {
    const hqCountries = ['United States', 'Switzerland', 'Austria', 'Italy', 'France', 'Belgium', 'Netherlands', 'Kenya', 'Thailand'];
    const stationLower = (station || '').toLowerCase();

    if (stationLower.includes('home') || stationLower.includes('remote')) return 'Remote';
    if (hqCountries.some(c => country?.includes(c))) return 'HQ';
    return 'Field';
  }

  private extractSkillDomains(labels: string): string[] {
    const domains: string[] = [];
    const labelsLower = labels.toLowerCase();

    const domainKeywords: Record<string, string[]> = {
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

  /**
   * Get sync status
   */
  getSyncStatus(): any {
    return db.prepare('SELECT * FROM sync_metadata WHERE id = 1').get();
  }
}

export default SyncService;

