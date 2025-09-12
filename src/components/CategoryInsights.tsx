import React, { useMemo, useState } from 'react';
import { Brain, TrendingUp, Award, Eye, BarChart3, Zap } from 'lucide-react';
import { PieChart } from './charts';
import { DashboardMetrics, ProcessedJobData, FilterOptions } from '../types';
import { JOB_CATEGORIES } from '../services/categorization/CategoryProcessor';
import CategoryDrillDown from './CategoryDrillDown';

interface CategoryInsightsProps {
  metrics: DashboardMetrics;
  marketMetrics: DashboardMetrics;
  data: ProcessedJobData[];
  filters: FilterOptions;
  isAgencyView: boolean;
}

const CategoryInsights: React.FC<CategoryInsightsProps> = ({ 
  metrics, 
  marketMetrics, 
  data, 
  filters, 
  isAgencyView 
}) => {
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownCategoryId, setDrillDownCategoryId] = useState<string>('');

  // Handle category clicks
  const handleCategoryClick = (categoryIdentifier: string) => {
    console.log('Category clicked:', categoryIdentifier);
    
    // Try multiple matching strategies - could be either name or ID
    let category = JOB_CATEGORIES.find(cat => 
      cat.name === categoryIdentifier || 
      cat.id === categoryIdentifier ||
      cat.name.toLowerCase() === categoryIdentifier.toLowerCase() ||
      cat.id.toLowerCase() === categoryIdentifier.toLowerCase()
    );
    
    if (category) {
      console.log('Opening drill-down for category:', category.name);
      
      setDrillDownCategoryId(category.id);
      setDrillDownOpen(true);
    } else {
      console.error('No matching category found for:', categoryIdentifier);
      console.log('Available categories:', JOB_CATEGORIES.map(cat => ({ id: cat.id, name: cat.name })));
    }
  };

  // Get category color helper
  const getCategoryColor = (categoryName: string) => {
    const category = JOB_CATEGORIES.find(cat => cat.name === categoryName);
    return category?.color || '#6B7280';
  };

  // Key insights based on data
  const keyInsights = useMemo(() => {
    const insights = [];
    
    if (metrics.topCategories.length > 0) {
      const topCategory = metrics.topCategories[0];
      
      if (isAgencyView) {
        const marketCategory = marketMetrics.categoryInsights.find(c => c.category === topCategory.category);
        const isMarketLeader = marketCategory?.leadingAgency === filters.selectedAgency;
        
        insights.push({
          icon: <Award className="h-5 w-5" />,
          title: `Our specialty: ${topCategory.category}`,
          description: `${topCategory.count} positions (${topCategory.percentage.toFixed(1)}% of our portfolio)`,
          type: isMarketLeader ? 'success' : 'info',
          action: () => handleCategoryClick(topCategory.category)
        });
      } else {
        insights.push({
          icon: <BarChart3 className="h-5 w-5" />,
          title: `${topCategory.category} leads the market`,
          description: `${topCategory.count} positions (${topCategory.percentage.toFixed(1)}% of all jobs)`,
          type: 'success',
          action: () => handleCategoryClick(topCategory.category)
        });
      }
    }

    // Market concentration insight
    const top3Share = metrics.topCategories.slice(0, 3).reduce((sum, cat) => sum + cat.percentage, 0);
    if (top3Share > 60) {
      insights.push({
        icon: <Zap className="h-5 w-5" />,
        title: 'High market concentration',
        description: `Top 3 categories represent ${top3Share.toFixed(1)}% of all positions`,
        type: 'warning',
        action: undefined
      });
    }

    // Emerging categories insight
    if (metrics.emergingCategories.length > 0) {
      const fastestGrowing = metrics.emergingCategories
        .sort((a, b) => b.growthRate - a.growthRate)[0];
      
      insights.push({
        icon: <TrendingUp className="h-5 w-5" />,
        title: 'Fastest growing area',
        description: `${fastestGrowing.category} (+${fastestGrowing.growthRate.toFixed(0)}% growth)`,
        type: 'info',
        action: () => handleCategoryClick(fastestGrowing.category)
      });
    }

    return insights;
  }, [metrics, marketMetrics, isAgencyView, filters.selectedAgency]);

  // Market leadership analysis
  const marketLeadership = useMemo(() => {
    return marketMetrics.categoryInsights.slice(0, 8).map(category => {
      const topAgency = category.agencies?.[0];
      let ourShare = 0;
      
      if (isAgencyView && filters.selectedAgency) {
        const ourAgencyData = category.agencies.find((a: any) => a.agency === filters.selectedAgency);
        ourShare = ourAgencyData?.percentage || 0;
      }
      
      return {
        category: category.category,
        leader: topAgency?.agency || 'Unknown',
        leaderPercentage: topAgency?.percentage || 0,
        ourShare: isAgencyView ? ourShare : 0,
        totalJobs: category.totalJobs,
        color: getCategoryColor(category.category),
        isOurCategory: isAgencyView && topAgency?.agency === filters.selectedAgency,
        competitive: isAgencyView && ourShare > 0 && ourShare >= (topAgency?.percentage || 0) * 0.7
      };
    });
  }, [marketMetrics.categoryInsights, isAgencyView, filters.selectedAgency]);

  // Chart data preparation
  const categoryChartData = useMemo(() => {
    return metrics.topCategories.slice(0, 8).map(category => ({
      name: category.category,
      value: category.count,
      percentage: category.percentage,
      color: getCategoryColor(category.category)
    }));
  }, [metrics.topCategories]);

  const getInsightStyle = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-200 bg-green-50 text-green-800';
      case 'warning': return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'info': return 'border-blue-200 bg-blue-50 text-blue-800';
      default: return 'border-gray-200 bg-gray-50 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Category Intelligence</h2>
            <p className="text-gray-600 mt-1">
              {isAgencyView 
                ? 'Strategic analysis of your agency\'s portfolio and market positioning' 
                : 'Market-wide category analysis and competitive landscape'
              }
            </p>
          </div>
          <Brain className="h-12 w-12 text-indigo-600" />
        </div>
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {keyInsights.map((insight, index) => (
          <div 
            key={index} 
            className={`p-4 rounded-lg border-2 ${getInsightStyle(insight.type)} ${
              insight.action ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
            }`}
            onClick={insight.action}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {insight.icon}
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">{insight.title}</h3>
                <p className="text-sm opacity-90">{insight.description}</p>
                {insight.action && (
                  <p className="text-xs mt-2 opacity-75">Click to explore →</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Distribution Chart */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {isAgencyView ? 'Our Portfolio Distribution' : 'Market Distribution'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Job distribution across key categories
            </p>
          </div>
          
          <div className="p-6">
            {categoryChartData.length > 0 ? (
              <PieChart
                data={categoryChartData}
                height={300}
                showLabels={true}
                onSliceClick={(data) => handleCategoryClick(data.name)}
                className="cursor-pointer"
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No category data available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Market Position Analysis */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {isAgencyView ? 'Competitive Position' : 'Market Leaders'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {isAgencyView 
                ? 'How we compare to market leaders in each category' 
                : 'Leading agencies by category'
              }
            </p>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {marketLeadership.map((item, index) => (
                <div 
                  key={item.category} 
                  className={`p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                    item.isOurCategory ? 'border-blue-200 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleCategoryClick(item.category)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <div>
                        <div className="font-medium text-gray-900 text-sm flex items-center gap-2">
                          {item.category}
                          {item.isOurCategory && <span className="text-blue-600">👑</span>}
                          {item.competitive && !item.isOurCategory && <span className="text-green-600">🚀</span>}
                        </div>
                        <div className="text-xs text-gray-600">{item.totalJobs.toLocaleString()} total jobs</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900 text-sm">{item.leader}</div>
                      <div className="text-xs text-gray-600">{item.leaderPercentage.toFixed(1)}% share</div>
                    </div>
                  </div>
                  
                  {isAgencyView && (
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span className="text-xs text-gray-600">Our position:</span>
                      <div className="text-right">
                        <span className={`text-xs font-medium ${
                          item.ourShare > 0 ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                          {item.ourShare > 0 ? `${item.ourShare.toFixed(1)}% share` : 'Not active'}
                        </span>
                        {item.competitive && (
                          <span className="ml-1 text-xs text-green-600">Competitive</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Category Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Category Deep Dive</h3>
              <p className="text-sm text-gray-600 mt-1">
                Comprehensive category analysis with market intelligence
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
              <Eye className="h-4 w-4" />
              <span>💡 <strong>Tip:</strong> Click any category to explore jobs with advanced filtering</span>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {isAgencyView ? 'Our Jobs' : 'Total Jobs'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Market Share
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leading Agency
                </th>
                {isAgencyView && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Our Position
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Growth Trend
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(isAgencyView ? metrics.categoryInsights : marketMetrics.categoryInsights)
                .slice(0, 15)
                .map(category => {
                  let ourAgencyData: any = null;
                  if (isAgencyView && filters.selectedAgency) {
                    ourAgencyData = category.agencies.find((a: any) => a.agency === filters.selectedAgency) || null;
                  }
                  
                  return (
                    <tr 
                      key={category.category} 
                      className={`${
                        ourAgencyData && ourAgencyData.percentage > 10 ? 'bg-blue-50' : ''
                      } hover:bg-gray-50 cursor-pointer group transition-colors`}
                      onClick={() => handleCategoryClick(category.category)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getCategoryColor(category.category) }}
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                              {category.category}
                              {ourAgencyData && ourAgencyData.percentage > 20 && <span className="text-blue-600">👑</span>}
                              <Eye className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="text-xs text-gray-500">
                              {isAgencyView 
                                ? `${((category.totalJobs / marketMetrics.totalJobs) * 100).toFixed(1)}% of total market`
                                : `${((category.totalJobs / metrics.totalJobs) * 100).toFixed(1)}% of all jobs`
                              }
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {category.totalJobs.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {((category.totalJobs / (isAgencyView ? marketMetrics.totalJobs : metrics.totalJobs)) * 100).toFixed(1)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{category.leadingAgency}</div>
                      </td>
                      {isAgencyView && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {ourAgencyData ? (
                            <div className="text-sm">
                              <span className="font-medium text-blue-600">
                                {ourAgencyData.percentage.toFixed(1)}%
                              </span>
                              <div className="text-xs text-gray-500">
                                {ourAgencyData.count} jobs
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">Not active</span>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${
                          category.growthRate > 10 ? 'text-green-600' : 
                          category.growthRate < -10 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {category.growthRate > 0 ? '+' : ''}{category.growthRate.toFixed(0)}%
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Emerging Categories */}
      {metrics.emergingCategories.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Emerging Categories
            </h3>
            <p className="text-sm text-gray-600 mt-1">Fast-growing areas showing significant momentum</p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics.emergingCategories.map((category, index) => (
                <div 
                  key={category.category} 
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleCategoryClick(category.category)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getCategoryColor(category.category) }}
                      />
                      <span className="font-medium text-sm text-gray-900">{category.category}</span>
                    </div>
                    {category.isNew && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        NEW
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-green-600 font-semibold text-sm">
                      +{category.growthRate.toFixed(0)}% growth
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    {category.isNew ? 'First appeared in recent months' : 'Showing strong upward trend'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Category Drill-Down Modal */}
      <CategoryDrillDown
        isOpen={drillDownOpen}
        onClose={() => setDrillDownOpen(false)}
        categoryId={drillDownCategoryId}
        data={data}
        filters={filters}
        agencyName={isAgencyView ? filters.selectedAgency : undefined}
      />
    </div>
  );
};

export default CategoryInsights;