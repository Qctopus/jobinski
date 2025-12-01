/**
 * Intelligence Brief Engine
 * 
 * Generates comprehensive cross-dimensional analytics for the Intelligence Brief.
 * Produces structured data with narrative interpretation, supporting visualizations.
 */

import { ProcessedJobData } from '../../types';
import { classifyGrade, getConsolidatedTier } from '../../utils/gradeClassification';
import { parseISO, subWeeks, subMonths, isWithinInterval, format, startOfWeek, differenceInDays } from 'date-fns';
import { getAgencyPeerGroup } from '../../config/peerGroups';

// ============ TYPES ============

export interface KeyMetric {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  trend?: 'up' | 'down' | 'stable';
  comparison?: string;
}

export interface WeeklyData {
  week: string;
  weekStart: Date;
  count: number;
  cumulative: number;
}

export interface VolumeMetrics {
  total: number;
  previousTotal: number;
  change: number;
  weeklyAverage: number;
  previousWeeklyAverage: number;
  velocityChange: number;
  accelerationPattern: 'accelerating' | 'decelerating' | 'steady';
  weeklyData: WeeklyData[];
  peakWeek: { week: string; count: number };
  distribution: { firstHalf: number; secondHalf: number };
  vs12MonthAvg: number;
}

export interface WorkforceMetrics {
  staffRatio: number;
  previousStaffRatio: number;
  marketStaffRatio: number;
  staffChange: number;
  gradeDistribution: Array<{
    tier: string;
    count: number;
    percentage: number;
    previousPercentage: number;
    change: number;
    color: string;
  }>;
  nonStaffBreakdown: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  categoryStaffPatterns: Array<{
    category: string;
    categoryName: string;
    yourStaffPct: number;
    marketStaffPct: number;
    topCompetitor: string;
    competitorStaffPct: number;
    gap: number;
    jobCount: number;
  }>;
  seniorRatio: number;
  previousSeniorRatio: number;
}

export interface GeographicMetrics {
  fieldRatio: number;
  previousFieldRatio: number;
  marketFieldRatio: number;
  locationTypeDistribution: Array<{
    type: string;
    count: number;
    percentage: number;
    previousPercentage: number;
    change: number;
    color: string;
  }>;
  topLocations: Array<{
    location: string;
    country: string;
    count: number;
    previousCount: number;
    change: number;
  }>;
  regionDistribution: Array<{
    region: string;
    count: number;
    percentage: number;
    previousPercentage: number;
  }>;
  categoryFieldPatterns: Array<{
    category: string;
    categoryName: string;
    yourFieldPct: number;
    marketFieldPct: number;
    difference: number;
  }>;
  gradeByLocationType: Array<{
    locationType: string;
    seniorPct: number;
    midPct: number;
    juniorPct: number;
  }>;
  newLocations: string[];
}

export interface CategoryMetrics {
  topCategories: Array<{
    id: string;
    name: string;
    count: number;
    percentage: number;
    previousCount: number;
    growthRate: number;
    marketLeader: string;
    leaderShare: number;
    yourRank: number;
    yourShare: number;
    gapToLeader: number;
  }>;
  fastestGrowing: Array<{
    category: string;
    name: string;
    previousCount: number;
    currentCount: number;
    growthRate: number;
  }>;
  declining: Array<{
    category: string;
    name: string;
    previousCount: number;
    currentCount: number;
    declineRate: number;
  }>;
  concentration: {
    top3Share: number;
    previousTop3Share: number;
    herfindahl: number;
  };
  applicationWindows: Array<{
    category: string;
    name: string;
    avgWindow: number;
    marketAvg: number;
    difference: number;
    assessment: string;
  }>;
  competitivePosition: Array<{
    category: string;
    name: string;
    totalJobs: number;
    leader: string;
    leaderShare: number;
    second: string;
    secondShare: number;
    gap: number;
  }>;
}

export interface CompetitorMetrics {
  marketShare: Array<{
    agency: string;
    positions: number;
    share: number;
    previousShare: number;
    shareChange: number;
    staffPct: number;
    seniorPct: number;
    fieldPct: number;
    avgWindow: number;
    isYou?: boolean;
  }>;
  yourRank: number;
  previousRank: number;
  rankChange: number;
  totalAgencies: number;
  correlations: Array<{
    agency1: string;
    agency2: string;
    correlation: number;
    interpretation: string;
  }>;
  categoryLeadership: Array<{
    category: string;
    name: string;
    leader: string;
    leaderShare: number;
    yourPosition: number;
    yourShare: number;
  }>;
  newEntrants: Array<{
    agency: string;
    category: string;
    categoryName: string;
    positions: number;
    description: string;
  }>;
  behavioralComparison: Array<{
    agency: string;
    comparison: string;
  }>;
}

export interface Signal {
  type: 'trend' | 'competitor' | 'risk' | 'geographic' | 'anomaly';
  icon: string;
  signal: string;
  interpretation: string;
  severity: 'high' | 'medium' | 'low';
}

export interface ExecutiveSummary {
  paragraphs: string[];
  vitalSigns: KeyMetric[];
}

export interface IntelligenceBriefData {
  generatedAt: Date;
  periodLabel: string;
  comparisonLabel: string;
  agencyName?: string;
  isAgencyView: boolean;
  headerMetrics: KeyMetric[];
  executiveSummary: ExecutiveSummary;
  volume: VolumeMetrics;
  workforce: WorkforceMetrics;
  geographic: GeographicMetrics;
  category: CategoryMetrics;
  competitive: CompetitorMetrics;
  signals: Signal[];
}

// ============ HELPER FUNCTIONS ============

const formatNumber = (n: number): string => n.toLocaleString();
const formatPercent = (n: number, decimals = 0): string => `${n.toFixed(decimals)}%`;
const formatChange = (n: number): string => n >= 0 ? `+${n.toFixed(0)}%` : `${n.toFixed(0)}%`;

const formatCategoryName = (id: string): string => {
  return id
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' & ')
    .replace(' And ', ' & ');
};

const GRADE_COLORS: Record<string, string> = {
  'Executive': '#7C3AED',
  'Director': '#2563EB',
  'Senior Professional': '#0891B2',
  'Mid Professional': '#059669',
  'Entry Professional': '#D97706',
  'Support': '#DC2626',
  'Consultant': '#F59E0B',
  'Intern': '#8B5CF6'
};

const LOCATION_COLORS: Record<string, string> = {
  'Field': '#F59E0B',
  'Headquarters': '#3B82F6',
  'Regional Hub': '#10B981',
  'Home-based': '#8B5CF6'
};

// ============ MAIN ENGINE CLASS ============

export class IntelligenceBriefEngine {
  private currentJobs: ProcessedJobData[] = [];
  private previousJobs: ProcessedJobData[] = [];
  private marketCurrent: ProcessedJobData[] = [];
  private marketPrevious: ProcessedJobData[] = [];
  private historicalJobs: ProcessedJobData[] = [];
  private agencyName: string | null = null;
  private periodLabel: string = '';
  private comparisonLabel: string = '';
  private periodWeeks: number = 13;

  generate(
    allJobs: ProcessedJobData[],
    timeRange: string,
    agencyName?: string
  ): IntelligenceBriefData {
    this.initialize(allJobs, timeRange, agencyName);

    return {
      generatedAt: new Date(),
      periodLabel: this.periodLabel,
      comparisonLabel: this.comparisonLabel,
      agencyName: this.agencyName || undefined,
      isAgencyView: !!this.agencyName,
      headerMetrics: this.generateHeaderMetrics(),
      executiveSummary: this.generateExecutiveSummary(),
      volume: this.generateVolumeMetrics(),
      workforce: this.generateWorkforceMetrics(),
      geographic: this.generateGeographicMetrics(),
      category: this.generateCategoryMetrics(),
      competitive: this.generateCompetitiveMetrics(),
      signals: this.generateSignals()
    };
  }

