/**
 * WorkforcePatternSection - Optimized layout with reduced whitespace
 */

import React from 'react';
import { Users, Briefcase, Scale } from 'lucide-react';
import { WorkforceMetrics } from '../../../services/analytics/IntelligenceBriefEngine';
import { ComparisonTable, formatters, TrendIndicator } from './shared';

interface WorkforcePatternSectionProps {
  data: WorkforceMetrics;
  agencyName?: string;
}

// Compact Donut Chart
const CompactDonut: React.FC<{
  segments: Array<{ label: string; percentage: number; color: string }>;
  centerValue: string;
  centerLabel: string;
  size?: number;
}> = ({ segments, centerValue, centerLabel, size = 120 }) => {
  const thickness = 24;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let currentOffset = 0;
  const renderedSegments = segments.map((item) => {
    const percentage = item.percentage / 100;
    const segmentLength = circumference * percentage;
    const offset = currentOffset;
    currentOffset += segmentLength;
    return { ...item, strokeDasharray: `${segmentLength} ${circumference - segmentLength}`, strokeDashoffset: -offset };
  });

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="#F3F4F6" strokeWidth={thickness} />
        {renderedSegments.map((segment, i) => (
          <circle key={i} cx={center} cy={center} r={radius} fill="none" stroke={segment.color}
            strokeWidth={thickness} strokeDasharray={segment.strokeDasharray} strokeDashoffset={segment.strokeDashoffset}
            strokeLinecap="butt" className="transition-all duration-500" />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-gray-900 tabular-nums">{centerValue}</span>
        <span className="text-[10px] text-gray-500 font-medium">{centerLabel}</span>
      </div>
    </div>
  );
};

// Horizontal grade bars with change indicators
const GradeBars: React.FC<{
  data: Array<{ tier: string; percentage: number; color: string; previousPercentage?: number }>;
}> = ({ data }) => {
  const maxPct = Math.max(...data.map(d => d.percentage), 1);
  
  return (
    <div className="space-y-1">
      {data.filter(g => g.percentage > 0).map((item, i) => {
        const change = item.previousPercentage !== undefined ? item.percentage - item.previousPercentage : 0;
        return (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-[11px] text-gray-600 w-24 truncate">{item.tier}</span>
            <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(item.percentage / maxPct) * 100}%`, backgroundColor: item.color }} />
            </div>
            <span className="text-[11px] font-semibold text-gray-900 w-8 text-right tabular-nums">{item.percentage.toFixed(0)}%</span>
            {Math.abs(change) > 2 && (
              <span className={`text-[10px] w-8 ${change > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {change > 0 ? '+' : ''}{change.toFixed(0)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Seniority thermometer
const SeniorityBar: React.FC<{ junior: number; mid: number; senior: number }> = ({ junior, mid, senior }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between text-[10px] text-gray-500">
      <span>Junior</span><span>Senior</span>
    </div>
    <div className="h-3 rounded-full bg-gray-100 flex overflow-hidden">
      <div className="h-full bg-blue-400" style={{ width: `${junior}%` }} />
      <div className="h-full bg-indigo-500" style={{ width: `${mid}%` }} />
      <div className="h-full bg-purple-600" style={{ width: `${senior}%` }} />
    </div>
    <div className="flex justify-between text-[9px] text-gray-500">
      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400" />{junior.toFixed(0)}%</span>
      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />{mid.toFixed(0)}%</span>
      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-600" />{senior.toFixed(0)}%</span>
    </div>
  </div>
);

export const WorkforcePatternSection: React.FC<WorkforcePatternSectionProps> = ({ data, agencyName }) => {
  const subject = agencyName || 'The market';
  const staffDonutData = [
    { label: 'Staff', percentage: data.staffRatio, color: '#3B82F6' },
    { label: 'Non-Staff', percentage: 100 - data.staffRatio, color: '#F59E0B' }
  ];
  
  const seniorPct = data.seniorRatio;
  const juniorPct = data.gradeDistribution.find(g => g.tier === 'Entry' || g.tier === 'Junior')?.percentage || 20;
  const midPct = Math.max(0, 100 - seniorPct - juniorPct);

  const narrative = `Non-staff positions account for ${(100 - data.staffRatio).toFixed(0)}% of ${agencyName ? subject.toLowerCase() + "'s" : 'market'} hiring.`;

  const columns = agencyName ? [
    { key: 'categoryName', header: 'Category', align: 'left' as const, width: '30%' },
    { key: 'yourStaffPct', header: 'Staff%', align: 'right' as const, format: formatters.percent },
    { key: 'marketStaffPct', header: 'Market', align: 'right' as const, format: formatters.percent },
    { key: 'gap', header: 'Gap', align: 'right' as const, format: formatters.gap }
  ] : [
    { key: 'categoryName', header: 'Category', align: 'left' as const, width: '40%' },
    { key: 'yourStaffPct', header: 'Staff%', align: 'right' as const, format: formatters.percent },
    { key: 'topCompetitor', header: 'Top Hirer', align: 'left' as const }
  ];

  return (
    <section className="border-b border-gray-200">
      <div className="h-0.5 bg-gradient-to-r from-purple-500 to-pink-500" />
      
      <div className="px-6 py-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-7 w-7 rounded-lg bg-purple-100 flex items-center justify-center">
            <Users className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Workforce Composition Patterns</h2>
            <p className="text-xs text-gray-500">{narrative}</p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-3">
          {/* Left: Donut + Stats - expanded vertically */}
          <div className="col-span-3 flex flex-col items-center gap-2">
            <CompactDonut segments={staffDonutData} centerValue={`${data.staffRatio.toFixed(0)}%`} centerLabel="Staff" size={130} />
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Staff</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Non-Staff</span>
            </div>
            <div className="text-[10px] text-gray-500 flex items-center gap-1">
              Prior: {data.previousStaffRatio.toFixed(0)}% staff
              {Math.abs(data.staffChange) > 2 && (
                <TrendIndicator value={data.staffChange} format="pp" size="sm" />
              )}
            </div>
            
            {/* Quick stats - vertical stack for better space use */}
            <div className="w-full space-y-2 mt-2">
              <div className="bg-purple-50 rounded-lg p-2.5 border border-purple-100">
                <div className="text-lg font-bold text-purple-900 tabular-nums">{data.staffRatio.toFixed(0)}%</div>
                <div className="text-[9px] text-purple-600 font-medium">Staff Ratio</div>
              </div>
              <div className="bg-indigo-50 rounded-lg p-2.5 border border-indigo-100">
                <div className="text-lg font-bold text-indigo-900 tabular-nums">{data.seniorRatio.toFixed(0)}%</div>
                <div className="text-[9px] text-indigo-600 font-medium">Senior (P5+)</div>
              </div>
            </div>
          </div>

          {/* Middle: Grade distribution - expanded */}
          <div className="col-span-5 bg-gray-50 rounded-lg p-3">
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Grade Distribution</h3>
            <GradeBars data={data.gradeDistribution} />
            
            <div className="mt-4 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-1 mb-2">
                <Scale className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-[10px] font-semibold text-gray-600">Seniority Balance</span>
              </div>
              <SeniorityBar junior={juniorPct} mid={midPct} senior={seniorPct} />
            </div>
            
            {data.nonStaffBreakdown.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <span className="text-[9px] font-semibold text-gray-500 uppercase">Non-Staff Types</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {data.nonStaffBreakdown.slice(0, 4).map((t, i) => (
                    <span key={i} className="bg-white px-2 py-1 rounded-lg text-[10px] border shadow-sm">
                      {t.type} <span className="font-semibold">{t.percentage.toFixed(0)}%</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Staff by Category table - EXPANDED downwards */}
          <div className="col-span-4 flex flex-col">
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-1">
              <Briefcase className="h-3 w-3" /> Staff Ratio by Category
            </h3>
            <div className="rounded-lg border border-gray-200 overflow-hidden flex-1 overflow-y-auto">
              <ComparisonTable columns={columns} data={data.categoryStaffPatterns.filter(c => c.jobCount >= 5).slice(0, 12)} striped compact />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
