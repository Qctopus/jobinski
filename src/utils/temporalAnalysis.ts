import { ProcessedJobData } from '../types';
import { format, addMonths, differenceInDays, startOfMonth, parseISO } from 'date-fns';

/**
 * Represents the timeline of when a job was open (accepting applications)
 * Phase 1.3 implementation
 */
export interface JobOpenTimeline {
  job_id: string;
  posting_date: Date;
  apply_until: Date;
  open_months: string[];     // ['2025-08', '2025-09', '2025-10']
  open_quarters: string[];   // ['2025-Q3', '2025-Q4']
  duration_days: number;
  status: 'active' | 'closing_soon' | 'expired' | 'archived';
}

/**
 * Represents a temporal snapshot of the job market at a specific period
 */
export interface TemporalSnapshot {
  period: string;              // '2025-10' or '2025-Q4'
  jobs_posted: number;         // NEW jobs that period
  jobs_open: number;           // TOTAL jobs accepting applications
  jobs_closed: number;         // Jobs that reached deadline
  net_opening_change: number;  // posted - closed

  // Market pressure indicator
  market_saturation: 'low' | 'medium' | 'high';  // Based on jobs_open ratio
  avg_jobs_per_period: number;  // Historical average for comparison
}

/**
 * Calculate the timeline of when a job was open (accepting applications)
 * This is critical for accurate temporal analysis - a job posted in August
 * but open until November should count in Sep, Oct, Nov analytics
 */
export function calculateJobTimeline(job: ProcessedJobData): JobOpenTimeline {
  const posting = parseISO(job.posting_date);
  const deadline = parseISO(job.apply_until);
  const openMonths: string[] = [];

  // Iterate through each month the job was accepting applications
  let current = startOfMonth(posting);
  const end = startOfMonth(deadline);

  while (current <= end) {
    openMonths.push(format(current, 'yyyy-MM'));
    current = addMonths(current, 1);
  }

  // Calculate quarters from months
  const quarters = [...new Set(openMonths.map(m => {
    const [year, month] = m.split('-');
    const quarter = Math.ceil(parseInt(month) / 3);
    return `${year}-Q${quarter}`;
  }))];

  return {
    job_id: job.id,
    posting_date: posting,
    apply_until: deadline,
    open_months: openMonths,
    open_quarters: quarters,
    duration_days: differenceInDays(deadline, posting),
    status: job.status
  };
}

/**
 * Calculate temporal snapshots showing jobs posted vs jobs open
 * This provides accurate market pressure indicators
 */
export function calculateTemporalSnapshots(
  jobs: ProcessedJobData[],
  periodType: 'month' | 'quarter' = 'month'
): TemporalSnapshot[] {
  // Calculate timelines for all jobs
  const timelines = jobs.map(calculateJobTimeline);

  // Get all unique periods
  const allPeriods = new Set<string>();
  timelines.forEach(timeline => {
    const periods = periodType === 'month' ? timeline.open_months : timeline.open_quarters;
    periods.forEach(p => allPeriods.add(p));
  });

  const sortedPeriods = Array.from(allPeriods).sort();

  // Calculate snapshots for each period
  const snapshots: TemporalSnapshot[] = sortedPeriods.map(period => {
    // Jobs posted this period
    const jobsPosted = jobs.filter(job => {
      const postingPeriod = periodType === 'month'
        ? job.posting_month
        : job.posting_quarter;
      return postingPeriod === period;
    }).length;

    // Jobs open (accepting applications) during this period
    const jobsOpen = timelines.filter(timeline => {
      const periods = periodType === 'month' ? timeline.open_months : timeline.open_quarters;
      return periods.includes(period);
    }).length;

    // Jobs closed this period (deadline in this period)
    const jobsClosed = timelines.filter(timeline => {
      const deadlinePeriod = periodType === 'month'
        ? format(timeline.apply_until, 'yyyy-MM')
        : `${format(timeline.apply_until, 'yyyy')}-Q${Math.ceil(parseInt(format(timeline.apply_until, 'MM')) / 3)}`;
      return deadlinePeriod === period;
    }).length;

    const netChange = jobsPosted - jobsClosed;

    return {
      period,
      jobs_posted: jobsPosted,
      jobs_open: jobsOpen,
      jobs_closed: jobsClosed,
      net_opening_change: netChange,
      market_saturation: 'medium', // Will be calculated after we have all snapshots
      avg_jobs_per_period: 0 // Will be calculated after
    };
  });

  // Calculate average and market saturation
  const avgJobsOpen = snapshots.reduce((sum, s) => sum + s.jobs_open, 0) / snapshots.length;

  snapshots.forEach(snapshot => {
    snapshot.avg_jobs_per_period = avgJobsOpen;

    // Market saturation based on jobs open vs average
    const ratio = snapshot.jobs_open / avgJobsOpen;
    snapshot.market_saturation =
      ratio < 0.8 ? 'low' :
        ratio > 1.2 ? 'high' :
          'medium';
  });

  return snapshots;
}

