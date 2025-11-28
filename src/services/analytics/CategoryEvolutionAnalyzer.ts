import { ProcessedJobData } from '../../types';
import { TemporalAnalyzer } from './TemporalAnalyzer';

/**
 * Category Evolution Timeline
 * Phase 2 Tab 2 implementation
 */
export interface CategoryEvolution {
  category: string;
  timeline: Array<{
    period: string;
    job_count: number;
    market_share: number;
    trend: 'growing' | 'stable' | 'declining';
  }>;
  strategic_status: 'emerging' | 'core' | 'mature' | 'declining';
  competitive_intensity: 'low' | 'medium' | 'high';
}

/**
 * Category Performance Metrics
 */
export interface CategoryPerformance {
  category: string;
  
  // Volume Metrics
  current_open: number;
  avg_monthly_postings: number;
  growth_rate_3m: number;
  growth_rate_12m: number;
  
  // Competition Metrics
  agencies_competing: number;
  market_leader: string;
  your_market_share: number;
  
  // Timing Metrics
  avg_application_window: number;
  urgency_rate: number;  // % of jobs with < 14 days
  
  // Strategic Classification
  strategic_priority: 'must_win' | 'selective' | 'maintenance' | 'exit';
}

/**
 * BCG Matrix positioning
 */
export interface CategoryMatrix {
  // High Growth + High Share = STARS
  stars: CategoryPerformance[];
  
  // High Growth + Low Share = QUESTION MARKS
  question_marks: CategoryPerformance[];
  
  // Low Growth + High Share = CASH COWS
  cash_cows: CategoryPerformance[];
  
  // Low Growth + Low Share = DOGS
  dogs: CategoryPerformance[];
}

/**
 * Category Evolution Analyzer
 * Analyzes how categories have evolved over time
 */
export class CategoryEvolutionAnalyzer {
  private temporalAnalyzer: TemporalAnalyzer;
  
  constructor() {
    this.temporalAnalyzer = new TemporalAnalyzer();
  }
  
  /**
   * Calculate evolution timeline for all categories
   */
  calculateCategoryEvolution(
    jobs: ProcessedJobData[],
    periodType: 'month' | 'quarter' = 'month'
  ): CategoryEvolution[] {
    const categories = this.getUniqueCategories(jobs);
    const snapshots = this.temporalAnalyzer.getTemporalSnapshots(jobs, periodType);
    
    return categories.map(category => {
      const categoryJobs = jobs.filter(j => j.primary_category === category);
      
      // Build timeline
      const timeline = snapshots.map((snapshot, index) => {
        const jobsInPeriod = this.temporalAnalyzer.getJobsInPeriod(
          categoryJobs, 
          snapshot.period, 
          periodType
        );
        
        const prevSnapshot = index > 0 ? snapshots[index - 1] : null;
        const prevJobs = prevSnapshot 
          ? this.temporalAnalyzer.getJobsInPeriod(categoryJobs, prevSnapshot.period, periodType)
          : [];
        
        const jobCount = jobsInPeriod.length;
        const prevCount = prevJobs.length;
        const marketShare = snapshot.jobs_open > 0 
          ? (jobCount / snapshot.jobs_open) * 100 
          : 0;
        
        // Determine trend
        let trend: 'growing' | 'stable' | 'declining';
        if (prevCount === 0) {
          trend = 'stable';
        } else {
          const change = ((jobCount - prevCount) / prevCount) * 100;
          trend = change > 10 ? 'growing' : change < -10 ? 'declining' : 'stable';
        }
        
        return {
          period: snapshot.period,
          job_count: jobCount,
          market_share: Math.round(marketShare * 10) / 10,
          trend
        };
      });
      
      // Determine strategic status
      const strategicStatus = this.determineStrategicStatus(timeline);
      
      // Calculate competitive intensity
      const competitiveIntensity = this.calculateCompetitiveIntensity(categoryJobs, jobs);
      
      return {
        category,
        timeline,
        strategic_status: strategicStatus,
        competitive_intensity: competitiveIntensity
      };
    });
  }
  
