import Papa from 'papaparse';
import { format, differenceInDays, parseISO } from 'date-fns';
import { JobData, ProcessedJobData } from '../types';

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
        applyUntilDate = new Date(); // fallback to current date
      }
    } catch {
      applyUntilDate = new Date(); // fallback to current date
    }

    // Calculate application window
    const applicationWindow = differenceInDays(applyUntilDate, postingDate);
    
    // Calculate relevant experience (highest of the three experience fields)
    const experiences = [
      job.hs_min_exp || 0,
      job.bachelor_min_exp || 0,
      job.master_min_exp || 0
    ];
    const relevantExperience = Math.max(...experiences);

    // Count languages (split by common delimiters and filter out empty strings)
    const languageCount = job.languages 
      ? job.languages.split(/[,;/|]/).filter(lang => lang.trim().length > 0).length
      : 0;

    // Check if home-based (look for common indicators in duty station)
    const isHomeBased = job.duty_station.toLowerCase().includes('home based') || 
                       job.duty_station.toLowerCase().includes('remote') ||
                       job.duty_station.toLowerCase().includes('telecommuting');

    return {
      ...job,
      application_window_days: Math.max(0, applicationWindow),
      relevant_experience: relevantExperience,
      language_count: languageCount,
      is_home_based: isHomeBased,
      formatted_posting_date: format(postingDate, 'MMM dd, yyyy'),
      formatted_apply_until: format(applyUntilDate, 'MMM dd, yyyy')
    };
  });
}; 