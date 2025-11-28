/**
 * Enhanced type definitions with stronger type safety
 */
import { 
  NonEmptyString, 
  PositiveNumber, 
  ISO8601Date, 
  Percentage,
  Result,
  AsyncResult
} from './common';

// Enhanced enum types for better type safety
export const SkillDomains = ['Technical', 'Operational', 'Strategic', 'Mixed'] as const;
export type SkillDomain = typeof SkillDomains[number];

export const SeniorityLevels = ['Junior', 'Mid', 'Senior', 'Executive'] as const;
export type SeniorityLevel = typeof SeniorityLevels[number];

export const LocationTypes = ['Headquarters', 'Regional', 'Field', 'Home-based'] as const;
export type LocationType = typeof LocationTypes[number];

export const GradeLevels = ['Entry', 'Mid', 'Senior', 'Executive', 'Consultant', 'Other'] as const;
export type GradeLevel = typeof GradeLevels[number];

export const OrganizationLevels = ['Agency', 'Programme', 'Fund', 'Office'] as const;
export type OrganizationLevel = typeof OrganizationLevels[number];

export const SkillDemandLevels = ['High', 'Medium', 'Low'] as const;
export type SkillDemandLevel = typeof SkillDemandLevels[number];

export const TimeRanges = ['3months', '6months', '1year', '2years', 'all'] as const;
export type TimeRange = typeof TimeRanges[number];

export const CompetitiveIntensityLevels = ['High', 'Medium', 'Low'] as const;
export type CompetitiveIntensityLevel = typeof CompetitiveIntensityLevels[number];

// Strongly typed job data interface
export interface EnhancedJobData {
  readonly id: NonEmptyString;
  readonly url: string;
  readonly title: NonEmptyString;
  readonly description: string;
  readonly duty_station: NonEmptyString;
  readonly duty_country: string;
  readonly duty_continent: string;
  readonly country_code: string;
  readonly eligible_nationality: string;
  readonly hs_min_exp: PositiveNumber | null;
  readonly bachelor_min_exp: PositiveNumber | null;
  readonly master_min_exp: PositiveNumber | null;
  readonly up_grade: string;
  readonly pipeline: string;
  readonly department: string;
  readonly long_agency: string;
  readonly short_agency: string;
  readonly posting_date: ISO8601Date;
  readonly apply_until: ISO8601Date;
  readonly languages: string;
  readonly uniquecode: string;
  readonly ideal_candidate: string;
  readonly job_labels: string;
  readonly job_labels_vectorized: string;
  readonly job_candidate_vectorized: string;
  readonly created_at: ISO8601Date;
  readonly updated_at: ISO8601Date;
  readonly archived: boolean;
}

// Enhanced processed job data with stronger types
export interface EnhancedProcessedJobData extends EnhancedJobData {
  readonly application_window_days: PositiveNumber;
  readonly relevant_experience: PositiveNumber;
  readonly language_count: PositiveNumber;
  readonly is_home_based: boolean;
  readonly formatted_posting_date: string;
  readonly formatted_apply_until: string;
  readonly primary_category: NonEmptyString;
  readonly secondary_categories: readonly NonEmptyString[];
  readonly skill_domain: SkillDomain;
  readonly seniority_level: SeniorityLevel;
  readonly location_type: LocationType;
  readonly posting_month: string; // YYYY-MM format
  readonly posting_year: PositiveNumber;
  readonly posting_quarter: string; // YYYY-QN format
  readonly grade_level: GradeLevel;
  readonly grade_numeric: PositiveNumber;
  readonly is_consultant: boolean;
  readonly geographic_region: string;
  readonly geographic_subregion: string;
  readonly is_conflict_zone: boolean;
  readonly is_developing_country: boolean;
}

// Enhanced category data with validation
export interface EnhancedJobCategory {
  readonly id: NonEmptyString;
  readonly name: NonEmptyString;
  readonly keywords: readonly NonEmptyString[];
  readonly color: string; // Could be enhanced to HexColor type
  readonly description: NonEmptyString;
}

// Enhanced insights with stronger typing
export interface EnhancedCategoryData {
  readonly category: NonEmptyString;
  readonly count: PositiveNumber;
  readonly percentage: Percentage;
}

export interface EnhancedAgencyInsight {
  readonly agency: NonEmptyString;
  readonly longName: NonEmptyString;
  readonly totalJobs: PositiveNumber;
  readonly topCategories: readonly EnhancedCategoryData[];
  readonly growthRate: number; // Can be negative
  readonly specializations: readonly NonEmptyString[];
  readonly departments: readonly EnhancedDepartmentInsight[];
  readonly organizationLevel: OrganizationLevel;
  readonly parentOrganization?: NonEmptyString;
}

