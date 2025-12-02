/**
 * Consolidated Formatting Utilities
 * 
 * Central location for all number, percentage, and change formatting functions.
 * Used by Intelligence Brief Generator, Narrative Generator, and other analytics components.
 */

/**
 * Format a number with locale-specific thousands separators
 */
export const formatNumber = (n: number): string => {
  if (n >= 1000) {
    return n.toLocaleString();
  }
  return String(n);
};

/**
 * Format a percentage value
 * @param n - The percentage value (e.g., 75.5 for 75.5%)
 * @param decimals - Number of decimal places (default: 0)
 */
export const formatPercent = (n: number, decimals = 0): string => {
  return `${n.toFixed(decimals)}%`;
};

/**
 * Format a change value with + prefix for positive numbers
 * @param n - The change percentage
 * @param decimals - Number of decimal places (default: 0)
 */
export const formatChange = (n: number, decimals = 0): string => {
  if (Math.abs(n) < 1) return 'unchanged';
  return n > 0 ? `+${n.toFixed(decimals)}%` : `${n.toFixed(decimals)}%`;
};

/**
 * Format a percentage point change with pp suffix
 */
export const formatPPChange = (n: number): string => {
  if (Math.abs(n) < 1) return 'unchanged';
  return n > 0 ? `+${n.toFixed(0)}pp` : `${n.toFixed(0)}pp`;
};

/**
 * Format days with 'd' suffix
 */
export const formatDays = (n: number): string => {
  return `${n.toFixed(0)}d`;
};

/**
 * Get a descriptive word for change direction and magnitude
 */
export const getChangeWord = (change: number, threshold = 20): string => {
  if (Math.abs(change) < 3) return 'steady';
  if (Math.abs(change) < 5) return 'remained steady at';
  if (Math.abs(change) < 10) return change > 0 ? 'increased' : 'decreased';
  if (Math.abs(change) < threshold) return change > 0 ? 'increased to' : 'decreased to';
  if (Math.abs(change) < 50) return change > 0 ? 'rose significantly to' : 'fell notably to';
  return change > 0 ? 'surged' : 'dropped sharply';
};

/**
 * Get a descriptive phrase for change direction
 */
export const formatChangeDescription = (change: number, threshold = 5): string => {
  if (Math.abs(change) < threshold) return 'unchanged from';
  return change > 0 ? 'up from' : 'down from';
};

/**
 * Get magnitude descriptor based on thresholds
 */
export const getMagnitudeWord = (value: number, thresholds: [number, number, number]): string => {
  if (value >= thresholds[2]) return 'highest';
  if (value >= thresholds[1]) return 'high';
  if (value <= thresholds[0]) return 'low';
  return 'moderate';
};

/**
 * Format ordinal number (1st, 2nd, 3rd, etc.)
 */
export const getOrdinal = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

/**
 * Format a count with appropriate pluralization
 */
export const formatCount = (count: number, singular: string, plural?: string): string => {
  const word = count === 1 ? singular : (plural || `${singular}s`);
  return `${formatNumber(count)} ${word}`;
};

/**
 * Format a ratio as a percentage
 * @param numerator - The numerator
 * @param denominator - The denominator
 * @param decimals - Number of decimal places
 */
export const formatRatio = (numerator: number, denominator: number, decimals = 0): string => {
  if (denominator === 0) return '0%';
  return formatPercent((numerator / denominator) * 100, decimals);
};


