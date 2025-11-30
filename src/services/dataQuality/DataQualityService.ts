/**
 * DataQualityService - Analyzes job data for quality issues
 * 
 * Detects issues from the 11-step pipeline:
 * scraper → extractor → geo → jobexp → lang → clean → labelor → bertizer → categorizer → import
 */

import {
  DataQualitySummary,
  DataQualityIssue,
  DataQualityScore,
  JobQualityAssessment,
  AgencyQualityStats,
  AgencyPipelineHealth,
  DuplicateGroup,
  UnmappedLocation,
  UnrecognizedGrade,
  DateAnomaly,
  OpenAIFailurePattern,
  LanguageIssueSummary,
  ContentIssueSummary,
  ScraperExtractorSummary,
  PipelineStep,
  IssueType,
  IssueSeverity,
  DetectedLanguage,
  BOILERPLATE_PHRASES,
  UN_PIPELINES,
  PIPELINE_STEPS
} from '../../types/dataQuality';

// Language detection patterns (simplified - in production use a library like franc)
const LANGUAGE_PATTERNS: Record<DetectedLanguage, RegExp[]> = {
  fr: [
    /\b(le|la|les|un|une|des|du|de|et|ou|avec|pour|dans|sur|est|sont|fait|être|avoir)\b/gi,
    /\b(responsabilités|qualifications|compétences|expérience|poste|candidat)\b/gi,
    /\bà\s+l[ae]?\b/gi,
    /ç|é|è|ê|ë|ô|û|î|ï|œ/gi
  ],
  es: [
    /\b(el|la|los|las|un|una|unos|unas|de|del|en|con|por|para|que|como)\b/gi,
    /\b(responsabilidades|requisitos|experiencia|puesto|candidato|trabajo)\b/gi,
    /ñ|á|é|í|ó|ú|¿|¡/gi
  ],
  ar: [
    /[\u0600-\u06FF]/g, // Arabic Unicode range
  ],
  pt: [
    /\b(o|a|os|as|um|uma|de|do|da|em|com|por|para|que|como|não|são)\b/gi,
    /ã|õ|ç/gi
  ],
  zh: [
    /[\u4E00-\u9FFF]/g, // Chinese characters
  ],
  ru: [
    /[\u0400-\u04FF]/g, // Cyrillic
  ],
  en: [
    /\b(the|a|an|is|are|was|were|will|would|could|should|have|has|had|been)\b/gi,
    /\b(responsibilities|qualifications|requirements|experience|position|candidate)\b/gi
  ],
  other: [],
  unknown: []
};

// Valid grade patterns
const VALID_GRADE_PATTERNS = [
  /^P-?[1-7]$/i,
  /^D-?[1-2]$/i,
  /^G-?[1-7]$/i,
  /^NO-?[A-E]$/i,
  /^SB-?[1-5]$/i,
  /^LICA-?\d+$/i,
  /^IPSA-?\d+$/i,
  /^SC-?\d+$/i,
  /^UNV/i,
  /^Consultant/i,
  /^Intern/i,
  /^JPO/i,
  /^ASG/i,
  /^USG/i
];

export class DataQualityService {
  /**
   * Main entry point - analyze all jobs and generate quality summary
   */
  analyzeDataQuality(jobs: any[]): DataQualitySummary {
    const assessments = jobs.map(job => this.assessJob(job));
    
    const jobsWithIssues = assessments.filter(a => a.issues.length > 0);
    const criticalIssues = assessments.reduce((sum, a) => 
      sum + a.issues.filter(i => i.severity === 'critical').length, 0);
    const warningIssues = assessments.reduce((sum, a) => 
      sum + a.issues.filter(i => i.severity === 'warning').length, 0);
    const infoIssues = assessments.reduce((sum, a) => 
      sum + a.issues.filter(i => i.severity === 'info').length, 0);
    
    // Calculate overall score
    const avgScore = assessments.length > 0
      ? assessments.reduce((sum, a) => sum + a.qualityScore.overall, 0) / assessments.length
      : 100;
    
    // Aggregate by issue type
    const byIssueType = this.aggregateByIssueType(assessments);
    
    // Aggregate by severity
    const bySeverity: Record<IssueSeverity, number> = {
      critical: criticalIssues,
      warning: warningIssues,
      info: infoIssues
    };
    
    // Aggregate by pipeline step
    const byPipelineStep = this.aggregateByPipelineStep(assessments);
    
    // Agency stats
    const byAgency = this.calculateAgencyStats(assessments, jobs);
    
    // Pipeline health by agency
    const agencyPipelineHealth = this.calculateAgencyPipelineHealth(assessments, jobs);
    
    // Language issues
    const languageIssues = this.analyzeLanguageIssues(assessments, jobs);
    
    // Content issues
    const contentIssues = this.analyzeContentIssues(jobs);
    
    // Scraper/Extractor issues
    const scraperExtractorIssues = this.analyzeScraperExtractorIssues(jobs);
    
    // Duplicates
    const duplicateGroups = this.detectDuplicates(jobs);
    
    // Unmapped locations
    const unmappedLocations = this.findUnmappedLocations(jobs);
    
    // Unrecognized grades
    const unrecognizedGrades = this.findUnrecognizedGrades(jobs);
    
    // Date anomalies
    const dateAnomalies = this.findDateAnomalies(jobs);
    
    // OpenAI failure patterns
    const openAIFailurePatterns = this.analyzeOpenAIFailures(assessments, jobs);
    
    return {
      totalJobs: jobs.length,
      cleanJobs: jobs.length - jobsWithIssues.length,
      jobsWithIssues: jobsWithIssues.length,
      criticalIssues,
      warningIssues,
      infoIssues,
      overallScore: Math.round(avgScore * 10) / 10,
      trend: 'stable', // Would need historical data to determine
      byIssueType,
      bySeverity,
      byAgency,
      byPipelineStep,
      languageIssues,
      contentIssues,
      scraperExtractorIssues,
      duplicateGroups,
      unmappedLocations,
      unrecognizedGrades,
      dateAnomalies,
      openAIFailurePatterns,
      agencyPipelineHealth,
      lastRefreshed: new Date()
    };
  }
  
