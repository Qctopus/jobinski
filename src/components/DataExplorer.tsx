import React, { useEffect, useState } from 'react';
import { ProcessedJobData } from '../types';

interface DataExplorerProps {
  data: ProcessedJobData[];
}

interface CategoryData {
  category: string;
  count: number;
  percentage: number;
}

const DataExplorer: React.FC<DataExplorerProps> = ({ data }) => {
  const [sampleData, setSampleData] = useState<ProcessedJobData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [agencyBreakdown, setAgencyBreakdown] = useState<any[]>([]);

  useEffect(() => {
    if (data.length > 0) {
      // Sample data
      setSampleData(data.slice(0, 5));
      
      // Category breakdown
      const categoryMap = new Map<string, number>();
      data.forEach(job => {
        const category = job.primary_category || 'Unknown';
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
      });
      
      const categoryData = Array.from(categoryMap.entries())
        .map(([category, count]) => ({
          category,
          count,
          percentage: Math.round((count / data.length) * 100 * 10) / 10
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
      
      setCategories(categoryData);
      
      // Agency breakdown
      const agencyMap = new Map<string, { count: number; long: string; departments: Set<string> }>();
      data.forEach(job => {
        const agency = job.short_agency || 'Unknown';
        const longAgency = job.long_agency || 'Unknown';
        const department = job.department || 'Unknown';
        
        if (!agencyMap.has(agency)) {
          agencyMap.set(agency, { count: 0, long: longAgency, departments: new Set() });
        }
        const agencyData = agencyMap.get(agency)!;
        agencyData.count++;
        agencyData.departments.add(department);
      });
      
      const agencyData = Array.from(agencyMap.entries())
        .map(([agency, data]) => ({
          agency,
          count: data.count,
          long: data.long,
          departmentCount: data.departments.size,
          departments: Array.from(data.departments).slice(0, 3)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
      
      setAgencyBreakdown(agencyData);
    }
  }, [data]);

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">🔍 Data Explorer & Debug Info</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <h3 className="font-semibold mb-3">Sample Job Data</h3>
          <div className="text-xs space-y-2 max-h-64 overflow-y-auto">
            {sampleData.map((job, idx) => (
              <div key={idx} className="border border-gray-200 rounded p-2">
                <div><strong>Title:</strong> {job.title}</div>
                <div><strong>Agency:</strong> {job.short_agency}</div>
                <div><strong>Department:</strong> {job.department}</div>
                <div><strong>Category:</strong> {job.primary_category}</div>
                <div><strong>Labels:</strong> {job.job_labels?.substring(0, 80)}...</div>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="font-semibold mb-3">Category Distribution ({data.length} total jobs)</h3>
          <div className="text-sm space-y-1">
            {categories.map(cat => (
              <div key={cat.category} className="flex justify-between">
                <span className="truncate">{cat.category}:</span>
                <span>{cat.count} ({cat.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="font-semibold mb-3">Agency Breakdown</h3>
          <div className="text-sm space-y-2 max-h-64 overflow-y-auto">
            {agencyBreakdown.map(agency => (
              <div key={agency.agency} className="border-b border-gray-100 pb-2">
                <div className="font-medium">{agency.agency} ({agency.count})</div>
                <div className="text-xs text-gray-600">
                  {agency.departmentCount} departments: {agency.departments.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataExplorer; 