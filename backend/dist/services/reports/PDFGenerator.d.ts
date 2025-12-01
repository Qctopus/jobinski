import { ReportData } from '../../types/reports';
export declare class PDFGenerator {
    private chartGenerator;
    private publicDir;
    constructor(publicDir?: string);
    generatePDFDocument(reportData: ReportData): object;
    private generateCoverPage;
    private generateExecutiveSummary;
    private generateHiringActivitySection;
    private generateWorkforceSection;
    private generateStrategicSection;
    saveDefinition(reportData: ReportData, outputPath: string): void;
}
export default PDFGenerator;
//# sourceMappingURL=PDFGenerator.d.ts.map