export interface EnhancedDepartmentInsight {
  readonly department: NonEmptyString;
  readonly agency: NonEmptyString;
  readonly totalJobs: PositiveNumber;
  readonly topCategories: readonly EnhancedCategoryData[];
  readonly avgGradeLevel: string;
  readonly locationTypes: readonly { 
    readonly type: LocationType; 
    readonly count: PositiveNumber; 
  }[];
  readonly specializationScore: Percentage;
}

export interface EnhancedCategoryInsight {
  readonly category: NonEmptyString;
  readonly totalJobs: PositiveNumber;
  readonly leadingAgency: NonEmptyString;
  readonly growthRate: number;
  readonly recentAppearances: PositiveNumber;
  readonly skillDemand: SkillDemandLevel;
  readonly agencies: readonly { 
    readonly agency: NonEmptyString; 
    readonly count: PositiveNumber; 
    readonly percentage: Percentage; 
  }[];
}

// Enhanced metrics interface
export interface EnhancedDashboardMetrics {
  readonly totalJobs: PositiveNumber;
  readonly totalAgencies: PositiveNumber;
  readonly totalDepartments: PositiveNumber;
  readonly topCategories: readonly EnhancedCategoryData[];
  readonly agencyInsights: readonly EnhancedAgencyInsight[];
  readonly departmentInsights: readonly EnhancedDepartmentInsight[];
  readonly categoryInsights: readonly EnhancedCategoryInsight[];
  readonly timeSeriesData: readonly EnhancedTimeSeriesData[];
  readonly emergingCategories: readonly {
    readonly category: NonEmptyString;
    readonly growthRate: number;
    readonly isNew: boolean;
  }[];
}

export interface EnhancedTimeSeriesData {
  readonly period: string; // YYYY-MM format
  readonly categories: Readonly<Record<string, PositiveNumber>>;
  readonly total: PositiveNumber;
}

// Enhanced filter options with validation
export interface EnhancedFilterOptions {
  readonly selectedAgency: string; // 'all' or agency name
  readonly timeRange: TimeRange;
  readonly startDate?: ISO8601Date;
  readonly endDate?: ISO8601Date;
}

// Service interfaces with proper error handling
export interface DataProcessingService {
  processJobData(jobs: EnhancedJobData[]): AsyncResult<EnhancedProcessedJobData[]>;
  calculateMetrics(data: EnhancedProcessedJobData[], filters: EnhancedFilterOptions): AsyncResult<EnhancedDashboardMetrics>;
  applyFilters(data: EnhancedProcessedJobData[], filters: EnhancedFilterOptions): Result<EnhancedProcessedJobData[]>;
}

// Component prop types with async states
export interface DashboardProps {
  readonly data: EnhancedProcessedJobData[];
}

export interface ComponentWithAsyncData<T> {
  readonly data: T | null;
  readonly loading: boolean;
  readonly error: Error | null;
  readonly onRetry?: () => void;
}

// Validation schemas (runtime type checking)
export interface ValidationSchema<T> {
  validate(data: unknown): Result<T>;
  validateAsync(data: unknown): AsyncResult<T>;
}

// Type for configuration objects
export interface AppConfiguration {
  readonly api: {
    readonly baseUrl: string;
    readonly timeout: PositiveNumber;
    readonly retryAttempts: PositiveNumber;
  };
  readonly performance: {
    readonly enableProfiling: boolean;
    readonly maxCacheSize: PositiveNumber;
    readonly cacheExpiryMinutes: PositiveNumber;
  };
  readonly features: {
    readonly enableAdvancedAnalytics: boolean;
    readonly enableRealTimeUpdates: boolean;
    readonly enableOfflineMode: boolean;
  };
}

// Analytics event types for better tracking
export type AnalyticsEvent = 
  | { type: 'data_processing_started'; dataSize: PositiveNumber }
  | { type: 'data_processing_completed'; duration: PositiveNumber; success: boolean }
  | { type: 'filter_applied'; filters: EnhancedFilterOptions }
  | { type: 'error_occurred'; error: Error; context: string }
  | { type: 'user_interaction'; component: string; action: string };

// Export legacy types for backward compatibility
export type { JobData, ProcessedJobData, FilterOptions, DashboardMetrics } from './index';

