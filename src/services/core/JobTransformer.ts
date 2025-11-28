import { JobData, ProcessedJobData } from '../../types';
import { BaseProcessor } from './BaseProcessor';
import { format } from 'date-fns';

/**
 * Handles the transformation of raw job data into processed job data.
 * Focused solely on data transformation and enrichment.
 */
export class JobTransformer extends BaseProcessor {
  /**
   * Transform an array of raw job data into processed job data
   */
  transformJobs(jobs: JobData[]): ProcessedJobData[] {
    const startTime = Date.now();
    console.log(`Starting transformation of ${jobs.length} jobs...`);
    
    // Filter valid jobs first
    const validJobs = jobs.filter(job => this.validateJobData(job));
    console.log(`${validJobs.length} valid jobs after filtering`);

    const processedJobs = validJobs.map((job, index) => {
      try {
        return this.transformSingleJob(job);
      } catch (error) {
        console.warn(`Failed to transform job ${job.id}:`, error);
        return null;
      }
    }).filter((job): job is ProcessedJobData => job !== null);

    this.logPerformance('Job Transformation', startTime, jobs.length);
    console.log(`Successfully transformed ${processedJobs.length} jobs`);
    
    return processedJobs;
  }

  /**
   * Transform a single job with all enrichments
   */
  private transformSingleJob(job: JobData): ProcessedJobData {
    // Parse dates with error handling
    const postingDate = this.parseDate(job.posting_date);
    const applyUntilDate = this.parseDate(job.apply_until);

    // Calculate derived fields
    const applicationWindow = this.calculateApplicationWindow(postingDate, applyUntilDate);
    const relevantExperience = this.extractRelevantExperience(job);
    const languageCount = this.countLanguages(job.languages);
    const isHomeBased = this.isHomeBased(job.duty_station);
    
    // Calculate status fields (Phase 1.2)
    const statusInfo = this.calculateJobStatus(applyUntilDate, job.archived || false);

    // Create base processed job
    const processedJob: ProcessedJobData = {
      ...job,
      // Basic derived fields
      application_window_days: applicationWindow,
      relevant_experience: relevantExperience,
      language_count: languageCount,
      is_home_based: isHomeBased,
      formatted_posting_date: format(postingDate, 'MMM dd, yyyy'),
      formatted_apply_until: format(applyUntilDate, 'MMM dd, yyyy'),
      
      // Status fields (Phase 1.2)
      ...statusInfo,
      
      // Time-based fields
      posting_month: format(postingDate, 'yyyy-MM'),
      posting_year: postingDate.getFullYear(),
      posting_quarter: `${postingDate.getFullYear()}-Q${Math.floor(postingDate.getMonth() / 3) + 1}`,
      
      // Placeholder fields for categorization (to be filled by specialized processors)
      primary_category: 'General',
      secondary_categories: [],
      skill_domain: 'Mixed',
      seniority_level: 'Mid',
      location_type: 'Field',
      grade_level: 'Other',
      grade_numeric: 0,
      is_consultant: false,
      
      // Enhanced classification fields (to be filled by enhanced classifier)
      classification_confidence: 50,
      is_ambiguous_category: false,
      classification_reasoning: [],
      emerging_terms_found: [],
      hybrid_category_candidate: undefined,
      geographic_region: 'Unknown',
      geographic_subregion: 'Unknown',
      is_conflict_zone: false,
      is_developing_country: true
    };

    return processedJob;
  }

  /**
   * Enrich processed jobs with additional analytics
   * This method allows other processors to add their specific enrichments
   */
  enrichJob(
    job: ProcessedJobData, 
    enrichments: Partial<ProcessedJobData>
  ): ProcessedJobData {
    return { ...job, ...enrichments };
  }

  /**
   * Batch enrich multiple jobs
   */
  batchEnrichJobs(
    jobs: ProcessedJobData[], 
    enrichmentFn: (job: ProcessedJobData) => Partial<ProcessedJobData>
  ): ProcessedJobData[] {
    const startTime = Date.now();
    
    const enrichedJobs = jobs.map(job => {
      try {
        const enrichments = enrichmentFn(job);
        return this.enrichJob(job, enrichments);
      } catch (error) {
        console.warn(`Failed to enrich job ${job.id}:`, error);
        return job; // Return original job if enrichment fails
      }
    });

    this.logPerformance('Job Enrichment', startTime, jobs.length);
    return enrichedJobs;
  }

  /**
   * Calculate job status fields based on deadline and archived status
   * Phase 1.2 implementation
   */
  private calculateJobStatus(applyUntil: Date, archived: boolean): {
    is_active: boolean;
    is_expired: boolean;
    days_remaining: number;
    status: 'active' | 'closing_soon' | 'expired' | 'archived';
    urgency: 'urgent' | 'normal' | 'extended';
  } {
    const now = new Date();
    const daysRemaining = Math.ceil((applyUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    let status: 'active' | 'closing_soon' | 'expired' | 'archived';
    if (archived) {
      status = 'archived';
    } else if (daysRemaining < 0) {
      status = 'expired';
    } else if (daysRemaining <= 3) {
      status = 'closing_soon';
    } else {
      status = 'active';
    }
    
    const urgency: 'urgent' | 'normal' | 'extended' = 
      daysRemaining < 7 ? 'urgent' :
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
}

