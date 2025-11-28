import { JobFeedback, DictionaryUpdateSuggestion, LearningInsights } from '../../types/feedback';
import { JOB_CLASSIFICATION_DICTIONARY, ClassificationCategory, STOP_WORDS, FORBIDDEN_LEARNING_KEYWORDS } from '../../dictionary';

// Unified interfaces for the learning system
interface LearnedPattern {
  keywords: string[];
  categoryId: string;
  confidence: number;
  occurrences: number;
  lastSeen: string;
}

interface DictionaryUpdate {
  categoryId: string;
  newCoreKeywords: string[];
  newSupportKeywords: string[];
  newContextPairs: string[][];
  timestamp: string;
  autoApplied: boolean;
  confidence: number;
}

interface LearningAction {
  id: string;
  type: 'keyword_addition' | 'pattern_recognition' | 'category_update' | 'positive_reinforcement';
  timestamp: string;
  categoryId: string;
  description: string;
  confidence: number;
  supportingJobs: string[];
  autoApplied: boolean;
  details?: {
    reinforcedKeywords?: string[];
    jobTitle?: string;
    totalKeywords?: number;
    extractedKeywords?: string[];
    suggestedKeywords?: string[];
    contextPairs?: [string, string][];
  };
}

/**
 * Unified Learning Engine - Combines feedback processing and pattern learning
 * This replaces both FeedbackLearningEngine and PatternLearningEngine
 */
export class UnifiedLearningEngine {
  private feedbackData: JobFeedback[] = [];
  private learnedPatterns: Map<string, LearnedPattern> = new Map();
  private dictionaryUpdates: DictionaryUpdate[] = [];
  private learningActions: LearningAction[] = [];
  
  // Configuration
  private readonly MIN_PATTERN_CONFIDENCE = 0.7;
  private readonly MIN_FEEDBACK_THRESHOLD = 3;
  private readonly AUTO_APPLY_THRESHOLD = 0.8;
  
  // Singleton pattern
  private static instance: UnifiedLearningEngine;
  
  private constructor() {
    this.loadPersistedData();
  }
  
  public static getInstance(): UnifiedLearningEngine {
    if (!UnifiedLearningEngine.instance) {
      UnifiedLearningEngine.instance = new UnifiedLearningEngine();
    }
    return UnifiedLearningEngine.instance;
  }

  /**
   * Main method to process any type of feedback (corrections or confirmations)
   */
  public processFeedback(feedback: JobFeedback): DictionaryUpdateSuggestion[] {
    console.log(`🧠 Processing ${feedback.userCorrection.reason} feedback for job ${feedback.jobId}`);
    
    // Store feedback
    this.feedbackData.push(feedback);
    
    // Extract keywords and patterns
    const extractedKeywords = this.extractMeaningfulKeywords(feedback);
    feedback.extractedKeywords = extractedKeywords;
    
    // Process based on feedback type
    let suggestions: DictionaryUpdateSuggestion[] = [];
    
    if (feedback.userCorrection.reason === 'confirmed_correct') {
      suggestions = this.processPositiveFeedback(feedback, extractedKeywords);
    } else {
      suggestions = this.processCorrectionFeedback(feedback, extractedKeywords);
    }
    
    // Store suggestions
    feedback.suggestedChanges = suggestions;
    feedback.learningStatus = 'analyzed';
    
    // Check for auto-applicable high-confidence suggestions
    const autoApplicable = suggestions.filter(s => s.confidence >= this.AUTO_APPLY_THRESHOLD);
    if (autoApplicable.length > 0) {
      this.autoApplySuggestions(autoApplicable);
    }
    
    // Persist all learning data
    this.persistData();
    
    return suggestions;
  }