  /**
   * Assess a single job for quality issues
   */
  assessJob(job: any): JobQualityAssessment {
    const issues: DataQualityIssue[] = [];
    const jobId = String(job.id);
    const agency = job.short_agency || job.long_agency || 'Unknown';
    
    // Detect language
    const { language, confidence } = this.detectLanguage(job);
    
    // Check scraper issues
    issues.push(...this.checkScraperIssues(job, jobId));
    
    // Check extractor issues
    issues.push(...this.checkExtractorIssues(job, jobId));
    
    // Check geo issues
    issues.push(...this.checkGeoIssues(job, jobId));
    
    // Check Azure OpenAI issues (jobexp, lang, labelor, categorizer)
    issues.push(...this.checkOpenAIIssues(job, jobId, language));
    
    // Check clean issues (dates, encoding)
    issues.push(...this.checkCleanIssues(job, jobId));
    
    // Check bertizer issues
    issues.push(...this.checkBertizerIssues(job, jobId));
    
    // Check classification quality
    issues.push(...this.checkClassificationQuality(job, jobId));
    
    // Calculate quality score
    const qualityScore = this.calculateQualityScore(job, issues);
    
    return {
      jobId,
      agency,
      title: job.title || '[No Title]',
      issues,
      qualityScore,
      detectedLanguage: language,
      languageConfidence: confidence
    };
  }
  
  /**
   * Detect the language of job content
   */
  detectLanguage(job: any): { language: DetectedLanguage; confidence: number } {
    const text = `${job.title || ''} ${job.description || ''}`.toLowerCase();
    
    if (!text.trim()) {
      return { language: 'unknown', confidence: 0 };
    }
    
    const scores: Record<DetectedLanguage, number> = {
      en: 0, fr: 0, es: 0, ar: 0, pt: 0, zh: 0, ru: 0, other: 0, unknown: 0
    };
    
    // Count pattern matches
    for (const [lang, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
      for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches) {
          scores[lang as DetectedLanguage] += matches.length;
        }
      }
    }
    
    // Normalize scores
    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    if (total === 0) {
      return { language: 'unknown', confidence: 0 };
    }
    
    // Find highest scoring language
    let maxLang: DetectedLanguage = 'en';
    let maxScore = 0;
    
    for (const [lang, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        maxLang = lang as DetectedLanguage;
      }
    }
    
    const confidence = maxScore / total;
    
    // Default to English if confidence is very low
    if (confidence < 0.3) {
      return { language: 'en', confidence: 0.5 };
    }
    
