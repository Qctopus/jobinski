import { ProcessedJobData } from '../../types';
import { BaseProcessor } from '../core/BaseProcessor';

export type LocationType = 'Headquarters' | 'Regional' | 'Field' | 'Home-based';

export interface GeographicCluster {
  region: string;
  subRegion: string;
  isConflictZone: boolean;
  isDevelopingCountry: boolean;
}

/**
 * Specialized processor for location and geographic classification.
 * Handles duty station classification and geographic clustering.
 */
export class LocationClassifier extends BaseProcessor {
  private hqLocations = [
    'new york', 'geneva', 'vienna', 'nairobi', 'bangkok', 
    'addis ababa', 'beirut', 'santiago'
  ];
  
  private conflictZones = [
    'afghanistan', 'syria', 'yemen', 'south sudan', 
    'somalia', 'libya', 'ukraine', 'myanmar'
  ];
  
  private developedCountries = [
    'united states', 'switzerland', 'austria', 'denmark', 
    'norway', 'canada', 'australia', 'germany', 'france', 
    'united kingdom', 'japan', 'south korea', 'singapore'
  ];

  /**
   * Determine location type based on duty station and country
   */
  determineLocationType(dutyStation: string, dutyCountry?: string): LocationType {
    const station = dutyStation.toLowerCase();
    const country = (dutyCountry || '').toLowerCase();
    
    // Check for home-based/remote work
    if (this.isHomeBasedLocation(station)) {
      return 'Home-based';
    }
    
    // Check for major UN headquarters locations
    if (this.isHeadquarters(station, country)) {
      return 'Headquarters';
    }
    
    // Check for regional offices
    if (this.isRegionalOffice(station)) {
      return 'Regional';
    }
    
    return 'Field';
  }

  /**
   * Get geographic cluster information for a location
   */
  getGeographicCluster(dutyCountry: string, dutyContinent: string): GeographicCluster {
    const country = (dutyCountry || '').toLowerCase();
    const continent = (dutyContinent || '').toLowerCase();
    
    const region = this.standardizeRegion(continent);
    const subRegion = this.determineSubRegion(country, continent);
    const isConflictZone = this.conflictZones.includes(country);
    const isDevelopingCountry = !this.developedCountries.includes(country);
    
    return {
      region,
      subRegion,
      isConflictZone,
      isDevelopingCountry
    };
  }

  /**
   * Batch classify locations for multiple jobs
   */
  classifyLocations(jobs: ProcessedJobData[]): ProcessedJobData[] {
    const startTime = Date.now();
    
    const classifiedJobs = jobs.map(job => {
      const locationType = this.determineLocationType(job.duty_station, job.duty_country);
      const geoCluster = this.getGeographicCluster(job.duty_country || '', job.duty_continent || '');
      
      return {
        ...job,
        location_type: locationType,
        geographic_region: geoCluster.region,
        geographic_subregion: geoCluster.subRegion,
        is_conflict_zone: geoCluster.isConflictZone,
        is_developing_country: geoCluster.isDevelopingCountry
      };
    });

    this.logPerformance('Location Classification', startTime, jobs.length);
    return classifiedJobs;
  }

  /**
   * Get location statistics for a dataset
   */
  getLocationStatistics(jobs: ProcessedJobData[]): {
    locationTypeDistribution: Map<LocationType, number>;
    regionDistribution: Map<string, number>;
    conflictZonePercentage: number;
    developingCountryPercentage: number;
    topCountries: Array<{ country: string; count: number; percentage: number }>;
  } {
    const locationTypeDistribution = new Map<LocationType, number>();
    const regionDistribution = new Map<string, number>();
    const countryCount = new Map<string, number>();
    let conflictZoneCount = 0;
    let developingCountryCount = 0;

    jobs.forEach(job => {
      // Location type distribution
      const locationType = job.location_type || 'Field';
      locationTypeDistribution.set(locationType, (locationTypeDistribution.get(locationType) || 0) + 1);
      
      // Region distribution
      const region = job.geographic_region || 'Unknown';
      regionDistribution.set(region, (regionDistribution.get(region) || 0) + 1);
      
      // Country count
      const country = job.duty_country || 'Unknown';
      countryCount.set(country, (countryCount.get(country) || 0) + 1);
      
      // Special classifications
      if (job.is_conflict_zone) conflictZoneCount++;
      if (job.is_developing_country) developingCountryCount++;
    });

    const topCountries = this.getTopItems(countryCount, 10).map(item => ({
      country: item.item,
      count: item.count,
      percentage: item.percentage
    }));

    return {
      locationTypeDistribution,
      regionDistribution,
      conflictZonePercentage: this.calculatePercentage(conflictZoneCount, jobs.length),
      developingCountryPercentage: this.calculatePercentage(developingCountryCount, jobs.length),
      topCountries
    };
  }