  /**
   * Process positive feedback (when classification is confirmed correct)
   */
  private processPositiveFeedback(feedback: JobFeedback, keywords: string[]): DictionaryUpdateSuggestion[] {
    const suggestions: DictionaryUpdateSuggestion[] = [];
    const categoryId = feedback.userCorrection.correctedPrimary;
    
    // Reinforce existing keywords that led to correct classification
    keywords.forEach(keyword => {
      const existingPattern = this.findExistingPattern(keyword, categoryId);
      if (existingPattern) {
        existingPattern.confidence = Math.min(1.0, existingPattern.confidence + 0.1);
        existingPattern.occurrences++;
        existingPattern.lastSeen = new Date().toISOString();
      } else {
        // Create new positive pattern
        this.learnedPatterns.set(`${categoryId}-${keyword}`, {
          keywords: [keyword],
          categoryId,
          confidence: 0.6, // Start with moderate confidence for positive feedback
          occurrences: 1,
          lastSeen: new Date().toISOString()
        });
      }
    });
    
    // Record positive reinforcement action with actual keywords
    this.recordLearningAction({
      type: 'positive_reinforcement',
      categoryId,
      description: `Reinforced keywords: ${keywords.slice(0, 5).join(', ')}${keywords.length > 5 ? ` (+${keywords.length - 5} more)` : ''}`,
      confidence: 0.8,
      supportingJobs: [feedback.jobId],
      autoApplied: false,
      details: {
        reinforcedKeywords: keywords,
        jobTitle: feedback.jobTitle,
        totalKeywords: keywords.length
      }
    });
    
    return suggestions;
  }

  /**
   * Process correction feedback (when classification was wrong)
   */
  private processCorrectionFeedback(feedback: JobFeedback, keywords: string[]): DictionaryUpdateSuggestion[] {
    const suggestions: DictionaryUpdateSuggestion[] = [];
    const correctCategoryId = feedback.userCorrection.correctedPrimary;
    
    // Analyze keywords for the correct category
    keywords.forEach(keyword => {
      const supportingJobs = this.findJobsWithKeyword(keyword, correctCategoryId);
      
      if (supportingJobs.length >= this.MIN_FEEDBACK_THRESHOLD) {
        const confidence = Math.min(supportingJobs.length / 10, 1.0);
        
        suggestions.push({
          categoryId: correctCategoryId,
          action: confidence > 0.7 ? 'add_core_keyword' : 'add_support_keyword',
          keyword,
          confidence,
          supportingJobs: supportingJobs.map(j => j.jobId),
          frequency: supportingJobs.length
        });
      }
    });
    
    // Look for context pairs
    const contextPairs = this.extractContextPairs(feedback);
    contextPairs.forEach(pair => {
      const supportingJobs = this.findJobsWithContextPair(pair, correctCategoryId);
      
      if (supportingJobs.length >= this.MIN_FEEDBACK_THRESHOLD) {
        suggestions.push({
          categoryId: correctCategoryId,
          action: 'add_context_pair',
          keyword: `${pair[0]} + ${pair[1]}`,
          contextPair: pair,
          confidence: Math.min(supportingJobs.length / 5, 1.0),
          supportingJobs: supportingJobs.map(j => j.jobId),
          frequency: supportingJobs.length
        });
      }
    });
    
    // Record correction action with details
    if (suggestions.length > 0) {
      this.recordLearningAction({
        type: 'pattern_recognition',
        categoryId: correctCategoryId,
        description: `Extracted keywords: ${keywords.slice(0, 3).join(', ')}${keywords.length > 3 ? ` (+${keywords.length - 3} more)` : ''} → ${suggestions.length} pattern${suggestions.length > 1 ? 's' : ''} identified`,
        confidence: Math.max(...suggestions.map(s => s.confidence)),
        supportingJobs: [feedback.jobId],
        autoApplied: false,
        details: {
          extractedKeywords: keywords,
          suggestedKeywords: suggestions.map(s => s.keyword),
          jobTitle: feedback.jobTitle,
          contextPairs: contextPairs
        }
      });
    }
    
    return suggestions.filter(s => s.confidence > 0.4);
  }

