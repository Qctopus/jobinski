import { ProcessedJobData } from '../../types';
import { classifyGrade, GradeTier, PYRAMID_TIERS, getConsolidatedTier } from '../../utils/gradeClassification';
import { classifyLocation, standardizeRegion, LocationType } from '../../utils/locationClassification';
import { parseISO, subWeeks, isWithinInterval, format } from 'date-fns';

/**
 * Workforce Structure Analyzer
 * 
 * Provides comprehensive workforce structure analytics based on job postings.
 */

// ============ TYPES ============

export interface PyramidData {
  tier: string;
  level: number;
  count: number;
  percentage: number;
  color: string;
  grades: Array<{ grade: string; count: number; isNonStaff?: boolean }>;
}

export interface NonStaffData {
  category: string;
  count: number;
  percentage: number;
  color: string;
}

export interface WorkforcePyramidData {
  totalPositions: number;
  staffPositions: number;
  nonStaffPositions: number;
  staffPercentage: number;
  nonStaffPercentage: number;
  pyramid: PyramidData[];
  nonStaff: NonStaffData[];
}

export interface GradeCategoryCell {
  grade: string;
  category: string;
  count: number;
  percentage: number;
  intensity: 'high' | 'medium' | 'low' | 'none';
}

export interface GradeCategoryMatrix {
  grades: string[];
  categories: string[];
  cells: GradeCategoryCell[];
  totalJobs: number;
}

export interface GradeGeographyData {
  locationType: string;
  grades: Array<{
    tier: string;
    count: number;
    percentage: number;
  }>;
  totalCount: number;
  color: string;
}

export interface AgencyFingerprint {
  agency: string;
  totalPositions: number;
  pyramid: PyramidData[];
  staffRatio: number;
  fieldRatio: number;
  topCategories: Array<{ category: string; count: number; percentage: number }>;
  dominantGradeTier: string;
  workforceModel: 'HQ-Centric' | 'Field-Deployed' | 'Consultant-Heavy' | 'Leadership-Focused' | 'Balanced';
  characteristics: string[];
}

export interface StaffNonStaffAnalysis {
  overall: {
    staff: number;
    nonStaff: number;
    staffPercentage: number;
    nonStaffPercentage: number;
  };
  byContractType: Array<{
    type: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  byCategory: Array<{
    category: string;
    staffCount: number;
    nonStaffCount: number;
    nonStaffRatio: number;
  }>;
  byAgency: Array<{
    agency: string;
    staffCount: number;
    nonStaffCount: number;
    nonStaffRatio: number;
    total: number;
  }>;
}

export interface WorkforceEvolutionPeriod {
  period: string;
  startDate: Date;
  endDate: Date;
  pyramid: PyramidData[];
  pyramidData: WorkforcePyramidData; // Full pyramid data for comparison
  totalPositions: number;
  staffRatio: number;
  fieldRatio: number;
}

export interface WorkforceShift {
  type: string;
  description: string;
  magnitude: 'major' | 'moderate' | 'minor';
  direction: 'up' | 'down';
}

export interface WorkforceEvolution {
  periods: WorkforceEvolutionPeriod[];
  shifts: WorkforceShift[];
}

export interface WorkforceInsight {
  type: 'trend' | 'comparison' | 'anomaly' | 'opportunity';
  title: string;
  description: string;
  metric?: string;
  impact: 'high' | 'medium' | 'low';
}

// ============ ANALYZER CLASS ============

export class WorkforceStructureAnalyzer {
  