  private initialize(allJobs: ProcessedJobData[], timeRange: string, agencyName?: string): void {
    const now = new Date();
    this.agencyName = agencyName || null;

    const periodConfig = this.getPeriodConfig(timeRange);
    this.periodWeeks = periodConfig.weeks;

    const currentEnd = now;
    const currentStart = periodConfig.getStart(now);
    const previousEnd = currentStart;
    const previousStart = periodConfig.getStart(currentStart);
    const historicalStart = subMonths(now, 12);

    this.periodLabel = `${format(currentStart, 'MMM d')} – ${format(currentEnd, 'MMM d, yyyy')}`;
    this.comparisonLabel = `${format(previousStart, 'MMM d')} – ${format(previousEnd, 'MMM d')}`;

    // Filter market jobs
    this.marketCurrent = this.filterByPeriod(allJobs, currentStart, currentEnd);
    this.marketPrevious = this.filterByPeriod(allJobs, previousStart, previousEnd);
    this.historicalJobs = this.filterByPeriod(allJobs, historicalStart, now);

    // Filter agency jobs
    if (agencyName) {
      this.currentJobs = this.filterByAgency(this.marketCurrent, agencyName);
      this.previousJobs = this.filterByAgency(this.marketPrevious, agencyName);
    } else {
      this.currentJobs = this.marketCurrent;
      this.previousJobs = this.marketPrevious;
    }
  }

  private getPeriodConfig(timeRange: string) {
    const configs: Record<string, { weeks: number; getStart: (d: Date) => Date }> = {
      '4weeks': { weeks: 4, getStart: (d) => subWeeks(d, 4) },
      '8weeks': { weeks: 8, getStart: (d) => subWeeks(d, 8) },
      '3months': { weeks: 13, getStart: (d) => subMonths(d, 3) },
      '6months': { weeks: 26, getStart: (d) => subMonths(d, 6) },
      '1year': { weeks: 52, getStart: (d) => subMonths(d, 12) }
    };
    return configs[timeRange] || configs['3months'];
  }

  private filterByPeriod(jobs: ProcessedJobData[], start: Date, end: Date): ProcessedJobData[] {
    return jobs.filter(job => {
      try {
        const date = parseISO(job.posting_date);
        return isWithinInterval(date, { start, end });
      } catch {
        return false;
      }
    });
  }

  private filterByAgency(jobs: ProcessedJobData[], agency: string): ProcessedJobData[] {
    return jobs.filter(j => (j.short_agency || j.long_agency) === agency);
  }

  // ============ HEADER METRICS ============

  private generateHeaderMetrics(): KeyMetric[] {
    const metrics: KeyMetric[] = [];
    const current = this.currentJobs;
    const previous = this.previousJobs;
    const market = this.marketCurrent;

    // Positions
    const change = previous.length > 0 
      ? ((current.length - previous.length) / previous.length) * 100 
      : 0;
    
    metrics.push({
      label: 'Positions',
      value: formatNumber(current.length),
      change: Math.abs(change) > 5 ? change : undefined,
      trend: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
      comparison: `vs ${formatNumber(previous.length)} prior`
    });

    // Market Share / Rank (agency view)
    if (this.agencyName) {
      const share = market.length > 0 ? (current.length / market.length) * 100 : 0;
      const { rank, total } = this.calculateRank(market, this.agencyName);
      
      metrics.push({
        label: 'Market Rank',
        value: `#${rank} of ${total}`,
        comparison: `${share.toFixed(1)}% share`
      });
    }

    // Staff Ratio
    const staffRatio = this.calculateStaffRatio(current);
    const prevStaffRatio = this.calculateStaffRatio(previous);
    const marketStaffRatio = this.calculateStaffRatio(market);

    metrics.push({
      label: 'Staff Ratio',
      value: formatPercent(staffRatio),
      change: Math.abs(staffRatio - prevStaffRatio) > 3 ? staffRatio - prevStaffRatio : undefined,
      comparison: this.agencyName ? `Market: ${formatPercent(marketStaffRatio)}` : undefined
    });

    // Field Ratio
    const fieldRatio = this.calculateFieldRatio(current);
    
    metrics.push({
      label: 'Field Positions',
      value: formatPercent(fieldRatio),
      comparison: this.agencyName ? `Market: ${formatPercent(this.calculateFieldRatio(market))}` : undefined
    });

    // Avg Window
    const avgWindow = this.calculateAvgWindow(current);
    
    metrics.push({
      label: 'Avg Window',
      value: `${avgWindow.toFixed(0)}d`,
      comparison: this.agencyName ? `Market: ${this.calculateAvgWindow(market).toFixed(0)}d` : undefined
    });

    return metrics;
  }

  // ============ EXECUTIVE SUMMARY ============