    return { language: maxLang, confidence };
  }
  
  /**
   * Check for scraper issues (HTML collection failures)
   */
  checkScraperIssues(job: any, jobId: string): DataQualityIssue[] {
    const issues: DataQualityIssue[] = [];
    const desc = (job.description || '').trim();
    const descLength = desc.length;
    
    // Empty description - critical scraper failure
    if (descLength === 0) {
      issues.push({
        id: `${jobId}-empty-desc`,
        jobId,
        issueType: 'empty_description',
        severity: 'critical',
        field: 'description',
        currentValue: null,
        message: 'Description is empty - scraper may have failed to load page',
        likelyStep: 'scraper',
        recommendation: 'Re-run scraper for this agency. Check Chrome/Selenium logs.',
        detectedAt: new Date()
      });
    } else if (descLength < 100) {
      issues.push({
        id: `${jobId}-short-desc`,
        jobId,
        issueType: 'short_description',
        severity: 'warning',
        field: 'description',
        currentValue: descLength,
        message: `Description only ${descLength} chars - page may not have loaded fully`,
        likelyStep: 'scraper',
        recommendation: 'Check scraper timeout settings and page load wait times.',
        detectedAt: new Date()
      });
    }
    
    // Boilerplate content
    const descLower = desc.toLowerCase();
    for (const phrase of BOILERPLATE_PHRASES) {
      if (descLower.includes(phrase) && descLength < 300) {
        issues.push({
          id: `${jobId}-boilerplate`,
          jobId,
          issueType: 'boilerplate_content',
          severity: 'warning',
          field: 'description',
          currentValue: phrase,
          message: `Description contains boilerplate: "${phrase}" - real content may be in attachment`,
          likelyStep: 'scraper',
          recommendation: 'Content may be in PDF/attachment not captured by scraper.',
          detectedAt: new Date()
        });
        break; // Only report once
      }
    }
    
    // Truncated content
    if (desc.endsWith('...') || desc.endsWith('…') || (desc.length > 50 && /[a-z,]\s*$/.test(desc))) {
      issues.push({
        id: `${jobId}-truncated`,
        jobId,
        issueType: 'truncated_content',
        severity: 'warning',
        field: 'description',
        currentValue: desc.slice(-50),
        message: 'Description appears truncated - page may have cut off',
        likelyStep: 'scraper',
        recommendation: 'Check scraper for content length limits or early termination.',
        detectedAt: new Date()
      });
    }
    
    return issues;
  }
  
  /**
   * Check for extractor issues (BeautifulSoup parsing failures)
   */
  checkExtractorIssues(job: any, jobId: string): DataQualityIssue[] {
    const issues: DataQualityIssue[] = [];
    
    // Missing title
    if (!job.title || job.title.trim() === '') {
      issues.push({
        id: `${jobId}-missing-title`,
        jobId,
        issueType: 'missing_title',
        severity: 'critical',
        field: 'title',
        currentValue: null,
        message: 'Title is missing - extractor selectors may be wrong',
        likelyStep: 'extractor',
        recommendation: 'Check extractor_ORG.py for title extraction selectors.',
        detectedAt: new Date()
      });
    }
    
    // Missing duty station
    if (!job.duty_station || job.duty_station.trim() === '') {
      issues.push({
        id: `${jobId}-missing-station`,
        jobId,
        issueType: 'missing_duty_station',
        severity: 'critical',
        field: 'duty_station',
        currentValue: null,
        message: 'Duty station missing - check extractor field mapping',
        likelyStep: 'extractor',
        recommendation: 'Review extractor_ORG.py for duty station selectors.',
        detectedAt: new Date()
      });
    }
    
    return issues;
  }
  
  /**
   * Check for geo mapping issues
   */
  checkGeoIssues(job: any, jobId: string): DataQualityIssue[] {
    const issues: DataQualityIssue[] = [];
    
    // Has duty station but missing country
    if (job.duty_station && job.duty_station.trim() !== '' && 
        (!job.duty_country || job.duty_country.trim() === '')) {
      issues.push({
        id: `${jobId}-missing-country`,
        jobId,
        issueType: 'missing_country',
        severity: 'warning',
        field: 'duty_country',
        currentValue: job.duty_station,
        message: `Duty station "${job.duty_station}" not mapped to country`,
        likelyStep: 'geo',
        recommendation: 'Add city/country mapping to geo_ORG.py.',
        detectedAt: new Date()
      });
    }
    
    // Has country but missing continent
    if (job.duty_country && job.duty_country.trim() !== '' &&
        (!job.duty_continent || job.duty_continent.trim() === '')) {
      issues.push({
        id: `${jobId}-missing-continent`,
        jobId,
        issueType: 'missing_continent',
        severity: 'info',
        field: 'duty_continent',
        currentValue: job.duty_country,
        message: `Country "${job.duty_country}" not mapped to continent`,
        likelyStep: 'geo',
        recommendation: 'Add country/continent mapping to geo_ORG.py.',
        detectedAt: new Date()
      });
    }
    
    return issues;
  }
  
  /**
   * Check for Azure OpenAI related issues (jobexp, lang, labelor, categorizer)
   */
  checkOpenAIIssues(job: any, jobId: string, detectedLang: DetectedLanguage): DataQualityIssue[] {
    const issues: DataQualityIssue[] = [];
    
    // jobexp: All experience fields null
    if (job.hs_min_exp === null && 
        job.bachelor_min_exp === null && 
        job.master_min_exp === null) {
      issues.push({
        id: `${jobId}-null-exp`,
        jobId,
        issueType: 'null_experience_fields',
        severity: 'warning',
        field: 'experience',
        currentValue: null,
        message: 'All experience fields are null - Azure OpenAI (jobexp) may have failed',
        likelyStep: 'jobexp',
        recommendation: 'Check Azure OpenAI API logs and rate limits.',
        detectedAt: new Date()
      });
    }
    
    // lang: Empty languages
    if (!job.languages || job.languages.trim() === '') {
      issues.push({
        id: `${jobId}-empty-lang`,
        jobId,
        issueType: 'empty_languages',
        severity: 'info',
        field: 'languages',
        currentValue: null,
        message: 'Languages field is empty - Azure OpenAI (lang) may have failed',
        likelyStep: 'lang',
        recommendation: 'Not critical - many jobs don\'t specify languages.',
        detectedAt: new Date()
      });
    }
    
    // labelor: Empty job_labels
    if (!job.job_labels || job.job_labels.trim() === '') {
      const severity: IssueSeverity = detectedLang !== 'en' ? 'warning' : 'warning';
      issues.push({
        id: `${jobId}-empty-labels`,
        jobId,
        issueType: 'empty_labels',
        severity,
        field: 'job_labels',
        currentValue: null,
        message: `Job labels empty${detectedLang !== 'en' ? ` (detected ${detectedLang} content)` : ''} - Azure OpenAI (labelor) may have failed`,
        likelyStep: 'labelor',
        recommendation: detectedLang !== 'en' 
          ? 'Non-English content may cause labelor to fail. Consider pre-translation.'
          : 'Check Azure OpenAI API timeout or rate limit.',
        detectedAt: new Date()
      });
    }
    
    // categorizer: Null sectoral_category
    if (!job.sectoral_category || job.sectoral_category.trim() === '') {
      issues.push({
        id: `${jobId}-null-category`,
        jobId,
        issueType: 'null_sectoral_category',
        severity: 'warning',
        field: 'sectoral_category',
        currentValue: null,
        message: 'Sectoral category is null - Azure OpenAI (categorizer) may have failed',
        likelyStep: 'categorizer',
        recommendation: 'Job will use frontend ML classification as fallback.',
        detectedAt: new Date()
      });
    }
    
    return issues;
  }
  
  /**
   * Check for clean step issues (dates, encoding)
   */
  checkCleanIssues(job: any, jobId: string): DataQualityIssue[] {
    const issues: DataQualityIssue[] = [];
    
    // Date anomalies
    const postingDate = job.posting_date;
    const applyUntil = job.apply_until;
    const now = new Date();
    
    // Missing posting date
    if (!postingDate) {
      issues.push({
        id: `${jobId}-no-posting-date`,
        jobId,
        issueType: 'date_parse_error',
        severity: 'warning',
        field: 'posting_date',
        currentValue: null,
        message: 'Posting date is missing',
        likelyStep: 'clean',
        recommendation: 'Check date extraction and parsing in clean_ORG.py.',
        detectedAt: new Date()
      });
    } else {
      const postDate = new Date(postingDate);
      
      // Future posting date
      if (postDate > now) {
        issues.push({
          id: `${jobId}-future-posting`,
          jobId,
          issueType: 'future_posting_date',
          severity: 'warning',
          field: 'posting_date',
          currentValue: postingDate,
          message: 'Posting date is in the future',
          likelyStep: 'clean',
          recommendation: 'Check date format (DD/MM vs MM/DD) in clean_ORG.py.',
          detectedAt: new Date()
        });
      }
      
      // Deadline before posting
      if (applyUntil) {
        const deadlineDate = new Date(applyUntil);
        if (deadlineDate < postDate) {
          issues.push({
            id: `${jobId}-deadline-before`,
            jobId,
            issueType: 'deadline_before_posted',
            severity: 'warning',
            field: 'apply_until',
            currentValue: `Posted: ${postingDate}, Deadline: ${applyUntil}`,
            message: 'Apply deadline is before posting date',
            likelyStep: 'clean',
            recommendation: 'Dates may be swapped or in wrong format.',
            detectedAt: new Date()
          });
        }
      }
    }
    
    return issues;
  }
  
  /**
   * Check for bertizer issues
   */
  checkBertizerIssues(job: any, jobId: string): DataQualityIssue[] {
    const issues: DataQualityIssue[] = [];
    
    // Empty vectorized fields
    if ((!job.job_labels_vectorized || job.job_labels_vectorized.trim() === '') &&
        job.job_labels && job.job_labels.trim() !== '') {
      issues.push({
        id: `${jobId}-empty-vector`,
        jobId,
        issueType: 'empty_vectorized',
        severity: 'info',
        field: 'job_labels_vectorized',
        currentValue: null,
        message: 'Job has labels but no vectorized representation',
        likelyStep: 'bertizer',
        recommendation: 'BERT/spaCy processing may have failed due to memory or encoding issues.',
        detectedAt: new Date()
      });
    }
    
    return issues;
  }
  
  /**
   * Check classification quality
   */
  checkClassificationQuality(job: any, jobId: string): DataQualityIssue[] {
    const issues: DataQualityIssue[] = [];
    
    // Low confidence classification
    const confidence = job.classification_confidence || 50;
    if (confidence < 40) {
      issues.push({
        id: `${jobId}-low-confidence`,
        jobId,
        issueType: 'low_classification_confidence',
        severity: 'info',
        field: 'classification_confidence',
        currentValue: confidence,
        message: `Low classification confidence (${confidence}%) - may need manual review`,
        likelyStep: 'categorizer',
        recommendation: 'Consider manual review for ambiguous job classifications.',
        detectedAt: new Date()
      });
    }
    
    return issues;
  }
  
  /**
   * Calculate quality score for a job
   */
  calculateQualityScore(job: any, issues: DataQualityIssue[]): DataQualityScore {
    let completeness = 100;
    let accuracy = 100;
    let consistency = 100;
    let classification = job.classification_confidence || 50;
    
    // Completeness deductions
    if (!job.title) completeness -= 25;
    if (!job.description || (job.description || '').length < 100) completeness -= 20;
    if (!job.duty_station) completeness -= 15;
    if (!job.duty_country) completeness -= 10;
    if (!job.up_grade) completeness -= 10;
    if (!job.job_labels) completeness -= 10;
    if (!job.posting_date) completeness -= 5;
    if (!job.apply_until) completeness -= 5;
    
    // Accuracy deductions based on issues
    for (const issue of issues) {
      if (issue.severity === 'critical') {
        accuracy -= 15;
      } else if (issue.severity === 'warning') {
        accuracy -= 8;
      } else {
        accuracy -= 3;
      }
    }
    
    // Ensure bounds
    completeness = Math.max(0, Math.min(100, completeness));
    accuracy = Math.max(0, Math.min(100, accuracy));
    consistency = Math.max(0, Math.min(100, consistency));
    classification = Math.max(0, Math.min(100, classification));
    
    const overall = (completeness + accuracy + consistency + classification) / 4;
    
    return {
      overall: Math.max(0, Math.round(overall * 10) / 10),
      completeness,
      accuracy,
      consistency,
      classification
    };
  }
  
  /**
   * Aggregate issues by type
   */
  aggregateByIssueType(assessments: JobQualityAssessment[]): Record<IssueType, number> {
    const result: Record<string, number> = {};
    
    for (const assessment of assessments) {
      for (const issue of assessment.issues) {
        result[issue.issueType] = (result[issue.issueType] || 0) + 1;
      }
    }
    
    return result as Record<IssueType, number>;
  }
  
  /**
   * Aggregate issues by pipeline step
   */
  aggregateByPipelineStep(assessments: JobQualityAssessment[]): Record<PipelineStep, number> {
    const result: Record<string, number> = {};
    
    for (const step of PIPELINE_STEPS) {
      result[step] = 0;
    }
    
    for (const assessment of assessments) {
      for (const issue of assessment.issues) {
        result[issue.likelyStep] = (result[issue.likelyStep] || 0) + 1;
      }
    }
    
    return result as Record<PipelineStep, number>;
  }
  
  /**
   * Calculate per-agency statistics
   */
  calculateAgencyStats(assessments: JobQualityAssessment[], jobs: any[]): AgencyQualityStats[] {
    const agencyMap = new Map<string, {
      assessments: JobQualityAssessment[];
      jobs: any[];
    }>();
    
    // Group by agency
    for (let i = 0; i < assessments.length; i++) {
      const assessment = assessments[i];
      const job = jobs[i];
      const agency = assessment.agency;
      
      if (!agencyMap.has(agency)) {
        agencyMap.set(agency, { assessments: [], jobs: [] });
      }
      agencyMap.get(agency)!.assessments.push(assessment);
      agencyMap.get(agency)!.jobs.push(job);
    }
    
    // Calculate stats for each agency
    return Array.from(agencyMap.entries()).map(([agency, data]) => {
      const { assessments: agencyAssessments } = data;
      
      // Issue types
      const issuesByType: Record<string, number> = {};
      const issuesByStep: Record<string, number> = {};
      const languageBreakdown: Record<string, number> = {};
      
      let totalScore = 0;
      
      for (const assessment of agencyAssessments) {
        totalScore += assessment.qualityScore.overall;
        
        // Language
        languageBreakdown[assessment.detectedLanguage] = 
          (languageBreakdown[assessment.detectedLanguage] || 0) + 1;
        
        for (const issue of assessment.issues) {
          issuesByType[issue.issueType] = (issuesByType[issue.issueType] || 0) + 1;
          issuesByStep[issue.likelyStep] = (issuesByStep[issue.likelyStep] || 0) + 1;
        }
      }
      
      return {
        agency,
        totalJobs: agencyAssessments.length,
        qualityScore: Math.round((totalScore / agencyAssessments.length) * 10) / 10,
        issuesByType: issuesByType as Record<IssueType, number>,
        issuesByStep: issuesByStep as Record<PipelineStep, number>,
        languageBreakdown: languageBreakdown as Record<DetectedLanguage, number>
      };
    }).sort((a, b) => b.totalJobs - a.totalJobs);
  }
  
  /**
   * Calculate pipeline health by agency
   */
  calculateAgencyPipelineHealth(assessments: JobQualityAssessment[], jobs: any[]): AgencyPipelineHealth[] {
    const agencyMap = new Map<string, JobQualityAssessment[]>();
    
    for (const assessment of assessments) {
      if (!agencyMap.has(assessment.agency)) {
        agencyMap.set(assessment.agency, []);
      }
      agencyMap.get(assessment.agency)!.push(assessment);
    }
    
    return Array.from(agencyMap.entries()).map(([agency, agencyAssessments]) => {
      const stepIssues: Record<string, number> = {
        scraper: 0, extractor: 0, geo: 0, jobexp: 0, lang: 0,
        clean: 0, labelor: 0, bertizer: 0, categorizer: 0, import: 0
      };
      
      let totalScore = 0;
      
      for (const assessment of agencyAssessments) {
        totalScore += assessment.qualityScore.overall;
        for (const issue of assessment.issues) {
          stepIssues[issue.likelyStep]++;
        }
      }
      
      return {
        agency,
        lastRun: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        jobsProcessed: agencyAssessments.length,
        healthScore: Math.round(totalScore / agencyAssessments.length),
        stepIssues: stepIssues as any
      };
    }).sort((a, b) => a.healthScore - b.healthScore);
  }
  
  /**
   * Analyze language issues
   */
  analyzeLanguageIssues(assessments: JobQualityAssessment[], jobs: any[]): LanguageIssueSummary {
    const nonEnglish = assessments.filter(a => a.detectedLanguage !== 'en' && a.detectedLanguage !== 'unknown');
    
    const byLanguage: Record<DetectedLanguage, number> = {
      en: 0, fr: 0, es: 0, ar: 0, pt: 0, zh: 0, ru: 0, other: 0, unknown: 0
    };
    
    for (const assessment of assessments) {
      byLanguage[assessment.detectedLanguage]++;
    }
    
    // By agency
    const agencyLangMap = new Map<string, Record<DetectedLanguage, number>>();
    for (const assessment of nonEnglish) {
      if (!agencyLangMap.has(assessment.agency)) {
        agencyLangMap.set(assessment.agency, { en: 0, fr: 0, es: 0, ar: 0, pt: 0, zh: 0, ru: 0, other: 0, unknown: 0 });
      }
      agencyLangMap.get(assessment.agency)![assessment.detectedLanguage]++;
    }
    
    const byAgency = Array.from(agencyLangMap.entries())
      .map(([agency, breakdown]) => ({
        agency,
        count: Object.values(breakdown).reduce((a, b) => a + b, 0),
        breakdown
      }))
      .sort((a, b) => b.count - a.count);
    
    // Impact correlation - empty labels by language
    const frenchAssessments = assessments.filter(a => a.detectedLanguage === 'fr');
    const spanishAssessments = assessments.filter(a => a.detectedLanguage === 'es');
    const arabicAssessments = assessments.filter(a => a.detectedLanguage === 'ar');
    const englishAssessments = assessments.filter(a => a.detectedLanguage === 'en');
    
    const countEmptyLabels = (list: JobQualityAssessment[]) => 
      list.filter(a => a.issues.some(i => i.issueType === 'empty_labels')).length;
    
    const countNullCategory = (list: JobQualityAssessment[]) =>
      list.filter(a => a.issues.some(i => i.issueType === 'null_sectoral_category')).length;
    
    return {
      totalNonEnglish: nonEnglish.length,
      byLanguage,
      byAgency,
      impactCorrelation: {
        emptyLabels: {
          french: countEmptyLabels(frenchAssessments),
          spanish: countEmptyLabels(spanishAssessments),
          arabic: countEmptyLabels(arabicAssessments),
          english: countEmptyLabels(englishAssessments)
        },
        nullCategory: {
          french: countNullCategory(frenchAssessments),
          spanish: countNullCategory(spanishAssessments),
          arabic: countNullCategory(arabicAssessments),
          english: countNullCategory(englishAssessments)
        }
      }
    };
  }
  
  /**
   * Analyze content quality issues
   */
  analyzeContentIssues(jobs: any[]): ContentIssueSummary {
    const shortDescJobs = jobs.filter(j => {
      const len = (j.description || '').trim().length;
      return len > 0 && len < 100;
    });
    
    const emptyDescJobs = jobs.filter(j => !(j.description || '').trim());
    
    const emptyLabelsJobs = jobs.filter(j => !(j.job_labels || '').trim());
    
    const missingReqJobs = jobs.filter(j => !(j.ideal_candidate || '').trim() || 
      (j.ideal_candidate || '').trim().length < 50);
    
    // Detect boilerplate
    const boilerplateCounts: Record<string, number> = {};
    for (const job of jobs) {
      const desc = (job.description || '').toLowerCase();
      for (const phrase of BOILERPLATE_PHRASES) {
        if (desc.includes(phrase)) {
          boilerplateCounts[phrase] = (boilerplateCounts[phrase] || 0) + 1;
        }
      }
    }
    
    const boilerplateJobs = jobs.filter(j => {
      const desc = (j.description || '').toLowerCase();
      return BOILERPLATE_PHRASES.some(p => desc.includes(p)) && (j.description || '').length < 300;
    });
    
    return {
      shortDescription: {
        count: shortDescJobs.length,
        samples: shortDescJobs.slice(0, 10).map(j => ({
          id: String(j.id),
          title: j.title || '[No Title]',
          length: (j.description || '').length,
          preview: (j.description || '').slice(0, 50) + '...'
        }))
      },
      emptyDescription: {
        count: emptyDescJobs.length,
        samples: emptyDescJobs.slice(0, 10).map(j => ({
          id: String(j.id),
          title: j.title || '[No Title]'
        }))
      },
      boilerplateContent: {
        count: boilerplateJobs.length,
        phrases: Object.entries(boilerplateCounts)
          .map(([phrase, occurrences]) => ({ phrase, occurrences }))
          .sort((a, b) => b.occurrences - a.occurrences)
      },
      emptyLabels: { count: emptyLabelsJobs.length },
      missingRequirements: { count: missingReqJobs.length }
    };
  }
  
  /**
   * Analyze scraper/extractor issues
   */
  analyzeScraperExtractorIssues(jobs: any[]): ScraperExtractorSummary {
    const issues: any[] = [];
    
    for (const job of jobs) {
      const desc = (job.description || '').trim();
      const descLength = desc.length;
      
      if (descLength === 0) {
        issues.push({ job, type: 'emptyDescription' });
      } else if (descLength < 100) {
        issues.push({ job, type: 'shortDescription' });
      }
      
      const descLower = desc.toLowerCase();
      if (BOILERPLATE_PHRASES.some(p => descLower.includes(p)) && descLength < 300) {
        issues.push({ job, type: 'boilerplateOnly' });
      }
      
      if (!job.title || !job.duty_station) {
        issues.push({ job, type: 'missingCriticalFields' });
      }
      
      if (desc.endsWith('...') || desc.endsWith('…')) {
        issues.push({ job, type: 'truncatedContent' });
      }
    }
    
    // By agency
    const agencyCount: Record<string, number> = {};
    for (const { job } of issues) {
      const agency = job.short_agency || job.long_agency || 'Unknown';
      agencyCount[agency] = (agencyCount[agency] || 0) + 1;
    }
    
    const byAgency = Object.entries(agencyCount)
      .map(([agency, count]) => ({
        agency,
        count,
        percentage: Math.round((count / jobs.length) * 100)
      }))
      .sort((a, b) => b.count - a.count);
    
    return {
      totalIssues: issues.length,
      byIssueType: {
        shortDescription: issues.filter(i => i.type === 'shortDescription').length,
        boilerplateOnly: issues.filter(i => i.type === 'boilerplateOnly').length,
        missingCriticalFields: issues.filter(i => i.type === 'missingCriticalFields').length,
        truncatedContent: issues.filter(i => i.type === 'truncatedContent').length
      },
      byAgency,
      samples: issues.slice(0, 20).map(({ job, type }) => ({
        id: String(job.id),
        agency: job.short_agency || job.long_agency || 'Unknown',
        title: job.title,
        descLength: (job.description || '').length,
        issue: type
      }))
    };
  }
  
  /**
   * Detect duplicate jobs
   */
  detectDuplicates(jobs: any[]): DuplicateGroup[] {
    const groups: DuplicateGroup[] = [];
    
    // Same uniquecode
    const uniquecodeMap = new Map<string, any[]>();
    for (const job of jobs) {
      if (job.uniquecode) {
        if (!uniquecodeMap.has(job.uniquecode)) {
          uniquecodeMap.set(job.uniquecode, []);
        }
        uniquecodeMap.get(job.uniquecode)!.push(job);
      }
    }
    
    for (const [code, dupeJobs] of uniquecodeMap) {
      if (dupeJobs.length > 1) {
        groups.push({
          type: 'same_uniquecode',
          jobs: dupeJobs.map(j => ({
            id: String(j.id),
            title: j.title || '[No Title]',
            agency: j.short_agency || j.long_agency || 'Unknown',
            dutyStation: j.duty_station || '',
            postingDate: j.posting_date || '',
            applyUntil: j.apply_until || '',
            status: j.status || 'unknown',
            uniquecode: j.uniquecode
          })),
          recommendation: 'Same uniquecode - keep the most recent record.'
        });
      }
    }
    
    // Same title + agency + location
    const titleAgencyMap = new Map<string, any[]>();
    for (const job of jobs) {
      const key = `${(job.title || '').toLowerCase()}|${job.short_agency || ''}|${job.duty_station || ''}`;
      if (!titleAgencyMap.has(key)) {
        titleAgencyMap.set(key, []);
      }
      titleAgencyMap.get(key)!.push(job);
    }
    
    for (const [, dupeJobs] of titleAgencyMap) {
      if (dupeJobs.length > 1) {
        // Check if they're within 30 days of each other
        const dates = dupeJobs.map(j => new Date(j.posting_date)).filter(d => !isNaN(d.getTime()));
        if (dates.length >= 2) {
          const minDate = Math.min(...dates.map(d => d.getTime()));
          const maxDate = Math.max(...dates.map(d => d.getTime()));
          const daysDiff = (maxDate - minDate) / (1000 * 60 * 60 * 24);
          
          if (daysDiff < 30) {
            groups.push({
              type: 'same_title_agency_location',
              jobs: dupeJobs.map(j => ({
                id: String(j.id),
                title: j.title || '[No Title]',
                agency: j.short_agency || j.long_agency || 'Unknown',
                dutyStation: j.duty_station || '',
                postingDate: j.posting_date || '',
                applyUntil: j.apply_until || '',
                status: j.status || 'unknown'
              })),
              recommendation: 'Same title, agency, and location within 30 days - may be re-posted position.'
            });
          }
        }
      }
    }
    
    return groups.slice(0, 50); // Limit to top 50 groups
  }
  
  /**
   * Find unmapped locations
   */
  findUnmappedLocations(jobs: any[]): UnmappedLocation[] {
    const unmapped = new Map<string, number>();
    
    for (const job of jobs) {
      if (job.duty_station && job.duty_station.trim() && 
          (!job.duty_country || !job.duty_country.trim())) {
        const station = job.duty_station.trim();
        unmapped.set(station, (unmapped.get(station) || 0) + 1);
      }
    }
    
    return Array.from(unmapped.entries())
      .map(([dutyStation, count]) => ({
        dutyStation,
        count,
        suggestedMapping: this.suggestLocationMapping(dutyStation)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 30);
  }
  
  /**
   * Suggest mapping for unmapped location
   */
  suggestLocationMapping(station: string): { city: string; country: string; continent?: string } | undefined {
    const stationLower = station.toLowerCase();
    
    // Common French spellings
    const frenchMappings: Record<string, { city: string; country: string }> = {
      'genève': { city: 'Geneva', country: 'Switzerland' },
      'geneve': { city: 'Geneva', country: 'Switzerland' },
      'bruxelles': { city: 'Brussels', country: 'Belgium' },
      'vienne': { city: 'Vienna', country: 'Austria' },
      'copenhague': { city: 'Copenhagen', country: 'Denmark' },
      'addis abeba': { city: 'Addis Ababa', country: 'Ethiopia' },
    };
    
    if (frenchMappings[stationLower]) {
      return frenchMappings[stationLower];
    }
    
    // Special cases
    if (stationLower.includes('home') || stationLower.includes('remote')) {
      return { city: 'Remote', country: 'Global' };
    }
    
    if (stationLower.includes('multiple') || stationLower.includes('various')) {
      return { city: 'Multiple', country: 'Various' };
    }
    
    return undefined;
  }
  
  /**
   * Find unrecognized grade formats
   */
  findUnrecognizedGrades(jobs: any[]): UnrecognizedGrade[] {
    const unrecognized = new Map<string, number>();
    
    for (const job of jobs) {
      const grade = (job.up_grade || '').trim();
      if (grade && !this.isValidGrade(grade)) {
        unrecognized.set(grade, (unrecognized.get(grade) || 0) + 1);
      }
    }
    
    return Array.from(unrecognized.entries())
      .map(([gradeValue, count]) => ({
        gradeValue,
        count,
        suggestedInterpretation: this.suggestGradeInterpretation(gradeValue)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }
  
  /**
   * Check if grade format is recognized
   */
  isValidGrade(grade: string): boolean {
    return VALID_GRADE_PATTERNS.some(pattern => pattern.test(grade));
  }
  
  /**
   * Suggest interpretation for unrecognized grade
   */
  suggestGradeInterpretation(grade: string): string | undefined {
    const gradeLower = grade.toLowerCase();
    
    if (gradeLower.includes('professional')) return 'P-level (unspecified)';
    if (gradeLower.includes('senior')) return 'Senior level';
    if (gradeLower.includes('junior')) return 'Junior level';
    if (gradeLower.includes('entry')) return 'Entry level';
    if (gradeLower.includes('level not')) return 'Unknown';
    
    return undefined;
  }
  
  /**
   * Find date anomalies
   */
  findDateAnomalies(jobs: any[]): DateAnomaly[] {
    const anomalies: DateAnomaly[] = [];
    const now = new Date();
    
    for (const job of jobs) {
      const postingDate = job.posting_date;
      const applyUntil = job.apply_until;
      
      if (!postingDate) {
        anomalies.push({
          jobId: String(job.id),
          agency: job.short_agency || job.long_agency || 'Unknown',
          postingDate: null,
          applyUntil: applyUntil || null,
          issueType: 'missing_posting'
        });
        continue;
      }
      
      if (!applyUntil) {
        anomalies.push({
          jobId: String(job.id),
          agency: job.short_agency || job.long_agency || 'Unknown',
          postingDate,
          applyUntil: null,
          issueType: 'missing_deadline'
        });
        continue;
      }
      
      const postDate = new Date(postingDate);
      const deadlineDate = new Date(applyUntil);
      
      if (isNaN(postDate.getTime()) || isNaN(deadlineDate.getTime())) {
        anomalies.push({
          jobId: String(job.id),
          agency: job.short_agency || job.long_agency || 'Unknown',
          postingDate,
          applyUntil,
          issueType: 'invalid_format'
        });
        continue;
      }
      
      if (postDate > now) {
        anomalies.push({
          jobId: String(job.id),
          agency: job.short_agency || job.long_agency || 'Unknown',
          postingDate,
          applyUntil,
          issueType: 'future_posting'
        });
      }
      
      if (deadlineDate < postDate) {
        anomalies.push({
          jobId: String(job.id),
          agency: job.short_agency || job.long_agency || 'Unknown',
          postingDate,
          applyUntil,
          issueType: 'deadline_before_posted'
        });
      }
    }
    
    return anomalies.slice(0, 100);
  }
  
  /**
   * Analyze Azure OpenAI failure patterns
   */
  analyzeOpenAIFailures(assessments: JobQualityAssessment[], jobs: any[]): OpenAIFailurePattern[] {
    const patterns: OpenAIFailurePattern[] = [];
    
    // Count failures by type
    const nonEnglishFailures = assessments.filter(a => 
      a.detectedLanguage !== 'en' && 
      a.issues.some(i => ['empty_labels', 'null_sectoral_category'].includes(i.issueType))
    );
    
    const shortInputFailures = assessments.filter(a => {
      const job = jobs.find(j => String(j.id) === a.jobId);
      const descLength = (job?.description || '').length;
      return descLength < 100 && 
        a.issues.some(i => ['empty_labels', 'null_sectoral_category'].includes(i.issueType));
    });
    
    // Multiple failures suggest rate limit
    const multiFailures = assessments.filter(a => 
      a.issues.filter(i => 
        ['empty_labels', 'null_sectoral_category', 'null_experience_fields', 'empty_languages'].includes(i.issueType)
      ).length >= 3
    );
    
    const totalFailures = assessments.filter(a =>
      a.issues.some(i => ['empty_labels', 'null_sectoral_category'].includes(i.issueType))
    ).length;
    
    if (nonEnglishFailures.length > 0) {
      const agencyCounts: Record<string, number> = {};
      for (const a of nonEnglishFailures) {
        agencyCounts[a.agency] = (agencyCounts[a.agency] || 0) + 1;
      }
      
      patterns.push({
        pattern: 'non_english',
        count: nonEnglishFailures.length,
        percentage: Math.round((nonEnglishFailures.length / Math.max(totalFailures, 1)) * 100),
        affectedAgencies: Object.entries(agencyCounts)
          .map(([agency, count]) => ({ agency, count }))
          .sort((a, b) => b.count - a.count),
        description: 'Jobs in French/Spanish/Arabic where OpenAI returned poor output',
        solution: 'Pre-translate or use multilingual model'
      });
    }
    
    if (multiFailures.length > 0) {
      const agencyCounts: Record<string, number> = {};
      for (const a of multiFailures) {
        agencyCounts[a.agency] = (agencyCounts[a.agency] || 0) + 1;
      }
      
      patterns.push({
        pattern: 'rate_limit',
        count: multiFailures.length,
        percentage: Math.round((multiFailures.length / Math.max(totalFailures, 1)) * 100),
        affectedAgencies: Object.entries(agencyCounts)
          .map(([agency, count]) => ({ agency, count }))
          .sort((a, b) => b.count - a.count),
        description: 'Multiple consecutive jobs failed (same agency, same timestamp)',
        solution: 'Add retry logic, increase API quota'
      });
    }
    
    if (shortInputFailures.length > 0) {
      const agencyCounts: Record<string, number> = {};
      for (const a of shortInputFailures) {
        agencyCounts[a.agency] = (agencyCounts[a.agency] || 0) + 1;
      }
      
      patterns.push({
        pattern: 'short_input',
        count: shortInputFailures.length,
        percentage: Math.round((shortInputFailures.length / Math.max(totalFailures, 1)) * 100),
        affectedAgencies: Object.entries(agencyCounts)
          .map(([agency, count]) => ({ agency, count }))
          .sort((a, b) => b.count - a.count),
        description: 'Description too short for meaningful OpenAI analysis',
        solution: 'Root cause: Scraper issue (cascading failure)'
      });
    }
    
    return patterns.sort((a, b) => b.count - a.count);
  }
}

// Export singleton
export const dataQualityService = new DataQualityService();
export default dataQualityService;


