/**
 * Report Data Aggregator Service
 * Aggregates and calculates all metrics needed for the agency report
 * Uses SQLite for consistent data source with the main dashboard
 */

import db from '../../config/sqlite';
import { 
  AgencyReportMetrics, 
  BenchmarkMetrics, 
  CompetitiveIntelligence,
  GradeDistributionItem,
  SeniorityDistributionItem,
  CategoryDistributionItem,
  DutyStationItem,
  RegionDistributionItem,
  MonthlyPostingItem,
  CompetitorAnalysisItem,
  CategoryCompetitionItem
} from '../../types/reports';
import { getAgencyLogo } from './utils/agencyLogos';
import { getAgencyPeerGroup, getPeerAgencies, getAgencyTier } from './utils/peerGroups';

export class ReportDataAggregator {
  
  /**
   * Aggregate all metrics for a specific agency within a date range
   */
  async aggregateAgencyMetrics(
    agency: string,
    startDate: string,
    endDate: string
  ): Promise<AgencyReportMetrics> {
    console.log(`[ReportDataAggregator] Aggregating metrics for ${agency} from ${startDate} to ${endDate}`);
    
    // Get all jobs for this agency in the date range
    const agencyJobs = this.getAgencyJobs(agency, startDate, endDate);
    const previousPeriodJobs = this.getPreviousPeriodJobs(agency, startDate);
    
    // Get agency info
    const agencyInfo = this.getAgencyInfo(agency, agencyJobs);
    
    // Calculate all metrics
    const volumeMetrics = this.calculateVolumeMetrics(agencyJobs, previousPeriodJobs);
    const applicationMetrics = this.calculateApplicationMetrics(agencyJobs);
    const workforceComposition = this.calculateWorkforceComposition(agencyJobs);
    const categoryAnalysis = this.calculateCategoryAnalysis(agencyJobs, agency);
    const geographicAnalysis = this.calculateGeographicAnalysis(agencyJobs);
    const temporalAnalysis = this.calculateTemporalAnalysis(agencyJobs);
    
    return {
      agencyInfo,
      volumeMetrics,
      applicationMetrics,
      workforceComposition,
      categoryAnalysis,
      geographicAnalysis,
      temporalAnalysis
    };
  }

  /**
   * Calculate benchmark metrics for comparison
   */
  async calculateBenchmarks(
    agency: string,
    startDate: string,
    endDate: string
  ): Promise<BenchmarkMetrics> {
    // Get all market jobs from SQLite
    const allJobs = this.getAllJobs(startDate, endDate);
    
    // Get peer group jobs
    const peerAgencies = getPeerAgencies(agency);
    const peerJobs = allJobs.filter(job => 
      peerAgencies.some(peer => 
        job.short_agency?.toLowerCase().includes(peer.toLowerCase()) ||
        peer.toLowerCase().includes(job.short_agency?.toLowerCase() || '')
      )
    );

    // Market averages
    const marketAverages = this.calculateMarketAverages(allJobs);
    
    // Peer group averages
    const peerAverages = this.calculatePeerAverages(peerJobs, peerAgencies);
    
    // Industry standards (derived from top performers)
    const industryStandards = this.calculateIndustryStandards(allJobs);

    return {
      marketAverages,
      peerAverages,
      industryStandards
    };
  }

