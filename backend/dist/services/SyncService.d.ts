interface SyncResult {
    success: boolean;
    totalJobs: number;
    processedJobs: number;
    duration: number;
    error?: string;
}
export declare class SyncService {
    private classifier;
    constructor();
    fullSync(): Promise<SyncResult>;
    private processJob;
    private precomputeAnalytics;
    private computeOverviewMetrics;
    private computeCategoryAnalytics;
    private computeAgencyAnalytics;
    private computeTemporalTrends;
    private computeWorkforceAnalytics;
    private computeSkillsAnalytics;
    private computeCompetitiveIntelligence;
    private calculateMarketConcentration;
    private parseDate;
    private formatDate;
    private getLocationType;
    private extractSkillDomains;
    getSyncStatus(): any;
}
export default SyncService;
//# sourceMappingURL=SyncService.d.ts.map