/**
 * ClassificationQualityPanel - ML classification quality analysis
 */

import React, { useMemo } from 'react';
import { AlertTriangle, TrendingUp, Target } from 'lucide-react';
import { DataQualitySummary } from '../../../types/dataQuality';

interface ClassificationQualityPanelProps {
  data: any[];
  summary: DataQualitySummary;
}

export const ClassificationQualityPanel: React.FC<ClassificationQualityPanelProps> = ({ data, summary }) => {
  // Calculate confidence distribution
  const confidenceDistribution = useMemo(() => {
    const dist = {
      high: 0,    // >= 70%
      medium: 0,  // 40-69%
      low: 0      // < 40%
    };
    
    for (const job of data) {
      const conf = job.classification_confidence || 50;
      if (conf >= 70) dist.high++;
      else if (conf >= 40) dist.medium++;
      else dist.low++;
    }
    
    return dist;
  }, [data]);
  
  // Get low confidence jobs
  const lowConfidenceJobs = useMemo(() => {
    return data
      .filter(j => (j.classification_confidence || 50) < 40)
      .sort((a, b) => (a.classification_confidence || 50) - (b.classification_confidence || 50))
      .slice(0, 20);
  }, [data]);
  
  // Analyze low confidence reasons
  const lowConfReasons = useMemo(() => {
    const reasons: Record<string, number> = {
      noLabels: 0,
      ambiguous: 0,
      genericTitle: 0,
      nonEnglish: 0
    };
    
    for (const job of lowConfidenceJobs) {
      if (!job.job_labels || job.job_labels.trim() === '') {
        reasons.noLabels++;
      }
      const title = (job.title || '').toLowerCase();
      if (['consultant', 'officer', 'assistant', 'specialist'].some(t => title === t)) {
        reasons.genericTitle++;
      }
    }
    
    return reasons;
  }, [lowConfidenceJobs]);
  
  // Category distribution in low confidence
  const categoryDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    
    for (const job of lowConfidenceJobs) {
      const cat = job.primary_category || job.sectoral_category || 'Unknown';
      dist[cat] = (dist[cat] || 0) + 1;
    }
    
    return Object.entries(dist)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [lowConfidenceJobs]);
  
  const totalJobs = data.length;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-6 border border-rose-200">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🏷️</span>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Classification Quality</h3>
            <p className="text-sm text-slate-600">
              {confidenceDistribution.low.toLocaleString()} jobs with low confidence classification (&lt;40%)
            </p>
          </div>
        </div>
      </div>
      
      {/* Confidence Distribution */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h4 className="font-semibold text-slate-900 mb-4">Confidence Distribution</h4>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-emerald-700">High (≥70%)</span>
              <span className="text-sm text-slate-600">
                {confidenceDistribution.high.toLocaleString()} ({Math.round((confidenceDistribution.high / totalJobs) * 100)}%)
              </span>
            </div>
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${(confidenceDistribution.high / totalJobs) * 100}%` }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-amber-700">Medium (40-69%)</span>
              <span className="text-sm text-slate-600">
                {confidenceDistribution.medium.toLocaleString()} ({Math.round((confidenceDistribution.medium / totalJobs) * 100)}%)
              </span>
            </div>
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${(confidenceDistribution.medium / totalJobs) * 100}%` }}
              />
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-rose-700">Low (&lt;40%)</span>
              <span className="text-sm text-slate-600">
                {confidenceDistribution.low.toLocaleString()} ({Math.round((confidenceDistribution.low / totalJobs) * 100)}%)
              </span>
            </div>
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-rose-500 rounded-full"
                style={{ width: `${(confidenceDistribution.low / totalJobs) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Low Confidence Reasons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h4 className="font-semibold text-slate-900 mb-4">Low Confidence Reasons</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏷️</span>
                <span className="text-sm text-slate-700">No job_labels available</span>
              </div>
              <span className="font-bold text-slate-900">{lowConfReasons.noLabels}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <span className="text-sm text-slate-700">Ambiguous - multiple categories match</span>
              </div>
              <span className="font-bold text-slate-900">{lowConfReasons.ambiguous}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-lg">📝</span>
                <span className="text-sm text-slate-700">Generic title (Consultant, Officer)</span>
              </div>
              <span className="font-bold text-slate-900">{lowConfReasons.genericTitle}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-lg">🌐</span>
                <span className="text-sm text-slate-700">Non-English content</span>
              </div>
              <span className="font-bold text-slate-900">{lowConfReasons.nonEnglish}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h4 className="font-semibold text-slate-900 mb-4">Category Distribution (Low Confidence)</h4>
          <div className="space-y-3">
            {categoryDistribution.map(([category, count]) => {
              const pct = Math.round((count / confidenceDistribution.low) * 100);
              return (
                <div key={category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-700 truncate max-w-[200px]">{category}</span>
                    <span className="text-sm text-slate-500">{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-rose-400 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {categoryDistribution.length > 0 && (
            <p className="mt-4 text-xs text-slate-500">
              {categoryDistribution[0][0]} accounts for {Math.round((categoryDistribution[0][1] as number / confidenceDistribution.low) * 100)}% 
              of low-confidence classifications - often a fallback when category is unclear.
            </p>
          )}
        </div>
      </div>
      
      {/* Sample Low Confidence Jobs */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h4 className="font-semibold text-slate-900 mb-4">Sample Low Confidence Jobs</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 font-semibold text-slate-700">ID</th>
                <th className="text-left py-2 px-3 font-semibold text-slate-700">Title</th>
                <th className="text-left py-2 px-3 font-semibold text-slate-700">Category</th>
                <th className="text-center py-2 px-3 font-semibold text-slate-700">Conf</th>
                <th className="text-left py-2 px-3 font-semibold text-slate-700">Issue</th>
              </tr>
            </thead>
            <tbody>
              {lowConfidenceJobs.slice(0, 10).map((job, idx) => (
                <tr key={job.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="py-2 px-3 font-mono text-xs text-slate-500">{job.id}</td>
                  <td className="py-2 px-3 text-slate-900 max-w-xs truncate">{job.title || '-'}</td>
                  <td className="py-2 px-3 text-slate-700 max-w-[150px] truncate">
                    {job.primary_category || job.sectoral_category || '-'}
                  </td>
                  <td className="text-center py-2 px-3">
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-xs rounded-full font-medium">
                      {job.classification_confidence || 0}%
                    </span>
                  </td>
                  <td className="py-2 px-3 text-sm text-slate-500">
                    {!job.job_labels ? 'No labels' : 
                     ['consultant', 'officer', 'assistant'].some(t => (job.title || '').toLowerCase() === t) 
                       ? 'Generic' : 'Ambiguous'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Recommendation */}
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-500 mt-0.5" />
          <div>
            <h5 className="font-semibold text-rose-900">Manual Review Recommended</h5>
            <p className="text-sm text-rose-800 mt-1">
              {confidenceDistribution.low} jobs have low classification confidence. 
              Jobs with generic titles ("Consultant", "Officer") or missing job_labels 
              often default to "Operations & Admin" category and may need manual review.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};


