import { ProcessedJobData, JobData } from '../types';
import { JOB_CLASSIFICATION_DICTIONARY, CLASSIFICATION_CONFIG } from '../dictionary';

/**
 * Administrative utilities for classification system management
 */

export interface LowConfidenceJob {
  id: string;
  title: string;
  category: string;
  confidence: number;
  reason: string;
  suggestedAction: string;
  keywords: string[];
  emergingTerms: string[];
}

export interface KeywordSuggestion {
  category: string;
  suggestedKeywords: string[];
  frequency: number;
  confidence: number;
  source: 'emerging_terms' | 'manual_review' | 'pattern_analysis';
}

export interface HybridCategory {
  name: string;
  categories: string[];
  frequency: number;
  examples: string[];
  suggestedKeywords: string[];
}

export interface ClassificationReport {
  timestamp: string;
  totalJobs: number;
  overallAccuracy: number;
  categoryBreakdown: Array<{
    category: string;
    totalJobs: number;
    avgConfidence: number;
    ambiguityRate: number;
    recommendations: string[];
  }>;
  emergingTerms: Array<{ term: string; frequency: number; categories: string[] }>;
  hybridPatterns: HybridCategory[];
  systemRecommendations: string[];
}

/**
 * Export jobs with low confidence for manual review
 */
export function exportLowConfidenceJobs(
  jobs: ProcessedJobData[], 
  confidenceThreshold: number = CLASSIFICATION_CONFIG.confidenceThresholds.medium
): LowConfidenceJob[] {
  return jobs
    .filter(job => (job.classification_confidence || 50) < confidenceThreshold)
    .map(job => {
      let reason = '';
      let suggestedAction = '';
      
      const confidence = job.classification_confidence || 50;
      
      if (confidence < 25) {
        reason = 'Very low classification confidence - likely missing key terms';
        suggestedAction = 'Add missing keywords to category dictionary or create new category';
      } else if (job.is_ambiguous_category) {
        reason = 'Ambiguous classification between multiple categories';
        suggestedAction = 'Clarify category boundaries or consider hybrid category';
      } else if ((job.emerging_terms_found?.length || 0) > 2) {
        reason = 'Contains multiple unrecognized terms';
        suggestedAction = 'Review emerging terms for potential keyword additions';
      } else {
        reason = 'Below confidence threshold';
        suggestedAction = 'Review job content and improve matching keywords';
      }
      
      return {
        id: job.id,
        title: job.title,
        category: job.primary_category,
        confidence,
        reason,
        suggestedAction,
        keywords: extractKeywords(job),
        emergingTerms: job.emerging_terms_found || []
      };
    })
    .sort((a, b) => a.confidence - b.confidence);
}

/**
 * Suggest new keywords for categories based on emerging patterns
 */
export function suggestKeywordUpdates(jobs: ProcessedJobData[]): KeywordSuggestion[] {
  const suggestions: KeywordSuggestion[] = [];
  
  // Analyze emerging terms by category
  const categoryTerms = new Map<string, Map<string, number>>();
  
  jobs.forEach(job => {
    const category = job.primary_category;
    if (!categoryTerms.has(category)) {
      categoryTerms.set(category, new Map());
    }
    
    const terms = categoryTerms.get(category)!;
    (job.emerging_terms_found || []).forEach(term => {
      terms.set(term, (terms.get(term) || 0) + 1);
    });
  });
  
  // Generate suggestions for each category
  categoryTerms.forEach((terms, category) => {
    const sortedTerms = Array.from(terms.entries())
      .filter(([, frequency]) => frequency >= 3) // Minimum frequency
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10); // Top 10 suggestions
    
    if (sortedTerms.length > 0) {
      suggestions.push({
        category,
        suggestedKeywords: sortedTerms.map(([term]) => term),
        frequency: sortedTerms.reduce((sum, [, freq]) => sum + freq, 0),
        confidence: calculateKeywordConfidence(sortedTerms, terms.size),
        source: 'emerging_terms'
      });
    }
  });
  
  return suggestions.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Detect jobs that span multiple categories (hybrid candidates)
 */