  /**
   * Calculate performance metrics for all categories
   */
  calculateCategoryPerformance(
    jobs: ProcessedJobData[],
    selectedAgency?: string
  ): CategoryPerformance[] {
    const categories = this.getUniqueCategories(jobs);
    const now = new Date();
    
    return categories.map(category => {
      const categoryJobs = jobs.filter(j => j.primary_category === category);
      const activeJobs = categoryJobs.filter(j => j.is_active);
      
      // Calculate temporal metrics
      const last3Months = categoryJobs.filter(j => {
        const monthsAgo = this.monthsDifference(new Date(j.posting_date), now);
        return monthsAgo <= 3;
      });
      
      const last12Months = categoryJobs.filter(j => {
        const monthsAgo = this.monthsDifference(new Date(j.posting_date), now);
        return monthsAgo <= 12;
      });
      
      const prev3To6Months = categoryJobs.filter(j => {
        const monthsAgo = this.monthsDifference(new Date(j.posting_date), now);
        return monthsAgo > 3 && monthsAgo <= 6;
      });
      
      const prev12To24Months = categoryJobs.filter(j => {
        const monthsAgo = this.monthsDifference(new Date(j.posting_date), now);
        return monthsAgo > 12 && monthsAgo <= 24;
      });
      
      // Calculate growth rates
      const growth3m = prev3To6Months.length > 0
        ? ((last3Months.length - prev3To6Months.length) / prev3To6Months.length) * 100
        : 0;
      
      const growth12m = prev12To24Months.length > 0
        ? ((last12Months.length - prev12To24Months.length) / prev12To24Months.length) * 100
        : 0;
      
      // Calculate competition metrics
      const agencies = new Set(categoryJobs.map(j => j.short_agency || j.long_agency));
      const agencyCounts = this.countByAgency(categoryJobs);
      const leader = this.getMarketLeader(agencyCounts);
      
      const yourJobs = selectedAgency 
        ? categoryJobs.filter(j => 
            j.short_agency === selectedAgency || j.long_agency === selectedAgency
          )
        : [];
      
      const yourShare = categoryJobs.length > 0 
        ? (yourJobs.length / categoryJobs.length) * 100 
        : 0;
      
      // Calculate timing metrics
      const avgWindow = categoryJobs.length > 0
        ? categoryJobs.reduce((sum, j) => sum + j.application_window_days, 0) / categoryJobs.length
        : 0;
      
      const urgentJobs = categoryJobs.filter(j => j.application_window_days < 14);
      const urgencyRate = categoryJobs.length > 0 
        ? (urgentJobs.length / categoryJobs.length) * 100 
        : 0;
      
      // Determine strategic priority
      const strategicPriority = this.determineStrategicPriority(
        growth3m,
        yourShare,
        agencies.size
      );
      
      return {
        category,
        current_open: activeJobs.length,
        avg_monthly_postings: last12Months.length / 12,
        growth_rate_3m: Math.round(growth3m * 10) / 10,
        growth_rate_12m: Math.round(growth12m * 10) / 10,
        agencies_competing: agencies.size,
        market_leader: leader,
        your_market_share: Math.round(yourShare * 10) / 10,
        avg_application_window: Math.round(avgWindow),
        urgency_rate: Math.round(urgencyRate * 10) / 10,
        strategic_priority: strategicPriority
      };
    });
  }
  