  /**
   * Calculate the workforce pyramid
   */
  calculatePyramid(jobs: ProcessedJobData[], filterAgency?: string): WorkforcePyramidData {
    const filteredJobs = filterAgency 
      ? jobs.filter(j => (j.short_agency || j.long_agency) === filterAgency)
      : jobs;
    
    const gradeAnalyses = filteredJobs.map(job => classifyGrade(job.up_grade));
    
    // Count by pyramid position - includes BOTH staff and non-staff grades with pyramid positions
    const pyramidCounts: Record<number, { count: number; grades: Record<string, number>; staffGrades: Record<string, number>; nonStaffGrades: Record<string, number> }> = {};
    const nonStaffCounts: Record<string, number> = {
      'Consultant': 0,
      'Intern': 0,
      'Volunteer': 0
    };
    
    let staffCount = 0;
    let nonStaffCount = 0;
    
    gradeAnalyses.forEach(analysis => {
      // Binary staff/non-staff classification based on staffCategory
      const isStaff = analysis.staffCategory === 'Staff';
      
      if (isStaff) {
        staffCount++;
      } else {
        nonStaffCount++;
      }
      
      // Add to pyramid breakdown if it has a pyramid position (includes NPSA/IPSA at their equivalent levels)
      if (analysis.pyramidPosition > 0) {
        if (!pyramidCounts[analysis.pyramidPosition]) {
          pyramidCounts[analysis.pyramidPosition] = { count: 0, grades: {}, staffGrades: {}, nonStaffGrades: {} };
        }
        pyramidCounts[analysis.pyramidPosition].count++;
        pyramidCounts[analysis.pyramidPosition].grades[analysis.displayLabel] = 
          (pyramidCounts[analysis.pyramidPosition].grades[analysis.displayLabel] || 0) + 1;
        
        // Track staff vs non-staff grades separately for display
        if (isStaff) {
          pyramidCounts[analysis.pyramidPosition].staffGrades[analysis.displayLabel] = 
            (pyramidCounts[analysis.pyramidPosition].staffGrades[analysis.displayLabel] || 0) + 1;
        } else {
          pyramidCounts[analysis.pyramidPosition].nonStaffGrades[analysis.displayLabel] = 
            (pyramidCounts[analysis.pyramidPosition].nonStaffGrades[analysis.displayLabel] || 0) + 1;
        }
      } else if (!isStaff) {
        // Non-staff without pyramid position (consultants, interns, volunteers)
        if (analysis.tier === 'Consultant') {
          nonStaffCounts['Consultant']++;
        } else if (analysis.tier === 'Intern') {
          nonStaffCounts['Intern']++;
        } else if (analysis.tier === 'Volunteer') {
          nonStaffCounts['Volunteer']++;
        } else {
          nonStaffCounts['Consultant']++; // Default to consultant for other non-staff
        }
      }
    });
    
    // Build pyramid data - includes all grades with pyramid positions (staff AND service agreements)
    const totalPyramidPositions = Object.values(pyramidCounts).reduce((sum, tier) => sum + tier.count, 0) || 1;
    const pyramid: PyramidData[] = PYRAMID_TIERS.map(tier => {
      const data = pyramidCounts[tier.level] || { count: 0, grades: {}, staffGrades: {}, nonStaffGrades: {} };
      return {
        tier: tier.name,
        level: tier.level,
        count: data.count,
        percentage: totalPyramidPositions > 0 ? (data.count / totalPyramidPositions) * 100 : 0,
        color: tier.color,
        grades: Object.entries(data.grades)
          .map(([grade, count]) => ({ 
            grade, 
            count,
            isNonStaff: grade.includes('NPSA') || grade.includes('IPSA') || grade.includes('PSA')
          }))
          .sort((a, b) => b.count - a.count)
      };
    });
    
    // Build non-staff data - only for positions WITHOUT pyramid positions (consultants, interns, volunteers)
    const totalNonStaffWithoutPyramid = Object.values(nonStaffCounts).reduce((sum, c) => sum + c, 0) || 1;
    const nonStaff: NonStaffData[] = [
      { category: 'Consultants', count: nonStaffCounts['Consultant'], percentage: (nonStaffCounts['Consultant'] / totalNonStaffWithoutPyramid) * 100, color: '#F59E0B' },
      { category: 'Interns', count: nonStaffCounts['Intern'], percentage: (nonStaffCounts['Intern'] / totalNonStaffWithoutPyramid) * 100, color: '#8B5CF6' },
      { category: 'Volunteers', count: nonStaffCounts['Volunteer'], percentage: (nonStaffCounts['Volunteer'] / totalNonStaffWithoutPyramid) * 100, color: '#EC4899' },
    ];
    
    return {
      totalPositions: filteredJobs.length,
      staffPositions: staffCount,
      nonStaffPositions: nonStaffCount,
      staffPercentage: filteredJobs.length > 0 ? (staffCount / filteredJobs.length) * 100 : 0,
      nonStaffPercentage: filteredJobs.length > 0 ? (nonStaffCount / filteredJobs.length) * 100 : 0,
      pyramid,
      nonStaff
    };
  }
  
