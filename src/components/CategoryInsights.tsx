import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Brain, TrendingUp, AlertCircle, Lightbulb, Award, Globe, Filter } from 'lucide-react';
import { DashboardMetrics, ProcessedJobData, FilterOptions } from '../types';
import { JOB_CATEGORIES } from '../services/dataProcessor';

interface CategoryInsightsProps {
  metrics: DashboardMetrics;
  marketMetrics: DashboardMetrics;
  data: ProcessedJobData[];
  filters: FilterOptions;
  isAgencyView: boolean;
}

const CategoryInsights: React.FC<CategoryInsightsProps> = ({ metrics, marketMetrics, data, filters, isAgencyView }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  // Generate smart insights based on the data - agency aware
  const smartInsights = useMemo(() => {
    const insights: { icon: React.ReactNode; title: string; description: string; type: 'success' | 'warning' | 'info' }[] = [];
    
    // Top category insight - different for agency vs market view
    if (metrics.topCategories.length > 0) {
      const topCategory = metrics.topCategories[0];
      
      if (isAgencyView) {
        // For agency view: show their top category and market context
        const marketCategory = marketMetrics.categoryInsights.find(c => c.category === topCategory.category);
        const marketLeader = marketCategory?.leadingAgency;
        const isMarketLeader = marketLeader === filters.selectedAgency;
        
        insights.push({
          icon: <Award className="h-5 w-5" />,
          title: `Our focus: ${topCategory.category}`,
          description: `Our top category with ${topCategory.count} positions (${topCategory.percentage.toFixed(1)}% of our jobs). ${
            isMarketLeader ? '👑 We lead this market!' : `Market led by ${marketLeader}.`
          }`,
          type: isMarketLeader ? 'success' : 'info'
        });
      } else {
        // For market view: show overall market dominance
        const leadingAgency = marketMetrics.categoryInsights.find(c => c.category === topCategory.category)?.leadingAgency;
        
        insights.push({
          icon: <Award className="h-5 w-5" />,
          title: `${topCategory.category} dominates the job market`,
          description: `${topCategory.count} positions (${topCategory.percentage.toFixed(1)}% of all jobs)${leadingAgency ? `, led by ${leadingAgency}` : ''}`,
          type: 'success'
        });
      }
    }

    // Digital transformation insight - improved with percentage and better detection
    const digitalCategories = ['Digital & Technology', 'Information Technology', 'Data & Analytics', 'Cybersecurity'];
    const digitalJobs = isAgencyView 
      ? data.filter(job => 
          (job.short_agency || job.long_agency) === filters.selectedAgency &&
          (digitalCategories.includes(job.primary_category) || 
           job.title.toLowerCase().includes('digital') ||
           job.title.toLowerCase().includes('tech') ||
           job.title.toLowerCase().includes('data') ||
           job.title.toLowerCase().includes('cyber') ||
           job.title.toLowerCase().includes('it ') ||
           job.description?.toLowerCase().includes('digital transformation') ||
           job.description?.toLowerCase().includes('data science'))
        )
      : data.filter(job => 
          digitalCategories.includes(job.primary_category) || 
          job.title.toLowerCase().includes('digital') ||
          job.title.toLowerCase().includes('tech')
        );
    
    const digitalPercentage = isAgencyView 
      ? (digitalJobs.length / metrics.totalJobs) * 100
      : (digitalJobs.length / marketMetrics.totalJobs) * 100;
      
    if (digitalJobs.length > (isAgencyView ? 3 : 50)) {
      insights.push({
        icon: <Brain className="h-5 w-5" />,
        title: isAgencyView ? 'Our digital capabilities' : 'Digital transformation accelerating',
        description: isAgencyView 
          ? `${digitalPercentage.toFixed(1)}% of our jobs focus on digital skills (${digitalJobs.length} positions) - ${
              digitalPercentage > 15 ? 'strong digital focus' : digitalPercentage > 8 ? 'growing digital capability' : 'emerging digital presence'
            }`
          : `${digitalJobs.length} digital/tech positions (${digitalPercentage.toFixed(1)}% of all jobs) - accelerating transformation`,
        type: digitalPercentage > 15 ? 'success' : 'info'
      });
    }

    // Climate insight - agency aware
    const climateCategory = isAgencyView 
      ? metrics.categoryInsights.find(c => c.category === 'Climate & Environment')
      : marketMetrics.categoryInsights.find(c => c.category === 'Climate & Environment');
      
    if (climateCategory && climateCategory.totalJobs > (isAgencyView ? 3 : 50)) {
      const climatePercentage = (climateCategory.totalJobs / (isAgencyView ? metrics.totalJobs : marketMetrics.totalJobs)) * 100;
      insights.push({
        icon: <Globe className="h-5 w-5" />,
        title: isAgencyView ? 'Our climate commitment' : 'Climate action gaining momentum',
        description: isAgencyView 
          ? `${climateCategory.totalJobs} climate positions (${climatePercentage.toFixed(1)}% of our jobs) - ${
              marketMetrics.categoryInsights.find(c => c.category === 'Climate & Environment')?.leadingAgency === filters.selectedAgency 
                ? 'leading the sustainability agenda' : 'contributing to global climate action'
            }`
          : `${climateCategory.totalJobs} climate-related positions (${climatePercentage.toFixed(1)}% of all jobs) - significant focus on sustainability`,
        type: 'success'
      });
    }

    // Health sector insight
    const healthCategory = metrics.categoryInsights.find(c => c.category === 'Health & Medical');
    if (healthCategory) {
      const healthAgencies = healthCategory.agencies.filter(a => a.percentage > 10);
      insights.push({
        icon: <Lightbulb className="h-5 w-5" />,
        title: 'Health sector recruitment patterns',
        description: `${healthCategory.totalJobs} health positions - ${healthAgencies.length} specialized agencies focus heavily on health roles`,
        type: 'info'
      });
    }

    // Emerging categories insight - more specific
    const emergingCategories = metrics.emergingCategories.filter(c => c.isNew);
    if (emergingCategories.length > 0) {
      const topEmerging = emergingCategories.slice(0, 2);
      insights.push({
        icon: <TrendingUp className="h-5 w-5" />,
        title: `${emergingCategories.length} new job categories emerging`,
        description: `Key areas: ${topEmerging.map(c => c.category).join(', ')}${emergingCategories.length > 2 ? ` and ${emergingCategories.length - 2} more` : ''}. Organizations expanding into new skill domains and operational areas.`,
        type: 'warning'
      });
    }

    // Agency specialization insight
    const specializedAgencies = metrics.agencyInsights.filter(a => a.specializations.length > 0);
    if (specializedAgencies.length > 0) {
      insights.push({
        icon: <AlertCircle className="h-5 w-5" />,
        title: `${specializedAgencies.length} agencies show clear specializations`,
        description: 'Strong thematic focus areas identified - opportunities for cross-agency collaboration',
        type: 'info'
      });
    }

    return insights;
  }, [metrics, marketMetrics, isAgencyView, filters.selectedAgency]);

  // Prepare pie chart data for category distribution
  const categoryPieData = useMemo(() => {
    return metrics.topCategories.slice(0, 8).map(category => ({
      name: category.category,
      value: category.count,
      percentage: category.percentage
    }));
  }, [metrics.topCategories]);

  // Get category color
  const getCategoryColor = (categoryName: string) => {
    const category = JOB_CATEGORIES.find(cat => cat.name === categoryName);
    return category?.color || '#94A3B8';
  };

  // Category-specific agency market share analysis
  const categoryAgencyData = useMemo(() => {
    if (!selectedCategory) return null;
    
    // Find the selected category in the insights
    const categoryInsight = marketMetrics.categoryInsights.find(c => c.category === selectedCategory);
    if (!categoryInsight) return null;
    
    // Prepare data for bar chart
    const agencyData = categoryInsight.agencies.slice(0, 8).map(agency => ({
      agency: agency.agency.length > 15 ? agency.agency.substring(0, 12) + '...' : agency.agency,
      fullAgency: agency.agency,
      jobs: agency.count,
      percentage: agency.percentage,
      isSelectedAgency: isAgencyView && agency.agency === filters.selectedAgency
    }));
    
    return {
      categoryInfo: categoryInsight,
      agencyData
    };
  }, [selectedCategory, marketMetrics.categoryInsights, isAgencyView, filters.selectedAgency]);

  // Category leadership analysis - fixed for agency view
  const categoryLeadership = useMemo(() => {
    // For agency view, use market metrics to get true market share comparison
    const sourceMetrics = isAgencyView ? marketMetrics : metrics;
    
    return sourceMetrics.categoryInsights.slice(0, 6).map(category => {
      const topAgency = category.agencies[0];
      
      // For agency view, calculate our agency's share in this category
      let ourShare = 0;
      if (isAgencyView && filters.selectedAgency) {
        const ourAgencyData = category.agencies.find(a => a.agency === filters.selectedAgency);
        ourShare = ourAgencyData?.percentage || 0;
      }
      
      return {
        category: category.category,
        leader: topAgency?.agency || 'Unknown',
        leaderPercentage: topAgency?.percentage || 0,
        ourShare: isAgencyView ? ourShare : 0,
        totalJobs: category.totalJobs,
        color: getCategoryColor(category.category),
        isOurCategory: isAgencyView && topAgency?.agency === filters.selectedAgency
      };
    });
  }, [metrics.categoryInsights, marketMetrics.categoryInsights, isAgencyView, filters.selectedAgency]);

  return (
    <div className="space-y-8 mb-8">
      {/* Smart Insights Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-un-blue" />
            <h3 className="text-lg font-semibold text-gray-900">Intelligence Insights</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            AI-powered analysis of hiring patterns and trends
          </p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {smartInsights.map((insight, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border-l-4 ${
                  insight.type === 'success' ? 'bg-green-50 border-green-400' :
                  insight.type === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                  'bg-blue-50 border-blue-400'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 ${
                    insight.type === 'success' ? 'text-green-600' :
                    insight.type === 'warning' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`}>
                    {insight.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{insight.title}</h4>
                    <p className="text-gray-700 text-xs mt-1">{insight.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Distribution and Leadership */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Category Distribution with Filter */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Category Analysis</h3>
                <p className="text-sm text-gray-600">
                  {selectedCategory ? `Agency market share in ${selectedCategory}` : 'Overall job posting breakdown by category'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-un-blue focus:border-transparent"
                >
                  <option value="">Show all categories</option>
                  {marketMetrics.categoryInsights.slice(0, 15).map(category => (
                    <option key={category.category} value={category.category}>
                      {category.category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {selectedCategory && categoryAgencyData ? (
              /* Agency Market Share Chart for Selected Category */
              <div className="space-y-6">
                {/* Category Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{selectedCategory}</h4>
                      <p className="text-sm text-gray-600">
                        {categoryAgencyData.categoryInfo.totalJobs} total jobs • {categoryAgencyData.agencyData.length} agencies active
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-un-blue">
                        {((categoryAgencyData.categoryInfo.totalJobs / marketMetrics.totalJobs) * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">of total market</div>
                    </div>
                  </div>
                </div>

                {/* Agency Market Share Bar Chart */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">Market Share by Agency</h5>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={categoryAgencyData.agencyData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="agency" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={11}
                      />
                      <YAxis 
                        label={{ value: 'Market Share (%)', angle: -90, position: 'insideLeft' }}
                        fontSize={11}
                      />
                      <Tooltip 
                        formatter={(value: any, name: string, props: any) => [
                          `${value.toFixed(1)}%`,
                          'Market Share'
                        ]}
                        labelFormatter={(label: any, payload: any) => {
                          if (payload && payload[0]) {
                            const data = payload[0].payload;
                            return `${data.fullAgency} (${data.jobs} jobs)`;
                          }
                          return label;
                        }}
                      />
                      <Bar 
                        dataKey="percentage" 
                        radius={[4, 4, 0, 0]}
                      >
                        {categoryAgencyData.agencyData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.isSelectedAgency ? '#009edb' : '#94A3B8'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Top Agencies List */}
                <div>
                  <h5 className="font-medium text-gray-900 mb-3">Agency Rankings</h5>
                  <div className="space-y-2">
                    {categoryAgencyData.agencyData.slice(0, 5).map((agency, index) => (
                      <div key={agency.fullAgency} className={`flex items-center justify-between p-3 rounded-lg ${
                        agency.isSelectedAgency ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            index === 0 ? 'bg-yellow-500' : 
                            index === 1 ? 'bg-gray-400' : 
                            index === 2 ? 'bg-yellow-600' : 
                            'bg-gray-300'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {agency.fullAgency}
                              {agency.isSelectedAgency && <span className="ml-2 text-blue-600">(You)</span>}
                            </div>
                            <div className="text-sm text-gray-600">{agency.jobs} jobs</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${
                            agency.isSelectedAgency ? 'text-blue-600' : 'text-gray-900'
                          }`}>
                            {agency.percentage.toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-500">market share</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Default Category Distribution Pie Chart */
              <div className="flex flex-col lg:flex-row items-center gap-6">
                {/* Pie Chart */}
                <div className="w-full lg:w-1/2">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [value, 'Job Postings']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Legend with percentages */}
                <div className="w-full lg:w-1/2">
                  <div className="space-y-3">
                    {categoryPieData.map((entry, index) => (
                      <div 
                        key={entry.name} 
                        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
                        onClick={() => setSelectedCategory(entry.name)}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: getCategoryColor(entry.name) }}
                          />
                          <span className="text-sm font-medium text-gray-900">
                            {entry.name.length > 20 ? entry.name.substring(0, 18) + '...' : entry.name}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-gray-900">{entry.percentage.toFixed(1)}%</div>
                          <div className="text-xs text-gray-600">{entry.value} jobs</div>
                        </div>
                      </div>
                    ))}
                    <div className="text-xs text-gray-500 text-center mt-3">
                      💡 Click on categories to see agency market share
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Category Leadership */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Category Leadership</h3>
            <p className="text-sm text-gray-600">
              {isAgencyView ? 'Market leaders vs our position in each category' : 'Which agencies dominate each category'}
            </p>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {categoryLeadership.map((item, index) => (
                <div key={item.category} className={`p-4 rounded-lg border ${
                  item.isOurCategory ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <div>
                        <div className="font-medium text-gray-900 text-sm">
                          {item.category}
                          {item.isOurCategory && <span className="ml-2 text-blue-600">👑</span>}
                        </div>
                        <div className="text-xs text-gray-600">{item.totalJobs} total market jobs</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900 text-sm">{item.leader}</div>
                      <div className="text-xs text-gray-600">{item.leaderPercentage.toFixed(1)}% market share</div>
                    </div>
                  </div>
                  
                  {/* Show our position for agency view */}
                  {isAgencyView && (
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span className="text-xs text-gray-600">Our position:</span>
                      <div className="text-right">
                        <span className={`text-xs font-medium ${
                          item.ourShare > 0 ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                          {item.ourShare > 0 ? `${item.ourShare.toFixed(1)}% share` : 'Not active'}
                        </span>
                        {item.ourShare > item.leaderPercentage * 0.8 && (
                          <span className="ml-1 text-xs text-green-600">🚀 Competitive</span>
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

      {/* Detailed Category Analysis */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Category Deep Dive</h3>
          <p className="text-sm text-gray-600">
            {isAgencyView 
              ? 'Market-wide category analysis with your agency\'s competitive position highlighted' 
              : 'Detailed analysis of job categories and their characteristics'
            }
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Jobs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leading Agency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Skill Demand
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Key Agencies
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(isAgencyView ? marketMetrics.categoryInsights : metrics.categoryInsights).slice(0, 10).map((category, index) => {
                // For agency view, find our agency's position in this category
                let ourAgencyData = null;
                if (isAgencyView && filters.selectedAgency) {
                  ourAgencyData = category.agencies.find(a => a.agency === filters.selectedAgency);
                }
                
                return (
                  <tr key={category.category} className={ourAgencyData && ourAgencyData.percentage > 10 ? 'bg-blue-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getCategoryColor(category.category) }}
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {category.category}
                            {ourAgencyData && ourAgencyData.percentage > 20 && <span className="ml-1 text-blue-600">👑</span>}
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
                      <div className="text-sm text-gray-900">{category.totalJobs.toLocaleString()}</div>
                      {isAgencyView && ourAgencyData && (
                        <div className="text-xs text-blue-600">{ourAgencyData.count} our jobs</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{category.leadingAgency}</div>
                      <div className="text-xs text-gray-500">
                        {category.agencies[0]?.percentage.toFixed(1)}% market share
                      </div>
                      {isAgencyView && ourAgencyData && (
                        <div className="text-xs text-blue-600 mt-1">
                          We have {ourAgencyData.percentage.toFixed(1)}%
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        category.skillDemand === 'High' ? 'bg-red-100 text-red-800' :
                        category.skillDemand === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {category.skillDemand}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {category.agencies.slice(0, 3).map(agency => (
                          <span
                            key={agency.agency}
                            className={`inline-flex px-2 py-1 text-xs rounded-full ${
                              isAgencyView && agency.agency === filters.selectedAgency 
                                ? 'bg-blue-100 text-blue-800 font-medium' 
                                : 'bg-gray-100 text-gray-800'
                            }`}
                            title={`${agency.count} jobs (${agency.percentage.toFixed(1)}%)`}
                          >
                            {agency.agency.length > 8 ? agency.agency.substring(0, 6) + '..' : agency.agency}
                            {isAgencyView && agency.agency === filters.selectedAgency && ' (us)'}
                          </span>
                        ))}
                        {category.agencies.length > 3 && (
                          <span className="inline-flex px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-600">
                            +{category.agencies.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Growth Analysis */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-un-blue" />
            <h3 className="text-lg font-semibold text-gray-900">Growth & Emerging Trends</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Categories showing significant growth and new developments
          </p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.emergingCategories.map((category, index) => (
              <div key={category.category} className="border border-gray-200 rounded-lg p-4">
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
    </div>
  );
};

export default CategoryInsights; 