/**
 * Intelligence Brief Generator
 * 
 * Generates McKinsey-style strategic intelligence briefs with narrative interpretation.
 * Leads with insight, supports with data. Every metric has context and "so what".
 */

import { ProcessedJobData } from '../../types';
import { classifyGrade, getConsolidatedTier } from '../../utils/gradeClassification';
import { parseISO, subWeeks, subMonths, isWithinInterval, differenceInDays, format, startOfWeek } from 'date-fns';
import { getAgencyPeerGroup, getPeerAgencies } from '../../config/peerGroups';

// ============ TYPES ============

export interface KeyMetric {
  label: string;
  value: string;
  change?: string;
  changeDirection?: 'up' | 'down' | 'neutral';
}

export interface ComparisonRow {
  label: string;
  values: { header: string; value: string; highlight?: boolean }[];
}

export interface StrategicFinding {
  headline: string;
  narrative: string;
  comparisonData?: ComparisonRow[];
  implication: string;
  priority: 'high' | 'medium';
}

export interface Signal {
  type: 'trend' | 'competitor' | 'risk' | 'geographic' | 'anomaly';
  observation: string;
  interpretation: string;
}

export interface ExecutiveSummary {
  paragraphs: string[];
  keyMetrics: KeyMetric[];
}

export interface IntelligenceBrief {
  generatedAt: Date;
  periodLabel: string;
  agencyName?: string;
  isAgencyView: boolean;
  executiveSummary: ExecutiveSummary;
  strategicFindings: StrategicFinding[];
  signals: Signal[];
}

// ============ HELPER FUNCTIONS ============

const formatNumber = (n: number): string => n.toLocaleString();
const formatPercent = (n: number, decimals = 0): string => `${n.toFixed(decimals)}%`;
const formatChange = (n: number): string => {
  if (Math.abs(n) < 1) return 'unchanged';
  return n > 0 ? `+${n.toFixed(0)}%` : `${n.toFixed(0)}%`;
};

const formatPPChange = (n: number): string => {
  if (Math.abs(n) < 1) return 'unchanged';
  return n > 0 ? `+${n.toFixed(0)}pp` : `${n.toFixed(0)}pp`;
};

const getChangeWord = (change: number, threshold = 20): string => {
  if (Math.abs(change) < 5) return 'remained steady at';
  if (Math.abs(change) < threshold) return change > 0 ? 'increased to' : 'decreased to';
  if (Math.abs(change) < 50) return change > 0 ? 'rose significantly to' : 'fell notably to';
  return change > 0 ? 'surged to' : 'dropped sharply to';
};

const getOrdinal = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

// ============ MAIN GENERATOR CLASS ============

export class IntelligenceBriefGenerator {
  private currentJobs: ProcessedJobData[] = [];
  private previousJobs: ProcessedJobData[] = [];
  private allMarketJobs: ProcessedJobData[] = [];
  private historicalJobs: ProcessedJobData[] = [];
  private agencyName: string | null = null;
  private periodLabel: string = '';
  private periodWeeks: number = 13;

  /**
   * Generate a complete intelligence brief
   */
  generate(
    allJobs: ProcessedJobData[],
    timeRange: string,
    agencyName?: string
  ): IntelligenceBrief {
    this.initialize(allJobs, timeRange, agencyName);

    const executiveSummary = this.generateExecutiveSummary();
    const strategicFindings = this.generateStrategicFindings();
    const signals = this.generateSignals();

    return {
      generatedAt: new Date(),
      periodLabel: this.periodLabel,
      agencyName: this.agencyName || undefined,
      isAgencyView: !!this.agencyName,
      executiveSummary,
      strategicFindings,
      signals
    };
  }

  private initialize(
    allJobs: ProcessedJobData[],
    timeRange: string,
    agencyName?: string
  ): void {
    const now = new Date();
    this.agencyName = agencyName || null;
    this.allMarketJobs = allJobs;

    // Calculate period boundaries
    const periodConfig = this.getPeriodConfig(timeRange);
    this.periodWeeks = periodConfig.weeks;

    const currentEnd = now;
    const currentStart = periodConfig.getStart(now);
    const previousEnd = currentStart;
    const previousStart = periodConfig.getStart(currentStart);
    const historicalStart = subMonths(now, 12);

    this.periodLabel = `${format(currentStart, 'MMM d')} – ${format(currentEnd, 'MMM d, yyyy')}`;

    // Filter jobs by period
    const currentMarket = this.filterJobsByPeriod(allJobs, currentStart, currentEnd);
    const previousMarket = this.filterJobsByPeriod(allJobs, previousStart, previousEnd);
    this.historicalJobs = this.filterJobsByPeriod(allJobs, historicalStart, now);

    // Apply agency filter
    if (agencyName) {
      this.currentJobs = currentMarket.filter(j => 
        (j.short_agency || j.long_agency) === agencyName
      );
      this.previousJobs = previousMarket.filter(j => 
        (j.short_agency || j.long_agency) === agencyName
      );
    } else {
      this.currentJobs = currentMarket;
      this.previousJobs = previousMarket;
    }
  }

  private getPeriodConfig(timeRange: string) {
    switch (timeRange) {
      case '4weeks':
        return { weeks: 4, getStart: (d: Date) => subWeeks(d, 4) };
      case '8weeks':
        return { weeks: 8, getStart: (d: Date) => subWeeks(d, 8) };
      case '3months':
        return { weeks: 13, getStart: (d: Date) => subMonths(d, 3) };
      case '6months':
        return { weeks: 26, getStart: (d: Date) => subMonths(d, 6) };
      case '1year':
        return { weeks: 52, getStart: (d: Date) => subMonths(d, 12) };
      default:
        return { weeks: 13, getStart: (d: Date) => subMonths(d, 3) };
    }
  }

  private filterJobsByPeriod(jobs: ProcessedJobData[], start: Date, end: Date): ProcessedJobData[] {
    return jobs.filter(job => {
      try {
        const postDate = parseISO(job.posting_date);
        return isWithinInterval(postDate, { start, end });
      } catch {
        return false;
      }
    });
  }

  // ============ EXECUTIVE SUMMARY ============

