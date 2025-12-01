/**
 * Geographic Map Types
 * Types for the interactive geographic intelligence map
 */

import { HardshipClass } from '../../data/icscHardshipClassifications';

// View modes for the map
export type MapViewMode = 'your-agency' | 'peer-comparison' | 'market';

// Visualization style options
export type VisualizationMode = 'choropleth' | 'bubbles' | 'clusters';

// Color encoding options
export type ColorByOption = 'hardship' | 'location-type' | 'category' | 'seniority';

// Location types
export type LocationType = 'HQ' | 'Regional' | 'Field' | 'Home-based';

// Trend direction
export type TrendDirection = 'up' | 'down' | 'stable' | 'new' | 'exiting';

// Competition level
export type CompetitionLevel = 'low' | 'medium' | 'high';

/**
 * Data structure for a single location on the map
 */
export interface LocationMapData {
  // Location identifiers
  id: string;
  dutyStation: string;
  country: string;
  coordinates: [number, number]; // [lng, lat]
  
  // Classifications
  hardshipClass: HardshipClass;
  locationType: LocationType;
  region: string;
  
  // Your agency's data
  yourJobCount: number;
  yourJobsByCategory: Array<{ category: string; count: number; color?: string }>;
  yourJobsByGrade: Array<{ grade: string; count: number }>;
  yourTrend: {
    previousMonth: number;
    currentMonth: number;
    change: number;
    changePercent: number;
    direction: TrendDirection;
  };
  
  // Market data
  totalMarketJobs: number;
  totalMarketJobsByCategory: Array<{ category: string; count: number; color?: string }>;
  totalMarketJobsByGrade: Array<{ grade: string; count: number }>;
  agenciesPresent: Array<{ agency: string; count: number }>;
  yourMarketShare: number; // percentage
  competitionLevel: CompetitionLevel;
  agencyCount: number;
  
  // Flags
  isUniqueToYou: boolean; // Only your agency here
  isGap: boolean; // Others here but not you
}

/**
 * State for the map view
 */
export interface MapViewState {
  viewMode: MapViewMode;
  visualizationMode: VisualizationMode;
  selectedAgency: string;
  comparisonAgencies: string[];
  colorBy: ColorByOption;
  filters: {
    regions: string[];
    minJobs: number;
    hardshipLevels: HardshipClass[];
    showTrends: boolean;
    showGhostBubbles: boolean;
  };
  selectedLocation: string | null;
  zoom: number;
  center: [number, number];
}

/**
 * Country-level aggregated data for choropleth
 */
export interface CountryMapData {
  countryCode: string; // ISO 3166-1 alpha-3
  countryName: string;
  totalJobs: number;
  yourJobs: number;
  agencyCount: number;
  dominantHardship: HardshipClass;
  hardshipDEPercentage: number;
  dutyStations: string[];
  region: string;
}

/**
 * Summary statistics for the map
 */
export interface MapSummaryStats {
  // Your agency stats
  totalCountries: number;
  totalLocations: number;
  totalPositions: number;
  fieldPercentage: number;
  hardshipDEPercentage: number;
  uniqueLocations: number;
  
  // Market comparison
  marketCountries: number;
  marketLocations: number;
  marketPositions: number;
  marketFieldPercentage: number;
  marketHardshipDEPercentage: number;
  
  // Footprint breakdown
  hqCount: number;
  hqPercentage: number;
  regionalCount: number;
  regionalPercentage: number;
  fieldCount: number;
  fieldPositionPercentage: number;
  
  // Gap analysis
  gapLocations: string[];
  gapCount: number;
  
  // Home-based/Remote positions (tracked separately, not on map)
  homeBasedCount: number;
  homeBasedMarketCount: number;
}

/**
 * Minimal job data for display in location panel
 */
export interface LocationJobData {
  id: string;
  title: string;
  agency: string;
  grade: string;
  category: string;
  categoryColor: string;
  postingDate: string;
  closingDate: string;
  isYourAgency: boolean;
  // Status fields
  isActive: boolean;
  isExpired: boolean;
  daysRemaining: number;
  status: 'active' | 'closing_soon' | 'expired' | 'archived';
  // Job link
  url: string;
}

/**
 * Props for location detail panel
 */
export interface LocationDetailData {
  location: LocationMapData;
  // Detailed breakdowns
  categoryBreakdown: Array<{ category: string; count: number; percentage: number; color: string }>;
  gradeBreakdown: Array<{ grade: string; count: number; percentage: number }>;
  agencyRanking: Array<{ agency: string; count: number; share: number; isYou: boolean }>;
  // Jobs at this location
  jobs: LocationJobData[];
  // Insights
  competitionInsight: string;
  trendInsight: string;
}

