/**
 * WorkforcePatternSection - Staff/grade analysis with tables
 */

import React from 'react';
import { Users, Briefcase } from 'lucide-react';
import { WorkforceMetrics } from '../../../services/analytics/IntelligenceBriefEngine';
import { DonutChart, HorizontalBars, ComparisonTable, formatters, TrendIndicator } from './shared';

interface WorkforcePatternSectionProps {
  data: WorkforceMetrics;
  agencyName?: string;
}

export const WorkforcePatternSection: React.FC<WorkforcePatternSectionProps> = ({ data, agencyName }) => {
  const subject = agencyName || 'The market';
  const narrative = generateNarrative(data, subject, !!agencyName);

  // Prepare donut data for staff/non-staff
  const staffDonutData = [
    { label: 'Staff', value: data.staffRatio, percentage: data.staffRatio, color: '#3B82F6' },
    { label: 'Non-Staff', value: 100 - data.staffRatio, percentage: 100 - data.staffRatio, color: '#F59E0B' }
  ];

  // Grade distribution for horizontal bars
  const gradeData = data.gradeDistribution.map(g => ({
    label: g.tier,
    value: g.count,
    percentage: g.percentage,
    color: g.color,
    previousPercentage: g.previousPercentage
  }));

  // Category × Staff table columns - different for agency vs market view
  const agencyColumns = [
    { key: 'categoryName', header: 'Category', align: 'left' as const, width: '25%' },
    { key: 'yourStaffPct', header: 'Your Staff%', align: 'right' as const, format: formatters.percent },
    { key: 'marketStaffPct', header: 'Market', align: 'right' as const, format: formatters.percent },
    { key: 'topCompetitor', header: 'Top Competitor', align: 'left' as const },
    { key: 'competitorStaffPct', header: 'Their Staff%', align: 'right' as const, format: formatters.percent },
    { key: 'gap', header: 'Gap', align: 'right' as const, format: formatters.gap }
  ];

  const marketColumns = [
    { key: 'categoryName', header: 'Category', align: 'left' as const, width: '30%' },
    { key: 'yourStaffPct', header: 'Staff%', align: 'right' as const, format: formatters.percent },
    { key: 'topCompetitor', header: 'Top Hirer', align: 'left' as const },
    { key: 'competitorStaffPct', header: 'Their Staff%', align: 'right' as const, format: formatters.percent },
    { key: 'jobCount', header: 'Jobs', align: 'right' as const, format: formatters.number }
  ];

  return (
    <section className="px-6 py-5 border-b border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-purple-500" />
        <h2 className="text-lg font-semibold text-gray-900">Workforce Composition Patterns</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Staff/Non-Staff Donut */}
        <div className="bg-gray-50 rounded-lg p-4 flex flex-col items-center">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Staff vs Non-Staff
          </h3>
          <DonutChart 
            data={staffDonutData}
            size={140}
            thickness={28}
            centerValue={`${data.staffRatio.toFixed(0)}%`}
            centerLabel="Staff"
          />
          <div className="flex items-center gap-4 mt-3 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-500" />
              <span className="text-gray-600">Staff</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-amber-500" />
              <span className="text-gray-600">Non-Staff</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Prior period: {data.previousStaffRatio.toFixed(0)}% staff
            <TrendIndicator value={data.staffChange} format="pp" size="sm" threshold={3} />
          </div>
        </div>

        {/* Narrative + Stats */}
        <div className="lg:col-span-1 space-y-4">
          <p className="text-gray-700 leading-relaxed">{narrative}</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-purple-900">{data.staffRatio.toFixed(0)}%</div>
              <div className="text-xs text-purple-600">Staff Ratio</div>
              {agencyName && (
                <div className="text-xs text-gray-500 mt-1">Market: {data.marketStaffRatio.toFixed(0)}%</div>
              )}
            </div>
            <div className="bg-indigo-50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-indigo-900">{data.seniorRatio.toFixed(0)}%</div>
              <div className="text-xs text-indigo-600">Senior (P5+)</div>
              <div className="text-xs text-gray-500 mt-1">Prior: {data.previousSeniorRatio.toFixed(0)}%</div>
            </div>
          </div>

          {/* Non-staff breakdown */}
          {data.nonStaffBreakdown.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Non-Staff Breakdown</h4>
              <div className="space-y-1">
                {data.nonStaffBreakdown.map((type, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{type.type}</span>
                    <span className="font-medium text-gray-900">{type.percentage.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Grade Distribution */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Grade Distribution</h3>
          <HorizontalBars 
            data={gradeData.filter(g => g.percentage > 0)}
            showChange={true}
            barHeight={20}
          />
        </div>
      </div>

      {/* Category × Staff Ratio Table */}
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <Users className="h-4 w-4" />
          Staff Ratio by Category
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          How staff composition varies across functional categories
        </p>
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <ComparisonTable 
            columns={agencyName ? agencyColumns : marketColumns}
            data={data.categoryStaffPatterns.filter(c => c.jobCount >= 10).slice(0, 8)}
            striped
            compact
          />
        </div>
      </div>
    </section>
  );
};

function generateNarrative(data: WorkforceMetrics, subject: string, isAgency: boolean): string {
  let narrative = `Non-staff positions account for ${(100 - data.staffRatio).toFixed(0)}% of ${isAgency ? subject.toLowerCase() + "'s" : 'market'} hiring`;
  
  if (Math.abs(data.staffRatio - data.previousStaffRatio) > 5) {
    narrative += ` — ${data.staffRatio > data.previousStaffRatio ? 'up from' : 'down from'} ${(100 - data.previousStaffRatio).toFixed(0)}% in the prior period`;
  }
  narrative += '.';
  
  // Highlight category variation
  const patterns = data.categoryStaffPatterns;
  if (patterns.length >= 2) {
    const highStaff = patterns.filter(c => c.yourStaffPct > 50).sort((a, b) => b.yourStaffPct - a.yourStaffPct)[0];
    const lowStaff = patterns.filter(c => c.yourStaffPct < 35).sort((a, b) => a.yourStaffPct - b.yourStaffPct)[0];
    
    if (highStaff && lowStaff) {
      narrative += ` This pattern varies significantly by category: ${highStaff.categoryName} maintains ${highStaff.yourStaffPct.toFixed(0)}% staff`;
      narrative += `, while ${lowStaff.categoryName} runs ${(100 - lowStaff.yourStaffPct).toFixed(0)}% consultant.`;
    }
  }

  // Competitor comparison
  if (isAgency && patterns.length > 0) {
    const significantGap = patterns.find(c => Math.abs(c.gap) > 15);
    if (significantGap) {
      narrative += ` In ${significantGap.categoryName}, ${Math.abs(significantGap.gap).toFixed(0)}pp ${significantGap.gap > 0 ? 'more' : 'less'} staff-heavy than ${significantGap.topCompetitor}.`;
    }
  }

  return narrative;
}

