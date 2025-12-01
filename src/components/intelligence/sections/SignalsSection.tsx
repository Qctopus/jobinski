/**
 * SignalsSection - Filtered watchlist table
 */

import React from 'react';
import { AlertTriangle, TrendingUp, Users, Globe, BarChart3, Bell } from 'lucide-react';
import { Signal } from '../../../services/analytics/IntelligenceBriefEngine';

interface SignalsSectionProps {
  signals: Signal[];
}

export const SignalsSection: React.FC<SignalsSectionProps> = ({ signals }) => {
  if (signals.length === 0) {
    return (
      <section className="px-6 py-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-semibold text-gray-900">Signals & Watchlist</h2>
        </div>
        <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
          No significant signals detected in this period
        </div>
      </section>
    );
  }

  const getTypeIcon = (type: Signal['type']) => {
    switch (type) {
      case 'trend':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'competitor':
        return <Users className="h-4 w-4 text-purple-500" />;
      case 'risk':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'geographic':
        return <Globe className="h-4 w-4 text-green-500" />;
      case 'anomaly':
        return <BarChart3 className="h-4 w-4 text-amber-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityStyle = (severity: Signal['severity']) => {
    switch (severity) {
      case 'high':
        return 'border-l-red-500 bg-red-50/30';
      case 'medium':
        return 'border-l-amber-500 bg-amber-50/30';
      case 'low':
        return 'border-l-gray-300 bg-gray-50/30';
    }
  };

  const getTypeLabel = (type: Signal['type']) => {
    switch (type) {
      case 'trend': return 'Trend';
      case 'competitor': return 'Competitor';
      case 'risk': return 'Risk';
      case 'geographic': return 'Geographic';
      case 'anomaly': return 'Anomaly';
      default: return 'Signal';
    }
  };

  return (
    <section className="px-6 py-5">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        <h2 className="text-lg font-semibold text-gray-900">Signals & Watchlist</h2>
        <span className="text-xs text-gray-500 ml-2">
          Emerging patterns worth monitoring
        </span>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        The following signals represent statistically unusual patterns or strategically significant shifts detected in the data.
        Each is filtered for actionable relevance.
      </p>

      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase w-8"></th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase w-24">Type</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Signal</th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase w-64">Interpretation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {signals.map((signal, i) => (
              <tr key={i} className={`border-l-4 ${getSeverityStyle(signal.severity)}`}>
                <td className="px-4 py-3">
                  <span className="text-lg">{signal.icon}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {getTypeIcon(signal.type)}
                    <span className="text-xs text-gray-600">{getTypeLabel(signal.type)}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-900">{signal.signal}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-600 italic">{signal.interpretation}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-4 text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span className="font-medium">Severity:</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded border-l-4 border-red-500" />
            <span>High</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded border-l-4 border-amber-500" />
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded border-l-4 border-gray-300" />
            <span>Low</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-medium">Signal Types:</span>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-blue-500" />
            <span>Trend</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3 text-purple-500" />
            <span>Competitor</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-red-500" />
            <span>Risk</span>
          </div>
          <div className="flex items-center gap-1">
            <Globe className="h-3 w-3 text-green-500" />
            <span>Geographic</span>
          </div>
        </div>
      </div>
    </section>
  );
};

