/**
 * DashboardApi - Frontend API client for the new backend endpoints
 * All analytics are pre-computed on the backend for instant loading
 * Falls back to static data when backend is unavailable (Vercel static hosting)
 */

// Detect production environment
const isProduction = process.env.NODE_ENV === 'production' || 
                     window.location.hostname !== 'localhost';
const API_BASE = process.env.REACT_APP_API_URL || (isProduction ? '/api' : 'http://localhost:5000/api');
const STATIC_DATA_URL = '/data/jobs.json';

// Debug log for API configuration
console.log(`🔌 API configured: isProduction=${isProduction}, API_BASE=${API_BASE}`);

// Cache for static data
let staticJobsCache: any[] | null = null;

async function loadStaticData(): Promise<any[]> {
  if (staticJobsCache) return staticJobsCache;
  
  try {
    const response = await fetch(STATIC_DATA_URL);
    if (!response.ok) throw new Error('Failed to load static data');
    staticJobsCache = await response.json();
    console.log(`📦 Loaded ${staticJobsCache?.length || 0} jobs from static data`);
    return staticJobsCache || [];
  } catch (error) {
    console.error('Failed to load static data:', error);
    return [];
  }
}

function computeAnalyticsFromJobs(jobs: any[], agencyFilter?: string) {
  const filteredJobs = agencyFilter && agencyFilter !== 'all' 
    ? jobs.filter(j => j.short_agency === agencyFilter || j.long_agency?.includes(agencyFilter))
    : jobs;

  const categoryMap = new Map<string, number>();
  filteredJobs.forEach(job => {
    const cat = job.primary_category || 'Other';
    categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
  });
  const categories = Array.from(categoryMap.entries())
    .map(([name, count]) => ({ name, count, percentage: (count / Math.max(1, filteredJobs.length)) * 100 }))
    .sort((a, b) => b.count - a.count);

  const agencyMap = new Map<string, number>();
  jobs.forEach(job => {
    const agency = job.short_agency || 'Unknown';
    agencyMap.set(agency, (agencyMap.get(agency) || 0) + 1);
  });
  const agencies = Array.from(agencyMap.entries())
    .map(([name, count]) => ({ name, count, percentage: (count / Math.max(1, jobs.length)) * 100 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const gradeMap = new Map<string, number>();
  filteredJobs.forEach(job => {
    const grade = job.up_grade || 'Unknown';
    gradeMap.set(grade, (gradeMap.get(grade) || 0) + 1);
  });
  const grades = Array.from(gradeMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const locationMap = new Map<string, number>();
  filteredJobs.forEach(job => {
    const location = job.duty_country || job.duty_station || 'Unknown';
    locationMap.set(location, (locationMap.get(location) || 0) + 1);
  });

  const now = new Date();
  const activeJobs = filteredJobs.filter(j => {
    if (!j.apply_until) return true;
    return new Date(j.apply_until) >= now;
  });

  return {
    overview: {
      totalJobs: filteredJobs.length,
      activeJobs: activeJobs.length,
      totalAgencies: agencyMap.size,
      uniqueLocations: locationMap.size,
      avgApplicationWindow: 30
    },
    categories,
    agencies,
    grades,
    temporal: { monthly: [], weekly: [] },
    workforce: { grades, seniorityDistribution: [] },
    skills: { topSkills: [], emergingSkills: [] },
    competitive: { marketShare: agencies }
  };
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  cached?: boolean;
  timestamp: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
}

interface JobQuery {
  page?: number;
  limit?: number;
  category?: string;
  agency?: string;
  search?: string;
  status?: 'active' | 'expired' | 'closing_soon' | 'archived' | 'all';
  country?: string;
  grade?: string;
  sort_by?: 'posting_date' | 'confidence' | 'title' | 'days_remaining';
  sort_order?: 'asc' | 'desc';
}

class DashboardApi {
  private baseUrl: string;
  private useStaticFallback: boolean = false;

  constructor() {
    this.baseUrl = `${API_BASE}/dashboard`;
  }

  private async request<T>(endpoint: string): Promise<T> {
    // If we've already determined backend is unavailable, use static fallback
    if (this.useStaticFallback) {
      throw new Error('Using static fallback');
    }
    
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, { 
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      // Check if we got HTML instead of JSON (Vercel serving React app)
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('text/html')) {
        console.warn('🔄 Backend returned HTML, switching to static fallback');
        this.useStaticFallback = true;
        throw new Error('Using static fallback');
      }
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * Get all dashboard data in one request (for initial load)
   * Falls back to computing from static data if backend unavailable
   */
  async getAllDashboardData(agency?: string): Promise<ApiResponse> {
    try {
      const params = agency && agency !== 'all' ? `?agency=${encodeURIComponent(agency)}` : '';
      return await this.request(`/all${params}`);
    } catch {
      // Fallback to static data
      console.log('📦 Using static data fallback for dashboard');
      const jobs = await loadStaticData();
      const analytics = computeAnalyticsFromJobs(jobs, agency);
      return {
        success: true,
        data: analytics,
        cached: true,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get sync status to check if data is available
   * Falls back to static data check if backend unavailable
   */
  async getSyncStatus(): Promise<ApiResponse<{
    hasData: boolean;
    needsSync: boolean;
    last_sync_at: string;
    total_jobs: number;
    status: string;
  }>> {
    try {
      return await this.request('/sync-status');
    } catch {
      // Fallback: check if static data is available
      console.log('📦 Using static data fallback for sync status');
      const jobs = await loadStaticData();
      return {
        success: true,
        data: {
          hasData: jobs.length > 0,
          needsSync: false,
          last_sync_at: new Date().toISOString(),
          total_jobs: jobs.length,
          status: 'static'
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get overview metrics
   */
  async getOverview(agency?: string): Promise<ApiResponse> {
    const params = agency && agency !== 'all' ? `?agency=${encodeURIComponent(agency)}` : '';
    return this.request(`/overview${params}`);
  }

  /**
   * Get category analytics
   */
  async getCategoryAnalytics(): Promise<ApiResponse> {
    return this.request('/categories');
  }

  /**
   * Get agency analytics
   */
  async getAgencyAnalytics(): Promise<ApiResponse> {
    return this.request('/agencies');
  }

  /**
   * Get temporal trends
   */
  async getTemporalTrends(): Promise<ApiResponse> {
    return this.request('/temporal');
  }

  /**
   * Get workforce analytics
   */
  async getWorkforceAnalytics(): Promise<ApiResponse> {
    return this.request('/workforce');
  }

  /**
   * Get skills analytics
   */
  async getSkillsAnalytics(): Promise<ApiResponse> {
    return this.request('/skills');
  }

  /**
   * Get competitive intelligence
   */
  async getCompetitiveIntelligence(): Promise<ApiResponse> {
    return this.request('/competitive');
  }

  /**
   * Get paginated jobs with filters
   * Falls back to static data if backend unavailable
   */
  async getJobs(query: JobQuery = {}): Promise<PaginatedResponse<any>> {
    try {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
      const queryString = params.toString();
      return await this.request(`/jobs${queryString ? `?${queryString}` : ''}`);
    } catch {
      // Fallback to static data
      console.log('📦 Using static data fallback for jobs');
      const jobs = await loadStaticData();
      const page = query.page || 1;
      const limit = query.limit || 50000;
      const start = (page - 1) * limit;
      const paginatedJobs = jobs.slice(start, start + limit);
      
      return {
        success: true,
        data: paginatedJobs,
        pagination: {
          page,
          limit,
          total: jobs.length,
          totalPages: Math.ceil(jobs.length / limit)
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get single job by ID
   */
  async getJobById(id: number): Promise<ApiResponse> {
    return this.request(`/jobs/${id}`);
  }

  /**
   * Get filter options (categories, agencies, etc.)
   */
  async getFilterOptions(): Promise<ApiResponse> {
    return this.request('/filters');
  }

  /**
   * Trigger a sync from PostgreSQL (admin function)
   */
  async triggerSync(): Promise<ApiResponse> {
    const response = await fetch(`${this.baseUrl}/sync`, { method: 'POST' });
    return response.json();
  }
}

// Export singleton instance
export const dashboardApi = new DashboardApi();
export default dashboardApi;










