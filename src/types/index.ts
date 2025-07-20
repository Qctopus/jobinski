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
  // New analytics fields
  primary_category: string;
  secondary_categories: string[];
  skill_domain: 'Technical' | 'Operational' | 'Strategic' | 'Mixed';
  seniority_level: 'Junior' | 'Mid' | 'Senior' | 'Executive';
  location_type: 'Headquarters' | 'Regional' | 'Field' | 'Home-based';
  posting_month: string;
  posting_year: number;
  posting_quarter: string;
  // Enhanced location & grade analytics (for upcoming location/grade components)
  grade_level: 'Entry' | 'Mid' | 'Senior' | 'Executive' | 'Consultant' | 'Other';
  grade_numeric: number;
  is_consultant: boolean;
  geographic_region: string;
  geographic_subregion: string;
  is_conflict_zone: boolean;
  is_developing_country: boolean;
}

export interface JobCategory {
  id: string;
  name: string;
  keywords: string[];
  color: string;
  description: string;
}

export interface AgencyInsight {
  agency: string;
  totalJobs: number;
  topCategories: { category: string; count: number; percentage: number }[];
  growthRate: number;
  specializations: string[];
  // Enhanced agency analysis
  longName: string;
  departments: DepartmentInsight[];
  organizationLevel: 'Agency' | 'Programme' | 'Fund' | 'Office';
  parentOrganization?: string;
}

export interface DepartmentInsight {
  department: string;
  agency: string;
  totalJobs: number;
  topCategories: { category: string; count: number; percentage: number }[];
  avgGradeLevel: string;
  locationTypes: { type: string; count: number }[];
  specializationScore: number; // How specialized vs general this department is
}

export interface CategoryInsight {
  category: string;
  totalJobs: number;
  leadingAgency: string;
  growthRate: number;
  recentAppearances: number;
  skillDemand: 'High' | 'Medium' | 'Low';
  agencies: { agency: string; count: number; percentage: number }[];
}

export interface TimeSeriesData {
  period: string;
  categories: { [category: string]: number };
  total: number;
}

export interface DashboardMetrics {
  totalJobs: number;
  totalAgencies: number;
  totalDepartments: number;
  topCategories: { category: string; count: number; percentage: number }[];
  agencyInsights: AgencyInsight[];
  departmentInsights: DepartmentInsight[];
  categoryInsights: CategoryInsight[];
  timeSeriesData: TimeSeriesData[];
  emergingCategories: { category: string; growthRate: number; isNew: boolean }[];
}

export interface FilterOptions {
  selectedAgency: string;
  timeRange: '3months' | '6months' | '1year' | 'all';
  startDate?: string;
  endDate?: string;
} 