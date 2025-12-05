/**
 * UN Secretariat Entity Classification
 * 
 * The UN Secretariat is broken down into:
 * - DEPARTMENTS: Stay listed under "UN Secretariat" (e.g., DPPA, DPO, DESA)
 * - OFFICES: Listed as separate entities (e.g., OCHA, OHCHR)
 * - OVERSEAS OFFICES: Listed as separate entities (e.g., UNOG, UNOV, UNON)
 * - REGIONAL COMMISSIONS: Listed as separate entities (e.g., ESCAP, ECLAC)
 * 
 * This classification is based on the official UN Secretariat organization chart.
 */

export type SecretariatEntityType = 'department' | 'office' | 'overseas_office' | 'regional_commission' | 'tribunal' | 'other';

export interface SecretariatEntity {
  shortName: string;
  fullName: string;
  type: SecretariatEntityType;
  // Keywords to match in the department field
  keywords: string[];
  // Should be shown as separate agency in dropdown
  showAsSeparate: boolean;
}

/**
 * DEPARTMENTS - Stay under UN Secretariat
 * These are the main departments reporting to the Secretary-General
 */
const DEPARTMENTS: SecretariatEntity[] = [
  {
    shortName: 'DPPA',
    fullName: 'Department of Political and Peacebuilding Affairs',
    type: 'department',
    keywords: ['DPPA', 'Political and Peacebuilding', 'Political Affairs', 'Peacebuilding'],
    showAsSeparate: false
  },
  {
    shortName: 'DPO',
    fullName: 'Department of Peace Operations',
    type: 'department',
    keywords: ['DPO', 'Peace Operations', 'DPKO', 'Peacekeeping'],
    showAsSeparate: false
  },
  {
    shortName: 'DOS',
    fullName: 'Department of Operational Support',
    type: 'department',
    keywords: ['DOS', 'Operational Support', 'Field Support'],
    showAsSeparate: false
  },
  {
    shortName: 'DMSPC',
    fullName: 'Department of Management Strategy, Policy and Compliance',
    type: 'department',
    keywords: ['DMSPC', 'Management Strategy', 'Policy and Compliance', 'DM', 'DGACM'],
    showAsSeparate: false
  },
  {
    shortName: 'DESA',
    fullName: 'Department of Economic and Social Affairs',
    type: 'department',
    keywords: ['DESA', 'Economic and Social Affairs'],
    showAsSeparate: false
  },
  {
    shortName: 'DGC',
    fullName: 'Department of Global Communications',
    type: 'department',
    keywords: ['DGC', 'Global Communications', 'DPI', 'Public Information'],
    showAsSeparate: false
  },
  {
    shortName: 'ODA',
    fullName: 'Office for Disarmament Affairs',
    type: 'department',
    keywords: ['ODA', 'Disarmament Affairs', 'Disarmament'],
    showAsSeparate: false
  },
  {
    shortName: 'DSS',
    fullName: 'Department of Safety and Security',
    type: 'department',
    keywords: ['DSS', 'Safety and Security', 'UNDSS'],
    showAsSeparate: false
  },
  {
    shortName: 'DGACM',
    fullName: 'Department for General Assembly and Conference Management',
    type: 'department',
    keywords: ['DGACM', 'General Assembly', 'Conference Management'],
    showAsSeparate: false
  },
  {
    shortName: 'OIOS',
    fullName: 'Office of Internal Oversight Services',
    type: 'department',
    keywords: ['OIOS', 'Internal Oversight', 'Oversight Services'],
    showAsSeparate: false
  },
  {
    shortName: 'OLA',
    fullName: 'Office of Legal Affairs',
    type: 'department',
    keywords: ['OLA', 'Legal Affairs', 'Legal Office'],
    showAsSeparate: false
  },
  {
    shortName: 'EOSG',
    fullName: 'Executive Office of the Secretary-General',
    type: 'department',
    keywords: ['EOSG', 'Executive Office', 'Secretary-General'],
    showAsSeparate: false
  },
  {
    shortName: 'OICT',
    fullName: 'Office of Information and Communications Technology',
    type: 'department',
    keywords: ['OICT', 'Information and Communications Technology', 'ICT'],
    showAsSeparate: false
  },
];

