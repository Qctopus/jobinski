/**
 * CompetitiveSection - Competitor analysis with tables
 */

import React, { useState } from 'react';
import { Target, Users, Building2, ArrowLeftRight, TrendingUp, ChevronUp, ChevronDown } from 'lucide-react';
import { CompetitorMetrics } from '../../../services/analytics/IntelligenceBriefEngine';
import { HorizontalBars, ComparisonTable, formatters } from './shared';

interface CompetitiveSectionProps {
  data: CompetitorMetrics;
  agencyName?: string;
}

export const CompetitiveSection: React.FC<CompetitiveSectionProps> = ({ data, agencyName }) => {
  const narrative = generateNarrative(data, agencyName);

  // Market share bars
  const marketShareData = data.marketShare.slice(0, 10).map(agency => ({
    label: agency.agency,
    value: agency.positions,
    percentage: agency.share,
    color: agency.isYou ? '#8B5CF6' : '#3B82F6',
    previousPercentage: agency.previousShare
  }));

  // Agency comparison table
  const agencyColumns = [
    { key: 'agency', header: 'Agency', align: 'left' as const, width: '20%', format: formatters.agency },
    { key: 'positions', header: 'Positions', align: 'right' as const, format: formatters.number },
    { key: 'share', header: 'Share', align: 'right' as const, format: formatters.percent },
    { key: 'staffPct', header: 'Staff%', align: 'right' as const, format: formatters.percent },
    { key: 'seniorPct', header: 'Senior%', align: 'right' as const, format: formatters.percent },
    { key: 'fieldPct', header: 'Field%', align: 'right' as const, format: formatters.percent },
    { key: 'avgWindow', header: 'Window', align: 'right' as const, format: formatters.days }
  ];

  // Correlation table
  const correlationColumns = [
    { key: 'pair', header: 'Agency Pair', align: 'left' as const, format: (_: any, row: any) => (
      <span className="flex items-center gap-1">
        {row.agency1} <ArrowLeftRight className="h-3 w-3 text-gray-400" /> {row.agency2}
      </span>
    )},
    { key: 'correlation', header: 'Correlation', align: 'center' as const, format: (v: number) => (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
        v > 0.8 ? 'bg-red-100 text-red-700' :
        v > 0.6 ? 'bg-amber-100 text-amber-700' :
        'bg-gray-100 text-gray-600'
      }`}>
        {v.toFixed(2)}
      </span>
    )},
    { key: 'interpretation', header: 'Interpretation', align: 'left' as const }
  ];

  // Sortable agency data
  const [sortField, setSortField] = useState<string>('positions');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sortedMarketShare = [...data.marketShare].sort((a, b) => {
    const aVal = a[sortField as keyof typeof a] as number;
    const bVal = b[sortField as keyof typeof b] as number;
    return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortableHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <button 
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-blue-600 transition-colors"
    >
      {children}
      {sortField === field && (
        sortDir === 'desc' ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />
      )}
    </button>
  );

  return (
    <section className="px-6 py-5 border-b border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-5 w-5 text-red-500" />
        <h2 className="text-lg font-semibold text-gray-900">Competitive Intelligence</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Market Share Bars */}
        <div className="lg:col-span-2 bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Market Share Distribution
          </h3>
          <HorizontalBars 
            data={marketShareData}
            showChange={true}
            barHeight={22}
          />
        </div>

        {/* Narrative + Quick Stats */}
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed text-sm">{narrative}</p>

          {agencyName && (
            <div className="bg-purple-50 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-purple-600 uppercase mb-2">Your Position</h4>
              <div className="text-2xl font-bold text-purple-900">#{data.yourRank}</div>
              <div className="text-xs text-purple-600">of {data.totalAgencies} agencies</div>
              {data.rankChange !== 0 && (
                <div className={`text-xs mt-1 ${data.rankChange > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {data.rankChange > 0 ? '▲' : '▼'} {Math.abs(data.rankChange)} from prior period
                </div>
              )}
            </div>
          )}

          {/* New Entrants */}
          {data.newEntrants.length > 0 && (
            <div className="bg-amber-50 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-amber-600 uppercase mb-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                New Category Entrants
              </h4>
              {data.newEntrants.slice(0, 3).map((entry, i) => (
                <div key={i} className="text-xs text-gray-700 mb-1">
                  <span className="font-medium">{entry.agency}</span> → {entry.categoryName} ({entry.positions})
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Agency Comparison Table - Sortable */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Users className="h-4 w-4" />
          Agency Behavioral Comparison
        </h3>
        <p className="text-xs text-gray-500 mb-2">
          How top agencies hire differently — click column headers to sort
        </p>
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase w-1/5">Agency</th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100">
                  <SortableHeader field="positions">Positions</SortableHeader>
                </th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100">
                  <SortableHeader field="share">Share</SortableHeader>
                </th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100">
                  <SortableHeader field="staffPct">Staff%</SortableHeader>
                </th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100">
                  <SortableHeader field="seniorPct">Senior%</SortableHeader>
                </th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100">
                  <SortableHeader field="fieldPct">Field%</SortableHeader>
                </th>
                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100">
                  <SortableHeader field="avgWindow">Window</SortableHeader>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {sortedMarketShare.slice(0, 10).map((agency, i) => (
                <tr key={i} className={`${i % 2 === 1 ? 'bg-gray-50/50' : ''} hover:bg-gray-50`}>
                  <td className="px-4 py-2 text-sm font-medium text-gray-900">
                    {agency.isYou && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded mr-1">You</span>}
                    {agency.agency}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-gray-600">{agency.positions.toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm text-right text-gray-600">{agency.share.toFixed(0)}%</td>
                  <td className="px-4 py-2 text-sm text-right text-gray-600">{agency.staffPct.toFixed(0)}%</td>
                  <td className="px-4 py-2 text-sm text-right text-gray-600">{agency.seniorPct.toFixed(0)}%</td>
                  <td className="px-4 py-2 text-sm text-right text-gray-600">{agency.fieldPct.toFixed(0)}%</td>
                  <td className="px-4 py-2 text-sm text-right text-gray-600">{agency.avgWindow.toFixed(0)}d</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Correlation Analysis - Full Width */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <ArrowLeftRight className="h-4 w-4" />
          Hiring Pattern Correlations
        </h3>
        <p className="text-xs text-gray-500 mb-2">
          Which agencies compete for similar talent? Higher correlation indicates more overlap in hiring patterns.
        </p>
        {data.correlations.length > 0 ? (
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <ComparisonTable 
              columns={correlationColumns}
              data={data.correlations.map(c => ({ ...c, pair: '' }))}
              striped
              compact
            />
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4 text-center text-sm text-gray-500">
            Insufficient data for correlation analysis
          </div>
        )}
      </div>

      {/* Behavioral Insights */}
      {data.behavioralComparison.length > 0 && (
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Behavioral Patterns</h3>
          <div className="space-y-2">
            {data.behavioralComparison.slice(0, 4).map((comp, i) => (
              <div key={i} className="text-sm text-gray-700">
                {comp.comparison}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

function generateNarrative(data: CompetitorMetrics, agencyName?: string): string {
  if (data.marketShare.length < 2) return 'Insufficient data for competitive analysis.';
  
  const top2 = data.marketShare.slice(0, 2);
  let narrative = `${top2[0].agency} and ${top2[1].agency} together account for ${(top2[0].share + top2[1].share).toFixed(0)}% of market hiring`;
  
  // Behavioral differences
  const staffDiff = Math.abs(top2[0].staffPct - top2[1].staffPct);
  const fieldDiff = Math.abs(top2[0].fieldPct - top2[1].fieldPct);
  
  if (staffDiff > 10 || fieldDiff > 15) {
    narrative += ' but with divergent approaches.';
    
    const moreStaff = top2[0].staffPct > top2[1].staffPct ? top2[0] : top2[1];
    const lessStaff = top2[0].staffPct > top2[1].staffPct ? top2[1] : top2[0];
    
    narrative += ` ${moreStaff.agency} hires ${moreStaff.staffPct.toFixed(0)}% staff (vs. ${lessStaff.agency}'s ${lessStaff.staffPct.toFixed(0)}%)`;
    
    if (fieldDiff > 15) {
      const moreField = top2[0].fieldPct > top2[1].fieldPct ? top2[0] : top2[1];
      narrative += `, and posts ${moreField.fieldPct.toFixed(0)}% in field locations`;
    }
    narrative += '.';
  } else {
    narrative += ' with similar hiring patterns.';
  }
  
  // Window differences
  const windowDiff = Math.abs(top2[0].avgWindow - top2[1].avgWindow);
  if (windowDiff > 4) {
    const longerWindow = top2[0].avgWindow > top2[1].avgWindow ? top2[0] : top2[1];
    const shorterWindow = top2[0].avgWindow > top2[1].avgWindow ? top2[1] : top2[0];
    narrative += ` ${longerWindow.agency} uses longer application windows (${longerWindow.avgWindow.toFixed(0)}d vs. ${shorterWindow.avgWindow.toFixed(0)}d).`;
  }
  
  return narrative;
}