  private generateExecutiveSummary(): ExecutiveSummary {
    const paragraphs: string[] = [];
    const keyMetrics: KeyMetric[] = [];

    // Calculate core metrics
    const current = this.currentJobs;
    const previous = this.previousJobs;
    const market = this.getCurrentMarket();

    const volume = current.length;
    const prevVolume = previous.length;
    const volumeChange = prevVolume > 0 ? ((volume - prevVolume) / prevVolume) * 100 : 0;
    
    const marketShare = market.length > 0 ? (volume / market.length) * 100 : 0;
    const { rank, total } = this.calculateMarketRank();
    const prevRank = this.calculatePreviousMarketRank();
    const rankChange = prevRank - rank;

    const staffRatio = this.calculateStaffRatio(current);
    const prevStaffRatio = this.calculateStaffRatio(previous);
    const marketStaffRatio = this.calculateStaffRatio(market);

    const avgWindow = this.calculateAvgApplicationWindow(current);
    const marketAvgWindow = this.calculateAvgApplicationWindow(market);

    // Find top categories and their changes
    const categoryAnalysis = this.analyzeCategoryShifts();
    const topGrowingCategories = categoryAnalysis.slice(0, 2);

    // Paragraph 1: Volume & Position
    if (this.agencyName) {
      let p1 = `Over the past ${this.periodWeeks} weeks, ${this.agencyName} posted ${formatNumber(volume)} positions`;
      
      if (Math.abs(volumeChange) > 20) {
        p1 += ` — ${volumeChange > 0 ? 'a significant acceleration' : 'a notable slowdown'} `;
        p1 += volumeChange > 0 ? `that lifted you to` : `dropping you to`;
        p1 += ` #${rank} in UN system hiring with ${formatPercent(marketShare, 1)} market share.`;
      } else {
        p1 += `, ranking #${rank} of ${total} agencies with ${formatPercent(marketShare, 1)} market share.`;
      }

      if (topGrowingCategories.length > 0 && topGrowingCategories[0].absoluteChange > 10) {
        const top = topGrowingCategories[0];
        const second = topGrowingCategories[1];
        if (second && second.absoluteChange > 5) {
          p1 += ` This activity concentrated in two areas: ${top.name} (${top.previousCount > 0 ? `from ${top.previousCount} to ${top.currentCount}` : `${top.currentCount} positions`}) and ${second.name} (${second.previousCount > 0 ? `from ${second.previousCount} to ${second.currentCount}` : `${second.currentCount} positions`}).`;
        } else {
          p1 += ` The surge centered on ${top.name}, which ${top.previousCount > 0 ? `grew from ${top.previousCount} to ${top.currentCount} positions` : `contributed ${top.currentCount} positions`}.`;
        }
      }

      paragraphs.push(p1);

      // Paragraph 2: Strategic Shifts
      const staffDiff = staffRatio - marketStaffRatio;
      let p2 = '';
      
      if (Math.abs(staffDiff) > 10) {
        const staffChange = staffRatio - prevStaffRatio;
        p2 = `The most notable structural pattern is your ${staffRatio < 50 ? 'reliance on non-staff positions' : 'emphasis on permanent staff'}`;
        p2 += ` at ${formatPercent(100 - staffRatio)} non-staff`;
        if (Math.abs(staffChange) > 5) {
          p2 += ` (${staffChange > 0 ? 'down from' : 'up from'} ${formatPercent(100 - prevStaffRatio)})`;
        }
        p2 += ` — ${Math.abs(staffDiff).toFixed(0)} percentage points ${staffDiff < 0 ? 'above' : 'below'} the system average of ${formatPercent(100 - marketStaffRatio)}.`;
        
        // Add category-specific insight
        const categoryStaffPatterns = this.analyzeCategoryStaffPatterns();
        const mostDifferent = categoryStaffPatterns.find(c => Math.abs(c.yourRatio - c.marketRatio) > 20);
        if (mostDifferent) {
          p2 += ` In ${mostDifferent.category}, you hire ${formatPercent(100 - mostDifferent.yourRatio)} non-staff while the market hires ${formatPercent(100 - mostDifferent.marketRatio)}.`;
        }
      } else {
        // Alternative focus: geography or seniority
        const fieldRatio = this.calculateFieldRatio(current);
        const marketFieldRatio = this.calculateFieldRatio(market);
        if (Math.abs(fieldRatio - marketFieldRatio) > 15) {
          p2 = `Your geographic footprint is ${fieldRatio > marketFieldRatio ? 'more field-focused' : 'more HQ-concentrated'} than peers`;
          p2 += `, with ${formatPercent(fieldRatio)} field positions versus ${formatPercent(marketFieldRatio)} for the market.`;
        }
      }
      
      if (p2) paragraphs.push(p2);

      // Paragraph 3: Competitive Context
      const competitorAnalysis = this.analyzeCompetitorContext();
      if (competitorAnalysis.topPositions.length > 0 || competitorAnalysis.gaps.length > 0) {
        let p3 = 'Your competitive position ';
        
        if (rankChange > 0) {
          p3 += `strengthened this period. `;
        } else if (rankChange < 0) {
          p3 += `weakened slightly. `;
        } else {
          p3 += `remained stable. `;
        }

        if (competitorAnalysis.topPositions.length > 0) {
          const positions = competitorAnalysis.topPositions.slice(0, 2);
          p3 += `You hold ${positions.map(p => `#${p.rank} in ${p.category}`).join(' and ')}. `;
        }

        if (competitorAnalysis.gaps.length > 0) {
          const gap = competitorAnalysis.gaps[0];
          p3 += `However, ${gap.competitor} leads in ${gap.category} with ${formatPercent(gap.theirShare)} share versus your ${formatPercent(gap.yourShare)}.`;
        }

        paragraphs.push(p3);
      }

      // Paragraph 4: Key Tension or Risk
      const risks = this.identifyKeyRisks();
      if (risks.length > 0) {
        const topRisk = risks[0];
        paragraphs.push(`One pattern warrants attention: ${topRisk.description}`);
      }

    } else {
      // Market view summary
      let p1 = `The UN system posted ${formatNumber(volume)} positions over the past ${this.periodWeeks} weeks`;
      if (Math.abs(volumeChange) > 10) {
        p1 += ` — ${volumeChange > 0 ? 'up' : 'down'} ${Math.abs(volumeChange).toFixed(0)}% from the prior period.`;
      } else {
        p1 += `, relatively stable compared to the prior period.`;
      }

      if (topGrowingCategories.length > 0 && topGrowingCategories[0].growthRate > 30) {
        const top = topGrowingCategories[0];
        p1 += ` ${top.name} showed the strongest growth, ${top.previousCount > 0 ? `expanding from ${top.previousCount} to ${top.currentCount} positions` : `with ${top.currentCount} positions`}.`;
      }

      paragraphs.push(p1);

      // Market structure paragraph
      let p2 = `The market remains ${staffRatio > 60 ? 'staff-focused' : 'consultant-heavy'} with ${formatPercent(100 - staffRatio)} non-staff positions.`;
      
      const fieldRatio = this.calculateFieldRatio(current);
      p2 += ` ${formatPercent(fieldRatio)} of postings are field-based, with Africa and Asia-Pacific accounting for the largest regional shares.`;

      paragraphs.push(p2);

      // Top agencies paragraph
      const topAgencies = this.getTopAgencies();
      if (topAgencies.length >= 3) {
        paragraphs.push(
          `${topAgencies[0].name} leads the market with ${formatNumber(topAgencies[0].count)} positions (${formatPercent(topAgencies[0].share)}), followed by ${topAgencies[1].name} (${formatNumber(topAgencies[1].count)}) and ${topAgencies[2].name} (${formatNumber(topAgencies[2].count)}).`
        );
      }
    }

    // Key Metrics
    keyMetrics.push({
      label: 'Positions',
      value: formatNumber(volume),
      change: prevVolume > 0 && Math.abs(volumeChange) > 5 ? formatChange(volumeChange) : undefined,
      changeDirection: volumeChange > 5 ? 'up' : volumeChange < -5 ? 'down' : 'neutral'
    });

    if (this.agencyName) {
      keyMetrics.push({
        label: 'Market Rank',
        value: `#${rank}`,
        change: rankChange !== 0 ? `${rankChange > 0 ? '↑' : '↓'}${Math.abs(rankChange)}` : undefined,
        changeDirection: rankChange > 0 ? 'up' : rankChange < 0 ? 'down' : 'neutral'
      });
    }

    keyMetrics.push({
      label: 'Staff Ratio',
      value: formatPercent(staffRatio),
      changeDirection: 'neutral'
    });

    keyMetrics.push({
      label: 'Avg Window',
      value: `${avgWindow.toFixed(0)} days`,
      changeDirection: avgWindow < marketAvgWindow * 0.8 ? 'down' : 'neutral'
    });

    return { paragraphs, keyMetrics };
  }