  /**
   * Auto-apply high-confidence suggestions to the dictionary
   */
  private autoApplySuggestions(suggestions: DictionaryUpdateSuggestion[]): void {
    suggestions.forEach(suggestion => {
      const categoryIndex = JOB_CLASSIFICATION_DICTIONARY.findIndex(cat => cat.id === suggestion.categoryId);
      if (categoryIndex === -1) return;

      const category = JOB_CLASSIFICATION_DICTIONARY[categoryIndex];
      let applied = false;

      // Apply based on suggestion type
      switch (suggestion.action) {
        case 'add_core_keyword':
          if (!category.coreKeywords.includes(suggestion.keyword)) {
            category.coreKeywords.push(suggestion.keyword);
            applied = true;
          }
          break;
        case 'add_support_keyword':
          if (!category.supportKeywords.includes(suggestion.keyword)) {
            category.supportKeywords.push(suggestion.keyword);
            applied = true;
          }
          break;
        case 'add_context_pair':
          if (suggestion.contextPair && !category.contextPairs.some(pair => 
            pair[0] === suggestion.contextPair![0] && pair[1] === suggestion.contextPair![1]
          )) {
            category.contextPairs.push(suggestion.contextPair);
            applied = true;
          }
          break;
      }

      if (applied) {
        // Update timestamp
        category.lastUpdated = new Date().toISOString();
        
        // Record the update
        const update: DictionaryUpdate = {
          categoryId: suggestion.categoryId,
          newCoreKeywords: suggestion.action === 'add_core_keyword' ? [suggestion.keyword] : [],
          newSupportKeywords: suggestion.action === 'add_support_keyword' ? [suggestion.keyword] : [],
          newContextPairs: suggestion.action === 'add_context_pair' && suggestion.contextPair ? [suggestion.contextPair] : [],
          timestamp: new Date().toISOString(),
          autoApplied: true,
          confidence: suggestion.confidence
        };
        
        this.dictionaryUpdates.push(update);
        
        // Record learning action
        this.recordLearningAction({
          type: 'category_update',
          categoryId: suggestion.categoryId,
          description: `Auto-applied ${suggestion.action.replace('_', ' ')}: "${suggestion.keyword}"`,
          confidence: suggestion.confidence,
          supportingJobs: suggestion.supportingJobs,
          autoApplied: true
        });
        
        console.log(`🚀 Auto-applied: ${suggestion.action} "${suggestion.keyword}" to ${category.name} (confidence: ${Math.round(suggestion.confidence * 100)}%)`);
      }
    });
  }

  /**
   * Extract meaningful keywords from job content - with enhanced filtering
   */
  private extractMeaningfulKeywords(feedback: JobFeedback): string[] {
    const title = feedback.jobTitle.toLowerCase();
    const description = feedback.jobDescription.toLowerCase();
    const labels = feedback.jobLabels.toLowerCase();
    
    // Prioritize title keywords (strongest signal)
    const titleWords = this.extractWordsFromText(title);
    const descriptionWords = this.extractWordsFromText(description);
    const labelWords = this.extractWordsFromText(labels);
    
    // Score keywords with title boost
    const allCandidates = new Map<string, number>();
    
    // Title keywords get highest priority
    titleWords.forEach(word => {
      if (this.isValidKeyword(word)) {
        allCandidates.set(word, (allCandidates.get(word) || 0) + 3); // 3x weight for title
      }
    });
    
    // Label keywords get medium priority
    labelWords.forEach(word => {
      if (this.isValidKeyword(word)) {
        allCandidates.set(word, (allCandidates.get(word) || 0) + 2); // 2x weight for labels
      }
    });
    
    // Description keywords get low priority
    descriptionWords.forEach(word => {
      if (this.isValidKeyword(word)) {
        allCandidates.set(word, (allCandidates.get(word) || 0) + 1); // 1x weight for description
      }
    });
    
    // Extract meaningful phrases from title (most important)
    const titlePhrases = this.extractPhrasesFromText(title);
    titlePhrases.forEach(phrase => {
      if (this.isValidPhrase(phrase)) {
        allCandidates.set(phrase, (allCandidates.get(phrase) || 0) + 4); // 4x weight for title phrases
      }
    });
    
    // Score and filter keywords
    const correctCategory = JOB_CLASSIFICATION_DICTIONARY.find(cat => cat.id === feedback.userCorrection.correctedPrimary);
    const scoredKeywords = Array.from(allCandidates.entries()).map(([keyword, frequency]) => ({
      keyword,
      score: this.scoreKeywordRelevance(keyword, correctCategory, feedback) * frequency
    }))
    .filter(item => item.score > 0.5) // Higher threshold
    .sort((a, b) => b.score - a.score);

    return scoredKeywords.slice(0, 10).map(item => item.keyword);
  }
  
