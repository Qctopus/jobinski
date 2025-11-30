/**
 * Grade × Category Heatmap
 * 
 * Shows which grades are being hired for which functional categories.
 * Intensity indicates concentration of hiring.
 */

import React, { useState, useMemo } from 'react';
import { GradeCategoryMatrix, GradeCategoryCell } from '../../services/analytics/WorkforceStructureAnalyzer';
import { JOB_CLASSIFICATION_DICTIONARY } from '../../dictionary';

// Helper function to get pretty category names
const getCategoryInfo = (categoryKey: string) => {
  const entry = JOB_CLASSIFICATION_DICTIONARY[categoryKey];
  return {
    name: entry?.name || categoryKey,
    color: entry?.color || '#6B7280'
  };
};

interface GradeCategoryHeatmapProps {
  data: GradeCategoryMatrix;
}

const GradeCategoryHeatmap: React.FC<GradeCategoryHeatmapProps> = ({ data }) => {
  const [hoveredCell, setHoveredCell] = useState<GradeCategoryCell | null>(null);

  // Map categories to their pretty names
  const categoryNameMap = useMemo(() => {
    const map = new Map<string, string>();
    data.categories.forEach(cat => {
      map.set(cat, getCategoryInfo(cat).name);
    });
    return map;
  }, [data.categories]);

  // Color intensity mapping
  const getIntensityColor = (intensity: GradeCategoryCell['intensity']) => {
    switch (intensity) {
      case 'high':
        return 'bg-indigo-600 text-white';
      case 'medium':
        return 'bg-indigo-400 text-white';
      case 'low':
        return 'bg-indigo-200 text-indigo-800';
      case 'none':
        return 'bg-gray-50 text-gray-400';
      default:
        return 'bg-gray-50 text-gray-400';
    }
  };

  // Get cell for specific grade and category
  const getCell = (grade: string, category: string): GradeCategoryCell | undefined => {
    return data.cells.find(c => c.grade === grade && c.category === category);
  };

  // Truncate long category names (uses pretty name)
  const truncateCategory = (category: string, maxLength: number = 20) => {
    const prettyName = categoryNameMap.get(category) || category;
    if (prettyName.length <= maxLength) return prettyName;
    return prettyName.substring(0, maxLength) + '...';
  };
  
  // Get pretty category name
  const getPrettyName = (category: string) => categoryNameMap.get(category) || category;

  if (data.categories.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No category data available for the current selection.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <span className="text-gray-600">Intensity:</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-gray-50 border border-gray-200"></div>
              <span className="text-gray-500">None</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-indigo-200"></div>
              <span className="text-gray-500">Low</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-indigo-400"></div>
              <span className="text-gray-500">Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-indigo-600"></div>
              <span className="text-gray-500">High</span>
            </div>
          </div>
        </div>
        <div className="text-gray-500">
          {data.totalJobs.toLocaleString()} positions analyzed
        </div>
      </div>

      {/* Heatmap Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left text-sm font-medium text-gray-600 bg-gray-50 border-b border-gray-200 sticky left-0">
                Grade / Category
              </th>
              {data.categories.map(category => (
                <th 
                  key={category} 
                  className="p-2 text-xs font-medium text-gray-600 bg-gray-50 border-b border-gray-200 min-w-[100px]"
                  title={getPrettyName(category)}
                >
                  <div className="transform -rotate-45 origin-left whitespace-nowrap h-16 flex items-end">
                    {truncateCategory(category, 15)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.grades.map((grade, gradeIdx) => (
              <tr key={grade} className={gradeIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                <td className="p-2 text-sm font-medium text-gray-700 border-b border-gray-100 sticky left-0 bg-inherit">
                  {grade}
                </td>
                {data.categories.map(category => {
                  const cell = getCell(grade, category);
                  if (!cell) return <td key={category} className="p-1 border-b border-gray-100"></td>;
                  
                  return (
                    <td 
                      key={category} 
                      className="p-1 border-b border-gray-100"
                      onMouseEnter={() => setHoveredCell(cell)}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      <div 
                        className={`rounded p-2 text-center text-xs font-medium cursor-pointer transition-all hover:ring-2 hover:ring-indigo-300 ${getIntensityColor(cell.intensity)}`}
                      >
                        {cell.count > 0 ? cell.count : '-'}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hover Details */}
      {hoveredCell && hoveredCell.count > 0 && (
        <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm z-50">
          <div className="font-semibold text-gray-900">{hoveredCell.grade}</div>
          <div className="text-sm text-gray-600">{getPrettyName(hoveredCell.category)}</div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">Positions:</span>
              <span className="ml-1 font-medium">{hoveredCell.count.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-500">Share:</span>
              <span className="ml-1 font-medium">{hoveredCell.percentage.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Category Totals */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Category Totals</h4>
        <div className="flex flex-wrap gap-2">
          {data.categories.map(category => {
            const total = data.cells
              .filter(c => c.category === category)
              .reduce((sum, c) => sum + c.count, 0);
            return (
              <div 
                key={category}
                className="bg-gray-100 rounded-lg px-3 py-1.5 text-sm"
                title={getPrettyName(category)}
              >
                <span className="text-gray-600">{truncateCategory(category, 20)}:</span>
                <span className="ml-1 font-medium text-gray-900">{total.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GradeCategoryHeatmap;

