import { ProcessedJobData, DashboardMetrics, FilterOptions, AgencyInsight, DepartmentInsight, CategoryInsight, TimeSeriesData } from '../../types';
import { BaseProcessor } from '../core/BaseProcessor';

/**
 * Specialized service for calculating dashboard metrics and insights.
 * Handles complex aggregations and statistical analysis.
 */
export class MetricsCalculator extends BaseProcessor {
  /**
   * Calculate comprehensive dashboard metrics
   */
  calculateDashboardMetrics(data: ProcessedJobData[], filters: FilterOptions): DashboardMetrics {
    const startTime = Date.now();
    console.log('MetricsCalculator: Starting calculation for', data.length, 'jobs');
    
    const filteredData = this.applyAllFilters(data, filters);
    console.log('MetricsCalculator: Filtered to', filteredData.length, 'jobs');
    
    const metrics: DashboardMetrics = {
      totalJobs: filteredData.length,
      totalAgencies: this.countUniqueAgencies(filteredData),
      totalDepartments: this.countUniqueDepartments(filteredData),
      topCategories: this.calculateTopCategories(filteredData),
      agencyInsights: this.calculateAgencyInsights(filteredData, filters.selectedAgency === 'all'),
      departmentInsights: this.calculateDepartmentInsights(filteredData),
      categoryInsights: this.calculateCategoryInsights(filteredData, data),
      timeSeriesData: this.calculateTimeSeriesData(filteredData),
      emergingCategories: this.calculateEmergingCategories(data, filteredData)
    };

    this.logPerformance('Dashboard Metrics Calculation', startTime, data.length);
    console.log('MetricsCalculator: Completed calculation', metrics);
    
    return metrics;
  }

  /**
   * Calculate agency-specific insights
   */
  calculateAgencyInsights(data: ProcessedJobData[], expandSecretariat: boolean = false): AgencyInsight[] {
    const agencyMap = this.groupJobsByAgency(data, expandSecretariat);
    
    return Array.from(agencyMap.entries()).map(([agency, jobs]) => {
      const topCategories = this.getTopCategoriesForJobs(jobs);
      const specializations = topCategories
        .filter(cat => cat.percentage > 30)
        .map(cat => cat.category);

      // Determine organization details
      const longName = this.getAgencyLongName(agency, jobs);
      const departments = this.calculateDepartmentInsightsForAgency(jobs, agency);
      const organizationLevel = this.getOrganizationLevel(agency, longName);
      const parentOrganization = this.getParentOrganization(agency, longName);

      return {
        agency,
        longName,
        totalJobs: jobs.length,
        topCategories,
        growthRate: 0, // Would need historical data
        specializations,
        departments,
        organizationLevel,
        parentOrganization
      };
    }).sort((a, b) => b.totalJobs - a.totalJobs);
  }

  /**
   * Calculate department insights
   */
  calculateDepartmentInsights(data: ProcessedJobData[]): DepartmentInsight[] {
    const deptMap = new Map<string, ProcessedJobData[]>();
    
    data.forEach(job => {
      const deptKey = `${job.short_agency || job.long_agency || 'Unknown'}|${job.department || 'Unknown'}`;
      if (!deptMap.has(deptKey)) {
        deptMap.set(deptKey, []);
      }
      deptMap.get(deptKey)!.push(job);
    });

    return Array.from(deptMap.entries()).map(([deptKey, jobs]) => {
      const [agency, department] = deptKey.split('|');
      
      const topCategories = this.getTopCategoriesForJobs(jobs);
      const locationTypes = this.getLocationTypesForJobs(jobs);
      const grades = jobs.map(job => job.up_grade).filter(Boolean);
      const avgGradeLevel = this.calculateAverageGrade(grades);
      
      // Calculate specialization score
      const topCategoryPercentage = topCategories[0]?.percentage || 0;
      const specializationScore = topCategoryPercentage > 50 ? topCategoryPercentage : 0;

      return {
        department,
        agency,
        totalJobs: jobs.length,
        topCategories,
        avgGradeLevel,
        locationTypes,
        specializationScore
      };
    }).sort((a, b) => b.totalJobs - a.totalJobs);
  }

