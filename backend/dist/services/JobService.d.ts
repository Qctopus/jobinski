import { JobData, ClassificationResult, GetJobsQuery, PaginatedResponse, ClassificationStats } from '../types';
export declare class JobService {
    private classificationService;
    constructor();
    getJobs(query?: GetJobsQuery): Promise<PaginatedResponse<JobData>>;
    getJobById(id: number): Promise<JobData | null>;
    classifyJob(jobId: number, forceReclassify?: boolean): Promise<ClassificationResult>;
    updateJobCategory(jobId: number, primaryCategory: string, userId?: string, reason?: string): Promise<void>;
    getClassificationStats(): Promise<ClassificationStats>;
    batchClassifyJobs(limit?: number): Promise<{
        processed: number;
        errors: number;
    }>;
    private saveClassification;
    private mapRowToJob;
}
export default JobService;
//# sourceMappingURL=JobService.d.ts.map