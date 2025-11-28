import { BaseProcessor } from '../core/BaseProcessor';
import { JobData, ProcessedJobData } from '../../types';
import {
  JOB_CLASSIFICATION_DICTIONARY,
  ClassificationResult,
  ClassificationCategory,
  CLASSIFICATION_CONFIG,
  LEADERSHIP_TITLE_INDICATORS,
  STOP_WORDS,
  HYBRID_PATTERNS,
  LearningMetrics,
  isLeadershipGrade
} from '../../dictionary';
// Note: Learning engine is now unified and handled at the UI level

/**
 * Enhanced Job Classifier using semi-dynamic learning approach
 * Replaces simple keyword matching with sophisticated scoring and confidence analysis
 */
export class EnhancedJobClassifier extends BaseProcessor {
  private emergingTermsCache: Map<string, number> = new Map();
  private classificationHistory: ClassificationResult[] = [];
  private lastLearningUpdate: Date = new Date();

  constructor() {
    super();
    console.log('Enhanced Job Classifier initialized');
  }

  /**
   * Main classification method with leadership override + keyword scoring
   */
  classifyJob(job: { title: string; description: string; job_labels: string; up_grade?: string; short_agency?: string }): ClassificationResult {
    const startTime = Date.now();

    try {
      // Extract and clean text content
      const content = this.extractJobContent(job);

      // OVERRIDE: Check for D2+ leadership positions first (using actual grade field)
      const leadershipOverride = this.checkLeadershipOverride(job, content);
      if (leadershipOverride && leadershipOverride.isLeadership) {
        const result = this.createResult('leadership-executive', 95, content, [`Leadership override: ${leadershipOverride.reason}`]);
        console.log(`Job classified via leadership override in ${Date.now() - startTime}ms: leadership-executive (95%)`);
        return result;
      }

      // For all other positions: use comprehensive keyword scoring
      const categoryScores = this.scoreAllCategories(content, job.short_agency);

      // Find primary classification
      const sortedScores = categoryScores.sort((a, b) => b.score - a.score);
      const primaryCategory = sortedScores[0];
      const secondaryCategories = sortedScores.slice(1, 4)
        .filter(s => s.score > 30) // Only include meaningful secondary scores
        .map(s => ({
          category: s.categoryId,
          confidence: Math.round(s.score)
        }));

      // Generate flags and analysis
      const flags = this.generateFlags(sortedScores, content);
      const reasoning = this.generateReasoning(primaryCategory, content);

      // Check for hybrid patterns
      const hybridCandidate = this.detectHybridPattern(sortedScores);
      if (hybridCandidate) {
        flags.hybridCandidate = true;
        reasoning.push(`Detected hybrid pattern: ${hybridCandidate}`);
      }

      const result: ClassificationResult = {
        primary: primaryCategory.categoryId,
        confidence: Math.round(primaryCategory.score),
        secondary: secondaryCategories,
        reasoning,
        flags
      };

      // Store for learning
      this.classificationHistory.push(result);

      this.logPerformance('Job Classification', startTime, 1);
      console.log(`Job classified via keyword scoring in ${Date.now() - startTime}ms: ${primaryCategory.categoryId} (${result.confidence}%)`);
      return result;

    } catch (error) {
      console.error('Classification failed', error);
      return this.createFallbackResult();
    }
  }