  private generateExecutiveSummary(): ExecutiveSummary {
    const paragraphs: string[] = [];
    const current = this.currentJobs;
    const previous = this.previousJobs;
    const market = this.marketCurrent;

    const volume = current.length;
    const prevVolume = previous.length;
    const volumeChange = prevVolume > 0 ? ((volume - prevVolume) / prevVolume) * 100 : 0;
    const weeklyAvg = volume / this.periodWeeks;
    const prevWeeklyAvg = prevVolume / this.periodWeeks;

    const staffRatio = this.calculateStaffRatio(current);
    const marketStaffRatio = this.calculateStaffRatio(market);
    const fieldRatio = this.calculateFieldRatio(current);

    // Paragraph 1: Volume & Position
    const subject = this.agencyName || 'The UN system';
    let p1 = `${subject} posted ${formatNumber(volume)} positions over ${this.periodWeeks} weeks`;
    p1 += ` — averaging ${weeklyAvg.toFixed(0)} per week`;
    
    if (Math.abs(volumeChange) > 20) {
      p1 += `, ${volumeChange > 0 ? 'up significantly from' : 'down from'} ${prevWeeklyAvg.toFixed(1)}/week in the prior period`;
    }
    
    if (this.agencyName) {
      const { rank } = this.calculateRank(market, this.agencyName);
      const share = (volume / market.length) * 100;
      p1 += `. This positions ${this.agencyName} at #${rank} in market volume with ${share.toFixed(1)}% share`;
    }
    p1 += '.';

    // Add category context
    const topCats = this.getTopCategories(current).slice(0, 2);
    if (topCats.length >= 2) {
      const pctTop2 = ((topCats[0].count + topCats[1].count) / volume) * 100;
      p1 += ` ${topCats[0].name} and ${topCats[1].name} account for ${pctTop2.toFixed(0)}% of hiring.`;
    }

    paragraphs.push(p1);

    // Paragraph 2: Structural shift
    const staffDiff = staffRatio - marketStaffRatio;
    let p2 = '';

    if (Math.abs(staffDiff) > 10 || staffRatio < 40) {
      p2 = `The most notable structural pattern is `;
      if (staffRatio < 50) {
        p2 += `heavy reliance on non-staff positions at ${formatPercent(100 - staffRatio)}`;
        if (this.agencyName) {
          p2 += ` — ${Math.abs(staffDiff).toFixed(0)}pp ${staffDiff < 0 ? 'above' : 'below'} market average`;
        }
        p2 += `. `;
        
        // Category variation
        const catPatterns = this.getCategoryStaffPatterns();
        const highConsultant = catPatterns.filter(c => c.yourStaffPct < 30).slice(0, 2);
        const lowConsultant = catPatterns.filter(c => c.yourStaffPct > 60);
        
        if (highConsultant.length > 0) {
          p2 += `This consultant-heavy approach is most pronounced in ${highConsultant.map(c => c.categoryName).join(' and ')} `;
          p2 += `(${formatPercent(100 - highConsultant[0].yourStaffPct)}+ non-staff)`;
        }
        if (lowConsultant.length > 0) {
          p2 += `, while ${lowConsultant[0].categoryName} maintains ${formatPercent(lowConsultant[0].yourStaffPct)} staff`;
        }
        p2 += '.';
      } else {
        p2 = `The workforce maintains a balanced staff ratio at ${formatPercent(staffRatio)}, ${staffDiff > 0 ? 'above' : 'near'} market average.`;
      }
    } else {
      // Focus on geography instead
      p2 = `Geographic distribution shows ${formatPercent(fieldRatio)} field-based positions`;
      if (this.agencyName) {
        const marketField = this.calculateFieldRatio(market);
        if (Math.abs(fieldRatio - marketField) > 10) {
          p2 += ` — ${fieldRatio > marketField ? 'more' : 'less'} field-focused than market average (${formatPercent(marketField)})`;
        }
      }
      p2 += '.';
    }

    if (p2) paragraphs.push(p2);

    // Paragraph 3: Competitive context (agency view)
    if (this.agencyName) {
      const competitors = this.getTopCompetitors();
      const categoryLeaders = this.getCategoryLeadership();
      const leading = categoryLeaders.filter(c => c.leader === this.agencyName);
      
      let p3 = 'Competitive position: ';
      if (leading.length > 0) {
        p3 += `market leader in ${leading.map(c => c.name).slice(0, 3).join(', ')}`;
      }
      
      // Find closest competitor
      const closest = competitors.find(c => c.agency !== this.agencyName);
      if (closest) {
        p3 += `. ${closest.agency} is the primary competitor at ${formatPercent(closest.share)} share`;
        
        // Behavioral difference
        const yourStaff = this.calculateStaffRatio(current);
        if (Math.abs(yourStaff - closest.staffPct) > 10) {
          p3 += ` but with different approach: they hire ${formatPercent(closest.staffPct)} staff vs your ${formatPercent(yourStaff)}`;
        }
      }
      p3 += '.';
      
      paragraphs.push(p3);
    }

    // Paragraph 4: Key tension/risk
    const avgWindow = this.calculateAvgWindow(current);
    const shortWindowPct = current.filter(j => j.application_window_days > 0 && j.application_window_days < 10).length / (current.length || 1) * 100;
    
    if (shortWindowPct > 30) {
      paragraphs.push(
        `One pattern warrants attention: ${formatPercent(shortWindowPct)} of positions have application windows under 10 days. Short windows typically correlate with smaller, less diverse candidate pools and may indicate planning gaps or surge hiring.`
      );
    } else if (staffRatio < 35 && this.agencyName) {
      paragraphs.push(
        `Key tension: heavy consultant reliance (${formatPercent(100 - staffRatio)} non-staff) offers flexibility but may limit institutional knowledge retention. Consider whether critical functions are becoming over-dependent on rotating short-term contracts.`
      );
    }

    // Vital signs
    const vitalSigns: KeyMetric[] = [
      { label: 'Positions', value: formatNumber(volume), trend: volumeChange > 10 ? 'up' : volumeChange < -10 ? 'down' : 'stable' },
      { label: 'Weekly Rate', value: `${weeklyAvg.toFixed(0)}/wk` },
      { label: 'Staff Ratio', value: formatPercent(staffRatio) },
      { label: 'Field %', value: formatPercent(fieldRatio) },
      { label: 'Avg Window', value: `${avgWindow.toFixed(0)}d` }
    ];

    if (this.agencyName) {
      const { rank } = this.calculateRank(market, this.agencyName);
      vitalSigns.splice(1, 0, { label: 'Market Rank', value: `#${rank}` });
    }

    return { paragraphs, vitalSigns };
  }

  // ============ VOLUME METRICS ============

  private generateVolumeMetrics(): VolumeMetrics {
    const current = this.currentJobs;
    const previous = this.previousJobs;

    const total = current.length;
    const previousTotal = previous.length;
    const change = previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : 0;

    const weeklyAverage = total / this.periodWeeks;
    const previousWeeklyAverage = previousTotal / this.periodWeeks;
    const velocityChange = previousWeeklyAverage > 0 
      ? ((weeklyAverage - previousWeeklyAverage) / previousWeeklyAverage) * 100 
      : 0;

    // Weekly breakdown
    const weeklyData = this.calculateWeeklyBreakdown(current);
    
    // Peak week
    const peakWeek = weeklyData.length > 0 
      ? weeklyData.reduce((max, w) => w.count > max.count ? w : max, weeklyData[0])
      : { week: '', count: 0 };

    // Distribution
    const midpoint = Math.floor(weeklyData.length / 2);
    const firstHalf = weeklyData.slice(0, midpoint).reduce((sum, w) => sum + w.count, 0);
    const secondHalf = weeklyData.slice(midpoint).reduce((sum, w) => sum + w.count, 0);

    let accelerationPattern: 'accelerating' | 'decelerating' | 'steady' = 'steady';
    if (secondHalf > firstHalf * 1.3) accelerationPattern = 'accelerating';
    else if (secondHalf < firstHalf * 0.7) accelerationPattern = 'decelerating';

    // 12-month comparison
    const avg12mo = this.historicalJobs.length / 52;
    const vs12MonthAvg = avg12mo > 0 ? ((weeklyAverage - avg12mo) / avg12mo) * 100 : 0;

    return {
      total,
      previousTotal,
      change,
      weeklyAverage,
      previousWeeklyAverage,
      velocityChange,
      accelerationPattern,
      weeklyData,
      peakWeek: { week: peakWeek.week, count: peakWeek.count },
      distribution: { 
        firstHalf: total > 0 ? (firstHalf / total) * 100 : 0, 
        secondHalf: total > 0 ? (secondHalf / total) * 100 : 0 
      },
      vs12MonthAvg
    };
  }

  private calculateWeeklyBreakdown(jobs: ProcessedJobData[]): WeeklyData[] {
    const weeks = new Map<string, { weekStart: Date; count: number }>();
    
    jobs.forEach(job => {
      try {
        const date = parseISO(job.posting_date);
        const weekStart = startOfWeek(date, { weekStartsOn: 1 });
        const key = format(weekStart, 'MMM d');
        
        if (!weeks.has(key)) {
          weeks.set(key, { weekStart, count: 0 });
        }
        weeks.get(key)!.count++;
      } catch {}
    });

    const result = Array.from(weeks.entries())
      .map(([week, data]) => ({ week, ...data, cumulative: 0 }))
      .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());

    // Calculate cumulative
    let cumulative = 0;
    result.forEach(w => {
      cumulative += w.count;
      w.cumulative = cumulative;
    });