  // ============ STRATEGIC FINDINGS ============

  private generateStrategicFindings(): StrategicFinding[] {
    const findings: StrategicFinding[] = [];
    const current = this.currentJobs;
    const previous = this.previousJobs;
    const market = this.getCurrentMarket();

    // Calculate all potential findings with significance scores
    const potentialFindings: Array<StrategicFinding & { significance: number }> = [];

    // Finding: Staff/Non-Staff Pattern
    const staffFinding = this.generateStaffPatternFinding(current, previous, market);
    if (staffFinding) potentialFindings.push(staffFinding);

    // Finding: Category Shifts
    const categoryFinding = this.generateCategoryShiftFinding(current, previous, market);
    if (categoryFinding) potentialFindings.push(categoryFinding);

    // Finding: Application Window Analysis
    const windowFinding = this.generateWindowFinding(current, market);
    if (windowFinding) potentialFindings.push(windowFinding);

    // Finding: Geographic Patterns
    const geoFinding = this.generateGeographyFinding(current, previous, market);
    if (geoFinding) potentialFindings.push(geoFinding);

    // Finding: Competitor Comparison (agency view only)
    if (this.agencyName) {
      const competitorFinding = this.generateCompetitorFinding(current, market);
      if (competitorFinding) potentialFindings.push(competitorFinding);
    }

    // Finding: Seniority Pattern
    const seniorityFinding = this.generateSeniorityFinding(current, previous, market);
    if (seniorityFinding) potentialFindings.push(seniorityFinding);

    // Sort by significance and take top 5
    potentialFindings.sort((a, b) => b.significance - a.significance);
    
    return potentialFindings.slice(0, 5).map(({ significance, ...finding }) => finding);
  }

  private generateStaffPatternFinding(
    current: ProcessedJobData[],
    previous: ProcessedJobData[],
    market: ProcessedJobData[]
  ): (StrategicFinding & { significance: number }) | null {
    const staffRatio = this.calculateStaffRatio(current);
    const prevStaffRatio = this.calculateStaffRatio(previous);
    const marketStaffRatio = this.calculateStaffRatio(market);
    
    const marketDiff = staffRatio - marketStaffRatio;
    const periodChange = staffRatio - prevStaffRatio;

    // Only significant if notably different from market or big change
    if (Math.abs(marketDiff) < 10 && Math.abs(periodChange) < 10) return null;

    const nonStaffRatio = 100 - staffRatio;
    const marketNonStaffRatio = 100 - marketStaffRatio;
    const subject = this.agencyName || 'The market';

    let headline = '';
    let narrative = '';
    let implication = '';
    let priority: 'high' | 'medium' = 'medium';

    if (Math.abs(marketDiff) > 20) {
      priority = 'high';
      if (staffRatio < marketStaffRatio) {
        headline = `${this.agencyName ? "You're" : "The market is"} Building Through Consultants, Not Permanent Staff`;
        narrative = `Non-staff positions reached ${formatPercent(nonStaffRatio)} this period — `;
        if (this.agencyName) {
          narrative += `${Math.abs(marketDiff).toFixed(0)} percentage points above the system average of ${formatPercent(marketNonStaffRatio)}. `;
        }
        narrative += `This pattern holds across most categories`;
        
        // Add category specifics
        const categoryPatterns = this.analyzeCategoryStaffPatterns();
        const highConsultant = categoryPatterns.filter(c => c.yourRatio < 40).slice(0, 3);
        if (highConsultant.length > 0) {
          narrative += `: ${highConsultant.map(c => `${c.category} (${formatPercent(100 - c.yourRatio)} consultant)`).join(', ')}.`;
        } else {
          narrative += `.`;
        }

        // Check for exceptions
        const exceptions = categoryPatterns.filter(c => c.yourRatio > 60);
        if (exceptions.length > 0) {
          narrative += ` The exception is ${exceptions[0].category}, where ${this.agencyName ? 'you maintain' : 'the market maintains'} ${formatPercent(exceptions[0].yourRatio)} staff.`;
        }

        implication = `This approach offers workforce agility but may limit institutional knowledge retention. Monitor whether critical functions are becoming over-dependent on rotating consultants.`;
      } else {
        headline = `${this.agencyName ? "You're" : "The market is"} Investing in Permanent Capacity`;
        narrative = `Staff positions account for ${formatPercent(staffRatio)} of postings — ${Math.abs(marketDiff).toFixed(0)} percentage points above the system average.`;
        implication = `This investment in permanent staff builds institutional capacity but reduces flexibility. Ensure this aligns with long-term workforce strategy.`;
      }
    } else if (Math.abs(periodChange) > 10) {
      headline = periodChange > 0 ? 'Shift Toward Permanent Staff' : 'Growing Reliance on Consultants';
      narrative = `Non-staff positions ${periodChange > 0 ? 'decreased to' : 'increased to'} ${formatPercent(nonStaffRatio)}, ${periodChange > 0 ? 'down from' : 'up from'} ${formatPercent(100 - prevStaffRatio)} in the prior period.`;
      implication = periodChange > 0 
        ? `This shift toward permanent staff suggests investment in institutional capacity.`
        : `This growing consultant reliance offers flexibility but may affect knowledge retention.`;
    }

    // Build comparison table
    const comparisonData: ComparisonRow[] = [];
    if (this.agencyName) {
      const peerAgencies = this.getPeerComparison();
      comparisonData.push({
        label: '',
        values: [
          { header: this.agencyName, value: formatPercent(staffRatio), highlight: true },
          ...peerAgencies.slice(0, 3).map(p => ({ header: p.name, value: formatPercent(p.staffRatio) })),
          { header: 'Market', value: formatPercent(marketStaffRatio) }
        ]
      });
    }

    return {
      headline,
      narrative,
      comparisonData: comparisonData.length > 0 ? comparisonData : undefined,
      implication,
      priority,
      significance: Math.abs(marketDiff) + Math.abs(periodChange)
    };
  }

