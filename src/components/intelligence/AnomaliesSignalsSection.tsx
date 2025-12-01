/**
 * Anomalies & Signals Section
 * 
 * Displays detected anomalies, pattern breaks, and notable signals.
 */

import React from 'react';
import { AlertTriangle, Zap, TrendingUp, TrendingDown, Globe, Clock, Target, Info } from 'lucide-react';
import { AnomalySignal } from '../../services/analytics/IntelligenceInsightsEngine';

interface AnomaliesSignalsSectionProps {
  anomalies: AnomalySignal[];
  isAgencyView: boolean;
  agencyName: string;
}

const getSeverityColor = (severity: AnomalySignal['severity']): { bg: string; border: string; text: string; icon: string } => {
  switch (severity) {
    case 'high':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        icon: 'text-red-500'
      };
    case 'medium':
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-800',
        icon: 'text-amber-500'
      };
    case 'low':
    default:
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-800',
        icon: 'text-blue-500'
      };
  }
};

const getTypeIcon = (type: AnomalySignal['type']): React.ReactNode => {
  switch (type) {
    case 'volume':
      return <TrendingUp className="h-4 w-4" />;
    case 'pattern':
      return <Zap className="h-4 w-4" />;
    case 'competitor':
      return <Target className="h-4 w-4" />;
    case 'cross-dimensional':
      return <Globe className="h-4 w-4" />;
    case 'timing':
      return <Clock className="h-4 w-4" />;
    case 'gap':
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
};

const getTypeLabel = (type: AnomalySignal['type']): string => {
  switch (type) {
    case 'volume':
      return 'Volume';
    case 'pattern':
      return 'Pattern Break';
    case 'competitor':
      return 'Competitor';
    case 'cross-dimensional':
      return 'Unusual Combo';
    case 'timing':
      return 'Timing';
    case 'gap':
      return 'Gap';
    default:
      return 'Signal';
  }
};

const AnomaliesSignalsSection: React.FC<AnomaliesSignalsSectionProps> = ({
  anomalies,
  isAgencyView,
  agencyName
}) => {
  // Group anomalies by severity
  const highSeverity = anomalies.filter(a => a.severity === 'high');
  const mediumSeverity = anomalies.filter(a => a.severity === 'medium');
  const lowSeverity = anomalies.filter(a => a.severity === 'low');

  if (anomalies.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Section Header */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-gray-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Anomalies & Signals</h3>
              <p className="text-xs text-gray-500">Unusual patterns and noteworthy observations</p>
            </div>
          </div>
        </div>

        <div className="p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
            <Zap className="h-6 w-6 text-emerald-600" />
          </div>
          <h4 className="text-sm font-semibold text-gray-800 mb-1">All Clear</h4>
          <p className="text-xs text-gray-500">No significant anomalies detected in this period.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Section Header */}
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-red-50 to-amber-50 to-white">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Anomalies & Signals</h3>
            <p className="text-xs text-gray-500">Unusual patterns and noteworthy observations</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {highSeverity.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-semibold">
              {highSeverity.length} High
            </span>
          )}
          {mediumSeverity.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold">
              {mediumSeverity.length} Medium
            </span>
          )}
          {lowSeverity.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold">
              {lowSeverity.length} Low
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* High Severity */}
        {highSeverity.length > 0 && (
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              High Priority
            </h4>
            <div className="space-y-2">
              {highSeverity.map((anomaly, index) => {
                const colors = getSeverityColor(anomaly.severity);
                return (
                  <div 
                    key={anomaly.id}
                    className={`rounded-lg ${colors.bg} border ${colors.border} p-4`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 mt-0.5 ${colors.icon}`}>
                        {anomaly.icon || getTypeIcon(anomaly.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h5 className={`text-sm font-semibold ${colors.text}`}>
                            {anomaly.title}
                          </h5>
                          <span className="px-2 py-0.5 rounded-full bg-white/50 text-[10px] font-medium text-gray-600">
                            {getTypeLabel(anomaly.type)}
                          </span>
                        </div>
                        <p className={`text-xs ${colors.text} opacity-90 mb-2`}>
                          {anomaly.description}
                        </p>
                        <div className="flex items-center gap-4 text-[10px]">
                          {anomaly.metric && (
                            <span className={`font-semibold ${colors.text}`}>
                              {anomaly.metric}
                            </span>
                          )}
                          {anomaly.context && (
                            <span className="text-gray-500">
                              {anomaly.context}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Medium Severity */}
        {mediumSeverity.length > 0 && (
          <div className="mb-5">
            <h4 className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Notable
            </h4>
            <div className="space-y-2">
              {mediumSeverity.map((anomaly, index) => {
                const colors = getSeverityColor(anomaly.severity);
                return (
                  <div 
                    key={anomaly.id}
                    className={`rounded-lg ${colors.bg} border ${colors.border} p-3`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 mt-0.5 ${colors.icon}`}>
                        {anomaly.icon || getTypeIcon(anomaly.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h5 className={`text-xs font-semibold ${colors.text}`}>
                            {anomaly.title}
                          </h5>
                          <span className="px-2 py-0.5 rounded-full bg-white/50 text-[9px] font-medium text-gray-600">
                            {getTypeLabel(anomaly.type)}
                          </span>
                        </div>
                        <p className={`text-xs ${colors.text} opacity-90`}>
                          {anomaly.description}
                          {anomaly.metric && (
                            <span className="font-medium ml-1">({anomaly.metric})</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Low Severity */}
        {lowSeverity.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Informational
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {lowSeverity.map((anomaly, index) => {
                const colors = getSeverityColor(anomaly.severity);
                return (
                  <div 
                    key={anomaly.id}
                    className={`rounded-lg ${colors.bg} border ${colors.border} p-3`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`flex-shrink-0 ${colors.icon}`}>
                        {anomaly.icon || getTypeIcon(anomaly.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className={`text-xs font-semibold ${colors.text} mb-0.5`}>
                          {anomaly.title}
                        </h5>
                        <p className={`text-[11px] ${colors.text} opacity-90 line-clamp-2`}>
                          {anomaly.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-5 pt-4 border-t border-gray-100 text-center">
          <p className="text-[10px] text-gray-400">
            Anomalies are detected using statistical analysis comparing current period to historical patterns.
            High priority items deviate significantly from expected values.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnomaliesSignalsSection;

