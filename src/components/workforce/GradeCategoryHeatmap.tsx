/**
 * Grade × Category Heatmap
 * 
 * Shows which grades are being hired for which functional categories.
 * Intensity indicates concentration of hiring.
 */

import React, { useState, useMemo } from 'react';
import { GradeCategoryMatrix, GradeCategoryCell } from '../../services/analytics/WorkforceStructureAnalyzer';
import { getCategoryById } from '../../utils/categoryUtils';

interface GradeCategoryHeatmapProps {
  data: GradeCategoryMatrix;
}

const GradeCategoryHeatmap: React.FC<GradeCategoryHeatmapProps> = ({ data }) => {
  const [hoveredCell, setHoveredCell] = useState<GradeCategoryCell | null>(null);

  // Map categories to their pretty names
  const categoryInfo = useMemo(() => {
    return data.categories.map(cat => {
      const info = getCategoryById(cat);
      return {
        key: cat,
        name: info.name,
        shortName: info.shortName,
        color: info.color
      };
    });
  }, [data.categories]);

  // Color intensity mapping - using a distinct warm gradient for visibility
  const getIntensityStyle = (intensity: GradeCategoryCell['intensity'], count: number) => {
    if (count === 0 || intensity === 'none') {
      return { bg: 'bg-slate-100', text: 'text-slate-400', border: 'border-slate-200' };
    }
    switch (intensity) {
      case 'high':
        // Deep orange/red for high intensity
        return { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-600' };
      case 'medium':
        // Warm amber for medium
        return { bg: 'bg-amber-300', text: 'text-amber-900', border: 'border-amber-400' };
      case 'low':
        // Light teal for low
        return { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200' };
      default:
        return { bg: 'bg-slate-100', text: 'text-slate-400', border: 'border-slate-200' };
    }
  };

  // Get cell for specific grade and category
  const getCell = (grade: string, category: string): GradeCategoryCell | undefined => {
    return data.cells.find(c => c.grade === grade && c.category === category);
  };

  const getPrettyName = (category: string) => {
    const found = categoryInfo.find(c => c.key === category);
    return found?.name || getCategoryById(category).name;
  };

  if (data.categories.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No category data available for the current selection.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Legend */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs">
          <span className="text-gray-500">Hiring intensity:</span>
          <div className="flex items-center gap-0.5">
            <div className="w-4 h-4 rounded bg-slate-100 border border-slate-200"></div>
            <span className="text-gray-400 ml-1">None</span>
          </div>
          <div className="flex items-center gap-0.5">
            <div className="w-4 h-4 rounded bg-teal-100 border border-teal-200"></div>
            <span className="text-gray-500 ml-1">Low</span>
          </div>
          <div className="flex items-center gap-0.5">
            <div className="w-4 h-4 rounded bg-amber-300 border border-amber-400"></div>
            <span className="text-gray-500 ml-1">Medium</span>
          </div>
          <div className="flex items-center gap-0.5">
            <div className="w-4 h-4 rounded bg-orange-500 border border-orange-600"></div>
            <span className="text-gray-500 ml-1">High</span>
          </div>
        </div>
        <span className="text-xs text-gray-400">{data.totalJobs.toLocaleString()} positions</span>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-max">
          {/* Header Row */}
          <div className="flex">
            <div className="w-32 flex-shrink-0 p-2 text-xs font-medium text-gray-600 bg-gray-50 border-b border-r border-gray-200">
              Grade
            </div>
            {categoryInfo.map(cat => (
              <div 
                key={cat.key}
                className="w-20 flex-shrink-0 p-2 text-center border-b border-gray-200 bg-gray-50"
                title={cat.name}
              >
                <div className="text-[10px] font-medium text-gray-600 truncate">
                  {cat.shortName}
                </div>
              </div>
            ))}
          </div>

          {/* Data Rows */}
          {data.grades.map((grade, gradeIdx) => (
            <div key={grade} className={`flex ${gradeIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
              <div className="w-32 flex-shrink-0 p-2 text-xs font-medium text-gray-700 border-r border-gray-100">
                {grade}
              </div>
              {categoryInfo.map(cat => {
                const cell = getCell(grade, cat.key);
                const style = getIntensityStyle(cell?.intensity || 'none', cell?.count || 0);
                
                return (
                  <div 
                    key={cat.key}
                    className="w-20 flex-shrink-0 p-1"
                    onMouseEnter={() => cell && setHoveredCell(cell)}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    <div 
                      className={`rounded h-8 flex items-center justify-center text-xs font-medium cursor-pointer transition-all hover:ring-2 hover:ring-indigo-300 ${style.bg} ${style.text}`}
                    >
                      {cell && cell.count > 0 ? cell.count : '-'}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Hover Tooltip */}
      {hoveredCell && hoveredCell.count > 0 && (
        <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 max-w-xs">
          <div className="text-sm font-semibold text-gray-900">{hoveredCell.grade}</div>
          <div className="text-xs text-gray-600">{getPrettyName(hoveredCell.category)}</div>
          <div className="mt-1.5 flex items-center gap-3 text-xs">
            <span><span className="text-gray-500">Count:</span> <span className="font-medium">{hoveredCell.count}</span></span>
            <span><span className="text-gray-500">Share:</span> <span className="font-medium">{hoveredCell.percentage.toFixed(1)}%</span></span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradeCategoryHeatmap;
