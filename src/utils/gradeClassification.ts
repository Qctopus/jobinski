/**
 * Comprehensive UN Grade Classification System
 * 
 * This maps all possible up_grade values to standardized tiers
 * for workforce structure analysis.
 */

export type GradeTier = 
  | 'Executive'           // D2, ASG, USG
  | 'Director'            // D1
  | 'Senior Professional' // P5, IPSA-11, IPSA-12
  | 'Mid Professional'    // P3, P4, IPSA-9, IPSA-10, NOC, NOD, NPSA-10, NPSA-11
  | 'Entry Professional'  // P1, P2, NOA, NOB, NPSA-7, NPSA-8, NPSA-9, IPSA-7, IPSA-8
  | 'Senior Support'      // G6, G7
  | 'Mid Support'         // G4, G5
  | 'Entry Support'       // G1, G2, G3
  | 'Consultant'          // Consultant, IC, LICA
  | 'Intern'              // Intern
  | 'Volunteer'           // UNV, Volunteer
  | 'Other';              // Unclassified

export type ContractType = 
  | 'International Staff'   // P grades, D grades
  | 'National Staff'        // NO grades, G grades
  | 'Service Agreement'     // NPSA, IPSA, PSA
  | 'Consultant'            // Consultant, IC, LICA
  | 'Trainee'               // Intern, UNV
  | 'Other';

// Staff category is binary - Service Agreements count as Non-Staff
// But we track contractType separately for detailed analysis
export type StaffCategory = 'Staff' | 'Non-Staff';

/**
 * Service Agreement types for detailed analysis
 * NPSA = National Personnel Service Agreement (national, 1 day to 1 year)
 * IPSA = International Personnel Service Agreement (international specialist, up to 4 years)
 */
export type ServiceAgreementType = 'NPSA' | 'IPSA' | 'PSA' | 'SB' | 'Other';

export interface GradeAnalysis {
  originalGrade: string;
  tier: GradeTier;
  contractType: ContractType;
  staffCategory: StaffCategory;
  serviceAgreementType?: ServiceAgreementType; // For NPSA/IPSA/PSA distinction
  numericLevel: number;        // For sorting: 1-12 scale
  isInternational: boolean;
  isNational: boolean;
  pyramidPosition: number;     // 1 = base, 6 = top
  displayLabel: string;        // Clean display name
}

/**
 * Parse and classify a grade string
 */
