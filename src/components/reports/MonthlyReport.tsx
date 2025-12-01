/**
 * Monthly Strategic Report - Executive View
 * 
 * Dense, information-rich report that reuses existing dashboard visualizations.
 * Optimized for both screen viewing and PDF export via browser print.
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  Globe,
  Calendar,
  Award,
  Zap,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Briefcase,
  ExternalLink
} from 'lucide-react';
import { getAgencyLogo } from '../../utils/agencyLogos';
import { ProcessedJobData } from '../../types';

// Import existing chart components
import WorkforcePyramid from '../workforce/WorkforcePyramid';
import GeographicMap from '../geography/GeographicMap';
import type { CategoryMatrix } from '../../services/analytics/CategoryEvolutionAnalyzer';
import type { TalentWarZone } from '../../services/analytics/CompetitiveEvolutionTracker';
import type { WorkforcePyramidData } from '../../services/analytics/WorkforceStructureAnalyzer';

// Types for report data
interface ReportData {
  agency: string;
  period: { startDate: string; endDate: string };
  metrics: {
    totalPostings: number;
    momChange: number;
    marketShare: number;
    marketRank: number;
    totalAgencies: number;
    avgWindow: number;
    urgentRate: number;
    seniorRatio: number;
  };
  competitive: {
    marketShareTrend: Array<{ period: string; share: number }>;
    topCompetitors: Array<{ agency: string; volume: number; growth: number }>;
    warZones: TalentWarZone[];
  };
  categories: {
    matrix: CategoryMatrix;
    topCategories: Array<{ category: string; count: number; share: number; growth: number }>;
  };
  workforce: {
    pyramid: WorkforcePyramidData;
    previousPyramid?: WorkforcePyramidData;
  };
  temporal: {
    postedVsOpen: Array<{ period: string; posted: number; open: number }>;
  };
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    area: string;
    title: string;
    rationale: string;
  }>;
  insights: string[];
}

interface MonthlyReportProps {
  agency: string;
  startDate?: string;
  endDate?: string;
  onBack?: () => void;
  allJobs?: ProcessedJobData[];
}

// Compact KPI Card component for report
const ReportKPI: React.FC<{
  value: string | number;
  label: string;
  change?: number;
  benchmark?: string;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'amber' | 'purple' | 'red';
}> = ({ value, label, change, benchmark, icon, color }) => {
  const colors = {
    blue: 'border-blue-200 bg-blue-50/50',
    green: 'border-green-200 bg-green-50/50',
    amber: 'border-amber-200 bg-amber-50/50',
    purple: 'border-purple-200 bg-purple-50/50',
    red: 'border-red-200 bg-red-50/50',
  };
  
  return (
    <div className={`border rounded-lg p-2.5 ${colors[color]}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-gray-500">{icon}</span>
        {change !== undefined && (
          <span className={`text-xs font-medium flex items-center gap-0.5 ${
            change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-500'
          }`}>
            {change > 0 ? <TrendingUp className="w-3 h-3" /> : change < 0 ? <TrendingDown className="w-3 h-3" /> : null}
            {change > 0 ? '+' : ''}{change.toFixed(1)}%
          </span>
        )}
      </div>
      <div className="text-xl font-bold text-gray-900 leading-none">{value}</div>
      <div className="text-[10px] text-gray-600 mt-0.5">{label}</div>
      {benchmark && (
        <div className="text-[9px] text-gray-400 mt-0.5">vs {benchmark}</div>
      )}
    </div>
  );
};

// Compact recommendation card
const RecommendationCard: React.FC<{
  priority: 'high' | 'medium' | 'low';
  area: string;
  title: string;
  rationale: string;
}> = ({ priority, area, title, rationale }) => {
  const priorityStyles = {
    high: { border: 'border-l-red-500', bg: 'bg-red-50', badge: 'bg-red-100 text-red-700' },
    medium: { border: 'border-l-amber-500', bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-700' },
    low: { border: 'border-l-blue-500', bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-700' },
  };
  const styles = priorityStyles[priority];
  
  return (
    <div className={`border-l-4 ${styles.border} ${styles.bg} rounded-r-lg p-3`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${styles.badge}`}>
          {priority}
        </span>
        <span className="text-[10px] font-medium text-gray-500 uppercase">{area}</span>
      </div>
      <div className="text-sm font-semibold text-gray-900">{title}</div>
      <div className="text-xs text-gray-600 mt-1">{rationale}</div>
    </div>
  );
};

// Insight card
const InsightCard: React.FC<{ insight: string; index: number }> = ({ insight, index }) => (
  <div className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg">
    <span className="text-blue-600 font-bold text-sm">{index + 1}</span>
    <span className="text-sm text-gray-700">{insight}</span>
  </div>
);

// Category row for compact table
const CategoryRow: React.FC<{
  category: string;
  count: number;
  share: number;
  growth: number;
  rank?: number;
}> = ({ category, count, share, growth, rank }) => (
  <tr className="border-b border-gray-100 hover:bg-gray-50">
    <td className="py-1.5 px-2">
      {rank && <span className="text-xs text-gray-400 mr-2">#{rank}</span>}
      <span className="text-sm font-medium text-gray-900">{category}</span>
    </td>
    <td className="py-1.5 px-2 text-right text-sm text-gray-700">{count}</td>
    <td className="py-1.5 px-2 text-right text-sm text-gray-700">{share.toFixed(1)}%</td>
    <td className="py-1.5 px-2 text-right">
      <span className={`text-sm font-medium ${
        growth > 0 ? 'text-green-600' : growth < 0 ? 'text-red-600' : 'text-gray-500'
      }`}>
        {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
      </span>
    </td>
  </tr>
);

export const MonthlyReport: React.FC<MonthlyReportProps> = ({
  agency,
  startDate = '2025-10-01',
  endDate = '2025-11-30',
  onBack,
  allJobs = []
}) => {
  const reportRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [jobs, setJobs] = useState<ProcessedJobData[]>([]);
  const [marketJobs, setMarketJobs] = useState<ProcessedJobData[]>([]);
  
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Fetch report data
  useEffect(() => {
    const fetchData = async () => {
      if (!agency) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Use provided jobs or fetch from API
        if (allJobs.length > 0) {
          setMarketJobs(allJobs);
          setJobs(allJobs.filter(j => j.short_agency === agency || j.long_agency === agency));
        } else {
          const jobsRes = await fetch(`${API_BASE}/dashboard/jobs`);
          const jobsData = await jobsRes.json();
          if (jobsData.success && jobsData.data) {
            const allFetchedJobs = jobsData.data as ProcessedJobData[];
            setMarketJobs(allFetchedJobs);
            setJobs(allFetchedJobs.filter(j => j.short_agency === agency || j.long_agency === agency));
          }
        }
        
        // Try to fetch report data from new API endpoint
        try {
          const reportRes = await fetch(
            `${API_BASE}/reports/monthly-data/${encodeURIComponent(agency)}?startDate=${startDate}&endDate=${endDate}`
          );
          const reportDataRes = await reportRes.json();
          
          if (reportDataRes.success && reportDataRes.data) {
            setReportData(reportDataRes.data);
          }
        } catch (apiErr) {
          console.log('Monthly data API not available, building from jobs');
        }
      } catch (err) {
        console.error('Error fetching report data:', err);
        setError('Failed to load report data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [agency, startDate, endDate, API_BASE, allJobs]);

  // Compute metrics from jobs if API data not available
  const computedMetrics = React.useMemo(() => {
    // Only use reportData.metrics if it actually exists
    if (reportData?.metrics) return reportData.metrics;
    
    const agencyJobs = jobs;
    const totalPostings = agencyJobs.length;
    const activeJobs = agencyJobs.filter(j => j.is_active);
    const urgentJobs = agencyJobs.filter(j => j.urgency === 'urgent');
    const seniorJobs = agencyJobs.filter(j => 
      ['Senior', 'Executive', 'Director'].includes(j.seniority_level || '')
    );
    
    // Calculate average application window
    const windowDays = agencyJobs
      .filter(j => j.application_window_days && j.application_window_days > 0)
      .map(j => j.application_window_days || 0);
    const avgWindow = windowDays.length > 0 
      ? Math.round(windowDays.reduce((a, b) => a + b, 0) / windowDays.length)
      : 28;
    
    // Get unique categories count
    const categories = new Set(agencyJobs.map(j => j.primary_category));
    
    // Calculate market share and rank
    const agencyCounts = new Map<string, number>();
    marketJobs.forEach(j => {
      const a = j.short_agency || j.long_agency || 'Unknown';
      agencyCounts.set(a, (agencyCounts.get(a) || 0) + 1);
    });
    const sortedAgencies = Array.from(agencyCounts.entries()).sort((a, b) => b[1] - a[1]);
    const rank = sortedAgencies.findIndex(([a]) => a === agency) + 1;
    const marketShare = marketJobs.length > 0 ? (totalPostings / marketJobs.length) * 100 : 0;
    
    return {
      totalPostings,
      momChange: 0, // Would need historical data
      marketShare,
      marketRank: rank || sortedAgencies.length,
      totalAgencies: sortedAgencies.length,
      avgWindow,
      urgentRate: totalPostings > 0 ? (urgentJobs.length / totalPostings) * 100 : 0,
      seniorRatio: totalPostings > 0 ? (seniorJobs.length / totalPostings) * 100 : 0,
      categories: categories.size,
      countries: new Set(agencyJobs.map(j => j.duty_country || j.duty_station)).size
    };
  }, [jobs, marketJobs, agency, reportData]);

  // Compute top categories from jobs
  const topCategories = React.useMemo(() => {
    if (reportData?.categories?.topCategories) return reportData.categories.topCategories;
    
    const catCounts = new Map<string, number>();
    jobs.forEach(j => {
      const cat = j.primary_category || 'Unknown';
      catCounts.set(cat, (catCounts.get(cat) || 0) + 1);
    });
    
    return Array.from(catCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([category, count]) => ({
        category,
        count,
        share: jobs.length > 0 ? (count / jobs.length) * 100 : 0,
        growth: 0 // Would need historical data
      }));
  }, [jobs, reportData]);

  // Compute top competitors
  const topCompetitors = React.useMemo(() => {
    if (reportData?.competitive?.topCompetitors) return reportData.competitive.topCompetitors;
    
    const agencyCounts = new Map<string, number>();
    marketJobs.forEach(j => {
      const a = j.short_agency || j.long_agency || 'Unknown';
      if (a !== agency) {
        agencyCounts.set(a, (agencyCounts.get(a) || 0) + 1);
      }
    });
    
    return Array.from(agencyCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([ag, volume]) => ({
        agency: ag,
        volume,
        growth: 0
      }));
  }, [marketJobs, agency, reportData]);

  // Generate insights from computed data
  const insights = React.useMemo(() => {
    if (reportData?.insights) return reportData.insights;
    
    const insights: string[] = [];
    const m = computedMetrics;
    
    insights.push(`${agency} posted ${m.totalPostings.toLocaleString()} positions this period`);
    insights.push(`Ranked #${m.marketRank} among ${m.totalAgencies} active agencies`);
    
    if (m.avgWindow < 21) {
      insights.push(`Fast hiring pace with ${m.avgWindow}-day average application window`);
    } else if (m.avgWindow > 35) {
      insights.push(`Extended ${m.avgWindow}-day application windows may impact candidate availability`);
    }
    
    if (m.urgentRate > 25) {
      insights.push(`${Math.round(m.urgentRate)}% urgent postings indicate high demand pressure`);
    }
    
    return insights.slice(0, 4);
  }, [computedMetrics, agency, reportData]);

  // Print/Export handler
  const handlePrint = () => {
    window.print();
  };

  // Open in new tab for standalone view
  const handleOpenStandalone = () => {
    const url = `${API_BASE}/reports/html/${encodeURIComponent(agency)}?startDate=${startDate}&endDate=${endDate}`;
    window.open(url, '_blank');
  };

  // Format date
  const formatPeriod = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    return `${s.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${e.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-gray-600">Generating Report for {agency}...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center text-red-600">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
          <div>{error}</div>
          {onBack && (
            <button onClick={onBack} className="mt-4 text-blue-600 hover:underline">
              ← Back to Reports
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Print-friendly styles */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
          .report-page { 
            padding: 0 !important; 
            margin: 0 !important;
            box-shadow: none !important;
          }
          .report-container {
            max-width: none !important;
            padding: 0 !important;
          }
          nav { display: none !important; }
        }
        
        @page {
          size: A4 landscape;
          margin: 8mm;
        }
      `}</style>

      {/* Toolbar - hidden when printing */}
      <div className="no-print sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {onBack && (
              <button 
                onClick={onBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            )}
            <div className="h-4 w-px bg-gray-300" />
            <div className="flex items-center gap-2">
              <img
                src={getAgencyLogo(agency) || '/logo/logo/UN.png'}
                alt={agency}
                className="w-8 h-8 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).src = '/logo/logo/UN.png'; }}
              />
              <div>
                <div className="font-semibold text-gray-900">{agency}</div>
                <div className="text-xs text-gray-500">{formatPeriod(startDate, endDate)}</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenStandalone}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Open Standalone
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print / Export PDF
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div ref={reportRef} className="report-container min-h-screen bg-gray-100 print:bg-white">
        <div className="max-w-[1600px] mx-auto py-4 px-4 print:py-0 print:px-0">
          
          {/* Single-page dense layout */}
          <div className="report-page bg-white rounded-xl shadow-lg overflow-hidden print:rounded-none print:shadow-none">
            
            {/* Compact Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={getAgencyLogo(agency) || '/logo/logo/UN.png'}
                    alt={agency}
                    className="w-12 h-12 object-contain bg-white rounded-lg p-1.5"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/logo/logo/UN.png'; }}
                  />
                  <div>
                    <h1 className="text-xl font-bold">{agency}</h1>
                    <div className="text-slate-300 text-sm">Monthly HR Strategic Intelligence</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold">{formatPeriod(startDate, endDate)}</div>
                  <div className="text-slate-300 text-sm">Generated {new Date().toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            {/* Dense Content Grid */}
            <div className="p-4">
              {/* Row 1: KPIs */}
              <div className="grid grid-cols-8 gap-2 mb-4">
                <ReportKPI
                  value={computedMetrics.totalPostings.toLocaleString()}
                  label="Total Postings"
                  change={computedMetrics.momChange}
                  icon={<Briefcase className="w-3.5 h-3.5" />}
                  color="blue"
                />
                <ReportKPI
                  value={`#${computedMetrics.marketRank}`}
                  label="Market Rank"
                  benchmark={`of ${computedMetrics.totalAgencies}`}
                  icon={<Award className="w-3.5 h-3.5" />}
                  color="purple"
                />
                <ReportKPI
                  value={`${computedMetrics.marketShare.toFixed(1)}%`}
                  label="Market Share"
                  icon={<Target className="w-3.5 h-3.5" />}
                  color="green"
                />
                <ReportKPI
                  value={`${computedMetrics.avgWindow}d`}
                  label="Avg Window"
                  benchmark="28d market"
                  icon={<Clock className="w-3.5 h-3.5" />}
                  color="amber"
                />
                <ReportKPI
                  value={`${computedMetrics.urgentRate.toFixed(0)}%`}
                  label="Urgent Rate"
                  icon={<Zap className="w-3.5 h-3.5" />}
                  color={computedMetrics.urgentRate > 25 ? 'red' : 'green'}
                />
                <ReportKPI
                  value={`${computedMetrics.seniorRatio.toFixed(0)}%`}
                  label="Senior Ratio"
                  icon={<Users className="w-3.5 h-3.5" />}
                  color="purple"
                />
                <ReportKPI
                  value={(computedMetrics as any).categories || topCategories.length}
                  label="Categories"
                  icon={<Target className="w-3.5 h-3.5" />}
                  color="amber"
                />
                <ReportKPI
                  value={(computedMetrics as any).countries || new Set(jobs.map(j => j.duty_country || j.duty_station)).size}
                  label="Countries"
                  icon={<Globe className="w-3.5 h-3.5" />}
                  color="green"
                />
              </div>

              {/* Row 2: Main content - 3 columns */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                {/* Column 1: Insights + Categories */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                      <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                      Key Findings
                    </h3>
                    <div className="space-y-1.5">
                      {insights.map((insight, i) => (
                        <InsightCard key={i} insight={insight} index={i} />
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                      <Target className="w-3.5 h-3.5 text-purple-600" />
                      Top Categories
                    </h3>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="py-1 px-1.5 text-left text-[10px] font-semibold text-gray-500">Category</th>
                          <th className="py-1 px-1.5 text-right text-[10px] font-semibold text-gray-500">Jobs</th>
                          <th className="py-1 px-1.5 text-right text-[10px] font-semibold text-gray-500">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topCategories.slice(0, 6).map((cat, i) => (
                          <tr key={cat.category} className="border-b border-gray-50">
                            <td className="py-1 px-1.5 text-gray-900 truncate max-w-[120px]" title={cat.category}>
                              <span className="text-gray-400 mr-1">#{i+1}</span>
                              {cat.category.length > 20 ? cat.category.slice(0, 18) + '...' : cat.category}
                            </td>
                            <td className="py-1 px-1.5 text-right text-gray-700">{cat.count}</td>
                            <td className="py-1 px-1.5 text-right text-gray-700">{cat.share.toFixed(0)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Column 2: Competitors + Recommendations */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                      <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                      Top Competitors
                    </h3>
                    <div className="space-y-1">
                      {topCompetitors.slice(0, 5).map((comp, i) => (
                        <div key={comp.agency} className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 font-bold">#{i + 1}</span>
                            <img
                              src={getAgencyLogo(comp.agency) || '/logo/logo/UN.png'}
                              alt={comp.agency}
                              className="w-5 h-5 object-contain"
                              onError={(e) => { (e.target as HTMLImageElement).src = '/logo/logo/UN.png'; }}
                            />
                            <span className="font-medium text-gray-900 truncate max-w-[100px]">{comp.agency}</span>
                          </div>
                          <span className="font-bold text-gray-700">{comp.volume}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Recommendations
                    </h3>
                    <div className="space-y-1.5">
                      {(reportData?.recommendations || [
                        { priority: 'high' as const, area: 'Strategy', title: 'Address market gaps', rationale: 'Expand in high-growth areas' },
                        { priority: 'medium' as const, area: 'Workforce', title: 'Senior pipeline', rationale: 'Strengthen leadership depth' },
                        { priority: 'low' as const, area: 'Process', title: 'Window optimization', rationale: 'Streamline recruitment' }
                      ]).slice(0, 3).map((rec, i) => (
                        <div key={i} className={`border-l-3 pl-2 py-1 ${
                          rec.priority === 'high' ? 'border-l-red-400 bg-red-50/50' :
                          rec.priority === 'medium' ? 'border-l-amber-400 bg-amber-50/50' :
                          'border-l-blue-400 bg-blue-50/50'
                        } rounded-r text-xs`}>
                          <div className="font-semibold text-gray-900">{rec.title}</div>
                          <div className="text-gray-500 text-[10px]">{rec.rationale}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Column 3: Map preview */}
                <div>
                  <h3 className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                    <Globe className="w-3.5 h-3.5 text-green-600" />
                    Geographic Footprint
                  </h3>
                  <div className="border rounded-lg overflow-hidden h-[280px] bg-slate-50">
                    {jobs.length > 0 ? (
                      <GeographicMap
                        data={jobs}
                        marketData={marketJobs}
                        selectedAgency={agency}
                        isAgencyView={true}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                        Loading map...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 3: Workforce Pyramid + Activity Chart */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                    Workforce Structure
                  </h3>
                  <div className="border rounded-lg p-3 h-[200px] bg-gradient-to-b from-slate-50 to-white">
                    {reportData?.workforce?.pyramid ? (
                      <WorkforcePyramid
                        data={reportData.workforce.pyramid}
                        previousPeriodData={reportData.workforce.previousPyramid}
                        isAgencyView={true}
                        agencyName={agency}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                        Workforce data from API
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    Hiring Activity Timeline
                  </h3>
                  <div className="border rounded-lg p-3 h-[200px] bg-gradient-to-b from-slate-50 to-white">
                    {/* Simple activity summary - full chart requires TemporalSnapshot[] */}
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm">
                      <div className="text-3xl font-bold text-gray-900">{jobs.length}</div>
                      <div className="text-xs">Active Postings</div>
                      <div className="mt-2 text-xs text-gray-400">
                        Use Analytics Dashboard for full temporal analysis
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Compact Footer */}
            <div className="bg-gray-50 border-t px-4 py-2">
              <div className="flex items-center justify-between text-[10px] text-gray-500">
                <div><span className="font-medium">Source:</span> UN Careers Portal & Agency Sites</div>
                <div><span className="font-medium">Generated:</span> {new Date().toLocaleString()}</div>
                <div className="font-medium">Confidential - Internal Use Only</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default MonthlyReport;
