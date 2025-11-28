interface GetJobsQuery {
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
export declare class LocalJobService {
    getJobs(query?: GetJobsQuery): PaginatedResponse<any>;
    getJobById(id: number): any;
    getFilterOptions(): any;
    getBasicStats(): any;
    hasData(): boolean;
    getSyncStatus(): any;
    private safeJsonParse;
}
export default LocalJobService;
//# sourceMappingURL=LocalJobService.d.ts.map