  private generateCategoryShiftFinding(
    current: ProcessedJobData[],
    previous: ProcessedJobData[],
    market: ProcessedJobData[]
  ): (StrategicFinding & { significance: number }) | null {
    const shifts = this.analyzeCategoryShifts();
    const topShift = shifts[0];

    if (!topShift || (topShift.absoluteChange < 20 && topShift.shareChange < 5)) return null;

    const subject = this.agencyName || 'The market';
    const categoryMarketShare = this.getCategoryMarketShare(topShift.id);

    let headline = `${topShift.name} Emerged as a Strategic Priority`;
    let narrative = `${topShift.name} `;
    
    if (topShift.previousCount > 0 && topShift.growthRate > 100) {
      narrative += `grew from ${topShift.previousCount} to ${topShift.currentCount} positions — `;
    } else if (topShift.previousCount === 0 || topShift.previousCount < 5) {
      narrative += `surged to ${topShift.currentCount} positions (from just ${topShift.previousCount}) — `;
    } else {
      narrative += `increased to ${topShift.currentCount} positions — `;
    }
    
    narrative += `now ${formatPercent(topShift.currentShare)} of ${this.agencyName ? 'your' : 'total'} postings`;

    if (this.agencyName && categoryMarketShare.rank <= 3) {
      narrative += ` and #${categoryMarketShare.rank} market position with ${formatPercent(categoryMarketShare.share)} share`;
    }
    narrative += `. `;

    // Add structural insight
    const categoryStaffRatio = this.calculateStaffRatio(current.filter(j => j.primary_category === topShift.id));
    const marketCategoryStaffRatio = this.calculateStaffRatio(market.filter(j => j.primary_category === topShift.id));

    if (Math.abs(categoryStaffRatio - marketCategoryStaffRatio) > 15) {
      narrative += `However, ${this.agencyName ? 'your' : 'the'} hiring approach differs: ${formatPercent(100 - categoryStaffRatio)} non-staff versus ${formatPercent(100 - marketCategoryStaffRatio)} for the market.`;
    }

    const implication = topShift.previousCount < 5 
      ? `This represents a strategic pivot. Ensure hiring approach (grade mix, staff ratio) supports intended outcomes.`
      : `Review whether this growth reflects deliberate strategy or opportunistic hiring.`;

    return {
      headline,
      narrative,
      implication,
      priority: 'high',
      significance: topShift.absoluteChange + (topShift.shareChange * 5)
    };
  }

  private generateWindowFinding(
    current: ProcessedJobData[],
    market: ProcessedJobData[]
  ): (StrategicFinding & { significance: number }) | null {
    const avgWindow = this.calculateAvgApplicationWindow(current);
    const marketAvgWindow = this.calculateAvgApplicationWindow(market);
    
    const shortWindowJobs = current.filter(j => j.application_window_days > 0 && j.application_window_days < 10);
    const shortWindowPct = current.length > 0 ? (shortWindowJobs.length / current.length) * 100 : 0;
    
    const marketShortWindow = market.filter(j => j.application_window_days > 0 && j.application_window_days < 10);
    const marketShortPct = market.length > 0 ? (marketShortWindow.length / market.length) * 100 : 0;

    // Only significant if notably different
    if (Math.abs(shortWindowPct - marketShortPct) < 10 && Math.abs(avgWindow - marketAvgWindow) < 3) return null;

    const subject = this.agencyName || 'The market';
    const isFaster = avgWindow < marketAvgWindow;

    let headline = isFaster 
      ? `${this.agencyName ? "You're" : "The market is"} Hiring Faster Than Average — Perhaps Too Fast`
      : `${this.agencyName ? "Your" : "The market's"} Hiring Pace is Measured`;
    
    let narrative = `${this.agencyName ? 'Your' : 'The'} average application window is ${avgWindow.toFixed(0)} days`;
    if (this.agencyName) {
      narrative += `, versus ${marketAvgWindow.toFixed(0)} days for the market. `;
    } else {
      narrative += `. `;
    }

    if (shortWindowPct > 25) {
      narrative += `More significantly, ${formatPercent(shortWindowPct)} of positions have windows under 10 days`;
      if (this.agencyName) {
        narrative += ` (compared to ${formatPercent(marketShortPct)} system average)`;
      }
      narrative += `. Short windows typically correlate with smaller, less diverse candidate pools.`;
    }

    const comparisonData: ComparisonRow[] = [{
      label: '',
      values: [
        { header: 'Window Length', value: '' },
        { header: this.agencyName || 'Current', value: 'Share', highlight: true },
        { header: 'Market', value: 'Share' }
      ]
    }];

    // Calculate window breakdown
    const mediumWindow = current.filter(j => j.application_window_days >= 10 && j.application_window_days <= 20);
    const longWindow = current.filter(j => j.application_window_days > 20);
    const marketMedium = market.filter(j => j.application_window_days >= 10 && j.application_window_days <= 20);
    const marketLong = market.filter(j => j.application_window_days > 20);

    comparisonData.push({
      label: '<10 days',
      values: [
        { header: 'Window', value: '<10 days' },
        { header: 'You', value: formatPercent(shortWindowPct), highlight: shortWindowPct > marketShortPct * 1.5 },
        { header: 'Market', value: formatPercent(marketShortPct) }
      ]
    });

    const implication = isFaster && shortWindowPct > 30
      ? `If diversity and external talent acquisition are priorities, review whether urgency is operationally necessary or reflects planning gaps.`
      : `Application window length may affect candidate pool size and diversity.`;

    return {
      headline,
      narrative,
      comparisonData,
      implication,
      priority: shortWindowPct > 40 ? 'high' : 'medium',
      significance: Math.abs(shortWindowPct - marketShortPct) + Math.abs(avgWindow - marketAvgWindow)
    };
  }

