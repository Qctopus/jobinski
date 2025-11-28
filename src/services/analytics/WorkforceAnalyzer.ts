import { ProcessedJobData } from '../../types';
import { TemporalAnalyzer } from './TemporalAnalyzer';

/**
 * Workforce Composition Timeline
 * Phase 2 Tab 5 implementation - THE BIG ONE
 */
export interface WorkforceCompositionTimeline {
  period: string;

  // Seniority Evolution
  seniority_distribution: {
    junior: { count: number; percentage: number; change_from_previous: number };
    mid: { count: number; percentage: number; change_from_previous: number };
    senior: { count: number; percentage: number; change_from_previous: number };
    executive: { count: number; percentage: number; change_from_previous: number };
  };

  // Grade Evolution
  grade_distribution: {
    entry_level: { count: number; percentage: number };
    mid_level: { count: number; percentage: number };
    senior_level: { count: number; percentage: number };
    executive: { count: number; percentage: number };
  };

  // Location Strategy Evolution
  location_mix: {
    headquarters: { count: number; percentage: number; trend: string };
    field: { count: number; percentage: number; trend: string };
    regional: { count: number; percentage: number; trend: string };
    home_based: { count: number; percentage: number; trend: string };
  };

  // Geographic Spread
  geographic_evolution: {
    continents_active: number;
    countries_active: number;
    top_3_countries: Array<{ country: string; count: number }>;
    expansion_areas: string[];
    contraction_areas: string[];
  };

  // Skill Mix Evolution
  skill_domain_mix: {
    technical: { percentage: number; change: number };
    operational: { percentage: number; change: number };
    strategic: { percentage: number; change: number };
    mixed: { percentage: number; change: number };
  };

  // Language Requirements
  language_diversity: {
    multilingual_positions: { count: number; percentage: number };
    top_languages: Array<{ language: string; count: number }>;
    language_diversity_index: number;
  };
}

/**
 * Strategic Workforce Shifts
 */
export interface WorkforceShift {
  shift_type: 'seniorization' | 'juniorization' | 'decentralization' | 'centralization' |
  'specialization' | 'generalization' | 'global_expansion' | 'regional_focus';

  magnitude: 'major' | 'moderate' | 'minor';
  direction: 'increasing' | 'decreasing';
  confidence: number;

  evidence: string[];
  implications: string[];
}

/**
 * Workforce Profile
 */
interface WorkforceProfile {
  seniority_mix: { [key: string]: number };
  location_mix: { [key: string]: number };
  grade_mix: { [key: string]: number };
  avg_application_window: number;
  category_diversity: number;
}

/**
 * Comparative Workforce Analysis
 */
export interface WorkforceComparison {
  your_agency: WorkforceProfile;
  market_average: WorkforceProfile;
  top_performer: WorkforceProfile;

  gaps: Array<{
    dimension: string;
    gap_size: number;
    direction: 'over' | 'under';
    recommendation: string;
  }>;
}

/**
 * Workforce Analyzer
 * Comprehensive workforce composition evolution analysis
 */
export class WorkforceAnalyzer {
  private temporalAnalyzer: TemporalAnalyzer;

  constructor() {
    this.temporalAnalyzer = new TemporalAnalyzer();
  }

  /**
   * Calculate workforce composition timeline
   */
  calculateWorkforceTimeline(
    jobs: ProcessedJobData[],
    periodType: 'month' | 'quarter' = 'month'
  ): WorkforceCompositionTimeline[] {
    const snapshots = this.temporalAnalyzer.getTemporalSnapshots(jobs, periodType);

    return snapshots.map((snapshot, index) => {
      const periodJobs = this.temporalAnalyzer.getJobsInPeriod(jobs, snapshot.period, periodType);
      const prevSnapshot = index > 0 ? snapshots[index - 1] : null;
      const prevJobs = prevSnapshot
        ? this.temporalAnalyzer.getJobsInPeriod(jobs, prevSnapshot.period, periodType)
        : [];

      return {
        period: snapshot.period,
        seniority_distribution: this.calculateSeniorityDistribution(periodJobs, prevJobs),
        grade_distribution: this.calculateGradeDistribution(periodJobs),
        location_mix: this.calculateLocationMix(periodJobs, prevJobs),
        geographic_evolution: this.calculateGeographicEvolution(periodJobs, prevJobs),
        skill_domain_mix: this.calculateSkillDomainMix(periodJobs, prevJobs),
        language_diversity: this.calculateLanguageDiversity(periodJobs)
      };
    });
  }

