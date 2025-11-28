/**
 * Hiring Surge Alerts
 * 
 * Displays hiring surges that may signal funding availability or programme launches.
 * Provides funding intelligence for HR leadership.
 */

import React from 'react';
import { Zap, MapPin, AlertCircle, TrendingUp, Building2 } from 'lucide-react';
import { HiringSurge, CategorySurge } from '../../services/analytics/SurgeDetector';

interface HiringSurgeAlertsProps {
  surges: HiringSurge[];
  categorySurges: CategorySurge[];
  timeframe: { currentMonth: string; comparisonPeriod: string };
  isAgencyView: boolean;
  yourAgency?: string;
}

const HiringSurgeAlerts: React.FC<HiringSurgeAlertsProps> = ({
  surges,
  categorySurges,
  timeframe,
  isAgencyView,
  yourAgency
}) => {
  // Split surges for agency view
  const relevantSurges = React.useMemo(() => {
    if (!isAgencyView || !yourAgency) {
      return { others: surges.slice(0, 6), yours: [] };
    }
    
    const yours = surges.filter(s => s.agency === yourAgency).slice(0, 3);
    const others = surges.filter(s => s.agency !== yourAgency).slice(0, 6);
    
    return { yours, others };
  }, [surges, isAgencyView, yourAgency]);

  if (surges.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-gray-900">Hiring Surges Detected</h3>
        </div>
        <div className="text-[10px] text-gray-400">
          {timeframe.currentMonth} vs {timeframe.comparisonPeriod}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Explanation */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700">
            Surges may indicate new programme funding, donor investments, or strategic shifts. 
            These signals can inform your planning and recruitment strategy.
          </p>
        </div>

        {/* Agency view: Show others' surges that affect you */}
        {isAgencyView && relevantSurges.others.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              Other Agencies — May Affect Your Talent Pool
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {relevantSurges.others.map((surge, idx) => (
                <SurgeCard key={`${surge.agency}-${surge.category}-${idx}`} surge={surge} />
              ))}
            </div>
          </div>
        )}

        {/* Agency view: Show your surges */}
        {isAgencyView && relevantSurges.yours.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Your Recent Surges
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {relevantSurges.yours.map((surge, idx) => (
                <SurgeCard key={`yours-${surge.category}-${idx}`} surge={surge} isYours />
              ))}
            </div>
          </div>
        )}

        {/* Market view: Show all significant surges */}
        {!isAgencyView && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {surges.slice(0, 8).map((surge, idx) => (
              <SurgeCard key={`${surge.agency}-${surge.category}-${idx}`} surge={surge} />
            ))}
          </div>
        )}

        {/* Category-level summary */}
        {categorySurges.length > 0 && (
          <div className="pt-3 border-t border-gray-100">
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
              Categories With System-Wide Activity
            </h4>
            <div className="flex flex-wrap gap-2">
              {categorySurges.slice(0, 5).map(catSurge => (
                <div 
                  key={catSurge.category}
                  className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-gray-700 font-medium">
                    {catSurge.category.length > 20 ? catSurge.category.slice(0, 20) + '...' : catSurge.category}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {catSurge.agencies.length} agencies
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Individual surge card component
const SurgeCard: React.FC<{ surge: HiringSurge; isYours?: boolean }> = ({ surge, isYours }) => {
  const getSurgeIntensity = (multiplier: number) => {
    if (multiplier >= 5) return { color: 'text-red-600', bg: 'bg-red-100', label: 'Major' };
    if (multiplier >= 3) return { color: 'text-amber-600', bg: 'bg-amber-100', label: 'Strong' };
    return { color: 'text-blue-600', bg: 'bg-blue-100', label: 'Notable' };
  };

  const intensity = getSurgeIntensity(surge.surgeMultiplier);

  return (
    <div className={`rounded-lg border p-3 ${isYours ? 'border-blue-200 bg-blue-50/50' : 'border-gray-200 bg-gray-50'}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-gray-900">{surge.agency}</div>
          <div className="text-[11px] text-gray-600 truncate">
            {surge.category.length > 25 ? surge.category.slice(0, 25) + '...' : surge.category}
          </div>
        </div>
        <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${intensity.bg}`}>
          <TrendingUp className={`h-3 w-3 ${intensity.color}`} />
          <span className={`text-[10px] font-bold ${intensity.color}`}>
            {surge.surgeMultiplier.toFixed(1)}x
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 text-[10px] text-gray-500">
        <span>{surge.currentMonthCount} jobs this month</span>
        <span>vs {surge.previousMonthAverage.toFixed(0)} avg</span>
      </div>

      {surge.topLocations.length > 0 && surge.topLocations[0].percentage > 40 && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-500">
          <MapPin className="h-3 w-3" />
          <span>Concentrated in {surge.topLocations[0].location}</span>
          <span className="text-gray-400">({surge.topLocations[0].percentage.toFixed(0)}%)</span>
        </div>
      )}

      <div className="mt-2 text-[10px] text-gray-600 italic">
        {surge.potentialSignal}
      </div>
    </div>
  );
};

export default HiringSurgeAlerts;

