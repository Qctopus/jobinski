/**
 * Anomaly Detector
 * 
 * Detects statistical anomalies and unusual patterns in hiring data.
 * Identifies volume spikes, pattern breaks, competitor signals, and cross-dimensional outliers.
 */

import { ProcessedJobData } from '../../types';
import { classifyGrade, getConsolidatedTier } from '../../utils/gradeClassification';
import { parseISO, format, differenceInDays, getDay } from 'date-fns';
import { AnomalySignal } from './IntelligenceInsightsEngine';

// ============ TYPES ============

export type AnomalyType = 'volume' | 'pattern' | 'competitor' | 'cross-dimensional' | 'timing' | 'gap';
export type AnomalySeverity = 'critical' | 'high' | 'medium' | 'low';

export interface StatisticalProfile {
  mean: number;
  stdDev: number;
  median: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
}

export interface AnomalyContext {
  historicalAvg: number;
  currentValue: number;
  zScore: number;
  percentile: number;
}

// Icons for different anomaly types
const ANOMALY_ICONS: Record<AnomalyType, string> = {
  'volume': '📊',
  'pattern': '📈',
  'competitor': '🔔',
  'cross-dimensional': '🔴',
  'timing': '⏱️',
  'gap': '⚠️'
};

// ============ STATISTICAL HELPERS ============

function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function calculateStdDev(values: number[], mean?: number): number {
  if (values.length < 2) return 0;
  const m = mean ?? calculateMean(values);
  const squaredDiffs = values.map(v => Math.pow(v - m, 2));
  return Math.sqrt(squaredDiffs.reduce((sum, v) => sum + v, 0) / (values.length - 1));
}

function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function calculatePercentile(values: number[], value: number): number {
  if (values.length === 0) return 50;
  const sorted = [...values].sort((a, b) => a - b);
  const below = sorted.filter(v => v < value).length;
  return (below / sorted.length) * 100;
}

function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

function getStatisticalProfile(values: number[]): StatisticalProfile {
  const sorted = [...values].sort((a, b) => a - b);
  const mean = calculateMean(values);
  const stdDev = calculateStdDev(values, mean);
  const median = calculateMedian(values);
  const q1 = sorted[Math.floor(sorted.length * 0.25)] || 0;
  const q3 = sorted[Math.floor(sorted.length * 0.75)] || 0;
  
  return {
    mean,
    stdDev,
    median,
    min: sorted[0] || 0,
    max: sorted[sorted.length - 1] || 0,
    q1,
    q3
  };
}

// ============ MAIN DETECTOR CLASS ============

export class AnomalyDetector {
  private currentJobs: ProcessedJobData[] = [];
  private previousJobs: ProcessedJobData[] = [];
  private historicalJobs: ProcessedJobData[] = [];
  private marketJobs: ProcessedJobData[] = [];
  private filterAgency: string | null = null;
  
  /**
   * Initialize detector with job data
   */
  initialize(
    currentJobs: ProcessedJobData[],
    previousJobs: ProcessedJobData[],
    historicalJobs: ProcessedJobData[], // 12 months
    marketJobs: ProcessedJobData[], // All agencies for current period
    filterAgency?: string
  ): void {
    this.currentJobs = currentJobs;
    this.previousJobs = previousJobs;
    this.historicalJobs = historicalJobs;
    this.marketJobs = marketJobs;
    this.filterAgency = filterAgency || null;
  }
  
  /**
   * Detect all anomalies
   */
  detectAllAnomalies(): AnomalySignal[] {
    const anomalies: AnomalySignal[] = [];
    
    // Volume anomalies
    anomalies.push(...this.detectVolumeAnomalies());
    
    // Pattern break anomalies
    anomalies.push(...this.detectPatternBreaks());
    
    // Competitor signals
    anomalies.push(...this.detectCompetitorSignals());
    
    // Cross-dimensional outliers
    anomalies.push(...this.detectCrossDimensionalOutliers());
    
    // Timing anomalies
    anomalies.push(...this.detectTimingAnomalies());
    
    // Gap signals
    anomalies.push(...this.detectGapSignals());
    
    // Sort by severity and return top anomalies
    return this.sortAndFilterAnomalies(anomalies);
  }
  
