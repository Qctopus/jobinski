/**
 * Staff vs Non-Staff Analysis
 * 
 * Detailed breakdown of staff and non-staff workforce composition.
 * Shows contract type distribution, category analysis, and agency comparison.
 */

import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { StaffNonStaffAnalysis as StaffNonStaffData } from '../../services/analytics/WorkforceStructureAnalyzer';
import { Users, Briefcase, Building2, Target } from 'lucide-react';
import { JOB_CLASSIFICATION_DICTIONARY } from '../../dictionary';

// Helper function to get pretty category names
const getCategoryInfo = (categoryKey: string) => {
  const entry = JOB_CLASSIFICATION_DICTIONARY[categoryKey];
  return {
    name: entry?.name || categoryKey,
    color: entry?.color || '#6B7280'
  };
};

interface StaffNonStaffAnalysisProps {
  data: StaffNonStaffData;
}

const StaffNonStaffAnalysis: React.FC<StaffNonStaffAnalysisProps> = ({ data }) => {
  const [activeView, setActiveView] = useState<'contract' | 'category' | 'agency'>('contract');

  // Overall pie data
  const overallPieData = [
    { name: 'Staff', value: data.overall.staff, color: '#3B82F6' },
    { name: 'Non-Staff', value: data.overall.nonStaff, color: '#F59E0B' }
  ];

  // Transform category data with pretty names
  const categoryDataWithPrettyNames = useMemo(() => {
    return data.byCategory.map(cat => ({
      ...cat,
      displayName: getCategoryInfo(cat.category).name
    }));
  }, [data.byCategory]);

  // Sort agencies by staff ratio (highest to lowest)
  const sortedAgencyData = useMemo(() => {
    return [...data.byAgency].sort((a, b) => {
      const aStaffRatio = a.total > 0 ? (a.staffCount / a.total) * 100 : 0;
      const bStaffRatio = b.total > 0 ? (b.staffCount / b.total) * 100 : 0;
      return bStaffRatio - aStaffRatio; // Highest staff ratio first
    }).map(ag => ({
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
    <div className="space-y-6">
      {/* Overall Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-medium text-gray-900 mb-4">Overall Distribution</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={overallPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {overallPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => value.toLocaleString()} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            {overallPieData.map(item => (
              <div key={item.name} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></div>
                <span>{item.name}: {item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-gray-500">Staff Positions</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{data.overall.staff.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-1">{data.overall.staffPercentage.toFixed(1)}% of total</div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-gray-500">Non-Staff Positions</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{data.overall.nonStaff.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-1">{data.overall.nonStaffPercentage.toFixed(1)}% of total</div>
          </div>

          {/* Contract Type Breakdown */}
          <div className="col-span-2 bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="font-medium text-gray-900 mb-3">Contract Type Breakdown</h4>
            <div className="space-y-2">
              {data.byContractType.slice(0, 5).map(ct => (
                <div key={ct.type} className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded flex-shrink-0" 
                    style={{ backgroundColor: ct.color }}
                  />
                  <span className="text-sm text-gray-700 flex-1">{ct.type}</span>
                  <span className="text-sm font-medium text-gray-900">{ct.count.toLocaleString()}</span>
                  <div className="w-24">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all" 
                        style={{ 
                          width: `${ct.percentage}%`,
                          backgroundColor: ct.color 
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 w-12 text-right">{ct.percentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveView('contract')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeView === 'contract' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          By Contract Type
        </button>
        <button
          onClick={() => setActiveView('category')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeView === 'category' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          By Category
        </button>
        <button
          onClick={() => setActiveView('agency')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeView === 'agency' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          By Agency
        </button>
      </div>

      {/* Conditional Views */}
      {activeView === 'contract' && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-gray-500" />
            Contract Type Distribution
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.byContractType}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 120, bottom: 10 }}
              >
                <XAxis type="number" />
                <YAxis type="category" dataKey="type" width={110} tick={{ fontSize: 12 }} />
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
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-gray-500" />
            Non-Staff Ratio by Category
          </h4>
          <div className="text-sm text-gray-600 mb-4">
            Categories sorted by highest non-staff ratio
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryDataWithPrettyNames.slice(0, 10)}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 180, bottom: 10 }}
              >
                <XAxis type="number" />
                <YAxis 
                  type="category" 
                  dataKey="displayName" 
                  width={170} 
                  tick={{ fontSize: 11 }}
                  interval={0}
                  tickFormatter={(value) => value.length > 25 ? value.substring(0, 23) + '...' : value}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="staffCount" stackId="a" fill="#3B82F6" name="Staff" />
                <Bar dataKey="nonStaffCount" stackId="a" fill="#F59E0B" name="Non-Staff" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Top Non-Staff Categories Table */}
          <div className="mt-6">
            <h5 className="text-sm font-medium text-gray-700 mb-3">Highest Non-Staff Ratio Categories</h5>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-medium text-gray-700">Category</th>
                    <th className="text-right py-2 font-medium text-gray-700">Staff</th>
                    <th className="text-right py-2 font-medium text-gray-700">Non-Staff</th>
                    <th className="text-right py-2 font-medium text-gray-700">Non-Staff Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryDataWithPrettyNames.slice(0, 5).map(cat => (
                    <tr key={cat.category} className="border-b border-gray-100">
                      <td className="py-2 text-gray-900">{cat.displayName}</td>
                      <td className="py-2 text-right text-blue-600">{cat.staffCount}</td>
                      <td className="py-2 text-right text-orange-600">{cat.nonStaffCount}</td>
                      <td className="py-2 text-right">
                        <span className={`font-medium ${cat.nonStaffRatio > 50 ? 'text-orange-600' : 'text-gray-700'}`}>
                          {cat.nonStaffRatio.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeView === 'agency' && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-gray-500" />
            Staff Mix by Agency
          </h4>
          <div className="text-xs text-gray-500 mb-4">
            All agencies, sorted by highest staff ratio
          </div>
          
          {sortedAgencyData.length > 0 ? (
            <>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sortedAgencyData.slice(0, 15)}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
                  >
                    <XAxis type="number" />
                    <YAxis 
                      type="category" 
                      dataKey="agency" 
                      width={90} 
                      tick={{ fontSize: 10 }}
                      interval={0}
                      tickFormatter={(value) => value.length > 12 ? value.substring(0, 10) + '..' : value}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="staffCount" stackId="a" fill="#3B82F6" name="Staff" />
                    <Bar dataKey="nonStaffCount" stackId="a" fill="#F59E0B" name="Non-Staff" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Agency Table */}
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 font-medium text-gray-700">Agency</th>
                      <th className="text-right py-2 font-medium text-gray-700">Total</th>
                      <th className="text-right py-2 font-medium text-gray-700">Staff</th>
                      <th className="text-right py-2 font-medium text-gray-700">Non-Staff</th>
                      <th className="text-right py-2 font-medium text-gray-700">Staff %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAgencyData.slice(0, 10).map(ag => (
                      <tr key={ag.agency} className="border-b border-gray-100">
                        <td className="py-2 text-gray-900 font-medium">{ag.agency}</td>
                        <td className="py-2 text-right text-gray-700">{ag.total}</td>
                        <td className="py-2 text-right text-blue-600">{ag.staffCount}</td>
                        <td className="py-2 text-right text-orange-600">{ag.nonStaffCount}</td>
                        <td className="py-2 text-right">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            ag.staffRatio >= 70 ? 'bg-blue-100 text-blue-700' :
                            ag.staffRatio >= 50 ? 'bg-green-100 text-green-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {ag.staffRatio.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No agency data available with sufficient positions.
            </div>
          )}
        </div>
      )}

      {/* Insights */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-medium text-amber-900 mb-2">Key Observations</h4>
        <div className="text-sm text-amber-800 space-y-1">
          {data.overall.nonStaffPercentage > 40 && (
            <p>• High non-staff dependency ({data.overall.nonStaffPercentage.toFixed(0)}%) may indicate flexibility but also workforce instability risks</p>
          )}
          {data.overall.nonStaffPercentage < 20 && (
            <p>• Low non-staff ratio ({data.overall.nonStaffPercentage.toFixed(0)}%) suggests stable workforce with potential flexibility constraints</p>
          )}
          {categoryDataWithPrettyNames.length > 0 && categoryDataWithPrettyNames[0].nonStaffRatio > 60 && (
            <p>• "{categoryDataWithPrettyNames[0].displayName}" has highest non-staff ratio at {categoryDataWithPrettyNames[0].nonStaffRatio.toFixed(0)}%</p>
          )}
          {data.byContractType.find(ct => ct.type === 'Consultant')?.percentage || 0 > 30 && (
            <p>• Consultants represent a significant portion of the workforce, indicating specialized expertise needs</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffNonStaffAnalysis;