/**
 * OFFICES - Show as separate entities
 * These are offices with distinct mandates that should be tracked separately
 */
const OFFICES: SecretariatEntity[] = [
  {
    shortName: 'OCHA',
    fullName: 'Office for the Coordination of Humanitarian Affairs',
    type: 'office',
    keywords: ['OCHA', 'Humanitarian Affairs', 'Coordination of Humanitarian'],
    showAsSeparate: true
  },
  {
    shortName: 'OHCHR',
    fullName: 'Office of the UN High Commissioner for Human Rights',
    type: 'office',
    keywords: ['OHCHR', 'Human Rights', 'High Commissioner for Human Rights', 'UNOHCHR'],
    showAsSeparate: true
  },
  {
    shortName: 'UNOCT',
    fullName: 'Office of Counter-Terrorism',
    type: 'office',
    keywords: ['UNOCT', 'Counter-Terrorism', 'Counter Terrorism', 'OCT'],
    showAsSeparate: true
  },
  {
    shortName: 'DCO',
    fullName: 'Development Coordination Office',
    type: 'office',
    keywords: ['DCO', 'Development Coordination', 'Resident Coordinator'],
    showAsSeparate: true
  },
  {
    shortName: 'UNOOSA',
    fullName: 'Office for Outer Space Affairs',
    type: 'office',
    keywords: ['UNOOSA', 'Outer Space', 'Space Affairs'],
    showAsSeparate: true
  },
  {
    shortName: 'OSAA',
    fullName: 'Office of the Special Adviser on Africa',
    type: 'office',
    keywords: ['OSAA', 'Special Adviser on Africa', 'Adviser on Africa'],
    showAsSeparate: true
  },
  {
    shortName: 'UNDRR',
    fullName: 'UN Office for Disaster Risk Reduction',
    type: 'office',
    keywords: ['UNDRR', 'Disaster Risk Reduction', 'UNISDR', 'Disaster Risk'],
    showAsSeparate: true
  },
  {
    shortName: 'UN-OHRLLS',
    fullName: 'Office of the High Representative for LDCs, LLDCs and SIDS',
    type: 'office',
    keywords: ['OHRLLS', 'LDCs', 'LLDCs', 'SIDS', 'Least Developed Countries', 'Landlocked'],
    showAsSeparate: true
  },
];

/**
 * OVERSEAS OFFICES - Show as separate entities
 * UN duty stations away from New York HQ
 */
const OVERSEAS_OFFICES: SecretariatEntity[] = [
  {
    shortName: 'UNOG',
    fullName: 'UN Office at Geneva',
    type: 'overseas_office',
    keywords: ['UNOG', 'Geneva', 'Office at Geneva'],
    showAsSeparate: true
  },
  {
    shortName: 'UNOV',
    fullName: 'UN Office at Vienna',
    type: 'overseas_office',
    keywords: ['UNOV', 'Vienna', 'Office at Vienna'],
    showAsSeparate: true
  },
  {
    shortName: 'UNON',
    fullName: 'UN Office at Nairobi',
    type: 'overseas_office',
    keywords: ['UNON', 'Nairobi', 'Office at Nairobi'],
    showAsSeparate: true
  },
];

/**
 * REGIONAL COMMISSIONS - Show as separate entities
 */
const REGIONAL_COMMISSIONS: SecretariatEntity[] = [
  {
    shortName: 'ECA',
    fullName: 'Economic Commission for Africa',
    type: 'regional_commission',
    keywords: ['ECA', 'Economic Commission for Africa', 'UNECA'],
    showAsSeparate: true
  },
  {
    shortName: 'ECE',
    fullName: 'Economic Commission for Europe',
    type: 'regional_commission',
    keywords: ['ECE', 'Economic Commission for Europe', 'UNECE'],
    showAsSeparate: true
  },
  {
    shortName: 'ECLAC',
    fullName: 'Economic Commission for Latin America and the Caribbean',
    type: 'regional_commission',
    keywords: ['ECLAC', 'Latin America and the Caribbean', 'CEPAL'],
    showAsSeparate: true
  },
  {
    shortName: 'ESCAP',
    fullName: 'Economic and Social Commission for Asia and the Pacific',
    type: 'regional_commission',
    keywords: ['ESCAP', 'Asia and the Pacific', 'Asia Pacific'],
    showAsSeparate: true
  },
  {
    shortName: 'ESCWA',
    fullName: 'Economic and Social Commission for Western Asia',
    type: 'regional_commission',
    keywords: ['ESCWA', 'Western Asia'],
    showAsSeparate: true
  },
];

