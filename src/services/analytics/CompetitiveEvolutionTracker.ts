import { ProcessedJobData } from '../../types';
import { TemporalAnalyzer } from './TemporalAnalyzer';

/**
 * Competitive Evolution over time
 * Phase 2 Tab 4 implementation
 */
export interface CompetitiveEvolution {
  agency: string;
  timeline: Array<{
    period: string;
    market_share: number;
    rank: number;
    hiring_velocity: number;
    momentum: 'accelerating' | 'steady' | 'decelerating';
  }>;
  
  strategic_moves: Array<{
    period: string;
    move: string;
    impact: 'high' | 'medium' | 'low';
  }>;
}

/**
 * Competitive Positioning Matrix
 */
export interface PositioningMatrix {
  your_agency: {
    market_share: number;
    growth_rate: number;
    category_diversity: number;
    geographic_reach: number;
  };
  
  direct_competitors: Array<{
    agency: string;
    similarity_score: number;
    threat_level: 'high' | 'medium' | 'low';
    overlapping_categories: string[];
  }>;
  
  market_leaders: Array<{
    agency: string;
    leadership_areas: string[];
    competitive_gaps: string[];
  }>;
}

/**
 * Talent War Zones
 */
export interface TalentWarZone {
  category: string;
  competition_intensity: number;
  agencies_competing: number;
  
  leader: {
    agency: string;
    market_share: number;
  };
  
  recent_entries: string[];
  recent_exits: string[];
  
  your_position: {
    rank: number;
    market_share: number;
    trend: 'gaining' | 'stable' | 'losing';
  };
  
  strategic_recommendation: 'attack' | 'defend' | 'maintain' | 'exit';
}

/**
 * Competitive Evolution Tracker
 * Tracks how agencies compete over time
 */
export class CompetitiveEvolutionTracker {
  private temporalAnalyzer: TemporalAnalyzer;
  
  constructor() {
    this.temporalAnalyzer = new TemporalAnalyzer();
  }
  
  /**
   * Track competitive evolution over time
   */
  trackCompetitiveEvolution(
    jobs: ProcessedJobData[],
    periodType: 'month' | 'quarter' = 'month',
    topN: number = 10
  ): CompetitiveEvolution[] {
    const agencies = this.getTopAgencies(jobs, topN);
    const snapshots = this.temporalAnalyzer.getTemporalSnapshots(jobs, periodType);
    
    return agencies.map(agency => {
      const agencyJobs = jobs.filter(j => 
        j.short_agency === agency || j.long_agency === agency
      );
      
      // Build timeline
      const timeline = snapshots.map((snapshot, index) => {
        const jobsInPeriod = this.temporalAnalyzer.getJobsInPeriod(
          agencyJobs,
          snapshot.period,
          periodType
        );
        
        const prevSnapshot = index > 0 ? snapshots[index - 1] : null;
        const prevJobs = prevSnapshot
          ? this.temporalAnalyzer.getJobsInPeriod(agencyJobs, prevSnapshot.period, periodType)
          : [];
        
        const marketShare = snapshot.jobs_open > 0
          ? (jobsInPeriod.length / snapshot.jobs_open) * 100
          : 0;
        
        // Calculate rank
        const allAgenciesThisPeriod = this.getAgencyRankings(
          jobs,
          snapshot.period,
          periodType
        );
        const rank = allAgenciesThisPeriod.findIndex(a => a.agency === agency) + 1;
        
        // Calculate hiring velocity
        const hiringVelocity = jobsInPeriod.length / 4; // jobs per week (approximate)
        
        // Determine momentum
        const prevVelocity = prevJobs.length / 4;
        const momentum = this.calculateMomentum(hiringVelocity, prevVelocity);
        
        return {
          period: snapshot.period,
          market_share: Math.round(marketShare * 10) / 10,
          rank,
          hiring_velocity: Math.round(hiringVelocity * 10) / 10,
          momentum
        };
      });
      
      // Detect strategic moves
      const strategicMoves = this.detectStrategicMoves(agencyJobs, timeline);
      
      return {
        agency,
        timeline,
        strategic_moves: strategicMoves
      };
    });
  }
  
