/**
 * Category Intelligence Section
 * 
 * Displays category distribution, growth trends, competitive position, and patterns.
 */

import React from 'react';
import { Target, TrendingUp, TrendingDown, BarChart3, Layers } from 'lucide-react';
import { CategoryMetrics } from '../../services/analytics/IntelligenceInsightsEngine';
import { GeneratedNarrative } from '../../services/analytics/NarrativeGenerator';
import { NarrativeBlock, MiniTable, TrendArrow, InlineSparkline } from './shared';
import { JOB_CLASSIFICATION_DICTIONARY } from '../../dictionary';

interface CategoryIntelSectionProps {
  metrics: CategoryMetrics;
  narrative: GeneratedNarrative;
  isAgencyView: boolean;
  agencyName: string;
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

const CategoryIntelSection: React.FC<CategoryIntelSectionProps> = ({
  metrics,
  narrative,
  isAgencyView,
  agencyName
}) => {
  const {
    topCategories,
    fastestGrowing,
    declining,
    concentration,
    categoryExperience,
    applicationWindows
  } = metrics;

  // Prepare category table data
  const categoryTableData = topCategories.slice(0, 8).map((cat, index) => ({
    id: `cat-${index}`,
    category: getCategoryName(cat.category),
    count: cat.count,
    percentage: cat.percentage,
    change: cat.change,
    rank: cat.marketRank,
    competitor: cat.topCompetitor ? getCategoryName(cat.topCompetitor) : '-'
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Section Header */}
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-white">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
            <Target className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Category Intelligence</h3>
            <p className="text-xs text-gray-500">Job function distribution, trends, and competitive position</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Top 3 share:</span>
          <span className="text-sm font-bold text-purple-600">{concentration.top3Share.toFixed(0)}%</span>
          {Math.abs(concentration.change) > 2 && (
            <TrendArrow value={concentration.change} size="xs" format="pp" />
          )}
        </div>
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

        {/* Growing & Declining Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          {/* Growing */}
          <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
            <h4 className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              Fastest Growing
            </h4>
            
            {fastestGrowing.length > 0 ? (
              <div className="space-y-2">
                {fastestGrowing.slice(0, 4).map((cat, index) => (
                  <div 
                    key={cat.category}
                    className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {index + 1}
                      </span>
                      <div 
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getCategoryColor(cat.category) }}
                      />
                      <span className="text-xs text-gray-700 truncate">
                        {getCategoryName(cat.category)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className="text-xs font-bold text-emerald-600">
                        +{cat.growthRate.toFixed(0)}%
                      </span>
                      <span className="text-[10px] text-gray-500">
                        (+{cat.absoluteChange})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-emerald-600 italic">No significant growth detected</p>
            )}
          </div>

          {/* Declining */}
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <h4 className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5" />
              Declining
            </h4>
            
            {declining.length > 0 ? (
              <div className="space-y-2">
                {declining.slice(0, 4).map((cat, index) => (
                  <div 
                    key={cat.category}
                    className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded bg-red-100 text-red-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {index + 1}
                      </span>
                      <div 
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getCategoryColor(cat.category) }}
                      />
                      <span className="text-xs text-gray-700 truncate">
                        {getCategoryName(cat.category)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className="text-xs font-bold text-red-600">
                        -{cat.declineRate.toFixed(0)}%
                      </span>
                      <span className="text-[10px] text-gray-500">
                        ({cat.absoluteChange})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-red-600 italic">No significant decline detected</p>
            )}
          </div>
        </div>

        {/* Top Categories Distribution */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 mb-5">
          <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
            Category Distribution
          </h4>

          {/* Visual bar chart */}
          <div className="space-y-2 mb-4">
            {topCategories.slice(0, 6).map((cat, index) => (
              <div key={cat.category} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded bg-gray-100 text-gray-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                  {index + 1}
                </span>
                <div 
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getCategoryColor(cat.category) }}
                />
                <span className="text-xs text-gray-700 w-36 truncate">{getCategoryName(cat.category)}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="h-2.5 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min(cat.percentage * 2, 100)}%`,
                      backgroundColor: getCategoryColor(cat.category)
                    }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-800 w-12 text-right">
                  {cat.percentage.toFixed(0)}%
                </span>
                {Math.abs(cat.change) > 2 && (
                  <TrendArrow value={cat.change} size="xs" format="pp" />
                )}
              </div>
            ))}
          </div>

          {/* Concentration insight */}
          <div className="pt-3 border-t border-gray-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-gray-600">Category Concentration</span>
            </div>
            <div className="flex items-center gap-3">
              <span>
                Top 3: <strong>{concentration.top3Share.toFixed(0)}%</strong>
              </span>
              {Math.abs(concentration.change) > 2 && (
                <span className={concentration.change > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                  ({concentration.change > 0 ? 'more' : 'less'} concentrated)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Competitive Position Table (Agency View) */}
        {isAgencyView && topCategories.some(c => c.marketRank) && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 mb-5">
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
              Competitive Position by Category
            </h4>

            <MiniTable
              columns={[
                { key: 'category', header: 'Category', align: 'left' },
                { key: 'count', header: 'Your Jobs', align: 'right', format: 'number' },
                { key: 'percentage', header: 'Share', align: 'right', format: 'percent' },
                { key: 'rank', header: 'Market Rank', align: 'center', format: 'number' },
                { key: 'change', header: 'Trend', align: 'right', format: 'change' }
              ]}
              data={categoryTableData.map(c => ({
                ...c,
                rank: c.rank ? `#${c.rank}` : '-'
              }))}
              showRowNumbers={false}
              maxRows={8}
            />
          </div>
        )}

        {/* Experience & Application Windows */}
        {(categoryExperience.some(e => e.avgExperience > 0) || applicationWindows.some(w => w.avgWindow > 0)) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Application Windows */}
            {applicationWindows.some(w => w.avgWindow > 0) && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                  Application Windows
                </h4>
                <div className="space-y-2">
                  {applicationWindows.filter(w => w.avgWindow > 0).slice(0, 5).map((cat, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <span className="text-gray-700 truncate w-32">{getCategoryName(cat.category)}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">{cat.avgWindow.toFixed(0)}d</span>
                        {isAgencyView && cat.marketAvg > 0 && (
                          <>
                            <span className="text-gray-400">vs</span>
                            <span className="text-gray-600">{cat.marketAvg.toFixed(0)}d</span>
                            {Math.abs(cat.avgWindow - cat.marketAvg) > 3 && (
                              <span className={`text-[10px] ${
                                cat.avgWindow < cat.marketAvg ? 'text-amber-600' : 'text-emerald-600'
                              }`}>
                                ({cat.avgWindow < cat.marketAvg ? 'faster' : 'slower'})
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Category Experience Requirements */}
            {categoryExperience.some(e => e.avgExperience > 0) && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                  Experience Requirements
                </h4>
                <div className="space-y-2">
                  {categoryExperience.filter(e => e.avgExperience > 0).slice(0, 5).map((cat, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <span className="text-gray-700 truncate w-32">{getCategoryName(cat.category)}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">{cat.avgExperience.toFixed(1)}y</span>
                        {isAgencyView && cat.marketAvg > 0 && (
                          <>
                            <span className="text-gray-400">vs</span>
                            <span className="text-gray-600">{cat.marketAvg.toFixed(1)}y</span>
                          </>
                        )}
                      </div>
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

export default CategoryIntelSection;

