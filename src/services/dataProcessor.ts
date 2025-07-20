import { format, differenceInDays, parseISO, subMonths, isAfter } from 'date-fns';
import { 
  JobData, 
  ProcessedJobData, 
  JobCategory, 
  DashboardMetrics, 
  AgencyInsight, 
  CategoryInsight, 
  TimeSeriesData,
  FilterOptions 
} from '../types';

// Job category definitions with keywords for classification
export const JOB_CATEGORIES: JobCategory[] = [
  {
    id: 'digital-tech',
    name: 'Digital & Technology',
    keywords: ['digital', 'technology', 'IT', 'software', 'data', 'cyber', 'innovation', 'platform', 'system', 'database', 'programming', 'web', 'mobile', 'artificial intelligence', 'machine learning', 'blockchain'],
    color: '#3B82F6',
    description: 'Technology, digital transformation, and IT-related positions'
  },
  {
    id: 'climate-environment',
    name: 'Climate & Environment',
    keywords: ['climate', 'environment', 'sustainability', 'green', 'renewable', 'carbon', 'biodiversity', 'ecosystem', 'conservation', 'clean energy', 'adaptation', 'mitigation', 'forest', 'ocean'],
    color: '#10B981',
    description: 'Climate change, environmental protection, and sustainability'
  },
  {
    id: 'health-medical',
    name: 'Health & Medical',
    keywords: ['health', 'medical', 'healthcare', 'nutrition', 'epidemiology', 'public health', 'disease', 'vaccine', 'maternal', 'child health', 'mental health', 'pharmacy', 'clinical'],
    color: '#EF4444',
    description: 'Health, medical, and healthcare-related positions'
  },
  {
    id: 'education-training',
    name: 'Education & Training',
    keywords: ['education', 'training', 'learning', 'capacity building', 'curriculum', 'teaching', 'academic', 'scholarship', 'skill development', 'knowledge management'],
    color: '#8B5CF6',
    description: 'Education, training, and capacity building'
  },
  {
    id: 'gender-inclusion',
    name: 'Gender & Social Inclusion',
    keywords: ['gender', 'women', 'equality', 'inclusion', 'diversity', 'youth', 'disability', 'social protection', 'human rights', 'empowerment', 'marginalized'],
    color: '#EC4899',
    description: 'Gender equality, social inclusion, and human rights'
  },
  {
    id: 'emergency-humanitarian',
    name: 'Emergency & Humanitarian',
    keywords: ['emergency', 'humanitarian', 'crisis', 'disaster', 'response', 'relief', 'refugee', 'conflict', 'peace', 'security', 'recovery', 'resilience'],
    color: '#F59E0B',
    description: 'Emergency response, humanitarian aid, and crisis management'
  },
  {
    id: 'governance-policy',
    name: 'Governance & Policy',
    keywords: ['governance', 'policy', 'government', 'public administration', 'institutional', 'democracy', 'rule of law', 'anti-corruption', 'transparency', 'accountability'],
    color: '#6366F1',
    description: 'Governance, policy development, and institutional strengthening'
  },
  {
    id: 'economic-development',
    name: 'Economic Development',
    keywords: ['economic', 'development', 'finance', 'investment', 'trade', 'private sector', 'entrepreneurship', 'market', 'financial inclusion', 'poverty reduction'],
    color: '#059669',
    description: 'Economic development, finance, and private sector engagement'
  },
  {
    id: 'communication-advocacy',
    name: 'Communication & Advocacy',
    keywords: ['communication', 'advocacy', 'media', 'public information', 'outreach', 'awareness', 'campaign', 'social media', 'journalism', 'partnership'],
    color: '#DC2626',
    description: 'Communications, advocacy, and public engagement'
  },
  {
    id: 'operations-logistics',
    name: 'Operations & Logistics',
    keywords: ['operations', 'logistics', 'supply chain', 'procurement', 'administration', 'facilities', 'security', 'transport', 'warehouse', 'support'],
    color: '#7C3AED',
    description: 'Operations, logistics, and administrative support'
  }
];

export class JobAnalyticsProcessor {
  private jobCategories: JobCategory[] = JOB_CATEGORIES;

  // Categorize a job based on its labels, title, and description
  categorizeJob(job: JobData): { primary: string; secondary: string[] } {
    // Handle potential null/undefined values
    const jobLabels = job.job_labels || '';
    const jobTitle = job.title || '';
    const jobDescription = job.description || '';
    
    const searchText = `${jobLabels} ${jobTitle} ${jobDescription}`.toLowerCase();
    const categoryScores: { [key: string]: number } = {};

    // Score each category based on keyword matches
    this.jobCategories.forEach(category => {
      let score = 0;
      category.keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'g');
        const matches = searchText.match(regex) || [];
        score += matches.length;
        
        // Bonus points for matches in job_labels (more relevant)
        if (jobLabels.toLowerCase().includes(keyword.toLowerCase())) {
          score += 2;
        }
        
        // Bonus points for matches in title (most relevant)
        if (jobTitle.toLowerCase().includes(keyword.toLowerCase())) {
          score += 3;
        }
      });
      
      if (score > 0) {
        categoryScores[category.name] = score;
      }
    });

    // Get sorted categories by score
    const sortedCategories = Object.entries(categoryScores)
      .sort(([,a], [,b]) => b - a)
      .map(([category]) => category);

    // Debug logging for first few jobs
    if (Object.keys(categoryScores).length === 0) {
      console.log('No category found for job:', {
        title: jobTitle,
        labels: jobLabels.substring(0, 100),
        searchText: searchText.substring(0, 150)
      });
    }

    return {
      primary: sortedCategories[0] || 'General',
      secondary: sortedCategories.slice(1, 3) // Top 2 additional categories
    };
  }

  // Determine skill domain based on job characteristics
  determineSkillDomain(job: JobData): 'Technical' | 'Operational' | 'Strategic' | 'Mixed' {
    const text = `${job.title} ${job.description} ${job.job_labels}`.toLowerCase();
    
    const technicalKeywords = ['technical', 'engineer', 'developer', 'analyst', 'specialist', 'expert', 'consultant'];
    const operationalKeywords = ['coordinator', 'officer', 'assistant', 'associate', 'support', 'operations'];
    const strategicKeywords = ['director', 'manager', 'head', 'chief', 'senior', 'lead', 'strategy', 'policy'];

    const technicalScore = technicalKeywords.filter(keyword => text.includes(keyword)).length;
    const operationalScore = operationalKeywords.filter(keyword => text.includes(keyword)).length;
    const strategicScore = strategicKeywords.filter(keyword => text.includes(keyword)).length;

    const maxScore = Math.max(technicalScore, operationalScore, strategicScore);
    
    if (maxScore === 0) return 'Mixed';
    
    // If scores are close, it's mixed
    const scores = [technicalScore, operationalScore, strategicScore].filter(s => s > 0);
    if (scores.length > 1 && Math.max(...scores) - Math.min(...scores) <= 1) {
      return 'Mixed';
    }

    if (technicalScore === maxScore) return 'Technical';
    if (strategicScore === maxScore) return 'Strategic';
    return 'Operational';
  }

  // Determine seniority level based on grade
  determineSeniorityLevel(grade: string): 'Junior' | 'Mid' | 'Senior' | 'Executive' {
    if (!grade) return 'Mid';
    
    const gradeUpper = grade.toUpperCase();
    
    // UN Professional grades
    if (gradeUpper.includes('P1') || gradeUpper.includes('P2') || gradeUpper.includes('NOA') || gradeUpper.includes('NOB')) {
      return 'Junior';
    }
    if (gradeUpper.includes('P3') || gradeUpper.includes('P4') || gradeUpper.includes('NOC') || gradeUpper.includes('NOD')) {
      return 'Mid';
    }
    if (gradeUpper.includes('P5') || gradeUpper.includes('P6') || gradeUpper.includes('L6') || gradeUpper.includes('L7')) {
      return 'Senior';
    }
    if (gradeUpper.includes('D1') || gradeUpper.includes('D2') || gradeUpper.includes('ASG') || gradeUpper.includes('USG')) {
      return 'Executive';
    }

    // General service grades
    if (gradeUpper.includes('G1') || gradeUpper.includes('G2') || gradeUpper.includes('G3')) {
      return 'Junior';
    }
    if (gradeUpper.includes('G4') || gradeUpper.includes('G5') || gradeUpper.includes('G6')) {
      return 'Mid';
    }
    if (gradeUpper.includes('G7') || gradeUpper.includes('G8')) {
      return 'Senior';
    }

    return 'Mid'; // Default
  }

  // Determine location type
  determineLocationType(dutyStation: string): 'Headquarters' | 'Regional' | 'Field' | 'Home-based' {
    const station = dutyStation.toLowerCase();
    
    if (station.includes('home based') || station.includes('remote') || station.includes('telecommuting')) {
      return 'Home-based';
    }
    
    // Major UN headquarters
    const hqLocations = ['new york', 'geneva', 'vienna', 'nairobi', 'bangkok', 'addis ababa', 'beirut', 'santiago'];
    if (hqLocations.some(hq => station.includes(hq))) {
      return 'Headquarters';
    }
    
    // Regional indicators
    if (station.includes('regional') || station.includes('hub')) {
      return 'Regional';
    }
    
    return 'Field';
  }

  // Process job data with enhanced analytics
  processJobData(jobs: JobData[]): ProcessedJobData[] {
    console.log(`Processing ${jobs.length} jobs...`);
    
    const filteredJobs = jobs.filter(job => job.id && job.title && job.posting_date);
    console.log(`${filteredJobs.length} jobs after filtering`);
    
    const processedJobs = filteredJobs.map((job, index) => {
      // Basic processing (from original)
      let postingDate: Date;
      let applyUntilDate: Date;
      
      try {
        postingDate = parseISO(job.posting_date);
        if (isNaN(postingDate.getTime())) postingDate = new Date();
      } catch {
        postingDate = new Date();
      }

      try {
        applyUntilDate = parseISO(job.apply_until);
        if (isNaN(applyUntilDate.getTime())) applyUntilDate = new Date();
      } catch {
        applyUntilDate = new Date();
      }

      const applicationWindow = differenceInDays(applyUntilDate, postingDate);
      const experiences = [job.hs_min_exp || 0, job.bachelor_min_exp || 0, job.master_min_exp || 0];
      const relevantExperience = Math.max(...experiences);
      const languageCount = job.languages ? job.languages.split(/[,;/|]/).filter(lang => lang.trim().length > 0).length : 0;
      const isHomeBased = job.duty_station.toLowerCase().includes('home based') || 
                         job.duty_station.toLowerCase().includes('remote') ||
                         job.duty_station.toLowerCase().includes('telecommuting');

      // Enhanced analytics
      const categories = this.categorizeJob(job);
      const skillDomain = this.determineSkillDomain(job);
      const seniorityLevel = this.determineSeniorityLevel(job.up_grade);
      const locationType = this.determineLocationType(job.duty_station);

      // Debug first few jobs
      if (index < 3) {
        console.log(`Job ${index + 1}:`, {
          title: job.title,
          primaryCategory: categories.primary,
          agency: job.short_agency || job.long_agency
        });
      }

      return {
        ...job,
        application_window_days: Math.max(0, applicationWindow),
        relevant_experience: relevantExperience,
        language_count: languageCount,
        is_home_based: isHomeBased,
        formatted_posting_date: format(postingDate, 'MMM dd, yyyy'),
        formatted_apply_until: format(applyUntilDate, 'MMM dd, yyyy'),
        // New analytics fields
        primary_category: categories.primary,
        secondary_categories: categories.secondary,
        skill_domain: skillDomain,
        seniority_level: seniorityLevel,
        location_type: locationType,
        posting_month: format(postingDate, 'yyyy-MM'),
        posting_year: postingDate.getFullYear(),
        posting_quarter: `${postingDate.getFullYear()}-Q${Math.floor(postingDate.getMonth() / 3) + 1}`
      };
    });

    console.log(`Processed ${processedJobs.length} jobs successfully`);
    
    // Show category distribution
    const categoryCount = new Map<string, number>();
    processedJobs.forEach(job => {
      categoryCount.set(job.primary_category, (categoryCount.get(job.primary_category) || 0) + 1);
    });
    
    console.log('Category distribution:', Object.fromEntries(categoryCount));
    
    return processedJobs;
  }

  // Calculate comprehensive dashboard metrics
  calculateDashboardMetrics(data: ProcessedJobData[], filters: FilterOptions): DashboardMetrics {
    console.log('calculateDashboardMetrics: Input data length:', data.length);
    const filteredData = this.applyFilters(data, filters);
    console.log('calculateDashboardMetrics: Filtered data length:', filteredData.length);
    
    // Basic metrics
    const totalJobs = filteredData.length;
    const agencies = new Set(filteredData.map(job => job.short_agency || job.long_agency));
    const totalAgencies = agencies.size;

    // Top categories
    const categoryCount = new Map<string, number>();
    filteredData.forEach(job => {
      categoryCount.set(job.primary_category, (categoryCount.get(job.primary_category) || 0) + 1);
    });

    console.log('calculateDashboardMetrics: Category counts:', Object.fromEntries(categoryCount));

    const topCategories = Array.from(categoryCount.entries())
      .map(([category, count]) => ({ category, count, percentage: (count / totalJobs) * 100 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    console.log('calculateDashboardMetrics: Top categories:', topCategories);

    // Agency insights
    const agencyInsights = this.calculateAgencyInsights(filteredData);

    // Category insights
    const categoryInsights = this.calculateCategoryInsights(filteredData, data);

    // Time series data
    const timeSeriesData = this.calculateTimeSeriesData(filteredData);

    // Emerging categories
    const emergingCategories = this.calculateEmergingCategories(data, filteredData);

    return {
      totalJobs,
      totalAgencies,
      topCategories,
      agencyInsights,
      categoryInsights,
      timeSeriesData,
      emergingCategories
    };
  }

  private applyFilters(data: ProcessedJobData[], filters: FilterOptions): ProcessedJobData[] {
    let filtered = [...data];

    // Agency filter
    if (filters.selectedAgency !== 'all') {
      filtered = filtered.filter(job => 
        (job.short_agency || job.long_agency) === filters.selectedAgency
      );
    }

    // Time range filter
    if (filters.timeRange !== 'all') {
      const now = new Date();
      let cutoffDate: Date;
      
      switch (filters.timeRange) {
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
          cutoffDate = new Date(0);
      }

      filtered = filtered.filter(job => {
        try {
          const postingDate = parseISO(job.posting_date);
          return isAfter(postingDate, cutoffDate);
        } catch {
          return true;
        }
      });
    }

    return filtered;
  }

  private calculateAgencyInsights(data: ProcessedJobData[]): AgencyInsight[] {
    const agencyMap = new Map<string, ProcessedJobData[]>();
    
    data.forEach(job => {
      const agency = job.short_agency || job.long_agency || 'Unknown';
      if (!agencyMap.has(agency)) {
        agencyMap.set(agency, []);
      }
      agencyMap.get(agency)!.push(job);
    });

    return Array.from(agencyMap.entries()).map(([agency, jobs]) => {
      const categoryCount = new Map<string, number>();
      jobs.forEach(job => {
        categoryCount.set(job.primary_category, (categoryCount.get(job.primary_category) || 0) + 1);
      });

      const topCategories = Array.from(categoryCount.entries())
        .map(([category, count]) => ({ category, count, percentage: (count / jobs.length) * 100 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      const specializations = topCategories
        .filter(cat => cat.percentage > 30)
        .map(cat => cat.category);

      return {
        agency,
        totalJobs: jobs.length,
        topCategories,
        growthRate: 0, // Would need historical data
        specializations
      };
    }).sort((a, b) => b.totalJobs - a.totalJobs);
  }

  private calculateCategoryInsights(filteredData: ProcessedJobData[], allData: ProcessedJobData[]): CategoryInsight[] {
    const categoryMap = new Map<string, ProcessedJobData[]>();
    
    filteredData.forEach(job => {
      if (!categoryMap.has(job.primary_category)) {
        categoryMap.set(job.primary_category, []);
      }
      categoryMap.get(job.primary_category)!.push(job);
    });

    return Array.from(categoryMap.entries()).map(([category, jobs]) => {
      const agencyCount = new Map<string, number>();
      jobs.forEach(job => {
        const agency = job.short_agency || job.long_agency || 'Unknown';
        agencyCount.set(agency, (agencyCount.get(agency) || 0) + 1);
      });

      const agencies = Array.from(agencyCount.entries())
        .map(([agency, count]) => ({ agency, count, percentage: (count / jobs.length) * 100 }))
        .sort((a, b) => b.count - a.count);

      const leadingAgency = agencies[0]?.agency || 'Unknown';

      // Simple skill demand calculation based on job count
      let skillDemand: 'High' | 'Medium' | 'Low' = 'Low';
      if (jobs.length > 50) skillDemand = 'High';
      else if (jobs.length > 20) skillDemand = 'Medium';

      return {
        category,
        totalJobs: jobs.length,
        leadingAgency,
        growthRate: 0, // Would need historical comparison
        recentAppearances: jobs.length,
        skillDemand,
        agencies: agencies.slice(0, 5)
      };
    }).sort((a, b) => b.totalJobs - a.totalJobs);
  }

  private calculateTimeSeriesData(data: ProcessedJobData[]): TimeSeriesData[] {
    const periodMap = new Map<string, Map<string, number>>();
    
    data.forEach(job => {
      const period = job.posting_month;
      if (!periodMap.has(period)) {
        periodMap.set(period, new Map());
      }
      
      const categoryMap = periodMap.get(period)!;
      categoryMap.set(job.primary_category, (categoryMap.get(job.primary_category) || 0) + 1);
    });

    return Array.from(periodMap.entries())
      .map(([period, categoryMap]) => {
        const categories: { [category: string]: number } = {};
        let total = 0;
        
        categoryMap.forEach((count, category) => {
          categories[category] = count;
          total += count;
        });

        return { period, categories, total };
      })
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  private calculateEmergingCategories(allData: ProcessedJobData[], filteredData: ProcessedJobData[]): { category: string; growthRate: number; isNew: boolean }[] {
    // Simplified calculation - in real implementation would compare time periods
    const categoryCount = new Map<string, number>();
    filteredData.forEach(job => {
      categoryCount.set(job.primary_category, (categoryCount.get(job.primary_category) || 0) + 1);
    });

    return Array.from(categoryCount.entries())
      .map(([category, count]) => ({
        category,
        growthRate: Math.random() * 100, // Placeholder - would calculate actual growth
        isNew: count < 5 // Placeholder logic
      }))
      .sort((a, b) => b.growthRate - a.growthRate)
      .slice(0, 5);
  }
} 