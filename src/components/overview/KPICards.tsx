import React from 'react';
import { Briefcase, Users, Award, Target, TrendingUp, Clock, Zap, Globe } from 'lucide-react';
import { PeriodComparison, SubPeriodData } from '../../contexts/TimeframeContext';
import { Sparkline, TrendBadge } from '../ui/TrendIndicators';

interface KPICardData {
  value: number | string;
  label: string;
  icon: React.ReactNode;
  comparison?: PeriodComparison;
  sparklineData?: SubPeriodData[] | number[];
  sublabel?: string;
  benchmark?: { value: number | string; label: string };
  color: 'blue' | 'purple' | 'amber' | 'green' | 'orange' | 'red';
  invertTrend?: boolean;
}

interface KPICardsProps {
  totalJobs: number;
  totalAgencies: number;
  isAgencyView: boolean;
  selectedAgencyName: string;
  agencyMarketShare: number;
  agencyRank: number | null;
  monthOverMonthGrowth: number;
  topCategoryPercentage: number;
  topCategoryName: string;
  medianApplicationWindow: number;
  urgentRate: number;
  // New props for period comparisons
  comparisons?: {
    jobs?: PeriodComparison;
    agencies?: PeriodComparison;
    categories?: PeriodComparison;
    urgentRate?: PeriodComparison;
    seniorRatio?: PeriodComparison;
  };
  sparklineData?: {
    jobs?: SubPeriodData[];
    categories?: SubPeriodData[];
  };
  // Additional metrics for dense display
  additionalMetrics?: {
    seniorRatio?: number;
    avgApplicationWindow?: number;
    topCountry?: string;
    topCountryCount?: number;
    distinctCategories?: number;
    consultantRatio?: number;
  };
}

