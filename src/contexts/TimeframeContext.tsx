import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { ProcessedJobData, FilterOptions } from '../types';
import { subMonths, subWeeks, startOfMonth, endOfMonth, format, isAfter, isBefore, parseISO } from 'date-fns';

// Period configuration based on selected timeframe
interface PeriodConfig {
  primaryMonths: number;
  comparisonMonths: number;
  subPeriodType: 'week' | 'month' | 'quarter';
  subPeriodCount: number;
}

const TIMEFRAME_CONFIGS: Record<string, PeriodConfig> = {
  '4weeks': { primaryMonths: 1, comparisonMonths: 1, subPeriodType: 'week', subPeriodCount: 4 },
  '8weeks': { primaryMonths: 2, comparisonMonths: 2, subPeriodType: 'week', subPeriodCount: 4 },
  '3months': { primaryMonths: 3, comparisonMonths: 3, subPeriodType: 'week', subPeriodCount: 4 },
  '6months': { primaryMonths: 6, comparisonMonths: 6, subPeriodType: 'month', subPeriodCount: 6 },
  '1year': { primaryMonths: 12, comparisonMonths: 12, subPeriodType: 'month', subPeriodCount: 6 },
  '2years': { primaryMonths: 24, comparisonMonths: 24, subPeriodType: 'quarter', subPeriodCount: 8 },
  'all': { primaryMonths: 0, comparisonMonths: 0, subPeriodType: 'month', subPeriodCount: 6 }
};

export interface TimePeriod {
  start: Date;
  end: Date;
  label: string;
}

export interface PeriodComparison {
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  hasComparison: boolean;
}

export interface SubPeriodData {
  period: string;
  value: number;
  periodStart: Date;
  periodEnd: Date;
}

interface TimeframeContextType {
  // Current timeframe settings
  timeRange: FilterOptions['timeRange'];
  
  // Calculated periods
  primaryPeriod: TimePeriod;
  comparisonPeriod: TimePeriod | null;
  subPeriods: TimePeriod[];
  
  // Data filtering helpers
  filterToPeriod: (data: ProcessedJobData[], period: TimePeriod) => ProcessedJobData[];
  filterToSubPeriods: (data: ProcessedJobData[]) => SubPeriodData[];
  
  // Comparison calculations
  calculateComparison: (currentValue: number, previousValue: number) => PeriodComparison;
  getMetricComparison: (
    data: ProcessedJobData[],
    metricFn: (jobs: ProcessedJobData[]) => number
  ) => PeriodComparison;
  
  // Period labels
  getPeriodLabel: () => string;
  getComparisonLabel: () => string;
  
  // Check data availability
  hasComparisonData: (data: ProcessedJobData[]) => boolean;
  getDataDateRange: (data: ProcessedJobData[]) => { earliest: Date; latest: Date } | null;
}

const TimeframeContext = createContext<TimeframeContextType | undefined>(undefined);

interface TimeframeProviderProps {
  children: React.ReactNode;
  timeRange: FilterOptions['timeRange'];
}