  private generateGeographyFinding(
    current: ProcessedJobData[],
    previous: ProcessedJobData[],
    market: ProcessedJobData[]
  ): (StrategicFinding & { significance: number }) | null {
    const fieldRatio = this.calculateFieldRatio(current);
    const prevFieldRatio = this.calculateFieldRatio(previous);
    const marketFieldRatio = this.calculateFieldRatio(market);
    
    const fieldChange = fieldRatio - prevFieldRatio;
    const marketDiff = fieldRatio - marketFieldRatio;

    // Calculate location concentration
    const locationCounts = new Map<string, number>();
    current.forEach(j => {
      const loc = j.duty_country || 'Unknown';
      locationCounts.set(loc, (locationCounts.get(loc) || 0) + 1);
    });
    
    const prevLocationCounts = new Map<string, number>();
    previous.forEach(j => {
      const loc = j.duty_country || 'Unknown';
      prevLocationCounts.set(loc, (prevLocationCounts.get(loc) || 0) + 1);
    });

    // Find biggest location changes
    const locationChanges: Array<{ location: string; current: number; previous: number; change: number }> = [];
    locationCounts.forEach((count, location) => {
      const prev = prevLocationCounts.get(location) || 0;
      if (count >= 10 || prev >= 10) {
        locationChanges.push({ location, current: count, previous: prev, change: count - prev });
      }
    });
    locationChanges.sort((a, b) => b.change - a.change);

    // Only significant if notable changes
    if (Math.abs(fieldChange) < 10 && Math.abs(marketDiff) < 15 && locationChanges.length < 3) return null;

    const subject = this.agencyName || 'The market';

    let headline = '';
    let narrative = '';

    if (Math.abs(fieldChange) > 10) {
      headline = fieldChange > 0 ? 'Expanding Field Presence' : 'Consolidating to Headquarters';
      narrative = `Field positions ${fieldChange > 0 ? 'rose to' : 'decreased to'} ${formatPercent(fieldRatio)} of postings (${fieldChange > 0 ? 'up from' : 'down from'} ${formatPercent(prevFieldRatio)}).`;
    } else if (Math.abs(marketDiff) > 15) {
      headline = marketDiff > 0 ? 'Field-Focused Footprint' : 'Headquarters-Concentrated Model';
      narrative = `${this.agencyName ? 'Your' : 'The'} ${formatPercent(fieldRatio)} field ratio ${marketDiff > 0 ? 'exceeds' : 'trails'} the market average of ${formatPercent(marketFieldRatio)}.`;
    } else if (locationChanges.length >= 3) {
      headline = 'Geographic Shifts in Hiring';
      const top = locationChanges.slice(0, 3);
      narrative = `Geographic activity shifted notably: ${top.map(l => `${l.location} (${l.change > 0 ? '+' : ''}${l.change})`).join(', ')}.`;
    }

    if (locationChanges.length > 0 && !narrative.includes('shifted notably')) {
      const growingLocs = locationChanges.filter(l => l.change > 5).slice(0, 3);
      if (growingLocs.length > 0) {
        narrative += ` The largest increases: ${growingLocs.map(l => `${l.location} (+${l.change})`).join(', ')}.`;
      }
    }

    const implication = `Ensure geographic distribution aligns with programmatic priorities and operating model.`;

    return {
      headline,
      narrative,
      implication,
      priority: 'medium',
      significance: Math.abs(fieldChange) + Math.abs(marketDiff) + (locationChanges.length * 2)
    };
  }

  private generateCompetitorFinding(
    current: ProcessedJobData[],
    market: ProcessedJobData[]
  ): (StrategicFinding & { significance: number }) | null {
    if (!this.agencyName) return null;

    // Find most similar competitor
    const competitors = this.analyzeCompetitors();
    const closestCompetitor = competitors[0];

    if (!closestCompetitor || closestCompetitor.correlation < 0.5) return null;

    const subject = this.agencyName;
    const competitor = closestCompetitor.name;

    let headline = `${competitor} is Your Closest Competitor — With Different Philosophy`;
    
    let narrative = `Your hiring pattern correlates ${closestCompetitor.correlation.toFixed(2)} with ${competitor}'s — you compete in the same categories and often the same geographies. `;
    
    narrative += `However, approaches differ systematically: `;
    
    const differences: string[] = [];
    if (Math.abs(closestCompetitor.staffDiff) > 15) {
      differences.push(`they hire ${formatPercent(closestCompetitor.theirStaffRatio)} staff, you hire ${formatPercent(closestCompetitor.yourStaffRatio)}`);
    }
    if (Math.abs(closestCompetitor.fieldDiff) > 15) {
      differences.push(`they're ${formatPercent(closestCompetitor.theirFieldRatio)} field, you're ${formatPercent(closestCompetitor.yourFieldRatio)}`);
    }
    if (Math.abs(closestCompetitor.windowDiff) > 3) {
      differences.push(`they average ${closestCompetitor.theirWindow.toFixed(0)}-day windows, you average ${closestCompetitor.yourWindow.toFixed(0)}`);
    }

    if (differences.length > 0) {
      narrative += differences.join('; ') + '.';
    }

    const implication = `In head-to-head competition for candidates, understand which value proposition — ${closestCompetitor.yourStaffRatio > closestCompetitor.theirStaffRatio ? 'stability' : 'flexibility'} vs. ${closestCompetitor.yourStaffRatio > closestCompetitor.theirStaffRatio ? 'agility' : 'permanence'} — resonates with target talent.`;

    return {
      headline,
      narrative,
      implication,
      priority: 'medium',
      significance: closestCompetitor.correlation * 30
    };
  }

  private generateSeniorityFinding(
    current: ProcessedJobData[],
    previous: ProcessedJobData[],
    market: ProcessedJobData[]
  ): (StrategicFinding & { significance: number }) | null {
    const seniorCurrent = this.calculateSeniorRatio(current);
    const seniorPrevious = this.calculateSeniorRatio(previous);
    const seniorMarket = this.calculateSeniorRatio(market);
    
    const change = seniorCurrent - seniorPrevious;
    const marketDiff = seniorCurrent - seniorMarket;

    if (Math.abs(change) < 5 && Math.abs(marketDiff) < 10) return null;

    const subject = this.agencyName || 'The market';

    let headline = '';
    let narrative = '';

    if (Math.abs(change) > 5) {
      headline = change > 0 ? 'Increasing Senior Hiring' : 'Shift Toward Junior Positions';
      narrative = `Senior positions (P5+/D-level) ${change > 0 ? 'increased to' : 'dropped to'} ${formatPercent(seniorCurrent)} of postings`;
      if (previous.length > 50) {
        narrative += ` (${change > 0 ? 'up from' : 'down from'} ${formatPercent(seniorPrevious)})`;
      }
      narrative += `. `;
    } else {
      headline = marketDiff > 0 ? 'Higher Seniority Mix Than Market' : 'Junior-Focused Hiring';
      narrative = `${formatPercent(seniorCurrent)} of positions are senior (P5+/D-level), ${marketDiff > 0 ? 'above' : 'below'} the market average of ${formatPercent(seniorMarket)}. `;
    }

    const implication = seniorCurrent < 5 
      ? `Low senior hiring may indicate leadership stability or reliance on existing senior staff. Monitor succession pipeline.`
      : seniorCurrent > 15
      ? `High senior hiring suggests leadership refresh or expansion. Ensure integration capacity exists.`
      : `Seniority mix appears balanced for typical organizational needs.`;

    return {
      headline,
      narrative,
      implication,
      priority: Math.abs(change) > 10 ? 'high' : 'medium',
      significance: Math.abs(change) + Math.abs(marketDiff)
    };
  }