  // ============ VOLUME ANOMALIES ============
  
  private detectVolumeAnomalies(): AnomalySignal[] {
    const anomalies: AnomalySignal[] = [];
    
    // Category volume anomalies
    const categoryCounts = new Map<string, number>();
    this.currentJobs.forEach(job => {
      categoryCounts.set(job.primary_category, (categoryCounts.get(job.primary_category) || 0) + 1);
    });
    
    // Historical category averages
    const historicalCategoryCounts = new Map<string, number[]>();
    this.historicalJobs.forEach(job => {
      if (!historicalCategoryCounts.has(job.primary_category)) {
        historicalCategoryCounts.set(job.primary_category, []);
      }
    });
    
    // Check for unusual category volumes
    categoryCounts.forEach((count, category) => {
      const historicalCounts = historicalCategoryCounts.get(category) || [];
      if (historicalCounts.length > 0) {
        const profile = getStatisticalProfile(historicalCounts);
        const zScore = calculateZScore(count, profile.mean, profile.stdDev);
        
        if (Math.abs(zScore) > 2) {
          anomalies.push({
            id: `vol-cat-${category}`,
            type: 'volume',
            severity: Math.abs(zScore) > 3 ? 'high' : 'medium',
            icon: ANOMALY_ICONS.volume,
            title: `Unusual ${category} volume`,
            description: `${count} positions in ${category} is ${zScore > 0 ? 'above' : 'below'} the historical norm`,
            metric: `${Math.abs(zScore).toFixed(1)} std deviations from average`,
            context: `Historical avg: ${profile.mean.toFixed(0)}`
          });
        }
      }
    });
    
    // Location volume anomalies
    const locationCounts = new Map<string, number>();
    this.currentJobs.forEach(job => {
      const location = job.duty_country || 'Unknown';
      locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
    });
    
    const previousLocationCounts = new Map<string, number>();
    this.previousJobs.forEach(job => {
      const location = job.duty_country || 'Unknown';
      previousLocationCounts.set(location, (previousLocationCounts.get(location) || 0) + 1);
    });
    
    // Detect sudden location spikes
    locationCounts.forEach((count, location) => {
      const prevCount = previousLocationCounts.get(location) || 0;
      if (prevCount > 0 && count > prevCount * 2.5 && count >= 5) {
        anomalies.push({
          id: `vol-loc-${location}`,
          type: 'volume',
          severity: count > prevCount * 3 ? 'high' : 'medium',
          icon: ANOMALY_ICONS.volume,
          title: `${location} hiring spike`,
          description: `${count} positions in ${location} — ${((count - prevCount) / prevCount * 100).toFixed(0)}% increase`,
          metric: `${count} vs ${prevCount} prior period`,
          context: 'Rapid expansion in this location'
        });
      }
    });
    
    // Grade tier anomalies
    const gradeCounts = new Map<string, number>();
    this.currentJobs.forEach(job => {
      const tier = getConsolidatedTier(classifyGrade(job.up_grade).tier);
      gradeCounts.set(tier, (gradeCounts.get(tier) || 0) + 1);
    });
    
    const previousGradeCounts = new Map<string, number>();
    this.previousJobs.forEach(job => {
      const tier = getConsolidatedTier(classifyGrade(job.up_grade).tier);
      previousGradeCounts.set(tier, (previousGradeCounts.get(tier) || 0) + 1);
    });
    
    // Check for unusual grade distribution shifts
    gradeCounts.forEach((count, tier) => {
      const prevCount = previousGradeCounts.get(tier) || 0;
      const currentPct = count / (this.currentJobs.length || 1) * 100;
      const prevPct = prevCount / (this.previousJobs.length || 1) * 100;
      
      if (Math.abs(currentPct - prevPct) > 10 && count >= 3) {
        anomalies.push({
          id: `vol-grade-${tier}`,
          type: 'volume',
          severity: Math.abs(currentPct - prevPct) > 15 ? 'high' : 'medium',
          icon: ANOMALY_ICONS.volume,
          title: `${tier} hiring shift`,
          description: `${tier} positions now ${currentPct.toFixed(0)}% (was ${prevPct.toFixed(0)}%)`,
          metric: `${currentPct > prevPct ? '+' : ''}${(currentPct - prevPct).toFixed(0)}pp change`,
          context: currentPct > prevPct ? 'Increasing focus on this tier' : 'Decreasing focus on this tier'
        });
      }
    });
    
    return anomalies;
  }
  