  /**
   * Create positioning matrix
   */
  createPositioningMatrix(
    jobs: ProcessedJobData[],
    selectedAgency?: string
  ): PositioningMatrix | null {
    if (!selectedAgency) return null;
    
    const yourJobs = jobs.filter(j => 
      j.short_agency === selectedAgency || j.long_agency === selectedAgency
    );
    
    if (yourJobs.length === 0) return null;
    
    // Calculate your metrics
    const yourMetrics = {
      market_share: (yourJobs.length / jobs.length) * 100,
      growth_rate: this.calculateGrowthRate(yourJobs),
      category_diversity: this.calculateCategoryDiversity(yourJobs),
      geographic_reach: this.calculateGeographicReach(yourJobs)
    };
    
    // Find direct competitors (similar category focus)
    const directCompetitors = this.findDirectCompetitors(jobs, yourJobs, selectedAgency);
    
    // Identify market leaders
    const marketLeaders = this.identifyMarketLeaders(jobs, selectedAgency);
    
    return {
      your_agency: yourMetrics,
      direct_competitors: directCompetitors,
      market_leaders: marketLeaders
    };
  }
  
  /**
   * Identify talent war zones
   */
  identifyTalentWarZones(
    jobs: ProcessedJobData[],
    selectedAgency?: string
  ): TalentWarZone[] {
    const categories = this.getUniqueCategories(jobs);
    
    return categories.map(category => {
      const categoryJobs = jobs.filter(j => j.primary_category === category);
      const agencies = this.getUniqueAgencies(categoryJobs);
      
      // Calculate competition intensity (0-10 scale)
      const intensity = Math.min(10, agencies.length * 0.5 + (categoryJobs.length / jobs.length) * 100);
      
      // Find leader
      const agencyCounts = this.countByAgency(categoryJobs);
      const leaderEntry = Object.entries(agencyCounts)
        .sort(([, a], [, b]) => b - a)[0];
      const leader = {
        agency: leaderEntry[0],
        market_share: (leaderEntry[1] / categoryJobs.length) * 100
      };
      
      // Detect recent entries/exits
      const now = new Date();
      const last3Months = categoryJobs.filter(j => {
        const monthsAgo = this.monthsDifference(new Date(j.posting_date), now);
        return monthsAgo <= 3;
      });
      const prev3To6Months = categoryJobs.filter(j => {
        const monthsAgo = this.monthsDifference(new Date(j.posting_date), now);
        return monthsAgo > 3 && monthsAgo <= 6;
      });
      
      const recentAgencies = this.getUniqueAgencies(last3Months);
      const previousAgencies = this.getUniqueAgencies(prev3To6Months);
      
      const recentEntries = recentAgencies.filter(a => !previousAgencies.includes(a));
      const recentExits = previousAgencies.filter(a => !recentAgencies.includes(a));
      
      // Your position
      let yourPosition = {
        rank: 0,
        market_share: 0,
        trend: 'stable' as 'gaining' | 'stable' | 'losing'
      };
      
      if (selectedAgency) {
        const yourCategoryJobs = categoryJobs.filter(j =>
          j.short_agency === selectedAgency || j.long_agency === selectedAgency
        );
        const yourRecent = last3Months.filter(j =>
          j.short_agency === selectedAgency || j.long_agency === selectedAgency
        );
        const yourPrevious = prev3To6Months.filter(j =>
          j.short_agency === selectedAgency || j.long_agency === selectedAgency
        );
        
        const rankings = Object.entries(agencyCounts)
          .sort(([, a], [, b]) => b - a);
        yourPosition.rank = rankings.findIndex(([a]) => a === selectedAgency) + 1;
        yourPosition.market_share = yourCategoryJobs.length > 0
          ? (yourCategoryJobs.length / categoryJobs.length) * 100
          : 0;
        
        // Determine trend
        if (yourRecent.length > yourPrevious.length * 1.2) {
          yourPosition.trend = 'gaining';
        } else if (yourRecent.length < yourPrevious.length * 0.8) {
          yourPosition.trend = 'losing';
        }
      }
      
      // Strategic recommendation
      const recommendation = this.determineRecommendation(
        intensity,
        yourPosition.market_share,
        yourPosition.trend
      );
      
      return {
        category,
        competition_intensity: Math.round(intensity * 10) / 10,
        agencies_competing: agencies.length,
        leader,
        recent_entries: recentEntries,
        recent_exits: recentExits,
        your_position: yourPosition,
        strategic_recommendation: recommendation
      };
    }).sort((a, b) => b.competition_intensity - a.competition_intensity);
  }
  
