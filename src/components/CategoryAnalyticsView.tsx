import React, { useMemo, useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  MapPin, 
  Calendar,
  Target,
  Briefcase,
  Clock,
  BarChart3,
  Zap,
  Globe,
  GraduationCap,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { ProcessedJobData, CategoryAnalytics } from '../types';
import { useDataProcessing } from '../contexts/DataProcessingContext';
import { AreaChart, BarChart, PieChart, LineChart } from './charts';

interface CategoryAnalyticsViewProps {
  category: string;
  data: ProcessedJobData[];
  onClose: () => void;
}

const CategoryAnalyticsView: React.FC<CategoryAnalyticsViewProps> = ({
  category,
  data,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'competition' | 'quality'>('overview');
  const { processor } = useDataProcessing();
  
  // Calculate comprehensive analytics
  const analytics = useMemo(() => {
    return processor.calculateCategoryAnalytics(data, category);
  }, [data, category, processor]);

  if (!analytics) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-600">No jobs found for the category "{category}"</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'trends', label: 'Trends', icon: TrendingUp },
    { id: 'competition', label: 'Competition', icon: Target },
    { id: 'quality', label: 'Quality', icon: CheckCircle }
  ];

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return 'text-green-600 bg-green-100';
    if (confidence >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getUrgencyColor = (urgency: number) => {
    if (urgency >= 30) return 'text-red-600 bg-red-100';
    if (urgency >= 15) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  return (
    <div className="bg-white rounded-lg shadow-xl">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{category} Analytics</h2>
            <p className="text-gray-600 mt-1">
              Deep insights into {analytics.gradeBreakdown.totalPositions} positions
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mt-6 bg-gray-100 p-1 rounded-lg">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Growth Rate */}
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">Growth Rate</p>
                    <p className="text-2xl font-bold text-green-900">
                      {analytics.growthRate.isOutperforming ? '+' : ''}
                      {analytics.growthRate.categoryGrowthRate}%
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      vs market: {analytics.growthRate.relativePerformance > 0 ? '+' : ''}
                      {analytics.growthRate.relativePerformance}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </div>

              {/* Urgency Rate */}
              <div className={`p-6 rounded-lg border ${
                analytics.urgencyAnalysis.urgencyRate >= 30 
                  ? 'bg-gradient-to-r from-red-50 to-red-100 border-red-200' 
                  : analytics.urgencyAnalysis.urgencyRate >= 15
                  ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200'
                  : 'bg-gradient-to-r from-green-50 to-green-100 border-green-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Urgency Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analytics.urgencyAnalysis.urgencyRate}%
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {analytics.urgencyAnalysis.urgentJobsCount} urgent jobs
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-gray-600" />
                </div>
              </div>

              {/* Classification Quality */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Avg Confidence</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {analytics.classificationQuality.avgConfidence}%
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {analytics.classificationQuality.needsReview} need review
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              {/* Posting Velocity */}
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700">Weekly Volume</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {analytics.postingVelocity.avgJobsPerWeek}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">
                      jobs per week
                    </p>
                  </div>
                  <Zap className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Grade Distribution */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade Distribution</h3>
                <PieChart
                  data={analytics.gradeBreakdown.distribution.map(item => ({
                    name: item.grade,
                    value: item.count,
                    percentage: item.percentage
                  }))}
                  height={300}
                  showLabels={true}
                />
                <div className="mt-4 text-sm text-gray-600">
                  <p>Consultant positions: {analytics.gradeBreakdown.consultantPercentage.toFixed(1)}%</p>
                  <p>Average grade: {analytics.gradeBreakdown.avgGradeLevel}</p>
                </div>
              </div>

              {/* Agency Concentration */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Agency Concentration</h3>
                <BarChart
                  data={analytics.agencyConcentration.slice(0, 6).map(item => ({
                    name: item.agency,
                    value: item.percentage,
                    count: item.count
                  }))}
                  height={300}
                  dataKey="value"
                  xAxisKey="name"
                  color="#3B82F6"
                />
                <div className="mt-4 text-sm text-gray-600">
                  <p>Market leader: {analytics.agencyConcentration[0]?.agency}</p>
                  <p>Market share: {analytics.agencyConcentration[0]?.percentage.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* Top Positions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Job Titles</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Count</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">% of Category</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Agencies</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Grades</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {analytics.topPositions.slice(0, 10).map((position, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {position.title}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {position.count}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {position.percentage.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {position.agencies.slice(0, 2).join(', ')}
                          {position.agencies.length > 2 && ` +${position.agencies.length - 2}`}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {position.grades.slice(0, 3).join(', ')}
                          {position.grades.length > 3 && ` +${position.grades.length - 3}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="space-y-8">
            {/* Monthly Trends */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Posting Trends</h3>
              <LineChart
                data={analytics.monthlyTrend.monthlyData}
                height={300}
                dataKey="count"
                xAxisKey="month"
                color="#10B981"
              />
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="font-medium text-green-900">Growth Rate</p>
                  <p className="text-green-700">{analytics.monthlyTrend.growthRate.toFixed(1)}%</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="font-medium text-blue-900">Peak Month</p>
                  <p className="text-blue-700">{analytics.monthlyTrend.peakMonth.month}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium text-gray-900">Avg Monthly</p>
                  <p className="text-gray-700">{analytics.monthlyTrend.avgMonthlyVolume.toFixed(1)}</p>
                </div>
              </div>
            </div>

            {/* Application Window Analysis */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Window Distribution</h3>
              <BarChart
                data={analytics.avgDaysToDeadline.distribution.map(item => ({
                  name: item.range,
                  value: item.percentage,
                  count: item.count
                }))}
                height={300}
                dataKey="value"
                xAxisKey="name"
                color="#F59E0B"
              />
              <div className="mt-4 text-center">
                <p className="text-lg font-semibold text-gray-900">
                  Average: {analytics.avgDaysToDeadline.avg} days
                </p>
              </div>
            </div>

            {/* Experience Requirements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Experience Requirements</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">High School</span>
                      <span className="text-sm text-gray-600">{analytics.experienceProfile.highSchool.positions} positions</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Avg: {analytics.experienceProfile.highSchool.avg} years
                      {analytics.experienceProfile.highSchool.positions > 0 && 
                        ` (${analytics.experienceProfile.highSchool.min}-${analytics.experienceProfile.highSchool.max})`
                      }
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Bachelor's</span>
                      <span className="text-sm text-gray-600">{analytics.experienceProfile.bachelor.positions} positions</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Avg: {analytics.experienceProfile.bachelor.avg} years
                      {analytics.experienceProfile.bachelor.positions > 0 && 
                        ` (${analytics.experienceProfile.bachelor.min}-${analytics.experienceProfile.bachelor.max})`
                      }
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Master's</span>
                      <span className="text-sm text-gray-600">{analytics.experienceProfile.master.positions} positions</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Avg: {analytics.experienceProfile.master.avg} years
                      {analytics.experienceProfile.master.positions > 0 && 
                        ` (${analytics.experienceProfile.master.min}-${analytics.experienceProfile.master.max})`
                      }
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Language Requirements</h3>
                <div className="space-y-3">
                  {analytics.languageRequirements.topLanguages.slice(0, 6).map((lang, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">{lang.language}</span>
                      <div className="text-right">
                        <span className="text-sm text-gray-900">{lang.count}</span>
                        <span className="text-xs text-gray-600 ml-1">({lang.percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
                  <p>Multilingual positions: {analytics.languageRequirements.multilingualPercentage.toFixed(1)}%</p>
                  <p>Avg languages required: {analytics.languageRequirements.avgLanguagesRequired.toFixed(1)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'competition' && (
          <div className="space-y-8">
            {/* Agency Competition Matrix */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Agency Competition</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Agency</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Positions</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Market Share</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {analytics.agencyConcentration.map((agency, index) => (
                      <tr key={index} className={`hover:bg-gray-50 ${agency.isLeader ? 'bg-blue-50' : ''}`}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          #{agency.rank}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {agency.agency}
                          {agency.isLeader && <span className="ml-2 text-blue-600">👑</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {agency.count}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {agency.percentage.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3">
                          {agency.isLeader && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Market Leader
                            </span>
                          )}
                          {agency.percentage >= 15 && !agency.isLeader && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Strong Player
                            </span>
                          )}
                          {agency.percentage < 15 && agency.percentage >= 5 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Active
                            </span>
                          )}
                          {agency.percentage < 5 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Niche Player
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Location Hotspots */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Hotspots</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.locationHotspots.map((location, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{location.location}</h4>
                      <MapPin className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>{location.count} positions ({location.percentage.toFixed(1)}%)</p>
                      <p className="capitalize">{location.locationType}</p>
                      {location.countries.length > 1 && (
                        <p className="text-xs mt-1">Multiple countries</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Related Categories */}
            {analytics.relatedCategories.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Categories</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Categories that frequently appear as secondary matches for jobs in {category}
                </p>
                <div className="space-y-2">
                  {analytics.relatedCategories.map((related, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900">{related.category}</span>
                      <div className="text-right">
                        <span className="text-sm text-gray-900">{related.count} jobs</span>
                        <span className="text-xs text-gray-600 ml-1">({related.percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'quality' && (
          <div className="space-y-8">
            {/* Classification Quality Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Average Confidence</h3>
                <p className={`text-3xl font-bold ${getConfidenceColor(analytics.classificationQuality.avgConfidence)}`}>
                  {analytics.classificationQuality.avgConfidence}%
                </p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Review</h3>
                <p className="text-3xl font-bold text-red-600">
                  {analytics.classificationQuality.needsReview}
                </p>
                <p className="text-sm text-gray-600">Low confidence jobs</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ambiguous</h3>
                <p className="text-3xl font-bold text-yellow-600">
                  {analytics.classificationQuality.ambiguousJobs}
                </p>
                <p className="text-sm text-gray-600">Borderline cases</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Posting Velocity</h3>
                <p className="text-3xl font-bold text-purple-600">
                  {analytics.postingVelocity.avgJobsPerWeek}
                </p>
                <p className="text-sm text-gray-600">Jobs per week</p>
              </div>
            </div>

            {/* Quality Distribution */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Classification Quality Distribution</h3>
              <BarChart
                data={analytics.classificationQuality.distribution.map(item => ({
                  name: item.level,
                  value: item.percentage,
                  count: item.count
                }))}
                height={300}
                dataKey="value"
                xAxisKey="name"
                color="#6366F1"
              />
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {analytics.classificationQuality.distribution.map((item, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium text-gray-900">{item.level}</p>
                    <p className="text-gray-700">{item.count} jobs ({item.percentage.toFixed(1)}%)</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Urgency Analysis */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Urgency Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Overall Urgency</h4>
                  <div className={`p-4 rounded-lg ${getUrgencyColor(analytics.urgencyAnalysis.urgencyRate)}`}>
                    <p className="text-2xl font-bold">{analytics.urgencyAnalysis.urgencyRate}%</p>
                    <p className="text-sm">
                      {analytics.urgencyAnalysis.urgentJobsCount} out of {analytics.gradeBreakdown.totalPositions} jobs have ≤14 day application windows
                    </p>
                    <p className="text-xs mt-2">
                      Average urgent window: {analytics.urgencyAnalysis.avgUrgentWindow} days
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Agencies with Urgent Hiring</h4>
                  <div className="space-y-2">
                    {analytics.urgencyAnalysis.agenciesWithUrgentHiring.map((agency, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">{agency.agency}</span>
                        <span className="text-sm text-gray-600">{agency.count} urgent</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Posting Velocity Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Posting Velocity Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm font-medium text-purple-700">Average Weekly</p>
                  <p className="text-xl font-bold text-purple-900">
                    {analytics.postingVelocity.avgJobsPerWeek}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium text-green-700">Peak Week</p>
                  <p className="text-xl font-bold text-green-900">
                    {analytics.postingVelocity.peakWeek}
                  </p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-700">Low Week</p>
                  <p className="text-xl font-bold text-blue-900">
                    {analytics.postingVelocity.lowWeek}
                  </p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-sm font-medium text-yellow-700">Volatility</p>
                  <p className="text-xl font-bold text-yellow-900">
                    {analytics.postingVelocity.volatility}%
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                Volatility measures how much weekly posting volume varies. Higher values indicate more unpredictable posting patterns.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryAnalyticsView;