export const TimeframeProvider: React.FC<TimeframeProviderProps> = ({ children, timeRange }) => {
  const now = useMemo(() => new Date(), []);
  
  // Calculate primary period based on timeframe
  const primaryPeriod = useMemo((): TimePeriod => {
    const config = TIMEFRAME_CONFIGS[timeRange] || TIMEFRAME_CONFIGS['all'];
    
    if (timeRange === 'all') {
      // For "all", we'll use a wide range
      return {
        start: new Date(2020, 0, 1),
        end: now,
        label: 'All Time'
      };
    }
    
    // Handle week-based periods
    if (timeRange === '4weeks') {
      const start = subWeeks(now, 4);
      return {
        start,
        end: now,
        label: 'Last 4 weeks'
      };
    }
    
    if (timeRange === '8weeks') {
      const start = subWeeks(now, 8);
      return {
        start,
        end: now,
        label: 'Last 8 weeks'
      };
    }
    
    const start = subMonths(now, config.primaryMonths);
    return {
      start,
      end: now,
      label: `Last ${config.primaryMonths} months`
    };
  }, [timeRange, now]);
  
  // Calculate comparison period (previous equivalent period)
  const comparisonPeriod = useMemo((): TimePeriod | null => {
    if (timeRange === 'all') return null;
    
    const comparisonEnd = primaryPeriod.start;
    
    // Handle week-based periods
    if (timeRange === '4weeks') {
      const comparisonStart = subWeeks(comparisonEnd, 4);
      return {
        start: comparisonStart,
        end: comparisonEnd,
        label: 'Previous 4 weeks'
      };
    }
    
    if (timeRange === '8weeks') {
      const comparisonStart = subWeeks(comparisonEnd, 8);
      return {
        start: comparisonStart,
        end: comparisonEnd,
        label: 'Previous 8 weeks'
      };
    }
    
    const config = TIMEFRAME_CONFIGS[timeRange];
    const comparisonStart = subMonths(comparisonEnd, config.comparisonMonths);
    
    return {
      start: comparisonStart,
      end: comparisonEnd,
      label: `Previous ${config.comparisonMonths} months`
    };
  }, [timeRange, primaryPeriod]);
  
  // Calculate sub-periods for trend visualization
  const subPeriods = useMemo((): TimePeriod[] => {
    const config = TIMEFRAME_CONFIGS[timeRange] || TIMEFRAME_CONFIGS['6months'];
    const periods: TimePeriod[] = [];
    
    // For limited data, use 4-week periods going back 6 periods
    const periodCount = Math.min(config.subPeriodCount, 6);
    
    for (let i = periodCount - 1; i >= 0; i--) {
      let periodStart: Date;
      let periodEnd: Date;
      let label: string;
      
      if (config.subPeriodType === 'week') {
        periodEnd = subWeeks(now, i * 4);
        periodStart = subWeeks(periodEnd, 4);
        label = format(periodStart, 'MMM d');
      } else if (config.subPeriodType === 'month') {
        periodEnd = endOfMonth(subMonths(now, i));
        periodStart = startOfMonth(subMonths(now, i));
        label = format(periodStart, 'MMM yy');
      } else {
        // Quarter
        periodEnd = endOfMonth(subMonths(now, i * 3));
        periodStart = startOfMonth(subMonths(now, (i + 1) * 3 - 1));
        label = `Q${Math.ceil((12 - i * 3) / 3)}`;
      }
      
      periods.push({ start: periodStart, end: periodEnd, label });
    }
    
    return periods;
  }, [timeRange, now]);
  
  // Filter data to a specific period
  const filterToPeriod = useCallback((data: ProcessedJobData[], period: TimePeriod): ProcessedJobData[] => {
    return data.filter(job => {
      try {
        const postingDate = parseISO(job.posting_date);
        return isAfter(postingDate, period.start) && isBefore(postingDate, period.end);
      } catch {
        return false;
      }
    });
  }, []);
  
  // Get data for each sub-period
  const filterToSubPeriods = useCallback((data: ProcessedJobData[]): SubPeriodData[] => {
    return subPeriods.map(period => ({
      period: period.label,
      value: filterToPeriod(data, period).length,
      periodStart: period.start,
      periodEnd: period.end
    }));
  }, [subPeriods, filterToPeriod]);
  
  // Calculate comparison metrics
  const calculateComparison = useCallback((currentValue: number, previousValue: number): PeriodComparison => {
    const hasComparison = previousValue > 0;
    const change = currentValue - previousValue;
    const changePercent = hasComparison ? (change / previousValue) * 100 : 0;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(changePercent) > 2) {
      trend = changePercent > 0 ? 'up' : 'down';
    }
    
    return {
      current: currentValue,
      previous: previousValue,
      change,
      changePercent,
      trend,
      hasComparison
    };
  }, []);
  
  // Get metric comparison between periods
  const getMetricComparison = useCallback((
    data: ProcessedJobData[],
    metricFn: (jobs: ProcessedJobData[]) => number
  ): PeriodComparison => {
    const currentData = filterToPeriod(data, primaryPeriod);
    const currentValue = metricFn(currentData);
    
    if (!comparisonPeriod) {
      return {
        current: currentValue,
        previous: 0,
        change: 0,
        changePercent: 0,
        trend: 'stable',
        hasComparison: false
      };
    }
    
    const previousData = filterToPeriod(data, comparisonPeriod);
    const previousValue = metricFn(previousData);
    
    return calculateComparison(currentValue, previousValue);
  }, [primaryPeriod, comparisonPeriod, filterToPeriod, calculateComparison]);
  
  // Get human-readable period labels
  const getPeriodLabel = useCallback((): string => {
    if (timeRange === 'all') return 'All available data';
    return `${format(primaryPeriod.start, 'MMM d, yyyy')} - ${format(primaryPeriod.end, 'MMM d, yyyy')}`;
  }, [timeRange, primaryPeriod]);
  
  const getComparisonLabel = useCallback((): string => {
    if (!comparisonPeriod) return '';
    return `vs ${format(comparisonPeriod.start, 'MMM d')} - ${format(comparisonPeriod.end, 'MMM d, yyyy')}`;
  }, [comparisonPeriod]);
  
  // Check if we have data for comparison period
  const hasComparisonData = useCallback((data: ProcessedJobData[]): boolean => {
    if (!comparisonPeriod) return false;
    const previousData = filterToPeriod(data, comparisonPeriod);
    return previousData.length > 0;
  }, [comparisonPeriod, filterToPeriod]);
  
  // Get the date range of available data
  const getDataDateRange = useCallback((data: ProcessedJobData[]): { earliest: Date; latest: Date } | null => {
    if (data.length === 0) return null;
    
    const dates = data
      .map(job => {
        try {
          return parseISO(job.posting_date);
        } catch {
          return null;
        }
      })
      .filter((d): d is Date => d !== null)
      .sort((a, b) => a.getTime() - b.getTime());
    
    if (dates.length === 0) return null;
    
    return {
      earliest: dates[0],
      latest: dates[dates.length - 1]
    };
  }, []);
  
  const contextValue: TimeframeContextType = {
    timeRange,
    primaryPeriod,
    comparisonPeriod,
    subPeriods,
    filterToPeriod,
    filterToSubPeriods,
    calculateComparison,
    getMetricComparison,
    getPeriodLabel,
    getComparisonLabel,
    hasComparisonData,
    getDataDateRange
  };
  
  return (
    <TimeframeContext.Provider value={contextValue}>
      {children}
    </TimeframeContext.Provider>
  );
};

export const useTimeframe = (): TimeframeContextType => {
  const context = useContext(TimeframeContext);
  if (context === undefined) {
    throw new Error('useTimeframe must be used within a TimeframeProvider');
  }
  return context;
};

// Utility hook for common comparison patterns
export const useMetricWithTrend = (
  data: ProcessedJobData[],
  metricFn: (jobs: ProcessedJobData[]) => number
): PeriodComparison => {
  const { getMetricComparison } = useTimeframe();
  return useMemo(() => getMetricComparison(data, metricFn), [data, metricFn, getMetricComparison]);
};