  /**
   * Check for title-based category overrides (strongest classification signal)
   */
  private checkTitleOverrides(title: string): { categoryId: string; confidence: number; reason: string } | null {
    const titleLower = title.toLowerCase();

    // Operations & Logistics patterns
    if (titleLower.includes('helper') && (titleLower.includes('cleaning') || titleLower.includes('maintenance'))) {
      return { categoryId: 'operations-logistics', confidence: 0.95, reason: 'helper/cleaning/maintenance role' };
    }
    if (titleLower.includes('driver') || titleLower.includes('logistic')) {
      return { categoryId: 'operations-logistics', confidence: 0.9, reason: 'driver/logistics role' };
    }

    // Digital & Technology patterns  
    if (titleLower.includes('developer') || titleLower.includes('programmer') || titleLower.includes('software engineer')) {
      return { categoryId: 'digital-technology', confidence: 0.95, reason: 'software development role' };
    }
    if (titleLower.includes('data scientist') || titleLower.includes('ai specialist')) {
      return { categoryId: 'digital-technology', confidence: 0.95, reason: 'data science/AI role' };
    }

    // Health & Medical patterns
    if (titleLower.includes('doctor') || titleLower.includes('physician') || titleLower.includes('nurse')) {
      return { categoryId: 'health-medical', confidence: 0.95, reason: 'medical professional role' };
    }
    if (titleLower.includes('medical officer') || titleLower.includes('health officer')) {
      return { categoryId: 'health-medical', confidence: 0.9, reason: 'health/medical officer role' };
    }

    // Education & Training patterns
    if (titleLower.includes('teacher') || titleLower.includes('professor') || titleLower.includes('instructor')) {
      return { categoryId: 'education-training', confidence: 0.95, reason: 'education professional role' };
    }
    if (titleLower.includes('education officer') || titleLower.includes('training specialist')) {
      return { categoryId: 'education-training', confidence: 0.9, reason: 'education/training specialist role' };
    }

    // Finance & Economic patterns
    if (titleLower.includes('accountant') || titleLower.includes('financial analyst') || titleLower.includes('budget')) {
      return { categoryId: 'economic-development', confidence: 0.9, reason: 'finance/accounting role' };
    }

    // Legal & Governance patterns
    if (titleLower.includes('lawyer') || titleLower.includes('legal officer') || titleLower.includes('attorney')) {
      return { categoryId: 'legal-governance', confidence: 0.95, reason: 'legal professional role' };
    }

    // Security & Safety patterns
    if (titleLower.includes('security officer') || titleLower.includes('safety officer')) {
      return { categoryId: 'security-safety', confidence: 0.9, reason: 'security/safety officer role' };
    }

    return null;
  }

  /**
   * Detect emerging terms that appear frequently but aren't in our dictionary
   */
  detectEmergingTerms(jobs: JobData[]): string[] {
    const termFrequency = new Map<string, number>();
    const knownTerms = this.getAllKnownTerms();

    jobs.forEach(job => {
      const content = this.extractJobContent(job);
      const words = this.extractSignificantTerms(content.combined);

      words.forEach(word => {
        if (!knownTerms.has(word.toLowerCase()) && !STOP_WORDS.has(word.toLowerCase())) {
          termFrequency.set(word, (termFrequency.get(word) || 0) + 1);
        }
      });
    });

    // Filter by threshold and sort by frequency
    const emergingTerms = Array.from(termFrequency.entries())
      .filter(([, count]) => count >= CLASSIFICATION_CONFIG.emergingTermThreshold)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([term]) => term);

    // Update cache
    emergingTerms.forEach(term => {
      this.emergingTermsCache.set(term, termFrequency.get(term) || 0);
    });