/**
 * TRIBUNALS - Show as separate entities
 */
const TRIBUNALS: SecretariatEntity[] = [
  {
    shortName: 'IRMCT',
    fullName: 'International Residual Mechanism for Criminal Tribunals',
    type: 'tribunal',
    keywords: ['IRMCT', 'Residual Mechanism', 'Criminal Tribunals', 'MICT'],
    showAsSeparate: true
  },
  {
    shortName: 'ICJ',
    fullName: 'International Court of Justice',
    type: 'tribunal',
    keywords: ['ICJ', 'International Court of Justice', 'World Court'],
    showAsSeparate: true
  },
];

// Combine all entities
export const ALL_SECRETARIAT_ENTITIES: SecretariatEntity[] = [
  ...DEPARTMENTS,
  ...OFFICES,
  ...OVERSEAS_OFFICES,
  ...REGIONAL_COMMISSIONS,
  ...TRIBUNALS,
];

// Entities that should appear as separate agencies
export const SEPARATE_ENTITIES = ALL_SECRETARIAT_ENTITIES.filter(e => e.showAsSeparate);

// Department entities that stay under Secretariat
export const DEPARTMENT_ENTITIES = ALL_SECRETARIAT_ENTITIES.filter(e => !e.showAsSeparate);

/**
 * Classify a job's department into a Secretariat entity
 * @param department - The department field from the job
 * @param shortAgency - The short_agency field (for verification)
 * @returns The matched entity or null
 */
export function classifySecretariatDepartment(department: string, shortAgency?: string): SecretariatEntity | null {
  if (!department) return null;
  
  const normalizedDept = department.toLowerCase().trim();
  
  // Check all entities for keyword matches
  for (const entity of ALL_SECRETARIAT_ENTITIES) {
    for (const keyword of entity.keywords) {
      if (normalizedDept.includes(keyword.toLowerCase())) {
        return entity;
      }
    }
  }
  
  return null;
}

/**
 * Get the effective agency name for a job
 * If it's a Secretariat job in a separate entity (office/regional commission),
 * return that entity's short name instead of "UN Secretariat"
 * 
 * @param shortAgency - Original short_agency
 * @param department - Department field
 * @returns The effective agency name for analytics
 */
export function getEffectiveAgency(shortAgency: string, department: string): string {
  if (!shortAgency) return shortAgency;
  
  const normalizedAgency = shortAgency.toLowerCase().trim();
  
  // Check if this is a UN Secretariat job
  const isSecretariat = normalizedAgency.includes('secretariat') || 
                        normalizedAgency === 'un' ||
                        normalizedAgency.startsWith('united nations') ||
                        normalizedAgency === 'un secretariat';
  
  if (!isSecretariat) {
    return shortAgency;
  }
  
  // Check if this department maps to a separate entity
  if (department) {
    const entity = classifySecretariatDepartment(department, shortAgency);
    
    if (entity && entity.showAsSeparate) {
      return entity.shortName;
    }
  }
  
  // Stay under UN Secretariat
  return 'UN Secretariat';
}

/**
 * Get entity info for display purposes
 */
export function getSecretariatEntityInfo(shortName: string): SecretariatEntity | undefined {
  return ALL_SECRETARIAT_ENTITIES.find(e => e.shortName === shortName);
}

/**
 * Get display name for an entity
 */
export function getEntityDisplayName(shortName: string): string {
  const entity = getSecretariatEntityInfo(shortName);
  return entity?.fullName || shortName;
}

/**
 * Check if an agency name is a separate Secretariat entity
 */
export function isSeparateSecretariatEntity(agencyName: string): boolean {
  return SEPARATE_ENTITIES.some(e => 
    e.shortName.toLowerCase() === agencyName.toLowerCase()
  );
}

