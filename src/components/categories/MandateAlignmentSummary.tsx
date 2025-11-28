/**
 * Mandate Alignment Summary - Visual Dashboard Header
 * 
 * A visual, information-dense summary panel for workforce alignment.
 * Respects time period filter and shows clear metrics with visual indicators.
 */

import React from 'react';
import { 
  MapPin, Clock, Users, TrendingUp, TrendingDown, 
  Globe, Building2, Calendar, Target
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

// Primary UN Headquarters locations
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

// Get category color
const getCategoryColor = (categoryName: string) => {
  return JOB_CLASSIFICATION_DICTIONARY.find(c => c.name === categoryName)?.color || '#6B7280';
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
      .map(([name, count]) => ({
        name,
        count,
        percentage: (count / (relevantData.length || 1)) * 100,
        color: getCategoryColor(name)
      }));
    
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
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 rounded-2xl p-6 text-white shadow-xl">
      {/* Header with period indicator */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {isAgencyView ? (
            <div className="p-2.5 bg-white/10 backdrop-blur rounded-xl">
              <Building2 className="h-6 w-6 text-blue-300" />
            </div>
          ) : (
            <div className="p-2.5 bg-white/10 backdrop-blur rounded-xl">
              <Globe className="h-6 w-6 text-emerald-300" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold">
              {isAgencyView ? agency : 'UN System'}
            </h2>
            <p className="text-sm text-slate-300">
              {isAgencyView ? 'Agency Workforce Summary' : 'Market Overview'}
            </p>
          </div>
        </div>
        {periodLabel && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur rounded-lg">
            <Calendar className="h-4 w-4 text-slate-300" />
            <span className="text-sm text-slate-200">{periodLabel}</span>
          </div>
        )}
      </div>

      {/* Main metrics grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Positions */}
        <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-blue-400" />
            <span className="text-xs text-slate-400 uppercase tracking-wide">Positions</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {metrics.totalPositions.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            across {metrics.categoryCount} categories
          </div>
        </div>

        {/* Programme Countries */}
        <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-emerald-400" />
            <span className="text-xs text-slate-400 uppercase tracking-wide">Field</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {metrics.fieldPercentage.toFixed(0)}%
          </div>
          {metrics.peerData && (
            <div className={`text-xs mt-1 flex items-center gap-1 ${fieldDiff >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {fieldDiff >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(fieldDiff).toFixed(0)}pp vs peers
            </div>
          )}
        </div>

        {/* HQ Positions */}
        <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-4 w-4 text-purple-400" />
            <span className="text-xs text-slate-400 uppercase tracking-wide">HQ</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {metrics.hqPercentage.toFixed(0)}%
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {metrics.homePercentage.toFixed(0)}% remote
          </div>
        </div>

        {/* Application Window */}
        <div className="bg-white/5 backdrop-blur rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-slate-400 uppercase tracking-wide">Window</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {metrics.medianApplicationWindow}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            days median
          </div>
        </div>
      </div>

      {/* Category distribution bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-400 uppercase tracking-wide">Top Categories</span>
          <span className="text-xs text-slate-500">
            {metrics.topCategories.slice(0, 3).reduce((sum, c) => sum + c.percentage, 0).toFixed(0)}% of hiring
          </span>
        </div>
        
        {/* Stacked bar visualization */}
        <div className="h-8 rounded-lg overflow-hidden flex bg-white/5">
          {metrics.topCategories.slice(0, 5).map((cat, i) => (
            <div 
              key={cat.name}
              className="h-full flex items-center justify-center transition-all hover:brightness-110 cursor-pointer group relative"
              style={{ 
                width: `${cat.percentage}%`, 
                backgroundColor: cat.color,
                minWidth: cat.percentage > 5 ? '40px' : '20px'
              }}
              title={`${cat.name}: ${cat.count} (${cat.percentage.toFixed(1)}%)`}
            >
              {cat.percentage > 10 && (
                <span className="text-[10px] font-medium text-white/90 truncate px-1">
                  {cat.percentage.toFixed(0)}%
                </span>
              )}
            </div>
          ))}
          {metrics.topCategories.length > 0 && (
            <div 
              className="h-full flex items-center justify-center bg-slate-600/50"
              style={{ flexGrow: 1 }}
            >
              <span className="text-[10px] text-slate-400">Other</span>
            </div>
          )}
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-3">
          {metrics.topCategories.slice(0, 5).map(cat => (
            <div key={cat.name} className="flex items-center gap-1.5">
              <div 
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-xs text-slate-300 truncate max-w-[120px]">
                {cat.name.length > 18 ? cat.name.slice(0, 18) + '...' : cat.name}
              </span>
              <span className="text-xs text-slate-500">({cat.count})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Peer comparison footer */}
      {isAgencyView && metrics.peerData && (
        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-slate-400" />
            <span className="text-xs text-slate-400">
              Compared to {metrics.peerData.name}
            </span>
          </div>
          <div className="text-xs text-slate-300">
            Peer field rate: <span className="font-medium">{metrics.peerData.fieldPct.toFixed(0)}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MandateAlignmentSummary;
