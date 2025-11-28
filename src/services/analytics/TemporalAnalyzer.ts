import { ProcessedJobData } from '../../types';
import {
  calculateJobTimeline,
  calculateTemporalSnapshots,
  calculateHiringVelocity,
  detectSeasonalPatterns,
  compareTimePeriods,
  getJobsOpenInPeriod,
  TemporalSnapshot,
  SeasonalPattern,
  TimeComparison,
  JobOpenTimeline
} from '../../utils/temporalAnalysis';

/**
 * Enhanced temporal metrics for Phase 1.3
 */
export interface EnhancedTemporalMetrics {
  period: string;
  
  // Volume Metrics (NEW: Both posted AND open)
  jobs_posted_this_period: number;
  jobs_open_start_of_period: number;
  jobs_open_end_of_period: number;
  jobs_closed_this_period: number;
  net_change: number;
  
  // Market Dynamics
  market_saturation_index: number;  // open jobs / avg per month
  hiring_velocity: number;          // jobs posted per week
  closure_rate: number;             // jobs closed / jobs open
  
  // Composition Changes
  category_shifts: Array<{
    category: string;
    percentage_change: number;
  }>;
  
  seniority_mix_change: {
    junior_delta: number;
    mid_delta: number;
    senior_delta: number;
  };
  
  location_mix_change: {
    hq_delta: number;
    field_delta: number;
    remote_delta: number;
  };
}

/**
 * Temporal Analyzer Service
 * Provides comprehensive temporal analysis capabilities for the dashboard
 * Phase 1.3 implementation
 */
export class TemporalAnalyzer {
  /**
   * Calculate comprehensive temporal metrics for a dataset
   */
  calculateTemporalMetrics(
    jobs: ProcessedJobData[],
    periodType: 'month' | 'quarter' = 'month'
  ): EnhancedTemporalMetrics[] {
    const snapshots = calculateTemporalSnapshots(jobs, periodType);
    
    // Enhance snapshots with additional metrics
    const enhancedMetrics: EnhancedTemporalMetrics[] = snapshots.map((snapshot, index) => {
      const jobsInPeriod = getJobsOpenInPeriod(jobs, snapshot.period, periodType);
      const previousSnapshot = index > 0 ? snapshots[index - 1] : null;
      
      // Calculate closure rate
      const closureRate = snapshot.jobs_open > 0 
        ? (snapshot.jobs_closed / snapshot.jobs_open) * 100 
        : 0;
      
      // Calculate hiring velocity (jobs per week)
      const hiringVelocity = snapshot.jobs_posted / 4; // Approximate weeks per month
      
      // Calculate market saturation index
      const saturationIndex = snapshot.avg_jobs_per_period > 0
        ? snapshot.jobs_open / snapshot.avg_jobs_per_period
        : 1;
      
      // Calculate category shifts
      const categoryShifts = this.calculateCategoryShifts(
        previousSnapshot ? getJobsOpenInPeriod(jobs, previousSnapshot.period, periodType) : [],
        jobsInPeriod
      );
      
      // Calculate seniority mix changes
      const seniorityChange = this.calculateSeniorityShift(
        previousSnapshot ? getJobsOpenInPeriod(jobs, previousSnapshot.period, periodType) : [],
        jobsInPeriod
      );
      
      // Calculate location mix changes
      const locationChange = this.calculateLocationShift(
        previousSnapshot ? getJobsOpenInPeriod(jobs, previousSnapshot.period, periodType) : [],
        jobsInPeriod
      );
      
      return {
        period: snapshot.period,
        jobs_posted_this_period: snapshot.jobs_posted,
        jobs_open_start_of_period: previousSnapshot?.jobs_open || snapshot.jobs_open,
        jobs_open_end_of_period: snapshot.jobs_open,
        jobs_closed_this_period: snapshot.jobs_closed,
        net_change: snapshot.net_opening_change,
        market_saturation_index: Math.round(saturationIndex * 100) / 100,
        hiring_velocity: Math.round(hiringVelocity * 10) / 10,
        closure_rate: Math.round(closureRate * 10) / 10,
        category_shifts: categoryShifts,
        seniority_mix_change: seniorityChange,
        location_mix_change: locationChange
      };
    });
    
    return enhancedMetrics;
  }
  
