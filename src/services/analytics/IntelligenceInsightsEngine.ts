/**
 * Intelligence Insights Engine
 * 
 * Generates comprehensive cross-dimensional insights for the Intelligence Tab.
 * Produces natural language narratives with supporting metrics and visualizations.
 */

import { ProcessedJobData, FilterOptions } from '../../types';
import { classifyGrade, getConsolidatedTier, GradeTier } from '../../utils/gradeClassification';
import { classifyLocation } from '../../utils/locationClassification';
import { parseISO, subWeeks, subMonths, isWithinInterval, differenceInDays, format, startOfWeek, endOfWeek } from 'date-fns';
import { getAgencyPeerGroup, getPeerAgencies, PEER_GROUPS } from '../../config/peerGroups';

// ============ TYPES ============

export type InsightSection = 'executive' | 'volume' | 'workforce' | 'geography' | 'category' | 'competitive' | 'anomaly';
export type InsightPriority = 'critical' | 'high' | 'medium' | 'low';
export type InsightType = 'trend' | 'comparison' | 'anomaly' | 'competitive' | 'pattern' | 'alert';
export type VisualizationType = 'sparkline' | 'bar' | 'comparison-bar' | 'mini-table' | 'trend-arrow' | 'stacked-bar' | 'heatmap';

export interface InsightMetric {
  label: string;
  value: number | string;
  change?: number;
  changeLabel?: string;
  format?: 'number' | 'percent' | 'days' | 'currency';
}

export interface InsightVisualization {
  type: VisualizationType;
  data: any;
  config?: {
    height?: number;
    colors?: string[];
    showLabels?: boolean;
  };
}

export interface Insight {
  id: string;
  section: InsightSection;
  priority: InsightPriority;
  type: InsightType;
  title: string;
  narrative: string;
  metrics: {
    primary: InsightMetric;
    comparisons?: InsightMetric[];
  };
  visualization?: InsightVisualization;
  metadata?: {
    confidence: number;
    dataPoints: number;
    timeRange: string;
  };
}

export interface PeriodData {
  jobs: ProcessedJobData[];
  startDate: Date;
  endDate: Date;
  label: string;
}

export interface ExecutiveSummary {
  headline: string;
  keyPoints: string[];
  volumeTrend: { current: number; previous: number; change: number };
  topShift: { area: string; description: string };
  competitorAlert?: string;
  anomalyCount: number;
}

export interface VolumeMetrics {
  totalPositions: number;
  previousPeriodPositions: number;
  volumeChange: number;
  weeklyVelocity: number;
  previousWeeklyVelocity: number;
  velocityChange: number;
  avgMonthly12mo: number;
  vs12moAvg: number;
  weeklyBreakdown: { week: string; count: number; startDate: Date }[];
  activeVsClosedRatio: { active: number; closed: number; ratio: number };
  accelerationPattern: 'accelerating' | 'decelerating' | 'steady';
  peakWeek: { week: string; count: number } | null;
}

export interface WorkforcePatternMetrics {
  staffRatio: { current: number; previous: number; market: number; change: number };
  gradeDistribution: {
    tier: string;
    current: number;
    previous: number;
    change: number;
    color: string;
  }[];
  categoryStaffPatterns: {
    category: string;
    yourStaffRatio: number;
    marketStaffRatio: number;
    topCompetitor?: { name: string; staffRatio: number };
    diff: number;
  }[];
  gradeAnomalies: { tier: string; count: number; historicalAvg: number; deviation: number }[];
  experienceRequirements: {
    category: string;
    avgExperience: number;
    marketAvg: number;
    diff: number;
  }[];
  seniorityTrend: { period: string; seniorRatio: number }[];
}

export interface GeographicMetrics {
  locationTypeDistribution: {
    type: string;
    current: number;
    previous: number;
    change: number;
    color: string;
  }[];
  fieldRatio: { current: number; previous: number; change: number };
  topLocations: {
    location: string;
    country: string;
    count: number;
    change: number;
  }[];
  newLocations: string[];
  conflictZoneHiring: {
    count: number;
    percentage: number;
    staffRatio: number;
    marketStaffRatio: number;
  };
  categoryGeographyPatterns: {
    category: string;
    yourFieldRatio: number;
    competitorFieldRatio: number;
    diff: number;
  }[];
  gradeByLocationType: {
    locationType: string;
    juniorRatio: number;
    seniorRatio: number;
  }[];
  regionBreakdown: {
    region: string;
    count: number;
    percentage: number;
    change: number;
  }[];
}

export interface CategoryMetrics {
  topCategories: {
    category: string;
    count: number;
    percentage: number;
    change: number;
    marketRank?: number;
    topCompetitor?: string;
    yourStaffRatio: number;
    competitorStaffRatio: number;
  }[];
  fastestGrowing: {
    category: string;
    growthRate: number;
    absoluteChange: number;
  }[];
  declining: {
    category: string;
    growthRate: number;
    declineRate: number;
    absoluteChange: number;
  }[];
  concentration: { herfindahl: number; top3Share: number; change: number };
  categoryExperience: {
    category: string;
    avgExperience: number;
    marketAvg: number;
  }[];
  applicationWindows: {
    category: string;
    avgWindow: number;
    marketAvg: number;
  }[];
}

export interface CompetitiveMetrics {
  marketShare: { current: number; previous: number; change: number };
  rank: { current: number; previous: number; total: number; change: number };
  peerGroupPerformance: {
    agency: string;
    volume: number;
    seniorRatio: number;
    fieldRatio: number;
    isYou: boolean;
  }[];
  competitorPatterns: {
    agency: string;
    correlation: number;
    volumeChange: number;
    keyDifference: string;
  }[];
  categoryPosition: {
    category: string;
    yourRank: number;
    yourShare: number;
    leader: string;
    leaderShare: number;
  }[];
  newCompetitorMoves: {
    agency: string;
    category: string;
    description: string;
  }[];
}

export interface AnomalySignal {
  id: string;
  type: 'volume' | 'pattern' | 'competitor' | 'cross-dimensional' | 'timing' | 'gap';
  severity: 'high' | 'medium' | 'low';
  icon: string;
  title: string;
  description: string;
  metric?: string;
  context?: string;
}

// ============ MAIN ENGINE CLASS ============

export class IntelligenceInsightsEngine {
  private currentPeriodJobs: ProcessedJobData[] = [];
  private previousPeriodJobs: ProcessedJobData[] = [];
  private allTimeJobs: ProcessedJobData[] = [];
  private avg12moJobs: ProcessedJobData[] = [];
  private filterAgency: string | null = null;
  private currentPeriod: PeriodData | null = null;
  private previousPeriod: PeriodData | null = null;
  
