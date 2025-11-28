import { ProcessedJobData } from '../../types';
import { BaseProcessor } from '../core/BaseProcessor';

export type SkillDomain = 'Technical' | 'Operational' | 'Strategic' | 'Mixed';

/**
 * Specialized processor for skill domain classification.
 * Analyzes job content to determine the primary skill domain required.
 */
export class SkillClassifier extends BaseProcessor {
  private technicalKeywords = [
    'technical', 'engineer', 'developer', 'analyst', 'specialist', 
    'expert', 'consultant', 'programmer', 'architect', 'scientist'
  ];
  
  private operationalKeywords = [
    'coordinator', 'officer', 'assistant', 'associate', 'support', 
    'operations', 'logistics', 'administration', 'clerk', 'aide'
  ];
  
  private strategicKeywords = [
    'director', 'manager', 'head', 'chief', 'senior', 'lead', 
    'strategy', 'policy', 'planning', 'executive', 'advisor'
  ];

  /**
   * Determine skill domain based on job characteristics
   */
  determineSkillDomain(job: ProcessedJobData): SkillDomain {
    const combinedText = this.getCombinedJobText(job);
    
    const technicalScore = this.calculateSkillScore(combinedText, this.technicalKeywords);
    const operationalScore = this.calculateSkillScore(combinedText, this.operationalKeywords);
    const strategicScore = this.calculateSkillScore(combinedText, this.strategicKeywords);

    return this.classifyByScores(technicalScore, operationalScore, strategicScore);
  }

  /**
   * Batch classify skill domains for multiple jobs
   */
  classifySkillDomains(jobs: ProcessedJobData[]): ProcessedJobData[] {
    const startTime = Date.now();
    
    const classifiedJobs = jobs.map(job => ({
      ...job,
      skill_domain: this.determineSkillDomain(job)
    }));

    this.logPerformance('Skill Domain Classification', startTime, jobs.length);
    return classifiedJobs;
  }

  /**
   * Get detailed skill analysis for a job
   */
  getDetailedSkillAnalysis(job: ProcessedJobData): {
    skillDomain: SkillDomain;
    scores: {
      technical: number;
      operational: number;
      strategic: number;
    };
    dominantKeywords: string[];
    complexity: 'Low' | 'Medium' | 'High';
  } {
    const combinedText = this.getCombinedJobText(job);
    
    const technicalScore = this.calculateSkillScore(combinedText, this.technicalKeywords);
    const operationalScore = this.calculateSkillScore(combinedText, this.operationalKeywords);
    const strategicScore = this.calculateSkillScore(combinedText, this.strategicKeywords);

    const skillDomain = this.classifyByScores(technicalScore, operationalScore, strategicScore);
    const dominantKeywords = this.findDominantKeywords(combinedText, skillDomain);
    const complexity = this.assessComplexity(job, technicalScore, operationalScore, strategicScore);

    return {
      skillDomain,
      scores: {
        technical: technicalScore,
        operational: operationalScore,
        strategic: strategicScore
      },
      dominantKeywords,
      complexity
    };
  }

  /**
   * Get skill domain statistics for a dataset
   */
  getSkillDomainStatistics(jobs: ProcessedJobData[]): {
    domainDistribution: Map<SkillDomain, number>;
    complexityDistribution: Map<string, number>;
    averageScores: {
      technical: number;
      operational: number;
      strategic: number;
    };
  } {
    const domainDistribution = new Map<SkillDomain, number>();
    const complexityDistribution = new Map<string, number>();
    let totalTechnical = 0;
    let totalOperational = 0;
    let totalStrategic = 0;

    jobs.forEach(job => {
      // Domain distribution
      const domain = job.skill_domain || 'Mixed';
      domainDistribution.set(domain, (domainDistribution.get(domain) || 0) + 1);
      
      // Detailed analysis for complexity and scores
      const analysis = this.getDetailedSkillAnalysis(job);
      complexityDistribution.set(analysis.complexity, (complexityDistribution.get(analysis.complexity) || 0) + 1);
      
      totalTechnical += analysis.scores.technical;
      totalOperational += analysis.scores.operational;
      totalStrategic += analysis.scores.strategic;
    });

    return {
      domainDistribution,
      complexityDistribution,
      averageScores: {
        technical: jobs.length > 0 ? totalTechnical / jobs.length : 0,
        operational: jobs.length > 0 ? totalOperational / jobs.length : 0,
        strategic: jobs.length > 0 ? totalStrategic / jobs.length : 0
      }
    };
  }

