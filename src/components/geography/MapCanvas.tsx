/**
 * MapCanvas Component
 * Interactive world map with multiple visualization modes
 */

import React, { useState, useMemo, useCallback, memo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps';
import { 
  LocationMapData, 
  MapViewState, 
  MAP_THEME, 
  HARDSHIP_BUBBLE_COLORS,
  LOCATION_TYPE_COLORS,
  TREND_COLORS,
  getBubbleRadius,
  ColorByOption,
  CountryMapData,
  getChoroplethColor,
  CHOROPLETH_SCALE,
  VisualizationMode,
} from './types';
import { HardshipClass } from '../../data/icscHardshipClassifications';

// World map TopoJSON URL
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface MapCanvasProps {
  locations: LocationMapData[];
  ghostLocations?: LocationMapData[];
  countryData: CountryMapData[];
  viewState: MapViewState;
  onLocationClick: (locationId: string) => void;
  onLocationHover: (locationId: string | null) => void;
  onCountryClick?: (countryCode: string) => void;
  onCountryHover?: (countryCode: string | null) => void;
  selectedAgencyName?: string;
  comparisonAgencies?: string[];
  externalPosition?: { center: [number, number]; zoom: number };
  homeBasedStats?: { count: number; marketCount: number };
}

// Agency colors for peer comparison
const AGENCY_COLORS = [
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#22c55e', // Green
  '#f59e0b', // Amber
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
];

// Country name mapping for GeoJSON properties
const COUNTRY_NAME_MAP: Record<string, string[]> = {
  'United States of America': ['United States', 'USA'],
  'United Kingdom': ['UK', 'Great Britain'],
  'Democratic Republic of the Congo': ['DRC', 'Congo, Democratic Republic'],
  'Republic of the Congo': ['Congo'],
  'United Republic of Tanzania': ['Tanzania'],
  "Côte d'Ivoire": ['Ivory Coast', "Cote d'Ivoire"],
  'Russian Federation': ['Russia'],
  'Syrian Arab Republic': ['Syria'],
  'Iran (Islamic Republic of)': ['Iran'],
  "Lao People's Democratic Republic": ['Laos', 'Lao PDR'],
  'Viet Nam': ['Vietnam'],
  'Republic of Korea': ['South Korea', 'Korea'],
  "Democratic People's Republic of Korea": ['North Korea'],
  'Myanmar': ['Burma'],
  'Czechia': ['Czech Republic'],
  'North Macedonia': ['Macedonia'],
  'Türkiye': ['Turkey', 'Turkiye'],
  'Turkey': ['Türkiye', 'Turkiye'],
  'State of Palestine': ['Palestine', 'Palestinian Territory'],
  // Ukraine cities - ensure proper spelling variants
  'Odessa': ['Odesa'],
  'Odesa': ['Odessa'],
};

function normalizeCountryName(name: string): string[] {
  const names = [name];
  if (COUNTRY_NAME_MAP[name]) {
    names.push(...COUNTRY_NAME_MAP[name]);
  }
  // Also add lowercase versions
  return names.map(n => n.toLowerCase());
}

const MapCanvas: React.FC<MapCanvasProps> = memo(({
  locations,
  ghostLocations = [],
  countryData,
  viewState,
  onLocationClick,
  onLocationHover,
  onCountryClick,
  onCountryHover,
  selectedAgencyName,
  comparisonAgencies = [],
  externalPosition,
  homeBasedStats,
}) => {
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [position, setPosition] = useState({ coordinates: [0, 20] as [number, number], zoom: 1 });

  // Sync with external position when it changes
  React.useEffect(() => {
    if (externalPosition) {
      setPosition({
        coordinates: externalPosition.center,
        zoom: externalPosition.zoom,
      });
    }
  }, [externalPosition]);

  // Create country lookup map for choropleth
  const countryLookup = useMemo(() => {
    const lookup = new Map<string, CountryMapData>();
    countryData.forEach(country => {
      // Add by country name (lowercase)
      lookup.set(country.countryName.toLowerCase(), country);
      // Also add by ISO code
      lookup.set(country.countryCode.toLowerCase(), country);
    });
    return lookup;
  }, [countryData]);

  // Get country data from GeoJSON properties
  const getCountryDataFromGeo = useCallback((geo: any): CountryMapData | null => {
    const geoName = geo.properties?.name || '';
    const geoCode = geo.properties?.ISO_A3 || geo.properties?.iso_a3 || '';
    
    // Try ISO code first
    if (geoCode && countryLookup.has(geoCode.toLowerCase())) {
      return countryLookup.get(geoCode.toLowerCase()) || null;
    }
    
    // Try direct name match
    if (countryLookup.has(geoName.toLowerCase())) {
      return countryLookup.get(geoName.toLowerCase()) || null;
    }
    
    // Try alternate names
    const alternates = normalizeCountryName(geoName);
    for (const alt of alternates) {
      if (countryLookup.has(alt)) {
        return countryLookup.get(alt) || null;
      }
    }
    
    // Try matching by partial name
    for (const [key, data] of countryLookup.entries()) {
      if (geoName.toLowerCase().includes(key) || key.includes(geoName.toLowerCase())) {
        return data;
      }
    }
    
    return null;
  }, [countryLookup]);

  // Get bubble color based on current color mode and view mode
  const getBubbleColor = useCallback((location: LocationMapData): string => {
    // Determine which data to use based on view mode
    // For 'market' or 'your-agency' without agency selection, use total market data
    // For 'your-agency' with agency selection, use your agency data
    const useMarketData = viewState.viewMode === 'market' || !selectedAgencyName;
    
    switch (viewState.colorBy) {
      case 'hardship':
        return HARDSHIP_BUBBLE_COLORS[location.hardshipClass] || HARDSHIP_BUBBLE_COLORS['U'];
      case 'location-type':
        return LOCATION_TYPE_COLORS[location.locationType] || LOCATION_TYPE_COLORS['Field'];
      case 'category':
        const categoryData = useMarketData ? location.totalMarketJobsByCategory : location.yourJobsByCategory;
        const topCategory = categoryData?.[0];
        return topCategory?.color || '#6b7280';
      case 'seniority':
        const gradeData = useMarketData ? location.totalMarketJobsByGrade : location.yourJobsByGrade;
        const topGrade = gradeData?.[0]?.grade || '';
        // Senior: D-level, P-5
        if (topGrade.includes('D') || topGrade.includes('P-5') || topGrade.includes('P5')) return '#7c3aed'; // Purple - Senior
        // Mid-level: P-3, P-4
        if (topGrade.includes('P-4') || topGrade.includes('P4') || topGrade.includes('P-3') || topGrade.includes('P3')) return '#3b82f6'; // Blue - Mid
        // Entry: P-1, P-2
        if (topGrade.includes('P-2') || topGrade.includes('P2') || topGrade.includes('P-1') || topGrade.includes('P1')) return '#22c55e'; // Green - Entry
        // National Officers
        if (topGrade.includes('NO')) return '#8b5cf6'; // Violet - National
        // General Service / Consultants
        if (topGrade.includes('G') || topGrade.toUpperCase().includes('CONSULT')) return '#f59e0b'; // Amber - GS/Consultant
        return '#6b7280';
      default:
        return HARDSHIP_BUBBLE_COLORS[location.hardshipClass] || '#6b7280';
    }
  }, [viewState.colorBy, viewState.viewMode, selectedAgencyName]);

  // Handle zoom
  const handleMoveEnd = useCallback((pos: { coordinates: [number, number]; zoom: number }) => {
    setPosition(pos);
  }, []);

  // Handle location click
  const handleMarkerClick = useCallback((locationId: string) => {
    onLocationClick(locationId);
  }, [onLocationClick]);

  // Handle hover
  const handleMarkerHover = useCallback((locationId: string | null) => {
    setHoveredLocation(locationId);
    onLocationHover(locationId);
  }, [onLocationHover]);

  // Handle country hover for choropleth
  const handleCountryHover = useCallback((countryName: string | null) => {
    setHoveredCountry(countryName);
    onCountryHover?.(countryName);
  }, [onCountryHover]);

  // Filter locations based on view state filters
  const filteredLocations = useMemo(() => {
    return locations.filter(loc => {
      if (viewState.filters.regions.length > 0 && !viewState.filters.regions.includes(loc.region)) {
        return false;
      }
      
      // Determine job count based on view mode
      let jobCount: number;
      if (viewState.viewMode === 'market') {
        jobCount = loc.totalMarketJobs;
      } else if (viewState.viewMode === 'peer-comparison') {
        // In peer-comparison mode, check if ANY of the selected agencies have positions here
        const agenciesToCheck = [selectedAgencyName, ...comparisonAgencies].filter(Boolean);
        if (agenciesToCheck.length === 0) {
          // No agencies selected, show nothing
          return false;
        }
        // Sum positions from all selected agencies at this location
        jobCount = loc.agenciesPresent
          .filter(a => agenciesToCheck.includes(a.agency))
          .reduce((sum, a) => sum + a.count, 0);
      } else {
        jobCount = loc.yourJobCount;
      }
      
      if (jobCount < viewState.filters.minJobs) {
        return false;
      }
      if (viewState.filters.hardshipLevels.length > 0 && !viewState.filters.hardshipLevels.includes(loc.hardshipClass)) {
        return false;
      }
      return true;
    });
  }, [locations, viewState.filters, viewState.viewMode, selectedAgencyName, comparisonAgencies]);

  // Filter ghost locations
  const filteredGhostLocations = useMemo(() => {
    if (!viewState.filters.showGhostBubbles) return [];
    return ghostLocations.filter(loc => {
      if (viewState.filters.regions.length > 0 && !viewState.filters.regions.includes(loc.region)) {
        return false;
      }
      return true;
    });
  }, [ghostLocations, viewState.filters]);

  // Cluster locations for cluster view
  const clusteredLocations = useMemo(() => {
    if (viewState.visualizationMode !== 'clusters') return [];
    
    const clusterRadius = 8 / position.zoom; // Adaptive clustering based on zoom
    const clusters: Array<{
      id: string;
      coordinates: [number, number];
      locations: LocationMapData[];
      totalJobs: number;
    }> = [];
    
    const processed = new Set<string>();
    
    filteredLocations.forEach(loc => {
      if (processed.has(loc.id)) return;
      
      // Find nearby locations
      const nearby = filteredLocations.filter(other => {
        if (processed.has(other.id)) return false;
        const dx = Math.abs(loc.coordinates[0] - other.coordinates[0]);
        const dy = Math.abs(loc.coordinates[1] - other.coordinates[1]);
        return dx < clusterRadius && dy < clusterRadius;
      });
      
      if (nearby.length > 0) {
        // Create cluster
        const allInCluster = [loc, ...nearby.filter(n => n.id !== loc.id)];
        const avgLng = allInCluster.reduce((sum, l) => sum + l.coordinates[0], 0) / allInCluster.length;
        const avgLat = allInCluster.reduce((sum, l) => sum + l.coordinates[1], 0) / allInCluster.length;
        const totalJobs = viewState.viewMode === 'market'
          ? allInCluster.reduce((sum, l) => sum + l.totalMarketJobs, 0)
          : allInCluster.reduce((sum, l) => sum + l.yourJobCount, 0);
        
        clusters.push({
          id: `cluster-${loc.id}`,
          coordinates: [avgLng, avgLat],
          locations: allInCluster,
          totalJobs,
        });
        
        allInCluster.forEach(l => processed.add(l.id));
      }
    });
    
    // Add unclustered locations as single-location clusters
    filteredLocations.forEach(loc => {
      if (!processed.has(loc.id)) {
        const jobCount = viewState.viewMode === 'market' ? loc.totalMarketJobs : loc.yourJobCount;
        clusters.push({
          id: loc.id,
          coordinates: loc.coordinates,
          locations: [loc],
          totalJobs: jobCount,
        });
      }
    });
    
    return clusters;
  }, [filteredLocations, viewState.visualizationMode, viewState.viewMode, position.zoom]);

  // Render trend arrow
  const renderTrendArrow = (location: LocationMapData, x: number, y: number) => {
    if (!viewState.filters.showTrends) return null;
    
    const { direction } = location.yourTrend;
    const arrowSize = 8;
    const offset = getBubbleRadius(location.yourJobCount) + 4;
    
    if (direction === 'stable') return null;
    
    const color = TREND_COLORS[direction];
    
    if (direction === 'up') {
      return (
        <g transform={`translate(${x + offset}, ${y - offset})`}>
          <polygon
            points={`0,-${arrowSize} ${arrowSize/2},0 -${arrowSize/2},0`}
            fill={color}
          />
        </g>
      );
    }
    
    if (direction === 'down') {
      return (
        <g transform={`translate(${x + offset}, ${y - offset})`}>
          <polygon
            points={`0,${arrowSize} ${arrowSize/2},0 -${arrowSize/2},0`}
            fill={color}
          />
        </g>
      );
    }
    
    if (direction === 'new') {
      return (
        <g transform={`translate(${x + offset}, ${y - offset})`}>
          <text
            fill={color}
            fontSize="10"
            fontWeight="bold"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            ★
          </text>
        </g>
      );
    }
    
    return null;
  };

  // Get cluster radius based on job count
  const getClusterRadius = (totalJobs: number, locationCount: number): number => {
    const baseRadius = Math.min(Math.sqrt(totalJobs) * 2 + 8, 40);
    return locationCount > 1 ? baseRadius : getBubbleRadius(totalJobs);
  };

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-lg overflow-hidden" style={{ backgroundColor: MAP_THEME.mapBg }}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 140,
          center: [0, 20],
        }}
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        <ZoomableGroup
          zoom={position.zoom}
          center={position.coordinates}
          onMoveEnd={handleMoveEnd}
          minZoom={1}
          maxZoom={8}
        >
          {/* Base map with choropleth coloring */}
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const countryInfo = getCountryDataFromGeo(geo);
                const geoName = geo.properties?.name || '';
                const isHovered = hoveredCountry === geoName;
                
                // Determine fill color based on visualization mode
                let fillColor = MAP_THEME.mapLand;
                if (viewState.visualizationMode === 'choropleth' && countryInfo) {
                  const jobCount = viewState.viewMode === 'market' 
                    ? countryInfo.totalJobs 
                    : countryInfo.yourJobs;
                  fillColor = getChoroplethColor(jobCount);
                }
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={isHovered && viewState.visualizationMode === 'choropleth' 
                      ? '#60a5fa' // Blue 400 for hover
                      : fillColor}
                    stroke={MAP_THEME.mapBorders}
                    strokeWidth={0.5}
                    style={{
                      default: { outline: 'none' },
                      hover: { 
                        fill: viewState.visualizationMode === 'choropleth' 
                          ? '#60a5fa' 
                          : MAP_THEME.mapLandHover, 
                        outline: 'none',
                        cursor: viewState.visualizationMode === 'choropleth' ? 'pointer' : 'default',
                      },
                      pressed: { outline: 'none' },
                    }}
                    onMouseEnter={() => {
                      if (viewState.visualizationMode === 'choropleth') {
                        handleCountryHover(geoName);
                      }
                    }}
                    onMouseLeave={() => {
                      if (viewState.visualizationMode === 'choropleth') {
                        handleCountryHover(null);
                      }
                    }}
                    onClick={() => {
                      if (viewState.visualizationMode === 'choropleth' && countryInfo) {
                        onCountryClick?.(countryInfo.countryName);
                      }
                    }}
                  />
                );
              })
            }
          </Geographies>

          {/* Render based on visualization mode */}
          {viewState.visualizationMode === 'bubbles' && (
            <>
              {/* Ghost bubbles (locations where others recruit but not you) */}
              {viewState.viewMode === 'your-agency' && filteredGhostLocations.map((location) => (
                <Marker
                  key={`ghost-${location.id}`}
                  coordinates={location.coordinates}
                >
                  <circle
                    r={getBubbleRadius(location.totalMarketJobs) * 0.8}
                    fill="transparent"
                    stroke={MAP_THEME.ghostStroke}
                    strokeWidth={1.5}
                    strokeDasharray={MAP_THEME.ghostStrokeDasharray}
                    opacity={MAP_THEME.ghostOpacity}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleMarkerClick(location.id)}
                    onMouseEnter={() => handleMarkerHover(location.id)}
                    onMouseLeave={() => handleMarkerHover(null)}
                  />
                </Marker>
              ))}

              {/* Agency bubbles */}
              {viewState.viewMode === 'your-agency' && filteredLocations.map((location) => {
                const isHovered = hoveredLocation === location.id;
                const isSelected = viewState.selectedLocation === location.id;
                const baseRadius = getBubbleRadius(location.yourJobCount);
                // Use direct radius change instead of CSS transform to prevent jitter
                const radius = isHovered ? baseRadius * 1.1 : baseRadius;
                const color = getBubbleColor(location);
                
                return (
                  <Marker
                    key={location.id}
                    coordinates={location.coordinates}
                  >
                    <circle
                      r={radius}
                      fill={color}
                      fillOpacity={0.85}
                      stroke="#ffffff"
                      strokeWidth={isHovered || isSelected ? 2.5 : 1.5}
                      style={{
                        cursor: 'pointer',
                        filter: isHovered ? `drop-shadow(0 2px 4px rgba(0,0,0,0.2))` : undefined,
                      }}
                      onClick={() => handleMarkerClick(location.id)}
                      onMouseEnter={() => handleMarkerHover(location.id)}
                      onMouseLeave={() => handleMarkerHover(null)}
                    />
                    
                    {radius >= 12 && (
                      <text
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        fill="white"
                        fontSize={radius >= 18 ? 10 : 8}
                        fontWeight="bold"
                        style={{ pointerEvents: 'none' }}
                      >
                        {location.yourJobCount}
                      </text>
                    )}
                    
                    {renderTrendArrow(location, 0, 0)}
                  </Marker>
                );
              })}

              {/* Peer comparison mode */}
              {viewState.viewMode === 'peer-comparison' && filteredLocations.map((location) => {
                const agenciesToShow = [selectedAgencyName, ...comparisonAgencies].filter(Boolean) as string[];
                const baseRadius = 10;
                const spacing = 8;
                
                return (
                  <Marker
                    key={location.id}
                    coordinates={location.coordinates}
                  >
                    <g>
                      {agenciesToShow.map((agency, index) => {
                        const agencyData = location.agenciesPresent.find(a => a.agency === agency);
                        if (!agencyData || agencyData.count === 0) return null;
                        
                        const xOffset = (index - (agenciesToShow.length - 1) / 2) * spacing;
                        const color = AGENCY_COLORS[index % AGENCY_COLORS.length];
                        const isYou = agency === selectedAgencyName;
                        
                        return (
                          <circle
                            key={`${location.id}-${agency}`}
                            cx={xOffset}
                            r={baseRadius}
                            fill={color}
                            fillOpacity={0.85}
                            stroke={isYou ? '#ffffff' : 'transparent'}
                            strokeWidth={isYou ? 2 : 0}
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleMarkerClick(location.id)}
                            onMouseEnter={() => handleMarkerHover(location.id)}
                            onMouseLeave={() => handleMarkerHover(null)}
                          />
                        );
                      })}
                    </g>
                  </Marker>
                );
              })}

              {/* Market view - all agencies combined */}
              {viewState.viewMode === 'market' && filteredLocations.map((location) => {
                const isHovered = hoveredLocation === location.id;
                const baseRadius = getBubbleRadius(location.totalMarketJobs);
                // Use direct radius change instead of CSS transform to prevent jitter
                const radius = isHovered ? baseRadius * 1.1 : baseRadius;
                const color = getBubbleColor(location);
                
                return (
                  <Marker
                    key={location.id}
                    coordinates={location.coordinates}
                  >
                    <circle
                      r={radius}
                      fill={color}
                      fillOpacity={0.8}
                      stroke="#ffffff"
                      strokeWidth={isHovered ? 2 : 1.5}
                      style={{
                        cursor: 'pointer',
                        filter: isHovered ? `drop-shadow(0 2px 4px rgba(0,0,0,0.2))` : undefined,
                      }}
                      onClick={() => handleMarkerClick(location.id)}
                      onMouseEnter={() => handleMarkerHover(location.id)}
                      onMouseLeave={() => handleMarkerHover(null)}
                    />
                    {radius >= 14 && (
                      <text
                        textAnchor="middle"
                        alignmentBaseline="middle"
                        fill="white"
                        fontSize={10}
                        fontWeight="bold"
                        style={{ pointerEvents: 'none' }}
                      >
                        {location.totalMarketJobs}
                      </text>
                    )}
                  </Marker>
                );
              })}
            </>
          )}

          {/* Cluster visualization mode */}
          {viewState.visualizationMode === 'clusters' && clusteredLocations.map((cluster) => {
            const isHovered = hoveredLocation === cluster.id;
            const baseRadius = getClusterRadius(cluster.totalJobs, cluster.locations.length);
            // Use direct radius change instead of CSS transform to prevent jitter
            const radius = isHovered ? baseRadius * 1.05 : baseRadius;
            const isCluster = cluster.locations.length > 1;
            
            return (
              <Marker
                key={cluster.id}
                coordinates={cluster.coordinates}
              >
                <circle
                  r={radius}
                  fill={isCluster ? '#3b82f6' : getBubbleColor(cluster.locations[0])}
                  fillOpacity={0.85}
                  stroke="#ffffff"
                  strokeWidth={isCluster ? 2.5 : 1.5}
                  style={{
                    cursor: 'pointer',
                    filter: isHovered ? `drop-shadow(0 2px 6px rgba(0,0,0,0.25))` : undefined,
                  }}
                  onClick={() => {
                    if (isCluster) {
                      // Zoom in when clicking a cluster
                      setPosition(prev => ({
                        coordinates: cluster.coordinates,
                        zoom: Math.min(prev.zoom * 2, 8),
                      }));
                    } else {
                      handleMarkerClick(cluster.locations[0].id);
                    }
                  }}
                  onMouseEnter={() => handleMarkerHover(cluster.id)}
                  onMouseLeave={() => handleMarkerHover(null)}
                />
                
                {/* Cluster count badge */}
                {isCluster && (
                  <>
                    <text
                      textAnchor="middle"
                      alignmentBaseline="middle"
                      fill="white"
                      fontSize={radius >= 20 ? 11 : 9}
                      fontWeight="bold"
                      style={{ pointerEvents: 'none' }}
                    >
                      {cluster.totalJobs}
                    </text>
                    {/* Location count indicator */}
                    <circle
                      cx={radius * 0.7}
                      cy={-radius * 0.7}
                      r={8}
                      fill="#1e40af"
                      stroke="#ffffff"
                      strokeWidth={1}
                    />
                    <text
                      x={radius * 0.7}
                      y={-radius * 0.7}
                      textAnchor="middle"
                      alignmentBaseline="middle"
                      fill="white"
                      fontSize={8}
                      fontWeight="bold"
                      style={{ pointerEvents: 'none' }}
                    >
                      {cluster.locations.length}
                    </text>
                  </>
                )}
                
                {/* Single location label */}
                {!isCluster && radius >= 12 && (
                  <text
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    fill="white"
                    fontSize={radius >= 18 ? 10 : 8}
                    fontWeight="bold"
                    style={{ pointerEvents: 'none' }}
                  >
                    {cluster.totalJobs}
                  </text>
                )}
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      {/* Hover tooltip for bubbles/clusters */}
      {hoveredLocation && viewState.visualizationMode !== 'choropleth' && (
        <LocationTooltip
          location={[...filteredLocations, ...filteredGhostLocations].find(l => l.id === hoveredLocation)}
          cluster={clusteredLocations.find(c => c.id === hoveredLocation)}
          viewMode={viewState.viewMode}
          visualizationMode={viewState.visualizationMode}
          selectedAgencyName={selectedAgencyName}
        />
      )}

      {/* Hover tooltip for choropleth */}
      {hoveredCountry && viewState.visualizationMode === 'choropleth' && (
        <ChoroplethTooltip
          countryName={hoveredCountry}
          countryData={countryData.find(c => 
            c.countryName.toLowerCase() === hoveredCountry.toLowerCase() ||
            normalizeCountryName(hoveredCountry).some(n => n === c.countryName.toLowerCase())
          )}
          viewMode={viewState.viewMode}
        />
      )}

      {/* Legend Stack - bottom left */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2">
        {/* Choropleth Legend */}
        {viewState.visualizationMode === 'choropleth' && (
          <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-2 shadow-sm">
            <div className="text-[10px] font-medium text-gray-700 mb-1.5">Job Count</div>
            <div className="flex flex-col gap-0.5">
              {CHOROPLETH_SCALE.colors.map((color, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <div 
                    className="w-3 h-2 rounded-sm" 
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-[9px] text-gray-600">
                    {idx === 0 && '1-4'}
                    {idx === 1 && '5-14'}
                    {idx === 2 && '15-49'}
                    {idx === 3 && '50-99'}
                    {idx === 4 && '100+'}
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-1.5 mt-0.5 pt-0.5 border-t border-gray-100">
                <div 
                  className="w-3 h-2 rounded-sm" 
                  style={{ backgroundColor: CHOROPLETH_SCALE.noData }}
                />
                <span className="text-[9px] text-gray-400">No data</span>
              </div>
            </div>
          </div>
        )}

        {/* Home-based/Remote positions panel - below legend on left */}
        {homeBasedStats && (homeBasedStats.count > 0 || homeBasedStats.marketCount > 0) && (
          <div className="bg-white/95 backdrop-blur-sm border border-purple-200 rounded-lg p-2 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-[9px] font-medium text-gray-700">Remote/Home-based</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-purple-600">
                {viewState.viewMode === 'market' ? homeBasedStats.marketCount : homeBasedStats.count}
              </span>
              <span className="text-[9px] text-gray-500">positions</span>
            </div>
            {viewState.viewMode !== 'market' && homeBasedStats.marketCount > 0 && (
              <div className="text-[8px] text-gray-400">
                {homeBasedStats.marketCount} in market
              </div>
            )}
          </div>
        )}
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1">
        <button
          onClick={() => setPosition(prev => ({ ...prev, zoom: Math.min(prev.zoom * 1.5, 8) }))}
          className="w-8 h-8 bg-white hover:bg-gray-50 text-gray-700 rounded-lg flex items-center justify-center text-lg font-bold border border-gray-200 shadow-sm transition-colors"
        >
          +
        </button>
        <button
          onClick={() => setPosition(prev => ({ ...prev, zoom: Math.max(prev.zoom / 1.5, 1) }))}
          className="w-8 h-8 bg-white hover:bg-gray-50 text-gray-700 rounded-lg flex items-center justify-center text-lg font-bold border border-gray-200 shadow-sm transition-colors"
        >
          −
        </button>
        <button
          onClick={() => setPosition({ coordinates: [0, 20], zoom: 1 })}
          className="w-8 h-8 bg-white hover:bg-gray-50 text-gray-700 rounded-lg flex items-center justify-center text-xs font-medium border border-gray-200 shadow-sm transition-colors"
          title="Reset view"
        >
          ⌂
        </button>
      </div>
    </div>
  );
});

MapCanvas.displayName = 'MapCanvas';

/**
 * Tooltip component for hovered locations
 */
interface LocationTooltipProps {
  location?: LocationMapData;
  cluster?: {
    id: string;
    coordinates: [number, number];
    locations: LocationMapData[];
    totalJobs: number;
  };
  viewMode: string;
  visualizationMode: VisualizationMode;
  selectedAgencyName?: string;
}

const LocationTooltip: React.FC<LocationTooltipProps> = ({ 
  location, 
  cluster, 
  viewMode, 
  visualizationMode,
  selectedAgencyName 
}) => {
  if (!location && !cluster) return null;
  
  // Handle cluster tooltip
  if (cluster && cluster.locations.length > 1) {
    return (
      <div 
        className="absolute top-4 left-4 bg-white border border-gray-200 rounded-lg p-3 shadow-lg max-w-xs z-50"
        style={{ pointerEvents: 'none' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="font-semibold text-gray-800 text-sm">Cluster</span>
          <span className="text-xs text-gray-400">({cluster.locations.length} locations)</span>
        </div>
        
        <div className="text-sm font-bold text-gray-900 mb-2">
          {cluster.totalJobs} total jobs
        </div>
        
        <div className="text-xs text-gray-600 space-y-1 max-h-32 overflow-y-auto">
          {cluster.locations.slice(0, 5).map(loc => (
            <div key={loc.id} className="flex justify-between">
              <span>{loc.dutyStation}</span>
              <span className="text-gray-400">
                {viewMode === 'market' ? loc.totalMarketJobs : loc.yourJobCount}
              </span>
            </div>
          ))}
          {cluster.locations.length > 5 && (
            <div className="text-gray-400">
              +{cluster.locations.length - 5} more...
            </div>
          )}
        </div>
        
        <div className="mt-2 text-[10px] text-gray-400">
          Click to zoom in
        </div>
      </div>
    );
  }
  
  // Handle single location tooltip
  if (!location) return null;
  
  return (
    <div 
      className="absolute top-4 left-4 bg-white border border-gray-200 rounded-lg p-3 shadow-lg max-w-xs z-50"
      style={{ pointerEvents: 'none' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: HARDSHIP_BUBBLE_COLORS[location.hardshipClass] }}
        />
        <span className="font-semibold text-gray-800 text-sm">{location.dutyStation}</span>
      </div>
      <div className="text-xs text-gray-500 mb-2">{location.country}</div>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        {viewMode === 'your-agency' && (
          <>
            <div>
              <span className="text-gray-400">Jobs:</span>
              <span className="text-gray-800 font-medium ml-1">{location.yourJobCount}</span>
            </div>
            <div>
              <span className="text-gray-400">Hardship:</span>
              <span className="text-gray-800 font-medium ml-1">{location.hardshipClass}</span>
            </div>
          </>
        )}
        
        {viewMode === 'market' && (
          <>
            <div>
              <span className="text-gray-400">Total Jobs:</span>
              <span className="text-gray-800 font-medium ml-1">{location.totalMarketJobs}</span>
            </div>
            <div>
              <span className="text-gray-400">Hardship:</span>
              <span className="text-gray-800 font-medium ml-1">{location.hardshipClass}</span>
            </div>
            <div>
              <span className="text-gray-400">Agencies:</span>
              <span className="text-gray-800 font-medium ml-1">{location.agencyCount}</span>
            </div>
          </>
        )}
      </div>
      
      {location.yourTrend.direction !== 'stable' && viewMode === 'your-agency' && (
        <div className="mt-2 pt-2 border-t border-gray-100 text-xs">
          <span className="text-gray-400">Trend:</span>
          <span 
            className="ml-1 font-medium"
            style={{ color: TREND_COLORS[location.yourTrend.direction] }}
          >
            {location.yourTrend.direction === 'up' && `↑ +${location.yourTrend.change}`}
            {location.yourTrend.direction === 'down' && `↓ ${location.yourTrend.change}`}
            {location.yourTrend.direction === 'new' && '★ New location'}
            {location.yourTrend.direction === 'exiting' && '◇ Exiting'}
          </span>
        </div>
      )}
      
      {location.isGap && (
        <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-amber-600">
          Gap: {location.agencyCount} agencies here, not you
        </div>
      )}
      
      <div className="mt-2 text-[10px] text-gray-400">
        Click for details
      </div>
    </div>
  );
};

/**
 * Tooltip component for choropleth hover
 */
interface ChoroplethTooltipProps {
  countryName: string;
  countryData?: CountryMapData;
  viewMode: string;
}

const ChoroplethTooltip: React.FC<ChoroplethTooltipProps> = ({ 
  countryName, 
  countryData,
  viewMode 
}) => {
  return (
    <div 
      className="absolute top-4 left-4 bg-white border border-gray-200 rounded-lg p-3 shadow-lg max-w-xs z-50"
      style={{ pointerEvents: 'none' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="font-semibold text-gray-800 text-sm">{countryName}</span>
      </div>
      
      {countryData ? (
        <>
          <div className="grid grid-cols-2 gap-2 text-xs mb-2">
            <div>
              <span className="text-gray-400">Total Jobs:</span>
              <span className="text-gray-800 font-bold ml-1">{countryData.totalJobs}</span>
            </div>
            {viewMode === 'your-agency' && (
              <div>
                <span className="text-gray-400">Your Jobs:</span>
                <span className="text-gray-800 font-bold ml-1">{countryData.yourJobs}</span>
              </div>
            )}
            <div>
              <span className="text-gray-400">Agencies:</span>
              <span className="text-gray-800 font-medium ml-1">{countryData.agencyCount}</span>
            </div>
            <div>
              <span className="text-gray-400">Locations:</span>
              <span className="text-gray-800 font-medium ml-1">{countryData.dutyStations.length}</span>
            </div>
          </div>
          
          {countryData.hardshipDEPercentage > 0 && (
            <div className="text-xs">
              <span className="text-gray-400">Hardship D+E:</span>
              <span className="text-orange-600 font-medium ml-1">
                {countryData.hardshipDEPercentage.toFixed(0)}%
              </span>
            </div>
          )}
          
          <div className="mt-2 text-[10px] text-gray-400">
            Click to see details
          </div>
        </>
      ) : (
        <div className="text-xs text-gray-400">No job data available</div>
      )}
    </div>
  );
};

export default MapCanvas;
