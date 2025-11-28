/**
 * Mandate Alignment Summary - Visual Dashboard Header
 * 
 * A visual, information-dense summary panel for workforce alignment.
 * Respects time period filter and shows clear metrics with visual indicators.
 * Light theme with proper category colors.
 */

import React from 'react';
import { 
  MapPin, Clock, Users, TrendingUp, TrendingDown, 
  Globe, Building2, Calendar, Target, Home
} from 'lucide-react';
import { ProcessedJobData } from '../../types';
import { getAgencyPeerGroup, getPeerAgencies } from '../../config/peerGroups';
import { parseISO } from 'date-fns';
import { JOB_CLASSIFICATION_DICTIONARY } from '../../dictionary';

interface MandateAlignmentSummaryProps {
  data: ProcessedJobData[];
  agency: string | null;
  isAgencyView: boolean;
  periodStart?: Date;
  periodEnd?: Date;
  periodLabel?: string;
}

// DAC Donor Countries - positions in these countries are NOT "field" positions
const DAC_DONOR_COUNTRIES = [
  'australia', 'austria', 'belgium', 'canada', 'czech republic', 'czechia',
  'denmark', 'estonia', 'finland', 'france', 'germany', 'greece', 'hungary',
  'iceland', 'ireland', 'israel', 'italy', 'japan', 'korea', 'south korea',
  'republic of korea', 'latvia', 'lithuania', 'luxembourg', 'netherlands',
  'new zealand', 'norway', 'poland', 'portugal', 'slovak republic', 'slovakia',
  'slovenia', 'spain', 'sweden', 'switzerland', 'united kingdom', 'uk',
  'united states', 'usa', 'us', 'united states of america'
];

const HQ_LOCATIONS = [
  'new york', 'geneva', 'vienna', 'nairobi', 'rome', 'paris',
  'copenhagen', 'the hague', 'bonn', 'montreal', 'washington',
  'bangkok', 'beirut', 'addis ababa', 'santiago'
];

const HIGH_INCOME_NON_FIELD = [
  'singapore', 'hong kong', 'qatar', 'united arab emirates', 'uae',
  'saudi arabia', 'kuwait', 'bahrain', 'brunei'
];

const isFieldPosition = (dutyStation: string, dutyCountry: string): boolean => {
  const station = (dutyStation || '').toLowerCase().trim();
  const country = (dutyCountry || '').toLowerCase().trim();
  
  if (station.includes('home') || station.includes('remote')) return false;
  if (HQ_LOCATIONS.some(hq => station.includes(hq) || country.includes(hq))) return false;
  if (DAC_DONOR_COUNTRIES.some(dac => country.includes(dac))) return false;
  if (HIGH_INCOME_NON_FIELD.some(hi => country.includes(hi))) return false;
  
  return true;
};

// Helper to get category info from dictionary
const getCategoryInfo = (categoryIdOrName: string) => {
  const cat = JOB_CLASSIFICATION_DICTIONARY.find(
    c => c.id === categoryIdOrName || c.name === categoryIdOrName
  );
  if (cat) return { name: cat.name, color: cat.color, id: cat.id };
  
  const fallbackName = categoryIdOrName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(' And ', ' & ');
  return { name: fallbackName, color: '#6B7280', id: categoryIdOrName };
};