/**
 * Get jobs that were open during a specific period
 * Useful for filtering and analysis
 */
export function getJobsOpenInPeriod(
  jobs: ProcessedJobData[],
  period: string,
  periodType: 'month' | 'quarter' = 'month'
): ProcessedJobData[] {
  const timelines = jobs.map(job => ({
    job,
    timeline: calculateJobTimeline(job)
  }));

  return timelines
    .filter(({ timeline }) => {
      const periods = periodType === 'month' ? timeline.open_months : timeline.open_quarters;
      return periods.includes(period);
    })
    .map(({ job }) => job);
}

/**
 * Calculate hiring velocity (jobs per week) over time
 */
export function calculateHiringVelocity(
  jobs: ProcessedJobData[],
  windowDays: number = 30
): Array<{ date: string; velocity: number }> {
  // Sort jobs by posting date
  const sortedJobs = [...jobs].sort((a, b) =>
    new Date(a.posting_date).getTime() - new Date(b.posting_date).getTime()
  );

  if (sortedJobs.length === 0) return [];

  const firstDate = parseISO(sortedJobs[0].posting_date);
  const lastDate = parseISO(sortedJobs[sortedJobs.length - 1].posting_date);

  const velocityData: Array<{ date: string; velocity: number }> = [];

  let currentDate = firstDate;
  while (currentDate <= lastDate) {
    const windowStart = currentDate;
    const windowEnd = addMonths(currentDate, 1);

    const jobsInWindow = sortedJobs.filter(job => {
      const postDate = parseISO(job.posting_date);
      return postDate >= windowStart && postDate < windowEnd;
    });

    const weeksInWindow = windowDays / 7;
    const velocity = jobsInWindow.length / weeksInWindow;

    velocityData.push({
      date: format(currentDate, 'yyyy-MM'),
      velocity: Math.round(velocity * 10) / 10 // Round to 1 decimal
    });

    currentDate = addMonths(currentDate, 1);
  }

  return velocityData;
}

/**
 * Detect seasonal patterns in job postings
 */
export interface SeasonalPattern {
  high_season_months: string[];      // ['September', 'January']
  low_season_months: string[];       // ['July', 'August', 'December']
  typical_ramp_up_period: string;    // "Late August - Early September"
  year_over_year_pattern: 'consistent' | 'variable' | 'cyclical';
  monthly_averages: { [month: string]: number };
}

export function detectSeasonalPatterns(jobs: ProcessedJobData[]): SeasonalPattern {
  // Group jobs by month (ignoring year)
  const monthlyData: { [month: string]: number[] } = {};
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  monthNames.forEach(month => {
    monthlyData[month] = [];
  });

  jobs.forEach(job => {
    const date = parseISO(job.posting_date);
    const monthName = monthNames[date.getMonth()];

    if (!monthlyData[monthName]) {
      monthlyData[monthName] = [];
    }
    monthlyData[monthName].push(1); // Count the job
  });

  // Calculate monthly averages
  const monthlyAverages: { [month: string]: number } = {};
  monthNames.forEach(month => {
    const counts = monthlyData[month] || [];
    monthlyAverages[month] = counts.length > 0
      ? counts.reduce((a, b) => a + b, 0)
      : 0;
  });

  // Identify high and low season months
  const avgValue = Object.values(monthlyAverages).reduce((a, b) => a + b, 0) / 12;
  const highSeasonMonths = monthNames.filter(month =>
    monthlyAverages[month] > avgValue * 1.2
  );
  const lowSeasonMonths = monthNames.filter(month =>
    monthlyAverages[month] < avgValue * 0.8
  );

  // Detect ramp-up period (consecutive months of increasing activity)
  let rampUpPeriod = 'Not detected';
  for (let i = 0; i < 11; i++) {
    if (monthlyAverages[monthNames[i]] < monthlyAverages[monthNames[i + 1]]) {
      const increase = monthlyAverages[monthNames[i + 1]] - monthlyAverages[monthNames[i]];
      if (increase > avgValue * 0.3) {
        rampUpPeriod = `Late ${monthNames[i]} - Early ${monthNames[i + 1]}`;
        break;
      }
    }
  }

  // Determine year-over-year pattern consistency
  // This is simplified - could be enhanced with more statistical analysis
  const variance = Object.values(monthlyAverages).reduce((sum, val) =>
    sum + Math.pow(val - avgValue, 2), 0
  ) / 12;
  const standardDeviation = Math.sqrt(variance);
  const coefficientOfVariation = standardDeviation / avgValue;

  const yoyPattern: 'consistent' | 'variable' | 'cyclical' =
    coefficientOfVariation < 0.2 ? 'consistent' :
      coefficientOfVariation > 0.5 ? 'variable' :
        'cyclical';

  return {
    high_season_months: highSeasonMonths,
    low_season_months: lowSeasonMonths,
    typical_ramp_up_period: rampUpPeriod,
    year_over_year_pattern: yoyPattern,
    monthly_averages: monthlyAverages
  };
}

