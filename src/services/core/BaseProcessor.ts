import { JobData, FilterOptions } from '../../types';
import { differenceInDays, parseISO, subMonths, isAfter } from 'date-fns';

/**
 * Base processor class with common utilities and data transformation methods.
 * Follows the Single Responsibility Principle for core data operations.
 */
export abstract class BaseProcessor {
  /**
   * Safely parse a date string with fallback
   */
  protected parseDate(dateString: string, fallback: Date = new Date()): Date {
    try {
      const parsed = parseISO(dateString);
      return isNaN(parsed.getTime()) ? fallback : parsed;
    } catch {
      return fallback;
    }
  }

  /**
   * Calculate application window days between two dates
   */
  protected calculateApplicationWindow(postingDate: Date, applyUntilDate: Date): number {
    return Math.max(0, differenceInDays(applyUntilDate, postingDate));
  }

  /**
   * Extract relevant experience from job requirements
   */
  protected extractRelevantExperience(job: JobData): number {
    const experiences = [
      job.hs_min_exp || 0, 
      job.bachelor_min_exp || 0, 
      job.master_min_exp || 0
    ];
    return Math.max(...experiences);
  }

  /**
   * Count languages from language field
   */
  protected countLanguages(languagesField?: string): number {
    if (!languagesField) return 0;
    return languagesField.split(/[,;/|]/).filter(lang => lang.trim().length > 0).length;
  }

  /**
   * Determine if position is home-based from duty station
   */
  protected isHomeBased(dutyStation: string): boolean {
    const station = dutyStation.toLowerCase();
    return station.includes('home based') || 
           station.includes('remote') ||
           station.includes('telecommuting');
  }

  /**
   * Apply time-based filters to data
   */
  protected applyTimeFilter<T extends { posting_date: string }>(
    data: T[], 
    timeRange: FilterOptions['timeRange']
  ): T[] {
    if (timeRange === 'all') return data;

    const now = new Date();
    let cutoffDate: Date;
    
    switch (timeRange) {
      case '4weeks':
        cutoffDate = subMonths(now, 1); // ~4 weeks
        break;
      case '8weeks':
        cutoffDate = subMonths(now, 2); // ~8 weeks
        break;
      case '3months':
        cutoffDate = subMonths(now, 3);
        break;
      case '6months':
        cutoffDate = subMonths(now, 6);
        break;
      case '1year':
        cutoffDate = subMonths(now, 12);
        break;
      default:
        return data;
    }

    return data.filter(item => {
      try {
        const postingDate = this.parseDate(item.posting_date);
        return isAfter(postingDate, cutoffDate);
      } catch {
        return true; // Include items with unparseable dates
      }
    });
  }

  /**
   * Apply agency filter to data
   */
  protected applyAgencyFilter<T extends { short_agency?: string; long_agency?: string }>(
    data: T[], 
    selectedAgency: string
  ): T[] {
    if (selectedAgency === 'all') return data;
    
    return data.filter(item => 
      (item.short_agency || item.long_agency) === selectedAgency
    );
  }

  /**
   * Safe string operations with null checking
   */
  protected safeString(value: any): string {
    return value == null ? '' : String(value);
  }

  /**
   * Calculate percentage with safe division
   */
  protected calculatePercentage(value: number, total: number): number {
    return total > 0 ? (value / total) * 100 : 0;
  }

  /**
   * Get top N items from a frequency map
   */
  protected getTopItems<T>(
    frequencyMap: Map<T, number>, 
    limit: number
  ): { item: T; count: number; percentage: number }[] {
    const total = Array.from(frequencyMap.values()).reduce((sum, count) => sum + count, 0);
    
    return Array.from(frequencyMap.entries())
      .map(([item, count]) => ({
        item,
        count,
        percentage: this.calculatePercentage(count, total)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Generate cache key for memoization
   */
  protected generateCacheKey(operation: string, ...params: any[]): string {
    const paramString = params.map(p => 
      typeof p === 'object' ? JSON.stringify(p) : String(p)
    ).join('-');
    return `${operation}-${paramString}`;
  }

  /**
   * Validate data integrity
   */
  protected validateJobData(job: JobData): boolean {
    return !!(job.id && job.title && job.posting_date);
  }

  /**
   * Log performance metrics in development
   */
  protected logPerformance(operation: string, startTime: number, dataSize: number): void {
    if (process.env.NODE_ENV === 'development') {
      const duration = Date.now() - startTime;
      console.log(`[Performance] ${operation}: ${duration}ms for ${dataSize} items`);
    }
  }
}
