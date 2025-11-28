/**
 * Grade Pyramid Analyzer
 * 
 * Analyzes workforce structure based on cumulative hiring patterns.
 * Uses 24-36 months of data to approximate workforce composition for succession planning.
 */

import { ProcessedJobData } from '../../types';
import { parseISO, subMonths } from 'date-fns';

export type GradeGroup = 'entry' | 'mid' | 'senior' | 'executive' | 'consultant' | 'other';
export type PyramidShape = 'healthy' | 'inverted' | 'missing_middle' | 'top_heavy' | 'bottom_heavy';

export interface GradeDistribution {
  grade: string;
  gradeGroup: GradeGroup;
  count: number;
  percentage: number;
}

export interface GradePyramid {
  category: string;
  agency: string | null;
  timeframeMonths: number;
  totalPositions: number;
  
  // Distribution by individual grades
  gradeDistribution: GradeDistribution[];
  
  // Aggregated by group
  groupDistribution: Array<{
    group: GradeGroup;
    count: number;
    percentage: number;
    grades: string[];
  }>;
  
  // Pyramid shape analysis
  pyramidShape: PyramidShape;
  pyramidHealthScore: number; // 0-100
  
  // Issues identified
  issues: Array<{
    severity: 'info' | 'warning' | 'critical';
    message: string;
  }>;
}

export interface PyramidComparison {
  yourPyramid: GradePyramid;
  peerPyramid: GradePyramid;
  marketPyramid: GradePyramid;
  
  deviations: Array<{
    group: GradeGroup;
    yourPercentage: number;
    peerPercentage: number;
    marketPercentage: number;
    deviation: number; // pp from peer
    significance: 'significant' | 'moderate' | 'minor';
  }>;
  
  successionInsight: string;
}

export class GradePyramidAnalyzer {
  /**
   * Classify a grade into a group
   * 
   * UN Grade Hierarchy:
   * - Executive: D1, D2, ASG, USG, SG, DSG (International Directors & Senior Officials)
   * - Senior: P5, P6, P7 (Senior International Professional)
   * - Mid: P3, P4 (Mid-level International Professional)
   * - Entry: P1, P2, G1-G7, NO-A/B/C/D, L1-L4, Interns
   * - Consultant: IC, SSA, LICA, IPSA, Consultants
   * - Service Agreements: NPSA, PSA, SB (classified by level within 'entry', 'mid', 'senior')
   */
  classifyGrade(grade: string): GradeGroup {
    if (!grade) return 'other';
    
    const g = grade.toUpperCase().trim();
    
    // Executive (D1+, USG, ASG, SG, DSG) - International Directors & Senior Officials
    if (/^(D[-]?[12]|USG|ASG|SG|DSG)/.test(g)) return 'executive';
    
    // Senior International Professional (P5, P6, P7)
    if (/^P[-]?[567]/.test(g)) return 'senior';
    
    // Mid-level International Professional (P3, P4)
    if (/^P[-]?[34]/.test(g)) return 'mid';
    
    // Entry-level International Professional (P1, P2)
    if (/^P[-]?[12]/.test(g)) return 'entry';
    
    // General Service (G1-G7)
    if (/^G[-]?[1-7]/.test(g)) return 'entry';
    
    // National Officers (NO-A, NO-B, NO-C, NO-D)
    if (/^NO[-]?[A-D]/.test(g)) return 'entry';
    
    // Local levels (L1-L4)
    if (/^L[-]?[1-4]/.test(g)) return 'entry';
    
    // NPSA (National Personnel Service Agreement) - Classify by level
    // NPSA 10-11: Senior national staff (but NOT executive - these are service agreements)
    // NPSA 7-9: Mid-level national staff
    // NPSA 1-6: Entry national staff
    const npsaMatch = g.match(/NPSA[-\s]?([0-9]+)/);
    if (npsaMatch) {
      const level = parseInt(npsaMatch[1]);
      if (level >= 10) return 'senior'; // Senior national, but not executive
      if (level >= 7) return 'mid';
      return 'entry';
    }
    
    // PSA (Personnel Service Agreement) - Similar classification
    const psaMatch = g.match(/PSA[-\s]?([0-9]+)/);
    if (psaMatch) {
      const level = parseInt(psaMatch[1]);
      if (level >= 10) return 'senior';
      if (level >= 7) return 'mid';
      return 'entry';
    }
    
    // SB (Service Contract - UNDP specific)
    const sbMatch = g.match(/SB[-\s]?([0-9]+)/);
    if (sbMatch) {
      const level = parseInt(sbMatch[1]);
      if (level >= 4) return 'mid';
      return 'entry';
    }
    
    // IPSA (International Personnel Service Agreement)
    const ipsaMatch = g.match(/IPSA[-\s]?([0-9]+)/);
    if (ipsaMatch) {
      const level = parseInt(ipsaMatch[1]);
      if (level >= 10) return 'senior';
      if (level >= 7) return 'mid';
      return 'entry';
    }
    
    // LICA (Local Individual Contractor Agreement)
    if (g.includes('LICA')) {
      const licaMatch = g.match(/LICA[-\s]?([0-9]+)/);
      if (licaMatch) {
        const level = parseInt(licaMatch[1]);
        if (level >= 10) return 'consultant'; // Senior consultant
        return 'consultant';
      }
      return 'consultant';
    }
    
    // Consultant/Contractor types
    if (g.includes('CONSULT') || g === 'IC' || g.includes('SSA') || 
        g.includes('INDIVIDUAL CONTRACTOR')) {
      return 'consultant';
    }
    
    // UNV (UN Volunteers)
    if (g.includes('UNV') || g.includes('VOLUNTEER')) {
      return 'entry';
    }
    
    // Intern
    if (g.includes('INTERN')) return 'entry';
    
    // Log unrecognized grade for debugging
    if (grade && grade.trim().length > 0) {
      console.debug(`GradePyramidAnalyzer: Unrecognized grade "${grade}" classified as 'other'`);
    }
    
    return 'other';
  }

