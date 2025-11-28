import { ProcessedJobData } from '../../types';
import { TemporalAnalyzer } from './TemporalAnalyzer';

/**
 * Skill Demand Evolution over time
 * Phase 2 Tab 6 implementation
 */
export interface SkillDemandTimeline {
  skill: string;
  timeline: Array<{
    period: string;
    demand_count: number;
    percentage_of_jobs: number;
    trend: 'rising' | 'stable' | 'falling';
  }>;
  
  classification: {
    demand_level: 'high' | 'medium' | 'low';
    growth_trajectory: 'emerging' | 'growing' | 'mature' | 'declining';
    strategic_importance: 'critical' | 'important' | 'nice_to_have';
  };
  
  market_context: {
    agencies_seeking: number;
    competition_intensity: number;
    supply_difficulty: 'scarce' | 'competitive' | 'abundant';
  };
}

/**
 * Skill Combinations Analysis
 */
export interface SkillCombination {
  primary_skills: string[];
  commonly_combined_with: Array<{
    skill: string;
    co_occurrence_rate: number;
  }>;
  
  typical_roles: string[];
  typical_levels: string[];
  avg_application_window: number;
}

/**
 * Emerging Skills Detection
 */
export interface EmergingSkill {
  skill: string;
  first_appearance: string;
  growth_rate: number;
  adoption_agencies: string[];
  related_skills: string[];
  
  prediction: {
    will_become_mainstream: boolean;
    confidence: number;
    estimated_timeline: string;
  };
}

/**
 * Skill Demand Analyzer
 * Analyzes skill demand trends and emerging skills
 */
export class SkillDemandAnalyzer {
  private temporalAnalyzer: TemporalAnalyzer;
  
  constructor() {
    this.temporalAnalyzer = new TemporalAnalyzer();
  }
  
  /**
   * Calculate skill demand timeline
   */
  calculateSkillDemandTimeline(
    jobs: ProcessedJobData[],
    periodType: 'month' | 'quarter' = 'month',
    topN: number = 20
  ): SkillDemandTimeline[] {
    const skills = this.extractTopSkills(jobs, topN);
    const snapshots = this.temporalAnalyzer.getTemporalSnapshots(jobs, periodType);
    
    return skills.map(skill => {
      const timeline = snapshots.map((snapshot, index) => {
        const periodJobs = this.temporalAnalyzer.getJobsInPeriod(jobs, snapshot.period, periodType);
        const skillJobs = this.findJobsWithSkill(periodJobs, skill);
        
        const prevSnapshot = index > 0 ? snapshots[index - 1] : null;
        const prevJobs = prevSnapshot
          ? this.temporalAnalyzer.getJobsInPeriod(jobs, prevSnapshot.period, periodType)
          : [];
        const prevSkillJobs = this.findJobsWithSkill(prevJobs, skill);
        
        const demandCount = skillJobs.length;
        const percentage = periodJobs.length > 0 ? (demandCount / periodJobs.length) * 100 : 0;
        
        // Determine trend
        let trend: 'rising' | 'stable' | 'falling';
        if (prevSkillJobs.length === 0) {
          trend = 'stable';
        } else {
          const change = ((demandCount - prevSkillJobs.length) / prevSkillJobs.length) * 100;
          trend = change > 15 ? 'rising' : change < -15 ? 'falling' : 'stable';
        }
        
        return {
          period: snapshot.period,
          demand_count: demandCount,
          percentage_of_jobs: Math.round(percentage * 10) / 10,
          trend
        };
      });
      
      // Calculate classification
      const classification = this.classifySkill(skill, timeline, jobs);
      
      // Calculate market context
      const marketContext = this.calculateMarketContext(skill, jobs);
      
      return {
        skill,
        timeline,
        classification,
        market_context: marketContext
      };
    });
  }
  