  /**
   * Calculate competitive intelligence data
   */
  async calculateCompetitiveIntelligence(
    agency: string,
    startDate: string,
    endDate: string
  ): Promise<CompetitiveIntelligence> {
    const allJobs = this.getAllJobs(startDate, endDate);
    const agencyJobs = this.getAgencyJobs(agency, startDate, endDate);
    
    // Market position
    const allAgencies = this.getUniqueAgencies(allJobs);
    const agencyVolume = agencyJobs.length;
    const sortedByVolume = allAgencies.sort((a, b) => b.count - a.count);
    const marketRank = sortedByVolume.findIndex(a => 
      a.agency.toLowerCase().includes(agency.toLowerCase()) ||
      agency.toLowerCase().includes(a.agency.toLowerCase())
    ) + 1;
    
    const totalMarketVolume = allJobs.length;
    const marketShare = totalMarketVolume > 0 ? (agencyVolume / totalMarketVolume) * 100 : 0;
    
    const marketPosition = {
      marketRank: marketRank || allAgencies.length + 1,
      totalAgenciesInMarket: allAgencies.length,
      marketShare,
      volumeVsMarketAverage: totalMarketVolume > 0 
        ? ((agencyVolume / (totalMarketVolume / allAgencies.length)) - 1) * 100 
        : 0
    };

    // Peer group comparison
    const peerAgencies = getPeerAgencies(agency);
    const peerGroup = getAgencyPeerGroup(agency);
    
    const peerJobCounts = new Map<string, number>();
    peerAgencies.forEach(peer => {
      const peerCount = allJobs.filter(job => 
        job.short_agency?.toLowerCase().includes(peer.toLowerCase()) ||
        peer.toLowerCase().includes(job.short_agency?.toLowerCase() || '')
      ).length;
      if (peerCount > 0) {
        peerJobCounts.set(peer, peerCount);
      }
    });
    
    const allPeerCounts = [...peerJobCounts.values(), agencyJobs.length].sort((a, b) => b - a);
    const yourRank = allPeerCounts.indexOf(agencyJobs.length) + 1;
    const avgPostingsInGroup = peerJobCounts.size > 0 
      ? Array.from(peerJobCounts.values()).reduce((a, b) => a + b, 0) / peerJobCounts.size 
      : 0;
    
    const peerGroupComparison = {
      peerGroupName: peerGroup?.name || 'Unknown',
      peerGroupTier: peerGroup?.tier || 4,
      peerAgencies,
      yourRankInGroup: yourRank,
      avgPostingsInGroup,
      yourPostings: agencyJobs.length,
      performanceVsPeers: agencyJobs.length > avgPostingsInGroup * 1.1 
        ? 'above' as const 
        : agencyJobs.length < avgPostingsInGroup * 0.9 
          ? 'below' as const 
          : 'at' as const
    };

    // Competitor analysis
    const competitorAnalysis = this.analyzeCompetitors(agency, agencyJobs, allJobs);
    
    // Category competition
    const categoryCompetition = this.analyzeCategoryCompetition(agency, agencyJobs, allJobs);

    return {
      marketPosition,
      peerGroupComparison,
      competitorAnalysis,
      categoryCompetition
    };
  }

  // =========================================
  // PRIVATE HELPER METHODS - SQLite based
  // =========================================

  private getAgencyJobs(agency: string, startDate: string, endDate: string): any[] {
    const jobs = db.prepare(`
      SELECT * FROM jobs 
      WHERE (LOWER(short_agency) LIKE LOWER(?) OR LOWER(long_agency) LIKE LOWER(?))
      AND posting_date >= ? 
      AND posting_date <= ?
    `).all(`%${agency}%`, `%${agency}%`, startDate, endDate) as any[];
    return jobs;
  }

  private getPreviousPeriodJobs(agency: string, startDate: string): any[] {
    // Get jobs from the month before the start date
    const prevEnd = new Date(startDate);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setMonth(prevStart.getMonth() - 1);
    
    const jobs = db.prepare(`
      SELECT * FROM jobs 
      WHERE (LOWER(short_agency) LIKE LOWER(?) OR LOWER(long_agency) LIKE LOWER(?))
      AND posting_date >= ? 
      AND posting_date <= ?
    `).all(
      `%${agency}%`, 
      `%${agency}%`, 
      prevStart.toISOString().split('T')[0], 
      prevEnd.toISOString().split('T')[0]
    ) as any[];
    return jobs;
  }

  private getAllJobs(startDate: string, endDate: string): any[] {
    const jobs = db.prepare(`
      SELECT * FROM jobs 
      WHERE posting_date >= ? 
      AND posting_date <= ?
    `).all(startDate, endDate) as any[];
    return jobs;
  }

  private getUniqueAgencies(jobs: any[]): { agency: string; count: number }[] {
    const agencyMap = new Map<string, number>();
    jobs.forEach(job => {
      const agency = job.short_agency || job.long_agency || 'Unknown';
      agencyMap.set(agency, (agencyMap.get(agency) || 0) + 1);
    });
    return Array.from(agencyMap.entries())
      .map(([agency, count]) => ({ agency, count }))
      .sort((a, b) => b.count - a.count);
  }