export function classifyGrade(grade: string): GradeAnalysis {
  if (!grade || grade.trim() === '') {
    return createDefaultAnalysis('Unknown');
  }
  
  const g = grade.toUpperCase().trim();
  
  // ============ EXECUTIVE TIER (Pyramid Level 6) ============
  if (['ASG', 'USG', 'SG', 'DSG'].includes(g)) {
    return {
      originalGrade: grade,
      tier: 'Executive',
      contractType: 'International Staff',
      staffCategory: 'Staff',
      numericLevel: 12,
      isInternational: true,
      isNational: false,
      pyramidPosition: 6,
      displayLabel: g
    };
  }
  
  if (/^D[-]?2$/.test(g)) {
    return {
      originalGrade: grade,
      tier: 'Executive',
      contractType: 'International Staff',
      staffCategory: 'Staff',
      numericLevel: 11,
      isInternational: true,
      isNational: false,
      pyramidPosition: 6,
      displayLabel: 'D2'
    };
  }
  
  // ============ DIRECTOR TIER (Pyramid Level 5) ============
  if (/^D[-]?1$/.test(g)) {
    return {
      originalGrade: grade,
      tier: 'Director',
      contractType: 'International Staff',
      staffCategory: 'Staff',
      numericLevel: 10,
      isInternational: true,
      isNational: false,
      pyramidPosition: 5,
      displayLabel: 'D1'
    };
  }
  
  // ============ SENIOR PROFESSIONAL TIER (Pyramid Level 4) ============
  if (/^P[-]?5$/.test(g)) {
    return {
      originalGrade: grade,
      tier: 'Senior Professional',
      contractType: 'International Staff',
      staffCategory: 'Staff',
      numericLevel: 9,
      isInternational: true,
      isNational: false,
      pyramidPosition: 4,
      displayLabel: 'P5'
    };
  }
  
  // IPSA-11, IPSA-12 (senior international service agreements)
  const ipsaSeniorMatch = g.match(/^IPSA[-]?(1[1-2])$/);
  if (ipsaSeniorMatch) {
    return {
      originalGrade: grade,
      tier: 'Senior Professional',
      contractType: 'Service Agreement',
      staffCategory: 'Non-Staff',
      serviceAgreementType: 'IPSA',
      numericLevel: 9,
      isInternational: true,
      isNational: false,
      pyramidPosition: 4,
      displayLabel: `IPSA-${ipsaSeniorMatch[1]}`
    };
  }
  
  // NOD (senior national officer)
  if (g === 'NOD' || g === 'NO-D') {
    return {
      originalGrade: grade,
      tier: 'Senior Professional',
      contractType: 'National Staff',
      staffCategory: 'Staff',
      numericLevel: 8,
      isInternational: false,
      isNational: true,
      pyramidPosition: 4,
      displayLabel: 'NO-D'
    };
  }
  
  // ============ MID PROFESSIONAL TIER (Pyramid Level 3) ============
  const pMidMatch = g.match(/^P[-]?([34])$/);
  if (pMidMatch) {
    const level = parseInt(pMidMatch[1]);
    return {
      originalGrade: grade,
      tier: 'Mid Professional',
      contractType: 'International Staff',
      staffCategory: 'Staff',
      numericLevel: level + 4, // P3=7, P4=8
      isInternational: true,
      isNational: false,
      pyramidPosition: 3,
      displayLabel: `P${level}`
    };
  }
  
  // IPSA-9, IPSA-10 (mid international service agreements)
  const ipsaMidMatch = g.match(/^IPSA[-]?(9|10)$/);
  if (ipsaMidMatch) {
    return {
      originalGrade: grade,
      tier: 'Mid Professional',
      contractType: 'Service Agreement',
      staffCategory: 'Non-Staff',
      serviceAgreementType: 'IPSA',
      numericLevel: 7,
      isInternational: true,
      isNational: false,
      pyramidPosition: 3,
      displayLabel: `IPSA-${ipsaMidMatch[1]}`
    };
  }
  
  // NPSA-10, NPSA-11 (senior national service agreements)
  const npsaSeniorMatch = g.match(/^NPSA[-]?(1[0-1])$/);
  if (npsaSeniorMatch) {
    return {
      originalGrade: grade,
      tier: 'Mid Professional',
      contractType: 'Service Agreement',
      staffCategory: 'Non-Staff',
      serviceAgreementType: 'NPSA',
      numericLevel: 7,
      isInternational: false,
      isNational: true,
      pyramidPosition: 3,
      displayLabel: `NPSA-${npsaSeniorMatch[1]}`
    };
  }
  
  // NOC (mid national officer)
  if (g === 'NOC' || g === 'NO-C') {
    return {
      originalGrade: grade,
      tier: 'Mid Professional',
      contractType: 'National Staff',
      staffCategory: 'Staff',
      numericLevel: 6,
      isInternational: false,
      isNational: true,
      pyramidPosition: 3,
      displayLabel: 'NO-C'
    };
  }
  
  // ============ ENTRY PROFESSIONAL TIER (Pyramid Level 2) ============
  const pEntryMatch = g.match(/^P[-]?([12])$/);
  if (pEntryMatch) {
    const level = parseInt(pEntryMatch[1]);
    return {
      originalGrade: grade,
      tier: 'Entry Professional',
      contractType: 'International Staff',
      staffCategory: 'Staff',
      numericLevel: level + 3, // P1=4, P2=5
      isInternational: true,
      isNational: false,
      pyramidPosition: 2,
      displayLabel: `P${level}`
    };
  }
  
  // NOA, NOB (entry national officers)
  if (g === 'NOA' || g === 'NO-A') {
    return {
      originalGrade: grade,
      tier: 'Entry Professional',
      contractType: 'National Staff',
      staffCategory: 'Staff',
      numericLevel: 4,
      isInternational: false,
      isNational: true,
      pyramidPosition: 2,
      displayLabel: 'NO-A'
    };
  }
  
  if (g === 'NOB' || g === 'NO-B') {
    return {
      originalGrade: grade,
      tier: 'Entry Professional',
      contractType: 'National Staff',
      staffCategory: 'Staff',
      numericLevel: 5,
      isInternational: false,
      isNational: true,
      pyramidPosition: 2,
      displayLabel: 'NO-B'
    };
  }
  
  // NPSA-7, NPSA-8, NPSA-9 (entry-mid national service agreements)
  const npsaEntryMatch = g.match(/^NPSA[-]?([7-9])$/);
  if (npsaEntryMatch) {
    return {
      originalGrade: grade,
      tier: 'Entry Professional',
      contractType: 'Service Agreement',
      staffCategory: 'Non-Staff',
      serviceAgreementType: 'NPSA',
      numericLevel: 5,
      isInternational: false,
      isNational: true,
      pyramidPosition: 2,
      displayLabel: `NPSA-${npsaEntryMatch[1]}`
    };
  }
  
  // IPSA-7, IPSA-8 (entry international service agreements)
  const ipsaEntryMatch = g.match(/^IPSA[-]?([7-8])$/);
  if (ipsaEntryMatch) {
    return {
      originalGrade: grade,
      tier: 'Entry Professional',
      contractType: 'Service Agreement',
      staffCategory: 'Non-Staff',
      serviceAgreementType: 'IPSA',
      numericLevel: 5,
      isInternational: true,
      isNational: false,
      pyramidPosition: 2,
      displayLabel: `IPSA-${ipsaEntryMatch[1]}`
    };
  }
  
  // Lower NPSA (1-6)
  const npsaLowMatch = g.match(/^NPSA[-]?([1-6])$/);
  if (npsaLowMatch) {
    return {
      originalGrade: grade,
      tier: 'Entry Support',
      contractType: 'Service Agreement',
      staffCategory: 'Non-Staff',
      serviceAgreementType: 'NPSA',
      numericLevel: 2,
      isInternational: false,
      isNational: true,
      pyramidPosition: 1,
      displayLabel: `NPSA-${npsaLowMatch[1]}`
    };
  }
  
  // ============ GENERAL SERVICE TIERS ============
  // Senior GS (G6, G7)
  const gSeniorMatch = g.match(/^G[-]?([67])$/);
  if (gSeniorMatch) {
    return {
      originalGrade: grade,
      tier: 'Senior Support',
      contractType: 'National Staff',
      staffCategory: 'Staff',
      numericLevel: 4,
      isInternational: false,
      isNational: true,
      pyramidPosition: 2,
      displayLabel: `G${gSeniorMatch[1]}`
    };
  }
  
  // Mid GS (G4, G5)
  const gMidMatch = g.match(/^G[-]?([45])$/);
  if (gMidMatch) {
    return {
      originalGrade: grade,
      tier: 'Mid Support',
      contractType: 'National Staff',
      staffCategory: 'Staff',
      numericLevel: 3,
      isInternational: false,
      isNational: true,
      pyramidPosition: 1,
      displayLabel: `G${gMidMatch[1]}`
    };
  }
  
  // Entry GS (G1, G2, G3)
  const gEntryMatch = g.match(/^G[-]?([123])$/);
  if (gEntryMatch) {
    return {
      originalGrade: grade,
      tier: 'Entry Support',
      contractType: 'National Staff',
      staffCategory: 'Staff',
      numericLevel: 2,
      isInternational: false,
      isNational: true,
      pyramidPosition: 1,
      displayLabel: `G${gEntryMatch[1]}`
    };
  }
  
  // ============ CONSULTANTS ============
  if (g.includes('CONSULTANT') || g === 'IC' || g.includes('LICA') || g.includes('INDIVIDUAL CONTRACTOR')) {
    return {
      originalGrade: grade,
      tier: 'Consultant',
      contractType: 'Consultant',
      staffCategory: 'Non-Staff',
      numericLevel: 0,
      isInternational: false,
      isNational: false,
      pyramidPosition: 0, // Outside pyramid
      displayLabel: 'Consultant'
    };
  }
  
  // PSA (Personnel Service Agreement) - distinct from consultants
  if (g.includes('PSA') && !g.includes('NPSA') && !g.includes('IPSA')) {
    return {
      originalGrade: grade,
      tier: 'Consultant', // Keep in consultant tier for pyramid visualization
      contractType: 'Service Agreement',
      staffCategory: 'Non-Staff',
      serviceAgreementType: 'PSA',
      numericLevel: 0,
      isInternational: false,
      isNational: true,
      pyramidPosition: 0,
      displayLabel: 'PSA'
    };
  }
  
  // Contractor patterns (actual consultants)
  if (g.includes('CON') || g.includes('CONTRACTOR')) {
    return {
      originalGrade: grade,
      tier: 'Consultant',
      contractType: 'Consultant',
      staffCategory: 'Non-Staff',
      numericLevel: 0,
      isInternational: false,
      isNational: false,
      pyramidPosition: 0,
      displayLabel: 'Consultant'
    };
  }
  
  // ============ INTERNS ============
  if (g.includes('INTERN')) {
    return {
      originalGrade: grade,
      tier: 'Intern',
      contractType: 'Trainee',
      staffCategory: 'Non-Staff',
      numericLevel: 1,
      isInternational: false,
      isNational: false,
      pyramidPosition: 0, // Outside pyramid
      displayLabel: 'Intern'
    };
  }
  
  // ============ VOLUNTEERS ============
  if (g.includes('UNV') || g.includes('VOLUNTEER')) {
    return {
      originalGrade: grade,
      tier: 'Volunteer',
      contractType: 'Trainee',
      staffCategory: 'Non-Staff',
      numericLevel: 1,
      isInternational: false,
      isNational: false,
      pyramidPosition: 0,
      displayLabel: 'UNV'
    };
  }
  
  // ============ OTHER/UNKNOWN ============
  return createDefaultAnalysis(grade);
}

