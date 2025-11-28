import React, { useState, useMemo } from 'react';
import { Search, Filter, Eye, BarChart3, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { ProcessedJobData, FilterOptions } from '../types';
import { JOB_CLASSIFICATION_DICTIONARY } from '../dictionary';
import { JobDetailsCard } from './JobDetailsCard';
import { JobFeedback } from '../types/feedback';
import { FeedbackIntegration } from './feedback/FeedbackIntegration';
// Note: Learning engine is now unified and handled in CompactJobBrowser

interface JobBrowserProps {
  data: ProcessedJobData[];
}

// Enhanced Job Card with feedback integration
interface EnhancedJobCardProps {
  job: ProcessedJobData;
  onFeedbackSubmit: (feedback: JobFeedback) => void;
  isUserCorrected: boolean;
}

const EnhancedJobCard: React.FC<EnhancedJobCardProps> = ({ job, onFeedbackSubmit, isUserCorrected }) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const category = JOB_CLASSIFICATION_DICTIONARY.find(cat => cat.id === job.primary_category);
  const confidenceScore = job.classification_confidence ? Math.max(0, Math.min(100, Math.round(job.classification_confidence))) : 0;

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className={`bg-white shadow-md rounded-lg p-6 border ${isUserCorrected ? 'border-green-400 bg-green-50' : 'border-gray-200'}`}>
      {/* User Correction Badge */}
      {isUserCorrected && (
        <div className="flex items-center space-x-2 mb-3 text-green-700">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm font-medium">User Corrected</span>
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{job.title}</h3>
          <p className="text-gray-600 text-sm mb-2">{job.long_agency} - {job.duty_station}, {job.duty_country}</p>
          
          {/* Expandable Description */}
          <div className="text-gray-700 text-sm">
            <p className={isDescriptionExpanded ? '' : 'line-clamp-3'}>
              {job.description}
            </p>
            {job.description && job.description.length > 200 && (
              <button
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm mt-2 transition-colors"
              >
                {isDescriptionExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    <span>Show Less</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    <span>View Full Description</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        
        {/* Classification Info */}
        <div className="ml-4 text-right">
          <div className="mb-2">
            <span 
              className="inline-block px-3 py-1 rounded-full text-sm font-medium"
              style={{ 
                backgroundColor: category?.color + '20', 
                color: category?.color || '#6B7280' 
              }}
            >
              {category?.name || 'Unknown Category'}
            </span>
          </div>
          <div className="flex items-center justify-end space-x-2">
            <span className="text-xs text-gray-500">Confidence:</span>
            <span className={`text-xs px-2 py-1 rounded ${getConfidenceColor(confidenceScore)}`}>
              {confidenceScore}%
            </span>
          </div>
        </div>
      </div>

      {/* Job Labels - Show all labels */}
      {job.job_labels && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Skills & Keywords ({job.job_labels.split(',').length} total):</h4>
          <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
            {job.job_labels.split(',').map((label, idx) => (
              <span 
                key={idx} 
                className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium"
              >
                {label.trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Secondary Categories */}
      {job.secondary_categories && job.secondary_categories.length > 0 && (
        <div className="mb-4">
          <span className="text-xs text-gray-500 mb-1 block">Also relevant to:</span>
          <div className="flex flex-wrap gap-1">
            {job.secondary_categories.map(catId => {
              const secCategory = JOB_CLASSIFICATION_DICTIONARY.find(cat => cat.id === catId);
              return (
                <span 
                  key={catId}
                  className="text-xs px-2 py-1 rounded-full border"
                  style={{ 
                    borderColor: secCategory?.color || '#D1D5DB',
                    color: secCategory?.color || '#6B7280'
                  }}
                >
                  {secCategory?.name || catId}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Grade: {job.up_grade} | Posted: {job.formatted_posting_date}
        </div>
        <FeedbackIntegration 
          job={job} 
          onFeedbackSubmit={onFeedbackSubmit}
          showInline={true} 
        />
      </div>
    </div>
  );
};

export const JobBrowser: React.FC<JobBrowserProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAgency, setSelectedAgency] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'date' | 'confidence' | 'title'>('date');
  const [userCorrections, setUserCorrections] = useState<Map<string, string>>(new Map());
  const jobsPerPage = 12;

  // Get unique agencies
  const agencies = useMemo(() => {
    const agencySet = new Set(data.map(job => job.short_agency).filter(Boolean));
    return Array.from(agencySet).sort();
  }, [data]);

  // Create enhanced job data with user corrections applied
  const enhancedJobs = useMemo(() => {
    return data.map(job => {
      const jobId = job.id?.toString() || 'unknown';
      const userCorrectedCategory = userCorrections.get(jobId);
      
      if (userCorrectedCategory) {
        // Apply user correction and mark as corrected
        return {
          ...job,
          primary_category: userCorrectedCategory,
          classification_confidence: 100, // User corrections are 100% confident
          classification_reasoning: ['User corrected classification'],
          isUserCorrected: true
        };
      }
      
      return job;
    });
  }, [data, userCorrections]);

  // Handle feedback submission with learning
  const handleFeedbackSubmit = (feedback: JobFeedback) => {
    console.log('Processing feedback with learning:', feedback);
    
    // Store the user's correction locally for immediate visual feedback
    setUserCorrections(prev => {
      const newCorrections = new Map(prev);
      newCorrections.set(feedback.jobId, feedback.userCorrection.correctedPrimary);
      return newCorrections;
    });

    // Process the correction for pattern learning (temporarily disabled)
    // const dictionaryUpdate = patternLearningEngine.processCorrection(feedback);
    // 
    // // Apply dictionary improvements automatically
    // if (dictionaryUpdate) {
    //   patternLearningEngine.applyDictionaryUpdate(dictionaryUpdate);
    //   console.log('Dictionary automatically enhanced based on your feedback!', dictionaryUpdate);
    // }

    console.log(`Job ${feedback.jobId} reclassified from ${feedback.originalClassification.primary} to ${feedback.userCorrection.correctedPrimary}`);
    // console.log('Learning stats:', patternLearningEngine.getLearningStats());
  };

  // Filter and sort jobs
  const filteredJobs = useMemo(() => {
    let filtered = enhancedJobs;

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(job => 
        job.title?.toLowerCase().includes(search) ||
        job.job_labels?.toLowerCase().includes(search) ||
        job.description?.toLowerCase().includes(search)
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

    // Sort jobs
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'confidence':
          return (b.classification_confidence || 0) - (a.classification_confidence || 0);
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'date':
        default:
          return new Date(b.posting_date || 0).getTime() - new Date(a.posting_date || 0).getTime();
      }
    });

    return filtered;
  }, [enhancedJobs, searchTerm, selectedCategory, selectedAgency, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
  const startIndex = (currentPage - 1) * jobsPerPage;
  const paginatedJobs = filteredJobs.slice(startIndex, startIndex + jobsPerPage);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Eye className="h-6 w-6 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Job Browser</h1>
        </div>
        <p className="text-gray-600">
          Browse job classifications and help improve the system with your feedback
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
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
            onChange={(e) => {
              setSelectedAgency(e.target.value);
              setCurrentPage(1);
            }}
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
            <option value="date">Sort by Date</option>
            <option value="confidence">Sort by Confidence</option>
            <option value="title">Sort by Title</option>
          </select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-gray-600">
          Showing {startIndex + 1}-{Math.min(startIndex + jobsPerPage, filteredJobs.length)} of {filteredJobs.length} jobs
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <BarChart3 className="h-4 w-4" />
          <span>Click "Improve" on any job to provide classification feedback</span>
        </div>
      </div>

      {/* Job Grid */}
      {paginatedJobs.length === 0 ? (
        <div className="text-center py-12">
          <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
          <p className="text-gray-600">Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {paginatedJobs.map(job => (
            <EnhancedJobCard 
              key={job.id || `${job.title}-${job.posting_date}`}
              job={job}
              onFeedbackSubmit={handleFeedbackSubmit}
              isUserCorrected={userCorrections.has(job.id?.toString() || 'unknown')}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            Previous
          </button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(totalPages, currentPage - 2 + i));
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-3 py-2 rounded-lg ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  } transition-colors`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