  private extractWordsFromText(text: string): string[] {
    const words = text.match(/\b\w+\b/g) || [];
    return words.filter(word => word.length > 2);
  }
  
  private extractPhrasesFromText(text: string): string[] {
    const words = text.split(/\s+/).filter(w => w.length > 2);
    const phrases: string[] = [];
    
    // Extract 2-word phrases
    for (let i = 0; i < words.length - 1; i++) {
      phrases.push(`${words[i]} ${words[i + 1]}`);
    }
    
    return phrases;
  }
  
  private isValidKeyword(word: string): boolean {
    const wordLower = word.toLowerCase();
    return word.length > 3 && 
           !STOP_WORDS.has(wordLower) && 
           !FORBIDDEN_LEARNING_KEYWORDS.has(wordLower) &&
           /^[a-zA-Z]+$/.test(word); // Only alphabetic characters
  }
  
  private isValidPhrase(phrase: string): boolean {
    const words = phrase.split(' ');
    return words.length === 2 && 
           words.every(word => this.isValidKeyword(word)) &&
           !FORBIDDEN_LEARNING_KEYWORDS.has(phrase.toLowerCase());
  }

  /**
   * Score keyword relevance to a category with category-specificity focus
   */
  private scoreKeywordRelevance(keyword: string, category: ClassificationCategory | undefined, feedback: JobFeedback): number {
    if (!category) return 0;

    let score = 0.1; // Lower base score - must earn relevance

    // Check if keyword appears in job title (strongest signal)
    const inTitle = feedback.jobTitle.toLowerCase().includes(keyword.toLowerCase());
    if (inTitle) {
      score += 0.6; // Major boost for title keywords
    }

    // Existing keyword bonus
    const allCategoryKeywords = [...category.coreKeywords, ...category.supportKeywords].map(k => k.toLowerCase());
    if (allCategoryKeywords.includes(keyword.toLowerCase())) {
      score += 0.4;
    }

    // Category specificity test - does this keyword distinguish this category?
    const categorySpecificity = this.calculateCategorySpecificity(keyword, category.id);
    score += categorySpecificity * 0.5;

    // Frequency in feedback for this category vs others
    const categoryFeedback = this.feedbackData.filter(f => f.userCorrection.correctedPrimary === category.id);
    const otherCategoriesFeedback = this.feedbackData.filter(f => f.userCorrection.correctedPrimary !== category.id);
    
    const keywordInCategory = categoryFeedback.filter(f => f.extractedKeywords?.includes(keyword)).length;
    const keywordInOthers = otherCategoriesFeedback.filter(f => f.extractedKeywords?.includes(keyword)).length;
    
    if (categoryFeedback.length > 0) {
      const categoryRate = keywordInCategory / categoryFeedback.length;
      const otherRate = otherCategoriesFeedback.length > 0 ? keywordInOthers / otherCategoriesFeedback.length : 0;
      
      // Boost keywords that appear more in this category than others
      const selectivity = categoryRate - otherRate;
      score += Math.max(0, selectivity) * 0.4;
    }

    // Penalty for appearing across too many categories (generic words)
    if (keywordInOthers > keywordInCategory * 2) {
      score *= 0.5; // Heavy penalty for generic terms
    }

    return Math.min(score, 1.0);
  }
  
