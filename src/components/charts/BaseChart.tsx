import React from 'react';
import { ResponsiveContainer } from 'recharts';

interface BaseChartProps {
  children: React.ReactElement;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  height?: number | string;
  width?: string;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  showHeader?: boolean;
}

/**
 * BaseChart - A wrapper component that provides consistent styling and layout for all charts
 * Features:
 * - Consistent card styling with optional header
 * - Responsive container
 * - Customizable dimensions
 * - Optional title, description, and icon
 */
const BaseChart: React.FC<BaseChartProps> = ({
  children,
  title,
  description,
  icon,
  height = 400,
  width = "100%",
  className = "",
  headerClassName = "",
  contentClassName = "",
  showHeader = true
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {showHeader && (title || description || icon) && (
        <div className={`p-6 border-b border-gray-200 ${headerClassName}`}>
          {(title || icon) && (
            <div className="flex items-center gap-3">
              {icon}
              {title && (
                <h3 className="text-lg font-semibold text-gray-900">
                  {title}
                </h3>
              )}
            </div>
          )}
          {description && (
            <p className="text-sm text-gray-600 mt-1">
              {description}
            </p>
          )}
        </div>
      )}
      
      <div className={`p-6 ${contentClassName}`}>
        <ResponsiveContainer width={width} height={height}>
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BaseChart;
