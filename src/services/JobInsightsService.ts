import { ProcessedJobData } from '../types';
import { JobInsights } from '../types/jobFilters';

/**
 * Job Insights Service
 * Provides contextual insights for individual jobs
 * Phase 2 Tab 7 implementation
 */
export class JobInsightsService {
  /**
   * Calculate insights for a specific job
   */
  calculateJobInsights(
    job: ProcessedJobData,
    allJobs: ProcessedJobData[]
  ): JobInsights {
    // Find similar jobs (same category, currently open)
    const similarJobs = allJobs.filter(j => 
      j.primary_category === job.primary_category &&
      j.is_active &&
      j.id !== job.id
    );
    
    // Find competing agencies in this category
    const competingAgencies = new Set(
      similarJobs.map(j => j.short_agency || j.long_agency)
    );
    
    // Calculate historical volume
    const now = new Date();
    const last3Months = allJobs.filter(j => {
      const monthsAgo = this.monthsDifference(new Date(j.posting_date), now);
      return monthsAgo <= 3;
    });
    
    const sameCategoryRecent = last3Months.filter(j => 
      j.primary_category === job.primary_category
    ).length;
    
    const sameAgencyRecent = last3Months.filter(j =>
      (j.short_agency === job.short_agency || j.long_agency === job.long_agency) &&
      j.short_agency !== ''
    ).length;
    
    // Determine category trend
    const categoryJobs = allJobs.filter(j => j.primary_category === job.primary_category);
    const categoryTrend = this.determineTrend(categoryJobs);
    
    // Determine urgency level
    const urgencyLevel: 'urgent' | 'normal' | 'extended' = 
      job.days_remaining < 7 ? 'urgent' :
      job.days_remaining <= 21 ? 'normal' :
      'extended';
    
    // Optimal application window
    const optimalWindow = job.days_remaining < 14 
      ? 'Apply immediately' 
      : 'Within first 7 days recommended';
    
    // Competitive pressure
    const competitivePressure: 'high' | 'medium' | 'low' =
      similarJobs.length > 10 ? 'high' :
      similarJobs.length > 5 ? 'medium' :
      'low';
    
    return {
      job_id: job.id,
      similar_jobs_open: similarJobs.length,
      agencies_competing: Array.from(competingAgencies).slice(0, 5),
      historical_volume: {
        same_category_3m: sameCategoryRecent,
        same_agency_3m: sameAgencyRecent
      },
      category_trend: categoryTrend,
      urgency_level: urgencyLevel,
      optimal_application_window: optimalWindow,
      competitive_pressure: competitivePressure
    };
  }
  
  /**
   * Batch calculate insights for multiple jobs
   */
  batchCalculateInsights(
    jobs: ProcessedJobData[],
    allJobs: ProcessedJobData[]
  ): Map<string, JobInsights> {
    const insightsMap = new Map<string, JobInsights>();
    
    jobs.forEach(job => {
      const insights = this.calculateJobInsights(job, allJobs);
      insightsMap.set(job.id, insights);
    });
    
    return insightsMap;
  }
  
  /**
   * Find similar jobs
   */
  findSimilarJobs(
    job: ProcessedJobData,
    allJobs: ProcessedJobData[],
    limit: number = 10
  ): ProcessedJobData[] {
    // Calculate similarity score for each job
    const scoredJobs = allJobs
      .filter(j => j.id !== job.id)
      .map(j => ({
        job: j,
        score: this.calculateSimilarityScore(job, j)
      }))
      .filter(item => item.score > 0.3) // Threshold for similarity
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    
    return scoredJobs.map(item => item.job);
  }
  
  /**
   * Calculate similarity score between two jobs
   */
  private calculateSimilarityScore(job1: ProcessedJobData, job2: ProcessedJobData): number {
    let score = 0;
    let maxScore = 0;
    
    // Category match (weight: 40%)
    maxScore += 40;
    if (job1.primary_category === job2.primary_category) {
      score += 40;
    } else if (job1.secondary_categories.some(c => c === job2.primary_category)) {
      score += 20;
    }
    
    // Seniority match (weight: 20%)
    maxScore += 20;
    if (job1.seniority_level === job2.seniority_level) {
      score += 20;
    } else if (
      (job1.seniority_level === 'Junior' && job2.seniority_level === 'Mid') ||
      (job1.seniority_level === 'Mid' && job2.seniority_level === 'Junior') ||
      (job1.seniority_level === 'Senior' && job2.seniority_level === 'Executive') ||
      (job1.seniority_level === 'Executive' && job2.seniority_level === 'Senior')
    ) {
      score += 10;
    }
    
    // Agency match (weight: 15%)
    maxScore += 15;
    if (job1.short_agency === job2.short_agency || job1.long_agency === job2.long_agency) {
      score += 15;
    }
    
    // Location type match (weight: 10%)
    maxScore += 10;
    if (job1.location_type === job2.location_type) {
      score += 10;
    }
    
    // Skill domain match (weight: 15%)
    maxScore += 15;
    if (job1.skill_domain === job2.skill_domain) {
      score += 15;
    }
    
    return score / maxScore;
  }
  
  /**
   * Determine trend for jobs
   */
  private determineTrend(jobs: ProcessedJobData[]): 'growing' | 'stable' | 'declining' {
    const now = new Date();
    
    const recent = jobs.filter(j => {
      const monthsAgo = this.monthsDifference(new Date(j.posting_date), now);
      return monthsAgo <= 3;
    }).length;
    
    const previous = jobs.filter(j => {
      const monthsAgo = this.monthsDifference(new Date(j.posting_date), now);
      return monthsAgo > 3 && monthsAgo <= 6;
    }).length;
    
    if (previous === 0) return 'stable';
    
    const change = ((recent - previous) / previous) * 100;
    
    if (change > 20) return 'growing';
    if (change < -20) return 'declining';
    return 'stable';
  }
  
  /**
   * Helper: Calculate months difference
   */
  private monthsDifference(date1: Date, date2: Date): number {
    const years = date2.getFullYear() - date1.getFullYear();
    const months = date2.getMonth() - date1.getMonth();
    return years * 12 + months;
  }
}




