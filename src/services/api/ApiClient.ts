// API Client for backend integration
import { ProcessedJobData } from '../../types';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface GetJobsQuery {
  page?: number;
  limit?: number;
  category?: string;
  agency?: string;
  confidence_min?: number;
  confidence_max?: number;
  user_corrected?: boolean;
  search?: string;
  status?: 'active' | 'expired' | 'closing_soon' | 'archived' | 'all';
  sort_by?: 'date' | 'confidence' | 'title' | 'posting_date' | 'classified_at';
  sort_order?: 'asc' | 'desc';
}

interface UpdateCategoryRequest {
  primary_category: string;
  user_id?: string;
  reason?: string;
}

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Jobs API
  async getJobs(query: GetJobsQuery = {}): Promise<PaginatedResponse<ProcessedJobData>> {
    const searchParams = new URLSearchParams();
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const endpoint = `/jobs${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.request<PaginatedResponse<ProcessedJobData>>(endpoint);
  }

  async getJobById(id: number): Promise<ApiResponse<ProcessedJobData>> {
    return this.request<ApiResponse<ProcessedJobData>>(`/jobs/${id}`);
  }

  async updateJobCategory(
    jobId: number, 
    categoryData: UpdateCategoryRequest
  ): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/jobs/${jobId}/category`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  }

  async classifyJob(jobId: number, forceReclassify = false): Promise<ApiResponse> {
    return this.request<ApiResponse>('/jobs/classify', {
      method: 'POST',
      body: JSON.stringify({ job_id: jobId, force_reclassify: forceReclassify }),
    });
  }

  async batchClassifyJobs(limit = 100): Promise<ApiResponse> {
    return this.request<ApiResponse>('/jobs/classify/batch', {
      method: 'POST',
      body: JSON.stringify({ limit }),
    });
  }

  async getClassificationStats(): Promise<ApiResponse> {
    return this.request<ApiResponse>('/jobs/stats/classification');
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return this.request<ApiResponse>('/health');
  }

  // Test backend connectivity
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.healthCheck();
      return response.success;
    } catch (error) {
      console.error('Backend connection test failed:', error);
      return false;
    }
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Helper function to check if backend is available
export const isBackendAvailable = async (): Promise<boolean> => {
  return apiClient.testConnection();
};

// Export types for use in components
export type { 
  ApiResponse, 
  PaginatedResponse, 
  GetJobsQuery, 
  UpdateCategoryRequest 
};
