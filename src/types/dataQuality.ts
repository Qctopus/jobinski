/**
 * Data Quality Types for Admin Data Quality Monitor
 * 
 * These types support the diagnostic monitoring of the 11-step pipeline:
 * backup → scraper → extractor → geo → jobexp → lang → clean → labelor → bertizer → categorizer → import
 */

// Pipeline step identifiers
export type PipelineStep = 
  | 'scraper'      // HTML collection
  | 'extractor'    // Data extraction from HTML
  | 'geo'          // Geographic mapping
  | 'jobexp'       // Experience analysis (Azure OpenAI)
  | 'lang'         // Language analysis (Azure OpenAI)
  | 'clean'        // Data cleaning
  | 'labelor'      // Label generation (Azure OpenAI)
  | 'bertizer'     // BERT vectorization
  | 'categorizer'  // Category classification (Azure OpenAI)
  | 'import';      // Database import

// Issue severity levels
export type IssueSeverity = 'critical' | 'warning' | 'info';

// Issue categories
export type IssueType = 
  | 'non_english_content'
  | 'short_description'
  | 'empty_description'
  | 'boilerplate_content'
  | 'truncated_content'
  | 'empty_labels'
  | 'empty_vectorized'
  | 'unmatched_duty_station'
  | 'missing_country'
  | 'missing_continent'
  | 'invalid_grade'
  | 'missing_grade'
  | 'missing_title'
  | 'missing_duty_station'
  | 'date_parse_error'
  | 'date_anomaly'
  | 'future_posting_date'
  | 'deadline_before_posted'
  | 'potential_duplicate'
  | 'same_uniquecode'
  | 'low_classification_confidence'
  | 'null_sectoral_category'
  | 'null_experience_fields'
  | 'empty_languages'
  | 'unknown_agency';

// Detected language codes
export type DetectedLanguage = 'en' | 'fr' | 'es' | 'ar' | 'pt' | 'zh' | 'ru' | 'other' | 'unknown';

// Individual job issue
export interface DataQualityIssue {
  id: string;
  jobId: string;
  issueType: IssueType;
  severity: IssueSeverity;
  field: string;
  currentValue: string | number | null;
  suggestedValue?: string | number;
  message: string;
  likelyStep: PipelineStep;
  recommendation: string;
  detectedAt: Date;
}

// Per-job quality assessment
export interface JobQualityAssessment {
  jobId: string;
  agency: string;
  title: string;
  issues: DataQualityIssue[];
  qualityScore: DataQualityScore;
  detectedLanguage: DetectedLanguage;
  languageConfidence: number;
}

// Quality score breakdown
export interface DataQualityScore {
  overall: number;           // 0-100
  completeness: number;      // Required fields present
  accuracy: number;          // Values are valid
  consistency: number;       // No duplicates, normalized values
  classification: number;    // ML classification confidence
}

// Pipeline step diagnostic info
export interface PipelineStepDiagnostic {
  step: PipelineStep;
  scriptPattern: string;
  failureIndicators: string[];
  affectedFields: string[];
  severity: IssueSeverity;
  recommendation: string;
}

// Per-agency quality stats
export interface AgencyQualityStats {
  agency: string;
  totalJobs: number;
  qualityScore: number;
  issuesByType: Record<IssueType, number>;
  issuesByStep: Record<PipelineStep, number>;
  languageBreakdown: Record<DetectedLanguage, number>;
  lastProcessed?: string;
}

// Per-step issue counts for agency pipeline view
export interface AgencyPipelineHealth {
  agency: string;
  lastRun: string;
  jobsProcessed: number;
  healthScore: number;
  stepIssues: {
    scraper: number;
    extractor: number;
    geo: number;
    jobexp: number;
    lang: number;
    clean: number;
    labelor: number;
    bertizer: number;
    categorizer: number;
    import: number;
  };
}

// Duplicate group
export interface DuplicateGroup {
  type: 'same_uniquecode' | 'same_title_agency_location' | 'high_similarity';
  jobs: {
    id: string;
    title: string;
    agency: string;
    dutyStation: string;
    postingDate: string;
    applyUntil: string;
    status: string;
    uniquecode?: string;
  }[];
  recommendation: string;
}

// Unmapped location
export interface UnmappedLocation {
  dutyStation: string;
  count: number;
  suggestedMapping?: {
    city: string;
    country: string;
    continent?: string;
  };
}

// Unrecognized grade format
export interface UnrecognizedGrade {
  gradeValue: string;
  count: number;
  suggestedInterpretation?: string;
}

// Date anomaly
export interface DateAnomaly {
  jobId: string;
  agency: string;
  postingDate: string | null;
  applyUntil: string | null;
  issueType: 'missing_posting' | 'missing_deadline' | 'deadline_before_posted' | 'future_posting' | 'invalid_format';
}

// Azure OpenAI failure pattern
export interface OpenAIFailurePattern {
  pattern: 'non_english' | 'rate_limit' | 'short_input' | 'timeout' | 'unknown';
  count: number;
  percentage: number;
  affectedAgencies: { agency: string; count: number }[];
  description: string;
  solution: string;
}

// Language issue summary
export interface LanguageIssueSummary {
  totalNonEnglish: number;
  byLanguage: Record<DetectedLanguage, number>;
  byAgency: { agency: string; count: number; breakdown: Record<DetectedLanguage, number> }[];
  impactCorrelation: {
    emptyLabels: { french: number; spanish: number; arabic: number; english: number };
    nullCategory: { french: number; spanish: number; arabic: number; english: number };
  };
}

