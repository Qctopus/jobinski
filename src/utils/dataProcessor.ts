import Papa from 'papaparse';
import { JobData } from '../types';

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