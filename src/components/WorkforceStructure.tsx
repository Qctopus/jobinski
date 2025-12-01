/**
 * Workforce Structure Tab - Complete Redesign
 * 
 * Provides UN HR management with deep insights into organizational shape,
 * grade distribution, geographic placement, and workforce evolution.
 * 
 * Core Philosophy: Job postings are a leading indicator of workforce structure.
 * By analyzing what positions organizations are recruiting for, we can understand
 * how the workforce is evolving.
 */

import React, { useMemo } from 'react';
import { 
  Users, Building2, MapPin, TrendingUp, AlertTriangle, 
  Briefcase, Globe, BarChart3, 
  PieChart as PieChartIcon, ArrowUp, ArrowDown
} from 'lucide-react';
import { ProcessedJobData, FilterOptions } from '../types';
import { useDashboardData } from '../hooks/useDashboardData';
import WorkforceStructureAnalyzer from '../services/analytics/WorkforceStructureAnalyzer';
import { getAgencyLogo } from '../utils/agencyLogos';

// Sub-components
import WorkforcePyramid from './workforce/WorkforcePyramid';
import GradeCategoryHeatmap from './workforce/GradeCategoryHeatmap';
import GradeGeographyChart from './workforce/GradeGeographyChart';
import AgencyFingerprints from './workforce/AgencyFingerprints';
import StaffNonStaffAnalysis from './workforce/StaffNonStaffAnalysis';
import WorkforceEvolutionChart from './workforce/WorkforceEvolutionChart';
// WorkforceInsightsPanel removed - insights now integrated into metric cards

interface WorkforceStructureProps {
  data: ProcessedJobData[];
  filters: FilterOptions;
}

// Map global timeRange to evolution period format
const mapTimeRangeToEvolutionPeriod = (timeRange: FilterOptions['timeRange']): '4weeks' | '8weeks' | '3months' => {
  switch (timeRange) {
    case '4weeks': return '4weeks';
    case '8weeks': return '8weeks';
    default: return '3months'; // For 3months, 6months, 1year, all
  }
};

