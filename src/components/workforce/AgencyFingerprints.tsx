/**
 * Agency Workforce Fingerprints
 * 
 * Small multiples showing how different agencies structure their workforce.
 * Each "fingerprint" shows the agency's unique workforce composition pattern.
 */

import React, { useState } from 'react';
import { AgencyFingerprint } from '../../services/analytics/WorkforceStructureAnalyzer';
import { Building2, Users, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { JOB_CLASSIFICATION_DICTIONARY } from '../../dictionary';

// Helper function to get pretty category names
const getCategoryInfo = (categoryKey: string) => {
  const entry = JOB_CLASSIFICATION_DICTIONARY[categoryKey];
  return {
    name: entry?.name || categoryKey,
    color: entry?.color || '#6B7280'
  };
};

interface AgencyFingerprintsProps {
  data: AgencyFingerprint[];
}

const AgencyFingerprints: React.FC<AgencyFingerprintsProps> = ({ data }) => {
  const [expandedAgency, setExpandedAgency] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Show top 8 by default, all if showAll is true
  const displayedAgencies = showAll ? data : data.slice(0, 8);

  // Model badge colors
  const modelColors: Record<AgencyFingerprint['workforceModel'], string> = {
    'HQ-Centric': 'bg-blue-100 text-blue-800 border-blue-200',
    'Field-Deployed': 'bg-green-100 text-green-800 border-green-200',
    'Consultant-Heavy': 'bg-orange-100 text-orange-800 border-orange-200',
    'Leadership-Focused': 'bg-purple-100 text-purple-800 border-purple-200',
    'Balanced': 'bg-gray-100 text-gray-800 border-gray-200'
  };

  // Mini pyramid component
  const MiniPyramid: React.FC<{ pyramid: AgencyFingerprint['pyramid'] }> = ({ pyramid }) => {
    const maxCount = Math.max(...pyramid.map(p => p.count));
    
    return (
      <div className="space-y-1">
        {pyramid.map((tier, idx) => {
          const width = maxCount > 0 ? (tier.count / maxCount) * 100 : 0;
          return (
            <div key={tier.tier} className="flex items-center gap-2">
              <div 
                className="h-2 rounded-sm transition-all duration-300" 
                style={{ 
                  width: `${Math.max(width, 2)}%`,
                  backgroundColor: tier.color,
                  minWidth: tier.count > 0 ? '8px' : '2px'
                }}
                title={`${tier.tier}: ${tier.count}`}
              />
            </div>
          );
        })}
      </div>
    );
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No agency data available. Select "Market View" to see agency fingerprints.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <div className="text-xl font-bold text-gray-900">{data.length}</div>
          <div className="text-xs text-gray-500">Agencies Analyzed</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <div className="text-xl font-bold text-gray-900">
            {data.filter(a => a.workforceModel === 'Field-Deployed').length}
          </div>
          <div className="text-xs text-gray-500">Field-Deployed</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <div className="text-xl font-bold text-gray-900">
            {data.filter(a => a.workforceModel === 'Consultant-Heavy').length}
          </div>
          <div className="text-xs text-gray-500">Consultant-Heavy</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <div className="text-xl font-bold text-gray-900">
            {data.reduce((sum, a) => sum + a.totalPositions, 0).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">Total Positions</div>
        </div>
      </div>

      {/* Agency Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayedAgencies.map(agency => (
          <div 
            key={agency.agency}
            className={`bg-white rounded-lg border transition-all cursor-pointer ${
              expandedAgency === agency.agency 
                ? 'border-indigo-300 ring-2 ring-indigo-100' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setExpandedAgency(expandedAgency === agency.agency ? null : agency.agency)}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  <span className="font-semibold text-gray-900 truncate" title={agency.agency}>
                    {agency.agency.length > 15 ? agency.agency.substring(0, 12) + '...' : agency.agency}
                  </span>
                </div>
                {expandedAgency === agency.agency ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </div>
              
              {/* Model Badge */}
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${modelColors[agency.workforceModel]}`}>
                {agency.workforceModel}
              </span>
            </div>

            {/* Quick Stats */}
            <div className="p-4">
              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-600">{agency.totalPositions}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-600">{agency.fieldRatio.toFixed(0)}% field</span>
                </div>
              </div>

              {/* Mini Pyramid */}
              <div className="mb-3">
                <MiniPyramid pyramid={agency.pyramid} />
              </div>

              {/* Staff Ratio Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Staff</span>
                  <span>Non-Staff</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-blue-500 transition-all" 
                    style={{ width: `${agency.staffRatio}%` }}
                  />
                  <div 
                    className="h-full bg-orange-400" 
                    style={{ width: `${100 - agency.staffRatio}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-blue-600 font-medium">{agency.staffRatio.toFixed(0)}%</span>
                  <span className="text-orange-600 font-medium">{(100 - agency.staffRatio).toFixed(0)}%</span>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedAgency === agency.agency && (
              <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                {/* Top Categories */}
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-2">Top Categories</div>
                  <div className="space-y-1">
                    {agency.topCategories.map(cat => {
                      const catInfo = getCategoryInfo(cat.category);
                      return (
                        <div key={cat.category} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600 truncate flex-1" title={catInfo.name}>
                            {catInfo.name.length > 25 ? catInfo.name.substring(0, 23) + '...' : catInfo.name}
                          </span>
                          <span className="text-gray-900 font-medium ml-2">{cat.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Characteristics */}
                {agency.characteristics.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-gray-700 mb-2">Characteristics</div>
                    <div className="flex flex-wrap gap-1">
                      {agency.characteristics.map((char, idx) => (
                        <span 
                          key={idx}
                          className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                        >
                          {char}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dominant Tier */}
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Dominant Grade Tier:</span>
                    <span className="font-medium text-gray-900">{agency.dominantGradeTier}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Show More Button */}
      {data.length > 8 && (
        <div className="text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            {showAll ? `Show Less (Top 8)` : `Show All ${data.length} Agencies`}
          </button>
        </div>
      )}

      {/* Workforce Model Legend */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Workforce Model Types</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
          <div className="flex items-start gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${modelColors['HQ-Centric']}`}>HQ-Centric</span>
            <span className="text-gray-600 text-xs">&lt;30% field positions</span>
          </div>
          <div className="flex items-start gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${modelColors['Field-Deployed']}`}>Field-Deployed</span>
            <span className="text-gray-600 text-xs">&gt;70% field positions</span>
          </div>
          <div className="flex items-start gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${modelColors['Consultant-Heavy']}`}>Consultant-Heavy</span>
            <span className="text-gray-600 text-xs">&gt;40% non-staff</span>
          </div>
          <div className="flex items-start gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${modelColors['Leadership-Focused']}`}>Leadership-Focused</span>
            <span className="text-gray-600 text-xs">&gt;30% senior</span>
          </div>
          <div className="flex items-start gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${modelColors['Balanced']}`}>Balanced</span>
            <span className="text-gray-600 text-xs">Mixed composition</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgencyFingerprints;