  /**
   * Calculate Grade × Category Matrix
   */
  calculateGradeCategoryMatrix(jobs: ProcessedJobData[], filterAgency?: string): GradeCategoryMatrix {
    const filteredJobs = filterAgency 
      ? jobs.filter(j => (j.short_agency || j.long_agency) === filterAgency)
      : jobs;
    
    // Get unique categories - show all categories that have data
    const categoryCount: Record<string, number> = {};
    filteredJobs.forEach(j => {
      const cat = j.sectoral_category || j.primary_category || 'Other';
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });
    
    // Sort by count but don't limit - show all categories
    const categories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .map(([cat]) => cat);
    
    // Define grade tiers for matrix rows
    const gradeTiers = ['Executive', 'Director', 'Senior Professional', 'Mid Professional', 'Entry Professional', 'Support', 'Consultant', 'Intern'];
    
    // Count by grade tier × category
    const counts: Record<string, Record<string, number>> = {};
    gradeTiers.forEach(tier => {
      counts[tier] = {};
      categories.forEach(cat => {
        counts[tier][cat] = 0;
      });
    });
    
    filteredJobs.forEach(job => {
      const gradeAnalysis = classifyGrade(job.up_grade);
      const category = job.sectoral_category || job.primary_category || 'Other';
      
      if (!categories.includes(category)) return;
      
      let tierKey = getConsolidatedTier(gradeAnalysis.tier);
      
      if (counts[tierKey] && counts[tierKey][category] !== undefined) {
        counts[tierKey][category]++;
      }
    });
    
    // Find max for intensity calculation
    let maxCount = 0;
    Object.values(counts).forEach(catCounts => {
      Object.values(catCounts).forEach(count => {
        if (count > maxCount) maxCount = count;
      });
    });
    
    // Build cells
    const cells: GradeCategoryCell[] = [];
    gradeTiers.forEach(grade => {
      categories.forEach(category => {
        const count = counts[grade]?.[category] || 0;
        const percentage = filteredJobs.length > 0 ? (count / filteredJobs.length) * 100 : 0;
        
        let intensity: 'high' | 'medium' | 'low' | 'none';
        if (count === 0) intensity = 'none';
        else if (count >= maxCount * 0.7) intensity = 'high';
        else if (count >= maxCount * 0.3) intensity = 'medium';
        else intensity = 'low';
        
        cells.push({ grade, category, count, percentage, intensity });
      });
    });
    
    return {
      grades: gradeTiers,
      categories,
      cells,
      totalJobs: filteredJobs.length
    };
  }
  
  /**
   * Calculate Grade × Geography Analysis
   */
  calculateGradeGeography(jobs: ProcessedJobData[], filterAgency?: string): GradeGeographyData[] {
    const filteredJobs = filterAgency 
      ? jobs.filter(j => (j.short_agency || j.long_agency) === filterAgency)
      : jobs;
    
    // Location colors
    const locationColors: Record<LocationType, string> = {
      'Headquarters': '#3B82F6',
      'Regional Hub': '#10B981',
      'Field': '#F59E0B',
      'Home-based': '#8B5CF6'
    };
    
    // Classify each job by location and grade
    const locationGroups: Record<LocationType, Array<{ tier: string }>> = {
      'Headquarters': [],
      'Regional Hub': [],
      'Field': [],
      'Home-based': []
    };
    
    filteredJobs.forEach(job => {
      const locationAnalysis = classifyLocation(job.duty_station, job.duty_country, job.duty_continent);
      const gradeAnalysis = classifyGrade(job.up_grade);
      
      const tier = getConsolidatedTier(gradeAnalysis.tier);
      
      locationGroups[locationAnalysis.locationType].push({ tier });
    });
    
    const gradeTiers = ['Executive', 'Director', 'Senior Professional', 'Mid Professional', 'Entry Professional', 'Support', 'Consultant', 'Intern', 'Other'];
    
    return Object.entries(locationGroups).map(([locationType, jobsInLocation]) => {
      const tierCounts: Record<string, number> = {};
      gradeTiers.forEach(tier => tierCounts[tier] = 0);
      
      jobsInLocation.forEach(job => {
        tierCounts[job.tier] = (tierCounts[job.tier] || 0) + 1;
      });
      
      return {
        locationType,
        grades: gradeTiers.map(tier => ({
          tier,
          count: tierCounts[tier],
          percentage: jobsInLocation.length > 0 ? (tierCounts[tier] / jobsInLocation.length) * 100 : 0
        })).filter(g => g.count > 0),
        totalCount: jobsInLocation.length,
        color: locationColors[locationType as LocationType]
      };
    });
  }
  