  /**
   * Calculate how specific a keyword is to a category domain
   */
  private calculateCategorySpecificity(keyword: string, categoryId: string): number {
    const keywordLower = keyword.toLowerCase();
    
    // Domain-specific terms that strongly indicate categories
    const domainSpecificTerms: Record<string, string[]> = {
      'operations-logistics': [
        'driver', 'logistics', 'supply', 'warehouse', 'inventory', 'transportation',
        'maintenance', 'cleaning', 'gardening', 'facilities', 'fleet', 'procurement'
      ],
      'digital-technology': [
        'developer', 'programming', 'software', 'database', 'coding', 'algorithm',
        'cybersecurity', 'networking', 'cloud', 'artificial', 'machine', 'data'
      ],
      'health-medical': [
        'medical', 'health', 'clinical', 'patient', 'healthcare', 'medicine',
        'nursing', 'therapy', 'disease', 'treatment', 'diagnosis', 'pharmaceutical'
      ],
      'peace-security': [
        'security', 'protection', 'peacekeeping', 'conflict', 'safety', 'peace',
        'humanitarian', 'crisis', 'emergency', 'risk', 'threat', 'enforcement'
      ],
      'education-training': [
        'education', 'teaching', 'training', 'curriculum', 'learning', 'student',
        'teacher', 'academic', 'pedagogy', 'instruction', 'knowledge', 'skills'
      ],
      'legal-governance': [
        'legal', 'law', 'governance', 'policy', 'regulation', 'compliance',
        'constitutional', 'judicial', 'attorney', 'legislation', 'rights', 'justice'
      ]
    };
    
    const specificTerms = domainSpecificTerms[categoryId] || [];
    
    // Exact match gives high specificity
    if (specificTerms.includes(keywordLower)) {
      return 0.9;
    }
    
    // Partial match gives moderate specificity
    const partialMatch = specificTerms.some(term => 
      keywordLower.includes(term) || term.includes(keywordLower)
    );
    
    if (partialMatch) {
      return 0.6;
    }
    
    // Check if keyword appears in other domain lists (cross-domain penalty)
    const otherDomains = Object.entries(domainSpecificTerms).filter(([id]) => id !== categoryId);
    const appearsInOtherDomains = otherDomains.some(([, terms]) => 
      terms.some(term => keywordLower.includes(term) || term.includes(keywordLower))
    );
    
    if (appearsInOtherDomains) {
      return 0.1; // Low specificity for cross-domain terms
    }
    
    return 0.3; // Neutral specificity
  }

  /**
   * Calculate keyword similarity
   */
  private calculateKeywordSimilarity(keyword: string, categoryKeywords: string[]): number {
    const keywordLower = keyword.toLowerCase();
    
    return Math.max(...categoryKeywords.map(catKeyword => {
      const catKeywordLower = catKeyword.toLowerCase();
      
      if (keywordLower.includes(catKeywordLower) || catKeywordLower.includes(keywordLower)) {
        return 0.8;
      }
      
      const keywordWords = keywordLower.split(' ');
      const catKeywordWords = catKeywordLower.split(' ');
      const overlap = keywordWords.filter(word => catKeywordWords.includes(word)).length;
      
      if (overlap > 0) {
        return overlap / Math.max(keywordWords.length, catKeywordWords.length);
      }
      
      return 0;
    }), 0);
  }

  /**
   * Extract category-specific context pairs from job text
   */
  private extractContextPairs(feedback: JobFeedback): [string, string][] {
    // Only extract from title and labels (most specific)
    const titleText = feedback.jobTitle.toLowerCase();
    const labelsText = feedback.jobLabels.toLowerCase();
    
    const pairs: [string, string][] = [];
    
    // Extract pairs from title (highest priority)
    const titlePairs = this.extractPairsFromText(titleText);
    pairs.push(...titlePairs);
    
    // Extract pairs from skills/labels
    const labelPairs = this.extractPairsFromText(labelsText);
    pairs.push(...labelPairs);
    
    // Filter for category-specific pairs only
    return pairs.filter(pair => this.isCategorySpecificPair(pair, feedback.userCorrection.correctedPrimary));
  }
  
