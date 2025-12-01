/**
 * Workforce Population Pyramid
 * 
 * A true population pyramid visualization comparing workforce structure
 * between two time periods. Bars extend from a central axis outward,
 * creating the classic pyramid shape.
 * 
 * Left side: Current period (colored)
 * Right side: Previous period (muted)
 * Center: Grade labels
 * Top: Executive/Senior (narrow)
 * Bottom: Entry/Support (wide)
 */

import React, { useMemo } from 'react';
import { WorkforcePyramidData } from '../../services/analytics/WorkforceStructureAnalyzer';
import { ArrowRight, ArrowLeft, TrendingUp, TrendingDown, Minus, ChevronUp, ChevronDown } from 'lucide-react';

interface WorkforcePyramidProps {
  data: WorkforcePyramidData;
  marketData?: WorkforcePyramidData | null;
  isAgencyView: boolean;
  agencyName?: string;
  previousPeriodData?: WorkforcePyramidData | null;
  currentPeriodLabel?: string;
  previousPeriodLabel?: string;
}

interface GradeRow {
  grade: string;
  category: 'executive' | 'senior' | 'mid' | 'entry' | 'support' | 'nonstaff';
  currentCount: number;
  previousCount: number;
  change: number;
}

// Category colors - used for left side (current period)
const categoryStyles: Record<string, { color: string; bgLight: string }> = {
  executive: { color: '#7C3AED', bgLight: '#EDE9FE' },
  senior: { color: '#2563EB', bgLight: '#DBEAFE' },
  mid: { color: '#0891B2', bgLight: '#CFFAFE' },
  entry: { color: '#10B981', bgLight: '#D1FAE5' },
  support: { color: '#F59E0B', bgLight: '#FEF3C7' },
  nonstaff: { color: '#EF4444', bgLight: '#FEE2E2' }
};

// Map grade to category
const getGradeCategory = (grade: string): GradeRow['category'] => {
  const g = grade.toUpperCase();
  if (['D2', 'ASG', 'USG', 'SG', 'DSG'].includes(g)) return 'executive';
  if (g === 'D1' || g === 'P5' || g === 'NO-D' || g === 'NOD' || g.match(/^IPSA[-]?1[1-2]$/)) return 'senior';
  if (g.match(/^P[-]?[34]$/) || g === 'NO-C' || g === 'NOC' || g.match(/^IPSA[-]?(9|10)$/) || g.match(/^NPSA[-]?1[0-1]$/)) return 'mid';
  if (g.match(/^P[-]?[12]$/) || g.match(/^NO[-]?[AB]$/) || g === 'NOA' || g === 'NOB' || g.match(/^IPSA[-]?[78]$/) || g.match(/^NPSA[-]?[789]$/)) return 'entry';
  if (g.match(/^G[-]?[1-7]$/) || g.match(/^NPSA[-]?[1-6]$/)) return 'support';
  return 'nonstaff';
};

const categoryLabels: Record<string, string> = {
  executive: 'Executive',
  senior: 'Senior',
  mid: 'Mid-Level',
  entry: 'Entry',
  support: 'Support',
  nonstaff: 'Non-Staff'
};