  // ============ SIGNALS & WATCHLIST ============

  private generateSignals(): Signal[] {
    const signals: Signal[] = [];
    const current = this.currentJobs;
    const previous = this.previousJobs;
    const market = this.getCurrentMarket();

    // Trend signals
    const categoryShifts = this.analyzeCategoryShifts();
    const decliningCategories = categoryShifts.filter(c => c.absoluteChange < -5 && c.previousCount > 10);
    if (decliningCategories.length > 0) {
      const top = decliningCategories[0];
      signals.push({
        type: 'trend',
        observation: `${top.name} hiring dropped ${Math.abs(top.absoluteChange)} positions (${formatChange(top.growthRate)})`,
        interpretation: `Review whether this reflects completed initiative or strategic deprioritization`
      });
    }

    // Seniority signal
    const seniorRatio = this.calculateSeniorRatio(current);
    const historicalSenior = this.calculateSeniorRatio(this.historicalJobs);
    if (Math.abs(seniorRatio - historicalSenior) > 5) {
      signals.push({
        type: 'trend',
        observation: `Senior hiring (P5+) at ${formatPercent(seniorRatio)} vs ${formatPercent(historicalSenior)} historical`,
        interpretation: seniorRatio > historicalSenior 
          ? `Leadership expansion or refresh underway`
          : `Junior pipeline building or senior retention improving`
      });
    }

    // Competitor signals
    if (this.agencyName) {
      const competitorMoves = this.detectCompetitorMoves();
      competitorMoves.forEach(move => {
        signals.push({
          type: 'competitor',
          observation: move.observation,
          interpretation: move.interpretation
        });
      });
    }

    // Risk signals
    const shortWindowPct = current.filter(j => j.application_window_days > 0 && j.application_window_days < 10).length / (current.length || 1) * 100;
    const marketShortPct = market.filter(j => j.application_window_days > 0 && j.application_window_days < 10).length / (market.length || 1) * 100;
    
    if (shortWindowPct > marketShortPct * 1.5 && shortWindowPct > 25) {
      signals.push({
        type: 'risk',
        observation: `${formatPercent(shortWindowPct)} of positions have <10 day windows vs ${formatPercent(marketShortPct)} market`,
        interpretation: `Review if urgency is operational or a planning gap`
      });
    }

    // Geographic signals
    const regionCounts = new Map<string, number>();
    current.forEach(j => {
      const region = j.geographic_region || j.duty_continent || 'Unknown';
      regionCounts.set(region, (regionCounts.get(region) || 0) + 1);
    });

    const prevRegionCounts = new Map<string, number>();
    previous.forEach(j => {
      const region = j.geographic_region || j.duty_continent || 'Unknown';
      prevRegionCounts.set(region, (prevRegionCounts.get(region) || 0) + 1);
    });

    // Check for missing regions
    prevRegionCounts.forEach((count, region) => {
      if (count >= 10 && !regionCounts.has(region)) {
        signals.push({
          type: 'geographic',
          observation: `Zero positions in ${region} (was ${count} prior period)`,
          interpretation: `Confirm this reflects strategy, not oversight`
        });
      }
    });

    // Anomaly signals
    const staffRatio = this.calculateStaffRatio(current);
    const historicalStaff = this.calculateStaffRatio(this.historicalJobs);
    
    if (Math.abs(staffRatio - historicalStaff) > 15) {
      signals.push({
        type: 'anomaly',
        observation: `Staff ratio at ${formatPercent(staffRatio)} vs ${formatPercent(historicalStaff)} historical average`,
        interpretation: staffRatio > historicalStaff 
          ? `Possible shift toward permanent capacity`
          : `Increasing reliance on flexible workforce`
      });
    }

    // Limit to 8 most important signals
    return signals.slice(0, 8);
  }

  // ============ HELPER CALCULATIONS ============

  private getCurrentMarket(): ProcessedJobData[] {
    // For agency view, return all market jobs for the current period
    // For market view, return current jobs
    if (this.agencyName) {
      const now = new Date();
      const periodConfig = this.getPeriodConfig('3months'); // Use current period config
      const start = periodConfig.getStart(now);
      return this.filterJobsByPeriod(this.allMarketJobs, start, now);
    }
    return this.currentJobs;
  }

  private calculateStaffRatio(jobs: ProcessedJobData[]): number {
    if (jobs.length === 0) return 0;
    const staffCount = jobs.filter(j => classifyGrade(j.up_grade).staffCategory === 'Staff').length;
    return (staffCount / jobs.length) * 100;
  }

  private calculateFieldRatio(jobs: ProcessedJobData[]): number {
    if (jobs.length === 0) return 0;
    const fieldCount = jobs.filter(j => j.location_type === 'Field').length;
    return (fieldCount / jobs.length) * 100;
  }

  private calculateSeniorRatio(jobs: ProcessedJobData[]): number {
    if (jobs.length === 0) return 0;
    const seniorCount = jobs.filter(j => {
      const tier = getConsolidatedTier(classifyGrade(j.up_grade).tier);
      return ['Executive', 'Director', 'Senior Professional'].includes(tier);
    }).length;
    return (seniorCount / jobs.length) * 100;
  }

  private calculateAvgApplicationWindow(jobs: ProcessedJobData[]): number {
    const validJobs = jobs.filter(j => j.application_window_days > 0 && j.application_window_days < 120);
    if (validJobs.length === 0) return 14;
    return validJobs.reduce((sum, j) => sum + j.application_window_days, 0) / validJobs.length;
  }

  private calculateMarketRank(): { rank: number; total: number } {
    if (!this.agencyName) return { rank: 0, total: 0 };
    
    const market = this.getCurrentMarket();
    const agencyCounts = new Map<string, number>();
    market.forEach(j => {
      const agency = j.short_agency || j.long_agency;
      if (agency) agencyCounts.set(agency, (agencyCounts.get(agency) || 0) + 1);
    });

    const sorted = Array.from(agencyCounts.entries()).sort((a, b) => b[1] - a[1]);
    const rank = sorted.findIndex(([name]) => name === this.agencyName) + 1;
    return { rank: rank || sorted.length + 1, total: sorted.length };
  }

  private calculatePreviousMarketRank(): number {
    if (!this.agencyName) return 0;
    
    const agencyCounts = new Map<string, number>();
    this.previousJobs.forEach(j => {
      const agency = j.short_agency || j.long_agency;
      if (agency) agencyCounts.set(agency, (agencyCounts.get(agency) || 0) + 1);
    });

    const sorted = Array.from(agencyCounts.entries()).sort((a, b) => b[1] - a[1]);
    return sorted.findIndex(([name]) => name === this.agencyName) + 1 || sorted.length + 1;
  }