    console.log(`Detected ${emergingTerms.length} emerging terms`);
    return emergingTerms;
  }

  /**
   * Analyze overlaps between categories to identify hybrid patterns
   */
  analyzeCategoryOverlaps(jobs: ProcessedJobData[]): Array<{
    categories: string[];
    frequency: number;
    avgConfidence: number;
    examples: string[];
  }> {
    const overlapPatterns = new Map<string, {
      count: number;
      confidenceSum: number;
      examples: string[];
    }>();

    jobs.forEach(job => {
      // Re-classify to get confidence scores
      const classification = this.classifyJob({
        title: job.title,
        description: job.description,
        job_labels: job.job_labels
      });

      // Find categories with reasonable confidence
      const strongCategories = [
        { category: classification.primary, confidence: classification.confidence },
        ...classification.secondary.filter(s => s.confidence > 30)
      ];

      if (strongCategories.length > 1) {
        const categoryNames = strongCategories.map(c => c.category).sort();
        const key = categoryNames.join('|');

        if (!overlapPatterns.has(key)) {
          overlapPatterns.set(key, { count: 0, confidenceSum: 0, examples: [] });
        }

        const pattern = overlapPatterns.get(key)!;
        pattern.count++;
        pattern.confidenceSum += classification.confidence;
        if (pattern.examples.length < 3) {
          pattern.examples.push(job.title);
        }
      }
    });

    return Array.from(overlapPatterns.entries())
      .map(([key, data]) => ({
        categories: key.split('|'),
        frequency: data.count,
        avgConfidence: Math.round(data.confidenceSum / data.count),
        examples: data.examples
      }))
      .filter(overlap => overlap.frequency >= 3)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  }

  /**
   * Identify jobs that need manual review
   */
  getJobsNeedingReview(jobs: ProcessedJobData[]): Array<{
    jobId: string;
    title: string;
    reason: string;
    confidence: number;
    suggestedAction: string;
  }> {
    const reviewCandidates: Array<{
      jobId: string;
      title: string;
      reason: string;
      confidence: number;
      suggestedAction: string;
    }> = [];

    jobs.forEach(job => {
      const classification = this.classifyJob({
        title: job.title,
        description: job.description,
        job_labels: job.job_labels
      });

      let needsReview = false;
      let reason = '';
      let suggestedAction = '';

      if (classification.flags.lowConfidence) {
        needsReview = true;
        reason = 'Low classification confidence';
        suggestedAction = 'Review keywords and add missing terms to dictionary';
      } else if (classification.flags.ambiguous) {
        needsReview = true;
        reason = 'Ambiguous between multiple categories';
        suggestedAction = 'Clarify category boundaries or create hybrid category';
      } else if (classification.flags.emergingTerms.length > 2) {
        needsReview = true;
        reason = 'Contains multiple unrecognized terms';
        suggestedAction = 'Evaluate new terms for addition to dictionary';
      }

      if (needsReview) {
        reviewCandidates.push({
          jobId: job.id,
          title: job.title,
          reason,
          confidence: classification.confidence,
          suggestedAction
        });
      }
    });

    return reviewCandidates
      .sort((a, b) => a.confidence - b.confidence)
      .slice(0, 50); // Limit to manageable number
  }

  /**
   * Update learning metrics based on recent classifications
   */
  updateLearningMetrics(classifications: ClassificationResult[]): LearningMetrics {
    const totalClassifications = classifications.length;
    const avgConfidence = classifications.reduce((sum, c) => sum + c.confidence, 0) / totalClassifications;
    const ambiguousRate = (classifications.filter(c => c.flags.ambiguous).length / totalClassifications) * 100;
    const lowConfidenceRate = (classifications.filter(c => c.flags.lowConfidence).length / totalClassifications) * 100;

    // Calculate category performance
    const categoryStats = new Map<string, { confidenceSum: number; count: number; ambiguous: number }>();

    classifications.forEach(classification => {
      const category = classification.primary;
      if (!categoryStats.has(category)) {
        categoryStats.set(category, { confidenceSum: 0, count: 0, ambiguous: 0 });
      }

      const stats = categoryStats.get(category)!;
      stats.confidenceSum += classification.confidence;
      stats.count++;
      if (classification.flags.ambiguous) stats.ambiguous++;
    });

    const categoryPerformance = Array.from(categoryStats.entries()).map(([category, stats]) => ({
      category,
      avgConfidence: Math.round(stats.confidenceSum / stats.count),
      ambiguityRate: Math.round((stats.ambiguous / stats.count) * 100),
      volume: stats.count
    }));

    this.lastLearningUpdate = new Date();

    return {
      totalClassifications,
      avgConfidence: Math.round(avgConfidence),
      ambiguousRate: Math.round(ambiguousRate),
      lowConfidenceRate: Math.round(lowConfidenceRate),
      newTermsDetected: this.emergingTermsCache.size,
      lastLearningUpdate: this.lastLearningUpdate.toISOString(),
      categoryPerformance
    };
  }

  // Private helper methods

  private extractJobContent(job: { title: string; description: string; job_labels: string }): {
    title: string;
    description: string;
    jobLabels: string[];
    combined: string;
  } {
    const title = job.title?.toLowerCase() || '';
    const description = job.description?.toLowerCase() || '';
    const jobLabels = job.job_labels ? job.job_labels.split(',').map(l => l.trim().toLowerCase()) : [];
    const combined = `${title} ${description} ${jobLabels.join(' ')}`;

    return { title, description, jobLabels, combined };
  }

  private scoreAllCategories(content: {
    title: string;
    description: string;
    jobLabels: string[];
    combined: string;
  }, agency?: string): Array<{ categoryId: string; score: number; matches: string[] }> {
    return JOB_CLASSIFICATION_DICTIONARY.map(category => {
      let score = this.scoreCategory(category, content);
      const matches = this.findMatches(category, content);

      // Agency context boost
      if (agency) {
        score = this.applyAgencyContextBoost(score, category.id, agency);
      }

      // Apply pattern learning boost (temporarily disabled)
      // const patternBoost = patternLearningEngine.getPatternBoost(content.combined, category.id);
      // if (patternBoost > 0) {
      //   score += patternBoost * 100; // Convert to 0-100 scale
      //   matches.push(`pattern-learned:+${Math.round(patternBoost * 100)}`);
      // }

      return {
        categoryId: category.id,
        score,
        matches
      };
    });
  }

  private scoreCategory(category: ClassificationCategory, content: {
    title: string;
    description: string;
    jobLabels: string[];
    combined: string;
  }): number {
    let score = 0;
    const weights = CLASSIFICATION_CONFIG.fieldWeights;

    // Core keywords (highest weight)
    category.coreKeywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      if (content.jobLabels.some(label => label.includes(keywordLower))) {
        score += weights.jobLabels * weights.coreKeywordMultiplier;
      }
      if (content.title.includes(keywordLower)) {
        // Extra boost for core keywords in titles
        score += weights.title * weights.coreKeywordMultiplier * (weights.titleKeywordMultiplier || 1);
      }
      if (content.description.includes(keywordLower)) {
        score += weights.description * weights.coreKeywordMultiplier;
      }
    });

    // Support keywords (medium weight) - with title boost
    category.supportKeywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      if (content.jobLabels.some(label => label.includes(keywordLower))) {
        score += weights.jobLabels * weights.supportKeywordMultiplier;
      }
      if (content.title.includes(keywordLower)) {
        // Boost for support keywords in titles too
        score += weights.title * weights.supportKeywordMultiplier * ((weights.titleKeywordMultiplier || 1) * 0.5);
      }
      if (content.description.includes(keywordLower)) {
        score += weights.description * weights.supportKeywordMultiplier;
      }
    });

    // Context pairs bonus
    category.contextPairs.forEach(([word1, word2]) => {
      if (content.combined.includes(word1.toLowerCase()) &&
        content.combined.includes(word2.toLowerCase())) {
        score += weights.contextBonus;
      }
    });

    // Exclusion keywords removed - no longer using negative scoring approach

    // Emerging keywords bonus
    category.emergingKeywords.forEach(keyword => {
      if (content.combined.includes(keyword.toLowerCase())) {
        score += weights.description; // Moderate weight for emerging terms
      }
    });

    return Math.max(0, score); // Ensure non-negative score
  }

  private findMatches(category: ClassificationCategory, content: {
    title: string;
    description: string;
    jobLabels: string[];
    combined: string;
  }): string[] {
    const matches: string[] = [];

    const allKeywords = [
      ...category.coreKeywords,
      ...category.supportKeywords,
      ...category.emergingKeywords
    ];

    allKeywords.forEach(keyword => {
      if (content.combined.includes(keyword.toLowerCase())) {
        matches.push(keyword);
      }
    });

    return matches;
  }

  private generateFlags(
    sortedScores: Array<{ categoryId: string; score: number }>,
    content: { combined: string }
  ): ClassificationResult['flags'] {
    const topScore = sortedScores[0]?.score || 0;
    const secondScore = sortedScores[1]?.score || 0;

    const lowConfidence = topScore < CLASSIFICATION_CONFIG.confidenceThresholds.medium;
    const ambiguous = (topScore - secondScore) <= CLASSIFICATION_CONFIG.ambiguityThreshold;
    const emergingTerms = this.findEmergingTerms(content.combined);
    const hybridCandidate = this.detectHybridPattern(sortedScores) !== null;

    return {
      lowConfidence,
      ambiguous,
      emergingTerms,
      hybridCandidate
    };
  }

  private generateReasoning(
    primaryCategory: { categoryId: string; score: number; matches: string[] },
    content: { title: string; description: string; jobLabels: string[] }
  ): string[] {
    const reasoning: string[] = [];
    const category = JOB_CLASSIFICATION_DICTIONARY.find(c => c.id === primaryCategory.categoryId);

    if (!category) return ['Classification failed to find matching category'];

    reasoning.push(`Classified as "${category.name}" with ${primaryCategory.score.toFixed(1)} points`);

    if (primaryCategory.matches.length > 0) {
      reasoning.push(`Key matches: ${primaryCategory.matches.slice(0, 5).join(', ')}`);
    }

    // Analyze strength by field
    const titleMatches = category.coreKeywords.filter(k => content.title.includes(k.toLowerCase()));
    const labelMatches = category.coreKeywords.filter(k =>
      content.jobLabels.some(label => label.includes(k.toLowerCase()))
    );

    if (titleMatches.length > 0) {
      reasoning.push(`Strong title indicators: ${titleMatches.slice(0, 3).join(', ')}`);
    }

    if (labelMatches.length > 0) {
      reasoning.push(`Job label matches: ${labelMatches.slice(0, 3).join(', ')}`);
    }

    return reasoning;
  }

  private detectHybridPattern(sortedScores: Array<{ categoryId: string; score: number }>): string | null {
    for (const pattern of HYBRID_PATTERNS) {
      const patternScores = pattern.categories.map(catId =>
        sortedScores.find(s => s.categoryId === catId)?.score || 0
      );

      // Check if both categories in pattern have decent scores
      if (patternScores.every(score => score > 20) &&
        patternScores.some(score => score > 40)) {
        return pattern.name;
      }
    }
    return null;
  }

  private findEmergingTerms(content: string): string[] {
    const terms = this.extractSignificantTerms(content);
    const knownTerms = this.getAllKnownTerms();

    return terms.filter(term =>
      !knownTerms.has(term.toLowerCase()) &&
      !STOP_WORDS.has(term.toLowerCase()) &&
      term.length > 3
    ).slice(0, 5);
  }

  private extractSignificantTerms(text: string): string[] {
    return text
      .split(/[\s,.-]+/)
      .filter(word => word.length > 2)
      .map(word => word.replace(/[^a-zA-Z]/g, ''))
      .filter(word => word.length > 2);
  }

  private getAllKnownTerms(): Set<string> {
    const knownTerms = new Set<string>();

    JOB_CLASSIFICATION_DICTIONARY.forEach(category => {
      category.coreKeywords.forEach(term => knownTerms.add(term.toLowerCase()));
      category.supportKeywords.forEach(term => knownTerms.add(term.toLowerCase()));
      category.emergingKeywords.forEach(term => knownTerms.add(term.toLowerCase()));
      category.weakSignals.forEach(term => knownTerms.add(term.toLowerCase()));
    });

    return knownTerms;
  }

  /**
   * Check for D2+ leadership positions that should be automatically classified as Leadership & Executive Management
   */
  private checkLeadershipOverride(job: any, content: any): { isLeadership: boolean; reason: string } | null {
    // CRITICAL: If grade is provided, use it as the definitive authority
    if (job.up_grade && job.up_grade.trim()) {
      if (isLeadershipGrade(job.up_grade)) {
        return { isLeadership: true, reason: `Leadership grade ${job.up_grade} detected` };
      } else {
        // If grade exists but is NOT leadership (like Consultant, Intern, etc.), 
        // DO NOT override with title keywords - respect the grade
        return null;
      }
    }

    // ONLY check leadership titles for positions WITHOUT clear grades
    const titleText = content.title.toLowerCase();
    for (const indicator of LEADERSHIP_TITLE_INDICATORS) {
      if (titleText.includes(indicator.toLowerCase())) {
        return { isLeadership: true, reason: `Leadership title "${indicator}" detected` };
      }
    }

    return null; // Not a leadership position
  }

  private createResult(category: string, confidence: number, content: any, reasoning: string[]): ClassificationResult {
    return {
      primary: category,
      confidence,
      secondary: [],
      reasoning,
      flags: {
        ambiguous: false,
        lowConfidence: confidence < 40,
        emergingTerms: [],
        hybridCandidate: false
      }
    };
  }

  /**
   * Apply agency context boost to improve classification accuracy
   */
  private applyAgencyContextBoost(score: number, categoryId: string, agency: string): number {
    const agencyLower = agency.toLowerCase();

    // Strong agency-category associations
    const agencyBoosts: Record<string, Record<string, number>> = {
      'who': { 'health-medical': 20 },
      'fao': { 'agriculture-food-security': 20 },
      'wfp': { 'agriculture-food-security': 15, 'humanitarian-emergency': 15 },
      'ifad': { 'agriculture-food-security': 20 },
      'unhcr': { 'humanitarian-emergency': 20 },
      'unicef': { 'education-development': 15, 'health-medical': 10, 'social-affairs-human-rights': 10 },
      'undp': { 'governance-rule-of-law': 15, 'economic-affairs-trade': 10, 'climate-environment': 10 },
      'unep': { 'climate-environment': 20 },
      'ilo': { 'economic-affairs-trade': 15, 'social-affairs-human-rights': 10 },
      'unesco': { 'education-development': 20, 'social-affairs-human-rights': 10 },
      'eclac': { 'economic-affairs-trade': 15, 'policy-strategic-planning': 10 }
    };

    const boost = agencyBoosts[agencyLower]?.[categoryId] || 0;
    return score + boost;
  }

  private createFallbackResult(): ClassificationResult {
    // Use operations-administration as fallback (most general category)
    const fallbackCategory = 'operations-administration';

    return {
      primary: fallbackCategory,
      confidence: 25,
      secondary: [],
      reasoning: ['Classification failed - using fallback category'],
      flags: {
        lowConfidence: true,
        ambiguous: false,
        emergingTerms: [],
        hybridCandidate: false
      }
    };
  }
}
