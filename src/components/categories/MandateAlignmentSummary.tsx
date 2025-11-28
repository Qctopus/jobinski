/**
 * Mandate Alignment Summary
 * 
 * Top panel showing executive briefing on workforce-mandate alignment.
 * Provides quick context for HR leadership.
 */

import React from 'react';
import { Briefcase, MapPin, Clock, Users, TrendingUp, TrendingDown } from 'lucide-react';
import { ProcessedJobData } from '../../types';
import { getAgencyPeerGroup, getPeerAgencies } from '../../config/peerGroups';

interface MandateAlignmentSummaryProps {
  data: ProcessedJobData[];
  agency: string | null;
  isAgencyView: boolean;
}

interface SummaryMetrics {
  totalPositions: number;
  categoryCount: number;
  topCategories: Array<{ name: string; count: number; percentage: number }>;
  fieldPercentage: number;
  medianApplicationWindow: number;
  peerGroupName?: string;
  peerFieldPercentage?: number;
  alignment?: 'above' | 'below' | 'in_line';
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
  // Primary UN HQs
  'new york', 'geneva', 'vienna', 'nairobi', 'rome', 'paris',
  // Secondary HQs
  'copenhagen', 'the hague', 'bonn', 'montreal', 'washington',
  // Regional commission seats
  'bangkok', 'beirut', 'addis ababa', 'santiago'
];

// High-income non-DAC countries that are also not "field"
const HIGH_INCOME_NON_FIELD = [
  'singapore', 'hong kong', 'qatar', 'united arab emirates', 'uae',
  'saudi arabia', 'kuwait', 'bahrain', 'brunei'
];

/**
 * Determine if a position is a "programme country" (field) position
 * Field = NOT HQ, NOT donor country, NOT home-based
 */
const isFieldPosition = (dutyStation: string, dutyCountry: string): boolean => {
  const station = (dutyStation || '').toLowerCase().trim();
  const country = (dutyCountry || '').toLowerCase().trim();
  
  // Home-based is NOT field (could be anywhere)
  if (station.includes('home') || station.includes('remote')) {
    return false;
  }
  
  // HQ locations are NOT field
  if (HQ_LOCATIONS.some(hq => station.includes(hq) || country.includes(hq))) {
    return false;
  }
  
  // DAC donor countries are NOT field
  if (DAC_DONOR_COUNTRIES.some(dac => country.includes(dac))) {
    return false;
  }
  
  // High-income non-DAC are NOT field
  if (HIGH_INCOME_NON_FIELD.some(hi => country.includes(hi))) {
    return false;
  }
  
  // Everything else is considered a programme country / field position
  return true;
};

