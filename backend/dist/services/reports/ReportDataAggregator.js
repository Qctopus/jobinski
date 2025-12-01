"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportDataAggregator = void 0;
const sqlite_1 = __importDefault(require("../../config/sqlite"));
const agencyLogos_1 = require("./utils/agencyLogos");
const peerGroups_1 = require("./utils/peerGroups");
class ReportDataAggregator {
    async aggregateAgencyMetrics(agency, startDate, endDate) {
        console.log(`[ReportDataAggregator] Aggregating metrics for ${agency} from ${startDate} to ${endDate}`);
        const agencyJobs = this.getAgencyJobs(agency, startDate, endDate);
        const previousPeriodJobs = this.getPreviousPeriodJobs(agency, startDate);
        const agencyInfo = this.getAgencyInfo(agency, agencyJobs);
        const volumeMetrics = this.calculateVolumeMetrics(agencyJobs, previousPeriodJobs);
        const applicationMetrics = this.calculateApplicationMetrics(agencyJobs);
        const workforceComposition = this.calculateWorkforceComposition(agencyJobs);
        const categoryAnalysis = this.calculateCategoryAnalysis(agencyJobs, agency);
        const geographicAnalysis = this.calculateGeographicAnalysis(agencyJobs);
        const temporalAnalysis = this.calculateTemporalAnalysis(agencyJobs);
        return {
            agencyInfo,
            volumeMetrics,
            applicationMetrics,
            workforceComposition,
            categoryAnalysis,
            geographicAnalysis,
            temporalAnalysis
        };
    }
    async calculateBenchmarks(agency, startDate, endDate) {
        const allJobs = this.getAllJobs(startDate, endDate);
        const peerAgencies = (0, peerGroups_1.getPeerAgencies)(agency);
        const peerJobs = allJobs.filter(job => peerAgencies.some(peer => job.short_agency?.toLowerCase().includes(peer.toLowerCase()) ||
            peer.toLowerCase().includes(job.short_agency?.toLowerCase() || '')));
        const marketAverages = this.calculateMarketAverages(allJobs);
        const peerAverages = this.calculatePeerAverages(peerJobs, peerAgencies);
        const industryStandards = this.calculateIndustryStandards(allJobs);
        return {
            marketAverages,
            peerAverages,
            industryStandards
        };
    }
    async calculateCompetitiveIntelligence(agency, startDate, endDate) {
        const allJobs = this.getAllJobs(startDate, endDate);
        const agencyJobs = this.getAgencyJobs(agency, startDate, endDate);
        const allAgencies = this.getUniqueAgencies(allJobs);
        const agencyVolume = agencyJobs.length;
        const sortedByVolume = allAgencies.sort((a, b) => b.count - a.count);
        const marketRank = sortedByVolume.findIndex(a => a.agency.toLowerCase().includes(agency.toLowerCase()) ||
            agency.toLowerCase().includes(a.agency.toLowerCase())) + 1;
        const totalMarketVolume = allJobs.length;
        const marketShare = totalMarketVolume > 0 ? (agencyVolume / totalMarketVolume) * 100 : 0;
        const marketPosition = {
            marketRank: marketRank || allAgencies.length + 1,
            totalAgenciesInMarket: allAgencies.length,
            marketShare,
            volumeVsMarketAverage: totalMarketVolume > 0
                ? ((agencyVolume / (totalMarketVolume / allAgencies.length)) - 1) * 100
                : 0
        };
        const peerAgencies = (0, peerGroups_1.getPeerAgencies)(agency);
        const peerGroup = (0, peerGroups_1.getAgencyPeerGroup)(agency);
        const peerJobCounts = new Map();
        peerAgencies.forEach(peer => {
            const peerCount = allJobs.filter(job => job.short_agency?.toLowerCase().includes(peer.toLowerCase()) ||
                peer.toLowerCase().includes(job.short_agency?.toLowerCase() || '')).length;
            if (peerCount > 0) {
                peerJobCounts.set(peer, peerCount);
            }
        });
        const allPeerCounts = [...peerJobCounts.values(), agencyJobs.length].sort((a, b) => b - a);
        const yourRank = allPeerCounts.indexOf(agencyJobs.length) + 1;
        const avgPostingsInGroup = peerJobCounts.size > 0
            ? Array.from(peerJobCounts.values()).reduce((a, b) => a + b, 0) / peerJobCounts.size
            : 0;
        const peerGroupComparison = {
            peerGroupName: peerGroup?.name || 'Unknown',
            peerGroupTier: peerGroup?.tier || 4,
            peerAgencies,
            yourRankInGroup: yourRank,
            avgPostingsInGroup,
            yourPostings: agencyJobs.length,
            performanceVsPeers: agencyJobs.length > avgPostingsInGroup * 1.1
                ? 'above'
                : agencyJobs.length < avgPostingsInGroup * 0.9
                    ? 'below'
                    : 'at'
        };
        const competitorAnalysis = this.analyzeCompetitors(agency, agencyJobs, allJobs);
        const categoryCompetition = this.analyzeCategoryCompetition(agency, agencyJobs, allJobs);
        return {
            marketPosition,
            peerGroupComparison,
            competitorAnalysis,
            categoryCompetition
        };
    }
    getAgencyJobs(agency, startDate, endDate) {
        const jobs = sqlite_1.default.prepare(`
      SELECT * FROM jobs 
      WHERE (LOWER(short_agency) LIKE LOWER(?) OR LOWER(long_agency) LIKE LOWER(?))
      AND posting_date >= ? 
      AND posting_date <= ?
    `).all(`%${agency}%`, `%${agency}%`, startDate, endDate);
        return jobs;
    }
    getPreviousPeriodJobs(agency, startDate) {
        const prevEnd = new Date(startDate);
        prevEnd.setDate(prevEnd.getDate() - 1);
        const prevStart = new Date(prevEnd);
        prevStart.setMonth(prevStart.getMonth() - 1);
        const jobs = sqlite_1.default.prepare(`
      SELECT * FROM jobs 
      WHERE (LOWER(short_agency) LIKE LOWER(?) OR LOWER(long_agency) LIKE LOWER(?))
      AND posting_date >= ? 
      AND posting_date <= ?
    `).all(`%${agency}%`, `%${agency}%`, prevStart.toISOString().split('T')[0], prevEnd.toISOString().split('T')[0]);
        return jobs;
    }
    getAllJobs(startDate, endDate) {
        const jobs = sqlite_1.default.prepare(`
      SELECT * FROM jobs 
      WHERE posting_date >= ? 
      AND posting_date <= ?
    `).all(startDate, endDate);
        return jobs;
    }
    getUniqueAgencies(jobs) {
        const agencyMap = new Map();
        jobs.forEach(job => {
            const agency = job.short_agency || job.long_agency || 'Unknown';
            agencyMap.set(agency, (agencyMap.get(agency) || 0) + 1);
        });
        return Array.from(agencyMap.entries())
            .map(([agency, count]) => ({ agency, count }))
            .sort((a, b) => b.count - a.count);
    }
    getAgencyInfo(agency, jobs) {
        const longName = jobs[0]?.long_agency || agency;
        const peerGroup = (0, peerGroups_1.getAgencyPeerGroup)(agency);
        return {
            shortName: agency,
            longName,
            logoPath: (0, agencyLogos_1.getAgencyLogo)(agency),
            peerGroup: peerGroup?.name || 'Unknown',
            tier: peerGroup?.tier || 4
        };
    }
    calculateVolumeMetrics(currentJobs, previousJobs) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const activePostings = currentJobs.filter(job => {
            if (!job.apply_until)
                return false;
            const deadline = new Date(job.apply_until);
            return deadline >= today;
        }).length;
        const closingSoonPostings = currentJobs.filter(job => {
            if (!job.apply_until)
                return false;
            const deadline = new Date(job.apply_until);
            const daysRemaining = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return daysRemaining >= 0 && daysRemaining <= 14;
        }).length;
        const expiredPostings = currentJobs.filter(job => {
            if (!job.apply_until)
                return true;
            const deadline = new Date(job.apply_until);
            return deadline < today;
        }).length;
        const monthOverMonthChange = previousJobs.length > 0
            ? ((currentJobs.length - previousJobs.length) / previousJobs.length) * 100
            : 0;
        return {
            totalPostings: currentJobs.length,
            activePostings,
            closingSoonPostings,
            expiredPostings,
            newPostingsThisMonth: currentJobs.length,
            previousMonthPostings: previousJobs.length,
            monthOverMonthChange
        };
    }
    calculateApplicationMetrics(jobs) {
        const applicationWindows = jobs.map(job => {
            const posted = new Date(job.posting_date);
            const deadline = new Date(job.apply_until);
            return Math.ceil((deadline.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24));
        }).filter(w => w > 0 && w < 365);
        if (applicationWindows.length === 0) {
            return {
                avgApplicationWindow: 0,
                medianApplicationWindow: 0,
                minApplicationWindow: 0,
                maxApplicationWindow: 0,
                urgentPositionsCount: 0,
                urgentPositionsPercentage: 0
            };
        }
        const sorted = [...applicationWindows].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)] || 0;
        const avg = applicationWindows.reduce((a, b) => a + b, 0) / applicationWindows.length;
        const urgentCount = jobs.filter(job => {
            const deadline = new Date(job.apply_until);
            const daysRemaining = Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            return daysRemaining > 0 && daysRemaining <= 14;
        }).length;
        return {
            avgApplicationWindow: Math.round(avg * 10) / 10,
            medianApplicationWindow: median,
            minApplicationWindow: Math.min(...applicationWindows),
            maxApplicationWindow: Math.max(...applicationWindows),
            urgentPositionsCount: urgentCount,
            urgentPositionsPercentage: (urgentCount / jobs.length) * 100
        };
    }
    calculateWorkforceComposition(jobs) {
        return {
            gradeDistribution: this.calculateGradeDistribution(jobs),
            seniorityDistribution: this.calculateSeniorityDistribution(jobs),
            staffTypeBreakdown: this.calculateStaffTypeBreakdown(jobs),
            locationDistribution: this.calculateLocationDistribution(jobs),
            languageRequirements: this.calculateLanguageRequirements(jobs)
        };
    }
    calculateGradeDistribution(jobs) {
        const gradeMap = new Map();
        jobs.forEach(job => {
            const grade = job.up_grade || 'Unspecified';
            gradeMap.set(grade, (gradeMap.get(grade) || 0) + 1);
        });
        const total = jobs.length;
        return Array.from(gradeMap.entries())
            .map(([grade, count]) => ({
            grade,
            count,
            percentage: total > 0 ? (count / total) * 100 : 0
        }))
            .sort((a, b) => b.count - a.count);
    }
    calculateSeniorityDistribution(jobs) {
        const seniorityMap = new Map();
        jobs.forEach(job => {
            const seniority = job.seniority_level || this.inferSeniority(job.up_grade || '', job.title || '');
            seniorityMap.set(seniority, (seniorityMap.get(seniority) || 0) + 1);
        });
        const total = jobs.length;
        return Array.from(seniorityMap.entries())
            .map(([level, count]) => ({
            level,
            count,
            percentage: total > 0 ? (count / total) * 100 : 0
        }))
            .sort((a, b) => b.count - a.count);
    }
    inferSeniority(grade, title) {
        const gradeLower = grade.toLowerCase();
        const titleLower = title.toLowerCase();
        if (gradeLower.includes('d-') || gradeLower.includes('usg') || gradeLower.includes('asg') ||
            titleLower.includes('director') || titleLower.includes('chief')) {
            return 'Director';
        }
        if (gradeLower.includes('p-5') || gradeLower.includes('p5') ||
            titleLower.includes('senior')) {
            return 'Senior';
        }
        if (gradeLower.includes('p-4') || gradeLower.includes('p4') || gradeLower.includes('p-3') || gradeLower.includes('p3')) {
            return 'Mid';
        }
        if (gradeLower.includes('p-2') || gradeLower.includes('p2') || gradeLower.includes('p-1') || gradeLower.includes('p1')) {
            return 'Entry';
        }
        if (gradeLower.includes('g-') || gradeLower.includes('gs-')) {
            return 'Support';
        }
        return 'Other';
    }
    calculateStaffTypeBreakdown(jobs) {
        let international = 0, national = 0, consultant = 0, intern = 0, other = 0;
        jobs.forEach(job => {
            const title = (job.title || '').toLowerCase();
            const grade = (job.up_grade || '').toLowerCase();
            if (title.includes('intern') || grade.includes('intern')) {
                intern++;
            }
            else if (title.includes('consultant') || grade.includes('consultant') ||
                title.includes('contractor') || grade.includes('ssc') || grade.includes('iica')) {
                consultant++;
            }
            else if (grade.includes('no-') || grade.includes('g-') || grade.includes('gs-') ||
                grade.includes('npsa') || grade.includes('lica')) {
                national++;
            }
            else if (grade.includes('p-') || grade.includes('d-') || grade.includes('ipsa')) {
                international++;
            }
            else {
                other++;
            }
        });
        const total = jobs.length;
        return {
            international: { count: international, percentage: total > 0 ? (international / total) * 100 : 0 },
            national: { count: national, percentage: total > 0 ? (national / total) * 100 : 0 },
            consultant: { count: consultant, percentage: total > 0 ? (consultant / total) * 100 : 0 },
            intern: { count: intern, percentage: total > 0 ? (intern / total) * 100 : 0 },
            other: { count: other, percentage: total > 0 ? (other / total) * 100 : 0 }
        };
    }
    calculateLocationDistribution(jobs) {
        const locationMap = new Map();
        jobs.forEach(job => {
            const location = job.duty_station || job.duty_country || 'Unspecified';
            locationMap.set(location, (locationMap.get(location) || 0) + 1);
        });
        const total = jobs.length;
        return Array.from(locationMap.entries())
            .map(([station, count]) => ({
            station,
            count,
            percentage: total > 0 ? (count / total) * 100 : 0
        }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 15);
    }
    calculateLanguageRequirements(jobs) {
        const languageMap = new Map();
        jobs.forEach(job => {
            const languages = (job.languages || '').split(',').map((l) => l.trim()).filter((l) => l);
            languages.forEach((lang) => {
                languageMap.set(lang, (languageMap.get(lang) || 0) + 1);
            });
        });
        const total = jobs.length;
        const languageBreakdown = Array.from(languageMap.entries())
            .map(([language, count]) => ({
            language,
            count,
            percentage: total > 0 ? (count / total) * 100 : 0
        }))
            .sort((a, b) => b.count - a.count);
        const multilingualJobs = jobs.filter(job => {
            const languages = (job.languages || '').split(',').filter((l) => l.trim()).length;
            return languages > 1;
        }).length;
        return {
            languageBreakdown,
            multilingualPercentage: total > 0 ? (multilingualJobs / total) * 100 : 0
        };
    }
    calculateCategoryAnalysis(jobs, agency) {
        const categoryMap = new Map();
        jobs.forEach(job => {
            const category = job.primary_category || job.sectoral_category || 'Uncategorized';
            categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
        });
        const total = jobs.length;
        const distribution = Array.from(categoryMap.entries())
            .map(([category, count]) => ({
            category,
            count,
            percentage: total > 0 ? (count / total) * 100 : 0
        }))
            .sort((a, b) => b.count - a.count);
        const trendingCategories = distribution.slice(0, 3).map(c => c.category);
        const emergingCategories = [];
        const categoryDiversity = this.calculateDiversityIndex(distribution.map(d => d.count));
        return {
            distribution,
            trendingCategories,
            emergingCategories,
            categoryDiversity
        };
    }
    calculateDiversityIndex(counts) {
        const total = counts.reduce((a, b) => a + b, 0);
        if (total === 0)
            return 0;
        const proportions = counts.map(c => c / total).filter(p => p > 0);
        const entropy = -proportions.reduce((sum, p) => sum + p * Math.log(p), 0);
        const maxEntropy = Math.log(counts.length);
        return maxEntropy > 0 ? (entropy / maxEntropy) * 100 : 0;
    }
    calculateGeographicAnalysis(jobs) {
        const regionMap = new Map();
        jobs.forEach(job => {
            const region = job.duty_continent || this.inferRegion(job.duty_country || '');
            regionMap.set(region, (regionMap.get(region) || 0) + 1);
        });
        const total = jobs.length;
        const regionDistribution = Array.from(regionMap.entries())
            .map(([region, count]) => ({
            region,
            count,
            percentage: total > 0 ? (count / total) * 100 : 0
        }))
            .sort((a, b) => b.count - a.count);
        const stationMap = new Map();
        jobs.forEach(job => {
            const station = job.duty_station || job.duty_country || 'Unspecified';
            stationMap.set(station, (stationMap.get(station) || 0) + 1);
        });
        const topDutyStations = Array.from(stationMap.entries())
            .map(([station, count]) => ({
            station,
            count,
            percentage: total > 0 ? (count / total) * 100 : 0
        }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 15);
        const hqLocations = ['New York', 'Geneva', 'Vienna', 'Rome', 'Paris', 'Nairobi', 'Bangkok', 'Copenhagen', 'Washington'];
        let hqCount = 0, fieldCount = 0, remoteCount = 0;
        jobs.forEach(job => {
            const station = (job.duty_station || '').toLowerCase();
            const country = (job.duty_country || '').toLowerCase();
            if (station.includes('home') || station.includes('remote')) {
                remoteCount++;
            }
            else if (hqLocations.some(hq => station.includes(hq.toLowerCase()) || country.includes(hq.toLowerCase()))) {
                hqCount++;
            }
            else {
                fieldCount++;
            }
        });
        return {
            regionDistribution,
            topDutyStations,
            hqVsFieldRatio: {
                hq: { count: hqCount, percentage: total > 0 ? (hqCount / total) * 100 : 0 },
                field: { count: fieldCount, percentage: total > 0 ? (fieldCount / total) * 100 : 0 },
                remote: { count: remoteCount, percentage: total > 0 ? (remoteCount / total) * 100 : 0 }
            }
        };
    }
    inferRegion(country) {
        const countryLower = country.toLowerCase();
        const regionMap = {
            'Africa': ['kenya', 'nigeria', 'ethiopia', 'south africa', 'egypt', 'morocco', 'senegal', 'tanzania', 'uganda', 'sudan', 'ghana'],
            'Asia': ['india', 'china', 'japan', 'thailand', 'indonesia', 'philippines', 'vietnam', 'bangladesh', 'pakistan', 'afghanistan', 'myanmar'],
            'Europe': ['switzerland', 'austria', 'belgium', 'france', 'germany', 'italy', 'netherlands', 'spain', 'uk', 'denmark', 'sweden', 'norway'],
            'Americas': ['united states', 'usa', 'brazil', 'mexico', 'colombia', 'peru', 'argentina', 'chile', 'canada'],
            'Middle East': ['jordan', 'lebanon', 'syria', 'iraq', 'yemen', 'palestine', 'israel', 'turkey', 'iran', 'uae', 'saudi arabia'],
            'Oceania': ['australia', 'new zealand', 'fiji', 'papua new guinea']
        };
        for (const [region, countries] of Object.entries(regionMap)) {
            if (countries.some(c => countryLower.includes(c))) {
                return region;
            }
        }
        return 'Other';
    }
    calculateTemporalAnalysis(jobs) {
        const monthMap = new Map();
        jobs.forEach(job => {
            const date = new Date(job.posting_date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + 1);
        });
        const postingsByMonth = Array.from(monthMap.entries())
            .map(([month, count]) => ({ month, count }))
            .sort((a, b) => a.month.localeCompare(b.month));
        const weekdayMap = new Map();
        const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        jobs.forEach(job => {
            const date = new Date(job.posting_date);
            const weekday = weekdays[date.getDay()] || 'Unknown';
            weekdayMap.set(weekday, (weekdayMap.get(weekday) || 0) + 1);
        });
        const weekdayDistribution = Array.from(weekdayMap.entries())
            .map(([weekday, count]) => ({ weekday, count }));
        const peakDay = weekdayDistribution.reduce((max, curr) => curr.count > max.count ? curr : max, { weekday: 'Unknown', count: 0 }).weekday;
        return {
            postingsByMonth,
            weekdayDistribution,
            peakPostingDay: peakDay
        };
    }
    calculateMarketAverages(allJobs) {
        const agencies = this.getUniqueAgencies(allJobs);
        const avgPostingsPerAgency = agencies.length > 0
            ? allJobs.length / agencies.length
            : 0;
        const applicationWindows = allJobs.map(job => {
            const posted = new Date(job.posting_date);
            const deadline = new Date(job.apply_until);
            return Math.ceil((deadline.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24));
        }).filter(w => w > 0 && w < 365);
        const avgWindow = applicationWindows.length > 0
            ? applicationWindows.reduce((a, b) => a + b, 0) / applicationWindows.length
            : 30;
        return {
            avgPostingsPerAgency: Math.round(avgPostingsPerAgency),
            avgApplicationWindow: Math.round(avgWindow),
            avgActivePositions: Math.round(allJobs.filter(j => !j.archived && new Date(j.apply_until) > new Date()).length / agencies.length),
            marketTotalVolume: allJobs.length
        };
    }
    calculatePeerAverages(peerJobs, peerAgencies) {
        const avgPostingsPerPeer = peerAgencies.length > 0
            ? peerJobs.length / peerAgencies.length
            : 0;
        return {
            avgPostingsPerPeer: Math.round(avgPostingsPerPeer),
            totalPeersActive: peerAgencies.length,
            peerGroupVolume: peerJobs.length
        };
    }
    calculateIndustryStandards(allJobs) {
        return {
            targetApplicationWindow: 45,
            targetActivePositionRatio: 0.7,
            targetCategoryDiversity: 0.6
        };
    }
    analyzeCompetitors(agency, agencyJobs, allJobs) {
        const agencies = this.getUniqueAgencies(allJobs);
        const agencyCategories = new Set(agencyJobs.map(j => j.primary_category).filter(Boolean));
        return agencies
            .filter(a => !a.agency.toLowerCase().includes(agency.toLowerCase()))
            .slice(0, 5)
            .map(comp => {
            const compJobs = allJobs.filter(j => j.short_agency?.toLowerCase() === comp.agency.toLowerCase());
            const compCategories = new Set(compJobs.map(j => j.primary_category).filter(Boolean));
            const overlap = [...agencyCategories].filter(c => compCategories.has(c)).length;
            return {
                agency: comp.agency,
                volume: comp.count,
                categoryOverlap: overlap,
                competitionLevel: overlap > 3 ? 'high' : overlap > 1 ? 'medium' : 'low'
            };
        });
    }
    analyzeCategoryCompetition(agency, agencyJobs, allJobs) {
        const categoryMap = new Map();
        allJobs.forEach(job => {
            const category = job.primary_category || 'Uncategorized';
            if (!categoryMap.has(category)) {
                categoryMap.set(category, { total: 0, agencies: new Set() });
            }
            const data = categoryMap.get(category);
            data.total++;
            if (job.short_agency)
                data.agencies.add(job.short_agency);
        });
        const agencyCategories = new Map();
        agencyJobs.forEach(job => {
            const category = job.primary_category || 'Uncategorized';
            agencyCategories.set(category, (agencyCategories.get(category) || 0) + 1);
        });
        return Array.from(agencyCategories.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([category, agencyCount]) => {
            const marketData = categoryMap.get(category) || { total: 0, agencies: new Set() };
            return {
                category,
                agencyShare: marketData.total > 0 ? (agencyCount / marketData.total) * 100 : 0,
                totalMarketVolume: marketData.total,
                competitorsCount: marketData.agencies.size,
                agencyRank: 1
            };
        });
    }
}
exports.ReportDataAggregator = ReportDataAggregator;
exports.default = ReportDataAggregator;
//# sourceMappingURL=ReportDataAggregator.js.map