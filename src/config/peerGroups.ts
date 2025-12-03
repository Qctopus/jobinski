/**
 * Peer Group Configuration for UN Agency Comparisons
 * 
 * Groups are based on SIZE and OPERATIONAL SCOPE, not mandate similarity.
 * This enables fair "apples-to-apples" comparisons between agencies.
 */

export interface PeerGroupDefinition {
  tier: 1 | 2 | 3 | 4;
  name: string;
  agencies: string[];
  characteristics: {
    typicalAnnualHiring: string;
    operationalScope: 'global_operational' | 'technical_normative' | 'specialized' | 'focused';
    fieldPresence: 'high' | 'medium' | 'low';
    description: string;
  };
}

export const PEER_GROUPS: Record<string, PeerGroupDefinition> = {
  tier1: {
    tier: 1,
    name: 'Large Operational Agencies',
    agencies: ['UNDP', 'UNICEF', 'WFP', 'UNHCR'],
    characteristics: {
      typicalAnnualHiring: '1000+',
      operationalScope: 'global_operational',
      fieldPresence: 'high',
      description: 'Large agencies with global operational footprints and significant field presence'
    }
  },
  tier2: {
    tier: 2,
    name: 'Mid-Size Specialized Agencies',
    agencies: ['WHO', 'FAO', 'UNESCO', 'UNEP', 'UN-Habitat', 'IOM'],
    characteristics: {
      typicalAnnualHiring: '200-1000',
      operationalScope: 'technical_normative',
      fieldPresence: 'medium',
      description: 'Technical/normative agencies with mix of HQ and field operations'
    }
  },
  tier3: {
    tier: 3,
    name: 'Smaller Specialized Entities',
    agencies: ['UNFPA', 'ILO', 'IFAD', 'UNIDO', 'UNODC', 'UN Women', 'UNRWA', 'UNCTAD'],
    characteristics: {
      typicalAnnualHiring: '50-200',
      operationalScope: 'specialized',
      fieldPresence: 'medium',
      description: 'Specialized agencies with focused mandates, often regionally concentrated'
    }
  },
  tier4: {
    tier: 4,
    name: 'Funds, Programmes, and Offices',
    agencies: ['UNCDF', 'UNV', 'UN Volunteers', 'UNICRI', 'UPU', 'WIPO', 'ICAO', 'IMO', 'ITU', 'WMO'],
    characteristics: {
      typicalAnnualHiring: '<50',
      operationalScope: 'focused',
      fieldPresence: 'low',
      description: 'Smaller entities with specialized mandates, often co-located with larger agencies'
    }
  }
};

// Add UN Secretariat entities to appropriate tiers
export const SECRETARIAT_ENTITIES: Record<string, number> = {
  'UN Secretariat': 1,  // Large
  'OCHA': 2,
  'DPKO': 2,
  'DPO': 2,
  'DESA': 3,
  'OHCHR': 3,
  'ESCAP': 3,
  'ESCWA': 3,
  'ECA': 3,
  'ECE': 3,
  'ECLAC': 3,
};

/**
 * Get the peer group for a given agency
 */
export function getAgencyPeerGroup(agency: string): PeerGroupDefinition | null {
  // Normalize agency name
  const normalizedAgency = agency.trim();
  
  // Check main peer groups
  for (const group of Object.values(PEER_GROUPS)) {
    if (group.agencies.some(a => 
      a.toLowerCase() === normalizedAgency.toLowerCase() ||
      normalizedAgency.toLowerCase().includes(a.toLowerCase()) ||
      a.toLowerCase().includes(normalizedAgency.toLowerCase())
    )) {
      return group;
    }
  }
  
  // Check secretariat entities
  const secretariatTier = SECRETARIAT_ENTITIES[normalizedAgency];
  if (secretariatTier) {
    return PEER_GROUPS[`tier${secretariatTier}`];
  }
  
  // Default to tier 4 for unknown agencies
  return PEER_GROUPS.tier4;
}

/**
 * Get peer agencies for comparison (same tier, excluding self)
 */
export function getPeerAgencies(agency: string): string[] {
  const group = getAgencyPeerGroup(agency);
  if (!group) return [];
  return group.agencies.filter(a => a.toLowerCase() !== agency.toLowerCase());
}

/**
 * Get the tier number for an agency
 */
export function getAgencyTier(agency: string): number {
  const group = getAgencyPeerGroup(agency);
  return group?.tier ?? 4;
}

/**
 * Check if two agencies are peers (same tier)
 */
export function arePeerAgencies(agency1: string, agency2: string): boolean {
  return getAgencyTier(agency1) === getAgencyTier(agency2);
}

/**
 * Get all agencies in a specific tier
 */
export function getAgenciesInTier(tier: 1 | 2 | 3 | 4): string[] {
  const group = PEER_GROUPS[`tier${tier}`];
  return group?.agencies ?? [];
}

/**
 * Get peer group description for display
 */
export function getPeerGroupDescription(agency: string): string {
  const group = getAgencyPeerGroup(agency);
  if (!group) return 'Unknown classification';
  return `${group.name} (Tier ${group.tier})`;
}