  /**
   * Detect strategic workforce shifts
   */
  detectWorkforceShifts(timeline: WorkforceCompositionTimeline[]): WorkforceShift[] {
    if (timeline.length < 3) return [];

    const shifts: WorkforceShift[] = [];
    const recent = timeline.slice(-3);
    const earlier = timeline.slice(0, 3);

    // Detect seniorization/juniorization
    const seniorityShift = this.detectSeniorityShift(recent, earlier);
    if (seniorityShift) shifts.push(seniorityShift);

    // Detect centralization/decentralization
    const locationShift = this.detectLocationShift(recent, earlier);
    if (locationShift) shifts.push(locationShift);

    // Detect specialization/generalization
    const skillShift = this.detectSkillShift(recent, earlier);
    if (skillShift) shifts.push(skillShift);

    // Detect global expansion/regional focus
    const geographicShift = this.detectGeographicShift(recent, earlier);
    if (geographicShift) shifts.push(geographicShift);

    return shifts;
  }

  /**
   * Compare workforce profiles
   */
  compareWorkforce(
    yourJobs: ProcessedJobData[],
    allJobs: ProcessedJobData[],
    topPerformerJobs: ProcessedJobData[]
  ): WorkforceComparison {
    const yourProfile = this.calculateWorkforceProfile(yourJobs);
    const marketProfile = this.calculateWorkforceProfile(allJobs);
    const topProfile = this.calculateWorkforceProfile(topPerformerJobs);

    const gaps = this.identifyGaps(yourProfile, marketProfile, topProfile);

    return {
      your_agency: yourProfile,
      market_average: marketProfile,
      top_performer: topProfile,
      gaps
    };
  }

  /**
   * Helper: Calculate seniority distribution
   */
  private calculateSeniorityDistribution(
    current: ProcessedJobData[],
    previous: ProcessedJobData[]
  ) {
    const currentCounts = this.countBySeniority(current);
    const previousCounts = this.countBySeniority(previous);

    return {
      junior: this.calculateLevelMetrics('Junior', currentCounts, previousCounts, current.length, previous.length),
      mid: this.calculateLevelMetrics('Mid', currentCounts, previousCounts, current.length, previous.length),
      senior: this.calculateLevelMetrics('Senior', currentCounts, previousCounts, current.length, previous.length),
      executive: this.calculateLevelMetrics('Executive', currentCounts, previousCounts, current.length, previous.length)
    };
  }

  /**
   * Helper: Calculate grade distribution
   */
  private calculateGradeDistribution(jobs: ProcessedJobData[]) {
    const entryGrades = ['Entry', 'NOA', 'NOB', 'P1', 'P2'];
    const midGrades = ['Mid', 'NOC', 'NOD', 'P3', 'P4'];
    const seniorGrades = ['Senior', 'P5', 'D1'];
    const executiveGrades = ['Executive', 'D2', 'ASG', 'USG'];

    const entry = jobs.filter(j =>
      entryGrades.some(g => j.up_grade.includes(g) || j.grade_level === 'Entry')
    ).length;
    const mid = jobs.filter(j =>
      midGrades.some(g => j.up_grade.includes(g) || j.grade_level === 'Mid')
    ).length;
    const senior = jobs.filter(j =>
      seniorGrades.some(g => j.up_grade.includes(g) || j.grade_level === 'Senior')
    ).length;
    const executive = jobs.filter(j =>
      executiveGrades.some(g => j.up_grade.includes(g) || j.grade_level === 'Executive')
    ).length;

    const total = jobs.length || 1;

    return {
      entry_level: { count: entry, percentage: (entry / total) * 100 },
      mid_level: { count: mid, percentage: (mid / total) * 100 },
      senior_level: { count: senior, percentage: (senior / total) * 100 },
      executive: { count: executive, percentage: (executive / total) * 100 }
    };
  }