  /**
   * Extract skill requirements from job content
   */
  extractSkillRequirements(job: ProcessedJobData): {
    requiredSkills: string[];
    preferredSkills: string[];
    technicalSkills: string[];
    softSkills: string[];
  } {
    const jobLabels = this.safeString(job.job_labels);
    const description = this.safeString(job.description);
    const idealCandidate = this.safeString(job.ideal_candidate);
    
    // Parse skills from job_labels (most reliable)
    const labelSkills = jobLabels.split(',').map(s => s.trim()).filter(Boolean);
    
    // Extract skills from text
    const extractedSkills = this.extractSkillsFromText(description + ' ' + idealCandidate);
    
    return {
      requiredSkills: labelSkills,
      preferredSkills: extractedSkills.preferred,
      technicalSkills: extractedSkills.technical,
      softSkills: extractedSkills.soft
    };
  }

  // Private helper methods
  private getCombinedJobText(job: ProcessedJobData): string {
    return [
      this.safeString(job.title),
      this.safeString(job.description),
      this.safeString(job.job_labels)
    ].join(' ').toLowerCase();
  }

  private calculateSkillScore(text: string, keywords: string[]): number {
    return keywords.reduce((score, keyword) => {
      const matches = (text.match(new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'g')) || []).length;
      return score + matches;
    }, 0);
  }

  private classifyByScores(technical: number, operational: number, strategic: number): SkillDomain {
    const maxScore = Math.max(technical, operational, strategic);
    
    if (maxScore === 0) return 'Mixed';
    
    // If scores are close, it's mixed
    const scores = [technical, operational, strategic].filter(s => s > 0);
    if (scores.length > 1 && Math.max(...scores) - Math.min(...scores) <= 1) {
      return 'Mixed';
    }

    if (technical === maxScore) return 'Technical';
    if (strategic === maxScore) return 'Strategic';
    return 'Operational';
  }

  private findDominantKeywords(text: string, domain: SkillDomain): string[] {
    const keywords = this.getKeywordsForDomain(domain);
    
    return keywords
      .filter(keyword => text.includes(keyword.toLowerCase()))
      .slice(0, 5); // Top 5 matching keywords
  }

  private getKeywordsForDomain(domain: SkillDomain): string[] {
    switch (domain) {
      case 'Technical': return this.technicalKeywords;
      case 'Strategic': return this.strategicKeywords;
      case 'Operational': return this.operationalKeywords;
      default: return [...this.technicalKeywords, ...this.strategicKeywords, ...this.operationalKeywords];
    }
  }

  private assessComplexity(
    job: ProcessedJobData, 
    technical: number, 
    operational: number, 
    strategic: number
  ): 'Low' | 'Medium' | 'High' {
    const totalScore = technical + operational + strategic;
    const gradeComplexity = this.getGradeComplexity(job.up_grade || '');
    const experienceComplexity = job.relevant_experience || 0;
    
    // Combine multiple factors
    let complexityScore = 0;
    
    // Skill keyword density
    if (totalScore >= 5) complexityScore += 2;
    else if (totalScore >= 2) complexityScore += 1;
    
    // Grade level
    complexityScore += gradeComplexity;
    
    // Experience requirements
    if (experienceComplexity >= 10) complexityScore += 2;
    else if (experienceComplexity >= 5) complexityScore += 1;
    
    // Language requirements
    if ((job.language_count || 0) >= 3) complexityScore += 1;
    
    if (complexityScore >= 5) return 'High';
    if (complexityScore >= 3) return 'Medium';
    return 'Low';
  }

  private getGradeComplexity(grade: string): number {
    const gradeUpper = grade.toUpperCase();
    
    // Executive levels
    if (['D1', 'D2', 'ASG', 'USG'].some(g => gradeUpper.includes(g))) return 3;
    
    // Senior levels
    if (['P5', 'P6', 'L6', 'L7'].some(g => gradeUpper.includes(g))) return 2;
    
    // Mid levels
    if (['P3', 'P4'].some(g => gradeUpper.includes(g))) return 1;
    
    return 0; // Junior or other
  }

  private extractSkillsFromText(text: string): {
    preferred: string[];
    technical: string[];
    soft: string[];
  } {
    const preferredPattern = /(?:preferred|desirable|asset|advantage)[\s\w]*?:\s*([^.;]+)/gi;
    const technicalPattern = /(?:technical|programming|software|system|database|technology)[\s\w]*?(?:skills?|knowledge|experience|proficiency)/gi;
    const softPattern = /(?:communication|leadership|teamwork|analytical|problem[- ]solving|interpersonal)/gi;
    
    const preferred = this.extractMatches(text, preferredPattern);
    const technical = this.extractMatches(text, technicalPattern);
    const soft = this.extractMatches(text, softPattern);
    
    return { preferred, technical, soft };
  }

  private extractMatches(text: string, pattern: RegExp): string[] {
    const matches = text.match(pattern) || [];
    return matches.map(match => match.trim()).slice(0, 10); // Limit results
  }
}

