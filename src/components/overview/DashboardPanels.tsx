import React from 'react';
import { TrendingUp, Eye, Zap, Activity } from 'lucide-react';
import { ProcessedJobData } from '../../types';

interface DashboardPanelsProps {
  isAgencyView: boolean;
  selectedAgencyName: string;
  monthOverMonthGrowth: number;
  topCategories: Array<{ category: string; count: number; percentage: number }>;
  topAgencyMarket: { name: string; share: number };
  agencyMarketShare: number;
  agencyRank: number | null;
  medianApplicationWindow: number;
  urgentRate: number;
  marketAverages: {
    medianApplicationWindow: number;
    urgentRate: number;
    seniorityMix: number;
  };
  seniorityMix: number;
  agencyTopCountries: Array<{ country: string; count: number }>;
  processedData: ProcessedJobData[];
  distinctCategoriesCount: number;
  categoriesWeLead: number;
  locationTypeMix: Array<{ type: string; count: number }>;
  marketInsights: {
    topAgencies: Array<{ agency: string; totalJobs: number }>;
  };
  marketMetrics: {
    totalJobs: number;
  };
}

const DashboardPanels: React.FC<DashboardPanelsProps> = ({
  isAgencyView,
  selectedAgencyName,
  monthOverMonthGrowth,
  topCategories,
  topAgencyMarket,
  agencyMarketShare,
  agencyRank,
  medianApplicationWindow,
  urgentRate,
  marketAverages,
  seniorityMix,
  agencyTopCountries,
  processedData,
  distinctCategoriesCount,
  categoriesWeLead,
  locationTypeMix,
  marketInsights,
  marketMetrics
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Panel 1: Market Pulse */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {isAgencyView ? `${selectedAgencyName} Activity` : 'Market Pulse'}
            </h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {isAgencyView ? 'Your agency hiring trends and focus areas' : 'Recent hiring activity and market hotspots'}
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-5">
            {/* Growth velocity */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {isAgencyView ? 'Agency Growth (vs last month)' : 'Market Growth (vs last month)'}
                </span>
                <span className="text-xl font-bold text-green-600">+{monthOverMonthGrowth.toFixed(0)}%</span>
              </div>
              <div className="text-xs text-gray-600">
                {isAgencyView 
                  ? `${selectedAgencyName} posted ${monthOverMonthGrowth > 0 ? 'more' : 'fewer'} positions compared to last month`
                  : `UN system posted ${monthOverMonthGrowth > 0 ? 'more' : 'fewer'} positions compared to last month`
                }
              </div>
            </div>
            
            {/* Top categories */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                {isAgencyView ? 'Our Top Categories' : 'Hot Categories'}
              </h4>
              <div className="space-y-2">
                {topCategories.slice(0, 3).map((category, index) => (
                  <div key={category.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-700">
                        {category.category.length > 18 ? category.category.substring(0, 15) + '...' : category.category}
                      </span>
                      <div className="text-xs text-gray-500">
                        {category.count} positions ({(category.percentage || 0).toFixed(1)}%)
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-green-600">#{index + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Geographic focus */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                {isAgencyView ? 'Our Geographic Focus' : 'Geographic Hotspots'}
              </h4>
              <div className="space-y-2">
                {(isAgencyView ? agencyTopCountries : 
                  Object.entries(processedData.reduce((acc, job) => {
                    const country = job.duty_country || 'Unknown';
                    acc[country] = (acc[country] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>))
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 3)
                  .map(([country, count]) => ({ country, count }))
                ).slice(0, 3).map((country, index) => (
                  <div key={country.country} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-700">{country.country}</span>
                      <div className="text-xs text-gray-500">Primary duty station</div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-blue-600">{country.count}</span>
                      <div className="text-xs text-gray-500">positions</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel 2: Competitive Landscape */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Eye className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Competitive Landscape</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">Market share and positioning</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">{topAgencyMarket.share.toFixed(1)}%</div>
                <div className="text-sm text-gray-600">Market Leader</div>
                <div className="text-xs text-gray-500">{topAgencyMarket.name}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{isAgencyView ? agencyMarketShare.toFixed(1) : '---'}%</div>
                <div className="text-sm text-gray-600">{isAgencyView ? 'Our Share' : 'Your Share'}</div>
                <div className="text-xs text-green-600">{isAgencyView ? (agencyRank ? `#${agencyRank} position` : 'Unranked') : 'Select agency'}</div>
              </div>
            </div>
            
            {/* Top agencies breakdown */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Top Agencies</h4>
              <div className="space-y-2">
                {marketInsights?.topAgencies.slice(0, 4).map((agency, index) => (
                  <div key={agency.agency} className={`flex items-center justify-between p-2 rounded ${
                    isAgencyView && agency.agency === selectedAgencyName ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                  }`}>
                    <span className="text-sm text-gray-700">
                      {isAgencyView && agency.agency === selectedAgencyName ? '👑 ' : ''}{agency.agency.length > 15 ? agency.agency.substring(0, 12) + '...' : agency.agency}
                    </span>
                    <span className="text-sm font-medium">{((agency.totalJobs / marketMetrics.totalJobs) * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel 3: Strategic Insights */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Zap className="h-6 w-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Strategic Insights</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {isAgencyView ? 'Actionable insights for your agency' : 'Key market opportunities and trends'}
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {/* Insight 1: Opportunity */}
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 mb-1">
                  {isAgencyView ? 'Growth Opportunity' : 'Market Opportunity'}
                </div>
                <div className="text-sm text-gray-700 mb-2">
                  {isAgencyView 
                    ? `${topCategories[0]?.category || 'Top category'} represents ${(topCategories[0]?.percentage || 0).toFixed(1)}% of your hiring`
                    : `${topCategories[0]?.category || 'Climate & Environment'} category growing +${monthOverMonthGrowth.toFixed(0)}% this month`
                  }
                </div>
                <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded inline-block">
                  {isAgencyView 
                    ? `Consider expanding in ${topCategories[1]?.category || 'other areas'}`
                    : `+${(topCategories[0]?.count || 12)} new positions available`
                  }
                </div>
              </div>
            </div>
            
            {/* Additional insights */}
            <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 mb-1">
                  {isAgencyView ? 'Competitive Positioning' : 'Competition Alert'}
                </div>
                <div className="text-sm text-gray-700 mb-2">
                  {isAgencyView 
                    ? `You rank #${agencyRank || 'N/A'} with ${agencyMarketShare.toFixed(1)}% market share`
                    : `${topAgencyMarket.name} leads with ${topAgencyMarket.share.toFixed(1)}% market share`
                  }
                </div>
                <div className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded inline-block">
                  {isAgencyView 
                    ? agencyRank && agencyRank <= 5 ? 'Maintain leadership position' : 'Focus on key differentiators'
                    : 'Monitor hiring patterns closely'
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel 4: Performance Snapshot */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Activity className="h-6 w-6 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Performance Snapshot</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {isAgencyView ? 'Agency efficiency and workforce indicators' : 'Market efficiency and hiring patterns'}
          </p>
        </div>
        <div className="p-6">
          {isAgencyView ? (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 text-center mb-4">
                <span className="font-medium text-blue-600">{selectedAgencyName}</span> vs <span className="font-medium text-gray-700">Market Average</span>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                {/* Application Window Comparison */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-center mb-3">
                    <div className="text-lg font-bold text-gray-900">{medianApplicationWindow} days</div>
                    <div className="text-sm font-medium text-gray-700">Application Window</div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="text-center">
                      <div className="text-blue-600 font-semibold">{medianApplicationWindow}</div>
                      <div className="text-gray-500">You</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600 font-semibold">{marketAverages.medianApplicationWindow}</div>
                      <div className="text-gray-500">Market</div>
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                      medianApplicationWindow < marketAverages.medianApplicationWindow 
                        ? 'bg-green-100 text-green-700' 
                        : medianApplicationWindow > marketAverages.medianApplicationWindow 
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-blue-100 text-blue-700'
                    }`}>
                      {medianApplicationWindow < marketAverages.medianApplicationWindow 
                        ? `✓ ${marketAverages.medianApplicationWindow - medianApplicationWindow} days faster` 
                        : medianApplicationWindow > marketAverages.medianApplicationWindow 
                          ? `⚠ ${medianApplicationWindow - marketAverages.medianApplicationWindow} days slower`
                          : '→ Same as market'
                      }
                    </div>
                  </div>
                </div>
                
                {/* Additional metrics grid items would go here */}
              </div>
              
              {/* Bottom metrics for agency view */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{categoriesWeLead}</div>
                    <div className="text-xs text-gray-600">Categories Leading</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{distinctCategoriesCount}</div>
                    <div className="text-xs text-gray-600">Categories Active</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{locationTypeMix.length}</div>
                    <div className="text-xs text-gray-600">Location Types</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Market view metrics */
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">{marketAverages.medianApplicationWindow}</div>
                <div className="text-sm font-medium text-gray-700 mb-1">Avg Application Window</div>
                <div className="text-xs text-gray-500 mb-2">Days to apply (market median)</div>
                <div className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full inline-block">
                  {marketAverages.medianApplicationWindow < 21 ? '✓ Fast market' : marketAverages.medianApplicationWindow < 35 ? '→ Standard pace' : '⚠ Extended timelines'}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">{marketAverages.seniorityMix.toFixed(0)}%</div>
                <div className="text-sm font-medium text-gray-700 mb-1">Senior+ Positions</div>
                <div className="text-xs text-gray-500 mb-2">Executive & Senior roles</div>
                <div className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full inline-block">
                  {marketAverages.seniorityMix > 40 ? '🎯 Leadership heavy' : marketAverages.seniorityMix > 25 ? '→ Balanced mix' : '📈 Entry-mid focus'}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">{marketAverages.urgentRate.toFixed(0)}%</div>
                <div className="text-sm font-medium text-gray-700 mb-1">Urgent Hiring Rate</div>
                <div className="text-xs text-gray-500 mb-2">Positions with &lt;14 days</div>
                <div className="text-xs px-2 py-1 rounded-full inline-block" style={{
                  backgroundColor: marketAverages.urgentRate > 30 ? '#FEF3C7' : marketAverages.urgentRate > 15 ? '#DBEAFE' : '#D1FAE5',
                  color: marketAverages.urgentRate > 30 ? '#92400E' : marketAverages.urgentRate > 15 ? '#1E40AF' : '#065F46'
                }}>
                  {marketAverages.urgentRate > 30 ? '🚨 High pressure' : marketAverages.urgentRate > 15 ? '⚡ Moderate pace' : '😌 Relaxed timing'}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900 mb-1">{distinctCategoriesCount}</div>
                <div className="text-sm font-medium text-gray-700 mb-1">Active Categories</div>
                <div className="text-xs text-gray-500 mb-2">Distinct job categories</div>
                <div className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full inline-block">
                  {distinctCategoriesCount > 15 ? '🌟 Highly diverse' : distinctCategoriesCount > 8 ? '→ Well diversified' : '🎯 Focused scope'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPanels;
