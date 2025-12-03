/**
 * Geographic Intelligence Section
 * 
 * Displays field/regional/HQ distribution, top locations, conflict zones, and geographic patterns.
 */

import React from 'react';
import { Globe, MapPin, AlertTriangle, Compass, TrendingUp, TrendingDown } from 'lucide-react';
import { GeographicMetrics } from '../../services/analytics/IntelligenceInsightsEngine';
import { GeneratedNarrative } from '../../services/analytics/NarrativeGenerator';
import { NarrativeBlock, MiniTable, TrendArrow, ComparisonBar } from './shared';

interface GeographicIntelSectionProps {
  metrics: GeographicMetrics;
  narrative: GeneratedNarrative;
  isAgencyView: boolean;
  agencyName: string;
}

const GeographicIntelSection: React.FC<GeographicIntelSectionProps> = ({
  metrics,
  narrative,
  isAgencyView,
  agencyName
}) => {
  const {
    locationTypeDistribution,
    fieldRatio,
    topLocations,
    newLocations,
    conflictZoneHiring,
    categoryGeographyPatterns,
    gradeByLocationType,
    regionBreakdown
  } = metrics;

  // Prepare location table data
  const locationTableData = topLocations.slice(0, 8).map((loc, index) => ({
    id: `loc-${index}`,
    location: loc.location,
    country: loc.country,
    count: loc.count,
    change: loc.change
  }));

  // Prepare region data
  const regionTableData = regionBreakdown.map((r, index) => ({
    id: `region-${index}`,
    region: r.region,
    count: r.count,
    percentage: r.percentage,
    change: r.change
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Section Header */}
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-amber-50 to-white">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <Globe className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Geographic Intelligence</h3>
            <p className="text-xs text-gray-500">Field presence, locations, and operational footprint</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Field ratio:</span>
          <span className="text-sm font-bold text-amber-600">{fieldRatio.current.toFixed(0)}%</span>
          {Math.abs(fieldRatio.change) > 2 && (
            <TrendArrow value={fieldRatio.change} size="xs" format="pp" />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Narrative Block */}
        <NarrativeBlock
          body={narrative.body}
          callouts={narrative.callouts}
          variant="subtle"
          size="sm"
          className="mb-5"
        />

        {/* Location Type Distribution & Field Ratio */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          {/* Location Type Breakdown */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
              Location Type Distribution
            </h4>
            
            {/* Stacked Bar */}
            <div className="mb-4">
              <div className="h-5 rounded-full overflow-hidden flex bg-gray-200">
                {locationTypeDistribution.map(type => (
                  <div 
                    key={type.type}
                    className="h-full transition-all duration-300 relative group"
                    style={{ 
                      width: `${type.current}%`,
                      backgroundColor: type.color 
                    }}
                    title={`${type.type}: ${type.current.toFixed(0)}%`}
                  >
                    {type.current >= 15 && (
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white">
                        {type.current.toFixed(0)}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 mt-2">
                {locationTypeDistribution.map(type => (
                  <div key={type.type} className="flex items-center gap-1.5 text-xs">
                    <div 
                      className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: type.color }}
                    />
                    <span className="text-gray-600">{type.type}</span>
                    <span className="font-medium text-gray-800">{type.current.toFixed(0)}%</span>
                    {Math.abs(type.change) > 3 && (
                      <TrendArrow value={type.change} size="xs" format="pp" showValue={false} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Field Ratio Trend */}
            <div className="pt-3 border-t border-gray-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Prior Period Field Ratio</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800">{fieldRatio.previous.toFixed(0)}%</span>
                  <TrendArrow value={fieldRatio.change} size="xs" format="pp" />
                </div>
              </div>
            </div>
          </div>

          {/* Regional Breakdown */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
              Regional Distribution
            </h4>
            
            <div className="space-y-2">
              {regionBreakdown.slice(0, 5).map((region, index) => (
                <div key={region.region} className="flex items-center gap-2">
                  <span className="text-xs text-gray-700 w-28 truncate">{region.region}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-amber-500 transition-all duration-300"
                      style={{ width: `${region.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-800 w-12 text-right">
                    {region.percentage.toFixed(0)}%
                  </span>
                  {region.change !== 0 && (
                    <span className={`text-[10px] w-8 text-right ${
                      region.change > 0 ? 'text-emerald-600' : 'text-red-500'
                    }`}>
                      {region.change > 0 ? '+' : ''}{region.change}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Locations */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Top Duty Stations
            </h4>
            {newLocations.length > 0 && (
              <span className="text-xs text-emerald-600 font-medium">
                {newLocations.length} new location{newLocations.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <MiniTable
            columns={[
              { key: 'location', header: 'Location', align: 'left' },
              { key: 'country', header: 'Country', align: 'left' },
              { key: 'count', header: 'Positions', align: 'right', format: 'number' },
              { key: 'change', header: 'Change', align: 'right', format: 'change' }
            ]}
            data={locationTableData}
            showRowNumbers
            maxRows={8}
          />

          {/* New Locations Callout */}
          {newLocations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 mb-1">
                <MapPin className="h-3.5 w-3.5" />
                <span className="font-medium">New Duty Stations</span>
              </div>
              <p className="text-xs text-gray-600">
                Not seen in prior 12 months: {newLocations.join(', ')}
              </p>
            </div>
          )}
        </div>

        {/* Grade by Location Type & Conflict Zone */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Grade by Location Type */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
              Seniority by Location Type
            </h4>
            <div className="space-y-3">
              {gradeByLocationType.filter(g => g.juniorRatio > 0 || g.seniorRatio > 0).map(location => (
                <div key={location.locationType}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-700 font-medium">{location.locationType}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-blue-600">
                        Senior: {location.seniorRatio.toFixed(0)}%
                      </span>
                      <span className="text-gray-500">
                        Junior: {location.juniorRatio.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden flex bg-gray-200">
                    <div 
                      className="h-full bg-blue-500"
                      style={{ width: `${location.seniorRatio}%` }}
                    />
                    <div 
                      className="h-full bg-gray-400"
                      style={{ width: `${100 - location.seniorRatio - location.juniorRatio}%` }}
                    />
                    <div 
                      className="h-full bg-amber-400"
                      style={{ width: `${location.juniorRatio}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-4 text-[10px] text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm bg-blue-500" /> Senior (P5+/D)
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-sm bg-amber-400" /> Junior (Entry/Support)
              </div>
            </div>
          </div>

          {/* Conflict Zone Hiring */}
          {conflictZoneHiring.count > 0 && (
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <h4 className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                Conflict Zone Hiring
              </h4>
              
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-2xl font-bold text-red-700">{conflictZoneHiring.count}</div>
                  <div className="text-xs text-red-600">positions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-700">{conflictZoneHiring.percentage.toFixed(0)}%</div>
                  <div className="text-xs text-red-600">of total</div>
                </div>
              </div>

              <div className="pt-3 border-t border-red-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-red-700">Staff Ratio in Conflict Zones</span>
                  <span className="font-semibold text-red-800">{conflictZoneHiring.staffRatio.toFixed(0)}%</span>
                </div>
                {isAgencyView && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-red-700">Market Avg in Conflict Zones</span>
                    <span className="font-medium text-red-600">{conflictZoneHiring.marketStaffRatio.toFixed(0)}%</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Category Geography Patterns (if agency view) */}
          {isAgencyView && categoryGeographyPatterns.length > 0 && !conflictZoneHiring.count && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                Field Ratio by Category
              </h4>
              <div className="space-y-2">
                {categoryGeographyPatterns.slice(0, 4).map((cat, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="text-gray-700 truncate w-32">{cat.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">You: {cat.yourFieldRatio.toFixed(0)}%</span>
                      <span className="text-gray-500">vs {cat.competitorFieldRatio.toFixed(0)}%</span>
                      {Math.abs(cat.diff) > 10 && (
                        <TrendArrow 
                          value={cat.diff} 
                          size="xs" 
                          format="pp" 
                          reverseColors={cat.diff < 0}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeographicIntelSection;