// Content quality issue summary
export interface ContentIssueSummary {
  shortDescription: { count: number; samples: { id: string; title: string; length: number; preview: string }[] };
  emptyDescription: { count: number; samples: { id: string; title: string }[] };
  boilerplateContent: { count: number; phrases: { phrase: string; occurrences: number }[] };
  emptyLabels: { count: number };
  missingRequirements: { count: number };
}

// Scraper/Extractor failure summary
export interface ScraperExtractorSummary {
  totalIssues: number;
  byIssueType: {
    shortDescription: number;
    boilerplateOnly: number;
    missingCriticalFields: number;
    truncatedContent: number;
  };
  byAgency: { agency: string; count: number; percentage: number }[];
  samples: {
    id: string;
    agency: string;
    title: string | null;
    descLength: number;
    issue: string;
  }[];
}

// Overall data quality summary
export interface DataQualitySummary {
  totalJobs: number;
  cleanJobs: number;
  jobsWithIssues: number;
  criticalIssues: number;
  warningIssues: number;
  infoIssues: number;
  
  overallScore: number;
  trend: 'improving' | 'stable' | 'declining';
  
  byIssueType: Record<IssueType, number>;
  bySeverity: Record<IssueSeverity, number>;
  byAgency: AgencyQualityStats[];
  byPipelineStep: Record<PipelineStep, number>;
  
  languageIssues: LanguageIssueSummary;
  contentIssues: ContentIssueSummary;
  scraperExtractorIssues: ScraperExtractorSummary;
  duplicateGroups: DuplicateGroup[];
  unmappedLocations: UnmappedLocation[];
  unrecognizedGrades: UnrecognizedGrade[];
  dateAnomalies: DateAnomaly[];
  openAIFailurePatterns: OpenAIFailurePattern[];
  
  agencyPipelineHealth: AgencyPipelineHealth[];
  
  lastRefreshed: Date;
}

// Pipeline execution log entry (for correlation with Discord)
export interface PipelineExecutionEntry {
  timestamp: string;
  agency: string;
  status: 'success' | 'warning' | 'failed';
  jobsProcessed: number;
  issuesFound: number;
  duration: string;
  discordNotified: boolean;
}

// Filter options for the quality monitor
export interface QualityMonitorFilters {
  issueType?: IssueType;
  severity?: IssueSeverity;
  agency?: string;
  step?: PipelineStep;
  dateRange?: 'today' | 'week' | 'month' | 'all';
}

// Component props
export interface DataQualityMonitorProps {
  data: any[]; // ProcessedJobData[]
}

export interface HealthScoreCardProps {
  summary: DataQualitySummary;
}

export interface IssueSummaryCardsProps {
  summary: DataQualitySummary;
  onSelectIssue: (issueType: IssueType) => void;
}

export interface PipelineHealthPanelProps {
  agencyHealth: AgencyPipelineHealth[];
  openAIPatterns: OpenAIFailurePattern[];
}

export interface LanguageIssuesPanelProps {
  languageIssues: LanguageIssueSummary;
}

export interface ScraperExtractorPanelProps {
  issues: ScraperExtractorSummary;
}

export interface GeoMappingPanelProps {
  unmappedLocations: UnmappedLocation[];
  missingCountryCount: number;
  missingContinentCount: number;
}

export interface DuplicateDetectionPanelProps {
  duplicateGroups: DuplicateGroup[];
}

export interface ClassificationQualityPanelProps {
  data: any[];
  summary: DataQualitySummary;
}

export interface GradeDateValidationPanelProps {
  unrecognizedGrades: UnrecognizedGrade[];
  dateAnomalies: DateAnomaly[];
}

export interface AgencyQualityTableProps {
  agencyStats: AgencyQualityStats[];
}

// Constants
export const PIPELINE_STEPS: PipelineStep[] = [
  'scraper', 'extractor', 'geo', 'jobexp', 'lang', 
  'clean', 'labelor', 'bertizer', 'categorizer', 'import'
];

export const PIPELINE_STEP_LABELS: Record<PipelineStep, string> = {
  scraper: 'Scraper',
  extractor: 'Extractor',
  geo: 'Geo',
  jobexp: 'JobExp',
  lang: 'Lang',
  clean: 'Clean',
  labelor: 'Labelor',
  bertizer: 'BERT',
  categorizer: 'Categorizer',
  import: 'Import'
};

export const SEVERITY_COLORS: Record<IssueSeverity, string> = {
  critical: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6'
};

export const QUALITY_SCORE_COLORS = {
  excellent: '#22c55e',  // 90-100%
  good: '#84cc16',       // 80-89%
  fair: '#eab308',       // 70-79%
  poor: '#f97316',       // 60-69%
  critical: '#ef4444'    // <60%
};

// UN agency pipelines
export const UN_PIPELINES = [
  'UNDP', 'UNICEF', 'FAO', 'WHO', 'ILO', 
  'IFAD', 'UNESCO', 'UNHCR', 'WFP', 'UNC'
] as const;

// Boilerplate phrases to detect
export const BOILERPLATE_PHRASES = [
  'see attached',
  'see the attached',
  'refer to the attached',
  'refer to attached',
  'tor attached',
  'terms of reference available',
  'for full job description',
  'please consult',
  'please refer to',
  'see job description'
];