export function detectHybridCategories(jobs: ProcessedJobData[]): HybridCategory[] {
  const hybridPatterns = new Map<string, {
    categories: string[];
    frequency: number;
    examples: string[];
    keywords: Set<string>;
  }>();
  
  jobs.forEach(job => {
    if (job.hybrid_category_candidate) {
      const pattern = job.hybrid_category_candidate;
      
      if (!hybridPatterns.has(pattern)) {
        hybridPatterns.set(pattern, {
          categories: extractCategoriesFromPattern(pattern),
          frequency: 0,
          examples: [],
          keywords: new Set()
        });
      }
      
      const data = hybridPatterns.get(pattern)!;
      data.frequency++;
      
      if (data.examples.length < 5) {
        data.examples.push(job.title);
      }
      
      // Extract keywords from job
      extractKeywords(job).forEach(keyword => data.keywords.add(keyword));
    }
  });
  
  return Array.from(hybridPatterns.entries())
    .filter(([, data]) => data.frequency >= 3) // Minimum frequency for hybrid category
    .map(([name, data]) => ({
      name,
      categories: data.categories,
      frequency: data.frequency,
      examples: data.examples,
      suggestedKeywords: Array.from(data.keywords).slice(0, 15)
    }))
    .sort((a, b) => b.frequency - a.frequency);
}

/**
 * Generate comprehensive classification quality report
 */
