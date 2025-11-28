import { JobData, ClassificationResult } from '../types';
export declare class ClassificationService {
    private static instance;
    static getInstance(): ClassificationService;
    classifyJob(job: JobData): ClassificationResult;
    private checkLeadershipOverride;
    private createResult;
    private extractJobContent;
    private scoreAllCategories;
    private scoreCategory;
    private countKeywordOccurrences;
    private findMatches;
    private generateFlags;
    private generateReasoning;
    private createFallbackResult;
}
//# sourceMappingURL=ClassificationService.d.ts.map