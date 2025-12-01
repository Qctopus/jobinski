/**
 * ExecutiveSummary - Prose briefing (Key Indicators moved to HeaderMetrics)
 * Streamlined to show narrative only, no duplicate metrics
 */

import React from 'react';
import { Zap, Sparkles } from 'lucide-react';
import { ExecutiveSummary as ExecutiveSummaryData } from '../../../services/analytics/IntelligenceBriefEngine';

interface ExecutiveSummaryProps {
  data: ExecutiveSummaryData;
}

// Pulse dot indicator
const PulseDot: React.FC<{ color?: 'emerald' | 'amber' | 'red' | 'blue' }> = ({ color = 'emerald' }) => {
  const colors = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500'
  };
  
  return (
    <span className="relative flex h-2 w-2">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors[color]} opacity-75`} />
      <span className={`relative inline-flex rounded-full h-2 w-2 ${colors[color]}`} />
    </span>
  );
};

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ data }) => {
  const hasHighPrioritySignal = data.vitalSigns.some(m => 
    m.change && Math.abs(m.change) > 20
  );

  return (
    <section className="bg-gradient-to-br from-slate-50 via-white to-blue-50/30 border-b border-gray-200">
      {/* Colored accent border */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
      
      <div className="px-6 py-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-200/50">
              <Zap className="h-5 w-5 text-white" />
            </div>
            {hasHighPrioritySignal && (
              <div className="absolute -top-1 -right-1">
                <PulseDot color="red" />
              </div>
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Executive Briefing</h2>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-500" />
              AI-generated strategic summary
            </p>
          </div>
        </div>

        {/* Narrative Paragraphs - single card */}
        <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
          {data.paragraphs.map((paragraph, i) => (
            <p 
              key={i} 
              className={`text-gray-700 leading-relaxed mb-3 last:mb-0 ${
                i === 0 ? 'text-base font-medium' : 'text-sm'
              }`}
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
};