export function generateClassificationReport(jobs: ProcessedJobData[]): ClassificationReport {
  const timestamp = new Date().toISOString();
  const totalJobs = jobs.length;
  
  // Calculate overall accuracy
  const confidenceSum = jobs.reduce((sum, job) => sum + (job.classification_confidence || 50), 0);
  const overallAccuracy = Math.round(confidenceSum / totalJobs);
  
  // Category breakdown
  const categoryStats = new Map<string, {
    total: number;
    confidenceSum: number;
    ambiguous: number;
    lowConfidence: number;
  }>();
  
  jobs.forEach(job => {
    const category = job.primary_category;
    if (!categoryStats.has(category)) {
      categoryStats.set(category, { total: 0, confidenceSum: 0, ambiguous: 0, lowConfidence: 0 });
    }
    
    const stats = categoryStats.get(category)!;
    stats.total++;
    stats.confidenceSum += job.classification_confidence || 50;
    if (job.is_ambiguous_category) stats.ambiguous++;
    if ((job.classification_confidence || 50) < 40) stats.lowConfidence++;
  });
  
  const categoryBreakdown = Array.from(categoryStats.entries()).map(([category, stats]) => {
    const avgConfidence = Math.round(stats.confidenceSum / stats.total);
    const ambiguityRate = Math.round((stats.ambiguous / stats.total) * 100);
    const lowConfidenceRate = Math.round((stats.lowConfidence / stats.total) * 100);
    
    const recommendations: string[] = [];
    if (avgConfidence < 60) recommendations.push('Improve keyword coverage');
    if (ambiguityRate > 15) recommendations.push('Clarify category boundaries');
    if (lowConfidenceRate > 20) recommendations.push('Review classification rules');
    if (stats.total < 10) recommendations.push('Insufficient data for reliable analysis');
    
    return {
      category,
      totalJobs: stats.total,
      avgConfidence,
      ambiguityRate,
      recommendations
    };
  }).sort((a, b) => b.totalJobs - a.totalJobs);
  
  // Emerging terms analysis
  const emergingTermFreq = new Map<string, { frequency: number; categories: Set<string> }>();
  
  jobs.forEach(job => {
    (job.emerging_terms_found || []).forEach(term => {
      if (!emergingTermFreq.has(term)) {
        emergingTermFreq.set(term, { frequency: 0, categories: new Set() });
      }
      const data = emergingTermFreq.get(term)!;
      data.frequency++;
      data.categories.add(job.primary_category);
    });
  });
  
  const emergingTerms = Array.from(emergingTermFreq.entries())
    .filter(([, data]) => data.frequency >= 3)
    .map(([term, data]) => ({
      term,
      frequency: data.frequency,
      categories: Array.from(data.categories)
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 20);
  
  // Hybrid patterns
  const hybridPatterns = detectHybridCategories(jobs);
  
  // System recommendations
  const systemRecommendations: string[] = [];
  
  if (overallAccuracy < 70) {
    systemRecommendations.push('Overall classification accuracy is below target - review keyword dictionaries');
  }
  
  if (emergingTerms.length > 10) {
    systemRecommendations.push(`${emergingTerms.length} emerging terms detected - consider dictionary updates`);
  }
  
  if (hybridPatterns.length > 5) {
    systemRecommendations.push(`${hybridPatterns.length} hybrid patterns identified - consider new categories`);
  }
  
  const ambiguousJobs = jobs.filter(job => job.is_ambiguous_category).length;
  if (ambiguousJobs / totalJobs > 0.1) {
    systemRecommendations.push('High ambiguity rate - review category definitions and boundaries');
  }
  
  const lowConfidenceJobs = jobs.filter(job => (job.classification_confidence || 50) < 40).length;
  if (lowConfidenceJobs / totalJobs > 0.15) {
    systemRecommendations.push('High low-confidence rate - expand keyword coverage');
  }
  
  return {
    timestamp,
    totalJobs,
    overallAccuracy,
    categoryBreakdown,
    emergingTerms,
    hybridPatterns,
    systemRecommendations
  };
}

/**
 * Export classification report as CSV string
 */
export function exportReportAsCSV(report: ClassificationReport): string {
  const lines: string[] = [];
  
  // Header
  lines.push('Classification Quality Report');
  lines.push(`Generated: ${report.timestamp}`);
  lines.push(`Total Jobs: ${report.totalJobs}`);
  lines.push(`Overall Accuracy: ${report.overallAccuracy}%`);
  lines.push('');
  
  // Category breakdown
  lines.push('Category,Total Jobs,Avg Confidence,Ambiguity Rate,Recommendations');
  report.categoryBreakdown.forEach(cat => {
    lines.push(`"${cat.category}",${cat.totalJobs},${cat.avgConfidence}%,${cat.ambiguityRate}%,"${cat.recommendations.join('; ')}"`);
  });
  
  lines.push('');
  
  // Emerging terms
  lines.push('Emerging Terms,Frequency,Categories');
  report.emergingTerms.forEach(term => {
    lines.push(`"${term.term}",${term.frequency},"${term.categories.join(', ')}"`);
  });
  
  return lines.join('\n');
}

/**
 * Get classification statistics for monitoring dashboard
 */
export function getClassificationStats(jobs: ProcessedJobData[]) {
  const total = jobs.length;
  if (total === 0) return null;
  
  const highConfidence = jobs.filter(j => (j.classification_confidence || 50) >= 70).length;
  const mediumConfidence = jobs.filter(j => {
    const conf = j.classification_confidence || 50;
    return conf >= 40 && conf < 70;
  }).length;
  const lowConfidence = jobs.filter(j => (j.classification_confidence || 50) < 40).length;
  
  const ambiguous = jobs.filter(j => j.is_ambiguous_category).length;
  const hasEmergingTerms = jobs.filter(j => (j.emerging_terms_found?.length || 0) > 0).length;
  const hybridCandidates = jobs.filter(j => j.hybrid_category_candidate).length;
  
  return {
    total,
    confidence: {
      high: { count: highConfidence, percentage: Math.round((highConfidence / total) * 100) },
      medium: { count: mediumConfidence, percentage: Math.round((mediumConfidence / total) * 100) },
      low: { count: lowConfidence, percentage: Math.round((lowConfidence / total) * 100) }
    },
    flags: {
      ambiguous: { count: ambiguous, percentage: Math.round((ambiguous / total) * 100) },
      emergingTerms: { count: hasEmergingTerms, percentage: Math.round((hasEmergingTerms / total) * 100) },
      hybrid: { count: hybridCandidates, percentage: Math.round((hybridCandidates / total) * 100) }
    }
  };
}

// Helper functions

function extractKeywords(job: ProcessedJobData): string[] {
  const text = `${job.title} ${job.job_labels || ''} ${job.description || ''}`.toLowerCase();
  const words = text.match(/\b\w{3,}\b/g) || [];
  
  // Get unique significant words
  const keywordSet = new Set(words.filter(word => 
    word.length > 3 && 
    !isCommonWord(word)
  ));
  
  return Array.from(keywordSet).slice(0, 20);
}

function extractCategoriesFromPattern(pattern: string): string[] {
  // Simple pattern extraction - assumes "Category A + Category B" format
  return pattern.split(' + ').map(cat => cat.trim());
}

function calculateKeywordConfidence(sortedTerms: [string, number][], totalTerms: number): number {
  if (sortedTerms.length === 0) return 0;
  
  const topTermFreq = sortedTerms[0][1];
  const avgFreq = sortedTerms.reduce((sum, [, freq]) => sum + freq, 0) / sortedTerms.length;
  
  // Confidence based on frequency and consistency
  const frequencyScore = Math.min(topTermFreq / 10, 1) * 50; // Max 50 points for frequency
  const consistencyScore = (avgFreq / topTermFreq) * 50; // Max 50 points for consistency
  
  return Math.round(frequencyScore + consistencyScore);
}

function isCommonWord(word: string): boolean {
  const commonWords = new Set([
    'will', 'with', 'work', 'experience', 'required', 'years', 'including',
    'strong', 'knowledge', 'skills', 'ability', 'responsibilities', 'duties',
    'position', 'role', 'candidate', 'must', 'should', 'working', 'team',
    'responsible', 'support', 'develop', 'ensure', 'provide', 'manage'
  ]);
  
  return commonWords.has(word);
}


