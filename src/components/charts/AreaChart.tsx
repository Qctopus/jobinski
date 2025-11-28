import React from 'react';
import { AreaChart as RechartsAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import BaseChart from './BaseChart';

interface AreaChartData {
  [key: string]: any;
}

interface AreaChartProps {
  data: AreaChartData[];
  dataKey: string;
  xAxisKey: string;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  height?: number | string;
  color?: string;
  fillOpacity?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  strokeWidth?: number;
  curved?: boolean;
  stacked?: boolean;
  tooltipFormatter?: (value: any, name: string, props: any) => [React.ReactNode, string];
  tooltipLabelFormatter?: (value: any) => React.ReactNode;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  className?: string;
  yAxisWidth?: number;
  additionalAreas?: Array<{
    dataKey: string;
    name?: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    fillOpacity?: number;
    stackId?: string;
  }>;
}

/**
 * Reusable AreaChart component
 * Features:
 * - Single or multiple areas
 * - Stacked areas support
 * - Customizable fill and opacity
 * - Curved or straight lines
 * - Custom tooltips
 * - Responsive design
 * - Consistent styling
 */
const AreaChart: React.FC<AreaChartProps> = ({
  data,
  dataKey,
  xAxisKey,
  title,
  description,
  icon,
  height = 400,
  color = "#3B82F6",
  fillOpacity = 0.3,
  showGrid = true,
  showTooltip = true,
  strokeWidth = 2,
  curved = true,
  stacked = false,
  tooltipFormatter,
  tooltipLabelFormatter,
  margin = { top: 20, right: 20, bottom: 20, left: 20 },
  className,
  yAxisWidth = 60,
  additionalAreas = []
}) => {
  return (
    <BaseChart
      title={title}
      description={description}
      icon={icon}
      height={height}
      className={className}
    >
      <RechartsAreaChart data={data} margin={margin}>
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
        
        <Area
          type={curved ? "monotone" : "linear"}
          dataKey={dataKey}
          stroke={color}
          fill={color}
          strokeWidth={strokeWidth}
          fillOpacity={fillOpacity}
          stackId={stacked ? "1" : undefined}
        />
        
        {additionalAreas.map((area, index) => (
          <Area
            key={`area-${index}`}
            type={curved ? "monotone" : "linear"}
            dataKey={area.dataKey}
            name={area.name}
            stroke={area.stroke || area.fill || color}
            fill={area.fill || color}
            strokeWidth={area.strokeWidth || strokeWidth}
            fillOpacity={area.fillOpacity || fillOpacity}
            stackId={stacked ? (area.stackId || "1") : undefined}
          />
        ))}
      </RechartsAreaChart>
    </BaseChart>
  );
};

export default AreaChart;