  /**
   * Calculate Agency Fingerprints
   */
  calculateAgencyFingerprints(jobs: ProcessedJobData[], minPositions: number = 20): AgencyFingerprint[] {
    // Group by agency
    const agencyJobs: Record<string, ProcessedJobData[]> = {};
    jobs.forEach(job => {
      const agency = job.short_agency || job.long_agency || 'Unknown';
      if (!agencyJobs[agency]) agencyJobs[agency] = [];
      agencyJobs[agency].push(job);
    });
    
    return Object.entries(agencyJobs)
      .filter(([_, agJobs]) => agJobs.length >= minPositions)
      .map(([agency, agencyJobsList]) => {
        const pyramidData = this.calculatePyramid(agencyJobsList);
        
        // Calculate field ratio
        let fieldCount = 0;
        agencyJobsList.forEach(job => {
          const loc = classifyLocation(job.duty_station, job.duty_country, job.duty_continent);
          if (loc.isField) fieldCount++;
        });
        const fieldRatio = agencyJobsList.length > 0 ? (fieldCount / agencyJobsList.length) * 100 : 0;
        
        // Get top categories
        const categoryCounts: Record<string, number> = {};
        agencyJobsList.forEach(job => {
          const cat = job.sectoral_category || job.primary_category || 'Other';
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });
        const topCategories = Object.entries(categoryCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([category, count]) => ({
            category,
            count,
            percentage: (count / agencyJobsList.length) * 100
          }));
        
        // Find dominant grade tier
        const dominantTier = pyramidData.pyramid.reduce((max, current) => 
          current.count > max.count ? current : max
        , pyramidData.pyramid[0]);
        
        // Determine workforce model
        let workforceModel: AgencyFingerprint['workforceModel'] = 'Balanced';
        const consultantRatio = pyramidData.nonStaffPercentage;
        const seniorRatio = pyramidData.pyramid
          .filter(p => ['Executive', 'Director', 'Senior Professional'].includes(p.tier))
          .reduce((sum, p) => sum + p.percentage, 0);
        
        if (consultantRatio > 40) {
          workforceModel = 'Consultant-Heavy';
        } else if (fieldRatio > 70) {
          workforceModel = 'Field-Deployed';
        } else if (fieldRatio < 30) {
          workforceModel = 'HQ-Centric';
        } else if (seniorRatio > 30) {
          workforceModel = 'Leadership-Focused';
        }
        
        // Generate characteristics
        const characteristics: string[] = [];
        if (consultantRatio > 30) characteristics.push('High consultant use');
        if (fieldRatio > 60) characteristics.push('Strong field presence');
        if (fieldRatio < 30) characteristics.push('HQ-concentrated');
        if (seniorRatio > 25) characteristics.push('Senior-heavy');
        const entryPerc = pyramidData.pyramid.find(p => p.tier === 'Entry Professional')?.percentage || 0;
        if (entryPerc > 30) {
          characteristics.push('Entry pipeline');
        }
        
        return {
          agency,
          totalPositions: agencyJobsList.length,
          pyramid: pyramidData.pyramid,
          staffRatio: pyramidData.staffPercentage,
          fieldRatio,
          topCategories,
          dominantGradeTier: dominantTier?.tier || 'Unknown',
          workforceModel,
          characteristics
        };
      })
      .sort((a, b) => b.totalPositions - a.totalPositions);
  }
  
