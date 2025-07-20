import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Building, Users, Clock, MapPin, Star, ChevronDown } from 'lucide-react';
import { ProcessedJobData } from '../types';

interface AgencyBenchmarkingProps {
  data: ProcessedJobData[];
}

const AgencyBenchmarking: React.FC<AgencyBenchmarkingProps> = ({ data }) => {
  const [selectedAgencies, setSelectedAgencies] = useState<string[]>([]);
  const [comparisonView, setComparisonView] = useState<'overview' | 'detailed'>('overview');

  // Get top agencies for selection
  const topAgencies = React.useMemo(() => {
    const agencyMap = new Map<string, number>();
    
    data.forEach(job => {
      const agency = job.short_agency || job.long_agency || 'Unknown';
      agencyMap.set(agency, (agencyMap.get(agency) || 0) + 1);
    });

    return Array.from(agencyMap.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 15)
      .map(([agency, count]) => ({ agency, count }));
  }, [data]);

  // Agency performance metrics
  const agencyMetrics = React.useMemo(() => {
    const metricsMap = new Map<string, {
      totalJobs: number;
      avgApplicationWindow: number;
      uniqueCountries: Set<string>;
      uniqueGrades: Set<string>;
      experienceRequired: number[];
      homeBasedJobs: number;
      multiLanguageJobs: number;
    }>();

    data.forEach(job => {
      const agency = job.short_agency || job.long_agency || 'Unknown';
      
      if (!metricsMap.has(agency)) {
        metricsMap.set(agency, {
          totalJobs: 0,
          avgApplicationWindow: 0,
          uniqueCountries: new Set(),
          uniqueGrades: new Set(),
          experienceRequired: [],
          homeBasedJobs: 0,
          multiLanguageJobs: 0
        });
      }

      const metrics = metricsMap.get(agency)!;
      metrics.totalJobs++;
      metrics.avgApplicationWindow += job.application_window_days;
      
      if (job.duty_country) metrics.uniqueCountries.add(job.duty_country);
      if (job.up_grade) metrics.uniqueGrades.add(job.up_grade);
      if (job.relevant_experience > 0) metrics.experienceRequired.push(job.relevant_experience);
      if (job.is_home_based) metrics.homeBasedJobs++;
      if (job.language_count > 1) metrics.multiLanguageJobs++;
    });

    // Calculate final metrics
    return Array.from(metricsMap.entries()).map(([agency, metrics]) => ({
      agency,
      totalJobs: metrics.totalJobs,
      avgApplicationWindow: Math.round(metrics.avgApplicationWindow / metrics.totalJobs),
      geographicReach: metrics.uniqueCountries.size,
      gradeVariety: metrics.uniqueGrades.size,
      avgExperience: metrics.experienceRequired.length > 0 
        ? Math.round(metrics.experienceRequired.reduce((sum, exp) => sum + exp, 0) / metrics.experienceRequired.length) 
        : 0,
      remoteWorkRate: (metrics.homeBasedJobs / metrics.totalJobs) * 100,
      multiLanguageRate: (metrics.multiLanguageJobs / metrics.totalJobs) * 100,
      competitivenessScore: Math.round(
        (metrics.totalJobs * 0.3) + 
        (metrics.uniqueCountries.size * 0.2) + 
        (metrics.uniqueGrades.size * 0.2) + 
        ((metrics.homeBasedJobs / metrics.totalJobs) * 100 * 0.15) + 
        ((metrics.multiLanguageJobs / metrics.totalJobs) * 100 * 0.15)
      )
    }))
    .filter(m => m.totalJobs >= 5) // Filter agencies with meaningful data
    .sort((a, b) => b.totalJobs - a.totalJobs);
  }, [data]);

  // Comparison data for selected agencies
  const comparisonData = React.useMemo(() => {
    if (selectedAgencies.length === 0) return [];
    
    return selectedAgencies.map(agency => {
      const metrics = agencyMetrics.find(m => m.agency === agency);
      return metrics || null;
    }).filter(Boolean);
  }, [selectedAgencies, agencyMetrics]);

  // Experience vs Window scatter data
  const scatterData = React.useMemo(() => {
    return agencyMetrics.slice(0, 10).map(agency => ({
      agency: agency.agency,
      x: agency.avgExperience,
      y: agency.avgApplicationWindow,
      size: agency.totalJobs,
      fill: agency.agency === selectedAgencies[0] ? '#009edb' : '#ccc'
    }));
  }, [agencyMetrics, selectedAgencies]);

  // Radar chart data for agency comparison
  const radarData = React.useMemo(() => {
    if (comparisonData.length === 0) return [];

    const maxValues = {
      totalJobs: Math.max(...agencyMetrics.map(a => a.totalJobs)),
      geographicReach: Math.max(...agencyMetrics.map(a => a.geographicReach)),
      gradeVariety: Math.max(...agencyMetrics.map(a => a.gradeVariety)),
      remoteWorkRate: Math.max(...agencyMetrics.map(a => a.remoteWorkRate)),
      multiLanguageRate: Math.max(...agencyMetrics.map(a => a.multiLanguageRate))
    };

    const categories = [
      { category: 'Job Volume', key: 'totalJobs' as keyof typeof maxValues },
      { category: 'Geographic Reach', key: 'geographicReach' as keyof typeof maxValues },
      { category: 'Grade Diversity', key: 'gradeVariety' as keyof typeof maxValues },
      { category: 'Remote Work', key: 'remoteWorkRate' as keyof typeof maxValues },
      { category: 'Multi-Language', key: 'multiLanguageRate' as keyof typeof maxValues }
    ];

    return categories.map(({ category, key }) => {
      const dataPoint: any = { category };
      
      comparisonData.forEach((agency, index) => {
        if (agency) {
          const normalizedValue = (agency[key as keyof typeof agency] as number / maxValues[key]) * 100;
          dataPoint[agency.agency] = normalizedValue;
        }
      });
      
      return dataPoint;
    });
  }, [comparisonData, agencyMetrics]);

  const handleAgencyToggle = (agency: string) => {
    setSelectedAgencies(prev => {
      if (prev.includes(agency)) {
        return prev.filter(a => a !== agency);
      } else if (prev.length < 3) {
        return [...prev, agency];
      } else {
        return [agency]; // Replace if already at max
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Agency Benchmarking</h2>
        <div className="text-sm text-gray-600">
          Compare performance across {agencyMetrics.length} agencies
        </div>
      </div>

      {/* Agency Selection */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Agencies to Compare (up to 3)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {topAgencies.slice(0, 10).map(({ agency, count }) => (
            <button
              key={agency}
              onClick={() => handleAgencyToggle(agency)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                selectedAgencies.includes(agency)
                  ? 'border-un-blue bg-blue-50 text-un-blue'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm">{agency}</div>
              <div className="text-xs text-gray-500">{count} jobs</div>
            </button>
          ))}
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="metric-card">
          <div className="metric-value">
            {agencyMetrics.length}
          </div>
          <div className="metric-label flex items-center justify-center">
            <Building className="h-4 w-4 mr-1" />
            Active Agencies
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-value">
            {agencyMetrics.length > 0 ? Math.round(agencyMetrics.reduce((sum, a) => sum + a.avgApplicationWindow, 0) / agencyMetrics.length) : 0}
          </div>
          <div className="metric-label flex items-center justify-center">
            <Clock className="h-4 w-4 mr-1" />
            Avg Application Window
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-value">
            {agencyMetrics.length > 0 ? Math.round(agencyMetrics.reduce((sum, a) => sum + a.geographicReach, 0) / agencyMetrics.length) : 0}
          </div>
          <div className="metric-label flex items-center justify-center">
            <MapPin className="h-4 w-4 mr-1" />
            Avg Geographic Reach
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-value">
            {agencyMetrics.length > 0 ? agencyMetrics.reduce((max, a) => Math.max(max, a.competitivenessScore), 0) : 0}
          </div>
          <div className="metric-label flex items-center justify-center">
            <Star className="h-4 w-4 mr-1" />
            Top Competitiveness Score
          </div>
        </div>
      </div>

      {/* Main Comparison Charts */}
      {selectedAgencies.length > 0 && (
        <div className="space-y-8">
          {/* Radar Comparison */}
          <div className="chart-container">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Agency Performance Comparison</h3>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tickCount={6} />
                                 {comparisonData.map((agency, index) => 
                   agency ? (
                     <Radar
                       key={agency.agency}
                       name={agency.agency}
                       dataKey={agency.agency}
                       stroke={['#009edb', '#0077be', '#4db8e8'][index]}
                       fill={['#009edb', '#0077be', '#4db8e8'][index]}
                       fillOpacity={0.2}
                       strokeWidth={2}
                     />
                   ) : null
                 )}
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Side-by-Side Comparison Table */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Metrics Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Metric</th>
                    {comparisonData.map(agency => (
                      <th key={agency?.agency} className="text-center py-3 px-4 font-semibold text-gray-900">
                        {agency?.agency}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium">Total Job Postings</td>
                    {comparisonData.map(agency => (
                      <td key={agency?.agency} className="py-3 px-4 text-center">
                        {agency?.totalJobs}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <td className="py-3 px-4 font-medium">Avg Application Window</td>
                    {comparisonData.map(agency => (
                      <td key={agency?.agency} className="py-3 px-4 text-center">
                        {agency?.avgApplicationWindow} days
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium">Geographic Reach</td>
                    {comparisonData.map(agency => (
                      <td key={agency?.agency} className="py-3 px-4 text-center">
                        {agency?.geographicReach} countries
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <td className="py-3 px-4 font-medium">Grade Variety</td>
                    {comparisonData.map(agency => (
                      <td key={agency?.agency} className="py-3 px-4 text-center">
                        {agency?.gradeVariety} levels
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium">Remote Work Rate</td>
                    {comparisonData.map(agency => (
                      <td key={agency?.agency} className="py-3 px-4 text-center">
                        {agency?.remoteWorkRate.toFixed(1)}%
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <td className="py-3 px-4 font-medium">Multi-Language Rate</td>
                    {comparisonData.map(agency => (
                      <td key={agency?.agency} className="py-3 px-4 text-center">
                        {agency?.multiLanguageRate.toFixed(1)}%
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium">Competitiveness Score</td>
                    {comparisonData.map(agency => (
                      <td key={agency?.agency} className="py-3 px-4 text-center font-semibold text-un-blue">
                        {agency?.competitivenessScore}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* All Agencies Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Application Window vs Experience Scatter */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Experience Requirements vs Application Window</h3>
          <ResponsiveContainer width="100%" height={350}>
            <ScatterChart data={scatterData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="Avg Experience Required" 
                label={{ value: 'Average Experience Required (years)', position: 'insideBottom', offset: -10 }}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Application Window" 
                label={{ value: 'Application Window (days)', angle: -90, position: 'insideLeft' }}
              />
                             <Tooltip 
                 cursor={{ strokeDasharray: '3 3' }}
                 formatter={(value: any, name: any) => [
                   `${value} ${name === 'x' ? 'years' : 'days'}`,
                   name === 'x' ? 'Experience Required' : 'Application Window'
                 ]}
               />
              <Scatter dataKey="y" fill="#009edb" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Top Performers Ranking */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Agency Rankings by Job Volume</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={agencyMetrics.slice(0, 8)} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="agency" type="category" width={80} fontSize={12} />
              <Tooltip formatter={(value: any) => [`${value} jobs`, 'Total Postings']} />
              <Bar dataKey="totalJobs" fill="#009edb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights and Recommendations */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Benchmarking Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Performance Leaders</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• <strong>Most Active:</strong> {agencyMetrics[0]?.agency} ({agencyMetrics[0]?.totalJobs} jobs)</p>
              <p>• <strong>Fastest Hiring:</strong> {agencyMetrics.reduce((min, a) => a.avgApplicationWindow < min.avgApplicationWindow ? a : min, agencyMetrics[0])?.agency} ({agencyMetrics.reduce((min, a) => a.avgApplicationWindow < min.avgApplicationWindow ? a : min, agencyMetrics[0])?.avgApplicationWindow} days)</p>
              <p>• <strong>Most Geographic:</strong> {agencyMetrics.reduce((max, a) => a.geographicReach > max.geographicReach ? a : max, agencyMetrics[0])?.agency} ({agencyMetrics.reduce((max, a) => a.geographicReach > max.geographicReach ? a : max, agencyMetrics[0])?.geographicReach} countries)</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Strategic Recommendations</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Monitor top performers' hiring patterns for timing insights</p>
              <p>• Compare your application windows to industry benchmarks</p>
              <p>• Consider geographic expansion based on successful agencies</p>
              <p>• Evaluate remote work policies against market leaders</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgencyBenchmarking; 