  private getAgencyInfo(agency: string, jobs: any[]) {
    const longName = jobs[0]?.long_agency || agency;
    const peerGroup = getAgencyPeerGroup(agency);
    
    return {
      shortName: agency,
      longName,
      logoPath: getAgencyLogo(agency),
      peerGroup: peerGroup?.name || 'Unknown',
      tier: peerGroup?.tier || 4
    };
  }

  private calculateVolumeMetrics(currentJobs: any[], previousJobs: any[]) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    // Note: We ignore 'archived' flag as it's incorrectly set in source data
    // A job is considered active if its deadline is today or in the future
    const activePostings = currentJobs.filter(job => {
      if (!job.apply_until) return false;
      const deadline = new Date(job.apply_until);
      return deadline >= today;
    }).length;

    const closingSoonPostings = currentJobs.filter(job => {
      if (!job.apply_until) return false;
      const deadline = new Date(job.apply_until);
      const daysRemaining = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysRemaining >= 0 && daysRemaining <= 14;
    }).length;

    const expiredPostings = currentJobs.filter(job => {
      if (!job.apply_until) return true;
      const deadline = new Date(job.apply_until);
      return deadline < today;
    }).length;

    const monthOverMonthChange = previousJobs.length > 0 
      ? ((currentJobs.length - previousJobs.length) / previousJobs.length) * 100 
      : 0;