  private extractPairsFromText(text: string): [string, string][] {
    const words = text.match(/\b\w+\b/g) || [];
    const pairs: [string, string][] = [];
    
    for (let i = 0; i < words.length - 1; i++) {
      const word1 = words[i];
      const word2 = words[i + 1];
      
      if (this.isValidKeyword(word1) && this.isValidKeyword(word2)) {
        pairs.push([word1, word2]);
      }
    }
    
    return pairs;
  }
  
  private isCategorySpecificPair(pair: [string, string], categoryId: string): boolean {
    const [word1, word2] = pair;
    const combinedPair = `${word1} ${word2}`;
    
    // Get category-specific keywords
    const category = JOB_CLASSIFICATION_DICTIONARY.find(cat => cat.id === categoryId);
    if (!category) return false;
    
    const categoryKeywords = [...category.coreKeywords, ...category.supportKeywords].map(k => k.toLowerCase());
    
    // At least one word must be category-specific
    const word1InCategory = categoryKeywords.some(keyword => keyword.includes(word1) || word1.includes(keyword));
    const word2InCategory = categoryKeywords.some(keyword => keyword.includes(word2) || word2.includes(keyword));
    
    if (!word1InCategory && !word2InCategory) return false;
    
    // Check if this is a meaningful combination for the category
    return this.isSpecificToCategoryDomain(combinedPair, categoryId);
  }
  
  private isSpecificToCategoryDomain(pair: string, categoryId: string): boolean {
    const pairLower = pair.toLowerCase();
    
    // Category-specific meaningful combinations
    const categorySpecificPairs: Record<string, string[]> = {
      'operations-logistics': [
        'supply chain', 'warehouse management', 'fleet management', 'inventory control',
        'logistics coordination', 'transportation planning', 'facilities maintenance',
        'cleaning services', 'maintenance work', 'gardening services', 'driver license'
      ],
      'digital-technology': [
        'software development', 'data science', 'machine learning', 'artificial intelligence',
        'web development', 'mobile development', 'cloud computing', 'database management',
        'cybersecurity measures', 'network security', 'programming languages', 'software engineering'
      ],
      'health-medical': [
        'medical care', 'health services', 'patient care', 'clinical practice',
        'mental health', 'public health', 'healthcare delivery', 'medical research',
        'health promotion', 'disease prevention', 'health systems', 'medical officer'
      ],
      'peace-security': [
        'peace building', 'conflict resolution', 'security management', 'protection services',
        'peacekeeping operations', 'humanitarian protection', 'safety measures', 'risk assessment',
        'security officer', 'protection standards', 'crisis management', 'emergency response'
      ],
      'education-training': [
        'curriculum development', 'educational programs', 'training materials', 'learning outcomes',
        'student assessment', 'teacher training', 'educational quality', 'capacity building',
        'skills development', 'knowledge transfer', 'educational research', 'learning resources'
      ],
      'legal-governance': [
        'legal framework', 'policy development', 'governance structures', 'legal compliance',
        'regulatory affairs', 'legal analysis', 'policy implementation', 'legal services',
        'constitutional law', 'human rights', 'legal officer', 'policy officer'
      ]
    };
    
    const specificPairs = categorySpecificPairs[categoryId] || [];
    return specificPairs.some(specificPair => 
      pairLower.includes(specificPair) || specificPair.includes(pairLower)
    );
  }

  // Helper methods
  private findExistingPattern(keyword: string, categoryId: string): LearnedPattern | undefined {
    return this.learnedPatterns.get(`${categoryId}-${keyword}`);
  }

  private findJobsWithKeyword(keyword: string, categoryId: string): JobFeedback[] {
    return this.feedbackData.filter(feedback => 
      feedback.userCorrection.correctedPrimary === categoryId &&
      feedback.extractedKeywords?.includes(keyword)
    );
  }

