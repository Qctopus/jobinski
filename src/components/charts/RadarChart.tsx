import React from 'react';
import { RadarChart as RechartsRadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import BaseChart from './BaseChart';

interface RadarChartData {
  [key: string]: any;
}

interface RadarChartProps {
  data: RadarChartData[];
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  height?: number | string;
  showTooltip?: boolean;
  showLegend?: boolean;
  domain?: [number, number];
  angle?: number;
  fontSize?: number;
  tickFormatter?: (value: any) => string;
  tooltipFormatter?: (value: any, name: string, props: any) => [React.ReactNode, string];
  tooltipLabelFormatter?: (value: any) => React.ReactNode;
  className?: string;
  dataLines: Array<{
    dataKey: string;
    name: string;
    stroke: string;
    fill: string;
    fillOpacity?: number;
    strokeWidth?: number;
    strokeDasharray?: string;
    dot?: { r: number; fill: string };
  }>;
}

/**
 * Reusable RadarChart component
 * Features:
 * - Multiple radar lines
 * - Customizable styling for each line
 * - Custom domain and angles
 * - Custom tooltips and legends
 * - Responsive design
 * - Consistent styling
 */
const RadarChart: React.FC<RadarChartProps> = ({
  data,
  title,
  description,
  icon,
  height = 400,
  showTooltip = true,
  showLegend = false,
  domain = [0, 100],
  angle = 90,
  fontSize = 11,
  tickFormatter,
  tooltipFormatter,
  tooltipLabelFormatter,
  className,
  dataLines
}) => {
  return (
    <BaseChart
      title={title}
      description={description}
      icon={icon}
      height={height}
      className={className}
    >
      <RechartsRadarChart data={data}>
        <PolarGrid stroke="#E5E7EB" />
        <PolarAngleAxis 
          dataKey="metric" 
          fontSize={fontSize}
          tick={{ fill: '#374151', textAnchor: 'middle' }}
          tickFormatter={tickFormatter}
        />
        <PolarRadiusAxis 
          angle={angle} 
          domain={domain} 
          tick={false}
          axisLine={false}
        />
        
        {dataLines.map((line, index) => (
          <Radar
            key={`radar-${index}`}
            name={line.name}
            dataKey={line.dataKey}
            stroke={line.stroke}
            fill={line.fill}
            fillOpacity={line.fillOpacity || 0.1}
            strokeWidth={line.strokeWidth || 2}
            strokeDasharray={line.strokeDasharray}
            dot={line.dot || { r: 3, fill: line.stroke }}
          />
        ))}
        
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
        
        {showLegend && (
          <Legend 
            verticalAlign="bottom"
            height={36}
            fontSize={12}
          />
        )}
      </RechartsRadarChart>
    </BaseChart>
  );
};

export default RadarChart;