    return result;
  }

  // ============ WORKFORCE METRICS ============

  private generateWorkforceMetrics(): WorkforceMetrics {
    const current = this.currentJobs;
    const previous = this.previousJobs;
    const market = this.marketCurrent;

    const staffRatio = this.calculateStaffRatio(current);
    const previousStaffRatio = this.calculateStaffRatio(previous);
    const marketStaffRatio = this.calculateStaffRatio(market);

    const gradeDistribution = this.calculateGradeDistribution(current, previous);
    const nonStaffBreakdown = this.calculateNonStaffBreakdown(current);
    const categoryStaffPatterns = this.getCategoryStaffPatterns();

    const seniorRatio = this.calculateSeniorRatio(current);
    const previousSeniorRatio = this.calculateSeniorRatio(previous);

    return {
      staffRatio,
      previousStaffRatio,
      marketStaffRatio,
      staffChange: staffRatio - previousStaffRatio,
      gradeDistribution,
      nonStaffBreakdown,
      categoryStaffPatterns,
      seniorRatio,
      previousSeniorRatio
    };
  }

  private calculateGradeDistribution(current: ProcessedJobData[], previous: ProcessedJobData[]) {
    const tiers = ['Executive', 'Director', 'Senior Professional', 'Mid Professional', 'Entry Professional', 'Support', 'Consultant', 'Intern'];
    
    const countByTier = (jobs: ProcessedJobData[]) => {
      const counts: Record<string, number> = {};
      tiers.forEach(t => counts[t] = 0);
      
      jobs.forEach(job => {
        const tier = getConsolidatedTier(classifyGrade(job.up_grade).tier);
        if (tier in counts) counts[tier]++;
      });
      return counts;
    };

    const currentCounts = countByTier(current);
    const previousCounts = countByTier(previous);
    const total = current.length || 1;
    const prevTotal = previous.length || 1;

    return tiers.map(tier => ({
      tier,
      count: currentCounts[tier],
      percentage: (currentCounts[tier] / total) * 100,
      previousPercentage: (previousCounts[tier] / prevTotal) * 100,
      change: ((currentCounts[tier] / total) - (previousCounts[tier] / prevTotal)) * 100,
      color: GRADE_COLORS[tier] || '#6B7280'
    })).filter(g => g.count > 0 || g.previousPercentage > 0);
  }

  private calculateNonStaffBreakdown(jobs: ProcessedJobData[]) {
    const nonStaff = jobs.filter(j => classifyGrade(j.up_grade).staffCategory !== 'Staff');
    const total = nonStaff.length || 1;

    const types = ['Consultant', 'Intern', 'UNV', 'Other'];
    const counts: Record<string, number> = {};
    types.forEach(t => counts[t] = 0);

    nonStaff.forEach(job => {
      const analysis = classifyGrade(job.up_grade);
      if (analysis.tier === 'Consultant') counts['Consultant']++;
      else if (analysis.tier === 'Intern') counts['Intern']++;
      else counts['Other']++;
    });

    return types
      .filter(type => counts[type] > 0)
      .map(type => ({
        type,
        count: counts[type],
        percentage: (counts[type] / total) * 100
      }));
  }

  private getCategoryStaffPatterns(): WorkforceMetrics['categoryStaffPatterns'] {
    const current = this.currentJobs;
    const market = this.marketCurrent;

    // Get top categories
    const catCounts = new Map<string, number>();
    current.forEach(j => catCounts.set(j.primary_category, (catCounts.get(j.primary_category) || 0) + 1));

    const topCats = Array.from(catCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([cat]) => cat);

    return topCats.map(category => {
      const yourJobs = current.filter(j => j.primary_category === category);
      const marketJobs = market.filter(j => j.primary_category === category);

      // Find top competitor in this category
      const competitorCounts = new Map<string, ProcessedJobData[]>();
      marketJobs.forEach(j => {
        const agency = j.short_agency || j.long_agency;
        if (agency && agency !== this.agencyName) {
          if (!competitorCounts.has(agency)) competitorCounts.set(agency, []);
          competitorCounts.get(agency)!.push(j);
        }
      });

      const topCompetitorEntry = Array.from(competitorCounts.entries())
        .sort((a, b) => b[1].length - a[1].length)[0];

      const yourStaffPct = this.calculateStaffRatio(yourJobs);
      const marketStaffPct = this.calculateStaffRatio(marketJobs);
      const competitorStaffPct = topCompetitorEntry ? this.calculateStaffRatio(topCompetitorEntry[1]) : 0;

      return {
        category,
        categoryName: formatCategoryName(category),
        yourStaffPct,
        marketStaffPct,
        topCompetitor: topCompetitorEntry?.[0] || 'N/A',
        competitorStaffPct,
        gap: yourStaffPct - competitorStaffPct,
        jobCount: yourJobs.length
      };
    });
  }

  // ============ GEOGRAPHIC METRICS ============

  private generateGeographicMetrics(): GeographicMetrics {
    const current = this.currentJobs;
    const previous = this.previousJobs;
    const market = this.marketCurrent;

    const fieldRatio = this.calculateFieldRatio(current);
    const previousFieldRatio = this.calculateFieldRatio(previous);
    const marketFieldRatio = this.calculateFieldRatio(market);

    const locationTypeDistribution = this.calculateLocationTypeDistribution(current, previous);
    const topLocations = this.calculateTopLocations(current, previous);
    const regionDistribution = this.calculateRegionDistribution(current, previous);
    const categoryFieldPatterns = this.getCategoryFieldPatterns();
    const gradeByLocationType = this.calculateGradeByLocationType(current);
    const newLocations = this.findNewLocations(current, this.historicalJobs);

    return {
      fieldRatio,
      previousFieldRatio,
      marketFieldRatio,
      locationTypeDistribution,
      topLocations,
      regionDistribution,
      categoryFieldPatterns,
      gradeByLocationType,
      newLocations
    };
  }

  private calculateLocationTypeDistribution(current: ProcessedJobData[], previous: ProcessedJobData[]) {
    // Map ProcessedJobData location_type values to display names
    const typeMapping: Record<string, string> = {
      'Field': 'Field',
      'Headquarters': 'Headquarters',
      'Regional': 'Regional Hub',
      'Regional Hub': 'Regional Hub',
      'Home-based': 'Home-based'
    };
    
    // Major UN Headquarters locations
    const hqLocations = [
      'new york', 'geneva', 'vienna', 'rome', 'paris', 
      'washington', 'the hague', 'montreal', 'bonn'
    ];
    
    // Regional hubs / offices
    const regionalHubLocations = [
      'nairobi', 'bangkok', 'santiago', 'addis ababa', 'beirut',
      'amman', 'dakar', 'johannesburg', 'panama', 'cairo'
    ];
    const regionalIndicators = ['regional', 'hub', 'multi-country', 'sub-regional'];
    
    const displayTypes = ['Field', 'Headquarters', 'Regional Hub', 'Home-based'];
    
    const countByType = (jobs: ProcessedJobData[]) => {
      const counts: Record<string, number> = {};
      displayTypes.forEach(t => counts[t] = 0);
      jobs.forEach(j => {
        const dutyStation = (j.duty_station || '').toLowerCase();
        let type: string;
        
        // Priority 1: Home-based detection (check first, most specific)
        if (j.is_home_based || 
            dutyStation.includes('home') ||
            dutyStation.includes('remote') ||
            dutyStation.includes('telecommuting') ||
            dutyStation.includes('work from')) {
          type = 'Home-based';
        }
        // Priority 2: Headquarters detection - ALWAYS check duty_station
        else if (hqLocations.some(hq => dutyStation.includes(hq))) {
          type = 'Headquarters';
        }
        // Priority 3: Regional hub detection
        else if (regionalHubLocations.some(hub => dutyStation.includes(hub)) ||
                 regionalIndicators.some(r => dutyStation.includes(r))) {
          type = 'Regional';
        }
        // Default: Field
        else {
          type = 'Field';
        }
        
        // Map to display type
        const displayType = typeMapping[type] || 'Field';
        counts[displayType]++;
      });
      return counts;
    };

    const currentCounts = countByType(current);
    const previousCounts = countByType(previous);
    const total = current.length || 1;
    const prevTotal = previous.length || 1;

    return displayTypes.map(type => ({
      type,
      count: currentCounts[type],
      percentage: (currentCounts[type] / total) * 100,
      previousPercentage: (previousCounts[type] / prevTotal) * 100,
      change: ((currentCounts[type] / total) - (previousCounts[type] / prevTotal)) * 100,
      color: LOCATION_COLORS[type]
    }));
  }

  private calculateTopLocations(current: ProcessedJobData[], previous: ProcessedJobData[]) {
    const counts = new Map<string, { country: string; count: number }>();
    current.forEach(j => {
      const loc = j.duty_station || j.duty_country || 'Unknown';
      if (!counts.has(loc)) counts.set(loc, { country: j.duty_country || '', count: 0 });
      counts.get(loc)!.count++;
    });

    const prevCounts = new Map<string, number>();
    previous.forEach(j => {
      const loc = j.duty_station || j.duty_country || 'Unknown';
      prevCounts.set(loc, (prevCounts.get(loc) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([location, data]) => ({
        location,
        country: data.country,
        count: data.count,
        previousCount: prevCounts.get(location) || 0,
        change: data.count - (prevCounts.get(location) || 0)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }

  private calculateRegionDistribution(current: ProcessedJobData[], previous: ProcessedJobData[]) {
    const regions = new Map<string, number>();
    
    // Helper to normalize region names
    const normalizeRegion = (job: ProcessedJobData): string => {
      // Try duty_continent first as it's more reliable
      let region = job.duty_continent;
      
      // Map common continent values to cleaner names
      const continentMap: Record<string, string> = {
        'africa': 'Africa',
        'asia': 'Asia-Pacific',
        'europe': 'Europe',
        'north america': 'Americas',
        'south america': 'Americas',
        'americas': 'Americas',
        'oceania': 'Asia-Pacific',
        'middle east': 'Middle East',
        'global': 'Global/Multiple',
        'multiple': 'Global/Multiple'
      };
      
      if (region) {
        const normalized = continentMap[region.toLowerCase()];
        if (normalized) return normalized;
        // If not mapped but has value, return as-is with first letter capitalized
        return region.charAt(0).toUpperCase() + region.slice(1).toLowerCase();
      }
      
      // Fall back to geographic_region
      if (job.geographic_region && job.geographic_region !== 'Unknown') {
        return job.geographic_region;
      }
      
      // Try to infer from duty_country or duty_station
      if (job.duty_station) {
        const station = job.duty_station.toLowerCase();
        if (station.includes('new york') || station.includes('washington')) return 'Americas';
        if (station.includes('geneva') || station.includes('vienna') || station.includes('rome')) return 'Europe';
        if (station.includes('nairobi') || station.includes('addis')) return 'Africa';
        if (station.includes('bangkok')) return 'Asia-Pacific';
        if (station.includes('home') || station.includes('remote')) return 'Global/Multiple';
      }
      
      return 'Other';
    };
    
    current.forEach(j => {
      const region = normalizeRegion(j);
      regions.set(region, (regions.get(region) || 0) + 1);
    });

    const prevRegions = new Map<string, number>();
    previous.forEach(j => {
      const region = normalizeRegion(j);
      prevRegions.set(region, (prevRegions.get(region) || 0) + 1);
    });

    const total = current.length || 1;
    const prevTotal = previous.length || 1;

    return Array.from(regions.entries())
      .map(([region, count]) => ({
        region,
        count,
        percentage: (count / total) * 100,
        previousPercentage: ((prevRegions.get(region) || 0) / prevTotal) * 100
      }))
      .filter(r => r.region !== 'Other' || r.count > 10) // Filter out small 'Other' bucket
      .sort((a, b) => b.count - a.count);
  }

  private getCategoryFieldPatterns(): GeographicMetrics['categoryFieldPatterns'] {
    const current = this.currentJobs;
    const market = this.marketCurrent;

    const catCounts = new Map<string, number>();
    current.forEach(j => catCounts.set(j.primary_category, (catCounts.get(j.primary_category) || 0) + 1));

    const topCats = Array.from(catCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([cat]) => cat);

    return topCats.map(category => {
      const yourJobs = current.filter(j => j.primary_category === category);
      const marketJobs = market.filter(j => j.primary_category === category);

      return {
        category,
        categoryName: formatCategoryName(category),
        yourFieldPct: this.calculateFieldRatio(yourJobs),
        marketFieldPct: this.calculateFieldRatio(marketJobs),
        difference: this.calculateFieldRatio(yourJobs) - this.calculateFieldRatio(marketJobs)
      };
    });
  }

  private calculateGradeByLocationType(jobs: ProcessedJobData[]): GeographicMetrics['gradeByLocationType'] {
    const types = ['Field', 'Headquarters', 'Regional Hub', 'Home-based'];

    return types.map(locationType => {
      const typeJobs = jobs.filter(j => (j.location_type || 'Field') === locationType);
      if (typeJobs.length === 0) return { locationType, seniorPct: 0, midPct: 0, juniorPct: 0 };

      const senior = typeJobs.filter(j => {
        const tier = getConsolidatedTier(classifyGrade(j.up_grade).tier);
        return ['Executive', 'Director', 'Senior Professional'].includes(tier);
      }).length;

      const junior = typeJobs.filter(j => {
        const tier = getConsolidatedTier(classifyGrade(j.up_grade).tier);
        return ['Entry Professional', 'Support', 'Intern'].includes(tier);
      }).length;

      const mid = typeJobs.length - senior - junior;

      return {
        locationType,
        seniorPct: (senior / typeJobs.length) * 100,
        midPct: (mid / typeJobs.length) * 100,
        juniorPct: (junior / typeJobs.length) * 100
      };
    }).filter(t => t.seniorPct + t.midPct + t.juniorPct > 0);
  }

  private findNewLocations(current: ProcessedJobData[], historical: ProcessedJobData[]): string[] {
    const historicalLocs = new Set(historical.map(j => j.duty_station?.toLowerCase()).filter(Boolean));
    const newLocs = new Set<string>();
    
    current.forEach(j => {
      if (j.duty_station && !historicalLocs.has(j.duty_station.toLowerCase())) {
        newLocs.add(j.duty_station);
      }
    });

    return Array.from(newLocs).slice(0, 10);
  }

  // ============ CATEGORY METRICS ============

  private generateCategoryMetrics(): CategoryMetrics {
    const current = this.currentJobs;
    const previous = this.previousJobs;
    const market = this.marketCurrent;

    const topCategories = this.getTopCategoriesDetailed(current, previous, market);
    const fastestGrowing = this.getFastestGrowing(current, previous);
    const declining = this.getDeclining(current, previous);
    const concentration = this.calculateConcentration(current, previous);
    const applicationWindows = this.getApplicationWindows(current, market);
    const competitivePosition = this.getCompetitivePosition(market);

    return {
      topCategories,
      fastestGrowing,
      declining,
      concentration,
      applicationWindows,
      competitivePosition
    };
  }

  private getTopCategoriesDetailed(current: ProcessedJobData[], previous: ProcessedJobData[], market: ProcessedJobData[]): CategoryMetrics['topCategories'] {
    const currentCounts = new Map<string, number>();
    current.forEach(j => currentCounts.set(j.primary_category, (currentCounts.get(j.primary_category) || 0) + 1));

    const previousCounts = new Map<string, number>();
    previous.forEach(j => previousCounts.set(j.primary_category, (previousCounts.get(j.primary_category) || 0) + 1));

    const total = current.length || 1;

    return Array.from(currentCounts.entries())
      .map(([id, count]) => {
        const prevCount = previousCounts.get(id) || 0;
        const growthRate = prevCount > 0 ? ((count - prevCount) / prevCount) * 100 : (count > 0 ? 100 : 0);
        const { leader, leaderShare, yourRank, yourShare } = this.getCategoryLeaderInfo(market, id);

        return {
          id,
          name: formatCategoryName(id),
          count,
          percentage: (count / total) * 100,
          previousCount: prevCount,
          growthRate,
          marketLeader: leader,
          leaderShare,
          yourRank,
          yourShare,
          gapToLeader: leaderShare - yourShare
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getCategoryLeaderInfo(market: ProcessedJobData[], category: string) {
    const categoryJobs = market.filter(j => j.primary_category === category);
    const agencyCounts = new Map<string, number>();
    
    categoryJobs.forEach(j => {
      const agency = j.short_agency || j.long_agency;
      if (agency) agencyCounts.set(agency, (agencyCounts.get(agency) || 0) + 1);
    });

    const sorted = Array.from(agencyCounts.entries()).sort((a, b) => b[1] - a[1]);
    const total = categoryJobs.length || 1;
    const leader = sorted[0];
    const yourCount = this.agencyName ? (agencyCounts.get(this.agencyName) || 0) : 0;
    const yourRank = sorted.findIndex(([a]) => a === this.agencyName) + 1;

    return {
      leader: leader?.[0] || 'N/A',
      leaderShare: leader ? (leader[1] / total) * 100 : 0,
      yourRank: yourRank || sorted.length + 1,
      yourShare: (yourCount / total) * 100
    };
  }

  private getFastestGrowing(current: ProcessedJobData[], previous: ProcessedJobData[]): CategoryMetrics['fastestGrowing'] {
    const currentCounts = new Map<string, number>();
    const previousCounts = new Map<string, number>();
    
    current.forEach(j => currentCounts.set(j.primary_category, (currentCounts.get(j.primary_category) || 0) + 1));
    previous.forEach(j => previousCounts.set(j.primary_category, (previousCounts.get(j.primary_category) || 0) + 1));

    const allCats = new Set([...currentCounts.keys(), ...previousCounts.keys()]);

    return Array.from(allCats)
      .map(category => {
        const curr = currentCounts.get(category) || 0;
        const prev = previousCounts.get(category) || 0;
        const growthRate = prev > 0 ? ((curr - prev) / prev) * 100 : (curr > 2 ? 100 : 0);
        return { category, name: formatCategoryName(category), previousCount: prev, currentCount: curr, growthRate };
      })
      .filter(c => c.growthRate > 30 && c.currentCount >= 5)
      .sort((a, b) => b.growthRate - a.growthRate)
      .slice(0, 5);
  }

  private getDeclining(current: ProcessedJobData[], previous: ProcessedJobData[]): CategoryMetrics['declining'] {
    const currentCounts = new Map<string, number>();
    const previousCounts = new Map<string, number>();
    
    current.forEach(j => currentCounts.set(j.primary_category, (currentCounts.get(j.primary_category) || 0) + 1));
    previous.forEach(j => previousCounts.set(j.primary_category, (previousCounts.get(j.primary_category) || 0) + 1));

    return Array.from(previousCounts.entries())
      .map(([category, prev]) => {
        const curr = currentCounts.get(category) || 0;
        const declineRate = ((prev - curr) / prev) * 100;
        return { category, name: formatCategoryName(category), previousCount: prev, currentCount: curr, declineRate };
      })
      .filter(c => c.declineRate > 20 && c.previousCount >= 5)
      .sort((a, b) => b.declineRate - a.declineRate)
      .slice(0, 5);
  }

  private calculateConcentration(current: ProcessedJobData[], previous: ProcessedJobData[]) {
    const getTop3Share = (jobs: ProcessedJobData[]) => {
      const counts = new Map<string, number>();
      jobs.forEach(j => counts.set(j.primary_category, (counts.get(j.primary_category) || 0) + 1));
      const sorted = Array.from(counts.values()).sort((a, b) => b - a);
      const top3 = sorted.slice(0, 3).reduce((sum, v) => sum + v, 0);
      return (top3 / (jobs.length || 1)) * 100;
    };

    const getHerfindahl = (jobs: ProcessedJobData[]) => {
      const counts = new Map<string, number>();
      jobs.forEach(j => counts.set(j.primary_category, (counts.get(j.primary_category) || 0) + 1));
      const total = jobs.length || 1;
      return Array.from(counts.values()).reduce((sum, c) => sum + Math.pow(c / total, 2), 0) * 100;
    };

    return {
      top3Share: getTop3Share(current),
      previousTop3Share: getTop3Share(previous),
      herfindahl: getHerfindahl(current)
    };
  }

  private getApplicationWindows(current: ProcessedJobData[], market: ProcessedJobData[]): CategoryMetrics['applicationWindows'] {
    const catCounts = new Map<string, number>();
    current.forEach(j => catCounts.set(j.primary_category, (catCounts.get(j.primary_category) || 0) + 1));

    const topCats = Array.from(catCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([cat]) => cat);

    return topCats.map(category => {
      const yourJobs = current.filter(j => j.primary_category === category && j.application_window_days > 0);
      const marketJobs = market.filter(j => j.primary_category === category && j.application_window_days > 0);

      const avgWindow = yourJobs.length > 0 
        ? yourJobs.reduce((sum, j) => sum + j.application_window_days, 0) / yourJobs.length 
        : 0;
      const marketAvg = marketJobs.length > 0 
        ? marketJobs.reduce((sum, j) => sum + j.application_window_days, 0) / marketJobs.length 
        : 0;

      const diff = avgWindow - marketAvg;
      let assessment = 'Normal';
      if (diff < -3) assessment = 'Faster than market';
      else if (diff > 3) assessment = 'Slower than market';

      return {
        category,
        name: formatCategoryName(category),
        avgWindow,
        marketAvg,
        difference: diff,
        assessment
      };
    });
  }

  private getCompetitivePosition(market: ProcessedJobData[]): CategoryMetrics['competitivePosition'] {
    const categories = new Map<string, number>();
    market.forEach(j => categories.set(j.primary_category, (categories.get(j.primary_category) || 0) + 1));

    const topCats = Array.from(categories.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    return topCats.map(([category, totalJobs]) => {
      const agencyCounts = new Map<string, number>();
      market.filter(j => j.primary_category === category).forEach(j => {
        const agency = j.short_agency || j.long_agency;
        if (agency) agencyCounts.set(agency, (agencyCounts.get(agency) || 0) + 1);
      });

      const sorted = Array.from(agencyCounts.entries()).sort((a, b) => b[1] - a[1]);
      const [leader, leaderCount] = sorted[0] || ['N/A', 0];
      const [second, secondCount] = sorted[1] || ['N/A', 0];

      return {
        category,
        name: formatCategoryName(category),
        totalJobs,
        leader,
        leaderShare: (leaderCount / totalJobs) * 100,
        second,
        secondShare: (secondCount / totalJobs) * 100,
        gap: ((leaderCount - secondCount) / totalJobs) * 100
      };
    });
  }

  // ============ COMPETITIVE METRICS ============

  private generateCompetitiveMetrics(): CompetitorMetrics {
    const market = this.marketCurrent;
    const prevMarket = this.marketPrevious;

    const marketShare = this.getMarketShare(market, prevMarket);
    const { rank, total } = this.agencyName 
      ? this.calculateRank(market, this.agencyName)
      : { rank: 0, total: 0 };
    const prevRank = this.agencyName 
      ? this.calculateRank(prevMarket, this.agencyName).rank 
      : 0;

    const correlations = this.calculateCorrelations(market);
    const categoryLeadership = this.getCategoryLeadership();
    const newEntrants = this.detectNewEntrants(market, prevMarket);
    const behavioralComparison = this.generateBehavioralComparison(market);

    return {
      marketShare,
      yourRank: rank,
      previousRank: prevRank,
      rankChange: prevRank - rank,
      totalAgencies: total,
      correlations,
      categoryLeadership,
      newEntrants,
      behavioralComparison
    };
  }

  private getMarketShare(market: ProcessedJobData[], prevMarket: ProcessedJobData[]): CompetitorMetrics['marketShare'] {
    const agencyCounts = new Map<string, ProcessedJobData[]>();
    market.forEach(j => {
      const agency = j.short_agency || j.long_agency;
      if (agency) {
        if (!agencyCounts.has(agency)) agencyCounts.set(agency, []);
        agencyCounts.get(agency)!.push(j);
      }
    });

    const prevCounts = new Map<string, number>();
    prevMarket.forEach(j => {
      const agency = j.short_agency || j.long_agency;
      if (agency) prevCounts.set(agency, (prevCounts.get(agency) || 0) + 1);
    });

    const total = market.length || 1;
    const prevTotal = prevMarket.length || 1;

    return Array.from(agencyCounts.entries())
      .map(([agency, jobs]) => {
        const prevCount = prevCounts.get(agency) || 0;
        const share = (jobs.length / total) * 100;
        const prevShare = (prevCount / prevTotal) * 100;

        return {
          agency,
          positions: jobs.length,
          share,
          previousShare: prevShare,
          shareChange: share - prevShare,
          staffPct: this.calculateStaffRatio(jobs),
          seniorPct: this.calculateSeniorRatio(jobs),
          fieldPct: this.calculateFieldRatio(jobs),
          avgWindow: this.calculateAvgWindow(jobs),
          isYou: agency === this.agencyName
        };
      })
      .sort((a, b) => b.positions - a.positions)
      .slice(0, 15);
  }

  private calculateCorrelations(market: ProcessedJobData[]): CompetitorMetrics['correlations'] {
    const agencyCategories = new Map<string, Map<string, number>>();
    
    market.forEach(j => {
      const agency = j.short_agency || j.long_agency;
      if (!agency) return;
      
      if (!agencyCategories.has(agency)) agencyCategories.set(agency, new Map());
      const cats = agencyCategories.get(agency)!;
      cats.set(j.primary_category, (cats.get(j.primary_category) || 0) + 1);
    });

    const agencies = Array.from(agencyCategories.keys());
    const correlations: CompetitorMetrics['correlations'] = [];

    // Only calculate for top agencies
    const agencyCounts = new Map<string, number>();
    market.forEach(j => {
      const agency = j.short_agency || j.long_agency;
      if (agency) agencyCounts.set(agency, (agencyCounts.get(agency) || 0) + 1);
    });
    
    const topAgencies = Array.from(agencyCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([a]) => a);

    for (let i = 0; i < topAgencies.length; i++) {
      for (let j = i + 1; j < topAgencies.length; j++) {
        const a1 = topAgencies[i];
        const a2 = topAgencies[j];
        const cats1 = agencyCategories.get(a1)!;
        const cats2 = agencyCategories.get(a2)!;

        const allCats = new Set([...cats1.keys(), ...cats2.keys()]);
        const vec1: number[] = [];
        const vec2: number[] = [];
        const total1 = Array.from(cats1.values()).reduce((s, v) => s + v, 0);
        const total2 = Array.from(cats2.values()).reduce((s, v) => s + v, 0);

        allCats.forEach(cat => {
          vec1.push((cats1.get(cat) || 0) / total1);
          vec2.push((cats2.get(cat) || 0) / total2);
        });

        const corr = this.pearsonCorrelation(vec1, vec2);
        
        let interpretation = 'Minimal overlap';
        if (corr > 0.8) interpretation = 'Strong competition for similar roles';
        else if (corr > 0.6) interpretation = 'Moderate overlap in hiring';
        else if (corr > 0.4) interpretation = 'Some shared focus areas';

        if (corr > 0.4) {
          correlations.push({ agency1: a1, agency2: a2, correlation: corr, interpretation });
        }
      }
    }

    return correlations.sort((a, b) => b.correlation - a.correlation).slice(0, 6);
  }

  private pearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    if (n === 0) return 0;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumX2 = x.reduce((a, b) => a + b * b, 0);
    const sumY2 = y.reduce((a, b) => a + b * b, 0);

    const num = n * sumXY - sumX * sumY;
    const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return den === 0 ? 0 : num / den;
  }

  private getCategoryLeadership(): CompetitorMetrics['categoryLeadership'] {
    const market = this.marketCurrent;
    const categories = new Map<string, number>();
    market.forEach(j => categories.set(j.primary_category, (categories.get(j.primary_category) || 0) + 1));

    const topCats = Array.from(categories.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    return topCats.map(([category]) => {
      const catJobs = market.filter(j => j.primary_category === category);
      const agencyCounts = new Map<string, number>();
      
      catJobs.forEach(j => {
        const agency = j.short_agency || j.long_agency;
        if (agency) agencyCounts.set(agency, (agencyCounts.get(agency) || 0) + 1);
      });

      const sorted = Array.from(agencyCounts.entries()).sort((a, b) => b[1] - a[1]);
      const [leader, leaderCount] = sorted[0] || ['N/A', 0];
      const yourCount = this.agencyName ? (agencyCounts.get(this.agencyName) || 0) : 0;
      const yourPosition = sorted.findIndex(([a]) => a === this.agencyName) + 1;

      return {
        category,
        name: formatCategoryName(category),
        leader,
        leaderShare: (leaderCount / catJobs.length) * 100,
        yourPosition: yourPosition || sorted.length + 1,
        yourShare: (yourCount / catJobs.length) * 100
      };
    });
  }

  private detectNewEntrants(market: ProcessedJobData[], prevMarket: ProcessedJobData[]): CompetitorMetrics['newEntrants'] {
    const currentCatAgencies = new Map<string, Set<string>>();
    market.forEach(j => {
      const agency = j.short_agency || j.long_agency;
      if (!agency) return;
      if (!currentCatAgencies.has(j.primary_category)) currentCatAgencies.set(j.primary_category, new Set());
      currentCatAgencies.get(j.primary_category)!.add(agency);
    });

    const prevCatAgencies = new Map<string, Set<string>>();
    prevMarket.forEach(j => {
      const agency = j.short_agency || j.long_agency;
      if (!agency) return;
      if (!prevCatAgencies.has(j.primary_category)) prevCatAgencies.set(j.primary_category, new Set());
      prevCatAgencies.get(j.primary_category)!.add(agency);
    });

    const newEntrants: CompetitorMetrics['newEntrants'] = [];

    currentCatAgencies.forEach((agencies, category) => {
      const prevAgencies = prevCatAgencies.get(category) || new Set();
      
      agencies.forEach(agency => {
        if (!prevAgencies.has(agency)) {
          const count = market.filter(j => 
            (j.short_agency || j.long_agency) === agency && 
            j.primary_category === category
          ).length;

          if (count >= 5) {
            newEntrants.push({
              agency,
              category,
              categoryName: formatCategoryName(category),
              positions: count,
              description: `New entry with ${count} positions`
            });
          }
        }
      });
    });

    return newEntrants.sort((a, b) => b.positions - a.positions).slice(0, 6);
  }

  private generateBehavioralComparison(market: ProcessedJobData[]): CompetitorMetrics['behavioralComparison'] {
    const agencyCounts = new Map<string, ProcessedJobData[]>();
    market.forEach(j => {
      const agency = j.short_agency || j.long_agency;
      if (agency) {
        if (!agencyCounts.has(agency)) agencyCounts.set(agency, []);
        agencyCounts.get(agency)!.push(j);
      }
    });

    const topAgencies = Array.from(agencyCounts.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 5);

    return topAgencies.map(([agency, jobs]) => {
      const staffPct = this.calculateStaffRatio(jobs);
      const fieldPct = this.calculateFieldRatio(jobs);
      const avgWindow = this.calculateAvgWindow(jobs);
      const share = (jobs.length / market.length) * 100;

      let comparison = `${agency} (${share.toFixed(0)}% share): `;
      comparison += `${formatPercent(staffPct)} staff, `;
      comparison += `${formatPercent(fieldPct)} field, `;
      comparison += `${avgWindow.toFixed(0)}d avg window`;

      return { agency, comparison };
    });
  }

  // ============ SIGNALS ============

  private generateSignals(): Signal[] {
    const signals: Signal[] = [];
    const current = this.currentJobs;
    const previous = this.previousJobs;
    const market = this.marketCurrent;

    // Senior hiring change
    const seniorRatio = this.calculateSeniorRatio(current);
    const historicalSenior = this.calculateSeniorRatio(this.historicalJobs);
    if (Math.abs(seniorRatio - historicalSenior) > 4) {
      signals.push({
        type: 'trend',
        icon: '📈',
        signal: `Senior hiring (P5+) at ${formatPercent(seniorRatio)} vs ${formatPercent(historicalSenior)} historical`,
        interpretation: seniorRatio > historicalSenior 
          ? 'Leadership expansion or refresh underway' 
          : 'System shifting to junior/mid pipeline',
        severity: Math.abs(seniorRatio - historicalSenior) > 6 ? 'high' : 'medium'
      });
    }

    // Short windows
    const shortWindowPct = current.filter(j => j.application_window_days > 0 && j.application_window_days < 10).length / (current.length || 1) * 100;
    const marketShortPct = market.filter(j => j.application_window_days > 0 && j.application_window_days < 10).length / (market.length || 1) * 100;
    
    if (shortWindowPct > 30 || (this.agencyName && shortWindowPct > marketShortPct * 1.5)) {
      signals.push({
        type: 'risk',
        icon: '⚠️',
        signal: `${formatPercent(shortWindowPct)} of positions have <10 day windows`,
        interpretation: 'May indicate planning gaps or surge mode',
        severity: shortWindowPct > 40 ? 'high' : 'medium'
      });
    }

    // Home-based growth
    const homeBasedPct = current.filter(j => j.location_type === 'Home-based').length / (current.length || 1) * 100;
    const prevHomeBasedPct = previous.filter(j => j.location_type === 'Home-based').length / (previous.length || 1) * 100;
    
    if (homeBasedPct > 8 && homeBasedPct > prevHomeBasedPct * 1.5) {
      signals.push({
        type: 'geographic',
        icon: '🌍',
        signal: `Home-based positions grew to ${formatPercent(homeBasedPct)} of hiring`,
        interpretation: 'Post-pandemic work model shift continuing',
        severity: 'medium'
      });
    }

    // Competitor moves
    if (this.agencyName) {
      const newEntrants = this.detectNewEntrants(market, this.marketPrevious);
      newEntrants.slice(0, 2).forEach(entry => {
        signals.push({
          type: 'competitor',
          icon: '🔔',
          signal: `${entry.agency} entered ${entry.categoryName} with ${entry.positions} positions`,
          interpretation: 'New competitor in category',
          severity: entry.positions > 20 ? 'high' : 'medium'
        });
      });
    }

    // Category decline
    const declining = this.getDeclining(current, previous);
    if (declining.length > 0 && declining[0].declineRate > 30) {
      signals.push({
        type: 'trend',
        icon: '📊',
        signal: `${declining[0].name} declined ${declining[0].declineRate.toFixed(0)}% from prior period`,
        interpretation: 'Review if strategic or transitional',
        severity: 'medium'
      });
    }

    // Staff ratio anomaly
    const staffRatio = this.calculateStaffRatio(current);
    const historicalStaff = this.calculateStaffRatio(this.historicalJobs);
    
    if (Math.abs(staffRatio - historicalStaff) > 12) {
      signals.push({
        type: 'anomaly',
        icon: '📊',
        signal: `Staff ratio at ${formatPercent(staffRatio)} vs ${formatPercent(historicalStaff)} historical`,
        interpretation: staffRatio > historicalStaff 
          ? 'Shift toward permanent capacity' 
          : 'Increasing consultant reliance',
        severity: 'medium'
      });
    }

    return signals.slice(0, 8);
  }

  // ============ HELPER CALCULATIONS ============

  private calculateRank(market: ProcessedJobData[], agency: string): { rank: number; total: number } {
    const counts = new Map<string, number>();
    market.forEach(j => {
      const a = j.short_agency || j.long_agency;
      if (a) counts.set(a, (counts.get(a) || 0) + 1);
    });

    const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    const rank = sorted.findIndex(([a]) => a === agency) + 1;
    return { rank: rank || sorted.length + 1, total: sorted.length };
  }

  private calculateStaffRatio(jobs: ProcessedJobData[]): number {
    if (jobs.length === 0) return 0;
    const staff = jobs.filter(j => classifyGrade(j.up_grade).staffCategory === 'Staff').length;
    return (staff / jobs.length) * 100;
  }

  private calculateFieldRatio(jobs: ProcessedJobData[]): number {
    if (jobs.length === 0) return 0;
    const field = jobs.filter(j => {
      // Check location_type - handle 'Field' and fallback for unmapped
      const locType = j.location_type;
      if (locType === 'Field') return true;
      
      // Also exclude known HQ/Regional/Home-based to catch unmapped Field positions
      if (locType === 'Headquarters' || locType === 'Regional' || locType === 'Home-based') return false;
      if (j.is_home_based) return false;
      
      // For jobs without location_type, check duty_station for HQ indicators
      const station = (j.duty_station || '').toLowerCase();
      if (station.includes('new york') || station.includes('geneva') || 
          station.includes('vienna') || station.includes('rome') ||
          station.includes('home') || station.includes('remote')) {
        return false;
      }
      
      // Default to field if no HQ indicators found
      return true;
    }).length;
    return (field / jobs.length) * 100;
  }

  private calculateSeniorRatio(jobs: ProcessedJobData[]): number {
    if (jobs.length === 0) return 0;
    const senior = jobs.filter(j => {
      const tier = getConsolidatedTier(classifyGrade(j.up_grade).tier);
      return ['Executive', 'Director', 'Senior Professional'].includes(tier);
    }).length;
    return (senior / jobs.length) * 100;
  }

  private calculateAvgWindow(jobs: ProcessedJobData[]): number {
    const valid = jobs.filter(j => j.application_window_days > 0 && j.application_window_days < 120);
    if (valid.length === 0) return 14;
    return valid.reduce((sum, j) => sum + j.application_window_days, 0) / valid.length;
  }

  private getTopCategories(jobs: ProcessedJobData[]) {
    const counts = new Map<string, number>();
    jobs.forEach(j => counts.set(j.primary_category, (counts.get(j.primary_category) || 0) + 1));
    
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id, count]) => ({ id, name: formatCategoryName(id), count }));
  }

  private getTopCompetitors() {
    const market = this.marketCurrent;
    const counts = new Map<string, ProcessedJobData[]>();
    
    market.forEach(j => {
      const agency = j.short_agency || j.long_agency;
      if (agency) {
        if (!counts.has(agency)) counts.set(agency, []);
        counts.get(agency)!.push(j);
      }
    });

    return Array.from(counts.entries())
      .map(([agency, jobs]) => ({
        agency,
        count: jobs.length,
        share: (jobs.length / market.length) * 100,
        staffPct: this.calculateStaffRatio(jobs)
      }))
      .sort((a, b) => b.count - a.count);
  }
}

// Export singleton
export const briefEngine = new IntelligenceBriefEngine();

