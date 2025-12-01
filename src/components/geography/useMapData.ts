/**
 * useMapData Hook
 * Processes job data into map-ready location data
 */

import { useMemo } from 'react';
import { ProcessedJobData } from '../../types';
import { 
  LocationMapData, 
  MapSummaryStats, 
  LocationDetailData,
  LocationJobData,
  CountryMapData,
  getCompetitionLevel,
  TrendDirection,
} from './types';
import { 
  getDutyStationCoordinates, 
  classifyLocationType 
} from '../../data/dutyStationCoordinates';
import { 
  getHardshipClassification, 
  getUNRegion,
  HardshipClass 
} from '../../data/icscHardshipClassifications';
import { JOB_CLASSIFICATION_DICTIONARY } from '../../dictionary';
import { parseISO, subMonths, isWithinInterval } from 'date-fns';
import { getCountryIsoCode } from './countryIsoCodes';

interface UseMapDataProps {
  jobs: ProcessedJobData[];
  selectedAgency?: string;
  isAgencyView: boolean;
}

interface UseMapDataResult {
  locations: LocationMapData[];
  ghostLocations: LocationMapData[];
  countryData: CountryMapData[];
  summaryStats: MapSummaryStats;
  regions: string[];
  getLocationDetail: (locationId: string) => LocationDetailData | null;
}