  /**
   * Helper: Calculate location mix
   */
  private calculateLocationMix(
    current: ProcessedJobData[],
    previous: ProcessedJobData[]
  ) {
    const currentCounts = this.countByLocation(current);
    const previousCounts = this.countByLocation(previous);

    const getTrend = (curr: number, prev: number) => {
      if (prev === 0) return 'new';
      const change = ((curr - prev) / prev) * 100;
      if (change > 15) return 'increasing';
      if (change < -15) return 'decreasing';
      return 'stable';
    };

    const total = current.length || 1;
    const prevTotal = previous.length || 1;

    return {
      headquarters: {
        count: currentCounts.headquarters,
        percentage: (currentCounts.headquarters / total) * 100,
        trend: getTrend(currentCounts.headquarters / total, previousCounts.headquarters / prevTotal)
      },
      field: {
        count: currentCounts.field,
        percentage: (currentCounts.field / total) * 100,
        trend: getTrend(currentCounts.field / total, previousCounts.field / prevTotal)
      },
      regional: {
        count: currentCounts.regional,
        percentage: (currentCounts.regional / total) * 100,
        trend: getTrend(currentCounts.regional / total, previousCounts.regional / prevTotal)
      },
      home_based: {
        count: currentCounts.home_based,
        percentage: (currentCounts.home_based / total) * 100,
        trend: getTrend(currentCounts.home_based / total, previousCounts.home_based / prevTotal)
      }
    };
  }

  /**
   * Helper: Calculate geographic evolution
   */
  private calculateGeographicEvolution(
    current: ProcessedJobData[],
    previous: ProcessedJobData[]
  ) {
    const currentCountries = new Set(current.map(j => j.duty_country));
    const previousCountries = new Set(previous.map(j => j.duty_country));
    const currentContinents = new Set(current.map(j => j.duty_continent));

    const countryCounts = this.countByCountry(current);
    const top3 = Object.entries(countryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([country, count]) => ({ country, count }));

    const expansionAreas = Array.from(currentCountries).filter(c => !previousCountries.has(c));
    const contractionAreas = Array.from(previousCountries).filter(c => !currentCountries.has(c));

    return {
      continents_active: currentContinents.size,
      countries_active: currentCountries.size,
      top_3_countries: top3,
      expansion_areas: expansionAreas.slice(0, 5),
      contraction_areas: contractionAreas.slice(0, 5)
    };
  }

  /**
   * Helper: Calculate skill domain mix
   */
  private calculateSkillDomainMix(
    current: ProcessedJobData[],
    previous: ProcessedJobData[]
  ) {
    const currentMix = this.countBySkillDomain(current);
    const previousMix = this.countBySkillDomain(previous);

    const total = current.length || 1;
    const prevTotal = previous.length || 1;

    return {
      technical: {
        percentage: (currentMix.Technical / total) * 100,
        change: (currentMix.Technical / total) - (previousMix.Technical / prevTotal)
      },
      operational: {
        percentage: (currentMix.Operational / total) * 100,
        change: (currentMix.Operational / total) - (previousMix.Operational / prevTotal)
      },
      strategic: {
        percentage: (currentMix.Strategic / total) * 100,
        change: (currentMix.Strategic / total) - (previousMix.Strategic / prevTotal)
      },
      mixed: {
        percentage: (currentMix.Mixed / total) * 100,
        change: (currentMix.Mixed / total) - (previousMix.Mixed / prevTotal)
      }
    };
  }

  /**
   * Helper: Calculate language diversity
   */
  private calculateLanguageDiversity(jobs: ProcessedJobData[]) {
    const languageCounts: { [key: string]: number } = {};
    let multilingualCount = 0;

    jobs.forEach(job => {
      const languages = job.languages.split(',').map(l => l.trim()).filter(l => l);
      if (languages.length > 1) multilingualCount++;

      languages.forEach(lang => {
        languageCounts[lang] = (languageCounts[lang] || 0) + 1;
      });
    });

    const topLanguages = Object.entries(languageCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([language, count]) => ({ language, count }));

    // Calculate Shannon entropy for diversity
    const total = jobs.length || 1;
    let entropy = 0;
    Object.values(languageCounts).forEach(count => {
      const p = count / total;
      if (p > 0) entropy -= p * Math.log2(p);
    });

    return {
      multilingual_positions: {
        count: multilingualCount,
        percentage: (multilingualCount / total) * 100
      },
      top_languages: topLanguages,
      language_diversity_index: Math.round(entropy * 100) / 100
    };
  }