function createDefaultAnalysis(grade: string): GradeAnalysis {
  return {
    originalGrade: grade,
    tier: 'Other',
    contractType: 'Other',
    staffCategory: 'Non-Staff',
    numericLevel: 0,
    isInternational: false,
    isNational: false,
    pyramidPosition: 0,
    displayLabel: grade || 'Unknown'
  };
}

/**
 * Get pyramid tiers for visualization (top to bottom)
 */
export const PYRAMID_TIERS = [
  { level: 6, name: 'Executive', color: '#7C3AED', description: 'ASG, USG, D2' },
  { level: 5, name: 'Director', color: '#2563EB', description: 'D1' },
  { level: 4, name: 'Senior Professional', color: '#0891B2', description: 'P5, NO-D, IPSA-11+' },
  { level: 3, name: 'Mid Professional', color: '#059669', description: 'P3-P4, NO-C, NPSA-10+' },
  { level: 2, name: 'Entry Professional', color: '#D97706', description: 'P1-P2, NO-A/B, G6-7' },
  { level: 1, name: 'Support', color: '#DC2626', description: 'G1-G5, NPSA-1-6' },
];

/**
 * Non-staff categories (shown separately from pyramid)
 */
export const NON_STAFF_CATEGORIES = [
  { id: 'service-agreement', name: 'Service Agreements', color: '#0EA5E9', description: 'NPSA, IPSA, PSA - Project-based contracts' },
  { id: 'consultant', name: 'Consultants', color: '#F59E0B', description: 'IC, LICA, Individual Contractors' },
  { id: 'intern', name: 'Interns', color: '#8B5CF6', description: 'Internship positions' },
  { id: 'volunteer', name: 'Volunteers', color: '#EC4899', description: 'UNV, Volunteer positions' },
];