  private analyzeCategoryShifts(): Array<{
    id: string;
    name: string;
    currentCount: number;
    previousCount: number;
    currentShare: number;
    previousShare: number;
    shareChange: number;
    absoluteChange: number;
    growthRate: number;
  }> {
    const currentCounts = new Map<string, number>();
    const previousCounts = new Map<string, number>();

    this.currentJobs.forEach(j => {
      currentCounts.set(j.primary_category, (currentCounts.get(j.primary_category) || 0) + 1);
    });

    this.previousJobs.forEach(j => {
      previousCounts.set(j.primary_category, (previousCounts.get(j.primary_category) || 0) + 1);
    });

    const allCategories = new Set([...currentCounts.keys(), ...previousCounts.keys()]);
    const currentTotal = this.currentJobs.length || 1;
    const previousTotal = this.previousJobs.length || 1;

    const shifts = Array.from(allCategories).map(category => {
      const current = currentCounts.get(category) || 0;
      const previous = previousCounts.get(category) || 0;
      const currentShare = (current / currentTotal) * 100;
      const previousShare = (previous / previousTotal) * 100;
      const growthRate = previous > 0 ? ((current - previous) / previous) * 100 : (current > 0 ? 100 : 0);

      return {
        id: category,
        name: this.formatCategoryName(category),
        currentCount: current,
        previousCount: previous,
        currentShare,
        previousShare,
        shareChange: currentShare - previousShare,
        absoluteChange: current - previous,
        growthRate
      };
    });

    return shifts.sort((a, b) => b.absoluteChange - a.absoluteChange);
  }

