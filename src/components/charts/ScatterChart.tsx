import React from 'react';
import { ScatterChart as RechartsScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import BaseChart from './BaseChart';

interface ScatterChartData {
  [key: string]: any;
}

interface ScatterChartProps {
  data: ScatterChartData[];
  xDataKey: string;
  yDataKey: string;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  height?: number | string;
  color?: string;
  colors?: string[];
  showGrid?: boolean;
  showTooltip?: boolean;
  tooltipFormatter?: (value: any, name: string, props: any) => [React.ReactNode, string];
  tooltipLabelFormatter?: (value: any) => React.ReactNode;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  className?: string;
  yAxisWidth?: number;
  xAxisLabel?: string;
  yAxisLabel?: string;
  dotSize?: number;
  shape?: 'circle' | 'cross' | 'diamond' | 'square' | 'star' | 'triangle' | 'wye';
}

/**
 * Reusable ScatterChart component
 * Features:
 * - Customizable dot colors and sizes
 * - Custom shapes
 * - Axis labels
 * - Custom tooltips
 * - Responsive design
 * - Consistent styling
 */
const ScatterChart: React.FC<ScatterChartProps> = ({
  data,
  xDataKey,
  yDataKey,
  title,
  description,
  icon,
  height = 400,
  color = "#3B82F6",
  colors,
  showGrid = true,
  showTooltip = true,
  tooltipFormatter,
  tooltipLabelFormatter,
  margin = { top: 20, right: 20, bottom: 20, left: 20 },
  className,
  yAxisWidth = 60,
  xAxisLabel,
  yAxisLabel,
  dotSize = 4,
  shape = 'circle'
}) => {
  return (
    <BaseChart
      title={title}
      description={description}
      icon={icon}
      height={height}
      className={className}
    >
      <RechartsScatterChart data={data} margin={margin}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />}
        <XAxis 
          type="number"
          dataKey={xDataKey}
          name={xAxisLabel}
          stroke="#6B7280"
          fontSize={12}
          label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -10 } : undefined}
        />
        <YAxis 
          type="number"
          dataKey={yDataKey}
          name={yAxisLabel}
          width={yAxisWidth}
          stroke="#6B7280"
          fontSize={12}
          label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
        />
        
        {showTooltip && (
          <Tooltip 
            formatter={tooltipFormatter}
            labelFormatter={tooltipLabelFormatter}
            contentStyle={{
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              fontSize: '12px'
            }}
            cursor={{ strokeDasharray: '3 3' }}
          />
        )}
        
        <Scatter
          name="Data"
          data={data}
          fill={color}
          shape={shape}
        >
          {colors && data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Scatter>
      </RechartsScatterChart>
    </BaseChart>
  );
};

export default ScatterChart;

