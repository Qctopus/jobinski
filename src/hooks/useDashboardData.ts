import { useMemo } from 'react';
import { ProcessedJobData, FilterOptions, DashboardMetrics } from '../types';
import { useDataProcessing } from '../contexts/DataProcessingContext';

export interface DashboardDataHook {
  processor: any;
  isAgencyView: boolean;
  selectedAgencyName: string;
  filteredData: ProcessedJobData[];
  marketData: ProcessedJobData[];
  metrics: DashboardMetrics;
  marketMetrics: DashboardMetrics;
}

export const useDashboardData = (
  data: ProcessedJobData[],
  filters: FilterOptions
): DashboardDataHook => {
  const dataProcessing = useDataProcessing();

  const result = useMemo(() => {
    return dataProcessing.processData(data, filters);
  }, [data, filters, dataProcessing]);

  return {
    processor: dataProcessing.processor,
    isAgencyView: result.isAgencyView,
    selectedAgencyName: result.selectedAgencyName,
    filteredData: result.filteredData,
    marketData: result.marketData,
    metrics: result.metrics,
    marketMetrics: result.marketMetrics
  };
};
