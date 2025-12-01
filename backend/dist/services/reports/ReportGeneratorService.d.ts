import { GenerateReportRequest, GenerateReportResponse, ReportData } from '../../types/reports';
export declare class ReportGeneratorService {
    private dataAggregator;
    private insightGenerator;
    private pdfGenerator;
    private reportsDir;
    constructor();
    generateReport(request: GenerateReportRequest): Promise<GenerateReportResponse>;
    getReportData(reportId: string): Promise<ReportData | null>;
    getPDFDefinition(reportId: string): Promise<object | null>;
    listReports(): Promise<{
        reportId: string;
        agency: string;
        generatedAt: string;
    }[]>;
    deleteReport(reportId: string): Promise<boolean>;
    getAvailableAgencies(): Promise<{
        agency: string;
        jobCount: number;
    }[]>;
    private formatDisplayPeriod;
    private getRawJobData;
}
export default ReportGeneratorService;
//# sourceMappingURL=ReportGeneratorService.d.ts.map