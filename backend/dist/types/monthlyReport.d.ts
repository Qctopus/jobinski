export interface MonthlyReportPeriod {
    month: string;
    startDate: string;
    endDate: string;
    generatedAt: string;
}
export interface MonthlyReportAgency {
    shortName: string;
    longName: string;
    tier: number;
    peerGroup: string;
    logoUrl?: string;
}
export interface ExecutiveSummary {
    totalPostings: number;
    momChange: number;
    marketShareRank: number;
    totalAgencies: number;
    avgApplicationWindow: number;
    marketAvgWindow: number;
    hiringVelocity: number;
    competitiveScore: number;
    keyFindings: string[];
    comparisonTable: Array<{
        metric: string;
        yourAgency: string | number;
        marketAvg: string | number;
        topPerformer: {
            value: string | number;
            agency: string;
        };
        yourRank: number;
    }>;
    radarData: {
        dimensions: string[];
        yourScores: number[];
        marketAvgScores: number[];
    };
}
export interface CompetitiveData {
    marketShare: number;
    marketShareTrend: Array<{
        period: string;
        share: number;
    }>;
    topCompetitors: Array<{
        agency: string;
        volume: number;
        growth: number;
        categoryOverlap: number;
        threatLevel: 'high' | 'medium' | 'low';
    }>;
    talentWarZones: Array<{
        category: string;
        yourShare: number;
        leaderAgency: string;
        leaderShare: number;
        competitorCount: number;
        intensity: 'high' | 'medium' | 'low';
    }>;
    strategicSignals: Array<{
        type: 'warning' | 'opportunity' | 'action';
        title: string;
        description: string;
    }>;
    positioningMatrix: Array<{
        agency: string;
        volume: number;
        growthRate: number;
        categoryDiversity: number;
        tier: number;
        isYou: boolean;
    }>;
}
export interface TemporalData {
    postedVsOpen: Array<{
        period: string;
        posted: number;
        open: number;
        closed: number;
        netChange: number;
    }>;
    seasonalPattern: {
        highMonths: string[];
        lowMonths: string[];
        currentVsTypical: number;
        heatmapData: Array<{
            month: string;
            year: number;
            value: number;
        }>;
    };
    applicationWindows: {
        urgent: {
            count: number;
            percentage: number;
        };
        normal: {
            count: number;
            percentage: number;
        };
        extended: {
            count: number;
            percentage: number;
        };
        long: {
            count: number;
            percentage: number;
        };
        marketComparison: {
            yourDistribution: number[];
            marketDistribution: number[];
        };
    };
    hiringVelocityTrend: Array<{
        period: string;
        velocity: number;
        momentum: 'accelerating' | 'steady' | 'decelerating';
    }>;
}
export interface WorkforceData {
    seniorityDistribution: Array<{
        level: string;
        count: number;
        percentage: number;
        marketAvg: number;
    }>;
    seniorityTrend: Array<{
        period: string;
        executive: number;
        senior: number;
        mid: number;
        entry: number;
        intern: number;
    }>;
    contractTypes: {
        staff: {
            count: number;
            percentage: number;
        };
        consultant: {
            count: number;
            percentage: number;
        };
        intern: {
            count: number;
            percentage: number;
        };
        trend: Array<{
            period: string;
            staff: number;
            consultant: number;
            intern: number;
        }>;
    };
    geographic: {
        hq: {
            count: number;
            percentage: number;
        };
        regional: {
            count: number;
            percentage: number;
        };
        field: {
            count: number;
            percentage: number;
        };
        remote: {
            count: number;
            percentage: number;
        };
    };
    topLocations: Array<{
        location: string;
        count: number;
        change: number;
        trend: 'up' | 'down' | 'stable';
    }>;
    locationMapData: Array<{
        location: string;
        latitude: number;
        longitude: number;
        count: number;
        growthRate: number;
    }>;
}
export interface CategoryData {
    distribution: Array<{
        category: string;
        count: number;
        percentage: number;
        growth: number;
        marketShare: number;
        marketLeader: string;
        yourRank: number;
    }>;
    bcgMatrix: {
        stars: Array<{
            category: string;
            growth: number;
            share: number;
        }>;
        questionMarks: Array<{
            category: string;
            growth: number;
            share: number;
        }>;
        cashCows: Array<{
            category: string;
            growth: number;
            share: number;
        }>;
        dogs: Array<{
            category: string;
            growth: number;
            share: number;
        }>;
    };
    emerging: Array<{
        category: string;
        growth: number;
        agencies: number;
    }>;
    declining: Array<{
        category: string;
        decline: number;
    }>;
    timeline: Array<{
        period: string;
        [category: string]: number | string;
    }>;
    dominanceTable: Array<{
        category: string;
        yourShare: number;
        marketLeader: string;
        leaderShare: number;
        yourRank: number;
        trend: 'up' | 'down' | 'stable';
    }>;
}
export interface SkillsData {
    topSkills: Array<{
        skill: string;
        demand: number;
        growth: number;
        yourVsMarket: number;
        category: 'technical' | 'soft' | 'language' | 'domain';
    }>;
    emerging: Array<{
        skill: string;
        firstSeen: string;
        growthRate: number;
        earlyAdopters: string[];
        relatedSkills: string[];
    }>;
    languages: {
        required: Array<{
            language: string;
            count: number;
            percentage: number;
        }>;
        desired: Array<{
            language: string;
            count: number;
            percentage: number;
        }>;
        multilingualRate: number;
        marketComparison: {
            yourRate: number;
            marketRate: number;
        };
    };
    skillBubbleData: Array<{
        skill: string;
        demand: number;
        growth: number;
        agenciesCount: number;
        category: string;
    }>;
}
export interface ReportRecommendation {
    priority: 'high' | 'medium' | 'low';
    area: string;
    title: string;
    rationale: string;
    impact: string;
    timeline: 'immediate' | 'quarter' | 'year';
    dataPoints?: string[];
}
export interface ReportBenchmarks {
    marketAverages: {
        postingsPerAgency: number;
        avgApplicationWindow: number;
        seniorRatio: number;
        consultantRatio: number;
        categoryDiversity: number;
    };
    topPerformer: {
        agency: string;
        metrics: {
            volume: number;
            marketShare: number;
            applicationWindow: number;
            categoryCount: number;
        };
    };
    peerGroupAverages: {
        postings: number;
        growth: number;
        applicationWindow: number;
    };
}
export interface MonthlyReportData {
    reportPeriod: MonthlyReportPeriod;
    agency: MonthlyReportAgency;
    executiveSummary: ExecutiveSummary;
    competitive: CompetitiveData;
    temporal: TemporalData;
    workforce: WorkforceData;
    categories: CategoryData;
    skills: SkillsData;
    recommendations: ReportRecommendation[];
    benchmarks: ReportBenchmarks;
    dataFreshness: {
        lastSync: string;
        jobCount: number;
        agencyCount: number;
    };
}
export declare const UN_DESIGN_TOKENS: {
    colors: {
        primary: string;
        secondary: string;
        accent: {
            orange: string;
            green: string;
            red: string;
        };
        neutral: {
            dark: string;
            medium: string;
            light: string;
            white: string;
        };
    };
    fonts: {
        heading: string;
        body: string;
        data: string;
    };
    spacing: {
        section: string;
        card: string;
        element: string;
    };
    shadows: {
        card: string;
        hover: string;
    };
    borderRadius: string;
};
export declare const AGENCY_BRAND_COLORS: Record<string, {
    primary: string;
    secondary: string;
}>;
//# sourceMappingURL=monthlyReport.d.ts.map