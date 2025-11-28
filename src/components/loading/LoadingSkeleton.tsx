import React from 'react';

interface LoadingSkeletonProps {
  variant?: 'text' | 'rectangle' | 'circle' | 'card' | 'chart' | 'table' | 'dashboard';
  width?: string | number;
  height?: string | number;
  className?: string;
  rows?: number; // For text variant
  animate?: boolean;
}

const baseClasses = 'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]';
const animateClasses = 'animate-[shimmer_2s_infinite]';

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'rectangle',
  width = '100%',
  height = '1rem',
  className = '',
  rows = 3,
  animate = true
}) => {
  const skeletonClasses = `
    ${baseClasses}
    ${animate ? animateClasses : ''}
    ${className}
  `.trim();

  const renderSkeleton = () => {
    switch (variant) {
      case 'text':
        return (
          <div className="space-y-2">
            {Array.from({ length: rows }, (_, i) => (
              <div
                key={i}
                className={`${skeletonClasses} rounded`}
                style={{
                  width: i === rows - 1 ? '75%' : '100%',
                  height: '1rem'
                }}
              />
            ))}
          </div>
        );

      case 'circle':
        return (
          <div
            className={`${skeletonClasses} rounded-full`}
            style={{ width, height: width }}
          />
        );

      case 'card':
        return (
          <div className="border border-gray-200 rounded-lg p-4 space-y-4">
            <div className={`${skeletonClasses} rounded h-4 w-3/4`} />
            <div className="space-y-2">
              <div className={`${skeletonClasses} rounded h-3 w-full`} />
              <div className={`${skeletonClasses} rounded h-3 w-5/6`} />
            </div>
            <div className={`${skeletonClasses} rounded h-8 w-24`} />
          </div>
        );

      case 'chart':
        return (
          <div className="space-y-4">
            <div className={`${skeletonClasses} rounded h-6 w-48`} />
            <div className="flex items-end space-x-2 h-32">
              {Array.from({ length: 8 }, (_, i) => (
                <div
                  key={i}
                  className={`${skeletonClasses} rounded-t w-8`}
                  style={{
                    height: `${20 + Math.random() * 80}%`
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className={`${skeletonClasses} rounded h-3 w-12`} />
              ))}
            </div>
          </div>
        );

      case 'table':
        return (
          <div className="space-y-4">
            {/* Table header */}
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className={`${skeletonClasses} rounded h-4`} />
              ))}
            </div>
            {/* Table rows */}
            {Array.from({ length: 5 }, (_, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-4 gap-4">
                {Array.from({ length: 4 }, (_, colIndex) => (
                  <div key={colIndex} className={`${skeletonClasses} rounded h-3`} />
                ))}
              </div>
            ))}
          </div>
        );

      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div className={`${skeletonClasses} rounded h-8 w-64`} />
              <div className={`${skeletonClasses} rounded h-10 w-32`} />
            </div>
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4">
                  <div className={`${skeletonClasses} rounded h-4 w-24 mb-2`} />
                  <div className={`${skeletonClasses} rounded h-8 w-16 mb-1`} />
                  <div className={`${skeletonClasses} rounded h-3 w-20`} />
                </div>
              ))}
            </div>
            
            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-6">
                  <div className={`${skeletonClasses} rounded h-5 w-40 mb-4`} />
                  <div className="flex items-end space-x-2 h-40">
                    {Array.from({ length: 6 }, (_, j) => (
                      <div
                        key={j}
                        className={`${skeletonClasses} rounded-t flex-1`}
                        style={{
                          height: `${30 + Math.random() * 70}%`
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div
            className={`${skeletonClasses} rounded`}
            style={{ width, height }}
          />
        );
    }
  };

  return renderSkeleton();
};

// Specialized skeleton components for common use cases
export const TextSkeleton: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 3, 
  className = '' 
}) => (
  <LoadingSkeleton variant="text" rows={lines} className={className} />
);

export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <LoadingSkeleton variant="card" className={className} />
);

export const ChartSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <LoadingSkeleton variant="chart" className={className} />
);

export const TableSkeleton: React.FC<{ rows?: number; columns?: number; className?: string }> = ({ 
  rows = 5, 
  className = '' 
}) => (
  <LoadingSkeleton variant="table" className={className} />
);

export const DashboardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <LoadingSkeleton variant="dashboard" className={className} />
);

export default LoadingSkeleton;

