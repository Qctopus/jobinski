import React, { useState, useMemo } from 'react';
import { 
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ScatterChart, Scatter, Cell
} from 'recharts';
import { 
  Target, Globe, Zap, MapPin, TrendingUp, Trophy, 
  Activity, Clock, CheckCircle, AlertTriangle, Award, Network
} from 'lucide-react';
import { ProcessedJobData, FilterOptions } from '../types';
import { JobAnalyticsProcessor } from '../services/dataProcessor';
import SkillComparison from './SkillComparison';
import PatternAnalysis from './PatternAnalysis';

interface AgencyBenchmarkingProps {
  data: ProcessedJobData[];
  filters: FilterOptions;
}

type BenchmarkingTab = 'performance' | 'efficiency' | 'practices' | 'workforce' | 'skills' | 'patterns' | 'strategy';

const AgencyBenchmarking: React.FC<AgencyBenchmarkingProps> = ({ data, filters }) => {
  const [selectedView, setSelectedView] = useState<BenchmarkingTab>('performance');
  const [selectedAgencies, setSelectedAgencies] = useState<string[]>([]);
  const processor = useMemo(() => new JobAnalyticsProcessor(), []);

  // Calculate benchmarking metrics with validation
  const benchmarkMetrics = useMemo(() => {
    const metrics = processor.calculateAgencyBenchmarkingMetrics(data);
    console.log('Benchmarking metrics calculated:', metrics.length, 'agencies');
    return metrics;
  }, [data, processor]);

  const efficiencyMetrics = useMemo(() => {
    const metrics = processor.calculateEfficiencyBenchmarks(data);
    console.log('Efficiency metrics calculated:', metrics.filter(m => m !== null).length, 'agencies');
    return metrics;
  }, [data, processor]);

  const bestPractices = useMemo(() => {
    const practices = processor.identifyBestPractices(data);
    console.log('Best practices analysis completed');
    return practices;
  }, [data, processor]);

  const strategyMatrix = useMemo(() => {
    const matrix = processor.analyzeStrategyMatrix(data);
    console.log('Strategy matrix calculated:', matrix.filter(m => m !== null).length, 'agencies');
    return matrix;
  }, [data, processor]);

  // Get top agencies for default selection
  const topAgencies = useMemo(() => {
    return benchmarkMetrics
      .sort((a, b) => b.totalJobs - a.totalJobs)
      .slice(0, 6)
      .map(a => a.agency);
  }, [benchmarkMetrics]);

  // Use selected agencies or top agencies
  const displayAgencies = selectedAgencies.length > 0 ? selectedAgencies : topAgencies;

  // Prepare radar chart data with dynamic normalization
  const radarData = useMemo(() => {
    const metrics = ['Hiring Volume', 'Geographic Reach', 'Role Diversity', 'Digital Maturity', 'Field Presence', 'Senior Talent Ratio'];
    
    // Calculate dynamic ranges for normalization
    const hiringVolumeMax = Math.max(...benchmarkMetrics.map(b => b.metrics.hiringVolume));
    const geographicReachMax = Math.max(...benchmarkMetrics.map(b => b.metrics.geographicReach));
    const roleDiversityMax = Math.max(...benchmarkMetrics.map(b => b.metrics.roleDiversity));
    
    return metrics.map(metric => {
      const dataPoint: any = { metric };
      
      displayAgencies.forEach(agency => {
        const agencyData = benchmarkMetrics.find(b => b.agency === agency);
        if (agencyData) {
          let value = 0;
          switch (metric) {
            case 'Hiring Volume':
              // Use percentile-based normalization to handle outliers
              value = Math.min(100, (agencyData.metrics.hiringVolume / Math.max(hiringVolumeMax, 1)) * 100);
              break;
            case 'Geographic Reach':
              value = Math.min(100, (agencyData.metrics.geographicReach / Math.max(geographicReachMax, 1)) * 100);
              break;
            case 'Role Diversity':
              value = Math.min(100, (agencyData.metrics.roleDiversity / Math.max(roleDiversityMax, 1)) * 100);
              break;
            case 'Digital Maturity':
              value = agencyData.metrics.digitalMaturity; // Already a percentage
              break;
            case 'Field Presence':
              value = agencyData.metrics.fieldPresence; // Already a percentage
              break;
            case 'Senior Talent Ratio':
              value = agencyData.metrics.talentInvestment; // Already a percentage 0-100
              break;
          }
          dataPoint[agency] = Math.round(value);
        }
      });
      
      return dataPoint;
    });
  }, [benchmarkMetrics, displayAgencies]);

  // Color palette for agencies
  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1', '#059669'];

  // Calculate workforce composition insights
  const workforceAnalysis = useMemo(() => {
    const agencies = [...new Set(data.map(job => job.short_agency || job.long_agency).filter(Boolean))];
    
    // Define grade categories
    const gradeCategories = {
      'P1-P2 (Entry)': (grade: string) => ['P1', 'P2', 'G1', 'G2', 'G3'].some(g => grade?.includes(g)),
      'P3-P4 (Mid)': (grade: string) => ['P3', 'P4', 'G4', 'G5', 'G6'].some(g => grade?.includes(g)), 
      'P5+ (Senior)': (grade: string) => ['P5', 'P6', 'D1', 'D2', 'L6', 'L7', 'G7', 'G8'].some(g => grade?.includes(g)),
      'Consultants': (grade: string) => ['CONSULTANT', 'IC', 'SC', 'RETAINER'].some(g => grade?.toUpperCase().includes(g))
    };

    // Calculate system-wide averages
    const systemTotals: { [key: string]: number } = { total: 0 };
    Object.keys(gradeCategories).forEach(category => systemTotals[category] = 0);

    data.forEach(job => {
      if (!job.up_grade) return;
      systemTotals.total++;
      
      Object.entries(gradeCategories).forEach(([category, matcher]) => {
        if (matcher(job.up_grade)) {
          systemTotals[category]++;
        }
      });
    });

    const systemAverages = Object.fromEntries(
      Object.keys(gradeCategories).map(category => [
        category, 
        systemTotals.total > 0 ? (systemTotals[category] / systemTotals.total) * 100 : 0
      ])
    );

    // Calculate for each agency
    const agencyProfiles = agencies.map(agency => {
      const agencyJobs = data.filter(job => (job.short_agency || job.long_agency) === agency);
      const jobsWithGrades = agencyJobs.filter(job => job.up_grade);
      
      if (jobsWithGrades.length < 5) return null; // Skip agencies with insufficient data

      const gradeCounts: { [key: string]: number } = { total: jobsWithGrades.length };
      Object.keys(gradeCategories).forEach(category => gradeCounts[category] = 0);

      jobsWithGrades.forEach(job => {
        Object.entries(gradeCategories).forEach(([category, matcher]) => {
          if (matcher(job.up_grade)) {
            gradeCounts[category]++;
          }
        });
      });

      const gradeDistribution = Object.fromEntries(
        Object.keys(gradeCategories).map(category => [
          category,
          {
            count: gradeCounts[category],
            percentage: (gradeCounts[category] / gradeCounts.total) * 100,
            vsSystem: (gradeCounts[category] / gradeCounts.total) * 100 - systemAverages[category]
          }
        ])
      );

      // Additional insights
      const seniorityRatio = (gradeCounts['P5+ (Senior)'] / gradeCounts.total) * 100;
      const consultantRatio = (gradeCounts['Consultants'] / gradeCounts.total) * 100;
      const staffRatio = 100 - consultantRatio;

      return {
        agency,
        totalPositions: gradeCounts.total,
        gradeDistribution,
        insights: {
          seniorityRatio,
          consultantRatio,
          staffRatio,
          topGradeCategory: Object.entries(gradeDistribution)
            .sort(([,a], [,b]) => b.percentage - a.percentage)[0][0]
        }
      };
    }).filter(Boolean);

    return {
      agencyProfiles: agencyProfiles.slice(0, 12), // Limit for display
      systemAverages,
      totalJobs: systemTotals.total
    };
  }, [data]);

  // Data validation - ensure we have sufficient data
  const hasInsufficientData = benchmarkMetrics.length < 2;
  const validEfficiencyMetrics = efficiencyMetrics.filter((m): m is NonNullable<typeof m> => m !== null);
  const validStrategyMatrix = strategyMatrix.filter((m): m is NonNullable<typeof m> => m !== null);

  // Show error state if insufficient data
  if (hasInsufficientData) {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-center">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Insufficient Data for Benchmarking</h3>
            <p className="text-gray-600 mb-4">
              We need at least 2 agencies with 5+ jobs each to perform meaningful benchmarking analysis.
            </p>
            <p className="text-sm text-gray-500">
              Current data: {benchmarkMetrics.length} agencies meet the minimum threshold
            </p>
          </div>
        </div>
      </div>
    );
  }

  const renderPerformanceView = () => (
    <div className="space-y-8">
      {/* Agency Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Agencies to Compare</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {benchmarkMetrics.slice(0, 12).map((agency, index) => (
            <label key={agency.agency} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedAgencies.includes(agency.agency)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedAgencies(prev => [...prev, agency.agency]);
                  } else {
                    setSelectedAgencies(prev => prev.filter(a => a !== agency.agency));
                  }
                }}
                className="rounded border-gray-300 text-un-blue focus:ring-un-blue"
              />
              <span className="text-sm text-gray-700">{agency.agency}</span>
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: colors[index % colors.length] }}
              />
            </label>
          ))}
        </div>
        {selectedAgencies.length === 0 && (
          <p className="text-sm text-gray-500 mt-2">Showing top 6 agencies by hiring volume</p>
        )}
      </div>

      {/* Radar Chart */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-un-blue" />
            <h3 className="text-lg font-semibold text-gray-900">Performance Metrics Comparison</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">Six-dimensional agency comparison across key performance indicators</p>
        </div>
        
        <div className="p-6">
          <ResponsiveContainer width="100%" height={500}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" className="text-sm" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
              {displayAgencies.map((agency, index) => (
                <Radar
                  key={agency}
                  name={agency}
                  dataKey={agency}
                  stroke={colors[index % colors.length]}
                  fill={colors[index % colors.length]}
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              ))}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Metrics Explained */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Activity className="h-6 w-6 text-un-blue" />
            <h3 className="text-lg font-semibold text-gray-900">Performance Metrics Guide</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">Understanding what each metric measures and actionable insights</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-gray-900">🏢 Hiring Volume</h4>
                <p className="text-sm text-gray-600 mt-1">Total number of job postings by the agency</p>
                <p className="text-xs text-gray-500 mt-2"><strong>Why it matters:</strong> Indicates organizational growth, capacity expansion, and hiring ambition</p>
              </div>
              
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold text-gray-900">🌍 Geographic Reach</h4>
                <p className="text-sm text-gray-600 mt-1">Number of unique countries where agency posts jobs</p>
                <p className="text-xs text-gray-500 mt-2"><strong>Why it matters:</strong> Shows global presence and operational scope - key for understanding agency scale</p>
              </div>
              
              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-semibold text-gray-900">🎯 Role Diversity</h4>
                <p className="text-sm text-gray-600 mt-1">Number of different job categories the agency hires for</p>
                <p className="text-xs text-gray-500 mt-2"><strong>Why it matters:</strong> Higher diversity = broader mandate; Lower = specialized focus</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="border-l-4 border-red-500 pl-4">
                <h4 className="font-semibold text-gray-900">💻 Digital Maturity</h4>
                <p className="text-sm text-gray-600 mt-1">Percentage of jobs requiring digital/tech competencies</p>
                <p className="text-xs text-gray-500 mt-2"><strong>What we measure:</strong> Jobs with keywords like 'digital', 'AI', 'data analytics', 'programming', 'automation' in their skill requirements</p>
                <p className="text-xs text-blue-600 mt-1"><strong>Benchmark:</strong> &gt;30% = High digitization; 15-30% = Moderate; &lt;15% = Traditional focus</p>
                <p className="text-xs text-gray-500 mt-1"><strong>Action:</strong> Low scores indicate opportunities for digital transformation initiatives</p>
              </div>
              
              <div className="border-l-4 border-orange-500 pl-4">
                <h4 className="font-semibold text-gray-900">🏕️ Field Presence</h4>
                <p className="text-sm text-gray-600 mt-1">Percentage of positions based in field locations vs headquarters</p>
                <p className="text-xs text-gray-500 mt-2"><strong>Why it matters:</strong> Shows operational vs administrative focus and ground-level presence</p>
              </div>
              
              <div className="border-l-4 border-indigo-500 pl-4">
                <h4 className="font-semibold text-gray-900">👔 Senior Talent Ratio</h4>
                <p className="text-sm text-gray-600 mt-1">Percentage of positions at Senior/Executive level (P5+ equivalent)</p>
                <p className="text-xs text-gray-500 mt-2"><strong>Why it matters:</strong> Indicates investment in leadership and expertise vs operational capacity</p>
                <p className="text-xs text-blue-600 mt-1"><strong>Benchmark:</strong> &gt;25% = Leadership-heavy; 15-25% = Balanced; &lt;15% = Operational focus</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Agency Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayAgencies.map((agency, index) => {
          const agencyData = benchmarkMetrics.find(b => b.agency === agency);
          if (!agencyData) return null;

          return (
            <div key={agency} className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">{agency}</h4>
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Hiring Volume</span>
                    <span className="font-medium">{agencyData.metrics.hiringVolume}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Geographic Reach</span>
                    <span className="font-medium">{agencyData.metrics.geographicReach} countries</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Role Diversity</span>
                    <span className="font-medium">{agencyData.metrics.roleDiversity} categories</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Digital Maturity</span>
                    <span className="font-medium">{agencyData.metrics.digitalMaturity}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Field Presence</span>
                    <span className="font-medium">{agencyData.metrics.fieldPresence}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Senior Talent Ratio</span>
                    <span className="font-medium">{agencyData.metrics.talentInvestment}%</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderEfficiencyView = () => (
    <div className="space-y-8">
      {/* Efficiency Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="h-5 w-5 text-blue-500" />
            <h4 className="font-semibold text-gray-900">Avg Application Window</h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {validEfficiencyMetrics.length > 0 ? Math.round(validEfficiencyMetrics.reduce((sum, e) => sum + e.avgApplicationWindow, 0) / validEfficiencyMetrics.length) : 0} days
          </p>
          <p className="text-sm text-gray-600">System average</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="h-5 w-5 text-green-500" />
            <h4 className="font-semibold text-gray-900">Posting Velocity</h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {validEfficiencyMetrics.length > 0 ? Math.round((validEfficiencyMetrics.reduce((sum, e) => sum + e.postingVelocity, 0) / validEfficiencyMetrics.length) * 10) / 10 : 0}/month
          </p>
          <p className="text-sm text-gray-600">System average</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <h4 className="font-semibold text-gray-900">Urgent Hiring</h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {validEfficiencyMetrics.length > 0 ? Math.round(validEfficiencyMetrics.reduce((sum, e) => sum + e.urgentHiringRate, 0) / validEfficiencyMetrics.length) : 0}%
          </p>
          <p className="text-sm text-gray-600">&lt;14 day windows</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-5 w-5 text-purple-500" />
            <h4 className="font-semibold text-gray-900">Quick Fill Rate</h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {validEfficiencyMetrics.length > 0 ? Math.round(validEfficiencyMetrics.reduce((sum, e) => sum + e.fillPatterns.quick, 0) / validEfficiencyMetrics.length) : 0}%
          </p>
          <p className="text-sm text-gray-600">&le;21 day fills</p>
        </div>
      </div>

      {/* Application Window Comparison */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-un-blue" />
            <h3 className="text-lg font-semibold text-gray-900">Application Window Comparison</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">Average days from posting to deadline by agency</p>
        </div>
        
        <div className="p-6">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={validEfficiencyMetrics.slice(0, 15)} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 'dataMax']} />
              <YAxis dataKey="agency" type="category" width={100} fontSize={12} />
              <Tooltip 
                formatter={(value: any) => [`${value} days`, 'Avg Window']}
                labelFormatter={(label: any) => `Agency: ${label}`}
              />
              <Bar dataKey="avgApplicationWindow" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Fill Pattern Analysis */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-un-blue" />
            <h3 className="text-lg font-semibold text-gray-900">Time-to-Fill Patterns</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">Distribution of hiring timeline preferences by agency</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {validEfficiencyMetrics.slice(0, 10).map((agency, index) => (
              <div key={agency.agency} className="space-y-3">
                <h4 className="font-semibold text-gray-900">{agency.agency}</h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Quick Fill (≤21 days)</span>
                    <span className="font-medium text-green-600">{agency.fillPatterns.quick}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${agency.fillPatterns.quick}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Standard (22-45 days)</span>
                    <span className="font-medium text-blue-600">{agency.fillPatterns.standard}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${agency.fillPatterns.standard}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Extended (&gt;45 days)</span>
                    <span className="font-medium text-orange-600">{agency.fillPatterns.extended}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full" 
                      style={{ width: `${agency.fillPatterns.extended}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderBestPracticesView = () => (
    <div className="space-y-8">
      {/* Actionable Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {bestPractices.actionableInsights.map((insight, index) => (
          <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-3">
              <Trophy className="h-6 w-6 text-indigo-600" />
              <h4 className="font-semibold text-gray-900">{insight.category}</h4>
            </div>
            <p className="text-gray-700 mb-2">{insight.insight}</p>
            <div className="text-sm text-indigo-600 font-medium">
              Leader: {insight.agency}
            </div>
          </div>
        ))}
      </div>

      {/* Top Performers by Category */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Award className="h-6 w-6 text-un-blue" />
            <h3 className="text-lg font-semibold text-gray-900">Category Leaders</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">Top performers in each benchmark category</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-500" />
                Digital Leaders
              </h4>
              {bestPractices.topPerformers.digitalLeaders.slice(0, 3).map((agency, index) => (
                <div key={agency.agency} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="font-medium text-gray-900">#{index + 1} {agency.agency}</span>
                  <span className="text-blue-600 font-semibold">{agency.metrics.digitalMaturity}%</span>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Globe className="h-4 w-4 text-green-500" />
                Geographic Leaders
              </h4>
              {bestPractices.topPerformers.geographicLeaders.slice(0, 3).map((agency, index) => (
                <div key={agency.agency} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="font-medium text-gray-900">#{index + 1} {agency.agency}</span>
                  <span className="text-green-600 font-semibold">{agency.metrics.geographicReach} countries</span>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-500" />
                Efficiency Leaders
              </h4>
              {bestPractices.topPerformers.efficiencyLeaders.slice(0, 3).map((agency, index) => (
                <div key={agency.agency} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="font-medium text-gray-900">#{index + 1} {agency.agency}</span>
                  <span className="text-purple-600 font-semibold">{agency.avgApplicationWindow} days</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quartile Rankings */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-un-blue" />
            <h3 className="text-lg font-semibold text-gray-900">Quartile Performance Rankings</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">Agency performance distribution across all metrics</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {Object.entries(bestPractices.quartileRankings).slice(0, 4).map(([metric, data]: [string, any]) => (
              <div key={metric} className="space-y-4">
                <h4 className="font-semibold text-gray-900 capitalize">
                  {metric.replace(/([A-Z])/g, ' $1').trim()}
                </h4>
                
                <div className="space-y-2">
                  {[4, 3, 2, 1].map(quartile => {
                    const quartileAgencies = data.agencies.filter((a: any) => a.quartile === quartile);
                    const quartileColor = quartile === 4 ? 'bg-green-100 text-green-800' :
                                         quartile === 3 ? 'bg-blue-100 text-blue-800' :
                                         quartile === 2 ? 'bg-yellow-100 text-yellow-800' :
                                         'bg-red-100 text-red-800';
                    
                    return (
                      <div key={quartile} className={`p-3 rounded-lg ${quartileColor}`}>
                        <div className="font-medium mb-1">
                          Q{quartile} ({quartileAgencies.length} agencies)
                        </div>
                        <div className="text-sm">
                          {quartileAgencies.slice(0, 3).map((agency: any) => agency.agency).join(', ')}
                          {quartileAgencies.length > 3 && ` +${quartileAgencies.length - 3} more`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStrategyMatrix = () => (
    <div className="space-y-8">
      {/* Strategy Matrix Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Talent Strategy Matrix */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 text-un-blue" />
              <h3 className="text-lg font-semibold text-gray-900">Talent Strategy Positioning</h3>
            </div>
            <p className="text-sm text-gray-600 mt-1">Specialization vs Innovation matrix</p>
          </div>
          
          <div className="p-6">
            <div className="relative">
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="specialization" 
                    domain={[0, 100]}
                    label={{ value: 'Specialization →', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="innovation" 
                    domain={[0, 100]}
                    label={{ value: 'Innovation →', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border rounded shadow">
                            <p className="font-semibold">{data.agency}</p>
                            <p>Specialization: {data.talentStrategy.specialization}%</p>
                            <p>Innovation: {data.talentStrategy.innovation}%</p>
                            <p>Category: {data.talentStrategy.quadrant}</p>
                            <p>Jobs: {data.totalJobs}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter 
                    data={validStrategyMatrix} 
                    fill="#3B82F6"
                  >
                    {validStrategyMatrix.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={colors[index % colors.length]} 
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              
              {/* Quadrant Labels */}
              <div className="absolute top-4 left-4 text-xs text-gray-500">Traditional<br/>Generalist</div>
              <div className="absolute top-4 right-4 text-xs text-gray-500">Diverse<br/>Innovator</div>
              <div className="absolute bottom-16 left-4 text-xs text-gray-500">Traditional<br/>Specialist</div>
              <div className="absolute bottom-16 right-4 text-xs text-gray-500">Specialized<br/>Innovator</div>
            </div>
          </div>
        </div>

        {/* Location Strategy Matrix */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <MapPin className="h-6 w-6 text-un-blue" />
              <h3 className="text-lg font-semibold text-gray-900">Location Strategy Positioning</h3>
            </div>
            <p className="text-sm text-gray-600 mt-1">Geographic distribution vs HQ focus</p>
          </div>
          
          <div className="p-6">
            <div className="relative">
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="geographicConcentration" 
                    domain={[0, 100]}
                    label={{ value: 'Geographic Concentration →', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="hqFocus" 
                    domain={[0, 100]}
                    label={{ value: 'HQ Focus →', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border rounded shadow">
                            <p className="font-semibold">{data.agency}</p>
                            <p>Geo Concentration: {data.locationStrategy.geographicConcentration}%</p>
                            <p>HQ Focus: {data.locationStrategy.hqFocus}%</p>
                            <p>Strategy: {data.locationStrategy.quadrant}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter 
                    data={validStrategyMatrix} 
                    fill="#10B981"
                  >
                    {validStrategyMatrix.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={colors[index % colors.length]} 
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              
              {/* Quadrant Labels */}
              <div className="absolute top-4 left-4 text-xs text-gray-500">Field<br/>Distributed</div>
              <div className="absolute top-4 right-4 text-xs text-gray-500">HQ<br/>Distributed</div>
              <div className="absolute bottom-16 left-4 text-xs text-gray-500">Field<br/>Concentrated</div>
              <div className="absolute bottom-16 right-4 text-xs text-gray-500">HQ<br/>Concentrated</div>
            </div>
          </div>
        </div>
      </div>

      {/* Strategy Quadrant Analysis */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Network className="h-6 w-6 text-un-blue" />
            <h3 className="text-lg font-semibold text-gray-900">Strategic Positioning Analysis</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">Agency categorization by strategic approach</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Talent Strategy Categories</h4>
              <div className="space-y-3">
                {['Specialized Innovator', 'Traditional Specialist', 'Diverse Innovator', 'Traditional Generalist'].map((category, index) => {
                  const agenciesInCategory = validStrategyMatrix.filter(a => a.talentStrategy.quadrant === category);
                  return (
                    <div key={category} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">{category}</h5>
                        <span className="text-sm text-gray-600">{agenciesInCategory.length} agencies</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {agenciesInCategory.slice(0, 3).map(a => a.agency).join(', ')}
                        {agenciesInCategory.length > 3 && ` +${agenciesInCategory.length - 3} more`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Location Strategy Categories</h4>
              <div className="space-y-3">
                {['HQ Concentrated', 'Field Concentrated', 'HQ Distributed', 'Field Distributed'].map((category, index) => {
                  const agenciesInCategory = validStrategyMatrix.filter(a => a.locationStrategy.quadrant === category);
                  return (
                    <div key={category} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">{category}</h5>
                        <span className="text-sm text-gray-600">{agenciesInCategory.length} agencies</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {agenciesInCategory.slice(0, 3).map(a => a.agency).join(', ')}
                        {agenciesInCategory.length > 3 && ` +${agenciesInCategory.length - 3} more`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderWorkforceComposition = () => (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Target className="h-5 w-5 text-blue-500" />
            <h4 className="font-semibold text-gray-900">Total Analyzed</h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">{workforceAnalysis.totalJobs}</p>
          <p className="text-sm text-gray-600">Positions with grade data</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="h-5 w-5 text-green-500" />
            <h4 className="font-semibold text-gray-900">System Average</h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">{Math.round(workforceAnalysis.systemAverages['P5+ (Senior)'])}%</p>
          <p className="text-sm text-gray-600">Senior positions (P5+)</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Network className="h-5 w-5 text-purple-500" />
            <h4 className="font-semibold text-gray-900">Consultants</h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">{Math.round(workforceAnalysis.systemAverages['Consultants'])}%</p>
          <p className="text-sm text-gray-600">System average</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <Award className="h-5 w-5 text-orange-500" />
            <h4 className="font-semibold text-gray-900">Agencies Analyzed</h4>
          </div>
          <p className="text-2xl font-bold text-gray-900">{workforceAnalysis.agencyProfiles.length}</p>
          <p className="text-sm text-gray-600">With sufficient data</p>
        </div>
      </div>

      {/* System Benchmarks */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Globe className="h-6 w-6 text-un-blue" />
            <h3 className="text-lg font-semibold text-gray-900">UN System Grade Distribution Benchmarks</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">How your agency's workforce composition compares to system averages</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(workforceAnalysis.systemAverages).map(([category, percentage]) => (
              <div key={category} className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {Math.round(percentage)}%
                </div>
                <div className="text-sm text-gray-600">{category}</div>
                <div className="text-xs text-gray-500 mt-1">System Average</div>
              </div>
            ))}
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">💡 How to Read the Comparison</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Green numbers (+)</strong>: Your agency hires more in this category than average</li>
              <li>• <strong>Red numbers (-)</strong>: Your agency hires less in this category than average</li>
              <li>• <strong>Example</strong>: "+5%" in P5+ means you hire 5 percentage points more senior staff than average</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Agency Workforce Profiles */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Activity className="h-6 w-6 text-un-blue" />
            <h3 className="text-lg font-semibold text-gray-900">Agency Workforce Composition Profiles</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">Detailed grade distribution and insights for each agency</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {workforceAnalysis.agencyProfiles.filter((profile): profile is NonNullable<typeof profile> => profile !== null).map((profile, index) => (
              <div key={profile.agency} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">{profile.agency}</h4>
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Positions:</span>
                    <span className="font-medium">{profile.totalPositions}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Primary Focus:</span>
                    <span className="font-medium">{profile.insights.topGradeCategory}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Seniority Ratio:</span>
                    <span className="font-medium">{Math.round(profile.insights.seniorityRatio)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Staff vs Consultants:</span>
                    <span className="font-medium">{Math.round(profile.insights.staffRatio)}% / {Math.round(profile.insights.consultantRatio)}%</span>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h5 className="font-medium text-gray-900 mb-3">Grade Distribution vs. System Average</h5>
                  <div className="space-y-2">
                    {Object.entries(profile.gradeDistribution).map(([category, data]) => (
                      <div key={category} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">{category}:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{Math.round(data.percentage)}%</span>
                          <span className={`font-medium ${
                            data.vsSystem > 0 ? 'text-green-600' : data.vsSystem < 0 ? 'text-red-600' : 'text-gray-500'
                          }`}>
                            ({data.vsSystem > 0 ? '+' : ''}{Math.round(data.vsSystem)}%)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Insights */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h6 className="text-xs font-medium text-gray-700 mb-1">Strategic Insight:</h6>
                  <p className="text-xs text-gray-600">
                    {profile.insights.seniorityRatio > 30 
                      ? "Leadership-heavy: High investment in senior expertise"
                      : profile.insights.seniorityRatio < 15 
                      ? "Operational focus: Emphasis on junior/mid-level capacity"
                      : "Balanced approach: Mixed seniority distribution"
                    }
                    {profile.insights.consultantRatio > 40 
                      ? " • High consultant reliance for specialized expertise"
                      : profile.insights.consultantRatio < 10
                      ? " • Strong permanent staff preference"
                      : ""
                    }
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strategic Recommendations */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6">
        <h4 className="font-semibold text-green-900 mb-4">🎯 Strategic Workforce Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h5 className="font-medium text-green-800 mb-2">Grade Distribution Strategy:</h5>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Compare your distribution to system benchmarks</li>
              <li>• Higher P5+ ratio indicates leadership investment</li>
              <li>• P1-P2 focus suggests capacity building approach</li>
              <li>• Use gaps to guide recruitment planning</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-blue-800 mb-2">Staff vs Consultant Balance:</h5>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• High consultant ratio: Flexibility + specialized skills</li>
              <li>• High staff ratio: Stability + institutional knowledge</li>
              <li>• Balance based on mandate and operational needs</li>
              <li>• Consider cost implications and continuity requirements</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-purple-800 mb-2">Benchmarking Actions:</h5>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• Identify agencies with similar mandates</li>
              <li>• Learn from successful workforce compositions</li>
              <li>• Adjust recruitment strategies based on gaps</li>
              <li>• Monitor trends over time for planning</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Comprehensive Agency Benchmarking Suite</h2>
            <p className="text-gray-600 mt-1">Deep analysis, pattern detection, and strategic positioning insights</p>
          </div>
          
          {/* View Selector */}
          <div className="flex flex-wrap gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setSelectedView('performance')}
              className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                selectedView === 'performance'
                  ? 'bg-white text-un-blue shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Performance
            </button>
            <button
              onClick={() => setSelectedView('efficiency')}
              className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                selectedView === 'efficiency'
                  ? 'bg-white text-un-blue shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Efficiency
            </button>
            <button
              onClick={() => setSelectedView('practices')}
              className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                selectedView === 'practices'
                  ? 'bg-white text-un-blue shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Best Practices
            </button>
            <button
              onClick={() => setSelectedView('workforce')}
              className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                selectedView === 'workforce'
                  ? 'bg-white text-un-blue shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Workforce Composition
            </button>
            <button
              onClick={() => setSelectedView('skills')}
              className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                selectedView === 'skills'
                  ? 'bg-white text-un-blue shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Skills Analysis
            </button>
            <button
              onClick={() => setSelectedView('patterns')}
              className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                selectedView === 'patterns'
                  ? 'bg-white text-un-blue shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pattern Detection
            </button>
            <button
              onClick={() => setSelectedView('strategy')}
              className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                selectedView === 'strategy'
                  ? 'bg-white text-un-blue shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Strategy Matrix
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {selectedView === 'performance' && renderPerformanceView()}
      {selectedView === 'efficiency' && renderEfficiencyView()}
      {selectedView === 'practices' && renderBestPracticesView()}
      {selectedView === 'workforce' && renderWorkforceComposition()}
      {selectedView === 'skills' && <SkillComparison data={data} filters={filters} />}
      {selectedView === 'patterns' && <PatternAnalysis data={data} filters={filters} />}
      {selectedView === 'strategy' && renderStrategyMatrix()}
    </div>
  );
};

export default AgencyBenchmarking; 