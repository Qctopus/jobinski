/**
 * Agency Workforce Fingerprints
 * 
 * Small multiples showing how different agencies structure their workforce.
 * Each "fingerprint" shows the agency's unique workforce composition pattern.
 */

import React, { useState, useMemo } from 'react';
import { AgencyFingerprint } from '../../services/analytics/WorkforceStructureAnalyzer';
import { Building2, Users, MapPin, ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';
import { getCategoryById } from '../../utils/categoryUtils';

// Sort options
type SortOption = 
  | 'total' 
  | 'staff-ratio' 
  | 'nonstaff-ratio' 
  | 'field-ratio' 
  | 'hq-ratio'
  | 'executive-rate'
  | 'director-rate'
  | 'mid-rate'
  | 'entry-rate'
  | 'consultant-rate';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'total', label: 'Total Jobs' },
  { value: 'staff-ratio', label: 'Highest Staff %' },
  { value: 'nonstaff-ratio', label: 'Highest Non-Staff %' },
  { value: 'field-ratio', label: 'Highest Field %' },
  { value: 'hq-ratio', label: 'Highest HQ %' },
  { value: 'executive-rate', label: 'Highest Executive %' },
  { value: 'director-rate', label: 'Highest Director %' },
  { value: 'mid-rate', label: 'Highest Mid-Career %' },
  { value: 'entry-rate', label: 'Highest Entry %' },
  { value: 'consultant-rate', label: 'Highest Consultant %' },
];

interface AgencyFingerprintsProps {
  data: AgencyFingerprint[];
}

const AgencyFingerprints: React.FC<AgencyFingerprintsProps> = ({ data }) => {
  const [expandedAgency, setExpandedAgency] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('total');

  // Helper to get tier percentage
  const getTierPercentage = (agency: AgencyFingerprint, tierName: string): number => {
    const tier = agency.pyramid.find(p => p.tier === tierName);
    if (!tier || agency.totalPositions === 0) return 0;
    return (tier.count / agency.totalPositions) * 100;
  };

  // Sort agencies based on selected option
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      switch (sortBy) {
        case 'total':
          return b.totalPositions - a.totalPositions;
        case 'staff-ratio':
          return b.staffRatio - a.staffRatio;
        case 'nonstaff-ratio':
          return (100 - b.staffRatio) - (100 - a.staffRatio);
        case 'field-ratio':
          return b.fieldRatio - a.fieldRatio;
        case 'hq-ratio':
          return (100 - b.fieldRatio) - (100 - a.fieldRatio);
        case 'executive-rate':
          return getTierPercentage(b, 'Executive') - getTierPercentage(a, 'Executive');
        case 'director-rate':
          return getTierPercentage(b, 'Director') - getTierPercentage(a, 'Director');
        case 'mid-rate':
          return getTierPercentage(b, 'Mid Professional') - getTierPercentage(a, 'Mid Professional');
        case 'entry-rate':
          return getTierPercentage(b, 'Entry Professional') - getTierPercentage(a, 'Entry Professional');
        case 'consultant-rate':
          return getTierPercentage(b, 'Consultant') - getTierPercentage(a, 'Consultant');
        default:
          return b.totalPositions - a.totalPositions;
      }
    });
  }, [data, sortBy]);

  // Show top 8 by default, all if showAll is true
  const displayedAgencies = showAll ? sortedData : sortedData.slice(0, 8);

  // Model badge colors
  const modelColors: Record<AgencyFingerprint['workforceModel'], string> = {
    'HQ-Centric': 'bg-blue-100 text-blue-800 border-blue-200',
    'Field-Deployed': 'bg-green-100 text-green-800 border-green-200',
    'Consultant-Heavy': 'bg-orange-100 text-orange-800 border-orange-200',
    'Leadership-Focused': 'bg-purple-100 text-purple-800 border-purple-200',
    'Balanced': 'bg-gray-100 text-gray-800 border-gray-200'
  };

  // Mini pyramid component with labels
  const MiniPyramid: React.FC<{ pyramid: AgencyFingerprint['pyramid'] }> = ({ pyramid }) => {
    const maxCount = Math.max(...pyramid.map(p => p.count));
    
    // Abbreviate tier names
    const getTierAbbrev = (tier: string) => {
      const abbrevs: Record<string, string> = {
        'Executive': 'Exec',
        'Director': 'Dir',
        'Senior Professional': 'Sr Prof',
        'Mid Professional': 'Mid',
        'Entry Professional': 'Entry',
        'Support': 'Supp',
        'Consultant': 'Cons',
        'Intern': 'Intern'
      };
      return abbrevs[tier] || tier.substring(0, 4);
    };
    
    return (
      <div className="space-y-0.5">
        {pyramid.map((tier, idx) => {
          const width = maxCount > 0 ? (tier.count / maxCount) * 100 : 0;
          return (
            <div key={tier.tier} className="flex items-center gap-1.5">
              <span className="text-[8px] text-gray-400 w-10 text-right truncate" title={tier.tier}>
                {getTierAbbrev(tier.tier)}
              </span>
              <div className="flex-1 h-2 bg-gray-100 rounded-sm overflow-hidden">
                <div 
                  className="h-full rounded-sm transition-all duration-300" 
                  style={{ 
                    width: `${Math.max(width, tier.count > 0 ? 4 : 0)}%`,
                    backgroundColor: tier.color,
                  }}
                  title={`${tier.tier}: ${tier.count}`}
                />
              </div>
              <span className="text-[8px] text-gray-500 w-6 text-right">{tier.count > 0 ? tier.count : '-'}</span>
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

      {/* Sort Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-gray-400" />
          <span className="text-xs text-gray-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <span className="text-xs text-gray-400">
          {sortedData.length} agencies
        </span>
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
                      const catInfo = getCategoryById(cat.category);
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
      {sortedData.length > 8 && (
        <div className="text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            {showAll ? `Show Less (Top 8)` : `Show All ${sortedData.length} Agencies`}
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

