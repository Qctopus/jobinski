/**
 * GeographicSection - Location analysis with charts
 */

import React from 'react';
import { Globe, MapPin, Building2, Home } from 'lucide-react';
import { GeographicMetrics } from '../../../services/analytics/IntelligenceBriefEngine';
import { DonutChart, HorizontalBars, ComparisonTable, formatters, TrendIndicator } from './shared';

interface GeographicSectionProps {
  data: GeographicMetrics;
  agencyName?: string;
}

export const GeographicSection: React.FC<GeographicSectionProps> = ({ data, agencyName }) => {
  const subject = agencyName || 'The market';
  const narrative = generateNarrative(data, subject, !!agencyName);

  // Location type donut
  const locationDonutData = data.locationTypeDistribution.map(d => ({
    label: d.type,
    value: d.count,
    percentage: d.percentage,
    color: d.color,
    previousPercentage: d.previousPercentage
  }));

  // Top locations table columns
  const locationColumns = [
    { key: 'location', header: 'Location', align: 'left' as const, width: '40%' },
    { key: 'count', header: 'Positions', align: 'right' as const, format: formatters.number },
    { key: 'change', header: 'Change', align: 'right' as const, format: (v: number) => (
      <span className={v > 0 ? 'text-emerald-600' : v < 0 ? 'text-red-600' : 'text-gray-500'}>
        {v > 0 ? '+' : ''}{v}
      </span>
    )}
  ];

  // Category field ratio table - different columns for agency vs market view
  const agencyCategoryFieldColumns = [
    { key: 'categoryName', header: 'Category', align: 'left' as const, width: '40%' },
    { key: 'yourFieldPct', header: 'Your Field%', align: 'right' as const, format: formatters.percent },
    { key: 'marketFieldPct', header: 'Market', align: 'right' as const, format: formatters.percent },
    { key: 'difference', header: 'Difference', align: 'right' as const, format: formatters.gap }
  ];

  const marketCategoryFieldColumns = [
    { key: 'categoryName', header: 'Category', align: 'left' as const, width: '50%' },
    { key: 'yourFieldPct', header: 'Field%', align: 'right' as const, format: formatters.percent }
  ];

  // Grade by location type table
  const gradeByLocationColumns = [
    { key: 'locationType', header: 'Location Type', align: 'left' as const },
    { key: 'seniorPct', header: 'Senior%', align: 'right' as const, format: formatters.percent },
    { key: 'midPct', header: 'Mid%', align: 'right' as const, format: formatters.percent },
    { key: 'juniorPct', header: 'Junior%', align: 'right' as const, format: formatters.percent }
  ];

  const iconForType = (type: string) => {
    switch (type) {
      case 'Field': return <MapPin className="h-4 w-4 text-amber-500" />;
      case 'Headquarters': return <Building2 className="h-4 w-4 text-blue-500" />;
      case 'Home-based': return <Home className="h-4 w-4 text-purple-500" />;
      default: return <Globe className="h-4 w-4 text-green-500" />;
    }
  };

  return (
    <section className="px-6 py-5 border-b border-gray-200">
      <div className="flex items-center gap-2 mb-4">
        <Globe className="h-5 w-5 text-green-500" />
        <h2 className="text-lg font-semibold text-gray-900">Geographic Intelligence</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Location Type Donut */}
        <div className="bg-gray-50 rounded-lg p-4 flex flex-col items-center">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Location Type Distribution
          </h3>
          <DonutChart 
            data={locationDonutData}
            size={140}
            thickness={28}
            centerValue={`${data.fieldRatio.toFixed(0)}%`}
            centerLabel="Field"
          />
          <div className="flex flex-wrap items-center justify-center gap-3 mt-3 text-xs">
            {data.locationTypeDistribution.map((type, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: type.color }} />
                <span className="text-gray-600">{type.type}</span>
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-2 flex items-center gap-2">
            Prior: {data.previousFieldRatio.toFixed(0)}% field
            <TrendIndicator value={data.fieldRatio - data.previousFieldRatio} format="pp" size="sm" threshold={3} />
          </div>
        </div>

        {/* Narrative + Quick Stats */}
        <div className="lg:col-span-1 space-y-4">
          <p className="text-gray-700 leading-relaxed">{narrative}</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-green-900">{data.fieldRatio.toFixed(0)}%</div>
              <div className="text-xs text-green-600">Field Positions</div>
              {agencyName && (
                <div className="text-xs text-gray-500 mt-1">Market: {data.marketFieldRatio.toFixed(0)}%</div>
              )}
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-blue-900">{data.topLocations.length}</div>
              <div className="text-xs text-blue-600">Locations</div>
              {data.newLocations.length > 0 && (
                <div className="text-xs text-emerald-600 mt-1">+{data.newLocations.length} new</div>
              )}
            </div>
          </div>

          {/* Location Type Changes */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Location Changes</h4>
            {data.locationTypeDistribution.map((type, i) => (
              <div key={i} className="flex justify-between items-center text-sm py-1">
                <div className="flex items-center gap-2">
                  {iconForType(type.type)}
                  <span className="text-gray-600">{type.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{type.percentage.toFixed(0)}%</span>
                  {Math.abs(type.change) > 2 && (
                    <span className={`text-xs ${type.change > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {type.change > 0 ? '+' : ''}{type.change.toFixed(0)}pp
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Locations */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Top Locations
          </h3>
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {data.topLocations.slice(0, 10).map((loc, i) => (
              <div key={i} className="flex items-center justify-between text-sm bg-white rounded px-2 py-1.5">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-gray-400 text-xs w-4">{i + 1}</span>
                  <span className="text-gray-700 truncate">{loc.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{loc.count}</span>
                  {loc.change !== 0 && (
                    <span className={`text-xs ${loc.change > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {loc.change > 0 ? '+' : ''}{loc.change}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cross-dimensional tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Field Ratio by Category */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Field Ratio by Category
          </h3>
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <ComparisonTable 
              columns={agencyName ? agencyCategoryFieldColumns : marketCategoryFieldColumns}
              data={data.categoryFieldPatterns}
              striped
              compact
            />
          </div>
        </div>

        {/* Grade by Location Type */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Grade Distribution by Location
          </h3>
          <p className="text-xs text-gray-500 mb-2">Are field positions more junior?</p>
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <ComparisonTable 
              columns={gradeByLocationColumns}
              data={data.gradeByLocationType}
              striped
              compact
            />
          </div>
        </div>
      </div>

      {/* Regional Distribution */}
      {data.regionDistribution.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Regional Distribution
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <HorizontalBars 
              data={data.regionDistribution.slice(0, 8).map(r => ({
                label: r.region,
                value: r.count,
                percentage: r.percentage,
                color: '#10B981',
                previousPercentage: r.previousPercentage
              }))}
              showChange={true}
              barHeight={20}
            />
          </div>
        </div>
      )}
    </section>
  );
};

function generateNarrative(data: GeographicMetrics, subject: string, isAgency: boolean): string {
  let narrative = `Field positions represent ${data.fieldRatio.toFixed(0)}% of ${isAgency ? subject.toLowerCase() + "'s" : 'market'} hiring`;
  
  if (Math.abs(data.fieldRatio - data.previousFieldRatio) > 5) {
    narrative += ` — ${data.fieldRatio > data.previousFieldRatio ? 'up from' : 'down from'} ${data.previousFieldRatio.toFixed(0)}% in the prior period`;
  }
  narrative += '.';
  
  // Regional highlights
  if (data.regionDistribution.length >= 2) {
    const top2 = data.regionDistribution.slice(0, 2);
    narrative += ` ${top2[0].region} and ${top2[1].region} account for the largest regional shares (${top2[0].percentage.toFixed(0)}% and ${top2[1].percentage.toFixed(0)}% respectively).`;
  }
  
  // Category variation
  if (data.categoryFieldPatterns.length >= 2) {
    const highField = data.categoryFieldPatterns.find(c => c.yourFieldPct > 85);
    const lowField = data.categoryFieldPatterns.find(c => c.yourFieldPct < 55);
    
    if (highField && lowField) {
      narrative += ` Geographic patterns vary by category: ${highField.categoryName} is ${highField.yourFieldPct.toFixed(0)}% field-based while ${lowField.categoryName} is only ${lowField.yourFieldPct.toFixed(0)}% field (rest HQ).`;
    }
  }
  
  // Top location changes
  const bigChanges = data.topLocations.filter(l => Math.abs(l.change) > 30).slice(0, 3);
  if (bigChanges.length > 0) {
    const changeText = bigChanges.map(l => `${l.location} (${l.change > 0 ? '+' : ''}${l.change})`).join(', ');
    narrative += ` The largest location changes were ${changeText}.`;
  }
  
  return narrative;
}