  /**
   * Create BCG Matrix classification
   */
  createBCGMatrix(
    jobs: ProcessedJobData[],
    selectedAgency?: string
  ): CategoryMatrix {
    const performance = this.calculateCategoryPerformance(jobs, selectedAgency);
    
    // Calculate thresholds
    const avgGrowth = performance.reduce((sum, p) => sum + p.growth_rate_3m, 0) / performance.length;
    const avgShare = performance.reduce((sum, p) => sum + p.your_market_share, 0) / performance.length;
    
    const stars: CategoryPerformance[] = [];
    const question_marks: CategoryPerformance[] = [];
    const cash_cows: CategoryPerformance[] = [];
    const dogs: CategoryPerformance[] = [];
    
    performance.forEach(perf => {
      const highGrowth = perf.growth_rate_3m > avgGrowth;
      const highShare = perf.your_market_share > avgShare;
      
      if (highGrowth && highShare) {
        stars.push(perf);
      } else if (highGrowth && !highShare) {
        question_marks.push(perf);
      } else if (!highGrowth && highShare) {
        cash_cows.push(perf);
      } else {
        dogs.push(perf);
      }
    });
    
    return {
      stars: stars.sort((a, b) => b.growth_rate_3m - a.growth_rate_3m),
      question_marks: question_marks.sort((a, b) => b.growth_rate_3m - a.growth_rate_3m),
      cash_cows: cash_cows.sort((a, b) => b.your_market_share - a.your_market_share),
      dogs: dogs.sort((a, b) => a.growth_rate_3m - b.growth_rate_3m)
    };
  }
  
  /**
   * Helper: Get unique categories
   */
  private getUniqueCategories(jobs: ProcessedJobData[]): string[] {
    const categories = new Set(jobs.map(j => j.primary_category));
    return Array.from(categories).sort();
  }
  
  /**
   * Helper: Determine strategic status from timeline
   */
  private determineStrategicStatus(
    timeline: Array<{ job_count: number; trend: string }>
  ): 'emerging' | 'core' | 'mature' | 'declining' {
    if (timeline.length < 3) return 'emerging';
    
    const recent = timeline.slice(-3);
    const growingCount = recent.filter(t => t.trend === 'growing').length;
    const decliningCount = recent.filter(t => t.trend === 'declining').length;
    const avgVolume = recent.reduce((sum, t) => sum + t.job_count, 0) / recent.length;
    
    if (growingCount >= 2 && avgVolume < 10) return 'emerging';
    if (growingCount >= 2 && avgVolume >= 10) return 'core';
    if (decliningCount >= 2) return 'declining';
    return 'mature';
  }
  
  /**
   * Helper: Calculate competitive intensity
   */
  private calculateCompetitiveIntensity(
    categoryJobs: ProcessedJobData[],
    allJobs: ProcessedJobData[]
  ): 'low' | 'medium' | 'high' {
    const agencies = new Set(categoryJobs.map(j => j.short_agency || j.long_agency));
    const categoryShare = allJobs.length > 0 
      ? (categoryJobs.length / allJobs.length) * 100 
      : 0;
    
    // High competition = many agencies AND high market share
    if (agencies.size > 15 && categoryShare > 10) return 'high';
    if (agencies.size > 8 || categoryShare > 5) return 'medium';
    return 'low';
  }
  
  /**
   * Helper: Count jobs by agency
   */
  private countByAgency(jobs: ProcessedJobData[]): { [agency: string]: number } {
    const counts: { [agency: string]: number } = {};
    jobs.forEach(job => {
      const agency = job.short_agency || job.long_agency;
      counts[agency] = (counts[agency] || 0) + 1;
    });
    return counts;
  }
  
  /**
   * Helper: Get market leader
   */
  private getMarketLeader(agencyCounts: { [agency: string]: number }): string {
    const entries = Object.entries(agencyCounts);
    if (entries.length === 0) return 'None';
    
    return entries.reduce((max, entry) => 
      entry[1] > max[1] ? entry : max
    )[0];
  }
  
  /**
   * Helper: Determine strategic priority
   */
  private determineStrategicPriority(
    growth: number,
    marketShare: number,
    competition: number
  ): 'must_win' | 'selective' | 'maintenance' | 'exit' {
    // High growth, high competition, low share = must win
    if (growth > 20 && competition > 10 && marketShare < 10) return 'must_win';
    
    // High growth, moderate share = selective
    if (growth > 10 && marketShare > 5 && marketShare < 20) return 'selective';
    
    // Low growth, high share = maintenance
    if (growth < 5 && marketShare > 15) return 'maintenance';
    
    // Negative growth, low share = exit
    if (growth < -10 && marketShare < 5) return 'exit';
    
    return 'selective';
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




