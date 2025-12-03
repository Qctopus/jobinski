/**
 * Executive Briefing Section
 * 
 * Full-width panel at top with 4-6 sentence natural language summary.
 * Covers: volume trend, biggest structural shift, competitive movement, anomalies.
 */

import React from 'react';
import { 
  Zap, TrendingUp, TrendingDown, AlertTriangle, 
  ArrowUpRight, ArrowDownRight, Target, Activity
} from 'lucide-react';
import { ExecutiveSummary } from '../../services/analytics/IntelligenceInsightsEngine';
import { GeneratedNarrative } from '../../services/analytics/NarrativeGenerator';
import { getAgencyLogo } from '../../utils/agencyLogos';

interface ExecutiveBriefingProps {
  summary: ExecutiveSummary;
  narrative: GeneratedNarrative;
  isAgencyView: boolean;
  agencyName: string;
  periodLabel: string;
  totalJobs: number;
  marketJobs: number;
}

const ExecutiveBriefing: React.FC<ExecutiveBriefingProps> = ({
  summary,
  narrative,
  isAgencyView,
  agencyName,
  periodLabel,
  totalJobs,
  marketJobs
}) => {
  const { volumeTrend, topShift, competitorAlert, anomalyCount } = summary;
  
  const volumeChangeAbs = Math.abs(volumeTrend.change);
  const isVolumeUp = volumeTrend.change > 0;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 rounded-2xl text-white overflow-hidden">
      {/* Header Bar */}
      <div className="px-6 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isAgencyView ? (
            <>
              {getAgencyLogo(agencyName) ? (
                <img 
                  src={getAgencyLogo(agencyName)!} 
                  alt={agencyName}
                  className="h-6 w-6 object-contain bg-white rounded-md p-0.5"
                />
              ) : (
                <div className="h-6 w-6 rounded-md bg-blue-500 flex items-center justify-center">
                  <Zap className="h-4 w-4" />
                </div>
              )}
              <span className="font-semibold text-sm">{agencyName} Executive Briefing</span>
            </>
          ) : (
            <>
              <div className="h-6 w-6 rounded-md bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Activity className="h-4 w-4" />
              </div>
              <span className="font-semibold text-sm">UN Talent Market Briefing</span>
            </>
          )}
        </div>
        <span className="text-xs text-white/60">{periodLabel}</span>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Headline Narrative */}
        <div className="mb-6">
          <p className="text-lg md:text-xl font-medium leading-relaxed text-white/95">
            {narrative.headline}
          </p>
        </div>

        {/* Key Points */}
        {narrative.body.length > 0 && (
          <div className="space-y-2 mb-6">
            {narrative.body.map((point, index) => (
              <p key={index} className="text-sm text-white/80 leading-relaxed">
                {point}
              </p>
            ))}
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {/* Volume */}
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <div className="text-xs text-white/60 uppercase tracking-wide mb-1">Positions</div>
            <div className="text-2xl font-bold">{totalJobs.toLocaleString()}</div>
            <div className={`flex items-center gap-1 text-xs mt-1 ${isVolumeUp ? 'text-emerald-400' : volumeChangeAbs > 5 ? 'text-amber-400' : 'text-white/60'}`}>
              {isVolumeUp ? <ArrowUpRight className="h-3 w-3" /> : volumeChangeAbs > 5 ? <ArrowDownRight className="h-3 w-3" /> : null}
              {volumeChangeAbs > 2 ? `${isVolumeUp ? '+' : ''}${volumeTrend.change.toFixed(0)}% vs prior` : 'Stable'}
            </div>
          </div>

          {/* Market Context (Agency View) */}
          {isAgencyView && (
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
              <div className="text-xs text-white/60 uppercase tracking-wide mb-1">Market Share</div>
              <div className="text-2xl font-bold">
                {((totalJobs / marketJobs) * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-white/60 mt-1">
                of {marketJobs.toLocaleString()} market jobs
              </div>
            </div>
          )}

          {/* Top Shift */}
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <div className="text-xs text-white/60 uppercase tracking-wide mb-1">Top Shift</div>
            <div className="text-sm font-semibold truncate">{topShift.area}</div>
            <div className="text-xs text-blue-300 mt-1 truncate">{topShift.description}</div>
          </div>

          {/* Anomalies */}
          <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
            <div className="text-xs text-white/60 uppercase tracking-wide mb-1">Signals</div>
            <div className="text-2xl font-bold">{anomalyCount}</div>
            <div className="text-xs text-white/60 mt-1">
              {anomalyCount === 0 ? 'No anomalies' : anomalyCount === 1 ? 'anomaly detected' : 'anomalies detected'}
            </div>
          </div>
        </div>

        {/* Callouts */}
        {(narrative.callouts.length > 0 || competitorAlert) && (
          <div className="flex flex-wrap gap-2">
            {narrative.callouts.map((callout, index) => (
              <span
                key={index}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                  callout.type === 'positive' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : callout.type === 'negative'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'bg-white/10 text-white/80 border border-white/20'
                }`}
              >
                {callout.type === 'positive' ? (
                  <TrendingUp className="h-3 w-3" />
                ) : callout.type === 'negative' ? (
                  <TrendingDown className="h-3 w-3" />
                ) : (
                  <Target className="h-3 w-3" />
                )}
                {callout.text}
              </span>
            ))}
            
            {competitorAlert && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <AlertTriangle className="h-3 w-3" />
                {competitorAlert}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutiveBriefing;



