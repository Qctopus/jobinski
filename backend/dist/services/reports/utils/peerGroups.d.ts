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
export declare const PEER_GROUPS: Record<string, PeerGroupDefinition>;
export declare const SECRETARIAT_ENTITIES: Record<string, number>;
export declare function getAgencyPeerGroup(agency: string): PeerGroupDefinition | null;
export declare function getPeerAgencies(agency: string): string[];
export declare function getAgencyTier(agency: string): number;
export declare function arePeerAgencies(agency1: string, agency2: string): boolean;
export declare function getAgenciesInTier(tier: 1 | 2 | 3 | 4): string[];
export declare function getPeerGroupDescription(agency: string): string;
//# sourceMappingURL=peerGroups.d.ts.map