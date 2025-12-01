/**
 * CompetitiveSection - Fixed: No spider for market view, larger for agency, show period changes
 */

import React, { useState } from 'react';
import { Target, Users, Building2, ArrowLeftRight, TrendingUp, ChevronUp, ChevronDown, Trophy, Medal, Award } from 'lucide-react';
import { CompetitorMetrics } from '../../../services/analytics/IntelligenceBriefEngine';
import { ComparisonTable, formatters } from './shared';

interface CompetitiveSectionProps {
  data: CompetitorMetrics;
  agencyName?: string;
}

// Rank position marker
const RankMarker: React.FC<{ rank: number; total: number; change?: number }> = ({ rank, total, change }) => {
  const position = ((rank - 1) / (total - 1)) * 100;
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[9px] text-gray-500">
        <span>#1</span>
        <span className="font-medium text-gray-700">Position: #{rank} of {total}</span>
        <span>#{total}</span>
      </div>
      <div className="relative h-2.5 bg-gradient-to-r from-emerald-200 via-amber-200 to-red-200 rounded-full">
        <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-purple-600 rounded-full border-2 border-white shadow-md -translate-x-1/2 flex items-center justify-center"
          style={{ left: `${Math.max(5, Math.min(95, position))}%` }}>
          <span className="text-[7px] text-white font-bold">{rank}</span>
        </div>
      </div>
      {change !== undefined && change !== 0 && (
        <div className={`text-[10px] text-center ${change > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          {change > 0 ? '▲' : '▼'} {Math.abs(change)} positions vs prior period
        </div>
      )}
    </div>
  );
};

// Leaderboard
const Leaderboard: React.FC<{ agencies: Array<{ agency: string; positions: number; share: number; isYou?: boolean; previousShare?: number }> }> = ({ agencies }) => {
  const maxPos = Math.max(...agencies.map(a => a.positions), 1);
  const medals = [
    { icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-50' },
    { icon: Medal, color: 'text-gray-400', bg: 'bg-gray-50' },
    { icon: Award, color: 'text-amber-700', bg: 'bg-amber-50' }
  ];

  return (
    <div className="flex items-end gap-1.5">
      {agencies.slice(0, 5).map((agency, i) => {
        const barHeight = (agency.positions / maxPos) * 70;
        const MedalIcon = medals[i]?.icon;
        const shareChange = agency.previousShare !== undefined ? agency.share - agency.previousShare : 0;
        
        return (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${i < 3 ? medals[i].bg : 'bg-gray-100'}`}>
              {i < 3 && MedalIcon ? <MedalIcon className={`h-3.5 w-3.5 ${medals[i].color}`} /> : <span className="text-[10px] font-bold text-gray-500">{i + 1}</span>}
            </div>
            <div className={`w-full rounded-t ${agency.isYou ? 'bg-purple-500' : 'bg-blue-400'}`} style={{ height: `${Math.max(barHeight, 10)}px` }} />
            <div className="text-center mt-1">
              <div className={`text-[9px] font-medium truncate w-14 ${agency.isYou ? 'text-purple-700' : 'text-gray-700'}`}>{agency.agency.slice(0, 8)}</div>
              <div className="text-[8px] text-gray-500 tabular-nums">{agency.share.toFixed(0)}%</div>
              {Math.abs(shareChange) > 1 && (
                <div className={`text-[8px] ${shareChange > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {shareChange > 0 ? '+' : ''}{shareChange.toFixed(0)}pp
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Radar chart - ONLY for agency view, made larger
const RadarChart: React.FC<{
  yourMetrics: { staff: number; senior: number; field: number; window: number; share: number };
  peerMetrics: { staff: number; senior: number; field: number; window: number; share: number };
}> = ({ yourMetrics, peerMetrics }) => {
  const size = 140; // Larger size
  const center = size / 2;
  const radius = (size - 30) / 2;
  const metrics = ['staff', 'senior', 'field', 'window', 'share'] as const;
  const labels = ['Staff%', 'Senior%', 'Field%', 'Window', 'Share'];
  
  const normalize = (value: number, metric: string) => {
    const maxVals: Record<string, number> = { staff: 100, senior: 100, field: 100, window: 30, share: 50 };
    return Math.min(value / maxVals[metric], 1);
  };
  
  const getPoint = (value: number, index: number) => {
    const angle = (Math.PI * 2 * index) / metrics.length - Math.PI / 2;
    return { x: center + value * radius * Math.cos(angle), y: center + value * radius * Math.sin(angle) };
  };
  
  const yourPoints = metrics.map((m, i) => getPoint(normalize(yourMetrics[m], m), i));
  const peerPoints = metrics.map((m, i) => getPoint(normalize(peerMetrics[m], m), i));
  const yourPath = yourPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  const peerPath = peerPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        {[0.25, 0.5, 0.75, 1].map((scale, i) => (
          <polygon key={i} points={metrics.map((_, j) => { const p = getPoint(scale, j); return `${p.x},${p.y}`; }).join(' ')}
            fill="none" stroke="#E5E7EB" strokeWidth={1} />
        ))}
        {metrics.map((_, i) => { const end = getPoint(1, i); return <line key={i} x1={center} y1={center} x2={end.x} y2={end.y} stroke="#E5E7EB" strokeWidth={1} />; })}
        <path d={peerPath} fill="rgba(148, 163, 184, 0.3)" stroke="#94A3B8" strokeWidth={1.5} />
        <path d={yourPath} fill="rgba(139, 92, 246, 0.3)" stroke="#8B5CF6" strokeWidth={2} />
        {yourPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={4} fill="#8B5CF6" />)}
      </svg>
      {labels.map((label, i) => {
        const p = getPoint(1.2, i);
        return <span key={i} className="absolute text-[8px] text-gray-500 -translate-x-1/2 -translate-y-1/2" style={{ left: p.x, top: p.y }}>{label}</span>;
      })}
    </div>
  );
};

// Comparison bars showing change
const ComparisonBar: React.FC<{ label: string; yourValue: number; peerValue: number; previousValue?: number; format?: 'percent' | 'days' }> = ({ label, yourValue, peerValue, previousValue, format = 'percent' }) => {
  const maxVal = Math.max(yourValue, peerValue, 1);
  const yourWidth = (yourValue / maxVal) * 100;
  const change = previousValue !== undefined ? yourValue - previousValue : undefined;
  const formatVal = (v: number) => format === 'days' ? `${v.toFixed(0)}d` : `${v.toFixed(0)}%`;

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-gray-600">{label}</span>
        {change !== undefined && Math.abs(change) > 2 && (
          <span className={change > 0 ? 'text-emerald-600' : 'text-red-600'}>
            {change > 0 ? '+' : ''}{change.toFixed(0)}{format === 'percent' ? 'pp' : 'd'} vs prior
          </span>
        )}
      </div>
      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className="absolute top-0 h-full bg-gray-300 opacity-50 rounded-full" style={{ width: `${(peerValue / maxVal) * 100}%` }} />
        <div className="absolute top-0 h-full bg-purple-500 rounded-full" style={{ width: `${yourWidth}%` }} />
      </div>
      <div className="flex justify-between text-[9px]">
        <span className="text-purple-600">You: {formatVal(yourValue)}</span>
        <span className="text-gray-400">Peers: {formatVal(peerValue)}</span>
      </div>
    </div>
  );
};

export const CompetitiveSection: React.FC<CompetitiveSectionProps> = ({ data, agencyName }) => {
  const [sortField, setSortField] = useState<string>('positions');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sortedMarketShare = [...data.marketShare].sort((a, b) => {
    const aVal = a[sortField as keyof typeof a] as number;
    const bVal = b[sortField as keyof typeof b] as number;
    return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
  });

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortableHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <button onClick={() => handleSort(field)} className={`flex items-center gap-1 transition-all ${sortField === field ? 'text-blue-600 font-bold' : 'text-gray-700 hover:text-blue-600'}`}>
      {children}
      <span className={`transition-transform ${sortField === field ? 'text-blue-600' : 'text-gray-400'}`}>
        {sortField === field ? (sortDir === 'desc' ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />) : <span className="text-[8px]">↕</span>}
      </span>
    </button>
  );

  const peerAverage = {
    staff: data.marketShare.slice(0, 10).reduce((s, a) => s + a.staffPct, 0) / Math.min(data.marketShare.length, 10),
    senior: data.marketShare.slice(0, 10).reduce((s, a) => s + a.seniorPct, 0) / Math.min(data.marketShare.length, 10),
    field: data.marketShare.slice(0, 10).reduce((s, a) => s + a.fieldPct, 0) / Math.min(data.marketShare.length, 10),
    window: data.marketShare.slice(0, 10).reduce((s, a) => s + a.avgWindow, 0) / Math.min(data.marketShare.length, 10),
    share: data.marketShare.slice(0, 10).reduce((s, a) => s + a.share, 0) / Math.min(data.marketShare.length, 10)
  };

  const yourAgency = data.marketShare.find(a => a.isYou);
  const yourMetrics = yourAgency ? {
    staff: yourAgency.staffPct, senior: yourAgency.seniorPct, field: yourAgency.fieldPct,
    window: yourAgency.avgWindow, share: yourAgency.share
  } : peerAverage;

  const top2 = data.marketShare.slice(0, 2);
  const narrative = top2.length >= 2 
    ? `${top2[0].agency} and ${top2[1].agency} together account for ${(top2[0].share + top2[1].share).toFixed(0)}% of market hiring.`
    : '';

  const correlationColumns = [
    { key: 'pair', header: 'Pair', align: 'left' as const, format: (_: any, row: any) => <span className="text-[10px]">{row.agency1} ↔ {row.agency2}</span> },
    { key: 'correlation', header: 'Corr', align: 'center' as const, format: (v: number) => <span className={`px-1 py-0.5 rounded text-[9px] font-medium ${v > 0.8 ? 'bg-red-100 text-red-700' : v > 0.6 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>{v.toFixed(2)}</span> },
    { key: 'interpretation', header: '', align: 'left' as const }
  ];

  return (
    <section className="border-b border-gray-200">
      <div className="h-0.5 bg-gradient-to-r from-red-500 to-orange-500" />
      
      <div className="px-6 py-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-7 w-7 rounded-lg bg-red-100 flex items-center justify-center">
            <Target className="h-4 w-4 text-red-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Competitive Intelligence</h2>
            <p className="text-xs text-gray-500">{narrative}</p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 mb-4">
          {/* Left: Leaderboard - better proportions */}
          <div className="col-span-4 bg-gray-50 rounded-lg p-3">
            <h3 className="text-[10px] font-semibold text-gray-600 uppercase mb-3 flex items-center gap-1">
              <Trophy className="h-3 w-3 text-amber-500" /> Market Leaders
            </h3>
            <Leaderboard agencies={data.marketShare.slice(0, 5)} />
          </div>

          {/* Right: Agency-specific or market summary - more space */}
          <div className="col-span-8">
            {agencyName && yourAgency ? (
              // AGENCY VIEW: Show rank position, radar, and comparison bars
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                    <h4 className="text-[9px] font-semibold text-purple-600 uppercase mb-2">Your Position</h4>
                    <RankMarker rank={data.yourRank} total={data.totalAgencies} change={data.rankChange} />
                  </div>
                  
                  {/* Comparison bars with period changes */}
                  <div className="space-y-2.5">
                    <ComparisonBar label="Staff Ratio" yourValue={yourAgency.staffPct} peerValue={peerAverage.staff} />
                    <ComparisonBar label="Field %" yourValue={yourAgency.fieldPct} peerValue={peerAverage.field} />
                  </div>
                </div>
                
                <div className="bg-white rounded-lg border border-gray-200 p-3 flex flex-col items-center justify-center">
                  <h4 className="text-[9px] font-semibold text-gray-500 uppercase mb-2">vs Peer Average</h4>
                  <RadarChart yourMetrics={yourMetrics} peerMetrics={peerAverage} />
                  <div className="flex items-center gap-4 mt-2 text-[10px]">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> You</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gray-400" /> Peers</span>
                  </div>
                </div>
              </div>
            ) : (
              // MARKET VIEW: Better layout for behavioral patterns and new entrants
              <div className="grid grid-cols-5 gap-4">
                <div className="col-span-3 bg-gray-50 rounded-lg p-3">
                  <h4 className="text-[10px] font-semibold text-gray-600 uppercase mb-2">Top Agencies Behavioral Patterns</h4>
                  <div className="space-y-2 text-[11px] text-gray-700">
                    {data.behavioralComparison.slice(0, 4).map((comp, i) => (
                      <div key={i} className="flex items-start gap-1.5 bg-white rounded px-2 py-1.5">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>{comp.comparison}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {data.newEntrants.length > 0 && (
                  <div className="col-span-2 bg-amber-50 rounded-lg p-3 border border-amber-100">
                    <h4 className="text-[10px] font-semibold text-amber-700 uppercase mb-2 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> New Entrants
                    </h4>
                    <div className="space-y-1.5">
                      {data.newEntrants.slice(0, 5).map((entry, i) => (
                        <div key={i} className="text-[10px] text-gray-700 bg-white/50 rounded px-2 py-1">
                          <span className="font-semibold">{entry.agency}</span>
                          <span className="text-gray-500"> → </span>
                          <span className="text-amber-800">{entry.categoryName}</span>
                          <span className="text-gray-400 ml-1 text-[9px]">({entry.positions})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Agency table - Enhanced with prominent sort buttons */}
        <div className="mb-4">
          <h3 className="text-[10px] font-semibold text-gray-600 uppercase mb-2 flex items-center gap-2">
            <Users className="h-3 w-3" /> Agency Comparison 
            <span className="font-normal text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full text-[9px]">↕ Click headers to sort</span>
          </h3>
          <div className="rounded-lg border-2 border-gray-200 overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-100 to-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-700 uppercase">Agency</th>
                  <th className="px-3 py-2 text-right text-[10px] font-bold text-gray-700 uppercase cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors rounded"><SortableHeader field="positions">Pos</SortableHeader></th>
                  <th className="px-3 py-2 text-right text-[10px] font-bold text-gray-700 uppercase cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors rounded"><SortableHeader field="share">Share</SortableHeader></th>
                  <th className="px-3 py-2 text-right text-[10px] font-bold text-gray-700 uppercase cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors rounded"><SortableHeader field="staffPct">Staff%</SortableHeader></th>
                  <th className="px-3 py-2 text-right text-[10px] font-bold text-gray-700 uppercase cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors rounded"><SortableHeader field="seniorPct">Sr%</SortableHeader></th>
                  <th className="px-3 py-2 text-right text-[10px] font-bold text-gray-700 uppercase cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors rounded"><SortableHeader field="fieldPct">Field%</SortableHeader></th>
                  <th className="px-3 py-2 text-right text-[10px] font-bold text-gray-700 uppercase cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors rounded"><SortableHeader field="avgWindow">Win</SortableHeader></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {sortedMarketShare.slice(0, 8).map((agency, i) => (
                  <tr key={i} className={`${i % 2 === 1 ? 'bg-gray-50/50' : ''} ${agency.isYou ? 'bg-purple-50 border-l-2 border-l-purple-500' : ''} hover:bg-blue-50/50 transition-colors`}>
                    <td className="px-3 py-1.5 text-[11px] font-medium text-gray-900">
                      {agency.isYou && <span className="text-[8px] bg-purple-500 text-white px-1.5 py-0.5 rounded mr-1.5 font-bold">You</span>}
                      {agency.agency}
                    </td>
                    <td className="px-3 py-1.5 text-[11px] text-right text-gray-700 tabular-nums font-medium">{agency.positions.toLocaleString()}</td>
                    <td className="px-3 py-1.5 text-[11px] text-right text-gray-700 tabular-nums font-medium">
                      {agency.share.toFixed(0)}%
                      {agency.previousShare !== undefined && Math.abs(agency.share - agency.previousShare) > 1 && (
                        <span className={`ml-1 text-[10px] ${agency.share > agency.previousShare ? 'text-emerald-600' : 'text-red-600'}`}>
                          {agency.share > agency.previousShare ? '↑' : '↓'}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-1.5 text-[11px] text-right text-gray-700 tabular-nums">{agency.staffPct.toFixed(0)}%</td>
                    <td className="px-3 py-1.5 text-[11px] text-right text-gray-700 tabular-nums">{agency.seniorPct.toFixed(0)}%</td>
                    <td className="px-3 py-1.5 text-[11px] text-right text-gray-700 tabular-nums">{agency.fieldPct.toFixed(0)}%</td>
                    <td className="px-3 py-1.5 text-[11px] text-right text-gray-700 tabular-nums">{agency.avgWindow.toFixed(0)}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Correlations - expanded */}
        {data.correlations.length > 0 && (
          <div>
            <h3 className="text-[10px] font-semibold text-gray-600 uppercase mb-1.5 flex items-center gap-1">
              <ArrowLeftRight className="h-3 w-3" /> Hiring Pattern Correlations
            </h3>
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <ComparisonTable columns={correlationColumns} data={data.correlations.slice(0, 5).map(c => ({ ...c, pair: '' }))} striped compact />
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
