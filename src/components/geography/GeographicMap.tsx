/**
 * GeographicMap Component
 * Main container component for the interactive geographic intelligence map
 */

import React, { useState, useMemo, useCallback } from 'react';
import { Globe, X } from 'lucide-react';
import { ProcessedJobData, FilterOptions } from '../../types';
import MapCanvas from './MapCanvas';
import MapControls from './MapControls';
import MapSummaryBar from './MapSummaryBar';
import LocationDetailPanel from './LocationDetailPanel';
import { useMapData } from './useMapData';
import { 
  MapViewState, 
  MapViewMode, 
  ColorByOption,
  VisualizationMode,
  HARDSHIP_BUBBLE_COLORS,
  LOCATION_TYPE_COLORS,
} from './types';
import { HardshipClass } from '../../data/icscHardshipClassifications';
import { getAgencyLogo } from '../../utils/agencyLogos';

interface GeographicMapProps {
  data: ProcessedJobData[];
  marketData?: ProcessedJobData[];
  allAgencies?: string[];
  selectedAgency?: string;
  isAgencyView: boolean;
  timeRange?: FilterOptions['timeRange'];
}

// Default view state
const getDefaultViewState = (): MapViewState => ({
  viewMode: 'your-agency',
  visualizationMode: 'choropleth', // Default to choropleth for cleaner look
  selectedAgency: '',
  comparisonAgencies: [],
  colorBy: 'hardship',
  filters: {
    regions: [],
    minJobs: 1,
    hardshipLevels: [],
    showTrends: true,
    showGhostBubbles: true,
  },
  selectedLocation: null,
  zoom: 1,
  center: [0, 20],
});

