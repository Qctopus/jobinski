/**
 * Hiring Surge Detection Service
 * 
 * Identifies sudden spikes in hiring that may signal:
 * - New donor funding
 * - Programme launches
 * - Emergency responses
 * - Strategic shifts
 */

import { ProcessedJobData } from '../../types';
import { parseISO, subMonths, format, startOfMonth } from 'date-fns';

export interface HiringSurge {
  agency: string;
  category: string;
  
  // Surge metrics
  currentMonthCount: number;
  previousMonthAverage: number; // avg of prior 3-6 months
  surgeMultiplier: number; // e.g., 3.5x normal
  
  // Context
  isAnomalous: boolean; // >2x normal volume
  surgeMonth: string;
  
  // Geographic concentration (may indicate specific programme)
  topLocations: Array<{
    location: string;
    count: number;
    percentage: number;
  }>;
  
  // Grade concentration (may indicate programme type)
  gradeConcentration: {
    mostCommonGrade: string;
    concentration: number; // % in that grade
  };
  
  // Intelligence value
  potentialSignal: string;
}

export interface CategorySurge {
  category: string;
  totalSurge: number;
  agencies: Array<{
    agency: string;
    count: number;
    multiplier: number;
  }>;
  topLocations: Array<{
    location: string;
    count: number;
  }>;
}

export interface SurgeAnalysis {
  surges: HiringSurge[];
  byCategorysuges: CategorySurge[];
  systemWideTrend: {
    totalCurrentMonth: number;
    totalPreviousAverage: number;
    overallMultiplier: number;
  };
  timeframe: {
    currentMonth: string;
    comparisonPeriod: string;
  };
}

export class SurgeDetector {
  private readonly SURGE_THRESHOLD = 2.0; // 2x normal = surge
  private readonly ANOMALY_THRESHOLD = 3.0; // 3x normal = anomalous
  private readonly MIN_BASELINE_JOBS = 3; // Minimum jobs in baseline to consider

