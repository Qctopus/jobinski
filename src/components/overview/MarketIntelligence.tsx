import React, { useMemo, useState } from 'react';
import { 
  TrendingUp, TrendingDown, Activity, AlertTriangle, 
  Users, Building2, Globe, Target, Eye, Award,
  ArrowUpRight, ArrowDownRight, Minus, ChevronDown, Zap, BarChart3
} from 'lucide-react';
import { ProcessedJobData, FilterOptions, DashboardMetrics } from '../../types';
import { parseISO, subWeeks, subMonths, format, eachWeekOfInterval, eachMonthOfInterval, endOfWeek, endOfMonth } from 'date-fns';
import { JOB_CLASSIFICATION_DICTIONARY } from '../../dictionary';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { getAgencyLogo } from '../../utils/agencyLogos';
import { useTimeframe } from '../../contexts/TimeframeContext';

// Helper to get beautiful category name and color from dictionary
const getCategoryInfo = (categoryIdOrName: string) => {
  const cat = JOB_CLASSIFICATION_DICTIONARY.find(
    c => c.id === categoryIdOrName || c.name === categoryIdOrName
  );
  if (cat) {
    return { name: cat.name, color: cat.color, id: cat.id };
  }
  // Fallback: convert slug to title case
  const fallbackName = categoryIdOrName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(' And ', ' & ');
  return { name: fallbackName, color: '#6B7280', id: categoryIdOrName };
};

interface MarketIntelligenceProps {
  data: ProcessedJobData[];
  filteredData: ProcessedJobData[];
  filters: FilterOptions;
  metrics: DashboardMetrics;
  marketMetrics: DashboardMetrics;
  isAgencyView: boolean;
  selectedAgencyName: string;
}

// ComparisonPeriod type removed - now using global timeframe context

interface PeriodData {
  current: ProcessedJobData[];
  previous: ProcessedJobData[];
  currentLabel: string;
  previousLabel: string;
  currentStart: Date;
  currentEnd: Date;
  previousStart: Date;
  previousEnd: Date;
}

// Trend indicator component
const TrendIndicator: React.FC<{ 
  value: number; 
  suffix?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}> = ({ value, suffix = '%', showIcon = true, size = 'sm' }) => {
  const isPositive = value > 0;
  const isNeutral = Math.abs(value) < 2;
  
  const colorClass = isNeutral 
    ? 'text-gray-500' 
    : isPositive 
      ? 'text-green-600' 
      : 'text-red-500';
  
  const Icon = isNeutral ? Minus : isPositive ? ArrowUpRight : ArrowDownRight;
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  
  return (
    <span className={`inline-flex items-center gap-0.5 font-semibold ${colorClass} ${textSize}`}>
      {showIcon && <Icon className={iconSize} />}
      {isPositive && !isNeutral ? '+' : ''}{value.toFixed(0)}{suffix}
    </span>
  );
};

// Mini sparkline for inline trend visualization
const MiniSparkline: React.FC<{
  data: { period: string; value: number }[];
  color?: 'blue' | 'green' | 'amber' | 'auto';
  width?: number;
  height?: number;
}> = ({ data, color = 'auto', width = 64, height = 28 }) => {
  if (data.length === 0) return null;
  
  const values = data.map(d => d.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  
  const trend = values[values.length - 1] >= values[0];
  const strokeColor = color === 'auto' 
    ? (trend ? '#22c55e' : '#f59e0b') 
    : color === 'blue' ? '#3b82f6' 
    : color === 'green' ? '#22c55e' 
    : '#f59e0b';
  
  const points = values.map((v, i) => {
    const x = (i / Math.max(values.length - 1, 1)) * (width - 4) + 2;
    const y = height - 4 - ((v - min) / range) * (height - 8);
    return { x, y };
  });
  
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  
  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={strokeColor} />
      ))}
    </svg>
  );
};

// Comparison bar for visual comparison
const ComparisonBar: React.FC<{
  label: string;
  yourValue: number;
  marketValue: number;
  format?: 'percent' | 'number';
}> = ({ label, yourValue, marketValue, format = 'percent' }) => {
  const maxValue = Math.max(yourValue, marketValue, 1);
  const yourWidth = (yourValue / maxValue) * 100;
  const marketWidth = (marketValue / maxValue) * 100;
  const diff = yourValue - marketValue;
  
  const formatValue = (v: number) => format === 'percent' ? `${v.toFixed(0)}%` : v.toFixed(0);
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600">{label}</span>
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${Math.abs(diff) > 5 ? (diff > 0 ? 'text-green-600' : 'text-red-500') : 'text-gray-700'}`}>
            {formatValue(yourValue)}
          </span>
          <span className="text-gray-400">vs</span>
          <span className="text-gray-500">{formatValue(marketValue)}</span>
          {Math.abs(diff) > 2 && (
            <span className={`text-[10px] ${diff > 0 ? 'text-green-600' : 'text-red-500'}`}>
              ({diff > 0 ? '+' : ''}{diff.toFixed(0)}pp)
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-1 h-2">
        <div className="flex-1 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${yourWidth}%` }}
          />
        </div>
        <div className="flex-1 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gray-400 rounded-full transition-all duration-300"
            style={{ width: `${marketWidth}%` }}
          />
        </div>
      </div>
      <div className="flex justify-between text-[9px] text-gray-400">
        <span>You</span>
        <span>Market</span>
      </div>
    </div>
  );
};