  // ============ PATTERN BREAKS ============
  
  private detectPatternBreaks(): AnomalySignal[] {
    const anomalies: AnomalySignal[] = [];
    
    // Staff/non-staff ratio change
    const currentStaffRatio = this.calculateStaffRatio(this.currentJobs);
    const previousStaffRatio = this.calculateStaffRatio(this.previousJobs);
    const historicalStaffRatio = this.calculateStaffRatio(this.historicalJobs);
    
    // Detect if current differs significantly from historical
    if (Math.abs(currentStaffRatio - historicalStaffRatio) > 15) {
      const inverted = (currentStaffRatio > 50 && historicalStaffRatio < 50) || 
                       (currentStaffRatio < 50 && historicalStaffRatio > 50);
      
      anomalies.push({
        id: 'pattern-staff-ratio',
        type: 'pattern',
        severity: inverted ? 'high' : 'medium',
        icon: ANOMALY_ICONS.pattern,
        title: inverted ? 'Staff/consultant ratio inverted' : 'Staff ratio shift',
        description: `Staff ratio now ${currentStaffRatio.toFixed(0)}% (historical avg: ${historicalStaffRatio.toFixed(0)}%)`,
        metric: `${Math.abs(currentStaffRatio - historicalStaffRatio).toFixed(0)}pp ${currentStaffRatio > historicalStaffRatio ? 'more' : 'less'} staff`,
        context: inverted ? 'First time ratio has flipped in recent history' : 'Significant deviation from normal pattern'
      });
    }
    
    // Field ratio change
    const currentFieldRatio = this.calculateFieldRatio(this.currentJobs);
    const previousFieldRatio = this.calculateFieldRatio(this.previousJobs);
    const historicalFieldRatio = this.calculateFieldRatio(this.historicalJobs);
    
    if (Math.abs(currentFieldRatio - historicalFieldRatio) > 15) {
      anomalies.push({
        id: 'pattern-field-ratio',
        type: 'pattern',
        severity: 'medium',
        icon: ANOMALY_ICONS.pattern,
        title: 'Field presence shift',
        description: `Field positions now ${currentFieldRatio.toFixed(0)}% (historical avg: ${historicalFieldRatio.toFixed(0)}%)`,
        metric: `${Math.abs(currentFieldRatio - historicalFieldRatio).toFixed(0)}pp deviation`,
        context: currentFieldRatio > historicalFieldRatio ? 'Expanding field footprint' : 'Contracting to HQ'
      });
    }
    
    // Category concentration change
    const currentConcentration = this.calculateCategoryConcentration(this.currentJobs);
    const historicalConcentration = this.calculateCategoryConcentration(this.historicalJobs);
    
    if (Math.abs(currentConcentration - historicalConcentration) > 15) {
      anomalies.push({
        id: 'pattern-concentration',
        type: 'pattern',
        severity: 'medium',
        icon: ANOMALY_ICONS.pattern,
        title: 'Category focus shift',
        description: `Top 3 categories now ${currentConcentration.toFixed(0)}% of hiring (was ${historicalConcentration.toFixed(0)}%)`,
        metric: `${Math.abs(currentConcentration - historicalConcentration).toFixed(0)}pp change`,
        context: currentConcentration > historicalConcentration ? 'More specialized hiring' : 'More diversified hiring'
      });
    }
    
    return anomalies;
  }
  
  // ============ COMPETITOR SIGNALS ============
  
