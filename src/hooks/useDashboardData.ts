import { useMemo } from 'react';
import { ProcessedJobData, FilterOptions } from '../types';
import { JobAnalyticsProcessor } from '../services/dataProcessor';

export interface DashboardDataHook {
  processor: JobAnalyticsProcessor;
  isAgencyView: boolean;
  selectedAgencyName: string;
  filteredData: ProcessedJobData[];
  marketData: ProcessedJobData[];
  metrics: ReturnType<JobAnalyticsProcessor['calculateDashboardMetrics']>;
  marketMetrics: ReturnType<JobAnalyticsProcessor['calculateDashboardMetrics']>;
}

export const useDashboardData = (
  data: ProcessedJobData[],
  filters: FilterOptions
): DashboardDataHook => {
  const processor = useMemo(() => new JobAnalyticsProcessor(), []);

  const isAgencyView = filters.selectedAgency !== 'all';
  const selectedAgencyName = filters.selectedAgency;

  const filteredData = useMemo(() => {
    return processor.applyFilters(data, filters);
  }, [data, filters, processor]);

  const marketData = useMemo(() => {
    return processor.applyFilters(data, { 
      selectedAgency: 'all', 
      timeRange: filters.timeRange 
    });
  }, [data, filters.timeRange, processor]);

  const metrics = useMemo(() => {
    return processor.calculateDashboardMetrics(data, filters);
  }, [data, filters, processor]);

  const marketMetrics = useMemo(() => {
    return processor.calculateDashboardMetrics(data, { 
      selectedAgency: 'all', 
      timeRange: filters.timeRange 
    });
  }, [data, filters.timeRange, processor]);

  return {
    processor,
    isAgencyView,
    selectedAgencyName,
    filteredData,
    marketData,
    metrics,
    marketMetrics
  };
};
