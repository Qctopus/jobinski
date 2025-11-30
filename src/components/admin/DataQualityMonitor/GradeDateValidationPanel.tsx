/**
 * GradeDateValidationPanel - Grade format and date anomaly validation
 */

import React from 'react';
import { AlertTriangle, Calendar, Award } from 'lucide-react';
import { UnrecognizedGrade, DateAnomaly } from '../../../types/dataQuality';

interface GradeDateValidationPanelProps {
  unrecognizedGrades: UnrecognizedGrade[];
  dateAnomalies: DateAnomaly[];
}

export const GradeDateValidationPanel: React.FC<GradeDateValidationPanelProps> = ({ 
  unrecognizedGrades, 
  dateAnomalies 
}) => {
  const totalGradeIssues = unrecognizedGrades.reduce((sum, g) => sum + g.count, 0);
  
  // Group date anomalies by type
  const missingPosting = dateAnomalies.filter(d => d.issueType === 'missing_posting');
  const missingDeadline = dateAnomalies.filter(d => d.issueType === 'missing_deadline');
  const deadlineBefore = dateAnomalies.filter(d => d.issueType === 'deadline_before_posted');
  const futurePosting = dateAnomalies.filter(d => d.issueType === 'future_posting');
  const invalidFormat = dateAnomalies.filter(d => d.issueType === 'invalid_format');
  
  const getIssueTypeLabel = (type: string) => {
    switch (type) {
      case 'missing_posting': return 'Missing Posting Date';
      case 'missing_deadline': return 'Missing Deadline';
      case 'deadline_before_posted': return 'Deadline Before Posted';
      case 'future_posting': return 'Future Posting Date';
      case 'invalid_format': return 'Invalid Format';
      default: return type;
    }
  };
  
  const getIssueTypeColor = (type: string) => {
    switch (type) {
      case 'missing_posting': return 'bg-amber-100 text-amber-700';
      case 'missing_deadline': return 'bg-amber-100 text-amber-700';
      case 'deadline_before_posted': return 'bg-rose-100 text-rose-700';
      case 'future_posting': return 'bg-rose-100 text-rose-700';
      case 'invalid_format': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Grade Issues */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center gap-3 mb-4">
            <Award className="h-6 w-6 text-orange-600" />
            <h3 className="text-lg font-bold text-slate-900">Grade Issues</h3>
          </div>
          <div className="text-4xl font-bold text-orange-600 mb-2">{totalGradeIssues}</div>
          <p className="text-sm text-slate-600">
            {unrecognizedGrades.length} unrecognized grade formats
          </p>
        </div>
        
        {/* Date Issues */}
        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-6 border border-cyan-200">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="h-6 w-6 text-cyan-600" />
            <h3 className="text-lg font-bold text-slate-900">Date Issues</h3>
          </div>
          <div className="text-4xl font-bold text-cyan-600 mb-2">{dateAnomalies.length}</div>
          <p className="text-sm text-slate-600">
            Parse errors, missing dates, or anomalies
          </p>
        </div>
      </div>
      
      {/* Unrecognized Grades */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          📊 Unrecognized Grade Formats
        </h4>
        {unrecognizedGrades.length === 0 ? (
          <p className="text-slate-500 text-sm">No unrecognized grade formats found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 font-semibold text-slate-700">Grade Value</th>
                  <th className="text-center py-2 px-3 font-semibold text-slate-700">Count</th>
                  <th className="text-left py-2 px-3 font-semibold text-slate-700">Suggested Interpretation</th>
                </tr>
              </thead>
              <tbody>
                {unrecognizedGrades.map((grade, idx) => (
                  <tr key={grade.gradeValue} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="py-2 px-3 font-mono text-slate-900">"{grade.gradeValue}"</td>
                    <td className="text-center py-2 px-3 text-slate-700">{grade.count}</td>
                    <td className="py-2 px-3 text-slate-500">
                      {grade.suggestedInterpretation 
                        ? <span className="text-emerald-600">→ {grade.suggestedInterpretation}</span>
                        : <span className="text-amber-600">[Manual mapping needed]</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 p-3 bg-slate-100 rounded-lg text-sm text-slate-600">
          <strong>Valid grade formats:</strong> P-1 to P-7, D-1/D-2, G-1 to G-7, NO-A to NO-E, 
          SB-1 to SB-5, LICA-*, IPSA-*, SC-*, UNV, Consultant, Intern, JPO, ASG, USG
        </div>
      </div>
      
      {/* Date Anomalies */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          📅 Date Anomalies
        </h4>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="p-3 bg-amber-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-amber-600">{missingPosting.length}</div>
            <div className="text-xs text-amber-700">Missing Posting</div>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-amber-600">{missingDeadline.length}</div>
            <div className="text-xs text-amber-700">Missing Deadline</div>
          </div>
          <div className="p-3 bg-rose-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-rose-600">{deadlineBefore.length}</div>
            <div className="text-xs text-rose-700">Deadline Before Posted</div>
          </div>
          <div className="p-3 bg-rose-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-rose-600">{futurePosting.length}</div>
            <div className="text-xs text-rose-700">Future Posting</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-slate-600">{invalidFormat.length}</div>
            <div className="text-xs text-slate-700">Invalid Format</div>
          </div>
        </div>
        
        {/* Sample Table */}
        {dateAnomalies.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 font-semibold text-slate-700">ID</th>
                  <th className="text-left py-2 px-3 font-semibold text-slate-700">Agency</th>
                  <th className="text-left py-2 px-3 font-semibold text-slate-700">Posted</th>
                  <th className="text-left py-2 px-3 font-semibold text-slate-700">Deadline</th>
                  <th className="text-left py-2 px-3 font-semibold text-slate-700">Issue</th>
                </tr>
              </thead>
              <tbody>
                {dateAnomalies.slice(0, 15).map((anomaly, idx) => (
                  <tr key={anomaly.jobId} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="py-2 px-3 font-mono text-xs text-slate-500">{anomaly.jobId}</td>
                    <td className="py-2 px-3 text-slate-700">{anomaly.agency}</td>
                    <td className="py-2 px-3 text-slate-700">
                      {anomaly.postingDate || <span className="text-rose-500">[null]</span>}
                    </td>
                    <td className="py-2 px-3 text-slate-700">
                      {anomaly.applyUntil || <span className="text-rose-500">[null]</span>}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getIssueTypeColor(anomaly.issueType)}`}>
                        {getIssueTypeLabel(anomaly.issueType)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <h5 className="font-semibold text-orange-900 mb-2">💡 Grade Recommendations</h5>
          <ul className="text-sm text-orange-800 space-y-1 list-disc list-inside">
            <li>Add new grade patterns to grade validation in clean_ORG.py</li>
            <li>"Level not specified" → map to Unknown</li>
            <li>Service Contract bands (SB-*) are valid UN grades</li>
            <li>LICA levels are Local Individual Contractor Agreement grades</li>
          </ul>
        </div>
        
        <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-4">
          <h5 className="font-semibold text-cyan-900 mb-2">💡 Date Recommendations</h5>
          <ul className="text-sm text-cyan-800 space-y-1 list-disc list-inside">
            <li>Check date format handling in clean_ORG.py (DD/MM vs MM/DD)</li>
            <li>Some agencies use DD/MM/YYYY format</li>
            <li>"Deadline before posted" usually indicates format swap</li>
            <li>Future posting dates may be scheduled posts or format errors</li>
          </ul>
        </div>
      </div>
    </div>
  );
};


