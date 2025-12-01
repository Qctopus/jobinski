/**
 * MapControls Component
 * Controls for view mode, color encoding, and filters
 */

import React from 'react';
import { 
  Globe, 
  Users, 
  Building2, 
  ChevronDown,
  Eye,
  EyeOff,
  TrendingUp,
  RefreshCw,
  Download,
  Map,
  Circle,
  Layers
} from 'lucide-react';
import { 
  MapViewState, 
  MapViewMode, 
  ColorByOption,
  VisualizationMode,
  HARDSHIP_BUBBLE_COLORS,
} from './types';
import { HardshipClass } from '../../data/icscHardshipClassifications';

// Region center coordinates for zooming
const REGION_CENTERS: Record<string, { center: [number, number]; zoom: number }> = {
  'Sub-Saharan Africa': { center: [20, 0], zoom: 2.5 },
  'Middle East & North Africa': { center: [30, 28], zoom: 3 },
  'Asia & Pacific': { center: [105, 20], zoom: 2 },
  'Europe & CIS': { center: [25, 52], zoom: 2.5 },
  'Latin America & Caribbean': { center: [-70, -10], zoom: 2 },
  'Western Europe & Other': { center: [5, 48], zoom: 3 },
  'Other': { center: [0, 20], zoom: 1 },
};

interface MapControlsProps {
  viewState: MapViewState;
  onViewModeChange: (mode: MapViewMode) => void;
  onVisualizationModeChange: (mode: VisualizationMode) => void;
  onColorByChange: (colorBy: ColorByOption) => void;
  onFiltersChange: (filters: Partial<MapViewState['filters']>) => void;
  onZoomToRegion?: (center: [number, number], zoom: number) => void;
  onReset: () => void;
  onExport?: () => void;
  agencies: string[];
  selectedAgencyName?: string;
  onComparisonAgenciesChange?: (agencies: string[]) => void;
  regions: string[];
  isAgencyView: boolean;
}

