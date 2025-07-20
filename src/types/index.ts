export interface JobData {
  id: string;
  url: string;
  title: string;
  description: string;
  duty_station: string;
  duty_country: string;
  duty_continent: string;
  country_code: string;
  eligible_nationality: string;
  hs_min_exp: number | null;
  bachelor_min_exp: number | null;
  master_min_exp: number | null;
  up_grade: string;
  pipeline: string;
  department: string;
  long_agency: string;
  short_agency: string;
  posting_date: string;
  apply_until: string;
  languages: string;
  uniquecode: string;
  ideal_candidate: string;
  job_labels: string;
  job_labels_vectorized: string;
  job_candidate_vectorized: string;
  created_at: string;
  updated_at: string;
  archived: boolean;
}

export interface ProcessedJobData extends JobData {
  application_window_days: number;
  posting_age_days: number;
  quarter: number;
  month: number;
  year: number;
  relevant_experience: number;
  is_home_based: boolean;
  language_count: number;
}

export interface DashboardMetrics {
  totalPostings: number;
  agencyDistribution: { agency: string; count: number; percentage: number }[];
  geographicDistribution: { continent: string; country: string; count: number }[];
  gradeDistribution: { grade: string; count: number; percentage: number }[];
  monthlyTrends: { month: string; count: number; year: number }[];
  avgApplicationWindow: { agency: string; avgDays: number }[];
}

export interface FilterOptions {
  agencies: string[];
  grades: string[];
  countries: string[];
  continents: string[];
  dateRange: {
    start: string;
    end: string;
  };
  searchTerm: string;
}

export interface ChartDataItem {
  name: string;
  value: number;
  [key: string]: any;
} 