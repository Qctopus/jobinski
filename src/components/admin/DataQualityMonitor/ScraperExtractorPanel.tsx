/**
 * ScraperExtractorPanel - Scraper and Extractor failure analysis
 */

import React from 'react';
import { Download, AlertTriangle, ExternalLink } from 'lucide-react';
import { ScraperExtractorSummary } from '../../../types/dataQuality';

interface ScraperExtractorPanelProps {
  issues: ScraperExtractorSummary;
}

export const ScraperExtractorPanel: React.FC<ScraperExtractorPanelProps> = ({ issues }) => {
  const { totalIssues, byIssueType, byAgency, samples } = issues;
  
  const issueTypeLabels: Record<string, { label: string; description: string; icon: string }> = {
    shortDescription: {
      label: 'Short Description (<100 chars)',
      description: 'Scraper likely timed out or page didn\'t load fully',
      icon: '📄'
    },
    boilerplateOnly: {
      label: 'Boilerplate Only',
      description: '"See attached TOR", "Refer to attachment" - real content in PDF',
      icon: '📎'
    },
    missingCriticalFields: {
      label: 'Missing Critical Fields',
      description: 'title, duty_station, or posting_date is null',
      icon: '❌'
    },
    truncatedContent: {
      label: 'Truncated Content',
      description: 'Description ends mid-sentence or with "..."',
      icon: '✂️'
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🕷️</span>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Scraper & Extractor Failures</h3>
              <p className="text-sm text-slate-600">
                {totalIssues.toLocaleString()} jobs where HTML scraping or data extraction likely failed
              </p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-700">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>
      
      {/* Failure Patterns */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h4 className="font-semibold text-slate-900 mb-4">Failure Patterns</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(byIssueType).map(([type, count]) => {
            const info = issueTypeLabels[type];
            if (!info || count === 0) return null;
            return (
              <div key={type} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{info.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900">{info.label}</span>
                      <span className="text-lg font-bold text-slate-700">{count}</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">{info.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* By Agency */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h4 className="font-semibold text-slate-900 mb-4">Issues by Agency</h4>
        <div className="space-y-3">
          {byAgency.slice(0, 10).map((item) => (
            <div key={item.agency} className="flex items-center gap-4">
              <div className="w-24 font-medium text-slate-900">{item.agency}</div>
              <div className="flex-1">
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  />
                </div>
              </div>
              <div className="w-20 text-right text-sm text-slate-600">
                {item.count} ({item.percentage}%)
              </div>
            </div>
          ))}
        </div>
        {byAgency.length > 0 && byAgency[0].agency === 'UNC' && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 inline mr-2" />
            UNC has the highest scraper issues due to 30+ varied sub-agency website structures.
          </div>
        )}
      </div>
      
      {/* Sample Records */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h4 className="font-semibold text-slate-900 mb-4">Sample Records</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 font-semibold text-slate-700">ID</th>
                <th className="text-left py-2 px-3 font-semibold text-slate-700">Agency</th>
                <th className="text-left py-2 px-3 font-semibold text-slate-700">Title</th>
                <th className="text-center py-2 px-3 font-semibold text-slate-700">Desc Len</th>
                <th className="text-left py-2 px-3 font-semibold text-slate-700">Issue</th>
              </tr>
            </thead>
            <tbody>
              {samples.slice(0, 10).map((sample, idx) => (
                <tr key={sample.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="py-2 px-3 font-mono text-xs text-slate-500">{sample.id}</td>
                  <td className="py-2 px-3 text-slate-700">{sample.agency}</td>
                  <td className="py-2 px-3 text-slate-900 max-w-xs truncate">
                    {sample.title || <span className="text-rose-500 italic">[null]</span>}
                  </td>
                  <td className="text-center py-2 px-3 font-mono text-slate-600">{sample.descLength}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      sample.issue === 'missingCriticalFields' ? 'bg-rose-100 text-rose-700' :
                      sample.issue === 'shortDescription' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {sample.issue}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Recommendation */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h5 className="font-semibold text-blue-900 mb-2">💡 Recommendations</h5>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>UNC has highest scraper issues due to 30+ varied sub-agency website structures</li>
          <li>Consider reviewing UNC_crawler.py selectors for the most problematic sub-agencies</li>
          <li>UNESCO is PDF-heavy - many job details are in attachments not scraped</li>
          <li>Check Selenium/Chrome timeout settings for agencies with short descriptions</li>
        </ul>
      </div>
    </div>
  );
};