  /**
   * Detect hiring surges across all agencies and categories
   */
  detectSurges(data: ProcessedJobData[], lookbackMonths: number = 6): SurgeAnalysis {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const comparisonStart = subMonths(currentMonthStart, lookbackMonths);
    
    // Group jobs by month, agency, category
    const monthlyData = this.groupByMonthAgencyCategory(data, comparisonStart);
    
    // Current month key
    const currentMonthKey = format(currentMonthStart, 'yyyy-MM');
    
    // Calculate surges for each agency-category combination
    const surges: HiringSurge[] = [];
    
    for (const [agencyCategoryKey, monthlyJobs] of monthlyData.entries()) {
      const [agency, category] = agencyCategoryKey.split('|||');
      
      // Get current month count
      const currentMonthJobs = monthlyJobs.filter(job => {
        try {
          return format(parseISO(job.posting_date), 'yyyy-MM') === currentMonthKey;
        } catch { return false; }
      });
      const currentCount = currentMonthJobs.length;
      
      if (currentCount < 3) continue; // Skip if not enough current activity
      
      // Calculate baseline (previous months average)
      const previousMonths = new Map<string, number>();
      monthlyJobs.forEach(job => {
        try {
          const monthKey = format(parseISO(job.posting_date), 'yyyy-MM');
          if (monthKey !== currentMonthKey) {
            previousMonths.set(monthKey, (previousMonths.get(monthKey) || 0) + 1);
          }
        } catch { /* skip */ }
      });
      
      if (previousMonths.size < 2) continue; // Need at least 2 months baseline
      
      const previousAvg = Array.from(previousMonths.values()).reduce((a, b) => a + b, 0) / previousMonths.size;
      
      if (previousAvg < this.MIN_BASELINE_JOBS) continue; // Skip if baseline too low
      
      const multiplier = currentCount / previousAvg;
      
      if (multiplier >= this.SURGE_THRESHOLD) {
        // Calculate geographic concentration
        const locationCounts = new Map<string, number>();
        currentMonthJobs.forEach(job => {
          const location = job.duty_country || job.duty_station || 'Unknown';
          locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
        });
        
        const topLocations = Array.from(locationCounts.entries())
          .map(([location, count]) => ({
            location,
            count,
            percentage: (count / currentCount) * 100
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 3);
        
        // Calculate grade concentration
        const gradeCounts = new Map<string, number>();
        currentMonthJobs.forEach(job => {
          const grade = job.up_grade || 'Unknown';
          gradeCounts.set(grade, (gradeCounts.get(grade) || 0) + 1);
        });
        
        const topGrade = Array.from(gradeCounts.entries())
          .sort((a, b) => b[1] - a[1])[0];
        
        // Generate potential signal
        const potentialSignal = this.generateSignalInterpretation(
          agency, category, multiplier, topLocations, topGrade
        );
        
        surges.push({
          agency,
          category,
          currentMonthCount: currentCount,
          previousMonthAverage: previousAvg,
          surgeMultiplier: multiplier,
          isAnomalous: multiplier >= this.ANOMALY_THRESHOLD,
          surgeMonth: currentMonthKey,
          topLocations,
          gradeConcentration: {
            mostCommonGrade: topGrade?.[0] || 'Unknown',
            concentration: topGrade ? (topGrade[1] / currentCount) * 100 : 0
          },
          potentialSignal
        });
      }
    }
    
    // Sort by multiplier (most significant first)
    surges.sort((a, b) => b.surgeMultiplier - a.surgeMultiplier);
    
    // Aggregate by category
    const categoryAggregates = this.aggregateBycategory(surges, data, currentMonthKey);
    
    // Calculate system-wide trend
    const systemTrend = this.calculateSystemTrend(data, currentMonthKey, lookbackMonths);
    
    return {
      surges: surges.slice(0, 20), // Top 20 surges
      byCategorysuges: categoryAggregates,
      systemWideTrend: systemTrend,
      timeframe: {
        currentMonth: format(currentMonthStart, 'MMMM yyyy'),
        comparisonPeriod: `${lookbackMonths} month average`
      }
    };
  }

  /**
   * Detect surges for a specific agency (what others are doing that affects you)
   */
  detectSurgesAffectingAgency(
    data: ProcessedJobData[], 
    yourAgency: string,
    lookbackMonths: number = 6
  ): {
    otherAgencySurges: HiringSurge[];
    yourSurges: HiringSurge[];
    categoriesWithCompetition: string[];
  } {
    const allSurges = this.detectSurges(data, lookbackMonths);
    
    // Get your categories
    const yourCategories = new Set(
      data
        .filter(job => (job.short_agency || job.long_agency) === yourAgency)
        .map(job => job.primary_category)
    );
    
    // Split surges
    const yourSurges = allSurges.surges.filter(s => s.agency === yourAgency);
    const otherSurges = allSurges.surges.filter(s => 
      s.agency !== yourAgency && yourCategories.has(s.category)
    );
    
    // Categories where others are surging and you operate
    const categoriesWithCompetition = [...new Set(otherSurges.map(s => s.category))];
    
    return {
      otherAgencySurges: otherSurges,
      yourSurges,
      categoriesWithCompetition
    };
  }

  private groupByMonthAgencyCategory(
    data: ProcessedJobData[], 
    startDate: Date
  ): Map<string, ProcessedJobData[]> {
    const result = new Map<string, ProcessedJobData[]>();
    
    data.forEach(job => {
      try {
        const postingDate = parseISO(job.posting_date);
        if (postingDate < startDate) return;
        
        const agency = job.short_agency || job.long_agency || 'Unknown';
        const category = job.primary_category;
        const key = `${agency}|||${category}`;
        
        if (!result.has(key)) {
          result.set(key, []);
        }
        result.get(key)!.push(job);
      } catch { /* skip */ }
    });
    
    return result;
  }

  private generateSignalInterpretation(
    agency: string,
    category: string,
    multiplier: number,
    topLocations: Array<{ location: string; count: number; percentage: number }>,
    topGrade: [string, number] | undefined
  ): string {
    const signals: string[] = [];
    
    // Intensity interpretation
    if (multiplier >= 5) {
      signals.push('Major hiring surge');
    } else if (multiplier >= 3) {
      signals.push('Significant hiring increase');
    } else {
      signals.push('Moderate hiring uptick');
    }
    
    // Geographic interpretation
    if (topLocations.length > 0 && topLocations[0].percentage > 60) {
      signals.push(`concentrated in ${topLocations[0].location} (${topLocations[0].percentage.toFixed(0)}%)`);
    } else if (topLocations.length >= 3) {
      signals.push('across multiple locations');
    }
    
    // Grade interpretation
    if (topGrade) {
      const grade = topGrade[0].toUpperCase();
      if (grade.includes('CONSULT') || grade.includes('IC')) {
        signals.push('primarily consultants');
      } else if (grade.startsWith('P3') || grade.startsWith('P4')) {
        signals.push('mid-level positions');
      } else if (grade.startsWith('P5') || grade.startsWith('D')) {
        signals.push('senior positions');
      }
    }
    
    // Potential donor signal
    if (multiplier >= 3) {
      signals.push('— may indicate new programme funding');
    }
    
    return signals.join(' ');
  }

  private aggregateBycategory(
    surges: HiringSurge[],
    data: ProcessedJobData[],
    currentMonthKey: string
  ): CategorySurge[] {
    const categoryMap = new Map<string, CategorySurge>();
    
    surges.forEach(surge => {
      if (!categoryMap.has(surge.category)) {
        categoryMap.set(surge.category, {
          category: surge.category,
          totalSurge: 0,
          agencies: [],
          topLocations: []
        });
      }
      
      const catSurge = categoryMap.get(surge.category)!;
      catSurge.totalSurge += surge.currentMonthCount;
      catSurge.agencies.push({
        agency: surge.agency,
        count: surge.currentMonthCount,
        multiplier: surge.surgeMultiplier
      });
    });
    
    // Add top locations for each category
    for (const [category, catSurge] of categoryMap.entries()) {
      const categoryJobs = data.filter(job => {
        try {
          const monthKey = format(parseISO(job.posting_date), 'yyyy-MM');
          return job.primary_category === category && monthKey === currentMonthKey;
        } catch { return false; }
      });
      
      const locationCounts = new Map<string, number>();
      categoryJobs.forEach(job => {
        const location = job.duty_country || 'Unknown';
        locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
      });
      
      catSurge.topLocations = Array.from(locationCounts.entries())
        .map(([location, count]) => ({ location, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
    }
    
    return Array.from(categoryMap.values())
      .sort((a, b) => b.totalSurge - a.totalSurge);
  }

  private calculateSystemTrend(
    data: ProcessedJobData[],
    currentMonthKey: string,
    lookbackMonths: number
  ): { totalCurrentMonth: number; totalPreviousAverage: number; overallMultiplier: number } {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    
    const currentMonthCount = data.filter(job => {
      try {
        return format(parseISO(job.posting_date), 'yyyy-MM') === currentMonthKey;
      } catch { return false; }
    }).length;
    
    const monthCounts = new Map<string, number>();
    data.forEach(job => {
      try {
        const monthKey = format(parseISO(job.posting_date), 'yyyy-MM');
        if (monthKey !== currentMonthKey) {
          const jobDate = parseISO(job.posting_date);
          if (jobDate >= subMonths(currentMonthStart, lookbackMonths)) {
            monthCounts.set(monthKey, (monthCounts.get(monthKey) || 0) + 1);
          }
        }
      } catch { /* skip */ }
    });
    
    const previousAvg = monthCounts.size > 0
      ? Array.from(monthCounts.values()).reduce((a, b) => a + b, 0) / monthCounts.size
      : 1;
    
    return {
      totalCurrentMonth: currentMonthCount,
      totalPreviousAverage: previousAvg,
      overallMultiplier: previousAvg > 0 ? currentMonthCount / previousAvg : 1
    };
  }
}

export default SurgeDetector;





