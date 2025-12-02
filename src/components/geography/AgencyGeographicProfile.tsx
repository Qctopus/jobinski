/**
 * Agency Geographic Profile
 * 
 * Shows how a specific agency's geographic distribution compares to the market.
 * Displays field vs HQ focus, regional presence, and unique locations.
 */

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { MapPin, Globe, Building2, Home, TrendingUp, AlertCircle, Target, Users } from 'lucide-react';
import { ProcessedJobData } from '../../types';
import { getAgencyLogo } from '../../utils/agencyLogos';
import { classifyLocation } from '../../utils/locationClassification';

interface AgencyGeographicProfileProps {
  agencyData: ProcessedJobData[];
  marketData: ProcessedJobData[];
  agencyName: string;
}

// Location type colors
const LOCATION_TYPE_COLORS: Record<string, string> = {
  'HQ': '#6366F1',
  'Regional': '#8B5CF6',
  'Field': '#10B981',
  'Home-based': '#F59E0B'
};

const AgencyGeographicProfile: React.FC<AgencyGeographicProfileProps> = ({
  agencyData,
  marketData,
  agencyName
}) => {
  // Calculate geographic distributions
  const analysis = useMemo(() => {
    // Helper to get location type
    const getLocationType = (job: ProcessedJobData) => {
      return classifyLocation(job.duty_station || '', job.duty_country || '', '').locationType;
    };

    // Agency location types
    const agencyTypes: Record<string, number> = { HQ: 0, Regional: 0, Field: 0, 'Home-based': 0 };
    const agencyLocations = new Map<string, number>();
    const agencyRegions = new Map<string, number>();

    agencyData.forEach(job => {
      const locType = getLocationType(job);
      agencyTypes[locType] = (agencyTypes[locType] || 0) + 1;

      const location = job.duty_country || job.duty_station || 'Unknown';
      agencyLocations.set(location, (agencyLocations.get(location) || 0) + 1);

      const region = job.geographic_region || 'Unknown';
      agencyRegions.set(region, (agencyRegions.get(region) || 0) + 1);
    });

    // Market location types
    const marketTypes: Record<string, number> = { HQ: 0, Regional: 0, Field: 0, 'Home-based': 0 };
    const marketLocations = new Map<string, number>();
    const marketRegions = new Map<string, number>();

    marketData.forEach(job => {
      const locType = getLocationType(job);
      marketTypes[locType] = (marketTypes[locType] || 0) + 1;

      const location = job.duty_country || job.duty_station || 'Unknown';
      marketLocations.set(location, (marketLocations.get(location) || 0) + 1);

      const region = job.geographic_region || 'Unknown';
      marketRegions.set(region, (marketRegions.get(region) || 0) + 1);
    });

    const agencyTotal = agencyData.length || 1;
    const marketTotal = marketData.length || 1;

    // Type comparison
    const typeComparison = Object.entries(agencyTypes).map(([type, count]) => {
      const agencyPct = (count / agencyTotal) * 100;
      const marketPct = ((marketTypes[type] || 0) / marketTotal) * 100;
      return {
        type,
        agencyCount: count,
        marketCount: marketTypes[type] || 0,
        agencyPct,
        marketPct,
        deviation: agencyPct - marketPct,
        color: LOCATION_TYPE_COLORS[type]
      };
    });

    // Top agency locations
    const topAgencyLocations = Array.from(agencyLocations.entries())
      .map(([location, count]) => ({
        location,
        count,
        percentage: (count / agencyTotal) * 100,
        marketCount: marketLocations.get(location) || 0,
        marketShare: marketLocations.get(location) 
          ? (count / marketLocations.get(location)!) * 100 
          : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Regional comparison
    const allRegions = new Set([...agencyRegions.keys(), ...marketRegions.keys()]);
    const regionComparison = Array.from(allRegions)
      .map(region => {
        const agencyCount = agencyRegions.get(region) || 0;
        const marketCount = marketRegions.get(region) || 0;
        const agencyPct = (agencyCount / agencyTotal) * 100;
        const marketPct = (marketCount / marketTotal) * 100;
        return {
          region,
          agencyCount,
          marketCount,
          agencyPct,
          marketPct,
          deviation: agencyPct - marketPct
        };
      })
      .filter(r => r.region !== 'Unknown')
      .sort((a, b) => b.agencyCount - a.agencyCount);

    // Unique locations (agency has presence, limited market presence)
    const uniquePresence = topAgencyLocations.filter(
      l => l.marketShare > 10 && l.count >= 2
    ).slice(0, 5);

    // Field ratio
    const fieldRatio = agencyTypes.Field / agencyTotal * 100;
    const marketFieldRatio = marketTypes.Field / marketTotal * 100;
    const isFieldFocused = fieldRatio > marketFieldRatio + 5;
    const isHQFocused = (agencyTypes.HQ / agencyTotal * 100) > (marketTypes.HQ / marketTotal * 100) + 5;

    // Location count
    const locationCount = agencyLocations.size;
    const regionCount = agencyRegions.size - (agencyRegions.has('Unknown') ? 1 : 0);

    return {
      typeComparison,
      topAgencyLocations,
      regionComparison,
      uniquePresence,
      fieldRatio,
      marketFieldRatio,
      isFieldFocused,
      isHQFocused,
      locationCount,
      regionCount,
      totalJobs: agencyData.length
    };
  }, [agencyData, marketData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
          <div className="font-semibold text-gray-900 mb-2">{item.location || item.region || item.type}</div>
          <div className="space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">{agencyName}:</span>
              <span className="font-medium">{item.agencyCount || item.count} ({(item.agencyPct || item.percentage)?.toFixed(1)}%)</span>
            </div>
            {item.marketCount !== undefined && (
              <div className="flex justify-between gap-4">
                <span className="text-gray-500">Market:</span>
                <span className="font-medium">{item.marketCount} ({item.marketPct?.toFixed(1)}%)</span>
              </div>
            )}
          </div>
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
            {getAgencyLogo(agencyName) ? (
              <img src={getAgencyLogo(agencyName)!} alt="" className="h-5 w-5 object-contain" />
            ) : (
              <Globe className="h-4 w-4 text-emerald-500" />
            )}
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Geographic Profile</h3>
              <p className="text-xs text-gray-500">{agencyName}'s global footprint vs market</p>
            </div>
          </div>
          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {analysis.locationCount} locations
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Quick Insights */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Field Ratio */}
          <div className={`rounded-lg p-3 border-l-2 ${analysis.isFieldFocused ? 'bg-emerald-50 border-emerald-500' : 'bg-gray-50 border-gray-400'}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <MapPin className={`h-3.5 w-3.5 ${analysis.isFieldFocused ? 'text-emerald-500' : 'text-gray-500'}`} />
              <span className="text-[10px] text-gray-500">Field Deployment</span>
            </div>
            <div className="text-lg font-bold text-gray-800">{analysis.fieldRatio.toFixed(0)}%</div>
            <div className={`text-xs ${analysis.fieldRatio > analysis.marketFieldRatio ? 'text-emerald-600' : 'text-gray-500'}`}>
              vs {analysis.marketFieldRatio.toFixed(0)}% market
            </div>
          </div>

          {/* HQ/Office */}
          <div className={`rounded-lg p-3 border-l-2 ${analysis.isHQFocused ? 'bg-indigo-50 border-indigo-500' : 'bg-gray-50 border-gray-400'}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <Building2 className={`h-3.5 w-3.5 ${analysis.isHQFocused ? 'text-indigo-500' : 'text-gray-500'}`} />
              <span className="text-[10px] text-gray-500">Focus</span>
            </div>
            <div className="text-sm font-semibold text-gray-800">
              {analysis.isFieldFocused ? 'Field-Focused' : analysis.isHQFocused ? 'HQ-Centric' : 'Balanced'}
            </div>
            <div className="text-xs text-gray-500">deployment model</div>
          </div>

          {/* Regions */}
          <div className="bg-purple-50 rounded-lg p-3 border-l-2 border-purple-500">
            <div className="flex items-center gap-1.5 mb-1">
              <Globe className="h-3.5 w-3.5 text-purple-500" />
              <span className="text-[10px] text-gray-500">Regions Active</span>
            </div>
            <div className="text-lg font-bold text-gray-800">{analysis.regionCount}</div>
            <div className="text-xs text-purple-600">geographic spread</div>
          </div>

          {/* Strong Presence */}
          <div className="bg-amber-50 rounded-lg p-3 border-l-2 border-amber-500">
            <div className="flex items-center gap-1.5 mb-1">
              <Target className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-[10px] text-gray-500">Strong Presence</span>
            </div>
            <div className="text-lg font-bold text-gray-800">{analysis.uniquePresence.length}</div>
            <div className="text-xs text-amber-600">key locations</div>
          </div>
        </div>

        {/* Location Type Distribution */}
        <div className="grid grid-cols-2 gap-4">
          {/* Pie Chart */}
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">Location Type Mix</h4>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analysis.typeComparison.filter(t => t.agencyCount > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={50}
                    dataKey="agencyCount"
                    paddingAngle={2}
                  >
                    {analysis.typeComparison.filter(t => t.agencyCount > 0).map((entry) => (
                      <Cell key={entry.type} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-1">
              {analysis.typeComparison.filter(t => t.agencyCount > 0).map(type => (
                <div key={type.type} className="flex items-center gap-1 text-[10px]">
                  <span className="w-2 h-2 rounded" style={{ backgroundColor: type.color }} />
                  <span className="text-gray-600">{type.type}</span>
                  <span className="text-gray-400">({type.agencyPct.toFixed(0)}%)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Comparison with Market */}
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">vs Market Average</h4>
            <div className="space-y-2">
              {analysis.typeComparison.map(type => (
                <div key={type.type} className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 w-20">{type.type}</span>
                  <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden relative">
                    {/* Market bar */}
                    <div 
                      className="absolute h-full bg-gray-300 opacity-50"
                      style={{ width: `${Math.min(type.marketPct * 2, 100)}%` }}
                    />
                    {/* Agency bar */}
                    <div 
                      className="absolute h-full rounded-full"
                      style={{ 
                        width: `${Math.min(type.agencyPct * 2, 100)}%`,
                        backgroundColor: type.color
                      }}
                    />
                  </div>
                  <span className={`text-[10px] w-12 text-right font-medium ${
                    type.deviation > 0 ? 'text-emerald-600' : type.deviation < 0 ? 'text-amber-600' : 'text-gray-500'
                  }`}>
                    {type.deviation > 0 ? '+' : ''}{type.deviation.toFixed(0)}pp
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Locations */}
        <div>
          <h4 className="text-xs font-medium text-gray-700 mb-2">Top Locations</h4>
          <div className="grid grid-cols-2 gap-2">
            {analysis.topAgencyLocations.slice(0, 8).map((loc, idx) => (
              <div key={loc.location} className="flex items-center justify-between bg-gray-50 rounded p-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-[10px] text-gray-400 w-4">{idx + 1}.</span>
                  <span className="text-xs text-gray-700 truncate">{loc.location}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-medium text-gray-800">{loc.count}</span>
                  {loc.marketShare > 20 && (
                    <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-100 text-emerald-700">
                      {loc.marketShare.toFixed(0)}% mkt
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Regional Focus */}
        {analysis.regionComparison.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">Regional Focus vs Market</h4>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analysis.regionComparison.slice(0, 6)}
                  layout="vertical"
                  margin={{ top: 0, right: 30, left: 80, bottom: 0 }}
                >
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis 
                    type="category" 
                    dataKey="region" 
                    width={75}
                    tick={{ fontSize: 9 }}
                    tickFormatter={(v) => v.length > 12 ? v.substring(0, 10) + '..' : v}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="agencyCount" fill="#6366F1" name={agencyName} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgencyGeographicProfile;


