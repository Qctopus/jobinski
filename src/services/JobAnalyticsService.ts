import { JobData, ProcessedJobData, FilterOptions, DashboardMetrics } from '../types';
import { BaseProcessor } from './core/BaseProcessor';
import { JobTransformer } from './core/JobTransformer';
import { CategoryProcessor } from './categorization/CategoryProcessor';
import { JOB_CLASSIFICATION_DICTIONARY } from '../dictionary';
import { GradeClassifier } from './classification/GradeClassifier';
import { LocationClassifier } from './classification/LocationClassifier';
import { SkillClassifier } from './classification/SkillClassifier';
import { MetricsCalculator } from './analytics/MetricsCalculator';
import { CompetitiveAnalyzer, CompetitiveIntelligence } from './analytics/CompetitiveAnalyzer';

/**
 * Main analytics service that orchestrates all data processing operations.
 * This replaces the monolithic JobAnalyticsProcessor with a more modular approach.
 * 
 * Following the Facade pattern to provide a simple interface to the complex subsystem.
 */
export class JobAnalyticsService extends BaseProcessor {
  private jobTransformer: JobTransformer;
  private categoryProcessor: CategoryProcessor;
  private gradeClassifier: GradeClassifier;
  private locationClassifier: LocationClassifier;
  private skillClassifier: SkillClassifier;
  private metricsCalculator: MetricsCalculator;
  private competitiveAnalyzer: CompetitiveAnalyzer;

  constructor() {
    super();
    this.initializeProcessors();
  }

  /**
   * Initialize all specialized processors
   */
  private initializeProcessors(): void {
    this.jobTransformer = new JobTransformer();
    this.categoryProcessor = new CategoryProcessor();
    this.gradeClassifier = new GradeClassifier();
    this.locationClassifier = new LocationClassifier();
    this.skillClassifier = new SkillClassifier();
    this.metricsCalculator = new MetricsCalculator();
    this.competitiveAnalyzer = new CompetitiveAnalyzer();
  }