  /**
   * Initialize the engine with job data and time parameters
   */
  initialize(
    allJobs: ProcessedJobData[],
    timeRange: FilterOptions['timeRange'],
    filterAgency?: string
  ): void {
    const now = new Date();
    this.allTimeJobs = allJobs;
    this.filterAgency = filterAgency || null;
    
    // Calculate period boundaries based on timeRange
    const periodConfig = this.getPeriodConfig(timeRange);
    
    // Current period
    const currentEnd = now;
    const currentStart = periodConfig.getCurrentStart(now);
    
    // Previous period (same duration, immediately before)
    const previousEnd = currentStart;
    const previousStart = periodConfig.getPreviousStart(currentStart);
    
    // 12-month average baseline
    const avg12moStart = subMonths(now, 12);
    
    // Filter jobs by period
    this.currentPeriodJobs = this.filterJobsByPeriod(allJobs, currentStart, currentEnd);
    this.previousPeriodJobs = this.filterJobsByPeriod(allJobs, previousStart, previousEnd);
    this.avg12moJobs = this.filterJobsByPeriod(allJobs, avg12moStart, now);
    
    // Apply agency filter if specified
    if (filterAgency && filterAgency !== 'all') {
      this.currentPeriodJobs = this.filterByAgency(this.currentPeriodJobs, filterAgency);
      this.previousPeriodJobs = this.filterByAgency(this.previousPeriodJobs, filterAgency);
      this.avg12moJobs = this.filterByAgency(this.avg12moJobs, filterAgency);
    }
    
    // Store period data
    this.currentPeriod = {
      jobs: this.currentPeriodJobs,
      startDate: currentStart,
      endDate: currentEnd,
      label: `${format(currentStart, 'MMM d')} - ${format(currentEnd, 'MMM d, yyyy')}`
    };
    
    this.previousPeriod = {
      jobs: this.previousPeriodJobs,
      startDate: previousStart,
      endDate: previousEnd,
      label: `${format(previousStart, 'MMM d')} - ${format(previousEnd, 'MMM d')}`
    };
  }
  
  private getPeriodConfig(timeRange: FilterOptions['timeRange']) {
    switch (timeRange) {
      case '4weeks':
        return {
          getCurrentStart: (now: Date) => subWeeks(now, 4),
          getPreviousStart: (start: Date) => subWeeks(start, 4)
        };
      case '8weeks':
        return {
          getCurrentStart: (now: Date) => subWeeks(now, 8),
          getPreviousStart: (start: Date) => subWeeks(start, 8)
        };
      case '3months':
        return {
          getCurrentStart: (now: Date) => subMonths(now, 3),
          getPreviousStart: (start: Date) => subMonths(start, 3)
        };
      case '6months':
        return {
          getCurrentStart: (now: Date) => subMonths(now, 6),
          getPreviousStart: (start: Date) => subMonths(start, 6)
        };
      case '1year':
        return {
          getCurrentStart: (now: Date) => subMonths(now, 12),
          getPreviousStart: (start: Date) => subMonths(start, 12)
        };
      default:
        return {
          getCurrentStart: (now: Date) => subMonths(now, 3),
          getPreviousStart: (start: Date) => subMonths(start, 3)
        };
    }
  }
  
  private filterJobsByPeriod(jobs: ProcessedJobData[], start: Date, end: Date): ProcessedJobData[] {
    return jobs.filter(job => {
      try {
        const postDate = parseISO(job.posting_date);
        return isWithinInterval(postDate, { start, end });
      } catch {
        return false;
      }
    });
  }
  
  private filterByAgency(jobs: ProcessedJobData[], agency: string): ProcessedJobData[] {
    return jobs.filter(j => (j.short_agency || j.long_agency) === agency);
  }
  
  // ============ VOLUME & VELOCITY ============
  
  calculateVolumeMetrics(): VolumeMetrics {
    const current = this.currentPeriodJobs;
    const previous = this.previousPeriodJobs;
    
    const totalPositions = current.length;
    const previousPeriodPositions = previous.length;
    const volumeChange = previousPeriodPositions > 0 
      ? ((totalPositions - previousPeriodPositions) / previousPeriodPositions) * 100 
      : 0;
    
    // Calculate weekly velocity
    const weeks = this.currentPeriod 
      ? Math.max(1, Math.ceil(differenceInDays(this.currentPeriod.endDate, this.currentPeriod.startDate) / 7))
      : 4;
    const weeklyVelocity = totalPositions / weeks;
    
    const prevWeeks = this.previousPeriod 
      ? Math.max(1, Math.ceil(differenceInDays(this.previousPeriod.endDate, this.previousPeriod.startDate) / 7))
      : 4;
    const previousWeeklyVelocity = previousPeriodPositions / prevWeeks;
    const velocityChange = previousWeeklyVelocity > 0 
      ? ((weeklyVelocity - previousWeeklyVelocity) / previousWeeklyVelocity) * 100 
      : 0;
    
    // 12-month average
    const avg12moWeeks = 52;
    const avgMonthly12mo = this.avg12moJobs.length / 12;
    const avgWeekly12mo = this.avg12moJobs.length / avg12moWeeks;
    const vs12moAvg = avgWeekly12mo > 0 
      ? ((weeklyVelocity - avgWeekly12mo) / avgWeekly12mo) * 100 
      : 0;
    
    // Weekly breakdown
    const weeklyBreakdown = this.calculateWeeklyBreakdown(current);
    
    // Active vs closed ratio
    const active = current.filter(j => j.is_active).length;
    const closed = current.filter(j => j.is_expired || j.archived).length;
    const activeVsClosedRatio = {
      active,
      closed,
      ratio: (active + closed) > 0 ? active / (active + closed) : 0
    };
    
    // Acceleration pattern
    const firstHalfCount = weeklyBreakdown.slice(0, Math.floor(weeklyBreakdown.length / 2))
      .reduce((sum, w) => sum + w.count, 0);
    const secondHalfCount = weeklyBreakdown.slice(Math.floor(weeklyBreakdown.length / 2))
      .reduce((sum, w) => sum + w.count, 0);
    
    let accelerationPattern: 'accelerating' | 'decelerating' | 'steady' = 'steady';
    if (secondHalfCount > firstHalfCount * 1.2) {
      accelerationPattern = 'accelerating';
    } else if (secondHalfCount < firstHalfCount * 0.8) {
      accelerationPattern = 'decelerating';
    }
    
    // Peak week
    const peakWeek = weeklyBreakdown.length > 0 
      ? weeklyBreakdown.reduce((max, w) => w.count > max.count ? w : max, weeklyBreakdown[0])
      : null;
    
    return {
      totalPositions,
      previousPeriodPositions,
      volumeChange,
      weeklyVelocity,
      previousWeeklyVelocity,
      velocityChange,
      avgMonthly12mo,
      vs12moAvg,
      weeklyBreakdown,
      activeVsClosedRatio,
      accelerationPattern,
      peakWeek
    };
  }
  
  private calculateWeeklyBreakdown(jobs: ProcessedJobData[]): { week: string; count: number; startDate: Date }[] {
    if (!this.currentPeriod) return [];
    
    const weeks: Map<string, { count: number; startDate: Date }> = new Map();
    
    jobs.forEach(job => {
      try {
        const postDate = parseISO(job.posting_date);
        const weekStart = startOfWeek(postDate, { weekStartsOn: 1 });
        const weekKey = format(weekStart, 'MMM d');
        
        const existing = weeks.get(weekKey);
        if (existing) {
          existing.count++;
        } else {
          weeks.set(weekKey, { count: 1, startDate: weekStart });
        }
      } catch {
        // Skip invalid dates
      }
    });
    
    return Array.from(weeks.entries())
      .map(([week, data]) => ({ week, ...data }))
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }
  