  /**
   * Calculate Staff vs Non-Staff Analysis
   */
  calculateStaffNonStaffAnalysis(jobs: ProcessedJobData[], filterAgency?: string): StaffNonStaffAnalysis {
    const filteredJobs = filterAgency 
      ? jobs.filter(j => (j.short_agency || j.long_agency) === filterAgency)
      : jobs;
    
    let staffCount = 0;
    let nonStaffCount = 0;
    
    const contractTypeCounts: Record<string, number> = {};
    const categoryAnalysis: Record<string, { staff: number; nonStaff: number }> = {};
    const agencyAnalysis: Record<string, { staff: number; nonStaff: number }> = {};
    
    // Contract type colors - Service Agreements shown in contract breakdown
    const contractColors: Record<string, string> = {
      'International Staff': '#3B82F6',
      'National Staff': '#10B981',
      'Service Agreement': '#0EA5E9', // NPSA/IPSA - counts as Non-Staff but distinct contract type
      'Consultant': '#F59E0B',
      'Trainee': '#8B5CF6',
      'Other': '#6B7280'
    };
    
    filteredJobs.forEach(job => {
      const analysis = classifyGrade(job.up_grade);
      const category = job.sectoral_category || job.primary_category || 'Other';
      const agency = job.short_agency || job.long_agency || 'Unknown';
      
      // Binary classification: Staff vs Non-Staff (Service Agreements count as Non-Staff)
      if (analysis.staffCategory === 'Staff') {
        staffCount++;
      } else {
        nonStaffCount++;
      }
      
      // Contract type (for detailed breakdown)
      contractTypeCounts[analysis.contractType] = (contractTypeCounts[analysis.contractType] || 0) + 1;
      
      // By category
      if (!categoryAnalysis[category]) categoryAnalysis[category] = { staff: 0, nonStaff: 0 };
      if (analysis.staffCategory === 'Staff') {
        categoryAnalysis[category].staff++;
      } else {
        categoryAnalysis[category].nonStaff++;
      }
      
      // By agency
      if (!agencyAnalysis[agency]) agencyAnalysis[agency] = { staff: 0, nonStaff: 0 };
      if (analysis.staffCategory === 'Staff') {
        agencyAnalysis[agency].staff++;
      } else {
        agencyAnalysis[agency].nonStaff++;
      }
    });
    
    const total = filteredJobs.length || 1;
    
    return {
      overall: {
        staff: staffCount,
        nonStaff: nonStaffCount,
        staffPercentage: (staffCount / total) * 100,
        nonStaffPercentage: (nonStaffCount / total) * 100
      },
      byContractType: Object.entries(contractTypeCounts)
        .map(([type, count]) => ({
          type,
          count,
          percentage: (count / total) * 100,
          color: contractColors[type] || '#6B7280'
        }))
        .sort((a, b) => b.count - a.count),
      byCategory: Object.entries(categoryAnalysis)
        .map(([category, data]) => ({
          category,
          staffCount: data.staff,
          nonStaffCount: data.nonStaff,
          nonStaffRatio: (data.staff + data.nonStaff) > 0 
            ? (data.nonStaff / (data.staff + data.nonStaff)) * 100 
            : 0
        }))
        .sort((a, b) => b.nonStaffRatio - a.nonStaffRatio),
      byAgency: Object.entries(agencyAnalysis)
        .filter(([_, data]) => (data.staff + data.nonStaff) >= 1)
        .map(([agency, data]) => ({
          agency,
          staffCount: data.staff,
          nonStaffCount: data.nonStaff,
          nonStaffRatio: (data.staff + data.nonStaff) > 0 
            ? (data.nonStaff / (data.staff + data.nonStaff)) * 100 
            : 0,
          total: data.staff + data.nonStaff
        }))
        .sort((a, b) => b.total - a.total)
    };
  }
  
