/**
 * PipelineHealthPanel - Shows pipeline health by agency with step-by-step breakdown
 */

import React from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { 
  AgencyPipelineHealth, 
  OpenAIFailurePattern,
  PIPELINE_STEP_LABELS,
  QUALITY_SCORE_COLORS
} from '../../../types/dataQuality';

interface PipelineHealthPanelProps {
  agencyHealth: AgencyPipelineHealth[];
  openAIPatterns: OpenAIFailurePattern[];
}

export const PipelineHealthPanel: React.FC<PipelineHealthPanelProps> = ({ 
  agencyHealth, 
  openAIPatterns 
}) => {
  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 bg-emerald-50';
    if (score >= 80) return 'text-lime-600 bg-lime-50';
    if (score >= 70) return 'text-amber-600 bg-amber-50';
    return 'text-rose-600 bg-rose-50';
  };
  
  const getCellContent = (count: number) => {
    if (count === 0) return <span className="text-emerald-500">✓</span>;
    return <span className="text-amber-600 font-medium">{count}</span>;
  };
  
  return (
    <div className="space-y-6">
      {/* Agency Pipeline Table */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          🔄 Pipeline Health by Agency
        </h3>
        <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-slate-700">Agency</th>
                  <th className="text-center px-2 py-3 font-semibold text-slate-700">Last Run</th>
                  <th className="text-center px-2 py-3 font-semibold text-slate-700">Jobs</th>
                  <th className="text-center px-2 py-3 font-semibold text-slate-700">Health</th>
                  <th className="text-center px-2 py-3 font-medium text-slate-500 text-xs">scr</th>
                  <th className="text-center px-2 py-3 font-medium text-slate-500 text-xs">ext</th>
                  <th className="text-center px-2 py-3 font-medium text-slate-500 text-xs">geo</th>
                  <th className="text-center px-2 py-3 font-medium text-slate-500 text-xs">exp</th>
                  <th className="text-center px-2 py-3 font-medium text-slate-500 text-xs">lng</th>
                  <th className="text-center px-2 py-3 font-medium text-slate-500 text-xs">cln</th>
                  <th className="text-center px-2 py-3 font-medium text-slate-500 text-xs">lbl</th>
                  <th className="text-center px-2 py-3 font-medium text-slate-500 text-xs">bert</th>
                  <th className="text-center px-2 py-3 font-medium text-slate-500 text-xs">cat</th>
                </tr>
              </thead>
              <tbody>
                {agencyHealth.map((agency, idx) => (
                  <tr 
                    key={agency.agency} 
                    className={`border-b border-slate-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {agency.agency}
                      {agency.healthScore < 80 && (
                        <span className="ml-2 text-amber-500">⚠</span>
                      )}
                    </td>
                    <td className="text-center px-2 py-3 text-slate-500 font-mono text-xs">
                      {agency.lastRun}
                    </td>
                    <td className="text-center px-2 py-3 text-slate-700">
                      {agency.jobsProcessed.toLocaleString()}
                    </td>
                    <td className="text-center px-2 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${getHealthColor(agency.healthScore)}`}>
                        {agency.healthScore}%
                      </span>
                    </td>
                    <td className="text-center px-2 py-3">{getCellContent(agency.stepIssues.scraper)}</td>
                    <td className="text-center px-2 py-3">{getCellContent(agency.stepIssues.extractor)}</td>
                    <td className="text-center px-2 py-3">{getCellContent(agency.stepIssues.geo)}</td>
                    <td className="text-center px-2 py-3">{getCellContent(agency.stepIssues.jobexp)}</td>
                    <td className="text-center px-2 py-3">{getCellContent(agency.stepIssues.lang)}</td>
                    <td className="text-center px-2 py-3">{getCellContent(agency.stepIssues.clean)}</td>
                    <td className="text-center px-2 py-3">{getCellContent(agency.stepIssues.labelor)}</td>
                    <td className="text-center px-2 py-3">{getCellContent(agency.stepIssues.bertizer)}</td>
                    <td className="text-center px-2 py-3">{getCellContent(agency.stepIssues.categorizer)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 text-xs text-slate-500">
            <span className="mr-4"><span className="text-emerald-500">✓</span> = No issues</span>
            <span>Number = Issue count</span>
            <span className="ml-4">⚠ = Needs attention</span>
          </div>
        </div>
      </div>
      
      {/* Pipeline Alerts */}
      {openAIPatterns.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            🚨 Pipeline Alerts
          </h3>
          <div className="space-y-3">
            {openAIPatterns.map((pattern, idx) => (
              <div 
                key={idx}
                className={`p-4 rounded-xl border-l-4 ${
                  pattern.pattern === 'rate_limit' ? 'bg-rose-50 border-rose-400' :
                  pattern.pattern === 'non_english' ? 'bg-amber-50 border-amber-400' :
                  'bg-blue-50 border-blue-400'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {pattern.pattern === 'rate_limit' ? (
                      <AlertTriangle className="h-5 w-5 text-rose-500" />
                    ) : pattern.pattern === 'non_english' ? (
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                    ) : (
                      <Info className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900">
                      {pattern.pattern === 'rate_limit' && 'Rate Limit Batch Failure'}
                      {pattern.pattern === 'non_english' && 'Non-English Input'}
                      {pattern.pattern === 'short_input' && 'Short Input Text'}
                      {pattern.pattern === 'timeout' && 'API Timeout'}
                      <span className="ml-2 text-sm font-normal text-slate-500">
                        ({pattern.count} jobs, {pattern.percentage}%)
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{pattern.description}</p>
                    <div className="mt-2 text-sm">
                      <span className="font-medium text-slate-700">Agencies affected: </span>
                      <span className="text-slate-600">
                        {pattern.affectedAgencies.slice(0, 5).map(a => `${a.agency} (${a.count})`).join(', ')}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-slate-700">
                      <span className="font-medium">→ Solution: </span>
                      {pattern.solution}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Step Code Legend */}
      <div className="bg-slate-100 rounded-xl p-4 text-xs text-slate-600">
        <div className="font-semibold text-slate-700 mb-2">Pipeline Step Codes:</div>
        <div className="grid grid-cols-5 gap-2">
          <span><code className="bg-slate-200 px-1 rounded">scr</code> = scraper</span>
          <span><code className="bg-slate-200 px-1 rounded">ext</code> = extractor</span>
          <span><code className="bg-slate-200 px-1 rounded">geo</code> = geo</span>
          <span><code className="bg-slate-200 px-1 rounded">exp</code> = jobexp</span>
          <span><code className="bg-slate-200 px-1 rounded">lng</code> = lang</span>
          <span><code className="bg-slate-200 px-1 rounded">cln</code> = clean</span>
          <span><code className="bg-slate-200 px-1 rounded">lbl</code> = labelor</span>
          <span><code className="bg-slate-200 px-1 rounded">bert</code> = bertizer</span>
          <span><code className="bg-slate-200 px-1 rounded">cat</code> = categorizer</span>
        </div>
      </div>
    </div>
  );
};


