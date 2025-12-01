/**
 * LocationDetailPanel Component
 * Detailed view when clicking on a location bubble
 */

import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Building2, 
  Users, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Crown,
  ChevronRight,
  BarChart3,
  Briefcase,
  ExternalLink,
  Search,
  Calendar
} from 'lucide-react';
import { LocationDetailData, LocationJobData, HARDSHIP_BUBBLE_COLORS, TREND_COLORS } from './types';
import { format, parseISO } from 'date-fns';

interface LocationDetailPanelProps {
  data: LocationDetailData | null;
  onClose: () => void;
  selectedAgencyName?: string;
  isAgencyView: boolean;
}

const LocationDetailPanel: React.FC<LocationDetailPanelProps> = ({
  data,
  onClose,
  selectedAgencyName,
  isAgencyView,
}) => {
  const [jobSearch, setJobSearch] = useState('');
  const [showAllJobs, setShowAllJobs] = useState(false);
  
  if (!data) return null;

  const { location, categoryBreakdown, gradeBreakdown, agencyRanking, jobs } = data;
  
  // Find your agency's rank
  const yourRank = agencyRanking.findIndex(a => a.isYou) + 1;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 overflow-hidden flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: HARDSHIP_BUBBLE_COLORS[location.hardshipClass] }}
              />
              <h2 className="text-lg font-bold">{location.dutyStation}</h2>
            </div>
            <p className="text-slate-300 text-sm">{location.country}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-700 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-slate-700/50 rounded-lg p-2 text-center">
            <div className="text-xl font-bold">{location.hardshipClass}</div>
            <div className="text-[10px] text-slate-400">Hardship</div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-2 text-center">
            <div className="text-xl font-bold">{location.locationType}</div>
            <div className="text-[10px] text-slate-400">Type</div>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-2 text-center">
            {/* In agency view, show job count; in market view, show agencies */}
            <div className="text-xl font-bold">
              {isAgencyView ? location.yourJobCount : location.agencyCount}
            </div>
            <div className="text-[10px] text-slate-400">
              {isAgencyView ? 'Jobs' : 'Agencies'}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Your Agency Stats (if agency view) */}
        {isAgencyView && location.yourJobCount > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-800">Your Positions</span>
              </div>
              <span className="text-2xl font-bold text-blue-600">{location.yourJobCount}</span>
            </div>
            
            {/* Trend */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-blue-700">Trend:</span>
              <span 
                className="flex items-center gap-1 text-sm font-medium"
                style={{ color: TREND_COLORS[location.yourTrend.direction] }}
              >
                {location.yourTrend.direction === 'up' && (
                  <>
                    <TrendingUp className="h-4 w-4" />
                    +{location.yourTrend.change} vs last month
                  </>
                )}
                {location.yourTrend.direction === 'down' && (
                  <>
                    <TrendingDown className="h-4 w-4" />
                    {location.yourTrend.change} vs last month
                  </>
                )}
                {location.yourTrend.direction === 'stable' && (
                  <span className="text-gray-500">Stable</span>
                )}
                {location.yourTrend.direction === 'new' && (
                  <span className="text-blue-600">★ New this month</span>
                )}
              </span>
            </div>

            {/* Market Share */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-blue-700">Your Market Share</span>
              <span className="font-bold text-blue-800">{location.yourMarketShare.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-blue-200 rounded-full mt-1 overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${location.yourMarketShare}%` }}
              />
            </div>
          </div>
        )}

        {/* Who Else Recruits Here - Only show in market view (in agency view it only shows 1 agency) */}
        {!isAgencyView && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-semibold text-gray-800">Agencies Recruiting Here</span>
                </div>
                <span className="text-xs text-gray-500">
                  Total: {location.totalMarketJobs} positions
                </span>
              </div>
            </div>
            
            <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
              {agencyRanking.slice(0, 10).map((agency, idx) => (
                <div 
                  key={agency.agency}
                  className={`flex items-center gap-2 p-2 rounded-lg ${
                    agency.isYou ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    idx === 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className={`flex-1 text-sm ${agency.isYou ? 'font-medium text-blue-800' : 'text-gray-700'}`}>
                    {agency.agency}
                    {agency.isYou && <span className="ml-1 text-[10px] text-blue-600">(you)</span>}
                  </span>
                  <span className="text-sm font-medium text-gray-600">{agency.count}</span>
                  <span className="text-[10px] text-gray-400 w-12 text-right">{agency.share.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Breakdown (only if you have positions) */}
        {location.yourJobCount > 0 && categoryBreakdown.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-semibold text-gray-800">Your Categories</span>
              </div>
            </div>
            
            <div className="p-3 space-y-2">
              {categoryBreakdown.slice(0, 6).map(cat => (
                <div key={cat.category} className="flex items-center gap-2">
                  <span 
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="flex-1 text-xs text-gray-700 truncate">{cat.category}</span>
                  <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full"
                      style={{ 
                        width: `${cat.percentage}%`,
                        backgroundColor: cat.color 
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-8 text-right">{cat.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grade Breakdown */}
        {location.yourJobCount > 0 && gradeBreakdown.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-semibold text-gray-800">Your Grade Distribution</span>
              </div>
            </div>
            
            <div className="p-3 grid grid-cols-2 gap-2">
              {gradeBreakdown.slice(0, 8).map(grade => (
                <div key={grade.grade} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <span className="text-xs font-medium text-gray-700">{grade.grade}</span>
                  <span className="flex-1" />
                  <span className="text-xs text-gray-500">{grade.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Jobs at this Location */}
        {jobs.length > 0 && (
          <LocationJobList 
            jobs={jobs}
            search={jobSearch}
            onSearchChange={setJobSearch}
            showAll={showAllJobs}
            onShowAllChange={setShowAllJobs}
            isAgencyView={isAgencyView}
            selectedAgencyName={selectedAgencyName}
          />
        )}

        {/* Competition Insight - Only show in market view (doesn't make sense for single agency) */}
        {!isAgencyView && (
          <div className={`rounded-lg p-4 ${
            location.competitionLevel === 'high' 
              ? 'bg-red-50 border border-red-200' 
              : location.competitionLevel === 'medium'
              ? 'bg-amber-50 border border-amber-200'
              : 'bg-green-50 border border-green-200'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-full ${
                location.competitionLevel === 'high' 
                  ? 'bg-red-100' 
                  : location.competitionLevel === 'medium'
                  ? 'bg-amber-100'
                  : 'bg-green-100'
              }`}>
                <AlertTriangle className={`h-4 w-4 ${
                  location.competitionLevel === 'high' 
                    ? 'text-red-600' 
                    : location.competitionLevel === 'medium'
                    ? 'text-amber-600'
                    : 'text-green-600'
                }`} />
              </div>
              <div>
                <h4 className={`text-sm font-semibold mb-1 ${
                  location.competitionLevel === 'high' 
                    ? 'text-red-800' 
                    : location.competitionLevel === 'medium'
                    ? 'text-amber-800'
                    : 'text-green-800'
                }`}>
                  {location.competitionLevel === 'high' && 'High Competition'}
                  {location.competitionLevel === 'medium' && 'Moderate Competition'}
                  {location.competitionLevel === 'low' && 'Low Competition'}
                </h4>
                <p className={`text-xs ${
                  location.competitionLevel === 'high' 
                    ? 'text-red-700' 
                    : location.competitionLevel === 'medium'
                    ? 'text-amber-700'
                    : 'text-green-700'
                }`}>
                  {data.competitionInsight}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Trend Insight */}
        {data.trendInsight && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 rounded-full">
                <TrendingUp className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-1">Trend Analysis</h4>
                <p className="text-xs text-gray-600">{data.trendInsight}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {isAgencyView && yourRank > 0 && (
        <div className="bg-slate-50 border-t border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {yourRank === 1 && <Crown className="h-4 w-4 text-amber-500" />}
              <span className="text-sm text-gray-600">
                {selectedAgencyName} is <span className="font-semibold">#{yourRank}</span> recruiter here
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Compact job list for location detail panel
 */
interface LocationJobListProps {
  jobs: LocationJobData[];
  search: string;
  onSearchChange: (search: string) => void;
  showAll: boolean;
  onShowAllChange: (showAll: boolean) => void;
  isAgencyView: boolean;
  selectedAgencyName?: string;
}

const LocationJobList: React.FC<LocationJobListProps> = ({
  jobs,
  search,
  onSearchChange,
  showAll,
  onShowAllChange,
  isAgencyView,
  selectedAgencyName,
}) => {
  // Count active and closed jobs
  const activeCount = jobs.filter(j => j.isActive).length;
  const closedCount = jobs.length - activeCount;
  
  // Filter jobs by search
  const filteredJobs = jobs.filter(job => {
    if (!search.trim()) return true;
    const searchLower = search.toLowerCase();
    return (
      job.title.toLowerCase().includes(searchLower) ||
      job.agency.toLowerCase().includes(searchLower) ||
      job.category.toLowerCase().includes(searchLower) ||
      job.grade.toLowerCase().includes(searchLower)
    );
  });
  
  // Show limited jobs unless "show all" is clicked
  const displayedJobs = showAll ? filteredJobs : filteredJobs.slice(0, 5);
  const hasMore = filteredJobs.length > 5;

  // Format date safely
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      return format(parseISO(dateStr), 'MMM d');
    } catch {
      return dateStr.substring(0, 10);
    }
  };

  // Get status badge for a job
  const getStatusBadge = (job: LocationJobData) => {
    if (job.isActive) {
      if (job.status === 'closing_soon' || job.daysRemaining <= 3) {
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] rounded font-medium">
            {job.daysRemaining}d left
          </span>
        );
      }
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 bg-green-100 text-green-700 text-[9px] rounded font-medium">
          Open
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[9px] rounded font-medium">
        Closed
      </span>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-semibold text-gray-800">
              Positions Posted
            </span>
          </div>
          {/* Status summary */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] rounded font-medium">
              {activeCount} open
            </span>
            {closedCount > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded font-medium">
                {closedCount} closed
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Search bar */}
      <div className="p-2 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search positions..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      {/* Job list */}
      <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
        {displayedJobs.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-500">
            No positions found
          </div>
        ) : (
          displayedJobs.map((job, idx) => (
            <div 
              key={job.id || idx} 
              className={`p-3 hover:bg-gray-50 transition-colors ${
                job.isYourAgency ? 'bg-blue-50/50' : ''
              } ${!job.isActive ? 'opacity-60' : ''}`}
            >
              {/* Title row */}
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <h4 className={`text-xs font-medium leading-tight line-clamp-2 ${
                    job.isActive ? 'text-gray-800' : 'text-gray-500'
                  }`}>
                    {job.title}
                  </h4>
                  {/* Job link */}
                  {job.url && (
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700 flex-shrink-0"
                      title="View Job Ad"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                {/* Status badge */}
                {getStatusBadge(job)}
              </div>
              
              {/* Meta row */}
              <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                {/* Your agency badge */}
                {job.isYourAgency && (
                  <span className="inline-flex items-center px-1 py-0.5 bg-blue-100 text-blue-700 text-[9px] rounded font-medium">
                    Your Agency
                  </span>
                )}
                
                {/* Category badge */}
                <span 
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium"
                  style={{ 
                    backgroundColor: `${job.categoryColor}15`, 
                    color: job.categoryColor 
                  }}
                >
                  {job.category}
                </span>
                
                {/* Grade */}
                <span className="text-[10px] text-gray-500 font-medium">
                  {job.grade}
                </span>
                
                {/* Agency */}
                <span className="text-[10px] text-gray-400">
                  {job.agency}
                </span>
                
                {/* Posted date */}
                {job.postingDate && (
                  <span className="text-[10px] text-gray-400 flex items-center gap-0.5 ml-auto" title="Posted">
                    <Calendar className="h-2.5 w-2.5" />
                    {formatDate(job.postingDate)}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Show more / less */}
      {hasMore && (
        <div className="p-2 border-t border-gray-100 bg-gray-50">
          <button
            onClick={() => onShowAllChange(!showAll)}
            className="w-full text-xs text-blue-600 hover:text-blue-700 font-medium py-1"
          >
            {showAll 
              ? 'Show less' 
              : `Show all ${filteredJobs.length} positions`
            }
          </button>
        </div>
      )}
    </div>
  );
};

export default LocationDetailPanel;