  private detectCompetitorSignals(): AnomalySignal[] {
    const anomalies: AnomalySignal[] = [];
    
    if (!this.filterAgency) {
      // Market view: detect overall agency movements
      return this.detectMarketCompetitorSignals();
    }
    
    // Agency view: detect specific competitor actions
    const competitorJobs = this.marketJobs.filter(j => 
      (j.short_agency || j.long_agency) !== this.filterAgency
    );
    
    // Group competitor jobs by agency
    const agencyCounts = new Map<string, ProcessedJobData[]>();
    competitorJobs.forEach(job => {
      const agency = job.short_agency || job.long_agency || 'Unknown';
      if (!agencyCounts.has(agency)) {
        agencyCounts.set(agency, []);
      }
      agencyCounts.get(agency)!.push(job);
    });
    
    // Previous period competitor counts
    const previousAgencyCounts = new Map<string, number>();
    this.previousJobs.forEach(job => {
      const agency = job.short_agency || job.long_agency;
      if (agency && agency !== this.filterAgency) {
        previousAgencyCounts.set(agency, (previousAgencyCounts.get(agency) || 0) + 1);
      }
    });
    
    // Detect competitor spikes
    agencyCounts.forEach((jobs, agency) => {
      const currentCount = jobs.length;
      const previousCount = previousAgencyCounts.get(agency) || 0;
      
      if (previousCount > 0 && currentCount > previousCount * 2 && currentCount >= 10) {
        anomalies.push({
          id: `comp-spike-${agency}`,
          type: 'competitor',
          severity: currentCount > previousCount * 3 ? 'high' : 'medium',
          icon: ANOMALY_ICONS.competitor,
          title: `${agency} hiring surge`,
          description: `${agency} posted ${currentCount} positions (was ${previousCount})`,
          metric: `${((currentCount - previousCount) / previousCount * 100).toFixed(0)}% increase`,
          context: 'Major expansion by competitor'
        });
      }
    });
    
    // Detect new category entries by competitors
    const yourCategories = new Set<string>();
    this.currentJobs.forEach(j => yourCategories.add(j.primary_category));
    
    agencyCounts.forEach((jobs, agency) => {
      // Categories this competitor is now active in
      const competitorCategories = new Map<string, number>();
      jobs.forEach(job => {
        competitorCategories.set(job.primary_category, (competitorCategories.get(job.primary_category) || 0) + 1);
      });
      
      // Check if competitor entered any category you're active in
      competitorCategories.forEach((count, category) => {
        if (yourCategories.has(category) && count >= 5) {
          // Check if this is new activity
          const historicalInCategory = this.historicalJobs.filter(j => 
            (j.short_agency || j.long_agency) === agency && 
            j.primary_category === category
          ).length;
          
          if (historicalInCategory < 3) {
            anomalies.push({
              id: `comp-entry-${agency}-${category}`,
              type: 'competitor',
              severity: 'high',
              icon: ANOMALY_ICONS.competitor,
              title: `${agency} entered ${category}`,
              description: `${agency} posted ${count} positions in ${category} — new activity`,
              metric: `${count} positions`,
              context: 'New competitor in your category'
            });
          }
        }
      });
    });
    
    return anomalies;
  }
  
  private detectMarketCompetitorSignals(): AnomalySignal[] {
    const anomalies: AnomalySignal[] = [];
    
    // Agency volume changes
    const currentAgencyCounts = new Map<string, number>();
    this.currentJobs.forEach(job => {
      const agency = job.short_agency || job.long_agency || 'Unknown';
      currentAgencyCounts.set(agency, (currentAgencyCounts.get(agency) || 0) + 1);
    });
    
    const previousAgencyCounts = new Map<string, number>();
    this.previousJobs.forEach(job => {
      const agency = job.short_agency || job.long_agency || 'Unknown';
      previousAgencyCounts.set(agency, (previousAgencyCounts.get(agency) || 0) + 1);
    });
    
    // Find biggest movers
    const changes: { agency: string; current: number; previous: number; change: number }[] = [];
    currentAgencyCounts.forEach((current, agency) => {
      const previous = previousAgencyCounts.get(agency) || 0;
      if (previous > 0) {
        const change = ((current - previous) / previous) * 100;
        changes.push({ agency, current, previous, change });
      }
    });
    
    // Top growers
    changes.sort((a, b) => b.change - a.change);
    const topGrower = changes.find(c => c.change > 50 && c.current >= 20);
    if (topGrower) {
      anomalies.push({
        id: `market-growth-${topGrower.agency}`,
        type: 'competitor',
        severity: topGrower.change > 100 ? 'high' : 'medium',
        icon: ANOMALY_ICONS.competitor,
        title: `${topGrower.agency} hiring surge`,
        description: `${topGrower.agency} increased hiring by ${topGrower.change.toFixed(0)}%`,
        metric: `${topGrower.current} positions (was ${topGrower.previous})`,
        context: 'Major market movement'
      });
    }
    
    // Top decliners
    changes.sort((a, b) => a.change - b.change);
    const topDecliner = changes.find(c => c.change < -40 && c.previous >= 20);
    if (topDecliner) {
      anomalies.push({
        id: `market-decline-${topDecliner.agency}`,
        type: 'competitor',
        severity: topDecliner.change < -60 ? 'high' : 'medium',
        icon: ANOMALY_ICONS.competitor,
        title: `${topDecliner.agency} hiring drop`,
        description: `${topDecliner.agency} decreased hiring by ${Math.abs(topDecliner.change).toFixed(0)}%`,
        metric: `${topDecliner.current} positions (was ${topDecliner.previous})`,
        context: 'Significant pullback'
      });
    }
    
    return anomalies;
  }
  
