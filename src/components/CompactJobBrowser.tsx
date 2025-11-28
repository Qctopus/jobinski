import React, { useState, useMemo } from 'react';
import { Search, Filter, Eye, CheckCircle } from 'lucide-react';
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
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <Eye className="h-6 w-6 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Job Classification Review</h1>
        </div>
        <p className="text-gray-600">
          Review job classifications quickly. <strong>Click category badges</strong> or job titles to reclassify. Low confidence jobs appear first.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {JOB_CLASSIFICATION_DICTIONARY.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          {/* Agency Filter */}
          <select
            value={selectedAgency}
            onChange={(e) => setSelectedAgency(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Agencies</option>
            {agencies.map(agency => (
              <option key={agency} value={agency}>
                {agency}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="confidence">Sort by Confidence (Low First)</option>
            <option value="date">Sort by Date</option>
            <option value="title">Sort by Title</option>
            <option value="grade">Sort by Grade</option>
          </select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-gray-600">
          <span className="font-medium">{data.length} total jobs</span>
          <span className="text-gray-500 ml-2">
            ({data.filter(j => j.status === 'active' || (!j.archived && j.days_remaining > 0)).length} active,{' '}
            {data.filter(j => j.status === 'archived' || j.archived || j.days_remaining <= 0).length} archived)
          </span>
          {filteredJobs.length < data.length && (
            <span className="ml-3 text-sm">
              • Showing {startIndex + 1}-{Math.min(startIndex + jobsPerPage, filteredJobs.length)} of {filteredJobs.length} filtered
            </span>
          )}
        </div>
        <div className="text-sm text-gray-500">
          Low confidence jobs appear first for review
        </div>
      </div>

      {/* Job Table */}
      {paginatedJobs.length === 0 ? (
        <div className="text-center py-12">
          <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
          <p className="text-gray-600">Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Job Title</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Category</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Confidence</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Agency</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Grade</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedJobs.map((job, index) => {
                const category = JOB_CLASSIFICATION_DICTIONARY.find(cat => cat.id === job.primary_category);
                const confidenceScore = job.classification_confidence ? Math.max(0, Math.min(100, Math.round(job.classification_confidence))) : 0;
                const isUserCorrected = userCorrections.has(job.id?.toString() || 'unknown');

                return (
                  <tr
                    key={job.id || index}
                    className={`hover:bg-gray-50 ${isUserCorrected ? 'bg-green-50 border-green-200' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="text-left hover:text-blue-600 font-medium text-gray-900"
                      >
                        {job.title}
                      </button>
                      {isUserCorrected && (
                        <span className="ml-2 text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                          Corrected
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="inline-block px-3 py-1 rounded-full text-sm font-medium hover:shadow-md transition-all duration-200 cursor-pointer"
                        style={{
                          backgroundColor: category?.color + '20',
                          color: category?.color || '#6B7280'
                        }}
                        title="Click to review and reclassify"
                      >
                        {category?.name || 'Unknown'}
                        <span className="ml-1 text-xs opacity-70">✏️</span>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm px-2 py-1 rounded-full ${getConfidenceColor(confidenceScore)}`}>
                        {confidenceScore}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {job.short_agency}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {job.up_grade}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {/* Confirm Correct Button */}
                        {!isUserCorrected && !confirmedJobs.has(job.id?.toString() || 'unknown') && !temporaryConfirmations.has(job.id?.toString() || 'unknown') && (
                          <button
                            onClick={() => handleConfirmCorrect(job.id?.toString() || 'unknown')}
                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                            title="Mark this classification as correct"
                          >
                            <CheckCircle size={12} className="mr-1" />
                            Is this correct?
                          </button>
                        )}

                        {/* Temporary Confirmation Feedback */}
                        {temporaryConfirmations.has(job.id?.toString() || 'unknown') && (
                          <span className="inline-flex items-center px-3 py-1 text-xs font-medium text-green-800 bg-green-200 rounded-full animate-pulse">
                            <CheckCircle size={12} className="mr-1" />
                            ✓ Confirmed Correct
                          </span>
                        )}

                        {/* Final Confirmed Status */}
                        {confirmedJobs.has(job.id?.toString() || 'unknown') && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-200 rounded-full">
                            <CheckCircle size={12} className="mr-1" />
                            Verified
                          </span>
                        )}

                        {/* View Details Button */}
                        <button
                          onClick={() => setSelectedJob(job)}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
                          title="View details and edit category"
                        >
                          <Eye size={12} className="mr-1" />
                          {isUserCorrected ? 'Edited' : 'Edit'}
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

      {/* Enhanced Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0 bg-white border border-gray-200 px-4 py-3 rounded-lg">
          {/* Results info */}
          <div className="flex items-center text-sm text-gray-700">
            <span>
              Page <span className="font-medium">{currentPage}</span> of{' '}
              <span className="font-medium">{totalPages}</span>
              <span className="hidden sm:inline">
                {' '}({filteredJobs.length} total jobs)
              </span>
            </span>
          </div>

          {/* Navigation */}
          <div className="flex items-center space-x-1">
            {/* Previous button */}
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              Previous
            </button>

            {/* Page numbers with proper logic to avoid duplicates */}
            {(() => {
              const pages = [];
              let startPage = Math.max(1, currentPage - 2);
              let endPage = Math.min(totalPages, currentPage + 2);

              // Adjust range to always show 5 pages when possible, without duplicates
              if (endPage - startPage < 4) {
                if (startPage === 1) {
                  endPage = Math.min(totalPages, startPage + 4);
                } else if (endPage === totalPages) {
                  startPage = Math.max(1, endPage - 4);
                }
              }

              // Add first page and ellipsis if needed
              if (startPage > 1) {
                pages.push(
                  <button
                    key={1}
                    onClick={() => setCurrentPage(1)}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    1
                  </button>
                );

                if (startPage > 2) {
                  pages.push(
                    <span key="ellipsis-start" className="px-2 py-2 text-sm text-gray-500">...</span>
                  );
                }
              }

              // Add the main page range
              for (let i = startPage; i <= endPage; i++) {
                pages.push(
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${currentPage === i
                      ? 'bg-blue-600 text-white border border-blue-600'
                      : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    {i}
                  </button>
                );
              }

              // Add ellipsis and last page if needed
              if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                  pages.push(
                    <span key="ellipsis-end" className="px-2 py-2 text-sm text-gray-500">...</span>
                  );
                }

                pages.push(
                  <button
                    key={totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
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
              className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              Next
            </button>
          </div>

          {/* Quick jump */}
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-500">Go to:</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (page >= 1 && page <= totalPages) {
                  setCurrentPage(page);
                }
              }}
              className="w-16 px-2 py-1 text-center border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
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
