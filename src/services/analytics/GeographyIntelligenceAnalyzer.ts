/**
 * Geography Intelligence Analyzer
 * 
 * Provides comprehensive geographic analysis for UN job postings including:
 * - ICSC Hardship Classification mapping
 * - HQ vs Regional vs Field analysis
 * - National Officer identification
 * - Regional programme coverage
 * - Localization metrics
 */

import { ProcessedJobData } from '../../types';
import { 
  HardshipClass, 
  getHardshipClassification, 
  getUNRegion,
  HARDSHIP_COLORS,
  HARDSHIP_LABELS,
  HARDSHIP_SHORT_LABELS
} from '../../data/icscHardshipClassifications';
import { parseISO, subWeeks, isWithinInterval } from 'date-fns';

// ============ TYPES ============

export interface GeographyKPIs {
  countriesActive: number;
  fieldPercentage: number;
  hardshipDEPercentage: number;
  nationalOfficerPercentage: number;
  // Market comparison values
  marketCountries?: number;
  marketFieldPercentage?: number;
  marketHardshipDEPercentage?: number;
  marketNationalOfficerPercentage?: number;
}

export interface HardshipDistribution {
  hardshipClass: HardshipClass;
  label: string;
  shortLabel: string;
  count: number;
  percentage: number;
  color: string;
  topStations: Array<{ station: string; country: string; count: number }>;
}

export interface HardshipProfile {
  totalPositions: number;
  distribution: HardshipDistribution[];
  topHardshipLocations: Array<{ 
    station: string; 
    country: string; 
    hardshipClass: HardshipClass;
    count: number;
    percentage: number;
  }>;
  hardshipDECount: number;
  hardshipDEPercentage: number;
}

export type LocationCategory = 'HQ' | 'Regional' | 'Field' | 'Home-based';

export interface OperationalFootprint {
  totalPositions: number;
  categories: Array<{
    category: LocationCategory;
    count: number;
    percentage: number;
    color: string;
    description: string;
    topLocations: Array<{ location: string; count: number }>;
  }>;
  fieldPositions: number;
  fieldPercentage: number;
}

export interface RegionalCoverage {
  region: string;
  totalCount: number;
  percentage: number;
  hardshipBreakdown: Array<{
    hardshipClass: HardshipClass;
    count: number;
    percentage: number;
    color: string;
  }>;
  topCountries: Array<{ country: string; count: number }>;
}

export interface CountryAnalysis {
  country: string;
  totalJobs: number;
  dutyStations: Array<{
    station: string;
    hardshipClass: HardshipClass;
    count: number;
    topCategories: string[];
    topGrades: string[];
  }>;
  hardshipDEPercentage: number;
  nationalOfficerPercentage: number;
  topCategories: Array<{ category: string; count: number; percentage: number }>;
  staffComposition: {
    internationalProfessional: number;
    nationalOfficer: number;
    generalService: number;
  };
}

export interface NationalOfficerAnalysis {
  totalNOPositions: number;
  percentage: number;
  byCountry: Array<{
    country: string;
    count: number;
    percentage: number;
  }>;
  byCategory: Array<{
    category: string;
    noCount: number;
    totalCount: number;
    noPercentage: number;
  }>;
  byLocationType: Array<{
    locationType: LocationCategory;
    noPercentage: number;
    ipPercentage: number;
  }>;
}

export interface GeographicTrend {
  type: 'new' | 'growth' | 'decline';
  location: string;
  locationType: 'country' | 'region';
  change: number;
  count: number;
  context?: string;
}

export interface GeographicInsight {
  type: 'hardship' | 'footprint' | 'localization' | 'regional' | 'trend';
  title: string;
  description: string;
  metric?: string;
  impact: 'high' | 'medium' | 'low';
}

// ============ CONSTANTS ============

// HQ locations (major UN headquarters cities)
const HQ_LOCATIONS = [
  'new york', 'geneva', 'vienna', 'rome', 'nairobi', 'paris',
  'the hague', 'montreal', 'bonn', 'madrid', 'copenhagen',
  'washington', 'london', 'brussels'
];

