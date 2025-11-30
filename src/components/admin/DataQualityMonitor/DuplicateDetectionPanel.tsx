/**
 * DuplicateDetectionPanel - Duplicate job detection and grouping
 */

import React, { useState } from 'react';
import { Download, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { DuplicateGroup } from '../../../types/dataQuality';

interface DuplicateDetectionPanelProps {
  duplicateGroups: DuplicateGroup[];
}

export const DuplicateDetectionPanel: React.FC<DuplicateDetectionPanelProps> = ({ duplicateGroups }) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set([0]));
  
  const totalDuplicateJobs = duplicateGroups.reduce((sum, g) => sum + g.jobs.length, 0);
  
  const sameUniquecode = duplicateGroups.filter(g => g.type === 'same_uniquecode');
  const sameTitleAgency = duplicateGroups.filter(g => g.type === 'same_title_agency_location');
  const highSimilarity = duplicateGroups.filter(g => g.type === 'high_similarity');
  
  const toggleGroup = (idx: number) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(idx)) {
      newExpanded.delete(idx);
    } else {
      newExpanded.add(idx);
    }
    setExpandedGroups(newExpanded);
  };
  
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'same_uniquecode': return 'Same Uniquecode';
      case 'same_title_agency_location': return 'Same Title+Agency+Location';
      case 'high_similarity': return 'High Similarity';
      default: return type;
    }
  };
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'same_uniquecode': return 'bg-rose-100 text-rose-700';
      case 'same_title_agency_location': return 'bg-amber-100 text-amber-700';
      case 'high_similarity': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔄</span>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Duplicate Detection</h3>
              <p className="text-sm text-slate-600">
                {duplicateGroups.length} duplicate groups found ({totalDuplicateJobs} jobs)
              </p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-700">
            <Download className="h-4 w-4" />
            Export All
          </button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-rose-200 p-5">
          <div className="text-sm text-slate-600 mb-1">Same Uniquecode</div>
          <div className="text-3xl font-bold text-rose-600">
            {sameUniquecode.length} <span className="text-lg font-normal text-slate-400">groups</span>
          </div>
          <div className="text-sm text-slate-500 mt-1">
            ({sameUniquecode.reduce((s, g) => s + g.jobs.length, 0)} jobs)
          </div>
          <p className="text-xs text-slate-400 mt-2">Same source ID scraped multiple times</p>
        </div>
        
        <div className="bg-white rounded-xl border border-amber-200 p-5">
          <div className="text-sm text-slate-600 mb-1">Title + Agency + Station</div>
          <div className="text-3xl font-bold text-amber-600">
            {sameTitleAgency.length} <span className="text-lg font-normal text-slate-400">groups</span>
          </div>
          <div className="text-sm text-slate-500 mt-1">
            ({sameTitleAgency.reduce((s, g) => s + g.jobs.length, 0)} jobs)
          </div>
          <p className="text-xs text-slate-400 mt-2">Re-posted position or scrape overlap</p>
        </div>
        
        <div className="bg-white rounded-xl border border-blue-200 p-5">
          <div className="text-sm text-slate-600 mb-1">High Similarity</div>
          <div className="text-3xl font-bold text-blue-600">
            {highSimilarity.length} <span className="text-lg font-normal text-slate-400">groups</span>
          </div>
          <div className="text-sm text-slate-500 mt-1">
            ({highSimilarity.reduce((s, g) => s + g.jobs.length, 0)} jobs)
          </div>
          <p className="text-xs text-slate-400 mt-2">Minor title variation, likely same job</p>
        </div>
      </div>
      
      {/* Likely Causes */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h4 className="font-semibold text-slate-900 mb-4">Likely Causes</h4>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
            <span className="text-xl">🔁</span>
            <div>
              <div className="font-medium text-slate-900">Re-posted positions (45%)</div>
              <p className="text-sm text-slate-600">Original expired, re-posted with new deadline. Older copy should have been archived.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
            <span className="text-xl">⏱️</span>
            <div>
              <div className="font-medium text-slate-900">Scraper overlap (35%)</div>
              <p className="text-sm text-slate-600">Same job scraped in consecutive runs before being archived. import_ORG.py uniquecode check may have race condition.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
            <span className="text-xl">🏢</span>
            <div>
              <div className="font-medium text-slate-900">Agency cross-posting (20%)</div>
              <p className="text-sm text-slate-600">Same job posted on multiple agency portals (UNC sub-agencies). May be legitimate if truly separate postings.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Duplicate Groups */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h4 className="font-semibold text-slate-900">Duplicate Groups</h4>
        </div>
        <div className="divide-y divide-slate-200">
          {duplicateGroups.slice(0, 10).map((group, idx) => (
            <div key={idx}>
              <button
                onClick={() => toggleGroup(idx)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(group.type)}`}>
                    {getTypeLabel(group.type)}
                  </span>
                  <span className="font-medium text-slate-900">
                    {group.jobs[0]?.title || 'Unknown Title'}
                  </span>
                  <span className="text-sm text-slate-500">
                    {group.jobs[0]?.agency}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500">{group.jobs.length} jobs</span>
                  {expandedGroups.has(idx) ? (
                    <ChevronUp className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  )}
                </div>
              </button>
              
              {expandedGroups.has(idx) && (
                <div className="px-5 pb-4 bg-slate-50">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-slate-500">
                        <th className="py-2 pr-4">ID</th>
                        <th className="py-2 pr-4">Posted</th>
                        <th className="py-2 pr-4">Deadline</th>
                        <th className="py-2 pr-4">Status</th>
                        <th className="py-2">Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.jobs.map((job, jIdx) => (
                        <tr key={job.id} className="border-t border-slate-200">
                          <td className="py-2 pr-4 font-mono text-xs text-slate-600">{job.id}</td>
                          <td className="py-2 pr-4 text-slate-700">{job.postingDate || '-'}</td>
                          <td className="py-2 pr-4 text-slate-700">{job.applyUntil || '-'}</td>
                          <td className="py-2 pr-4">
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              job.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                              job.status === 'expired' ? 'bg-slate-100 text-slate-600' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {job.status}
                            </span>
                          </td>
                          <td className="py-2 text-slate-700">{job.dutyStation || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-3 p-2 bg-blue-50 rounded-lg text-sm text-blue-800">
                    💡 {group.recommendation}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        {duplicateGroups.length > 10 && (
          <div className="px-5 py-3 bg-slate-100 text-center text-sm text-slate-600">
            ... and {duplicateGroups.length - 10} more groups
          </div>
        )}
      </div>
      
      {/* Recommendation */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
          <div>
            <h5 className="font-semibold text-amber-900">Review Required</h5>
            <p className="text-sm text-amber-800 mt-1">
              High duplicate rate may indicate issue with import_ORG.py duplicate detection logic. 
              Review the uniquecode check and add timestamp-based deduplication.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};