const WorkforceStructure: React.FC<WorkforceStructureProps> = ({ data, filters }) => {
  // Map global timeRange to evolution comparison format
  const evolutionPeriod = mapTimeRangeToEvolutionPeriod(filters.timeRange);
  
  const {
    isAgencyView,
    selectedAgencyName,
    filteredData,
    marketData
  } = useDashboardData(data, filters);
  
  // Initialize analyzer
  const analyzer = useMemo(() => new WorkforceStructureAnalyzer(), []);
  
  // Use filtered data (time-filtered) for all calculations
  // For agency view: filteredData contains agency-specific data
  // For market view: marketData contains all data (already time-filtered by useDashboardData)
  const timeFilteredData = isAgencyView ? filteredData : marketData;
  
  // Calculate all analytics using time-filtered data
  const pyramidData = useMemo(() => 
    analyzer.calculatePyramid(timeFilteredData, isAgencyView ? selectedAgencyName : undefined),
    [analyzer, timeFilteredData, isAgencyView, selectedAgencyName]
  );
  
  const marketPyramidData = useMemo(() => 
    isAgencyView ? analyzer.calculatePyramid(marketData) : null,
    [analyzer, marketData, isAgencyView]
  );
  
  const gradeCategoryMatrix = useMemo(() => 
    analyzer.calculateGradeCategoryMatrix(timeFilteredData, isAgencyView ? selectedAgencyName : undefined),
    [analyzer, timeFilteredData, isAgencyView, selectedAgencyName]
  );
  
  const gradeGeography = useMemo(() => 
    analyzer.calculateGradeGeography(timeFilteredData, isAgencyView ? selectedAgencyName : undefined),
    [analyzer, timeFilteredData, isAgencyView, selectedAgencyName]
  );
  
  // Agency fingerprints should use marketData (time-filtered market data)
  const agencyFingerprints = useMemo(() => 
    analyzer.calculateAgencyFingerprints(marketData),
    [analyzer, marketData]
  );
  
  const staffNonStaffData = useMemo(() => 
    analyzer.calculateStaffNonStaffAnalysis(timeFilteredData, isAgencyView ? selectedAgencyName : undefined),
    [analyzer, timeFilteredData, isAgencyView, selectedAgencyName]
  );
  
  const evolutionData = useMemo(() => 
    analyzer.calculateWorkforceEvolution(timeFilteredData, evolutionPeriod, isAgencyView ? selectedAgencyName : undefined),
    [analyzer, timeFilteredData, evolutionPeriod, isAgencyView, selectedAgencyName]
  );
  
  // Extract current and previous period pyramid data for comparison
  const currentPeriodPyramid = useMemo(() => {
    const currentPeriod = evolutionData.periods.find(p => p.period === 'Current');
    return currentPeriod?.pyramidData || pyramidData;
  }, [evolutionData, pyramidData]);
  
  const previousPeriodPyramid = useMemo(() => {
    const previousPeriod = evolutionData.periods.find(p => p.period === 'Previous');
    return previousPeriod?.pyramidData || null;
  }, [evolutionData]);
  
  // Period labels for the pyramid
  const periodLabels = useMemo(() => {
    const currentPeriod = evolutionData.periods.find(p => p.period === 'Current');
    const previousPeriod = evolutionData.periods.find(p => p.period === 'Previous');
    
    const formatPeriod = (start: Date, end: Date) => {
      const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${formatDate(start)} - ${formatDate(end)}`;
    };
    
    return {
      current: currentPeriod ? formatPeriod(currentPeriod.startDate, currentPeriod.endDate) : 'Current Period',
      previous: previousPeriod ? formatPeriod(previousPeriod.startDate, previousPeriod.endDate) : 'Previous Period'
    };
  }, [evolutionData]);
  
  const insights = useMemo(() => 
    analyzer.generateInsights(
      timeFilteredData,
      isAgencyView ? selectedAgencyName : undefined,
      isAgencyView ? marketData : undefined
    ),
    [analyzer, timeFilteredData, marketData, isAgencyView, selectedAgencyName]
  );

  // Calculate field ratio for metrics
  const fieldPositions = gradeGeography.find(g => g.locationType === 'Field')?.totalCount || 0;
  const fieldPercentage = pyramidData.totalPositions > 0 
    ? (fieldPositions / pyramidData.totalPositions * 100) 
    : 0;

  // Get high-impact insights for metric cards
  const highImpactInsights = insights.filter(i => i.impact === 'high');
  const staffInsight = insights.find(i => i.title.toLowerCase().includes('staff') || i.title.toLowerCase().includes('non-staff'));
  const entryInsight = insights.find(i => i.title.toLowerCase().includes('entry') || i.title.toLowerCase().includes('pipeline'));

  return (
    <div className="space-y-4">
      {/* Header - Matching Intelligence tab style */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isAgencyView ? (
            getAgencyLogo(selectedAgencyName) ? (
              <img src={getAgencyLogo(selectedAgencyName)!} alt={selectedAgencyName} className="h-5 w-5 object-contain" />
            ) : (
              <Users className="h-4 w-4 text-blue-600" />
            )
          ) : (
            <img src="/logo/logo/United_Nations.png" alt="UN System" className="h-5 w-5 object-contain" />
          )}
          <div>
            <span className="text-sm font-semibold text-gray-800">
              {isAgencyView ? `${selectedAgencyName} Workforce Structure` : 'UN System Workforce Structure'}
            </span>
            <span className="text-xs text-gray-500 ml-2">
              {pyramidData.totalPositions.toLocaleString()} positions
            </span>
          </div>
        </div>
        {highImpactInsights.length > 0 && (
          <div className="flex items-center gap-1.5 text-amber-600">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs font-medium">{highImpactInsights.length} insight{highImpactInsights.length > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>
      
      {/* Key Metrics Cards with Integrated Insights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCardWithInsight
          label="Staff Ratio"
          value={`${pyramidData.staffPercentage.toFixed(0)}%`}
          subtext={`${pyramidData.staffPositions.toLocaleString()} staff positions`}
          icon={<Users className="h-4 w-4" />}
          color="blue"
          trend={evolutionData.shifts.find(s => s.type === 'Staff Mix')?.direction}
          insight={pyramidData.nonStaffPercentage > 50 ? 'High non-staff dependency' : undefined}
          insightType={pyramidData.nonStaffPercentage > 50 ? 'warning' : undefined}
        />
        <MetricCardWithInsight
          label="Non-Staff"
          value={`${pyramidData.nonStaffPercentage.toFixed(0)}%`}
          subtext={`${pyramidData.nonStaffPositions.toLocaleString()} consultants/interns`}
          icon={<Briefcase className="h-4 w-4" />}
          color={pyramidData.nonStaffPercentage > 40 ? 'orange' : 'green'}
          trend={evolutionData.shifts.find(s => s.type === 'Staff Mix')?.direction === 'up' ? 'down' : 'up'}
          insight={staffInsight?.title}
          insightType={staffInsight?.impact === 'high' ? 'warning' : 'info'}
        />
        <MetricCardWithInsight
          label="Field Deployment"
          value={`${fieldPercentage.toFixed(0)}%`}
          subtext={`${fieldPositions.toLocaleString()} field positions`}
          icon={<Globe className="h-4 w-4" />}
          color="green"
          trend={evolutionData.shifts.find(s => s.type === 'Geographic')?.direction}
          insight={fieldPercentage > 60 ? 'Strong field presence' : undefined}
          insightType="info"
        />
        <MetricCardWithInsight
          label="Entry Pipeline"
          value={`${((pyramidData.pyramid.find(t => t.tier === 'Entry Professional')?.count || 0) / pyramidData.totalPositions * 100).toFixed(0)}%`}
          subtext="Entry-level positions"
          icon={<BarChart3 className="h-4 w-4" />}
          color="purple"
          insight={entryInsight?.title}
          insightType={entryInsight?.impact === 'high' ? 'warning' : 'info'}
        />
      </div>
      
      {/* Section 1: Workforce Pyramid */}
      <Section
        title="Workforce Population Pyramid"
        subtitle="How workforce structure is evolving over time - compare current vs previous period"
        icon={<PieChartIcon className="h-4 w-4" />}
      >
        <WorkforcePyramid 
          data={currentPeriodPyramid}
          marketData={marketPyramidData}
          isAgencyView={isAgencyView}
          agencyName={selectedAgencyName}
          previousPeriodData={previousPeriodPyramid}
          currentPeriodLabel={periodLabels.current}
          previousPeriodLabel={periodLabels.previous}
        />
      </Section>
      
      {/* Section 2: Grade × Category Matrix */}
      <Section
        title="Grade × Category Heatmap"
        subtitle="Which grades are being hired for which functional areas"
        icon={<BarChart3 className="h-4 w-4" />}
      >
        <GradeCategoryHeatmap data={gradeCategoryMatrix} />
      </Section>
      
      {/* Section 3: Grade × Geography */}
      <Section
        title="Grade × Geography"
        subtitle="Where different grade levels are being placed"
        icon={<MapPin className="h-4 w-4" />}
      >
        <GradeGeographyChart data={gradeGeography} />
      </Section>
      
      {/* Section 4: Agency Fingerprints (System view only) */}
      {!isAgencyView && (
        <Section
          title="Agency Workforce Fingerprints"
          subtitle="Compare how different agencies structure their workforce"
          icon={<Building2 className="h-4 w-4" />}
        >
          <AgencyFingerprints data={agencyFingerprints} />
        </Section>
      )}
      
      {/* Section 5: Staff vs Non-Staff */}
      <Section
        title="Staff vs Non-Staff Analysis"
        subtitle="Balance between permanent staff and flexible workforce"
        icon={<Briefcase className="h-4 w-4" />}
      >
        <StaffNonStaffAnalysis data={staffNonStaffData} />
      </Section>
      
      {/* Section 6: Evolution Over Time */}
      <Section
        title="Workforce Evolution"
        subtitle={`How structure is changing (${evolutionPeriod === '4weeks' ? '4 weeks' : evolutionPeriod === '8weeks' ? '8 weeks' : '3 months'} comparison)`}
        icon={<TrendingUp className="h-4 w-4" />}
      >
        <WorkforceEvolutionChart data={evolutionData} />
      </Section>
      
    </div>
  );
};

// Helper Components

interface MetricCardWithInsightProps {
  label: string;
  value: string;
  subtext: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red';
  trend?: 'up' | 'down';
  insight?: string;
  insightType?: 'warning' | 'info';
}

const MetricCardWithInsight: React.FC<MetricCardWithInsightProps> = ({ 
  label, value, subtext, icon, color, trend, insight, insightType 
}) => {
  const colorClasses = {
    blue: { icon: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
    green: { icon: 'text-green-500', bg: 'bg-green-50', border: 'border-green-100' },
    orange: { icon: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-100' },
    purple: { icon: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-100' },
    red: { icon: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' }
  };
  
  return (
    <div className={`rounded-lg border p-3 ${colorClasses[color].bg} ${colorClasses[color].border}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className={colorClasses[color].icon}>{icon}</span>
          <span className="text-xs font-medium text-gray-600">{label}</span>
        </div>
        {trend && (
          <span className={`flex items-center ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
            {trend === 'up' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          </span>
        )}
      </div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
      <div className="text-[10px] text-gray-500 mt-0.5">{subtext}</div>
      {insight && (
        <div className={`mt-2 text-[10px] px-2 py-1 rounded ${
          insightType === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {insight}
        </div>
      )}
    </div>
  );
};

interface SectionProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({
  title, subtitle, icon, children
}) => (
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
    <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-100 bg-gray-50/50">
      <span className="text-gray-500">{icon}</span>
      <div>
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
    </div>
    <div className="p-4">
      {children}
    </div>
  </div>
);

export default WorkforceStructure;

