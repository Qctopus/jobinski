import React, { useState, useMemo } from 'react';
import { Search, Eye, CheckCircle, ChevronDown, ExternalLink } from 'lucide-react';
import { ProcessedJobData } from '../types';
import { JOB_CLASSIFICATION_DICTIONARY } from '../dictionary';
import { JobFeedback } from '../types/feedback';
import { JobDetailsModal } from './JobDetailsModal';
import { saveCorrection, getCorrectionsMap, StoredCorrection } from '../utils/correctionPersistence';
import { apiClient } from '../services/api/ApiClient';
import { unifiedLearningEngine } from '../services/learning/UnifiedLearningEngine';

interface CompactJobBrowserProps {
  data: ProcessedJobData[];
}

export const CompactJobBrowser: React.FC<CompactJobBrowserProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAgency, setSelectedAgency] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'date' | 'confidence' | 'title' | 'grade'>('confidence');
  // Load persisted corrections on mount
  const [userCorrections, setUserCorrections] = useState<Map<string, string>>(() => getCorrectionsMap());
  const [confirmedJobs, setConfirmedJobs] = useState<Set<string>>(new Set());
  const [selectedJob, setSelectedJob] = useState<ProcessedJobData | null>(null);
  const jobsPerPage = 20; // More jobs per page for table view

  // Use unified learning engine (singleton)
  const learningEngine = unifiedLearningEngine;

  // Get unique agencies
  const agencies = useMemo(() => {
    const agencySet = new Set(data.map(job => job.short_agency).filter(Boolean));
    return Array.from(agencySet).sort();
  }, [data]);

  // Create enhanced job data with user corrections and confirmations applied
  const enhancedJobs = useMemo(() => {
    return data.map(job => {
      const jobId = job.id?.toString() || 'unknown';
      const userCorrectedCategory = userCorrections.get(jobId);
      const isConfirmed = confirmedJobs.has(jobId);

      if (userCorrectedCategory) {
        return {
          ...job,
          primary_category: userCorrectedCategory,
          classification_confidence: 100,
          classification_reasoning: ['User corrected classification'],
          isUserCorrected: true
        };
      }

      if (isConfirmed) {
        return {
          ...job,
          classification_confidence: 100,
          classification_reasoning: [...(job.classification_reasoning || []), 'User confirmed as correct'],
          isConfirmed: true
        };
      }

      return job;
    });
  }, [data, userCorrections, confirmedJobs]);

  // Handle feedback submission with persistence and learning
  const handleFeedbackSubmit = async (feedback: JobFeedback) => {
    console.log('Processing feedback:', feedback);

    try {
      // Try to update via backend API first
      const jobId = parseInt(feedback.jobId);
      if (!isNaN(jobId)) {
        await apiClient.updateJobCategory(jobId, {
          primary_category: feedback.userCorrection.correctedPrimary,
          user_id: 'current-user', // Replace with actual user ID when auth is implemented
          reason: 'User correction via job browser'
        });
        console.log('✅ Category updated in backend database');
      }
    } catch (error) {
      console.warn('⚠️ Backend update failed, using local storage fallback:', error);

      // Fallback to local storage if backend is not available
      const correction: StoredCorrection = {
        jobId: feedback.jobId,
        originalCategory: feedback.originalClassification.primary,
        correctedCategory: feedback.userCorrection.correctedPrimary,
        timestamp: new Date().toISOString()
      };
      saveCorrection(correction);
    }

    // Process feedback through unified learning engine
    try {
      const suggestions = learningEngine.processFeedback(feedback);
      if (suggestions.length > 0) {
        console.log(`🧠 Unified learning engine processed feedback with ${suggestions.length} suggestions`);

        // Check for auto-applied updates
        const autoApplied = suggestions.filter(s => s.confidence >= 0.8);
        if (autoApplied.length > 0) {
          console.log(`🚀 ${autoApplied.length} high-confidence suggestions may be auto-applied`);
        }
      }
    } catch (error) {
      console.warn('Unified learning engine failed to process feedback:', error);
    }

    // Update local state for immediate visual feedback
    setUserCorrections(prev => {
      const newCorrections = new Map(prev);
      newCorrections.set(feedback.jobId, feedback.userCorrection.correctedPrimary);
      return newCorrections;
    });

    console.log(`Job ${feedback.jobId} reclassified from ${feedback.originalClassification.primary} to ${feedback.userCorrection.correctedPrimary}`);
  };

  // State for tracking temporarily confirmed jobs (for visual feedback)
  const [temporaryConfirmations, setTemporaryConfirmations] = useState<Set<string>>(new Set());

  // Handle confirming a job as correctly classified
  const handleConfirmCorrect = (jobId: string) => {
    // Show temporary confirmation feedback
    setTemporaryConfirmations(prev => new Set([...prev, jobId]));

    // Find the job data for learning feedback
    const job = data.find(j => j.id?.toString() === jobId);
    if (job) {
      // Create positive feedback for learning engine
      const positiveFeedback: JobFeedback = {
        id: `positive-feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        jobId: jobId,
        jobTitle: job.title || '',
        jobDescription: job.description || '',
        jobLabels: job.job_labels || '',

        originalClassification: {
          primary: job.primary_category || 'unknown',
          confidence: job.classification_confidence || 0,
          secondary: job.secondary_categories || [],
          reasoning: job.classification_reasoning || []
        },

        userCorrection: {
          correctedPrimary: job.primary_category || 'unknown', // Same as original = confirmation
          reason: 'confirmed_correct',
          timestamp: new Date().toISOString(),
          userId: 'current-user'
        },

        learningStatus: 'pending',
        extractedKeywords: []
      };

      // Process positive feedback through unified learning engine
      try {
        learningEngine.processFeedback(positiveFeedback);
        console.log(`✅ Positive feedback processed for job ${jobId} - strengthening learned patterns`);
      } catch (error) {
        console.warn('Failed to process positive feedback:', error);
      }
    }

    // After 1.5 seconds, move to confirmed pile
    setTimeout(() => {
      setConfirmedJobs(prev => new Set([...prev, jobId]));
      setTemporaryConfirmations(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    }, 1500);

    console.log(`Job ${jobId} confirmed as correctly classified`);
  };

  // Filter and sort jobs - confirmed jobs go to bottom
  const filteredJobs = useMemo(() => {
    let filtered = enhancedJobs;

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(job =>
        job.title?.toLowerCase().includes(search) ||
        job.job_labels?.toLowerCase().includes(search) ||
        job.short_agency?.toLowerCase().includes(search)
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(job => job.primary_category === selectedCategory);
    }

    // Apply agency filter
    if (selectedAgency !== 'all') {
      filtered = filtered.filter(job => job.short_agency === selectedAgency);
    }

    // Separate confirmed and unconfirmed jobs
    const unconfirmedJobs = filtered.filter(job => !confirmedJobs.has(job.id?.toString() || 'unknown'));
    const confirmedJobsList = filtered.filter(job => confirmedJobs.has(job.id?.toString() || 'unknown'));

    // Sort unconfirmed jobs (main pile to work through)
    unconfirmedJobs.sort((a, b) => {
      switch (sortBy) {
        case 'confidence':
          return (a.classification_confidence || 0) - (b.classification_confidence || 0); // Low confidence first
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'grade':
          return (a.up_grade || '').localeCompare(b.up_grade || '');
        case 'date':
        default:
          return new Date(b.posting_date || 0).getTime() - new Date(a.posting_date || 0).getTime();
      }
    });

    // Sort confirmed jobs by date (most recently confirmed first among confirmed)
    confirmedJobsList.sort((a, b) => {
      return new Date(b.posting_date || 0).getTime() - new Date(a.posting_date || 0).getTime();
    });

    // Return unconfirmed jobs first, then confirmed jobs at the bottom
    return [...unconfirmedJobs, ...confirmedJobsList];
  }, [enhancedJobs, searchTerm, selectedCategory, selectedAgency, sortBy, confirmedJobs]);

  // Pagination
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
  const startIndex = (currentPage - 1) * jobsPerPage;
  const paginatedJobs = filteredJobs.slice(startIndex, startIndex + jobsPerPage);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedAgency]);

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-4">
      {/* Header - Matching Intelligence tab style */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Eye className="h-4 w-4 text-blue-600" />
          <div>
            <span className="text-sm font-semibold text-gray-800">Job Browser</span>
            <span className="text-xs text-gray-500 ml-2">Review and reclassify job postings</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{filteredJobs.length.toLocaleString()} jobs</span>
        </div>
      </div>
      
      {/* Context line */}
      <div className="text-xs text-gray-500 px-1">
        Click category badges or job titles to reclassify. Low confidence jobs appear first.
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full appearance-none px-2.5 py-1.5 pr-7 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {JOB_CLASSIFICATION_DICTIONARY.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
          </div>

          {/* Agency Filter */}
          <div className="relative">
            <select
              value={selectedAgency}
              onChange={(e) => setSelectedAgency(e.target.value)}
              className="w-full appearance-none px-2.5 py-1.5 pr-7 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Agencies</option>
              {agencies.map(agency => (
                <option key={agency} value={agency}>
                  {agency}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full appearance-none px-2.5 py-1.5 pr-7 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="confidence">Confidence (Low First)</option>
              <option value="date">Date</option>
              <option value="title">Title</option>
              <option value="grade">Grade</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-xs text-gray-500 px-1">
        <div>
          <span className="font-medium text-gray-700">{data.length} total</span>
          <span className="ml-2">
            ({data.filter(j => j.status === 'active' || (!j.archived && j.days_remaining > 0)).length} active)
          </span>
          {filteredJobs.length < data.length && (
            <span className="ml-2">
              • Showing {startIndex + 1}-{Math.min(startIndex + jobsPerPage, filteredJobs.length)} of {filteredJobs.length}
            </span>
          )}
        </div>
        <div>
          Page {currentPage} of {totalPages || 1}
        </div>
      </div>

      {/* Job Table */}
      {paginatedJobs.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No jobs found</p>
          <p className="text-xs text-gray-400">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Job Title</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Category</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Confidence</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Agency</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Grade</th>
                <th className="px-3 py-2 text-center text-xs font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedJobs.map((job, index) => {
                const category = JOB_CLASSIFICATION_DICTIONARY.find(cat => cat.id === job.primary_category);
                const confidenceScore = job.classification_confidence ? Math.max(0, Math.min(100, Math.round(job.classification_confidence))) : 0;
                const isUserCorrected = userCorrections.has(job.id?.toString() || 'unknown');

                return (
                  <tr
                    key={job.id || index}
                    className={`hover:bg-gray-50 ${isUserCorrected ? 'bg-green-50' : ''} ${!job.is_active ? 'opacity-60' : ''}`}
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedJob(job)}
                          className={`text-left text-xs hover:text-blue-600 font-medium truncate max-w-xs ${job.is_active ? 'text-gray-800' : 'text-gray-500'}`}
                        >
                          {job.title}
                        </button>
                        {isUserCorrected && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded flex-shrink-0">
                            ✓
                          </span>
                        )}
                        {job.url && (
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700 flex-shrink-0"
                            title="View Job Ad"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      {job.is_active ? (
                        job.days_remaining <= 3 ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded font-medium">
                            {job.days_remaining}d left
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] rounded font-medium">
                            Open
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded font-medium">
                          Closed
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="inline-block px-2 py-0.5 rounded text-[10px] font-medium hover:opacity-80 transition-all cursor-pointer"
                        style={{
                          backgroundColor: category?.color + '20',
                          color: category?.color || '#6B7280'
                        }}
                        title="Click to reclassify"
                      >
                        {category?.name || 'Unknown'}
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${getConfidenceColor(confidenceScore)}`}>
                        {confidenceScore}%
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[10px] text-gray-500">
                      {job.short_agency}
                    </td>
                    <td className="px-3 py-2 text-[10px] text-gray-500">
                      {job.up_grade}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* Confirm Correct Button */}
                        {!isUserCorrected && !confirmedJobs.has(job.id?.toString() || 'unknown') && !temporaryConfirmations.has(job.id?.toString() || 'unknown') && (
                          <button
                            onClick={() => handleConfirmCorrect(job.id?.toString() || 'unknown')}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Confirm correct"
                          >
                            <CheckCircle size={12} />
                          </button>
                        )}

                        {/* Temporary Confirmation Feedback */}
                        {temporaryConfirmations.has(job.id?.toString() || 'unknown') && (
                          <span className="text-[10px] text-green-600">✓</span>
                        )}

                        {/* Final Confirmed Status */}
                        {confirmedJobs.has(job.id?.toString() || 'unknown') && (
                          <span className="text-[10px] text-gray-400">✓</span>
                        )}

                        {/* View Details Button */}
                        <button
                          onClick={() => setSelectedJob(job)}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="View/Edit"
                        >
                          <Eye size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 py-2">
          {/* Previous button */}
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-2 py-1 text-[10px] font-medium text-gray-500 bg-white border border-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            ←
          </button>

          {/* Page numbers */}
          {(() => {
            const pages = [];
            let startPage = Math.max(1, currentPage - 2);
            let endPage = Math.min(totalPages, currentPage + 2);

            if (endPage - startPage < 4) {
              if (startPage === 1) {
                endPage = Math.min(totalPages, startPage + 4);
              } else if (endPage === totalPages) {
                startPage = Math.max(1, endPage - 4);
              }
            }

            if (startPage > 1) {
              pages.push(
                <button
                  key={1}
                  onClick={() => setCurrentPage(1)}
                  className="px-2 py-1 text-[10px] font-medium text-gray-500 bg-white border border-gray-200 rounded hover:bg-gray-50"
                >
                  1
                </button>
              );
              if (startPage > 2) {
                pages.push(<span key="ellipsis-start" className="px-1 text-[10px] text-gray-400">...</span>);
              }
            }

            for (let i = startPage; i <= endPage; i++) {
              pages.push(
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`px-2 py-1 text-[10px] font-medium rounded ${currentPage === i
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 bg-white border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {i}
                  </button>
                );
              }

              if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                  pages.push(<span key="ellipsis-end" className="px-1 text-[10px] text-gray-400">...</span>);
                }
                pages.push(
                  <button
                    key={totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                    className="px-2 py-1 text-[10px] font-medium text-gray-500 bg-white border border-gray-200 rounded hover:bg-gray-50"
                  >
                    {totalPages}
                  </button>
                );
              }

              return pages;
            })()}

          {/* Next button */}
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-2 py-1 text-[10px] font-medium text-gray-500 bg-white border border-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            →
          </button>
        </div>
      )}

      {/* Job Details Modal */}
      <JobDetailsModal
        job={selectedJob!}
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        onFeedbackSubmit={handleFeedbackSubmit}
        isUserCorrected={selectedJob ? userCorrections.has(selectedJob.id?.toString() || 'unknown') : false}
      />
    </div>
  );
};
