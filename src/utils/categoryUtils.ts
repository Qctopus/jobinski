/**
 * Category Utilities
 * 
 * Central helper for looking up category information from the dictionary.
 * Ensures consistent category names and colors across the entire app.
 */

import { JOB_CLASSIFICATION_DICTIONARY } from '../dictionary';

/**
 * All 17 category IDs in the system
 */
export const ALL_CATEGORY_IDS = [
  'leadership-executive',
  'digital-technology',
  'climate-environment',
  'health-medical',
  'agriculture-food-security',
  'education-development',
  'social-affairs-human-rights',
  'peace-security',
  'humanitarian-emergency',
  'governance-rule-of-law',
  'legal-compliance',
  'economic-affairs-trade',
  'policy-strategic-planning',
  'communications-partnerships',
  'operations-administration',
  'supply-chain-logistics',
  'translation-interpretation',
] as const;

export type CategoryId = typeof ALL_CATEGORY_IDS[number];

/**
 * Category info returned by lookup functions
 */
export interface CategoryInfo {
  id: string;
  name: string;
  shortName: string;
  color: string;
  description?: string;
}

/**
 * Format a category key to a readable name (fallback)
 */
export const formatCategoryKey = (key: string): string => {
  return key
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Get category info by ID
 * Falls back to formatted key if not found in dictionary
 */
export const getCategoryById = (categoryId: string): CategoryInfo => {
  const entry = JOB_CLASSIFICATION_DICTIONARY.find(cat => cat.id === categoryId);
  
  if (entry) {
    return {
      id: entry.id,
      name: entry.name,
      shortName: entry.name.split(/[-&]/)[0]?.trim() || entry.name,
      color: entry.color,
      description: entry.description,
    };
  }

  // Fallback for unknown categories
  const formattedName = formatCategoryKey(categoryId);
  return {
    id: categoryId,
    name: formattedName,
    shortName: formattedName.split(/[-&]/)[0]?.trim() || formattedName,
    color: '#6B7280', // Gray default
  };
};

/**
 * Get all categories with their info
 */
export const getAllCategories = (): CategoryInfo[] => {
  return JOB_CLASSIFICATION_DICTIONARY.map(cat => ({
    id: cat.id,
    name: cat.name,
    shortName: cat.name.split(/[-&]/)[0]?.trim() || cat.name,
    color: cat.color,
    description: cat.description,
  }));
};

/**
 * Get category color by ID
 */
export const getCategoryColor = (categoryId: string): string => {
  const entry = JOB_CLASSIFICATION_DICTIONARY.find(cat => cat.id === categoryId);
  return entry?.color || '#6B7280';
};

/**
 * Get category name by ID
 */
export const getCategoryName = (categoryId: string): string => {
  const entry = JOB_CLASSIFICATION_DICTIONARY.find(cat => cat.id === categoryId);
  return entry?.name || formatCategoryKey(categoryId);
};

/**
 * Get short category name by ID (first part before - or &)
 */
export const getCategoryShortName = (categoryId: string): string => {
  const name = getCategoryName(categoryId);
  return name.split(/[-&]/)[0]?.trim() || name;
};

/**
 * Check if a category ID is valid
 */
export const isValidCategoryId = (categoryId: string): boolean => {
  return JOB_CLASSIFICATION_DICTIONARY.some(cat => cat.id === categoryId);
};

/**
 * Create a category ID to name map for quick lookups
 */
export const createCategoryNameMap = (): Map<string, string> => {
  const map = new Map<string, string>();
  JOB_CLASSIFICATION_DICTIONARY.forEach(cat => {
    map.set(cat.id, cat.name);
  });
  return map;
};

/**
 * Create a category ID to color map for quick lookups
 */
export const createCategoryColorMap = (): Map<string, string> => {
  const map = new Map<string, string>();
  JOB_CLASSIFICATION_DICTIONARY.forEach(cat => {
    map.set(cat.id, cat.color);
  });
  return map;
};