  /**
   * Calculate Workforce Evolution Over Time
   */
  calculateWorkforceEvolution(
    jobs: ProcessedJobData[], 
    comparisonPeriod: '4weeks' | '8weeks' | '3months',
    filterAgency?: string
  ): WorkforceEvolution {
    const filteredJobs = filterAgency 
      ? jobs.filter(j => (j.short_agency || j.long_agency) === filterAgency)
      : jobs;
    
    const now = new Date();
    let periodLength: number;
    
    switch (comparisonPeriod) {
      case '4weeks':
        periodLength = 4;
        break;
      case '8weeks':
        periodLength = 8;
        break;
      case '3months':
        periodLength = 12; // weeks
        break;
    }
    
    const periodCount = 2;
    const periods: WorkforceEvolutionPeriod[] = [];
    
    for (let i = periodCount - 1; i >= 0; i--) {
      const endDate = subWeeks(now, i * periodLength);
      const startDate = subWeeks(endDate, periodLength);
      
      const periodJobs = filteredJobs.filter(job => {
        try {
          const postDate = parseISO(job.posting_date);
          return isWithinInterval(postDate, { start: startDate, end: endDate });
        } catch {
          return false;
        }
      });
      
      const pyramidData = this.calculatePyramid(periodJobs);
      
      // Calculate field ratio
      let fieldCount = 0;
      periodJobs.forEach(job => {
        const loc = classifyLocation(job.duty_station, job.duty_country, job.duty_continent);
        if (loc.isField) fieldCount++;
      });
      
      periods.push({
        period: i === 0 ? 'Current' : 'Previous',
        startDate,
        endDate,
        pyramid: pyramidData.pyramid,
        pyramidData: pyramidData, // Include full pyramid data for comparison
        totalPositions: periodJobs.length,
        staffRatio: pyramidData.staffPercentage,
        fieldRatio: periodJobs.length > 0 ? (fieldCount / periodJobs.length) * 100 : 0
      });
    }
    
    // Detect shifts
    const shifts: WorkforceShift[] = [];
    
    if (periods.length >= 2) {
      const current = periods[periods.length - 1];
      const previous = periods[0];
      
      // Volume change
      const volumeChange = previous.totalPositions > 0 
        ? ((current.totalPositions - previous.totalPositions) / previous.totalPositions) * 100 
        : 0;
      
      if (Math.abs(volumeChange) > 15) {
        shifts.push({
          type: 'Volume',
          description: `Hiring volume ${volumeChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(volumeChange).toFixed(0)}%`,
          magnitude: Math.abs(volumeChange) > 30 ? 'major' : 'moderate',
          direction: volumeChange > 0 ? 'up' : 'down'
        });
      }
      
      // Staff ratio change
      const staffChange = current.staffRatio - previous.staffRatio;
      if (Math.abs(staffChange) > 5) {
        shifts.push({
          type: 'Staff Mix',
          description: `Staff ratio ${staffChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(staffChange).toFixed(1)} percentage points`,
          magnitude: Math.abs(staffChange) > 10 ? 'major' : 'moderate',
          direction: staffChange > 0 ? 'up' : 'down'
        });
      }
      
      // Field ratio change
      const fieldChange = current.fieldRatio - previous.fieldRatio;
      if (Math.abs(fieldChange) > 5) {
        shifts.push({
          type: 'Geographic',
          description: `Field presence ${fieldChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(fieldChange).toFixed(1)} percentage points`,
          magnitude: Math.abs(fieldChange) > 10 ? 'major' : 'moderate',
          direction: fieldChange > 0 ? 'up' : 'down'
        });
      }
    }
    
    return { periods, shifts };
  }
  
