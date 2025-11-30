/**
 * GeoMappingPanel - Geographic mapping issues and unmapped locations
 */

import React from 'react';
import { Download, MapPin, Globe } from 'lucide-react';
import { UnmappedLocation } from '../../../types/dataQuality';

interface GeoMappingPanelProps {
  unmappedLocations: UnmappedLocation[];
  missingCountryCount: number;
  missingContinentCount: number;
}

export const GeoMappingPanel: React.FC<GeoMappingPanelProps> = ({ 
  unmappedLocations, 
  missingCountryCount,
  missingContinentCount
}) => {
  const totalUnmapped = unmappedLocations.reduce((sum, l) => sum + l.count, 0);
  
  // Group by type
  const frenchSpellings = unmappedLocations.filter(l => 
    l.suggestedMapping && ['Geneva', 'Brussels', 'Vienna', 'Copenhagen'].includes(l.suggestedMapping.city)
  );
  const remoteLocations = unmappedLocations.filter(l => 
    l.suggestedMapping?.city === 'Remote' || l.suggestedMapping?.city === 'Multiple'
  );
  const otherUnmapped = unmappedLocations.filter(l => 
    !frenchSpellings.includes(l) && !remoteLocations.includes(l)
  );
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📍</span>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Geo Mapping Issues</h3>
              <p className="text-sm text-slate-600">
                {totalUnmapped.toLocaleString()} jobs with unmapped or incomplete location data
              </p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-700">
            <Download className="h-4 w-4" />
            Export List
          </button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="h-5 w-5 text-amber-500" />
            <span className="font-medium text-slate-700">Unmapped Stations</span>
          </div>
          <div className="text-3xl font-bold text-slate-900">{totalUnmapped}</div>
          <p className="text-sm text-slate-500 mt-1">Cities not in geo_ORG.py lookup</p>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="h-5 w-5 text-rose-500" />
            <span className="font-medium text-slate-700">Missing Country</span>
          </div>
          <div className="text-3xl font-bold text-slate-900">{missingCountryCount}</div>
          <p className="text-sm text-slate-500 mt-1">Station exists but country null</p>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="h-5 w-5 text-blue-500" />
            <span className="font-medium text-slate-700">Missing Continent</span>
          </div>
          <div className="text-3xl font-bold text-slate-900">{missingContinentCount}</div>
          <p className="text-sm text-slate-500 mt-1">Country exists but continent null</p>
        </div>
      </div>
      
      {/* French Spellings - Easy Wins */}
      {frenchSpellings.length > 0 && (
        <div className="bg-white rounded-xl border border-emerald-200 p-5">
          <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
            🇫🇷 French City Spellings
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">Easy Fix</span>
          </h4>
          <p className="text-sm text-slate-600 mb-4">
            These are French spellings of well-known cities. Add aliases to geo_ORG.py.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 font-semibold text-slate-700">Current Value</th>
                  <th className="text-center py-2 font-semibold text-slate-700">Count</th>
                  <th className="text-left py-2 font-semibold text-slate-700">Suggested Mapping</th>
                </tr>
              </thead>
              <tbody>
                {frenchSpellings.map((loc) => (
                  <tr key={loc.dutyStation} className="border-b border-slate-100">
                    <td className="py-2 font-mono text-slate-900">"{loc.dutyStation}"</td>
                    <td className="text-center py-2 text-slate-700">{loc.count}</td>
                    <td className="py-2 text-emerald-600">
                      → {loc.suggestedMapping?.city}, {loc.suggestedMapping?.country}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Remote/Multiple Locations */}
      {remoteLocations.length > 0 && (
        <div className="bg-white rounded-xl border border-blue-200 p-5">
          <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
            🏠 Remote & Multiple Locations
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Special Handling</span>
          </h4>
          <p className="text-sm text-slate-600 mb-4">
            These need special mapping rules for "Home-based", "Remote", or "Multiple locations".
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 font-semibold text-slate-700">Current Value</th>
                  <th className="text-center py-2 font-semibold text-slate-700">Count</th>
                  <th className="text-left py-2 font-semibold text-slate-700">Suggested</th>
                </tr>
              </thead>
              <tbody>
                {remoteLocations.map((loc) => (
                  <tr key={loc.dutyStation} className="border-b border-slate-100">
                    <td className="py-2 font-mono text-slate-900">"{loc.dutyStation}"</td>
                    <td className="text-center py-2 text-slate-700">{loc.count}</td>
                    <td className="py-2 text-blue-600">
                      → [SPECIAL: {loc.suggestedMapping?.city}]
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Other Unmapped */}
      {otherUnmapped.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h4 className="font-semibold text-slate-900 mb-4">Other Unmapped Duty Stations</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 font-semibold text-slate-700">Duty Station Value</th>
                  <th className="text-center py-2 font-semibold text-slate-700">Count</th>
                  <th className="text-left py-2 font-semibold text-slate-700">Suggested</th>
                </tr>
              </thead>
              <tbody>
                {otherUnmapped.slice(0, 15).map((loc) => (
                  <tr key={loc.dutyStation} className="border-b border-slate-100">
                    <td className="py-2 font-mono text-slate-900">"{loc.dutyStation}"</td>
                    <td className="text-center py-2 text-slate-700">{loc.count}</td>
                    <td className="py-2 text-slate-500">
                      {loc.suggestedMapping 
                        ? `→ ${loc.suggestedMapping.city}, ${loc.suggestedMapping.country}`
                        : <span className="text-amber-600">[ADD to mapping]</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Recommendation */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <h5 className="font-semibold text-emerald-900 mb-2">💡 Action Required</h5>
        <p className="text-sm text-emerald-800">
          Export the unmapped stations list and add them to <code className="bg-emerald-100 px-1 rounded">geo_ORG.py</code>. 
          French city spellings (Genève, Bruxelles) are easy wins - just add aliases.
        </p>
      </div>
    </div>
  );
};


