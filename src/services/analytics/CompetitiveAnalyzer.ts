import { ProcessedJobData } from '../../types';
import { BaseProcessor } from '../core/BaseProcessor';

export interface CompetitiveIntelligence {
  agencyPositioning: { agency: string; volume: number; diversity: number; marketShare: number }[];
  categoryDominance: { category: string; leadingAgency: string; marketShare: number; competition: number }[];
  talentOverlap: { 
    agencies: [string, string]; 
    overlapScore: number; 
    commonCategories: string[]; 
    commonLocations: string[] 
  }[];
  competitiveIntensity: { category: string; location: string; agencyCount: number; intensity: 'High' | 'Medium' | 'Low' }[];
}

/**
 * Specialized service for competitive analysis and market intelligence.
 * Provides insights into agency positioning and market dynamics.
 */
export class CompetitiveAnalyzer extends BaseProcessor {
  /**
   * Calculate comprehensive competitive intelligence
   */
  calculateCompetitiveIntelligence(
    data: ProcessedJobData[], 
    expandSecretariat: boolean = true
  ): CompetitiveIntelligence {
    const startTime = Date.now();
    
    const intelligence: CompetitiveIntelligence = {
      agencyPositioning: this.calculateAgencyPositioning(data, expandSecretariat),
      categoryDominance: this.calculateCategoryDominance(data, expandSecretariat),
      talentOverlap: this.calculateTalentOverlap(data, expandSecretariat),
      competitiveIntensity: this.calculateCompetitiveIntensity(data)
    };

    this.logPerformance('Competitive Intelligence Calculation', startTime, data.length);
    return intelligence;
  }

  /**
   * Calculate agency market positioning
   */
  private calculateAgencyPositioning(
    data: ProcessedJobData[], 
    expandSecretariat: boolean
  ): { agency: string; volume: number; diversity: number; marketShare: number }[] {
    const agencyMap = this.buildAgencyMap(data, expandSecretariat);

    return Array.from(agencyMap.entries())
      .map(([agency, agencyData]) => ({
        agency,
        volume: agencyData.jobs.length,
        diversity: agencyData.categories.size,
        marketShare: this.calculatePercentage(agencyData.jobs.length, data.length)
      }))
      .sort((a, b) => b.volume - a.volume);
  }

  /**
   * Calculate category dominance analysis
   */
  private calculateCategoryDominance(
    data: ProcessedJobData[], 
    expandSecretariat: boolean
  ): { category: string; leadingAgency: string; marketShare: number; competition: number }[] {
    const categoryAgencyMap = new Map<string, Map<string, number>>();
    
    data.forEach(job => {
      const category = job.primary_category;
      let agency = job.short_agency || job.long_agency || 'Unknown';
      
      // For market analysis, break down UN Secretariat by departments
      if (expandSecretariat && agency === 'UN Secretariat' && job.department) {
        agency = `UN Secretariat - ${job.department}`;
      }
      
      if (!categoryAgencyMap.has(category)) {
        categoryAgencyMap.set(category, new Map());
      }
      const agencies = categoryAgencyMap.get(category)!;
      agencies.set(agency, (agencies.get(agency) || 0) + 1);
    });

    return Array.from(categoryAgencyMap.entries())
      .map(([category, agencies]) => {
        const totalCategoryJobs = Array.from(agencies.values()).reduce((sum, count) => sum + count, 0);
        const sortedAgencies = Array.from(agencies.entries()).sort(([,a], [,b]) => b - a);
        const leadingAgency = sortedAgencies[0][0];
        const leadingCount = sortedAgencies[0][1];
        
        return {
          category,
          leadingAgency,
          marketShare: this.calculatePercentage(leadingCount, totalCategoryJobs),
          competition: agencies.size
        };
      })
      .sort((a, b) => b.marketShare - a.marketShare);
  }

  /**
   * Calculate talent overlap between agencies
   */
  private calculateTalentOverlap(
    data: ProcessedJobData[], 
    expandSecretariat: boolean
  ): { agencies: [string, string]; overlapScore: number; commonCategories: string[]; commonLocations: string[] }[] {
    const agencyMap = this.buildAgencyMap(data, expandSecretariat);
    const agencies = Array.from(agencyMap.keys()).slice(0, 10); // Top 10 agencies
    const talentOverlap: {
      agencies: [string, string];
      overlapScore: number;
      commonCategories: string[];
      commonLocations: string[];
    }[] = [];

    for (let i = 0; i < agencies.length; i++) {
      for (let j = i + 1; j < agencies.length; j++) {
        const agency1Data = agencyMap.get(agencies[i])!;
        const agency2Data = agencyMap.get(agencies[j])!;
        
        const commonCategories = Array.from(agency1Data.categories)
          .filter(cat => agency2Data.categories.has(cat));
        const commonLocations = Array.from(agency1Data.locations)
          .filter(loc => agency2Data.locations.has(loc));
        
        const overlapScore = this.calculateOverlapScore(
          agency1Data, agency2Data, commonCategories, commonLocations
        );
        
        if (overlapScore > 10) { // Only include significant overlaps
          talentOverlap.push({
            agencies: [agencies[i], agencies[j]],
            overlapScore,
            commonCategories,
            commonLocations
          });
        }
      }
    }

    return talentOverlap.sort((a, b) => b.overlapScore - a.overlapScore);
  }