  // ============ WORKFORCE PATTERNS ============
  
  calculateWorkforcePatterns(): WorkforcePatternMetrics {
    const current = this.currentPeriodJobs;
    const previous = this.previousPeriodJobs;
    const marketCurrent = this.filterAgency ? this.filterJobsByPeriod(this.allTimeJobs, this.currentPeriod!.startDate, this.currentPeriod!.endDate) : current;
    
    // Staff ratio
    const currentStaffRatio = this.calculateStaffRatio(current);
    const previousStaffRatio = this.calculateStaffRatio(previous);
    const marketStaffRatio = this.calculateStaffRatio(marketCurrent);
    
    // Grade distribution
    const gradeDistribution = this.calculateGradeDistribution(current, previous);
    
    // Category staff patterns
    const categoryStaffPatterns = this.calculateCategoryStaffPatterns(current, marketCurrent);
    
    // Grade anomalies (compared to historical average)
    const gradeAnomalies = this.detectGradeAnomalies(current);
    
    // Experience requirements by category
    const experienceRequirements = this.calculateExperienceRequirements(current, marketCurrent);
    
    // Seniority trend over sub-periods
    const seniorityTrend = this.calculateSeniorityTrend(current);
    
    return {
      staffRatio: {
        current: currentStaffRatio,
        previous: previousStaffRatio,
        market: marketStaffRatio,
        change: currentStaffRatio - previousStaffRatio
      },
      gradeDistribution,
      categoryStaffPatterns,
      gradeAnomalies,
      experienceRequirements,
      seniorityTrend
    };
  }
  
  private calculateStaffRatio(jobs: ProcessedJobData[]): number {
    if (jobs.length === 0) return 0;
    
    const staffCount = jobs.filter(job => {
      const analysis = classifyGrade(job.up_grade);
      return analysis.staffCategory === 'Staff';
    }).length;
    
    return (staffCount / jobs.length) * 100;
  }
  
  private calculateGradeDistribution(current: ProcessedJobData[], previous: ProcessedJobData[]): WorkforcePatternMetrics['gradeDistribution'] {
    const tiers = ['Executive', 'Director', 'Senior Professional', 'Mid Professional', 'Entry Professional', 'Support', 'Consultant', 'Intern'];
    const colors: Record<string, string> = {
      'Executive': '#7C3AED',
      'Director': '#2563EB',
      'Senior Professional': '#0891B2',
      'Mid Professional': '#059669',
      'Entry Professional': '#D97706',
      'Support': '#DC2626',
      'Consultant': '#F59E0B',
      'Intern': '#8B5CF6'
    };
    
    const countByTier = (jobs: ProcessedJobData[]): Record<string, number> => {
      const counts: Record<string, number> = {};
      tiers.forEach(t => counts[t] = 0);
      
      jobs.forEach(job => {
        const analysis = classifyGrade(job.up_grade);
        const tier = getConsolidatedTier(analysis.tier);
        if (tier in counts) {
          counts[tier]++;
        }
      });
      
      return counts;
    };
    
    const currentCounts = countByTier(current);
    const previousCounts = countByTier(previous);
    const total = current.length || 1;
    const prevTotal = previous.length || 1;
    
    return tiers.map(tier => ({
      tier,
      current: (currentCounts[tier] / total) * 100,
      previous: (previousCounts[tier] / prevTotal) * 100,
      change: ((currentCounts[tier] / total) - (previousCounts[tier] / prevTotal)) * 100,
      color: colors[tier] || '#6B7280'
    }));
  }
  
