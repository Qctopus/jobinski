// Shared types for the backend API

export interface JobData {
  id?: number;
  title: string;
  description: string;
  job_labels: string;
  short_agency: string;
  long_agency: string;
  duty_station: string;
  duty_country: string;
  duty_continent?: string;
  country_code?: string;
  eligible_nationality?: string;
  hs_min_exp?: number;
  bachelor_min_exp?: number;
  master_min_exp?: number;
  up_grade: string;
  pipeline?: string;
  department?: string;
  posting_date: string;
  apply_until: string;
  url?: string;
  languages?: string;
  uniquecode?: string;
  ideal_candidate?: string;
  job_labels_vectorized?: string;
  job_candidate_vectorized?: string;
  created_at?: string;
  updated_at?: string;
  sectoral_category?: string;

  // Classification fields (added in-memory, not in database)
  primary_category?: string;
  secondary_categories?: string[];
  classification_confidence?: number;
  classification_reasoning?: string[];
  is_user_corrected?: boolean;
  user_corrected_by?: string;
  user_corrected_at?: Date;
  classified_at?: Date;
  is_ambiguous_category?: boolean;
  emerging_terms_found?: string[];

  // Status fields (Phase 1.2)
  is_active?: boolean;
  is_expired?: boolean;
  days_remaining?: number;
  status?: 'active' | 'closing_soon' | 'expired' | 'archived';
  urgency?: 'urgent' | 'normal' | 'extended';
  archived?: boolean;
}

export interface ClassificationResult {
  primary: string;
  confidence: number;
  secondary: Array<{
    category: string;
    confidence: number;
  }>;
  reasoning: string[];
  flags: {
    lowConfidence?: boolean;
    ambiguous?: boolean;
    hybridCandidate?: boolean;
    emergingTerms?: string[];
  };
}

export interface UserFeedback {
  id?: number;
  job_id: number;
  original_category: string;
  corrected_category: string;
  user_id?: string;
  reason?: string;
  created_at?: Date;
}

export interface ClassificationStats {
  total_jobs: number;
  classified_jobs: number;
  user_corrected_jobs: number;
  avg_confidence: number;
  low_confidence_count: number;
  category_distribution: Record<string, number>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Request/Response types
export interface ClassifyJobRequest {
  job_id: number;
  force_reclassify?: boolean;
}

export interface UpdateCategoryRequest {
  primary_category: string;
  user_id?: string;
  reason?: string;
}

export interface SubmitFeedbackRequest {
  job_id: number;
  original_category: string;
  corrected_category: string;
  user_id?: string;
  reason?: string;
}

export interface GetJobsQuery {
  page?: number;
  limit?: number;
  category?: string;
  agency?: string;
  confidence_min?: number;
  confidence_max?: number;
  user_corrected?: boolean;
  search?: string;
  status?: 'active' | 'expired' | 'closing_soon' | 'archived' | 'all';
  sort_by?: 'date' | 'confidence' | 'title';
  sort_order?: 'asc' | 'desc';
}

