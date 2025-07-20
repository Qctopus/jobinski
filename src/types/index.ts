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
  relevant_experience: number;
  language_count: number;
  is_home_based: boolean;
  formatted_posting_date: string;
  formatted_apply_until: string;
} 