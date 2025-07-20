import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Brain, TrendingUp, AlertCircle, Lightbulb, Award, Globe } from 'lucide-react';
import { DashboardMetrics, ProcessedJobData, FilterOptions } from '../types';
import { JOB_CATEGORIES } from '../services/dataProcessor';

interface CategoryInsightsProps {
  metrics: DashboardMetrics;
  data: ProcessedJobData[];
  filters: FilterOptions;
}

const CategoryInsights: React.FC<CategoryInsightsProps> = ({ metrics, data, filters }) => {
  
  // Generate smart insights based on the data
  const smartInsights = useMemo(() => {
    const insights: { icon: React.ReactNode; title: string; description: string; type: 'success' | 'warning' | 'info' }[] = [];
    
    // Top category insight
    if (metrics.topCategories.length > 0) {
      const topCategory = metrics.topCategories[0];
      const leadingAgency = metrics.categoryInsights.find(c => c.category === topCategory.category)?.leadingAgency;
      
      insights.push({
        icon: <Award className="h-5 w-5" />,
        title: `${topCategory.category} dominates the job market`,
        description: `${topCategory.count} positions (${topCategory.percentage.toFixed(1)}% of all jobs)${leadingAgency ? `, led by ${leadingAgency}` : ''}`,
        type: 'success'
      });
    }

    // Digital transformation insight
    const digitalCategory = metrics.categoryInsights.find(c => c.category === 'Digital & Technology');
    if (digitalCategory && digitalCategory.totalJobs > 100) {
      insights.push({
        icon: <Brain className="h-5 w-5" />,
        title: 'Digital transformation accelerating',
        description: `${digitalCategory.totalJobs} digital/tech positions across ${digitalCategory.agencies.length} agencies - ${digitalCategory.leadingAgency} leads the charge`,
        type: 'info'
      });
    }

    // Climate insight
    const climateCategory = metrics.categoryInsights.find(c => c.category === 'Climate & Environment');
    if (climateCategory && climateCategory.totalJobs > 50) {
      const climatePercentage = (climateCategory.totalJobs / metrics.totalJobs) * 100;
      insights.push({
        icon: <Globe className="h-5 w-5" />,
        title: 'Climate action gaining momentum',
        description: `${climateCategory.totalJobs} climate-related positions (${climatePercentage.toFixed(1)}% of all jobs) - significant focus on sustainability`,
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

    // Emerging categories insight
    const emergingCount = metrics.emergingCategories.filter(c => c.isNew).length;
    if (emergingCount > 0) {
      insights.push({
        icon: <TrendingUp className="h-5 w-5" />,
        title: `${emergingCount} new job categories emerging`,
        description: 'Organizations are expanding into new skill areas and operational domains',
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
  }, [metrics]);

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

  // Category leadership analysis
  const categoryLeadership = useMemo(() => {
    return metrics.categoryInsights.slice(0, 6).map(category => {
      const topAgency = category.agencies[0];
      return {
        category: category.category,
        leader: topAgency?.agency || 'Unknown',
        percentage: topAgency?.percentage || 0,
        totalJobs: category.totalJobs,
        color: getCategoryColor(category.category)
      };
    });
  }, [metrics.categoryInsights]);

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
        {/* Category Distribution Pie Chart */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Category Distribution</h3>
            <p className="text-sm text-gray-600">Overall job posting breakdown by category</p>
          </div>
          
          <div className="p-6">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={categoryPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                  outerRadius={120}
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
        </div>

        {/* Category Leadership */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Category Leadership</h3>
            <p className="text-sm text-gray-600">Which agencies dominate each category</p>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {categoryLeadership.map((item, index) => (
                <div key={item.category} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{item.category}</div>
                      <div className="text-xs text-gray-600">{item.totalJobs} total jobs</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900 text-sm">{item.leader}</div>
                    <div className="text-xs text-gray-600">{item.percentage.toFixed(1)}% market share</div>
                  </div>
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
          <p className="text-sm text-gray-600">Detailed analysis of job categories and their characteristics</p>
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
              {metrics.categoryInsights.slice(0, 10).map((category, index) => (
                <tr key={category.category}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getCategoryColor(category.category) }}
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{category.category}</div>
                        <div className="text-xs text-gray-500">
                          {((category.totalJobs / metrics.totalJobs) * 100).toFixed(1)}% of all jobs
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{category.totalJobs.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{category.leadingAgency}</div>
                    <div className="text-xs text-gray-500">
                      {category.agencies[0]?.percentage.toFixed(1)}% share
                    </div>
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
                          className="inline-flex px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800"
                          title={`${agency.count} jobs (${agency.percentage.toFixed(1)}%)`}
                        >
                          {agency.agency.length > 8 ? agency.agency.substring(0, 6) + '..' : agency.agency}
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
              ))}
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