const WorkforcePyramid: React.FC<WorkforcePyramidProps> = ({
  data,
  previousPeriodData,
  currentPeriodLabel = 'Current Period',
  previousPeriodLabel = 'Previous Period'
}) => {
  
  // Build grade rows
  const gradeRows = useMemo((): GradeRow[] => {
    const grades: Map<string, GradeRow> = new Map();
    
    // Process current period
    data.pyramid.forEach(tier => {
      tier.grades.forEach(g => {
        grades.set(g.grade, {
          grade: g.grade,
          category: getGradeCategory(g.grade),
          currentCount: g.count,
          previousCount: 0,
          change: 0
        });
      });
    });
    
    // Add non-staff as combined categories
    const consultants = data.nonStaff.find(n => n.category === 'Consultants');
    const interns = data.nonStaff.find(n => n.category === 'Interns');
    const volunteers = data.nonStaff.find(n => n.category === 'Volunteers');
    
    if (consultants && consultants.count > 0) {
      grades.set('Consultant', {
        grade: 'Consultant',
        category: 'nonstaff',
        currentCount: consultants.count,
        previousCount: 0,
        change: 0
      });
    }
    if (interns && interns.count > 0) {
      grades.set('Intern', {
        grade: 'Intern',
        category: 'nonstaff',
        currentCount: interns.count,
        previousCount: 0,
        change: 0
      });
    }
    if (volunteers && volunteers.count > 0) {
      grades.set('UNV', {
        grade: 'UNV',
        category: 'nonstaff',
        currentCount: volunteers.count,
        previousCount: 0,
        change: 0
      });
    }
    
    // Process previous period
    if (previousPeriodData) {
      previousPeriodData.pyramid.forEach(tier => {
        tier.grades.forEach(g => {
          const existing = grades.get(g.grade);
          if (existing) {
            existing.previousCount = g.count;
            existing.change = existing.currentCount - g.count;
          } else {
            grades.set(g.grade, {
              grade: g.grade,
              category: getGradeCategory(g.grade),
              currentCount: 0,
              previousCount: g.count,
              change: -g.count
            });
          }
        });
      });
      
      // Previous non-staff
      const prevConsultants = previousPeriodData.nonStaff.find(n => n.category === 'Consultants');
      const prevInterns = previousPeriodData.nonStaff.find(n => n.category === 'Interns');
      const prevVolunteers = previousPeriodData.nonStaff.find(n => n.category === 'Volunteers');
      
      if (prevConsultants) {
        const existing = grades.get('Consultant');
        if (existing) {
          existing.previousCount = prevConsultants.count;
          existing.change = existing.currentCount - prevConsultants.count;
        }
      }
      if (prevInterns) {
        const existing = grades.get('Intern');
        if (existing) {
          existing.previousCount = prevInterns.count;
          existing.change = existing.currentCount - prevInterns.count;
        }
      }
      if (prevVolunteers) {
        const existing = grades.get('UNV');
        if (existing) {
          existing.previousCount = prevVolunteers.count;
          existing.change = existing.currentCount - prevVolunteers.count;
        }
      }
    }
    
    // Sort: Executive at top, Support/Non-staff at bottom
    const categoryOrder = ['executive', 'senior', 'mid', 'entry', 'support', 'nonstaff'];
    
    return Array.from(grades.values())
      .filter(g => g.currentCount > 0 || g.previousCount > 0)
      .sort((a, b) => {
        const catDiff = categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
        if (catDiff !== 0) return catDiff;
        // Within category, sort by current count descending
        return b.currentCount - a.currentCount;
      });
  }, [data, previousPeriodData]);

  // Max count for scaling (use max of either period)
  const maxCount = useMemo(() => {
    return Math.max(
      ...gradeRows.map(g => Math.max(g.currentCount, g.previousCount)),
      1
    );
  }, [gradeRows]);

  // Group rows by category for visual separators
  const rowsWithSeparators = useMemo(() => {
    const result: Array<{ type: 'row' | 'separator'; data?: GradeRow; category?: string }> = [];
    let lastCategory: string | null = null;
    
    gradeRows.forEach(row => {
      if (lastCategory !== null && lastCategory !== row.category) {
        result.push({ type: 'separator', category: row.category });
      }
      result.push({ type: 'row', data: row });
      lastCategory = row.category;
    });
    
    return result;
  }, [gradeRows]);

  // Calculate totals
  const totals = useMemo(() => {
    const current = gradeRows.reduce((sum, g) => sum + g.currentCount, 0);
    const previous = gradeRows.reduce((sum, g) => sum + g.previousCount, 0);
    return { current, previous, change: current - previous };
  }, [gradeRows]);

  // Change indicator component
  const ChangeArrow: React.FC<{ change: number }> = ({ change }) => {
    if (change === 0) return <Minus className="h-3 w-3 text-gray-300" />;
    if (change > 0) return <ChevronUp className="h-3 w-3 text-emerald-500" />;
    return <ChevronDown className="h-3 w-3 text-rose-500" />;
  };

  return (
    <div className="space-y-3">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-gradient-to-r from-indigo-500 to-violet-500"></div>
            <span className="text-xs text-gray-600">{currentPeriodLabel}</span>
            <span className="text-sm font-bold text-gray-900">{totals.current.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-gray-300"></div>
            <span className="text-xs text-gray-500">{previousPeriodLabel}</span>
            <span className="text-sm font-bold text-gray-400">{totals.previous.toLocaleString()}</span>
          </div>
        </div>
        
        {previousPeriodData && (
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
            totals.change > 0 
              ? 'bg-emerald-100 text-emerald-700' 
              : totals.change < 0 
                ? 'bg-rose-100 text-rose-700' 
                : 'bg-gray-100 text-gray-600'
          }`}>
            {totals.change > 0 ? <TrendingUp className="h-3 w-3" /> : totals.change < 0 ? <TrendingDown className="h-3 w-3" /> : null}
            {totals.change > 0 ? '+' : ''}{totals.change}
          </div>
        )}
      </div>

      {/* Pyramid Container - Compact */}
      <div className="bg-gradient-to-b from-slate-50 to-white rounded-lg border border-slate-200 overflow-hidden">
        {/* Column Headers */}
        <div className="grid grid-cols-[1fr_80px_1fr] bg-slate-100 border-b border-slate-200">
          <div className="py-1.5 px-2 text-right">
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
              Current →
            </span>
          </div>
          <div className="py-1.5 px-1 text-center border-x border-slate-200 bg-white">
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Grade</span>
          </div>
          <div className="py-1.5 px-2 text-left">
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
              ← Previous
            </span>
          </div>
        </div>

        {/* Pyramid Rows - Compact */}
        <div className="divide-y divide-slate-100">
          {rowsWithSeparators.map((item, idx) => {
            if (item.type === 'separator') {
              return (
                <div key={`sep-${idx}`} className="grid grid-cols-[1fr_80px_1fr] bg-slate-50">
                  <div className="py-0.5"></div>
                  <div className="py-0.5 px-1 text-center border-x border-slate-200 bg-slate-100">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                      {categoryLabels[item.category!]}
                    </span>
                  </div>
                  <div className="py-0.5"></div>
                </div>
              );
            }
            
            const row = item.data!;
            const currentWidth = (row.currentCount / maxCount) * 100;
            const previousWidth = (row.previousCount / maxCount) * 100;
            const style = categoryStyles[row.category];
            
            return (
              <div 
                key={row.grade} 
                className="grid grid-cols-[1fr_80px_1fr] hover:bg-slate-50/50 transition-colors"
              >
                {/* Left Bar (Current Period) - extends RIGHT from center */}
                <div className="py-1 px-1.5 flex items-center justify-end gap-1.5">
                  <span className="text-[10px] text-slate-500 tabular-nums">
                    {row.currentCount > 0 ? row.currentCount.toLocaleString() : ''}
                  </span>
                  <div className="h-4 flex items-center justify-end" style={{ width: '100%' }}>
                    <div
                      className="h-full rounded-l-sm transition-all duration-500 relative group"
                      style={{
                        width: `${currentWidth}%`,
                        minWidth: row.currentCount > 0 ? '3px' : '0',
                        background: `linear-gradient(90deg, ${style.color}dd, ${style.color})`,
                      }}
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute right-full mr-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        <div className="bg-slate-800 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap">
                          {row.currentCount}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Center - Grade Label with Change Indicator */}
                <div className="py-1 px-0.5 flex items-center justify-center gap-0.5 border-x border-slate-100 bg-white">
                  <ChangeArrow change={row.change} />
                  <span 
                    className="text-[10px] font-semibold text-center"
                    style={{ color: style.color }}
                  >
                    {row.grade}
                  </span>
                </div>
                
                {/* Right Bar (Previous Period) - extends LEFT from center */}
                <div className="py-1 px-1.5 flex items-center justify-start gap-1.5">
                  <div className="h-4 flex items-center justify-start" style={{ width: '100%' }}>
                    <div
                      className="h-full rounded-r-sm transition-all duration-500 bg-slate-300"
                      style={{
                        width: `${previousWidth}%`,
                        minWidth: row.previousCount > 0 ? '3px' : '0',
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 tabular-nums">
                    {row.previousCount > 0 ? row.previousCount.toLocaleString() : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Cards - Compact */}
      {previousPeriodData && (
        <div className="grid grid-cols-3 gap-2">
          {/* Growing */}
          <div className="bg-emerald-50 rounded-lg p-2 border border-emerald-100">
            <div className="flex items-center gap-1 mb-1.5">
              <TrendingUp className="h-3 w-3 text-emerald-600" />
              <span className="text-[10px] font-semibold text-emerald-700 uppercase">Growing</span>
            </div>
            <div className="space-y-0.5">
              {gradeRows
                .filter(g => g.change > 0)
                .sort((a, b) => b.change - a.change)
                .slice(0, 3)
                .map(g => (
                  <div key={g.grade} className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-700">{g.grade}</span>
                    <span className="font-semibold text-emerald-600">+{g.change}</span>
                  </div>
                ))
              }
              {gradeRows.filter(g => g.change > 0).length === 0 && (
                <span className="text-[10px] text-slate-400">No growth</span>
              )}
            </div>
          </div>

          {/* Shrinking */}
          <div className="bg-rose-50 rounded-lg p-2 border border-rose-100">
            <div className="flex items-center gap-1 mb-1.5">
              <TrendingDown className="h-3 w-3 text-rose-600" />
              <span className="text-[10px] font-semibold text-rose-700 uppercase">Shrinking</span>
            </div>
            <div className="space-y-0.5">
              {gradeRows
                .filter(g => g.change < 0)
                .sort((a, b) => a.change - b.change)
                .slice(0, 3)
                .map(g => (
                  <div key={g.grade} className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-700">{g.grade}</span>
                    <span className="font-semibold text-rose-600">{g.change}</span>
                  </div>
                ))
              }
              {gradeRows.filter(g => g.change < 0).length === 0 && (
                <span className="text-[10px] text-slate-400">No decline</span>
              )}
            </div>
          </div>

          {/* Staff Mix */}
          <div className="bg-indigo-50 rounded-lg p-2 border border-indigo-100">
            <div className="flex items-center gap-1 mb-1.5">
              <span className="text-[10px] font-semibold text-indigo-700 uppercase">Staff Mix</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-600">Staff ratio</span>
                <div className="flex items-center gap-0.5">
                  <span className="font-semibold text-indigo-700">{data.staffPercentage.toFixed(0)}%</span>
                  {previousPeriodData.staffPercentage !== data.staffPercentage && (
                    <span className={`text-[9px] ${
                      data.staffPercentage > previousPeriodData.staffPercentage 
                        ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      ({data.staffPercentage > previousPeriodData.staffPercentage ? '+' : ''}
                      {(data.staffPercentage - previousPeriodData.staffPercentage).toFixed(1)}pp)
                    </span>
                  )}
                </div>
              </div>
              <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-indigo-500 transition-all"
                  style={{ width: `${data.staffPercentage}%` }}
                />
                <div 
                  className="h-full bg-amber-400"
                  style={{ width: `${data.nonStaffPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>Staff</span>
                <span>Non-Staff</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No comparison message */}
      {!previousPeriodData && (
        <div className="text-center py-2 text-xs text-slate-500 bg-slate-50 rounded-lg">
          Select a comparison period to see evolution
        </div>
      )}
    </div>
  );
};

export default WorkforcePyramid;