  /**
   * Analyze grade pyramid for cumulative hiring
   */
  analyzePyramid(
    data: ProcessedJobData[],
    category: string | null = null,
    agency: string | null = null,
    lookbackMonths: number = 24
  ): GradePyramid {
    const cutoffDate = subMonths(new Date(), lookbackMonths);
    
    // Filter data
    let filtered = data.filter(job => {
      try {
        const date = parseISO(job.posting_date);
        return date >= cutoffDate;
      } catch { return false; }
    });
    
    if (category) {
      filtered = filtered.filter(job => job.primary_category === category);
    }
    
    if (agency) {
      filtered = filtered.filter(job => 
        (job.short_agency || job.long_agency) === agency
      );
    }
    
    // Count by grade
    const gradeCounts = new Map<string, number>();
    filtered.forEach(job => {
      const grade = job.up_grade || 'Unknown';
      gradeCounts.set(grade, (gradeCounts.get(grade) || 0) + 1);
    });
    
    const total = filtered.length || 1;
    
    // Build distribution
    const gradeDistribution: GradeDistribution[] = Array.from(gradeCounts.entries())
      .map(([grade, count]) => ({
        grade,
        gradeGroup: this.classifyGrade(grade),
        count,
        percentage: (count / total) * 100
      }))
      .sort((a, b) => b.count - a.count);
    
    // Aggregate by group
    const groupCounts = new Map<GradeGroup, { count: number; grades: Set<string> }>();
    gradeDistribution.forEach(d => {
      if (!groupCounts.has(d.gradeGroup)) {
        groupCounts.set(d.gradeGroup, { count: 0, grades: new Set() });
      }
      const gc = groupCounts.get(d.gradeGroup)!;
      gc.count += d.count;
      gc.grades.add(d.grade);
    });
    
    const groupOrder: GradeGroup[] = ['entry', 'mid', 'senior', 'executive', 'consultant', 'other'];
    const groupDistribution = groupOrder
      .filter(g => groupCounts.has(g))
      .map(group => {
        const gc = groupCounts.get(group)!;
        return {
          group,
          count: gc.count,
          percentage: (gc.count / total) * 100,
          grades: Array.from(gc.grades)
        };
      });
    
    // Analyze pyramid shape
    const { shape, healthScore, issues } = this.analyzePyramidShape(groupDistribution);
    
    return {
      category: category || 'All Categories',
      agency,
      timeframeMonths: lookbackMonths,
      totalPositions: filtered.length,
      gradeDistribution,
      groupDistribution,
      pyramidShape: shape,
      pyramidHealthScore: healthScore,
      issues
    };
  }

