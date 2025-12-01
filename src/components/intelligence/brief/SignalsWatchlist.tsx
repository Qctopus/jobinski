/**
 * Signals & Watchlist Section
 * 
 * Compact list of 6-8 emerging patterns worth monitoring.
 * Each signal has:
 * - Type icon (trend, competitor, risk, geographic, anomaly)
 * - One-line observation with numbers
 * - Brief interpretation
 */

import React from 'react';
import { 
  TrendingUp, 
  Bell, 
  AlertTriangle, 
  Globe, 
  Activity 
} from 'lucide-react';
import { Signal } from '../../../services/analytics/IntelligenceBriefGenerator';

interface SignalsWatchlistProps {
  signals: Signal[];
}

const SignalIcon: React.FC<{ type: Signal['type'] }> = ({ type }) => {
  const iconClass = "h-4 w-4";
  
  switch (type) {
    case 'trend':
      return <TrendingUp className={`${iconClass} text-blue-500`} />;
    case 'competitor':
      return <Bell className={`${iconClass} text-purple-500`} />;
    case 'risk':
      return <AlertTriangle className={`${iconClass} text-amber-500`} />;
    case 'geographic':
      return <Globe className={`${iconClass} text-emerald-500`} />;
    case 'anomaly':
      return <Activity className={`${iconClass} text-red-500`} />;
    default:
      return <Activity className={`${iconClass} text-gray-500`} />;
  }
};

const SignalEmoji: React.FC<{ type: Signal['type'] }> = ({ type }) => {
  switch (type) {
    case 'trend': return <span>📈</span>;
    case 'competitor': return <span>🔔</span>;
    case 'risk': return <span>⚠️</span>;
    case 'geographic': return <span>🌍</span>;
    case 'anomaly': return <span>📊</span>;
    default: return <span>•</span>;
  }
};

const SignalsWatchlist: React.FC<SignalsWatchlistProps> = ({ signals }) => {
  if (!signals || signals.length === 0) {
    return null;
  }

  return (
    <section>
      {/* Section Header */}
      <div className="mb-6 pb-4 border-b-2 border-gray-200">
        <h2 className="text-lg font-bold text-gray-900">
          Signals & Watchlist
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Emerging patterns worth monitoring
        </p>
      </div>

      {/* Signals Table */}
      <div className="overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2 pl-0 pr-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-8">
                
              </th>
              <th className="py-2 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Signal
              </th>
              <th className="py-2 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Interpretation
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {signals.map((signal, index) => (
              <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-3 pl-0 pr-4">
                  <SignalEmoji type={signal.type} />
                </td>
                <td className="py-3 px-4 text-sm text-gray-900">
                  {signal.observation}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {signal.interpretation}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default SignalsWatchlist;