// Metric card with comparison
const MetricCard: React.FC<{
  label: string;
  currentValue: number;
  previousValue: number;
  format?: 'number' | 'percent' | 'days';
  subtitle?: string;
  highlight?: 'positive' | 'negative' | 'neutral';
}> = ({ label, currentValue, previousValue, format = 'number', subtitle, highlight }) => {
  const change = previousValue > 0 
    ? ((currentValue - previousValue) / previousValue) * 100 
    : 0;
  
  const displayValue = format === 'percent' 
    ? `${currentValue.toFixed(0)}%`
    : format === 'days'
      ? `${currentValue.toFixed(0)}d`
      : currentValue.toLocaleString();
  
  const bgClass = highlight === 'positive' 
    ? 'bg-green-50 border-green-200' 
    : highlight === 'negative'
      ? 'bg-red-50 border-red-200'
      : 'bg-gray-50 border-gray-200';
  
  return (
    <div className={`rounded-lg p-3 border ${bgClass}`}>
      <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xl font-bold text-gray-900">{displayValue}</div>
          {subtitle && <div className="text-[10px] text-gray-500">{subtitle}</div>}
        </div>
        <div className="text-right">
          <TrendIndicator value={change} />
          <div className="text-[9px] text-gray-400">
            was {format === 'percent' 
              ? `${previousValue.toFixed(0)}%`
              : format === 'days'
                ? `${previousValue.toFixed(0)}d`
                : previousValue.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

const MarketIntelligence: React.FC<MarketIntelligenceProps> = ({
  data,
  filteredData,
  filters,
  metrics,
  marketMetrics,
  isAgencyView,
  selectedAgencyName
}) => {
  // Use global timeframe context instead of local state
  const { primaryPeriod, comparisonPeriod: contextComparisonPeriod, filterToPeriod } = useTimeframe();
  
  // Calculate period data using global timeframe
  const periodData = useMemo((): PeriodData => {
    const currentStart = primaryPeriod.start;
    const currentEnd = primaryPeriod.end;
    const previousStart = contextComparisonPeriod?.start || currentStart;
    const previousEnd = contextComparisonPeriod?.end || currentStart;
    
    const filterByPeriod = (jobs: ProcessedJobData[], start: Date, end: Date) => {
      return jobs.filter(job => {
        try {
          const postingDate = parseISO(job.posting_date);
          return postingDate >= start && postingDate <= end;
        } catch { return false; }
      });
    };
    
    return {
      current: filterByPeriod(data, currentStart, currentEnd),
      previous: contextComparisonPeriod ? filterByPeriod(data, previousStart, previousEnd) : [],
      currentLabel: format(currentStart, 'MMM d') + ' - ' + format(currentEnd, 'MMM d'),
      previousLabel: contextComparisonPeriod 
        ? format(previousStart, 'MMM d') + ' - ' + format(previousEnd, 'MMM d')
        : 'No comparison',
      currentStart,
      currentEnd,
      previousStart,
      previousEnd
    };
  }, [primaryPeriod, contextComparisonPeriod, data]);
  
  // Agency-specific period data
  const agencyPeriodData = useMemo(() => {
    if (!isAgencyView) return null;
    
    const currentStart = primaryPeriod.start;
    const currentEnd = primaryPeriod.end;
    const previousStart = contextComparisonPeriod?.start || currentStart;
    const previousEnd = contextComparisonPeriod?.end || currentStart;
    
    const filterByPeriod = (jobs: ProcessedJobData[], start: Date, end: Date) => {
      return jobs.filter(job => {
        try {
          const postingDate = parseISO(job.posting_date);
          return postingDate >= start && postingDate <= end;
        } catch { return false; }
      });
    };
    
    return {
      current: filterByPeriod(filteredData, currentStart, currentEnd),
      previous: contextComparisonPeriod ? filterByPeriod(filteredData, previousStart, previousEnd) : []
    };
  }, [primaryPeriod, contextComparisonPeriod, filteredData, isAgencyView]);
  
  // Determine if using weekly or monthly granularity for charts
  const useWeeklyGranularity = useMemo(() => {
    // Use weekly for periods <= 3 months
    const daysDiff = Math.ceil((primaryPeriod.end.getTime() - primaryPeriod.start.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 100; // ~3 months
  }, [primaryPeriod]);

  // ============================================================================
  // AGENCY-SPECIFIC CALCULATIONS
  // ============================================================================
  
  // Agency performance metrics
  const agencyPerformance = useMemo(() => {
    if (!isAgencyView || !agencyPeriodData) return null;
    
    const { current: agencyCurrent, previous: agencyPrevious } = agencyPeriodData;
    const { current: marketCurrent, previous: marketPrevious } = periodData;
    
    // Hiring volume
    const currentVolume = agencyCurrent.length;
    const previousVolume = agencyPrevious.length;
    const volumeChange = previousVolume > 0 ? ((currentVolume - previousVolume) / previousVolume) * 100 : 0;
    
    // Market share
    const currentShare = marketCurrent.length > 0 ? (currentVolume / marketCurrent.length) * 100 : 0;
    const previousShare = marketPrevious.length > 0 ? (previousVolume / marketPrevious.length) * 100 : 0;
    const shareChange = currentShare - previousShare;
    
    // Rank
    const agencyCounts = new Map<string, number>();
    marketCurrent.forEach(job => {
      const agency = job.short_agency || job.long_agency || 'Unknown';
      agencyCounts.set(agency, (agencyCounts.get(agency) || 0) + 1);
    });
    const sortedAgencies = Array.from(agencyCounts.entries()).sort((a, b) => b[1] - a[1]);
    const rank = sortedAgencies.findIndex(([name]) => name === selectedAgencyName) + 1;
    const totalAgencies = sortedAgencies.length;
    
    // Market growth comparison
    const marketGrowth = marketPrevious.length > 0 
      ? ((marketCurrent.length - marketPrevious.length) / marketPrevious.length) * 100 
      : 0;
    const outperforming = volumeChange > marketGrowth;
    
    return {
      volume: { current: currentVolume, previous: previousVolume, change: volumeChange },
      share: { current: currentShare, previous: previousShare, change: shareChange },
      rank: { current: rank, total: totalAgencies },
      marketGrowth,
      outperforming,
      gainedShare: shareChange > 0
    };
  }, [isAgencyView, agencyPeriodData, periodData, selectedAgencyName]);
  
  // You vs Market: Category comparison
  const categoryComparison = useMemo(() => {
    if (!isAgencyView || !agencyPeriodData) return null;
    
    const { current: agencyCurrent } = agencyPeriodData;
    const { current: marketCurrent } = periodData;
    
    // Agency category distribution
    const agencyCategoryCounts = new Map<string, number>();
    agencyCurrent.forEach(job => {
      const cat = job.primary_category;
      agencyCategoryCounts.set(cat, (agencyCategoryCounts.get(cat) || 0) + 1);
    });
    
    // Market category distribution
    const marketCategoryCounts = new Map<string, number>();
    marketCurrent.forEach(job => {
      const cat = job.primary_category;
      marketCategoryCounts.set(cat, (marketCategoryCounts.get(cat) || 0) + 1);
    });
    
    const agencyTotal = agencyCurrent.length || 1;
    const marketTotal = marketCurrent.length || 1;
    
    // Your top categories
    const yourTopCategories = Array.from(agencyCategoryCounts.entries())
      .map(([category, count]) => ({
        category,
        count,
        percentage: (count / agencyTotal) * 100,
        marketPercentage: ((marketCategoryCounts.get(category) || 0) / marketTotal) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Market top categories
    const marketTopCategories = Array.from(marketCategoryCounts.entries())
      .map(([category, count]) => ({
        category,
        count,
        percentage: (count / marketTotal) * 100,
        yourPercentage: ((agencyCategoryCounts.get(category) || 0) / agencyTotal) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    // Over/under indexing
    const allCategories = new Set([...agencyCategoryCounts.keys(), ...marketCategoryCounts.keys()]);
    const indexing = Array.from(allCategories).map(category => {
      const yourPct = ((agencyCategoryCounts.get(category) || 0) / agencyTotal) * 100;
      const marketPct = ((marketCategoryCounts.get(category) || 0) / marketTotal) * 100;
      return { category, yourPct, marketPct, diff: yourPct - marketPct };
    });
    
    const overIndexed = indexing
      .filter(c => c.diff > 5 && c.yourPct > 3)
      .sort((a, b) => b.diff - a.diff)
      .slice(0, 3);
    
    const underIndexed = indexing
      .filter(c => c.diff < -5 && c.marketPct > 5)
      .sort((a, b) => a.diff - b.diff)
      .slice(0, 3);
    
    return { yourTopCategories, marketTopCategories, overIndexed, underIndexed };
  }, [isAgencyView, agencyPeriodData, periodData]);
  
  // Category Hiring Profiles - What grades does agency hire for each category
  const categoryHiringProfiles = useMemo(() => {
    if (!isAgencyView || !agencyPeriodData) return null;
    
    const { current: agencyCurrent } = agencyPeriodData;
    const { current: marketCurrent } = periodData;
    
    // Classify grade
    const classifyGrade = (grade: string): string => {
      const g = (grade || '').toUpperCase();
      if (/^(P[567]|D[12]|USG|ASG)/.test(g)) return 'Senior (P5+/D)';
      if (/^P[34]/.test(g)) return 'Mid (P3-P4)';
      if (/^P[12]/.test(g)) return 'Junior (P1-P2)';
      if (/^G/.test(g)) return 'General Service';
      if (/^NO/.test(g)) return 'National Officer';
      if (g.includes('CONSULT') || g.includes('IC')) return 'Consultant';
      if (g.includes('INTERN')) return 'Intern';
      return 'Other';
    };
    
    // Get top categories for agency
    const categoryCounts = new Map<string, number>();
    agencyCurrent.forEach(job => {
      categoryCounts.set(job.primary_category, (categoryCounts.get(job.primary_category) || 0) + 1);
    });
    
    const topCategories = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([category]) => category);
    
    // For each top category, get grade breakdown for agency and market
    const profiles = topCategories.map(category => {
      const agencyJobs = agencyCurrent.filter(j => j.primary_category === category);
      const marketJobs = marketCurrent.filter(j => j.primary_category === category);
      
      // Agency grade breakdown
      const agencyGrades = new Map<string, number>();
      agencyJobs.forEach(job => {
        const grade = classifyGrade(job.up_grade || '');
        agencyGrades.set(grade, (agencyGrades.get(grade) || 0) + 1);
      });
      
      // Market grade breakdown
      const marketGrades = new Map<string, number>();
      marketJobs.forEach(job => {
        const grade = classifyGrade(job.up_grade || '');
        marketGrades.set(grade, (marketGrades.get(grade) || 0) + 1);
      });
      
      const agencyTotal = agencyJobs.length || 1;
      const marketTotal = marketJobs.length || 1;
      
      // Get top 3 grades for agency
      const agencyTopGrades = Array.from(agencyGrades.entries())
        .map(([grade, count]) => ({ grade, count, pct: (count / agencyTotal) * 100 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
      
      // Get top grade for market
      const marketTopGrade = Array.from(marketGrades.entries())
        .sort((a, b) => b[1] - a[1])[0];
      
      return {
        category,
        jobCount: agencyJobs.length,
        agencyTopGrades,
        marketTopGrade: marketTopGrade 
          ? { grade: marketTopGrade[0], pct: (marketTopGrade[1] / marketTotal) * 100 }
          : null
      };
    });
    
    return profiles;
  }, [isAgencyView, agencyPeriodData, periodData]);
  
  // Workforce comparison (agency vs market)
  const workforceComparison = useMemo(() => {
    if (!isAgencyView || !agencyPeriodData) return null;
    
    const { current: agencyCurrent } = agencyPeriodData;
    const { current: marketCurrent } = periodData;
    
    const classifySeniority = (job: ProcessedJobData) => {
      const grade = (job.up_grade || '').toUpperCase();
      if (/^(P[567]|D[12]|USG|ASG)/.test(grade)) return 'senior';
      if (/^P[34]/.test(grade)) return 'mid';
      if (/^(P[12]|G|NO)/.test(grade)) return 'entry';
      if (grade.includes('CONSULT') || grade.includes('IC')) return 'consultant';
      return 'other';
    };
    
    const getSeniorityMix = (jobs: ProcessedJobData[]) => {
      const classified = jobs.filter(j => j.up_grade);
      if (classified.length === 0) return { senior: 0, mid: 0, entry: 0, consultant: 0 };
      
      const counts = { senior: 0, mid: 0, entry: 0, consultant: 0, other: 0 };
      classified.forEach(j => {
        const level = classifySeniority(j);
        counts[level as keyof typeof counts]++;
      });
      
      const total = classified.length;
      return {
        senior: (counts.senior / total) * 100,
        mid: (counts.mid / total) * 100,
        entry: (counts.entry / total) * 100,
        consultant: (counts.consultant / total) * 100
      };
    };
    
    const getRemoteRate = (jobs: ProcessedJobData[]) => {
      if (jobs.length === 0) return 0;
      const remote = jobs.filter(j => 
        (j.duty_country || '').toLowerCase().includes('home-based') ||
        (j.location_type || '').toLowerCase().includes('remote')
      ).length;
      return (remote / jobs.length) * 100;
    };
    
    const getStaffRate = (jobs: ProcessedJobData[]) => {
      const classified = jobs.filter(j => j.up_grade);
      if (classified.length === 0) return 0;
      const staff = classified.filter(j => {
        const grade = (j.up_grade || '').toUpperCase();
        return /^(P|D|G|NO|L|USG|ASG)/.test(grade) && !grade.includes('CONSULT');
      }).length;
      return (staff / classified.length) * 100;
    };
    
    const getUrgentRate = (jobs: ProcessedJobData[]) => {
      if (jobs.length === 0) return 0;
      const urgent = jobs.filter(j => j.application_window_days < 14).length;
      return (urgent / jobs.length) * 100;
    };
    
    const getMedianWindow = (jobs: ProcessedJobData[]) => {
      const windows = jobs
        .map(j => j.application_window_days)
        .filter(w => typeof w === 'number' && w > 0)
        .sort((a, b) => a - b);
      if (windows.length === 0) return 0;
      const mid = Math.floor(windows.length / 2);
      return windows.length % 2 ? windows[mid] : (windows[mid - 1] + windows[mid]) / 2;
    };
    
    return {
      seniority: {
        you: getSeniorityMix(agencyCurrent),
        market: getSeniorityMix(marketCurrent)
      },
      staffRate: {
        you: getStaffRate(agencyCurrent),
        market: getStaffRate(marketCurrent)
      },
      remoteRate: {
        you: getRemoteRate(agencyCurrent),
        market: getRemoteRate(marketCurrent)
      },
      urgentRate: {
        you: getUrgentRate(agencyCurrent),
        market: getUrgentRate(marketCurrent)
      },
      avgWindow: {
        you: getMedianWindow(agencyCurrent),
        market: getMedianWindow(marketCurrent)
      }
    };
  }, [isAgencyView, agencyPeriodData, periodData]);
  
  // Your Position - Strengths and areas to improve
  const positioning = useMemo(() => {
    if (!isAgencyView || !workforceComparison || !agencyPerformance) return null;
    
    const strengths: string[] = [];
    const improvements: string[] = [];
    
    // Market share
    if (agencyPerformance.rank.current <= 3) {
      strengths.push(`Top 3 market position (#${agencyPerformance.rank.current})`);
    } else if (agencyPerformance.rank.current > 10) {
      improvements.push('Market presence (currently outside top 10)');
    }
    
    // Growth
    if (agencyPerformance.outperforming) {
      strengths.push('Growing faster than market');
    } else if (agencyPerformance.volume.change < 0) {
      improvements.push('Hiring volume declining');
    }
    
    // Staff vs consultant
    const staffDiff = workforceComparison.staffRate.you - workforceComparison.staffRate.market;
    if (staffDiff > 10) {
      strengths.push('Higher staff ratio than market');
    } else if (staffDiff < -15) {
      improvements.push('High consultant dependency');
    }
    
    // Remote work
    const remoteDiff = workforceComparison.remoteRate.you - workforceComparison.remoteRate.market;
    if (remoteDiff > 5) {
      strengths.push('Leading in remote work adoption');
    }
    
    // Process speed
    const windowDiff = workforceComparison.avgWindow.you - workforceComparison.avgWindow.market;
    if (windowDiff < -3) {
      strengths.push('Faster hiring process');
    } else if (windowDiff > 5) {
      improvements.push('Slower hiring process than market');
    }
    
    // Senior hiring
    const seniorDiff = workforceComparison.seniority.you.senior - workforceComparison.seniority.market.senior;
    if (seniorDiff > 3) {
      strengths.push('Strong senior hiring');
    } else if (seniorDiff < -5 && workforceComparison.seniority.market.senior > 5) {
      improvements.push('Below market in senior hiring');
    }
    
    return { strengths: strengths.slice(0, 4), improvements: improvements.slice(0, 4) };
  }, [isAgencyView, workforceComparison, agencyPerformance]);
  
  // Agency-specific alerts
  const agencyAlerts = useMemo(() => {
    if (!isAgencyView || !workforceComparison || !agencyPerformance || !categoryComparison) return [];
    
    const alerts: { type: 'warning' | 'info' | 'success'; message: string }[] = [];
    
    // Urgent rate comparison
    const urgentDiff = workforceComparison.urgentRate.you - workforceComparison.urgentRate.market;
    if (urgentDiff > 10) {
      alerts.push({
        type: 'warning',
        message: `Your urgent rate (${workforceComparison.urgentRate.you.toFixed(0)}%) is ${urgentDiff.toFixed(0)}pp higher than market`
      });
    }
    
    // Growth comparison
    if (agencyPerformance.outperforming && agencyPerformance.volume.change > 10) {
      alerts.push({
        type: 'success',
        message: `You're growing ${(agencyPerformance.volume.change - agencyPerformance.marketGrowth).toFixed(0)}pp faster than market`
      });
    } else if (!agencyPerformance.outperforming && agencyPerformance.marketGrowth > 10) {
      alerts.push({
        type: 'warning',
        message: `Market growing at ${agencyPerformance.marketGrowth.toFixed(0)}% while you're at ${agencyPerformance.volume.change.toFixed(0)}%`
      });
    }
    
    // Market share trend
    if (agencyPerformance.share.change > 2) {
      alerts.push({
        type: 'success',
        message: `Gaining market share (+${agencyPerformance.share.change.toFixed(1)}pp)`
      });
    } else if (agencyPerformance.share.change < -2) {
      alerts.push({
        type: 'warning',
        message: `Losing market share (${agencyPerformance.share.change.toFixed(1)}pp)`
      });
    }
    
    // Category alignment
    if (categoryComparison.overIndexed.length > 0) {
      const top = categoryComparison.overIndexed[0];
      const topCatInfo = getCategoryInfo(top.category);
      alerts.push({
        type: 'info',
        message: `Strong focus on ${topCatInfo.name} (+${top.diff.toFixed(0)}pp vs market)`
      });
    }
    
    return alerts.slice(0, 4);
  }, [isAgencyView, workforceComparison, agencyPerformance, categoryComparison]);

  // ============================================================================
  // MARKET VIEW CALCULATIONS (existing code)
  // ============================================================================
  
  const marketPulse = useMemo(() => {
    const { current, previous } = periodData;
    
    const currentJobs = current.length;
    const previousJobs = previous.length;
    const jobsChange = previousJobs > 0 ? ((currentJobs - previousJobs) / previousJobs) * 100 : 0;
    
    const getMedianWindow = (jobs: ProcessedJobData[]) => {
      const windows = jobs.map(j => j.application_window_days).filter(w => typeof w === 'number' && w > 0).sort((a, b) => a - b);
      if (windows.length === 0) return 0;
      const mid = Math.floor(windows.length / 2);
      return windows.length % 2 ? windows[mid] : (windows[mid - 1] + windows[mid]) / 2;
    };
    
    const currentWindow = getMedianWindow(current);
    const previousWindow = getMedianWindow(previous);
    
    const getUrgentRate = (jobs: ProcessedJobData[]) => {
      if (jobs.length === 0) return 0;
      return (jobs.filter(j => j.application_window_days < 14).length / jobs.length) * 100;
    };
    
    const currentUrgent = getUrgentRate(current);
    const previousUrgent = getUrgentRate(previous);
    
    const getUniqueAgencies = (jobs: ProcessedJobData[]) => {
      return new Set(jobs.map(j => j.short_agency || j.long_agency)).size;
    };
    
    return {
      jobs: { current: currentJobs, previous: previousJobs, change: jobsChange },
      window: { current: currentWindow, previous: previousWindow },
      urgentRate: { current: currentUrgent, previous: previousUrgent },
      agencies: { current: getUniqueAgencies(current), previous: getUniqueAgencies(previous) }
    };
  }, [periodData]);
  
  const categoryShifts = useMemo(() => {
    const { current, previous } = periodData;
    
    const countByCategory = (jobs: ProcessedJobData[]) => {
      const counts = new Map<string, number>();
      jobs.forEach(job => counts.set(job.primary_category, (counts.get(job.primary_category) || 0) + 1));
      return counts;
    };
    
    const currentCounts = countByCategory(current);
    const previousCounts = countByCategory(previous);
    
    const allCategories = new Set([...currentCounts.keys(), ...previousCounts.keys()]);
    const growth = Array.from(allCategories).map(category => {
      const curr = currentCounts.get(category) || 0;
      const prev = previousCounts.get(category) || 0;
      const change = prev > 0 ? ((curr - prev) / prev) * 100 : (curr > 0 ? 100 : 0);
      
      const categoryJobs = current.filter(j => j.primary_category === category);
      const agencyCounts = new Map<string, number>();
      categoryJobs.forEach(j => {
        const agency = j.short_agency || j.long_agency || 'Unknown';
        agencyCounts.set(agency, (agencyCounts.get(agency) || 0) + 1);
      });
      const topAgency = Array.from(agencyCounts.entries()).sort((a, b) => b[1] - a[1])[0];
      
      return { category, current: curr, previous: prev, change, absoluteChange: curr - prev, topAgency: topAgency?.[0] || null };
    });
    
    const totalCurrent = current.length;
    const top3Current = Array.from(currentCounts.values()).sort((a, b) => b - a).slice(0, 3).reduce((sum, v) => sum + v, 0);
    const concentration = totalCurrent > 0 ? (top3Current / totalCurrent) * 100 : 0;
    
    const totalPrevious = previous.length;
    const top3Previous = Array.from(previousCounts.values()).sort((a, b) => b - a).slice(0, 3).reduce((sum, v) => sum + v, 0);
    const prevConcentration = totalPrevious > 0 ? (top3Previous / totalPrevious) * 100 : 0;
    
    return {
      growing: growth.filter(c => c.change > 15 && c.current >= 3).sort((a, b) => b.absoluteChange - a.absoluteChange).slice(0, 4),
      declining: growth.filter(c => c.change < -15 && c.previous >= 3).sort((a, b) => a.absoluteChange - b.absoluteChange).slice(0, 4),
      concentration,
      prevConcentration
    };
  }, [periodData]);
  
  const workforceEvolution = useMemo(() => {
    const { current, previous } = periodData;
    
    const classifySeniority = (job: ProcessedJobData) => {
      const grade = (job.up_grade || '').toUpperCase();
      if (/^(P[567]|D[12]|USG|ASG)/.test(grade)) return 'senior';
      if (/^P[34]/.test(grade)) return 'mid';
      if (/^(P[12]|G|NO)/.test(grade)) return 'entry';
      if (grade.includes('CONSULT') || grade.includes('IC')) return 'consultant';
      return 'other';
    };
    
    const getSeniorityMix = (jobs: ProcessedJobData[]) => {
      const classified = jobs.filter(j => j.up_grade);
      if (classified.length === 0) return { senior: 0, mid: 0, entry: 0, consultant: 0 };
      const counts = { senior: 0, mid: 0, entry: 0, consultant: 0, other: 0 };
      classified.forEach(j => { counts[classifySeniority(j) as keyof typeof counts]++; });
      const total = classified.length;
      return { senior: (counts.senior / total) * 100, mid: (counts.mid / total) * 100, entry: (counts.entry / total) * 100, consultant: (counts.consultant / total) * 100 };
    };
    
    const getRemoteRate = (jobs: ProcessedJobData[]) => {
      if (jobs.length === 0) return 0;
      return (jobs.filter(j => (j.duty_country || '').toLowerCase().includes('home-based') || (j.location_type || '').toLowerCase().includes('remote')).length / jobs.length) * 100;
    };
    
    const getStaffRate = (jobs: ProcessedJobData[]) => {
      const classified = jobs.filter(j => j.up_grade);
      if (classified.length === 0) return 0;
      return (classified.filter(j => { const g = (j.up_grade || '').toUpperCase(); return /^(P|D|G|NO|L|USG|ASG)/.test(g) && !g.includes('CONSULT'); }).length / classified.length) * 100;
    };
    
    // Calculate location breakdown
    const getLocationBreakdown = (jobs: ProcessedJobData[]) => {
      if (jobs.length === 0) return { field: 0, regional: 0, hq: 0, remote: 0 };
      const counts = { field: 0, regional: 0, hq: 0, remote: 0 };
      jobs.forEach(j => {
        const locType = (j.location_type || '').toLowerCase();
        const duty = (j.duty_country || j.duty_station || '').toLowerCase();
        if (duty.includes('home-based') || duty.includes('remote') || locType.includes('remote')) {
          counts.remote++;
        } else if (locType.includes('field') || locType.includes('country')) {
          counts.field++;
        } else if (locType.includes('regional')) {
          counts.regional++;
        } else {
          counts.hq++;
        }
      });
      const total = jobs.length;
      return { 
        field: (counts.field / total) * 100, 
        regional: (counts.regional / total) * 100, 
        hq: (counts.hq / total) * 100, 
        remote: (counts.remote / total) * 100 
      };
    };

    return {
      seniority: { current: getSeniorityMix(current), previous: getSeniorityMix(previous) },
      remoteRate: { current: getRemoteRate(current), previous: getRemoteRate(previous) },
      staffRate: { current: getStaffRate(current), previous: getStaffRate(previous) },
      locationBreakdown: { current: getLocationBreakdown(current), previous: getLocationBreakdown(previous) }
    };
  }, [periodData]);
  
  // Calculate mini trend data for staff rate and remote rate over time periods
  const workforceTrendData = useMemo(() => {
    const { currentStart, currentEnd } = periodData;
    
    // Divide the current period into 4 sub-periods for mini sparkline
    const totalDays = Math.ceil((currentEnd.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24));
    const periodLength = Math.floor(totalDays / 4);
    
    const subPeriods: { start: Date; end: Date; label: string }[] = [];
    for (let i = 0; i < 4; i++) {
      const start = new Date(currentStart.getTime() + i * periodLength * 24 * 60 * 60 * 1000);
      const end = i === 3 ? currentEnd : new Date(currentStart.getTime() + (i + 1) * periodLength * 24 * 60 * 60 * 1000);
      subPeriods.push({ start, end, label: format(start, 'MMM d') });
    }
    
    const getStaffRate = (jobs: ProcessedJobData[]) => {
      const classified = jobs.filter(j => j.up_grade);
      if (classified.length === 0) return 0;
      return (classified.filter(j => { const g = (j.up_grade || '').toUpperCase(); return /^(P|D|G|NO|L|USG|ASG)/.test(g) && !g.includes('CONSULT'); }).length / classified.length) * 100;
    };
    
    const getRemoteRate = (jobs: ProcessedJobData[]) => {
      if (jobs.length === 0) return 0;
      const remote = jobs.filter(j => {
        const duty = (j.duty_country || j.duty_station || '').toLowerCase();
        const locType = (j.location_type || '').toLowerCase();
        return duty.includes('home-based') || duty.includes('remote') || locType.includes('remote');
      });
      return (remote.length / jobs.length) * 100;
    };
    
    const staffTrend: { period: string; value: number }[] = [];
    const remoteTrend: { period: string; value: number }[] = [];
    
    subPeriods.forEach(({ start, end, label }) => {
      const periodJobs = periodData.current.filter(job => {
        try {
          const postingDate = parseISO(job.posting_date);
          return postingDate >= start && postingDate <= end;
        } catch { return false; }
      });
      
      staffTrend.push({ period: label, value: getStaffRate(periodJobs) });
      remoteTrend.push({ period: label, value: getRemoteRate(periodJobs) });
    });
    
    return { staffTrend, remoteTrend };
  }, [periodData]);
  
  const competitiveDynamics = useMemo(() => {
    const { current, previous } = periodData;
    
    const countByAgency = (jobs: ProcessedJobData[]) => {
      const counts = new Map<string, number>();
      jobs.forEach(job => {
        const agency = job.short_agency || job.long_agency || 'Unknown';
        counts.set(agency, (counts.get(agency) || 0) + 1);
      });
      return counts;
    };
    
    const currentCounts = countByAgency(current);
    const previousCounts = countByAgency(previous);
    
    const allAgencies = new Set([...currentCounts.keys(), ...previousCounts.keys()]);
    const changes = Array.from(allAgencies).map(agency => {
      const curr = currentCounts.get(agency) || 0;
      const prev = previousCounts.get(agency) || 0;
      return { agency, current: curr, previous: prev, change: prev > 0 ? ((curr - prev) / prev) * 100 : (curr > 0 ? 100 : 0), absoluteChange: curr - prev };
    });
    
    const totalCurrent = current.length;
    const top5Current = Array.from(currentCounts.values()).sort((a, b) => b - a).slice(0, 5).reduce((sum, v) => sum + v, 0);
    const concentration = totalCurrent > 0 ? (top5Current / totalCurrent) * 100 : 0;
    
    const totalPrevious = previous.length;
    const top5Previous = Array.from(previousCounts.values()).sort((a, b) => b - a).slice(0, 5).reduce((sum, v) => sum + v, 0);
    const prevConcentration = totalPrevious > 0 ? (top5Previous / totalPrevious) * 100 : 0;
    
    const leader = Array.from(currentCounts.entries()).sort((a, b) => b[1] - a[1])[0];
    
    return {
      scalingUp: changes.filter(a => a.absoluteChange > 5 && a.change > 20).sort((a, b) => b.absoluteChange - a.absoluteChange).slice(0, 4),
      scalingDown: changes.filter(a => a.absoluteChange < -3 && a.change < -15).sort((a, b) => a.absoluteChange - b.absoluteChange).slice(0, 4),
      concentration: { current: concentration, previous: prevConcentration },
      leader: leader ? { name: leader[0], share: (leader[1] / totalCurrent) * 100 } : null
    };
  }, [periodData]);
  
  const marketAlerts = useMemo(() => {
    const issues: { type: 'warning' | 'info' | 'success'; message: string }[] = [];
    
    if (marketPulse.urgentRate.current > 35) {
      issues.push({ type: 'warning', message: `${marketPulse.urgentRate.current.toFixed(0)}% of positions are urgent (<14 days) — high hiring pressure` });
    }
    if (Math.abs(marketPulse.jobs.change) > 30) {
      issues.push({ type: marketPulse.jobs.change > 0 ? 'info' : 'warning', message: marketPulse.jobs.change > 0 ? `Hiring surge: ${marketPulse.jobs.change.toFixed(0)}% more positions vs prior period` : `Hiring slowdown: ${Math.abs(marketPulse.jobs.change).toFixed(0)}% fewer positions vs prior period` });
    }
    if (competitiveDynamics.concentration.current > 60) {
      issues.push({ type: 'info', message: `Top 5 agencies control ${competitiveDynamics.concentration.current.toFixed(0)}% of market` });
    }
    if (categoryShifts.growing.length >= 3 || categoryShifts.declining.length >= 3) {
      issues.push({ type: 'info', message: `High category movement: ${categoryShifts.growing.length} growing, ${categoryShifts.declining.length} declining significantly` });
    }
    
    return issues.slice(0, 4);
  }, [marketPulse, categoryShifts, competitiveDynamics]);
  
  // Period options removed - now using global time filter from Dashboard

  // State for agency selection in chart
  const [selectedAgenciesForChart, setSelectedAgenciesForChart] = useState<string[]>([]);
  const [showAgencySelector, setShowAgencySelector] = useState(false);

  // Get top agencies for chart display
  const topAgencies = useMemo(() => {
    const agencyCounts = new Map<string, number>();
    periodData.current.forEach(job => {
      const agency = job.short_agency || job.long_agency || 'Unknown';
      agencyCounts.set(agency, (agencyCounts.get(agency) || 0) + 1);
    });
    return Array.from(agencyCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name]) => name);
  }, [periodData.current]);

  // Initialize selected agencies with top 5
  React.useEffect(() => {
    if (selectedAgenciesForChart.length === 0 && topAgencies.length > 0) {
      setSelectedAgenciesForChart(topAgencies.slice(0, 5));
    }
  }, [topAgencies]);

  // Predefined colors for agencies
  const agencyColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  // Hiring volume over time data with agency breakdown
  const hiringVolumeOverTime = useMemo(() => {
    const { currentStart, currentEnd } = periodData;
    const useWeekly = useWeeklyGranularity;
    
    // Determine agencies to show
    const agenciesToShow = isAgencyView 
      ? [selectedAgencyName] 
      : selectedAgenciesForChart.length > 0 
        ? selectedAgenciesForChart 
        : topAgencies.slice(0, 5);
    
    if (useWeekly) {
      const weeks = eachWeekOfInterval({ start: currentStart, end: currentEnd }, { weekStartsOn: 1 });
      
      return weeks.map(weekStart => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        const jobsInWeek = periodData.current.filter(job => {
          try {
            const postingDate = parseISO(job.posting_date);
            return postingDate >= weekStart && postingDate <= weekEnd;
          } catch { return false; }
        });
        
        const dataPoint: any = {
          period: format(weekStart, 'MMM d'),
          total: jobsInWeek.length,
          date: weekStart
        };
        
        // Add per-agency counts
        agenciesToShow.forEach(agency => {
          dataPoint[agency] = jobsInWeek.filter(j => 
            (j.short_agency || j.long_agency) === agency
          ).length;
        });
        
        // Calculate "Others" if in market view
        if (!isAgencyView) {
          const selectedTotal = agenciesToShow.reduce((sum, agency) => sum + (dataPoint[agency] || 0), 0);
          dataPoint['Others'] = jobsInWeek.length - selectedTotal;
        }
        
        return dataPoint;
      });
    } else {
      const months = eachMonthOfInterval({ start: currentStart, end: currentEnd });
      
      return months.map(monthStart => {
        const monthEnd = endOfMonth(monthStart);
        const jobsInMonth = periodData.current.filter(job => {
          try {
            const postingDate = parseISO(job.posting_date);
            return postingDate >= monthStart && postingDate <= monthEnd;
          } catch { return false; }
        });
        
        const dataPoint: any = {
          period: format(monthStart, 'MMM'),
          total: jobsInMonth.length,
          date: monthStart
        };
        
        // Add per-agency counts
        agenciesToShow.forEach(agency => {
          dataPoint[agency] = jobsInMonth.filter(j => 
            (j.short_agency || j.long_agency) === agency
          ).length;
        });
        
        // Calculate "Others" if in market view
        if (!isAgencyView) {
          const selectedTotal = agenciesToShow.reduce((sum, agency) => sum + (dataPoint[agency] || 0), 0);
          dataPoint['Others'] = jobsInMonth.length - selectedTotal;
        }
        
        return dataPoint;
      });
    }
  }, [periodData, useWeeklyGranularity, selectedAgenciesForChart, topAgencies, isAgencyView, selectedAgencyName]);

  // Get all unique agencies for selection
  const allAgencies = useMemo(() => {
    const agencyCounts = new Map<string, number>();
    periodData.current.forEach(job => {
      const agency = job.short_agency || job.long_agency || 'Unknown';
      agencyCounts.set(agency, (agencyCounts.get(agency) || 0) + 1);
    });
    return Array.from(agencyCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [periodData.current]);

  // Toggle agency selection
  const toggleAgencySelection = (agency: string) => {
    setSelectedAgenciesForChart(prev => {
      if (prev.includes(agency)) {
        return prev.filter(a => a !== agency);
      } else if (prev.length < 10) {
        return [...prev, agency];
      }
      return prev;
    });
  };

  // ============================================================================
  // RENDER: AGENCY VIEW
  // ============================================================================
  if (isAgencyView && agencyPerformance && categoryComparison && workforceComparison && categoryHiringProfiles && positioning) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 px-4 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getAgencyLogo(selectedAgencyName) ? (
                <img 
                  src={getAgencyLogo(selectedAgencyName)!} 
                  alt={selectedAgencyName} 
                  className="h-5 w-5 object-contain"
                />
              ) : (
                <BarChart3 className="h-4 w-4 text-blue-600" />
              )}
              <div>
                <span className="text-sm font-semibold text-gray-800">{selectedAgencyName} Intelligence</span>
                <span className="text-xs text-gray-500 ml-2">vs UN talent market</span>
              </div>
            </div>
            
          </div>
        </div>
        
        {/* Period Context - now controlled by global filter */}
        <div className="text-xs text-gray-500 flex items-center gap-4 px-1">
          <span className="text-blue-600 font-medium">{agencyPeriodData?.current.length.toLocaleString()} {selectedAgencyName} jobs</span>
          <span className="text-gray-400">of {periodData.current.length.toLocaleString()} market total</span>
          {contextComparisonPeriod && (
            <>
              <span>•</span>
              <span><span className="font-medium text-gray-500">Trends compare to:</span> {periodData.previousLabel}</span>
            </>
          )}
        </div>

        {/* AGENCY HIRING VOLUME OVER TIME */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-semibold text-gray-800">{selectedAgencyName} Hiring Volume</span>
            <span className="text-[10px] text-gray-400 ml-auto">{periodData.currentLabel}</span>
          </div>
          
          <div className="p-4">
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hiringVolumeOverTime} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAgency" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis 
                    dataKey="period" 
                    tick={{ fontSize: 10, fill: '#6B7280' }}
                    axisLine={{ stroke: '#E5E7EB' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                    width={35}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px'
                    }}
                    formatter={(value: number) => [`${value} jobs`, selectedAgencyName]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={selectedAgencyName} 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    fill="url(#colorAgency)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex items-center justify-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-blue-500 rounded"></div>
                <span>{selectedAgencyName} postings per {useWeeklyGranularity ? 'week' : 'month'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 1: AGENCY PERFORMANCE */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2">
            <Award className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-semibold text-gray-800">{selectedAgencyName} Performance</span>
            <span className="text-[10px] text-gray-400 ml-auto">vs prior period & market</span>
          </div>
          
          <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
              <div className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-1">Hiring Volume</div>
              <div className="text-2xl font-bold text-gray-900">{agencyPerformance.volume.current}</div>
              <div className="flex items-center gap-2 mt-1">
                <TrendIndicator value={agencyPerformance.volume.change} size="sm" />
                <span className="text-[10px] text-gray-500">vs {agencyPerformance.volume.previous} prior</span>
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
              <div className="text-[10px] font-semibold text-purple-600 uppercase tracking-wide mb-1">Market Share</div>
              <div className="text-2xl font-bold text-gray-900">{agencyPerformance.share.current.toFixed(1)}%</div>
              <div className="flex items-center gap-2 mt-1">
                <TrendIndicator value={agencyPerformance.share.change} suffix="pp" size="sm" />
                <span className="text-[10px] text-gray-500">{agencyPerformance.gainedShare ? 'gaining' : 'losing'} share</span>
              </div>
            </div>
            
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
              <div className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide mb-1">Market Rank</div>
              <div className="text-2xl font-bold text-gray-900">#{agencyPerformance.rank.current}</div>
              <div className="text-[10px] text-gray-500 mt-1">of {agencyPerformance.rank.total} agencies</div>
            </div>
            
            <div className={`rounded-lg p-3 border ${agencyPerformance.outperforming ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
              <div className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${agencyPerformance.outperforming ? 'text-green-600' : 'text-red-600'}`}>
                vs Market Growth
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {agencyPerformance.outperforming ? '↑' : '↓'} {Math.abs(agencyPerformance.volume.change - agencyPerformance.marketGrowth).toFixed(0)}pp
              </div>
              <div className="text-[10px] text-gray-500 mt-1">
                {agencyPerformance.outperforming ? 'outperforming' : 'behind'} market ({agencyPerformance.marketGrowth.toFixed(0)}%)
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: AGENCY VS MARKET - CATEGORIES */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2">
            <Target className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-semibold text-gray-800">{selectedAgencyName} vs Market</span>
            <span className="text-[10px] text-gray-400 ml-auto">Category focus comparison</span>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Agency Top Categories */}
              <div>
                <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">{selectedAgencyName} Top Categories</div>
                <div className="space-y-2">
                  {categoryComparison.yourTopCategories.map((cat, i) => {
                    const catInfo = getCategoryInfo(cat.category);
                    return (
                      <div key={cat.category} className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: catInfo.color }} />
                              <span className="text-xs text-gray-700 truncate">{catInfo.name}</span>
                            </div>
                            <span className="text-xs font-semibold text-gray-800">{cat.percentage.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1 mt-1">
                            <div className="bg-blue-500 h-1 rounded-full" style={{ width: `${cat.percentage}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Market Top Categories */}
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Market Top Categories</div>
                <div className="space-y-2">
                  {categoryComparison.marketTopCategories.map((cat, i) => {
                    const catInfo = getCategoryInfo(cat.category);
                    return (
                      <div key={cat.category} className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-gray-100 text-gray-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: catInfo.color }} />
                              <span className="text-xs text-gray-700 truncate">{catInfo.name}</span>
                            </div>
                            <span className="text-xs font-semibold text-gray-600">{cat.percentage.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1 mt-1">
                            <div className="bg-gray-400 h-1 rounded-full" style={{ width: `${cat.percentage}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Over/Under Indexing Insights */}
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 lg:grid-cols-2 gap-3">
              {categoryComparison.overIndexed.length > 0 && (
                <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                  <div className="text-[10px] font-semibold text-green-700 uppercase tracking-wide mb-2">💡 You Over-index On</div>
                  {categoryComparison.overIndexed.map(cat => {
                    const catInfo = getCategoryInfo(cat.category);
                    return (
                      <div key={cat.category} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: catInfo.color }} />
                          <span className="text-gray-700 truncate">{catInfo.name}</span>
                        </div>
                        <span className="text-green-600 font-semibold flex-shrink-0 ml-2">+{cat.diff.toFixed(0)}pp vs market</span>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {categoryComparison.underIndexed.length > 0 && (
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                  <div className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide mb-2">⚠️ You Under-index On</div>
                  {categoryComparison.underIndexed.map(cat => {
                    const catInfo = getCategoryInfo(cat.category);
                    return (
                      <div key={cat.category} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: catInfo.color }} />
                          <span className="text-gray-700 truncate">{catInfo.name}</span>
                        </div>
                        <span className="text-amber-600 font-semibold flex-shrink-0 ml-2">{cat.diff.toFixed(0)}pp vs market</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 3: CATEGORY HIRING PROFILES - Grade breakdown by category */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-semibold text-gray-800">Category Hiring Profiles</span>
            <span className="text-[10px] text-gray-400 ml-auto">What grades you hire per category</span>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {categoryHiringProfiles.map(profile => {
                const catInfo = getCategoryInfo(profile.category);
                return (
                <div key={profile.category} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: catInfo.color }} />
                      <span className="text-xs font-semibold text-gray-800 truncate">{catInfo.name}</span>
                    </div>
                    <span className="text-[10px] text-gray-400">{profile.jobCount} jobs</span>
                  </div>
                  
                  <div className="space-y-1.5">
                    {profile.agencyTopGrades.map((grade, i) => (
                      <div key={grade.grade} className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-gray-600">{grade.grade}</span>
                            <span className="font-semibold text-gray-800">{grade.pct.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-0.5">
                            <div 
                              className={`h-1.5 rounded-full ${i === 0 ? 'bg-indigo-500' : i === 1 ? 'bg-indigo-300' : 'bg-indigo-200'}`}
                              style={{ width: `${grade.pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {profile.marketTopGrade && (
                    <div className="mt-2 pt-2 border-t border-gray-100 text-[10px] text-gray-500">
                      Market hires mostly: <span className="font-medium text-gray-700">{profile.marketTopGrade.grade}</span> ({profile.marketTopGrade.pct.toFixed(0)}%)
                    </div>
                  )}
                </div>
              );
              })}
            </div>
          </div>
        </div>

        {/* SECTION 4: WORKFORCE PROFILE COMPARISON */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2">
            <Activity className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold text-gray-800">Workforce Profile</span>
            <span className="text-[10px] text-gray-400 ml-auto">Composition vs market</span>
          </div>
          
          <div className="p-4">
            <div className="flex items-center gap-4 mb-4 text-[10px]">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-blue-500"></div>
                <span className="text-gray-600">You</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-gray-400"></div>
                <span className="text-gray-600">Market</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Seniority Comparison */}
              <div className="space-y-4">
                <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Seniority Mix</div>
                <ComparisonBar label="Senior+ (P5/D1+)" yourValue={workforceComparison.seniority.you.senior} marketValue={workforceComparison.seniority.market.senior} />
                <ComparisonBar label="Mid-level (P3-P4)" yourValue={workforceComparison.seniority.you.mid} marketValue={workforceComparison.seniority.market.mid} />
                <ComparisonBar label="Entry (P1-P2/G/NO)" yourValue={workforceComparison.seniority.you.entry} marketValue={workforceComparison.seniority.market.entry} />
              </div>
              
              {/* Employment & Process */}
              <div className="space-y-4">
                <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Employment & Process</div>
                <ComparisonBar label="Staff Positions" yourValue={workforceComparison.staffRate.you} marketValue={workforceComparison.staffRate.market} />
                <ComparisonBar label="Remote / Home-based" yourValue={workforceComparison.remoteRate.you} marketValue={workforceComparison.remoteRate.market} />
                <ComparisonBar label="Urgent Rate (<14d)" yourValue={workforceComparison.urgentRate.you} marketValue={workforceComparison.urgentRate.market} />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 5: YOUR POSITION */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2">
            <Zap className="h-4 w-4 text-green-500" />
            <span className="text-sm font-semibold text-gray-800">Competitive Position</span>
            <span className="text-[10px] text-gray-400 ml-auto">Competitive summary</span>
          </div>
          
          <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="bg-green-50 rounded-lg p-3 border border-green-100">
              <div className="text-[10px] font-semibold text-green-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                You Lead In
              </div>
              {positioning.strengths.length > 0 ? (
                <div className="space-y-1.5">
                  {positioning.strengths.map((s, i) => (
                    <div key={i} className="text-xs text-green-800 flex items-start gap-1.5">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-green-600 italic">Building competitive advantages...</p>
              )}
            </div>
            
            {/* Areas to Improve */}
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
              <div className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Target className="h-3 w-3" />
                Room to Improve
              </div>
              {positioning.improvements.length > 0 ? (
                <div className="space-y-1.5">
                  {positioning.improvements.map((s, i) => (
                    <div key={i} className="text-xs text-amber-800 flex items-start gap-1.5">
                      <span className="text-amber-500 mt-0.5">○</span>
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-amber-600 italic">No significant gaps identified</p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 6: AGENCY-SPECIFIC ALERTS */}
        {agencyAlerts.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-semibold text-gray-800">Key Insights</span>
            </div>
            
            <div className="p-3 space-y-2">
              {agencyAlerts.map((alert, i) => (
                <div 
                  key={i}
                  className={`flex items-start gap-2 px-3 py-2 rounded-lg text-xs ${
                    alert.type === 'warning' ? 'bg-amber-50 border border-amber-200 text-amber-800'
                    : alert.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-blue-50 border border-blue-200 text-blue-800'
                  }`}
                >
                  {alert.type === 'warning' ? <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                   : alert.type === 'success' ? <TrendingUp className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                   : <Eye className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />}
                  <span>{alert.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // RENDER: MARKET VIEW (existing)
  // ============================================================================
  return (
    <div className="space-y-4">
      {/* Period Selector Header */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src="/logo/logo/United_Nations.png" 
            alt="UN System" 
            className="h-5 w-5 object-contain"
          />
          <div>
            <span className="text-sm font-semibold text-gray-800">Market Intelligence</span>
            <span className="text-xs text-gray-500 ml-2">UN System Overview</span>
          </div>
        </div>
        
      </div>
      
      {/* Period Context - now controlled by global filter */}
      <div className="text-xs text-gray-500 flex items-center gap-4 px-1">
        <span>{periodData.current.length.toLocaleString()} job postings</span>
        {contextComparisonPeriod && (
          <>
            <span>•</span>
            <span><span className="font-medium text-gray-500">Trends compare to:</span> {periodData.previousLabel}</span>
          </>
        )}
      </div>

      {/* SECTION 1: MARKET PULSE */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span className="text-sm font-semibold text-gray-800">Market Pulse</span>
          <span className="text-[10px] text-gray-400 ml-auto">Overall hiring health</span>
        </div>
        
        <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard label="Job Postings" currentValue={marketPulse.jobs.current} previousValue={marketPulse.jobs.previous} subtitle={`${marketPulse.jobs.current - marketPulse.jobs.previous >= 0 ? '+' : ''}${marketPulse.jobs.current - marketPulse.jobs.previous} jobs`} />
          <MetricCard label="Active Agencies" currentValue={marketPulse.agencies.current} previousValue={marketPulse.agencies.previous} subtitle="posting jobs" />
          <MetricCard label="Avg Window" currentValue={marketPulse.window.current} previousValue={marketPulse.window.previous} format="days" subtitle="application period" />
          <MetricCard label="Urgent Rate" currentValue={marketPulse.urgentRate.current} previousValue={marketPulse.urgentRate.previous} format="percent" subtitle="< 14 days" highlight={marketPulse.urgentRate.current > 35 ? 'negative' : marketPulse.urgentRate.current < 20 ? 'positive' : 'neutral'} />
        </div>
      </div>

      {/* HIRING VOLUME OVER TIME CHART - BY AGENCY */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-semibold text-gray-800">Hiring Volume by Agency</span>
            <span className="text-[10px] text-gray-400">{periodData.currentLabel}</span>
          </div>
          <button
            onClick={() => setShowAgencySelector(!showAgencySelector)}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            <Users className="h-3 w-3" />
            {showAgencySelector ? 'Hide Selection' : 'Select Agencies'}
          </button>
        </div>
        
        {/* Agency selector dropdown */}
        {showAgencySelector && (
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <div className="text-xs text-gray-500 mb-2">
              Select up to 10 agencies to compare ({selectedAgenciesForChart.length}/10 selected)
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {allAgencies.map((agency, i) => {
                const isSelected = selectedAgenciesForChart.includes(agency.name);
                const colorIndex = selectedAgenciesForChart.indexOf(agency.name);
                return (
                  <button
                    key={agency.name}
                    onClick={() => toggleAgencySelection(agency.name)}
                    disabled={!isSelected && selectedAgenciesForChart.length >= 10}
                    className={`px-2 py-1 text-[10px] rounded-full flex items-center gap-1 transition-colors ${
                      isSelected 
                        ? 'text-white' 
                        : selectedAgenciesForChart.length >= 10
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    style={isSelected ? { backgroundColor: agencyColors[colorIndex % agencyColors.length] } : {}}
                  >
                    {agency.name}
                    <span className="opacity-70">({agency.count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        
        <div className="p-4">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hiringVolumeOverTime} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  {selectedAgenciesForChart.map((agency, i) => (
                    <linearGradient key={agency} id={`color-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={agencyColors[i % agencyColors.length]} stopOpacity={0.6}/>
                      <stop offset="95%" stopColor={agencyColors[i % agencyColors.length]} stopOpacity={0.1}/>
                    </linearGradient>
                  ))}
                  <linearGradient id="colorOthers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9CA3AF" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#9CA3AF" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis 
                  dataKey="period" 
                  tick={{ fontSize: 10, fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#6B7280' }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: '11px',
                    padding: '8px 12px'
                  }}
                  formatter={(value: number, name: string) => [`${value} jobs`, name]}
                  labelFormatter={(label) => `Week of ${label}`}
                />
                {/* Render stacked areas in reverse order so first agency is on top */}
                <Area 
                  type="monotone" 
                  dataKey="Others" 
                  stackId="1"
                  stroke="#9CA3AF" 
                  strokeWidth={0}
                  fill="url(#colorOthers)" 
                  name="Others"
                />
                {[...selectedAgenciesForChart].reverse().map((agency, i) => {
                  const colorIndex = selectedAgenciesForChart.length - 1 - i;
                  return (
                    <Area 
                      key={agency}
                      type="monotone" 
                      dataKey={agency} 
                      stackId="1"
                      stroke={agencyColors[colorIndex % agencyColors.length]} 
                      strokeWidth={1}
                      fill={`url(#color-${colorIndex})`}
                      name={agency}
                    />
                  );
                })}
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-[10px] text-gray-600">
            {selectedAgenciesForChart.map((agency, i) => (
              <div key={agency} className="flex items-center gap-1">
                <div 
                  className="w-3 h-2 rounded-sm"
                  style={{ backgroundColor: agencyColors[i % agencyColors.length] }}
                />
                <span>{agency}</span>
              </div>
            ))}
            <div className="flex items-center gap-1">
              <div className="w-3 h-2 rounded-sm bg-gray-400" />
              <span>Others</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: CATEGORY SHIFTS */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2">
          <Target className="h-4 w-4 text-purple-500" />
          <span className="text-sm font-semibold text-gray-800">Category Shifts</span>
          <span className="text-[10px] text-gray-400 ml-auto">What's moving</span>
        </div>
        
        <div className="p-4">
          <div className="mb-4 px-3 py-2 bg-gray-50 rounded-lg text-xs">
            <span className="text-gray-600">Market concentration: </span>
            <span className="font-semibold text-gray-800">Top 3 categories = {categoryShifts.concentration.toFixed(0)}% of jobs</span>
            <TrendIndicator value={categoryShifts.concentration - categoryShifts.prevConcentration} suffix="pp" size="sm" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                <span className="text-xs font-semibold text-gray-700">Heating Up</span>
              </div>
                  {categoryShifts.growing.length > 0 ? (
                <div className="space-y-2">
                  {categoryShifts.growing.map(cat => {
                    const catInfo = getCategoryInfo(cat.category);
                    return (
                      <div key={cat.category} className="bg-green-50 rounded-lg p-2.5 border border-green-100">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: catInfo.color }} />
                            <span className="text-xs font-medium text-gray-800 leading-tight">{catInfo.name.length > 25 ? catInfo.name.slice(0, 25) + '...' : catInfo.name}</span>
                          </div>
                          <TrendIndicator value={cat.change} size="sm" />
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-gray-500">{cat.current} jobs (was {cat.previous})</span>
                          {cat.topAgency && <span className="text-gray-400">Led by: {cat.topAgency}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic p-2">No significant growth detected</p>
              )}
            </div>
            
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                <span className="text-xs font-semibold text-gray-700">Cooling Down</span>
              </div>
              {categoryShifts.declining.length > 0 ? (
                <div className="space-y-2">
                  {categoryShifts.declining.map(cat => {
                    const catInfo = getCategoryInfo(cat.category);
                    return (
                      <div key={cat.category} className="bg-red-50 rounded-lg p-2.5 border border-red-100">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: catInfo.color }} />
                            <span className="text-xs font-medium text-gray-800 leading-tight">{catInfo.name.length > 25 ? catInfo.name.slice(0, 25) + '...' : catInfo.name}</span>
                          </div>
                          <TrendIndicator value={cat.change} size="sm" />
                        </div>
                        <div className="text-[10px] text-gray-500">{cat.current} jobs (was {cat.previous})</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic p-2">No significant decline detected</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: WORKFORCE EVOLUTION */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2">
          <Users className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-semibold text-gray-800">Workforce Evolution</span>
          <span className="text-[10px] text-gray-400 ml-auto">How composition is shifting</span>
        </div>
        
        <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="border border-gray-100 rounded-lg p-3">
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Seniority Mix</div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Senior+ (P5/D1+)</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-800">{workforceEvolution.seniority.current.senior.toFixed(0)}%</span>
                  <TrendIndicator value={workforceEvolution.seniority.current.senior - workforceEvolution.seniority.previous.senior} suffix="pp" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Mid-level (P3-P4)</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-800">{workforceEvolution.seniority.current.mid.toFixed(0)}%</span>
                  <TrendIndicator value={workforceEvolution.seniority.current.mid - workforceEvolution.seniority.previous.mid} suffix="pp" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Entry (P1-P2/G/NO)</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-800">{workforceEvolution.seniority.current.entry.toFixed(0)}%</span>
                  <TrendIndicator value={workforceEvolution.seniority.current.entry - workforceEvolution.seniority.previous.entry} suffix="pp" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="border border-gray-100 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Employment Model</div>
              <MiniSparkline data={workforceTrendData.staffTrend} color="blue" width={56} height={24} />
            </div>
            <div className="space-y-2">
              {/* Stacked progress bar */}
              <div className="w-full h-3 rounded-full overflow-hidden flex bg-gray-100">
                <div 
                  className="bg-blue-500 h-full transition-all duration-300 relative" 
                  style={{ width: `${workforceEvolution.staffRate.current}%` }}
                  title="Staff positions"
                >
                  {workforceEvolution.staffRate.current > 15 && (
                    <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white">Staff</span>
                  )}
                </div>
                <div 
                  className="bg-amber-400 h-full transition-all duration-300 relative" 
                  style={{ width: `${100 - workforceEvolution.staffRate.current}%` }}
                  title="Consultants"
                >
                  {(100 - workforceEvolution.staffRate.current) > 15 && (
                    <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-amber-900">Consult</span>
                  )}
                </div>
              </div>
              {/* Values row */}
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-blue-500"></span>
                  <span className="text-gray-600">Staff</span>
                  <span className="font-semibold text-gray-800">{workforceEvolution.staffRate.current.toFixed(0)}%</span>
                  <TrendIndicator value={workforceEvolution.staffRate.current - workforceEvolution.staffRate.previous} suffix="pp" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-amber-400"></span>
                  <span className="text-gray-600">Consult</span>
                  <span className="font-semibold text-gray-800">{(100 - workforceEvolution.staffRate.current).toFixed(0)}%</span>
                  <TrendIndicator value={(100 - workforceEvolution.staffRate.current) - (100 - workforceEvolution.staffRate.previous)} suffix="pp" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="border border-gray-100 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Location Model</div>
              <MiniSparkline data={workforceTrendData.remoteTrend} color="auto" width={56} height={24} />
            </div>
            <div className="space-y-2">
              {/* Location breakdown bar */}
              <div className="w-full h-3 rounded-full overflow-hidden flex bg-gray-100">
                <div 
                  className="bg-emerald-500 h-full transition-all duration-300" 
                  style={{ width: `${workforceEvolution.locationBreakdown.current.field}%` }}
                  title={`Field: ${workforceEvolution.locationBreakdown.current.field.toFixed(0)}%`}
                />
                <div 
                  className="bg-blue-500 h-full transition-all duration-300" 
                  style={{ width: `${workforceEvolution.locationBreakdown.current.hq}%` }}
                  title={`HQ: ${workforceEvolution.locationBreakdown.current.hq.toFixed(0)}%`}
                />
                <div 
                  className="bg-violet-400 h-full transition-all duration-300" 
                  style={{ width: `${workforceEvolution.locationBreakdown.current.remote}%` }}
                  title={`Remote: ${workforceEvolution.locationBreakdown.current.remote.toFixed(0)}%`}
                />
              </div>
              {/* Breakdown values */}
              <div className="grid grid-cols-3 gap-1 text-[10px]">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-emerald-500"></span>
                  <span className="text-gray-600">Field</span>
                  <span className="font-semibold text-gray-800">{workforceEvolution.locationBreakdown.current.field.toFixed(0)}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-blue-500"></span>
                  <span className="text-gray-600">HQ</span>
                  <span className="font-semibold text-gray-800">{workforceEvolution.locationBreakdown.current.hq.toFixed(0)}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-violet-400"></span>
                  <span className="text-gray-600">Remote</span>
                  <span className="font-semibold text-gray-800">{workforceEvolution.locationBreakdown.current.remote.toFixed(0)}%</span>
                </div>
              </div>
              {/* Remote trend highlight */}
              <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                <span className="text-[10px] text-gray-500">Remote trend</span>
                <TrendIndicator value={workforceEvolution.remoteRate.current - workforceEvolution.remoteRate.previous} suffix="pp" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: COMPETITIVE DYNAMICS */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-semibold text-gray-800">Competitive Dynamics</span>
          <span className="text-[10px] text-gray-400 ml-auto">Agency movements</span>
        </div>
        
        <div className="p-4">
          <div className="mb-4 flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-xs">
            <div>
              <span className="text-gray-600">Market leader: </span>
              <span className="font-semibold text-gray-800">{competitiveDynamics.leader?.name || 'N/A'} ({competitiveDynamics.leader?.share.toFixed(1) || 0}%)</span>
            </div>
            <div>
              <span className="text-gray-600">Top 5 concentration: </span>
              <span className="font-semibold text-gray-800">{competitiveDynamics.concentration.current.toFixed(0)}%</span>
              <TrendIndicator value={competitiveDynamics.concentration.current - competitiveDynamics.concentration.previous} suffix="pp" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                <span className="text-xs font-semibold text-gray-700">Scaling Up</span>
              </div>
              {competitiveDynamics.scalingUp.length > 0 ? (
                <div className="space-y-1.5">
                  {competitiveDynamics.scalingUp.map((agency, i) => (
                    <div key={agency.agency} className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded bg-green-100 text-green-700 text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                        <span className="text-xs text-gray-700 truncate max-w-[120px]">{agency.agency}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500">+{agency.absoluteChange} jobs</span>
                        <TrendIndicator value={agency.change} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic p-2">No significant scaling up</p>
              )}
            </div>
            
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                <span className="text-xs font-semibold text-gray-700">Scaling Down</span>
              </div>
              {competitiveDynamics.scalingDown.length > 0 ? (
                <div className="space-y-1.5">
                  {competitiveDynamics.scalingDown.map((agency, i) => (
                    <div key={agency.agency} className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded bg-red-100 text-red-700 text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                        <span className="text-xs text-gray-700 truncate max-w-[120px]">{agency.agency}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500">{agency.absoluteChange} jobs</span>
                        <TrendIndicator value={agency.change} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic p-2">No significant scaling down</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5: ALERTS */}
      {marketAlerts.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-semibold text-gray-800">Insights & Alerts</span>
          </div>
          
          <div className="p-3 space-y-2">
            {marketAlerts.map((alert, i) => (
              <div key={i} className={`flex items-start gap-2 px-3 py-2 rounded-lg text-xs ${
                alert.type === 'warning' ? 'bg-amber-50 border border-amber-200 text-amber-800'
                : alert.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-blue-50 border border-blue-200 text-blue-800'
              }`}>
                {alert.type === 'warning' ? <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                 : alert.type === 'success' ? <TrendingUp className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                 : <Eye className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />}
                <span>{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {periodData.previous.length < 10 && (
        <div className="text-xs text-gray-400 text-center py-2">
          ⚠️ Limited historical data for comparison period ({periodData.previous.length} jobs). Trends will become more accurate as data accumulates.
        </div>
      )}
    </div>
  );
};

export default MarketIntelligence;