  /**
   * Shift detection methods
   */
  private detectSeniorityShift(
    recent: WorkforceCompositionTimeline[],
    earlier: WorkforceCompositionTimeline[]
  ): WorkforceShift | null {
    const recentSenior = this.avgPercentage(recent.map(t =>
      t.seniority_distribution.senior.percentage + t.seniority_distribution.executive.percentage
    ));
    const earlierSenior = this.avgPercentage(earlier.map(t =>
      t.seniority_distribution.senior.percentage + t.seniority_distribution.executive.percentage
    ));

    const change = recentSenior - earlierSenior;

    if (Math.abs(change) < 5) return null;

    return {
      shift_type: change > 0 ? 'seniorization' : 'juniorization',
      magnitude: Math.abs(change) > 15 ? 'major' : Math.abs(change) > 8 ? 'moderate' : 'minor',
      direction: change > 0 ? 'increasing' : 'decreasing',
      confidence: Math.min(95, Math.abs(change) * 5),
      evidence: [
        `${Math.abs(change).toFixed(1)}% ${change > 0 ? 'increase' : 'decrease'} in senior positions`,
        `From ${earlierSenior.toFixed(1)}% to ${recentSenior.toFixed(1)}%`
      ],
      implications: change > 0
        ? ['Shift towards experienced talent', 'Higher salary expectations', 'More strategic focus']
        : ['Cost optimization', 'Building junior talent pool', 'Long-term capacity building']
    };
  }

  private detectLocationShift(
    recent: WorkforceCompositionTimeline[],
    earlier: WorkforceCompositionTimeline[]
  ): WorkforceShift | null {
    const recentHQ = this.avgPercentage(recent.map(t => t.location_mix.headquarters.percentage));
    const earlierHQ = this.avgPercentage(earlier.map(t => t.location_mix.headquarters.percentage));

    const change = recentHQ - earlierHQ;

    if (Math.abs(change) < 5) return null;

    return {
      shift_type: change > 0 ? 'centralization' : 'decentralization',
      magnitude: Math.abs(change) > 15 ? 'major' : Math.abs(change) > 8 ? 'moderate' : 'minor',
      direction: change > 0 ? 'increasing' : 'decreasing',
      confidence: Math.min(95, Math.abs(change) * 5),
      evidence: [
        `${Math.abs(change).toFixed(1)}% ${change > 0 ? 'increase' : 'decrease'} in HQ positions`,
        `Field presence ${change > 0 ? 'decreasing' : 'strengthening'}`
      ],
      implications: change > 0
        ? ['Consolidation of operations', 'Policy/coordination focus', 'Reduced field presence']
        : ['Stronger field presence', 'Program delivery focus', 'Decentralized operations']
    };
  }

  private detectSkillShift(
    recent: WorkforceCompositionTimeline[],
    earlier: WorkforceCompositionTimeline[]
  ): WorkforceShift | null {
    const recentTech = this.avgPercentage(recent.map(t => t.skill_domain_mix.technical.percentage));
    const earlierTech = this.avgPercentage(earlier.map(t => t.skill_domain_mix.technical.percentage));

    const change = recentTech - earlierTech;

    if (Math.abs(change) < 5) return null;

    return {
      shift_type: change > 0 ? 'specialization' : 'generalization',
      magnitude: Math.abs(change) > 15 ? 'major' : Math.abs(change) > 8 ? 'moderate' : 'minor',
      direction: change > 0 ? 'increasing' : 'decreasing',
      confidence: Math.min(95, Math.abs(change) * 5),
      evidence: [
        `${Math.abs(change).toFixed(1)}% shift in technical positions`,
        `Moving towards ${change > 0 ? 'specialized' : 'generalist'} profiles`
      ],
      implications: change > 0
        ? ['Technical capability building', 'Specialized expertise focus', 'Innovation-driven']
        : ['Broader skill requirements', 'Operational flexibility', 'Generalist approach']
    };
  }

  private detectGeographicShift(
    recent: WorkforceCompositionTimeline[],
    earlier: WorkforceCompositionTimeline[]
  ): WorkforceShift | null {
    const recentCountries = this.avgValue(recent.map(t => t.geographic_evolution.countries_active));
    const earlierCountries = this.avgValue(earlier.map(t => t.geographic_evolution.countries_active));

    const change = recentCountries - earlierCountries;

    if (Math.abs(change) < 3) return null;

    return {
      shift_type: change > 0 ? 'global_expansion' : 'regional_focus',
      magnitude: Math.abs(change) > 10 ? 'major' : Math.abs(change) > 5 ? 'moderate' : 'minor',
      direction: change > 0 ? 'increasing' : 'decreasing',
      confidence: Math.min(95, Math.abs(change) * 3),
      evidence: [
        `${Math.abs(change).toFixed(0)} ${change > 0 ? 'more' : 'fewer'} countries active`,
        `Geographic ${change > 0 ? 'expansion' : 'consolidation'}`
      ],
      implications: change > 0
        ? ['Expanding global footprint', 'New market entry', 'Increased complexity']
        : ['Regional concentration', 'Operational efficiency', 'Focused presence']
    };
  }