const MandateAlignmentSummary: React.FC<MandateAlignmentSummaryProps> = ({
  data,
  agency,
  isAgencyView
}) => {
  const metrics = React.useMemo((): SummaryMetrics => {
    const relevantData = isAgencyView && agency
      ? data.filter(job => (job.short_agency || job.long_agency) === agency)
      : data;
    
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
        percentage: (count / (relevantData.length || 1)) * 100
      }));
    
    // Programme country positions (using proper field detection)
    const fieldJobs = relevantData.filter(job => 
      isFieldPosition(job.duty_station || '', job.duty_country || '')
    );
    const fieldPercentage = (fieldJobs.length / (relevantData.length || 1)) * 100;
    
    // Median application window
    const windows = relevantData
      .map(j => j.application_window_days)
      .filter(w => typeof w === 'number' && w > 0)
      .sort((a, b) => a - b);
    const medianWindow = windows.length > 0
      ? windows[Math.floor(windows.length / 2)]
      : 0;
    
    const result: SummaryMetrics = {
      totalPositions: relevantData.length,
      categoryCount: categoryCounts.size,
      topCategories: sortedCategories.slice(0, 3),
      fieldPercentage,
      medianApplicationWindow: medianWindow
    };
    
    // Agency-specific peer comparison
    if (isAgencyView && agency) {
      const peerGroup = getAgencyPeerGroup(agency);
      const peerAgencies = getPeerAgencies(agency);
      
      if (peerGroup && peerAgencies.length > 0) {
        const peerData = data.filter(job => 
          peerAgencies.includes(job.short_agency || job.long_agency || '')
        );
        
        const peerFieldJobs = peerData.filter(job => 
          isFieldPosition(job.duty_station || '', job.duty_country || '')
        );
        const peerFieldPct = (peerFieldJobs.length / (peerData.length || 1)) * 100;
        
        result.peerGroupName = peerGroup.name;
        result.peerFieldPercentage = peerFieldPct;
        
        const diff = fieldPercentage - peerFieldPct;
        result.alignment = Math.abs(diff) < 5 ? 'in_line' : diff > 0 ? 'above' : 'below';
      }
    }
    
    return result;
  }, [data, agency, isAgencyView]);

  // Generate narrative text
  const narrative = React.useMemo(() => {
    if (isAgencyView && agency) {
      const topCatNames = metrics.topCategories.slice(0, 2).map(c => c.name).join(' and ');
      const topCatPct = metrics.topCategories.slice(0, 2).reduce((sum, c) => sum + c.percentage, 0);
      
      let alignmentText = '';
      if (metrics.peerFieldPercentage !== undefined) {
        if (metrics.alignment === 'in_line') {
          alignmentText = `in line with your peer group average of ${metrics.peerFieldPercentage.toFixed(0)}%`;
        } else if (metrics.alignment === 'above') {
          alignmentText = `above your peer group average of ${metrics.peerFieldPercentage.toFixed(0)}%`;
        } else {
          alignmentText = `below your peer group average of ${metrics.peerFieldPercentage.toFixed(0)}%`;
        }
      }
      
      return (
        <>
          <span className="font-semibold text-gray-900">{agency}</span> has{' '}
          <span className="font-semibold text-blue-600">{metrics.totalPositions.toLocaleString()}</span>{' '}
          open positions across{' '}
          <span className="font-semibold">{metrics.categoryCount}</span> categories. 
          Your hiring is concentrated in{' '}
          <span className="font-semibold">{topCatNames}</span>{' '}
          ({topCatPct.toFixed(0)}%).
          Programme country positions represent{' '}
          <span className="font-semibold">{metrics.fieldPercentage.toFixed(0)}%</span> of your openings
          {alignmentText && <>, {alignmentText}</>}.
        </>
      );
    } else {
      const topCatNames = metrics.topCategories.slice(0, 3).map(c => c.name).join(', ');
      const topCatPct = metrics.topCategories.slice(0, 3).reduce((sum, c) => sum + c.percentage, 0);
      
      return (
        <>
          The UN system currently has{' '}
          <span className="font-semibold text-blue-600">{metrics.totalPositions.toLocaleString()}</span>{' '}
          open positions across{' '}
          <span className="font-semibold">{metrics.categoryCount}</span> categories.{' '}
          <span className="font-semibold">{topCatNames}</span> represent{' '}
          <span className="font-semibold">{topCatPct.toFixed(0)}%</span> of all hiring. 
          Programme country positions account for{' '}
          <span className="font-semibold">{metrics.fieldPercentage.toFixed(0)}%</span> of openings. 
          System-wide median application window:{' '}
          <span className="font-semibold">{metrics.medianApplicationWindow}</span> days.
        </>
      );
    }
  }, [metrics, agency, isAgencyView]);

  return (
    <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200 p-5">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 p-3 bg-white rounded-lg shadow-sm">
          <Briefcase className="h-6 w-6 text-slate-600" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
            {isAgencyView ? 'Workforce Alignment Summary' : 'UN System Overview'}
          </h2>
          
          <p className="text-base text-gray-700 leading-relaxed">
            {narrative}
          </p>
          
          {/* Quick stats row */}
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-slate-400" />
              <span className="text-gray-600">
                <span className="font-semibold text-gray-900">{metrics.totalPositions.toLocaleString()}</span> positions
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm group relative">
              <MapPin className="h-4 w-4 text-slate-400" />
              <span className="text-gray-600">
                <span className="font-semibold text-gray-900">{metrics.fieldPercentage.toFixed(0)}%</span> programme countries
              </span>
              {/* Tooltip explaining the metric */}
              <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10">
                <div className="bg-gray-800 text-white text-xs rounded-lg py-2 px-3 w-64 shadow-lg">
                  <p className="font-medium mb-1">Programme Country Positions</p>
                  <p className="text-gray-300">Excludes: HQ locations (NY, Geneva, Vienna, Rome, etc.), DAC donor countries, and home-based positions.</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-slate-400" />
              <span className="text-gray-600">
                <span className="font-semibold text-gray-900">{metrics.medianApplicationWindow}</span>d median window
              </span>
            </div>
            
            {isAgencyView && metrics.peerGroupName && (
              <div className="flex items-center gap-2 text-sm bg-white px-2 py-1 rounded-md">
                {metrics.alignment === 'above' ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : metrics.alignment === 'below' ? (
                  <TrendingDown className="h-4 w-4 text-amber-500" />
                ) : (
                  <span className="h-4 w-4 text-center text-gray-400">≈</span>
                )}
                <span className="text-gray-500 text-xs">
                  vs {metrics.peerGroupName}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MandateAlignmentSummary;