const MandateAlignmentSummary: React.FC<MandateAlignmentSummaryProps> = ({
  data,
  agency,
  isAgencyView,
  periodStart,
  periodEnd,
  periodLabel
}) => {
  const metrics = React.useMemo(() => {
    // Filter by time period if specified
    let timeFilteredData = data;
    if (periodStart && periodEnd) {
      timeFilteredData = data.filter(job => {
        try {
          const postDate = parseISO(job.posting_date);
          return postDate >= periodStart && postDate <= periodEnd;
        } catch { return false; }
      });
    }

    // Filter by agency if in agency view
    const relevantData = isAgencyView && agency
      ? timeFilteredData.filter(job => (job.short_agency || job.long_agency) === agency)
      : timeFilteredData;
    
    // Count by category
    const categoryCounts = new Map<string, number>();
    relevantData.forEach(job => {
      const cat = job.primary_category;
      categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
    });
    
    const sortedCategories = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([categoryId, count]) => {
        const info = getCategoryInfo(categoryId);
        return {
          id: categoryId,
          name: info.name,
          color: info.color,
          count,
          percentage: (count / (relevantData.length || 1)) * 100
        };
      });
    
    // Programme country positions
    const fieldJobs = relevantData.filter(job => 
      isFieldPosition(job.duty_station || '', job.duty_country || '')
    );
    const hqJobs = relevantData.filter(job => {
      const station = (job.duty_station || '').toLowerCase();
      return HQ_LOCATIONS.some(hq => station.includes(hq));
    });
    const homeJobs = relevantData.filter(job => {
      const station = (job.duty_station || '').toLowerCase();
      return station.includes('home') || station.includes('remote');
    });
    
    // Median application window
    const windows = relevantData
      .map(j => j.application_window_days)
      .filter(w => typeof w === 'number' && w > 0)
      .sort((a, b) => a - b);
    const medianWindow = windows.length > 0 ? windows[Math.floor(windows.length / 2)] : 0;
    
    // Peer comparison
    let peerData: { fieldPct: number; name: string } | null = null;
    if (isAgencyView && agency) {
      const peerGroup = getAgencyPeerGroup(agency);
      const peerAgencies = getPeerAgencies(agency);
      
      if (peerGroup && peerAgencies.length > 0) {
        const peerJobs = timeFilteredData.filter(job => 
          peerAgencies.includes(job.short_agency || job.long_agency || '')
        );
        const peerFieldJobs = peerJobs.filter(job => 
          isFieldPosition(job.duty_station || '', job.duty_country || '')
        );
        peerData = {
          fieldPct: (peerFieldJobs.length / (peerJobs.length || 1)) * 100,
          name: peerGroup.name
        };
      }
    }
    
    return {
      totalPositions: relevantData.length,
      categoryCount: categoryCounts.size,
      topCategories: sortedCategories.slice(0, 5),
      fieldPercentage: (fieldJobs.length / (relevantData.length || 1)) * 100,
      hqPercentage: (hqJobs.length / (relevantData.length || 1)) * 100,
      homePercentage: (homeJobs.length / (relevantData.length || 1)) * 100,
      medianApplicationWindow: medianWindow,
      peerData
    };
  }, [data, agency, isAgencyView, periodStart, periodEnd]);

  const fieldDiff = metrics.peerData ? metrics.fieldPercentage - metrics.peerData.fieldPct : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isAgencyView ? (
              <div className="p-2.5 bg-blue-100 rounded-xl">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
            ) : (
              <div className="p-2.5 bg-emerald-100 rounded-xl">
                <Globe className="h-5 w-5 text-emerald-600" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {isAgencyView ? agency : 'UN System'}
              </h2>
              <p className="text-sm text-gray-500">
                {isAgencyView ? 'Agency Workforce Summary' : 'Market Overview'}
              </p>
            </div>
          </div>
          {periodLabel && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">{periodLabel}</span>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="p-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Positions */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">Positions</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {metrics.totalPositions.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              {metrics.categoryCount} categories
            </div>
          </div>

          {/* Programme Countries */}
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-100">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-medium text-emerald-600 uppercase tracking-wide">Field</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {metrics.fieldPercentage.toFixed(0)}%
            </div>
            {metrics.peerData && (
              <div className={`text-xs flex items-center gap-1 ${fieldDiff >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {fieldDiff >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(fieldDiff).toFixed(0)}pp vs peers
              </div>
            )}
          </div>

          {/* HQ + Remote */}
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-100">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-600 uppercase tracking-wide">HQ</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {metrics.hqPercentage.toFixed(0)}%
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Home className="h-3 w-3" />
              {metrics.homePercentage.toFixed(0)}% remote
            </div>
          </div>

          {/* Application Window */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-medium text-amber-600 uppercase tracking-wide">Window</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {metrics.medianApplicationWindow}d
            </div>
            <div className="text-xs text-gray-500">
              median posting
            </div>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">Top Categories</span>
            <span className="text-xs text-gray-400">
              {metrics.topCategories.slice(0, 3).reduce((sum, c) => sum + c.percentage, 0).toFixed(0)}% of total
            </span>
          </div>
          
          {/* Stacked bar with category colors */}
          <div className="h-10 rounded-xl overflow-hidden flex bg-gray-100 shadow-inner">
            {metrics.topCategories.slice(0, 5).map((cat, i) => (
              <div 
                key={cat.id}
                className="h-full flex items-center justify-center transition-all hover:brightness-95 cursor-pointer relative group"
                style={{ 
                  width: `${cat.percentage}%`, 
                  backgroundColor: cat.color,
                  minWidth: cat.percentage > 5 ? '50px' : '24px'
                }}
                title={`${cat.name}: ${cat.count} (${cat.percentage.toFixed(1)}%)`}
              >
                {cat.percentage > 12 && (
                  <span className="text-xs font-semibold text-white drop-shadow-sm">
                    {cat.percentage.toFixed(0)}%
                  </span>
                )}
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                  <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-xl">
                    <div className="font-semibold">{cat.name}</div>
                    <div className="text-gray-300">{cat.count} positions ({cat.percentage.toFixed(1)}%)</div>
                  </div>
                </div>
              </div>
            ))}
            {metrics.topCategories.length > 0 && (
              <div 
                className="h-full flex items-center justify-center bg-gray-300"
                style={{ flexGrow: 1 }}
              >
                <span className="text-xs text-gray-600 font-medium">Other</span>
              </div>
            )}
          </div>
          
          {/* Color Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
            {metrics.topCategories.slice(0, 5).map(cat => (
              <div key={cat.id} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full shadow-sm"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-xs text-gray-600">
                  {cat.name.length > 20 ? cat.name.slice(0, 20) + '...' : cat.name}
                </span>
                <span className="text-xs text-gray-400">({cat.count})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Peer comparison footer */}
        {isAgencyView && metrics.peerData && (
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-500">
                Compared to {metrics.peerData.name}
              </span>
            </div>
            <div className="text-xs text-gray-600">
              Peer field rate: <span className="font-semibold">{metrics.peerData.fieldPct.toFixed(0)}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MandateAlignmentSummary;
