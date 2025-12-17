/**
 * Location Classification for UN Workforce Analysis
 */

export type LocationType = 'Headquarters' | 'Regional Hub' | 'Field' | 'Home-based';

export interface LocationAnalysis {
  originalStation: string;
  originalCountry: string;
  locationType: LocationType;
  isHQ: boolean;
  isField: boolean;
  isDACCountry: boolean;
  isConflictZone: boolean;
  region: string;
  displayLocation: string;
}

// Primary UN Headquarters cities
const HQ_CITIES = [
  'new york', 'geneva', 'vienna', 'rome', 'paris', 'nairobi',
  'the hague', 'bonn', 'montreal', 'copenhagen', 'washington',
  'brussels', 'london', 'tokyo'
];

// Regional hub cities
const REGIONAL_HUBS = [
  'bangkok', 'beirut', 'addis ababa', 'santiago', 'amman',
  'dakar', 'panama city', 'johannesburg', 'cairo', 'istanbul',
  'kathmandu', 'manila', 'kuala lumpur', 'new delhi', 'pretoria',
  'abuja', 'lima', 'bogota', 'mexico city', 'jakarta'
];

// DAC donor countries (NOT considered "field")
const DAC_COUNTRIES = [
  'australia', 'austria', 'belgium', 'canada', 'czech republic', 'czechia',
  'denmark', 'estonia', 'finland', 'france', 'germany', 'greece', 'hungary',
  'iceland', 'ireland', 'israel', 'italy', 'japan', 'korea', 'south korea',
  'republic of korea', 'latvia', 'lithuania', 'luxembourg', 'netherlands',
  'new zealand', 'norway', 'poland', 'portugal', 'slovak republic', 'slovakia',
  'slovenia', 'spain', 'sweden', 'switzerland', 'united kingdom', 'uk',
  'united states', 'usa', 'us'
];

// High-income non-DAC (also NOT "field")
const HIGH_INCOME_NON_FIELD = [
  'singapore', 'hong kong', 'qatar', 'united arab emirates', 'uae',
  'saudi arabia', 'kuwait', 'bahrain', 'brunei'
];

// Active conflict zones
const CONFLICT_ZONES = [
  'afghanistan', 'syria', 'yemen', 'south sudan', 'somalia',
  'libya', 'ukraine', 'myanmar', 'sudan', 'haiti', 'mali',
  'central african republic', 'democratic republic of congo', 'drc',
  'burkina faso', 'niger', 'chad', 'ethiopia', 'eritrea', 'iraq'
];

/**
 * Classify a location
 */
export function classifyLocation(
  dutyStation: string, 
  dutyCountry: string, 
  dutyContinent: string
): LocationAnalysis {
  const station = (dutyStation || '').toLowerCase().trim();
  const country = (dutyCountry || '').toLowerCase().trim();
  const continent = (dutyContinent || '').toLowerCase().trim();
  
  // Check for home-based
  if (station.includes('home') || station.includes('remote') || station.includes('telecommut')) {
    return {
      originalStation: dutyStation,
      originalCountry: dutyCountry,
      locationType: 'Home-based',
      isHQ: false,
      isField: false,
      isDACCountry: false,
      isConflictZone: false,
      region: standardizeRegion(continent),
      displayLocation: 'Home-based'
    };
  }
  
  // Check for HQ cities
  const isHQCity = HQ_CITIES.some(hq => station.includes(hq));
  if (isHQCity) {
    return {
      originalStation: dutyStation,
      originalCountry: dutyCountry,
      locationType: 'Headquarters',
      isHQ: true,
      isField: false,
      isDACCountry: DAC_COUNTRIES.some(dac => country.includes(dac)),
      isConflictZone: false,
      region: standardizeRegion(continent),
      displayLocation: dutyStation || dutyCountry
    };
  }
  
  // Check for regional hubs
  const isRegionalHub = REGIONAL_HUBS.some(hub => station.includes(hub));
  if (isRegionalHub) {
    return {
      originalStation: dutyStation,
      originalCountry: dutyCountry,
      locationType: 'Regional Hub',
      isHQ: false,
      isField: false,
      isDACCountry: DAC_COUNTRIES.some(dac => country.includes(dac)),
      isConflictZone: CONFLICT_ZONES.some(cz => country.includes(cz)),
      region: standardizeRegion(continent),
      displayLocation: dutyStation || dutyCountry
    };
  }
  
  // Check if DAC/high-income country (NOT field)
  const isDACCountry = DAC_COUNTRIES.some(dac => country.includes(dac));
  const isHighIncome = HIGH_INCOME_NON_FIELD.some(hi => country.includes(hi));
  
  if (isDACCountry || isHighIncome) {
    return {
      originalStation: dutyStation,
      originalCountry: dutyCountry,
      locationType: 'Headquarters', // Treat liaison offices as HQ-type
      isHQ: false,
      isField: false,
      isDACCountry: true,
      isConflictZone: false,
      region: standardizeRegion(continent),
      displayLocation: dutyCountry || dutyStation
    };
  }
  
  // Everything else is Field
  return {
    originalStation: dutyStation,
    originalCountry: dutyCountry,
    locationType: 'Field',
    isHQ: false,
    isField: true,
    isDACCountry: false,
    isConflictZone: CONFLICT_ZONES.some(cz => country.includes(cz)),
    region: standardizeRegion(continent),
    displayLocation: dutyCountry || dutyStation
  };
}

/**
 * Get region from continent
 */
export function standardizeRegion(continent: string): string {
  const c = (continent || '').toLowerCase();
  
  if (c.includes('africa')) return 'Africa';
  if (c.includes('asia')) return 'Asia-Pacific';
  if (c.includes('europe')) return 'Europe';
  if (c.includes('latin') || c.includes('south america') || c.includes('central america')) return 'Latin America & Caribbean';
  if (c.includes('north') && c.includes('america')) return 'North America';
  if (c.includes('oceania') || c.includes('pacific')) return 'Asia-Pacific';
  if (c.includes('arab') || c.includes('middle east')) return 'Arab States';
  
  return 'Other';
}

/**
 * Location type colors for visualization
 */
export const LOCATION_TYPE_COLORS = {
  'Headquarters': '#3B82F6',    // Blue
  'Regional Hub': '#10B981',    // Green
  'Field': '#F59E0B',           // Amber
  'Home-based': '#8B5CF6'       // Purple
};

/**
 * Get all locations grouped by type
 */
export interface LocationGroup {
  type: LocationType;
  count: number;
  percentage: number;
  countries: Array<{ country: string; count: number }>;
  color: string;
}

export function groupLocationsByType(
  locations: Array<{ country: string; station: string; continent: string }>
): LocationGroup[] {
  const groups: Record<LocationType, { count: number; countries: Map<string, number> }> = {
    'Headquarters': { count: 0, countries: new Map() },
    'Regional Hub': { count: 0, countries: new Map() },
    'Field': { count: 0, countries: new Map() },
    'Home-based': { count: 0, countries: new Map() }
  };

  locations.forEach(loc => {
    const analysis = classifyLocation(loc.station, loc.country, loc.continent);
    groups[analysis.locationType].count++;
    
    const countryName = loc.country || 'Unknown';
    const current = groups[analysis.locationType].countries.get(countryName) || 0;
    groups[analysis.locationType].countries.set(countryName, current + 1);
  });

  const total = locations.length || 1;

  return Object.entries(groups).map(([type, data]) => ({
    type: type as LocationType,
    count: data.count,
    percentage: (data.count / total) * 100,
    countries: Array.from(data.countries.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count),
    color: LOCATION_TYPE_COLORS[type as LocationType]
  }));
}














