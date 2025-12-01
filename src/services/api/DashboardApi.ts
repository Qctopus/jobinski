/**
 * DashboardApi - Frontend API client for the new backend endpoints
 * All analytics are pre-computed on the backend for instant loading
 * In production (Vercel), uses relative /api paths
 * In development, uses localhost:5000
 */

const isProduction = process.env.NODE_ENV === 'production';
const API_BASE = process.env.REACT_APP_API_URL || (isProduction ? '/api' : 'http://localhost:5000/api');

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

  constructor() {
    this.baseUrl = `${API_BASE}/dashboard`;
  }

  private async request<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url);
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
   * This is the main endpoint - returns everything pre-computed
   */
  async getAllDashboardData(agency?: string): Promise<ApiResponse> {
    const params = agency && agency !== 'all' ? `?agency=${encodeURIComponent(agency)}` : '';
    return this.request(`/all${params}`);
  }

  /**
   * Get sync status to check if data is available
   */
  async getSyncStatus(): Promise<ApiResponse<{
    hasData: boolean;
    needsSync: boolean;
    last_sync_at: string;
    total_jobs: number;
    status: string;
  }>> {
    return this.request('/sync-status');
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
   */
  async getJobs(query: JobQuery = {}): Promise<PaginatedResponse<any>> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    const queryString = params.toString();
    return this.request(`/jobs${queryString ? `?${queryString}` : ''}`);
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










