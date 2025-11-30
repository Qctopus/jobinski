/**
 * AgencyQualityTable - Per-agency data quality breakdown
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Download, ArrowUpDown } from 'lucide-react';
import { AgencyQualityStats, QUALITY_SCORE_COLORS } from '../../../types/dataQuality';

interface AgencyQualityTableProps {
  agencyStats: AgencyQualityStats[];
}

type SortField = 'agency' | 'totalJobs' | 'qualityScore';
type SortOrder = 'asc' | 'desc';

export const AgencyQualityTable: React.FC<AgencyQualityTableProps> = ({ agencyStats }) => {
  const [sortField, setSortField] = useState<SortField>('qualityScore');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [expandedAgency, setExpandedAgency] = useState<string | null>(null);
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'qualityScore' ? 'asc' : 'desc');
    }
  };
  
  const sortedStats = [...agencyStats].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case 'agency':
        comparison = a.agency.localeCompare(b.agency);
        break;
      case 'totalJobs':
        comparison = a.totalJobs - b.totalJobs;
        break;
      case 'qualityScore':
        comparison = a.qualityScore - b.qualityScore;
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });
  
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 bg-emerald-50';
    if (score >= 80) return 'text-lime-600 bg-lime-50';
    if (score >= 70) return 'text-amber-600 bg-amber-50';
    return 'text-rose-600 bg-rose-50';
  };
  
  const getScoreBarColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-500';
    if (score >= 80) return 'bg-lime-500';
    if (score >= 70) return 'bg-amber-500';
    return 'bg-rose-500';
  };
  
  const toggleExpand = (agency: string) => {
    setExpandedAgency(expandedAgency === agency ? null : agency);
  };
  
  // Helper to safely get issue count by type
  const getIssueCount = (stats: AgencyQualityStats, key: string): number => {
    const issues = stats.issuesByType as Record<string, number> || {};
    return issues[key] || 0;
  };
  
  // Count issue types for expanded view
  const getIssueBreakdown = (stats: AgencyQualityStats) => {
    return [
      { label: 'Non-English', count: getIssueCount(stats, 'non_english_content'), icon: '🌐' },
      { label: 'Short Desc', count: getIssueCount(stats, 'short_description') + getIssueCount(stats, 'empty_description'), icon: '📝' },
      { label: 'Missing Location', count: getIssueCount(stats, 'missing_country') + getIssueCount(stats, 'unmatched_duty_station'), icon: '📍' },
      { label: 'Empty Labels', count: getIssueCount(stats, 'empty_labels'), icon: '🏷️' },
      { label: 'Low Confidence', count: getIssueCount(stats, 'low_classification_confidence'), icon: '🎯' },
      { label: 'Date Issues', count: getIssueCount(stats, 'date_anomaly') + getIssueCount(stats, 'date_parse_error'), icon: '📅' },
    ].filter(i => i.count > 0);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">🏢 Agency Data Quality</h3>
          <p className="text-sm text-slate-600">Quality metrics and issue breakdown by agency</p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-700">
          <Download className="h-4 w-4" />
          Export Report
        </button>
      </div>
      
      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="w-8 px-4 py-3"></th>
                <th className="text-left px-4 py-3">
                  <button 
                    onClick={() => handleSort('agency')}
                    className="flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900"
                  >
                    Agency
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="text-center px-4 py-3">
                  <button 
                    onClick={() => handleSort('totalJobs')}
                    className="flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900 mx-auto"
                  >
                    Jobs
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="text-center px-4 py-3" style={{ width: '200px' }}>
                  <button 
                    onClick={() => handleSort('qualityScore')}
                    className="flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900 mx-auto"
                  >
                    Quality Score
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="text-center px-4 py-3 font-semibold text-slate-700">🌐</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-700">📝</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-700">📍</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-700">🔄</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-700">🏷️</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedStats.map((stats) => {
                const issueBreakdown = getIssueBreakdown(stats);
                const isExpanded = expandedAgency === stats.agency;
                
                return (
                  <React.Fragment key={stats.agency}>
                    <tr className={`hover:bg-slate-50 transition-colors ${isExpanded ? 'bg-slate-50' : ''}`}>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleExpand(stats.agency)}
                          className="p-1 hover:bg-slate-200 rounded"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-slate-500" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-slate-500" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">{stats.agency}</span>
                        {stats.qualityScore < 80 && (
                          <span className="ml-2 text-amber-500">⚠</span>
                        )}
                      </td>
                      <td className="text-center px-4 py-3 text-slate-700">
                        {stats.totalJobs.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${getScoreBarColor(stats.qualityScore)}`}
                              style={{ width: `${stats.qualityScore}%` }}
                            />
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getScoreColor(stats.qualityScore)}`}>
                            {stats.qualityScore}%
                          </span>
                        </div>
                      </td>
                      <td className="text-center px-4 py-3 text-sm text-slate-600">
                        {getIssueCount(stats, 'non_english_content')}
                      </td>
                      <td className="text-center px-4 py-3 text-sm text-slate-600">
                        {getIssueCount(stats, 'short_description') + getIssueCount(stats, 'empty_description')}
                      </td>
                      <td className="text-center px-4 py-3 text-sm text-slate-600">
                        {getIssueCount(stats, 'missing_country') + getIssueCount(stats, 'unmatched_duty_station')}
                      </td>
                      <td className="text-center px-4 py-3 text-sm text-slate-600">
                        {getIssueCount(stats, 'potential_duplicate')}
                      </td>
                      <td className="text-center px-4 py-3 text-sm text-slate-600">
                        {getIssueCount(stats, 'empty_labels')}
                      </td>
                    </tr>
                    
                    {/* Expanded Details */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={9} className="bg-slate-50 px-8 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Issue Breakdown */}
                            <div>
                              <h5 className="font-semibold text-slate-900 mb-3">Issue Breakdown</h5>
                              {issueBreakdown.length === 0 ? (
                                <p className="text-sm text-emerald-600">✓ No significant issues detected</p>
                              ) : (
                                <div className="space-y-2">
                                  {issueBreakdown.map((issue) => (
                                    <div key={issue.label} className="flex items-center justify-between">
                                      <span className="text-sm text-slate-600">
                                        {issue.icon} {issue.label}
                                      </span>
                                      <span className="text-sm font-medium text-slate-900">
                                        {issue.count}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            {/* Language Distribution */}
                            <div>
                              <h5 className="font-semibold text-slate-900 mb-3">Language Distribution</h5>
                              <div className="space-y-2">
                                {Object.entries(stats.languageBreakdown || {})
                                  .filter(([lang]) => lang !== 'unknown')
                                  .sort(([, a], [, b]) => b - a)
                                  .slice(0, 4)
                                  .map(([lang, count]) => {
                                    const pct = stats.totalJobs > 0 
                                      ? Math.round((count / stats.totalJobs) * 100) 
                                      : 0;
                                    return (
                                      <div key={lang} className="flex items-center gap-2">
                                        <span className="text-sm text-slate-600 w-16">{lang.toUpperCase()}</span>
                                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                          <div 
                                            className={`h-full rounded-full ${
                                              lang === 'en' ? 'bg-emerald-500' : 'bg-violet-500'
                                            }`}
                                            style={{ width: `${pct}%` }}
                                          />
                                        </div>
                                        <span className="text-sm text-slate-500 w-16 text-right">{pct}%</span>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Legend */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
          <span className="mr-4">🌐 = Non-English</span>
          <span className="mr-4">📝 = Content Issues</span>
          <span className="mr-4">📍 = Location Issues</span>
          <span className="mr-4">🔄 = Duplicates</span>
          <span>🏷️ = Empty Labels</span>
        </div>
      </div>
      
      {/* Summary Insight */}
      {sortedStats.length > 0 && sortedStats[0].qualityScore < 80 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl">💡</span>
            <div>
              <h5 className="font-semibold text-amber-900">Insight</h5>
              <p className="text-sm text-amber-800 mt-1">
                <strong>{sortedStats.filter(s => s.qualityScore < 80).map(s => s.agency).join(', ')}</strong> has 
                the lowest quality score. Primary issue appears to be{' '}
                {sortedStats[0].languageBreakdown?.fr > 10 
                  ? 'French-language content causing labelor failures' 
                  : 'content quality or scraper issues'}. 
                Consider reviewing the corresponding pipeline scripts.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

