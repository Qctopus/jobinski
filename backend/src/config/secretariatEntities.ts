/**
 * UN Secretariat Entity Classification
 * 
 * The UN Secretariat is broken down into:
 * - DEPARTMENTS: Stay listed under "UN Secretariat" (e.g., DPPA, DPO, DESA)
 * - OFFICES: Listed as separate entities (e.g., OCHA, OHCHR)
 * - OVERSEAS OFFICES: Listed as separate entities (e.g., UNOG, UNOV, UNON)
 * - REGIONAL COMMISSIONS: Listed as separate entities (e.g., ESCAP, ECLAC)
 */

export interface SecretariatEntity {
  shortName: string;
  fullName: string;
  keywords: string[];
  showAsSeparate: boolean;
}

// All Secretariat entities
const ALL_ENTITIES: SecretariatEntity[] = [
  // DEPARTMENTS - Stay under UN Secretariat
  { shortName: 'DPPA', fullName: 'Department of Political and Peacebuilding Affairs', keywords: ['DPPA', 'Political and Peacebuilding', 'Political Affairs'], showAsSeparate: false },
  { shortName: 'DPO', fullName: 'Department of Peace Operations', keywords: ['DPO', 'Peace Operations', 'DPKO', 'Peacekeeping'], showAsSeparate: false },
  { shortName: 'DOS', fullName: 'Department of Operational Support', keywords: ['DOS', 'Operational Support', 'Field Support'], showAsSeparate: false },
  { shortName: 'DMSPC', fullName: 'Department of Management Strategy, Policy and Compliance', keywords: ['DMSPC', 'Management Strategy', 'DGACM'], showAsSeparate: false },
  { shortName: 'DESA', fullName: 'Department of Economic and Social Affairs', keywords: ['DESA', 'Economic and Social Affairs'], showAsSeparate: false },
  { shortName: 'DGC', fullName: 'Department of Global Communications', keywords: ['DGC', 'Global Communications', 'DPI', 'Public Information'], showAsSeparate: false },
  { shortName: 'ODA', fullName: 'Office for Disarmament Affairs', keywords: ['ODA', 'Disarmament Affairs'], showAsSeparate: false },
  { shortName: 'DSS', fullName: 'Department of Safety and Security', keywords: ['DSS', 'Safety and Security', 'UNDSS'], showAsSeparate: false },
  { shortName: 'DGACM', fullName: 'Department for General Assembly and Conference Management', keywords: ['DGACM', 'General Assembly', 'Conference Management'], showAsSeparate: false },
  { shortName: 'OIOS', fullName: 'Office of Internal Oversight Services', keywords: ['OIOS', 'Internal Oversight'], showAsSeparate: false },
  { shortName: 'OLA', fullName: 'Office of Legal Affairs', keywords: ['OLA', 'Legal Affairs'], showAsSeparate: false },
  { shortName: 'EOSG', fullName: 'Executive Office of the Secretary-General', keywords: ['EOSG', 'Executive Office', 'Secretary-General'], showAsSeparate: false },
  { shortName: 'OICT', fullName: 'Office of Information and Communications Technology', keywords: ['OICT', 'Information and Communications Technology'], showAsSeparate: false },

  // OFFICES - Show as separate entities
  { shortName: 'OCHA', fullName: 'Office for the Coordination of Humanitarian Affairs', keywords: ['OCHA', 'Humanitarian Affairs', 'UNOCHA'], showAsSeparate: true },
  { shortName: 'OHCHR', fullName: 'Office of the UN High Commissioner for Human Rights', keywords: ['OHCHR', 'Human Rights', 'High Commissioner for Human Rights', 'UNOHCHR'], showAsSeparate: true },
  { shortName: 'UNOCT', fullName: 'Office of Counter-Terrorism', keywords: ['UNOCT', 'Counter-Terrorism', 'Counter Terrorism', 'OCT'], showAsSeparate: true },
  { shortName: 'DCO', fullName: 'Development Coordination Office', keywords: ['DCO', 'Development Coordination', 'Resident Coordinator'], showAsSeparate: true },
  { shortName: 'UNOOSA', fullName: 'Office for Outer Space Affairs', keywords: ['UNOOSA', 'Outer Space', 'Space Affairs'], showAsSeparate: true },
  { shortName: 'OSAA', fullName: 'Office of the Special Adviser on Africa', keywords: ['OSAA', 'Special Adviser on Africa'], showAsSeparate: true },
  { shortName: 'UNDRR', fullName: 'UN Office for Disaster Risk Reduction', keywords: ['UNDRR', 'Disaster Risk Reduction', 'UNISDR'], showAsSeparate: true },
  { shortName: 'UN-OHRLLS', fullName: 'Office of the High Representative for LDCs, LLDCs and SIDS', keywords: ['OHRLLS', 'LDCs', 'LLDCs', 'SIDS', 'Least Developed'], showAsSeparate: true },

  // OVERSEAS OFFICES - Show as separate entities
  { shortName: 'UNOG', fullName: 'UN Office at Geneva', keywords: ['UNOG', 'Geneva', 'Office at Geneva'], showAsSeparate: true },
  { shortName: 'UNOV', fullName: 'UN Office at Vienna', keywords: ['UNOV', 'Vienna', 'Office at Vienna'], showAsSeparate: true },
  { shortName: 'UNON', fullName: 'UN Office at Nairobi', keywords: ['UNON', 'Nairobi', 'Office at Nairobi'], showAsSeparate: true },

  // REGIONAL COMMISSIONS - Show as separate entities
  { shortName: 'ECA', fullName: 'Economic Commission for Africa', keywords: ['ECA', 'Economic Commission for Africa', 'UNECA'], showAsSeparate: true },
  { shortName: 'ECE', fullName: 'Economic Commission for Europe', keywords: ['ECE', 'Economic Commission for Europe', 'UNECE'], showAsSeparate: true },
  { shortName: 'ECLAC', fullName: 'Economic Commission for Latin America and the Caribbean', keywords: ['ECLAC', 'Latin America and the Caribbean', 'CEPAL'], showAsSeparate: true },
  { shortName: 'ESCAP', fullName: 'Economic and Social Commission for Asia and the Pacific', keywords: ['ESCAP', 'Asia and the Pacific', 'Asia Pacific'], showAsSeparate: true },
  { shortName: 'ESCWA', fullName: 'Economic and Social Commission for Western Asia', keywords: ['ESCWA', 'Western Asia'], showAsSeparate: true },

  // TRIBUNALS - Show as separate entities
  { shortName: 'IRMCT', fullName: 'International Residual Mechanism for Criminal Tribunals', keywords: ['IRMCT', 'Residual Mechanism', 'Criminal Tribunals'], showAsSeparate: true },
  { shortName: 'ICJ', fullName: 'International Court of Justice', keywords: ['ICJ', 'International Court of Justice', 'World Court'], showAsSeparate: true },
];

