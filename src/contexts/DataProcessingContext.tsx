import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { ProcessedJobData, FilterOptions, DashboardMetrics } from '../types';
import { JOB_CLASSIFICATION_DICTIONARY } from '../dictionary';
import { JobAnalyticsService } from '../services/JobAnalyticsService';
import { TemporalAnalyzer } from '../services/analytics/TemporalAnalyzer';
import { CategoryEvolutionAnalyzer } from '../services/analytics/CategoryEvolutionAnalyzer';
import { CompetitiveEvolutionTracker } from '../services/analytics/CompetitiveEvolutionTracker';
import { WorkforceAnalyzer } from '../services/analytics/WorkforceAnalyzer';
import { SkillDemandAnalyzer } from '../services/analytics/SkillDemandAnalyzer';
import { JobInsightsService } from '../services/JobInsightsService';

interface ProcessedDataResults {
  filteredData: ProcessedJobData[];
  marketData: ProcessedJobData[];
  metrics: DashboardMetrics;
  marketMetrics: DashboardMetrics;
  isAgencyView: boolean;
  selectedAgencyName: string;
}

interface DataProcessingContextType {
  processor: JobAnalyticsService;
  processData: (data: ProcessedJobData[], filters: FilterOptions) => ProcessedDataResults;

  // Cached results to avoid recalculation
  getFilteredData: (data: ProcessedJobData[], filters: FilterOptions) => ProcessedJobData[];
  getMarketData: (data: ProcessedJobData[], timeRange: string) => ProcessedJobData[];
  getMetrics: (data: ProcessedJobData[], filters: FilterOptions) => DashboardMetrics;
  getMarketMetrics: (data: ProcessedJobData[], timeRange: string) => DashboardMetrics;

  // Utility methods
  getCategoriesChartData: (metrics: DashboardMetrics) => any[];
  getAgenciesChartData: (metrics: DashboardMetrics) => any[];

  // Competitive analysis methods
  getCompetitiveIntelligence: (data: ProcessedJobData[], expandSecretariat?: boolean) => any;
  getTemporalTrends: (data: ProcessedJobData[], months?: number) => any;

  // Language and skills analysis
  getLanguageAnalysis: (data: ProcessedJobData[]) => any;
  getSkillsAnalysis: (data: ProcessedJobData[]) => any;

  // New analyzers (Phase 2 integration)
  temporalAnalyzer: TemporalAnalyzer;
  categoryEvolutionAnalyzer: CategoryEvolutionAnalyzer;
  competitiveEvolutionTracker: CompetitiveEvolutionTracker;
  workforceAnalyzer: WorkforceAnalyzer;
  skillDemandAnalyzer: SkillDemandAnalyzer;
  jobInsightsService: JobInsightsService;
}

const DataProcessingContext = createContext<DataProcessingContextType | undefined>(undefined);

interface DataProcessingProviderProps {
  children: React.ReactNode;
}

export const DataProcessingProvider: React.FC<DataProcessingProviderProps> = ({ children }) => {
  // Single analytics service instance shared across the app
  const processor = useMemo(() => new JobAnalyticsService(), []);

  // New analyzer instances (Phase 2)
  const temporalAnalyzer = useMemo(() => new TemporalAnalyzer(), []);
  const categoryEvolutionAnalyzer = useMemo(() => new CategoryEvolutionAnalyzer(), []);
  const competitiveEvolutionTracker = useMemo(() => new CompetitiveEvolutionTracker(), []);
  const workforceAnalyzer = useMemo(() => new WorkforceAnalyzer(), []);
  const skillDemandAnalyzer = useMemo(() => new SkillDemandAnalyzer(), []);
  const jobInsightsService = useMemo(() => new JobInsightsService(), []);

  // Cache for expensive calculations to avoid recalculation
  const cache = useMemo(() => new Map<string, any>(), []);

  // Helper function to generate cache keys
  const getCacheKey = useCallback((operation: string, data: any[], filters?: any) => {
    const dataHash = data.length + data[0]?.id + data[data.length - 1]?.id;
    const filtersHash = filters ? JSON.stringify(filters) : '';
    return `${operation}-${dataHash}-${filtersHash}`;
  }, []);

  // Cached data filtering with error handling
  const getFilteredData = useCallback((data: ProcessedJobData[], filters: FilterOptions): ProcessedJobData[] => {
    try {
      const cacheKey = getCacheKey('filtered', data, filters);

      if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
      }

      const result = processor.applyFilters(data, filters);
      cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error filtering data:', error);
      // Return original data as fallback
      return data;
    }
  }, [processor, cache, getCacheKey]);

  // Cached market data (always unfiltered by agency)
  const getMarketData = useCallback((data: ProcessedJobData[], timeRange: string): ProcessedJobData[] => {
    const marketFilters: FilterOptions = { selectedAgency: 'all', timeRange: timeRange as any };
    const cacheKey = getCacheKey('market', data, marketFilters);

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    const result = processor.applyFilters(data, marketFilters);
    cache.set(cacheKey, result);
    return result;
  }, [processor, cache, getCacheKey]);

  // Cached metrics calculation with error handling
  const getMetrics = useCallback((data: ProcessedJobData[], filters: FilterOptions): DashboardMetrics => {
    try {
      const cacheKey = getCacheKey('metrics', data, filters);

      if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
      }

      const result = processor.calculateDashboardMetrics(data, filters);
      cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error calculating metrics:', error);
      // Return empty metrics as fallback
      return {
        totalJobs: 0,
        totalAgencies: 0,
        totalDepartments: 0,
        topCategories: [],
        agencyInsights: [],
        departmentInsights: [],
        categoryInsights: [],
        timeSeriesData: [],
        emergingCategories: []
      };
    }
  }, [processor, cache, getCacheKey]);

  // Cached market metrics
  const getMarketMetrics = useCallback((data: ProcessedJobData[], timeRange: string): DashboardMetrics => {
    const marketFilters: FilterOptions = { selectedAgency: 'all', timeRange: timeRange as any };
    const cacheKey = getCacheKey('marketMetrics', data, marketFilters);

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    const result = processor.calculateDashboardMetrics(data, marketFilters);
    cache.set(cacheKey, result);
    return result;
  }, [processor, cache, getCacheKey]);

  // Chart data preparation utilities
  const getCategoriesChartData = useCallback((metrics: DashboardMetrics) => {
    return metrics.topCategories.slice(0, 10).map(item => ({
      category: item.category.length > 20 ? item.category.substring(0, 17) + '...' : item.category,
      fullCategory: item.category,
      jobs: Number(item.count) || 0,
      percentage: Number(item.percentage) || 0
    }));
  }, []);

  const getAgenciesChartData = useCallback((metrics: DashboardMetrics) => {
    const total = metrics.totalJobs || 1;
    return metrics.agencyInsights.slice(0, 8).map(agency => ({
      agency: agency.agency.length > 15 ? agency.agency.substring(0, 12) + '...' : agency.agency,
      fullAgency: agency.agency,
      count: agency.totalJobs,
      share: (agency.totalJobs / total) * 100
    }));
  }, []);

  // Competitive analysis with caching
  const getCompetitiveIntelligence = useCallback((data: ProcessedJobData[], expandSecretariat: boolean = true) => {
    const cacheKey = getCacheKey('competitive', data, { expandSecretariat });

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    const result = processor.calculateCompetitiveIntelligence(data, expandSecretariat);
    cache.set(cacheKey, result);
    return result;
  }, [processor, cache, getCacheKey]);

  // Temporal trends with caching
  const getTemporalTrends = useCallback((data: ProcessedJobData[], months: number = 12) => {
    const cacheKey = getCacheKey('temporal', data, { months });

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    const result = processor.calculateTemporalTrends(data, months);
    cache.set(cacheKey, result);
    return result;
  }, [processor, cache, getCacheKey]);

  // Language analysis with caching
  const getLanguageAnalysis = useCallback((data: ProcessedJobData[]) => {
    const cacheKey = getCacheKey('language', data);

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    const result = processor.analyzeLanguageRequirements(data);
    cache.set(cacheKey, result);
    return result;
  }, [processor, cache, getCacheKey]);

  // Skills analysis with caching
  const getSkillsAnalysis = useCallback((data: ProcessedJobData[]) => {
    const cacheKey = getCacheKey('skills', data);

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    // Extract skills analysis logic from Skills component
    const skillFrequency = new Map<string, {
      count: number;
      agencies: Set<string>;
      locations: Set<string>;
      jobIds: Set<string>;
      grades: string[];
      years: number[];
      recentCount: number;
      olderCount: number;
    }>();

    const currentYear = new Date().getFullYear();

    data.forEach(job => {
      if (!job.job_labels) return;

      // Parse skills from job_labels
      const skills = job.job_labels.split(',').map(skill => skill.trim()).filter(Boolean);
      const jobYear = new Date(job.posting_date).getFullYear();
      const isRecent = jobYear >= currentYear - 1;

      skills.forEach(skill => {
        if (!skillFrequency.has(skill)) {
          skillFrequency.set(skill, {
            count: 0,
            agencies: new Set(),
            locations: new Set(),
            jobIds: new Set(),
            grades: [],
            years: [],
            recentCount: 0,
            olderCount: 0
          });
        }

        const skillData = skillFrequency.get(skill)!;
        skillData.count++;
        skillData.agencies.add(job.short_agency || job.long_agency || 'Unknown');
        skillData.locations.add(job.duty_country || 'Unknown');
        skillData.jobIds.add(job.id);
        if (job.up_grade) skillData.grades.push(job.up_grade);
        skillData.years.push(jobYear);

        if (isRecent) {
          skillData.recentCount++;
        } else {
          skillData.olderCount++;
        }
      });
    });

    // Convert to sorted array
    const sortedSkills = Array.from(skillFrequency.entries())
      .map(([skill, data]) => ({
        skill,
        frequency: data.count,
        agencyCount: data.agencies.size,
        locationCount: data.locations.size,
        agencies: Array.from(data.agencies),
        locations: Array.from(data.locations),
        grades: [...new Set(data.grades)],
        avgYear: data.years.length > 0 ? data.years.reduce((sum, year) => sum + year, 0) / data.years.length : currentYear,
        trend: data.recentCount > data.olderCount ? 'rising' : data.recentCount < data.olderCount ? 'declining' : 'stable',
        recentJobs: data.recentCount,
        totalJobs: data.count
      }))
      .sort((a, b) => b.frequency - a.frequency);

    // Digital skills classification - using dictionary data
    const digitalCategory = JOB_CLASSIFICATION_DICTIONARY.find(cat => cat.id === 'digital-technology');
    const digitalKeywords = digitalCategory ? [...digitalCategory.coreKeywords, ...digitalCategory.supportKeywords] : [];
    const digitalSkills = sortedSkills.filter(skill =>
      digitalKeywords.some(keyword => skill.skill.toLowerCase().includes(keyword.toLowerCase()))
    ).slice(0, 15);

    // Skills by category - derived from dictionary
    const categories = JOB_CLASSIFICATION_DICTIONARY.reduce((acc, category) => {
      // Map main categories to skill keywords
      if (['digital-technology', 'communication-advocacy', 'operations-logistics'].includes(category.id)) {
        acc[category.name] = category.coreKeywords.slice(0, 8); // Use first 8 core keywords
      }
      return acc;
    }, {} as Record<string, string[]>);

    // Add skill-specific categories not in main dictionary
    categories['Leadership & Management'] = ['management', 'leadership', 'strategy', 'coordination', 'supervision', 'governance'];
    categories['Technical & Analytical'] = ['analysis', 'research', 'evaluation', 'assessment', 'monitoring', 'technical'];

    const skillsByCategory = Object.entries(categories).map(([categoryName, keywords]) => {
      const categorySkills = sortedSkills.filter(skill =>
        keywords.some(keyword => skill.skill.toLowerCase().includes(keyword))
      ).slice(0, 6);

      const totalPositions = categorySkills.reduce((sum, skill) => sum + skill.frequency, 0);

      return {
        category: categoryName,
        totalPositions,
        skills: categorySkills.map(skill => ({ skill: skill.skill, count: skill.frequency }))
      };
    }).filter(cat => cat.totalPositions > 0);

    // Talent competition analysis
    const talentCompetition = sortedSkills.slice(0, 10).map(skill => {
      // Calculate urgency based on application window (simplified)
      const urgencyRate = Math.floor(Math.random() * 30); // Placeholder - would need real data

      return {
        skill: skill.skill,
        positions: skill.frequency,
        agencies: skill.agencyCount,
        mostCommonGrade: skill.grades[0] || 'N/A',
        gradeDistribution: skill.grades.length > 0 ? Math.round((1 / skill.grades.length) * 100) : 0,
        urgencyRate,
        competitionLevel: skill.agencyCount >= 5 ? 'High' : skill.agencyCount >= 3 ? 'Medium' : 'Low'
      };
    });

    // Skill trends over time (simplified)
    const skillTrends = sortedSkills
      .filter(skill => skill.trend !== 'stable' && skill.frequency >= 3)
      .slice(0, 12)
      .map(skill => ({
        skill: skill.skill,
        firstYear: currentYear - 2,
        lastYear: currentYear,
        firstYearCount: skill.totalJobs - skill.recentJobs,
        lastYearCount: skill.recentJobs,
        growthRate: skill.trend === 'rising' ?
          (skill.recentJobs > 0 && (skill.totalJobs - skill.recentJobs) > 0) ?
            Math.round(((skill.recentJobs - (skill.totalJobs - skill.recentJobs)) / (skill.totalJobs - skill.recentJobs)) * 100) :
            100 :
          skill.trend === 'declining' ? -20 : 0,
        totalPositions: skill.totalJobs,
        trend: skill.trend === 'rising' ? 'Rising' : skill.trend === 'declining' ? 'Declining' : 'Stable'
      }));

    const result = {
      topSkills: sortedSkills.slice(0, 50).map(skill => ({
        skill: skill.skill,
        count: skill.frequency,
        agencies: skill.agencyCount
      })),
      emergingSkills: sortedSkills.filter(s => s.trend === 'rising' && s.frequency >= 3).slice(0, 20).map(skill => ({
        skill: skill.skill,
        count: skill.frequency,
        growthRate: 50 // Simplified
      })),
      decliningSkills: sortedSkills.filter(s => s.trend === 'declining' && s.frequency >= 5).slice(0, 10),
      crossAgencySkills: sortedSkills.filter(s => s.agencyCount >= 3).slice(0, 30),
      totalUniqueSkills: sortedSkills.length,
      avgSkillsPerJob: data.length > 0 ? sortedSkills.reduce((sum, s) => sum + s.frequency, 0) / data.length : 0,
      digitalSkills,
      skillsByCategory,
      talentCompetition,
      skillTrends,
      rareSkills: sortedSkills.filter(skill => skill.frequency <= 2).slice(0, 10)
    };

    cache.set(cacheKey, result);
    return result;
  }, [cache, getCacheKey]);

  // Main data processing function that combines all operations
  const processData = useCallback((data: ProcessedJobData[], filters: FilterOptions): ProcessedDataResults => {
    const isAgencyView = filters.selectedAgency !== 'all';
    const selectedAgencyName = filters.selectedAgency;

    const filteredData = getFilteredData(data, filters);
    const marketData = getMarketData(data, filters.timeRange);
    const metrics = getMetrics(data, filters);
    const marketMetrics = getMarketMetrics(data, filters.timeRange);

    return {
      filteredData,
      marketData,
      metrics,
      marketMetrics,
      isAgencyView,
      selectedAgencyName
    };
  }, [getFilteredData, getMarketData, getMetrics, getMarketMetrics]);

  const contextValue: DataProcessingContextType = {
    processor,
    processData,
    getFilteredData,
    getMarketData,
    getMetrics,
    getMarketMetrics,
    getCategoriesChartData,
    getAgenciesChartData,
    getCompetitiveIntelligence,
    getTemporalTrends,
    getLanguageAnalysis,
    getSkillsAnalysis,
    // New analyzers (Phase 2)
    temporalAnalyzer,
    categoryEvolutionAnalyzer,
    competitiveEvolutionTracker,
    workforceAnalyzer,
    skillDemandAnalyzer,
    jobInsightsService
  };

  return (
    <DataProcessingContext.Provider value={contextValue}>
      {children}
    </DataProcessingContext.Provider>
  );
};

export const useDataProcessing = (): DataProcessingContextType => {
  const context = useContext(DataProcessingContext);
  if (context === undefined) {
    throw new Error('useDataProcessing must be used within a DataProcessingProvider');
  }
  return context;
};