  /**
   * Analyze skill combinations
   */
  analyzeSkillCombinations(
    jobs: ProcessedJobData[],
    topN: number = 15
  ): SkillCombination[] {
    const skills = this.extractTopSkills(jobs, topN);
    
    return skills.map(primarySkill => {
      const skillJobs = this.findJobsWithSkill(jobs, primarySkill);
      
      // Find commonly combined skills
      const skillCounts: { [skill: string]: number } = {};
      skillJobs.forEach(job => {
        const jobSkills = this.extractSkillsFromJob(job);
        jobSkills.forEach(skill => {
          if (skill !== primarySkill) {
            skillCounts[skill] = (skillCounts[skill] || 0) + 1;
          }
        });
      });
      
      const combinedSkills = Object.entries(skillCounts)
        .map(([skill, count]) => ({
          skill,
          co_occurrence_rate: (count / skillJobs.length) * 100
        }))
        .sort((a, b) => b.co_occurrence_rate - a.co_occurrence_rate)
        .slice(0, 5);
      
      // Typical roles and levels
      const typicalRoles = this.extractTypicalRoles(skillJobs);
      const typicalLevels = this.extractTypicalLevels(skillJobs);
      
      // Average application window
      const avgWindow = skillJobs.length > 0
        ? skillJobs.reduce((sum, j) => sum + j.application_window_days, 0) / skillJobs.length
        : 0;
      
      return {
        primary_skills: [primarySkill],
        commonly_combined_with: combinedSkills,
        typical_roles: typicalRoles,
        typical_levels: typicalLevels,
        avg_application_window: Math.round(avgWindow)
      };
    });
  }
  
  /**
   * Detect emerging skills
   */
  detectEmergingSkills(
    jobs: ProcessedJobData[],
    periodType: 'month' | 'quarter' = 'month'
  ): EmergingSkill[] {
    const now = new Date();
    const recentJobs = jobs.filter(j => {
      const monthsAgo = this.monthsDifference(new Date(j.posting_date), now);
      return monthsAgo <= 6;
    });
    
    const olderJobs = jobs.filter(j => {
      const monthsAgo = this.monthsDifference(new Date(j.posting_date), now);
      return monthsAgo > 6 && monthsAgo <= 12;
    });
    
    const recentSkills = this.extractAllSkills(recentJobs);
    const olderSkills = this.extractAllSkills(olderJobs);
    
    const emergingSkills: EmergingSkill[] = [];
    
    Object.entries(recentSkills).forEach(([skill, recentCount]) => {
      const olderCount = olderSkills[skill] || 0;
      
      // Skill is emerging if it's new or growing rapidly
      if (olderCount === 0 || recentCount > olderCount * 1.5) {
        const growthRate = olderCount > 0
          ? ((recentCount - olderCount) / olderCount) * 100
          : 200; // New skills get 200% growth
        
        const skillJobs = this.findJobsWithSkill(jobs, skill);
        const agencies = new Set(skillJobs.map(j => j.short_agency || j.long_agency));
        
        // Find related skills
        const relatedSkills = this.findRelatedSkills(skill, skillJobs);
        
        // Predict mainstream adoption
        const prediction = this.predictMainstreamAdoption(growthRate, recentCount, agencies.size);
        
        // Find first appearance
        const sortedJobs = skillJobs.sort((a, b) => 
          new Date(a.posting_date).getTime() - new Date(b.posting_date).getTime()
        );
        const firstAppearance = sortedJobs.length > 0
          ? periodType === 'month' ? sortedJobs[0].posting_month : sortedJobs[0].posting_quarter
          : 'Unknown';
        
        emergingSkills.push({
          skill,
          first_appearance: firstAppearance,
          growth_rate: Math.round(growthRate),
          adoption_agencies: Array.from(agencies).slice(0, 5),
          related_skills: relatedSkills,
          prediction
        });
      }
    });
    
    return emergingSkills
      .sort((a, b) => b.growth_rate - a.growth_rate)
      .slice(0, 10);
  }
  
