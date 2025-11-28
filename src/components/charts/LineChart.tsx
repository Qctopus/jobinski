import React from 'react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import BaseChart from './BaseChart';

interface LineChartData {
  [key: string]: any;
}

interface LineChartProps {
  data: LineChartData[];
  dataKey: string;
  xAxisKey: string;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  height?: number | string;
  color?: string;
  showGrid?: boolean;
  showTooltip?: boolean;
  strokeWidth?: number;
  showDots?: boolean;
  dotSize?: number;
  curved?: boolean;
  tooltipFormatter?: (value: any, name: string, props: any) => [React.ReactNode, string];
  tooltipLabelFormatter?: (value: any) => React.ReactNode;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  className?: string;
  yAxisWidth?: number;
  additionalLines?: Array<{
    dataKey: string;
    name?: string;
    stroke?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
  }>;
}

/**
 * Reusable LineChart component
 * Features:
 * - Single or multiple lines
 * - Customizable styling
 * - Curved or straight lines
 * - Custom tooltips
 * - Responsive design
 * - Consistent styling
 */
const LineChart: React.FC<LineChartProps> = ({
  data,
  dataKey,
  xAxisKey,
  title,
  description,
  icon,
  height = 400,
  color = "#3B82F6",
  showGrid = true,
  showTooltip = true,
  strokeWidth = 2,
  showDots = true,
  dotSize = 4,
  curved = true,
  tooltipFormatter,
  tooltipLabelFormatter,
  margin = { top: 20, right: 20, bottom: 20, left: 20 },
  className,
  yAxisWidth = 60,
  additionalLines = []
}) => {
  return (
    <BaseChart
      title={title}
      description={description}
      icon={icon}
      height={height}
      className={className}
    >
      <RechartsLineChart data={data} margin={margin}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />}
        <XAxis 
          dataKey={xAxisKey}
          stroke="#6B7280"
          fontSize={12}
        />
        <YAxis 
          width={yAxisWidth}
          stroke="#6B7280"
          fontSize={12}
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
        
        <Line
          type={curved ? "monotone" : "linear"}
          dataKey={dataKey}
          stroke={color}
          strokeWidth={strokeWidth}
          dot={showDots ? { r: dotSize, fill: color } : false}
          activeDot={{ r: dotSize + 2, fill: color }}
        />
        
        {additionalLines.map((line, index) => (
          <Line
            key={`line-${index}`}
            type={curved ? "monotone" : "linear"}
            dataKey={line.dataKey}
            name={line.name}
            stroke={line.stroke || color}
            strokeWidth={line.strokeWidth || strokeWidth}
            strokeDasharray={line.strokeDasharray}
            dot={showDots ? { r: dotSize, fill: line.stroke || color } : false}
            activeDot={{ r: dotSize + 2, fill: line.stroke || color }}
          />
        ))}
      </RechartsLineChart>
    </BaseChart>
  );
};

export default LineChart;

