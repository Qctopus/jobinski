/**
 * Grade × Geography Chart
 * 
 * Shows where different grade levels are being placed geographically.
 * Visualizes HQ vs Field distribution by seniority.
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { GradeGeographyData } from '../../services/analytics/WorkforceStructureAnalyzer';
import { MapPin, Building2, Globe, Home } from 'lucide-react';

interface GradeGeographyChartProps {
  data: GradeGeographyData[];
}

const GradeGeographyChart: React.FC<GradeGeographyChartProps> = ({ data }) => {
  // Icon mapping
  const locationIcons: Record<string, React.ReactNode> = {
    'Headquarters': <Building2 className="h-4 w-4" />,
    'Regional Hub': <Globe className="h-4 w-4" />,
    'Field': <MapPin className="h-4 w-4" />,
    'Home-based': <Home className="h-4 w-4" />
  };

  // Sort data by total count
  const sortedData = [...data].sort((a, b) => b.totalCount - a.totalCount);
  const totalPositions = sortedData.reduce((sum, d) => sum + d.totalCount, 0);

  // Prepare stacked bar data
  const gradeTiers = ['Executive', 'Director', 'Senior Professional', 'Mid Professional', 'Entry Professional', 'Support', 'Consultant', 'Intern'];
  
  const gradeColors: Record<string, string> = {
    'Executive': '#7C3AED',
    'Director': '#2563EB',
    'Senior Professional': '#0891B2',
    'Mid Professional': '#059669',
    'Entry Professional': '#D97706',
    'Support': '#DC2626',
    'Consultant': '#F59E0B',
    'Intern': '#8B5CF6',
    'Other': '#6B7280'
  };

  const chartData = sortedData.map(loc => {
    const result: Record<string, number | string> = {
      name: loc.locationType,
      total: loc.totalCount
    };
    
    loc.grades.forEach(g => {
      result[g.tier] = g.count;
    });
    
    return result;
  });

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; value: number; fill: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      const locationData = sortedData.find(d => d.locationType === label);
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <div className="font-semibold text-gray-900 mb-2">{label}</div>
          <div className="text-sm text-gray-600 mb-2">
            Total: {locationData?.totalCount.toLocaleString()} positions
          </div>
          <div className="space-y-1">
            {payload.filter(p => p.value > 0).map(p => (
              <div key={p.dataKey} className="flex items-center justify-between gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: p.fill }}></div>
                  <span>{p.dataKey}</span>
                </div>
                <span className="font-medium">{p.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {sortedData.map(loc => (
          <div 
            key={loc.locationType}
            className="bg-white rounded-lg p-3 border border-gray-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="text-gray-500">
                {locationIcons[loc.locationType]}
              </div>
              <span className="text-xs text-gray-500">{loc.locationType}</span>
            </div>
            <div className="text-xl font-bold text-gray-900">
              {loc.totalCount.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              {totalPositions > 0 ? ((loc.totalCount / totalPositions) * 100).toFixed(1) : 0}% of total
            </div>
          </div>
        ))}
      </div>

      {/* Stacked Bar Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="font-medium text-gray-900 mb-4">Grade Distribution by Location Type</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
            >
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={90} />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
                formatter={(value) => <span className="text-gray-700">{value}</span>}
              />
              {gradeTiers.map((tier) => (
                <Bar 
                  key={tier}
                  dataKey={tier} 
                  stackId="a" 
                  fill={gradeColors[tier]}
                  name={tier}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-4">Location Type Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sortedData.filter(loc => loc.totalCount > 0).map(loc => (
            <div key={loc.locationType} className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: loc.color }}
                />
                <span className="font-medium text-gray-900">{loc.locationType}</span>
                <span className="text-sm text-gray-500 ml-auto">
                  {loc.totalCount.toLocaleString()} positions
                </span>
              </div>
              
              <div className="space-y-2">
                {loc.grades.slice(0, 5).map(g => (
                  <div key={g.tier} className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: gradeColors[g.tier] || '#6B7280' }}
                    />
                    <span className="text-sm text-gray-700 flex-1">{g.tier}</span>
                    <span className="text-sm font-medium text-gray-900">{g.count}</span>
                    <span className="text-xs text-gray-500">({g.percentage.toFixed(1)}%)</span>
                  </div>
                ))}
                {loc.grades.length > 5 && (
                  <div className="text-xs text-gray-400 pl-4">
                    +{loc.grades.length - 5} more grade types
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Geographic Insights</h4>
        <div className="text-sm text-blue-800 space-y-1">
          {(() => {
            const hqData = sortedData.find(d => d.locationType === 'Headquarters');
            const fieldData = sortedData.find(d => d.locationType === 'Field');
            
            const insights: string[] = [];
            
            if (hqData && fieldData) {
              const hqRatio = (hqData.totalCount / totalPositions) * 100;
              const fieldRatio = (fieldData.totalCount / totalPositions) * 100;
              
              if (fieldRatio > 50) {
                insights.push(`Field-deployed workforce: ${fieldRatio.toFixed(0)}% of positions are in the field`);
              } else if (hqRatio > 50) {
                insights.push(`HQ-centric structure: ${hqRatio.toFixed(0)}% of positions are at headquarters`);
              }
            }
            
            const fieldSenior = fieldData?.grades.filter(g => 
              ['Executive', 'Director', 'Senior Professional'].includes(g.tier)
            ).reduce((sum, g) => sum + g.count, 0) || 0;
            
            if (fieldData && fieldData.totalCount > 0 && fieldSenior > 0) {
              const seniorFieldRatio = (fieldSenior / fieldData.totalCount) * 100;
              insights.push(`${seniorFieldRatio.toFixed(0)}% of field positions are senior level`);
            }
            
            const homeData = sortedData.find(d => d.locationType === 'Home-based');
            if (homeData && homeData.totalCount > 0) {
              const homeRatio = (homeData.totalCount / totalPositions) * 100;
              insights.push(`Remote work: ${homeRatio.toFixed(1)}% positions are home-based`);
            }
            
            if (insights.length === 0) {
              insights.push('Geographic distribution appears balanced across location types');
            }
            
            return insights.map((insight, i) => <p key={i}>• {insight}</p>);
          })()}
        </div>
      </div>
    </div>
  );
};

export default GradeGeographyChart;

