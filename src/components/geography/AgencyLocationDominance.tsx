/**
 * Agency Location Dominance
 * 
 * Shows which agencies dominate in each geographic location.
 * Helps identify territorial strongholds and competitive landscapes.
 */

import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MapPin, ChevronDown, ArrowUpDown, Globe, Building2 } from 'lucide-react';
import { ProcessedJobData } from '../../types';
import { getAgencyLogo } from '../../utils/agencyLogos';
import { classifyLocation } from '../../utils/locationClassification';

interface AgencyLocationDominanceProps {
  data: ProcessedJobData[];
  isAgencyView: boolean;
  selectedAgency?: string;
}

type SortOption = 'total' | 'concentration' | 'diversity';
type ViewMode = 'byLocation' | 'byAgency' | 'byRegion';

// Location type colors
const LOCATION_TYPE_COLORS: Record<string, string> = {
  'HQ': '#6366F1',
  'Regional': '#8B5CF6',
  'Field': '#10B981',
  'Home-based': '#F59E0B'
};

const AgencyLocationDominance: React.FC<AgencyLocationDominanceProps> = ({
  data,
  isAgencyView,
  selectedAgency
}) => {
  const [sortOption, setSortOption] = useState<SortOption>('total');
  const [viewMode, setViewMode] = useState<ViewMode>('byLocation');
  const [expandedLocation, setExpandedLocation] = useState<string | null>(null);

  // Aggregate data
  const aggregatedData = useMemo(() => {
    const locationAgencyMap = new Map<string, Map<string, number>>();
    const agencyLocationMap = new Map<string, Map<string, number>>();
    const regionAgencyMap = new Map<string, Map<string, number>>();
    const locationTotals = new Map<string, number>();
    const agencyTotals = new Map<string, number>();
    const regionTotals = new Map<string, number>();
    const locationTypes = new Map<string, string>();

    data.forEach(job => {
      const location = job.duty_country || job.duty_station || 'Unknown';
      const agency = job.short_agency || job.long_agency || 'Unknown';
      const region = job.geographic_region || 'Unknown';
      const locationType = classifyLocation(job.duty_station || '', job.duty_country || '', '').locationType;

      locationTypes.set(location, locationType);

      // Location -> Agency
      if (!locationAgencyMap.has(location)) {
        locationAgencyMap.set(location, new Map());
      }
      const agencyMap = locationAgencyMap.get(location)!;
      agencyMap.set(agency, (agencyMap.get(agency) || 0) + 1);

      // Agency -> Location
      if (!agencyLocationMap.has(agency)) {
        agencyLocationMap.set(agency, new Map());
      }
      const locMap = agencyLocationMap.get(agency)!;
      locMap.set(location, (locMap.get(location) || 0) + 1);

      // Region -> Agency
      if (!regionAgencyMap.has(region)) {
        regionAgencyMap.set(region, new Map());
      }
      const regAgencyMap = regionAgencyMap.get(region)!;
      regAgencyMap.set(agency, (regAgencyMap.get(agency) || 0) + 1);

      // Totals
      locationTotals.set(location, (locationTotals.get(location) || 0) + 1);
      agencyTotals.set(agency, (agencyTotals.get(agency) || 0) + 1);
      regionTotals.set(region, (regionTotals.get(region) || 0) + 1);
    });

    return { locationAgencyMap, agencyLocationMap, regionAgencyMap, locationTotals, agencyTotals, regionTotals, locationTypes };
  }, [data]);

  // By Location view
  const locationDominance = useMemo(() => {
    const { locationAgencyMap, locationTotals, locationTypes } = aggregatedData;
    
    return Array.from(locationAgencyMap.entries())
      .map(([location, agencyMap]) => {
        const agencies = Array.from(agencyMap.entries())
          .map(([agency, count]) => ({
            agency,
            count,
            percentage: (count / (locationTotals.get(location) || 1)) * 100
          }))
          .sort((a, b) => b.count - a.count);

        const topAgency = agencies[0];
        const concentration = topAgency ? topAgency.percentage : 0;
        const diversity = agencies.length;

        return {
          location,
          locationType: locationTypes.get(location) || 'Field',
          total: locationTotals.get(location) || 0,
          agencies,
          topAgency: topAgency?.agency || 'None',
          topAgencyCount: topAgency?.count || 0,
          topAgencyPercentage: concentration,
          concentration,
          diversity
        };
      })
      .filter(l => l.total >= 3) // Minimum 3 jobs
      .sort((a, b) => {
        if (sortOption === 'concentration') return b.concentration - a.concentration;
        if (sortOption === 'diversity') return b.diversity - a.diversity;
        return b.total - a.total;
      });
  }, [aggregatedData, sortOption]);

  // By Region view
  const regionDominance = useMemo(() => {
    const { regionAgencyMap, regionTotals } = aggregatedData;
    
    return Array.from(regionAgencyMap.entries())
      .map(([region, agencyMap]) => {
        const agencies = Array.from(agencyMap.entries())
          .map(([agency, count]) => ({
            agency,
            count,
            percentage: (count / (regionTotals.get(region) || 1)) * 100
          }))
          .sort((a, b) => b.count - a.count);

        const topAgency = agencies[0];

        return {
          region,
          total: regionTotals.get(region) || 0,
          agencies,
          topAgency: topAgency?.agency || 'None',
          topAgencyPercentage: topAgency?.percentage || 0,
          diversity: agencies.length
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [aggregatedData]);

  // By Agency view
  const agencyDominance = useMemo(() => {
    const { agencyLocationMap, agencyTotals, locationTypes } = aggregatedData;
    
    return Array.from(agencyLocationMap.entries())
      .map(([agency, locationMap]) => {
        const locations = Array.from(locationMap.entries())
          .map(([location, count]) => ({
            location,
            locationType: locationTypes.get(location) || 'Field',
            count,
            percentage: (count / (agencyTotals.get(agency) || 1)) * 100
          }))
          .sort((a, b) => b.count - a.count);

        const topLocation = locations[0];
        
        // Calculate HQ vs Field ratio
        const hqCount = locations.filter(l => l.locationType === 'HQ').reduce((sum, l) => sum + l.count, 0);
        const fieldCount = locations.filter(l => l.locationType === 'Field').reduce((sum, l) => sum + l.count, 0);
        const fieldRatio = agencyTotals.get(agency) ? (fieldCount / agencyTotals.get(agency)!) * 100 : 0;

        return {
          agency,
          total: agencyTotals.get(agency) || 0,
          locations,
          topLocation: topLocation?.location || 'None',
          topLocationPercentage: topLocation?.percentage || 0,
          locationCount: locations.length,
          fieldRatio,
          hqCount,
          fieldCount
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 15);
  }, [aggregatedData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
          <div className="font-semibold text-gray-900 mb-1">{item.name || item.agency}</div>
          <div className="text-gray-600">{item.count?.toLocaleString() || item.value?.toLocaleString()} positions</div>
          {item.percentage && (
            <div className="text-gray-500">{item.percentage.toFixed(1)}% of location</div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="h-4 w-4 text-emerald-500" />
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Agency Geographic Dominance</h3>
              <p className="text-xs text-gray-500">Which agencies lead in each location</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('byLocation')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === 'byLocation' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Location
              </button>
              <button
                onClick={() => setViewMode('byRegion')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === 'byRegion' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Region
              </button>
              <button
                onClick={() => setViewMode('byAgency')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === 'byAgency' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Agency
              </button>
            </div>

            {/* Sort Options */}
            {viewMode === 'byLocation' && (
              <div className="flex items-center gap-1">
                <ArrowUpDown className="h-3 w-3 text-gray-400" />
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="text-xs border-0 bg-transparent text-gray-600 focus:ring-0 cursor-pointer pr-6"
                >
                  <option value="total">Total Jobs</option>
                  <option value="concentration">Highest Concentration</option>
                  <option value="diversity">Most Agencies</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4">
        {viewMode === 'byLocation' ? (
          /* By Location View */
          <div className="space-y-2">
            {locationDominance.slice(0, 15).map((item) => {
              const isExpanded = expandedLocation === item.location;
              const typeColor = LOCATION_TYPE_COLORS[item.locationType] || '#6B7280';
              
              return (
                <div key={item.location} className="border border-gray-100 rounded-lg overflow-hidden">
                  <div 
                    className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => setExpandedLocation(isExpanded ? null : item.location)}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <MapPin className="h-4 w-4 flex-shrink-0" style={{ color: typeColor }} />
                      <span className="text-sm font-medium text-gray-800 truncate">{item.location}</span>
                      <span 
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: `${typeColor}20`, color: typeColor }}
                      >
                        {item.locationType}
                      </span>
                      <span className="text-xs text-gray-400">({item.total} jobs)</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-white rounded px-2 py-1 border border-gray-200">
                        {getAgencyLogo(item.topAgency) && (
                          <img src={getAgencyLogo(item.topAgency)!} alt="" className="h-4 w-4 object-contain" />
                        )}
                        <span className="text-xs font-medium text-gray-700">{item.topAgency}</span>
                        <span className="text-xs text-emerald-600 font-semibold">{item.topAgencyPercentage.toFixed(0)}%</span>
                      </div>
                      
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="p-3 bg-white border-t border-gray-100">
                      <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={item.agencies.slice(0, 8).map(a => ({
                              name: a.agency,
                              count: a.count,
                              percentage: a.percentage
                            }))}
                            layout="vertical"
                            margin={{ top: 0, right: 20, left: 80, bottom: 0 }}
                          >
                            <XAxis type="number" tick={{ fontSize: 10 }} />
                            <YAxis 
                              type="category" 
                              dataKey="name" 
                              width={75}
                              tick={{ fontSize: 9 }}
                              tickFormatter={(v) => v.length > 10 ? v.substring(0, 8) + '..' : v}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="count" fill={typeColor} radius={[0, 4, 4, 0]}>
                              {item.agencies.slice(0, 8).map((a, idx) => (
                                <Cell 
                                  key={a.agency} 
                                  fill={idx === 0 ? typeColor : `${typeColor}99`}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-2 text-xs text-gray-500 text-center">
                        {item.diversity} agencies in this location
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : viewMode === 'byRegion' ? (
          /* By Region View */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {regionDominance.filter(r => r.region !== 'Unknown').map((item) => (
              <div key={item.region} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-indigo-500" />
                    <span className="text-sm font-semibold text-gray-800">{item.region}</span>
                  </div>
                  <span className="text-xs text-gray-400">{item.total} jobs</span>
                </div>
                
                {/* Top Agencies */}
                <div className="space-y-1.5">
                  {item.agencies.slice(0, 5).map((agency, idx) => (
                    <div key={agency.agency} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-[10px] text-gray-400 w-4">{idx + 1}.</span>
                        {getAgencyLogo(agency.agency) && (
                          <img src={getAgencyLogo(agency.agency)!} alt="" className="h-4 w-4 object-contain flex-shrink-0" />
                        )}
                        <span className="text-xs text-gray-700 truncate">{agency.agency}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 rounded-full"
                            style={{ width: `${agency.percentage}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-500 w-8 text-right">{agency.percentage.toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* By Agency View */
          <div className="space-y-3">
            {agencyDominance.map((item) => (
              <div key={item.agency} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getAgencyLogo(item.agency) && (
                      <img src={getAgencyLogo(item.agency)!} alt="" className="h-5 w-5 object-contain" />
                    )}
                    <span className="text-sm font-semibold text-gray-800">{item.agency}</span>
                    <span className="text-xs text-gray-400">({item.total} jobs)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-emerald-600">{item.fieldRatio.toFixed(0)}% Field</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500">{item.locationCount} locations</span>
                  </div>
                </div>
                
                {/* Location Type Distribution */}
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex mb-2">
                  {Object.entries(LOCATION_TYPE_COLORS).map(([type, color]) => {
                    const typeCount = item.locations.filter(l => l.locationType === type).reduce((sum, l) => sum + l.count, 0);
                    const pct = (typeCount / item.total) * 100;
                    if (pct === 0) return null;
                    return (
                      <div
                        key={type}
                        className="h-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                        title={`${type}: ${pct.toFixed(1)}%`}
                      />
                    );
                  })}
                </div>
                
                {/* Top Locations */}
                <div className="flex flex-wrap gap-1.5">
                  {item.locations.slice(0, 4).map((loc) => (
                    <span 
                      key={loc.location}
                      className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-gray-50 border border-gray-200"
                    >
                      <MapPin className="h-2.5 w-2.5" style={{ color: LOCATION_TYPE_COLORS[loc.locationType] }} />
                      <span className="text-gray-700 truncate max-w-[80px]">{loc.location}</span>
                      <span className="text-gray-500 font-medium">{loc.count}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgencyLocationDominance;

