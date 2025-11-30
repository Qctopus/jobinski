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
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Compact Metrics Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Total Positions */}
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-medium text-gray-500">Positions</span>
            </div>
            <div className="text-xl font-bold text-gray-900">
              {metrics.totalPositions.toLocaleString()}
            </div>
            <div className="text-[10px] text-gray-400">
              {metrics.categoryCount} categories
            </div>
          </div>

          {/* Programme Countries */}
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-4 w-4 text-green-500" />
              <span className="text-xs font-medium text-gray-500">Field</span>
            </div>
            <div className="text-xl font-bold text-gray-900">
              {metrics.fieldPercentage.toFixed(0)}%
            </div>
            {metrics.peerData && (
              <div className={`text-[10px] flex items-center gap-1 ${fieldDiff >= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                {fieldDiff >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(fieldDiff).toFixed(0)}pp vs peers
              </div>
            )}
          </div>

          {/* HQ + Remote */}
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-purple-500" />
              <span className="text-xs font-medium text-gray-500">HQ</span>
            </div>
            <div className="text-xl font-bold text-gray-900">
              {metrics.hqPercentage.toFixed(0)}%
            </div>
            <div className="text-[10px] text-gray-400 flex items-center gap-1">
              <Home className="h-3 w-3" />
              {metrics.homePercentage.toFixed(0)}% remote
            </div>
          </div>

          {/* Application Window */}
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-xs font-medium text-gray-500">Window</span>
            </div>
            <div className="text-xl font-bold text-gray-900">
              {metrics.medianApplicationWindow}d
            </div>
            <div className="text-[10px] text-gray-400">
              median posting
            </div>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-600">Top Categories</span>
            <span className="text-[10px] text-gray-400">
              {metrics.topCategories.slice(0, 3).reduce((sum, c) => sum + c.percentage, 0).toFixed(0)}% of total
            </span>
          </div>
          
          {/* Stacked bar with category colors */}
          <div className="h-6 rounded-lg overflow-hidden flex bg-gray-100">
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
