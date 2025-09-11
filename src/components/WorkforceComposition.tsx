import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Target, Award, UserCheck, Zap, Info } from 'lucide-react';
import { ProcessedJobData, FilterOptions } from '../types';
import { useDashboardData } from '../hooks/useDashboardData';

interface WorkforceCompositionProps {
  data: ProcessedJobData[];
  filters: FilterOptions;
}

const WorkforceComposition: React.FC<WorkforceCompositionProps> = ({ data, filters }) => {
  // Use shared hook for common dashboard data and processing
  const { 
    processor, 
    isAgencyView, 
    selectedAgencyName, 
    filteredData, 
    marketData 
  } = useDashboardData(data, filters);

  // Helper function to classify employment type
  const isStaff = (grade: string) => {
    if (!grade) return false;
    const gradeUpper = grade.toUpperCase().trim();
    
    // Staff categories: P (Professional), D (Director), G (General Service), NO (National Officer), L (Language)
    return (
      /^P\d+/.test(gradeUpper) ||        // P1, P2, P3, etc.
      /^D\d+/.test(gradeUpper) ||        // D1, D2, etc.
      /^G\d+/.test(gradeUpper) ||        // G1, G2, G3, etc.
      /^NO-?[A-Z\d]/.test(gradeUpper) || // NO-A, NO-B, NO1, NO2, etc.
      /^L\d+/.test(gradeUpper) ||        // L1, L2, etc.
      gradeUpper === 'USG' ||            // Under-Secretary-General
      gradeUpper === 'ASG'               // Assistant Secretary-General
    );
  };

  const isConsultant = (grade: string) => {
    if (!grade) return false;
    const gradeUpper = grade.toUpperCase().trim();
    
    // Consultant/contract categories (NOA is staff, not consultant!)
    return (
      gradeUpper.includes('CONSULTANT') ||
      gradeUpper.includes('CONSULT') ||
      gradeUpper.includes('CON') ||
      gradeUpper.includes('PSA') ||
      gradeUpper.includes('IC-') ||
      gradeUpper === 'IC' ||
      gradeUpper.includes('CONTRACTOR') ||
      gradeUpper.includes('FREELANCE') ||
      gradeUpper.includes('TEMP')
    );
  };

  const isInternationalStaff = (grade: string) => {
    if (!grade) return false;
    const gradeUpper = grade.toUpperCase().trim();
    return (
      /^P\d+/.test(gradeUpper) ||        // P1, P2, P3, etc.
      /^D\d+/.test(gradeUpper) ||        // D1, D2, etc.
      /^L\d+/.test(gradeUpper) ||        // L1, L2, etc.
      gradeUpper === 'USG' ||            // Under-Secretary-General
      gradeUpper === 'ASG'               // Assistant Secretary-General
    );
  };

  const isNationalStaff = (grade: string) => {
    if (!grade) return false;
    const gradeUpper = grade.toUpperCase().trim();
    return (
      /^G\d+/.test(gradeUpper) ||        // G1, G2, G3, etc. (General Service)
      /^NO-?[A-Z\d]/.test(gradeUpper) || // NO-A, NO-B, NO1, NO2, etc. (National Officer)
      gradeUpper.includes('NOA')         // NOA is National Officer Assistant
    );
  };

  const isIntern = (grade: string) => {
    if (!grade) return false;
    const gradeUpper = grade.toUpperCase().trim();
    return gradeUpper === 'INTERN' || gradeUpper.includes('INTERN');
  };

  const isUnspecified = (grade: string) => {
    return !grade || grade.trim() === '' || grade.toLowerCase() === 'unknown';
  };

  // Core workforce analysis - Grade distribution by agency and category
  const workforceAnalysis = useMemo(() => {
    const gradeCategories = {
      'Entry International (P1-P2, L1-L2)': (grade: string) => 
        isInternationalStaff(grade) && /^(P[12]|L[12])/.test(grade?.toUpperCase() || ''),
      'Mid International (P3-P4, L3-L4)': (grade: string) => 
        isInternationalStaff(grade) && /^(P[34]|L[34])/.test(grade?.toUpperCase() || ''),
      'Senior International (P5+, D1+)': (grade: string) => 
        isInternationalStaff(grade) && /^(P[567]|D[12]|L[567]|USG|ASG)/.test(grade?.toUpperCase() || ''),
      'National Staff (G, NO, NOA)': (grade: string) => 
        isNationalStaff(grade),
      'Consultants': (grade: string) => 
        isConsultant(grade),
      'Interns': (grade: string) => 
        isIntern(grade),
      'Unspecified': (grade: string) => 
        isUnspecified(grade) || (!isStaff(grade) && !isConsultant(grade) && !isIntern(grade))
    };

    // Calculate grade distribution for main dataset
    const calculateGradeDistribution = (dataset: ProcessedJobData[]) => {
      const total = dataset.length;
      const gradeCounts: { [key: string]: number } = {};
      
      Object.keys(gradeCategories).forEach(grade => gradeCounts[grade] = 0);

      dataset.forEach(job => {
        const grade = job.up_grade || '';
        let categorized = false;
        
        Object.entries(gradeCategories).forEach(([category, matcher]) => {
          if (!categorized && matcher(grade)) {
            gradeCounts[category]++;
            categorized = true;
          }
        });
      });

      return Object.entries(gradeCounts).map(([grade, count]) => ({
        grade,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }));
    };

    const mainDistribution = calculateGradeDistribution(filteredData);
    const marketDistribution = calculateGradeDistribution(marketData);

    // Grade distribution comparison for agency view
    const gradeComparison = mainDistribution.map(item => {
      const marketItem = marketDistribution.find(m => m.grade === item.grade);
      return {
        ...item,
        marketPercentage: marketItem?.percentage || 0,
        difference: item.percentage - (marketItem?.percentage || 0)
      };
    });

    return {
      gradeDistribution: mainDistribution,
      marketDistribution,
      gradeComparison,
      totalPositions: filteredData.length
    };
  }, [filteredData, marketData]);

  // Agency-Category-Grade analysis - The core insight
  const agencyCategoryGradeAnalysis = useMemo(() => {
    if (isAgencyView) {
      // For agency view, show category breakdown by grade
      const categoryGradeMap = new Map<string, { [grade: string]: number }>();
      
      filteredData.forEach(job => {
        const category = job.primary_category;
        const jobIsConsultant = isConsultant(job.up_grade || '');
        const jobIsStaff = isStaff(job.up_grade || '');
        const isSenior = jobIsStaff && ['P5', 'P6', 'P7', 'D1', 'D2', 'NO-C', 'NO5', 'NO6'].some(g => 
          job.up_grade?.includes(g)
        );
        
        const gradeType = jobIsConsultant ? 'Consultant' : isSenior ? 'Senior Staff' : 'Regular Staff';
        
        if (!categoryGradeMap.has(category)) {
          categoryGradeMap.set(category, { Consultant: 0, 'Senior Staff': 0, 'Regular Staff': 0, total: 0 });
        }
        
        const categoryData = categoryGradeMap.get(category)!;
        categoryData[gradeType]++;
        categoryData.total++;
      });

      return Array.from(categoryGradeMap.entries())
        .map(([category, grades]) => ({
          category,
          consultantPerc: (grades.Consultant / grades.total) * 100,
          seniorPerc: (grades['Senior Staff'] / grades.total) * 100,
          staffPerc: (grades['Regular Staff'] / grades.total) * 100,
          totalJobs: grades.total,
          consultantCount: grades.Consultant,
          seniorCount: grades['Senior Staff'],
          staffCount: grades['Regular Staff']
        }))
        .filter(item => item.totalJobs >= 3)
        .sort((a, b) => b.totalJobs - a.totalJobs)
        .slice(0, 8);
    } else {
      // For market view, show agency comparison by grade composition
      const agencyGradeMap = new Map<string, { [grade: string]: number }>();
      
      marketData.forEach(job => {
        const agency = job.short_agency || job.long_agency || 'Unknown';
        const jobIsConsultant = isConsultant(job.up_grade || '');
        const jobIsStaff = isStaff(job.up_grade || '');
        const isSenior = jobIsStaff && ['P5', 'P6', 'P7', 'D1', 'D2', 'NO-C', 'NO5', 'NO6'].some(g => 
          job.up_grade?.includes(g)
        );
        
        const gradeType = jobIsConsultant ? 'Consultant' : isSenior ? 'Senior Staff' : 'Regular Staff';
        
        if (!agencyGradeMap.has(agency)) {
          agencyGradeMap.set(agency, { Consultant: 0, 'Senior Staff': 0, 'Regular Staff': 0, total: 0 });
        }
        
        const agencyData = agencyGradeMap.get(agency)!;
        agencyData[gradeType]++;
        agencyData.total++;
      });

      return Array.from(agencyGradeMap.entries())
        .map(([agency, grades]) => ({
          agency,
          consultantPerc: (grades.Consultant / grades.total) * 100,
          seniorPerc: (grades['Senior Staff'] / grades.total) * 100,
          staffPerc: (grades['Regular Staff'] / grades.total) * 100,
          totalJobs: grades.total,
          consultantCount: grades.Consultant,
          seniorCount: grades['Senior Staff'],
          staffCount: grades['Regular Staff']
        }))
        .filter(item => item.totalJobs >= 10)
        .sort((a, b) => b.totalJobs - a.totalJobs)
        .slice(0, 12);
    }
  }, [filteredData, marketData, isAgencyView]);

    // Agency grade composition comparison analysis
  const agencyGradeComparison = useMemo(() => {
    if (isAgencyView || marketData.length === 0) {
      return [];
    }

    // Get top agencies by position count
    const agencyStats = new Map<string, ProcessedJobData[]>();
    marketData.forEach(job => {
      const agency = job.short_agency || job.long_agency || 'Unknown';
      if (!agencyStats.has(agency)) agencyStats.set(agency, []);
      agencyStats.get(agency)!.push(job);
    });

    // Get top 6 agencies with most positions
    const topAgencies = Array.from(agencyStats.entries())
      .filter(([, jobs]) => jobs.length >= 20) // Minimum threshold
      .sort(([, a], [, b]) => b.length - a.length)
      .slice(0, 6);

    return topAgencies.map(([agency, jobs]) => {
      const total = jobs.length;
      const international = jobs.filter(job => isInternationalStaff(job.up_grade || '')).length;
      const national = jobs.filter(job => isNationalStaff(job.up_grade || '')).length;
      const consultants = jobs.filter(job => isConsultant(job.up_grade || '')).length;
      const seniors = jobs.filter(job => isInternationalStaff(job.up_grade || '') && 
        /^(P[567]|D[12]|L[567]|USG|ASG)/.test(job.up_grade?.toUpperCase() || '')).length;
      const interns = jobs.filter(job => isIntern(job.up_grade || '')).length;

      return {
        agency: agency.length > 12 ? agency.substring(0, 10) + '..' : agency,
        fullAgency: agency,
        total,
        internationalPerc: (international / total) * 100,
        nationalPerc: (national / total) * 100,
        consultantPerc: (consultants / total) * 100,
        seniorPerc: (seniors / total) * 100,
        internPerc: (interns / total) * 100,
        international,
        national,
        consultants,
        seniors,
        interns
      };
    });
  }, [marketData, isAgencyView]);

  // Top agencies and their workforce strategies
  const agencyStrategies = useMemo(() => {
    if (isAgencyView) return null;
    
    const agencyMap = new Map<string, ProcessedJobData[]>();
    marketData.forEach(job => {
      const agency = job.short_agency || job.long_agency || 'Unknown';
      if (!agencyMap.has(agency)) agencyMap.set(agency, []);
      agencyMap.get(agency)!.push(job);
    });

    return Array.from(agencyMap.entries())
      .map(([agency, jobs]) => {
        const consultants = jobs.filter(job => isConsultant(job.up_grade || '')).length;
        const seniors = jobs.filter(job => {
          const jobIsStaff = isStaff(job.up_grade || '');
          return jobIsStaff && ['P5', 'P6', 'P7', 'D1', 'D2', 'NO-C', 'NO5', 'NO6'].some(g => 
            job.up_grade?.includes(g)
          );
        }).length;
        const field = jobs.filter(job => job.location_type === 'Field').length;
        
        // Top category
        const categoryCount = new Map<string, number>();
        jobs.forEach(job => {
          categoryCount.set(job.primary_category, (categoryCount.get(job.primary_category) || 0) + 1);
        });
        const topCategory = Array.from(categoryCount.entries())
          .sort(([,a], [,b]) => b - a)[0];

        return {
          agency,
          totalJobs: jobs.length,
          consultantPerc: (consultants / jobs.length) * 100,
          seniorPerc: (seniors / jobs.length) * 100,
          fieldPerc: (field / jobs.length) * 100,
          topCategory: topCategory?.[0] || 'Various',
          topCategoryCount: topCategory?.[1] || 0,
          strategy: consultants / jobs.length > 0.4 ? 'Consultant-Heavy' : 
                   seniors / jobs.length > 0.3 ? 'Leadership-Focused' : 'Operational'
        };
      })
      .filter(agency => agency.totalJobs >= 15)
      .sort((a, b) => b.totalJobs - a.totalJobs)
      .slice(0, 8);
  }, [marketData, isAgencyView]);

  const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          {isAgencyView ? `${selectedAgencyName} - Workforce Composition` : 'UN System Workforce Composition'}
        </h2>
        <div className="text-sm text-gray-600">
          {isAgencyView 
            ? `${workforceAnalysis.totalPositions} positions analyzed with market comparison`
            : `${workforceAnalysis.totalPositions} positions across ${agencyStrategies?.length || 0} major agencies`
          }
        </div>
      </div>

      {/* Classification Legend */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-600" />
          Grade Classification Guide
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">🌍 International Staff</h4>
            <div className="space-y-1 text-sm text-gray-700">
              <p><strong>Entry:</strong> P1-P2, L1-L2</p>
              <p><strong>Mid-level:</strong> P3-P4, L3-L4</p>
              <p><strong>Senior:</strong> P5+, D1+, L5+, USG, ASG</p>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">🏠 National Staff</h4>
            <div className="space-y-1 text-sm text-gray-700">
              <p><strong>General Service:</strong> G1-G6</p>
              <p><strong>National Officers:</strong> NO-A, NO-B, NO-C</p>
              <p><strong>National Assistants:</strong> NOA</p>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">💼 Non-Staff Categories</h4>
            <div className="space-y-1 text-sm text-gray-700">
              <p><strong>Consultants:</strong> CON, PSA, IC, Contractor</p>
              <p><strong>Interns:</strong> Intern, Internship programs</p>
              <p><strong>Unspecified:</strong> Missing or unclear grades</p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Workforce Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="metric-card">
          <div className="metric-value">
            {(workforceAnalysis.gradeDistribution.find(g => g.grade.includes('Senior'))?.percentage || 0).toFixed(1)}%
          </div>
          <div className="metric-label">
            <Award className="h-4 w-4 mr-1" />
            Senior Positions
          </div>
          <div className="text-xs text-gray-500 mt-1">
            P5+ and equivalent grades
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-value">
            {(workforceAnalysis.gradeDistribution.find(g => g.grade.includes('Consultant'))?.percentage || 0).toFixed(1)}%
          </div>
          <div className="metric-label">
            <UserCheck className="h-4 w-4 mr-1" />
            Consultant Ratio
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {isAgencyView ? 'vs market average' : 'System average'}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-value">
            {(() => {
              const intlStaff = filteredData.filter(job => isInternationalStaff(job.up_grade || '')).length;
              const total = filteredData.length;
              return total > 0 ? ((intlStaff / total) * 100).toFixed(1) : '0.0';
            })()}%
          </div>
          <div className="metric-label">
            <Zap className="h-4 w-4 mr-1" />
            International Staff
          </div>
          <div className="text-xs text-gray-500 mt-1">
            P, D, L grade positions
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-value">
            {isAgencyView 
              ? agencyCategoryGradeAnalysis.length
              : agencyStrategies?.filter(a => a.strategy === 'Consultant-Heavy').length || 0
            }
          </div>
          <div className="metric-label">
            <Target className="h-4 w-4 mr-1" />
            {isAgencyView ? 'Active Categories' : 'Consultant-Heavy Agencies'}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {isAgencyView ? 'With meaningful hiring' : '&gt;40% consultant ratio'}
          </div>
        </div>
      </div>

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Grade Distribution */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Grade Distribution</h3>
            <p className="text-sm text-gray-600 mt-1">
              {isAgencyView 
                ? `${selectedAgencyName} vs market average` 
                : 'System-wide grade composition'
              }
            </p>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={400}>
              {isAgencyView ? (
                <BarChart data={workforceAnalysis.gradeComparison} margin={{ bottom: 80, left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="grade" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100} 
                    fontSize={11} 
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip formatter={(value: number, name: string) => [
                    `${value.toFixed(1)}%`, 
                    name === 'percentage' ? selectedAgencyName : 'Market Average'
                  ]} />
                  <Bar dataKey="percentage" fill="#1f77b4" name={selectedAgencyName} />
                  <Bar dataKey="marketPercentage" fill="#ff7f0e" name="Market Average" />
                </BarChart>
              ) : (
                <PieChart>
                  <Pie
                    data={workforceAnalysis.gradeDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    dataKey="percentage"
                    label={({ grade, percentage }) => {
                      const shortGrade = grade.includes('Staff') ? grade.split(' ')[0] : grade.split(' ')[0];
                      return `${shortGrade}: ${percentage.toFixed(1)}%`;
                    }}
                  >
                    {workforceAnalysis.gradeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'Percentage']} />
                </PieChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category vs Grade Analysis */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {isAgencyView ? 'Category Workforce Mix' : 'Agency Workforce Strategies'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {isAgencyView 
                ? 'Staff vs consultant ratio by category' 
                : 'Workforce composition patterns by agency'
              }
            </p>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={agencyCategoryGradeAnalysis} margin={{ bottom: 100, left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey={isAgencyView ? "category" : "agency"} 
                  angle={-45} 
                  textAnchor="end" 
                  height={120} 
                  fontSize={10}
                  interval={0}
                  tick={{ fontSize: 10 }}
                />
                <YAxis />
                <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, '']} />
                <Bar dataKey="consultantPerc" stackId="a" fill="#ff7f0e" name="Consultants" />
                <Bar dataKey="seniorPerc" stackId="a" fill="#2ca02c" name="Senior Staff" />
                <Bar dataKey="staffPerc" stackId="a" fill="#1f77b4" name="Regular Staff" />
              </BarChart>
            </ResponsiveContainer>
            
            {/* Chart Legend */}
            <div className="mt-4 flex justify-center">
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-500 rounded"></div>
                  <span>Consultants</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>Senior Staff (P5+, D1+)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span>Regular Staff (P1-P4, National)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Agency Grade Composition Comparison */}
      {!isAgencyView && agencyGradeComparison.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Agency Grade Composition Comparison</h3>
            <p className="text-sm text-gray-600 mt-1">How different agencies structure their workforce by grade and employment type</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* International vs National Staff */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">International vs National Staff</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={agencyGradeComparison} margin={{ bottom: 50, left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="agency" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80} 
                      fontSize={10}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
                      labelFormatter={(agency) => agencyGradeComparison.find(a => a.agency === agency)?.fullAgency || agency}
                    />
                    <Bar dataKey="internationalPerc" fill="#1f77b4" name="International Staff" />
                    <Bar dataKey="nationalPerc" fill="#2ca02c" name="National Staff" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Consultant vs Staff Distribution */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Consultant vs Staff Distribution</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={agencyGradeComparison} margin={{ bottom: 50, left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="agency" 
                      angle={-45} 
                      textAnchor="end" 
                      height={80} 
                      fontSize={10}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
                      labelFormatter={(agency) => agencyGradeComparison.find(a => a.agency === agency)?.fullAgency || agency}
                    />
                    <Bar dataKey="consultantPerc" fill="#ff7f0e" name="Consultants" />
                    <Bar dataKey="seniorPerc" fill="#d62728" name="Senior Staff" />
                    <Bar dataKey="internPerc" fill="#9467bd" name="Interns" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart Legends */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Staff Type Legend</h5>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span>International Staff (P, D, L)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span>National Staff (G, NO, NOA)</span>
                  </div>
                </div>
              </div>
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Employment Type Legend</h5>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-500 rounded"></div>
                    <span>Consultants (CON, PSA, IC)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-600 rounded"></div>
                    <span>Senior Staff (P5+, D1+)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-purple-500 rounded"></div>
                    <span>Interns</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Workforce Analysis */}
      {isAgencyView ? (
        /* Agency View: Category Deep Dive */
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{selectedAgencyName} Category Workforce Details</h3>
            <p className="text-sm text-gray-600 mt-1">Detailed breakdown showing hiring patterns by category</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agencyCategoryGradeAnalysis.map((item, index) => (
                <div key={'category' in item ? item.category : item.agency} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                    <h4 className="font-semibold text-gray-900 text-sm truncate" title={'category' in item ? item.category : item.agency}>
                      {'category' in item ? item.category : item.agency}
                    </h4>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-medium">{item.totalJobs} positions</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Consultants:</span>
                      <span className="font-medium">{item.consultantPerc.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Senior:</span>
                      <span className="font-medium">{item.seniorPerc.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Regular Staff:</span>
                      <span className="font-medium">{item.staffPerc.toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-600">
                    Strategy: {item.consultantPerc > 50 ? 'Consultant-driven' : 
                             item.seniorPerc > 40 ? 'Leadership-heavy' : 'Staff-focused'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Market View: Agency Strategies */
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Agency Workforce Strategies</h3>
            <p className="text-sm text-gray-600 mt-1">How different agencies structure their workforce</p>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-fixed">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-medium text-gray-900 w-1/4">Agency</th>
                    <th className="text-right py-2 font-medium text-gray-900 w-16">Positions</th>
                    <th className="text-right py-2 font-medium text-gray-900 w-20">Consultants</th>
                    <th className="text-right py-2 font-medium text-gray-900 w-16">Senior</th>
                    <th className="text-right py-2 font-medium text-gray-900 w-16">Field</th>
                    <th className="text-left py-2 font-medium text-gray-900 w-1/4">Top Category</th>
                    <th className="text-left py-2 font-medium text-gray-900 w-24">Strategy</th>
                  </tr>
                </thead>
                <tbody>
                  {agencyStrategies?.map((agency, index) => (
                    <tr key={agency.agency} className="border-b border-gray-100">
                      <td className="py-3 font-medium text-gray-900 min-w-0">
                        <div className="truncate max-w-xs" title={agency.agency}>
                          {agency.agency}
                        </div>
                      </td>
                      <td className="py-3 text-right text-gray-700">{agency.totalJobs}</td>
                      <td className="py-3 text-right">
                        <span className={`${agency.consultantPerc > 40 ? 'text-orange-600 font-medium' : 'text-gray-700'}`}>
                          {agency.consultantPerc.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <span className={`${agency.seniorPerc > 30 ? 'text-green-600 font-medium' : 'text-gray-700'}`}>
                          {agency.seniorPerc.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 text-right text-gray-700">{agency.fieldPerc.toFixed(1)}%</td>
                      <td className="py-3 text-gray-700 min-w-0">
                        <div className="truncate max-w-xs" title={agency.topCategory}>
                          {agency.topCategory}
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          agency.strategy === 'Consultant-Heavy' ? 'bg-orange-100 text-orange-700' :
                          agency.strategy === 'Leadership-Focused' ? 'bg-green-100 text-green-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {agency.strategy}
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

      {/* Strategic Workforce Intelligence Summary */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow text-white">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Workforce Intelligence Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Grade Composition Insights</h4>
              <ul className="text-sm space-y-1 opacity-90">
                {isAgencyView ? (
                  <>
                    <li>• Senior positions: {(workforceAnalysis.gradeComparison.find(g => g.grade.includes('Senior'))?.percentage || 0).toFixed(1)}% vs {(workforceAnalysis.gradeComparison.find(g => g.grade.includes('Senior'))?.marketPercentage || 0).toFixed(1)}% market</li>
                    <li>• Consultant ratio: {(workforceAnalysis.gradeComparison.find(g => g.grade.includes('Consultant'))?.percentage || 0).toFixed(1)}% vs {(workforceAnalysis.gradeComparison.find(g => g.grade.includes('Consultant'))?.marketPercentage || 0).toFixed(1)}% market</li>
                    <li>• Most consultant-heavy category: {(() => {
                      const top = agencyCategoryGradeAnalysis.sort((a,b) => b.consultantPerc - a.consultantPerc)[0];
                      return top && 'category' in top ? top.category : 'N/A';
                    })()}</li>
                    <li>• Most senior-focused category: {(() => {
                      const top = agencyCategoryGradeAnalysis.sort((a,b) => b.seniorPerc - a.seniorPerc)[0];
                      return top && 'category' in top ? top.category : 'N/A';
                    })()}</li>
                  </>
                ) : (
                  <>
                    <li>• System senior ratio: {(workforceAnalysis.gradeDistribution.find(g => g.grade.includes('Senior'))?.percentage || 0).toFixed(1)}%</li>
                    <li>• System consultant ratio: {(workforceAnalysis.gradeDistribution.find(g => g.grade.includes('Consultant'))?.percentage || 0).toFixed(1)}%</li>
                    <li>• {agencyStrategies?.filter(a => a.strategy === 'Consultant-Heavy').length} agencies are consultant-heavy (&gt;40%)</li>
                    <li>• {agencyStrategies?.filter(a => a.strategy === 'Leadership-Focused').length} agencies are leadership-focused (&gt;30% senior)</li>
                  </>
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Strategic Recommendations</h4>
              <ul className="text-sm space-y-1 opacity-90">
                {isAgencyView ? (
                  <>
                    <li>• {(workforceAnalysis.gradeComparison.find(g => g.grade.includes('Senior'))?.difference || 0) > 0 ? 'Maintain senior leadership advantage' : 'Consider building senior expertise'}</li>
                    <li>• {(workforceAnalysis.gradeComparison.find(g => g.grade.includes('Consultant'))?.difference || 0) > 10 ? 'Review consultant dependency risks' : 'Evaluate consultant expertise gaps'}</li>
                    <li>• Focus recruitment on categories with balanced workforce mix</li>
                    <li>• Monitor digital categories for optimal consultant/staff balance</li>
                  </>
                ) : (
                  <>
                    <li>• Learn from leadership-focused agencies for senior development</li>
                    <li>• Study consultant-heavy agencies for flexibility strategies</li>
                    <li>• Digital categories show higher consultant ratios - evaluate necessity</li>
                    <li>• Consider operational model implications of workforce composition</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkforceComposition;