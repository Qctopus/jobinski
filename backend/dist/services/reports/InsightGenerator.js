"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsightGenerator = void 0;
class InsightGenerator {
    generateInsights(metrics, benchmarks, competitive) {
        return {
            volumeInsights: this.generateVolumeInsights(metrics, benchmarks),
            competitiveInsights: this.generateCompetitiveInsights(metrics, competitive),
            strategicInsights: this.generateStrategicInsights(metrics, benchmarks, competitive)
        };
    }
    generateRecommendations(metrics, benchmarks, competitive) {
        const recommendations = [];
        const windowDiff = metrics.applicationMetrics.avgApplicationWindow - benchmarks.marketAverages.avgApplicationWindow;
        if (windowDiff > 5) {
            recommendations.push({
                priority: 'high',
                area: 'Process Efficiency',
                recommendation: 'Optimize Application Windows',
                rationale: `Your average application window of ${metrics.applicationMetrics.avgApplicationWindow.toFixed(0)} days is ${windowDiff.toFixed(0)} days longer than market average.`,
                impact: 'Improved candidate attraction and faster time-to-hire'
            });
        }
        const consultantPct = metrics.workforceComposition.staffTypeBreakdown.consultant.percentage;
        if (consultantPct > 35) {
            recommendations.push({
                priority: 'medium',
                area: 'Workforce Planning',
                recommendation: 'Review Consultant-to-Staff Ratio',
                rationale: `${consultantPct.toFixed(0)}% of positions are consultants, which may impact institutional knowledge.`,
                impact: 'Better knowledge retention and reduced turnover'
            });
        }
        const seniorPct = metrics.workforceComposition.seniorityDistribution
            .filter(s => s.level === 'Senior' || s.level === 'Director')
            .reduce((sum, s) => sum + s.percentage, 0);
        if (seniorPct < 15) {
            recommendations.push({
                priority: 'medium',
                area: 'Leadership Pipeline',
                recommendation: 'Strengthen Senior Talent Pipeline',
                rationale: `Only ${seniorPct.toFixed(0)}% of positions are at senior level.`,
                impact: 'Stronger succession planning and organizational capability'
            });
        }
        if (metrics.applicationMetrics.urgentPositionsPercentage > 30) {
            recommendations.push({
                priority: 'high',
                area: 'Recruitment Planning',
                recommendation: 'Improve Hiring Forecasting',
                rationale: `${metrics.applicationMetrics.urgentPositionsPercentage.toFixed(0)}% of positions are urgent (≤14 days to deadline).`,
                impact: 'Better candidate quality and reduced stress on hiring managers'
            });
        }
        if (competitive.marketPosition.marketShare < 2) {
            recommendations.push({
                priority: 'low',
                area: 'Market Position',
                recommendation: 'Increase Hiring Visibility',
                rationale: 'Your hiring volume is relatively low in the market.',
                impact: 'Greater talent pool reach and improved employer branding'
            });
        }
        return recommendations.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            return (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
        });
    }
    generateVolumeInsights(metrics, benchmarks) {
        const insights = [];
        const momChange = metrics.volumeMetrics.monthOverMonthChange;
        if (Math.abs(momChange) > 15) {
            insights.push({
                type: momChange > 0 ? 'positive' : 'warning',
                title: momChange > 0 ? 'Significant Hiring Increase' : 'Notable Hiring Decrease',
                description: `${Math.abs(momChange).toFixed(0)}% ${momChange > 0 ? 'increase' : 'decrease'} in postings compared to the previous period.`,
                metric: `${momChange.toFixed(0)}%`,
                value: momChange
            });
        }
        const windowDiff = metrics.applicationMetrics.avgApplicationWindow - benchmarks.marketAverages.avgApplicationWindow;
        if (Math.abs(windowDiff) > 5) {
            insights.push({
                type: windowDiff < 0 ? 'positive' : 'warning',
                title: windowDiff < 0 ? 'Faster Hiring Cycles' : 'Longer Application Windows',
                description: `Application windows average ${Math.abs(windowDiff).toFixed(0)} days ${windowDiff < 0 ? 'shorter' : 'longer'} than market average.`,
                metric: `${metrics.applicationMetrics.avgApplicationWindow.toFixed(0)} days`,
                value: metrics.applicationMetrics.avgApplicationWindow
            });
        }
        const activeRatio = (metrics.volumeMetrics.activePostings / metrics.volumeMetrics.totalPostings) * 100;
        if (activeRatio > 0) {
            insights.push({
                type: activeRatio > 50 ? 'positive' : 'neutral',
                title: 'Active Positions',
                description: `${activeRatio.toFixed(0)}% of positions still accepting applications.`,
                metric: `${metrics.volumeMetrics.activePostings} active`,
                value: activeRatio
            });
        }
        insights.push({
            type: 'neutral',
            title: 'Total Postings',
            description: `${metrics.volumeMetrics.totalPostings} total job postings in this period.`,
            metric: `${metrics.volumeMetrics.totalPostings} jobs`,
            value: metrics.volumeMetrics.totalPostings
        });
        return insights;
    }
    generateCompetitiveInsights(metrics, competitive) {
        const insights = [];
        if (competitive.marketPosition.marketShare > 0) {
            insights.push({
                type: competitive.marketPosition.marketShare > 5 ? 'positive' : 'neutral',
                title: 'Market Presence',
                description: `${competitive.marketPosition.marketShare.toFixed(1)}% of total UN system job postings.`,
                metric: `${competitive.marketPosition.marketShare.toFixed(1)}%`,
                value: competitive.marketPosition.marketShare
            });
        }
        insights.push({
            type: competitive.marketPosition.marketRank <= 10 ? 'positive' : 'neutral',
            title: 'Market Ranking',
            description: `Ranked #${competitive.marketPosition.marketRank} out of ${competitive.marketPosition.totalAgenciesInMarket} agencies by hiring volume.`,
            metric: `#${competitive.marketPosition.marketRank}`,
            value: competitive.marketPosition.marketRank
        });
        if (competitive.peerGroupComparison.performanceVsPeers === 'above') {
            insights.push({
                type: 'positive',
                title: 'Above Peer Average',
                description: `Hiring volume exceeds peer group (${competitive.peerGroupComparison.peerGroupName}) average.`,
                metric: `${competitive.peerGroupComparison.yourPostings} vs ${competitive.peerGroupComparison.avgPostingsInGroup.toFixed(0)} avg`,
                value: competitive.peerGroupComparison.yourPostings
            });
        }
        else if (competitive.peerGroupComparison.performanceVsPeers === 'below') {
            insights.push({
                type: 'warning',
                title: 'Below Peer Average',
                description: `Hiring volume below peer group average.`,
                metric: `${competitive.peerGroupComparison.yourPostings} vs ${competitive.peerGroupComparison.avgPostingsInGroup.toFixed(0)} avg`,
                value: competitive.peerGroupComparison.yourPostings
            });
        }
        return insights;
    }
    generateStrategicInsights(metrics, benchmarks, competitive) {
        const insights = [];
        const intlPct = metrics.workforceComposition.staffTypeBreakdown.international.percentage;
        const natPct = metrics.workforceComposition.staffTypeBreakdown.national.percentage;
        if (natPct > intlPct) {
            insights.push({
                type: 'positive',
                title: 'Strong Localization',
                description: `National staff positions (${natPct.toFixed(0)}%) exceed international positions (${intlPct.toFixed(0)}%).`,
                metric: `${natPct.toFixed(0)}% national`,
                value: natPct
            });
        }
        const topStation = metrics.geographicAnalysis.topDutyStations[0];
        if (topStation) {
            insights.push({
                type: 'neutral',
                title: 'Top Location',
                description: `${topStation.station} is the primary duty station with ${topStation.percentage.toFixed(0)}% of positions.`,
                metric: `${topStation.count} jobs`,
                value: topStation.count
            });
        }
        const topCategory = metrics.categoryAnalysis.distribution?.[0];
        if (topCategory && topCategory.percentage !== undefined) {
            insights.push({
                type: 'neutral',
                title: 'Primary Focus Area',
                description: `${topCategory.category} represents ${topCategory.percentage.toFixed(0)}% of all positions.`,
                metric: `${topCategory.count} jobs`,
                value: topCategory.count
            });
        }
        return insights;
    }
}
exports.InsightGenerator = InsightGenerator;
exports.default = InsightGenerator;
//# sourceMappingURL=InsightGenerator.js.map