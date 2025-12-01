"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SECRETARIAT_ENTITIES = exports.PEER_GROUPS = void 0;
exports.getAgencyPeerGroup = getAgencyPeerGroup;
exports.getPeerAgencies = getPeerAgencies;
exports.getAgencyTier = getAgencyTier;
exports.arePeerAgencies = arePeerAgencies;
exports.getAgenciesInTier = getAgenciesInTier;
exports.getPeerGroupDescription = getPeerGroupDescription;
exports.PEER_GROUPS = {
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
exports.SECRETARIAT_ENTITIES = {
    'UN Secretariat': 1,
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
function getAgencyPeerGroup(agency) {
    const normalizedAgency = agency.trim();
    for (const group of Object.values(exports.PEER_GROUPS)) {
        if (group.agencies.some(a => a.toLowerCase() === normalizedAgency.toLowerCase() ||
            normalizedAgency.toLowerCase().includes(a.toLowerCase()) ||
            a.toLowerCase().includes(normalizedAgency.toLowerCase()))) {
            return group;
        }
    }
    const secretariatTier = exports.SECRETARIAT_ENTITIES[normalizedAgency];
    if (secretariatTier) {
        const group = exports.PEER_GROUPS[`tier${secretariatTier}`];
        return group ?? exports.PEER_GROUPS.tier4;
    }
    return exports.PEER_GROUPS.tier4;
}
function getPeerAgencies(agency) {
    const group = getAgencyPeerGroup(agency);
    if (!group)
        return [];
    return group.agencies.filter(a => a.toLowerCase() !== agency.toLowerCase());
}
function getAgencyTier(agency) {
    const group = getAgencyPeerGroup(agency);
    return group?.tier ?? 4;
}
function arePeerAgencies(agency1, agency2) {
    return getAgencyTier(agency1) === getAgencyTier(agency2);
}
function getAgenciesInTier(tier) {
    const group = exports.PEER_GROUPS[`tier${tier}`];
    return group?.agencies ?? [];
}
function getPeerGroupDescription(agency) {
    const group = getAgencyPeerGroup(agency);
    if (!group)
        return 'Unknown classification';
    return `${group.name} (Tier ${group.tier})`;
}
//# sourceMappingURL=peerGroups.js.map