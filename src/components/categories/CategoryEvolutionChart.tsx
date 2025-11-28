/**
 * Category Evolution Chart
 * 
 * Shows how categories evolve over time with visual charts.
 * Helps HR leadership understand hiring pattern changes.
 * Uses proper category colors from dictionary.
 */

import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { parseISO, format, startOfMonth, subMonths } from 'date-fns';
import { ProcessedJobData } from '../../types';
import { JOB_CLASSIFICATION_DICTIONARY } from '../../dictionary';
import { TrendingUp, BarChart3 } from 'lucide-react';

// Helper to get category info from dictionary
const getCategoryInfo = (categoryIdOrName: string) => {
  const cat = JOB_CLASSIFICATION_DICTIONARY.find(
    c => c.id === categoryIdOrName || c.name === categoryIdOrName
  );
  if (cat) return { name: cat.name, color: cat.color, id: cat.id };
  
  const fallbackName = categoryIdOrName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(' And ', ' & ');
  return { name: fallbackName, color: '#6B7280', id: categoryIdOrName };
};

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
        label: format(periodStart, 'MMM')
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
    
    // Get category metadata
    const categoryMeta = categoriesToShow.map(cat => getCategoryInfo(cat));
    
    // Build chart data - use beautiful names as keys
    const chartPoints = periods.map(period => {
      const periodJobs = relevantData.filter(job => {
        try {
          const postDate = parseISO(job.posting_date);
          return postDate >= period.start && postDate < period.end;
        } catch {
          return false;
        }
      });
      
      const dataPoint: Record<string, any> = { month: period.label };
      
      categoryMeta.forEach(catInfo => {
        const count = periodJobs.filter(j => {
          const jobCat = getCategoryInfo(j.primary_category);
          return jobCat.id === catInfo.id;
        }).length;
        dataPoint[catInfo.name] = count;
      });
      
      return dataPoint;
    });
    
    return {
      data: chartPoints,
      categories: categoryMeta
    };
  }, [data, selectedCategories, months, agency]);
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white shadow-xl rounded-xl p-4 border border-gray-100">
          <p className="font-semibold text-gray-900 mb-2 text-sm">{label}</p>
          <div className="space-y-1.5">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-600 truncate max-w-[160px]">
                  {entry.name}
                </span>
                <span className="font-semibold text-gray-900 ml-auto">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  if (chartData.data.length === 0 || chartData.categories.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-indigo-500" />
          <h3 className="text-base font-semibold text-gray-900">Category Evolution</h3>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {months} months
          </span>
        </div>
        {agency && (
          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
            {agency}
          </span>
        )}
      </div>
      
      <div className="p-5">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={chartData.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <Tooltip content={<CustomTooltip />} />
                {chartData.categories.map((catInfo) => (
                  <Area
                    key={catInfo.id}
                    type="monotone"
                    dataKey={catInfo.name}
                    stackId="1"
                    stroke={catInfo.color}
                    fill={catInfo.color}
                    fillOpacity={0.7}
                    name={catInfo.name}
                  />
                ))}
              </AreaChart>
            ) : (
              <LineChart data={chartData.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <Tooltip content={<CustomTooltip />} />
                {chartData.categories.map((catInfo) => (
                  <Line
                    key={catInfo.id}
                    type="monotone"
                    dataKey={catInfo.name}
                    stroke={catInfo.color}
                    strokeWidth={3}
                    dot={{ fill: catInfo.color, strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                    name={catInfo.name}
                  />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
        
        {/* Legend with category colors and counts */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex flex-wrap gap-4">
            {chartData.categories.map(catInfo => {
              const totalCount = chartData.data.reduce((sum, d) => sum + (d[catInfo.name] || 0), 0);
              return (
                <div key={catInfo.id} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: catInfo.color }}
                  />
                  <span className="text-sm text-gray-700">
                    {catInfo.name}
                  </span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                    {totalCount}
                  </span>
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
