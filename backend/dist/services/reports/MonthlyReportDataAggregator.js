"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonthlyReportDataAggregator = void 0;
const sqlite_1 = __importDefault(require("../../config/sqlite"));
const peerGroups_1 = require("./utils/peerGroups");
class MonthlyReportDataAggregator {
    async transformToMonthlyReport(reportData, startDate, endDate) {
        const { agencyMetrics, benchmarks, competitiveIntelligence, recommendations } = reportData;
        const agency = agencyMetrics.agencyInfo.shortName;
        const allJobs = this.getAllJobs(startDate, endDate);
        const agencyJobs = this.getAgencyJobs(agency, startDate, endDate);
        const monthlyReportData = {
            reportPeriod: this.buildReportPeriod(startDate, endDate),
            agency: this.buildAgencyInfo(agencyMetrics),
            executiveSummary: this.buildExecutiveSummary(agencyMetrics, benchmarks, competitiveIntelligence, allJobs),
            competitive: this.buildCompetitiveData(agencyMetrics, competitiveIntelligence, allJobs, agency),
            temporal: this.buildTemporalData(agencyMetrics, agencyJobs, allJobs),
            workforce: this.buildWorkforceData(agencyMetrics, benchmarks, agencyJobs),
            categories: this.buildCategoryData(agencyMetrics, allJobs, agency),
            skills: this.buildSkillsData(agencyJobs, allJobs),
            recommendations: this.transformRecommendations(recommendations),
            benchmarks: this.buildBenchmarks(benchmarks, allJobs),
            dataFreshness: {
                lastSync: new Date().toISOString(),
                jobCount: allJobs.length,
                agencyCount: this.getUniqueAgencyCount(allJobs)
            }
        };
        return monthlyReportData;
    }
    buildReportPeriod(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        return {
            month: `${months[start.getMonth()]} ${start.getFullYear()}`,
            startDate,
            endDate,
            generatedAt: new Date().toISOString()
        };
    }
    buildAgencyInfo(metrics) {
        return {
            shortName: metrics.agencyInfo.shortName,
            longName: metrics.agencyInfo.longName,
            tier: metrics.agencyInfo.tier,
            peerGroup: metrics.agencyInfo.peerGroup,
            logoUrl: metrics.agencyInfo.logoPath || undefined
        };
    }
    buildExecutiveSummary(metrics, benchmarks, competitive, allJobs) {
        const competitiveScore = this.calculateCompetitiveScore(metrics, benchmarks, competitive);
        const comparisonTable = this.buildComparisonTable(metrics, benchmarks, competitive, allJobs);
        const radarData = this.buildRadarData(metrics, benchmarks, competitive);
        const keyFindings = this.generateKeyFindings(metrics, benchmarks, competitive);
        return {
            totalPostings: metrics.volumeMetrics.totalPostings,
            momChange: metrics.volumeMetrics.monthOverMonthChange,
            marketShareRank: competitive.marketPosition.marketRank,
            totalAgencies: competitive.marketPosition.totalAgenciesInMarket,
            avgApplicationWindow: metrics.applicationMetrics.avgApplicationWindow,
            marketAvgWindow: benchmarks.marketAverages.avgApplicationWindow,
            hiringVelocity: metrics.volumeMetrics.totalPostings / 4,
            competitiveScore,
            keyFindings,
            comparisonTable,
            radarData
        };
    }
    buildCompetitiveData(metrics, competitive, allJobs, agency) {
        const marketShareTrend = this.calculateMarketShareTrend(agency, allJobs);
        const positioningMatrix = this.buildPositioningMatrix(allJobs, agency);
        const talentWarZones = competitive.categoryCompetition.map(cat => ({
            category: cat.category,
            yourShare: cat.agencyShare,
            leaderAgency: this.findCategoryLeader(cat.category, allJobs),
            leaderShare: this.findCategoryLeaderShare(cat.category, allJobs),
            competitorCount: cat.competitorsCount,
            intensity: cat.competitorsCount > 15 ? 'high' :
                cat.competitorsCount > 8 ? 'medium' : 'low'
        }));
        const strategicSignals = this.generateStrategicSignals(metrics, competitive);
        const topCompetitors = competitive.competitorAnalysis.map(c => ({
            agency: c.agency,
            volume: c.volume,
            growth: this.calculateAgencyGrowth(c.agency, allJobs),
            categoryOverlap: c.categoryOverlap,
            threatLevel: c.competitionLevel
        }));
        return {
            marketShare: competitive.marketPosition.marketShare,
            marketShareTrend,
            topCompetitors,
            talentWarZones,
            strategicSignals,
            positioningMatrix
        };
    }
    buildTemporalData(metrics, agencyJobs, allJobs) {
        const postedVsOpen = this.buildPostedVsOpenTimeline(agencyJobs);
        const seasonalPattern = this.buildSeasonalPattern(agencyJobs);
        const applicationWindows = this.buildApplicationWindows(metrics, agencyJobs, allJobs);
        const hiringVelocityTrend = this.buildHiringVelocityTrend(agencyJobs);
        return {
            postedVsOpen,
            seasonalPattern,
            applicationWindows,
            hiringVelocityTrend
        };
    }
    buildWorkforceData(metrics, benchmarks, agencyJobs) {
        const seniorityDistribution = metrics.workforceComposition.seniorityDistribution.map(s => ({
            level: s.level,
            count: s.count,
            percentage: s.percentage,
            marketAvg: this.getMarketAvgForSeniority(s.level)
        }));
        const seniorityTrend = this.buildSeniorityTrend(agencyJobs);
        const contractTypes = this.buildContractTypes(metrics, agencyJobs);
        const geographic = {
            hq: metrics.geographicAnalysis.hqVsFieldRatio.hq,
            regional: { count: 0, percentage: 0 },
            field: metrics.geographicAnalysis.hqVsFieldRatio.field,
            remote: metrics.geographicAnalysis.hqVsFieldRatio.remote
        };
        const topLocations = metrics.geographicAnalysis.topDutyStations.slice(0, 10).map(loc => ({
            location: loc.station,
            count: loc.count,
            change: 0,
            trend: 'stable'
        }));
        return {
            seniorityDistribution,
            seniorityTrend,
            contractTypes,
            geographic,
            topLocations,
            locationMapData: []
        };
    }
    buildCategoryData(metrics, allJobs, agency) {
        const distribution = metrics.categoryAnalysis.distribution.map(cat => ({
            category: cat.category,
            count: cat.count,
            percentage: cat.percentage,
            growth: this.calculateCategoryGrowth(cat.category, agency, allJobs),
            marketShare: this.calculateCategoryMarketShare(cat.category, agency, allJobs),
            marketLeader: this.findCategoryLeader(cat.category, allJobs),
            yourRank: this.calculateCategoryRank(cat.category, agency, allJobs)
        }));
        const bcgMatrix = this.buildBCGMatrix(distribution);
        const emerging = this.findEmergingCategories(allJobs);
        const declining = this.findDecliningCategories(allJobs);
        const timeline = this.buildCategoryTimeline(agency, allJobs);
        const dominanceTable = distribution.slice(0, 10).map(d => ({
            category: d.category,
            yourShare: d.marketShare,
            marketLeader: d.marketLeader,
            leaderShare: this.findCategoryLeaderShare(d.category, allJobs),
            yourRank: d.yourRank,
            trend: d.growth > 5 ? 'up' : d.growth < -5 ? 'down' : 'stable'
        }));
        return {
            distribution,
            bcgMatrix,
            emerging,
            declining,
            timeline,
            dominanceTable
        };
    }
    buildSkillsData(agencyJobs, allJobs) {
        const skillCounts = this.extractSkillsFromJobs(agencyJobs);
        const marketSkillCounts = this.extractSkillsFromJobs(allJobs);
        const topSkills = Object.entries(skillCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 15)
            .map(([skill, count]) => {
            const demand = (count / agencyJobs.length) * 100;
            const marketDemand = marketSkillCounts[skill]
                ? (marketSkillCounts[skill] / allJobs.length) * 100
                : 0;
            return {
                skill,
                demand,
                growth: 0,
                yourVsMarket: demand - marketDemand,
                category: this.categorizeSkill(skill)
            };
        });
        const languages = this.extractLanguageData(agencyJobs, allJobs);
        const skillBubbleData = topSkills.map(s => ({
            skill: s.skill,
            demand: s.demand,
            growth: s.growth,
            agenciesCount: this.countAgenciesWithSkill(s.skill, allJobs),
            category: s.category
        }));
        return {
            topSkills,
            emerging: [],
            languages,
            skillBubbleData
        };
    }
    transformRecommendations(recommendations) {
        return recommendations.map(rec => ({
            priority: rec.priority,
            area: rec.area,
            title: rec.recommendation,
            rationale: rec.rationale,
            impact: rec.impact,
            timeline: this.determineTimeline(rec.priority)
        }));
    }
    buildBenchmarks(benchmarks, allJobs) {
        const topAgency = this.findTopAgency(allJobs);
        return {
            marketAverages: {
                postingsPerAgency: benchmarks.marketAverages.avgPostingsPerAgency,
                avgApplicationWindow: benchmarks.marketAverages.avgApplicationWindow,
                seniorRatio: 15,
                consultantRatio: 20,
                categoryDiversity: benchmarks.industryStandards.targetCategoryDiversity * 100
            },
            topPerformer: {
                agency: topAgency.agency,
                metrics: {
                    volume: topAgency.count,
                    marketShare: (topAgency.count / allJobs.length) * 100,
                    applicationWindow: 30,
                    categoryCount: 15
                }
            },
            peerGroupAverages: {
                postings: benchmarks.peerAverages.avgPostingsPerPeer,
                growth: 0,
                applicationWindow: benchmarks.marketAverages.avgApplicationWindow
            }
        };
    }
    getAllJobs(startDate, endDate) {
        return sqlite_1.default.prepare(`
      SELECT * FROM jobs 
      WHERE posting_date >= ? AND posting_date <= ?
    `).all(startDate, endDate);
    }
    getAgencyJobs(agency, startDate, endDate) {
        return sqlite_1.default.prepare(`
      SELECT * FROM jobs 
      WHERE (LOWER(short_agency) LIKE LOWER(?) OR LOWER(long_agency) LIKE LOWER(?))
      AND posting_date >= ? AND posting_date <= ?
    `).all(`%${agency}%`, `%${agency}%`, startDate, endDate);
    }
    getUniqueAgencyCount(jobs) {
        const agencies = new Set(jobs.map(j => j.short_agency || j.long_agency));
        return agencies.size;
    }
    calculateCompetitiveScore(metrics, benchmarks, competitive) {
        let score = 0;
        score += Math.min(30, competitive.marketPosition.marketShare * 3);
        const growthScore = metrics.volumeMetrics.monthOverMonthChange > 0
            ? Math.min(25, metrics.volumeMetrics.monthOverMonthChange / 4)
            : Math.max(0, 12.5 + metrics.volumeMetrics.monthOverMonthChange / 8);
        score += growthScore;
        score += Math.min(20, metrics.categoryAnalysis.categoryDiversity / 5);
        const efficiencyRatio = benchmarks.marketAverages.avgApplicationWindow /
            Math.max(1, metrics.applicationMetrics.avgApplicationWindow);
        score += Math.min(15, efficiencyRatio * 7.5);
        const rankBonus = Math.max(0, 10 - competitive.marketPosition.marketRank);
        score += rankBonus;
        return Math.round(Math.min(100, Math.max(0, score)));
    }
    buildComparisonTable(metrics, benchmarks, competitive, allJobs) {
        const topAgency = this.findTopAgency(allJobs);
        return [
            {
                metric: 'Total Postings',
                yourAgency: metrics.volumeMetrics.totalPostings,
                marketAvg: benchmarks.marketAverages.avgPostingsPerAgency,
                topPerformer: { value: topAgency.count, agency: topAgency.agency },
                yourRank: competitive.marketPosition.marketRank
            },
            {
                metric: 'Application Window',
                yourAgency: `${metrics.applicationMetrics.avgApplicationWindow.toFixed(0)} days`,
                marketAvg: `${benchmarks.marketAverages.avgApplicationWindow} days`,
                topPerformer: { value: '5 days', agency: 'Best Practice' },
                yourRank: this.estimateWindowRank(metrics.applicationMetrics.avgApplicationWindow, allJobs)
            },
            {
                metric: 'Market Share',
                yourAgency: `${competitive.marketPosition.marketShare.toFixed(1)}%`,
                marketAvg: `${(100 / competitive.marketPosition.totalAgenciesInMarket).toFixed(1)}%`,
                topPerformer: { value: `${(topAgency.count / allJobs.length * 100).toFixed(1)}%`, agency: topAgency.agency },
                yourRank: competitive.marketPosition.marketRank
            },
            {
                metric: 'Categories Active',
                yourAgency: metrics.categoryAnalysis.distribution.length,
                marketAvg: 12,
                topPerformer: { value: 18, agency: 'UNICEF' },
                yourRank: 5
            }
        ];
    }
    buildRadarData(metrics, benchmarks, competitive) {
        return {
            dimensions: ['Volume', 'Market Share', 'Efficiency', 'Diversity', 'Growth', 'Reach'],
            yourScores: [
                Math.min(100, (metrics.volumeMetrics.totalPostings / benchmarks.marketAverages.avgPostingsPerAgency) * 50),
                Math.min(100, competitive.marketPosition.marketShare * 10),
                Math.min(100, (benchmarks.marketAverages.avgApplicationWindow / Math.max(1, metrics.applicationMetrics.avgApplicationWindow)) * 50),
                Math.min(100, metrics.categoryAnalysis.categoryDiversity),
                Math.min(100, Math.max(0, 50 + metrics.volumeMetrics.monthOverMonthChange / 2)),
                Math.min(100, metrics.geographicAnalysis.regionDistribution.length * 12)
            ],
            marketAvgScores: [50, 50, 50, 50, 50, 50]
        };
    }
    generateKeyFindings(metrics, benchmarks, competitive) {
        const findings = [];
        if (metrics.volumeMetrics.monthOverMonthChange > 20) {
            findings.push(`Strong hiring momentum: ${metrics.volumeMetrics.monthOverMonthChange.toFixed(0)}% increase in postings vs. previous period`);
        }
        else if (metrics.volumeMetrics.monthOverMonthChange < -20) {
            findings.push(`Hiring slowdown: ${Math.abs(metrics.volumeMetrics.monthOverMonthChange).toFixed(0)}% decrease in postings vs. previous period`);
        }
        if (competitive.marketPosition.marketRank <= 5) {
            findings.push(`Top 5 market position: Ranked #${competitive.marketPosition.marketRank} among ${competitive.marketPosition.totalAgenciesInMarket} agencies`);
        }
        if (metrics.applicationMetrics.avgApplicationWindow < benchmarks.marketAverages.avgApplicationWindow) {
            findings.push(`Faster hiring cycles: ${(benchmarks.marketAverages.avgApplicationWindow - metrics.applicationMetrics.avgApplicationWindow).toFixed(0)} days shorter than market average`);
        }
        if (metrics.applicationMetrics.urgentPositionsPercentage > 25) {
            findings.push(`High urgency rate: ${metrics.applicationMetrics.urgentPositionsPercentage.toFixed(0)}% of positions are urgent (≤14 days)`);
        }
        const nationalPct = metrics.workforceComposition.staffTypeBreakdown.national.percentage;
        if (nationalPct > 50) {
            findings.push(`Strong localization: ${nationalPct.toFixed(0)}% national staff positions`);
        }
        return findings.slice(0, 4);
    }
    calculateMarketShareTrend(agency, allJobs) {
        const periods = this.getLast6Months();
        return periods.map(period => {
            const periodJobs = allJobs.filter(j => j.posting_month === period);
            const agencyPeriodJobs = periodJobs.filter(j => j.short_agency?.toLowerCase().includes(agency.toLowerCase()) ||
                agency.toLowerCase().includes(j.short_agency?.toLowerCase() || ''));
            return {
                period,
                share: periodJobs.length > 0 ? (agencyPeriodJobs.length / periodJobs.length) * 100 : 0
            };
        });
    }
    getLast6Months() {
        const months = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        }
        return months;
    }
    buildPositioningMatrix(allJobs, agency) {
        const agencyCounts = {};
        allJobs.forEach(j => {
            const ag = j.short_agency || j.long_agency || 'Unknown';
            agencyCounts[ag] = (agencyCounts[ag] || 0) + 1;
        });
        return Object.entries(agencyCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 15)
            .map(([ag, count]) => ({
            agency: ag,
            volume: count,
            growthRate: this.calculateAgencyGrowth(ag, allJobs),
            categoryDiversity: this.countAgencyCategories(ag, allJobs),
            tier: (0, peerGroups_1.getAgencyTier)(ag),
            isYou: ag.toLowerCase().includes(agency.toLowerCase()) ||
                agency.toLowerCase().includes(ag.toLowerCase())
        }));
    }
    calculateAgencyGrowth(agency, allJobs) {
        const now = new Date();
        const recentJobs = allJobs.filter(j => {
            const posted = new Date(j.posting_date);
            const monthsAgo = (now.getFullYear() - posted.getFullYear()) * 12 +
                now.getMonth() - posted.getMonth();
            return monthsAgo <= 3 && (j.short_agency?.toLowerCase().includes(agency.toLowerCase()) ||
                agency.toLowerCase().includes(j.short_agency?.toLowerCase() || ''));
        });
        const olderJobs = allJobs.filter(j => {
            const posted = new Date(j.posting_date);
            const monthsAgo = (now.getFullYear() - posted.getFullYear()) * 12 +
                now.getMonth() - posted.getMonth();
            return monthsAgo > 3 && monthsAgo <= 6 && (j.short_agency?.toLowerCase().includes(agency.toLowerCase()) ||
                agency.toLowerCase().includes(j.short_agency?.toLowerCase() || ''));
        });
        if (olderJobs.length === 0)
            return 0;
        return ((recentJobs.length - olderJobs.length) / olderJobs.length) * 100;
    }
    countAgencyCategories(agency, allJobs) {
        const agencyJobs = allJobs.filter(j => j.short_agency?.toLowerCase().includes(agency.toLowerCase()) ||
            agency.toLowerCase().includes(j.short_agency?.toLowerCase() || ''));
        const categories = new Set(agencyJobs.map(j => j.primary_category).filter(Boolean));
        return categories.size;
    }
    findCategoryLeader(category, allJobs) {
        const categoryJobs = allJobs.filter(j => j.primary_category === category);
        const counts = {};
        categoryJobs.forEach(j => {
            const ag = j.short_agency || j.long_agency || 'Unknown';
            counts[ag] = (counts[ag] || 0) + 1;
        });
        const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
        return sorted[0]?.[0] || 'Unknown';
    }
    findCategoryLeaderShare(category, allJobs) {
        const categoryJobs = allJobs.filter(j => j.primary_category === category);
        const counts = {};
        categoryJobs.forEach(j => {
            const ag = j.short_agency || j.long_agency || 'Unknown';
            counts[ag] = (counts[ag] || 0) + 1;
        });
        const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
        return sorted[0] ? (sorted[0][1] / categoryJobs.length) * 100 : 0;
    }
    generateStrategicSignals(metrics, competitive) {
        const signals = [];
        if (competitive.peerGroupComparison.performanceVsPeers === 'below') {
            signals.push({
                type: 'warning',
                title: 'Below Peer Group Average',
                description: `Your hiring volume (${competitive.peerGroupComparison.yourPostings}) is below the ${competitive.peerGroupComparison.peerGroupName} average of ${competitive.peerGroupComparison.avgPostingsInGroup.toFixed(0)} positions.`
            });
        }
        if (metrics.applicationMetrics.avgApplicationWindow < 10) {
            signals.push({
                type: 'opportunity',
                title: 'Fast Hiring Cycles',
                description: `Your ${metrics.applicationMetrics.avgApplicationWindow.toFixed(0)}-day average application window is significantly faster than market, potentially attracting more candidates.`
            });
        }
        if (metrics.applicationMetrics.urgentPositionsPercentage > 30) {
            signals.push({
                type: 'action',
                title: 'Improve Recruitment Forecasting',
                description: `${metrics.applicationMetrics.urgentPositionsPercentage.toFixed(0)}% of positions are urgent. Better workforce planning could reduce last-minute hiring stress.`
            });
        }
        const highThreatCompetitors = competitive.competitorAnalysis.filter(c => c.competitionLevel === 'high');
        if (highThreatCompetitors.length > 2) {
            signals.push({
                type: 'warning',
                title: 'High Competition in Key Categories',
                description: `${highThreatCompetitors.length} agencies pose high competitive threat with significant category overlap. Consider differentiation strategies.`
            });
        }
        return signals.slice(0, 4);
    }
    buildPostedVsOpenTimeline(agencyJobs) {
        const periods = this.getLast6Months();
        const today = new Date();
        return periods.map(period => {
            const periodJobs = agencyJobs.filter(j => j.posting_month === period);
            const openJobs = periodJobs.filter(j => {
                const deadline = new Date(j.apply_until);
                return deadline >= today;
            });
            const closedJobs = periodJobs.filter(j => {
                const deadline = new Date(j.apply_until);
                return deadline < today;
            });
            return {
                period,
                posted: periodJobs.length,
                open: openJobs.length,
                closed: closedJobs.length,
                netChange: periodJobs.length - closedJobs.length
            };
        });
    }
    buildSeasonalPattern(agencyJobs) {
        const monthCounts = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        months.forEach(m => monthCounts[m] = []);
        agencyJobs.forEach(j => {
            const d = new Date(j.posting_date);
            const monthIndex = d.getMonth();
            const monthName = months[monthIndex];
            if (monthName && monthCounts[monthName]) {
                monthCounts[monthName].push(1);
            }
        });
        const avgByMonth = months.map(m => ({
            month: m,
            avg: (monthCounts[m] || []).length
        }));
        const sortedByAvg = [...avgByMonth].sort((a, b) => b.avg - a.avg);
        const highMonths = sortedByAvg.slice(0, 3).map(m => m.month);
        const lowMonths = sortedByAvg.slice(-3).map(m => m.month);
        const heatmapData = [];
        const years = [...new Set(agencyJobs.map(j => new Date(j.posting_date).getFullYear()))].sort();
        years.forEach(year => {
            months.forEach(month => {
                const count = agencyJobs.filter(j => {
                    const d = new Date(j.posting_date);
                    return d.getFullYear() === year && months[d.getMonth()] === month;
                }).length;
                heatmapData.push({ month, year, value: count });
            });
        });
        return {
            highMonths,
            lowMonths,
            currentVsTypical: 0,
            heatmapData
        };
    }
    buildApplicationWindows(metrics, agencyJobs, allJobs) {
        const windows = agencyJobs.map(j => {
            const posted = new Date(j.posting_date);
            const deadline = new Date(j.apply_until);
            return Math.ceil((deadline.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24));
        }).filter(w => w > 0 && w < 365);
        const urgent = windows.filter(w => w <= 14).length;
        const normal = windows.filter(w => w > 14 && w <= 30).length;
        const extended = windows.filter(w => w > 30 && w <= 60).length;
        const long = windows.filter(w => w > 60).length;
        const total = windows.length || 1;
        const marketWindows = allJobs.map(j => {
            const posted = new Date(j.posting_date);
            const deadline = new Date(j.apply_until);
            return Math.ceil((deadline.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24));
        }).filter(w => w > 0 && w < 365);
        const mTotal = marketWindows.length || 1;
        const mUrgent = marketWindows.filter(w => w <= 14).length;
        const mNormal = marketWindows.filter(w => w > 14 && w <= 30).length;
        const mExtended = marketWindows.filter(w => w > 30 && w <= 60).length;
        const mLong = marketWindows.filter(w => w > 60).length;
        return {
            urgent: { count: urgent, percentage: (urgent / total) * 100 },
            normal: { count: normal, percentage: (normal / total) * 100 },
            extended: { count: extended, percentage: (extended / total) * 100 },
            long: { count: long, percentage: (long / total) * 100 },
            marketComparison: {
                yourDistribution: [
                    (urgent / total) * 100,
                    (normal / total) * 100,
                    (extended / total) * 100,
                    (long / total) * 100
                ],
                marketDistribution: [
                    (mUrgent / mTotal) * 100,
                    (mNormal / mTotal) * 100,
                    (mExtended / mTotal) * 100,
                    (mLong / mTotal) * 100
                ]
            }
        };
    }
    buildHiringVelocityTrend(agencyJobs) {
        const periods = this.getLast6Months();
        return periods.map((period, index, arr) => {
            const periodJobs = agencyJobs.filter(j => j.posting_month === period);
            const velocity = periodJobs.length / 4;
            const prevVelocity = index > 0
                ? agencyJobs.filter(j => j.posting_month === arr[index - 1]).length / 4
                : velocity;
            const change = prevVelocity > 0 ? ((velocity - prevVelocity) / prevVelocity) * 100 : 0;
            return {
                period,
                velocity,
                momentum: change > 20 ? 'accelerating' :
                    change < -20 ? 'decelerating' : 'steady'
            };
        });
    }
    getMarketAvgForSeniority(level) {
        const defaults = {
            'Executive': 2,
            'Senior': 10,
            'Mid': 35,
            'Mid-Level': 35,
            'Entry': 25,
            'Intern': 10,
            'Consultant': 15,
            'Unknown': 20
        };
        return defaults[level] || 10;
    }
    buildSeniorityTrend(agencyJobs) {
        const periods = this.getLast6Months();
        return periods.map(period => {
            const periodJobs = agencyJobs.filter(j => j.posting_month === period);
            const total = periodJobs.length || 1;
            const executive = periodJobs.filter(j => j.seniority_level === 'Executive' || j.seniority_level === 'Director').length;
            const senior = periodJobs.filter(j => j.seniority_level === 'Senior').length;
            const mid = periodJobs.filter(j => j.seniority_level === 'Mid' || j.seniority_level === 'Mid-Level').length;
            const entry = periodJobs.filter(j => j.seniority_level === 'Entry').length;
            const intern = periodJobs.filter(j => j.seniority_level === 'Intern').length;
            return {
                period,
                executive: (executive / total) * 100,
                senior: (senior / total) * 100,
                mid: (mid / total) * 100,
                entry: (entry / total) * 100,
                intern: (intern / total) * 100
            };
        });
    }
    buildContractTypes(metrics, agencyJobs) {
        const staffBreakdown = metrics.workforceComposition.staffTypeBreakdown;
        const periods = this.getLast6Months();
        const trend = periods.map(period => {
            const periodJobs = agencyJobs.filter(j => j.posting_month === period);
            const total = periodJobs.length || 1;
            const staff = periodJobs.filter(j => {
                const grade = (j.up_grade || '').toLowerCase();
                return grade.includes('p-') || grade.includes('d-') || grade.includes('g-');
            }).length;
            const consultant = periodJobs.filter(j => {
                const title = (j.title || '').toLowerCase();
                const grade = (j.up_grade || '').toLowerCase();
                return title.includes('consultant') || grade.includes('consultant');
            }).length;
            const intern = periodJobs.filter(j => {
                const title = (j.title || '').toLowerCase();
                const grade = (j.up_grade || '').toLowerCase();
                return title.includes('intern') || grade.includes('intern');
            }).length;
            return {
                period,
                staff: (staff / total) * 100,
                consultant: (consultant / total) * 100,
                intern: (intern / total) * 100
            };
        });
        return {
            staff: {
                count: staffBreakdown.international.count + staffBreakdown.national.count,
                percentage: staffBreakdown.international.percentage + staffBreakdown.national.percentage
            },
            consultant: staffBreakdown.consultant,
            intern: staffBreakdown.intern,
            trend
        };
    }
    calculateCategoryGrowth(category, agency, allJobs) {
        const now = new Date();
        const agencyJobs = allJobs.filter(j => j.short_agency?.toLowerCase().includes(agency.toLowerCase()) ||
            agency.toLowerCase().includes(j.short_agency?.toLowerCase() || ''));
        const recentCategoryJobs = agencyJobs.filter(j => {
            const posted = new Date(j.posting_date);
            const monthsAgo = (now.getFullYear() - posted.getFullYear()) * 12 +
                now.getMonth() - posted.getMonth();
            return monthsAgo <= 3 && j.primary_category === category;
        });
        const olderCategoryJobs = agencyJobs.filter(j => {
            const posted = new Date(j.posting_date);
            const monthsAgo = (now.getFullYear() - posted.getFullYear()) * 12 +
                now.getMonth() - posted.getMonth();
            return monthsAgo > 3 && monthsAgo <= 6 && j.primary_category === category;
        });
        if (olderCategoryJobs.length === 0)
            return 0;
        return ((recentCategoryJobs.length - olderCategoryJobs.length) / olderCategoryJobs.length) * 100;
    }
    calculateCategoryMarketShare(category, agency, allJobs) {
        const categoryJobs = allJobs.filter(j => j.primary_category === category);
        const agencyCategoryJobs = categoryJobs.filter(j => j.short_agency?.toLowerCase().includes(agency.toLowerCase()) ||
            agency.toLowerCase().includes(j.short_agency?.toLowerCase() || ''));
        return categoryJobs.length > 0
            ? (agencyCategoryJobs.length / categoryJobs.length) * 100
            : 0;
    }
    calculateCategoryRank(category, agency, allJobs) {
        const categoryJobs = allJobs.filter(j => j.primary_category === category);
        const counts = {};
        categoryJobs.forEach(j => {
            const ag = j.short_agency || j.long_agency || 'Unknown';
            counts[ag] = (counts[ag] || 0) + 1;
        });
        const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
        const rank = sorted.findIndex(([ag]) => ag.toLowerCase().includes(agency.toLowerCase()) ||
            agency.toLowerCase().includes(ag.toLowerCase()));
        return rank >= 0 ? rank + 1 : sorted.length + 1;
    }
    buildBCGMatrix(distribution) {
        const avgGrowth = distribution.reduce((sum, d) => sum + d.growth, 0) / distribution.length;
        const avgShare = distribution.reduce((sum, d) => sum + d.marketShare, 0) / distribution.length;
        return {
            stars: distribution
                .filter(d => d.growth > avgGrowth && d.marketShare > avgShare)
                .map(d => ({ category: d.category, growth: d.growth, share: d.marketShare })),
            questionMarks: distribution
                .filter(d => d.growth > avgGrowth && d.marketShare <= avgShare)
                .map(d => ({ category: d.category, growth: d.growth, share: d.marketShare })),
            cashCows: distribution
                .filter(d => d.growth <= avgGrowth && d.marketShare > avgShare)
                .map(d => ({ category: d.category, growth: d.growth, share: d.marketShare })),
            dogs: distribution
                .filter(d => d.growth <= avgGrowth && d.marketShare <= avgShare)
                .map(d => ({ category: d.category, growth: d.growth, share: d.marketShare }))
        };
    }
    findEmergingCategories(allJobs) {
        const now = new Date();
        const categories = {};
        allJobs.forEach(j => {
            const cat = j.primary_category || 'Unknown';
            const posted = new Date(j.posting_date);
            const monthsAgo = (now.getFullYear() - posted.getFullYear()) * 12 +
                now.getMonth() - posted.getMonth();
            if (!categories[cat])
                categories[cat] = { recent: 0, older: 0 };
            if (monthsAgo <= 3) {
                categories[cat].recent++;
            }
            else if (monthsAgo <= 6) {
                categories[cat].older++;
            }
        });
        return Object.entries(categories)
            .filter(([, data]) => data.older > 0 && data.recent > data.older * 1.3)
            .map(([category, data]) => ({
            category,
            growth: ((data.recent - data.older) / data.older) * 100,
            agencies: new Set(allJobs.filter(j => j.primary_category === category)
                .map(j => j.short_agency)).size
        }))
            .sort((a, b) => b.growth - a.growth)
            .slice(0, 5);
    }
    findDecliningCategories(allJobs) {
        const now = new Date();
        const categories = {};
        allJobs.forEach(j => {
            const cat = j.primary_category || 'Unknown';
            const posted = new Date(j.posting_date);
            const monthsAgo = (now.getFullYear() - posted.getFullYear()) * 12 +
                now.getMonth() - posted.getMonth();
            if (!categories[cat])
                categories[cat] = { recent: 0, older: 0 };
            if (monthsAgo <= 3) {
                categories[cat].recent++;
            }
            else if (monthsAgo <= 6) {
                categories[cat].older++;
            }
        });
        return Object.entries(categories)
            .filter(([, data]) => data.older > 0 && data.recent < data.older * 0.7)
            .map(([category, data]) => ({
            category,
            decline: ((data.recent - data.older) / data.older) * 100
        }))
            .sort((a, b) => a.decline - b.decline)
            .slice(0, 5);
    }
    buildCategoryTimeline(agency, allJobs) {
        const periods = this.getLast6Months();
        const agencyJobs = allJobs.filter(j => j.short_agency?.toLowerCase().includes(agency.toLowerCase()) ||
            agency.toLowerCase().includes(j.short_agency?.toLowerCase() || ''));
        const topCategories = [...new Set(agencyJobs.map(j => j.primary_category))]
            .filter(Boolean)
            .slice(0, 5);
        return periods.map(period => {
            const result = { period };
            const periodJobs = agencyJobs.filter(j => j.posting_month === period);
            topCategories.forEach(cat => {
                result[cat] = periodJobs.filter(j => j.primary_category === cat).length;
            });
            return result;
        });
    }
    extractSkillsFromJobs(jobs) {
        const skills = {};
        const commonSkills = [
            'Management', 'Leadership', 'Analysis', 'Research', 'Communication',
            'Planning', 'Coordination', 'Monitoring', 'Evaluation', 'Reporting',
            'Policy', 'Strategy', 'Finance', 'Budget', 'Data', 'Technology',
            'Program', 'Project', 'Operations', 'Administration', 'Legal'
        ];
        jobs.forEach(job => {
            const title = (job.title || '').toLowerCase();
            const labels = (job.job_labels || '').toLowerCase();
            const combined = title + ' ' + labels;
            commonSkills.forEach(skill => {
                if (combined.includes(skill.toLowerCase())) {
                    skills[skill] = (skills[skill] || 0) + 1;
                }
            });
        });
        return skills;
    }
    categorizeSkill(skill) {
        const technical = ['Technology', 'Data', 'Analysis', 'Research', 'Finance', 'Budget', 'Legal'];
        const soft = ['Leadership', 'Management', 'Communication', 'Coordination'];
        if (technical.includes(skill))
            return 'technical';
        if (soft.includes(skill))
            return 'soft';
        return 'domain';
    }
    countAgenciesWithSkill(skill, allJobs) {
        const agencies = new Set();
        const skillLower = skill.toLowerCase();
        allJobs.forEach(j => {
            const combined = ((j.title || '') + ' ' + (j.job_labels || '')).toLowerCase();
            if (combined.includes(skillLower)) {
                agencies.add(j.short_agency || j.long_agency || 'Unknown');
            }
        });
        return agencies.size;
    }
    extractLanguageData(agencyJobs, allJobs) {
        const extractLanguages = (jobs) => {
            const langs = {};
            jobs.forEach(j => {
                const languages = (j.languages || '').split(',').map((l) => l.trim()).filter(Boolean);
                languages.forEach((lang) => {
                    langs[lang] = (langs[lang] || 0) + 1;
                });
            });
            return langs;
        };
        const agencyLangs = extractLanguages(agencyJobs);
        const marketLangs = extractLanguages(allJobs);
        const total = agencyJobs.length || 1;
        const mTotal = allJobs.length || 1;
        const required = Object.entries(agencyLangs)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([language, count]) => ({
            language,
            count,
            percentage: (count / total) * 100
        }));
        const multilingualJobs = agencyJobs.filter(j => {
            const langs = (j.languages || '').split(',').filter((l) => l.trim()).length;
            return langs > 1;
        }).length;
        const marketMultilingual = allJobs.filter(j => {
            const langs = (j.languages || '').split(',').filter((l) => l.trim()).length;
            return langs > 1;
        }).length;
        return {
            required,
            desired: [],
            multilingualRate: (multilingualJobs / total) * 100,
            marketComparison: {
                yourRate: (multilingualJobs / total) * 100,
                marketRate: (marketMultilingual / mTotal) * 100
            }
        };
    }
    findTopAgency(allJobs) {
        const counts = {};
        allJobs.forEach(j => {
            const ag = j.short_agency || j.long_agency || 'Unknown';
            counts[ag] = (counts[ag] || 0) + 1;
        });
        const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
        return { agency: sorted[0]?.[0] || 'Unknown', count: sorted[0]?.[1] || 0 };
    }
    estimateWindowRank(avgWindow, allJobs) {
        const agencyWindows = {};
        allJobs.forEach(j => {
            const ag = j.short_agency || j.long_agency || 'Unknown';
            const posted = new Date(j.posting_date);
            const deadline = new Date(j.apply_until);
            const window = Math.ceil((deadline.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24));
            if (window > 0 && window < 365) {
                if (!agencyWindows[ag])
                    agencyWindows[ag] = [];
                agencyWindows[ag].push(window);
            }
        });
        const avgWindows = Object.entries(agencyWindows).map(([agency, windows]) => ({
            agency,
            avg: windows.reduce((a, b) => a + b, 0) / windows.length
        })).sort((a, b) => a.avg - b.avg);
        const rank = avgWindows.findIndex(a => a.avg >= avgWindow);
        return rank >= 0 ? rank + 1 : avgWindows.length + 1;
    }
    determineTimeline(priority) {
        switch (priority) {
            case 'high': return 'immediate';
            case 'medium': return 'quarter';
            default: return 'year';
        }
    }
}
exports.MonthlyReportDataAggregator = MonthlyReportDataAggregator;
exports.default = MonthlyReportDataAggregator;
//# sourceMappingURL=MonthlyReportDataAggregator.js.map