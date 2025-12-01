/**
 * Workforce Insights Panel
 * 
 * Displays AI-generated strategic insights based on workforce analysis.
 * Categorizes insights by type and impact.
 */

import React from 'react';
import { WorkforceInsight } from '../../services/analytics/WorkforceStructureAnalyzer';
import { Lightbulb, TrendingUp, AlertTriangle, Scale, Sparkles, ArrowRight } from 'lucide-react';

interface WorkforceInsightsPanelProps {
  insights: WorkforceInsight[];
  isAgencyView: boolean;
  agencyName?: string;
}

const WorkforceInsightsPanel: React.FC<WorkforceInsightsPanelProps> = ({
  insights,
  isAgencyView,
  agencyName
}) => {
  // Icon mapping by type (compact)
  const typeIcons: Record<WorkforceInsight['type'], React.ReactNode> = {
    trend: <TrendingUp className="h-3 w-3" />,
    comparison: <Scale className="h-3 w-3" />,
    anomaly: <AlertTriangle className="h-3 w-3" />,
    opportunity: <Sparkles className="h-3 w-3" />
  };

  // Color mapping by type - more subdued
  const typeColors: Record<WorkforceInsight['type'], string> = {
    trend: 'bg-white border-gray-200 text-gray-700',
    comparison: 'bg-white border-gray-200 text-gray-700',
    anomaly: 'bg-white border-gray-200 text-gray-700',
    opportunity: 'bg-white border-gray-200 text-gray-700'
  };

  // Impact badge colors
  const impactColors: Record<WorkforceInsight['impact'], string> = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-gray-100 text-gray-800'
  };

  // Group insights by type
  const groupedInsights = insights.reduce((acc, insight) => {
    if (!acc[insight.type]) acc[insight.type] = [];
    acc[insight.type].push(insight);
    return acc;
  }, {} as Record<WorkforceInsight['type'], WorkforceInsight[]>);

  // Type labels
  const typeLabels: Record<WorkforceInsight['type'], string> = {
    trend: 'Trends',
    comparison: 'Comparisons',
    anomaly: 'Anomalies',
    opportunity: 'Opportunities'
  };

  if (insights.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center">
        <Lightbulb className="h-8 w-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600">No insights available for the current selection</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Compact Header */}
      <div className="bg-gray-50 border-b border-gray-100 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-xs font-medium text-gray-700">
            Strategic Insights {isAgencyView && agencyName ? `• ${agencyName}` : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {Object.entries(typeLabels).map(([type, label]) => {
            const count = groupedInsights[type as WorkforceInsight['type']]?.length || 0;
            if (count === 0) return null;
            return (
              <span key={type} className="text-[9px] bg-gray-100 rounded px-1.5 py-0.5 text-gray-600">
                {count} {label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Compact Insights List */}
      <div className="p-2 space-y-1.5">
        {insights.slice(0, 4).map((insight, idx) => (
          <div
            key={idx}
            className="flex items-start gap-2 rounded p-2 bg-gray-50 border border-gray-100"
          >
            <span className={`text-[9px] px-1 py-0.5 rounded font-medium flex-shrink-0 ${impactColors[insight.impact]}`}>
              {insight.impact}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-medium text-gray-800 truncate">{insight.title}</div>
              <div className="text-[9px] text-gray-500 truncate">{insight.description}</div>
            </div>
            {insight.metric && (
              <span className="text-[10px] font-bold text-gray-700 flex-shrink-0">{insight.metric}</span>
            )}
          </div>
        ))}
        {insights.length > 4 && (
          <div className="text-center text-[9px] text-gray-400 py-1">
            +{insights.length - 4} more insights
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkforceInsightsPanel;

