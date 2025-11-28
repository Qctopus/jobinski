import { JobData, GetJobsQuery, PaginatedResponse } from '../types';
export declare class ReadOnlyJobService {
    getJobs(query?: GetJobsQuery): Promise<PaginatedResponse<JobData>>;
    getJobById(id: number): Promise<JobData | null>;
    getBasicStats(): Promise<any>;
    getTableStructure(): Promise<any>;
    private calculateJobStatus;
    private mapRowToJob;
}
export default ReadOnlyJobService;
//# sourceMappingURL=ReadOnlyJobService.d.ts.map