  /**
   * Helper counting methods
   */
  private countBySeniority(jobs: ProcessedJobData[]): { [key: string]: number } {
    const counts = { Junior: 0, Mid: 0, Senior: 0, Executive: 0 };
    jobs.forEach(j => {
      counts[j.seniority_level] = (counts[j.seniority_level] || 0) + 1;
    });
    return counts;
  }

  private countByLocation(jobs: ProcessedJobData[]): {
    headquarters: number;
    field: number;
    regional: number;
    home_based: number;
  } {
    return {
      headquarters: jobs.filter(j => j.location_type === 'Headquarters').length,
      field: jobs.filter(j => j.location_type === 'Field').length,
      regional: jobs.filter(j => j.location_type === 'Regional').length,
      home_based: jobs.filter(j => j.is_home_based).length
    };
  }

  private countByCountry(jobs: ProcessedJobData[]): { [country: string]: number } {
    const counts: { [country: string]: number } = {};
    jobs.forEach(j => {
      counts[j.duty_country] = (counts[j.duty_country] || 0) + 1;
    });
    return counts;
  }

  private countBySkillDomain(jobs: ProcessedJobData[]): {
    Technical: number;
    Operational: number;
    Strategic: number;
    Mixed: number;
  } {
    return {
      Technical: jobs.filter(j => j.skill_domain === 'Technical').length,
      Operational: jobs.filter(j => j.skill_domain === 'Operational').length,
      Strategic: jobs.filter(j => j.skill_domain === 'Strategic').length,
      Mixed: jobs.filter(j => j.skill_domain === 'Mixed').length
    };
  }

  private calculateLevelMetrics(
    level: string,
    currentCounts: { [key: string]: number },
    previousCounts: { [key: string]: number },
    currentTotal: number,
    previousTotal: number
  ) {
    const current = currentCounts[level] || 0;
    const previous = previousCounts[level] || 0;
    const currentPerc = currentTotal > 0 ? (current / currentTotal) * 100 : 0;
    const previousPerc = previousTotal > 0 ? (previous / previousTotal) * 100 : 0;

    return {
      count: current,
      percentage: currentPerc,
      change_from_previous: currentPerc - previousPerc
    };
  }

  private calculateWorkforceProfile(jobs: ProcessedJobData[]): WorkforceProfile {
    const seniorityMix: { [key: string]: number } = {};
    const locationMix: { [key: string]: number } = {};
    const gradeMix: { [key: string]: number } = {};

    jobs.forEach(j => {
      seniorityMix[j.seniority_level] = (seniorityMix[j.seniority_level] || 0) + 1;
      locationMix[j.location_type] = (locationMix[j.location_type] || 0) + 1;
      gradeMix[j.grade_level] = (gradeMix[j.grade_level] || 0) + 1;
    });

    const avgWindow = jobs.reduce((sum, j) => sum + j.application_window_days, 0) / jobs.length;
    const categories = new Set(jobs.map(j => j.primary_category));

    return {
      seniority_mix: seniorityMix,
      location_mix: locationMix,
      grade_mix: gradeMix,
      avg_application_window: avgWindow,
      category_diversity: categories.size
    };
  }

  private identifyGaps(
    your: WorkforceProfile,
    market: WorkforceProfile,
    top: WorkforceProfile
  ): Array<{ dimension: string; gap_size: number; direction: 'over' | 'under'; recommendation: string }> {
    const gaps: Array<{ dimension: string; gap_size: number; direction: 'over' | 'under'; recommendation: string }> = [];

    // Compare application window
    const windowGap = your.avg_application_window - market.avg_application_window;
    if (Math.abs(windowGap) > 5) {
      gaps.push({
        dimension: 'Application Window',
        gap_size: Math.abs(windowGap),
        direction: windowGap > 0 ? 'over' : 'under',
        recommendation: windowGap > 0
          ? 'Consider shortening timelines to match market pace'
          : 'Your faster timeline is competitive advantage'
      });
    }

    return gaps;
  }

  private avgPercentage(values: number[]): number {
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  private avgValue(values: number[]): number {
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }
}




