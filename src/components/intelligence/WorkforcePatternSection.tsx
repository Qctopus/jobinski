/**
 * Workforce Pattern Section
 * 
 * Displays staff vs non-staff ratio, grade distribution, and category-specific patterns.
 */

import React from 'react';
import { Users, Briefcase, Building2, TrendingUp } from 'lucide-react';
import { WorkforcePatternMetrics } from '../../services/analytics/IntelligenceInsightsEngine';
import { GeneratedNarrative } from '../../services/analytics/NarrativeGenerator';
import { ProcessedJobData } from '../../types';
import { NarrativeBlock, ComparisonBar, MiniTable, TrendArrow, InlineSparkline } from './shared';
import { JOB_CLASSIFICATION_DICTIONARY } from '../../dictionary';

interface WorkforcePatternSectionProps {
  metrics: WorkforcePatternMetrics;
  narrative: GeneratedNarrative;
  isAgencyView: boolean;
  agencyName: string;
  currentJobs: ProcessedJobData[];
  marketJobs: ProcessedJobData[];
}

const getCategoryColor = (categoryId: string): string => {
  const cat = JOB_CLASSIFICATION_DICTIONARY.find(c => c.id === categoryId || c.name === categoryId);
  return cat?.color || '#6B7280';
};

const getCategoryName = (categoryId: string): string => {
  const cat = JOB_CLASSIFICATION_DICTIONARY.find(c => c.id === categoryId || c.name === categoryId);
  if (cat) return cat.name;
  return categoryId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const WorkforcePatternSection: React.FC<WorkforcePatternSectionProps> = ({
  metrics,
  narrative,
  isAgencyView,
  agencyName,
  currentJobs,
  marketJobs
}) => {
  const {
    staffRatio,
    gradeDistribution,
    categoryStaffPatterns,
    gradeAnomalies,
    experienceRequirements,
    seniorityTrend
  } = metrics;

  // Prepare grade distribution for display
  const staffGrades = gradeDistribution.filter(g => 
    ['Executive', 'Director', 'Senior Professional', 'Mid Professional', 'Entry Professional', 'Support'].includes(g.tier)
  );
  
  const nonStaffGrades = gradeDistribution.filter(g => 
    ['Consultant', 'Intern'].includes(g.tier)
  );

  // Build category table data
  const categoryTableData = categoryStaffPatterns.slice(0, 5).map((cat, index) => ({
    id: `cat-${index}`,
    category: getCategoryName(cat.category),
    yourRatio: cat.yourStaffRatio,
    marketRatio: cat.marketStaffRatio,
    competitor: cat.topCompetitor?.name || '-',
    competitorRatio: cat.topCompetitor?.staffRatio ?? 0,
    diff: cat.diff
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Section Header */}
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-white">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
            <Users className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Workforce Structure Patterns</h3>
            <p className="text-xs text-gray-500">Staff vs non-staff, grade distribution, and hiring profiles</p>
          </div>
        </div>
        {seniorityTrend.length > 0 && (
          <InlineSparkline 
            data={seniorityTrend.map(s => s.seniorRatio)}
            width={100}
            height={32}
            color="#10B981"
          />
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Narrative Block */}
        <NarrativeBlock
          body={narrative.body}
          callouts={narrative.callouts}
          variant="subtle"
          size="sm"
          className="mb-5"
        />

        {/* Staff Ratio Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          {/* Staff vs Non-Staff */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
              Staff vs Non-Staff Mix
            </h4>
            
            {/* Stacked Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-600">Current Period</span>
                <span className="font-medium">
                  {staffRatio.current.toFixed(0)}% Staff / {(100 - staffRatio.current).toFixed(0)}% Non-Staff
                </span>
              </div>
              <div className="h-4 rounded-full overflow-hidden flex bg-gray-200">
                <div 
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${staffRatio.current}%` }}
                />
                <div 
                  className="h-full bg-amber-400 transition-all duration-300"
                  style={{ width: `${100 - staffRatio.current}%` }}
                />
              </div>
              <div className="flex justify-between mt-1 text-[10px] text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm bg-blue-500" />
                  <span>Staff</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm bg-amber-400" />
                  <span>Non-Staff</span>
                </div>
              </div>
            </div>

            {/* Comparisons */}
            <div className="space-y-2 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Prior Period</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800">{staffRatio.previous.toFixed(0)}% staff</span>
                  <TrendArrow value={staffRatio.change} size="xs" format="pp" />
                </div>
              </div>
              {isAgencyView && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Market Average</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">{staffRatio.market.toFixed(0)}% staff</span>
                    <span className={`text-[10px] font-medium ${
                      staffRatio.current > staffRatio.market ? 'text-emerald-600' : 'text-amber-600'
                    }`}>
                      ({staffRatio.current > staffRatio.market ? '+' : ''}{(staffRatio.current - staffRatio.market).toFixed(0)}pp)
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Grade Distribution */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
              Grade Distribution
            </h4>
            
            <div className="space-y-2">
              {staffGrades.filter(g => g.current > 0 || g.previous > 0).slice(0, 5).map(grade => (
                <div key={grade.tier} className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: grade.color }}
                  />
                  <span className="text-xs text-gray-700 w-32 truncate">{grade.tier}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(grade.current * 3, 100)}%`,
                        backgroundColor: grade.color 
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-800 w-10 text-right">
                    {grade.current.toFixed(0)}%
                  </span>
                  {Math.abs(grade.change) > 2 && (
                    <TrendArrow value={grade.change} size="xs" format="pp" />
                  )}
                </div>
              ))}
            </div>

            {/* Non-staff breakdown */}
            {nonStaffGrades.some(g => g.current > 0) && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-[10px] text-gray-500 mb-2">Non-Staff Breakdown</div>
                <div className="flex gap-3">
                  {nonStaffGrades.filter(g => g.current > 0).map(grade => (
                    <div key={grade.tier} className="flex items-center gap-1.5">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: grade.color }}
                      />
                      <span className="text-xs text-gray-700">{grade.tier}</span>
                      <span className="text-xs font-medium">{grade.current.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Category Staff Patterns (Agency View) */}
        {isAgencyView && categoryStaffPatterns.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 mb-5">
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
              Staff Ratio by Category
            </h4>
            <p className="text-xs text-gray-500 mb-4">
              How your staff/non-staff mix compares to market and top competitor in each category
            </p>

            <MiniTable
              columns={[
                { key: 'category', header: 'Category', align: 'left' },
                { key: 'yourRatio', header: 'Your Staff%', align: 'right', format: 'percent' },
                { key: 'marketRatio', header: 'Market', align: 'right', format: 'percent' },
                { key: 'competitor', header: 'Top Competitor', align: 'left' },
                { key: 'competitorRatio', header: 'Their Staff%', align: 'right', format: 'percent' },
                { key: 'diff', header: 'vs Market', align: 'right', format: 'change' }
              ]}
              data={categoryTableData}
              maxRows={5}
            />
          </div>
        )}

        {/* Grade Anomalies */}
        {gradeAnomalies.length > 0 && (
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <h4 className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              Grade Anomalies Detected
            </h4>
            <div className="space-y-2">
              {gradeAnomalies.slice(0, 3).map((anomaly, index) => (
                <div key={index} className="text-xs text-amber-800">
                  <span className="font-medium">{anomaly.tier}</span> positions are{' '}
                  <span className="font-semibold">
                    {Math.abs(anomaly.deviation * 100).toFixed(0)}% {anomaly.deviation > 0 ? 'above' : 'below'}
                  </span>{' '}
                  historical average ({anomaly.count} vs avg {anomaly.historicalAvg.toFixed(0)})
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Experience Requirements (if available) */}
        {experienceRequirements.length > 0 && experienceRequirements.some(e => e.avgExperience > 0) && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
              Experience Requirements by Category
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {experienceRequirements.filter(e => e.avgExperience > 0).map((exp, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="text-xs text-gray-500 truncate mb-1">{getCategoryName(exp.category)}</div>
                  <div className="text-lg font-bold text-gray-800">{exp.avgExperience.toFixed(1)}y</div>
                  {isAgencyView && exp.marketAvg > 0 && (
                    <div className="text-[10px] text-gray-500">
                      Market: {exp.marketAvg.toFixed(1)}y
                      {Math.abs(exp.diff) > 0.5 && (
                        <span className={exp.diff > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                          {' '}({exp.diff > 0 ? '+' : ''}{exp.diff.toFixed(1)}y)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkforcePatternSection;



