/**
 * Grade × Geography Chart
 * 
 * Shows where different grade levels are being placed geographically.
 * Compact visual bars with grade breakdown.
 */

import React from 'react';
import { GradeGeographyData } from '../../services/analytics/WorkforceStructureAnalyzer';
import { MapPin, Building2, Globe, Home } from 'lucide-react';

interface GradeGeographyChartProps {
  data: GradeGeographyData[];
}

const GradeGeographyChart: React.FC<GradeGeographyChartProps> = ({ data }) => {
  const sortedData = [...data].sort((a, b) => b.totalCount - a.totalCount);
  const totalPositions = sortedData.reduce((sum, d) => sum + d.totalCount, 0);
  const maxCount = Math.max(...sortedData.map(d => d.totalCount));

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

  const locationIcons: Record<string, React.ReactNode> = {
    'Headquarters': <Building2 className="h-3.5 w-3.5" />,
    'Regional Hub': <Globe className="h-3.5 w-3.5" />,
    'Field': <MapPin className="h-3.5 w-3.5" />,
    'Home-based': <Home className="h-3.5 w-3.5" />
  };

  const locationColors: Record<string, string> = {
    'Headquarters': '#3B82F6',
    'Regional Hub': '#10B981',
    'Field': '#F59E0B',
    'Home-based': '#8B5CF6'
  };

  return (
    <div className="space-y-3">
      {/* Visual Bars */}
      <div className="space-y-2">
        {sortedData.filter(loc => loc.totalCount > 0).map(loc => {
          const percentage = totalPositions > 0 ? (loc.totalCount / totalPositions) * 100 : 0;
          const barWidth = maxCount > 0 ? (loc.totalCount / maxCount) * 100 : 0;
          
          return (
            <div key={loc.locationType} className="group">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 w-24 flex-shrink-0">
                  <span className="text-gray-400">{locationIcons[loc.locationType]}</span>
                  <span className="text-xs font-medium text-gray-600 truncate">{loc.locationType}</span>
                </div>
                <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden relative">
                  {/* Segmented bar showing grade breakdown */}
                  <div className="flex h-full" style={{ width: `${barWidth}%` }}>
                    {loc.grades.map((g) => {
                      const gradeWidth = loc.totalCount > 0 ? (g.count / loc.totalCount) * 100 : 0;
                      if (gradeWidth < 1) return null;
                      return (
                        <div
                          key={g.tier}
                          className="h-full transition-opacity group-hover:opacity-80"
                          style={{ 
                            width: `${gradeWidth}%`,
                            backgroundColor: gradeColors[g.tier] || '#6B7280'
                          }}
                          title={`${g.tier}: ${g.count}`}
                        />
                      );
                    })}
                  </div>
                </div>
                <div className="w-16 text-right flex-shrink-0">
                  <span className="text-xs font-bold text-gray-800">{loc.totalCount.toLocaleString()}</span>
                  <span className="text-[10px] text-gray-400 ml-0.5">({percentage.toFixed(0)}%)</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Compact Grade Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 pt-2 border-t border-gray-100">
        {Object.entries(gradeColors).slice(0, 6).map(([tier, color]) => (
          <div key={tier} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }}></div>
            <span className="text-[10px] text-gray-500">{tier.replace(' Professional', '')}</span>
          </div>
        ))}
      </div>

      {/* Quick Insight */}
      {(() => {
        const hqData = sortedData.find(d => d.locationType === 'Headquarters');
        const fieldData = sortedData.find(d => d.locationType === 'Field');
        
        if (hqData && fieldData && totalPositions > 0) {
          const fieldRatio = (fieldData.totalCount / totalPositions) * 100;
          const hqRatio = (hqData.totalCount / totalPositions) * 100;
          
          if (fieldRatio > 50) {
            return (
              <div className="bg-amber-50 rounded px-2 py-1.5 text-[10px] text-amber-700 border border-amber-100">
                <span className="font-medium">Field-heavy:</span> {fieldRatio.toFixed(0)}% in field locations
              </div>
            );
          } else if (hqRatio > 40) {
            return (
              <div className="bg-blue-50 rounded px-2 py-1.5 text-[10px] text-blue-700 border border-blue-100">
                <span className="font-medium">HQ-focused:</span> {hqRatio.toFixed(0)}% at headquarters
              </div>
            );
          }
        }
        return null;
      })()}
    </div>
  );
};

export default GradeGeographyChart;