  private findJobsWithContextPair(pair: [string, string], categoryId: string): JobFeedback[] {
    return this.feedbackData.filter(feedback => {
      if (feedback.userCorrection.correctedPrimary !== categoryId) return false;
      const text = `${feedback.jobTitle} ${feedback.jobLabels}`.toLowerCase();
      return text.includes(pair[0]) && text.includes(pair[1]);
    });
  }

  private recordLearningAction(action: Omit<LearningAction, 'id' | 'timestamp'>): void {
    const learningAction: LearningAction = {
      id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...action
    };
    
    this.learningActions.push(learningAction);
    
    // Keep only last 100 actions
    if (this.learningActions.length > 100) {
      this.learningActions = this.learningActions.slice(-100);
    }
  }

  /**
   * Get comprehensive learning insights
   */
  public getLearningInsights(): LearningInsights & { actions: LearningAction[], updates: DictionaryUpdate[] } {
    const totalFeedback = this.feedbackData.length;
    const categoryAccuracy: Record<string, number> = {};
    
    // Calculate category-specific accuracy
    JOB_CLASSIFICATION_DICTIONARY.forEach(category => {
      const categoryFeedback = this.feedbackData.filter(f => 
        f.originalClassification.primary === category.id
      );
      
      if (categoryFeedback.length > 0) {
        const correct = categoryFeedback.filter(f => 
          f.userCorrection.correctedPrimary === category.id
        ).length;
        categoryAccuracy[category.id] = correct / categoryFeedback.length;
      }
    });

    // Analyze misclassifications and suggest keywords
    const misclassificationMap = new Map<string, Map<string, { count: number; keywords: Set<string> }>>();
    
    this.feedbackData.forEach(feedback => {
      const from = feedback.originalClassification.primary;
      const to = feedback.userCorrection.correctedPrimary;
      
      if (from !== to) {
        if (!misclassificationMap.has(from)) {
          misclassificationMap.set(from, new Map());
        }
        
        const fromMap = misclassificationMap.get(from)!;
        if (!fromMap.has(to)) {
          fromMap.set(to, { count: 0, keywords: new Set() });
        }
        
        const entry = fromMap.get(to)!;
        entry.count++;
        feedback.extractedKeywords?.forEach(keyword => entry.keywords.add(keyword));
      }
    });

    const commonMisclassifications = Array.from(misclassificationMap.entries()).flatMap(([from, toMap]) =>
      Array.from(toMap.entries()).map(([to, data]) => ({
        fromCategory: from,
        toCategory: to,
        frequency: data.count,
        commonKeywords: Array.from(data.keywords).slice(0, 5)
      }))
    ).sort((a, b) => b.frequency - a.frequency).slice(0, 10);

    // Generate suggested keywords
    const keywordSuggestions = new Map<string, Map<string, number>>();
    
    this.feedbackData.forEach(feedback => {
      const category = feedback.userCorrection.correctedPrimary;
      feedback.extractedKeywords?.forEach(keyword => {
        if (!keywordSuggestions.has(category)) {
          keywordSuggestions.set(category, new Map());
        }
        
        const categoryMap = keywordSuggestions.get(category)!;
        categoryMap.set(keyword, (categoryMap.get(keyword) || 0) + 1);
      });
    });

    const suggestedKeywords = Array.from(keywordSuggestions.entries()).flatMap(([category, keywords]) =>
      Array.from(keywords.entries())
        .filter(([keyword]) => !FORBIDDEN_LEARNING_KEYWORDS.has(keyword.toLowerCase())) // Filter out forbidden keywords
        .map(([keyword, count]) => {
          // Additional category-specificity check
          const categorySpecificity = this.calculateCategorySpecificity(keyword, category);
          const adjustedConfidence = Math.min(count / this.MIN_FEEDBACK_THRESHOLD, 1.0) * categorySpecificity;
          
          return {
            category,
            keyword,
            confidence: adjustedConfidence,
            supportingJobs: count,
            categorySpecificity
          };
        })
    ).filter(item => 
      item.supportingJobs >= this.MIN_FEEDBACK_THRESHOLD && 
      item.confidence > 0.5 && // Higher threshold
      item.categorySpecificity > 0.4 // Must be category-specific
    ).sort((a, b) => b.confidence - a.confidence)
     .slice(0, 15); // Fewer but better suggestions

    return {
      totalFeedback,
      accuracyImprovement: this.calculateAccuracyImprovement(),
      categoryAccuracy,
      commonMisclassifications,
      suggestedKeywords,
      lastUpdated: new Date().toISOString(),
      actions: this.learningActions.slice(-20), // Last 20 actions
      updates: this.dictionaryUpdates.slice(-10) // Last 10 updates
    };
  }

