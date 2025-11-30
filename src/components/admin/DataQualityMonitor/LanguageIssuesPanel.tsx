/**
 * LanguageIssuesPanel - Non-English content detection and impact analysis
 */

import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { LanguageIssueSummary, DetectedLanguage } from '../../../types/dataQuality';

interface LanguageIssuesPanelProps {
  languageIssues: LanguageIssueSummary;
}

const LANGUAGE_NAMES: Record<DetectedLanguage, string> = {
  en: 'English',
  fr: 'French',
  es: 'Spanish',
  ar: 'Arabic',
  pt: 'Portuguese',
  zh: 'Chinese',
  ru: 'Russian',
  other: 'Other',
  unknown: 'Unknown'
};

const LANGUAGE_FLAGS: Record<DetectedLanguage, string> = {
  en: '🇬🇧',
  fr: '🇫🇷',
  es: '🇪🇸',
  ar: '🇸🇦',
  pt: '🇵🇹',
  zh: '🇨🇳',
  ru: '🇷🇺',
  other: '🌍',
  unknown: '❓'
};

export const LanguageIssuesPanel: React.FC<LanguageIssuesPanelProps> = ({ languageIssues }) => {
  const { totalNonEnglish, byLanguage, byAgency, impactCorrelation } = languageIssues;
  
  const nonEnglishLangs = Object.entries(byLanguage)
    .filter(([lang]) => lang !== 'en' && lang !== 'unknown')
    .sort(([, a], [, b]) => b - a);
  
  const totalAll = Object.values(byLanguage).reduce((a, b) => a + b, 0);
  
  // Calculate correlation percentages
  const frenchTotal = byLanguage.fr || 0;
  const spanishTotal = byLanguage.es || 0;
  const arabicTotal = byLanguage.ar || 0;
  const englishTotal = byLanguage.en || 0;
  
  const frenchEmptyPct = frenchTotal > 0 ? Math.round((impactCorrelation.emptyLabels.french / frenchTotal) * 100) : 0;
  const spanishEmptyPct = spanishTotal > 0 ? Math.round((impactCorrelation.emptyLabels.spanish / spanishTotal) * 100) : 0;
  const arabicEmptyPct = arabicTotal > 0 ? Math.round((impactCorrelation.emptyLabels.arabic / arabicTotal) * 100) : 0;
  const englishEmptyPct = englishTotal > 0 ? Math.round((impactCorrelation.emptyLabels.english / englishTotal) * 100) : 0;
  
  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-6 border border-violet-200">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🌐</span>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Non-English Content Detected</h3>
            <p className="text-sm text-slate-600">
              {totalNonEnglish.toLocaleString()} jobs in French/Spanish/Arabic detected
            </p>
          </div>
        </div>
        <p className="text-sm text-slate-600">
          Azure OpenAI (labelor, categorizer) is configured for English input. 
          Non-English content often produces poor or empty results.
        </p>
      </div>
      
      {/* Language Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By Language Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h4 className="font-semibold text-slate-900 mb-4">Language Breakdown</h4>
          <div className="space-y-3">
            {nonEnglishLangs.map(([lang, count]) => {
              const pct = totalAll > 0 ? (count / totalAll) * 100 : 0;
              return (
                <div key={lang}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">
                      {LANGUAGE_FLAGS[lang as DetectedLanguage]} {LANGUAGE_NAMES[lang as DetectedLanguage]}
                    </span>
                    <span className="text-sm text-slate-500">
                      {count} ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-violet-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Impact on Pipeline */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h4 className="font-semibold text-slate-900 mb-4">Impact on Pipeline Steps</h4>
          <div className="space-y-3">
            <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
              <div className="flex items-center gap-2">
                <span className="font-medium text-rose-800">labelor</span>
                <span className="px-2 py-0.5 bg-rose-200 text-rose-800 text-xs rounded-full">HIGH</span>
              </div>
              <p className="text-sm text-rose-700 mt-1">Often returns empty/poor labels</p>
            </div>
            <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
              <div className="flex items-center gap-2">
                <span className="font-medium text-rose-800">categorizer</span>
                <span className="px-2 py-0.5 bg-rose-200 text-rose-800 text-xs rounded-full">HIGH</span>
              </div>
              <p className="text-sm text-rose-700 mt-1">May miscategorize or return null</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2">
                <span className="font-medium text-amber-800">bertizer</span>
                <span className="px-2 py-0.5 bg-amber-200 text-amber-800 text-xs rounded-full">MED</span>
              </div>
              <p className="text-sm text-amber-700 mt-1">BERT handles multilingual but less ideal</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Correlation Analysis */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h4 className="font-semibold text-slate-900 mb-4">
          Correlation: Non-English → Empty job_labels
        </h4>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-4 bg-rose-50 rounded-xl border border-rose-200">
            <div className="text-sm text-rose-700 mb-1">French</div>
            <div className="text-3xl font-bold text-rose-600">{frenchEmptyPct}%</div>
            <div className="text-xs text-rose-500 mt-1">
              {impactCorrelation.emptyLabels.french} / {frenchTotal}
            </div>
          </div>
          <div className="text-center p-4 bg-amber-50 rounded-xl border border-amber-200">
            <div className="text-sm text-amber-700 mb-1">Spanish</div>
            <div className="text-3xl font-bold text-amber-600">{spanishEmptyPct}%</div>
            <div className="text-xs text-amber-500 mt-1">
              {impactCorrelation.emptyLabels.spanish} / {spanishTotal}
            </div>
          </div>
          <div className="text-center p-4 bg-rose-50 rounded-xl border border-rose-200">
            <div className="text-sm text-rose-700 mb-1">Arabic</div>
            <div className="text-3xl font-bold text-rose-600">{arabicEmptyPct}%</div>
            <div className="text-xs text-rose-500 mt-1">
              {impactCorrelation.emptyLabels.arabic} / {arabicTotal}
            </div>
          </div>
          <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <div className="text-sm text-emerald-700 mb-1">English</div>
            <div className="text-3xl font-bold text-emerald-600">{englishEmptyPct}%</div>
            <div className="text-xs text-emerald-500 mt-1">
              {impactCorrelation.emptyLabels.english} / {englishTotal}
            </div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-slate-100 rounded-lg text-sm text-slate-600">
          <strong>Strong correlation confirms:</strong> Azure OpenAI struggles with non-English input. 
          English jobs have ~{englishEmptyPct}% empty labels vs {Math.round((frenchEmptyPct + arabicEmptyPct) / 2)}% for non-English.
        </div>
      </div>
      
      {/* By Agency */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h4 className="font-semibold text-slate-900 mb-4">Non-English Content by Agency</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 font-semibold text-slate-700">Agency</th>
                <th className="text-center py-2 font-semibold text-slate-700">Total</th>
                <th className="text-center py-2 font-semibold text-slate-700">🇫🇷 FR</th>
                <th className="text-center py-2 font-semibold text-slate-700">🇪🇸 ES</th>
                <th className="text-center py-2 font-semibold text-slate-700">🇸🇦 AR</th>
              </tr>
            </thead>
            <tbody>
              {byAgency.slice(0, 10).map((item) => (
                <tr key={item.agency} className="border-b border-slate-100">
                  <td className="py-2 font-medium text-slate-900">{item.agency}</td>
                  <td className="text-center py-2 text-slate-700">{item.count}</td>
                  <td className="text-center py-2 text-slate-500">{item.breakdown.fr || 0}</td>
                  <td className="text-center py-2 text-slate-500">{item.breakdown.es || 0}</td>
                  <td className="text-center py-2 text-slate-500">{item.breakdown.ar || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Recommendation */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <h5 className="font-semibold text-blue-900">💡 Recommendation</h5>
            <p className="text-sm text-blue-800 mt-1">
              Consider adding a translation step before labelor for UNESCO, FAO jobs, 
              or switch to a multilingual Azure OpenAI model for these agencies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};