// Regional hub locations
const REGIONAL_HUB_LOCATIONS = [
  'bangkok', 'addis ababa', 'santiago', 'beirut', 'dakar',
  'johannesburg', 'panama city', 'istanbul', 'amman', 'cairo',
  'kathmandu', 'lima', 'pretoria', 'new delhi', 'jakarta',
  'abuja', 'bogota', 'mexico city', 'manila', 'kuala lumpur'
];

// Location category colors
const LOCATION_CATEGORY_COLORS: Record<LocationCategory, string> = {
  'HQ': '#3B82F6',       // Blue
  'Regional': '#10B981', // Green
  'Field': '#F59E0B',    // Amber
  'Home-based': '#8B5CF6' // Purple
};

// ============ ANALYZER CLASS ============

export class GeographyIntelligenceAnalyzer {
  
  /**
   * Calculate key geography KPIs
   */
  calculateKPIs(
    jobs: ProcessedJobData[], 
    filterAgency?: string,
    marketJobs?: ProcessedJobData[]
  ): GeographyKPIs {
    const filteredJobs = filterAgency 
      ? jobs.filter(j => (j.short_agency || j.long_agency) === filterAgency)
      : jobs;
    
    // Count unique countries
    const countries = new Set<string>();
    let fieldCount = 0;
    let hardshipDECount = 0;
    let nationalOfficerCount = 0;
    
    filteredJobs.forEach(job => {
      if (job.duty_country) countries.add(job.duty_country);
      
      const locCat = this.classifyLocationType(job.duty_station);
      if (locCat === 'Field') fieldCount++;
      
      const { hardshipClass } = getHardshipClassification(job.duty_station, job.duty_country);
      if (hardshipClass === 'D' || hardshipClass === 'E') hardshipDECount++;
      
      if (this.isNationalOfficer(job.up_grade, job.title)) nationalOfficerCount++;
    });
    
    const total = filteredJobs.length || 1;
    
    const kpis: GeographyKPIs = {
      countriesActive: countries.size,
      fieldPercentage: (fieldCount / total) * 100,
      hardshipDEPercentage: (hardshipDECount / total) * 100,
      nationalOfficerPercentage: (nationalOfficerCount / total) * 100
    };
    
    // Calculate market comparison if available
    if (marketJobs && filterAgency) {
      const marketKPIs = this.calculateKPIs(marketJobs);
      kpis.marketCountries = marketKPIs.countriesActive;
      kpis.marketFieldPercentage = marketKPIs.fieldPercentage;
      kpis.marketHardshipDEPercentage = marketKPIs.hardshipDEPercentage;
      kpis.marketNationalOfficerPercentage = marketKPIs.nationalOfficerPercentage;
    }
    
    return kpis;
  }
  