  /**
   * Helper: Extract top skills from jobs
   */
  private extractTopSkills(jobs: ProcessedJobData[], topN: number): string[] {
    const skillCounts = this.extractAllSkills(jobs);
    
    return Object.entries(skillCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, topN)
      .map(([skill]) => skill);
  }
  
  /**
   * Helper: Extract all skills from jobs
   */
  private extractAllSkills(jobs: ProcessedJobData[]): { [skill: string]: number } {
    const skillCounts: { [skill: string]: number } = {};
    
    jobs.forEach(job => {
      const skills = this.extractSkillsFromJob(job);
      skills.forEach(skill => {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      });
    });
    
    return skillCounts;
  }
  
  /**
   * Helper: Extract skills from a single job
   */
  private extractSkillsFromJob(job: ProcessedJobData): string[] {
    const skills: string[] = [];
    
    // Extract from job_labels
    if (job.job_labels) {
      const labels = job.job_labels.split(',').map(l => l.trim()).filter(l => l);
      skills.push(...labels);
    }
    
    // Extract from title (common skills)
    const titleSkills = this.extractSkillsFromText(job.title);
    skills.push(...titleSkills);
    
    return [...new Set(skills)]; // Remove duplicates
  }
  
  /**
   * Helper: Extract skills from text
   */
  private extractSkillsFromText(text: string): string[] {
    const commonSkills = [
      'Management', 'Leadership', 'Analysis', 'Research', 'Communication',
      'Planning', 'Coordination', 'Monitoring', 'Evaluation', 'Reporting',
      'Policy', 'Strategy', 'Finance', 'Budget', 'Data', 'Technology',
      'Program', 'Project', 'Operations', 'Administration', 'Legal',
      'Advocacy', 'Partnership', 'Capacity Building', 'Training'
    ];
    
    const skills: string[] = [];
    const lowerText = text.toLowerCase();
    
    commonSkills.forEach(skill => {
      if (lowerText.includes(skill.toLowerCase())) {
        skills.push(skill);
      }
    });
    
    return skills;
  }
  
  /**
   * Helper: Find jobs with specific skill
   */
  private findJobsWithSkill(jobs: ProcessedJobData[], skill: string): ProcessedJobData[] {
    return jobs.filter(job => {
      const jobSkills = this.extractSkillsFromJob(job);
      return jobSkills.some(s => 
        s.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(s.toLowerCase())
      );
    });
  }
  
  /**
   * Helper: Classify skill
   */
  private classifySkill(
    skill: string,
    timeline: Array<{ demand_count: number; trend: string }>,
    allJobs: ProcessedJobData[]
  ): {
    demand_level: 'high' | 'medium' | 'low';
    growth_trajectory: 'emerging' | 'growing' | 'mature' | 'declining';
    strategic_importance: 'critical' | 'important' | 'nice_to_have';
  } {
    const avgDemand = timeline.reduce((sum, t) => sum + t.demand_count, 0) / timeline.length;
    const skillJobs = this.findJobsWithSkill(allJobs, skill);
    
    // Demand level
    const demandLevel: 'high' | 'medium' | 'low' = 
      avgDemand > 50 ? 'high' :
      avgDemand > 20 ? 'medium' :
      'low';
    
    // Growth trajectory
    const recentTrends = timeline.slice(-3);
    const risingCount = recentTrends.filter(t => t.trend === 'rising').length;
    const fallingCount = recentTrends.filter(t => t.trend === 'falling').length;
    
    let trajectory: 'emerging' | 'growing' | 'mature' | 'declining';
    if (risingCount >= 2 && avgDemand < 30) trajectory = 'emerging';
    else if (risingCount >= 2) trajectory = 'growing';
    else if (fallingCount >= 2) trajectory = 'declining';
    else trajectory = 'mature';
    
    // Strategic importance (based on seniority of positions requiring this skill)
    const seniorJobs = skillJobs.filter(j => 
      j.seniority_level === 'Senior' || j.seniority_level === 'Executive'
    ).length;
    const seniorPercentage = skillJobs.length > 0 ? (seniorJobs / skillJobs.length) * 100 : 0;
    
    const importance: 'critical' | 'important' | 'nice_to_have' =
      seniorPercentage > 40 || demandLevel === 'high' ? 'critical' :
      seniorPercentage > 20 || demandLevel === 'medium' ? 'important' :
      'nice_to_have';
    
    return {
      demand_level: demandLevel,
      growth_trajectory: trajectory,
      strategic_importance: importance
    };
  }
  
