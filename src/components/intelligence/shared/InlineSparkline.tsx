/**
 * InlineSparkline Component
 * 
 * Compact inline visualization for trends.
 */

import React from 'react';

export interface SparklineDataPoint {
  value: number;
  label?: string;
}

export interface InlineSparklineProps {
  data: SparklineDataPoint[] | number[];
  width?: number;
  height?: number;
  color?: string | 'auto';
  showDots?: boolean;
  showEndDot?: boolean;
  strokeWidth?: number;
  className?: string;
}

const InlineSparkline: React.FC<InlineSparklineProps> = ({
  data,
  width = 80,
  height = 24,
  color = 'auto',
  showDots = false,
  showEndDot = true,
  strokeWidth = 2,
  className = ''
}) => {
  if (data.length === 0) return null;

  // Normalize data to array of numbers
  const values = data.map(d => typeof d === 'number' ? d : d.value);
  
  if (values.length === 0 || values.every(v => v === 0)) {
    return (
      <svg width={width} height={height} className={className}>
        <line 
          x1={4} 
          y1={height / 2} 
          x2={width - 4} 
          y2={height / 2} 
          stroke="#D1D5DB" 
          strokeWidth={1}
          strokeDasharray="2 2"
        />
      </svg>
    );
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  
  // Determine color based on trend
  const trend = values[values.length - 1] >= values[0];
  const strokeColor = color === 'auto' 
    ? (trend ? '#10B981' : '#F59E0B') 
    : color;

  // Calculate points with padding
  const padding = 4;
  const points = values.map((v, i) => {
    const x = padding + (i / Math.max(values.length - 1, 1)) * (width - padding * 2);
    const y = padding + (1 - (v - min) / range) * (height - padding * 2);
    return { x, y };
  });

  // Build path
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  // Create gradient for area fill
  const gradientId = `sparkline-gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <svg width={width} height={height} className={`flex-shrink-0 ${className}`}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity={0.2} />
          <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
        </linearGradient>
      </defs>
      
      {/* Area fill */}
      <path
        d={`${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`}
        fill={`url(#${gradientId})`}
      />
      
      {/* Line */}
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Dots */}
      {showDots && points.map((p, i) => (
        <circle 
          key={i} 
          cx={p.x} 
          cy={p.y} 
          r={2} 
          fill={strokeColor}
        />
      ))}
      
      {/* End dot only */}
      {showEndDot && !showDots && points.length > 0 && (
        <circle 
          cx={points[points.length - 1].x} 
          cy={points[points.length - 1].y} 
          r={3} 
          fill={strokeColor}
        />
      )}
    </svg>
  );
};

export default InlineSparkline;





