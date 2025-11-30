/**
 * Geography Intelligence Tab
 * 
 * Provides UN HR management with geographic intelligence including:
 * - Interactive world map with recruitment bubbles
 * - ICSC Hardship classifications
 * - HQ vs Field operational footprint
 * - Regional programme coverage
 * - National Officer localization analysis
 * - Country-level deep dives
 */

import React, { useState, useMemo } from 'react';
import { 
  Globe, MapPin, Building2, Users, TrendingUp, 
  ChevronDown, ChevronUp, AlertTriangle, CheckCircle,
  Info, Flag, Briefcase, BarChart3, ArrowUpRight, ArrowDownRight,
  Map
} from 'lucide-react';
import { ProcessedJobData, FilterOptions } from '../types';
import { useDashboardData } from '../hooks/useDashboardData';
import GeographyIntelligenceAnalyzer from '../services/analytics/GeographyIntelligenceAnalyzer';
import { 
  HARDSHIP_COLORS, 
  HARDSHIP_LABELS,
  HardshipClass 
} from '../data/icscHardshipClassifications';
import { getAgencyLogo } from '../utils/agencyLogos';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { GeographicMap } from './geography';
// TimeComparisonSelector removed - now using global time filter

// ============ TYPES ============

interface GeographyIntelligenceProps {
  data: ProcessedJobData[];
  filters: FilterOptions;
}

// ============ MAIN COMPONENT ============

// filterByAnalysisPeriod removed - data is now pre-filtered by global timeframe

