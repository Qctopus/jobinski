/**
 * Agency Category Dominance
 * 
 * Shows which agencies dominate each category with sorting options.
 * Like Agency Fingerprints but focused on categories.
 */

import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Building2, ChevronDown, ArrowUpDown, TrendingUp, Users } from 'lucide-react';
import { ProcessedJobData } from '../../types';
import { JOB_CLASSIFICATION_DICTIONARY } from '../../dictionary';
import { getAgencyLogo } from '../../utils/agencyLogos';

interface AgencyCategoryDominanceProps {
  data: ProcessedJobData[];
  isAgencyView: boolean;
  selectedAgency?: string;
}

type SortOption = 'total' | 'concentration' | 'diversity';
type ViewMode = 'byCategory' | 'byAgency';

const getCategoryInfo = (categoryId: string) => {
  const cat = JOB_CLASSIFICATION_DICTIONARY.find(c => c.id === categoryId || c.name === categoryId);
  return {
    name: cat?.name || categoryId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    color: cat?.color || '#6B7280',
    id: cat?.id || categoryId
  };
};

const AgencyCategoryDominance: React.FC<AgencyCategoryDominanceProps> = ({
  data,
  isAgencyView,
  selectedAgency
}) => {
  const [sortOption, setSortOption] = useState<SortOption>('total');
  const [viewMode, setViewMode] = useState<ViewMode>('byCategory');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Aggregate data: category -> agency -> count
  const aggregatedData = useMemo(() => {
    const categoryAgencyMap = new Map<string, Map<string, number>>();
    const agencyCategoryMap = new Map<string, Map<string, number>>();
    const categoryTotals = new Map<string, number>();
    const agencyTotals = new Map<string, number>();

    data.forEach(job => {
      const category = job.primary_category || job.sectoral_category || 'Other';
      const agency = job.short_agency || job.long_agency || 'Unknown';

      // Category -> Agency
      if (!categoryAgencyMap.has(category)) {
        categoryAgencyMap.set(category, new Map());
      }
      const agencyMap = categoryAgencyMap.get(category)!;
      agencyMap.set(agency, (agencyMap.get(agency) || 0) + 1);

      // Agency -> Category
      if (!agencyCategoryMap.has(agency)) {
        agencyCategoryMap.set(agency, new Map());
      }
      const catMap = agencyCategoryMap.get(agency)!;
      catMap.set(category, (catMap.get(category) || 0) + 1);

      // Totals
      categoryTotals.set(category, (categoryTotals.get(category) || 0) + 1);
      agencyTotals.set(agency, (agencyTotals.get(agency) || 0) + 1);
    });

    return { categoryAgencyMap, agencyCategoryMap, categoryTotals, agencyTotals };
  }, [data]);

  // By Category view: which agencies dominate each category
  const categoryDominance = useMemo(() => {
    const { categoryAgencyMap, categoryTotals } = aggregatedData;
    
    return Array.from(categoryAgencyMap.entries())
      .map(([category, agencyMap]) => {
        const agencies = Array.from(agencyMap.entries())
          .map(([agency, count]) => ({
            agency,
            count,
            percentage: (count / (categoryTotals.get(category) || 1)) * 100
          }))
          .sort((a, b) => b.count - a.count);

        const topAgency = agencies[0];
        const concentration = topAgency ? topAgency.percentage : 0;
        const diversity = agencies.length;

        return {
          category,
          total: categoryTotals.get(category) || 0,
          agencies,
          topAgency: topAgency?.agency || 'None',
          topAgencyCount: topAgency?.count || 0,
          topAgencyPercentage: concentration,
          concentration,
          diversity
        };
      })
      .sort((a, b) => {
        if (sortOption === 'concentration') return b.concentration - a.concentration;
        if (sortOption === 'diversity') return b.diversity - a.diversity;
        return b.total - a.total;
      });
  }, [aggregatedData, sortOption]);

  // By Agency view: which categories each agency dominates
  const agencyDominance = useMemo(() => {
    const { agencyCategoryMap, agencyTotals } = aggregatedData;
    
    return Array.from(agencyCategoryMap.entries())
      .map(([agency, categoryMap]) => {
        const categories = Array.from(categoryMap.entries())
          .map(([category, count]) => ({
            category,
            count,
            percentage: (count / (agencyTotals.get(agency) || 1)) * 100
          }))
          .sort((a, b) => b.count - a.count);

        const topCategory = categories[0];

        return {
          agency,
          total: agencyTotals.get(agency) || 0,
          categories,
          topCategory: topCategory?.category || 'None',
          topCategoryPercentage: topCategory?.percentage || 0,
          categoryCount: categories.length
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 15); // Top 15 agencies
  }, [aggregatedData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
          <div className="font-semibold text-gray-900 mb-1">{item.name || item.agency}</div>
          <div className="text-gray-600">{item.count?.toLocaleString() || item.value?.toLocaleString()} positions</div>
          {item.percentage && (
            <div className="text-gray-500">{item.percentage.toFixed(1)}% of category</div>
          )}
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
            <Building2 className="h-4 w-4 text-indigo-500" />
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Agency Category Dominance</h3>
              <p className="text-xs text-gray-500">Which agencies lead in each category</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('byCategory')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === 'byCategory' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                By Category
              </button>
              <button
                onClick={() => setViewMode('byAgency')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  viewMode === 'byAgency' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                By Agency
              </button>
            </div>

            {/* Sort Options (only for byCategory view) */}
            {viewMode === 'byCategory' && (
              <div className="flex items-center gap-1">
                <ArrowUpDown className="h-3 w-3 text-gray-400" />
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="text-xs border-0 bg-transparent text-gray-600 focus:ring-0 cursor-pointer pr-6"
                >
                  <option value="total">Total Jobs</option>
                  <option value="concentration">Highest Concentration</option>
                  <option value="diversity">Most Agencies</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4">
        {viewMode === 'byCategory' ? (
          /* By Category View */
          <div className="space-y-2">
            {categoryDominance.slice(0, 12).map((item) => {
              const catInfo = getCategoryInfo(item.category);
              const isExpanded = expandedCategory === item.category;
              
              return (
                <div key={item.category} className="border border-gray-100 rounded-lg overflow-hidden">
                  {/* Category Header */}
                  <div 
                    className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => setExpandedCategory(isExpanded ? null : item.category)}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: catInfo.color }}
                      />
                      <span className="text-sm font-medium text-gray-800 truncate">{catInfo.name}</span>
                      <span className="text-xs text-gray-400">({item.total} jobs)</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {/* Top Agency Badge */}
                      <div className="flex items-center gap-2 bg-white rounded px-2 py-1 border border-gray-200">
                        {getAgencyLogo(item.topAgency) && (
                          <img src={getAgencyLogo(item.topAgency)!} alt="" className="h-4 w-4 object-contain" />
                        )}
                        <span className="text-xs font-medium text-gray-700">{item.topAgency}</span>
                        <span className="text-xs text-indigo-600 font-semibold">{item.topAgencyPercentage.toFixed(0)}%</span>
                      </div>
                      
                      <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                  
                  {/* Expanded Agency List */}
                  {isExpanded && (
                    <div className="p-3 bg-white border-t border-gray-100">
                      <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={item.agencies.slice(0, 8).map(a => ({
                              name: a.agency,
                              count: a.count,
                              percentage: a.percentage
                            }))}
                            layout="vertical"
                            margin={{ top: 0, right: 20, left: 80, bottom: 0 }}
                          >
                            <XAxis type="number" tick={{ fontSize: 10 }} />
                            <YAxis 
                              type="category" 
                              dataKey="name" 
                              width={75}
                              tick={{ fontSize: 9 }}
                              tickFormatter={(v) => v.length > 10 ? v.substring(0, 8) + '..' : v}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="count" fill={catInfo.color} radius={[0, 4, 4, 0]}>
                              {item.agencies.slice(0, 8).map((a, idx) => (
                                <Cell 
                                  key={a.agency} 
                                  fill={idx === 0 ? catInfo.color : `${catInfo.color}99`}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-2 text-xs text-gray-500 text-center">
                        {item.diversity} agencies active in this category
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* By Agency View */
          <div className="space-y-3">
            {agencyDominance.map((item) => (
              <div key={item.agency} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getAgencyLogo(item.agency) && (
                      <img src={getAgencyLogo(item.agency)!} alt="" className="h-5 w-5 object-contain" />
                    )}
                    <span className="text-sm font-semibold text-gray-800">{item.agency}</span>
                    <span className="text-xs text-gray-400">({item.total} jobs)</span>
                  </div>
                  <span className="text-xs text-gray-500">{item.categoryCount} categories</span>
                </div>
                
                {/* Category Distribution Bar */}
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden flex">
                  {item.categories.slice(0, 5).map((cat, idx) => {
                    const catInfo = getCategoryInfo(cat.category);
                    return (
                      <div
                        key={cat.category}
                        className="h-full transition-all hover:opacity-80"
                        style={{ 
                          width: `${cat.percentage}%`, 
                          backgroundColor: catInfo.color,
                          minWidth: cat.percentage > 0 ? '2px' : 0
                        }}
                        title={`${catInfo.name}: ${cat.percentage.toFixed(1)}%`}
                      />
                    );
                  })}
                </div>
                
                {/* Top Categories */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {item.categories.slice(0, 4).map((cat) => {
                    const catInfo = getCategoryInfo(cat.category);
                    return (
                      <span 
                        key={cat.category}
                        className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-gray-50 border border-gray-200"
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: catInfo.color }} />
                        <span className="text-gray-700 truncate max-w-[100px]">{catInfo.name}</span>
                        <span className="text-gray-500 font-medium">{cat.percentage.toFixed(0)}%</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgencyCategoryDominance;