  /**
   * Get temporal snapshots (simpler version)
   */
  getTemporalSnapshots(
    jobs: ProcessedJobData[],
    periodType: 'month' | 'quarter' = 'month'
  ): TemporalSnapshot[] {
    return calculateTemporalSnapshots(jobs, periodType);
  }
  
  /**
   * Get hiring velocity over time
   */
  getHiringVelocity(jobs: ProcessedJobData[], windowDays: number = 30) {
    return calculateHiringVelocity(jobs, windowDays);
  }
  
  /**
   * Detect seasonal patterns
   */
  getSeasonalPatterns(jobs: ProcessedJobData[]): SeasonalPattern {
    return detectSeasonalPatterns(jobs);
  }
  
  /**
   * Compare two time periods
   */
  comparePeriods(
    baselineJobs: ProcessedJobData[],
    currentJobs: ProcessedJobData[],
    baselinePeriod: string,
    currentPeriod: string
  ): TimeComparison {
    return compareTimePeriods(baselineJobs, currentJobs, baselinePeriod, currentPeriod);
  }
  
  /**
   * Get jobs that were open during a specific period
   */
  getJobsInPeriod(
    jobs: ProcessedJobData[],
    period: string,
    periodType: 'month' | 'quarter' = 'month'
  ): ProcessedJobData[] {
    return getJobsOpenInPeriod(jobs, period, periodType);
  }
  
  /**
   * Calculate job timelines for all jobs
   */
  calculateJobTimelines(jobs: ProcessedJobData[]): JobOpenTimeline[] {
    return jobs.map(calculateJobTimeline);
  }
  
  /**
   * Helper: Calculate category shifts between two periods
   */
  private calculateCategoryShifts(
    previousJobs: ProcessedJobData[],
    currentJobs: ProcessedJobData[]
  ): Array<{ category: string; percentage_change: number }> {
    if (previousJobs.length === 0) return [];
    
    const prevCategories = this.countByCategory(previousJobs);
    const currCategories = this.countByCategory(currentJobs);
    
    const allCategories = new Set([
      ...Object.keys(prevCategories),
      ...Object.keys(currCategories)
    ]);
    
    return Array.from(allCategories)
      .map(category => {
        const prevCount = prevCategories[category] || 0;
        const currCount = currCategories[category] || 0;
        const prevPercent = (prevCount / previousJobs.length) * 100;
        const currPercent = currentJobs.length > 0 ? (currCount / currentJobs.length) * 100 : 0;
        
        return {
          category,
          percentage_change: Math.round((currPercent - prevPercent) * 10) / 10
        };
      })
      .filter(shift => Math.abs(shift.percentage_change) > 0.5)
      .sort((a, b) => Math.abs(b.percentage_change) - Math.abs(a.percentage_change))
      .slice(0, 5); // Top 5 shifts
  }
  
  /**
   * Helper: Calculate seniority mix shifts
   */
  private calculateSeniorityShift(
    previousJobs: ProcessedJobData[],
    currentJobs: ProcessedJobData[]
  ): {
    junior_delta: number;
    mid_delta: number;
    senior_delta: number;
  } {
    if (previousJobs.length === 0 || currentJobs.length === 0) {
      return { junior_delta: 0, mid_delta: 0, senior_delta: 0 };
    }
    
    const prevJunior = previousJobs.filter(j => j.seniority_level === 'Junior').length / previousJobs.length;
    const currJunior = currentJobs.filter(j => j.seniority_level === 'Junior').length / currentJobs.length;
    
    const prevMid = previousJobs.filter(j => j.seniority_level === 'Mid').length / previousJobs.length;
    const currMid = currentJobs.filter(j => j.seniority_level === 'Mid').length / currentJobs.length;
    
    const prevSenior = previousJobs.filter(j => 
      j.seniority_level === 'Senior' || j.seniority_level === 'Executive'
    ).length / previousJobs.length;
    const currSenior = currentJobs.filter(j => 
      j.seniority_level === 'Senior' || j.seniority_level === 'Executive'
    ).length / currentJobs.length;
    
    return {
      junior_delta: Math.round((currJunior - prevJunior) * 1000) / 10,
      mid_delta: Math.round((currMid - prevMid) * 1000) / 10,
      senior_delta: Math.round((currSenior - prevSenior) * 1000) / 10
    };
  }
  