const GeographyIntelligence: React.FC<GeographyIntelligenceProps> = ({ data, filters }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('map');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  
  const {
    isAgencyView,
    selectedAgencyName,
    filteredData,
    marketData
  } = useDashboardData(data, filters);
  
  // Data is already filtered by the global timeframe
  const periodFilteredData = filteredData;
  const periodFilteredMarketData = marketData;
  
  // Get all unique agencies from market data for peer comparison
  const allAgencies = useMemo(() => {
    const agencySet = new Set<string>();
    periodFilteredMarketData.forEach(job => {
      const agency = job.short_agency || job.long_agency;
      if (agency) agencySet.add(agency);
    });
    return Array.from(agencySet).sort();
  }, [periodFilteredMarketData]);
  
  // Initialize analyzer
  const analyzer = useMemo(() => new GeographyIntelligenceAnalyzer(), []);
  
  // Use period-filtered data for all analytics
  const analysisData = periodFilteredData;
  
  // Calculate all analytics using filtered data
  const kpis = useMemo(() => 
    analyzer.calculateKPIs(analysisData, isAgencyView ? selectedAgencyName : undefined, isAgencyView ? marketData : undefined),
    [analyzer, analysisData, isAgencyView, selectedAgencyName, marketData]
  );
  
  const hardshipProfile = useMemo(() => 
    analyzer.calculateHardshipProfile(analysisData, isAgencyView ? selectedAgencyName : undefined),
    [analyzer, analysisData, isAgencyView, selectedAgencyName]
  );
  
  const marketHardshipProfile = useMemo(() => 
    isAgencyView ? analyzer.calculateHardshipProfile(marketData) : null,
    [analyzer, marketData, isAgencyView]
  );
  
  const footprint = useMemo(() => 
    analyzer.calculateOperationalFootprint(analysisData, isAgencyView ? selectedAgencyName : undefined),
    [analyzer, analysisData, isAgencyView, selectedAgencyName]
  );
  
  const regionalCoverage = useMemo(() => 
    analyzer.calculateRegionalCoverage(analysisData, isAgencyView ? selectedAgencyName : undefined),
    [analyzer, analysisData, isAgencyView, selectedAgencyName]
  );
  
  const noAnalysis = useMemo(() => 
    analyzer.calculateNationalOfficerAnalysis(analysisData, isAgencyView ? selectedAgencyName : undefined),
    [analyzer, analysisData, isAgencyView, selectedAgencyName]
  );
  
  const countryList = useMemo(() => 
    analyzer.getUniqueCountries(analysisData, isAgencyView ? selectedAgencyName : undefined),
    [analyzer, analysisData, isAgencyView, selectedAgencyName]
  );
  
  const countryAnalysis = useMemo(() => 
    selectedCountry ? analyzer.getCountryAnalysis(analysisData, selectedCountry, isAgencyView ? selectedAgencyName : undefined) : null,
    [analyzer, analysisData, selectedCountry, isAgencyView, selectedAgencyName]
  );
  
  const trends = useMemo(() => 
    analyzer.calculateGeographicTrends(analysisData, isAgencyView ? selectedAgencyName : undefined),
    [analyzer, analysisData, isAgencyView, selectedAgencyName]
  );
  
  const insights = useMemo(() => 
    analyzer.generateInsights(analysisData, isAgencyView ? selectedAgencyName : undefined, isAgencyView ? marketData : undefined),
    [analyzer, analysisData, isAgencyView, selectedAgencyName, marketData]
  );
  
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isAgencyView ? (
            getAgencyLogo(selectedAgencyName) ? (
              <img src={getAgencyLogo(selectedAgencyName)!} alt={selectedAgencyName} className="h-5 w-5 object-contain" />
            ) : (
              <Globe className="h-4 w-4 text-emerald-600" />
            )
          ) : (
            <img src="/logo/logo/United_Nations.png" alt="UN System" className="h-5 w-5 object-contain" />
          )}
          <div>
            <span className="text-sm font-semibold text-gray-800">
              {isAgencyView ? `${selectedAgencyName} Geographic Intelligence` : 'UN System Geographic Intelligence'}
            </span>
            <span className="text-xs text-gray-500 ml-2">
              {kpis.countriesActive} countries • {hardshipProfile.totalPositions.toLocaleString()} positions
            </span>
          </div>
        </div>
        
      </div>

      {/* Interactive Geographic Map */}
      <CollapsibleSection
        title="Interactive Map"
        subtitle="Explore your recruitment footprint with agency comparison"
        icon={<Map className="h-4 w-4" />}
        isExpanded={expandedSection === 'map'}
        onToggle={() => toggleSection('map')}
        accentColor="emerald"
      >
        <GeographicMap
          data={periodFilteredData}
          marketData={periodFilteredMarketData}
          allAgencies={allAgencies}
          selectedAgency={isAgencyView ? selectedAgencyName : undefined}
          isAgencyView={isAgencyView}
          timeRange={filters.timeRange}
        />
      </CollapsibleSection>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          label="Countries Active"
          value={kpis.countriesActive.toString()}
          subtext={kpis.marketCountries ? `vs ${kpis.marketCountries} market` : 'with positions'}
          icon={<Flag className="h-4 w-4" />}
          color="emerald"
        />
        <KPICard
          label="Field Positions"
          value={`${kpis.fieldPercentage.toFixed(0)}%`}
          subtext={kpis.marketFieldPercentage ? `vs ${kpis.marketFieldPercentage.toFixed(0)}% mkt` : 'of total'}
          icon={<MapPin className="h-4 w-4" />}
          color="blue"
          trend={kpis.marketFieldPercentage ? (kpis.fieldPercentage > kpis.marketFieldPercentage ? 'up' : 'down') : undefined}
        />
        <KPICard
          label="Hardship D+E"
          value={`${kpis.hardshipDEPercentage.toFixed(0)}%`}
          subtext={kpis.marketHardshipDEPercentage ? `vs ${kpis.marketHardshipDEPercentage.toFixed(0)}% mkt` : 'high/extreme'}
          icon={<AlertTriangle className="h-4 w-4" />}
          color="orange"
          trend={kpis.marketHardshipDEPercentage ? (kpis.hardshipDEPercentage > kpis.marketHardshipDEPercentage ? 'up' : 'down') : undefined}
        />
        <KPICard
          label="National Officers"
          value={`${kpis.nationalOfficerPercentage.toFixed(0)}%`}
          subtext={kpis.marketNationalOfficerPercentage ? `vs ${kpis.marketNationalOfficerPercentage.toFixed(0)}% mkt` : 'localization'}
          icon={<Users className="h-4 w-4" />}
          color="purple"
          trend={kpis.marketNationalOfficerPercentage ? (kpis.nationalOfficerPercentage > kpis.marketNationalOfficerPercentage ? 'up' : 'down') : undefined}
        />
      </div>
      
      {/* Section 1: Hardship Profile */}
      <CollapsibleSection
        title="Hardship Profile"
        subtitle="ICSC duty station classifications from A (minimal) to E (extreme)"
        icon={<AlertTriangle className="h-4 w-4" />}
        isExpanded={expandedSection === 'hardship'}
        onToggle={() => toggleSection('hardship')}
        accentColor="orange"
      >
        <HardshipProfileSection 
          profile={hardshipProfile}
          marketProfile={marketHardshipProfile}
          isAgencyView={isAgencyView}
        />
      </CollapsibleSection>
      
      {/* Section 2: Operational Footprint */}
      <CollapsibleSection
        title="Operational Footprint"
        subtitle="HQ vs Regional vs Field distribution"
        icon={<Building2 className="h-4 w-4" />}
        isExpanded={expandedSection === 'footprint'}
        onToggle={() => toggleSection('footprint')}
        accentColor="blue"
      >
        <OperationalFootprintSection footprint={footprint} />
      </CollapsibleSection>
      
      {/* Section 3: Regional Coverage */}
      <CollapsibleSection
        title="Regional Programme Coverage"
        subtitle="Positions by UN region with hardship breakdown"
        icon={<Globe className="h-4 w-4" />}
        isExpanded={expandedSection === 'regional'}
        onToggle={() => toggleSection('regional')}
        accentColor="emerald"
      >
        <RegionalCoverageSection coverage={regionalCoverage} />
      </CollapsibleSection>
      
      {/* Section 4: Country Deep-Dive */}
      <CollapsibleSection
        title="Country Analysis"
        subtitle="Detailed breakdown by country and duty station"
        icon={<Flag className="h-4 w-4" />}
        isExpanded={expandedSection === 'country'}
        onToggle={() => toggleSection('country')}
        accentColor="teal"
      >
        <CountryAnalysisSection 
          countryList={countryList}
          selectedCountry={selectedCountry}
          onSelectCountry={setSelectedCountry}
          countryAnalysis={countryAnalysis}
        />
      </CollapsibleSection>
      
      {/* Section 5: Localization */}
      <CollapsibleSection
        title="Localization & National Staffing"
        subtitle="National Officer positions and localization progress"
        icon={<Users className="h-4 w-4" />}
        isExpanded={expandedSection === 'localization'}
        onToggle={() => toggleSection('localization')}
        accentColor="purple"
      >
        <LocalizationSection analysis={noAnalysis} />
      </CollapsibleSection>
      
      {/* Section 6: Geographic Trends */}
      {trends.length > 0 && (
        <CollapsibleSection
          title="Geographic Evolution"
          subtitle="Changes over the past 4 weeks"
          icon={<TrendingUp className="h-4 w-4" />}
          isExpanded={expandedSection === 'trends'}
          onToggle={() => toggleSection('trends')}
          accentColor="indigo"
        >
          <GeographicTrendsSection trends={trends} />
        </CollapsibleSection>
      )}
      
      {/* Insights Panel */}
      <InsightsPanel insights={insights} />
    </div>
  );
};