const GeographicMap: React.FC<GeographicMapProps> = ({
  data,
  marketData,
  allAgencies = [],
  selectedAgency,
  isAgencyView,
  timeRange = 'all',
}) => {
  // View state - default to 'market' if no agency selected
  const [viewState, setViewState] = useState<MapViewState>(() => ({
    ...getDefaultViewState(),
    viewMode: isAgencyView ? 'your-agency' : 'market',
  }));
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  
  // Update view mode when agency selection changes
  React.useEffect(() => {
    if (!isAgencyView && viewState.viewMode === 'your-agency') {
      setViewState(prev => ({ ...prev, viewMode: 'market' }));
    }
  }, [isAgencyView, viewState.viewMode]);

  // Use market data for the map to show full market context
  const mapData = marketData || data;
  
  // Process data for the map
  const { locations, ghostLocations, countryData, summaryStats, regions, getLocationDetail } = useMapData({
    jobs: mapData,
    selectedAgency,
    isAgencyView,
  });

  // Use provided agencies list or compute from data
  const agencies = useMemo(() => {
    if (allAgencies.length > 0) return allAgencies;
    const agencySet = new Set<string>();
    mapData.forEach(job => {
      const agency = job.short_agency || job.long_agency;
      if (agency) agencySet.add(agency);
    });
    return Array.from(agencySet).sort();
  }, [mapData, allAgencies]);

  // Top locations for summary bar
  const topLocations = useMemo(() => {
    return locations
      .filter(l => l.yourJobCount > 0)
      .sort((a, b) => b.yourJobCount - a.yourJobCount)
      .slice(0, 5)
      .map(l => ({ name: l.dutyStation, count: l.yourJobCount }));
  }, [locations]);

  // Handlers
  const handleViewModeChange = useCallback((mode: MapViewMode) => {
    setViewState(prev => ({ ...prev, viewMode: mode }));
  }, []);

  const handleVisualizationModeChange = useCallback((mode: VisualizationMode) => {
    setViewState(prev => {
      // If switching to choropleth, disable peer-comparison mode
      const newViewMode = mode === 'choropleth' && prev.viewMode === 'peer-comparison' 
        ? 'market' 
        : prev.viewMode;
      return { ...prev, visualizationMode: mode, viewMode: newViewMode };
    });
  }, []);

  const handleColorByChange = useCallback((colorBy: ColorByOption) => {
    setViewState(prev => ({ ...prev, colorBy }));
  }, []);

  const handleFiltersChange = useCallback((filters: Partial<MapViewState['filters']>) => {
    setViewState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...filters },
    }));
  }, []);

  const handleComparisonAgenciesChange = useCallback((agencies: string[]) => {
    setViewState(prev => ({ ...prev, comparisonAgencies: agencies }));
  }, []);

  const handleReset = useCallback(() => {
    setViewState(prev => ({
      ...getDefaultViewState(),
      viewMode: isAgencyView ? 'your-agency' : 'market',
    }));
  }, [isAgencyView]);

  const handleLocationClick = useCallback((locationId: string) => {
    setViewState(prev => ({ ...prev, selectedLocation: locationId }));
    setShowDetailPanel(true);
  }, []);

  const handleLocationHover = useCallback((locationId: string | null) => {
    // Could add hover state here if needed
  }, []);

  const handleCountryClick = useCallback((countryName: string) => {
    // Find first location in this country to show details
    const countryLocation = locations.find(l => 
      l.country.toLowerCase() === countryName.toLowerCase()
    );
    if (countryLocation) {
      setViewState(prev => ({ ...prev, selectedLocation: countryLocation.id }));
      setShowDetailPanel(true);
    }
  }, [locations]);

  const handleCountryHover = useCallback((countryCode: string | null) => {
    // Could add hover state here if needed
  }, []);

  const handleCloseDetail = useCallback(() => {
    setShowDetailPanel(false);
    setViewState(prev => ({ ...prev, selectedLocation: null }));
  }, []);

  // Get selected location detail
  const selectedLocationDetail = viewState.selectedLocation 
    ? getLocationDetail(viewState.selectedLocation) 
    : null;

  // Get visualization mode label
  const getVisualizationLabel = () => {
    switch (viewState.visualizationMode) {
      case 'choropleth': return 'Country View';
      case 'bubbles': return 'Location Bubbles';
      case 'clusters': return 'Clustered View';
    }
  };

  // Get time range label
  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case '4weeks': return 'Last 4 weeks';
      case '8weeks': return 'Last 8 weeks';
      case '3months': return 'Last 3 months';
      case '6months': return 'Last 6 months';
      case '1year': return 'Last year';
      default: return 'All time';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header - Light theme */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-100 rounded-lg border border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isAgencyView && selectedAgency ? (
            getAgencyLogo(selectedAgency) ? (
              <img 
                src={getAgencyLogo(selectedAgency)!} 
                alt={selectedAgency} 
                className="h-6 w-6 object-contain" 
              />
            ) : (
              <Globe className="h-5 w-5 text-emerald-600" />
            )
          ) : (
            <Globe className="h-5 w-5 text-emerald-600" />
          )}
          <div>
            <h2 className="text-gray-800 font-semibold">
              {isAgencyView ? `${selectedAgency} Geographic Footprint` : 'UN System Geographic Footprint'}
            </h2>
            <p className="text-gray-500 text-xs">
              {viewState.visualizationMode === 'choropleth' 
                ? `${countryData.filter(c => c.totalJobs > 0).length} countries`
                : `${locations.length} locations`
              } • {summaryStats.totalPositions.toLocaleString()} positions
              <span className="text-gray-400 ml-2">• {getTimeRangeLabel()}</span>
              {isAgencyView && ghostLocations.length > 0 && viewState.visualizationMode !== 'choropleth' && (
                <span className="text-amber-600 ml-2">
                  • {ghostLocations.length} market gaps
                </span>
              )}
            </p>
          </div>
        </div>
        
        {/* Colour legend for bubbles/clusters mode (not shown in peer-comparison) */}
        {viewState.visualizationMode !== 'choropleth' && viewState.viewMode !== 'peer-comparison' && (
          <div className="hidden md:flex items-center gap-4">
            {viewState.colorBy === 'hardship' && (
              <div className="flex items-center gap-2">
                {(['A', 'B', 'C', 'D', 'E'] as HardshipClass[]).map(hc => (
                  <div key={hc} className="flex items-center gap-1">
                    <span 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: HARDSHIP_BUBBLE_COLORS[hc] }}
                    />
                    <span className="text-[10px] text-gray-500">{hc}</span>
                  </div>
                ))}
              </div>
            )}
            {viewState.colorBy === 'location-type' && (
              <div className="flex items-center gap-2">
                {Object.entries(LOCATION_TYPE_COLORS).map(([type, color]) => (
                  <div key={type} className="flex items-center gap-1">
                    <span 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[10px] text-gray-500">{type}</span>
                  </div>
                ))}
              </div>
            )}
            {viewState.colorBy === 'seniority' && (
              <div className="flex items-center gap-2">
                {[
                  { label: 'Senior', color: '#7c3aed' },
                  { label: 'Mid', color: '#3b82f6' },
                  { label: 'Entry', color: '#22c55e' },
                  { label: 'NO', color: '#8b5cf6' },
                  { label: 'GS', color: '#f59e0b' },
                ].map(({ label, color }) => (
                  <div key={label} className="flex items-center gap-1">
                    <span 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-[10px] text-gray-500">{label}</span>
                  </div>
                ))}
              </div>
            )}
            {viewState.colorBy === 'category' && (
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-400">Coloured by dominant job category</span>
              </div>
            )}
          </div>
        )}
        
        {/* Agency colour legend for peer-comparison mode */}
        {viewState.viewMode === 'peer-comparison' && viewState.comparisonAgencies.length > 0 && (
          <div className="hidden md:flex items-center gap-3">
            <span className="text-[10px] text-gray-400">Agencies:</span>
            {viewState.comparisonAgencies.slice(0, 5).map((agency, idx) => (
              <div key={agency} className="flex items-center gap-1">
                <span 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6'][idx] }}
                />
                <span className="text-[10px] text-gray-500 max-w-[80px] truncate">{agency}</span>
              </div>
            ))}
          </div>
        )}

        {/* Visualization mode indicator */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 hidden sm:inline">{getVisualizationLabel()}</span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Map Canvas - takes 3 columns */}
        <div className="lg:col-span-3">
          <div className="h-[500px] rounded-lg overflow-hidden border border-gray-200 shadow-sm">
            <MapCanvas
              locations={locations}
              ghostLocations={ghostLocations}
              countryData={countryData}
              viewState={viewState}
              onLocationClick={handleLocationClick}
              onLocationHover={handleLocationHover}
              onCountryClick={handleCountryClick}
              onCountryHover={handleCountryHover}
              selectedAgencyName={selectedAgency}
              comparisonAgencies={viewState.comparisonAgencies}
            />
          </div>
        </div>

        {/* Controls - takes 1 column */}
        <div className="lg:col-span-1">
          <MapControls
            viewState={viewState}
            onViewModeChange={handleViewModeChange}
            onVisualizationModeChange={handleVisualizationModeChange}
            onColorByChange={handleColorByChange}
            onFiltersChange={handleFiltersChange}
            onReset={handleReset}
            agencies={agencies}
            selectedAgencyName={selectedAgency}
            onComparisonAgenciesChange={handleComparisonAgenciesChange}
            regions={regions}
            isAgencyView={isAgencyView}
          />
        </div>
      </div>

      {/* Summary Bar */}
      <MapSummaryBar
        stats={summaryStats}
        isAgencyView={isAgencyView}
        selectedAgencyName={selectedAgency}
        topLocations={topLocations}
      />

      {/* Location Detail Panel */}
      {showDetailPanel && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/30 z-40"
            onClick={handleCloseDetail}
          />
          <LocationDetailPanel
            data={selectedLocationDetail}
            onClose={handleCloseDetail}
            selectedAgencyName={selectedAgency}
            isAgencyView={isAgencyView}
          />
        </>
      )}

      {/* CSS for animations */}
      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default GeographicMap;