/**
 * Compare two time periods
 */
export interface TimeComparison {
  baseline_period: string;    // "Q3 2024"
  current_period: string;     // "Q3 2025"

  volume_change: {
    absolute: number;
    percentage: number;
  };

  category_shifts: Array<{
    category: string;
    baseline_share: number;
    current_share: number;
    shift: number;
  }>;

  strategic_changes: string[];  // ["More senior positions", "Shift to field locations"]
}

export function compareTimePeriods(
  baselineJobs: ProcessedJobData[],
  currentJobs: ProcessedJobData[],
  baselinePeriod: string,
  currentPeriod: string
): TimeComparison {
  const volumeChange = {
    absolute: currentJobs.length - baselineJobs.length,
    percentage: baselineJobs.length > 0
      ? ((currentJobs.length - baselineJobs.length) / baselineJobs.length) * 100
      : 0
  };

  // Calculate category shifts
  const baselineCategories = countByField(baselineJobs, 'primary_category');
  const currentCategories = countByField(currentJobs, 'primary_category');

  const allCategories = new Set([
    ...Object.keys(baselineCategories),
    ...Object.keys(currentCategories)
  ]);

  const categoryShifts = Array.from(allCategories).map(category => {
    const baselineCount = baselineCategories[category] || 0;
    const currentCount = currentCategories[category] || 0;
    const baselineShare = baselineJobs.length > 0 ? (baselineCount / baselineJobs.length) * 100 : 0;
    const currentShare = currentJobs.length > 0 ? (currentCount / currentJobs.length) * 100 : 0;

    return {
      category,
      baseline_share: Math.round(baselineShare * 10) / 10,
      current_share: Math.round(currentShare * 10) / 10,
      shift: Math.round((currentShare - baselineShare) * 10) / 10
    };
  }).sort((a, b) => Math.abs(b.shift) - Math.abs(a.shift));

  // Detect strategic changes
  const strategicChanges: string[] = [];

  // Check seniority shift
  const baselineSenior = baselineJobs.filter(j =>
    j.seniority_level === 'Senior' || j.seniority_level === 'Executive'
  ).length / baselineJobs.length;
  const currentSenior = currentJobs.filter(j =>
    j.seniority_level === 'Senior' || j.seniority_level === 'Executive'
  ).length / currentJobs.length;

  if (currentSenior - baselineSenior > 0.1) {
    strategicChanges.push('Shift towards senior positions');
  } else if (baselineSenior - currentSenior > 0.1) {
    strategicChanges.push('Shift towards junior positions');
  }

  // Check location shift
  const baselineHQ = baselineJobs.filter(j => j.location_type === 'Headquarters').length / baselineJobs.length;
  const currentHQ = currentJobs.filter(j => j.location_type === 'Headquarters').length / currentJobs.length;

  if (currentHQ - baselineHQ > 0.1) {
    strategicChanges.push('Increased headquarters hiring');
  } else if (baselineHQ - currentHQ > 0.1) {
    strategicChanges.push('Increased field presence');
  }

  // Check grade shifts
  const baselineEntry = baselineJobs.filter(j => j.grade_level === 'Entry').length / baselineJobs.length;
  const currentEntry = currentJobs.filter(j => j.grade_level === 'Entry').length / currentJobs.length;

  if (currentEntry - baselineEntry > 0.1) {
    strategicChanges.push('Expansion of entry-level positions');
  }

  return {
    baseline_period: baselinePeriod,
    current_period: currentPeriod,
    volume_change: volumeChange,
    category_shifts: categoryShifts,
    strategic_changes: strategicChanges
  };
}

/**
 * Helper function to count jobs by a specific field
 */
function countByField(jobs: ProcessedJobData[], field: keyof ProcessedJobData): { [key: string]: number } {
  const counts: { [key: string]: number } = {};

  jobs.forEach(job => {
    const value = String(job[field]);
    counts[value] = (counts[value] || 0) + 1;
  });

  return counts;
}