  /**
   * Helper: Calculate market context
   */
  private calculateMarketContext(skill: string, jobs: ProcessedJobData[]): {
    agencies_seeking: number;
    competition_intensity: number;
    supply_difficulty: 'scarce' | 'competitive' | 'abundant';
  } {
    const skillJobs = this.findJobsWithSkill(jobs, skill);
    const agencies = new Set(skillJobs.map(j => j.short_agency || j.long_agency));
    
    // Competition intensity (0-10 scale)
    const intensity = Math.min(10, agencies.size * 0.5 + (skillJobs.length / jobs.length) * 100);
    
    // Supply difficulty based on urgency rate
    const urgentJobs = skillJobs.filter(j => j.application_window_days < 14).length;
    const urgencyRate = skillJobs.length > 0 ? (urgentJobs / skillJobs.length) * 100 : 0;
    
    const difficulty: 'scarce' | 'competitive' | 'abundant' =
      urgencyRate > 40 ? 'scarce' :
      urgencyRate > 20 ? 'competitive' :
      'abundant';
    
    return {
      agencies_seeking: agencies.size,
      competition_intensity: Math.round(intensity * 10) / 10,
      supply_difficulty: difficulty
    };
  }
  
  /**
   * Helper: Extract typical roles
   */
  private extractTypicalRoles(jobs: ProcessedJobData[]): string[] {
    const roleCounts: { [role: string]: number } = {};
    
    jobs.forEach(job => {
      const role = job.primary_category;
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });
    
    return Object.entries(roleCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([role]) => role);
  }
  
  /**
   * Helper: Extract typical levels
   */
  private extractTypicalLevels(jobs: ProcessedJobData[]): string[] {
    const levelCounts: { [level: string]: number } = {};
    
    jobs.forEach(job => {
      levelCounts[job.seniority_level] = (levelCounts[job.seniority_level] || 0) + 1;
    });
    
    return Object.entries(levelCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([level]) => level);
  }
  
  /**
   * Helper: Find related skills
   */
  private findRelatedSkills(skill: string, skillJobs: ProcessedJobData[]): string[] {
    const relatedSkillCounts: { [skill: string]: number } = {};
    
    skillJobs.forEach(job => {
      const skills = this.extractSkillsFromJob(job);
      skills.forEach(s => {
        if (s !== skill) {
          relatedSkillCounts[s] = (relatedSkillCounts[s] || 0) + 1;
        }
      });
    });
    
    return Object.entries(relatedSkillCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([skill]) => skill);
  }
  
  /**
   * Helper: Predict mainstream adoption
   */
  private predictMainstreamAdoption(
    growthRate: number,
    currentDemand: number,
    agencyCount: number
  ): {
    will_become_mainstream: boolean;
    confidence: number;
    estimated_timeline: string;
  } {
    const willBecome = growthRate > 100 && currentDemand > 10 && agencyCount > 5;
    
    const confidence = Math.min(95, 
      (growthRate / 2) + (currentDemand * 2) + (agencyCount * 3)
    );
    
    const timeline = 
      growthRate > 150 ? 'Within 6 months' :
      growthRate > 100 ? 'Within 12 months' :
      'Within 18 months';
    
    return {
      will_become_mainstream: willBecome,
      confidence: Math.round(confidence),
      estimated_timeline: timeline
    };
  }
  
  /**
   * Helper: Calculate months difference
   */
  private monthsDifference(date1: Date, date2: Date): number {
    const years = date2.getFullYear() - date1.getFullYear();
    const months = date2.getMonth() - date1.getMonth();
    return years * 12 + months;
  }
}




