import Papa from 'papaparse';
import { format, differenceInDays, parseISO } from 'date-fns';
import { JobData, ProcessedJobData, DashboardMetrics, FilterOptions } from '../types';

export const parseCSVData = (csvData: string): Promise<JobData[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
      transform: (value: any, field: string) => {
        // Handle numeric fields
        if (['hs_min_exp', 'bachelor_min_exp', 'master_min_exp'].includes(field)) {
          if (value === '' || value === null || value === undefined) return null;
          const num = Number(value);
          return isNaN(num) ? null : num;
        }
        // Handle boolean fields
        if (field === 'archived') {
          return value === 'true' || value === '1' || value === 1;
        }
        // Handle string fields - ensure they're strings
        return value == null ? '' : String(value);
      },
      complete: (results: any) => {
        if (results.errors.length > 0) {
          reject(results.errors);
        } else {
          resolve(results.data as JobData[]);
        }
      },
      error: (error: any) => reject(error)
    });
  });
};

export const processJobData = (jobs: JobData[]): ProcessedJobData[] => {
  return jobs.filter(job => {
    // Filter out jobs with missing essential data
    return job.id && job.title && job.posting_date;
  }).map(job => {
    // Safe date parsing with fallbacks
    let postingDate: Date;
    let applyUntilDate: Date;
    
    try {
      postingDate = parseISO(job.posting_date);
      if (isNaN(postingDate.getTime())) {
        postingDate = new Date(); // fallback to current date
      }
    } catch {
      postingDate = new Date(); // fallback to current date
    }
    
    try {
      applyUntilDate = parseISO(job.apply_until);
      if (isNaN(applyUntilDate.getTime())) {
        applyUntilDate = new Date(postingDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days after posting
      }
    } catch {
      applyUntilDate = new Date(postingDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days after posting
    }
    
    const now = new Date();

    const applicationWindowDays = Math.max(0, differenceInDays(applyUntilDate, postingDate));
    const postingAgeDays = Math.max(0, differenceInDays(now, postingDate));
    
    const quarter = Math.floor(postingDate.getMonth() / 3) + 1;
    const month = postingDate.getMonth() + 1;
    const year = postingDate.getFullYear();

    // Determine relevant experience based on available data
    const relevantExperience = job.master_min_exp || job.bachelor_min_exp || job.hs_min_exp || 0;

    // Check if position is home-based
    const isHomeBased = job.duty_station?.toLowerCase().includes('home') || 
                       job.duty_station?.toLowerCase().includes('remote') ||
                       job.duty_station?.toLowerCase().includes('telework');

    // Count language requirements
    const languageCount = job.languages ? 
      job.languages.split(',').filter(lang => lang.trim().length > 0).length : 0;

    return {
      ...job,
      application_window_days: Math.max(0, applicationWindowDays),
      posting_age_days: Math.max(0, postingAgeDays),
      quarter,
      month,
      year,
      relevant_experience: relevantExperience,
      is_home_based: isHomeBased,
      language_count: languageCount
    };
  });
};

export const calculateDashboardMetrics = (data: ProcessedJobData[]): DashboardMetrics => {
  const totalPostings = data.length;

  // Agency distribution
  const agencyMap = new Map<string, number>();
  data.forEach(job => {
    const agency = job.short_agency || job.long_agency || 'Unknown';
    agencyMap.set(agency, (agencyMap.get(agency) || 0) + 1);
  });

  const agencyDistribution = Array.from(agencyMap.entries())
    .map(([agency, count]) => ({
      agency,
      count,
      percentage: (count / totalPostings) * 100
    }))
    .sort((a, b) => b.count - a.count);

  // Geographic distribution
  const geoMap = new Map<string, Map<string, number>>();
  data.forEach(job => {
    const continent = job.duty_continent || 'Unknown';
    const country = job.duty_country || 'Unknown';
    
    if (!geoMap.has(continent)) {
      geoMap.set(continent, new Map());
    }
    const countryMap = geoMap.get(continent)!;
    countryMap.set(country, (countryMap.get(country) || 0) + 1);
  });

  const geographicDistribution = Array.from(geoMap.entries())
    .flatMap(([continent, countryMap]) =>
      Array.from(countryMap.entries()).map(([country, count]) => ({
        continent,
        country,
        count
      }))
    )
    .sort((a, b) => b.count - a.count);

  // Grade distribution
  const gradeMap = new Map<string, number>();
  data.forEach(job => {
    const grade = job.up_grade || 'Unknown';
    gradeMap.set(grade, (gradeMap.get(grade) || 0) + 1);
  });

  const gradeDistribution = Array.from(gradeMap.entries())
    .map(([grade, count]) => ({
      grade,
      count,
      percentage: (count / totalPostings) * 100
    }))
    .sort((a, b) => b.count - a.count);

  // Monthly trends
  const monthlyMap = new Map<string, { count: number; year: number; month: number }>();
  data.forEach(job => {
    // Skip jobs with invalid year/month data
    if (!job.year || !job.month || job.year < 1900 || job.year > 2100 || job.month < 1 || job.month > 12) {
      return;
    }
    
    const key = `${job.year}-${job.month.toString().padStart(2, '0')}`;
    if (!monthlyMap.has(key)) {
      monthlyMap.set(key, { count: 0, year: job.year, month: job.month });
    }
    monthlyMap.get(key)!.count++;
  });

  const monthlyTrends = Array.from(monthlyMap.entries())
    .map(([key, item]) => {
      try {
        const date = new Date(item.year, item.month - 1);
        if (isNaN(date.getTime())) {
          return {
            month: `${item.year}-${item.month.toString().padStart(2, '0')}`,
            count: item.count,
            year: item.year
          };
        }
        return {
          month: format(date, 'MMM yyyy'),
          count: item.count,
          year: item.year
        };
      } catch {
        return {
          month: `${item.year}-${item.month.toString().padStart(2, '0')}`,
          count: item.count,
          year: item.year
        };
      }
    })
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month.localeCompare(b.month);
    });

  // Average application window by agency
  const agencyWindowMap = new Map<string, { total: number; count: number }>();
  data.forEach(job => {
    const agency = job.short_agency || job.long_agency || 'Unknown';
    if (!agencyWindowMap.has(agency)) {
      agencyWindowMap.set(agency, { total: 0, count: 0 });
    }
    const agencyData = agencyWindowMap.get(agency)!;
    agencyData.total += job.application_window_days;
    agencyData.count++;
  });

  const avgApplicationWindow = Array.from(agencyWindowMap.entries())
    .map(([agency, data]) => ({
      agency,
      avgDays: Math.round(data.total / data.count)
    }))
    .sort((a, b) => b.avgDays - a.avgDays);

  return {
    totalPostings,
    agencyDistribution,
    geographicDistribution,
    gradeDistribution,
    monthlyTrends,
    avgApplicationWindow
  };
};