  /**
   * Calculate category insights with market analysis
   */
  calculateCategoryInsights(filteredData: ProcessedJobData[], allData: ProcessedJobData[]): CategoryInsight[] {
    const categoryMap = this.groupJobsByCategory(filteredData);

    return Array.from(categoryMap.entries()).map(([category, jobs]) => {
      const agencies = this.getAgenciesForCategory(jobs);
      const leadingAgency = agencies[0]?.agency || 'Unknown';
      
      // Determine skill demand based on job volume
      let skillDemand: 'High' | 'Medium' | 'Low' = 'Low';
      if (jobs.length > 50) skillDemand = 'High';
      else if (jobs.length > 20) skillDemand = 'Medium';

      return {
        category,
        totalJobs: jobs.length,
        leadingAgency,
        growthRate: 0, // Would need historical comparison
        recentAppearances: jobs.length,
        skillDemand,
        agencies: agencies.slice(0, 5)
      };
    }).sort((a, b) => b.totalJobs - a.totalJobs);
  }

  /**
   * Calculate time series data for trend analysis
   */
  calculateTimeSeriesData(data: ProcessedJobData[]): TimeSeriesData[] {
    const periodMap = new Map<string, Map<string, number>>();
    
    data.forEach(job => {
      const period = job.posting_month;
      if (!periodMap.has(period)) {
        periodMap.set(period, new Map());
      }
      
      const categoryMap = periodMap.get(period)!;
      categoryMap.set(job.primary_category, (categoryMap.get(job.primary_category) || 0) + 1);
    });

    return Array.from(periodMap.entries())
      .map(([period, categoryMap]) => {
        const categories: { [category: string]: number } = {};
        let total = 0;
        
        categoryMap.forEach((count, category) => {
          categories[category] = count;
          total += count;
        });

        return { period, categories, total };
      })
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  // Private helper methods
  private applyAllFilters(data: ProcessedJobData[], filters: FilterOptions): ProcessedJobData[] {
    let filtered = this.applyAgencyFilter(data, filters.selectedAgency);
    filtered = this.applyTimeFilter(filtered, filters.timeRange);
    return filtered;
  }

  private countUniqueAgencies(data: ProcessedJobData[]): number {
    const agencies = new Set(data.map(job => job.short_agency || job.long_agency));
    return agencies.size;
  }

  private countUniqueDepartments(data: ProcessedJobData[]): number {
    const departments = new Set(data.map(job => job.department));
    return departments.size;
  }

  private calculateTopCategories(data: ProcessedJobData[]): { category: string; count: number; percentage: number }[] {
    const categoryCount = new Map<string, number>();
    data.forEach(job => {
      categoryCount.set(job.primary_category, (categoryCount.get(job.primary_category) || 0) + 1);
    });

    console.log('MetricsCalculator: Category counts:', Object.fromEntries(categoryCount));

    return this.getTopItems(categoryCount, 10).map(item => ({
      category: item.item,
      count: item.count,
      percentage: item.percentage
    }));
  }

  private groupJobsByAgency(data: ProcessedJobData[], expandSecretariat: boolean): Map<string, ProcessedJobData[]> {
    const agencyMap = new Map<string, ProcessedJobData[]>();
    
    data.forEach(job => {
      let agency = job.short_agency || job.long_agency || 'Unknown';
      
      // For market analysis, break down UN Secretariat by departments
      if (expandSecretariat && agency === 'UN Secretariat' && job.department) {
        agency = `UN Secretariat - ${job.department}`;
      }
      
      if (!agencyMap.has(agency)) {
        agencyMap.set(agency, []);
      }
      agencyMap.get(agency)!.push(job);
    });

    return agencyMap;
  }

  private groupJobsByCategory(data: ProcessedJobData[]): Map<string, ProcessedJobData[]> {
    const categoryMap = new Map<string, ProcessedJobData[]>();
    
    data.forEach(job => {
      if (!categoryMap.has(job.primary_category)) {
        categoryMap.set(job.primary_category, []);
      }
      categoryMap.get(job.primary_category)!.push(job);
    });

    return categoryMap;
  }

  private getTopCategoriesForJobs(jobs: ProcessedJobData[]): { category: string; count: number; percentage: number }[] {
    const categoryCount = new Map<string, number>();
    jobs.forEach(job => {
      categoryCount.set(job.primary_category, (categoryCount.get(job.primary_category) || 0) + 1);
    });

    return this.getTopItems(categoryCount, 3).map(item => ({
      category: item.item,
      count: item.count,
      percentage: item.percentage
    }));
  }

  private getLocationTypesForJobs(jobs: ProcessedJobData[]): { type: string; count: number }[] {
    const locationCount = new Map<string, number>();
    jobs.forEach(job => {
      locationCount.set(job.location_type, (locationCount.get(job.location_type) || 0) + 1);
    });

    return Array.from(locationCount.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }

  private getAgenciesForCategory(jobs: ProcessedJobData[]): { agency: string; count: number; percentage: number }[] {
    const agencyCount = new Map<string, number>();
    jobs.forEach(job => {
      const agency = job.short_agency || job.long_agency || 'Unknown';
      agencyCount.set(agency, (agencyCount.get(agency) || 0) + 1);
    });

    return this.getTopItems(agencyCount, 5).map(item => ({
      agency: item.item,
      count: item.count,
      percentage: item.percentage
    }));
  }

  private calculateDepartmentInsightsForAgency(jobs: ProcessedJobData[], agency: string): DepartmentInsight[] {
    const deptMap = new Map<string, ProcessedJobData[]>();
    
    jobs.forEach(job => {
      const dept = job.department || 'Unknown';
      if (!deptMap.has(dept)) {
        deptMap.set(dept, []);
      }
      deptMap.get(dept)!.push(job);
    });

    return Array.from(deptMap.entries()).map(([department, deptJobs]) => {
      const topCategories = this.getTopCategoriesForJobs(deptJobs);
      const locationTypes = this.getLocationTypesForJobs(deptJobs);
      const grades = deptJobs.map(job => job.up_grade).filter(Boolean);
      const avgGradeLevel = this.calculateAverageGrade(grades);
      
      const topCategoryPercentage = topCategories[0]?.percentage || 0;
      const specializationScore = topCategoryPercentage > 50 ? topCategoryPercentage : 0;

      return {
        department,
        agency,
        totalJobs: deptJobs.length,
        topCategories,
        avgGradeLevel,
        locationTypes,
        specializationScore
      };
    }).sort((a, b) => b.totalJobs - a.totalJobs);
  }

  private calculateAverageGrade(grades: string[]): string {
    if (grades.length === 0) return 'Unknown';
    
    // Return the most common grade
    const gradeCount = new Map<string, number>();
    grades.forEach(grade => {
      gradeCount.set(grade, (gradeCount.get(grade) || 0) + 1);
    });
    
    return Array.from(gradeCount.entries())
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown';
  }

  private getAgencyLongName(agency: string, jobs: ProcessedJobData[]): string {
    const longName = jobs[0]?.long_agency || agency;
    
    // For expanded Secretariat departments, adjust the long name
    if (agency.startsWith('UN Secretariat - ')) {
      const deptName = agency.replace('UN Secretariat - ', '');
      return `United Nations Secretariat - ${deptName}`;
    }
    
    return longName;
  }

  private getOrganizationLevel(shortAgency: string, longAgency: string): 'Agency' | 'Programme' | 'Fund' | 'Office' {
    const combined = `${shortAgency} ${longAgency}`.toLowerCase();
    if (combined.includes('programme')) return 'Programme';
    if (combined.includes('fund')) return 'Fund';
    if (combined.includes('office')) return 'Office';
    return 'Agency';
  }

  private getParentOrganization(shortAgency: string, longAgency: string): string | undefined {
    // Common UN system parent organizations
    if (shortAgency === 'UN Secretariat' || longAgency.includes('United Nations Secretariat')) {
      return 'United Nations';
    }
    if (['UNDP', 'UNFPA', 'UNOPS'].includes(shortAgency)) {
      return 'UN Development System';
    }
    return undefined;
  }

  private calculateEmergingCategories(allData: ProcessedJobData[], filteredData: ProcessedJobData[]): { category: string; growthRate: number; isNew: boolean }[] {
    // Simplified calculation - in real implementation would compare time periods
    const categoryCount = new Map<string, number>();
    filteredData.forEach(job => {
      categoryCount.set(job.primary_category, (categoryCount.get(job.primary_category) || 0) + 1);
    });

    return Array.from(categoryCount.entries())
      .map(([category, count]) => ({
        category,
        growthRate: Math.random() * 100, // Placeholder - would calculate actual growth
        isNew: count < 5 // Placeholder logic
      }))
      .sort((a, b) => b.growthRate - a.growthRate)
      .slice(0, 5);
  }

  /**
   * Calculate comprehensive analytics for a specific category
   */
  calculateCategorySpecificAnalytics(categoryJobs: ProcessedJobData[], allData: ProcessedJobData[], category: string): any {
    const startTime = Date.now();
    
    // Basic category metrics
    const totalJobs = categoryJobs.length;
    const marketShare = (totalJobs / allData.length) * 100;
    
    // Grade breakdown
    const gradeMap = new Map<string, number>();
    let consultantCount = 0;
    categoryJobs.forEach(job => {
      const grade = job.up_grade || 'Unknown';
      gradeMap.set(grade, (gradeMap.get(grade) || 0) + 1);
      if (grade.toLowerCase().includes('consultant')) {
        consultantCount++;
      }
    });
    
    const gradeBreakdown = {
      distribution: Array.from(gradeMap.entries()).map(([grade, count]) => ({
        grade,
        count,
        percentage: (count / totalJobs) * 100
      })).sort((a, b) => b.count - a.count),
      consultantPercentage: (consultantCount / totalJobs) * 100,
      totalPositions: totalJobs,
      avgGradeLevel: this.calculateAverageGrade(categoryJobs.map(job => job.up_grade).filter(Boolean)),
      seniorityBreakdown: this.calculateSeniorityBreakdownForJobs(categoryJobs)
    };
    
    // Agency concentration
    const agencyMap = new Map<string, number>();
    categoryJobs.forEach(job => {
      const agency = job.short_agency || 'Unknown';
      agencyMap.set(agency, (agencyMap.get(agency) || 0) + 1);
    });
    
    const agencyConcentration = Array.from(agencyMap.entries())
      .map(([agency, count]) => ({
        agency,
        count,
        percentage: (count / totalJobs) * 100,
        isLeader: false,
        rank: 0
      }))
      .sort((a, b) => b.count - a.count)
      .map((item, index) => ({ ...item, rank: index + 1, isLeader: index === 0 }));
    
    // Location hotspots
    const locationMap = new Map<string, { count: number; countries: Set<string> }>();
    categoryJobs.forEach(job => {
      const location = job.duty_station || 'Unknown';
      const country = job.duty_country || 'Unknown';
      
      if (!locationMap.has(location)) {
        locationMap.set(location, { count: 0, countries: new Set() });
      }
      const locationData = locationMap.get(location)!;
      locationData.count++;
      locationData.countries.add(country);
    });
    
    const locationHotspots = Array.from(locationMap.entries())
      .map(([location, data]) => ({
        location,
        count: data.count,
        percentage: (data.count / totalJobs) * 100,
        countries: Array.from(data.countries)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    this.logPerformance('Category Specific Analytics', startTime, categoryJobs.length);
    
    return {
      gradeBreakdown,
      agencyConcentration: agencyConcentration.slice(0, 10),
      locationHotspots,
      marketShare,
      totalJobs,
      category
    };
  }

  /**
   * Calculate seniority breakdown for a set of jobs
   */
  private calculateSeniorityBreakdownForJobs(jobs: ProcessedJobData[]): { level: string; count: number; percentage: number }[] {
    const seniorityMap = new Map<string, number>();
    
    jobs.forEach(job => {
      const grade = job.up_grade || '';
      let level = 'Other';
      
      if (grade.includes('P-1') || grade.includes('P-2')) level = 'Junior';
      else if (grade.includes('P-3') || grade.includes('P-4')) level = 'Mid';
      else if (grade.includes('P-5') || grade.includes('D-1')) level = 'Senior';
      else if (grade.includes('D-2') || grade.includes('USG')) level = 'Executive';
      else if (grade.toLowerCase().includes('consultant')) level = 'Consultant';
      
      seniorityMap.set(level, (seniorityMap.get(level) || 0) + 1);
    });
    
    return Array.from(seniorityMap.entries()).map(([level, count]) => ({
      level,
      count,
      percentage: (count / jobs.length) * 100
    }));
  }
}

