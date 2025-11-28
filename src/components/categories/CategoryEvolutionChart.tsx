/**
 * Category Evolution Chart
 * 
 * Shows how categories evolve over time with visual charts.
 * Helps HR leadership understand hiring pattern changes.
 */

import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { parseISO, format, startOfMonth, subMonths } from 'date-fns';
import { ProcessedJobData } from '../../types';
import { JOB_CLASSIFICATION_DICTIONARY } from '../../dictionary';
import { TrendingUp, BarChart3 } from 'lucide-react';

interface CategoryEvolutionChartProps {
  data: ProcessedJobData[];
  selectedCategories?: string[]; // If empty, show top 5
  months?: number; // Number of months to show (default: 6)
  chartType?: 'line' | 'area';
  agency?: string | null;
}

const CategoryEvolutionChart: React.FC<CategoryEvolutionChartProps> = ({
  data,
  selectedCategories,
  months = 6,
  chartType = 'line',
  agency
}) => {
  const chartData = useMemo(() => {
    const now = new Date();
    const periods: { start: Date; end: Date; label: string }[] = [];
    
    // Generate month periods
    for (let i = months - 1; i >= 0; i--) {
      const periodStart = startOfMonth(subMonths(now, i));
      const periodEnd = i === 0 ? now : startOfMonth(subMonths(now, i - 1));
      periods.push({
        start: periodStart,
        end: periodEnd,
        label: format(periodStart, 'MMM yyyy')
      });
    }
    
    // Filter by agency if specified
    const relevantData = agency
      ? data.filter(job => (job.short_agency || job.long_agency) === agency)
      : data;
    
    // Determine which categories to show
    let categoriesToShow = selectedCategories;
    if (!categoriesToShow || categoriesToShow.length === 0) {
      // Get top 5 categories by total count
      const categoryCounts = new Map<string, number>();
      relevantData.forEach(job => {
        const cat = job.primary_category;
        categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
      });
      categoriesToShow = Array.from(categoryCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([cat]) => cat);
    }
    
    // Build chart data
    return {
      data: periods.map(period => {
        const periodJobs = relevantData.filter(job => {
          try {
            const postDate = parseISO(job.posting_date);
            return postDate >= period.start && postDate < period.end;
          } catch {
            return false;
          }
        });
        
        const dataPoint: Record<string, any> = { month: period.label };
        
        categoriesToShow!.forEach(category => {
          const count = periodJobs.filter(j => j.primary_category === category).length;
          dataPoint[category] = count;
        });
        
        return dataPoint;
      }),
      categories: categoriesToShow
    };
  }, [data, selectedCategories, months, agency]);
  
  // Get colors from dictionary
  const getColor = (category: string) => {
    return JOB_CLASSIFICATION_DICTIONARY.find(c => c.name === category)?.color || '#6B7280';
  };
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white shadow-lg rounded-lg p-3 border border-gray-200">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600 truncate max-w-[150px]">
                {entry.name.length > 20 ? entry.name.slice(0, 20) + '...' : entry.name}:
              </span>
              <span className="font-medium text-gray-900">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (chartData.data.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center h-48 text-gray-400">
          <div className="text-center">
            <BarChart3 className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Insufficient data for evolution chart</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-indigo-500" />
          <h3 className="text-sm font-semibold text-gray-900">Category Evolution</h3>
          <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
            Past {months} months
          </span>
        </div>
      </div>
      
      <div className="p-4">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={chartData.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ fontSize: 11 }}
                  formatter={(value: string) => value.length > 20 ? value.slice(0, 20) + '...' : value}
                />
                {chartData.categories.map((category, index) => (
                  <Area
                    key={category}
                    type="monotone"
                    dataKey={category}
                    stackId="1"
                    stroke={getColor(category)}
                    fill={getColor(category)}
                    fillOpacity={0.6}
                    name={category}
                  />
                ))}
              </AreaChart>
            ) : (
              <LineChart data={chartData.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ fontSize: 11 }}
                  formatter={(value: string) => value.length > 20 ? value.slice(0, 20) + '...' : value}
                />
                {chartData.categories.map((category) => (
                  <Line
                    key={category}
                    type="monotone"
                    dataKey={category}
                    stroke={getColor(category)}
                    strokeWidth={2}
                    dot={{ fill: getColor(category), strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, strokeWidth: 2 }}
                    name={category}
                  />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
        
        {/* Legend with category counts */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex flex-wrap gap-3">
            {chartData.categories.map(category => {
              const totalCount = chartData.data.reduce((sum, d) => sum + (d[category] || 0), 0);
              return (
                <div key={category} className="flex items-center gap-1.5 text-xs">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: getColor(category) }}
                  />
                  <span className="text-gray-600 truncate max-w-[100px]">
                    {category.length > 15 ? category.slice(0, 15) + '...' : category}
                  </span>
                  <span className="text-gray-400">({totalCount})</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryEvolutionChart;

