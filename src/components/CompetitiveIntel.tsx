import React, { useMemo, useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Target, Users, Zap, TrendingUp, Eye, ArrowRight, Award, MapPin } from 'lucide-react';
import { ProcessedJobData, FilterOptions } from '../types';
import { JobAnalyticsProcessor, JOB_CATEGORIES } from '../services/dataProcessor';

interface CompetitiveIntelProps {
  data: ProcessedJobData[];
  filters: FilterOptions;
}

const CompetitiveIntel: React.FC<CompetitiveIntelProps> = ({ data, filters }) => {
  const [selectedAgencies, setSelectedAgencies] = useState<string[]>([]);
  const processor = useMemo(() => new JobAnalyticsProcessor(), []);
  
  const filteredData = useMemo(() => {
    return processor.applyFilters ? processor.applyFilters(data, filters) : data;
  }, [data, filters, processor]);

  const competitiveAnalysis = useMemo(() => {
    return processor.calculateCompetitiveIntelligence(filteredData);
  }, [filteredData, processor]);

  const getCategoryColor = (categoryName: string) => {
    const category = JOB_CATEGORIES.find(cat => cat.name === categoryName);
    return category?.color || '#94A3B8';
  };

  const getIntensityColor = (intensity: 'High' | 'Medium' | 'Low') => {
    switch (intensity) {
      case 'High': return '#EF4444';
      case 'Medium': return '#F59E0B';
      case 'Low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const handleAgencyToggle = (agency: string) => {
    setSelectedAgencies(prev => {
      if (prev.includes(agency)) {
        return prev.filter(a => a !== agency);
      } else if (prev.length < 3) {
        return [...prev, agency];
      } else {
        return [agency]; // Replace if at limit
      }
    });
  };

  // Head-to-head comparison data
  const headToHeadData = useMemo(() => {
    if (selectedAgencies.length < 2) return null;
    
    const agencyData = selectedAgencies.map(agency => 
      competitiveAnalysis.agencyPositioning.find(a => a.agency === agency)
    ).filter(Boolean);
    
    return agencyData;
  }, [selectedAgencies, competitiveAnalysis.agencyPositioning]);

  // Market share pie chart data
  const marketShareData = useMemo(() => {
    const topAgencies = competitiveAnalysis.agencyPositioning.slice(0, 8);
    const others = competitiveAnalysis.agencyPositioning.slice(8);
    const othersTotal = others.reduce((sum, agency) => sum + agency.marketShare, 0);
    
    const pieData = topAgencies.map((agency, index) => ({
      name: agency.agency.length > 15 ? agency.agency.substring(0, 12) + '...' : agency.agency,
      value: agency.marketShare,
      color: `hsl(${(index * 45) % 360}, 70%, 50%)`
    }));
    
    if (othersTotal > 0) {
      pieData.push({
        name: 'Others',
        value: othersTotal,
        color: '#94A3B8'
      });
    }
    
    return pieData;
  }, [competitiveAnalysis.agencyPositioning]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Competitive Intelligence</h2>
        <div className="text-sm text-gray-600">
          {competitiveAnalysis.agencyPositioning.length} agencies analyzed
        </div>
      </div>

      {/* Key Competitive Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="metric-card">
          <div className="metric-value">
            {competitiveAnalysis.categoryDominance.length}
          </div>
          <div className="metric-label">
            <Target className="h-4 w-4 mr-1" />
            Active Categories
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-value">
            {competitiveAnalysis.competitiveIntensity.filter(c => c.intensity === 'High').length}
          </div>
          <div className="metric-label">
            <Zap className="h-4 w-4 mr-1" />
            High Competition Zones
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-value">
            {competitiveAnalysis.talentOverlap.length}
          </div>
          <div className="metric-label">
            <Users className="h-4 w-4 mr-1" />
            Talent Overlaps
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-value">
            {Math.round(competitiveAnalysis.agencyPositioning[0]?.marketShare || 0)}%
          </div>
          <div className="metric-label">
            <Award className="h-4 w-4 mr-1" />
            Market Leader Share
          </div>
        </div>
      </div>

      {/* Agency Positioning Analysis */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Volume vs Diversity Scatter */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className="h-6 w-6 text-un-blue" />
                <h3 className="text-lg font-semibold text-gray-900">Agency Positioning</h3>
              </div>
              <span className="text-sm text-gray-500">Volume vs Diversity</span>
            </div>
          </div>
          
          <div className="p-6">
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart data={competitiveAnalysis.agencyPositioning.slice(0, 15)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  dataKey="diversity" 
                  name="Role Diversity"
                  label={{ value: 'Role Diversity (# categories)', position: 'insideBottom', offset: -10 }}
                />
                <YAxis 
                  type="number" 
                  dataKey="volume" 
                  name="Job Volume"
                  label={{ value: 'Job Volume', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(value: any, name: any) => [
                    name === 'diversity' ? `${value} categories` : `${value} jobs`,
                    name === 'diversity' ? 'Role Diversity' : 'Job Volume'
                  ]}
                  labelFormatter={(label: any, payload: any) => {
                    if (payload && payload[0]) {
                      const data = payload[0].payload;
                      return `${data.agency} (${data.marketShare.toFixed(1)}% market share)`;
                    }
                    return label;
                  }}
                />
                <Scatter 
                  dataKey="volume" 
                  fill="#009edb"
                  r={6}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Market Share */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Award className="h-6 w-6 text-un-blue" />
                <h3 className="text-lg font-semibold text-gray-900">Market Share</h3>
              </div>
              <span className="text-sm text-gray-500">Job postings distribution</span>
            </div>
          </div>
          
          <div className="p-6">
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={marketShareData}
                  cx="50%"
                  cy="50%"
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                  labelLine={false}
                >
                  {marketShareData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`${value.toFixed(1)}%`, 'Market Share']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Agency Selection for Head-to-Head */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-un-blue" />
            <h3 className="text-lg font-semibold text-gray-900">Head-to-Head Comparison</h3>
            <span className="text-sm text-gray-500">(Select up to 3 agencies)</span>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            {competitiveAnalysis.agencyPositioning.slice(0, 10).map((agency) => (
              <button
                key={agency.agency}
                onClick={() => handleAgencyToggle(agency.agency)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  selectedAgencies.includes(agency.agency)
                    ? 'border-un-blue bg-blue-50 text-un-blue'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-sm">
                  {agency.agency.length > 12 ? agency.agency.substring(0, 10) + '...' : agency.agency}
                </div>
                <div className="text-xs text-gray-500">{agency.volume} jobs</div>
              </button>
            ))}
          </div>

          {headToHeadData && headToHeadData.length >= 2 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Metric</th>
                    {headToHeadData.map(agency => (
                      <th key={agency?.agency} className="text-center py-3 px-4 font-semibold text-gray-900">
                        {agency?.agency}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium">Total Job Volume</td>
                    {headToHeadData.map(agency => (
                      <td key={agency?.agency} className="py-3 px-4 text-center">
                        {agency?.volume}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <td className="py-3 px-4 font-medium">Role Diversity</td>
                    {headToHeadData.map(agency => (
                      <td key={agency?.agency} className="py-3 px-4 text-center">
                        {agency?.diversity} categories
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 font-medium">Market Share</td>
                    {headToHeadData.map(agency => (
                      <td key={agency?.agency} className="py-3 px-4 text-center font-semibold text-un-blue">
                        {agency?.marketShare.toFixed(1)}%
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Category Dominance */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-un-blue" />
            <h3 className="text-lg font-semibold text-gray-900">Category Dominance</h3>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {competitiveAnalysis.categoryDominance.slice(0, 9).map((category, index) => (
              <div key={category.category} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: getCategoryColor(category.category) }}
                  ></div>
                  <h4 className="font-semibold text-gray-900">
                    {category.category.length > 25 ? category.category.substring(0, 22) + '...' : category.category}
                  </h4>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Leader:</span>
                    <span className="font-medium text-un-blue">{category.leadingAgency}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Market Share:</span>
                    <span className="font-semibold">{category.marketShare.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Competition:</span>
                    <span className="text-sm">{category.competition} agencies</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Talent Overlap Analysis */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Eye className="h-6 w-6 text-un-blue" />
            <h3 className="text-lg font-semibold text-gray-900">Talent Overlap Analysis</h3>
          </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {competitiveAnalysis.talentOverlap.slice(0, 8).map((overlap, index) => (
              <div key={`${overlap.agencies[0]}-${overlap.agencies[1]}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{overlap.agencies[0]}</span>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{overlap.agencies[1]}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {overlap.commonCategories.length} common categories, {overlap.commonLocations.length} common locations
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-un-blue">
                    {overlap.overlapScore.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">overlap score</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Competitive Intensity Heat Map */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Zap className="h-6 w-6 text-un-blue" />
            <h3 className="text-lg font-semibold text-gray-900">Competitive Intensity</h3>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* High Competition Areas */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">High Competition Zones</h4>
              <div className="space-y-3">
                {competitiveAnalysis.competitiveIntensity
                  .filter(item => item.intensity === 'High')
                  .slice(0, 6)
                  .map((item, index) => (
                  <div key={`${item.category}-${item.location}`} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">
                        {item.category.length > 30 ? item.category.substring(0, 27) + '...' : item.category}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {item.location}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-red-600">
                        {item.agencyCount} agencies
                      </div>
                      <div className="text-xs text-red-500">High intensity</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Medium Competition Areas */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Medium Competition Zones</h4>
              <div className="space-y-3">
                {competitiveAnalysis.competitiveIntensity
                  .filter(item => item.intensity === 'Medium')
                  .slice(0, 6)
                  .map((item, index) => (
                  <div key={`${item.category}-${item.location}`} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">
                        {item.category.length > 30 ? item.category.substring(0, 27) + '...' : item.category}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {item.location}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-yellow-600">
                        {item.agencyCount} agencies
                      </div>
                      <div className="text-xs text-yellow-500">Medium intensity</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Intelligence Summary */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow text-white">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Competitive Intelligence Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Market Dynamics</h4>
              <ul className="text-sm space-y-1 opacity-90">
                <li>• Top agency holds {Math.round(competitiveAnalysis.agencyPositioning[0]?.marketShare || 0)}% market share</li>
                <li>• {competitiveAnalysis.competitiveIntensity.filter(c => c.intensity === 'High').length} high-competition zones identified</li>
                <li>• {competitiveAnalysis.talentOverlap.length} significant talent overlaps detected</li>
                <li>• Average {Math.round(competitiveAnalysis.categoryDominance.reduce((sum, cat) => sum + cat.competition, 0) / competitiveAnalysis.categoryDominance.length)} agencies per category</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Strategic Opportunities</h4>
              <ul className="text-sm space-y-1 opacity-90">
                <li>• Target low-competition locations for expansion</li>
                <li>• Monitor high-overlap agencies for talent competition</li>
                <li>• Focus on categories with fragmented leadership</li>
                <li>• Consider first-mover advantage in emerging areas</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompetitiveIntel; 