const MapControls: React.FC<MapControlsProps> = ({
  viewState,
  onViewModeChange,
  onVisualizationModeChange,
  onColorByChange,
  onFiltersChange,
  onZoomToRegion,
  onReset,
  onExport,
  agencies,
  selectedAgencyName,
  onComparisonAgenciesChange,
  regions,
  isAgencyView,
}) => {
  const hardshipLevels: HardshipClass[] = ['A', 'B', 'C', 'D', 'E'];

  const toggleHardshipLevel = (level: HardshipClass) => {
    const current = viewState.filters.hardshipLevels;
    const newLevels = current.includes(level)
      ? current.filter(l => l !== level)
      : [...current, level];
    onFiltersChange({ hardshipLevels: newLevels });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 space-y-3">
      {/* Visualization Style Toggle */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Map Style</label>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => onVisualizationModeChange('choropleth')}
            className={`flex-1 px-2 py-1.5 text-[11px] font-medium flex items-center justify-center gap-1 transition-colors ${
              viewState.visualizationMode === 'choropleth'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
            title="Color countries by job density"
          >
            <Map className="h-3 w-3" />
            Countries
          </button>
          <button
            onClick={() => onVisualizationModeChange('bubbles')}
            className={`flex-1 px-2 py-1.5 text-[11px] font-medium flex items-center justify-center gap-1 transition-colors border-l border-gray-200 ${
              viewState.visualizationMode === 'bubbles'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
            title="Show individual location bubbles"
          >
            <Circle className="h-3 w-3" />
            Bubbles
          </button>
          <button
            onClick={() => onVisualizationModeChange('clusters')}
            className={`flex-1 px-2 py-1.5 text-[11px] font-medium flex items-center justify-center gap-1 transition-colors border-l border-gray-200 ${
              viewState.visualizationMode === 'clusters'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
            title="Group nearby locations into clusters"
          >
            <Layers className="h-3 w-3" />
            Clusters
          </button>
        </div>
      </div>

      {/* View Mode Toggle - Simplified to two options */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Data View</label>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => onViewModeChange('market')}
            className={`flex-1 px-3 py-1.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
              viewState.viewMode === 'market' || viewState.viewMode === 'your-agency'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {isAgencyView ? (
              <>
                <Building2 className="h-3.5 w-3.5" />
                <span className="truncate max-w-[80px]">{selectedAgencyName}</span>
              </>
            ) : (
              <>
                <Globe className="h-3.5 w-3.5" />
                UN System
              </>
            )}
          </button>
          <button
            onClick={() => onViewModeChange('peer-comparison')}
            className={`flex-1 px-3 py-1.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border-l border-gray-200 ${
              viewState.viewMode === 'peer-comparison'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            } ${viewState.visualizationMode === 'choropleth' ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={viewState.visualizationMode === 'choropleth'}
            title={viewState.visualizationMode === 'choropleth' ? 'Switch to Bubbles or Clusters view first' : 'Compare multiple agencies'}
          >
            <Users className="h-3.5 w-3.5" />
            Compare
          </button>
        </div>
      </div>

      {/* Peer Comparison Selector */}
      {viewState.viewMode === 'peer-comparison' && onComparisonAgenciesChange && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">
            Compare agencies (select up to 5)
          </label>
          
          {/* Selected agencies display */}
          {viewState.comparisonAgencies.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {viewState.comparisonAgencies.map((agency, idx) => (
                <div
                  key={agency}
                  className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full border bg-blue-100 border-blue-300 text-blue-700"
                >
                  <span className="w-2 h-2 rounded-full" style={{
                    backgroundColor: ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6'][idx % 5]
                  }} />
                  <span>{agency}</span>
                  <button
                    onClick={() => onComparisonAgenciesChange(viewState.comparisonAgencies.filter(a => a !== agency))}
                    className="ml-0.5 hover:text-blue-900"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          
          {/* Agency selector dropdown */}
          <div className="relative">
            <select
              value=""
              onChange={(e) => {
                if (e.target.value && viewState.comparisonAgencies.length < 5) {
                  onComparisonAgenciesChange([...viewState.comparisonAgencies, e.target.value]);
                }
              }}
              disabled={viewState.comparisonAgencies.length >= 5}
              className="w-full appearance-none px-2.5 py-1.5 pr-7 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:text-gray-400"
            >
              <option value="">
                {viewState.comparisonAgencies.length >= 5 
                  ? 'Maximum 5 agencies selected' 
                  : `Add agency (${5 - viewState.comparisonAgencies.length} remaining)`}
              </option>
              {agencies
                .filter(a => a !== selectedAgencyName && !viewState.comparisonAgencies.includes(a))
                .map(agency => (
                  <option key={agency} value={agency}>{agency}</option>
                ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
          </div>
          
          {/* Quick add top agencies (agencies list is pre-sorted by job count) */}
          {viewState.comparisonAgencies.length < 5 && (
            <div className="flex flex-wrap gap-1 mt-2">
              <span className="text-[9px] text-gray-400 mr-1">Top agencies:</span>
              {agencies
                .filter(a => a !== selectedAgencyName && !viewState.comparisonAgencies.includes(a))
                .slice(0, 5)
                .map(agency => (
                  <button
                    key={agency}
                    onClick={() => {
                      if (viewState.comparisonAgencies.length < 5) {
                        onComparisonAgenciesChange([...viewState.comparisonAgencies, agency]);
                      }
                    }}
                    className="px-1.5 py-0.5 text-[9px] rounded border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    + {agency}
                  </button>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Colour By Selector - only for bubbles/clusters mode, not peer-comparison */}
      {viewState.visualizationMode !== 'choropleth' && viewState.viewMode !== 'peer-comparison' && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Colour By</label>
          <div className="relative">
            <select
              value={viewState.colorBy}
              onChange={(e) => onColorByChange(e.target.value as ColorByOption)}
              className="w-full appearance-none px-3 py-1.5 pr-8 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="hardship">Hardship Level (A-E)</option>
              <option value="location-type">Location Type (HQ/Regional/Field)</option>
              <option value="category">Dominant Job Category</option>
              <option value="seniority">Seniority Level</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      )}
      
      {/* Peer comparison mode shows agency colour legend instead */}
      {viewState.viewMode === 'peer-comparison' && viewState.comparisonAgencies.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Agency Colours</label>
          <div className="flex flex-wrap gap-1.5">
            {viewState.comparisonAgencies.slice(0, 5).map((agency, idx) => (
              <div key={agency} className="flex items-center gap-1 text-[10px] text-gray-600">
                <span 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6'][idx] }}
                />
                <span className="truncate max-w-[60px]">{agency}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters Row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Region Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Region</label>
          <div className="relative">
            <select
              value={viewState.filters.regions[0] || 'all'}
              onChange={(e) => {
                const selectedRegion = e.target.value;
                onFiltersChange({ 
                  regions: selectedRegion === 'all' ? [] : [selectedRegion] 
                });
                // Zoom to region when selected
                if (selectedRegion !== 'all' && onZoomToRegion && REGION_CENTERS[selectedRegion]) {
                  const { center, zoom } = REGION_CENTERS[selectedRegion];
                  onZoomToRegion(center, zoom);
                } else if (selectedRegion === 'all' && onZoomToRegion) {
                  // Reset to world view
                  onZoomToRegion([0, 20], 1);
                }
              }}
              className="w-full appearance-none px-2.5 py-1.5 pr-7 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="all">All Regions</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Min Jobs Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Min Jobs</label>
          <div className="relative">
            <select
              value={viewState.filters.minJobs}
              onChange={(e) => onFiltersChange({ minJobs: parseInt(e.target.value) })}
              className="w-full appearance-none px-2.5 py-1.5 pr-7 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="1">1+</option>
              <option value="3">3+</option>
              <option value="5">5+</option>
              <option value="10">10+</option>
              <option value="25">25+</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Hardship Filter - only for bubbles/clusters mode */}
      {viewState.visualizationMode !== 'choropleth' && (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Hardship Levels</label>
          <div className="flex gap-1.5">
            {hardshipLevels.map(level => {
              const isSelected = viewState.filters.hardshipLevels.length === 0 || 
                                 viewState.filters.hardshipLevels.includes(level);
              return (
                <button
                  key={level}
                  onClick={() => toggleHardshipLevel(level)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    isSelected
                      ? 'text-white'
                      : 'bg-gray-100 border-gray-200 text-gray-400'
                  }`}
                  style={isSelected ? {
                    backgroundColor: HARDSHIP_BUBBLE_COLORS[level],
                    borderColor: HARDSHIP_BUBBLE_COLORS[level],
                  } : undefined}
                >
                  {level}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Toggle Options - only for bubbles mode */}
      {viewState.visualizationMode === 'bubbles' && (
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <button
              onClick={() => onFiltersChange({ showTrends: !viewState.filters.showTrends })}
              className={`p-1 rounded transition-colors ${
                viewState.filters.showTrends
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
            </button>
            <span className="text-xs text-gray-600">Show Trends</span>
          </label>

          {viewState.viewMode === 'your-agency' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <button
                onClick={() => onFiltersChange({ showGhostBubbles: !viewState.filters.showGhostBubbles })}
                className={`p-1 rounded transition-colors ${
                  viewState.filters.showGhostBubbles
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {viewState.filters.showGhostBubbles ? (
                  <Eye className="h-3.5 w-3.5" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5" />
                )}
              </button>
              <span className="text-xs text-gray-600">Show Gaps</span>
            </label>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={onReset}
          className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reset
        </button>
        {onExport && (
          <button
            onClick={onExport}
            className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Export PNG
          </button>
        )}
      </div>
    </div>
  );
};

export default MapControls;