  /**
   * Helper: Calculate location mix shifts
   */
  private calculateLocationShift(
    previousJobs: ProcessedJobData[],
    currentJobs: ProcessedJobData[]
  ): {
    hq_delta: number;
    field_delta: number;
    remote_delta: number;
  } {
    if (previousJobs.length === 0 || currentJobs.length === 0) {
      return { hq_delta: 0, field_delta: 0, remote_delta: 0 };
    }
    
    const prevHQ = previousJobs.filter(j => j.location_type === 'Headquarters').length / previousJobs.length;
    const currHQ = currentJobs.filter(j => j.location_type === 'Headquarters').length / currentJobs.length;
    
    const prevField = previousJobs.filter(j => j.location_type === 'Field').length / previousJobs.length;
    const currField = currentJobs.filter(j => j.location_type === 'Field').length / currentJobs.length;
    
    const prevRemote = previousJobs.filter(j => j.is_home_based).length / previousJobs.length;
    const currRemote = currentJobs.filter(j => j.is_home_based).length / currentJobs.length;
    
    return {
      hq_delta: Math.round((currHQ - prevHQ) * 1000) / 10,
      field_delta: Math.round((currField - prevField) * 1000) / 10,
      remote_delta: Math.round((currRemote - prevRemote) * 1000) / 10
    };
  }
  
  /**
   * Helper: Count jobs by category
   */
  private countByCategory(jobs: ProcessedJobData[]): { [category: string]: number } {
    const counts: { [category: string]: number } = {};
    
    jobs.forEach(job => {
      const category = job.primary_category;
      counts[category] = (counts[category] || 0) + 1;
    });
    
    return counts;
  }
  
  /**
   * Get rolling average metrics
   */
  getRollingMetrics(
    jobs: ProcessedJobData[],
    windowSizeDays: number = 30
  ): Array<{
    date: string;
    rolling_avg: number;
    actual: number;
  }> {
    const snapshots = calculateTemporalSnapshots(jobs, 'month');
    
    return snapshots.map((snapshot, index) => {
      // Calculate rolling average
      const windowStart = Math.max(0, index - 2); // 3-month window
      const windowSnapshots = snapshots.slice(windowStart, index + 1);
      const avg = windowSnapshots.reduce((sum, s) => sum + s.jobs_posted, 0) / windowSnapshots.length;
      
      return {
        date: snapshot.period,
        rolling_avg: Math.round(avg * 10) / 10,
        actual: snapshot.jobs_posted
      };
    });
  }
  
  /**
   * Calculate market momentum
   * Indicates whether the market is accelerating or decelerating
   */
  calculateMarketMomentum(jobs: ProcessedJobData[]): {
    current_velocity: number;
    previous_velocity: number;
    momentum: 'accelerating' | 'steady' | 'decelerating';
    momentum_index: number;
  } {
    const snapshots = calculateTemporalSnapshots(jobs, 'month');
    
    if (snapshots.length < 2) {
      return {
        current_velocity: 0,
        previous_velocity: 0,
        momentum: 'steady',
        momentum_index: 0
      };
    }
    
    const recent = snapshots.slice(-3); // Last 3 months
    const previous = snapshots.slice(-6, -3); // Previous 3 months
    
    const currentVelocity = recent.reduce((sum, s) => sum + s.jobs_posted, 0) / recent.length;
    const previousVelocity = previous.length > 0
      ? previous.reduce((sum, s) => sum + s.jobs_posted, 0) / previous.length
      : currentVelocity;
    
    const momentumIndex = previousVelocity > 0
      ? ((currentVelocity - previousVelocity) / previousVelocity) * 100
      : 0;
    
    const momentum: 'accelerating' | 'steady' | 'decelerating' = 
      momentumIndex > 10 ? 'accelerating' :
      momentumIndex < -10 ? 'decelerating' :
      'steady';
    
    return {
      current_velocity: Math.round(currentVelocity * 10) / 10,
      previous_velocity: Math.round(previousVelocity * 10) / 10,
      momentum,
      momentum_index: Math.round(momentumIndex * 10) / 10
    };
  }
}