export function useMapData({ jobs, selectedAgency, isAgencyView }: UseMapDataProps): UseMapDataResult {
  
  // Process jobs into location map data
  const { locations, ghostLocations, countryData, summaryStats, regions, jobsByLocation } = useMemo(() => {
    // Group jobs by location (dutyStation + country)
    const locationGroups = new Map<string, {
      dutyStation: string;
      country: string;
      jobs: ProcessedJobData[];
      yourJobs: ProcessedJobData[];
      marketJobs: ProcessedJobData[];
      allRawJobs: ProcessedJobData[]; // Keep all raw jobs for detail view
    }>();

    // Current and previous month boundaries
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = subMonths(currentMonthStart, 1);

    jobs.forEach(job => {
      const station = job.duty_station || 'Unknown';
      const country = job.duty_country || 'Unknown';
      const key = `${station.toLowerCase()}|${country.toLowerCase()}`;
      
      if (!locationGroups.has(key)) {
        locationGroups.set(key, {
          dutyStation: station,
          country: country,
          jobs: [],
          yourJobs: [],
          marketJobs: [],
          allRawJobs: [],
        });
      }
      
      const group = locationGroups.get(key)!;
      group.jobs.push(job);
      group.marketJobs.push(job);
      group.allRawJobs.push(job);
      
      // Check if this job belongs to the selected agency
      if (selectedAgency && (job.short_agency === selectedAgency || job.long_agency === selectedAgency)) {
        group.yourJobs.push(job);
      }
    });

    // Convert to LocationMapData array
    const allLocations: LocationMapData[] = [];
    const gapLocations: LocationMapData[] = [];
    const uniqueRegions = new Set<string>();
    
    // Track summary stats
    let totalYourCountries = new Set<string>();
    let totalYourPositions = 0;
    let yourFieldCount = 0;
    let yourHardshipDECount = 0;
    let yourHQCount = 0;
    let yourRegionalCount = 0;
    let uniqueLocationCount = 0;

    let marketCountries = new Set<string>();
    let marketPositions = 0;
    let marketFieldCount = 0;
    let marketHardshipDECount = 0;
    
    // Store raw jobs by location ID for detail view
    const jobsByLocation = new Map<string, ProcessedJobData[]>();

    // Track home-based/remote jobs separately (not shown on map)
    let homeBasedYourJobs = 0;
    let homeBasedMarketJobs = 0;

    locationGroups.forEach((group, key) => {
      const { dutyStation, country, yourJobs, marketJobs } = group;
      
      // Get coordinates and classifications
      const { coordinates, locationType } = getDutyStationCoordinates(dutyStation, country);
      const { hardshipClass } = getHardshipClassification(dutyStation, country);
      const region = getUNRegion(country);
      uniqueRegions.add(region);
      
      // Skip home-based/remote positions from map display (they don't have meaningful coordinates)
      // These would otherwise be mapped to capitals/HQ which distorts the visualization
      if (locationType === 'Home-based') {
        // Still track them for analytics
        homeBasedYourJobs += yourJobs.length;
        homeBasedMarketJobs += marketJobs.length;
        return; // Don't add to map
      }
      
      // Skip if coordinates couldn't be determined
      if (coordinates[0] === 0 && coordinates[1] === 0 && dutyStation !== 'Home-based') {
        // Try to get by country only
        const countryCoords = getDutyStationCoordinates(country, country);
        if (countryCoords.coordinates[0] === 0 && countryCoords.coordinates[1] === 0) {
          return; // Skip this location entirely
        }
      }

      // Calculate agency breakdown
      const agencyBreakdown = new Map<string, number>();
      marketJobs.forEach(job => {
        const agency = job.short_agency || job.long_agency || 'Unknown';
        agencyBreakdown.set(agency, (agencyBreakdown.get(agency) || 0) + 1);
      });

      // Sort agencies by count
      const agenciesPresent = Array.from(agencyBreakdown.entries())
        .map(([agency, count]) => ({ agency, count }))
        .sort((a, b) => b.count - a.count);

      // Calculate your job breakdown by category
      const categoryBreakdown = new Map<string, number>();
      yourJobs.forEach(job => {
        const cat = job.primary_category || 'Other';
        categoryBreakdown.set(cat, (categoryBreakdown.get(cat) || 0) + 1);
      });
      
      const yourJobsByCategory = Array.from(categoryBreakdown.entries())
        .map(([category, count]) => {
          const catDef = JOB_CLASSIFICATION_DICTIONARY.find(c => c.id === category);
          return { category, count, color: catDef?.color || '#6b7280' };
        })
        .sort((a, b) => b.count - a.count);

      // Calculate your job breakdown by grade
      const gradeBreakdown = new Map<string, number>();
      yourJobs.forEach(job => {
        const grade = job.up_grade || 'Unknown';
        gradeBreakdown.set(grade, (gradeBreakdown.get(grade) || 0) + 1);
      });
      
      const yourJobsByGrade = Array.from(gradeBreakdown.entries())
        .map(([grade, count]) => ({ grade, count }))
        .sort((a, b) => b.count - a.count);

      // Calculate TOTAL MARKET job breakdown by category (all agencies)
      const marketCategoryBreakdown = new Map<string, number>();
      marketJobs.forEach(job => {
        const cat = job.primary_category || 'Other';
        marketCategoryBreakdown.set(cat, (marketCategoryBreakdown.get(cat) || 0) + 1);
      });
      
      const totalMarketJobsByCategory = Array.from(marketCategoryBreakdown.entries())
        .map(([category, count]) => {
          const catDef = JOB_CLASSIFICATION_DICTIONARY.find(c => c.id === category);
          return { category, count, color: catDef?.color || '#6b7280' };
        })
        .sort((a, b) => b.count - a.count);

      // Calculate TOTAL MARKET job breakdown by grade (all agencies)
      const marketGradeBreakdown = new Map<string, number>();
      marketJobs.forEach(job => {
        const grade = job.up_grade || 'Unknown';
        marketGradeBreakdown.set(grade, (marketGradeBreakdown.get(grade) || 0) + 1);
      });
      
      const totalMarketJobsByGrade = Array.from(marketGradeBreakdown.entries())
        .map(([grade, count]) => ({ grade, count }))
        .sort((a, b) => b.count - a.count);

      // Calculate trend (current vs previous month)
      let currentMonthCount = 0;
      let previousMonthCount = 0;
      
      yourJobs.forEach(job => {
        try {
          const postDate = parseISO(job.posting_date);
          if (isWithinInterval(postDate, { start: currentMonthStart, end: now })) {
            currentMonthCount++;
          } else if (isWithinInterval(postDate, { start: previousMonthStart, end: currentMonthStart })) {
            previousMonthCount++;
          }
        } catch {
          // Invalid date, count as current
          currentMonthCount++;
        }
      });

      let trendDirection: TrendDirection = 'stable';
      const change = currentMonthCount - previousMonthCount;
      const changePercent = previousMonthCount > 0 
        ? ((currentMonthCount - previousMonthCount) / previousMonthCount) * 100 
        : currentMonthCount > 0 ? 100 : 0;

      if (previousMonthCount === 0 && currentMonthCount > 0) {
        trendDirection = 'new';
      } else if (currentMonthCount === 0 && previousMonthCount > 0) {
        trendDirection = 'exiting';
      } else if (changePercent > 10) {
        trendDirection = 'up';
      } else if (changePercent < -10) {
        trendDirection = 'down';
      }

      // Calculate market share
      const yourMarketShare = marketJobs.length > 0 
        ? (yourJobs.length / marketJobs.length) * 100 
        : 0;

      // Check if this is unique to your agency
      const isUniqueToYou = yourJobs.length > 0 && agenciesPresent.length === 1;
      
      // Check if this is a gap (others have it, you don't)
      const isGap = yourJobs.length === 0 && marketJobs.length > 0;

      const locationData: LocationMapData = {
        id: key,
        dutyStation,
        country,
        coordinates,
        hardshipClass,
        locationType,
        region,
        yourJobCount: yourJobs.length,
        yourJobsByCategory,
        yourJobsByGrade,
        yourTrend: {
          previousMonth: previousMonthCount,
          currentMonth: currentMonthCount,
          change,
          changePercent,
          direction: trendDirection,
        },
        totalMarketJobs: marketJobs.length,
        totalMarketJobsByCategory,
        totalMarketJobsByGrade,
        agenciesPresent,
        yourMarketShare,
        competitionLevel: getCompetitionLevel(agenciesPresent.length),
        agencyCount: agenciesPresent.length,
        isUniqueToYou,
        isGap,
      };
      
      // Store raw jobs for this location
      jobsByLocation.set(key, group.allRawJobs);

      // Update summary stats
      if (isAgencyView && selectedAgency) {
        if (yourJobs.length > 0) {
          totalYourCountries.add(country);
          totalYourPositions += yourJobs.length;
          
          if (locationType === 'Field') yourFieldCount += yourJobs.length;
          if (locationType === 'HQ') yourHQCount += yourJobs.length;
          if (locationType === 'Regional') yourRegionalCount += yourJobs.length;
          if (hardshipClass === 'D' || hardshipClass === 'E') yourHardshipDECount += yourJobs.length;
          if (isUniqueToYou) uniqueLocationCount++;
          
          allLocations.push(locationData);
        } else {
          gapLocations.push(locationData);
        }
      } else {
        // Market view - all locations
        totalYourCountries.add(country);
        totalYourPositions += marketJobs.length;
        
        if (locationType === 'Field') yourFieldCount += marketJobs.length;
        if (locationType === 'HQ') yourHQCount += marketJobs.length;
        if (locationType === 'Regional') yourRegionalCount += marketJobs.length;
        if (hardshipClass === 'D' || hardshipClass === 'E') yourHardshipDECount += marketJobs.length;
        
        allLocations.push(locationData);
      }

      // Market totals
      marketCountries.add(country);
      marketPositions += marketJobs.length;
      if (locationType === 'Field') marketFieldCount += marketJobs.length;
      if (hardshipClass === 'D' || hardshipClass === 'E') marketHardshipDECount += marketJobs.length;
    });

    // Calculate summary stats
    const stats: MapSummaryStats = {
      totalCountries: totalYourCountries.size,
      totalLocations: allLocations.length,
      totalPositions: totalYourPositions,
      fieldPercentage: totalYourPositions > 0 ? (yourFieldCount / totalYourPositions) * 100 : 0,
      hardshipDEPercentage: totalYourPositions > 0 ? (yourHardshipDECount / totalYourPositions) * 100 : 0,
      uniqueLocations: uniqueLocationCount,
      
      marketCountries: marketCountries.size,
      marketLocations: allLocations.length + gapLocations.length,
      marketPositions: marketPositions,
      marketFieldPercentage: marketPositions > 0 ? (marketFieldCount / marketPositions) * 100 : 0,
      marketHardshipDEPercentage: marketPositions > 0 ? (marketHardshipDECount / marketPositions) * 100 : 0,
      
      hqCount: yourHQCount,
      hqPercentage: totalYourPositions > 0 ? (yourHQCount / totalYourPositions) * 100 : 0,
      regionalCount: yourRegionalCount,
      regionalPercentage: totalYourPositions > 0 ? (yourRegionalCount / totalYourPositions) * 100 : 0,
      fieldCount: yourFieldCount,
      fieldPositionPercentage: totalYourPositions > 0 ? (yourFieldCount / totalYourPositions) * 100 : 0,
      
      gapLocations: gapLocations.map(l => l.dutyStation),
      gapCount: gapLocations.length,
      
      // Home-based positions (tracked separately from map)
      homeBasedCount: homeBasedYourJobs,
      homeBasedMarketCount: homeBasedMarketJobs,
    };

    // Aggregate data by country for choropleth
    const countryAggregates = new Map<string, {
      countryName: string;
      totalJobs: number;
      yourJobs: number;
      agencies: Set<string>;
      hardshipCounts: Record<HardshipClass, number>;
      dutyStations: Set<string>;
      region: string;
    }>();

    [...allLocations, ...gapLocations].forEach(loc => {
      const country = loc.country;
      if (!countryAggregates.has(country)) {
        countryAggregates.set(country, {
          countryName: country,
          totalJobs: 0,
          yourJobs: 0,
          agencies: new Set(),
          hardshipCounts: { 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'E': 0, 'H': 0, 'U': 0 },
          dutyStations: new Set(),
          region: loc.region,
        });
      }
      
      const agg = countryAggregates.get(country)!;
      agg.totalJobs += loc.totalMarketJobs;
      agg.yourJobs += loc.yourJobCount;
      agg.dutyStations.add(loc.dutyStation);
      loc.agenciesPresent.forEach(a => agg.agencies.add(a.agency));
      agg.hardshipCounts[loc.hardshipClass] += loc.totalMarketJobs;
    });

    const countryData: CountryMapData[] = Array.from(countryAggregates.entries())
      .map(([_, data]) => {
        const isoCode = getCountryIsoCode(data.countryName);
        const totalHardship = Object.values(data.hardshipCounts).reduce((a, b) => a + b, 0);
        const deCount = data.hardshipCounts['D'] + data.hardshipCounts['E'];
        
        // Find dominant hardship class
        let dominantHardship: HardshipClass = 'U';
        let maxCount = 0;
        for (const [hc, count] of Object.entries(data.hardshipCounts)) {
          if (count > maxCount) {
            maxCount = count;
            dominantHardship = hc as HardshipClass;
          }
        }
        
        return {
          countryCode: isoCode || data.countryName.substring(0, 3).toUpperCase(),
          countryName: data.countryName,
          totalJobs: data.totalJobs,
          yourJobs: data.yourJobs,
          agencyCount: data.agencies.size,
          dominantHardship,
          hardshipDEPercentage: totalHardship > 0 ? (deCount / totalHardship) * 100 : 0,
          dutyStations: Array.from(data.dutyStations),
          region: data.region,
        };
      })
      .sort((a, b) => b.totalJobs - a.totalJobs);

    return {
      locations: allLocations.sort((a, b) => b.yourJobCount - a.yourJobCount),
      ghostLocations: gapLocations,
      countryData,
      summaryStats: stats,
      regions: Array.from(uniqueRegions).sort(),
      jobsByLocation,
    };
  }, [jobs, selectedAgency, isAgencyView]);

  // Function to get detailed data for a specific location
  const getLocationDetail = useMemo(() => {
    return (locationId: string): LocationDetailData | null => {
      const location = [...locations, ...ghostLocations].find(l => l.id === locationId);
      if (!location) return null;

      // Build category breakdown with colors
      const categoryBreakdown = location.yourJobsByCategory.map(cat => {
        const total = location.yourJobCount || 1;
        const catDef = JOB_CLASSIFICATION_DICTIONARY.find(c => c.id === cat.category);
        return {
          category: catDef?.name || cat.category,
          count: cat.count,
          percentage: (cat.count / total) * 100,
          color: cat.color || '#6b7280',
        };
      });

      // Build grade breakdown
      const gradeBreakdown = location.yourJobsByGrade.map(grade => ({
        grade: grade.grade,
        count: grade.count,
        percentage: (grade.count / (location.yourJobCount || 1)) * 100,
      }));

      // Build agency ranking
      const agencyRanking = location.agenciesPresent.map(agency => ({
        agency: agency.agency,
        count: agency.count,
        share: (agency.count / location.totalMarketJobs) * 100,
        isYou: isAgencyView && agency.agency === selectedAgency,
      }));

      // Get raw jobs for this location and convert to LocationJobData
      const rawJobs = jobsByLocation.get(locationId) || [];
      
      // When in agency view, filter to only show the selected agency's jobs
      const filteredRawJobs = isAgencyView && selectedAgency
        ? rawJobs.filter(job => job.short_agency === selectedAgency || job.long_agency === selectedAgency)
        : rawJobs;
      
      const locationJobs: LocationJobData[] = filteredRawJobs
        .map(job => {
          const catDef = JOB_CLASSIFICATION_DICTIONARY.find(c => c.id === job.primary_category);
          const isYourAgency = isAgencyView && (job.short_agency === selectedAgency || job.long_agency === selectedAgency);
          return {
            id: job.id?.toString() || '',
            title: job.title || 'Untitled Position',
            agency: job.short_agency || job.long_agency || 'Unknown',
            grade: job.up_grade || 'Unknown',
            category: catDef?.name || job.primary_category || 'Unknown',
            categoryColor: catDef?.color || '#6b7280',
            postingDate: job.posting_date || '',
            closingDate: job.apply_until || '',
            isYourAgency,
            // Status fields
            isActive: job.is_active ?? false,
            isExpired: job.is_expired ?? false,
            daysRemaining: job.days_remaining ?? 0,
            status: job.status || 'expired',
            // Job link
            url: job.url || '',
          };
        })
        // Sort: active jobs first, then by posting date (newest first)
        .sort((a, b) => {
          // Active jobs first
          if (a.isActive && !b.isActive) return -1;
          if (!a.isActive && b.isActive) return 1;
          // Then by posting date (newest first)
          return new Date(b.postingDate).getTime() - new Date(a.postingDate).getTime();
        });

      // Generate competition insight
      let competitionInsight = '';
      if (location.competitionLevel === 'high') {
        competitionInsight = `This is a crowded talent market with ${location.agencyCount} agencies actively recruiting. Consider differentiation in your recruitment messaging.`;
      } else if (location.competitionLevel === 'medium') {
        competitionInsight = `Moderate competition with ${location.agencyCount} agencies present. Good opportunity for establishing stronger presence.`;
      } else {
        competitionInsight = `Low competition location with only ${location.agencyCount} ${location.agencyCount === 1 ? 'agency' : 'agencies'}. Potential for expanded operations.`;
      }

      // Generate trend insight
      let trendInsight = '';
      if (location.yourTrend.direction === 'up') {
        trendInsight = `Recruitment activity is increasing (+${location.yourTrend.changePercent.toFixed(0)}% vs last month). Monitor capacity and resource planning.`;
      } else if (location.yourTrend.direction === 'down') {
        trendInsight = `Recruitment activity is declining (${location.yourTrend.changePercent.toFixed(0)}% vs last month). Review strategic priorities for this location.`;
      } else if (location.yourTrend.direction === 'new') {
        trendInsight = `New recruitment presence this month. This represents geographic expansion into ${location.country}.`;
      } else if (location.yourTrend.direction === 'exiting') {
        trendInsight = `No new positions this month (had ${location.yourTrend.previousMonth} last month). Possible geographic consolidation.`;
      }

      return {
        location,
        categoryBreakdown,
        gradeBreakdown,
        agencyRanking,
        jobs: locationJobs,
        competitionInsight,
        trendInsight,
      };
    };
  }, [locations, ghostLocations, selectedAgency, isAgencyView, jobsByLocation]);

  return {
    locations,
    ghostLocations,
    countryData,
    summaryStats,
    regions,
    getLocationDetail,
  };
}

export default useMapData;