  /**
   * Helper: Get top agencies by volume
   */
  private getTopAgencies(jobs: ProcessedJobData[], topN: number): string[] {
    const counts = this.countByAgency(jobs);
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, topN)
      .map(([agency]) => agency);
  }
  
  /**
   * Helper: Get agency rankings for a specific period
   */
  private getAgencyRankings(
    jobs: ProcessedJobData[],
    period: string,
    periodType: 'month' | 'quarter'
  ): Array<{ agency: string; count: number }> {
    const jobsInPeriod = this.temporalAnalyzer.getJobsInPeriod(jobs, period, periodType);
    const counts = this.countByAgency(jobsInPeriod);
    
    return Object.entries(counts)
      .map(([agency, count]) => ({ agency, count }))
      .sort((a, b) => b.count - a.count);
  }
  
  /**
   * Helper: Calculate momentum
   */
  private calculateMomentum(
    current: number,
    previous: number
  ): 'accelerating' | 'steady' | 'decelerating' {
    if (previous === 0) return 'steady';
    const change = ((current - previous) / previous) * 100;
    if (change > 20) return 'accelerating';
    if (change < -20) return 'decelerating';
    return 'steady';
  }
  
  /**
   * Helper: Detect strategic moves
   */
  private detectStrategicMoves(
    agencyJobs: ProcessedJobData[],
    timeline: Array<{ period: string }>
  ): Array<{ period: string; move: string; impact: 'high' | 'medium' | 'low' }> {
    const moves: Array<{ period: string; move: string; impact: 'high' | 'medium' | 'low' }> = [];
    
    // Detect category expansion
    const categoriesByPeriod = new Map<string, Set<string>>();
    timeline.forEach(t => {
      const periodJobs = agencyJobs.filter(j => 
        j.posting_month === t.period || j.posting_quarter === t.period
      );
      categoriesByPeriod.set(t.period, new Set(periodJobs.map(j => j.primary_category)));
    });
    
    const periods = Array.from(categoriesByPeriod.keys()).sort();
    for (let i = 1; i < periods.length; i++) {
      const prevCategories = categoriesByPeriod.get(periods[i - 1]) || new Set();
      const currCategories = categoriesByPeriod.get(periods[i]) || new Set();
      
      const newCategories = Array.from(currCategories).filter(c => !prevCategories.has(c));
      if (newCategories.length > 0) {
        moves.push({
          period: periods[i],
          move: `Expanded into ${newCategories.slice(0, 2).join(', ')}${newCategories.length > 2 ? '...' : ''}`,
          impact: newCategories.length > 2 ? 'high' : newCategories.length > 1 ? 'medium' : 'low'
        });
      }
    }
    
    return moves.slice(0, 5); // Top 5 moves
  }
  
  /**
   * Helper: Calculate growth rate
   */
  private calculateGrowthRate(jobs: ProcessedJobData[]): number {
    const now = new Date();
    const recent = jobs.filter(j => {
      const monthsAgo = this.monthsDifference(new Date(j.posting_date), now);
      return monthsAgo <= 3;
    });
    const previous = jobs.filter(j => {
      const monthsAgo = this.monthsDifference(new Date(j.posting_date), now);
      return monthsAgo > 3 && monthsAgo <= 6;
    });
    
    if (previous.length === 0) return 0;
    return ((recent.length - previous.length) / previous.length) * 100;
  }
  
  /**
   * Helper: Calculate category diversity (Shannon entropy)
   */
  private calculateCategoryDiversity(jobs: ProcessedJobData[]): number {
    const categories = this.countByCategory(jobs);
    const total = jobs.length;
    
    let entropy = 0;
    Object.values(categories).forEach(count => {
      const p = count / total;
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    });
    
    return Math.round(entropy * 100) / 100;
  }
  
  /**
   * Helper: Calculate geographic reach
   */
  private calculateGeographicReach(jobs: ProcessedJobData[]): number {
    const countries = new Set(jobs.map(j => j.duty_country));
    return countries.size;
  }
  
  /**
   * Helper: Find direct competitors
   */
  private findDirectCompetitors(
    allJobs: ProcessedJobData[],
    yourJobs: ProcessedJobData[],
    yourAgency: string
  ): Array<{
    agency: string;
    similarity_score: number;
    threat_level: 'high' | 'medium' | 'low';
    overlapping_categories: string[];
  }> {
    const yourCategories = new Set(yourJobs.map(j => j.primary_category));
    const agencies = this.getUniqueAgencies(allJobs).filter(a => a !== yourAgency);
    
    const competitors = agencies.map(agency => {
      const theirJobs = allJobs.filter(j =>
        j.short_agency === agency || j.long_agency === agency
      );
      const theirCategories = new Set(theirJobs.map(j => j.primary_category));
      
      // Calculate Jaccard similarity
      const intersection = new Set([...yourCategories].filter(c => theirCategories.has(c)));
      const union = new Set([...yourCategories, ...theirCategories]);
      const similarity = union.size > 0 ? (intersection.size / union.size) * 100 : 0;
      
      const overlapping = Array.from(intersection);
      
      // Threat level based on similarity and their size
      let threatLevel: 'high' | 'medium' | 'low';
      if (similarity > 50 && theirJobs.length > yourJobs.length * 0.8) {
        threatLevel = 'high';
      } else if (similarity > 30) {
        threatLevel = 'medium';
      } else {
        threatLevel = 'low';
      }
      
      return {
        agency,
        similarity_score: Math.round(similarity * 10) / 10,
        threat_level: threatLevel,
        overlapping_categories: overlapping
      };
    });
    
    return competitors
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, 5);
  }
  
  /**
   * Helper: Identify market leaders
   */
  private identifyMarketLeaders(
    jobs: ProcessedJobData[],
    yourAgency: string
  ): Array<{
    agency: string;
    leadership_areas: string[];
    competitive_gaps: string[];
  }> {
    const categories = this.getUniqueCategories(jobs);
    const leadersByCategory = new Map<string, string>();
    
    categories.forEach(category => {
      const categoryJobs = jobs.filter(j => j.primary_category === category);
      const counts = this.countByAgency(categoryJobs);
      const leader = Object.entries(counts).sort(([, a], [, b]) => b - a)[0];
      if (leader) {
        leadersByCategory.set(category, leader[0]);
      }
    });
    
    // Group by leader
    const leaderAreas = new Map<string, string[]>();
    leadersByCategory.forEach((leader, category) => {
      const areas = leaderAreas.get(leader) || [];
      areas.push(category);
      leaderAreas.set(leader, areas);
    });
    
    // Get top leaders (excluding your agency)
    return Array.from(leaderAreas.entries())
      .filter(([agency]) => agency !== yourAgency)
      .map(([agency, areas]) => ({
        agency,
        leadership_areas: areas,
        competitive_gaps: areas // These are gaps where they lead and you don't
      }))
      .sort((a, b) => b.leadership_areas.length - a.leadership_areas.length)
      .slice(0, 5);
  }
  
  /**
   * Helper: Determine strategic recommendation
   */
  private determineRecommendation(
    intensity: number,
    marketShare: number,
    trend: string
  ): 'attack' | 'defend' | 'maintain' | 'exit' {
    if (intensity > 7 && marketShare < 10 && trend === 'losing') return 'exit';
    if (intensity > 7 && marketShare < 15 && trend === 'gaining') return 'attack';
    if (marketShare > 20 && trend === 'losing') return 'defend';
    if (marketShare > 20 && trend !== 'losing') return 'maintain';
    if (intensity < 5 && marketShare < 5) return 'exit';
    return 'maintain';
  }
  
  /**
   * Helper functions
   */
  private getUniqueCategories(jobs: ProcessedJobData[]): string[] {
    return Array.from(new Set(jobs.map(j => j.primary_category))).sort();
  }
  
  private getUniqueAgencies(jobs: ProcessedJobData[]): string[] {
    return Array.from(new Set(jobs.map(j => j.short_agency || j.long_agency))).sort();
  }
  
  private countByAgency(jobs: ProcessedJobData[]): { [agency: string]: number } {
    const counts: { [agency: string]: number } = {};
    jobs.forEach(job => {
      const agency = job.short_agency || job.long_agency;
      counts[agency] = (counts[agency] || 0) + 1;
    });
    return counts;
  }
  
  private countByCategory(jobs: ProcessedJobData[]): { [category: string]: number } {
    const counts: { [category: string]: number } = {};
    jobs.forEach(job => {
      counts[job.primary_category] = (counts[job.primary_category] || 0) + 1;
    });
    return counts;
  }
  
  private monthsDifference(date1: Date, date2: Date): number {
    const years = date2.getFullYear() - date1.getFullYear();
    const months = date2.getMonth() - date1.getMonth();
    return years * 12 + months;
  }
}




