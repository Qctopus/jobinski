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

import React, { useState, useMemo } from 'react';
import { 
  Users, Building2, MapPin, TrendingUp, Info, 
  ChevronDown, ChevronUp, Briefcase, Globe, BarChart3, 
  PieChart as PieChartIcon
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
import WorkforceInsightsPanel from './workforce/WorkforceInsightsPanel';
// TimeComparisonSelector removed - now using global time filter

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
  const [expandedSection, setExpandedSection] = useState<string | null>('pyramid');
  
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
  
  // Calculate all analytics
  const pyramidData = useMemo(() => 
    analyzer.calculatePyramid(data, isAgencyView ? selectedAgencyName : undefined),
    [analyzer, data, isAgencyView, selectedAgencyName]
  );
  
  const marketPyramidData = useMemo(() => 
    isAgencyView ? analyzer.calculatePyramid(data) : null,
    [analyzer, data, isAgencyView]
  );
  
  const gradeCategoryMatrix = useMemo(() => 
    analyzer.calculateGradeCategoryMatrix(data, isAgencyView ? selectedAgencyName : undefined),
    [analyzer, data, isAgencyView, selectedAgencyName]
  );
  
  const gradeGeography = useMemo(() => 
    analyzer.calculateGradeGeography(data, isAgencyView ? selectedAgencyName : undefined),
    [analyzer, data, isAgencyView, selectedAgencyName]
  );
  
  const agencyFingerprints = useMemo(() => 
    analyzer.calculateAgencyFingerprints(data),
    [analyzer, data]
  );
  
  const staffNonStaffData = useMemo(() => 
    analyzer.calculateStaffNonStaffAnalysis(data, isAgencyView ? selectedAgencyName : undefined),
    [analyzer, data, isAgencyView, selectedAgencyName]
  );
  
  const evolutionData = useMemo(() => 
    analyzer.calculateWorkforceEvolution(data, evolutionPeriod, isAgencyView ? selectedAgencyName : undefined),
    [analyzer, data, evolutionPeriod, isAgencyView, selectedAgencyName]
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
      isAgencyView ? filteredData : data,
      isAgencyView ? selectedAgencyName : undefined,
      isAgencyView ? data : undefined
    ),
    [analyzer, data, filteredData, isAgencyView, selectedAgencyName]
  );
  
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Calculate field ratio for metrics
  const fieldPositions = gradeGeography.find(g => g.locationType === 'Field')?.totalCount || 0;
  const fieldPercentage = pyramidData.totalPositions > 0 
    ? (fieldPositions / pyramidData.totalPositions * 100) 
    : 0;

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
              Analyzing {pyramidData.totalPositions.toLocaleString()} positions
            </span>
          </div>
        </div>
        
      </div>
      
      {/* Period Context - now controlled by global filter */}
      <div className="text-xs text-gray-500 flex items-center gap-4 px-1">
        <span>{pyramidData.totalPositions.toLocaleString()} positions</span>
        <span>•</span>
        <span><span className="font-medium text-gray-500">Trends compare to:</span> {periodLabels.previous}</span>
      </div>
      
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Staff Positions"
          value={`${pyramidData.staffPercentage.toFixed(0)}%`}
          subtext={`${pyramidData.staffPositions.toLocaleString()} positions`}
          icon={<Users className="h-4 w-4" />}
          color="blue"
        />
        <MetricCard
          label="Non-Staff"
          value={`${pyramidData.nonStaffPercentage.toFixed(0)}%`}
          subtext={`${pyramidData.nonStaffPositions.toLocaleString()} positions`}
          icon={<Briefcase className="h-4 w-4" />}
          color={pyramidData.nonStaffPercentage > 40 ? 'orange' : 'green'}
        />
        <MetricCard
          label="Field Positions"
          value={fieldPositions.toLocaleString()}
          subtext={`${fieldPercentage.toFixed(0)}% of total`}
          icon={<Globe className="h-4 w-4" />}
          color="green"
        />
        <MetricCard
          label="Categories"
          value={gradeCategoryMatrix.categories.length.toString()}
          subtext="Functional areas"
          icon={<BarChart3 className="h-4 w-4" />}
          color="purple"
        />
      </div>
      
      {/* Section 1: Workforce Pyramid */}
      <CollapsibleSection
        title="Workforce Population Pyramid"
        subtitle="How workforce structure is evolving over time - compare current vs previous period"
        icon={<PieChartIcon className="h-4 w-4" />}
        isExpanded={expandedSection === 'pyramid'}
        onToggle={() => toggleSection('pyramid')}
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
      </CollapsibleSection>
      
      {/* Section 2: Grade × Category Matrix */}
      <CollapsibleSection
        title="Grade × Category Heatmap"
        subtitle="Which grades are being hired for which functional areas"
        icon={<BarChart3 className="h-4 w-4" />}
        isExpanded={expandedSection === 'matrix'}
        onToggle={() => toggleSection('matrix')}
      >
        <GradeCategoryHeatmap data={gradeCategoryMatrix} />
      </CollapsibleSection>
      
      {/* Section 3: Grade × Geography */}
      <CollapsibleSection
        title="Grade × Geography"
        subtitle="Where different grade levels are being placed"
        icon={<MapPin className="h-4 w-4" />}
        isExpanded={expandedSection === 'geography'}
        onToggle={() => toggleSection('geography')}
      >
        <GradeGeographyChart data={gradeGeography} />
      </CollapsibleSection>
      
      {/* Section 4: Agency Fingerprints (System view only) */}
      {!isAgencyView && (
        <CollapsibleSection
          title="Agency Workforce Fingerprints"
          subtitle="Compare how different agencies structure their workforce"
          icon={<Building2 className="h-4 w-4" />}
          isExpanded={expandedSection === 'fingerprints'}
          onToggle={() => toggleSection('fingerprints')}
        >
          <AgencyFingerprints data={agencyFingerprints} />
        </CollapsibleSection>
      )}
      
      {/* Section 5: Staff vs Non-Staff */}
      <CollapsibleSection
        title="Staff vs Non-Staff Analysis"
        subtitle="Balance between permanent staff and flexible workforce"
        icon={<Briefcase className="h-4 w-4" />}
        isExpanded={expandedSection === 'staffmix'}
        onToggle={() => toggleSection('staffmix')}
      >
        <StaffNonStaffAnalysis data={staffNonStaffData} />
      </CollapsibleSection>
      
      {/* Section 6: Evolution Over Time */}
      <CollapsibleSection
        title="Workforce Evolution"
        subtitle={`How structure is changing (${evolutionPeriod === '4weeks' ? '4 weeks' : evolutionPeriod === '8weeks' ? '8 weeks' : '3 months'} comparison)`}
        icon={<TrendingUp className="h-4 w-4" />}
        isExpanded={expandedSection === 'evolution'}
        onToggle={() => toggleSection('evolution')}
      >
        <WorkforceEvolutionChart data={evolutionData} />
      </CollapsibleSection>
      
      {/* Section 7: Strategic Insights */}
      <WorkforceInsightsPanel 
        insights={insights}
        isAgencyView={isAgencyView}
        agencyName={selectedAgencyName}
      />
    </div>
  );
};

// Helper Components

interface MetricCardProps {
  label: string;
  value: string;
  subtext: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red';
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, subtext, icon, color }) => {
  const iconColorClasses = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    orange: 'text-orange-500',
    purple: 'text-purple-500',
    red: 'text-red-500'
  };
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <div className="flex items-center gap-2 mb-1">
        <span className={iconColorClasses[color]}>{icon}</span>
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>
      <div className="text-lg font-bold text-gray-900">{value}</div>
      <div className="text-[10px] text-gray-400 mt-0.5">{subtext}</div>
    </div>
  );
};

interface CollapsibleSectionProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title, subtitle, icon, isExpanded, onToggle, children
}) => (
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <span className="text-gray-500">{icon}</span>
        <div className="text-left">
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
      {isExpanded ? (
        <ChevronUp className="h-4 w-4 text-gray-400" />
      ) : (
        <ChevronDown className="h-4 w-4 text-gray-400" />
      )}
    </button>
    {isExpanded && (
      <div className="p-4 border-t border-gray-100">
        {children}
      </div>
    )}
  </div>
);

export default WorkforceStructure;

