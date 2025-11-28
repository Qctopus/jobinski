interface ClassificationResult {
    primary: string;
    confidence: number;
    secondary: Array<{
        category: string;
        confidence: number;
    }>;
    reasoning: string[];
}
interface ClassificationCategory {
    id: string;
    name: string;
    coreKeywords: string[];
    supportKeywords: string[];
    contextPairs: string[][];
}
export declare class JobClassificationService {
    classifyJob(job: {
        title: string;
        description: string;
        job_labels: string;
        up_grade: string;
    }): ClassificationResult;
    private isLeadershipPosition;
    getSeniorityLevel(grade: string, title: string): string;
    getCategoryById(id: string): ClassificationCategory | undefined;
    getAllCategories(): ClassificationCategory[];
}
export default JobClassificationService;
//# sourceMappingURL=JobClassificationService.d.ts.map