const KPICards: React.FC<KPICardsProps> = ({
  totalJobs,
  totalAgencies,
  isAgencyView,
  selectedAgencyName,
  agencyMarketShare,
  agencyRank,
  monthOverMonthGrowth,
  topCategoryPercentage,
  topCategoryName,
  medianApplicationWindow,
  urgentRate,
  comparisons,
  sparklineData,
  additionalMetrics
}) => {
  const colorClasses = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', accent: 'text-blue-700' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-600', accent: 'text-purple-700' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600', accent: 'text-amber-700' },
    green: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600', accent: 'text-green-700' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-600', accent: 'text-orange-700' },
    red: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-600', accent: 'text-red-700' },
  };

  // Build KPI cards based on view type
  const kpis: KPICardData[] = isAgencyView ? [
    // Agency View KPIs
    {
      value: totalJobs.toLocaleString(),
      label: 'Positions',
      icon: <Briefcase className="h-4 w-4" />,
      comparison: comparisons?.jobs,
      sparklineData: sparklineData?.jobs,
      sublabel: `${selectedAgencyName.length > 12 ? selectedAgencyName.slice(0, 12) + '...' : selectedAgencyName}`,
      color: 'blue'
    },
    {
      value: `${agencyMarketShare.toFixed(1)}%`,
      label: 'Market Share',
      icon: <Target className="h-4 w-4" />,
      sublabel: agencyRank ? `Rank #${agencyRank}` : undefined,
      benchmark: { value: '5.5%', label: 'avg' },
      color: 'purple'
    },
    {
      value: additionalMetrics?.distinctCategories || Math.round(topCategoryPercentage),
      label: 'Categories',
      icon: <Award className="h-4 w-4" />,
      sublabel: topCategoryName.length > 15 ? topCategoryName.slice(0, 15) + '...' : topCategoryName,
      color: 'amber'
    },
    {
      value: `${medianApplicationWindow}d`,
      label: 'Avg Window',
      icon: <Clock className="h-4 w-4" />,
      sublabel: urgentRate > 20 ? `${Math.round(urgentRate)}% urgent` : 'Normal pace',
      benchmark: { value: '28d', label: 'market' },
      invertTrend: true,
      color: medianApplicationWindow < 21 ? 'green' : medianApplicationWindow > 35 ? 'orange' : 'blue'
    }
  ] : [
    // Market View KPIs
    {
      value: totalJobs.toLocaleString(),
      label: 'Total Positions',
      icon: <Briefcase className="h-4 w-4" />,
      comparison: comparisons?.jobs,
      sparklineData: sparklineData?.jobs,
      sublabel: `${totalAgencies} agencies`,
      color: 'blue'
    },
    {
      value: totalAgencies,
      label: 'Agencies',
      icon: <Users className="h-4 w-4" />,
      comparison: comparisons?.agencies,
      sublabel: 'Active hiring',
      color: 'purple'
    },
    {
      value: `${topCategoryPercentage.toFixed(1)}%`,
      label: 'Top Category',
      icon: <Award className="h-4 w-4" />,
      sublabel: topCategoryName.length > 18 ? topCategoryName.slice(0, 18) + '...' : topCategoryName,
      comparison: comparisons?.categories,
      color: 'amber'
    },
    {
      value: `${Math.round(urgentRate)}%`,
      label: 'Urgent Rate',
      icon: <Zap className="h-4 w-4" />,
      comparison: comparisons?.urgentRate,
      sublabel: '< 14 days',
      invertTrend: true,
      color: urgentRate > 25 ? 'red' : urgentRate > 15 ? 'orange' : 'green'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {kpis.map((kpi, index) => {
        const colors = colorClasses[kpi.color];
        
        return (
          <div 
            key={index} 
            className={`rounded-lg border ${colors.border} ${colors.bg} p-3 transition-all hover:shadow-md`}
          >
            {/* Header row: Icon, Label, Trend */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className={colors.icon}>{kpi.icon}</span>
                <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
                  {kpi.label}
                </span>
              </div>
              {kpi.comparison && (
                <TrendBadge 
                  comparison={kpi.comparison} 
                  size="xs" 
                  invertColors={kpi.invertTrend} 
                />
              )}
            </div>
            
            {/* Value row with sparkline */}
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900 leading-none">
                  {kpi.value}
                </div>
                {kpi.sublabel && (
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    {kpi.sublabel}
                  </div>
                )}
              </div>
              
              {kpi.sparklineData && kpi.sparklineData.length > 1 && (
                <Sparkline 
                  data={kpi.sparklineData} 
                  width={50} 
                  height={22} 
                  color="auto" 
                />
              )}
            </div>
            
            {/* Benchmark row */}
            {kpi.benchmark && (
              <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-gray-200/60">
                <span className="text-[10px] text-gray-500">{kpi.benchmark.label}</span>
                <span className="text-[10px] font-medium text-gray-600">{kpi.benchmark.value}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// EXTENDED KPI STRIP - Secondary metrics row
// ============================================================================

interface ExtendedKPIStripProps {
  metrics: {
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'stable';
    sublabel?: string;
  }[];
}

export const ExtendedKPIStrip: React.FC<ExtendedKPIStripProps> = ({ metrics }) => {
  return (
    <div className="flex items-center gap-4 py-2 px-3 bg-gray-50 rounded-lg overflow-x-auto">
      {metrics.map((metric, index) => (
        <React.Fragment key={index}>
          {index > 0 && <div className="w-px h-6 bg-gray-200 flex-shrink-0" />}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-center">
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold text-gray-900">{metric.value}</span>
                {metric.trend && metric.trend !== 'stable' && (
                  <span className={`text-[10px] ${metric.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                    {metric.trend === 'up' ? '↑' : '↓'}
                  </span>
                )}
              </div>
              <div className="text-[9px] text-gray-500 uppercase tracking-wider whitespace-nowrap">
                {metric.label}
                {metric.sublabel && <span className="text-gray-400 ml-0.5">({metric.sublabel})</span>}
              </div>
            </div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

export default KPICards;
