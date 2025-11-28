import { ProcessedJobData } from '../../types';
import { BaseProcessor } from '../core/BaseProcessor';

export type SeniorityLevel = 'Junior' | 'Mid' | 'Senior' | 'Executive';
export type GradeLevel = 'Entry' | 'Mid' | 'Senior' | 'Executive' | 'Consultant' | 'Other';

export interface GradeAnalysis {
  level: GradeLevel;
  numeric: number;
  isConsultant: boolean;
}

/**
 * Specialized processor for job grade and seniority classification.
 * Handles UN-specific grading systems and seniority determination.
 */
export class GradeClassifier extends BaseProcessor {
  /**
   * Determine seniority level based on grade
   */
  determineSeniorityLevel(grade: string): SeniorityLevel {
    if (!grade) return 'Mid';
    
    const gradeUpper = grade.toUpperCase();
    
    // UN Professional grades
    if (this.isJuniorGrade(gradeUpper)) return 'Junior';
    if (this.isMidGrade(gradeUpper)) return 'Mid';
    if (this.isSeniorGrade(gradeUpper)) return 'Senior';
    if (this.isExecutiveGrade(gradeUpper)) return 'Executive';

    return 'Mid'; // Default fallback
  }

  /**
   * Categorize grade level with detailed analysis
   */
  categorizeGradeLevel(grade: string): GradeAnalysis {
    if (!grade) {
      return { level: 'Other', numeric: 0, isConsultant: false };
    }
    
    const gradeUpper = grade.toUpperCase();
    
    // Check for consultant positions first
    if (this.isConsultantGrade(gradeUpper)) {
      return { level: 'Consultant', numeric: 0, isConsultant: true };
    }
    
    // Professional grades
    const professionalGrade = this.analyzeProfessionalGrade(gradeUpper);
    if (professionalGrade) return professionalGrade;
    
    // General service grades
    const generalServiceGrade = this.analyzeGeneralServiceGrade(gradeUpper);
    if (generalServiceGrade) return generalServiceGrade;
    
    // National Officer grades
    const nationalOfficerGrade = this.analyzeNationalOfficerGrade(gradeUpper);
    if (nationalOfficerGrade) return nationalOfficerGrade;

    return { level: 'Other', numeric: 0, isConsultant: false };
  }

  /**
   * Batch process seniority levels for multiple jobs
   */
  classifySeniority(jobs: ProcessedJobData[]): ProcessedJobData[] {
    const startTime = Date.now();
    
    const classifiedJobs = jobs.map(job => ({
      ...job,
      seniority_level: this.determineSeniorityLevel(job.up_grade || '')
    }));

    this.logPerformance('Seniority Classification', startTime, jobs.length);
    return classifiedJobs;
  }

  /**
   * Batch process grade analysis for multiple jobs
   */
  classifyGrades(jobs: ProcessedJobData[]): ProcessedJobData[] {
    const startTime = Date.now();
    
    const classifiedJobs = jobs.map(job => {
      const gradeAnalysis = this.categorizeGradeLevel(job.up_grade || '');
      return {
        ...job,
        grade_level: gradeAnalysis.level,
        grade_numeric: gradeAnalysis.numeric,
        is_consultant: gradeAnalysis.isConsultant
      };
    });

    this.logPerformance('Grade Classification', startTime, jobs.length);
    return classifiedJobs;
  }

