// Feedback and learning system types

export interface JobFeedback {
  id: string;
  jobId: string;
  jobTitle: string;
  jobDescription: string;
  jobLabels: string;
  
  // Classification results
  originalClassification: {
    primary: string;
    confidence: number;
    secondary: string[];
    reasoning: string[];
  };
  
  // User feedback
  userCorrection: {
    correctedPrimary: string;
    reason: 'incorrect_category' | 'missing_keywords' | 'poor_confidence' | 'confirmed_correct' | 'other';
    userComment?: string;
    timestamp: string;
    userId?: string;
  };
  
  // Learning impact
  learningStatus: 'pending' | 'analyzed' | 'applied' | 'rejected';
  extractedKeywords: string[];
  suggestedChanges?: DictionaryUpdateSuggestion[];
}

export interface DictionaryUpdateSuggestion {
  categoryId: string;
  action: 'add_core_keyword' | 'add_support_keyword' | 'add_context_pair' | 'remove_keyword';
  keyword: string;
  contextPair?: [string, string];
  confidence: number;
  supportingJobs: string[]; // Job IDs that support this change
  frequency: number; // How often this pattern appears
}

export interface LearningInsights {
  totalFeedback: number;
  accuracyImprovement: number;
  categoryAccuracy: Record<string, number>;
  commonMisclassifications: Array<{
    fromCategory: string;
    toCategory: string;
    frequency: number;
    commonKeywords: string[];
  }>;
  suggestedKeywords: Array<{
    category: string;
    keyword: string;
    confidence: number;
    supportingJobs: number;
  }>;
  lastUpdated: string;
}

export interface FeedbackAnalytics {
  totalSubmissions: number;
  accuracyTrend: Array<{
    date: string;
    accuracy: number;
    totalJobs: number;
  }>;
  categoryPerformance: Array<{
    category: string;
    accuracy: number;
    totalFeedback: number;
    improvementTrend: number;
  }>;
  topMisclassifiedPatterns: Array<{
    pattern: string;
    incorrectCategory: string;
    correctCategory: string;
    frequency: number;
  }>;
}
