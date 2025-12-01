/**
 * Staff vs Non-Staff Analysis
 * 
 * Detailed breakdown of staff and non-staff workforce composition.
 * Shows contract type distribution, category analysis, and agency comparison.
 * 
 * Binary classification:
 * - Staff: Permanent positions (P, D, NO, G grades)
 * - Non-Staff: Service Agreements (NPSA/IPSA), Consultants, Interns, Volunteers
 * 
 * Contract type breakdown shows Service Agreements separately for visibility.
 */

import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { StaffNonStaffAnalysis as StaffNonStaffData } from '../../services/analytics/WorkforceStructureAnalyzer';
import { Users, Briefcase } from 'lucide-react';
import { getCategoryById } from '../../utils/categoryUtils';

interface StaffNonStaffAnalysisProps {
  data: StaffNonStaffData;
}

const StaffNonStaffAnalysis: React.FC<StaffNonStaffAnalysisProps> = ({ data }) => {
  const [activeView, setActiveView] = useState<'contract' | 'category' | 'agency'>('contract');

  // Overall pie data - binary Staff vs Non-Staff
  const overallPieData = [
    { name: 'Staff', value: data.overall.staff, color: '#3B82F6' },
    { name: 'Non-Staff', value: data.overall.nonStaff, color: '#F59E0B' }
  ].filter(d => d.value > 0);

  // Transform category data with pretty names
  const categoryDataWithPrettyNames = useMemo(() => {
    return data.byCategory.map(cat => ({
      ...cat,
      displayName: getCategoryById(cat.category).name
    }));
  }, [data.byCategory]);

  // Sort agencies by total job count (highest to lowest) - top 10
  const sortedAgencyData = useMemo(() => {
    return [...data.byAgency]
      .sort((a, b) => b.total - a.total) // Sort by total jobs descending
      .slice(0, 10) // Top 10 agencies
      .map(ag => ({
        ...ag,
        staffRatio: ag.total > 0 ? (ag.staffCount / ag.total) * 100 : 0
      }));
  }, [data.byAgency]);

  // Custom tooltip for bar charts
  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; fill: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <div className="font-semibold text-gray-900 mb-2">{label}</div>
          <div className="space-y-1">
            {payload.map(p => (
              <div key={p.dataKey} className="flex items-center justify-between gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: p.fill }}></div>
                  <span>{p.dataKey === 'staffCount' ? 'Staff' : 'Non-Staff'}</span>
                </div>
                <span className="font-medium">{p.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Compact Overall Summary - Binary Staff vs Non-Staff */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Staff KPI */}
        <div className="bg-blue-50 rounded-lg p-3 border-l-2 border-blue-500">
          <div className="flex items-center gap-1.5 mb-1">
            <Users className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-[10px] text-gray-500">Staff</span>
          </div>
          <div className="text-lg font-bold text-gray-900">{data.overall.staff.toLocaleString()}</div>
          <div className="text-[10px] text-gray-500">{data.overall.staffPercentage.toFixed(0)}% of total</div>
        </div>
        
        {/* Non-Staff KPI */}
        <div className="bg-amber-50 rounded-lg p-3 border-l-2 border-amber-500">
          <div className="flex items-center gap-1.5 mb-1">
            <Briefcase className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-[10px] text-gray-500">Non-Staff</span>
          </div>
          <div className="text-lg font-bold text-gray-900">{data.overall.nonStaff.toLocaleString()}</div>
          <div className="text-[10px] text-gray-500">{data.overall.nonStaffPercentage.toFixed(0)}% of total</div>
          <div className="text-[9px] text-amber-600 mt-0.5">Incl. Service Agreements</div>
        </div>

        {/* Pie Chart - Compact */}
        <div className="lg:col-span-2 bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={overallPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={20}
                    outerRadius={35}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {overallPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1">
              {overallPieData.map(item => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: item.color }}></div>
                    <span className="text-gray-600">{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contract Type Breakdown - Compact */}
      <div className="bg-gray-50 rounded-lg p-3">
        <h4 className="text-xs font-medium text-gray-700 mb-2">Contract Type Breakdown</h4>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          {data.byContractType.slice(0, 6).map(ct => (
            <div key={ct.type} className="flex items-center gap-2 bg-white rounded p-2">
              <div 
                className="w-2 h-2 rounded flex-shrink-0" 
                style={{ backgroundColor: ct.color }}
              />
              <span className="text-[10px] text-gray-600 flex-1 truncate">{ct.type}</span>
              <span className="text-[10px] font-medium text-gray-900">{ct.count.toLocaleString()}</span>
              <span className="text-[9px] text-gray-400 w-8 text-right">{ct.percentage.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* View Toggle - Compact */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 w-fit">
        <button
          onClick={() => setActiveView('contract')}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            activeView === 'contract' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Contract Type
        </button>
        <button
          onClick={() => setActiveView('category')}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            activeView === 'category' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Category
        </button>
        <button
          onClick={() => setActiveView('agency')}
          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            activeView === 'agency' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Agency
        </button>
      </div>

      {/* Conditional Views */}
      {activeView === 'contract' && (
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.byContractType}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 100, bottom: 5 }}
              >
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="type" width={95} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value: number) => value.toLocaleString()} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {data.byContractType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeView === 'category' && (
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-[10px] text-gray-500 mb-2">Sorted by highest non-staff ratio</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryDataWithPrettyNames.slice(0, 8)}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 140, bottom: 5 }}
              >
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis 
                  type="category" 
                  dataKey="displayName" 
                  width={135} 
                  tick={{ fontSize: 9 }}
                  interval={0}
                  tickFormatter={(value) => value.length > 20 ? value.substring(0, 18) + '...' : value}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="staffCount" stackId="a" fill="#3B82F6" name="Staff" />
                <Bar dataKey="nonStaffCount" stackId="a" fill="#F59E0B" name="Non-Staff" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
        </div>
      )}

      {activeView === 'agency' && (
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-[10px] text-gray-500 mb-2">Top 10 agencies by total job count</div>
          
          {sortedAgencyData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sortedAgencyData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 90, bottom: 5 }}
                >
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis 
                    type="category" 
                    dataKey="agency" 
                    width={85} 
                    tick={{ fontSize: 9 }}
                    interval={0}
                    tickFormatter={(value) => value.length > 12 ? value.substring(0, 10) + '..' : value}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="staffCount" stackId="a" fill="#3B82F6" name="Staff" />
                  <Bar dataKey="nonStaffCount" stackId="a" fill="#F59E0B" name="Non-Staff" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-gray-500">
              No agency data available
            </div>
          )}
        </div>
      )}

      {/* Insights - Compact */}
      <div className="bg-amber-50 border border-amber-100 rounded-lg p-2.5">
        <div className="text-[10px] text-amber-800 space-y-0.5">
          {data.overall.nonStaffPercentage > 40 && (
            <p>• High non-staff dependency ({data.overall.nonStaffPercentage.toFixed(0)}%) - flexibility vs stability tradeoff</p>
          )}
          {data.overall.nonStaffPercentage < 20 && (
            <p>• Low non-staff ratio ({data.overall.nonStaffPercentage.toFixed(0)}%) - stable but potentially less flexible</p>
          )}
          {categoryDataWithPrettyNames.length > 0 && categoryDataWithPrettyNames[0].nonStaffRatio > 60 && (
            <p>• Highest non-staff: {categoryDataWithPrettyNames[0].displayName} ({categoryDataWithPrettyNames[0].nonStaffRatio.toFixed(0)}%)</p>
          )}
          {(data.byContractType.find(ct => ct.type === 'Consultant')?.percentage || 0) > 30 && (
            <p>• Consultants represent significant portion - specialized expertise needs</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffNonStaffAnalysis;