  /**
   * Compare pyramids across agency, peers, and market
   */
  comparePyramids(
    data: ProcessedJobData[],
    category: string,
    agency: string,
    peerAgencies: string[],
    lookbackMonths: number = 24
  ): PyramidComparison {
    const yourPyramid = this.analyzePyramid(data, category, agency, lookbackMonths);
    
    // Peer pyramid (aggregate of peer agencies)
    const peerData = data.filter(job => 
      peerAgencies.includes(job.short_agency || job.long_agency || '')
    );
    const peerPyramid = this.analyzePyramid(peerData, category, null, lookbackMonths);
    
    // Market pyramid (all agencies)
    const marketPyramid = this.analyzePyramid(data, category, null, lookbackMonths);
    
    // Calculate deviations
    const deviations = this.calculateDeviations(yourPyramid, peerPyramid, marketPyramid);
    
    // Generate insight
    const insight = this.generateSuccessionInsight(yourPyramid, peerPyramid, category);
    
    return {
      yourPyramid,
      peerPyramid,
      marketPyramid,
      deviations,
      successionInsight: insight
    };
  }

  /**
   * Get pyramid data for all categories (for overview)
   */
  getAllCategoryPyramids(
    data: ProcessedJobData[],
    agency: string | null = null,
    lookbackMonths: number = 24
  ): GradePyramid[] {
    // Get unique categories
    const categories = [...new Set(data.map(job => job.primary_category))];
    
    return categories
      .map(category => this.analyzePyramid(data, category, agency, lookbackMonths))
      .filter(pyramid => pyramid.totalPositions >= 10) // Only categories with enough data
      .sort((a, b) => b.totalPositions - a.totalPositions);
  }

  private analyzePyramidShape(
    groupDistribution: Array<{ group: GradeGroup; percentage: number }>
  ): { shape: PyramidShape; healthScore: number; issues: Array<{ severity: 'info' | 'warning' | 'critical'; message: string }> } {
    const issues: Array<{ severity: 'info' | 'warning' | 'critical'; message: string }> = [];
    
    const entry = groupDistribution.find(g => g.group === 'entry')?.percentage || 0;
    const mid = groupDistribution.find(g => g.group === 'mid')?.percentage || 0;
    const senior = groupDistribution.find(g => g.group === 'senior')?.percentage || 0;
    const executive = groupDistribution.find(g => g.group === 'executive')?.percentage || 0;
    const consultant = groupDistribution.find(g => g.group === 'consultant')?.percentage || 0;
    
    const seniorPlus = senior + executive;
    
    let shape: PyramidShape = 'healthy';
    let healthScore = 100;
    
    // Check for inverted pyramid (senior > entry)
    if (seniorPlus > entry && entry > 0) {
      shape = 'inverted';
      healthScore -= 30;
      issues.push({
        severity: 'warning',
        message: `Inverted structure: ${seniorPlus.toFixed(0)}% senior+ vs ${entry.toFixed(0)}% entry-level`
      });
    }
    
    // Check for missing middle
    if (mid < 15 && entry > 25 && seniorPlus > 25) {
      shape = 'missing_middle';
      healthScore -= 25;
      issues.push({
        severity: 'warning',
        message: `Gap at mid-level (P3-P4): only ${mid.toFixed(0)}% of positions`
      });
    }
    
    // Check for top-heavy
    if (seniorPlus > 40) {
      shape = 'top_heavy';
      healthScore -= 20;
      issues.push({
        severity: 'info',
        message: `Senior-heavy: ${seniorPlus.toFixed(0)}% at P5+ level`
      });
    }
    
    // Check for bottom-heavy
    if (entry > 50) {
      shape = 'bottom_heavy';
      healthScore -= 10;
      issues.push({
        severity: 'info',
        message: `Entry-heavy: ${entry.toFixed(0)}% at entry level`
      });
    }
    
    // Check consultant dependency
    if (consultant > 50) {
      healthScore -= 15;
      issues.push({
        severity: 'warning',
        message: `High consultant reliance: ${consultant.toFixed(0)}% of positions`
      });
    }
    
    // Check succession pipeline
    if (seniorPlus > 30 && mid < 20) {
      issues.push({
        severity: 'warning',
        message: 'Potential succession gap: limited mid-level pipeline for senior positions'
      });
    }
    
    return { shape, healthScore: Math.max(0, healthScore), issues };
  }

