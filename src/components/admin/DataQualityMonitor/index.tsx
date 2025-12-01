/**
 * DataQualityMonitor - Simplified Data Quality Inspector
 * 
 * A single-view component for inspecting raw database records and identifying issues.
 * Replaces the previous 9-tab design with a unified table-based inspector.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { 
  RefreshCw, Download, Search, ChevronDown, ChevronRight,
  AlertCircle, AlertTriangle, Info, CheckCircle, X, ExternalLink
} from 'lucide-react';
import { ProcessedJobData } from '../../../types';

// ============================================================================
// TYPES
// ============================================================================

type IssueSeverity = 'critical' | 'warning' | 'info';

interface JobIssue {
  field: string;
  severity: IssueSeverity;
  message: string;
  currentValue: string | number | null | undefined;
}

interface JobWithIssues {
  job: ProcessedJobData;
  issues: JobIssue[];
  issueCount: { critical: number; warning: number; info: number };
}

type QuickFilter = 
  | 'duplicates'
  | 'missing_required'
  | 'invalid_dates'
  | 'bad_grades'
  | 'short_description'
  | 'geo_issues'
  | 'no_category'
  | 'all_issues'
  | 'clean';

// ============================================================================
// VALIDATION RULES
// ============================================================================

const VALID_GRADES = [
  'P-1', 'P-2', 'P-3', 'P-4', 'P-5', 'P-6', 'P-7',
  'D-1', 'D-2',
  'G-1', 'G-2', 'G-3', 'G-4', 'G-5', 'G-6', 'G-7',
  'NO-A', 'NO-B', 'NO-C', 'NO-D', 'NO-E',
  'SB-1', 'SB-2', 'SB-3', 'SB-4', 'SB-5',
  'LICA-1', 'LICA-2', 'LICA-3', 'LICA-4', 'LICA-5', 'LICA-6', 'LICA-7', 'LICA-8', 'LICA-9', 'LICA-10', 'LICA-11',
  'IPSA-1', 'IPSA-2', 'IPSA-3', 'IPSA-4', 'IPSA-5', 'IPSA-6', 'IPSA-7', 'IPSA-8', 'IPSA-9', 'IPSA-10', 'IPSA-11', 'IPSA-12',
  'NPSA-1', 'NPSA-2', 'NPSA-3', 'NPSA-4', 'NPSA-5', 'NPSA-6', 'NPSA-7', 'NPSA-8', 'NPSA-9', 'NPSA-10', 'NPSA-11',
  'SC-1', 'SC-2', 'SC-3', 'SC-4', 'SC-5', 'SC-6', 'SC-7', 'SC-8', 'SC-9', 'SC-10', 'SC-11',
  'PSA', 'UNV', 'Consultant', 'Intern', 'JPO', 'ASG', 'USG'
];

// Normalize grade for comparison (handles P5 vs P-5)
const normalizeGrade = (grade: string): string => {
  return grade.toUpperCase()
    .replace(/^P(\d)$/i, 'P-$1')
    .replace(/^D(\d)$/i, 'D-$1')
    .replace(/^G(\d)$/i, 'G-$1')
    .replace(/^NO([A-E])$/i, 'NO-$1')
    .replace(/^SB(\d)$/i, 'SB-$1')
    .replace(/^SC(\d+)$/i, 'SC-$1')
    .replace(/^LICA(\d+)$/i, 'LICA-$1')
    .replace(/^IPSA(\d+)$/i, 'IPSA-$1')
    .replace(/^NPSA(\d+)$/i, 'NPSA-$1');
};

const isValidGrade = (grade: string | null | undefined): boolean => {
  if (!grade || grade.trim() === '') return false;
  const normalized = normalizeGrade(grade.trim());
  
  // Check exact matches
  if (VALID_GRADES.includes(normalized)) return true;
  
  // Check pattern matches (includes NPSA and PSA for Service Agreements)
  const patterns = [
    /^P-[1-7]$/i, /^D-[1-2]$/i, /^G-[1-7]$/i, /^NO-[A-E]$/i,
    /^SB-[1-5]$/i, /^SC-\d{1,2}$/i, /^LICA-\d{1,2}$/i, 
    /^IPSA-\d{1,2}$/i, /^NPSA-\d{1,2}$/i, /^PSA$/i,
    /^UNV$/i, /^Consultant$/i, /^Intern$/i, /^JPO$/i, /^ASG$/i, /^USG$/i
  ];
  
  return patterns.some(p => p.test(normalized));
};

const isValidDate = (dateStr: string | null | undefined): boolean => {
  if (!dateStr || dateStr.trim() === '') return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
};

const parseDate = (dateStr: string | null | undefined): Date | null => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
};

// ============================================================================
// JOB ANALYSIS
// ============================================================================

const analyzeJob = (job: ProcessedJobData): JobWithIssues => {
  const issues: JobIssue[] = [];
  
  // Critical validations
  if (!job.title || job.title.trim().length < 5) {
    issues.push({
      field: 'title',
      severity: 'critical',
      message: !job.title ? 'Title is missing' : `Title too short (${job.title.trim().length} chars)`,
      currentValue: job.title || null
    });
  }
  
  if (!job.short_agency || job.short_agency.trim() === '') {
    issues.push({
      field: 'short_agency',
      severity: 'critical',
      message: 'Agency is missing',
      currentValue: null
    });
  }
  
  if (!isValidDate(job.posting_date)) {
    issues.push({
      field: 'posting_date',
      severity: 'critical',
      message: !job.posting_date ? 'Posting date is missing' : 'Invalid date format',
      currentValue: job.posting_date || null
    });
  }
  
  if (!isValidDate(job.apply_until)) {
    issues.push({
      field: 'apply_until',
      severity: 'critical',
      message: !job.apply_until ? 'Apply deadline is missing' : 'Invalid date format',
      currentValue: job.apply_until || null
    });
  }
  
  // Date logic check
  const postingDate = parseDate(job.posting_date);
  const applyUntil = parseDate(job.apply_until);
  if (postingDate && applyUntil && applyUntil < postingDate) {
    issues.push({
      field: 'apply_until',
      severity: 'critical',
      message: 'Apply deadline is before posting date',
      currentValue: `Posted: ${job.posting_date}, Deadline: ${job.apply_until}`
    });
  }
  
  // Warning validations
  const descLength = (job.description || '').trim().length;
  if (descLength < 100) {
    issues.push({
      field: 'description',
      severity: 'warning',
      message: descLength === 0 ? 'Description is empty' : `Description too short (${descLength} chars)`,
      currentValue: descLength
    });
  }
  
  // Check for boilerplate content
  const boilerplatePhrases = ['see attached', 'refer to attached', 'tor attached', 'see the attached'];
  const descLower = (job.description || '').toLowerCase();
  if (descLength < 300 && boilerplatePhrases.some(p => descLower.includes(p))) {
    issues.push({
      field: 'description',
      severity: 'warning',
      message: 'Description contains only boilerplate - real content may be in attachment',
      currentValue: job.description?.slice(0, 100)
    });
  }
  
  if (!job.duty_station || job.duty_station.trim() === '') {
    issues.push({
      field: 'duty_station',
      severity: 'warning',
      message: 'Duty station is missing',
      currentValue: null
    });
  }
  
  if (job.duty_station && (!job.duty_country || job.duty_country.trim() === '')) {
    issues.push({
      field: 'duty_country',
      severity: 'warning',
      message: `Duty station "${job.duty_station}" not mapped to country`,
      currentValue: null
    });
  }
  
  if (job.duty_country && (!job.duty_continent || job.duty_continent.trim() === '')) {
    issues.push({
      field: 'duty_continent',
      severity: 'info',
      message: `Country "${job.duty_country}" not mapped to continent`,
      currentValue: null
    });
  }
  
  if (job.up_grade && !isValidGrade(job.up_grade)) {
    issues.push({
      field: 'up_grade',
      severity: 'warning',
      message: `Unrecognized grade format "${job.up_grade}"`,
      currentValue: job.up_grade
    });
  }
  
  // Info validations
  if (!job.sectoral_category || job.sectoral_category.trim() === '') {
    issues.push({
      field: 'sectoral_category',
      severity: 'info',
      message: 'Sectoral category not assigned',
      currentValue: null
    });
  }
  
  if (!job.job_labels || job.job_labels.trim() === '') {
    issues.push({
      field: 'job_labels',
      severity: 'info',
      message: 'Job labels not generated',
      currentValue: null
    });
  }
  
  const issueCount = {
    critical: issues.filter(i => i.severity === 'critical').length,
    warning: issues.filter(i => i.severity === 'warning').length,
    info: issues.filter(i => i.severity === 'info').length
  };
  
  return { job, issues, issueCount };
};

const analyzeAllJobs = (jobs: ProcessedJobData[]): JobWithIssues[] => {
  return jobs.map(analyzeJob);
};

// ============================================================================
// DUPLICATE DETECTION
// ============================================================================

interface DuplicateInfo {
  jobId: string;
  duplicateIds: string[];
  type: 'same_uniquecode' | 'same_title_location';
}

const detectDuplicates = (jobs: ProcessedJobData[]): Map<string, DuplicateInfo> => {
  const duplicateMap = new Map<string, DuplicateInfo>();
  
  // Check for same uniquecode
  const uniquecodeMap = new Map<string, ProcessedJobData[]>();
  for (const job of jobs) {
    if (job.uniquecode) {
      const key = String(job.uniquecode);
      if (!uniquecodeMap.has(key)) {
        uniquecodeMap.set(key, []);
      }
      uniquecodeMap.get(key)!.push(job);
    }
  }
  
  for (const [, dupeJobs] of uniquecodeMap) {
    if (dupeJobs.length > 1) {
      for (const job of dupeJobs) {
        duplicateMap.set(String(job.id), {
          jobId: String(job.id),
          duplicateIds: dupeJobs.filter(j => j.id !== job.id).map(j => String(j.id)),
          type: 'same_uniquecode'
        });
      }
    }
  }
  
  return duplicateMap;
};

// ============================================================================
// FILTER LOGIC
// ============================================================================

const matchesQuickFilter = (
  jobWithIssues: JobWithIssues, 
  filter: QuickFilter,
  duplicateMap: Map<string, DuplicateInfo>
): boolean => {
  const { job, issues, issueCount } = jobWithIssues;
  const totalIssues = issueCount.critical + issueCount.warning + issueCount.info;
  
  switch (filter) {
    case 'duplicates':
      return duplicateMap.has(String(job.id));
    case 'missing_required':
      return issues.some(i => 
        i.severity === 'critical' && 
        ['title', 'short_agency', 'posting_date', 'apply_until'].includes(i.field)
      );
    case 'invalid_dates':
      return issues.some(i => 
        ['posting_date', 'apply_until'].includes(i.field)
      );
    case 'bad_grades':
      return issues.some(i => i.field === 'up_grade');
    case 'short_description':
      return issues.some(i => i.field === 'description');
    case 'geo_issues':
      return issues.some(i => 
        ['duty_station', 'duty_country', 'duty_continent'].includes(i.field)
      );
    case 'no_category':
      return issues.some(i => i.field === 'sectoral_category');
    case 'all_issues':
      return totalIssues > 0;
    case 'clean':
      return totalIssues === 0;
    default:
      return true;
  }
};

const matchesSearch = (jobWithIssues: JobWithIssues, searchTerm: string): boolean => {
  const { job } = jobWithIssues;
  const term = searchTerm.toLowerCase();
  return (
    String(job.id).includes(term) ||
    (job.title || '').toLowerCase().includes(term) ||
    (job.short_agency || '').toLowerCase().includes(term) ||
    (job.duty_station || '').toLowerCase().includes(term)
  );
};

// ============================================================================
// DATABASE FIELDS CONFIG
// ============================================================================

const DATABASE_FIELDS: { key: keyof ProcessedJobData; label: string; group: string }[] = [
  { key: 'id', label: 'ID', group: 'Identity' },
  { key: 'url', label: 'URL', group: 'Identity' },
  { key: 'uniquecode', label: 'Unique Code', group: 'Identity' },
  { key: 'title', label: 'Title', group: 'Core' },
  { key: 'description', label: 'Description', group: 'Core' },
  { key: 'short_agency', label: 'Agency (Short)', group: 'Organization' },
  { key: 'long_agency', label: 'Agency (Long)', group: 'Organization' },
  { key: 'department', label: 'Department', group: 'Organization' },
  { key: 'pipeline', label: 'Pipeline', group: 'Organization' },
  { key: 'duty_station', label: 'Duty Station', group: 'Location' },
  { key: 'duty_country', label: 'Country', group: 'Location' },
  { key: 'duty_continent', label: 'Continent', group: 'Location' },
  { key: 'country_code', label: 'Country Code', group: 'Location' },
  { key: 'up_grade', label: 'Grade', group: 'Classification' },
  { key: 'sectoral_category', label: 'Sector Category', group: 'Classification' },
  { key: 'job_labels', label: 'Job Labels', group: 'Classification' },
  { key: 'hs_min_exp', label: 'HS Min Exp', group: 'Experience' },
  { key: 'bachelor_min_exp', label: 'Bachelor Min Exp', group: 'Experience' },
  { key: 'master_min_exp', label: 'Master Min Exp', group: 'Experience' },
  { key: 'posting_date', label: 'Posted', group: 'Dates' },
  { key: 'apply_until', label: 'Deadline', group: 'Dates' },
  { key: 'languages', label: 'Languages', group: 'Requirements' },
  { key: 'eligible_nationality', label: 'Nationality', group: 'Requirements' },
  { key: 'ideal_candidate', label: 'Ideal Candidate', group: 'Content' },
  { key: 'archived', label: 'Archived', group: 'Status' },
  { key: 'created_at', label: 'Created At', group: 'Metadata' },
  { key: 'updated_at', label: 'Updated At', group: 'Metadata' },
];

// ============================================================================
// COMPONENT
// ============================================================================

interface DataQualityMonitorProps {
  data: ProcessedJobData[];
}

export const DataQualityMonitor: React.FC<DataQualityMonitorProps> = ({ data }) => {
  // State
  const [activeFilter, setActiveFilter] = useState<QuickFilter | null>(null);
  const [fieldFilter, setFieldFilter] = useState<string | null>(null);
  const [agencyFilter, setAgencyFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPipelineHealth, setShowPipelineHealth] = useState(false);
  
  // Analyze all jobs
  const analyzedJobs = useMemo(() => analyzeAllJobs(data), [data]);
  
  // Detect duplicates
  const duplicateMap = useMemo(() => detectDuplicates(data), [data]);
  
  // Get unique agencies
  const agencies = useMemo(() => {
    const set = new Set(data.map(j => j.short_agency).filter(Boolean));
    return Array.from(set).sort();
  }, [data]);
  
  // Get unique fields with issues
  const issueFields = useMemo(() => {
    const set = new Set<string>();
    analyzedJobs.forEach(aj => aj.issues.forEach(i => set.add(i.field)));
    return Array.from(set).sort();
  }, [analyzedJobs]);
  
  // Filter jobs
  const filteredJobs = useMemo(() => {
    return analyzedJobs.filter(jobWithIssues => {
      if (activeFilter && !matchesQuickFilter(jobWithIssues, activeFilter, duplicateMap)) return false;
      if (fieldFilter && !jobWithIssues.issues.some(i => i.field === fieldFilter)) return false;
      if (agencyFilter && jobWithIssues.job.short_agency !== agencyFilter) return false;
      if (searchTerm && !matchesSearch(jobWithIssues, searchTerm)) return false;
      return true;
    });
  }, [analyzedJobs, activeFilter, fieldFilter, agencyFilter, searchTerm, duplicateMap]);
  
  // Calculate stats
  const stats = useMemo(() => {
    const critical = analyzedJobs.filter(j => j.issueCount.critical > 0).length;
    const warning = analyzedJobs.filter(j => j.issueCount.warning > 0 && j.issueCount.critical === 0).length;
    const clean = analyzedJobs.filter(j => 
      j.issueCount.critical === 0 && j.issueCount.warning === 0 && j.issueCount.info === 0
    ).length;
    const duplicateCount = duplicateMap.size;
    
    return { total: data.length, critical, warning, clean, duplicateCount };
  }, [analyzedJobs, data.length, duplicateMap]);
  
  // Pipeline health by agency
  const pipelineHealth = useMemo(() => {
    const agencyMap = new Map<string, { total: number; issues: number }>();
    
    analyzedJobs.forEach(aj => {
      const agency = aj.job.short_agency || 'Unknown';
      if (!agencyMap.has(agency)) {
        agencyMap.set(agency, { total: 0, issues: 0 });
      }
      const entry = agencyMap.get(agency)!;
      entry.total++;
      if (aj.issueCount.critical + aj.issueCount.warning > 0) {
        entry.issues++;
      }
    });
    
    return Array.from(agencyMap.entries())
      .map(([agency, { total, issues }]) => ({
        agency,
        total,
        issues,
        healthy: issues === 0
      }))
      .sort((a, b) => b.issues - a.issues);
  }, [analyzedJobs]);
  
  // Handlers
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 500);
  }, []);
  
  const handleExport = useCallback(() => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      stats,
      jobs: filteredJobs.map(fj => ({
        id: fj.job.id,
        title: fj.job.title,
        agency: fj.job.short_agency,
        issues: fj.issues
      }))
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-quality-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [stats, filteredJobs]);
  
  const clearFilters = () => {
    setActiveFilter(null);
    setFieldFilter(null);
    setAgencyFilter(null);
    setSearchTerm('');
  };
  
  const getSeverityIcon = (severity: IssueSeverity) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-400" />;
    }
  };
  
  const getFieldStatus = (job: ProcessedJobData, field: string, issues: JobIssue[]) => {
    const issue = issues.find(i => i.field === field);
    if (issue) {
      return {
        icon: getSeverityIcon(issue.severity),
        className: issue.severity === 'critical' ? 'bg-red-50 text-red-700' :
                   issue.severity === 'warning' ? 'bg-amber-50 text-amber-700' :
                   'bg-blue-50 text-blue-600'
      };
    }
    return { icon: <CheckCircle className="h-4 w-4 text-emerald-500" />, className: '' };
  };
  
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '(empty)';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'string') {
      if (value.trim() === '') return '(empty)';
      if (value.length > 100) return value.slice(0, 100) + '...';
      return value;
    }
    return String(value);
  };
  
  // Quick filter buttons config
  const quickFilters: { id: QuickFilter; label: string; count: number }[] = [
    { id: 'duplicates', label: 'Duplicates', count: stats.duplicateCount },
    { id: 'missing_required', label: 'Missing Required', count: analyzedJobs.filter(j => j.issues.some(i => i.severity === 'critical' && ['title', 'short_agency', 'posting_date', 'apply_until'].includes(i.field))).length },
    { id: 'invalid_dates', label: 'Invalid Dates', count: analyzedJobs.filter(j => j.issues.some(i => ['posting_date', 'apply_until'].includes(i.field))).length },
    { id: 'bad_grades', label: 'Bad Grades', count: analyzedJobs.filter(j => j.issues.some(i => i.field === 'up_grade')).length },
    { id: 'short_description', label: 'Short Desc', count: analyzedJobs.filter(j => j.issues.some(i => i.field === 'description')).length },
    { id: 'geo_issues', label: 'Geo Issues', count: analyzedJobs.filter(j => j.issues.some(i => ['duty_station', 'duty_country', 'duty_continent'].includes(i.field))).length },
    { id: 'no_category', label: 'No Category', count: analyzedJobs.filter(j => j.issues.some(i => i.field === 'sectoral_category')).length },
  ];
  
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="max-w-full mx-auto px-4 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Search className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 font-mono">DATA QUALITY INSPECTOR</h1>
              <p className="text-xs text-slate-500 font-mono">
                Raw database inspection • {data.length.toLocaleString()} records
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded text-sm hover:bg-slate-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span className="font-mono">Export</span>
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3 py-1.5 bg-amber-600 rounded text-sm hover:bg-amber-500 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="font-mono">Refresh</span>
            </button>
          </div>
        </div>
        
        {/* Quick Stats Bar */}
        <div className="flex items-center gap-6 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700 mb-4 font-mono text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Total:</span>
            <span className="font-bold text-slate-100">{stats.total.toLocaleString()}</span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <span className="text-slate-400">Critical:</span>
            <span className="font-bold text-red-400">{stats.critical}</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-slate-400">Warnings:</span>
            <span className="font-bold text-amber-400">{stats.warning}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <span className="text-slate-400">Clean:</span>
            <span className="font-bold text-emerald-400">{stats.clean}</span>
          </div>
        </div>
        
        {/* Filter Bar */}
        <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-3 mb-4">
          {/* Top row: Dropdowns and Search */}
          <div className="flex items-center gap-3 mb-3">
            <select
              value={activeFilter || ''}
              onChange={(e) => setActiveFilter(e.target.value as QuickFilter || null)}
              className="bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm font-mono focus:border-amber-500 focus:outline-none"
            >
              <option value="">All Issues</option>
              <option value="all_issues">With Any Issue</option>
              <option value="clean">Clean Only</option>
            </select>
            
            <select
              value={fieldFilter || ''}
              onChange={(e) => setFieldFilter(e.target.value || null)}
              className="bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm font-mono focus:border-amber-500 focus:outline-none"
            >
              <option value="">All Fields</option>
              {issueFields.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            
            <select
              value={agencyFilter || ''}
              onChange={(e) => setAgencyFilter(e.target.value || null)}
              className="bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm font-mono focus:border-amber-500 focus:outline-none"
            >
              <option value="">All Agencies</option>
              {agencies.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search ID, title, station..."
                className="w-full bg-slate-900 border border-slate-600 rounded pl-9 pr-3 py-1.5 text-sm font-mono focus:border-amber-500 focus:outline-none placeholder-slate-500"
              />
            </div>
            
            {(activeFilter || fieldFilter || agencyFilter || searchTerm) && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-2 py-1.5 text-xs text-slate-400 hover:text-slate-100 transition-colors"
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            )}
          </div>
          
          {/* Quick Filters Row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500 font-mono">Quick:</span>
            {quickFilters.map(qf => (
              <button
                key={qf.id}
                onClick={() => setActiveFilter(activeFilter === qf.id ? null : qf.id)}
                className={`px-2 py-1 text-xs font-mono rounded border transition-colors ${
                  activeFilter === qf.id
                    ? 'bg-amber-600 border-amber-500 text-white'
                    : 'bg-slate-900 border-slate-600 text-slate-300 hover:border-slate-500'
                }`}
              >
                {qf.label} {qf.count > 0 && <span className="text-amber-300">({qf.count})</span>}
              </button>
            ))}
          </div>
        </div>
        
        {/* Results count */}
        <div className="text-xs text-slate-500 font-mono mb-2">
          Showing {filteredJobs.length.toLocaleString()} of {data.length.toLocaleString()} jobs
        </div>
        
        {/* Jobs Table */}
        <div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900/50">
              <tr className="border-b border-slate-700">
                <th className="text-left px-3 py-2 font-mono text-slate-400 w-16">ID</th>
                <th className="text-left px-3 py-2 font-mono text-slate-400">Title</th>
                <th className="text-left px-3 py-2 font-mono text-slate-400 w-24">Agency</th>
                <th className="text-left px-3 py-2 font-mono text-slate-400 w-28">Issues</th>
                <th className="text-left px-3 py-2 font-mono text-slate-400">Fields w/ Errors</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.slice(0, 100).map((jobWithIssues) => {
                const { job, issues, issueCount } = jobWithIssues;
                const isExpanded = expandedJobId === String(job.id);
                const hasDuplicate = duplicateMap.has(String(job.id));
                const totalIssues = issueCount.critical + issueCount.warning;
                
                return (
                  <React.Fragment key={job.id}>
                    <tr
                      onClick={() => setExpandedJobId(isExpanded ? null : String(job.id))}
                      className={`border-b border-slate-700/50 cursor-pointer transition-colors ${
                        isExpanded ? 'bg-slate-700/30' : 'hover:bg-slate-700/20'
                      } ${totalIssues > 0 ? '' : 'opacity-60'}`}
                    >
                      <td className="px-3 py-2 font-mono text-slate-300">
                        <div className="flex items-center gap-1">
                          {isExpanded ? (
                            <ChevronDown className="h-3 w-3 text-slate-500" />
                          ) : (
                            <ChevronRight className="h-3 w-3 text-slate-500" />
                          )}
                          {job.id}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-slate-200 truncate max-w-md">
                        {job.title || <span className="text-red-400">(no title)</span>}
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-300">
                        {job.short_agency || '—'}
                      </td>
                      <td className="px-3 py-2">
                        {totalIssues > 0 ? (
                          <div className="flex items-center gap-1.5">
                            {issueCount.critical > 0 && (
                              <span className="flex items-center gap-0.5 text-red-400">
                                <AlertCircle className="h-3 w-3" />
                                {issueCount.critical}
                              </span>
                            )}
                            {issueCount.warning > 0 && (
                              <span className="flex items-center gap-0.5 text-amber-400">
                                <AlertTriangle className="h-3 w-3" />
                                {issueCount.warning}
                              </span>
                            )}
                            {hasDuplicate && (
                              <span className="text-xs bg-purple-500/20 text-purple-300 px-1 rounded">
                                DUP
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {issues.length > 0 ? (
                          <span className="text-slate-400">
                            {issues.slice(0, 3).map(i => i.field).join(', ')}
                            {issues.length > 3 && ` +${issues.length - 3}`}
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                    
                    {/* Expanded Row */}
                    {isExpanded && (
                      <tr className="bg-slate-900/50">
                        <td colSpan={5} className="p-4">
                          <div className="space-y-4">
                            {/* Issues Summary */}
                            {issues.length > 0 && (
                              <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                                <h4 className="font-mono text-xs text-slate-400 mb-2 uppercase tracking-wider">
                                  Issues Detected
                                </h4>
                                <div className="space-y-1">
                                  {issues.map((issue, idx) => (
                                    <div 
                                      key={idx} 
                                      className="flex items-start gap-2 text-sm"
                                    >
                                      {getSeverityIcon(issue.severity)}
                                      <span className="font-mono text-slate-400">{issue.field}:</span>
                                      <span className="text-slate-200">{issue.message}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Duplicate Info */}
                            {hasDuplicate && (
                              <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/30">
                                <h4 className="font-mono text-xs text-purple-300 mb-2 uppercase tracking-wider">
                                  Duplicate Detected
                                </h4>
                                <p className="text-sm text-purple-200">
                                  Same uniquecode as: {duplicateMap.get(String(job.id))?.duplicateIds.join(', ')}
                                </p>
                              </div>
                            )}
                            
                            {/* All Fields Table */}
                            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                              <div className="px-3 py-2 border-b border-slate-700 flex items-center justify-between">
                                <h4 className="font-mono text-xs text-slate-400 uppercase tracking-wider">
                                  All Fields
                                </h4>
                                {job.url && (
                                  <a 
                                    href={job.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    View Original
                                  </a>
                                )}
                              </div>
                              <table className="w-full text-xs">
                                <thead className="bg-slate-900/30">
                                  <tr>
                                    <th className="text-left px-3 py-1.5 font-mono text-slate-500 w-40">Field</th>
                                    <th className="text-left px-3 py-1.5 font-mono text-slate-500">Value</th>
                                    <th className="text-left px-3 py-1.5 font-mono text-slate-500 w-20">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {DATABASE_FIELDS.map(({ key, label }) => {
                                    const value = job[key];
                                    const status = getFieldStatus(job, key, issues);
                                    const issueForField = issues.find(i => i.field === key);
                                    
                                    return (
                                      <tr 
                                        key={key} 
                                        className={`border-t border-slate-700/30 ${status.className}`}
                                      >
                                        <td className="px-3 py-1.5 font-mono text-slate-400">
                                          {label}
                                        </td>
                                        <td className="px-3 py-1.5 font-mono text-slate-200 break-all">
                                          {formatValue(value)}
                                        </td>
                                        <td className="px-3 py-1.5">
                                          <div className="flex items-center gap-1">
                                            {status.icon}
                                            {issueForField && (
                                              <span className="text-xs text-slate-400 truncate max-w-24">
                                                {issueForField.severity === 'critical' ? 'Error' :
                                                 issueForField.severity === 'warning' ? 'Warn' : 'Info'}
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
          
          {filteredJobs.length === 0 && (
            <div className="px-4 py-8 text-center text-slate-500">
              <p className="font-mono">No jobs match the current filters</p>
            </div>
          )}
          
          {filteredJobs.length > 100 && (
            <div className="px-4 py-2 text-center text-slate-500 text-xs border-t border-slate-700">
              Showing first 100 results. Use filters to narrow down.
            </div>
          )}
        </div>
        
        {/* Pipeline Health Mini-Summary */}
        <div className="mt-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <button
            onClick={() => setShowPipelineHealth(!showPipelineHealth)}
            className="w-full px-4 py-2 flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2">
              {showPipelineHealth ? (
                <ChevronDown className="h-4 w-4 text-slate-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-slate-500" />
              )}
              <span className="font-mono text-sm text-slate-400">Pipeline Health:</span>
              <div className="flex items-center gap-2 ml-2">
                {pipelineHealth.slice(0, 6).map(ph => (
                  <span 
                    key={ph.agency}
                    className={`text-xs font-mono ${ph.healthy ? 'text-emerald-400' : 'text-amber-400'}`}
                  >
                    {ph.agency} {ph.healthy ? '✓' : `⚠${ph.issues}`}
                  </span>
                ))}
                {pipelineHealth.length > 6 && (
                  <span className="text-xs text-slate-500">+{pipelineHealth.length - 6} more</span>
                )}
              </div>
            </div>
          </button>
          
          {showPipelineHealth && (
            <div className="px-4 pb-4 border-t border-slate-700 pt-3">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {pipelineHealth.map(ph => (
                  <div 
                    key={ph.agency}
                    className={`p-2 rounded border ${
                      ph.healthy 
                        ? 'bg-emerald-500/10 border-emerald-500/30' 
                        : 'bg-amber-500/10 border-amber-500/30'
                    }`}
                  >
                    <div className="font-mono text-sm font-bold text-slate-200">{ph.agency}</div>
                    <div className="text-xs text-slate-400">
                      {ph.total} jobs • {ph.issues} issues
                    </div>
                    <div className={`text-xs font-mono ${ph.healthy ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {ph.healthy ? '✓ Healthy' : `⚠ ${Math.round((ph.issues / ph.total) * 100)}% issues`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="text-center text-xs text-slate-600 mt-4 font-mono">
          <p>Pipeline: backup → scraper → extractor → geo → jobexp → lang → clean → labelor → bertizer → categorizer → import</p>
          <p className="mt-1">This view is read-only. Fixes must be applied in pipeline scripts.</p>
        </div>
      </div>
    </div>
  );
};

export default DataQualityMonitor;
