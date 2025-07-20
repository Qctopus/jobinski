import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Users, MapPin, Clock, Briefcase } from 'lucide-react';
import { DashboardMetrics } from '../types';

interface DashboardOverviewProps {
  metrics: DashboardMetrics;
  insights: string[];
}

const COLORS = ['#009edb', '#0077be', '#4db8e8', '#66c2e8', '#80cceb', '#99d6ee', '#b3e0f1', '#cceaf4'];

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ metrics, insights }) => {
  const topAgencies = metrics.agencyDistribution.slice(0, 8);
  const topCountries = metrics.geographicDistribution.slice(0, 10);
  const topGrades = metrics.gradeDistribution.slice(0, 6);
  const recentTrends = metrics.monthlyTrends.slice(-12);

  const formatTooltip = (value: any, name: string) => {
    if (name === 'count') {
      return [`${value} jobs`, 'Job Postings'];
    }
    return [value, name];
  };

  return (
    <div className="space-y-8">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="metric-card">
          <div className="metric-value">
            {metrics.totalPostings.toLocaleString()}
          </div>
          <div className="metric-label flex items-center justify-center">
            <Briefcase className="h-4 w-4 mr-1" />
            Total Postings
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-value">
            {metrics.agencyDistribution.length}
          </div>
          <div className="metric-label flex items-center justify-center">
            <Users className="h-4 w-4 mr-1" />
            Active Agencies
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-value">
            {metrics.geographicDistribution.length}
          </div>
          <div className="metric-label flex items-center justify-center">
            <MapPin className="h-4 w-4 mr-1" />
            Countries
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-value">
            {metrics.avgApplicationWindow.length > 0 
              ? Math.round(metrics.avgApplicationWindow.reduce((sum, item) => sum + item.avgDays, 0) / metrics.avgApplicationWindow.length)
              : 0
            }
          </div>
          <div className="metric-label flex items-center justify-center">
            <Clock className="h-4 w-4 mr-1" />
            Avg App Window (Days)
          </div>
        </div>
      </div>

      {/* Insights Cards */}
      {insights.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-un-blue" />
            Key Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.slice(0, 4).map((insight, index) => (
              <div key={index} className="insight-card">
                <p className="text-sm text-gray-700">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Agency Distribution */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Agencies by Postings</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topAgencies} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="agency" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip formatter={formatTooltip} />
              <Bar dataKey="count" fill="#009edb" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Geographic Distribution */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Countries by Postings</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topCountries} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="country" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip formatter={formatTooltip} />
              <Bar dataKey="count" fill="#4db8e8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Grade Distribution */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade Level Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={topGrades}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ grade, percentage }) => `${grade} (${percentage.toFixed(1)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {topGrades.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={formatTooltip} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Trends */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Posting Volume Trends (Last 12 Months)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={recentTrends} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                fontSize={12}
              />
              <YAxis />
              <Tooltip formatter={formatTooltip} />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#009edb" 
                strokeWidth={2}
                dot={{ fill: '#009edb', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Application Window Comparison */}
      <div className="chart-container">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Application Window by Agency</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart 
            data={metrics.avgApplicationWindow.slice(0, 12)} 
            margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="agency" 
              angle={-45}
              textAnchor="end"
              height={100}
              fontSize={12}
            />
            <YAxis label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
            <Tooltip 
              formatter={(value: any) => [`${value} days`, 'Avg Application Window']} 
            />
            <Bar dataKey="avgDays" fill="#0077be" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardOverview; 