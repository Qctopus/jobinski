/**
 * Competitive Intelligence Section
 * 
 * Displays market share, peer group comparison, competitor patterns, and strategic position.
 * Only shown in Agency View.
 */

import React from 'react';
import { Award, TrendingUp, TrendingDown, Users, Target, AlertTriangle, Zap } from 'lucide-react';
import { CompetitiveMetrics } from '../../services/analytics/IntelligenceInsightsEngine';
import { GeneratedNarrative } from '../../services/analytics/NarrativeGenerator';
import { NarrativeBlock, MiniTable, TrendArrow, MetricBadge } from './shared';
import { getAgencyLogo } from '../../utils/agencyLogos';

interface CompetitiveIntelSectionProps {
  metrics: CompetitiveMetrics;
  narrative: GeneratedNarrative;
  agencyName: string;
}

const CompetitiveIntelSection: React.FC<CompetitiveIntelSectionProps> = ({
  metrics,
  narrative,
  agencyName
}) => {
  const {
    marketShare,
    rank,
    peerGroupPerformance,
    competitorPatterns,
    categoryPosition,
    newCompetitorMoves
  } = metrics;

  // Prepare peer group table data
  const peerTableData = peerGroupPerformance.map((peer, index) => ({
    id: `peer-${index}`,
    agency: peer.agency,
    volume: peer.volume,
    seniorRatio: peer.seniorRatio,
    fieldRatio: peer.fieldRatio,
    isYou: peer.isYou
  }));

  // Prepare category position table data
  const categoryPositionData = categoryPosition.map((cat, index) => ({
    id: `catpos-${index}`,
    category: cat.category,
    yourRank: cat.yourRank,
    yourShare: cat.yourShare,
    leader: cat.leader,
    leaderShare: cat.leaderShare
  }));

  // Prepare competitor patterns data
  const competitorData = competitorPatterns.map((comp, index) => ({
    id: `comp-${index}`,
    agency: comp.agency,
    correlation: comp.correlation,
    volumeChange: comp.volumeChange,
    keyDifference: comp.keyDifference
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Section Header */}
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Award className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Competitive Intelligence</h3>
            <p className="text-xs text-gray-500">Market position, peer comparison, and competitor analysis</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-gray-500">Market Rank</div>
            <div className="text-lg font-bold text-indigo-600">
              #{rank.current}
              {rank.change !== 0 && (
                <span className={`text-xs ml-1 ${rank.change > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  ({rank.change > 0 ? '↑' : '↓'}{Math.abs(rank.change)})
                </span>
              )}
            </div>
          </div>
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

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <MetricBadge
            label="Market Share"
            value={`${marketShare.current.toFixed(1)}%`}
            change={marketShare.change > 0.1 ? marketShare.change : undefined}
            changeLabel={marketShare.change > 0 ? `+${marketShare.change.toFixed(1)}pp` : `${marketShare.change.toFixed(1)}pp`}
            size="md"
            variant="highlight"
          />
          
          <MetricBadge
            label="Market Rank"
            value={`#${rank.current}`}
            change={rank.change !== 0 ? rank.change : undefined}
            changeLabel={rank.change > 0 ? `↑${rank.change}` : rank.change < 0 ? `↓${Math.abs(rank.change)}` : undefined}
            size="md"
            variant={rank.change > 0 ? 'positive' : rank.change < 0 ? 'negative' : 'neutral'}
          />
          
          <MetricBadge
            label="Total Agencies"
            value={rank.total}
            size="md"
          />
          
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-3">
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Share Trend
            </div>
            <div className="flex items-center gap-2">
              {marketShare.change > 0.5 ? (
                <>
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-semibold text-emerald-600">Gaining</span>
                </>
              ) : marketShare.change < -0.5 ? (
                <>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-semibold text-red-600">Losing</span>
                </>
              ) : (
                <>
                  <Target className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-600">Stable</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Peer Group Performance */}
        {peerGroupPerformance.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 mb-5">
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Peer Group Comparison
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-2 px-2 text-left text-gray-500 font-semibold">Agency</th>
                    <th className="py-2 px-2 text-right text-gray-500 font-semibold">Volume</th>
                    <th className="py-2 px-2 text-right text-gray-500 font-semibold">Senior%</th>
                    <th className="py-2 px-2 text-right text-gray-500 font-semibold">Field%</th>
                  </tr>
                </thead>
                <tbody>
                  {peerTableData.map((peer, index) => (
                    <tr 
                      key={peer.id}
                      className={`border-b border-gray-50 ${peer.isYou ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    >
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          {getAgencyLogo(peer.agency) ? (
                            <img 
                              src={getAgencyLogo(peer.agency)!}
                              alt={peer.agency}
                              className="h-4 w-4 object-contain"
                            />
                          ) : (
                            <div className="w-4 h-4 rounded bg-gray-200" />
                          )}
                          <span className={peer.isYou ? 'font-bold text-blue-700' : 'text-gray-700'}>
                            {peer.agency}
                            {peer.isYou && <span className="ml-1 text-[10px]">(You)</span>}
                          </span>
                        </div>
                      </td>
                      <td className={`py-2 px-2 text-right ${peer.isYou ? 'font-bold text-blue-700' : 'text-gray-700'}`}>
                        {peer.volume.toLocaleString()}
                      </td>
                      <td className={`py-2 px-2 text-right ${peer.isYou ? 'font-bold text-blue-700' : 'text-gray-700'}`}>
                        {peer.seniorRatio.toFixed(0)}%
                      </td>
                      <td className={`py-2 px-2 text-right ${peer.isYou ? 'font-bold text-blue-700' : 'text-gray-700'}`}>
                        {peer.fieldRatio.toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Competitor Patterns & Category Position */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          {/* Competitor Patterns */}
          {competitorPatterns.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                Competitor Hiring Patterns
              </h4>
              <div className="space-y-3">
                {competitorPatterns.slice(0, 4).map((comp, index) => (
                  <div key={index} className="bg-white rounded-lg p-3 border border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {getAgencyLogo(comp.agency) ? (
                          <img 
                            src={getAgencyLogo(comp.agency)!}
                            alt={comp.agency}
                            className="h-4 w-4 object-contain"
                          />
                        ) : (
                          <div className="w-4 h-4 rounded bg-gray-200" />
                        )}
                        <span className="text-xs font-semibold text-gray-800">{comp.agency}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500">Correlation:</span>
                        <span className={`text-xs font-bold ${
                          Math.abs(comp.correlation) > 0.5 ? 'text-amber-600' : 'text-gray-600'
                        }`}>
                          {comp.correlation.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-500 truncate max-w-[180px]">
                        {comp.keyDifference}
                      </span>
                      {Math.abs(comp.volumeChange) > 10 && (
                        <TrendArrow value={comp.volumeChange} size="xs" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Position */}
          {categoryPosition.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                Your Category Positions
              </h4>
              <div className="space-y-2">
                {categoryPosition.slice(0, 5).map((cat, index) => (
                  <div key={index} className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-2 border border-gray-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        cat.yourRank <= 3 ? 'bg-emerald-100 text-emerald-700' : 
                        cat.yourRank <= 5 ? 'bg-blue-100 text-blue-700' : 
                        'bg-gray-100 text-gray-600'
                      }`}>
                        #{cat.yourRank}
                      </span>
                      <span className="text-gray-700 truncate">{cat.category}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                      <span className="font-medium text-gray-800">{cat.yourShare.toFixed(0)}%</span>
                      <span className="text-[10px] text-gray-400">
                        vs {cat.leader} ({cat.leaderShare.toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* New Competitor Moves */}
        {newCompetitorMoves.length > 0 && (
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <h4 className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              New Competitor Activity
            </h4>
            <div className="space-y-2">
              {newCompetitorMoves.slice(0, 4).map((move, index) => (
                <div key={index} className="flex items-center gap-3 text-xs bg-white/60 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {getAgencyLogo(move.agency) ? (
                      <img 
                        src={getAgencyLogo(move.agency)!}
                        alt={move.agency}
                        className="h-4 w-4 object-contain"
                      />
                    ) : (
                      <div className="w-4 h-4 rounded bg-amber-200" />
                    )}
                    <span className="font-semibold text-amber-800">{move.agency}</span>
                  </div>
                  <span className="text-amber-700">→</span>
                  <span className="text-amber-700">{move.category}</span>
                  <span className="text-[10px] text-amber-600 ml-auto">{move.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetitiveIntelSection;