/**
 * Bubble visual properties
 */
export interface BubbleProps {
  cx: number;
  cy: number;
  r: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  isGhost: boolean;
  trendDirection?: TrendDirection;
}

/**
 * Color schemes (optimized for light backgrounds)
 */
export const HARDSHIP_BUBBLE_COLORS: Record<HardshipClass, string> = {
  'A': '#16a34a', // Green 600 - Minimal
  'B': '#2563eb', // Blue 600 - Low
  'C': '#ca8a04', // Yellow 600 - Moderate
  'D': '#ea580c', // Orange 600 - High
  'E': '#dc2626', // Red 600 - Extreme
  'H': '#4b5563', // Gray 600 - HQ
  'U': '#6b7280', // Gray 500 - Unclassified
};

export const LOCATION_TYPE_COLORS: Record<LocationType, string> = {
  'HQ': '#4f46e5',       // Indigo 600
  'Regional': '#7c3aed', // Violet 600
  'Field': '#059669',    // Emerald 600
  'Home-based': '#475569' // Slate 600
};

export const TREND_COLORS = {
  up: '#16a34a',
  down: '#dc2626',
  stable: '#6b7280',
  new: '#2563eb',
  exiting: '#4b5563',
};

/**
 * Map theme colors (light professional)
 */
export const MAP_THEME = {
  // Base map - Light theme
  mapBg: '#f8fafc',         // Slate 50
  mapLand: '#e2e8f0',       // Slate 200
  mapLandHover: '#cbd5e1',  // Slate 300
  mapBorders: '#94a3b8',    // Slate 400
  mapOcean: '#f1f5f9',      // Slate 100
  
  // Bubbles
  yourBubbleStroke: '#ffffff',
  yourBubbleStrokeWidth: 2,
  
  // Ghost bubbles (other agencies)
  ghostFill: 'transparent',
  ghostStroke: '#94a3b8',   // Slate 400
  ghostStrokeDasharray: '4,3',
  ghostOpacity: 0.5,
  
  // Interaction
  hoverGlow: '0 0 12px currentColor',
};

/**
 * Choropleth color scale (light to dark blue)
 */
export const CHOROPLETH_SCALE = {
  // Job count color scale (light theme friendly)
  colors: [
    '#dbeafe', // Blue 100 - Very few jobs
    '#93c5fd', // Blue 300 - Few jobs  
    '#3b82f6', // Blue 500 - Moderate
    '#1d4ed8', // Blue 700 - Many jobs
    '#1e3a8a', // Blue 900 - Most jobs
  ],
  // No data
  noData: '#f1f5f9', // Slate 100
  // Thresholds (job counts)
  thresholds: [1, 5, 15, 50, 100],
};

/**
 * Get choropleth color based on job count
 */
export function getChoroplethColor(jobCount: number): string {
  if (jobCount === 0) return CHOROPLETH_SCALE.noData;
  if (jobCount < CHOROPLETH_SCALE.thresholds[0]) return CHOROPLETH_SCALE.noData;
  if (jobCount < CHOROPLETH_SCALE.thresholds[1]) return CHOROPLETH_SCALE.colors[0];
  if (jobCount < CHOROPLETH_SCALE.thresholds[2]) return CHOROPLETH_SCALE.colors[1];
  if (jobCount < CHOROPLETH_SCALE.thresholds[3]) return CHOROPLETH_SCALE.colors[2];
  if (jobCount < CHOROPLETH_SCALE.thresholds[4]) return CHOROPLETH_SCALE.colors[3];
  return CHOROPLETH_SCALE.colors[4];
}

/**
 * Cluster configuration
 */
export const CLUSTER_CONFIG = {
  // Minimum distance (in degrees) to cluster points
  radius: 5,
  // Minimum points to form a cluster
  minPoints: 2,
  // Cluster bubble color
  color: '#3b82f6',
  // Cluster border
  stroke: '#ffffff',
  strokeWidth: 2,
};

/**
 * Bubble size scale
 */
export function getBubbleRadius(jobCount: number): number {
  if (jobCount <= 0) return 0;
  if (jobCount <= 3) return 6;
  if (jobCount <= 10) return 10;
  if (jobCount <= 25) return 14;
  if (jobCount <= 50) return 18;
  if (jobCount <= 100) return 22;
  return 26;
}

/**
 * Get competition level based on agency count
 */
export function getCompetitionLevel(agencyCount: number): CompetitionLevel {
  if (agencyCount <= 2) return 'low';
  if (agencyCount <= 5) return 'medium';
  return 'high';
}

