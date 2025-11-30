/**
 * HealthScoreCard - Overall data health score display
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { DataQualitySummary, QUALITY_SCORE_COLORS } from '../../../types/dataQuality';

interface HealthScoreCardProps {
  summary: DataQualitySummary;
}

export const HealthScoreCard: React.FC<HealthScoreCardProps> = ({ summary }) => {
  const score = summary.overallScore;
  
  // Determine color based on score
  const getScoreColor = (s: number): string => {
    if (s >= 90) return QUALITY_SCORE_COLORS.excellent;
    if (s >= 80) return QUALITY_SCORE_COLORS.good;
    if (s >= 70) return QUALITY_SCORE_COLORS.fair;
    if (s >= 60) return QUALITY_SCORE_COLORS.poor;
    return QUALITY_SCORE_COLORS.critical;
  };
  
  const scoreColor = getScoreColor(score);
  const progressWidth = `${Math.min(score, 100)}%`;
  
  // Trend icon
  const TrendIcon = summary.trend === 'improving' ? TrendingUp : 
                    summary.trend === 'declining' ? TrendingDown : Minus;
  const trendColor = summary.trend === 'improving' ? 'text-emerald-600' :
                     summary.trend === 'declining' ? 'text-rose-600' : 'text-slate-500';
  
  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-200">Overall Data Health</h2>
          <p className="text-sm text-slate-400 mt-1">
            Analyzing {summary.totalJobs.toLocaleString()} jobs from pipeline
          </p>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          summary.trend === 'improving' ? 'bg-emerald-500/20 text-emerald-300' :
          summary.trend === 'declining' ? 'bg-rose-500/20 text-rose-300' :
          'bg-slate-600/50 text-slate-300'
        }`}>
          <TrendIcon className="h-3 w-3" />
          <span>{summary.trend.charAt(0).toUpperCase() + summary.trend.slice(1)}</span>
        </div>
      </div>
      
      {/* Score Display */}
      <div className="flex items-end gap-4 mb-6">
        <div className="text-6xl font-bold tracking-tight" style={{ color: scoreColor }}>
          {score.toFixed(1)}%
        </div>
        <div className="text-slate-400 pb-2 text-sm">
          quality score
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ 
              width: progressWidth,
              backgroundColor: scoreColor
            }}
          />
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-sm text-slate-300">Clean</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {summary.cleanJobs.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400">
            {((summary.cleanJobs / summary.totalJobs) * 100).toFixed(1)}% of total
          </div>
        </div>
        
        <div className="bg-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-sm text-slate-300">With Issues</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {summary.jobsWithIssues.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400">
            {summary.warningIssues} warnings
          </div>
        </div>
        
        <div className="bg-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-rose-400" />
            <span className="text-sm text-slate-300">Critical</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {summary.criticalIssues.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400">
            needs immediate fix
          </div>
        </div>
      </div>
    </div>
  );
};


