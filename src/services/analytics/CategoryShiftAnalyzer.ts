/**
 * Category Shift Analyzer
 * 
 * Tracks how an agency's category mix is changing over time.
 * Reveals strategic pivots, funding shifts, and mandate evolution.
 */

import { ProcessedJobData } from '../../types';
import { parseISO, subMonths, format, startOfMonth } from 'date-fns';

export interface CategoryShift {
  category: string;
  
  // Current period
  currentPeriodCount: number;
  currentPeriodPercentage: number;
  
  // Previous period
  previousPeriodCount: number;
  previousPeriodPercentage: number;
  
  // Change
  absoluteChange: number;
  percentagePointChange: number; // e.g., from 12% to 18% = +6pp
  
  // Classification
  shiftType: 'major_increase' | 'moderate_increase' | 'stable' | 'moderate_decrease' | 'major_decrease';
}

export interface CategoryEvolution {
  agency: string | null; // null for market-wide
  timeframe: string;
  periodLength: number; // months
  
  shifts: CategoryShift[];
  
  // Narrative
  topGrowing: CategoryShift[];
  topDeclining: CategoryShift[];
  
  // Statistics
  totalCurrentPeriod: number;
  totalPreviousPeriod: number;
  overallGrowth: number;
  
  narrativeInsight: string;
}

export interface CategoryTimeSeriesPoint {
  period: string;
  category: string;
  count: number;
  percentage: number;
}

export interface CategoryTimeSeries {
  category: string;
  points: Array<{
    period: string;
    count: number;
    percentage: number;
  }>;
  trend: 'growing' | 'declining' | 'stable' | 'volatile';
}

export class CategoryShiftAnalyzer {
  private readonly MAJOR_SHIFT_THRESHOLD = 5; // 5pp change = major
  private readonly MODERATE_SHIFT_THRESHOLD = 2; // 2pp change = moderate

  /**
   * Analyze category shifts for an agency or the entire market
   */
  analyzeShifts(
    data: ProcessedJobData[],
    agency: string | null = null,
    periodMonths: number = 12
  ): CategoryEvolution {
    const now = new Date();
    const currentPeriodStart = subMonths(now, periodMonths);
    const previousPeriodStart = subMonths(currentPeriodStart, periodMonths);
    
    // Filter data for agency if specified
    const filteredData = agency
      ? data.filter(job => (job.short_agency || job.long_agency) === agency)
      : data;
    
    // Split into periods
    const currentPeriodJobs = filteredData.filter(job => {
      try {
        const date = parseISO(job.posting_date);
        return date >= currentPeriodStart;
      } catch { return false; }
    });
    
    const previousPeriodJobs = filteredData.filter(job => {
      try {
        const date = parseISO(job.posting_date);
        return date >= previousPeriodStart && date < currentPeriodStart;
      } catch { return false; }
    });
    
    // Count by category for each period
    const currentCounts = this.countByCategory(currentPeriodJobs);
    const previousCounts = this.countByCategory(previousPeriodJobs);
    
    const totalCurrent = currentPeriodJobs.length || 1;
    const totalPrevious = previousPeriodJobs.length || 1;
    
    // Calculate shifts for all categories
    const allCategories = new Set([...currentCounts.keys(), ...previousCounts.keys()]);
    const shifts: CategoryShift[] = [];
    
    for (const category of allCategories) {
      const currentCount = currentCounts.get(category) || 0;
      const previousCount = previousCounts.get(category) || 0;
      
      const currentPct = (currentCount / totalCurrent) * 100;
      const previousPct = (previousCount / totalPrevious) * 100;
      const ppChange = currentPct - previousPct;
      
      let shiftType: CategoryShift['shiftType'];
      if (ppChange >= this.MAJOR_SHIFT_THRESHOLD) {
        shiftType = 'major_increase';
      } else if (ppChange >= this.MODERATE_SHIFT_THRESHOLD) {
        shiftType = 'moderate_increase';
      } else if (ppChange <= -this.MAJOR_SHIFT_THRESHOLD) {
        shiftType = 'major_decrease';
      } else if (ppChange <= -this.MODERATE_SHIFT_THRESHOLD) {
        shiftType = 'moderate_decrease';
      } else {
        shiftType = 'stable';
      }
      
      shifts.push({
        category,
        currentPeriodCount: currentCount,
        currentPeriodPercentage: currentPct,
        previousPeriodCount: previousCount,
        previousPeriodPercentage: previousPct,
        absoluteChange: currentCount - previousCount,
        percentagePointChange: ppChange,
        shiftType
      });
    }
    
    // Sort by absolute percentage point change
    shifts.sort((a, b) => Math.abs(b.percentagePointChange) - Math.abs(a.percentagePointChange));
    
    // Get top growing and declining
    const topGrowing = shifts
      .filter(s => s.shiftType === 'major_increase' || s.shiftType === 'moderate_increase')
      .sort((a, b) => b.percentagePointChange - a.percentagePointChange)
      .slice(0, 5);
    
    const topDeclining = shifts
      .filter(s => s.shiftType === 'major_decrease' || s.shiftType === 'moderate_decrease')
      .sort((a, b) => a.percentagePointChange - b.percentagePointChange)
      .slice(0, 5);
    
    // Generate narrative
    const narrative = this.generateNarrative(agency, topGrowing, topDeclining, periodMonths);
    
    return {
      agency,
      timeframe: `${periodMonths} months`,
      periodLength: periodMonths,
      shifts,
      topGrowing,
      topDeclining,
      totalCurrentPeriod: currentPeriodJobs.length,
      totalPreviousPeriod: previousPeriodJobs.length,
      overallGrowth: previousPeriodJobs.length > 0
        ? ((currentPeriodJobs.length - previousPeriodJobs.length) / previousPeriodJobs.length) * 100
        : 0,
      narrativeInsight: narrative
    };
  }