  /**
   * Get grade statistics for a dataset
   */
  getGradeStatistics(jobs: ProcessedJobData[]): {
    gradeDistribution: Map<GradeLevel, number>;
    seniorityDistribution: Map<SeniorityLevel, number>;
    consultantPercentage: number;
    averageNumericGrade: number;
  } {
    const gradeDistribution = new Map<GradeLevel, number>();
    const seniorityDistribution = new Map<SeniorityLevel, number>();
    let consultantCount = 0;
    let totalNumericGrades = 0;
    let numericGradeCount = 0;

    jobs.forEach(job => {
      // Grade level distribution
      const gradeLevel = job.grade_level || 'Other';
      gradeDistribution.set(gradeLevel, (gradeDistribution.get(gradeLevel) || 0) + 1);
      
      // Seniority distribution
      const seniorityLevel = job.seniority_level || 'Mid';
      seniorityDistribution.set(seniorityLevel, (seniorityDistribution.get(seniorityLevel) || 0) + 1);
      
      // Consultant tracking
      if (job.is_consultant) consultantCount++;
      
      // Numeric grade tracking
      if (job.grade_numeric && job.grade_numeric > 0) {
        totalNumericGrades += job.grade_numeric;
        numericGradeCount++;
      }
    });

    return {
      gradeDistribution,
      seniorityDistribution,
      consultantPercentage: this.calculatePercentage(consultantCount, jobs.length),
      averageNumericGrade: numericGradeCount > 0 ? totalNumericGrades / numericGradeCount : 0
    };
  }

  // Private grade checking methods
  private isJuniorGrade(grade: string): boolean {
    return ['P1', 'P2', 'NOA', 'NOB', 'G1', 'G2', 'G3'].some(g => grade.includes(g));
  }

  private isMidGrade(grade: string): boolean {
    return ['P3', 'P4', 'NOC', 'NOD', 'G4', 'G5', 'G6'].some(g => grade.includes(g));
  }

  private isSeniorGrade(grade: string): boolean {
    return ['P5', 'P6', 'L6', 'L7', 'G7', 'G8'].some(g => grade.includes(g));
  }

  private isExecutiveGrade(grade: string): boolean {
    return ['D1', 'D2', 'ASG', 'USG'].some(g => grade.includes(g));
  }

  private isConsultantGrade(grade: string): boolean {
    return ['CONSULTANT', 'IC', 'RETAINER', 'SC'].some(term => grade.includes(term));
  }

  private analyzeProfessionalGrade(grade: string): GradeAnalysis | null {
    if (grade.includes('P1')) return { level: 'Entry', numeric: 1, isConsultant: false };
    if (grade.includes('P2')) return { level: 'Entry', numeric: 2, isConsultant: false };
    if (grade.includes('P3')) return { level: 'Mid', numeric: 3, isConsultant: false };
    if (grade.includes('P4')) return { level: 'Mid', numeric: 4, isConsultant: false };
    if (grade.includes('P5')) return { level: 'Senior', numeric: 5, isConsultant: false };
    if (grade.includes('P6') || grade.includes('L6') || grade.includes('L7')) {
      return { level: 'Senior', numeric: 6, isConsultant: false };
    }
    if (grade.includes('D1')) return { level: 'Executive', numeric: 7, isConsultant: false };
    if (grade.includes('D2') || grade.includes('ASG') || grade.includes('USG')) {
      return { level: 'Executive', numeric: 8, isConsultant: false };
    }
    return null;
  }

  private analyzeGeneralServiceGrade(grade: string): GradeAnalysis | null {
    if (['G1', 'G2', 'G3'].some(g => grade.includes(g))) {
      return { level: 'Entry', numeric: 1, isConsultant: false };
    }
    if (['G4', 'G5', 'G6'].some(g => grade.includes(g))) {
      return { level: 'Mid', numeric: 3, isConsultant: false };
    }
    if (['G7', 'G8'].some(g => grade.includes(g))) {
      return { level: 'Senior', numeric: 5, isConsultant: false };
    }
    return null;
  }

  private analyzeNationalOfficerGrade(grade: string): GradeAnalysis | null {
    if (['NOA', 'NOB'].some(g => grade.includes(g))) {
      return { level: 'Entry', numeric: 1, isConsultant: false };
    }
    if (['NOC', 'NOD'].some(g => grade.includes(g))) {
      return { level: 'Mid', numeric: 3, isConsultant: false };
    }
    return null;
  }
}