  /**
   * Calculate hardship profile
   */
  calculateHardshipProfile(jobs: ProcessedJobData[], filterAgency?: string): HardshipProfile {
    const filteredJobs = filterAgency 
      ? jobs.filter(j => (j.short_agency || j.long_agency) === filterAgency)
      : jobs;
    
    // Count by hardship class
    const hardshipCounts: Record<HardshipClass, Map<string, { country: string; count: number }>> = {
      'A': new Map(),
      'B': new Map(),
      'C': new Map(),
      'D': new Map(),
      'E': new Map(),
      'H': new Map(),
      'U': new Map()
    };
    
    const classTotals: Record<HardshipClass, number> = {
      'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0, 'H': 0, 'U': 0
    };
    
    const locationCounts: Map<string, { 
      station: string; 
      country: string; 
      hardshipClass: HardshipClass;
      count: number;
    }> = new Map();
    
    filteredJobs.forEach(job => {
      const { hardshipClass } = getHardshipClassification(job.duty_station, job.duty_country);
      classTotals[hardshipClass]++;
      
      const station = job.duty_station || 'Unknown';
      const country = job.duty_country || 'Unknown';
      const key = `${station}|${country}`;
      
      // Track by station within class
      const stationKey = station.toLowerCase();
      const existing = hardshipCounts[hardshipClass].get(stationKey);
      if (existing) {
        existing.count++;
      } else {
        hardshipCounts[hardshipClass].set(stationKey, { country, count: 1 });
      }
      
      // Track for top locations
      const locExisting = locationCounts.get(key);
      if (locExisting) {
        locExisting.count++;
      } else {
        locationCounts.set(key, { station, country, hardshipClass, count: 1 });
      }
    });
    
    const total = filteredJobs.length || 1;
    
    // Build distribution
    const distribution: HardshipDistribution[] = (['A', 'B', 'C', 'D', 'E', 'U'] as HardshipClass[]).map(hc => {
      const count = classTotals[hc];
      const stationMap = hardshipCounts[hc];
      
      const topStations = Array.from(stationMap.entries())
        .map(([station, data]) => ({ station, country: data.country, count: data.count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      return {
        hardshipClass: hc,
        label: HARDSHIP_LABELS[hc],
        shortLabel: HARDSHIP_SHORT_LABELS[hc],
        count,
        percentage: (count / total) * 100,
        color: HARDSHIP_COLORS[hc],
        topStations
      };
    });
    
    // Top hardship locations (D+E only)
    const topHardshipLocations = Array.from(locationCounts.values())
      .filter(loc => loc.hardshipClass === 'D' || loc.hardshipClass === 'E')
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(loc => ({
        ...loc,
        percentage: (loc.count / total) * 100
      }));
    
    return {
      totalPositions: filteredJobs.length,
      distribution,
      topHardshipLocations,
      hardshipDECount: classTotals['D'] + classTotals['E'],
      hardshipDEPercentage: ((classTotals['D'] + classTotals['E']) / total) * 100
    };
  }
  
  /**
   * Calculate operational footprint (HQ vs Field)
   */
  calculateOperationalFootprint(jobs: ProcessedJobData[], filterAgency?: string): OperationalFootprint {
    const filteredJobs = filterAgency 
      ? jobs.filter(j => (j.short_agency || j.long_agency) === filterAgency)
      : jobs;
    
    const categories: Record<LocationCategory, Map<string, number>> = {
      'HQ': new Map(),
      'Regional': new Map(),
      'Field': new Map(),
      'Home-based': new Map()
    };
    
    const categoryTotals: Record<LocationCategory, number> = {
      'HQ': 0,
      'Regional': 0,
      'Field': 0,
      'Home-based': 0
    };
    
    filteredJobs.forEach(job => {
      const category = this.classifyLocationType(job.duty_station);
      categoryTotals[category]++;
      
      const location = job.duty_station || job.duty_country || 'Unknown';
      categories[category].set(location, (categories[category].get(location) || 0) + 1);
    });
    
    const total = filteredJobs.length || 1;
    
    const descriptions: Record<LocationCategory, string> = {
      'HQ': 'Geneva, NY, Vienna, Rome, Nairobi, Paris, etc.',
      'Regional': 'Bangkok, Addis, Santiago, Beirut, Dakar, etc.',
      'Field': 'Country offices, sub-offices',
      'Home-based': 'Remote/telecommuting positions'
    };
    
    return {
      totalPositions: filteredJobs.length,
      categories: (['HQ', 'Regional', 'Field', 'Home-based'] as LocationCategory[]).map(cat => ({
        category: cat,
        count: categoryTotals[cat],
        percentage: (categoryTotals[cat] / total) * 100,
        color: LOCATION_CATEGORY_COLORS[cat],
        description: descriptions[cat],
        topLocations: Array.from(categories[cat].entries())
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([location, count]) => ({ location, count }))
      })),
      fieldPositions: categoryTotals['Field'],
      fieldPercentage: (categoryTotals['Field'] / total) * 100
    };
  }
  
  /**
   * Calculate regional programme coverage
   */
  calculateRegionalCoverage(jobs: ProcessedJobData[], filterAgency?: string): RegionalCoverage[] {
    const filteredJobs = filterAgency 
      ? jobs.filter(j => (j.short_agency || j.long_agency) === filterAgency)
      : jobs;
    
    const regionData: Record<string, {
      total: number;
      hardship: Record<HardshipClass, number>;
      countries: Map<string, number>;
    }> = {};
    
    filteredJobs.forEach(job => {
      const region = getUNRegion(job.duty_country);
      const { hardshipClass } = getHardshipClassification(job.duty_station, job.duty_country);
      
      if (!regionData[region]) {
        regionData[region] = {
          total: 0,
          hardship: { 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0, 'H': 0, 'U': 0 },
          countries: new Map()
        };
      }
      
      regionData[region].total++;
      regionData[region].hardship[hardshipClass]++;
      
      const country = job.duty_country || 'Unknown';
      regionData[region].countries.set(country, (regionData[region].countries.get(country) || 0) + 1);
    });
    
    const total = filteredJobs.length || 1;
    
    return Object.entries(regionData)
      .map(([region, data]) => ({
        region,
        totalCount: data.total,
        percentage: (data.total / total) * 100,
        hardshipBreakdown: (['A', 'B', 'C', 'D', 'E'] as HardshipClass[])
          .filter(hc => data.hardship[hc] > 0)
          .map(hc => ({
            hardshipClass: hc,
            count: data.hardship[hc],
            percentage: (data.hardship[hc] / data.total) * 100,
            color: HARDSHIP_COLORS[hc]
          })),
        topCountries: Array.from(data.countries.entries())
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([country, count]) => ({ country, count }))
      }))
      .sort((a, b) => b.totalCount - a.totalCount);
  }
  
  /**
   * Get detailed analysis for a specific country
   */
  getCountryAnalysis(jobs: ProcessedJobData[], country: string, filterAgency?: string): CountryAnalysis | null {
    const countryLower = country.toLowerCase();
    const filteredJobs = jobs.filter(j => {
      const matchAgency = !filterAgency || (j.short_agency || j.long_agency) === filterAgency;
      const matchCountry = (j.duty_country || '').toLowerCase().includes(countryLower);
      return matchAgency && matchCountry;
    });
    
    if (filteredJobs.length === 0) return null;
    
    // Group by duty station
    const stationData: Map<string, {
      hardshipClass: HardshipClass;
      count: number;
      categories: Map<string, number>;
      grades: Map<string, number>;
    }> = new Map();
    
    let hardshipDECount = 0;
    let noCount = 0;
    let ipCount = 0;
    let gsCount = 0;
    const categoryCounts: Map<string, number> = new Map();
    
    filteredJobs.forEach(job => {
      const station = job.duty_station || 'Unknown';
      const { hardshipClass } = getHardshipClassification(station, country);
      
      if (!stationData.has(station)) {
        stationData.set(station, {
          hardshipClass,
          count: 0,
          categories: new Map(),
          grades: new Map()
        });
      }
      
      const data = stationData.get(station)!;
      data.count++;
      
      const cat = job.sectoral_category || job.primary_category || 'Other';
      data.categories.set(cat, (data.categories.get(cat) || 0) + 1);
      categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
      
      const grade = job.up_grade || 'Unknown';
      data.grades.set(grade, (data.grades.get(grade) || 0) + 1);
      
      if (hardshipClass === 'D' || hardshipClass === 'E') hardshipDECount++;
      
      // Staff type
      if (this.isNationalOfficer(grade, job.title)) {
        noCount++;
      } else if (this.isGeneralService(grade)) {
        gsCount++;
      } else {
        ipCount++;
      }
    });
    
    const total = filteredJobs.length;
    
    return {
      country,
      totalJobs: total,
      dutyStations: Array.from(stationData.entries())
        .map(([station, data]) => ({
          station,
          hardshipClass: data.hardshipClass,
          count: data.count,
          topCategories: Array.from(data.categories.entries())
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([cat]) => cat),
          topGrades: Array.from(data.grades.entries())
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([grade]) => grade)
        }))
        .sort((a, b) => b.count - a.count),
      hardshipDEPercentage: (hardshipDECount / total) * 100,
      nationalOfficerPercentage: (noCount / total) * 100,
      topCategories: Array.from(categoryCounts.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([category, count]) => ({
          category,
          count,
          percentage: (count / total) * 100
        })),
      staffComposition: {
        internationalProfessional: Math.round((ipCount / total) * 100),
        nationalOfficer: Math.round((noCount / total) * 100),
        generalService: Math.round((gsCount / total) * 100)
      }
    };
  }
  
  /**
   * Calculate National Officer analysis
   */
  calculateNationalOfficerAnalysis(jobs: ProcessedJobData[], filterAgency?: string): NationalOfficerAnalysis {
    const filteredJobs = filterAgency 
      ? jobs.filter(j => (j.short_agency || j.long_agency) === filterAgency)
      : jobs;
    
    let noTotal = 0;
    const byCountry: Map<string, number> = new Map();
    const categoryData: Map<string, { no: number; total: number }> = new Map();
    const locationTypeData: Record<LocationCategory, { no: number; ip: number }> = {
      'HQ': { no: 0, ip: 0 },
      'Regional': { no: 0, ip: 0 },
      'Field': { no: 0, ip: 0 },
      'Home-based': { no: 0, ip: 0 }
    };
    
    filteredJobs.forEach(job => {
      const isNO = this.isNationalOfficer(job.up_grade, job.title);
      const category = job.sectoral_category || job.primary_category || 'Other';
      const locationType = this.classifyLocationType(job.duty_station);
      
      if (isNO) {
        noTotal++;
        const country = job.duty_country || 'Unknown';
        byCountry.set(country, (byCountry.get(country) || 0) + 1);
        locationTypeData[locationType].no++;
      } else {
        locationTypeData[locationType].ip++;
      }
      
      if (!categoryData.has(category)) {
        categoryData.set(category, { no: 0, total: 0 });
      }
      const catData = categoryData.get(category)!;
      catData.total++;
      if (isNO) catData.no++;
    });
    
    const total = filteredJobs.length || 1;
    
    return {
      totalNOPositions: noTotal,
      percentage: (noTotal / total) * 100,
      byCountry: Array.from(byCountry.entries())
        .map(([country, count]) => ({
          country,
          count,
          percentage: (count / noTotal) * 100
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      byCategory: Array.from(categoryData.entries())
        .filter(([, data]) => data.total >= 5)
        .map(([category, data]) => ({
          category,
          noCount: data.no,
          totalCount: data.total,
          noPercentage: (data.no / data.total) * 100
        }))
        .sort((a, b) => b.noPercentage - a.noPercentage)
        .slice(0, 10),
      byLocationType: (['HQ', 'Regional', 'Field', 'Home-based'] as LocationCategory[]).map(loc => {
        const data = locationTypeData[loc];
        const locTotal = data.no + data.ip || 1;
        return {
          locationType: loc,
          noPercentage: (data.no / locTotal) * 100,
          ipPercentage: (data.ip / locTotal) * 100
        };
      })
    };
  }
  
  /**
   * Calculate geographic trends over time
   */
  calculateGeographicTrends(
    jobs: ProcessedJobData[],
    filterAgency?: string
  ): GeographicTrend[] {
    const filteredJobs = filterAgency 
      ? jobs.filter(j => (j.short_agency || j.long_agency) === filterAgency)
      : jobs;
    
    const now = new Date();
    const fourWeeksAgo = subWeeks(now, 4);
    const eightWeeksAgo = subWeeks(now, 8);
    
    // Split into current and previous period
    const currentPeriod: ProcessedJobData[] = [];
    const previousPeriod: ProcessedJobData[] = [];
    
    filteredJobs.forEach(job => {
      try {
        const postDate = parseISO(job.posting_date);
        if (isWithinInterval(postDate, { start: fourWeeksAgo, end: now })) {
          currentPeriod.push(job);
        } else if (isWithinInterval(postDate, { start: eightWeeksAgo, end: fourWeeksAgo })) {
          previousPeriod.push(job);
        }
      } catch {
        // Skip jobs with invalid dates
      }
    });
    
    // Compare country counts
    const currentCountries: Map<string, number> = new Map();
    const previousCountries: Map<string, number> = new Map();
    
    currentPeriod.forEach(job => {
      const country = job.duty_country || 'Unknown';
      currentCountries.set(country, (currentCountries.get(country) || 0) + 1);
    });
    
    previousPeriod.forEach(job => {
      const country = job.duty_country || 'Unknown';
      previousCountries.set(country, (previousCountries.get(country) || 0) + 1);
    });
    
    const trends: GeographicTrend[] = [];
    
    // Find new countries
    currentCountries.forEach((count, country) => {
      if (!previousCountries.has(country) && count >= 2) {
        trends.push({
          type: 'new',
          location: country,
          locationType: 'country',
          change: 100,
          count,
          context: 'New presence this month'
        });
      }
    });
    
    // Find significant growth
    currentCountries.forEach((currentCount, country) => {
      const previousCount = previousCountries.get(country) || 0;
      if (previousCount > 0) {
        const change = ((currentCount - previousCount) / previousCount) * 100;
        if (change >= 50 && currentCount >= 3) {
          trends.push({
            type: 'growth',
            location: country,
            locationType: 'country',
            change,
            count: currentCount,
            context: `+${Math.round(change)}% vs previous 4 weeks`
          });
        } else if (change <= -50 && previousCount >= 3) {
          trends.push({
            type: 'decline',
            location: country,
            locationType: 'country',
            change,
            count: currentCount,
            context: `${Math.round(change)}% vs previous 4 weeks`
          });
        }
      }
    });
    
    return trends.sort((a, b) => {
      if (a.type === 'new') return -1;
      if (b.type === 'new') return 1;
      return Math.abs(b.change) - Math.abs(a.change);
    }).slice(0, 10);
  }
  
  /**
   * Generate strategic insights
   */
  generateInsights(
    jobs: ProcessedJobData[],
    filterAgency?: string,
    marketJobs?: ProcessedJobData[]
  ): GeographicInsight[] {
    const insights: GeographicInsight[] = [];
    
    const kpis = this.calculateKPIs(jobs, filterAgency, marketJobs);
    const hardshipProfile = this.calculateHardshipProfile(jobs, filterAgency);
    const footprint = this.calculateOperationalFootprint(jobs, filterAgency);
    const noAnalysis = this.calculateNationalOfficerAnalysis(jobs, filterAgency);
    const regionalCoverage = this.calculateRegionalCoverage(jobs, filterAgency);
    
    // Hardship insights
    if (kpis.hardshipDEPercentage > 30) {
      insights.push({
        type: 'hardship',
        title: 'High Hardship Exposure',
        description: `${kpis.hardshipDEPercentage.toFixed(0)}% of positions are in D/E hardship locations. Consider staff welfare and rotation policies.`,
        metric: `${kpis.hardshipDEPercentage.toFixed(0)}% in D+E`,
        impact: kpis.hardshipDEPercentage > 40 ? 'high' : 'medium'
      });
    }
    
    // Compare to market if available
    if (kpis.marketHardshipDEPercentage !== undefined) {
      const diff = kpis.hardshipDEPercentage - kpis.marketHardshipDEPercentage;
      if (Math.abs(diff) > 10) {
        insights.push({
          type: 'hardship',
          title: diff > 0 ? 'Above-Average Hardship Exposure' : 'Below-Average Hardship Exposure',
          description: diff > 0
            ? `Your hardship exposure (${kpis.hardshipDEPercentage.toFixed(0)}%) is ${diff.toFixed(0)}pp above UN system average.`
            : `Your hardship exposure (${kpis.hardshipDEPercentage.toFixed(0)}%) is ${Math.abs(diff).toFixed(0)}pp below UN system average.`,
          metric: `${diff > 0 ? '+' : ''}${diff.toFixed(0)}pp vs market`,
          impact: 'medium'
        });
      }
    }
    
    // Field presence insights
    if (kpis.fieldPercentage > 70) {
      insights.push({
        type: 'footprint',
        title: 'Strong Field Presence',
        description: `${kpis.fieldPercentage.toFixed(0)}% of positions are field-based, demonstrating operational focus on programme delivery.`,
        metric: `${kpis.fieldPercentage.toFixed(0)}% field`,
        impact: 'low'
      });
    } else if (kpis.fieldPercentage < 40) {
      insights.push({
        type: 'footprint',
        title: 'HQ-Concentrated Footprint',
        description: `Only ${kpis.fieldPercentage.toFixed(0)}% of positions are field-based. Consider decentralization opportunities.`,
        metric: `${kpis.fieldPercentage.toFixed(0)}% field`,
        impact: 'medium'
      });
    }
    
    // National Officer insights
    if (noAnalysis.percentage > 25) {
      insights.push({
        type: 'localization',
        title: 'Strong Localization',
        description: `${noAnalysis.percentage.toFixed(0)}% National Officer ratio demonstrates commitment to local capacity building.`,
        metric: `${noAnalysis.percentage.toFixed(0)}% NO`,
        impact: 'low'
      });
    }
    
    if (kpis.marketNationalOfficerPercentage !== undefined) {
      const diff = noAnalysis.percentage - kpis.marketNationalOfficerPercentage;
      if (diff > 5) {
        insights.push({
          type: 'localization',
          title: 'Localization Leader',
          description: `Your NO ratio (${noAnalysis.percentage.toFixed(0)}%) exceeds UN system average by ${diff.toFixed(0)}pp.`,
          metric: `+${diff.toFixed(0)}pp vs market`,
          impact: 'low'
        });
      }
    }
    
    // Regional concentration
    const topRegion = regionalCoverage[0];
    if (topRegion && topRegion.percentage > 50) {
      insights.push({
        type: 'regional',
        title: 'Regional Concentration',
        description: `${topRegion.percentage.toFixed(0)}% of positions are in ${topRegion.region}. Consider if this aligns with mandate.`,
        metric: `${topRegion.percentage.toFixed(0)}% in ${topRegion.region}`,
        impact: topRegion.percentage > 70 ? 'medium' : 'low'
      });
    }
    
    // Ensure at least one positive insight
    if (insights.length === 0) {
      insights.push({
        type: 'footprint',
        title: 'Balanced Geographic Distribution',
        description: 'Your geographic footprint shows healthy balance between HQ, regional, and field presence.',
        impact: 'low'
      });
    }
    
    return insights;
  }
  
  /**
   * Get list of unique countries from jobs
   */
  getUniqueCountries(jobs: ProcessedJobData[], filterAgency?: string): string[] {
    const filteredJobs = filterAgency 
      ? jobs.filter(j => (j.short_agency || j.long_agency) === filterAgency)
      : jobs;
    
    const countryCounts: Map<string, number> = new Map();
    
    filteredJobs.forEach(job => {
      const country = job.duty_country;
      if (country) {
        countryCounts.set(country, (countryCounts.get(country) || 0) + 1);
      }
    });
    
    return Array.from(countryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([country]) => country);
  }
  
  // ============ HELPER METHODS ============
  
  /**
   * Classify location type
   */
  private classifyLocationType(dutyStation: string): LocationCategory {
    const station = (dutyStation || '').toLowerCase().trim();
    
    // Check for home-based
    if (station.includes('home') || station.includes('remote') || station.includes('telecommut')) {
      return 'Home-based';
    }
    
    // Check for HQ
    if (HQ_LOCATIONS.some(hq => station.includes(hq))) {
      return 'HQ';
    }
    
    // Check for regional hub
    if (REGIONAL_HUB_LOCATIONS.some(hub => station.includes(hub))) {
      return 'Regional';
    }
    
    return 'Field';
  }
  
  /**
   * Check if position is National Officer
   */
  private isNationalOfficer(grade: string, title: string): boolean {
    const gradeUpper = (grade || '').toUpperCase();
    const titleLower = (title || '').toLowerCase();
    
    // Check grade patterns
    const noGradePatterns = ['NO-A', 'NO-B', 'NO-C', 'NO-D', 'NOA', 'NOB', 'NOC', 'NOD', 'NO-'];
    if (noGradePatterns.some(pattern => gradeUpper.includes(pattern))) {
      return true;
    }
    
    // Check title patterns
    if (titleLower.includes('national officer') || 
        titleLower.includes('national programme officer') ||
        titleLower.includes('national project officer') ||
        titleLower.includes('national professional officer')) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Check if position is General Service
   */
  private isGeneralService(grade: string): boolean {
    const gradeUpper = (grade || '').toUpperCase();
    return gradeUpper.startsWith('G') || 
           gradeUpper.startsWith('GS') ||
           gradeUpper.includes('G-') ||
           gradeUpper.includes('GL-') ||
           gradeUpper.includes('FS-');
  }
}

export default GeographyIntelligenceAnalyzer;












