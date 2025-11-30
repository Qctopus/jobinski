import React from 'react';
import { ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip } from 'recharts';
import { Target, HelpCircle } from 'lucide-react';

interface CompetitiveAnalysisData {
  data: Array<{
    metric: string;
    fullMetric: string;
    explanation: string;
    scale: string;
    rawValues: Record<string, number>;
    [key: string]: any;
  }>;
  ourMetrics: Record<string, number>;
  competitorMetrics: Record<string, number>;
  systemAverage: Record<string, number>;
  competitors: string[];
}

interface CompetitiveRadarChartProps {
  competitiveAnalysis: CompetitiveAnalysisData;
  selectedAgencyName: string;
}

const CompetitiveRadarChart: React.FC<CompetitiveRadarChartProps> = ({
  competitiveAnalysis,
  selectedAgencyName
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Target className="h-6 w-6 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Competitive Analysis: {selectedAgencyName}
          </h3>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Performance comparison across 6 key strategic dimensions
        </p>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Spider Chart */}
          <div className="lg:col-span-2">
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={competitiveAnalysis.data}>
                  <PolarGrid stroke="#E5E7EB" />
                  <PolarAngleAxis 
                    dataKey="metric" 
                    fontSize={11}
                    tick={{ fill: '#374151', textAnchor: 'middle' }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={false}
                    axisLine={false}
                  />
                  
                  <Radar
                    name={selectedAgencyName}
                    dataKey={selectedAgencyName}
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.1}
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#3B82F6' }}
                  />
                  
                  <Radar
                    name="Top Competitors"
                    dataKey="Top Competitors"
                    stroke="#EF4444"
                    fill="#EF4444"
                    fillOpacity={0.05}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 3, fill: '#EF4444' }}
                  />
                  
                  <Radar
                    name="UN System"
                    dataKey="UN System"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.05}
                    strokeWidth={2}
                    strokeDasharray="2 2"
                    dot={{ r: 3, fill: '#10B981' }}
                  />
                  
                  <Tooltip 
                    formatter={(value: any, name: string) => {
                      const dataPoint = competitiveAnalysis.data.find(d => d[name] === value);
                      const rawValue = dataPoint?.rawValues[name];
                      return [
                        `${rawValue}% (scaled: ${value}%)`, 
                        name
                      ];
                    }}
                    labelFormatter={(label) => {
                      const dataPoint = competitiveAnalysis.data.find(d => d.metric === label);
                      return dataPoint ? `${dataPoint.fullMetric} (Scale: ${dataPoint.scale})` : label.replace('\n', ' ');
                    }}
                    contentStyle={{
                      backgroundColor: '#F9FAFB',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-blue-500 rounded"></div>
                <span className="text-sm font-medium text-gray-700">{selectedAgencyName}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-red-500 rounded border-dashed border"></div>
                <span className="text-sm text-gray-600">Top Competitors</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-green-500 rounded border-dotted border"></div>
                <span className="text-sm text-gray-600">UN System</span>
              </div>
            </div>
          </div>
          
          {/* Performance Summary */}
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Performance Summary</h4>
              <div className="space-y-2">
                {Object.entries(competitiveAnalysis.ourMetrics).map(([metric, value]) => {
                  const competitorValue = competitiveAnalysis.competitorMetrics[metric as keyof typeof competitiveAnalysis.competitorMetrics];
                  const systemValue = competitiveAnalysis.systemAverage[metric as keyof typeof competitiveAnalysis.systemAverage];
                  const isAboveCompetitors = value > competitorValue;
                  const isAboveSystem = value > systemValue;
                  const explanation = competitiveAnalysis.data.find(d => d.fullMetric === metric)?.explanation;
                  const scale = competitiveAnalysis.data.find(d => d.fullMetric === metric)?.scale;
                  
                  return (
                    <div key={metric} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2 flex-1">
                        <div>
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                            {metric}
                            <div className="group relative">
                              <HelpCircle className="h-3 w-3 text-gray-400 cursor-help" />
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                <div className="font-medium mb-1">{explanation}</div>
                                <div className="text-gray-300">Scale: {scale}</div>
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            vs Competitors: {isAboveCompetitors ? '+' : ''}{value - competitorValue}% • vs System: {value > systemValue ? '+' : ''}{value - systemValue}%
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          isAboveCompetitors && isAboveSystem ? 'text-green-600' :
                          isAboveCompetitors || isAboveSystem ? 'text-blue-600' :
                          'text-red-600'
                        }`}>
                          {value}%
                        </div>
                        <div className="text-xs text-gray-500">
                          {isAboveCompetitors && isAboveSystem ? '🏆 Leading' :
                           isAboveCompetitors || isAboveSystem ? '📈 Competitive' :
                           '⚠️ Behind'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompetitiveRadarChart;
