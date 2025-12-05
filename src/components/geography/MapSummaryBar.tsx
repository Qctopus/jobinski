/**
 * MapSummaryBar Component
 * Summary statistics bar showing your agency vs market comparison
 */

import React from 'react';
import { 
  Flag, 
  MapPin, 
  AlertTriangle, 
  Building2,
  Globe,
  TrendingUp,
  TrendingDown,
  Target
} from 'lucide-react';
import { MapSummaryStats } from './types';

interface MapSummaryBarProps {
  stats: MapSummaryStats;
  isAgencyView: boolean;
  selectedAgencyName?: string;
  topLocations: Array<{ name: string; count: number }>;
}

const MapSummaryBar: React.FC<MapSummaryBarProps> = ({
  stats,
  isAgencyView,
  selectedAgencyName,
  topLocations,
}) => {
  // Helper to format comparison
  const formatComparison = (value: number, marketValue: number, suffix: string = '') => {
    const diff = value - marketValue;
    if (Math.abs(diff) < 1) return null;
    
    return (
      <span className={`text-[10px] ${diff > 0 ? 'text-green-600' : 'text-red-600'}`}>
        {diff > 0 ? '+' : ''}{diff.toFixed(0)}{suffix} vs mkt
      </span>
    );
  };

  return (
    <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isAgencyView && selectedAgencyName ? (
            <>
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-800">{selectedAgencyName}</span>
            </>
          ) : (
            <>
              <Globe className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-semibold text-gray-800">UN System</span>
            </>
          )}
        </div>
        {isAgencyView && (
          <span className="text-xs text-gray-500">vs Market Average</span>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {/* Countries */}
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Flag className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-2xl font-bold text-gray-900">{stats.totalCountries}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Countries</span>
            {isAgencyView && formatComparison(stats.totalCountries, stats.marketCountries)}
          </div>
        </div>

        {/* Field % */}
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-2xl font-bold text-gray-900">{stats.fieldPercentage.toFixed(0)}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Field Positions</span>
            {isAgencyView && formatComparison(stats.fieldPercentage, stats.marketFieldPercentage, '%')}
          </div>
        </div>

        {/* Hardship D+E */}
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
            <span className="text-2xl font-bold text-gray-900">{stats.hardshipDEPercentage.toFixed(0)}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Hardship D+E</span>
            {isAgencyView && formatComparison(stats.hardshipDEPercentage, stats.marketHardshipDEPercentage, '%')}
          </div>
        </div>

        {/* Unique Locations */}
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-3.5 w-3.5 text-purple-500" />
            <span className="text-2xl font-bold text-gray-900">{stats.uniqueLocations}</span>
          </div>
          <div className="text-xs text-gray-500">
            {isAgencyView ? 'Unique Locations' : 'Total Locations'}
          </div>
        </div>
      </div>

      {/* Footprint Breakdown & Top Locations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* HQ/Regional/Field Breakdown */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 mb-2">Location Type Breakdown</h4>
          <div className="flex items-center gap-1 h-4 bg-gray-100 rounded-full overflow-hidden">
            {stats.hqPercentage > 0 && (
              <div 
                className="h-full bg-indigo-500 transition-all duration-500"
                style={{ width: `${stats.hqPercentage}%` }}
                title={`HQ: ${stats.hqPercentage.toFixed(0)}%`}
              />
            )}
            {stats.regionalPercentage > 0 && (
              <div 
                className="h-full bg-purple-500 transition-all duration-500"
                style={{ width: `${stats.regionalPercentage}%` }}
                title={`Regional: ${stats.regionalPercentage.toFixed(0)}%`}
              />
            )}
            {stats.fieldPositionPercentage > 0 && (
              <div 
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${stats.fieldPositionPercentage}%` }}
                title={`Field: ${stats.fieldPositionPercentage.toFixed(0)}%`}
              />
            )}
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded bg-indigo-500" />
              HQ {stats.hqPercentage.toFixed(0)}%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded bg-purple-500" />
              Regional {stats.regionalPercentage.toFixed(0)}%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded bg-emerald-500" />
              Field {stats.fieldPositionPercentage.toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Top Locations */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 mb-2">Top Locations</h4>
          <div className="flex flex-wrap gap-1.5">
            {topLocations.slice(0, 5).map((loc, idx) => (
              <span 
                key={loc.name}
                className="px-2 py-1 text-[10px] bg-white border border-gray-200 rounded-full text-gray-700"
              >
                {loc.name} ({loc.count})
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Gap Analysis (only in agency view) */}
      {isAgencyView && stats.gapCount > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">
              {stats.gapCount} gaps
            </span>
            <span className="text-gray-500">
              Locations where other agencies recruit but {selectedAgencyName} doesn't
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapSummaryBar;