  private calculateDeviations(
    yours: GradePyramid,
    peer: GradePyramid,
    market: GradePyramid
  ): PyramidComparison['deviations'] {
    const groups: GradeGroup[] = ['entry', 'mid', 'senior', 'executive', 'consultant'];
    
    return groups.map(group => {
      const yourPct = yours.groupDistribution.find(g => g.group === group)?.percentage || 0;
      const peerPct = peer.groupDistribution.find(g => g.group === group)?.percentage || 0;
      const marketPct = market.groupDistribution.find(g => g.group === group)?.percentage || 0;
      
      const deviation = yourPct - peerPct;
      let significance: 'significant' | 'moderate' | 'minor';
      
      if (Math.abs(deviation) > 10) significance = 'significant';
      else if (Math.abs(deviation) > 5) significance = 'moderate';
      else significance = 'minor';
      
      return {
        group,
        yourPercentage: yourPct,
        peerPercentage: peerPct,
        marketPercentage: marketPct,
        deviation,
        significance
      };
    });
  }

  private generateSuccessionInsight(
    yours: GradePyramid,
    peer: GradePyramid,
    category: string
  ): string {
    const yourSenior = yours.groupDistribution.find(g => g.group === 'senior')?.percentage || 0;
    const peerSenior = peer.groupDistribution.find(g => g.group === 'senior')?.percentage || 0;
    const yourMid = yours.groupDistribution.find(g => g.group === 'mid')?.percentage || 0;
    const peerMid = peer.groupDistribution.find(g => g.group === 'mid')?.percentage || 0;
    
    const parts: string[] = [];
    
    parts.push(`In ${category}, your cumulative hiring over ${yours.timeframeMonths} months`);
    
    if (yourSenior > peerSenior + 5) {
      parts.push(`shows ${yourSenior.toFixed(0)}% at P5+ level vs peer average of ${peerSenior.toFixed(0)}%.`);
      parts.push('This experienced workforce may face succession challenges as senior staff retire.');
      
      if (yourMid < peerMid - 5) {
        parts.push(`Consider whether P3-P4 pipeline (currently ${yourMid.toFixed(0)}%) is adequate.`);
      }
    } else if (yourSenior < peerSenior - 5) {
      parts.push(`shows ${yourSenior.toFixed(0)}% at P5+ level vs peer average of ${peerSenior.toFixed(0)}%.`);
      parts.push('This may indicate limited senior capacity or different organizational structure.');
    } else {
      parts.push(`aligns with peer averages for seniority distribution.`);
    }
    
    return parts.join(' ');
  }
}

export default GradePyramidAnalyzer;

