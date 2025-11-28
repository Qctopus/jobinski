import React from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import BaseChart from './BaseChart';

interface PieChartData {
  name: string;
  value: number;
  [key: string]: any;
}

interface PieChartProps {
  data: PieChartData[];
  dataKey?: string;
  nameKey?: string;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  height?: number | string;
  colors?: string[];
  showTooltip?: boolean;
  showLegend?: boolean;
  cx?: string | number;
  cy?: string | number;
  innerRadius?: number;
  outerRadius?: number;
  tooltipFormatter?: (value: any, name: string, props: any) => [React.ReactNode, string];
  labelFormatter?: (entry: any) => string;
  showLabels?: boolean;
  className?: string;
  startAngle?: number;
  endAngle?: number;
  onSliceClick?: (data: PieChartData) => void;
}

/**
 * Reusable PieChart component
 * Features:
 * - Customizable colors
 * - Optional donut chart (inner radius)
 * - Custom labels and tooltips
 * - Legend support
 * - Responsive design
 * - Consistent styling
 */
const PieChart: React.FC<PieChartProps> = ({
  data,
  dataKey = "value",
  nameKey = "name",
  title,
  description,
  icon,
  height = 400,
  colors = [
    "#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", 
    "#EC4899", "#14B8A6", "#F97316", "#84CC16", "#6366F1"
  ],
  showTooltip = true,
  showLegend = false,
  cx = "50%",
  cy = "50%",
  innerRadius = 0,
  outerRadius = 120,
  tooltipFormatter,
  labelFormatter,
  showLabels = false,
  className,
  startAngle = 90,
  endAngle = -270,
  onSliceClick
}) => {
  const defaultLabelFormatter = (entry: any) => {
    const percentage = ((entry[dataKey] / data.reduce((sum, item) => sum + item[dataKey], 0)) * 100).toFixed(1);
    return `${entry[nameKey]}: ${percentage}%`;
  };

  return (
    <BaseChart
      title={title}
      description={description}
      icon={icon}
      height={height}
      className={className}
    >
      <RechartsPieChart>
        <Pie
          data={data}
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          dataKey={dataKey}
          nameKey={nameKey}
          startAngle={startAngle}
          endAngle={endAngle}
          label={showLabels ? (labelFormatter || defaultLabelFormatter) : false}
          labelLine={showLabels}
          onClick={onSliceClick ? (data) => onSliceClick(data.payload) : undefined}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.color || colors[index % colors.length]} 
            />
          ))}
        </Pie>
        
        {showTooltip && (
          <Tooltip 
            formatter={tooltipFormatter || ((value, name) => [`${value}`, name])}
            contentStyle={{
              backgroundColor: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              fontSize: '12px'
            }}
          />
        )}
        
        {showLegend && (
          <Legend 
            verticalAlign="bottom"
            height={36}
            fontSize={12}
          />
        )}
      </RechartsPieChart>
    </BaseChart>
  );
};

export default PieChart;