export const applyFilters = (data: ProcessedJobData[], filters: FilterOptions): ProcessedJobData[] => {
  return data.filter(job => {
    // Agency filter
    if (filters.agencies.length > 0) {
      const agency = job.short_agency || job.long_agency || 'Unknown';
      if (!filters.agencies.includes(agency)) return false;
    }

    // Grade filter
    if (filters.grades.length > 0) {
      if (!filters.grades.includes(job.up_grade)) return false;
    }

    // Country filter
    if (filters.countries.length > 0) {
      if (!filters.countries.includes(job.duty_country)) return false;
    }

    // Continent filter
    if (filters.continents.length > 0) {
      if (!filters.continents.includes(job.duty_continent)) return false;
    }

    // Date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      try {
        const postingDate = parseISO(job.posting_date);
        if (isNaN(postingDate.getTime())) return true; // Skip filter for invalid dates
        
        if (filters.dateRange.start) {
          const startDate = parseISO(filters.dateRange.start);
          if (!isNaN(startDate.getTime()) && postingDate < startDate) return false;
        }
        
        if (filters.dateRange.end) {
          const endDate = parseISO(filters.dateRange.end);
          if (!isNaN(endDate.getTime()) && postingDate > endDate) return false;
        }
      } catch {
        // Skip filter for invalid dates
        return true;
      }
    }

    // Search term filter
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      const searchableText = [
        job.title,
        job.description,
        job.duty_station,
        job.department,
        job.long_agency,
        job.short_agency
      ].join(' ').toLowerCase();
      
      if (!searchableText.includes(searchTerm)) return false;
    }

    return true;
  });
};

export const exportToCSV = (data: ProcessedJobData[], filename: string = 'un_jobs_export.csv') => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const generateInsights = (data: ProcessedJobData[]): string[] => {
  const insights: string[] = [];
  const metrics = calculateDashboardMetrics(data);
  
  // Top agency insight
  if (metrics.agencyDistribution.length > 0) {
    const topAgency = metrics.agencyDistribution[0];
    insights.push(`${topAgency.agency} leads with ${topAgency.count} postings (${topAgency.percentage.toFixed(1)}% of total)`);
  }

  // Application window insight
  if (metrics.avgApplicationWindow.length > 0) {
    const avgWindow = metrics.avgApplicationWindow.reduce((sum, item) => sum + item.avgDays, 0) / metrics.avgApplicationWindow.length;
    insights.push(`Average application window across all agencies is ${Math.round(avgWindow)} days`);
  }

  // Home-based positions insight
  const homeBasedCount = data.filter(job => job.is_home_based).length;
  const homeBasedPercentage = (homeBasedCount / data.length) * 100;
  insights.push(`Home-based positions represent ${homeBasedPercentage.toFixed(1)}% of all postings (${homeBasedCount} jobs)`);

  // Language requirements insight
  const multiLanguageJobs = data.filter(job => job.language_count > 1).length;
  const multiLanguagePercentage = (multiLanguageJobs / data.length) * 100;
  insights.push(`${multiLanguagePercentage.toFixed(1)}% of positions require multiple languages (${multiLanguageJobs} jobs)`);

  // Geographic distribution insight
  if (metrics.geographicDistribution.length > 0) {
    const topLocation = metrics.geographicDistribution[0];
    insights.push(`${topLocation.country} has the highest job concentration with ${topLocation.count} postings`);
  }

  return insights;
}; 