/**
 * Service Agreement details for analytics
 */
export const SERVICE_AGREEMENT_INFO = {
  NPSA: {
    name: 'National Personnel Service Agreement',
    shortName: 'NPSA',
    color: '#0EA5E9',
    description: 'National, 1 day to 1 year, office or home-based',
    isInternational: false,
    maxDuration: '1 year',
  },
  IPSA: {
    name: 'International Personnel Service Agreement',
    shortName: 'IPSA',
    color: '#06B6D4',
    description: 'International specialist, up to 12 months renewable (max 4 years)',
    isInternational: true,
    maxDuration: '4 years',
  },
  PSA: {
    name: 'Personnel Service Agreement',
    shortName: 'PSA',
    color: '#14B8A6',
    description: 'General service agreement',
    isInternational: false,
    maxDuration: 'Project duration',
  },
};

/**
 * Get tier color by name
 */
export function getTierColor(tierName: string): string {
  const tier = PYRAMID_TIERS.find(t => t.name === tierName);
  if (tier) return tier.color;
  
  const nonStaff = NON_STAFF_CATEGORIES.find(c => c.name.toLowerCase().includes(tierName.toLowerCase()));
  if (nonStaff) return nonStaff.color;
  
  return '#6B7280'; // gray fallback
}

/**
 * Get consolidated tier name for display
 */
export function getConsolidatedTier(tier: GradeTier): string {
  if (['Senior Support', 'Mid Support', 'Entry Support'].includes(tier)) {
    return 'Support';
  }
  return tier;
}