  // ============ CROSS-DIMENSIONAL OUTLIERS ============
  
  private detectCrossDimensionalOutliers(): AnomalySignal[] {
    const anomalies: AnomalySignal[] = [];
    
    // Detect unusual combinations: Grade × Location × Category
    const combinations = new Map<string, number>();
    this.currentJobs.forEach(job => {
      const grade = getConsolidatedTier(classifyGrade(job.up_grade).tier);
      const locationType = job.location_type || 'Unknown';
      const category = job.primary_category;
      const key = `${grade}|${locationType}|${category}`;
      combinations.set(key, (combinations.get(key) || 0) + 1);
    });
    
    // Historical combinations
    const historicalCombinations = new Map<string, number>();
    this.historicalJobs.forEach(job => {
      const grade = getConsolidatedTier(classifyGrade(job.up_grade).tier);
      const locationType = job.location_type || 'Unknown';
      const category = job.primary_category;
      const key = `${grade}|${locationType}|${category}`;
      historicalCombinations.set(key, (historicalCombinations.get(key) || 0) + 1);
    });
    
    // Find rare combinations that suddenly appeared
    combinations.forEach((count, key) => {
      const historicalCount = historicalCombinations.get(key) || 0;
      const [grade, locationType, category] = key.split('|');
      
      if (count >= 3 && historicalCount === 0) {
        anomalies.push({
          id: `cross-new-${key}`,
          type: 'cross-dimensional',
          severity: count >= 5 ? 'high' : 'medium',
          icon: ANOMALY_ICONS['cross-dimensional'],
          title: `New pattern: ${grade} ${category} in ${locationType}`,
          description: `${count} positions with this combination — not seen historically`,
          metric: `${count} positions`,
          context: 'Unusual hiring pattern'
        });
      } else if (count >= 5 && historicalCount > 0 && count > historicalCount * 3) {
        anomalies.push({
          id: `cross-spike-${key}`,
          type: 'cross-dimensional',
          severity: 'high',
          icon: ANOMALY_ICONS['cross-dimensional'],
          title: `Spike: ${grade} ${category} in ${locationType}`,
          description: `${count} positions (historical avg: ${(historicalCount / 12).toFixed(1)}/month)`,
          metric: `${(count / (historicalCount / 12)).toFixed(1)}x normal`,
          context: 'Unusual concentration'
        });
      }
    });
    
    // Detect unusual duty station + grade combinations
    const stationGradeCombos = new Map<string, number>();
    this.currentJobs.forEach(job => {
      const station = job.duty_station || 'Unknown';
      const grade = getConsolidatedTier(classifyGrade(job.up_grade).tier);
      const key = `${station}|${grade}`;
      stationGradeCombos.set(key, (stationGradeCombos.get(key) || 0) + 1);
    });
    
    // Find unusual concentrations
    stationGradeCombos.forEach((count, key) => {
      const [station, grade] = key.split('|');
      
      // Check if this is unusual for the station
      if (count >= 3 && (grade === 'Executive' || grade === 'Director')) {
        // Senior positions in field locations are notable
        const stationJobs = this.currentJobs.filter(j => j.duty_station === station);
        if (stationJobs.length >= 5 && stationJobs.some(j => j.location_type === 'Field')) {
          anomalies.push({
            id: `cross-senior-field-${station}`,
            type: 'cross-dimensional',
            severity: 'medium',
            icon: ANOMALY_ICONS['cross-dimensional'],
            title: `Senior hiring in ${station}`,
            description: `${count} ${grade} positions in ${station}`,
            metric: `${count} positions`,
            context: 'Unusual senior concentration in field location'
          });
        }
      }
    });
    
    return anomalies;
  }
  