  /**
   * Get hardship classifications based on location characteristics
   */
  getHardshipClassification(job: ProcessedJobData): {
    hardshipLevel: 'Low' | 'Medium' | 'High' | 'Extreme';
    factors: string[];
  } {
    const factors: string[] = [];
    let hardshipScore = 0;

    // Conflict zone adds significant hardship
    if (job.is_conflict_zone) {
      factors.push('Conflict Zone');
      hardshipScore += 3;
    }

    // Field locations generally have higher hardship
    if (job.location_type === 'Field') {
      factors.push('Field Location');
      hardshipScore += 1;
    }

    // Developing countries may have infrastructure challenges
    if (job.is_developing_country) {
      factors.push('Developing Country');
      hardshipScore += 1;
    }

    // Determine hardship level
    let hardshipLevel: 'Low' | 'Medium' | 'High' | 'Extreme';
    if (hardshipScore === 0) hardshipLevel = 'Low';
    else if (hardshipScore <= 2) hardshipLevel = 'Medium';
    else if (hardshipScore <= 4) hardshipLevel = 'High';
    else hardshipLevel = 'Extreme';

    return { hardshipLevel, factors };
  }

  // Private helper methods
  private isHomeBasedLocation(station: string): boolean {
    return station.includes('home based') || 
           station.includes('remote') || 
           station.includes('telecommuting');
  }

  private isHeadquarters(station: string, country: string): boolean {
    return this.hqLocations.some(hq => 
      station.includes(hq) || country.includes(hq)
    );
  }

  private isRegionalOffice(station: string): boolean {
    return station.includes('regional') || 
           station.includes('hub') || 
           station.includes('multi-country') || 
           station.includes('sub-regional');
  }

  private standardizeRegion(continent: string): string {
    const regionMap: { [key: string]: string } = {
      'africa': 'Africa',
      'asia': 'Asia',
      'europe': 'Europe',
      'north america': 'North America',
      'south america': 'South America',
      'oceania': 'Oceania',
      'antarctica': 'Antarctica'
    };
    
    return regionMap[continent] || 'Unknown';
  }

  private determineSubRegion(country: string, continent: string): string {
    // Africa sub-regions
    if (continent === 'africa') {
      if (['kenya', 'ethiopia', 'uganda', 'tanzania', 'rwanda'].includes(country)) {
        return 'East Africa';
      }
      if (['senegal', 'mali', 'burkina faso', 'ghana', 'nigeria'].includes(country)) {
        return 'West Africa';
      }
      if (['south africa', 'botswana', 'zambia', 'zimbabwe'].includes(country)) {
        return 'Southern Africa';
      }
      if (['morocco', 'algeria', 'tunisia', 'egypt'].includes(country)) {
        return 'North Africa';
      }
      return 'Central Africa';
    }
    
    // Asia sub-regions
    if (continent === 'asia') {
      if (['thailand', 'philippines', 'vietnam', 'indonesia', 'malaysia'].includes(country)) {
        return 'Southeast Asia';
      }
      if (['afghanistan', 'bangladesh', 'nepal', 'pakistan', 'india'].includes(country)) {
        return 'South Asia';
      }
      if (['china', 'japan', 'south korea', 'mongolia'].includes(country)) {
        return 'East Asia';
      }
      if (['kazakhstan', 'uzbekistan', 'kyrgyzstan'].includes(country)) {
        return 'Central Asia';
      }
      return 'West Asia';
    }
    
    return 'Other';
  }
}
