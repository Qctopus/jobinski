import React from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import BaseChart from './BaseChart';

interface BarChartData {
  [key: string]: any;
}

interface BarChartProps {
  data: BarChartData[];
  dataKey: string;
  xAxisKey: string;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  height?: number | string;
  color?: string;
  colors?: string[];
  showGrid?: boolean;
  showTooltip?: boolean;
  angle?: number;
  textAnchor?: "start" | "middle" | "end";
  fontSize?: number;
  interval?: number | "preserveStartEnd";
  tooltipFormatter?: (value: any, name: string, props: any) => [React.ReactNode, string];
  tooltipLabelFormatter?: (value: any) => React.ReactNode;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  className?: string;
  yAxisWidth?: number;
  stackId?: string;
  additionalBars?: Array<{
    dataKey: string;
    name?: string;
    fill?: string;
    stackId?: string;
  }>;
}

/**
 * Reusable BarChart component
 * Features:
 * - Single or multiple bars
 * - Custom colors (single color or array of colors)
 * - Configurable axes
 * - Custom tooltips
 * - Responsive design
 * - Consistent styling
 */
const BarChart: React.FC<BarChartProps> = ({
  data,
  dataKey,
  xAxisKey,
  title,
  description,
  icon,
  height = 400,
  color = "#3B82F6",
  colors,
  showGrid = true,
  showTooltip = true,
  angle = 0,
  textAnchor = "middle",
  fontSize = 12,
  interval = 0,
  tooltipFormatter,
  tooltipLabelFormatter,
  margin = { bottom: 20, left: 20, right: 20, top: 20 },
  className,
  yAxisWidth = 60,
  stackId,
  additionalBars = []
}) => {
  return (
    <BaseChart
      title={title}
      description={description}
      icon={icon}
      height={height}
      className={className}
    >
      <RechartsBarChart data={data} margin={margin}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />}
        <XAxis 
          dataKey={xAxisKey}
          angle={angle}
          textAnchor={textAnchor}
          fontSize={fontSize}
          interval={interval}
          height={angle !== 0 ? 100 : undefined}
          stroke="#6B7280"
        />
        <YAxis 
          width={yAxisWidth}
          fontSize={fontSize}
          stroke="#6B7280"
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
          />
        )}
        
        <Bar 
          dataKey={dataKey} 
          fill={color}
          stackId={stackId}
          radius={[2, 2, 0, 0]}
        >
          {colors && data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Bar>
        
        {additionalBars.map((bar, index) => (
          <Bar
            key={`bar-${index}`}
            dataKey={bar.dataKey}
            name={bar.name}
            fill={bar.fill || color}
            stackId={bar.stackId || stackId}
            radius={[2, 2, 0, 0]}
          />
        ))}
      </RechartsBarChart>
    </BaseChart>
  );
};

export default BarChart;