  // ============ TIMING ANOMALIES ============
  
  private detectTimingAnomalies(): AnomalySignal[] {
    const anomalies: AnomalySignal[] = [];
    
    // Application window analysis
    const windows = this.currentJobs
      .map(j => j.application_window_days)
      .filter(w => w > 0 && w < 365);
    
    if (windows.length > 0) {
      const profile = getStatisticalProfile(windows);
      
      // Detect if average window is unusually short
      const historicalWindows = this.historicalJobs
        .map(j => j.application_window_days)
        .filter(w => w > 0 && w < 365);
      
      if (historicalWindows.length > 0) {
        const historicalProfile = getStatisticalProfile(historicalWindows);
        
        if (profile.mean < historicalProfile.mean - historicalProfile.stdDev) {
          anomalies.push({
            id: 'timing-short-windows',
            type: 'timing',
            severity: 'medium',
            icon: ANOMALY_ICONS.timing,
            title: 'Shortened application windows',
            description: `Average window now ${profile.mean.toFixed(0)} days (historical: ${historicalProfile.mean.toFixed(0)} days)`,
            metric: `${(profile.mean - historicalProfile.mean).toFixed(0)} days shorter`,
            context: 'Hiring pressure or urgency'
          });
        }
      }
      
      // Very short windows
      const urgentJobs = this.currentJobs.filter(j => j.application_window_days > 0 && j.application_window_days < 10);
      const urgentRate = (urgentJobs.length / this.currentJobs.length) * 100;
      
      if (urgentRate > 20) {
        anomalies.push({
          id: 'timing-urgent-rate',
          type: 'timing',
          severity: urgentRate > 30 ? 'high' : 'medium',
          icon: ANOMALY_ICONS.timing,
          title: 'High urgent hiring rate',
          description: `${urgentRate.toFixed(0)}% of positions have <10 day windows`,
          metric: `${urgentJobs.length} urgent positions`,
          context: 'May indicate planning issues or emergency hiring'
        });
      }
    }
    
    // Day of week posting patterns
    const dayOfWeekCounts = new Map<number, number>();
    this.currentJobs.forEach(job => {
      try {
        const postDate = parseISO(job.posting_date);
        const day = getDay(postDate); // 0 = Sunday
        dayOfWeekCounts.set(day, (dayOfWeekCounts.get(day) || 0) + 1);
      } catch {
        // Skip invalid dates
      }
    });
    
    // Check for unusual posting day patterns
    const fridayCount = dayOfWeekCounts.get(5) || 0;
    const mondayCount = dayOfWeekCounts.get(1) || 0;
    const total = this.currentJobs.length || 1;
    
    if (fridayCount / total > 0.3) {
      anomalies.push({
        id: 'timing-friday-heavy',
        type: 'timing',
        severity: 'low',
        icon: ANOMALY_ICONS.timing,
        title: 'Friday-heavy posting pattern',
        description: `${((fridayCount / total) * 100).toFixed(0)}% of positions posted on Fridays`,
        metric: `${fridayCount} Friday posts`,
        context: 'Friday postings may get less visibility'
      });
    }
    
    return anomalies;
  }
  
  // ============ GAP SIGNALS ============
  