  private calculateAccuracyImprovement(): number {
    if (this.feedbackData.length < 10) return 0;

    const recentFeedback = this.feedbackData.slice(-50);
    const olderFeedback = this.feedbackData.slice(0, 50);

    const recentAccuracy = this.calculateAccuracy(recentFeedback);
    const olderAccuracy = this.calculateAccuracy(olderFeedback);

    return recentAccuracy - olderAccuracy;
  }

  private calculateAccuracy(feedback: JobFeedback[]): number {
    if (feedback.length === 0) return 0;
    
    const correct = feedback.filter(f => 
      f.originalClassification.primary === f.userCorrection.correctedPrimary
    ).length;
    
    return correct / feedback.length;
  }

  /**
   * Storage methods
   */
  private loadPersistedData(): void {
    try {
      const feedbackData = localStorage.getItem('unifiedLearning_feedback');
      const patterns = localStorage.getItem('unifiedLearning_patterns');
      const updates = localStorage.getItem('unifiedLearning_updates');
      const actions = localStorage.getItem('unifiedLearning_actions');
      
      if (feedbackData) this.feedbackData = JSON.parse(feedbackData);
      if (patterns) this.learnedPatterns = new Map(JSON.parse(patterns));
      if (updates) this.dictionaryUpdates = JSON.parse(updates);
      if (actions) this.learningActions = JSON.parse(actions);
      
      console.log('✅ Loaded unified learning data:', {
        feedback: this.feedbackData.length,
        patterns: this.learnedPatterns.size,
        updates: this.dictionaryUpdates.length,
        actions: this.learningActions.length
      });
    } catch (error) {
      console.warn('Failed to load unified learning data:', error);
    }
  }

  private persistData(): void {
    try {
      localStorage.setItem('unifiedLearning_feedback', JSON.stringify(this.feedbackData.slice(-200))); // Keep last 200
      localStorage.setItem('unifiedLearning_patterns', JSON.stringify(Array.from(this.learnedPatterns.entries())));
      localStorage.setItem('unifiedLearning_updates', JSON.stringify(this.dictionaryUpdates.slice(-50))); // Keep last 50
      localStorage.setItem('unifiedLearning_actions', JSON.stringify(this.learningActions.slice(-100))); // Keep last 100
    } catch (error) {
      console.error('Failed to persist unified learning data:', error);
    }
  }

  /**
   * Clear all learning data (admin function)
   */
  public clearAllData(): void {
    this.feedbackData = [];
    this.learnedPatterns.clear();
    this.dictionaryUpdates = [];
    this.learningActions = [];
    
    localStorage.removeItem('unifiedLearning_feedback');
    localStorage.removeItem('unifiedLearning_patterns');
    localStorage.removeItem('unifiedLearning_updates');
    localStorage.removeItem('unifiedLearning_actions');
    
    console.log('🗑️ Cleared all unified learning data');
  }

  /**
   * Get learning statistics
   */
  public getStats() {
    return {
      totalFeedback: this.feedbackData.length,
      totalPatterns: this.learnedPatterns.size,
      totalUpdates: this.dictionaryUpdates.length,
      totalActions: this.learningActions.length,
      autoAppliedUpdates: this.dictionaryUpdates.filter(u => u.autoApplied).length,
      recentActions: this.learningActions.slice(-5)
    };
  }
}

// Export singleton instance
export const unifiedLearningEngine = UnifiedLearningEngine.getInstance();
