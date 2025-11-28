/**
 * Advanced Job Filters
 * Phase 2 Tab 7 implementation
 */
export interface AdvancedJobFilters {
  // Status Filters
  status?: 'active' | 'closing_soon' | 'expired' | 'all';
  days_remaining_range?: [number, number];
  
  // Temporal Filters
  posted_date_range?: [Date, Date];
  posted_period?: 'last_7_days' | 'last_30_days' | 'last_quarter' | 'custom';
  
  // Competition Filters
  competition_level?: 'low' | 'medium' | 'high';
  market_saturation?: 'undersupplied' | 'balanced' | 'oversupplied';
  
  // Strategic Filters
  strategic_category?: 'must_win' | 'selective' | 'maintenance';
  growth_trajectory?: 'emerging' | 'growing' | 'mature';
  
  // Classification Filters
  confidence_threshold?: number;
  needs_review?: boolean;
  
  // Standard filters
  agency?: string;
  category?: string;
  location_type?: string;
  seniority_level?: string;
  grade_level?: string;
  
  // Search
  search?: string;
}

/**
 * Job Insights for enhanced browser
 */
export interface JobInsights {
  job_id: string;
  
  // Competitive Context
  similar_jobs_open: number;
  agencies_competing: string[];
  historical_volume: {
    same_category_3m: number;
    same_agency_3m: number;
  };
  
  // Strategic Context
  category_trend: 'growing' | 'stable' | 'declining';
  urgency_level: 'urgent' | 'normal' | 'extended';
  
  // Application Timing
  optimal_application_window: string;
  competitive_pressure: 'high' | 'medium' | 'low';
}

/**
 * Job Comparison Data
 */
export interface JobComparison {
  jobs: string[]; // job IDs
  comparison_matrix: {
    [key: string]: any[];
  };
}




