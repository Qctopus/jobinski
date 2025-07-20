import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { TrendingUp, Globe, Languages, Home, MapPin, Calendar, Briefcase } from 'lucide-react';
import { ProcessedJobData } from '../types';

interface MarketIntelligenceProps {
  data: ProcessedJobData[];
}

const COLORS = ['#009edb', '#0077be', '#4db8e8', '#66c2e8', '#80cceb', '#99d6ee', '#b3e0f1', '#cceaf4'];

const MarketIntelligence: React.FC<MarketIntelligenceProps> = ({ data }) => {
  // Seasonal hiring patterns
  const seasonalData = React.useMemo(() => {
    const quarterlyMap = new Map<string, number>();
    const monthlyMap = new Map<string, number>();
    
    data.forEach(job => {
      if (job.quarter && job.month) {
        const quarter = `Q${job.quarter}`;
        const month = new Date(2024, job.month - 1).toLocaleString('default', { month: 'short' });
        
        quarterlyMap.set(quarter, (quarterlyMap.get(quarter) || 0) + 1);
        monthlyMap.set(month, (monthlyMap.get(month) || 0) + 1);
      }
    });

    const quarterly = Array.from(quarterlyMap.entries()).map(([quarter, count]) => ({
      quarter,
      count,
      percentage: (count / data.length) * 100
    }));

    const monthly = Array.from(monthlyMap.entries()).map(([month, count]) => ({
      month,
      count,
      percentage: (count / data.length) * 100
    }));

    return { quarterly, monthly };
  }, [data]);

  // Language requirements analysis
  const languageData = React.useMemo(() => {
    const languageMap = new Map<string, number>();
    const multiLangCount = data.filter(job => job.language_count > 1).length;
    
    data.forEach(job => {
      if (job.languages) {
        const langs = job.languages.split(',').map(l => l.trim()).filter(l => l.length > 0);
        langs.forEach(lang => {
          // Clean up language names
          const cleanLang = lang.replace(/[^\w\s]/g, '').trim();
          if (cleanLang && cleanLang.length > 1) {
            languageMap.set(cleanLang, (languageMap.get(cleanLang) || 0) + 1);
          }
        });
      }
    });

    const topLanguages = Array.from(languageMap.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([language, count]) => ({
        language,
        count,
        percentage: (count / data.length) * 100
      }));

    return {
      topLanguages,
      multiLanguageJobs: multiLangCount,
      multiLanguagePercentage: (multiLangCount / data.length) * 100
    };
  }, [data]);

  // Remote vs On-site analysis
  const workLocationData = React.useMemo(() => {
    const homeBasedCount = data.filter(job => job.is_home_based).length;
    const locationTypes = new Map<string, number>();
    
    data.forEach(job => {
      if (job.is_home_based) {
        locationTypes.set('Home-based', (locationTypes.get('Home-based') || 0) + 1);
      } else if (job.duty_station) {
        locationTypes.set('On-site', (locationTypes.get('On-site') || 0) + 1);
      }
    });

    return {
      homeBasedCount,
      homeBasedPercentage: (homeBasedCount / data.length) * 100,
      distribution: Array.from(locationTypes.entries()).map(([type, count]) => ({
        type,
        count,
        percentage: (count / data.length) * 100
      }))
    };
  }, [data]);

  // Most competitive locations
  const competitiveLocations = React.useMemo(() => {
    const locationMap = new Map<string, number>();
    
    data.forEach(job => {
      if (job.duty_country && !job.is_home_based) {
        locationMap.set(job.duty_country, (locationMap.get(job.duty_country) || 0) + 1);
      }
    });

    return Array.from(locationMap.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([country, count]) => ({
        country,
        count,
        competitionIndex: Math.round((count / data.length) * 1000) // Jobs per 1000 total
      }));
  }, [data]);

  // Grade level trends
  const gradeTrends = React.useMemo(() => {
    const gradeMap = new Map<string, number>();
    
    data.forEach(job => {
      if (job.up_grade) {
        gradeMap.set(job.up_grade, (gradeMap.get(job.up_grade) || 0) + 1);
      }
    });

    return Array.from(gradeMap.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([grade, count]) => ({
        grade,
        count,
        percentage: (count / data.length) * 100
      }));
  }, [data]);

  // Application window trends
  const windowTrends = React.useMemo(() => {
    const windowRanges = [
      { range: '1-15 days', min: 1, max: 15 },
      { range: '16-30 days', min: 16, max: 30 },
      { range: '31-45 days', min: 31, max: 45 },
      { range: '46-60 days', min: 46, max: 60 },
      { range: '60+ days', min: 61, max: Infinity }
    ];

    return windowRanges.map(({ range, min, max }) => {
      const count = data.filter(job => 
        job.application_window_days >= min && job.application_window_days <= max
      ).length;
      
      return {
        range,
        count,
        percentage: (count / data.length) * 100
      };
    });
  }, [data]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Market Intelligence</h2>
        <div className="text-sm text-gray-600">
          Analyzing {data.length.toLocaleString()} job postings
        </div>
      </div>

      {/* Key Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="metric-card">
          <div className="metric-value text-green-600">
            {workLocationData.homeBasedPercentage.toFixed(1)}%
          </div>
          <div className="metric-label flex items-center justify-center">
            <Home className="h-4 w-4 mr-1" />
            Remote Positions
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-value text-blue-600">
            {languageData.multiLanguagePercentage.toFixed(1)}%
          </div>
          <div className="metric-label flex items-center justify-center">
            <Languages className="h-4 w-4 mr-1" />
            Multi-Language Required
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-value text-purple-600">
            {seasonalData.quarterly.length > 0 ? 
              Math.max(...seasonalData.quarterly.map(q => q.count)) : 0}
          </div>
          <div className="metric-label flex items-center justify-center">
            <Calendar className="h-4 w-4 mr-1" />
            Peak Quarter Jobs
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-value text-orange-600">
            {competitiveLocations.length > 0 ? competitiveLocations[0].count : 0}
          </div>
          <div className="metric-label flex items-center justify-center">
            <MapPin className="h-4 w-4 mr-1" />
            Top Location Jobs
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Seasonal Hiring Patterns */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-un-blue" />
            Seasonal Hiring Patterns
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={seasonalData.quarterly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="quarter" />
              <YAxis />
              <Tooltip formatter={(value: any) => [`${value} jobs`, 'Job Postings']} />
              <Bar dataKey="count" fill="#009edb" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Language Requirements */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Languages className="h-5 w-5 mr-2 text-un-blue" />
            Top Language Requirements
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={languageData.topLanguages}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="language" angle={-45} textAnchor="end" height={80} fontSize={12} />
              <YAxis />
              <Tooltip formatter={(value: any) => [`${value} jobs`, 'Requirements']} />
              <Bar dataKey="count" fill="#4db8e8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Work Location Distribution */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Home className="h-5 w-5 mr-2 text-un-blue" />
            Work Location Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={workLocationData.distribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ type, percentage }) => `${type} (${percentage.toFixed(1)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {workLocationData.distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => [`${value} jobs`, 'Job Postings']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Most Competitive Locations */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MapPin className="h-5 w-5 mr-2 text-un-blue" />
            Most Competitive Locations
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={competitiveLocations} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="country" type="category" width={80} fontSize={12} />
              <Tooltip formatter={(value: any) => [`${value} jobs`, 'Job Postings']} />
              <Bar dataKey="count" fill="#0077be" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Application Window Trends */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-un-blue" />
            Application Window Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={windowTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" angle={-45} textAnchor="end" height={80} fontSize={12} />
              <YAxis />
              <Tooltip formatter={(value: any) => [`${value} jobs`, 'Job Postings']} />
              <Bar dataKey="count" fill="#66c2e8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Grade Level Trends */}
        <div className="chart-container">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Briefcase className="h-5 w-5 mr-2 text-un-blue" />
            Grade Level Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={gradeTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="grade" />
              <YAxis />
              <Tooltip formatter={(value: any) => [`${value} jobs`, 'Job Postings']} />
              <Area type="monotone" dataKey="count" stroke="#009edb" fill="#009edb" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights Summary */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-un-blue" />
          Market Intelligence Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Remote Work Trends</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• {workLocationData.homeBasedPercentage.toFixed(1)}% of positions are home-based</p>
              <p>• Remote work opportunities span across {new Set(data.filter(j => j.is_home_based).map(j => j.long_agency)).size} different agencies</p>
              <p>• Home-based positions show {workLocationData.homeBasedCount > 100 ? 'strong' : 'moderate'} adoption in UN system</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Language Requirements</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• {languageData.multiLanguagePercentage.toFixed(1)}% of roles require multiple languages</p>
              <p>• Top language: {languageData.topLanguages[0]?.language} ({languageData.topLanguages[0]?.count} jobs)</p>
              <p>• Language diversity indicates global operational scope</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Seasonal Patterns</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Peak hiring quarter: {seasonalData.quarterly.length > 0 ? seasonalData.quarterly.reduce((max, q) => q.count > max.count ? q : max).quarter : 'N/A'}</p>
              <p>• Hiring shows {seasonalData.quarterly.length > 2 ? 'seasonal' : 'consistent'} variation patterns</p>
              <p>• Strategic timing can improve application success rates</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Competition Analysis</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Highest competition: {competitiveLocations[0]?.country} ({competitiveLocations[0]?.count} jobs)</p>
              <p>• Geographic diversity spans {competitiveLocations.length} major locations</p>
              <p>• Consider alternative locations for better success rates</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketIntelligence; 