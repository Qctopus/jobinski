// Simple persistence for user corrections
const CORRECTIONS_KEY = 'job_category_corrections';

export interface StoredCorrection {
  jobId: string;
  originalCategory: string;
  correctedCategory: string;
  timestamp: string;
}

export const saveCorrection = (correction: StoredCorrection): void => {
  try {
    const existing = getStoredCorrections();
    const updated = existing.filter(c => c.jobId !== correction.jobId); // Remove any existing correction for this job
    updated.push(correction);
    
    sessionStorage.setItem(CORRECTIONS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save correction:', error);
  }
};

export const getStoredCorrections = (): StoredCorrection[] => {
  try {
    const stored = sessionStorage.getItem(CORRECTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load corrections:', error);
    return [];
  }
};

export const getCorrectionsMap = (): Map<string, string> => {
  const corrections = getStoredCorrections();
  const map = new Map<string, string>();
  
  corrections.forEach(correction => {
    map.set(correction.jobId, correction.correctedCategory);
  });
  
  return map;
};

export const clearAllCorrections = (): void => {
  try {
    sessionStorage.removeItem(CORRECTIONS_KEY);
  } catch (error) {
    console.error('Failed to clear corrections:', error);
  }
};

export const getCorrectionCount = (): number => {
  return getStoredCorrections().length;
};