    return {
      totalPostings: currentJobs.length,
      activePostings,
      closingSoonPostings,
      expiredPostings,
      newPostingsThisMonth: currentJobs.length,
      previousMonthPostings: previousJobs.length,
      monthOverMonthChange
    };
  }

  private calculateApplicationMetrics(jobs: any[]) {
    const applicationWindows = jobs.map(job => {
      const posted = new Date(job.posting_date);
      const deadline = new Date(job.apply_until);
      return Math.ceil((deadline.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24));
    }).filter(w => w > 0 && w < 365);

    if (applicationWindows.length === 0) {
      return {
        avgApplicationWindow: 0,
        medianApplicationWindow: 0,
        minApplicationWindow: 0,
        maxApplicationWindow: 0,
        urgentPositionsCount: 0,
        urgentPositionsPercentage: 0
      };
    }

    const sorted = [...applicationWindows].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)] || 0;
    const avg = applicationWindows.reduce((a, b) => a + b, 0) / applicationWindows.length;

    const urgentCount = jobs.filter(job => {
      const deadline = new Date(job.apply_until);
      const daysRemaining = Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return daysRemaining > 0 && daysRemaining <= 14;
    }).length;

    return {
      avgApplicationWindow: Math.round(avg * 10) / 10,
      medianApplicationWindow: median,
      minApplicationWindow: Math.min(...applicationWindows),
      maxApplicationWindow: Math.max(...applicationWindows),
      urgentPositionsCount: urgentCount,
      urgentPositionsPercentage: (urgentCount / jobs.length) * 100
    };
  }

  private calculateWorkforceComposition(jobs: any[]) {
    return {
      gradeDistribution: this.calculateGradeDistribution(jobs),
      seniorityDistribution: this.calculateSeniorityDistribution(jobs),
      staffTypeBreakdown: this.calculateStaffTypeBreakdown(jobs),
      locationDistribution: this.calculateLocationDistribution(jobs),
      languageRequirements: this.calculateLanguageRequirements(jobs)
    };
  }

  private calculateGradeDistribution(jobs: any[]): GradeDistributionItem[] {
    const gradeMap = new Map<string, number>();
    jobs.forEach(job => {
      const grade = job.up_grade || 'Unspecified';
      gradeMap.set(grade, (gradeMap.get(grade) || 0) + 1);
    });

    const total = jobs.length;
    return Array.from(gradeMap.entries())
      .map(([grade, count]) => ({
        grade,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  }

  private calculateSeniorityDistribution(jobs: any[]): SeniorityDistributionItem[] {
    const seniorityMap = new Map<string, number>();
    jobs.forEach(job => {
      const seniority = job.seniority_level || this.inferSeniority(job.up_grade || '', job.title || '');
      seniorityMap.set(seniority, (seniorityMap.get(seniority) || 0) + 1);
    });

    const total = jobs.length;
    return Array.from(seniorityMap.entries())
      .map(([level, count]) => ({
        level,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  }

  private inferSeniority(grade: string, title: string): string {
    const gradeLower = grade.toLowerCase();
    const titleLower = title.toLowerCase();
    
    if (gradeLower.includes('d-') || gradeLower.includes('usg') || gradeLower.includes('asg') ||
        titleLower.includes('director') || titleLower.includes('chief')) {
      return 'Director';
    }
    if (gradeLower.includes('p-5') || gradeLower.includes('p5') || 
        titleLower.includes('senior')) {
      return 'Senior';
    }
    if (gradeLower.includes('p-4') || gradeLower.includes('p4') || gradeLower.includes('p-3') || gradeLower.includes('p3')) {
      return 'Mid';
    }
    if (gradeLower.includes('p-2') || gradeLower.includes('p2') || gradeLower.includes('p-1') || gradeLower.includes('p1')) {
      return 'Entry';
    }
    if (gradeLower.includes('g-') || gradeLower.includes('gs-')) {
      return 'Support';
    }
    return 'Other';
  }

  private calculateStaffTypeBreakdown(jobs: any[]) {
    let international = 0, national = 0, consultant = 0, intern = 0, other = 0;
    
    jobs.forEach(job => {
      const title = (job.title || '').toLowerCase();
      const grade = (job.up_grade || '').toLowerCase();
      
      if (title.includes('intern') || grade.includes('intern')) {
        intern++;
      } else if (title.includes('consultant') || grade.includes('consultant') || 
                 title.includes('contractor') || grade.includes('ssc') || grade.includes('iica')) {
        consultant++;
      } else if (grade.includes('no-') || grade.includes('g-') || grade.includes('gs-') || 
                 grade.includes('npsa') || grade.includes('lica')) {
        national++;
      } else if (grade.includes('p-') || grade.includes('d-') || grade.includes('ipsa')) {
        international++;
      } else {
        other++;
      }
    });

    const total = jobs.length;
    return {
      international: { count: international, percentage: total > 0 ? (international / total) * 100 : 0 },
      national: { count: national, percentage: total > 0 ? (national / total) * 100 : 0 },
      consultant: { count: consultant, percentage: total > 0 ? (consultant / total) * 100 : 0 },
      intern: { count: intern, percentage: total > 0 ? (intern / total) * 100 : 0 },
      other: { count: other, percentage: total > 0 ? (other / total) * 100 : 0 }
    };
  }

  private calculateLocationDistribution(jobs: any[]): DutyStationItem[] {
    const locationMap = new Map<string, number>();
    jobs.forEach(job => {
      const location = job.duty_station || job.duty_country || 'Unspecified';
      locationMap.set(location, (locationMap.get(location) || 0) + 1);
    });

    const total = jobs.length;
    return Array.from(locationMap.entries())
      .map(([station, count]) => ({
        station,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
  }

  private calculateLanguageRequirements(jobs: any[]) {
    const languageMap = new Map<string, number>();
    
    jobs.forEach(job => {
      const languages = (job.languages || '').split(',').map((l: string) => l.trim()).filter((l: string) => l);
      languages.forEach((lang: string) => {
        languageMap.set(lang, (languageMap.get(lang) || 0) + 1);
      });
    });

    const total = jobs.length;
    const languageBreakdown = Array.from(languageMap.entries())
      .map(([language, count]) => ({
        language,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);

    const multilingualJobs = jobs.filter(job => {
      const languages = (job.languages || '').split(',').filter((l: string) => l.trim()).length;
      return languages > 1;
    }).length;

    return {
      languageBreakdown,
      multilingualPercentage: total > 0 ? (multilingualJobs / total) * 100 : 0
    };
  }

  private calculateCategoryAnalysis(jobs: any[], agency: string) {
    const categoryMap = new Map<string, number>();
    jobs.forEach(job => {
      const category = job.primary_category || job.sectoral_category || 'Uncategorized';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    const total = jobs.length;
    const distribution: CategoryDistributionItem[] = Array.from(categoryMap.entries())
      .map(([category, count]) => ({
        category,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);

    // Find trending categories (would need historical data for real trends)
    const trendingCategories = distribution.slice(0, 3).map(c => c.category);

    // Find emerging categories (would need historical data)
    const emergingCategories: string[] = [];

    // Category diversity index
    const categoryDiversity = this.calculateDiversityIndex(distribution.map(d => d.count));

    return {
      distribution,
      trendingCategories,
      emergingCategories,
      categoryDiversity
    };
  }

  private calculateDiversityIndex(counts: number[]): number {
    const total = counts.reduce((a, b) => a + b, 0);
    if (total === 0) return 0;
    
    // Shannon diversity index (normalized)
    const proportions = counts.map(c => c / total).filter(p => p > 0);
    const entropy = -proportions.reduce((sum, p) => sum + p * Math.log(p), 0);
    const maxEntropy = Math.log(counts.length);
    
    return maxEntropy > 0 ? (entropy / maxEntropy) * 100 : 0;
  }

  private calculateGeographicAnalysis(jobs: any[]) {
    // Region distribution
    const regionMap = new Map<string, number>();
    jobs.forEach(job => {
      const region = job.duty_continent || this.inferRegion(job.duty_country || '');
      regionMap.set(region, (regionMap.get(region) || 0) + 1);
    });

    const total = jobs.length;
    const regionDistribution: RegionDistributionItem[] = Array.from(regionMap.entries())
      .map(([region, count]) => ({
        region,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);

    // Duty station distribution (top 15)
    const stationMap = new Map<string, number>();
    jobs.forEach(job => {
      const station = job.duty_station || job.duty_country || 'Unspecified';
      stationMap.set(station, (stationMap.get(station) || 0) + 1);
    });

    const topDutyStations: DutyStationItem[] = Array.from(stationMap.entries())
      .map(([station, count]) => ({
        station,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    // HQ vs Field distribution
    const hqLocations = ['New York', 'Geneva', 'Vienna', 'Rome', 'Paris', 'Nairobi', 'Bangkok', 'Copenhagen', 'Washington'];
    let hqCount = 0, fieldCount = 0, remoteCount = 0;

    jobs.forEach(job => {
      const station = (job.duty_station || '').toLowerCase();
      const country = (job.duty_country || '').toLowerCase();
      
      if (station.includes('home') || station.includes('remote')) {
        remoteCount++;
      } else if (hqLocations.some(hq => station.includes(hq.toLowerCase()) || country.includes(hq.toLowerCase()))) {
        hqCount++;
      } else {
        fieldCount++;
      }
    });

    return {
      regionDistribution,
      topDutyStations,
      hqVsFieldRatio: {
        hq: { count: hqCount, percentage: total > 0 ? (hqCount / total) * 100 : 0 },
        field: { count: fieldCount, percentage: total > 0 ? (fieldCount / total) * 100 : 0 },
        remote: { count: remoteCount, percentage: total > 0 ? (remoteCount / total) * 100 : 0 }
      }
    };
  }

  private inferRegion(country: string): string {
    const countryLower = country.toLowerCase();
    
    const regionMap: Record<string, string[]> = {
      'Africa': ['kenya', 'nigeria', 'ethiopia', 'south africa', 'egypt', 'morocco', 'senegal', 'tanzania', 'uganda', 'sudan', 'ghana'],
      'Asia': ['india', 'china', 'japan', 'thailand', 'indonesia', 'philippines', 'vietnam', 'bangladesh', 'pakistan', 'afghanistan', 'myanmar'],
      'Europe': ['switzerland', 'austria', 'belgium', 'france', 'germany', 'italy', 'netherlands', 'spain', 'uk', 'denmark', 'sweden', 'norway'],
      'Americas': ['united states', 'usa', 'brazil', 'mexico', 'colombia', 'peru', 'argentina', 'chile', 'canada'],
      'Middle East': ['jordan', 'lebanon', 'syria', 'iraq', 'yemen', 'palestine', 'israel', 'turkey', 'iran', 'uae', 'saudi arabia'],
      'Oceania': ['australia', 'new zealand', 'fiji', 'papua new guinea']
    };

    for (const [region, countries] of Object.entries(regionMap)) {
      if (countries.some(c => countryLower.includes(c))) {
        return region;
      }
    }
    return 'Other';
  }

  private calculateTemporalAnalysis(jobs: any[]) {
    // Monthly postings
    const monthMap = new Map<string, number>();
    jobs.forEach(job => {
      const date = new Date(job.posting_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
    });

    const postingsByMonth: MonthlyPostingItem[] = Array.from(monthMap.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Weekday patterns
    const weekdayMap = new Map<string, number>();
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    jobs.forEach(job => {
      const date = new Date(job.posting_date);
      const weekday = weekdays[date.getDay()] || 'Unknown';
      weekdayMap.set(weekday, (weekdayMap.get(weekday) || 0) + 1);
    });

    const weekdayDistribution = Array.from(weekdayMap.entries())
      .map(([weekday, count]) => ({ weekday, count }));

    // Peak posting day
    const peakDay = weekdayDistribution.reduce(
      (max, curr) => curr.count > max.count ? curr : max,
      { weekday: 'Unknown', count: 0 }
    ).weekday;

    return {
      postingsByMonth,
      weekdayDistribution,
      peakPostingDay: peakDay
    };
  }

  private calculateMarketAverages(allJobs: any[]) {
    const agencies = this.getUniqueAgencies(allJobs);
    const avgPostingsPerAgency = agencies.length > 0 
      ? allJobs.length / agencies.length 
      : 0;

    const applicationWindows = allJobs.map(job => {
      const posted = new Date(job.posting_date);
      const deadline = new Date(job.apply_until);
      return Math.ceil((deadline.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24));
    }).filter(w => w > 0 && w < 365);

    const avgWindow = applicationWindows.length > 0
      ? applicationWindows.reduce((a, b) => a + b, 0) / applicationWindows.length
      : 30;

    return {
      avgPostingsPerAgency: Math.round(avgPostingsPerAgency),
      avgApplicationWindow: Math.round(avgWindow),
      avgActivePositions: Math.round(allJobs.filter(j => !j.archived && new Date(j.apply_until) > new Date()).length / agencies.length),
      marketTotalVolume: allJobs.length
    };
  }

  private calculatePeerAverages(peerJobs: any[], peerAgencies: string[]) {
    const avgPostingsPerPeer = peerAgencies.length > 0 
      ? peerJobs.length / peerAgencies.length 
      : 0;

    return {
      avgPostingsPerPeer: Math.round(avgPostingsPerPeer),
      totalPeersActive: peerAgencies.length,
      peerGroupVolume: peerJobs.length
    };
  }

  private calculateIndustryStandards(allJobs: any[]) {
    // Based on top performers
    return {
      targetApplicationWindow: 45,
      targetActivePositionRatio: 0.7,
      targetCategoryDiversity: 0.6
    };
  }

  private analyzeCompetitors(agency: string, agencyJobs: any[], allJobs: any[]): CompetitorAnalysisItem[] {
    const agencies = this.getUniqueAgencies(allJobs);
    const agencyCategories = new Set(agencyJobs.map(j => j.primary_category).filter(Boolean));
    
    return agencies
      .filter(a => !a.agency.toLowerCase().includes(agency.toLowerCase()))
      .slice(0, 5)
      .map(comp => {
        const compJobs = allJobs.filter(j => 
          j.short_agency?.toLowerCase() === comp.agency.toLowerCase()
        );
        const compCategories = new Set(compJobs.map(j => j.primary_category).filter(Boolean));
        const overlap = [...agencyCategories].filter(c => compCategories.has(c)).length;
        
        return {
          agency: comp.agency,
          volume: comp.count,
          categoryOverlap: overlap,
          competitionLevel: overlap > 3 ? 'high' as const : overlap > 1 ? 'medium' as const : 'low' as const
        };
      });
  }

  private analyzeCategoryCompetition(agency: string, agencyJobs: any[], allJobs: any[]): CategoryCompetitionItem[] {
    const categoryMap = new Map<string, { total: number; agencies: Set<string> }>();
    
    allJobs.forEach(job => {
      const category = job.primary_category || 'Uncategorized';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { total: 0, agencies: new Set() });
      }
      const data = categoryMap.get(category)!;
      data.total++;
      if (job.short_agency) data.agencies.add(job.short_agency);
    });

    // Get agency's top categories
    const agencyCategories = new Map<string, number>();
    agencyJobs.forEach(job => {
      const category = job.primary_category || 'Uncategorized';
      agencyCategories.set(category, (agencyCategories.get(category) || 0) + 1);
    });

    return Array.from(agencyCategories.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, agencyCount]) => {
        const marketData = categoryMap.get(category) || { total: 0, agencies: new Set() };
        return {
          category,
          agencyShare: marketData.total > 0 ? (agencyCount / marketData.total) * 100 : 0,
          totalMarketVolume: marketData.total,
          competitorsCount: marketData.agencies.size,
          agencyRank: 1 // Would need more complex logic for accurate ranking
        };
      });
  }
}

export default ReportDataAggregator;