  /**
   * Process raw job data through the complete analytics pipeline
   */
  processJobData(jobs: JobData[]): ProcessedJobData[] {
    const startTime = Date.now();
    console.log(`JobAnalyticsService: Starting pipeline for ${jobs.length} jobs`);
    
    try {
      // Step 1: Transform raw data
      let processedJobs = this.jobTransformer.transformJobs(jobs);
      console.log(`JobAnalyticsService: Transformed ${processedJobs.length} jobs`);

      // Step 2: Categorize jobs
      processedJobs = this.categoryProcessor.categorizeJobs(processedJobs);
      console.log(`JobAnalyticsService: Categorized ${processedJobs.length} jobs`);

      // Step 3: Classify grades and seniority
      processedJobs = this.gradeClassifier.classifySeniority(processedJobs);
      processedJobs = this.gradeClassifier.classifyGrades(processedJobs);
      console.log(`JobAnalyticsService: Classified grades for ${processedJobs.length} jobs`);

      // Step 4: Classify locations
      processedJobs = this.locationClassifier.classifyLocations(processedJobs);
      console.log(`JobAnalyticsService: Classified locations for ${processedJobs.length} jobs`);

      // Step 5: Classify skill domains
      processedJobs = this.skillClassifier.classifySkillDomains(processedJobs);
      console.log(`JobAnalyticsService: Classified skills for ${processedJobs.length} jobs`);

      this.logPerformance('Complete Job Processing Pipeline', startTime, jobs.length);
      console.log(`JobAnalyticsService: Pipeline completed successfully for ${processedJobs.length} jobs`);
      
      return processedJobs;

    } catch (error) {
      console.error('JobAnalyticsService: Pipeline failed:', error);
      throw new Error(`Failed to process job data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate dashboard metrics using the specialized calculator
   */
  calculateDashboardMetrics(data: ProcessedJobData[], filters: FilterOptions): DashboardMetrics {
    try {
      return this.metricsCalculator.calculateDashboardMetrics(data, filters);
    } catch (error) {
      console.error('JobAnalyticsService: Metrics calculation failed:', error);
      throw new Error(`Failed to calculate metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate competitive intelligence
   */
  calculateCompetitiveIntelligence(data: ProcessedJobData[], expandSecretariat: boolean = true): CompetitiveIntelligence {
    try {
      return this.competitiveAnalyzer.calculateCompetitiveIntelligence(data, expandSecretariat);
    } catch (error) {
      console.error('JobAnalyticsService: Competitive analysis failed:', error);
      throw new Error(`Failed to calculate competitive intelligence: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Apply filters to processed data
   */
  applyFilters(data: ProcessedJobData[], filters: FilterOptions): ProcessedJobData[] {
    try {
      let filtered = this.applyAgencyFilter(data, filters.selectedAgency);
      filtered = this.applyTimeFilter(filtered, filters.timeRange);
      return filtered;
    } catch (error) {
      console.error('JobAnalyticsService: Filtering failed:', error);
      return data; // Return unfiltered data as fallback
    }
  }

  /**
   * Calculate temporal trends (delegated to competitive analyzer for now)
   */
  calculateTemporalTrends(data: ProcessedJobData[], months: number = 12): any {
    try {
      const startTime = Date.now();
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);
      
      const timeFilteredData = data.filter(job => {
        const postingDate = new Date(job.posting_date);
        return postingDate >= startDate;
      });

      if (timeFilteredData.length === 0) {
        return {
          agencyTimeSeries: [],
          categoryTimeSeries: [],
          seasonalPatterns: [],
          emergingCategories: [],
          decliningCategories: [],
          velocityIndicators: [],
          emergingTrends: {
            newCategories: [],
            velocityIndicators: []
          }
        };
      }

      // Use TemporalAnalyzer to get proper snapshots that consider jobs OPEN during each period
      const { calculateTemporalSnapshots, getJobsOpenInPeriod } = require('../utils/temporalAnalysis');
      const snapshots = calculateTemporalSnapshots(timeFilteredData, 'month');

      // 1. Agency Time Series Analysis - based on jobs OPEN during each period
      const agencyMonthlyData = new Map<string, Map<string, number>>();
      const categoryMonthlyData = new Map<string, Map<string, number>>();
      const seasonalData = new Map<number, { totalJobs: number; categories: Map<string, number> }>();

      // Process each month's snapshot
      snapshots.forEach(snapshot => {
        const month = snapshot.period;
        const jobsOpenInPeriod = getJobsOpenInPeriod(timeFilteredData, month, 'month');

        // Initialize maps for this month
        if (!agencyMonthlyData.has(month)) {
          agencyMonthlyData.set(month, new Map());
        }
        if (!categoryMonthlyData.has(month)) {
          categoryMonthlyData.set(month, new Map());
        }

        const monthData = agencyMonthlyData.get(month)!;
        const categoryMonth = categoryMonthlyData.get(month)!;

        // Count jobs by agency and category for jobs that were OPEN during this period
        jobsOpenInPeriod.forEach(job => {
          const agency = job.short_agency || job.long_agency || 'Unknown';
          const category = job.primary_category || 'Other';
          
          // Agency counts
          monthData.set(agency, (monthData.get(agency) || 0) + 1);
          monthData.set('total', (monthData.get('total') || 0) + 1);

          // Category counts
          categoryMonth.set(category, (categoryMonth.get(category) || 0) + 1);
        });

        // Seasonal patterns (by calendar month number from snapshot period)
        // Extract month number from period string (e.g., "2024-09" -> 8)
        const periodParts = month.split('-');
        if (periodParts.length === 2) {
          const monthNumber = parseInt(periodParts[1]) - 1; // 0-11
          if (!seasonalData.has(monthNumber)) {
            seasonalData.set(monthNumber, { totalJobs: 0, categories: new Map() });
          }
          const seasonal = seasonalData.get(monthNumber)!;
          seasonal.totalJobs += jobsOpenInPeriod.length;
          
          // Count categories for this period
          jobsOpenInPeriod.forEach(job => {
            const category = job.primary_category || 'Other';
            seasonal.categories.set(category, (seasonal.categories.get(category) || 0) + 1);
          });
        }
      });

      // Convert to required format
      const agencyTimeSeries = Array.from(agencyMonthlyData.entries())
        .map(([month, agencies]) => {
          const result: any = { month };
          agencies.forEach((count, agency) => {
            result[agency] = count;
          });
          return result;
        })
        .sort((a, b) => a.month.localeCompare(b.month));

      const categoryTimeSeries = Array.from(categoryMonthlyData.entries())
        .map(([month, categories]) => {
          const result: any = { month };
          categories.forEach((count, category) => {
            result[category] = count;
          });
          return result;
        })
        .sort((a, b) => a.month.localeCompare(b.month));

      // 2. Seasonal Patterns
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const seasonalPatterns = Array.from(seasonalData.entries())
        .map(([monthNum, data]) => {
          const topCategories = Array.from(data.categories.entries())
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([cat]) => cat);
          
          return {
            month: monthNum,
            monthName: monthNames[monthNum],
            totalJobs: data.totalJobs,
            peakCategories: topCategories
          };
        })
        .sort((a, b) => a.month - b.month);

      // 3. Emerging and Declining Categories
      const allMonths = Array.from(categoryMonthlyData.keys()).sort();
      const firstHalf = allMonths.slice(0, Math.floor(allMonths.length / 2));
      const secondHalf = allMonths.slice(Math.floor(allMonths.length / 2));

      const firstHalfTotals = new Map<string, number>();
      const secondHalfTotals = new Map<string, number>();

      firstHalf.forEach(month => {
        const monthData = categoryMonthlyData.get(month) || new Map();
        monthData.forEach((count, category) => {
          firstHalfTotals.set(category, (firstHalfTotals.get(category) || 0) + count);
        });
      });

      secondHalf.forEach(month => {
        const monthData = categoryMonthlyData.get(month) || new Map();
        monthData.forEach((count, category) => {
          secondHalfTotals.set(category, (secondHalfTotals.get(category) || 0) + count);
        });
      });

      const emergingCategories = [];
      const decliningCategories = [];
      const velocityIndicators = [];

      // Compare first half vs second half to identify trends
      const allCategories = new Set([...firstHalfTotals.keys(), ...secondHalfTotals.keys()]);
      
      allCategories.forEach(category => {
        const firstCount = firstHalfTotals.get(category) || 0;
        const secondCount = secondHalfTotals.get(category) || 0;
        
        if (firstCount === 0 && secondCount > 0) {
          // New category
          emergingCategories.push({
            category,
            firstAppeared: secondHalf[0],
            growth: secondCount
          });
        } else if (firstCount > 0 && secondCount === 0) {
          // Declining category
          decliningCategories.push({
            category,
            lastSeen: firstHalf[firstHalf.length - 1],
            decline: 100
          });
        } else if (firstCount > 0) {
          // Calculate velocity
          const growthRate = ((secondCount - firstCount) / firstCount) * 100;
          if (Math.abs(growthRate) > 10) { // Only include significant changes
            velocityIndicators.push({
              category,
              acceleration: Math.abs(growthRate),
              trend: growthRate > 0 ? 'rising' : 'falling'
            });
          }
        }
      });

      // Sort by impact
      emergingCategories.sort((a, b) => b.growth - a.growth);
      decliningCategories.sort((a, b) => b.decline - a.decline);
      velocityIndicators.sort((a, b) => b.acceleration - a.acceleration);

      this.logPerformance('Temporal Trends Analysis', startTime, data.length);

      return {
        agencyTimeSeries,
        categoryTimeSeries,
        seasonalPatterns,
        emergingCategories: emergingCategories.slice(0, 10),
        decliningCategories: decliningCategories.slice(0, 10),
        velocityIndicators: velocityIndicators.slice(0, 15),
        emergingTrends: {
          newCategories: emergingCategories,
          velocityIndicators: velocityIndicators
        }
      };
    } catch (error) {
      console.error('JobAnalyticsService: Temporal analysis failed:', error);
      return {
        agencyTimeSeries: [],
        categoryTimeSeries: [],
        seasonalPatterns: [],
        emergingCategories: [],
        decliningCategories: [],
        velocityIndicators: [],
        emergingTrends: {
          newCategories: [],
          velocityIndicators: []
        }
      };
    }
  }

  /**
   * Analyze language requirements using existing logic
   */
  analyzeLanguageRequirements(data: ProcessedJobData[]): any {
    try {
      const startTime = Date.now();
      
      const languageStats = {
        requiredLanguages: new Map<string, number>(),
        desiredLanguages: new Map<string, number>(),
        multilingualJobs: 0,
        averageLanguageCount: 0,
        languagePairs: new Map<string, number>(),
        agencyLanguageProfiles: new Map<string, { required: string[], desired: string[], count: number }>()
      };

      data.forEach(job => {
        const agency = job.short_agency || job.long_agency || 'Unknown';
        
        if (!languageStats.agencyLanguageProfiles.has(agency)) {
          languageStats.agencyLanguageProfiles.set(agency, { required: [], desired: [], count: 0 });
        }
        
        const agencyProfile = languageStats.agencyLanguageProfiles.get(agency)!;
        agencyProfile.count++;

        // Simple language parsing from languages field
        const languages = (job.languages || '').split(',').map(l => l.trim()).filter(l => l.length > 0);
        
        languages.forEach(lang => {
          languageStats.requiredLanguages.set(lang, (languageStats.requiredLanguages.get(lang) || 0) + 1);
          if (!agencyProfile.required.includes(lang)) {
            agencyProfile.required.push(lang);
          }
        });

        if (languages.length > 1) {
          languageStats.multilingualJobs++;
        }

        if (languages.length === 2) {
          const pair = languages.sort().join(' + ');
          languageStats.languagePairs.set(pair, (languageStats.languagePairs.get(pair) || 0) + 1);
        }
      });

      const totalLanguageRequirements = Array.from(languageStats.requiredLanguages.values())
        .reduce((sum, count) => sum + count, 0);
      languageStats.averageLanguageCount = totalLanguageRequirements / Math.max(data.length, 1);

      this.logPerformance('Language Analysis', startTime, data.length);

      return {
        requiredLanguages: Array.from(languageStats.requiredLanguages.entries())
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10),
        desiredLanguages: [],
        multilingualJobsPercentage: this.calculatePercentage(languageStats.multilingualJobs, data.length),
        averageLanguageCount: Math.round(languageStats.averageLanguageCount * 10) / 10,
        topLanguagePairs: Array.from(languageStats.languagePairs.entries())
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5),
        agencyLanguageProfiles: Array.from(languageStats.agencyLanguageProfiles.entries())
          .map(([agency, profile]) => ({
            agency,
            requiredLanguages: [...new Set(profile.required)],
            desiredLanguages: [],
            totalJobs: profile.count,
            languageDiversity: [...new Set(profile.required)].length
          }))
          .sort((a, b) => b.totalJobs - a.totalJobs)
          .slice(0, 10)
      };
    } catch (error) {
      console.error('JobAnalyticsService: Language analysis failed:', error);
      return {
        requiredLanguages: [],
        desiredLanguages: [],
        multilingualJobsPercentage: 0,
        averageLanguageCount: 0,
        topLanguagePairs: [],
        agencyLanguageProfiles: []
      };
    }
  }

  /**
   * Get detailed statistics from all processors
   */
  getDetailedStatistics(data: ProcessedJobData[]): {
    categories: any;
    grades: any;
    locations: any;
    skills: any;
    marketConcentration: any;
  } {
    try {
      return {
        categories: this.categoryProcessor.getAllCategories(),
        grades: this.gradeClassifier.getGradeStatistics(data),
        locations: this.locationClassifier.getLocationStatistics(data),
        skills: this.skillClassifier.getSkillDomainStatistics(data),
        marketConcentration: this.competitiveAnalyzer.getMarketConcentration(data)
      };
    } catch (error) {
      console.error('JobAnalyticsService: Statistics calculation failed:', error);
      return {
        categories: [],
        grades: { gradeDistribution: new Map(), seniorityDistribution: new Map(), consultantPercentage: 0, averageNumericGrade: 0 },
        locations: { locationTypeDistribution: new Map(), regionDistribution: new Map(), conflictZonePercentage: 0, developingCountryPercentage: 0, topCountries: [] },
        skills: { domainDistribution: new Map(), complexityDistribution: new Map(), averageScores: { technical: 0, operational: 0, strategic: 0 } },
        marketConcentration: { herfindahlIndex: 0, topNConcentration: { top3: 0, top5: 0, top10: 0 }, marketLeader: { agency: 'Unknown', marketShare: 0 } }
      };
    }
  }

  /**
   * Calculate detailed analytics for a specific category
   */
  calculateCategoryAnalytics(data: ProcessedJobData[], category: string): any {
    try {
      const categoryJobs = data.filter(job => job.primary_category === category);
      
      if (categoryJobs.length === 0) {
        return null;
      }

      // Calculate comprehensive analytics for the category
      return this.metricsCalculator.calculateCategorySpecificAnalytics(categoryJobs, data, category);
    } catch (error) {
      console.error('JobAnalyticsService: Category analytics calculation failed:', error);
      return null;
    }
  }

  /**
   * Get job categories (exposed for backward compatibility)
   */
  getJobCategories() {
    return JOB_CLASSIFICATION_DICTIONARY;
  }

  /**
   * Health check for all processors
   */
  healthCheck(): { status: 'healthy' | 'degraded' | 'unhealthy'; issues: string[] } {
    const issues: string[] = [];
    
    try {
      // Basic checks for each processor
      if (!this.jobTransformer) issues.push('JobTransformer not initialized');
      if (!this.categoryProcessor) issues.push('CategoryProcessor not initialized');
      if (!this.gradeClassifier) issues.push('GradeClassifier not initialized');
      if (!this.locationClassifier) issues.push('LocationClassifier not initialized');
      if (!this.skillClassifier) issues.push('SkillClassifier not initialized');
      if (!this.metricsCalculator) issues.push('MetricsCalculator not initialized');
      if (!this.competitiveAnalyzer) issues.push('CompetitiveAnalyzer not initialized');

      const status = issues.length === 0 ? 'healthy' : 
                     issues.length <= 2 ? 'degraded' : 'unhealthy';

      return { status, issues };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        issues: [`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`] 
      };
    }
  }
}