  /**
   * Get time series data for category evolution visualization
   */
  getCategoryTimeSeries(
    data: ProcessedJobData[],
    agency: string | null = null,
    periodType: 'month' | 'quarter' = 'month',
    lookbackMonths: number = 12
  ): CategoryTimeSeries[] {
    const now = new Date();
    const startDate = subMonths(now, lookbackMonths);
    
    // Filter data
    const filteredData = agency
      ? data.filter(job => (job.short_agency || job.long_agency) === agency)
      : data;
    
    // Group by period and category
    const periodData = new Map<string, Map<string, number>>();
    const periodTotals = new Map<string, number>();
    
    filteredData.forEach(job => {
      try {
        const date = parseISO(job.posting_date);
        if (date < startDate) return;
        
        const period = periodType === 'month'
          ? format(startOfMonth(date), 'yyyy-MM')
          : `${date.getFullYear()}-Q${Math.ceil((date.getMonth() + 1) / 3)}`;
        
        const category = job.primary_category;
        
        if (!periodData.has(period)) {
          periodData.set(period, new Map());
        }
        
        const catMap = periodData.get(period)!;
        catMap.set(category, (catMap.get(category) || 0) + 1);
        periodTotals.set(period, (periodTotals.get(period) || 0) + 1);
      } catch { /* skip */ }
    });
    
    // Get all categories and periods
    const allCategories = new Set<string>();
    const allPeriods = Array.from(periodData.keys()).sort();
    
    periodData.forEach(catMap => {
      catMap.forEach((_, cat) => allCategories.add(cat));
    });
    
    // Build time series for each category
    const series: CategoryTimeSeries[] = [];
    
    for (const category of allCategories) {
      const points: CategoryTimeSeries['points'] = [];
      
      for (const period of allPeriods) {
        const count = periodData.get(period)?.get(category) || 0;
        const total = periodTotals.get(period) || 1;
        
        points.push({
          period,
          count,
          percentage: (count / total) * 100
        });
      }
      
      // Determine trend
      const trend = this.determineTrend(points);
      
      series.push({
        category,
        points,
        trend
      });
    }
    
    // Sort by average count (most significant categories first)
    series.sort((a, b) => {
      const avgA = a.points.reduce((sum, p) => sum + p.count, 0) / a.points.length;
      const avgB = b.points.reduce((sum, p) => sum + p.count, 0) / b.points.length;
      return avgB - avgA;
    });
    
    return series.slice(0, 10); // Top 10 categories
  }

