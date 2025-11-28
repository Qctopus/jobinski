import { ProcessedJobData, JobCategory, JobData } from '../../types';
import { BaseProcessor } from '../core/BaseProcessor';
import { EnhancedJobClassifier } from '../classification/EnhancedJobClassifier';
import { JOB_CLASSIFICATION_DICTIONARY } from '../../dictionary';

// Legacy job categories - use JOB_CLASSIFICATION_DICTIONARY for new implementations
// This export is kept for backward compatibility only

/**
 * Enhanced processor for job categorization.
 * Uses sophisticated scoring with confidence analysis and learning capabilities.
 */
// Convert advanced dictionary to legacy format for backward compatibility
const JOB_CATEGORIES: JobCategory[] = JOB_CLASSIFICATION_DICTIONARY.map(cat => ({
  id: cat.id,
  name: cat.name,
  keywords: cat.coreKeywords,
  color: cat.color,
  description: cat.description
}));

export { JOB_CATEGORIES };

export class CategoryProcessor extends BaseProcessor {
  private categories: JobCategory[] = JOB_CATEGORIES;
  private enhancedClassifier: EnhancedJobClassifier;
  private debugMode: boolean = false;

  constructor(debugMode: boolean = false) {
    super();
    this.debugMode = debugMode;
    this.enhancedClassifier = new EnhancedJobClassifier();
  }

  /**
   * Enhanced categorize method using the advanced dictionary and classifier
   */
  categorizeJob(job: ProcessedJobData): {
    primary: string;
    secondary: string[];
    confidence: number;
    isAmbiguous: boolean;
    reasoning: string[];
    emergingTerms: string[];
    hybridCandidate?: string;
  } {
    if (this.debugMode) {
      console.log(`Categorizing job: "${job.title?.substring(0, 50)}..."`);
    }
    
    // Use the enhanced classifier with advanced dictionary
    const classification = this.enhancedClassifier.classifyJob({
      title: job.title || '',
      description: job.description || '',
      job_labels: job.job_labels || ''
    });
    
    return {
      primary: classification.primary,
      secondary: classification.secondary.map(s => s.category),
      confidence: classification.confidence,
      isAmbiguous: classification.flags.ambiguous,
      reasoning: classification.reasoning,
      emergingTerms: classification.flags.emergingTerms,
      hybridCandidate: classification.flags.hybridCandidate ? this.detectHybridName(classification) : undefined
    };
  }

  /**
   * Fallback method for legacy compatibility
   * @deprecated Use categorizeJob instead
   */
  private legacyCategorizeJob(job: ProcessedJobData): { primary: string; secondary: string[] } {
    // Use the enhanced classifier for backward compatibility
    const result = this.categorizeJob(job);
    return {
      primary: result.primary,
      secondary: result.secondary
    };
  }

  /**
   * Batch categorize multiple jobs for efficiency
   */
  categorizeJobs(jobs: ProcessedJobData[]): ProcessedJobData[] {
    const startTime = Date.now();
    
    const categorizedJobs = jobs.map(job => {
      const categories = this.categorizeJob(job);
      return {
        ...job,
        primary_category: categories.primary,
        secondary_categories: categories.secondary,
        classification_confidence: categories.confidence,
        is_ambiguous_category: categories.isAmbiguous,
        classification_reasoning: categories.reasoning,
        emerging_terms_found: categories.emergingTerms,
        hybrid_category_candidate: categories.hybridCandidate
      };
    });

    this.logPerformance('Enhanced Job Categorization', startTime, jobs.length);
    
    // Log category distribution
    this.logCategoryDistribution(categorizedJobs);
    
    return categorizedJobs;
  }

  /**
   * Get category information by name
   */
  getCategoryInfo(categoryName: string): JobCategory | undefined {
    return this.categories.find(cat => cat.name === categoryName);
  }

  /**
   * Get all available categories
   */
  getAllCategories(): JobCategory[] {
    return [...this.categories];
  }

  /**
   * Get the advanced classification dictionary
   */
  getAdvancedDictionary() {
    return JOB_CLASSIFICATION_DICTIONARY;
  }

  /**
   * Get learning metrics for the classifier
   */
  getLearningMetrics(jobs: JobData[]) {
    try {
      // Detect emerging terms across all jobs
      const emergingTerms = this.enhancedClassifier.detectEmergingTerms(jobs);
      
      // Analyze category overlaps
      const processedJobs = jobs as ProcessedJobData[]; // Assuming they have been processed
      const categoryOverlaps = this.enhancedClassifier.analyzeCategoryOverlaps(processedJobs);
      
      // Get jobs needing review
      const reviewCandidates = this.enhancedClassifier.getJobsNeedingReview(processedJobs);
      
      return {
        emergingTerms,
        categoryOverlaps,
        reviewCandidates
      };
    } catch (error) {
      console.error('Failed to get learning metrics', error);
      return {
        emergingTerms: [],
        categoryOverlaps: [],
        reviewCandidates: []
      };
    }
  }

  /**
   * Get enhanced classifier instance for direct access
   */
  getEnhancedClassifier(): EnhancedJobClassifier {
    return this.enhancedClassifier;
  }

  /**
   * Update categories from dictionary (for dynamic updates)
   */
  updateCategoriesFromDictionary(): void {
    // Update the local categories to match the enhanced dictionary
    this.categories = JOB_CLASSIFICATION_DICTIONARY.map(cat => ({
      id: cat.id,
      name: cat.name,
      keywords: [...cat.coreKeywords, ...cat.supportKeywords],
      color: cat.color,
      description: cat.description
    }));
    
    console.log(`Updated ${this.categories.length} categories from enhanced dictionary`);
  }


  /**
   * Log category distribution for monitoring
   */
  private logCategoryDistribution(jobs: ProcessedJobData[]): void {
    if (process.env.NODE_ENV === 'development') {
      const categoryCount = new Map<string, number>();
      jobs.forEach(job => {
        categoryCount.set(job.primary_category, (categoryCount.get(job.primary_category) || 0) + 1);
      });
      
      console.log('[Category Distribution]:', Object.fromEntries(categoryCount));
    }
  }

  /**
   * Helper method to detect hybrid category names
   */
  private detectHybridName(classification: any): string | undefined {
    if (classification.flags.hybridCandidate) {
      const primaryCat = JOB_CLASSIFICATION_DICTIONARY.find(c => c.id === classification.primary);
      const secondaryCat = classification.secondary[0] ? 
        JOB_CLASSIFICATION_DICTIONARY.find(c => c.id === classification.secondary[0].category) : null;
      
      if (primaryCat && secondaryCat) {
        return `${primaryCat.name} + ${secondaryCat.name}`;
      }
    }
    return undefined;
  }

  /**
   * Enhanced categorization debug logging
   */
  private logEnhancedCategorizationDebug(job: ProcessedJobData, classification: any): void {
    console.log('Enhanced Categorization Debug', {
      jobId: job.id,
      title: job.title.substring(0, 50),
      primary: classification.primary,
      confidence: classification.confidence,
      flags: classification.flags,
      reasoning: classification.reasoning.slice(0, 2)
    });
  }
}

