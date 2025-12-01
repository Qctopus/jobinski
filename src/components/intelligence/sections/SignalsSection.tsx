/**
 * SignalsSection - Enhanced anomalies and watchlist with visual hierarchy
 * Features: Variable card sizes by severity, severity heat strip, pulse dots, collapsible low priority
 */

import React, { useState } from 'react';
import { AlertTriangle, TrendingUp, Users, Globe, BarChart3, Bell, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { Signal } from '../../../services/analytics/IntelligenceBriefEngine';

interface SignalsSectionProps {
  signals: Signal[];
}

// Pulse dot indicator for HIGH severity
const PulseDot: React.FC<{ color?: 'red' | 'amber' | 'gray' }> = ({ color = 'red' }) => {
  const colors = {
    red: 'bg-red-500',
    amber: 'bg-amber-500',
    gray: 'bg-gray-400'
  };
  
  return (
    <span className="relative flex h-2.5 w-2.5">
      {color === 'red' && (
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colors[color]} opacity-75`} />
      )}
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${colors[color]}`} />
    </span>
  );
};

// Severity heat strip showing distribution
const SeverityHeatStrip: React.FC<{
  high: number;
  medium: number;
  low: number;
}> = ({ high, medium, low }) => {
  const total = high + medium + low;
  if (total === 0) return null;
  
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        {/* Filled dots for HIGH */}
        {Array.from({ length: high }).map((_, i) => (
          <span key={`high-${i}`} className="w-2.5 h-2.5 rounded-full bg-red-500" />
        ))}
        {/* Filled dots for MEDIUM */}
        {Array.from({ length: medium }).map((_, i) => (
          <span key={`med-${i}`} className="w-2.5 h-2.5 rounded-full bg-amber-500" />
        ))}
        {/* Hollow dots for LOW */}
        {Array.from({ length: low }).map((_, i) => (
          <span key={`low-${i}`} className="w-2.5 h-2.5 rounded-full border border-gray-300" />
        ))}
      </div>
      <div className="text-[10px] text-gray-500">
        {high > 0 && <span className="text-red-600 font-medium">{high} high</span>}
        {high > 0 && medium > 0 && <span> · </span>}
        {medium > 0 && <span className="text-amber-600 font-medium">{medium} medium</span>}
        {(high > 0 || medium > 0) && low > 0 && <span> · </span>}
        {low > 0 && <span className="text-gray-500">{low} low</span>}
      </div>
    </div>
  );
};

