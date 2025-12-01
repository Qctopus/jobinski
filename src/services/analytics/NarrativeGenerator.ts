/**
 * Narrative Generator
 * 
 * Generates natural language narratives from metrics and data.
 * Creates readable, insightful sentences for the Intelligence Tab.
 */

import { format } from 'date-fns';
import { 
  VolumeMetrics, 
  WorkforcePatternMetrics, 
  GeographicMetrics, 
  CategoryMetrics, 
  CompetitiveMetrics,
  ExecutiveSummary,
  AnomalySignal
} from './IntelligenceInsightsEngine';

// ============ TYPES ============

export interface NarrativeOptions {
  agencyName?: string;
  periodLabel?: string;
  isAgencyView: boolean;
  includeComparisons: boolean;
}

export interface GeneratedNarrative {
  headline: string;
  body: string[];
  highlights: string[];
  callouts: { type: 'positive' | 'negative' | 'neutral'; text: string }[];
}

// ============ HELPER FUNCTIONS ============

const formatNumber = (n: number): string => {
  if (n >= 1000) {
    return n.toLocaleString();
  }
  return String(n);
};

const formatPercent = (n: number, decimals = 0): string => {
  return `${n.toFixed(decimals)}%`;
};

const formatChange = (n: number, decimals = 0): string => {
  const abs = Math.abs(n);
  const sign = n >= 0 ? '+' : '';
  return `${sign}${abs.toFixed(decimals)}${n !== 0 ? '%' : ''}`;
};

const formatChangeDescription = (change: number, threshold = 5): string => {
  if (Math.abs(change) < threshold) return 'unchanged from';
  return change > 0 ? 'up from' : 'down from';
};

const getChangeWord = (change: number): string => {
  if (Math.abs(change) < 3) return 'steady';
  if (Math.abs(change) < 10) return change > 0 ? 'increased' : 'decreased';
  if (Math.abs(change) < 25) return change > 0 ? 'grew significantly' : 'declined notably';
  return change > 0 ? 'surged' : 'dropped sharply';
};

const getMagnitudeWord = (value: number, thresholds: [number, number, number]): string => {
  if (value >= thresholds[2]) return 'highest';
  if (value >= thresholds[1]) return 'high';
  if (value <= thresholds[0]) return 'low';
  return 'moderate';
};

// ============ NARRATIVE GENERATORS ============

export class NarrativeGenerator {
  private options: NarrativeOptions;
  
  constructor(options: NarrativeOptions) {
    this.options = options;
  }
  
  // ============ VOLUME NARRATIVES ============
  
  generateVolumeNarrative(metrics: VolumeMetrics): GeneratedNarrative {
    const { 
      totalPositions, 
      previousPeriodPositions, 
      volumeChange, 
      weeklyVelocity, 
      previousWeeklyVelocity,
      vs12moAvg,
      accelerationPattern,
      peakWeek
    } = metrics;
    
    const subject = this.options.isAgencyView && this.options.agencyName 
      ? this.options.agencyName 
      : 'The market';
    
    // Headline
    let headline = `${subject} posted ${formatNumber(totalPositions)} positions`;
    if (this.options.periodLabel) {
      headline += ` over ${this.options.periodLabel}`;
    }
    
    // Body sentences
    const body: string[] = [];
    
    // Volume change narrative
    if (Math.abs(volumeChange) > 2) {
      body.push(
        `This represents a ${Math.abs(volumeChange).toFixed(0)}% ${volumeChange > 0 ? 'increase' : 'decrease'} from the prior period (${formatNumber(previousPeriodPositions)} positions).`
      );
    }
    
    // Velocity narrative
    body.push(
      `Hiring velocity averaged ${weeklyVelocity.toFixed(1)} positions per week, ${formatChangeDescription(weeklyVelocity - previousWeeklyVelocity)} ${previousWeeklyVelocity.toFixed(1)}/week previously.`
    );
    
    // 12-month comparison
    if (Math.abs(vs12moAvg) > 5) {
      body.push(
        `This is ${Math.abs(vs12moAvg).toFixed(0)}% ${vs12moAvg > 0 ? 'above' : 'below'} the trailing 12-month weekly average.`
      );
    }
    
    // Acceleration pattern
    if (accelerationPattern !== 'steady') {
      body.push(
        `Hiring velocity ${accelerationPattern === 'accelerating' ? 'accelerated in the later weeks' : 'slowed in the later weeks'} of the period.`
      );
    }
    
    // Highlights
    const highlights: string[] = [];
    if (peakWeek) {
      highlights.push(`Peak: Week of ${peakWeek.week} (${peakWeek.count} positions)`);
    }
    
    // Callouts
    const callouts: { type: 'positive' | 'negative' | 'neutral'; text: string }[] = [];
    if (volumeChange > 20) {
      callouts.push({ type: 'positive', text: 'Significant hiring surge' });
    } else if (volumeChange < -20) {
      callouts.push({ type: 'negative', text: 'Notable hiring slowdown' });
    }
    
    if (accelerationPattern === 'accelerating') {
      callouts.push({ type: 'positive', text: 'Momentum building' });
    }
    
    return { headline, body, highlights, callouts };
  }
  
