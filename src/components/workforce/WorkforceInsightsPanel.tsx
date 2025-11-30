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
  // Icon mapping by type
  const typeIcons: Record<WorkforceInsight['type'], React.ReactNode> = {
    trend: <TrendingUp className="h-5 w-5" />,
    comparison: <Scale className="h-5 w-5" />,
    anomaly: <AlertTriangle className="h-5 w-5" />,
    opportunity: <Sparkles className="h-5 w-5" />
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
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <Lightbulb className="h-4 w-4 text-gray-500" />
          <div>
            <h3 className="text-sm font-semibold text-gray-800">
              Strategic Workforce Insights
            </h3>
            <p className="text-xs text-gray-500">
              {isAgencyView 
                ? `Analysis for ${agencyName}` 
                : 'UN System-wide workforce intelligence'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Insights Grid */}
      <div className="p-4 space-y-4">
        {/* All insights in a list */}
        <div className="space-y-3">
          {insights.map((insight, idx) => (
            <div
              key={idx}
              className={`rounded-lg border p-4 ${typeColors[insight.type]}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {typeIcons[insight.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${impactColors[insight.impact]}`}>
                      {insight.impact} impact
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{insight.description}</p>
                  {insight.metric && (
                    <div className="mt-2 inline-flex items-center gap-1 bg-white/50 rounded px-2 py-1">
                      <span className="text-xs text-gray-500">Key metric:</span>
                      <span className="text-sm font-semibold text-gray-900">{insight.metric}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary by Type */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-indigo-200">
          {Object.entries(typeLabels).map(([type, label]) => {
            const count = groupedInsights[type as WorkforceInsight['type']]?.length || 0;
            return (
              <div key={type} className="text-center">
                <div className="flex justify-center mb-1 text-gray-500">
                  {typeIcons[type as WorkforceInsight['type']]}
                </div>
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-xs text-gray-600">{label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      <div className="bg-white/50 border-t border-indigo-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {insights.filter(i => i.impact === 'high').length > 0 && (
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                {insights.filter(i => i.impact === 'high').length} high-impact finding{insights.filter(i => i.impact === 'high').length > 1 ? 's' : ''} requiring attention
              </span>
            )}
            {insights.filter(i => i.impact === 'high').length === 0 && (
              <span className="text-green-600 flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Workforce structure appears healthy
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-indigo-600">
            <span>Explore data in sections above</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkforceInsightsPanel;

