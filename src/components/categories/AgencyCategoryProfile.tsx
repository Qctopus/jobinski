/**
 * Agency Category Profile
 * 
 * Shows how a specific agency's category distribution compares to the market.
 * Displays where the agency focuses vs where the market is hiring.
 */

import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Target, TrendingUp, TrendingDown, AlertCircle, Award, Building2 } from 'lucide-react';
import { ProcessedJobData } from '../../types';
import { JOB_CLASSIFICATION_DICTIONARY } from '../../dictionary';
import { getAgencyLogo } from '../../utils/agencyLogos';

interface AgencyCategoryProfileProps {
  agencyData: ProcessedJobData[];
  marketData: ProcessedJobData[];
  agencyName: string;
}

const getCategoryInfo = (categoryId: string) => {
  const cat = JOB_CLASSIFICATION_DICTIONARY.find(c => c.id === categoryId || c.name === categoryId);
  return {
    name: cat?.name || categoryId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    color: cat?.color || '#6B7280',
    id: cat?.id || categoryId
  };
};

const AgencyCategoryProfile: React.FC<AgencyCategoryProfileProps> = ({
  agencyData,
  marketData,
  agencyName
}) => {
  // Calculate category distributions
  const analysis = useMemo(() => {
    // Agency distribution
    const agencyCategories = new Map<string, number>();
    agencyData.forEach(job => {
      const cat = job.primary_category || 'Other';
      agencyCategories.set(cat, (agencyCategories.get(cat) || 0) + 1);
    });
    const agencyTotal = agencyData.length || 1;

    // Market distribution
    const marketCategories = new Map<string, number>();
    marketData.forEach(job => {
      const cat = job.primary_category || 'Other';
      marketCategories.set(cat, (marketCategories.get(cat) || 0) + 1);
    });
    const marketTotal = marketData.length || 1;

    // Get all categories
    const allCategories = new Set([...agencyCategories.keys(), ...marketCategories.keys()]);

    // Calculate comparison data
    const categoryData = Array.from(allCategories).map(category => {
      const agencyCount = agencyCategories.get(category) || 0;
      const marketCount = marketCategories.get(category) || 0;
      const agencyPct = (agencyCount / agencyTotal) * 100;
      const marketPct = (marketCount / marketTotal) * 100;
      const deviation = agencyPct - marketPct;
      const catInfo = getCategoryInfo(category);

      return {
        category,
        name: catInfo.name,
        color: catInfo.color,
        agencyCount,
        marketCount,
        agencyPct,
        marketPct,
        deviation,
        marketShare: marketCount > 0 ? (agencyCount / marketCount) * 100 : 0
      };
    }).sort((a, b) => b.agencyCount - a.agencyCount);

    // Find focus areas (significantly above market)
    const focusAreas = categoryData.filter(c => c.deviation > 5 && c.agencyCount >= 3);
    
    // Find gaps (significantly below market)
    const gaps = categoryData.filter(c => c.deviation < -5 && c.marketPct > 3);

    // Top categories by count
    const topCategories = categoryData.slice(0, 5);

    // Concentration score (how focused is the agency)
    const topThreePct = topCategories.slice(0, 3).reduce((sum, c) => sum + c.agencyPct, 0);
    const isConcentrated = topThreePct > 60;

    return {
      categoryData,
      focusAreas,
      gaps,
      topCategories,
      topThreePct,
      isConcentrated,
      totalJobs: agencyData.length
    };
  }, [agencyData, marketData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
          <div className="font-semibold text-gray-900 mb-2">{item.name}</div>
          <div className="space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">{agencyName}:</span>
              <span className="font-medium">{item.agencyCount} ({item.agencyPct.toFixed(1)}%)</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">Market:</span>
              <span className="font-medium">{item.marketCount} ({item.marketPct.toFixed(1)}%)</span>
            </div>
            <div className="flex justify-between gap-4 pt-1 border-t border-gray-100">
              <span className="text-gray-500">Deviation:</span>
              <span className={`font-medium ${item.deviation > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {item.deviation > 0 ? '+' : ''}{item.deviation.toFixed(1)}pp
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getAgencyLogo(agencyName) ? (
              <img src={getAgencyLogo(agencyName)!} alt="" className="h-5 w-5 object-contain" />
            ) : (
              <Target className="h-4 w-4 text-indigo-500" />
            )}
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Category Profile</h3>
              <p className="text-xs text-gray-500">{agencyName}'s hiring focus vs market</p>
            </div>
          </div>
          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {analysis.totalJobs} positions
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Quick Insights */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Top Category */}
          {analysis.topCategories[0] && (
            <div className="bg-indigo-50 rounded-lg p-3 border-l-2 border-indigo-500">
              <div className="flex items-center gap-1.5 mb-1">
                <Award className="h-3.5 w-3.5 text-indigo-500" />
                <span className="text-[10px] text-gray-500">Top Category</span>
              </div>
              <div className="text-sm font-semibold text-gray-800 truncate" title={analysis.topCategories[0].name}>
                {analysis.topCategories[0].name.length > 20 
                  ? analysis.topCategories[0].name.substring(0, 18) + '...'
                  : analysis.topCategories[0].name}
              </div>
              <div className="text-xs text-indigo-600">{analysis.topCategories[0].agencyPct.toFixed(0)}% of hiring</div>
            </div>
          )}

          {/* Concentration */}
          <div className={`rounded-lg p-3 border-l-2 ${analysis.isConcentrated ? 'bg-amber-50 border-amber-500' : 'bg-emerald-50 border-emerald-500'}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <Building2 className={`h-3.5 w-3.5 ${analysis.isConcentrated ? 'text-amber-500' : 'text-emerald-500'}`} />
              <span className="text-[10px] text-gray-500">Focus</span>
            </div>
            <div className="text-sm font-semibold text-gray-800">
              {analysis.isConcentrated ? 'Specialized' : 'Diversified'}
            </div>
            <div className={`text-xs ${analysis.isConcentrated ? 'text-amber-600' : 'text-emerald-600'}`}>
              Top 3: {analysis.topThreePct.toFixed(0)}%
            </div>
          </div>

          {/* Focus Areas */}
          <div className="bg-emerald-50 rounded-lg p-3 border-l-2 border-emerald-500">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-[10px] text-gray-500">Above Market</span>
            </div>
            <div className="text-sm font-semibold text-gray-800">{analysis.focusAreas.length}</div>
            <div className="text-xs text-emerald-600">categories</div>
          </div>

          {/* Gaps */}
          <div className="bg-gray-50 rounded-lg p-3 border-l-2 border-gray-400">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown className="h-3.5 w-3.5 text-gray-500" />
              <span className="text-[10px] text-gray-500">Below Market</span>
            </div>
            <div className="text-sm font-semibold text-gray-800">{analysis.gaps.length}</div>
            <div className="text-xs text-gray-500">categories</div>
          </div>
        </div>

        {/* Deviation Chart */}
        <div>
          <h4 className="text-xs font-medium text-gray-700 mb-2">Category Focus vs Market</h4>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analysis.categoryData.slice(0, 10)}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <XAxis 
                  type="number" 
                  tick={{ fontSize: 10 }} 
                  domain={[-20, 20]}
                  tickFormatter={(v) => `${v > 0 ? '+' : ''}${v}pp`}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={95}
                  tick={{ fontSize: 9 }}
                  tickFormatter={(v) => v.length > 15 ? v.substring(0, 13) + '..' : v}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine x={0} stroke="#9CA3AF" strokeDasharray="3 3" />
                <Bar dataKey="deviation" radius={[0, 4, 4, 0]}>
                  {analysis.categoryData.slice(0, 10).map((entry, idx) => (
                    <Cell 
                      key={entry.category} 
                      fill={entry.deviation > 0 ? '#10B981' : '#F59E0B'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-emerald-500" />
              <span>Above market average</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-amber-500" />
              <span>Below market average</span>
            </div>
          </div>
        </div>

        {/* Focus Areas & Gaps */}
        {(analysis.focusAreas.length > 0 || analysis.gaps.length > 0) && (
          <div className="grid grid-cols-2 gap-3">
            {/* Focus Areas */}
            {analysis.focusAreas.length > 0 && (
              <div className="bg-emerald-50/50 rounded-lg p-3 border border-emerald-100">
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-xs font-medium text-emerald-700">Specialization Areas</span>
                </div>
                <div className="space-y-1.5">
                  {analysis.focusAreas.slice(0, 4).map(cat => (
                    <div key={cat.category} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-gray-700 truncate">{cat.name}</span>
                      </div>
                      <span className="text-emerald-600 font-medium flex-shrink-0">
                        +{cat.deviation.toFixed(0)}pp
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gaps */}
            {analysis.gaps.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertCircle className="h-3.5 w-3.5 text-gray-500" />
                  <span className="text-xs font-medium text-gray-600">Below Market Presence</span>
                </div>
                <div className="space-y-1.5">
                  {analysis.gaps.slice(0, 4).map(cat => (
                    <div key={cat.category} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-gray-600 truncate">{cat.name}</span>
                      </div>
                      <span className="text-gray-500 font-medium flex-shrink-0">
                        {cat.deviation.toFixed(0)}pp
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgencyCategoryProfile;