  private formatCategoryName(id: string): string {
    return id
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' & ')
      .replace('And', '&');
  }

  private analyzeCategoryStaffPatterns(): Array<{
    category: string;
    yourRatio: number;
    marketRatio: number;
  }> {
    const market = this.getCurrentMarket();
    const categories = new Map<string, { your: ProcessedJobData[]; market: ProcessedJobData[] }>();

    this.currentJobs.forEach(j => {
      if (!categories.has(j.primary_category)) {
        categories.set(j.primary_category, { your: [], market: [] });
      }
      categories.get(j.primary_category)!.your.push(j);
    });

    market.forEach(j => {
      if (!categories.has(j.primary_category)) {
        categories.set(j.primary_category, { your: [], market: [] });
      }
      categories.get(j.primary_category)!.market.push(j);
    });

    return Array.from(categories.entries())
      .filter(([_, data]) => data.your.length >= 5)
      .map(([category, data]) => ({
        category: this.formatCategoryName(category),
        yourRatio: this.calculateStaffRatio(data.your),
        marketRatio: this.calculateStaffRatio(data.market)
      }))
      .sort((a, b) => Math.abs(b.yourRatio - b.marketRatio) - Math.abs(a.yourRatio - a.marketRatio));
  }

  private getCategoryMarketShare(categoryId: string): { rank: number; share: number } {
    const market = this.getCurrentMarket();
    const categoryJobs = market.filter(j => j.primary_category === categoryId);
    
    const agencyCounts = new Map<string, number>();
    categoryJobs.forEach(j => {
      const agency = j.short_agency || j.long_agency;
      if (agency) agencyCounts.set(agency, (agencyCounts.get(agency) || 0) + 1);
    });

    const sorted = Array.from(agencyCounts.entries()).sort((a, b) => b[1] - a[1]);
    const yourCount = agencyCounts.get(this.agencyName!) || 0;
    const rank = sorted.findIndex(([name]) => name === this.agencyName) + 1;
    
    return {
      rank: rank || sorted.length + 1,
      share: categoryJobs.length > 0 ? (yourCount / categoryJobs.length) * 100 : 0
    };
  }

  private analyzeCompetitorContext(): {
    topPositions: Array<{ category: string; rank: number }>;
    gaps: Array<{ category: string; competitor: string; theirShare: number; yourShare: number }>;
  } {
    if (!this.agencyName) return { topPositions: [], gaps: [] };

    const market = this.getCurrentMarket();
    const topPositions: Array<{ category: string; rank: number }> = [];
    const gaps: Array<{ category: string; competitor: string; theirShare: number; yourShare: number }> = [];

    // Analyze by category
    const categories = new Set(this.currentJobs.map(j => j.primary_category));

    categories.forEach(category => {
      const { rank, share } = this.getCategoryMarketShare(category);
      const categoryJobs = market.filter(j => j.primary_category === category);
      
      if (rank <= 3 && categoryJobs.length >= 10) {
        topPositions.push({ category: this.formatCategoryName(category), rank });
      }

      // Find leader if not us
      if (rank > 1) {
        const agencyCounts = new Map<string, number>();
        categoryJobs.forEach(j => {
          const agency = j.short_agency || j.long_agency;
          if (agency) agencyCounts.set(agency, (agencyCounts.get(agency) || 0) + 1);
        });

        const sorted = Array.from(agencyCounts.entries()).sort((a, b) => b[1] - a[1]);
        const leader = sorted[0];
        if (leader && leader[0] !== this.agencyName && categoryJobs.length >= 20) {
          gaps.push({
            category: this.formatCategoryName(category),
            competitor: leader[0],
            theirShare: (leader[1] / categoryJobs.length) * 100,
            yourShare: share
          });
        }
      }
    });

    return {
      topPositions: topPositions.sort((a, b) => a.rank - b.rank),
      gaps: gaps.sort((a, b) => (b.theirShare - b.yourShare) - (a.theirShare - a.yourShare))
    };
  }

  private getTopAgencies(): Array<{ name: string; count: number; share: number }> {
    const market = this.getCurrentMarket();
    const agencyCounts = new Map<string, number>();
    
    market.forEach(j => {
      const agency = j.short_agency || j.long_agency;
      if (agency) agencyCounts.set(agency, (agencyCounts.get(agency) || 0) + 1);
    });

    const total = market.length || 1;
    return Array.from(agencyCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count, share: (count / total) * 100 }));
  }

  private getPeerComparison(): Array<{ name: string; staffRatio: number }> {
    if (!this.agencyName) return [];
    
    const market = this.getCurrentMarket();
    const peerGroup = getAgencyPeerGroup(this.agencyName);
    const peers = peerGroup ? peerGroup.agencies : [];

    return peers
      .filter(p => p !== this.agencyName)
      .map(peer => {
        const peerJobs = market.filter(j => (j.short_agency || j.long_agency) === peer);
        return {
          name: peer,
          staffRatio: this.calculateStaffRatio(peerJobs)
        };
      })
      .filter(p => p.staffRatio > 0)
      .slice(0, 3);
  }

  private analyzeCompetitors(): Array<{
    name: string;
    correlation: number;
    yourStaffRatio: number;
    theirStaffRatio: number;
    staffDiff: number;
    yourFieldRatio: number;
    theirFieldRatio: number;
    fieldDiff: number;
    yourWindow: number;
    theirWindow: number;
    windowDiff: number;
  }> {
    if (!this.agencyName) return [];

    const market = this.getCurrentMarket();
    
    // Group by agency
    const agencyJobs = new Map<string, ProcessedJobData[]>();
    market.forEach(j => {
      const agency = j.short_agency || j.long_agency;
      if (agency && agency !== this.agencyName) {
        if (!agencyJobs.has(agency)) agencyJobs.set(agency, []);
        agencyJobs.get(agency)!.push(j);
      }
    });

    // Calculate your category distribution
    const yourCategories = new Map<string, number>();
    this.currentJobs.forEach(j => {
      yourCategories.set(j.primary_category, (yourCategories.get(j.primary_category) || 0) + 1);
    });

    const results: Array<{
      name: string;
      correlation: number;
      yourStaffRatio: number;
      theirStaffRatio: number;
      staffDiff: number;
      yourFieldRatio: number;
      theirFieldRatio: number;
      fieldDiff: number;
      yourWindow: number;
      theirWindow: number;
      windowDiff: number;
    }> = [];

    agencyJobs.forEach((jobs, agency) => {
      if (jobs.length < 20) return;

      // Calculate their category distribution
      const theirCategories = new Map<string, number>();
      jobs.forEach(j => {
        theirCategories.set(j.primary_category, (theirCategories.get(j.primary_category) || 0) + 1);
      });

      // Calculate correlation
      const allCats = new Set([...yourCategories.keys(), ...theirCategories.keys()]);
      const yourVec: number[] = [];
      const theirVec: number[] = [];
      
      allCats.forEach(cat => {
        yourVec.push((yourCategories.get(cat) || 0) / this.currentJobs.length);
        theirVec.push((theirCategories.get(cat) || 0) / jobs.length);
      });

      const correlation = this.pearsonCorrelation(yourVec, theirVec);
      const yourStaffRatio = this.calculateStaffRatio(this.currentJobs);
      const theirStaffRatio = this.calculateStaffRatio(jobs);
      const yourFieldRatio = this.calculateFieldRatio(this.currentJobs);
      const theirFieldRatio = this.calculateFieldRatio(jobs);
      const yourWindow = this.calculateAvgApplicationWindow(this.currentJobs);
      const theirWindow = this.calculateAvgApplicationWindow(jobs);

      results.push({
        name: agency,
        correlation,
        yourStaffRatio,
        theirStaffRatio,
        staffDiff: yourStaffRatio - theirStaffRatio,
        yourFieldRatio,
        theirFieldRatio,
        fieldDiff: yourFieldRatio - theirFieldRatio,
        yourWindow,
        theirWindow,
        windowDiff: yourWindow - theirWindow
      });
    });

    return results.sort((a, b) => b.correlation - a.correlation);
  }

  private pearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    if (n === 0) return 0;

    const sum1 = x.reduce((a, b) => a + b, 0);
    const sum2 = y.reduce((a, b) => a + b, 0);
    const sum1Sq = x.reduce((a, b) => a + b * b, 0);
    const sum2Sq = y.reduce((a, b) => a + b * b, 0);
    const pSum = x.reduce((acc, xi, i) => acc + xi * y[i], 0);

    const num = pSum - (sum1 * sum2 / n);
    const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));

    return den === 0 ? 0 : num / den;
  }

  private identifyKeyRisks(): Array<{ description: string }> {
    const risks: Array<{ description: string; severity: number }> = [];
    const current = this.currentJobs;
    const market = this.getCurrentMarket();

    // Short window risk
    const shortWindowPct = current.filter(j => j.application_window_days > 0 && j.application_window_days < 10).length / (current.length || 1) * 100;
    const marketShortPct = market.filter(j => j.application_window_days > 0 && j.application_window_days < 10).length / (market.length || 1) * 100;

    if (shortWindowPct > marketShortPct * 1.5 && shortWindowPct > 30) {
      risks.push({
        description: `${formatPercent(shortWindowPct)} of ${this.agencyName ? 'your' : ''} positions have application windows under 10 days — ${marketShortPct > 0 ? `nearly ${(shortWindowPct / marketShortPct).toFixed(1)}x the system average` : 'above typical'}. Short windows typically reduce candidate diversity and quality.`,
        severity: shortWindowPct
      });
    }

    // Consultant concentration risk
    const nonStaffRatio = 100 - this.calculateStaffRatio(current);
    const marketNonStaff = 100 - this.calculateStaffRatio(market);

    if (nonStaffRatio > 70 && nonStaffRatio > marketNonStaff + 20) {
      risks.push({
        description: `Non-staff positions reached ${formatPercent(nonStaffRatio)} — significantly above market average. Heavy consultant reliance may affect institutional knowledge and continuity.`,
        severity: nonStaffRatio - marketNonStaff
      });
    }

    return risks.sort((a, b) => b.severity - a.severity);
  }

  private detectCompetitorMoves(): Array<{ observation: string; interpretation: string }> {
    const moves: Array<{ observation: string; interpretation: string }> = [];
    const market = this.getCurrentMarket();

    // Get your top categories
    const yourCategories = new Map<string, number>();
    this.currentJobs.forEach(j => {
      yourCategories.set(j.primary_category, (yourCategories.get(j.primary_category) || 0) + 1);
    });

    const topCategories = Array.from(yourCategories.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat]) => cat);

    // Look for competitor growth in your categories
    topCategories.forEach(category => {
      const categoryJobs = market.filter(j => j.primary_category === category);
      const agencyCounts = new Map<string, number>();
      
      categoryJobs.forEach(j => {
        const agency = j.short_agency || j.long_agency;
        if (agency && agency !== this.agencyName) {
          agencyCounts.set(agency, (agencyCounts.get(agency) || 0) + 1);
        }
      });

      // Check historical presence
      const historicalCategory = this.historicalJobs.filter(j => j.primary_category === category);
      const historicalAgencies = new Map<string, number>();
      
      historicalCategory.forEach(j => {
        const agency = j.short_agency || j.long_agency;
        if (agency) historicalAgencies.set(agency, (historicalAgencies.get(agency) || 0) + 1);
      });

      agencyCounts.forEach((count, agency) => {
        const historical = historicalAgencies.get(agency) || 0;
        if (count >= 20 && historical < 5) {
          moves.push({
            observation: `${agency} entered ${this.formatCategoryName(category)} with ${count} positions`,
            interpretation: `New competitor in ${yourCategories.get(category)! > 50 ? 'your dominant' : 'your active'} category`
          });
        } else if (count > historical * 3 && count >= 30 && historical >= 10) {
          moves.push({
            observation: `${agency} increased ${this.formatCategoryName(category)} hiring ${((count - historical) / historical * 100).toFixed(0)}%`,
            interpretation: `Competitor scaling up in your space`
          });
        }
      });
    });

    return moves.slice(0, 3);
  }
}

// Export singleton instance
export const briefGenerator = new IntelligenceBriefGenerator();

