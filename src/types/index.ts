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
  sectoral_category?: string; // Backend field for sector categorization
}

export interface ProcessedJobData extends JobData {
  application_window_days: number;
  relevant_experience: number;
  language_count: number;
  is_home_based: boolean;
  formatted_posting_date: string;
  formatted_apply_until: string;
  // Status fields (Phase 1.2)
  is_active: boolean;
  is_expired: boolean;
  days_remaining: number;
  status: 'active' | 'closing_soon' | 'expired' | 'archived';
  urgency: 'urgent' | 'normal' | 'extended';
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
  // Enhanced classification fields
  classification_confidence: number;
  is_ambiguous_category: boolean;
  classification_reasoning: string[];
  emerging_terms_found: string[];
  hybrid_category_candidate?: string;
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

// Enhanced category analytics interfaces
export interface CategoryAnalytics {
  gradeBreakdown: {
    distribution: { grade: string; count: number; percentage: number }[];
    consultantPercentage: number;
    totalPositions: number;
    avgGradeLevel: string;
    seniorityBreakdown: { level: string; count: number; percentage: number }[];
  };
  agencyConcentration: {
    agency: string;
    count: number;
    percentage: number;
    isLeader: boolean;
    rank: number;
  }[];
  locationHotspots: {
    location: string;
    count: number;
    percentage: number;
    countries: string[];
    locationType: string;
  }[];
  monthlyTrend: {
    monthlyData: { month: string; count: number }[];
    growthRate: number;
    peakMonth: { month: string; count: number };
    avgMonthlyVolume: number;
  };
  avgDaysToDeadline: {
    avg: number;
    distribution: {
      range: string;
      count: number;
      percentage: number;
      type: string;
    }[];
  };
  relatedCategories: {
    category: string;
    count: number;
    percentage: number;
  }[];
  topPositions: {
    title: string;
    count: number;
    percentage: number;
    agencies: string[];
    grades: string[];
  }[];
  experienceProfile: {
    highSchool: { avg: number; min: number; max: number; positions: number };
    bachelor: { avg: number; min: number; max: number; positions: number };
    master: { avg: number; min: number; max: number; positions: number };
    overallPattern: {
      noExperienceRequired: number;
      entryLevel: number;
      experienced: number;
      senior: number;
    };
  };
  languageRequirements: {
    topLanguages: { language: string; count: number; percentage: number }[];
    multilingualPercentage: number;
    avgLanguagesRequired: number;
  };
  postingVelocity: {
    avgJobsPerWeek: number;
    peakWeek: number;
    lowWeek: number;
    volatility: number;
  };
  growthRate: {
    categoryGrowthRate: number;
    marketGrowthRate: number;
    relativePerformance: number;
    isOutperforming: boolean;
  };
  classificationQuality: {
    avgConfidence: number;
    distribution: { level: string; count: number; percentage: number }[];
    needsReview: number;
    ambiguousJobs: number;
  };
  urgencyAnalysis: {
    urgencyRate: number;
    urgentJobsCount: number;
    agenciesWithUrgentHiring: { agency: string; count: number }[];
    avgUrgentWindow: number;
  };
}

// Category intelligence summary
export interface CategoryIntelligence {
  emergingAreas: CategoryGrowth[];
  urgentNeeds: CategoryUrgency[];
  concentrationRisks: CategoryConcentration[];
  leadershipFocus: CategorySeniority[];
  globalCategories: CategorySpread[];
  specializedCategories: CategorySpecialization[];
}

export interface CategoryGrowth {
  category: string;
  growthRate: number;
  monthOverMonth: number;
  isNew: boolean;
}

export interface CategoryUrgency {
  category: string;
  avgDaysToDeadline: number;
  urgentJobsPercentage: number;
  totalUrgentJobs: number;
}

export interface CategoryConcentration {
  category: string;
  leadingAgency: string;
  marketShare: number;
  herfindahlIndex: number;
}

export interface CategorySeniority {
  category: string;
  seniorPositionsPercentage: number;
  avgGradeLevel: number;
  executivePositions: number;
}

export interface CategorySpread {
  category: string;
  uniqueCountries: number;
  uniqueAgencies: number;
  globalPresenceIndex: number;
}

export interface CategorySpecialization {
  category: string;
  uniqueLanguages: string[];
  specializationIndex: number;
  requirements: string[];
} 