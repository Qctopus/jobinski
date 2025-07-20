import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, Target, Users, Calendar, Award, Lightbulb, Zap } from 'lucide-react';
import { ProcessedJobData, FilterOptions } from '../types';
import { JobAnalyticsProcessor, JOB_CATEGORIES } from '../services/dataProcessor';

interface ExecutiveSummaryProps {
  data: ProcessedJobData[];
  filters: FilterOptions;
}

const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ data, filters }) => {
  const processor = useMemo(() => new JobAnalyticsProcessor(), []);
  
  // For executive summary, always use unfiltered data for market-level insights
  // This prevents the "100% agency" problem when filtering
  const dashboardMetrics = useMemo(() => {
    return processor.calculateDashboardMetrics(data, { selectedAgency: 'all', timeRange: filters.timeRange });
  }, [data, filters.timeRange, processor]);

  const temporalTrends = useMemo(() => {
    return processor.calculateTemporalTrends(data, 12);
  }, [data, processor]);

  const competitiveIntel = useMemo(() => {
    return processor.calculateCompetitiveIntelligence(data);
  }, [data, processor]);

  // Agency-specific context for personalized insights
  const isAgencyView = filters.selectedAgency !== 'all';
  const selectedAgencyName = filters.selectedAgency;

  // Generate executive insights
  const executiveInsights = useMemo(() => {
    const insights: Array<{
      type: 'growth' | 'concern' | 'opportunity' | 'trend';
      title: string;
      description: string;
      metric?: string;
      icon: React.ReactNode;
    }> = [];

    // Top category insight - agency aware
    if (dashboardMetrics.topCategories.length > 0) {
      const topCategory = dashboardMetrics.topCategories[0];
      insights.push({
        type: 'trend',
        title: isAgencyView 
          ? `Market Leader in ${topCategory.category}` 
          : `${topCategory.category} Dominates Hiring`,
        description: isAgencyView
          ? `${topCategory.category} is the top category market-wide with ${topCategory.percentage.toFixed(1)}% of all positions. ${
              competitiveIntel.categoryDominance.find(c => c.category === topCategory.category)?.leadingAgency === selectedAgencyName 
                ? 'We lead this market!' : 'Consider strengthening our position here.'
            }`
          : `Leading category represents ${topCategory.percentage.toFixed(1)}% of all job postings, indicating strong organizational focus.`,
        metric: `${topCategory.count} positions`,
        icon: <Target className="h-5 w-5" />
      });
    }

    // Emerging categories insight
    if (temporalTrends.emergingTrends.newCategories.length > 0) {
      const newCategory = temporalTrends.emergingTrends.newCategories[0];
      insights.push({
        type: 'opportunity',
        title: 'New Skill Areas Emerging',
        description: `${newCategory.category} emerged as a new hiring focus with ${newCategory.growth} positions since ${newCategory.firstAppeared}.`,
        metric: `${temporalTrends.emergingTrends.newCategories.length} new categories`,
        icon: <Zap className="h-5 w-5" />
      });
    }

    // Competitive landscape insight - agency aware
    if (competitiveIntel.agencyPositioning.length > 0) {
      const topAgency = competitiveIntel.agencyPositioning[0];
      const ourPosition = competitiveIntel.agencyPositioning.find(a => a.agency === selectedAgencyName);
      
      insights.push({
        type: 'trend',
        title: isAgencyView 
          ? `Our Market Position: #${competitiveIntel.agencyPositioning.findIndex(a => a.agency === selectedAgencyName) + 1}`
          : 'Market Leadership Concentration',
        description: isAgencyView && ourPosition
          ? `We rank #${competitiveIntel.agencyPositioning.findIndex(a => a.agency === selectedAgencyName) + 1} with ${ourPosition.marketShare.toFixed(1)}% market share across ${ourPosition.diversity} categories. ${
              ourPosition.agency === topAgency.agency ? 'We are the market leader!' : `Market leader ${topAgency.agency} has ${topAgency.marketShare.toFixed(1)}%.`
            }`
          : `${topAgency.agency} leads with ${topAgency.marketShare.toFixed(1)}% market share across ${topAgency.diversity} different role categories.`,
        metric: isAgencyView && ourPosition 
          ? `${ourPosition.volume} our positions` 
          : `${topAgency.volume} positions`,
        icon: <Award className="h-5 w-5" />
      });
    }

    // Declining areas insight
    if (temporalTrends.emergingTrends.decliningCategories.length > 0) {
      const decliningCategory = temporalTrends.emergingTrends.decliningCategories[0];
      insights.push({
        type: 'concern',
        title: 'Declining Demand Areas',
        description: `${decliningCategory.category} shows ${decliningCategory.decline.toFixed(0)}% decline, indicating shifting priorities.`,
        metric: `${temporalTrends.emergingTrends.decliningCategories.length} declining areas`,
        icon: <TrendingDown className="h-5 w-5" />
      });
    }

    // High competition insight
    const highCompetitionZones = competitiveIntel.competitiveIntensity.filter(c => c.intensity === 'High').length;
    if (highCompetitionZones > 0) {
      insights.push({
        type: 'concern',
        title: 'Intense Talent Competition',
        description: `${highCompetitionZones} category-location combinations show high competition with 5+ agencies competing.`,
        metric: `${highCompetitionZones} hot zones`,
        icon: <Users className="h-5 w-5" />
      });
    }

    return insights.slice(0, 5); // Top 5 insights
  }, [dashboardMetrics, temporalTrends, competitiveIntel]);

  // Key performance indicators
  const kpis = useMemo(() => {
    const totalAgencies = dashboardMetrics.totalAgencies;
    const totalCategories = dashboardMetrics.topCategories.length;
    const avgJobsPerAgency = totalAgencies > 0 ? Math.round(dashboardMetrics.totalJobs / totalAgencies) : 0;
    const topCategoryShare = dashboardMetrics.topCategories[0]?.percentage || 0;
    
    // Calculate month-over-month growth if possible
    const recentMonths = temporalTrends.agencyTimeSeries.slice(-2);
    let growthRate = 0;
    if (recentMonths.length === 2) {
      const current = recentMonths[1].total || 0;
      const previous = recentMonths[0].total || 0;
      growthRate = previous > 0 ? ((current - previous) / previous) * 100 : 0;
    }

    return {
      totalJobs: dashboardMetrics.totalJobs,
      totalAgencies,
      totalCategories,
      avgJobsPerAgency,
      topCategoryShare,
      growthRate,
      competitionZones: competitiveIntel.competitiveIntensity.filter(c => c.intensity === 'High').length,
      newCategories: temporalTrends.emergingTrends.newCategories.length
    };
  }, [dashboardMetrics, temporalTrends, competitiveIntel]);

  const getCategoryColor = (categoryName: string) => {
    const category = JOB_CATEGORIES.find(cat => cat.name === categoryName);
    return category?.color || '#94A3B8';
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'growth': return 'bg-green-50 border-green-200 text-green-800';
      case 'concern': return 'bg-red-50 border-red-200 text-red-800';
      case 'opportunity': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'trend': return 'bg-purple-50 border-purple-200 text-purple-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  // Top performing categories for mini chart
  const topCategoriesChart = dashboardMetrics.topCategories.slice(0, 6).map(cat => ({
    name: cat.category.length > 15 ? cat.category.substring(0, 12) + '...' : cat.category,
    value: cat.count,
    color: getCategoryColor(cat.category)
  }));

  // Recent trends mini chart
  const recentTrendsChart = temporalTrends.agencyTimeSeries.slice(-6).map(item => ({
    month: item.month.split('-')[1] + '/' + item.month.split('-')[0].slice(-2),
    total: item.total || 0
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Executive Summary</h2>
          <p className="text-gray-600 mt-1">Key insights and strategic overview</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Last updated</div>
          <div className="text-sm font-medium">{new Date().toLocaleDateString()}</div>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="metric-card">
          <div className="metric-value text-2xl">{kpis.totalJobs.toLocaleString()}</div>
          <div className="metric-label text-xs">Total Positions</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value text-2xl">{kpis.totalAgencies}</div>
          <div className="metric-label text-xs">Active Agencies</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value text-2xl">{kpis.totalCategories}</div>
          <div className="metric-label text-xs">Job Categories</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value text-2xl">{kpis.avgJobsPerAgency}</div>
          <div className="metric-label text-xs">Avg/Agency</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value text-2xl">{kpis.topCategoryShare.toFixed(0)}%</div>
          <div className="metric-label text-xs">Top Category</div>
        </div>
        
        <div className="metric-card">
          <div className={`metric-value text-2xl ${kpis.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {kpis.growthRate >= 0 ? '+' : ''}{kpis.growthRate.toFixed(0)}%
          </div>
          <div className="metric-label text-xs">MoM Growth</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value text-2xl">{kpis.competitionZones}</div>
          <div className="metric-label text-xs">Hot Zones</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-value text-2xl">{kpis.newCategories}</div>
          <div className="metric-label text-xs">New Categories</div>
        </div>
      </div>

      {/* Top Executive Insights */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Lightbulb className="h-6 w-6 text-un-blue" />
            <h3 className="text-lg font-semibold text-gray-900">Top 5 Strategic Insights</h3>
          </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {executiveInsights.map((insight, index) => (
              <div key={index} className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {insight.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold">{insight.title}</h4>
                      {insight.metric && (
                        <span className="text-sm font-medium">{insight.metric}</span>
                      )}
                    </div>
                    <p className="text-sm opacity-90">{insight.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Visual Summary Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Category Distribution */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Top Categories</h3>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topCategoriesChart}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {topCategoriesChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`${value} jobs`, 'Jobs']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Hiring Trends */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Trends</h3>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={recentTrendsChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip 
                  formatter={(value: any) => [`${value} jobs`, 'Total Jobs']}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="total" 
                  stroke="#009edb" 
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Market Leaders */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Market Leaders</h3>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={competitiveIntel.agencyPositioning.slice(0, 6)} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                  dataKey="agency" 
                  type="category" 
                  width={80}
                  fontSize={10}
                  tickFormatter={(value) => value.length > 10 ? value.substring(0, 8) + '...' : value}
                />
                <Tooltip formatter={(value: any) => [`${value} jobs`, 'Jobs']} />
                <Bar dataKey="volume" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Strategic Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Strategic Opportunities</h3>
            </div>
          </div>
          <div className="p-6">
            <ul className="space-y-3">
              {temporalTrends.emergingTrends.newCategories.length > 0 && (
                <li className="flex items-start gap-3">
                  <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Invest in Emerging Categories</div>
                    <div className="text-sm text-gray-600">
                      {temporalTrends.emergingTrends.newCategories.length} new categories showing growth potential
                    </div>
                  </div>
                </li>
              )}
              
              {competitiveIntel.competitiveIntensity.filter(c => c.intensity === 'Low').length > 0 && (
                <li className="flex items-start gap-3">
                  <Zap className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Target Low-Competition Areas</div>
                    <div className="text-sm text-gray-600">
                      Multiple locations with minimal agency competition
                    </div>
                  </div>
                </li>
              )}
              
              <li className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-purple-600 mt-0.5" />
                <div>
                  <div className="font-medium">Optimize Timing</div>
                  <div className="text-sm text-gray-600">
                    Leverage seasonal patterns for recruitment planning
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Areas to Monitor</h3>
            </div>
          </div>
          <div className="p-6">
            <ul className="space-y-3">
              {temporalTrends.emergingTrends.decliningCategories.length > 0 && (
                <li className="flex items-start gap-3">
                  <TrendingDown className="h-4 w-4 text-red-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Declining Categories</div>
                    <div className="text-sm text-gray-600">
                      {temporalTrends.emergingTrends.decliningCategories.length} categories showing reduced demand
                    </div>
                  </div>
                </li>
              )}
              
              {competitiveIntel.competitiveIntensity.filter(c => c.intensity === 'High').length > 0 && (
                <li className="flex items-start gap-3">
                  <Users className="h-4 w-4 text-orange-600 mt-0.5" />
                  <div>
                    <div className="font-medium">High Competition Zones</div>
                    <div className="text-sm text-gray-600">
                      {competitiveIntel.competitiveIntensity.filter(c => c.intensity === 'High').length} areas with intense talent competition
                    </div>
                  </div>
                </li>
              )}
              
              <li className="flex items-start gap-3">
                <Award className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div>
                  <div className="font-medium">Market Concentration</div>
                  <div className="text-sm text-gray-600">
                    Monitor top agencies for competitive positioning changes
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveSummary; 