/**
 * Get the effective agency name for a job
 * If it's a Secretariat job with a department that maps to a separate entity,
 * return that entity's short name instead of "UN Secretariat"
 */
export function getEffectiveAgency(shortAgency: string, department: string): string {
  // Only process UN Secretariat jobs
  const normalizedAgency = (shortAgency || '').toLowerCase().trim();
  const isSecretariat = normalizedAgency.includes('secretariat') || 
                        normalizedAgency === 'un' ||
                        normalizedAgency === 'united nations';
  
  if (!isSecretariat) {
    return shortAgency;
  }
  
  if (!department) {
    return 'UN Secretariat';
  }
  
  const normalizedDept = department.toLowerCase().trim();
  
  // Check all entities for keyword matches
  for (const entity of ALL_ENTITIES) {
    if (entity.showAsSeparate) {
      for (const keyword of entity.keywords) {
        if (normalizedDept.includes(keyword.toLowerCase())) {
          return entity.shortName;
        }
      }
    }
  }
  
  // Stay under UN Secretariat
  return 'UN Secretariat';
}

/**
 * Check if an agency name is a separate Secretariat entity
 */
export function isSeparateSecretariatEntity(agencyName: string): boolean {
  return ALL_ENTITIES.some(e => 
    e.showAsSeparate && e.shortName.toLowerCase() === agencyName.toLowerCase()
  );
}