  /**
   * Generate Strategic Insights
   */
  generateInsights(
    jobs: ProcessedJobData[],
    filterAgency?: string,
    marketJobs?: ProcessedJobData[]
  ): WorkforceInsight[] {
    const insights: WorkforceInsight[] = [];
    
    const pyramidData = this.calculatePyramid(jobs, filterAgency);
    const staffAnalysis = this.calculateStaffNonStaffAnalysis(jobs, filterAgency);
    
    // Insight: Non-staff ratio
    if (staffAnalysis.overall.nonStaffPercentage > 35) {
      insights.push({
        type: 'trend',
        title: 'High Non-Staff Dependency',
        description: `${staffAnalysis.overall.nonStaffPercentage.toFixed(0)}% of positions are non-staff (consultants, interns, etc.). This may indicate flexibility but also workforce instability.`,
        metric: `${staffAnalysis.overall.nonStaffPercentage.toFixed(0)}%`,
        impact: staffAnalysis.overall.nonStaffPercentage > 45 ? 'high' : 'medium'
      });
    }
    
    // Insight: Pyramid shape
    const seniorRatio = pyramidData.pyramid
      .filter(p => ['Executive', 'Director', 'Senior Professional'].includes(p.tier))
      .reduce((sum, p) => sum + p.count, 0) / (pyramidData.staffPositions || 1) * 100;
    
    const entryRatio = pyramidData.pyramid
      .filter(p => ['Entry Professional', 'Support'].includes(p.tier))
      .reduce((sum, p) => sum + p.count, 0) / (pyramidData.staffPositions || 1) * 100;
    
    if (seniorRatio > 35) {
      insights.push({
        type: 'anomaly',
        title: 'Top-Heavy Structure',
        description: `${seniorRatio.toFixed(0)}% of staff positions are senior level. This may indicate succession planning challenges or need for junior talent pipeline.`,
        metric: `${seniorRatio.toFixed(0)}% senior`,
        impact: 'medium'
      });
    }
    
    if (entryRatio > 50) {
      insights.push({
        type: 'trend',
        title: 'Strong Entry Pipeline',
        description: `${entryRatio.toFixed(0)}% of positions are entry-level, indicating investment in building future workforce capacity.`,
        metric: `${entryRatio.toFixed(0)}% entry`,
        impact: 'low'
      });
    }
    
    // Insight: Category with highest consultant ratio
    const highConsultantCategory = staffAnalysis.byCategory
      .filter(c => (c.staffCount + c.nonStaffCount) >= 10)
      .sort((a, b) => b.nonStaffRatio - a.nonStaffRatio)[0];
    
    if (highConsultantCategory && highConsultantCategory.nonStaffRatio > 50) {
      insights.push({
        type: 'comparison',
        title: 'Consultant-Heavy Category',
        description: `"${highConsultantCategory.category}" has ${highConsultantCategory.nonStaffRatio.toFixed(0)}% non-staff positions, the highest among all categories.`,
        metric: `${highConsultantCategory.nonStaffRatio.toFixed(0)}%`,
        impact: 'medium'
      });
    }
    
    // Agency-specific insights (if comparing to market)
    if (filterAgency && marketJobs) {
      const agencyPyramid = this.calculatePyramid(jobs, filterAgency);
      const marketPyramid = this.calculatePyramid(marketJobs);
      
      const agencyNonStaff = agencyPyramid.nonStaffPercentage;
      const marketNonStaff = marketPyramid.nonStaffPercentage;
      
      if (agencyNonStaff > marketNonStaff + 10) {
        insights.push({
          type: 'comparison',
          title: 'Above-Average Non-Staff Use',
          description: `Your non-staff ratio (${agencyNonStaff.toFixed(0)}%) is ${(agencyNonStaff - marketNonStaff).toFixed(0)} percentage points above the system average.`,
          metric: `+${(agencyNonStaff - marketNonStaff).toFixed(0)}pp vs market`,
          impact: 'medium'
        });
      } else if (agencyNonStaff < marketNonStaff - 10) {
        insights.push({
          type: 'opportunity',
          title: 'Lower Non-Staff Reliance',
          description: `Your non-staff ratio (${agencyNonStaff.toFixed(0)}%) is ${(marketNonStaff - agencyNonStaff).toFixed(0)} percentage points below the system average, suggesting more stable workforce composition.`,
          metric: `-${(marketNonStaff - agencyNonStaff).toFixed(0)}pp vs market`,
          impact: 'low'
        });
      }
    }
    
    // Add positive insight if structure looks healthy
    if (insights.length === 0) {
      insights.push({
        type: 'opportunity',
        title: 'Balanced Workforce Structure',
        description: 'The workforce composition shows a healthy balance between staff and non-staff positions, with appropriate distribution across grade levels.',
        impact: 'low'
      });
    }
    
    return insights;
  }
}

export default WorkforceStructureAnalyzer;