// ============ HELPER COMPONENTS ============

interface KPICardProps {
  label: string;
  value: string;
  subtext: string;
  icon: React.ReactNode;
  color: 'emerald' | 'blue' | 'orange' | 'purple' | 'teal';
  trend?: 'up' | 'down';
}

const KPICard: React.FC<KPICardProps> = ({ label, value, subtext, icon, color, trend }) => {
  const colorClasses = {
    emerald: 'text-emerald-500 bg-emerald-50 border-emerald-200',
    blue: 'text-blue-500 bg-blue-50 border-blue-200',
    orange: 'text-orange-500 bg-orange-50 border-orange-200',
    purple: 'text-purple-500 bg-purple-50 border-purple-200',
    teal: 'text-teal-500 bg-teal-50 border-teal-200'
  };
  
  const iconBgClasses = {
    emerald: 'bg-emerald-100',
    blue: 'bg-blue-100',
    orange: 'bg-orange-100',
    purple: 'bg-purple-100',
    teal: 'bg-teal-100'
  };
  
  return (
    <div className={`rounded-lg border p-3 ${colorClasses[color].split(' ').slice(1).join(' ')}`}>
      <div className="flex items-center justify-between mb-1">
        <div className={`p-1.5 rounded ${iconBgClasses[color]}`}>
          <span className={colorClasses[color].split(' ')[0]}>{icon}</span>
        </div>
        {trend && (
          <span className={trend === 'up' ? 'text-green-500' : 'text-red-500'}>
            {trend === 'up' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        <span className="text-[10px] text-gray-400">{subtext}</span>
      </div>
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
  accentColor: 'orange' | 'blue' | 'emerald' | 'teal' | 'purple' | 'indigo';
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title, subtitle, icon, isExpanded, onToggle, children, accentColor
}) => {
  const accentClasses = {
    orange: 'text-orange-500',
    blue: 'text-blue-500',
    emerald: 'text-emerald-500',
    teal: 'text-teal-500',
    purple: 'text-purple-500',
    indigo: 'text-indigo-500'
  };
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={accentClasses[accentColor]}>{icon}</span>
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
};

// ============ SECTION COMPONENTS ============

interface HardshipProfileSectionProps {
  profile: ReturnType<GeographyIntelligenceAnalyzer['calculateHardshipProfile']>;
  marketProfile: ReturnType<GeographyIntelligenceAnalyzer['calculateHardshipProfile']> | null;
  isAgencyView: boolean;
}

const HardshipProfileSection: React.FC<HardshipProfileSectionProps> = ({ profile, marketProfile, isAgencyView }) => {
  const chartData = profile.distribution
    .filter(d => d.count > 0)
    .map(d => ({
      name: d.shortLabel,
      value: d.count,
      percentage: d.percentage,
      color: d.color,
      label: d.label
    }));
  
  return (
    <div className="space-y-4">
      {/* Distribution Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar Chart */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Hardship Distribution</h4>
          <div className="space-y-2">
            {profile.distribution.filter(d => d.count > 0 || ['A', 'B', 'C', 'D', 'E'].includes(d.hardshipClass)).map(dist => (
              <div key={dist.hardshipClass} className="flex items-center gap-2">
                <span className="w-20 text-xs text-gray-600">{dist.shortLabel}</span>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${dist.percentage}%`,
                      backgroundColor: dist.color
                    }}
                  />
                </div>
                <span className="w-16 text-xs text-gray-600 text-right">
                  {dist.percentage.toFixed(0)}% ({dist.count})
                </span>
              </div>
            ))}
          </div>
          
          {/* Market comparison if agency view */}
          {isAgencyView && marketProfile && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h5 className="text-xs font-medium text-gray-500 mb-2">vs Market Average</h5>
              <div className="flex gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: HARDSHIP_COLORS['D'] }} />
                  <span>D+E: {profile.hardshipDEPercentage.toFixed(0)}%</span>
                  <span className="text-gray-400">vs {marketProfile.hardshipDEPercentage.toFixed(0)}% mkt</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Top Hardship Locations */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Top Hardship Duty Stations (D+E)</h4>
          {profile.topHardshipLocations.length > 0 ? (
            <div className="space-y-1">
              {profile.topHardshipLocations.slice(0, 8).map((loc, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 px-2 hover:bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: HARDSHIP_COLORS[loc.hardshipClass] }}
                    />
                    <span className="text-xs font-medium text-gray-700">{loc.station}</span>
                    <span className="text-[10px] text-gray-400">{loc.country}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{loc.count} positions</span>
                    <span 
                      className="text-[10px] px-1.5 py-0.5 rounded font-medium text-white"
                      style={{ backgroundColor: HARDSHIP_COLORS[loc.hardshipClass] }}
                    >
                      {loc.hardshipClass}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No D+E hardship locations</p>
          )}
          
          {profile.topHardshipLocations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                <span className="font-medium">{profile.hardshipDECount}</span> positions ({profile.hardshipDEPercentage.toFixed(1)}%) 
                in high/extreme hardship locations
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
        {(['A', 'B', 'C', 'D', 'E'] as HardshipClass[]).map(hc => (
          <div key={hc} className="flex items-center gap-1.5">
            <span 
              className="w-3 h-3 rounded"
              style={{ backgroundColor: HARDSHIP_COLORS[hc] }}
            />
            <span className="text-[10px] text-gray-600">{HARDSHIP_LABELS[hc]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface OperationalFootprintSectionProps {
  footprint: ReturnType<GeographyIntelligenceAnalyzer['calculateOperationalFootprint']>;
}

const OperationalFootprintSection: React.FC<OperationalFootprintSectionProps> = ({ footprint }) => {
  const pieData = footprint.categories.map(cat => ({
    name: cat.category,
    value: cat.count,
    color: cat.color
  }));
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Pie Chart */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Location Type Distribution</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [`${value} positions`, '']}
                contentStyle={{
                  backgroundColor: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Legend 
                formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Details */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Breakdown by Location Type</h4>
        <div className="space-y-3">
          {footprint.categories.map(cat => (
            <div key={cat.category} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span 
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm font-medium text-gray-700">{cat.category}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">
                  {cat.percentage.toFixed(0)}%
                </span>
              </div>
              <p className="text-[10px] text-gray-500 mb-2">{cat.description}</p>
              <div className="flex flex-wrap gap-1">
                {cat.topLocations.slice(0, 3).map((loc, idx) => (
                  <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-white rounded border border-gray-200">
                    {loc.location} ({loc.count})
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface RegionalCoverageSectionProps {
  coverage: ReturnType<GeographyIntelligenceAnalyzer['calculateRegionalCoverage']>;
}

const RegionalCoverageSection: React.FC<RegionalCoverageSectionProps> = ({ coverage }) => {
  return (
    <div className="space-y-3">
      {coverage.map(region => (
        <div key={region.region} className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-gray-700">{region.region}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900">
                {region.percentage.toFixed(0)}%
              </span>
              <span className="text-xs text-gray-400">
                ({region.totalCount} positions)
              </span>
            </div>
          </div>
          
          {/* Hardship breakdown bar */}
          <div className="h-4 bg-gray-200 rounded-full overflow-hidden flex mb-2">
            {region.hardshipBreakdown.map((hb, idx) => (
              <div
                key={idx}
                className="h-full"
                style={{ 
                  width: `${hb.percentage}%`,
                  backgroundColor: hb.color
                }}
                title={`${hb.hardshipClass}: ${hb.count} (${hb.percentage.toFixed(0)}%)`}
              />
            ))}
          </div>
          
          {/* Top countries */}
          <div className="flex flex-wrap gap-1">
            {region.topCountries.map((country, idx) => (
              <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-white rounded border border-gray-200">
                {country.country} ({country.count})
              </span>
            ))}
          </div>
        </div>
      ))}
      
      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-100">
        {(['A', 'B', 'C', 'D', 'E'] as HardshipClass[]).map(hc => (
          <div key={hc} className="flex items-center gap-1.5">
            <span 
              className="w-3 h-3 rounded"
              style={{ backgroundColor: HARDSHIP_COLORS[hc] }}
            />
            <span className="text-[10px] text-gray-600">{hc}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface CountryAnalysisSectionProps {
  countryList: string[];
  selectedCountry: string | null;
  onSelectCountry: (country: string | null) => void;
  countryAnalysis: ReturnType<GeographyIntelligenceAnalyzer['getCountryAnalysis']>;
}

const CountryAnalysisSection: React.FC<CountryAnalysisSectionProps> = ({ 
  countryList, 
  selectedCountry, 
  onSelectCountry, 
  countryAnalysis 
}) => {
  return (
    <div className="space-y-4">
      {/* Country Selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600">Select Country:</label>
        <select
          value={selectedCountry || ''}
          onChange={(e) => onSelectCountry(e.target.value || null)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        >
          <option value="">-- Select a country --</option>
          {countryList.map(country => (
            <option key={country} value={country}>{country}</option>
          ))}
        </select>
      </div>
      
      {/* Country Details */}
      {countryAnalysis && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-teal-500" />
              <h4 className="text-lg font-semibold text-gray-800">{countryAnalysis.country}</h4>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-xl font-bold text-gray-900">{countryAnalysis.totalJobs}</span>
                <span className="text-xs text-gray-500 ml-1">Total Jobs</span>
              </div>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-lg p-3 text-center">
              <span className="text-lg font-bold text-orange-500">{countryAnalysis.hardshipDEPercentage.toFixed(0)}%</span>
              <p className="text-xs text-gray-500">Hardship D+E</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <span className="text-lg font-bold text-purple-500">{countryAnalysis.nationalOfficerPercentage.toFixed(0)}%</span>
              <p className="text-xs text-gray-500">National Officers</p>
            </div>
            <div className="bg-white rounded-lg p-3 text-center">
              <span className="text-lg font-bold text-teal-500">{countryAnalysis.dutyStations.length}</span>
              <p className="text-xs text-gray-500">Duty Stations</p>
            </div>
          </div>
          
          {/* Duty Stations */}
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">Duty Stations</h5>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Station</th>
                    <th className="px-3 py-2 text-center text-gray-500 font-medium">Class</th>
                    <th className="px-3 py-2 text-center text-gray-500 font-medium">Jobs</th>
                    <th className="px-3 py-2 text-left text-gray-500 font-medium">Top Categories</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {countryAnalysis.dutyStations.slice(0, 8).map((station, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-700">{station.station}</td>
                      <td className="px-3 py-2 text-center">
                        <span 
                          className="px-1.5 py-0.5 rounded text-white text-[10px] font-medium"
                          style={{ backgroundColor: HARDSHIP_COLORS[station.hardshipClass] }}
                        >
                          {station.hardshipClass}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center text-gray-600">{station.count}</td>
                      <td className="px-3 py-2 text-gray-500">{station.topCategories.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Staff Composition */}
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-2">Staff Composition</h5>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-blue-500" />
                <span className="text-xs text-gray-600">IP: {countryAnalysis.staffComposition.internationalProfessional}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-purple-500" />
                <span className="text-xs text-gray-600">NO: {countryAnalysis.staffComposition.nationalOfficer}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-gray-400" />
                <span className="text-xs text-gray-600">GS: {countryAnalysis.staffComposition.generalService}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {!countryAnalysis && selectedCountry && (
        <p className="text-sm text-gray-500 italic">No data available for {selectedCountry}</p>
      )}
    </div>
  );
};

interface LocalizationSectionProps {
  analysis: ReturnType<GeographyIntelligenceAnalyzer['calculateNationalOfficerAnalysis']>;
}

const LocalizationSection: React.FC<LocalizationSectionProps> = ({ analysis }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Overview */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">National Officer Overview</h4>
        <div className="bg-purple-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-3xl font-bold text-purple-700">{analysis.percentage.toFixed(0)}%</span>
              <p className="text-sm text-purple-600">National Officer Rate</p>
            </div>
            <div className="text-right">
              <span className="text-xl font-semibold text-gray-700">{analysis.totalNOPositions}</span>
              <p className="text-xs text-gray-500">NO Positions</p>
            </div>
          </div>
        </div>
        
        {/* By Location Type */}
        <h5 className="text-xs font-medium text-gray-500 mb-2">NO % by Location Type</h5>
        <div className="space-y-2">
          {analysis.byLocationType.map(loc => (
            <div key={loc.locationType} className="flex items-center gap-2">
              <span className="w-20 text-xs text-gray-600">{loc.locationType}</span>
              <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-purple-500"
                  style={{ width: `${loc.noPercentage}%` }}
                />
                <div 
                  className="h-full bg-blue-300"
                  style={{ width: `${loc.ipPercentage}%` }}
                />
              </div>
              <span className="w-12 text-[10px] text-gray-500 text-right">
                {loc.noPercentage.toFixed(0)}% NO
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* By Country */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Top Countries by NO Positions</h4>
        <div className="space-y-2">
          {analysis.byCountry.map((country, idx) => (
            <div key={country.country} className="flex items-center gap-2">
              <span className="w-4 text-xs text-gray-400">{idx + 1}.</span>
              <span className="flex-1 text-xs text-gray-700">{country.country}</span>
              <div className="w-24 h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${(country.count / analysis.byCountry[0].count) * 100}%` }}
                />
              </div>
              <span className="w-16 text-xs text-gray-600 text-right">{country.count} NO</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface GeographicTrendsSectionProps {
  trends: ReturnType<GeographyIntelligenceAnalyzer['calculateGeographicTrends']>;
}

const GeographicTrendsSection: React.FC<GeographicTrendsSectionProps> = ({ trends }) => {
  return (
    <div className="space-y-3">
      {trends.map((trend, idx) => (
        <div 
          key={idx} 
          className={`flex items-center gap-3 p-3 rounded-lg ${
            trend.type === 'new' ? 'bg-green-50 border border-green-200' :
            trend.type === 'growth' ? 'bg-blue-50 border border-blue-200' :
            'bg-red-50 border border-red-200'
          }`}
        >
          <div className={`p-2 rounded-full ${
            trend.type === 'new' ? 'bg-green-100' :
            trend.type === 'growth' ? 'bg-blue-100' :
            'bg-red-100'
          }`}>
            {trend.type === 'new' ? (
              <CheckCircle className={`h-4 w-4 text-green-600`} />
            ) : trend.type === 'growth' ? (
              <ArrowUpRight className={`h-4 w-4 text-blue-600`} />
            ) : (
              <ArrowDownRight className={`h-4 w-4 text-red-600`} />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">{trend.location}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                trend.type === 'new' ? 'bg-green-200 text-green-700' :
                trend.type === 'growth' ? 'bg-blue-200 text-blue-700' :
                'bg-red-200 text-red-700'
              }`}>
                {trend.type === 'new' ? 'NEW' : 
                 trend.type === 'growth' ? `+${trend.change.toFixed(0)}%` : 
                 `${trend.change.toFixed(0)}%`}
              </span>
            </div>
            <p className="text-xs text-gray-500">{trend.context}</p>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold text-gray-700">{trend.count}</span>
            <p className="text-[10px] text-gray-400">positions</p>
          </div>
        </div>
      ))}
    </div>
  );
};

interface InsightsPanelProps {
  insights: ReturnType<GeographyIntelligenceAnalyzer['generateInsights']>;
}

const InsightsPanel: React.FC<InsightsPanelProps> = ({ insights }) => {
  const impactColors = {
    high: 'border-red-300 bg-red-50',
    medium: 'border-amber-300 bg-amber-50',
    low: 'border-green-300 bg-green-50'
  };
  
  const impactIcons = {
    high: <AlertTriangle className="h-4 w-4 text-red-500" />,
    medium: <Info className="h-4 w-4 text-amber-500" />,
    low: <CheckCircle className="h-4 w-4 text-green-500" />
  };
  
  return (
    <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="h-4 w-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-800">Geographic Insights</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insights.map((insight, idx) => (
          <div 
            key={idx} 
            className={`p-3 rounded-lg border-l-4 ${impactColors[insight.impact]}`}
          >
            <div className="flex items-start gap-2">
              {impactIcons[insight.impact]}
              <div>
                <h4 className="text-sm font-medium text-gray-700">{insight.title}</h4>
                <p className="text-xs text-gray-600 mt-1">{insight.description}</p>
                {insight.metric && (
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 bg-white rounded border border-gray-200 text-gray-600">
                    {insight.metric}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GeographyIntelligence;