  private calculateCategoryStaffPatterns(current: ProcessedJobData[], market: ProcessedJobData[]): WorkforcePatternMetrics['categoryStaffPatterns'] {
    // Get top 5 categories
    const categoryCounts = new Map<string, number>();
    current.forEach(job => {
      const cat = job.primary_category;
      categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
    });
    
    const topCategories = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat]) => cat);
    
    return topCategories.map(category => {
      const yourJobs = current.filter(j => j.primary_category === category);
      const marketJobs = market.filter(j => j.primary_category === category);
      
      const yourStaffRatio = this.calculateStaffRatio(yourJobs);
      const marketStaffRatio = this.calculateStaffRatio(marketJobs);
      
      // Find top competitor in this category
      const competitorCounts = new Map<string, ProcessedJobData[]>();
      marketJobs.forEach(job => {
        const agency = job.short_agency || job.long_agency;
        if (agency && agency !== this.filterAgency) {
          if (!competitorCounts.has(agency)) {
            competitorCounts.set(agency, []);
          }
          competitorCounts.get(agency)!.push(job);
        }
      });
      
      let topCompetitor: { name: string; staffRatio: number } | undefined;
      const topComp = Array.from(competitorCounts.entries())
        .sort((a, b) => b[1].length - a[1].length)[0];
      
      if (topComp) {
        topCompetitor = {
          name: topComp[0],
          staffRatio: this.calculateStaffRatio(topComp[1])
        };
      }
      
      return {
        category,
        yourStaffRatio,
        marketStaffRatio,
        topCompetitor,
        diff: yourStaffRatio - marketStaffRatio
      };
    });
  }
  
  private detectGradeAnomalies(current: ProcessedJobData[]): WorkforcePatternMetrics['gradeAnomalies'] {
    const historicalAvg = this.calculateGradeDistribution(this.avg12moJobs, []);
    const currentDist = this.calculateGradeDistribution(current, []);
    
    return currentDist
      .map(curr => {
        const hist = historicalAvg.find(h => h.tier === curr.tier);
        const historicalAvgValue = hist?.current || 0;
        const deviation = historicalAvgValue > 0 
          ? (curr.current - historicalAvgValue) / Math.max(historicalAvgValue, 1)
          : 0;
        
        return {
          tier: curr.tier,
          count: Math.round(curr.current * current.length / 100),
          historicalAvg: historicalAvgValue,
          deviation
        };
      })
      .filter(a => Math.abs(a.deviation) > 0.5); // Only significant deviations
  }
  
  private calculateExperienceRequirements(current: ProcessedJobData[], market: ProcessedJobData[]): WorkforcePatternMetrics['experienceRequirements'] {
    // Get top categories
    const categoryCounts = new Map<string, number>();
    current.forEach(job => {
      const cat = job.primary_category;
      categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
    });
    
    const topCategories = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat]) => cat);
    
    return topCategories.map(category => {
      const yourJobs = current.filter(j => j.primary_category === category);
      const marketJobs = market.filter(j => j.primary_category === category);
      
      const avgExp = (jobs: ProcessedJobData[]) => {
        const withExp = jobs.filter(j => j.master_min_exp !== null || j.bachelor_min_exp !== null);
        if (withExp.length === 0) return 0;
        
        const total = withExp.reduce((sum, j) => {
          return sum + (j.master_min_exp || j.bachelor_min_exp || 0);
        }, 0);
        
        return total / withExp.length;
      };
      
      return {
        category,
        avgExperience: avgExp(yourJobs),
        marketAvg: avgExp(marketJobs)
      };
    }).map(r => ({
      ...r,
      diff: r.avgExperience - r.marketAvg
    }));
  }
  
  private calculateSeniorityTrend(jobs: ProcessedJobData[]): WorkforcePatternMetrics['seniorityTrend'] {
    const weeklyBreakdown = this.calculateWeeklyBreakdown(jobs);
    
    return weeklyBreakdown.slice(-6).map(week => {
      const weekJobs = jobs.filter(job => {
        try {
          const postDate = parseISO(job.posting_date);
          const weekStart = startOfWeek(postDate, { weekStartsOn: 1 });
          return format(weekStart, 'MMM d') === week.week;
        } catch {
          return false;
        }
      });
      
      const seniorCount = weekJobs.filter(job => {
        const analysis = classifyGrade(job.up_grade);
        return ['Executive', 'Director', 'Senior Professional'].includes(analysis.tier);
      }).length;
      
      return {
        period: week.week,
        seniorRatio: weekJobs.length > 0 ? (seniorCount / weekJobs.length) * 100 : 0
      };
    });
  }
  
  // ============ GEOGRAPHIC INTELLIGENCE ============
  
  calculateGeographicMetrics(): GeographicMetrics {
    const current = this.currentPeriodJobs;
    const previous = this.previousPeriodJobs;
    const marketCurrent = this.filterAgency 
      ? this.filterJobsByPeriod(this.allTimeJobs, this.currentPeriod!.startDate, this.currentPeriod!.endDate) 
      : current;
    
    // Location type distribution
    const locationTypeDistribution = this.calculateLocationTypeDistribution(current, previous);
    
    // Field ratio
    const currentFieldRatio = this.calculateFieldRatio(current);
    const previousFieldRatio = this.calculateFieldRatio(previous);
    
    // Top locations
    const topLocations = this.calculateTopLocations(current, previous);
    
    // New locations
    const newLocations = this.findNewLocations(current, this.avg12moJobs);
    
    // Conflict zone hiring
    const conflictZoneHiring = this.calculateConflictZoneHiring(current, marketCurrent);
    
    // Category geography patterns
    const categoryGeographyPatterns = this.calculateCategoryGeographyPatterns(current, marketCurrent);
    
    // Grade by location type
    const gradeByLocationType = this.calculateGradeByLocationType(current);
    
    // Region breakdown
    const regionBreakdown = this.calculateRegionBreakdown(current, previous);
    
    return {
      locationTypeDistribution,
      fieldRatio: {
        current: currentFieldRatio,
        previous: previousFieldRatio,
        change: currentFieldRatio - previousFieldRatio
      },
      topLocations,
      newLocations,
      conflictZoneHiring,
      categoryGeographyPatterns,
      gradeByLocationType,
      regionBreakdown
    };
  }
  
  private calculateLocationTypeDistribution(current: ProcessedJobData[], previous: ProcessedJobData[]): GeographicMetrics['locationTypeDistribution'] {
    const types = ['Headquarters', 'Regional', 'Field', 'Home-based'];
    const colors: Record<string, string> = {
      'Headquarters': '#3B82F6',
      'Regional': '#10B981',
      'Field': '#F59E0B',
      'Home-based': '#8B5CF6'
    };
    
    const countByType = (jobs: ProcessedJobData[]): Record<string, number> => {
      const counts: Record<string, number> = {};
      types.forEach(t => counts[t] = 0);
      
      jobs.forEach(job => {
        const locType = job.location_type || 'Field';
        if (locType in counts) {
          counts[locType]++;
        }
      });
      
      return counts;
    };
    
    const currentCounts = countByType(current);
    const previousCounts = countByType(previous);
    const total = current.length || 1;
    const prevTotal = previous.length || 1;
    
    return types.map(type => ({
      type,
      current: (currentCounts[type] / total) * 100,
      previous: (previousCounts[type] / prevTotal) * 100,
      change: ((currentCounts[type] / total) - (previousCounts[type] / prevTotal)) * 100,
      color: colors[type]
    }));
  }
  
  private calculateFieldRatio(jobs: ProcessedJobData[]): number {
    if (jobs.length === 0) return 0;
    const fieldCount = jobs.filter(j => j.location_type === 'Field').length;
    return (fieldCount / jobs.length) * 100;
  }
  
  private calculateTopLocations(current: ProcessedJobData[], previous: ProcessedJobData[]): GeographicMetrics['topLocations'] {
    const locationCounts = new Map<string, { country: string; count: number }>();
    
    current.forEach(job => {
      const location = job.duty_station || job.duty_country || 'Unknown';
      const country = job.duty_country || 'Unknown';
      
      if (!locationCounts.has(location)) {
        locationCounts.set(location, { country, count: 0 });
      }
      locationCounts.get(location)!.count++;
    });
    
    const previousCounts = new Map<string, number>();
    previous.forEach(job => {
      const location = job.duty_station || job.duty_country || 'Unknown';
      previousCounts.set(location, (previousCounts.get(location) || 0) + 1);
    });
    
    return Array.from(locationCounts.entries())
      .map(([location, data]) => ({
        location,
        country: data.country,
        count: data.count,
        change: data.count - (previousCounts.get(location) || 0)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
  
  private findNewLocations(current: ProcessedJobData[], historical: ProcessedJobData[]): string[] {
    const historicalLocations = new Set<string>();
    historical.forEach(job => {
      const location = job.duty_station;
      if (location) historicalLocations.add(location.toLowerCase());
    });
    
    const newLocations = new Set<string>();
    current.forEach(job => {
      const location = job.duty_station;
      if (location && !historicalLocations.has(location.toLowerCase())) {
        newLocations.add(location);
      }
    });
    
    return Array.from(newLocations).slice(0, 5);
  }
  
  private calculateConflictZoneHiring(current: ProcessedJobData[], market: ProcessedJobData[]): GeographicMetrics['conflictZoneHiring'] {
    const conflictJobs = current.filter(j => j.is_conflict_zone);
    const marketConflictJobs = market.filter(j => j.is_conflict_zone);
    
    return {
      count: conflictJobs.length,
      percentage: current.length > 0 ? (conflictJobs.length / current.length) * 100 : 0,
      staffRatio: this.calculateStaffRatio(conflictJobs),
      marketStaffRatio: this.calculateStaffRatio(marketConflictJobs)
    };
  }
  
  private calculateCategoryGeographyPatterns(current: ProcessedJobData[], market: ProcessedJobData[]): GeographicMetrics['categoryGeographyPatterns'] {
    const categoryCounts = new Map<string, number>();
    current.forEach(job => {
      categoryCounts.set(job.primary_category, (categoryCounts.get(job.primary_category) || 0) + 1);
    });
    
    const topCategories = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat]) => cat);
    
    return topCategories.map(category => {
      const yourJobs = current.filter(j => j.primary_category === category);
      const marketJobs = market.filter(j => j.primary_category === category);
      
      const yourFieldRatio = this.calculateFieldRatio(yourJobs);
      const marketFieldRatio = this.calculateFieldRatio(marketJobs);
      
      return {
        category,
        yourFieldRatio,
        competitorFieldRatio: marketFieldRatio,
        diff: yourFieldRatio - marketFieldRatio
      };
    });
  }
  
  private calculateGradeByLocationType(jobs: ProcessedJobData[]): GeographicMetrics['gradeByLocationType'] {
    const types = ['Headquarters', 'Regional', 'Field', 'Home-based'];
    
    return types.map(locationType => {
      const typeJobs = jobs.filter(j => j.location_type === locationType);
      
      const juniorCount = typeJobs.filter(j => {
        const analysis = classifyGrade(j.up_grade);
        return ['Entry Professional', 'Support', 'Intern'].includes(analysis.tier);
      }).length;
      
      const seniorCount = typeJobs.filter(j => {
        const analysis = classifyGrade(j.up_grade);
        return ['Executive', 'Director', 'Senior Professional'].includes(analysis.tier);
      }).length;
      
      const total = typeJobs.length || 1;
      
      return {
        locationType,
        juniorRatio: (juniorCount / total) * 100,
        seniorRatio: (seniorCount / total) * 100
      };
    });
  }
  
  private calculateRegionBreakdown(current: ProcessedJobData[], previous: ProcessedJobData[]): GeographicMetrics['regionBreakdown'] {
    const regionCounts = new Map<string, number>();
    current.forEach(job => {
      const region = job.geographic_region || job.duty_continent || 'Unknown';
      regionCounts.set(region, (regionCounts.get(region) || 0) + 1);
    });
    
    const previousCounts = new Map<string, number>();
    previous.forEach(job => {
      const region = job.geographic_region || job.duty_continent || 'Unknown';
      previousCounts.set(region, (previousCounts.get(region) || 0) + 1);
    });
    
    const total = current.length || 1;
    
    return Array.from(regionCounts.entries())
      .map(([region, count]) => ({
        region,
        count,
        percentage: (count / total) * 100,
        change: count - (previousCounts.get(region) || 0)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }
  
  // ============ CATEGORY INTELLIGENCE ============
  
  calculateCategoryMetrics(): CategoryMetrics {
    const current = this.currentPeriodJobs;
    const previous = this.previousPeriodJobs;
    const marketCurrent = this.filterAgency 
      ? this.filterJobsByPeriod(this.allTimeJobs, this.currentPeriod!.startDate, this.currentPeriod!.endDate)
      : current;
    
    // Top categories with growth and competitive position
    const topCategories = this.calculateTopCategories(current, previous, marketCurrent);
    
    // Fastest growing categories
    const fastestGrowing = this.calculateGrowingCategories(current, previous);
    
    // Declining categories
    const declining = this.calculateDecliningCategories(current, previous);
    
    // Category concentration
    const concentration = this.calculateCategoryConcentration(current, previous);
    
    // Experience by category
    const categoryExperience = this.calculateCategoryExperience(current, marketCurrent);
    
    // Application windows by category
    const applicationWindows = this.calculateApplicationWindows(current, marketCurrent);
    
    return {
      topCategories,
      fastestGrowing,
      declining,
      concentration,
      categoryExperience,
      applicationWindows
    };
  }
  
  private calculateTopCategories(current: ProcessedJobData[], previous: ProcessedJobData[], market: ProcessedJobData[]): CategoryMetrics['topCategories'] {
    const categoryCounts = new Map<string, number>();
    current.forEach(job => {
      categoryCounts.set(job.primary_category, (categoryCounts.get(job.primary_category) || 0) + 1);
    });
    
    const previousCounts = new Map<string, number>();
    previous.forEach(job => {
      previousCounts.set(job.primary_category, (previousCounts.get(job.primary_category) || 0) + 1);
    });
    
    const total = current.length || 1;
    const prevTotal = previous.length || 1;
    
    // Market rankings
    const marketRankings = this.calculateMarketRankings(market);
    
    return Array.from(categoryCounts.entries())
      .map(([category, count]) => {
        const prevCount = previousCounts.get(category) || 0;
        const percentage = (count / total) * 100;
        const prevPercentage = (prevCount / prevTotal) * 100;
        const change = percentage - prevPercentage;
        
        const marketRank = marketRankings.get(category);
        
        // Calculate staff ratios
        const yourJobs = current.filter(j => j.primary_category === category);
        const marketJobs = market.filter(j => j.primary_category === category);
        
        const yourStaffRatio = this.calculateStaffRatio(yourJobs);
        const marketStaffRatio = this.calculateStaffRatio(marketJobs);
        
        // Find top competitor
        const competitorCounts = new Map<string, number>();
        marketJobs.forEach(job => {
          const agency = job.short_agency || job.long_agency;
          if (agency && agency !== this.filterAgency) {
            competitorCounts.set(agency, (competitorCounts.get(agency) || 0) + 1);
          }
        });
        
        const topComp = Array.from(competitorCounts.entries())
          .sort((a, b) => b[1] - a[1])[0];
        
        return {
          category,
          count,
          percentage,
          change,
          marketRank: marketRank?.rank,
          topCompetitor: topComp?.[0],
          yourStaffRatio,
          competitorStaffRatio: marketStaffRatio
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
  
  private calculateMarketRankings(market: ProcessedJobData[]): Map<string, { rank: number; share: number }> {
    const categoryCounts = new Map<string, number>();
    market.forEach(job => {
      categoryCounts.set(job.primary_category, (categoryCounts.get(job.primary_category) || 0) + 1);
    });
    
    const total = market.length || 1;
    const rankings = new Map<string, { rank: number; share: number }>();
    
    Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count], index) => {
        rankings.set(category, {
          rank: index + 1,
          share: (count / total) * 100
        });
      });
    
    return rankings;
  }
  
  private calculateGrowingCategories(current: ProcessedJobData[], previous: ProcessedJobData[]): CategoryMetrics['fastestGrowing'] {
    const currentCounts = new Map<string, number>();
    current.forEach(job => {
      currentCounts.set(job.primary_category, (currentCounts.get(job.primary_category) || 0) + 1);
    });
    
    const previousCounts = new Map<string, number>();
    previous.forEach(job => {
      previousCounts.set(job.primary_category, (previousCounts.get(job.primary_category) || 0) + 1);
    });
    
    const allCategories = new Set([...currentCounts.keys(), ...previousCounts.keys()]);
    
    const growth = Array.from(allCategories).map(category => {
      const curr = currentCounts.get(category) || 0;
      const prev = previousCounts.get(category) || 0;
      const growthRate = prev > 0 ? ((curr - prev) / prev) * 100 : (curr > 0 ? 100 : 0);
      
      return {
        category,
        growthRate,
        absoluteChange: curr - prev
      };
    });
    
    return growth
      .filter(c => c.growthRate > 15 && c.absoluteChange >= 2)
      .sort((a, b) => b.growthRate - a.growthRate)
      .slice(0, 5);
  }
  
  private calculateDecliningCategories(current: ProcessedJobData[], previous: ProcessedJobData[]): CategoryMetrics['declining'] {
    const currentCounts = new Map<string, number>();
    current.forEach(job => {
      currentCounts.set(job.primary_category, (currentCounts.get(job.primary_category) || 0) + 1);
    });
    
    const previousCounts = new Map<string, number>();
    previous.forEach(job => {
      previousCounts.set(job.primary_category, (previousCounts.get(job.primary_category) || 0) + 1);
    });
    
    const allCategories = new Set([...currentCounts.keys(), ...previousCounts.keys()]);
    
    const growth = Array.from(allCategories).map(category => {
      const curr = currentCounts.get(category) || 0;
      const prev = previousCounts.get(category) || 0;
      const growthRate = prev > 0 ? ((curr - prev) / prev) * 100 : (curr > 0 ? 100 : 0);
      
      return {
        category,
        growthRate,
        absoluteChange: curr - prev
      };
    });
    
    return growth
      .filter(c => c.growthRate < -15 && c.absoluteChange <= -2)
      .sort((a, b) => a.growthRate - b.growthRate)
      .map(c => ({
        category: c.category,
        growthRate: c.growthRate,
        declineRate: Math.abs(c.growthRate),
        absoluteChange: c.absoluteChange
      }))
      .slice(0, 5);
  }
  
  private calculateCategoryConcentration(current: ProcessedJobData[], previous: ProcessedJobData[]): CategoryMetrics['concentration'] {
    const currentCounts = new Map<string, number>();
    current.forEach(job => {
      currentCounts.set(job.primary_category, (currentCounts.get(job.primary_category) || 0) + 1);
    });
    
    const total = current.length || 1;
    const shares = Array.from(currentCounts.values()).map(c => c / total);
    
    // Herfindahl index
    const herfindahl = shares.reduce((sum, s) => sum + Math.pow(s, 2), 0) * 100;
    
    // Top 3 share
    const top3Share = shares.sort((a, b) => b - a).slice(0, 3).reduce((sum, s) => sum + s, 0) * 100;
    
    // Previous period for comparison
    const prevCounts = new Map<string, number>();
    previous.forEach(job => {
      prevCounts.set(job.primary_category, (prevCounts.get(job.primary_category) || 0) + 1);
    });
    
    const prevTotal = previous.length || 1;
    const prevShares = Array.from(prevCounts.values()).map(c => c / prevTotal);
    const prevTop3Share = prevShares.sort((a, b) => b - a).slice(0, 3).reduce((sum, s) => sum + s, 0) * 100;
    
    return {
      herfindahl,
      top3Share,
      change: top3Share - prevTop3Share
    };
  }
  
  private calculateCategoryExperience(current: ProcessedJobData[], market: ProcessedJobData[]): CategoryMetrics['categoryExperience'] {
    const categoryCounts = new Map<string, number>();
    current.forEach(job => {
      categoryCounts.set(job.primary_category, (categoryCounts.get(job.primary_category) || 0) + 1);
    });
    
    const topCategories = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat]) => cat);
    
    return topCategories.map(category => {
      const yourJobs = current.filter(j => j.primary_category === category);
      const marketJobs = market.filter(j => j.primary_category === category);
      
      const avgExp = (jobs: ProcessedJobData[]) => {
        const withExp = jobs.filter(j => j.master_min_exp !== null || j.bachelor_min_exp !== null);
        if (withExp.length === 0) return 0;
        return withExp.reduce((sum, j) => sum + (j.master_min_exp || j.bachelor_min_exp || 0), 0) / withExp.length;
      };
      
      return {
        category,
        avgExperience: avgExp(yourJobs),
        marketAvg: avgExp(marketJobs)
      };
    });
  }
  
  private calculateApplicationWindows(current: ProcessedJobData[], market: ProcessedJobData[]): CategoryMetrics['applicationWindows'] {
    const categoryCounts = new Map<string, number>();
    current.forEach(job => {
      categoryCounts.set(job.primary_category, (categoryCounts.get(job.primary_category) || 0) + 1);
    });
    
    const topCategories = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat]) => cat);
    
    return topCategories.map(category => {
      const yourJobs = current.filter(j => j.primary_category === category);
      const marketJobs = market.filter(j => j.primary_category === category);
      
      const avgWindow = (jobs: ProcessedJobData[]) => {
        const withWindow = jobs.filter(j => j.application_window_days > 0);
        if (withWindow.length === 0) return 0;
        return withWindow.reduce((sum, j) => sum + j.application_window_days, 0) / withWindow.length;
      };
      
      return {
        category,
        avgWindow: avgWindow(yourJobs),
        marketAvg: avgWindow(marketJobs)
      };
    });
  }
  
  // ============ COMPETITIVE INTELLIGENCE ============
  
  calculateCompetitiveMetrics(): CompetitiveMetrics {
    if (!this.filterAgency) {
      // Return market-level competitive metrics
      return this.calculateMarketCompetitiveMetrics();
    }
    
    const current = this.currentPeriodJobs;
    const previous = this.previousPeriodJobs;
    const marketCurrent = this.filterJobsByPeriod(this.allTimeJobs, this.currentPeriod!.startDate, this.currentPeriod!.endDate);
    const marketPrevious = this.filterJobsByPeriod(this.allTimeJobs, this.previousPeriod!.startDate, this.previousPeriod!.endDate);
    
    // Market share
    const currentShare = marketCurrent.length > 0 ? (current.length / marketCurrent.length) * 100 : 0;
    const previousShare = marketPrevious.length > 0 ? (previous.length / marketPrevious.length) * 100 : 0;
    
    // Rank
    const currentRank = this.calculateAgencyRank(marketCurrent, this.filterAgency);
    const previousRank = this.calculateAgencyRank(marketPrevious, this.filterAgency);
    
    // Peer group performance
    const peerGroupPerformance = this.calculatePeerGroupPerformance(marketCurrent);
    
    // Competitor patterns
    const competitorPatterns = this.calculateCompetitorPatterns(current, marketCurrent);
    
    // Category position
    const categoryPosition = this.calculateCategoryPosition(current, marketCurrent);
    
    // New competitor moves
    const newCompetitorMoves = this.detectNewCompetitorMoves(marketCurrent, marketPrevious);
    
    return {
      marketShare: {
        current: currentShare,
        previous: previousShare,
        change: currentShare - previousShare
      },
      rank: {
        current: currentRank.rank,
        previous: previousRank.rank,
        total: currentRank.total,
        change: previousRank.rank - currentRank.rank // Positive = improved
      },
      peerGroupPerformance,
      competitorPatterns,
      categoryPosition,
      newCompetitorMoves
    };
  }
  
  private calculateMarketCompetitiveMetrics(): CompetitiveMetrics {
    const current = this.currentPeriodJobs;
    const previous = this.previousPeriodJobs;
    
    // Calculate top agencies
    const agencyCounts = new Map<string, number>();
    current.forEach(job => {
      const agency = job.short_agency || job.long_agency;
      if (agency) {
        agencyCounts.set(agency, (agencyCounts.get(agency) || 0) + 1);
      }
    });
    
    const topAgencies = Array.from(agencyCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    return {
      marketShare: { current: 100, previous: 100, change: 0 },
      rank: { current: 0, previous: 0, total: agencyCounts.size, change: 0 },
      peerGroupPerformance: topAgencies.map(([agency, count]) => ({
        agency,
        volume: count,
        seniorRatio: this.calculateSeniorRatio(current.filter(j => (j.short_agency || j.long_agency) === agency)),
        fieldRatio: this.calculateFieldRatio(current.filter(j => (j.short_agency || j.long_agency) === agency)),
        isYou: false
      })),
      competitorPatterns: [],
      categoryPosition: [],
      newCompetitorMoves: []
    };
  }
  
  private calculateAgencyRank(market: ProcessedJobData[], agency: string): { rank: number; total: number } {
    const agencyCounts = new Map<string, number>();
    market.forEach(job => {
      const ag = job.short_agency || job.long_agency;
      if (ag) {
        agencyCounts.set(ag, (agencyCounts.get(ag) || 0) + 1);
      }
    });
    
    const sorted = Array.from(agencyCounts.entries()).sort((a, b) => b[1] - a[1]);
    const rank = sorted.findIndex(([ag]) => ag === agency) + 1;
    
    return { rank: rank || sorted.length + 1, total: sorted.length };
  }
  
  private calculateSeniorRatio(jobs: ProcessedJobData[]): number {
    if (jobs.length === 0) return 0;
    
    const seniorCount = jobs.filter(j => {
      const analysis = classifyGrade(j.up_grade);
      return ['Executive', 'Director', 'Senior Professional'].includes(analysis.tier);
    }).length;
    
    return (seniorCount / jobs.length) * 100;
  }
  
  private calculatePeerGroupPerformance(market: ProcessedJobData[]): CompetitiveMetrics['peerGroupPerformance'] {
    if (!this.filterAgency) return [];
    
    const peerGroup = getAgencyPeerGroup(this.filterAgency);
    if (!peerGroup) return [];
    
    const peers = [...peerGroup.agencies];
    
    return peers.map(agency => {
      const agencyJobs = market.filter(j => (j.short_agency || j.long_agency) === agency);
      
      return {
        agency,
        volume: agencyJobs.length,
        seniorRatio: this.calculateSeniorRatio(agencyJobs),
        fieldRatio: this.calculateFieldRatio(agencyJobs),
        isYou: agency === this.filterAgency
      };
    }).sort((a, b) => b.volume - a.volume);
  }
  
  private calculateCompetitorPatterns(current: ProcessedJobData[], market: ProcessedJobData[]): CompetitiveMetrics['competitorPatterns'] {
    if (!this.filterAgency) return [];
    
    // Get top 5 agencies by volume
    const agencyCounts = new Map<string, ProcessedJobData[]>();
    market.forEach(job => {
      const agency = job.short_agency || job.long_agency;
      if (agency && agency !== this.filterAgency) {
        if (!agencyCounts.has(agency)) {
          agencyCounts.set(agency, []);
        }
        agencyCounts.get(agency)!.push(job);
      }
    });
    
    const topCompetitors = Array.from(agencyCounts.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 5);
    
    // Calculate your category distribution
    const yourCategories = new Map<string, number>();
    current.forEach(job => {
      yourCategories.set(job.primary_category, (yourCategories.get(job.primary_category) || 0) + 1);
    });
    
    return topCompetitors.map(([agency, jobs]) => {
      // Calculate category distribution
      const theirCategories = new Map<string, number>();
      jobs.forEach(job => {
        theirCategories.set(job.primary_category, (theirCategories.get(job.primary_category) || 0) + 1);
      });
      
      // Calculate correlation (simplified Pearson)
      const correlation = this.calculateCategoryCorrelation(yourCategories, theirCategories, current.length, jobs.length);
      
      // Find key difference
      const yourStaffRatio = this.calculateStaffRatio(current);
      const theirStaffRatio = this.calculateStaffRatio(jobs);
      
      let keyDifference = '';
      if (Math.abs(yourStaffRatio - theirStaffRatio) > 15) {
        keyDifference = yourStaffRatio > theirStaffRatio 
          ? `${Math.abs(yourStaffRatio - theirStaffRatio).toFixed(0)}% more staff-focused`
          : `${Math.abs(theirStaffRatio - yourStaffRatio).toFixed(0)}% more consultant-focused`;
      } else {
        const yourFieldRatio = this.calculateFieldRatio(current);
        const theirFieldRatio = this.calculateFieldRatio(jobs);
        if (Math.abs(yourFieldRatio - theirFieldRatio) > 15) {
          keyDifference = yourFieldRatio > theirFieldRatio
            ? `${Math.abs(yourFieldRatio - theirFieldRatio).toFixed(0)}% more field-deployed`
            : `${Math.abs(theirFieldRatio - yourFieldRatio).toFixed(0)}% more HQ-centric`;
        }
      }
      
      // Calculate volume change
      const previousJobs = this.previousPeriodJobs.filter(j => (j.short_agency || j.long_agency) === agency);
      const volumeChange = previousJobs.length > 0 
        ? ((jobs.length - previousJobs.length) / previousJobs.length) * 100 
        : 0;
      
      return {
        agency,
        correlation,
        volumeChange,
        keyDifference: keyDifference || 'Similar hiring profile'
      };
    });
  }
  
  private calculateCategoryCorrelation(map1: Map<string, number>, map2: Map<string, number>, total1: number, total2: number): number {
    const allCategories = new Set([...map1.keys(), ...map2.keys()]);
    
    const vec1: number[] = [];
    const vec2: number[] = [];
    
    allCategories.forEach(cat => {
      vec1.push((map1.get(cat) || 0) / total1);
      vec2.push((map2.get(cat) || 0) / total2);
    });
    
    // Simplified correlation
    const mean1 = vec1.reduce((a, b) => a + b, 0) / vec1.length;
    const mean2 = vec2.reduce((a, b) => a + b, 0) / vec2.length;
    
    let num = 0;
    let den1 = 0;
    let den2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      const d1 = vec1[i] - mean1;
      const d2 = vec2[i] - mean2;
      num += d1 * d2;
      den1 += d1 * d1;
      den2 += d2 * d2;
    }
    
    const den = Math.sqrt(den1 * den2);
    return den > 0 ? num / den : 0;
  }
  
  private calculateCategoryPosition(current: ProcessedJobData[], market: ProcessedJobData[]): CompetitiveMetrics['categoryPosition'] {
    // Get your top categories
    const yourCategories = new Map<string, number>();
    current.forEach(job => {
      yourCategories.set(job.primary_category, (yourCategories.get(job.primary_category) || 0) + 1);
    });
    
    const topCategories = Array.from(yourCategories.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat]) => cat);
    
    return topCategories.map(category => {
      const categoryMarket = market.filter(j => j.primary_category === category);
      
      // Calculate agency rankings in this category
      const agencyCounts = new Map<string, number>();
      categoryMarket.forEach(job => {
        const agency = job.short_agency || job.long_agency;
        if (agency) {
          agencyCounts.set(agency, (agencyCounts.get(agency) || 0) + 1);
        }
      });
      
      const sorted = Array.from(agencyCounts.entries()).sort((a, b) => b[1] - a[1]);
      const yourRank = sorted.findIndex(([ag]) => ag === this.filterAgency) + 1;
      const yourCount = agencyCounts.get(this.filterAgency!) || 0;
      const yourShare = categoryMarket.length > 0 ? (yourCount / categoryMarket.length) * 100 : 0;
      
      const leader = sorted[0];
      
      return {
        category,
        yourRank: yourRank || sorted.length + 1,
        yourShare,
        leader: leader?.[0] || 'Unknown',
        leaderShare: leader && categoryMarket.length > 0 ? (leader[1] / categoryMarket.length) * 100 : 0
      };
    });
  }
  
  private detectNewCompetitorMoves(current: ProcessedJobData[], previous: ProcessedJobData[]): CompetitiveMetrics['newCompetitorMoves'] {
    // Find agencies entering categories they weren't in before
    const currentCategoryAgencies = new Map<string, Set<string>>();
    current.forEach(job => {
      const agency = job.short_agency || job.long_agency;
      if (agency) {
        if (!currentCategoryAgencies.has(job.primary_category)) {
          currentCategoryAgencies.set(job.primary_category, new Set());
        }
        currentCategoryAgencies.get(job.primary_category)!.add(agency);
      }
    });
    
    const previousCategoryAgencies = new Map<string, Set<string>>();
    previous.forEach(job => {
      const agency = job.short_agency || job.long_agency;
      if (agency) {
        if (!previousCategoryAgencies.has(job.primary_category)) {
          previousCategoryAgencies.set(job.primary_category, new Set());
        }
        previousCategoryAgencies.get(job.primary_category)!.add(agency);
      }
    });
    
    const moves: CompetitiveMetrics['newCompetitorMoves'] = [];
    
    currentCategoryAgencies.forEach((agencies, category) => {
      const previousAgencies = previousCategoryAgencies.get(category) || new Set();
      
      agencies.forEach(agency => {
        if (!previousAgencies.has(agency) && agency !== this.filterAgency) {
          // Count how many positions in this category
          const count = current.filter(j => 
            (j.short_agency || j.long_agency) === agency && 
            j.primary_category === category
          ).length;
          
          if (count >= 3) {
            moves.push({
              agency,
              category,
              description: `New entry with ${count} positions`
            });
          }
        }
      });
    });
    
    return moves.slice(0, 5);
  }
  
  // ============ EXECUTIVE SUMMARY ============
  
  generateExecutiveSummary(): ExecutiveSummary {
    const volumeMetrics = this.calculateVolumeMetrics();
    const workforceMetrics = this.calculateWorkforcePatterns();
    const categoryMetrics = this.calculateCategoryMetrics();
    const geoMetrics = this.calculateGeographicMetrics();
    
    // Build headline
    let headline = '';
    const current = this.currentPeriodJobs.length;
    const change = volumeMetrics.volumeChange;
    const periodLabel = this.currentPeriod?.label || 'the selected period';
    
    if (this.filterAgency) {
      headline = `Over ${periodLabel}, ${this.filterAgency} posted ${current} positions`;
      if (Math.abs(change) > 5) {
        headline += ` — ${change > 0 ? 'up' : 'down'} ${Math.abs(change).toFixed(0)}% from the prior period`;
      }
    } else {
      headline = `The UN system posted ${current.toLocaleString()} positions over ${periodLabel}`;
      if (Math.abs(change) > 5) {
        headline += ` — ${change > 0 ? 'up' : 'down'} ${Math.abs(change).toFixed(0)}% from the prior period`;
      }
    }
    
    // Key points
    const keyPoints: string[] = [];
    
    // Staff ratio insight
    if (Math.abs(workforceMetrics.staffRatio.change) > 5) {
      keyPoints.push(
        `Non-staff positions made up ${(100 - workforceMetrics.staffRatio.current).toFixed(0)}% of postings (was ${(100 - workforceMetrics.staffRatio.previous).toFixed(0)}% prior period)`
      );
    }
    
    // Top growing category
    if (categoryMetrics.fastestGrowing.length > 0) {
      const top = categoryMetrics.fastestGrowing[0];
      keyPoints.push(
        `${top.category} grew ${top.growthRate.toFixed(0)}% vs prior period`
      );
    }
    
    // Geographic shift
    if (Math.abs(geoMetrics.fieldRatio.change) > 5) {
      keyPoints.push(
        `Field positions ${geoMetrics.fieldRatio.change > 0 ? 'increased' : 'decreased'} to ${geoMetrics.fieldRatio.current.toFixed(0)}% of postings`
      );
    }
    
    // Top shift
    let topShift = { area: 'Workforce', description: 'Stable hiring patterns' };
    if (categoryMetrics.fastestGrowing.length > 0) {
      const top = categoryMetrics.fastestGrowing[0];
      topShift = { area: top.category, description: `+${top.growthRate.toFixed(0)}% growth` };
    } else if (Math.abs(workforceMetrics.staffRatio.change) > 5) {
      topShift = { 
        area: 'Workforce Mix', 
        description: `${workforceMetrics.staffRatio.change > 0 ? 'More' : 'Less'} staff positions` 
      };
    }
    
    // Competitor alert (agency view only)
    let competitorAlert: string | undefined;
    if (this.filterAgency) {
      const competitive = this.calculateCompetitiveMetrics();
      if (competitive.rank.change < 0) {
        competitorAlert = `Rank dropped from #${competitive.rank.previous} to #${competitive.rank.current}`;
      } else if (competitive.rank.change > 0) {
        competitorAlert = `Rank improved from #${competitive.rank.previous} to #${competitive.rank.current}`;
      }
    }
    
    return {
      headline,
      keyPoints,
      volumeTrend: {
        current: volumeMetrics.totalPositions,
        previous: volumeMetrics.previousPeriodPositions,
        change: volumeMetrics.volumeChange
      },
      topShift,
      competitorAlert,
      anomalyCount: 0 // Will be filled by anomaly detector
    };
  }
  
  // ============ GETTERS ============
  
  getCurrentPeriod(): PeriodData | null {
    return this.currentPeriod;
  }
  
  getPreviousPeriod(): PeriodData | null {
    return this.previousPeriod;
  }
  
  getCurrentJobs(): ProcessedJobData[] {
    return this.currentPeriodJobs;
  }
  
  getPreviousJobs(): ProcessedJobData[] {
    return this.previousPeriodJobs;
  }
  
  getAllTimeJobs(): ProcessedJobData[] {
    return this.allTimeJobs;
  }
  
  getFilterAgency(): string | null {
    return this.filterAgency;
  }
  
  isAgencyView(): boolean {
    return this.filterAgency !== null && this.filterAgency !== 'all';
  }
}

// Export singleton instance
export const intelligenceEngine = new IntelligenceInsightsEngine();