  private detectGapSignals(): AnomalySignal[] {
    const anomalies: AnomalySignal[] = [];
    
    if (!this.filterAgency) {
      return anomalies; // Gap signals are agency-specific
    }
    
    // Categories your peers are active in but you're not
    const yourCategories = new Set<string>();
    this.currentJobs.forEach(j => yourCategories.add(j.primary_category));
    
    // Get peer agencies
    const yourAgency = this.filterAgency;
    const marketCategories = new Map<string, Set<string>>();
    
    this.marketJobs.forEach(job => {
      const agency = job.short_agency || job.long_agency;
      if (agency && agency !== yourAgency) {
        if (!marketCategories.has(job.primary_category)) {
          marketCategories.set(job.primary_category, new Set());
        }
        marketCategories.get(job.primary_category)!.add(agency);
      }
    });
    
    // Find popular categories you're missing
    marketCategories.forEach((agencies, category) => {
      if (!yourCategories.has(category) && agencies.size >= 5) {
        const marketCount = this.marketJobs.filter(j => j.primary_category === category).length;
        
        anomalies.push({
          id: `gap-category-${category}`,
          type: 'gap',
          severity: agencies.size >= 10 ? 'medium' : 'low',
          icon: ANOMALY_ICONS.gap,
          title: `Not active in ${category}`,
          description: `${agencies.size} agencies posted ${marketCount} positions in ${category} — you have none`,
          metric: `${agencies.size} competitors active`,
          context: 'Market opportunity or strategic gap'
        });
      }
    });
    
    // Regions your peers are active in but you're not
    const yourRegions = new Set<string>();
    this.currentJobs.forEach(j => {
      const region = j.geographic_region || j.duty_continent;
      if (region) yourRegions.add(region);
    });
    
    const marketRegions = new Map<string, Set<string>>();
    this.marketJobs.forEach(job => {
      const agency = job.short_agency || job.long_agency;
      const region = job.geographic_region || job.duty_continent;
      if (agency && agency !== yourAgency && region) {
        if (!marketRegions.has(region)) {
          marketRegions.set(region, new Set());
        }
        marketRegions.get(region)!.add(agency);
      }
    });
    
    // Find regions you're missing
    marketRegions.forEach((agencies, region) => {
      if (!yourRegions.has(region) && agencies.size >= 3) {
        const marketCount = this.marketJobs.filter(j => 
          (j.geographic_region || j.duty_continent) === region
        ).length;
        
        // Check if this is consecutive absence
        const historicalInRegion = this.historicalJobs.filter(j => 
          (j.geographic_region || j.duty_continent) === region
        ).length;
        
        if (historicalInRegion === 0) {
          anomalies.push({
            id: `gap-region-${region}`,
            type: 'gap',
            severity: agencies.size >= 5 ? 'medium' : 'low',
            icon: ANOMALY_ICONS.gap,
            title: `No presence in ${region}`,
            description: `${agencies.size} agencies active in ${region} with ${marketCount} positions — you have none`,
            metric: `${agencies.size} competitors active`,
            context: 'Geographic gap vs market'
          });
        }
      }
    });
    
    return anomalies;
  }
  
  // ============ HELPERS ============
  
  private calculateStaffRatio(jobs: ProcessedJobData[]): number {
    if (jobs.length === 0) return 0;
    const staffCount = jobs.filter(j => classifyGrade(j.up_grade).staffCategory === 'Staff').length;
    return (staffCount / jobs.length) * 100;
  }
  
  private calculateFieldRatio(jobs: ProcessedJobData[]): number {
    if (jobs.length === 0) return 0;
    const fieldCount = jobs.filter(j => j.location_type === 'Field').length;
    return (fieldCount / jobs.length) * 100;
  }
  
  private calculateCategoryConcentration(jobs: ProcessedJobData[]): number {
    if (jobs.length === 0) return 0;
    
    const categoryCounts = new Map<string, number>();
    jobs.forEach(j => {
      categoryCounts.set(j.primary_category, (categoryCounts.get(j.primary_category) || 0) + 1);
    });
    
    const sorted = Array.from(categoryCounts.values()).sort((a, b) => b - a);
    const top3 = sorted.slice(0, 3).reduce((sum, v) => sum + v, 0);
    
    return (top3 / jobs.length) * 100;
  }
  
  private sortAndFilterAnomalies(anomalies: AnomalySignal[]): AnomalySignal[] {
    // Sort by severity
    const severityOrder: Record<AnomalySeverity, number> = {
      'critical': 0,
      'high': 1,
      'medium': 2,
      'low': 3
    };
    
    return anomalies
      .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
      .slice(0, 15); // Limit to top 15 anomalies
  }
}

// Export singleton instance
export const anomalyDetector = new AnomalyDetector();