  /**
   * Compare category mix between agency and peers/market
   */
  compareCategoryMix(
    data: ProcessedJobData[],
    agency: string,
    peerAgencies: string[]
  ): {
    yourMix: Array<{ category: string; percentage: number; count: number }>;
    peerMix: Array<{ category: string; percentage: number; count: number }>;
    marketMix: Array<{ category: string; percentage: number; count: number }>;
    deviations: Array<{
      category: string;
      yourPercentage: number;
      peerPercentage: number;
      marketPercentage: number;
      deviation: 'significantly_higher' | 'higher' | 'similar' | 'lower' | 'significantly_lower';
    }>;
  } {
    const yourJobs = data.filter(job => (job.short_agency || job.long_agency) === agency);
    const peerJobs = data.filter(job => peerAgencies.includes(job.short_agency || job.long_agency || ''));
    
    const yourCounts = this.countByCategory(yourJobs);
    const peerCounts = this.countByCategory(peerJobs);
    const marketCounts = this.countByCategory(data);
    
    const yourTotal = yourJobs.length || 1;
    const peerTotal = peerJobs.length || 1;
    const marketTotal = data.length || 1;
    
    const allCategories = new Set([...yourCounts.keys(), ...peerCounts.keys(), ...marketCounts.keys()]);
    
    const yourMix: Array<{ category: string; percentage: number; count: number }> = [];
    const peerMix: Array<{ category: string; percentage: number; count: number }> = [];
    const marketMix: Array<{ category: string; percentage: number; count: number }> = [];
    const deviations: Array<{
      category: string;
      yourPercentage: number;
      peerPercentage: number;
      marketPercentage: number;
      deviation: 'significantly_higher' | 'higher' | 'similar' | 'lower' | 'significantly_lower';
    }> = [];
    
    for (const category of allCategories) {
      const yourCount = yourCounts.get(category) || 0;
      const peerCount = peerCounts.get(category) || 0;
      const marketCount = marketCounts.get(category) || 0;
      
      const yourPct = (yourCount / yourTotal) * 100;
      const peerPct = (peerCount / peerTotal) * 100;
      const marketPct = (marketCount / marketTotal) * 100;
      
      yourMix.push({ category, percentage: yourPct, count: yourCount });
      peerMix.push({ category, percentage: peerPct, count: peerCount });
      marketMix.push({ category, percentage: marketPct, count: marketCount });
      
      // Calculate deviation from peer average
      const diff = yourPct - peerPct;
      let deviation: 'significantly_higher' | 'higher' | 'similar' | 'lower' | 'significantly_lower';
      
      if (diff > 8) deviation = 'significantly_higher';
      else if (diff > 3) deviation = 'higher';
      else if (diff < -8) deviation = 'significantly_lower';
      else if (diff < -3) deviation = 'lower';
      else deviation = 'similar';
      
      deviations.push({
        category,
        yourPercentage: yourPct,
        peerPercentage: peerPct,
        marketPercentage: marketPct,
        deviation
      });
    }
    
    // Sort by your percentage (descending)
    yourMix.sort((a, b) => b.percentage - a.percentage);
    peerMix.sort((a, b) => b.percentage - a.percentage);
    marketMix.sort((a, b) => b.percentage - a.percentage);
    deviations.sort((a, b) => Math.abs(b.yourPercentage - b.peerPercentage) - Math.abs(a.yourPercentage - a.peerPercentage));
    
    return { yourMix, peerMix, marketMix, deviations };
  }

  private countByCategory(jobs: ProcessedJobData[]): Map<string, number> {
    const counts = new Map<string, number>();
    jobs.forEach(job => {
      const category = job.primary_category;
      counts.set(category, (counts.get(category) || 0) + 1);
    });
    return counts;
  }

  private determineTrend(points: Array<{ count: number }>): 'growing' | 'declining' | 'stable' | 'volatile' {
    if (points.length < 3) return 'stable';
    
    const firstHalf = points.slice(0, Math.floor(points.length / 2));
    const secondHalf = points.slice(Math.floor(points.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, p) => sum + p.count, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, p) => sum + p.count, 0) / secondHalf.length;
    
    // Calculate volatility (standard deviation)
    const mean = points.reduce((sum, p) => sum + p.count, 0) / points.length;
    const variance = points.reduce((sum, p) => sum + Math.pow(p.count - mean, 2), 0) / points.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = mean > 0 ? stdDev / mean : 0;
    
    if (coefficientOfVariation > 0.5) return 'volatile';
    
    const change = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
    
    if (change > 15) return 'growing';
    if (change < -15) return 'declining';
    return 'stable';
  }

  private generateNarrative(
    agency: string | null,
    topGrowing: CategoryShift[],
    topDeclining: CategoryShift[],
    periodMonths: number
  ): string {
    const subject = agency || 'The UN system';
    const parts: string[] = [];
    
    if (topGrowing.length > 0 && topDeclining.length > 0) {
      const growingNames = topGrowing.slice(0, 2).map(s => s.category).join(' and ');
      const decliningNames = topDeclining.slice(0, 2).map(s => s.category).join(' and ');
      
      parts.push(`${subject}'s hiring mix has shifted over the past ${periodMonths} months:`);
      parts.push(`${growingNames} increased in share,`);
      parts.push(`while ${decliningNames} decreased.`);
      
      if (topGrowing[0].percentagePointChange > 5) {
        parts.push(`This suggests a notable strategic or programmatic pivot.`);
      }
    } else if (topGrowing.length > 0) {
      const growingNames = topGrowing.slice(0, 2).map(s => s.category).join(' and ');
      parts.push(`${subject}'s hiring has grown particularly in ${growingNames}.`);
    } else if (topDeclining.length > 0) {
      const decliningNames = topDeclining.slice(0, 2).map(s => s.category).join(' and ');
      parts.push(`${subject}'s hiring has contracted in ${decliningNames}.`);
    } else {
      parts.push(`${subject}'s category mix has remained relatively stable.`);
    }
    
    return parts.join(' ');
  }
}

export default CategoryShiftAnalyzer;