  /**
   * Calculate competitive intensity by category and location
   */
  private calculateCompetitiveIntensity(
    data: ProcessedJobData[]
  ): { category: string; location: string; agencyCount: number; intensity: 'High' | 'Medium' | 'Low' }[] {
    const competitionMap = new Map<string, Map<string, Set<string>>>();
    
    data.forEach(job => {
      const category = job.primary_category;
      const location = job.duty_country || 'Unknown';
      const agency = job.short_agency || job.long_agency || 'Unknown';
      
      if (!competitionMap.has(category)) {
        competitionMap.set(category, new Map());
      }
      const categoryData = competitionMap.get(category)!;
      if (!categoryData.has(location)) {
        categoryData.set(location, new Set());
      }
      categoryData.get(location)!.add(agency);
    });

    return Array.from(competitionMap.entries())
      .flatMap(([category, locations]) => 
        Array.from(locations.entries()).map(([location, agencies]) => {
          const agencyCount = agencies.size;
          let intensity: 'High' | 'Medium' | 'Low' = 'Low';
          if (agencyCount >= 5) intensity = 'High';
          else if (agencyCount >= 3) intensity = 'Medium';
          
          return { category, location, agencyCount, intensity };
        })
      )
      .filter(item => item.agencyCount > 1)
      .sort((a, b) => b.agencyCount - a.agencyCount);
  }

  /**
   * Build agency data map with categories and locations
   */
  private buildAgencyMap(data: ProcessedJobData[], expandSecretariat: boolean): Map<string, { 
    jobs: ProcessedJobData[]; 
    categories: Set<string>; 
    locations: Set<string> 
  }> {
    const agencyMap = new Map<string, { 
      jobs: ProcessedJobData[]; 
      categories: Set<string>; 
      locations: Set<string> 
    }>();
    
    data.forEach(job => {
      let agency = job.short_agency || job.long_agency || 'Unknown';
      
      // For market analysis, break down UN Secretariat by departments
      if (expandSecretariat && agency === 'UN Secretariat' && job.department) {
        agency = `UN Secretariat - ${job.department}`;
      }
      
      if (!agencyMap.has(agency)) {
        agencyMap.set(agency, { jobs: [], categories: new Set(), locations: new Set() });
      }
      const agencyData = agencyMap.get(agency)!;
      agencyData.jobs.push(job);
      agencyData.categories.add(job.primary_category);
      agencyData.locations.add(job.duty_country || 'Unknown');
    });

    return agencyMap;
  }

  /**
   * Calculate overlap score between two agencies
   */
  private calculateOverlapScore(
    agency1Data: { categories: Set<string>; locations: Set<string> },
    agency2Data: { categories: Set<string>; locations: Set<string> },
    commonCategories: string[],
    commonLocations: string[]
  ): number {
    const totalUnique = agency1Data.categories.size + agency1Data.locations.size + 
                       agency2Data.categories.size + agency2Data.locations.size - 
                       commonCategories.length - commonLocations.length;
    
    return totalUnique > 0 ? 
      ((commonCategories.length + commonLocations.length) / totalUnique) * 100 : 0;
  }

  /**
   * Get market concentration metrics
   */
  getMarketConcentration(data: ProcessedJobData[]): {
    herfindahlIndex: number;
    topNConcentration: { top3: number; top5: number; top10: number };
    marketLeader: { agency: string; marketShare: number };
  } {
    const agencyPositioning = this.calculateAgencyPositioning(data, true);
    const totalJobs = data.length;
    
    // Calculate Herfindahl-Hirschman Index
    const herfindahlIndex = agencyPositioning.reduce((sum, agency) => {
      const marketShare = agency.marketShare / 100; // Convert to decimal
      return sum + (marketShare * marketShare);
    }, 0) * 10000; // Scale to 0-10000

    // Top N concentration ratios
    const top3 = agencyPositioning.slice(0, 3).reduce((sum, agency) => sum + agency.marketShare, 0);
    const top5 = agencyPositioning.slice(0, 5).reduce((sum, agency) => sum + agency.marketShare, 0);
    const top10 = agencyPositioning.slice(0, 10).reduce((sum, agency) => sum + agency.marketShare, 0);

    const marketLeader = agencyPositioning[0] || { agency: 'Unknown', marketShare: 0 };

    return {
      herfindahlIndex,
      topNConcentration: { top3, top5, top10 },
      marketLeader: { agency: marketLeader.agency, marketShare: marketLeader.marketShare }
    };
  }
}
