// Agency logo mapping utility
// Maps agency names (both short and long) to their corresponding logo files

export interface AgencyLogoMapping {
  [key: string]: string;
}

// Map agency names to logo file names
const AGENCY_LOGO_MAP: AgencyLogoMapping = {
  // Common short names
  'UNDP': 'UNDP.png',
  'UNICEF': 'UNICEF.png',
  'UNHCR': 'UNHCR.png',
  'WFP': 'WFP.png',
  'WHO': 'WHO.png',
  'UNESCO': 'UNESCO.png',
  'UNFPA': 'UNFPA.png',
  'UNEP': 'UNEP.png',
  'FAO': 'FAO.png',
  'ILO': 'ILO.png',
  'IFAD': 'IFAD.png',
  'ICAO': 'ICAO.png',
  'UPU': 'UPU.png',
  'ITC': 'ITC.png',
  'UNCDF': 'UNCDF.png',
  'UNCTAD': 'UNCTAD.png',
  'UNOCHA': 'UNOCHA.png',
  'UNODC': 'UNODC.png',
  'UNRWA': 'UNRWA.png',
  'UN Women': 'UNWomen.png',
  'UNWomen': 'UNWomen.png',
  'UN Volunteers': 'UNVolunteers.png',
  'UNVolunteers': 'UNVolunteers.png',
  'UN-Habitat': 'UN-Habitat.png',
  'UNOHCHR': 'UNOHCHR.png',
  'UNICRI': 'UNICRI.png',
  'UNJSPF': 'UNJSPF.png',
  'UNAMA': 'UNAMA.png',
  'UNGC': 'UNGC.png',
  
  // UN Secretariat and offices
  'UN Secretariat': 'UN.png',
  'UNOG': 'UNOG.png',
  'UNON': 'UNON.png',
  'UNOV': 'UNOV.png',
  
  // Departments and offices (commonly using UN logo)
  'DESA': 'DESA.png',
  'DGC': 'DGC.png',
  'DOS': 'DOS.png',
  'DPO': 'DPO.png',
  'DPPA': 'DPPA.png',
  'OICT': 'OICT.png',
  'OIOS': 'OIOS.png',
  
  // Regional commissions
  'ECA': 'ECA.png',
  'ECE': 'ECE.png',
  'ECLAC': 'ECLAC.png',
  'ESCAP': 'ESCAP.png',
  'ESCWA': 'ESCWA.png',
  'ECOSOC': 'ECOSOC.png',
  
  // Special cases
  'International Court of Justice': 'International Court of Justice.png',
  
  // Long names mapping to same logos
  'United Nations Development Programme': 'UNDP.png',
  'United Nations Children\'s Fund': 'UNICEF.png',
  'United Nations High Commissioner for Refugees': 'UNHCR.png',
  'World Food Programme': 'WFP.png',
  'World Health Organization': 'WHO.png',
  'United Nations Educational, Scientific and Cultural Organization': 'UNESCO.png',
  'United Nations Population Fund': 'UNFPA.png',
  'United Nations Environment Programme': 'UNEP.png',
  'Food and Agriculture Organization': 'FAO.png',
  'International Labour Organization': 'ILO.png',
  'International Fund for Agricultural Development': 'IFAD.png',
  'International Civil Aviation Organization': 'ICAO.png',
  'Universal Postal Union': 'UPU.png',
  'International Trade Centre': 'ITC.png',
  'United Nations Capital Development Fund': 'UNCDF.png',
  'United Nations Conference on Trade and Development': 'UNCTAD.png',
  'United Nations Office for the Coordination of Humanitarian Affairs': 'UNOCHA.png',
  'United Nations Office on Drugs and Crime': 'UNODC.png',
  'United Nations Relief and Works Agency': 'UNRWA.png',
  'United Nations Entity for Gender Equality and the Empowerment of Women': 'UNWomen.png',
  'United Nations Volunteers': 'UNVolunteers.png',
  'United Nations Human Settlements Programme': 'UN-Habitat.png',
  'United Nations Office of the High Commissioner for Human Rights': 'UNOHCHR.png',
  'United Nations Interregional Crime and Justice Research Institute': 'UNICRI.png',
  'United Nations Joint Staff Pension Fund': 'UNJSPF.png',
  'United Nations Assistance Mission in Afghanistan': 'UNAMA.png',
  'United Nations Global Compact': 'UNGC.png',
  'United Nations Office at Geneva': 'UNOG.png',
  'United Nations Office at Nairobi': 'UNON.png',
  'United Nations Office at Vienna': 'UNOV.png',
};

/**
 * Gets the logo path for a given agency name
 * @param agencyName - The agency name (short or long)
 * @returns The relative path to the logo file, or null if not found
 */
export function getAgencyLogo(agencyName: string): string | null {
  if (!agencyName) return null;
  
  // Direct mapping
  const logoFile = AGENCY_LOGO_MAP[agencyName];
  if (logoFile) {
    return `/logo/logo/${logoFile}`;
  }
  
  // Try to find partial matches for complex department names
  const keys = Object.keys(AGENCY_LOGO_MAP);
  for (const key of keys) {
    if (agencyName.includes(key) || key.includes(agencyName)) {
      return `/logo/logo/${AGENCY_LOGO_MAP[key]}`;
    }
  }
  
  // Default to UN logo for any Secretariat departments not explicitly mapped
  if (agencyName.toLowerCase().includes('secretariat') || 
      agencyName.toLowerCase().includes('united nations')) {
    return '/logo/logo/UN.png';
  }
  
  return null;
}

/**
 * Gets all available agencies with their logos
 * @param agencies - Array of agency names
 * @returns Array of agencies with their logo paths
 */
export function getAgenciesWithLogos(agencies: string[]): Array<{name: string, logo: string | null}> {
  return agencies.map(agency => ({
    name: agency,
    logo: getAgencyLogo(agency)
  }));
}