// High severity card (larger, more prominent)
const HighSeverityCard: React.FC<{ signal: Signal }> = ({ signal }) => {
  const getTypeIcon = (type: Signal['type']) => {
    switch (type) {
      case 'trend': return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case 'competitor': return <Users className="h-5 w-5 text-purple-500" />;
      case 'risk': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'geographic': return <Globe className="h-5 w-5 text-green-500" />;
      case 'anomaly': return <BarChart3 className="h-5 w-5 text-amber-500" />;
      default: return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="bg-red-50 rounded-lg p-4 border-l-4 border-l-red-500 border border-red-200 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-red-100 rounded-full -translate-y-10 translate-x-10 opacity-50" />
      
      <div className="relative">
        <div className="flex items-start gap-3">
          {/* Icon in colored circle */}
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
            {getTypeIcon(signal.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <PulseDot color="red" />
              <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider">HIGH PRIORITY</span>
            </div>
            <h4 className="text-sm font-semibold text-gray-900 mb-1">{signal.signal}</h4>
            <p className="text-xs text-gray-600 italic">{signal.interpretation}</p>
          </div>
          
          {/* Emoji icon */}
          <span className="text-2xl flex-shrink-0">{signal.icon}</span>
        </div>
      </div>
    </div>
  );
};

// Medium severity card (normal size)
const MediumSeverityCard: React.FC<{ signal: Signal }> = ({ signal }) => {
  const getTypeIcon = (type: Signal['type']) => {
    switch (type) {
      case 'trend': return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'competitor': return <Users className="h-4 w-4 text-purple-500" />;
      case 'risk': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'geographic': return <Globe className="h-4 w-4 text-green-500" />;
      case 'anomaly': return <BarChart3 className="h-4 w-4 text-amber-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="bg-amber-50 rounded-lg p-3 border-l-4 border-l-amber-500 border border-amber-200">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
          {getTypeIcon(signal.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <PulseDot color="amber" />
            <span className="text-[9px] font-semibold text-amber-700 uppercase tracking-wider">MEDIUM</span>
          </div>
          <h4 className="text-sm font-medium text-gray-900 mb-0.5">{signal.signal}</h4>
          <p className="text-xs text-gray-500 italic line-clamp-2">{signal.interpretation}</p>
        </div>
        
        <span className="text-lg flex-shrink-0">{signal.icon}</span>
      </div>
    </div>
  );
};

// Low severity row (compact list item)
const LowSeverityRow: React.FC<{ signal: Signal }> = ({ signal }) => {
  const getTypeIcon = (type: Signal['type']) => {
    switch (type) {
      case 'trend': return <TrendingUp className="h-3.5 w-3.5 text-blue-400" />;
      case 'competitor': return <Users className="h-3.5 w-3.5 text-purple-400" />;
      case 'risk': return <AlertTriangle className="h-3.5 w-3.5 text-red-400" />;
      case 'geographic': return <Globe className="h-3.5 w-3.5 text-green-400" />;
      case 'anomaly': return <BarChart3 className="h-3.5 w-3.5 text-amber-400" />;
      default: return <Bell className="h-3.5 w-3.5 text-gray-400" />;
    }
  };

  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-100 transition-colors">
      <PulseDot color="gray" />
      <div className="flex-shrink-0">{getTypeIcon(signal.type)}</div>
      <span className="flex-1 text-xs text-gray-700 truncate">{signal.signal}</span>
      <span className="text-sm flex-shrink-0">{signal.icon}</span>
    </div>
  );
};

export const SignalsSection: React.FC<SignalsSectionProps> = ({ signals }) => {
  const [showLowPriority, setShowLowPriority] = useState(false);
  
  // Group signals by severity
  const highSignals = signals.filter(s => s.severity === 'high');
  const mediumSignals = signals.filter(s => s.severity === 'medium');
  const lowSignals = signals.filter(s => s.severity === 'low');
  
  if (signals.length === 0) {
    return (
      <section className="border-b border-gray-200">
        <div className="h-0.5 bg-gradient-to-r from-amber-500 to-yellow-500" />
        <div className="px-6 py-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Signals & Watchlist</h2>
              <p className="text-xs text-gray-500">Emerging patterns worth monitoring</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <Zap className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No significant signals detected in this period</p>
            <p className="text-xs text-gray-400 mt-1">The market is operating within normal parameters</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      {/* Section border accent */}
      <div className="h-0.5 bg-gradient-to-r from-amber-500 to-yellow-500" />
      
      <div className="px-6 py-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Signals & Watchlist</h2>
              <p className="text-xs text-gray-500">Emerging patterns worth monitoring</p>
            </div>
          </div>
          
          {/* Severity Heat Strip */}
          <SeverityHeatStrip 
            high={highSignals.length}
            medium={mediumSignals.length}
            low={lowSignals.length}
          />
        </div>

        <p className="text-sm text-gray-600 mb-4">
          The following signals represent statistically unusual patterns or strategically significant shifts detected in the data.
        </p>

        {/* HIGH Priority Signals */}
        {highSignals.length > 0 && (
          <div className="mb-4">
            <h3 className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Requires Attention ({highSignals.length})
            </h3>
            <div className="space-y-3">
              {highSignals.map((signal, i) => (
                <HighSeverityCard key={i} signal={signal} />
              ))}
            </div>
          </div>
        )}

        {/* MEDIUM Priority Signals */}
        {mediumSignals.length > 0 && (
          <div className="mb-4">
            <h3 className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Bell className="h-3 w-3" />
              Monitor ({mediumSignals.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {mediumSignals.map((signal, i) => (
                <MediumSeverityCard key={i} signal={signal} />
              ))}
            </div>
          </div>
        )}

        {/* LOW Priority Signals (collapsible) */}
        {lowSignals.length > 0 && (
          <div>
            <button
              onClick={() => setShowLowPriority(!showLowPriority)}
              className="flex items-center gap-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2 hover:text-gray-700 transition-colors"
            >
              {showLowPriority ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              Low Priority ({lowSignals.length})
              {!showLowPriority && <span className="text-[9px] font-normal normal-case ml-1">Click to expand</span>}
            </button>
            
            {showLowPriority && (
              <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                <div className="divide-y divide-gray-100">
                  {lowSignals.map((signal, i) => (
                    <LowSeverityRow key={i} signal={signal} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-6 mt-5 pt-4 border-t border-gray-200 text-[10px] text-gray-500">
          <div className="flex items-center gap-4">
            <span className="font-semibold uppercase">Severity:</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded border-l-4 border-red-500 bg-red-50" />
              <span>High</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded border-l-4 border-amber-500 bg-amber-50" />
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded border-l-4 border-gray-300 bg-gray-50" />
              <span>Low</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-semibold uppercase">Signal Types:</span>
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
      </div>
    </section>
  );
};
