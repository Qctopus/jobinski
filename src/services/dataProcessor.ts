// LEGACY FILE - DEPRECATED
// This file is kept only for backward compatibility
// All new development should use JobAnalyticsService and JOB_CLASSIFICATION_DICTIONARY

import { JobCategory } from '../types';
import { JOB_CLASSIFICATION_DICTIONARY } from '../dictionary';

// Legacy job categories exported for backward compatibility only
// These are automatically generated from the advanced dictionary
export const JOB_CATEGORIES: JobCategory[] = JOB_CLASSIFICATION_DICTIONARY.map(cat => ({
  id: cat.id,
  name: cat.name,
  keywords: cat.coreKeywords,
  color: cat.color,
  description: cat.description
}));

// Legacy JobAnalyticsProcessor class - DEPRECATED
// Use JobAnalyticsService instead
export class JobAnalyticsProcessor {
  constructor() {
    console.warn('JobAnalyticsProcessor is deprecated. Use JobAnalyticsService instead.');
  }

  // All methods would throw deprecation warnings
  categorizeJob() {
    throw new Error('JobAnalyticsProcessor.categorizeJob is deprecated. Use JobAnalyticsService instead.');
  }

  calculateDashboardMetrics() {
    throw new Error('JobAnalyticsProcessor.calculateDashboardMetrics is deprecated. Use JobAnalyticsService instead.');
  }

  calculateCategoryAnalytics() {
    throw new Error('JobAnalyticsProcessor.calculateCategoryAnalytics is deprecated. Use JobAnalyticsService instead.');
  }

  // Add other methods as needed with deprecation warnings
}

// Re-export from the correct location for any remaining imports
export { JobAnalyticsService } from './JobAnalyticsService';