  // ============ WORKFORCE NARRATIVES ============
  
  generateWorkforceNarrative(metrics: WorkforcePatternMetrics): GeneratedNarrative {
    const { staffRatio, gradeDistribution, categoryStaffPatterns, gradeAnomalies } = metrics;
    
    const subject = this.options.isAgencyView && this.options.agencyName 
      ? this.options.agencyName 
      : 'The market';
    
    // Headline
    const headline = `Non-staff positions made up ${formatPercent(100 - staffRatio.current)} of postings`;
    
    // Body
    const body: string[] = [];
    
    // Staff ratio change
    if (Math.abs(staffRatio.change) > 2) {
      body.push(
        `This ${staffRatio.change > 0 ? 'decreased from' : 'increased from'} ${formatPercent(100 - staffRatio.previous)} in the prior period.`
      );
    }
    
    // Market comparison (agency view)
    if (this.options.isAgencyView && Math.abs(staffRatio.current - staffRatio.market) > 5) {
      body.push(
        `The system average is ${formatPercent(100 - staffRatio.market)}. ${subject} is ${staffRatio.current > staffRatio.market ? 'more staff-focused' : 'more consultant-reliant'} than the market.`
      );
    }
    
    // Top grade shifts
    const significantShifts = gradeDistribution.filter(g => Math.abs(g.change) > 3);
    if (significantShifts.length > 0) {
      const topShift = significantShifts.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))[0];
      body.push(
        `${topShift.tier} hiring ${topShift.change > 0 ? 'increased' : 'decreased'} by ${Math.abs(topShift.change).toFixed(1)} percentage points.`
      );
    }
    
    // Category staff patterns (agency view)
    if (this.options.isAgencyView && categoryStaffPatterns.length > 0) {
      const mostDifferent = categoryStaffPatterns.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))[0];
      if (Math.abs(mostDifferent.diff) > 10) {
        body.push(
          `In ${mostDifferent.category}, ${subject} hires ${formatPercent(mostDifferent.yourStaffRatio)} staff while the market hires ${formatPercent(mostDifferent.marketStaffRatio)} staff.`
        );
      }
    }
    
    // Grade anomalies
    if (gradeAnomalies.length > 0) {
      const topAnomaly = gradeAnomalies.sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation))[0];
      if (topAnomaly.deviation > 0.5) {
        body.push(
          `${topAnomaly.tier} positions are ${(topAnomaly.deviation * 100).toFixed(0)}% above the historical average — an unusual spike.`
        );
      }
    }
    
    // Highlights
    const highlights: string[] = [];
    if (categoryStaffPatterns.length > 0 && categoryStaffPatterns[0].topCompetitor) {
      const top = categoryStaffPatterns[0];
      highlights.push(
        `In ${top.category}: You ${formatPercent(top.yourStaffRatio)} staff vs ${top.topCompetitor.name} ${formatPercent(top.topCompetitor.staffRatio)} staff`
      );
    }
    
    // Callouts
    const callouts: { type: 'positive' | 'negative' | 'neutral'; text: string }[] = [];
    if (staffRatio.current < 50) {
      callouts.push({ type: 'neutral', text: 'High consultant reliance' });
    }
    if (gradeAnomalies.some(a => a.tier === 'Executive' && a.deviation > 0.5)) {
      callouts.push({ type: 'neutral', text: 'Unusual senior hiring' });
    }
    
    return { headline, body, highlights, callouts };
  }
  
  // ============ GEOGRAPHY NARRATIVES ============
  
  generateGeographyNarrative(metrics: GeographicMetrics): GeneratedNarrative {
    const { 
      fieldRatio, 
      locationTypeDistribution, 
      topLocations, 
      newLocations,
      conflictZoneHiring,
      regionBreakdown
    } = metrics;
    
    const subject = this.options.isAgencyView && this.options.agencyName 
      ? this.options.agencyName 
      : 'The market';
    
    // Headline
    const headline = `Field positions represented ${formatPercent(fieldRatio.current)} of postings`;
    
    // Body
    const body: string[] = [];
    
    // Field ratio change
    if (Math.abs(fieldRatio.change) > 3) {
      body.push(
        `This is ${fieldRatio.change > 0 ? 'up' : 'down'} from ${formatPercent(fieldRatio.previous)} in the prior period — ${fieldRatio.change > 0 ? 'expanding' : 'contracting'} field presence.`
      );
    }
    
    // Top locations with change
    const topGrowing = topLocations.filter(l => l.change > 2).sort((a, b) => b.change - a.change);
    const topDeclining = topLocations.filter(l => l.change < -2).sort((a, b) => a.change - b.change);
    
    if (topGrowing.length > 0) {
      const top = topGrowing.slice(0, 2);
      body.push(
        `Largest increases: ${top.map(l => `${l.location} (+${l.change})`).join(', ')}.`
      );
    }
    
    if (topDeclining.length > 0) {
      const top = topDeclining.slice(0, 2);
      body.push(
        `Largest decreases: ${top.map(l => `${l.location} (${l.change})`).join(', ')}.`
      );
    }
    
    // New locations
    if (newLocations.length > 0) {
      body.push(
        `New duty stations not seen in the prior 12 months: ${newLocations.slice(0, 3).join(', ')}.`
      );
    }
    
    // Conflict zone insight
    if (conflictZoneHiring.count > 0) {
      body.push(
        `Conflict zone hiring: ${conflictZoneHiring.count} positions (${formatPercent(conflictZoneHiring.percentage)} of total). Staff ratio in conflict zones: ${formatPercent(conflictZoneHiring.staffRatio)} vs market ${formatPercent(conflictZoneHiring.marketStaffRatio)}.`
      );
    }
    
    // Regional breakdown
    const topRegion = regionBreakdown[0];
    if (topRegion && topRegion.percentage > 30) {
      body.push(
        `${topRegion.region} leads with ${formatPercent(topRegion.percentage)} of positions.`
      );
    }
    
    // Highlights
    const highlights: string[] = [];
    topLocations.slice(0, 3).forEach(l => {
      highlights.push(`${l.location}: ${l.count} positions`);
    });
    
    // Callouts
    const callouts: { type: 'positive' | 'negative' | 'neutral'; text: string }[] = [];
    if (fieldRatio.current > 70) {
      callouts.push({ type: 'positive', text: 'Strong field presence' });
    } else if (fieldRatio.current < 40) {
      callouts.push({ type: 'neutral', text: 'HQ-concentrated footprint' });
    }
    
    if (newLocations.length >= 3) {
      callouts.push({ type: 'positive', text: 'Geographic expansion' });
    }
    
    return { headline, body, highlights, callouts };
  }
  
  // ============ CATEGORY NARRATIVES ============
  
  generateCategoryNarrative(metrics: CategoryMetrics): GeneratedNarrative {
    const { 
      topCategories, 
      fastestGrowing, 
      declining, 
      concentration 
    } = metrics;
    
    const subject = this.options.isAgencyView && this.options.agencyName 
      ? this.options.agencyName 
      : 'The market';
    
    // Headline
    const topCategory = topCategories[0];
    const headline = topCategory 
      ? `${topCategory.category} led at ${formatPercent(topCategory.percentage)} of postings`
      : 'Balanced category distribution';
    
    // Body
    const body: string[] = [];
    
    // Top categories
    if (topCategories.length >= 3) {
      body.push(
        `Top 3: ${topCategories.slice(0, 3).map(c => `${c.category} (${formatPercent(c.percentage)})`).join(', ')}.`
      );
    }
    
    // Fastest growing
    if (fastestGrowing.length > 0) {
      const top = fastestGrowing[0];
      body.push(
        `${top.category} grew fastest at ${formatChange(top.growthRate)} vs prior period.`
      );
    }
    
    // Declining
    if (declining.length > 0) {
      const top = declining[0];
      body.push(
        `${top.category} declined by ${top.declineRate.toFixed(0)}%.`
      );
    }
    
    // Concentration
    body.push(
      `Top 3 concentration: ${formatPercent(concentration.top3Share)} (${concentration.change > 0 ? 'more' : 'less'} concentrated than prior period).`
    );
    
    // Competitive position (agency view)
    if (this.options.isAgencyView && topCategories.some(c => c.marketRank)) {
      const bestRank = topCategories.filter(c => c.marketRank).sort((a, b) => (a.marketRank || 99) - (b.marketRank || 99))[0];
      if (bestRank && bestRank.marketRank && bestRank.marketRank <= 3) {
        body.push(
          `Strongest market position: #${bestRank.marketRank} in ${bestRank.category}.`
        );
      }
    }
    
    // Staff ratio comparison (agency view)
    if (this.options.isAgencyView && topCategories.length > 0) {
      const mostDifferent = topCategories.sort((a, b) => 
        Math.abs(b.yourStaffRatio - b.competitorStaffRatio) - Math.abs(a.yourStaffRatio - a.competitorStaffRatio)
      )[0];
      
      if (Math.abs(mostDifferent.yourStaffRatio - mostDifferent.competitorStaffRatio) > 15) {
        body.push(
          `In ${mostDifferent.category}, hiring approach differs: ${formatPercent(mostDifferent.yourStaffRatio)} staff vs market ${formatPercent(mostDifferent.competitorStaffRatio)}.`
        );
      }
    }
    
    // Highlights
    const highlights: string[] = [];
    fastestGrowing.slice(0, 2).forEach(c => {
      highlights.push(`📈 ${c.category}: ${formatChange(c.growthRate)}`);
    });
    declining.slice(0, 2).forEach(c => {
      highlights.push(`📉 ${c.category}: -${c.declineRate.toFixed(0)}%`);
    });
    
    // Callouts
    const callouts: { type: 'positive' | 'negative' | 'neutral'; text: string }[] = [];
    if (concentration.top3Share > 60) {
      callouts.push({ type: 'neutral', text: 'High category concentration' });
    }
    if (fastestGrowing.some(c => c.growthRate > 50)) {
      callouts.push({ type: 'positive', text: 'Emerging focus area' });
    }
    
    return { headline, body, highlights, callouts };
  }
  
  // ============ COMPETITIVE NARRATIVES ============
  
  generateCompetitiveNarrative(metrics: CompetitiveMetrics): GeneratedNarrative {
    const { 
      marketShare, 
      rank, 
      peerGroupPerformance, 
      competitorPatterns,
      categoryPosition,
      newCompetitorMoves
    } = metrics;
    
    const subject = this.options.agencyName || 'Selected agency';
    
    // Headline
    let headline = `Ranked #${rank.current} of ${rank.total} agencies`;
    if (rank.change !== 0) {
      headline += ` (${rank.change > 0 ? '↑' : '↓'} ${Math.abs(rank.change)} from prior period)`;
    }
    
    // Body
    const body: string[] = [];
    
    // Market share
    body.push(
      `Market share: ${formatPercent(marketShare.current, 1)}${Math.abs(marketShare.change) > 0.2 ? ` (${formatChange(marketShare.change, 1)} from ${formatPercent(marketShare.previous, 1)})` : ''}.`
    );
    
    // Peer group comparison
    if (peerGroupPerformance.length > 0) {
      const you = peerGroupPerformance.find(p => p.isYou);
      const peerRank = peerGroupPerformance.findIndex(p => p.isYou) + 1;
      
      if (you && peerRank > 0) {
        body.push(
          `Within peer group: #${peerRank} by volume, ${you.seniorRatio > peerGroupPerformance.reduce((sum, p) => sum + p.seniorRatio, 0) / peerGroupPerformance.length ? 'above' : 'below'} average in senior hiring.`
        );
      }
    }
    
    // Top competitor pattern
    if (competitorPatterns.length > 0) {
      const topCorrelated = competitorPatterns.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))[0];
      if (Math.abs(topCorrelated.correlation) > 0.5) {
        body.push(
          `${topCorrelated.agency}'s hiring pattern correlates ${(topCorrelated.correlation).toFixed(2)} with yours — likely competing for similar talent. ${topCorrelated.keyDifference ? `Key difference: ${topCorrelated.keyDifference}.` : ''}`
        );
      }
    }
    
    // Category position
    if (categoryPosition.length > 0) {
      const leadingCategories = categoryPosition.filter(c => c.yourRank <= 3);
      if (leadingCategories.length > 0) {
        body.push(
          `Top 3 position in: ${leadingCategories.map(c => c.category).join(', ')}.`
        );
      }
      
      const behindCategories = categoryPosition.filter(c => c.yourRank > 5 && c.leaderShare > 15);
      if (behindCategories.length > 0) {
        const top = behindCategories[0];
        body.push(
          `Gap to leader in ${top.category}: ${top.leader} holds ${formatPercent(top.leaderShare)} vs your ${formatPercent(top.yourShare)}.`
        );
      }
    }
    
    // New competitor moves
    if (newCompetitorMoves.length > 0) {
      body.push(
        `New competitor activity: ${newCompetitorMoves.slice(0, 2).map(m => `${m.agency} entered ${m.category}`).join('; ')}.`
      );
    }
    
    // Highlights
    const highlights: string[] = [];
    highlights.push(`Market share: ${formatPercent(marketShare.current, 1)}`);
    highlights.push(`System rank: #${rank.current} of ${rank.total}`);
    
    // Callouts
    const callouts: { type: 'positive' | 'negative' | 'neutral'; text: string }[] = [];
    if (rank.change > 0) {
      callouts.push({ type: 'positive', text: `Rank improved by ${rank.change}` });
    } else if (rank.change < 0) {
      callouts.push({ type: 'negative', text: `Rank dropped by ${Math.abs(rank.change)}` });
    }
    
    if (marketShare.change > 1) {
      callouts.push({ type: 'positive', text: 'Gaining market share' });
    } else if (marketShare.change < -1) {
      callouts.push({ type: 'negative', text: 'Losing market share' });
    }
    
    return { headline, body, highlights, callouts };
  }
  
  // ============ EXECUTIVE SUMMARY NARRATIVE ============
  
  generateExecutiveNarrative(summary: ExecutiveSummary): GeneratedNarrative {
    const { headline, keyPoints, volumeTrend, topShift, competitorAlert, anomalyCount } = summary;
    
    const body = [...keyPoints];
    
    if (topShift && topShift.description) {
      body.push(`Most significant shift: ${topShift.area} — ${topShift.description}.`);
    }
    
    if (competitorAlert) {
      body.push(`Competitive position: ${competitorAlert}.`);
    }
    
    if (anomalyCount > 0) {
      body.push(`${anomalyCount} notable anomalies detected — see Anomalies section for details.`);
    }
    
    // Highlights
    const highlights: string[] = [];
    highlights.push(`${formatNumber(volumeTrend.current)} positions (${formatChange(volumeTrend.change)})`);
    
    // Callouts
    const callouts: { type: 'positive' | 'negative' | 'neutral'; text: string }[] = [];
    if (volumeTrend.change > 15) {
      callouts.push({ type: 'positive', text: 'Hiring surge' });
    } else if (volumeTrend.change < -15) {
      callouts.push({ type: 'negative', text: 'Hiring slowdown' });
    }
    
    return { headline, body, highlights, callouts };
  }
  
  // ============ ANOMALY NARRATIVES ============
  
  formatAnomalyNarrative(anomaly: AnomalySignal): string {
    return `${anomaly.icon} ${anomaly.title}: ${anomaly.description}${anomaly.metric ? ` (${anomaly.metric})` : ''}${anomaly.context ? ` — ${anomaly.context}` : ''}`;
  }
}

// ============ FACTORY FUNCTION ============

export function createNarrativeGenerator(options: NarrativeOptions): NarrativeGenerator {
  return new NarrativeGenerator(options);
}

