import React, { useState, useMemo, useCallback } from 'react';
import { ProcessedJobData, FilterOptions } from '../types';
import { JOB_CLASSIFICATION_DICTIONARY } from '../dictionary';
import { 
  X, 
  ExternalLink, 
  MapPin, 
  Calendar, 
  Building, 
  Briefcase,
  Search,
  ArrowUpDown,
  Download,
  Filter,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
// CategoryAnalyticsView removed - functionality not working

interface CategoryDrillDownProps {
  isOpen: boolean;
  onClose: () => void;
  categoryId: string;
  data: ProcessedJobData[];
  filters: FilterOptions;
  agencyName?: string;
}

type SortOption = 'posting_date' | 'title' | 'grade' | 'confidence' | 'agency';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE = 50; // Pagination for performance

const CategoryDrillDown: React.FC<CategoryDrillDownProps> = ({
  isOpen,
  onClose,
  categoryId,
  data,
  filters,
  agencyName
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('posting_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [selectedAgencies, setSelectedAgencies] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Get category information
  const category = useMemo(() => {
    const foundCategory = JOB_CLASSIFICATION_DICTIONARY.find(cat => cat.id === categoryId) || JOB_CLASSIFICATION_DICTIONARY[0];
    
    // Debug logging (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('CategoryDrillDown - Category lookup:', foundCategory.name);
    }
    
    return foundCategory;
  }, [categoryId]);

  // Filter and sort jobs
  const { filteredJobs, totalCount } = useMemo(() => {
    
    // Step 1: Filter by category (try multiple matching strategies)
    let filtered = data.filter(job => {
      const jobCategory = job.primary_category;
      if (!jobCategory) return false;
      
      const matches = 
        // Direct name match (most common case)
        jobCategory === category.name ||
        // Direct ID match
        jobCategory === category.id ||
        // Match against the passed categoryId parameter
        jobCategory === categoryId ||
        // Case-insensitive matching
        jobCategory.toLowerCase() === category.name.toLowerCase() ||
        jobCategory.toLowerCase() === category.id.toLowerCase() ||
        // Also check if the job category matches any category that has the same ID as categoryId
        (categoryId && JOB_CLASSIFICATION_DICTIONARY.find(cat => cat.id === categoryId)?.name === jobCategory);
      
      return matches;
    });

    // Debug logging for filtering (development only)
    if (process.env.NODE_ENV === 'development') {
      if (filtered.length === 0 && data.length > 0) {
        console.log('CategoryDrillDown - No jobs found after filtering:', {
          categoryName: category.name,
          uniqueJobCategories: [...new Set(data.map(job => job.primary_category))].slice(0, 5)
        });
      } else {
        console.log(`CategoryDrillDown - Found ${filtered.length} jobs for category ${category.name}`);
      }
    }

    // Step 2: Apply existing filters
    if (filters.selectedAgency !== 'all') {
      filtered = filtered.filter(job => 
        (job.short_agency || job.long_agency) === filters.selectedAgency
      );
    }

    // Step 3: Apply search filter
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(job =>
        job.title?.toLowerCase().includes(lowerSearchTerm) ||
        job.description?.toLowerCase().includes(lowerSearchTerm) ||
        job.job_labels?.toLowerCase().includes(lowerSearchTerm) ||
        job.duty_station?.toLowerCase().includes(lowerSearchTerm) ||
        (job.short_agency || job.long_agency || '').toLowerCase().includes(lowerSearchTerm)
      );
    }

    // Step 4: Apply grade filter
    if (selectedGrades.length > 0) {
      filtered = filtered.filter(job => 
        selectedGrades.includes(job.up_grade || 'Unknown')
      );
    }

    // Step 5: Apply agency filter (if not already applied globally)
    if (selectedAgencies.length > 0 && filters.selectedAgency === 'all') {
      filtered = filtered.filter(job => 
        selectedAgencies.includes(job.short_agency || job.long_agency || 'Unknown')
      );
    }

    // Step 6: Sort
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'posting_date':
          aValue = new Date(a.posting_date);
          bValue = new Date(b.posting_date);
          break;
        case 'title':
          aValue = a.title?.toLowerCase() || '';
          bValue = b.title?.toLowerCase() || '';
          break;
        case 'grade':
          aValue = a.up_grade || 'ZZZ'; // Put unknowns at end
          bValue = b.up_grade || 'ZZZ';
          break;
        case 'confidence':
          aValue = a.classification_confidence || 0;
          bValue = b.classification_confidence || 0;
          break;
        case 'agency':
          aValue = (a.short_agency || a.long_agency || 'ZZZ').toLowerCase();
          bValue = (b.short_agency || b.long_agency || 'ZZZ').toLowerCase();
          break;
        default:
          aValue = new Date(a.posting_date);
          bValue = new Date(b.posting_date);
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    // Step 7: Paginate for performance
    const totalCount = filtered.length;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedJobs = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return { filteredJobs: paginatedJobs, totalCount };
  }, [
    data, 
    category.name, 
    category.id, 
    categoryId, 
    filters, 
    searchTerm, 
    selectedGrades, 
    selectedAgencies, 
    sortBy, 
    sortDirection, 
    currentPage
  ]);

  // Get available filter options
  const filterOptions = useMemo(() => {
    const categoryData = data.filter(job => {
      const jobCategory = job.primary_category;
      if (!jobCategory) return false;
      
      return (
        jobCategory === category.name ||
        jobCategory === category.id ||
        jobCategory === categoryId ||
        jobCategory.toLowerCase() === category.name.toLowerCase() ||
        jobCategory.toLowerCase() === category.id.toLowerCase() ||
        (categoryId && JOB_CLASSIFICATION_DICTIONARY.find(cat => cat.id === categoryId)?.name === jobCategory)
      );
    });

    const grades = new Set(categoryData.map(job => job.up_grade || 'Unknown'));
    const agencies = new Set(categoryData.map(job => job.short_agency || job.long_agency || 'Unknown'));

    return {
      grades: Array.from(grades).sort(),
      agencies: Array.from(agencies).sort()
    };
  }, [data, category.name, category.id, categoryId]);

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const showPagination = totalPages > 1;

  // Event handlers
  const handleSort = useCallback((newSortBy: SortOption) => {
    if (sortBy === newSortBy) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDirection('desc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  }, [sortBy]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedGrades([]);
    setSelectedAgencies([]);
    setCurrentPage(1);
  }, []);

  const exportJobs = useCallback(() => {
    // Export all filtered jobs, not just current page
    const allFiltered = data.filter(job => {
      // Replicate the filtering logic
      const jobCategory = job.primary_category;
      if (!jobCategory) return false;
      
      const categoryMatch = 
        jobCategory === category.name ||
        jobCategory === category.id ||
        jobCategory === categoryId ||
        jobCategory.toLowerCase() === category.name.toLowerCase() ||
        jobCategory.toLowerCase() === category.id.toLowerCase() ||
        (categoryId && JOB_CLASSIFICATION_DICTIONARY.find(cat => cat.id === categoryId)?.name === jobCategory);
      
      if (!categoryMatch) return false;
      
      if (filters.selectedAgency !== 'all' && 
          (job.short_agency || job.long_agency) !== filters.selectedAgency) {
        return false;
      }
      
      if (searchTerm.trim()) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        const searchMatch = 
          job.title?.toLowerCase().includes(lowerSearchTerm) ||
          job.description?.toLowerCase().includes(lowerSearchTerm) ||
          job.job_labels?.toLowerCase().includes(lowerSearchTerm) ||
          job.duty_station?.toLowerCase().includes(lowerSearchTerm) ||
          (job.short_agency || job.long_agency || '').toLowerCase().includes(lowerSearchTerm);
        if (!searchMatch) return false;
      }
      
      if (selectedGrades.length > 0 && !selectedGrades.includes(job.up_grade || 'Unknown')) {
        return false;
      }
      
      if (selectedAgencies.length > 0 && filters.selectedAgency === 'all' &&
          !selectedAgencies.includes(job.short_agency || job.long_agency || 'Unknown')) {
        return false;
      }
      
      return true;
    });

    const csvData = [
      ['Title', 'Agency', 'Grade', 'Location', 'Posting Date', 'Application Deadline', 'Classification Confidence', 'URL'].join(','),
      ...allFiltered.map(job => [
        `"${job.title || ''}"`,
        `"${job.short_agency || job.long_agency || 'Unknown'}"`,
        job.up_grade || 'Unknown',
        `"${job.duty_station || ''}"`,
        job.posting_date ? format(parseISO(job.posting_date), 'yyyy-MM-dd') : '',
        job.apply_until ? format(parseISO(job.apply_until), 'yyyy-MM-dd') : '',
        job.classification_confidence || 0,
        job.url || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${category.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_jobs.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [data, category, filters, searchTerm, selectedGrades, selectedAgencies, categoryId]);

  // Helper functions
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return 'text-green-600 bg-green-100';
    if (confidence >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 70) return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (confidence >= 40) return <HelpCircle className="h-4 w-4 text-yellow-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  const getConfidenceTooltip = (confidence: number, keywords: string[]) => {
    const level = confidence >= 70 ? 'High' : confidence >= 40 ? 'Medium' : 'Low';
    const explanation = confidence >= 70 
      ? 'Strong keyword matches across multiple fields' 
      : confidence >= 40 
      ? 'Some keyword matches found' 
      : 'Weak or unclear classification';
    
    return `${level} confidence (${confidence}%): ${explanation}`;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-full max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded" 
                  style={{ backgroundColor: category.color }}
                />
                <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                  {totalCount.toLocaleString()} jobs
                </span>
                {totalCount > ITEMS_PER_PAGE && (
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                    Showing {filteredJobs.length} of {totalCount}
                  </span>
                )}
              </div>
              <p className="text-gray-600 mt-2 max-w-4xl text-sm leading-relaxed">
                {category.description}
              </p>
              {agencyName && (
                <p className="text-blue-600 mt-1 font-medium text-sm">
                  Filtered for: {agencyName}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-6 w-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0 bg-gray-50">
          <div className="flex flex-col gap-4">
            {/* Top Row - Search and Toggle */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); // Reset to first page on search
                  }}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="h-4 w-4" />
                Filters
                {(selectedGrades.length > 0 || selectedAgencies.length > 0) && (
                  <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                    {selectedGrades.length + selectedAgencies.length}
                  </span>
                )}
              </button>

              <button
                onClick={exportJobs}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                Export ({totalCount})
              </button>
            </div>

            {/* Advanced Filters (Collapsible) */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-white rounded-lg border border-gray-200">
                {/* Grade Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Grades</label>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {filterOptions.grades.map(grade => (
                      <label key={grade} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedGrades.includes(grade)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedGrades(prev => [...prev, grade]);
                            } else {
                              setSelectedGrades(prev => prev.filter(g => g !== grade));
                            }
                            setCurrentPage(1);
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{grade}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Agency Filter (only if not already filtered globally) */}
                {filters.selectedAgency === 'all' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Agencies</label>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {filterOptions.agencies.slice(0, 10).map(agency => (
                        <label key={agency} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedAgencies.includes(agency)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAgencies(prev => [...prev, agency]);
                              } else {
                                setSelectedAgencies(prev => prev.filter(a => a !== agency));
                              }
                              setCurrentPage(1);
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{agency}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Jobs List */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Sort Headers */}
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
            <button 
              onClick={() => handleSort('title')}
              className="col-span-4 flex items-center gap-1 hover:text-gray-900 text-left"
            >
              Job Title <ArrowUpDown className="h-3 w-3" />
              {sortBy === 'title' && (
                <span className="text-blue-600">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </button>
            <button 
              onClick={() => handleSort('agency')}
              className="col-span-2 flex items-center gap-1 hover:text-gray-900 text-left"
            >
              Agency <ArrowUpDown className="h-3 w-3" />
              {sortBy === 'agency' && (
                <span className="text-blue-600">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </button>
            <button 
              onClick={() => handleSort('grade')}
              className="col-span-1 flex items-center gap-1 hover:text-gray-900 text-left"
            >
              Grade <ArrowUpDown className="h-3 w-3" />
              {sortBy === 'grade' && (
                <span className="text-blue-600">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </button>
            <span className="col-span-2 text-left">Location</span>
            <button 
              onClick={() => handleSort('posting_date')}
              className="col-span-2 flex items-center gap-1 hover:text-gray-900 text-left"
            >
              Posted <ArrowUpDown className="h-3 w-3" />
              {sortBy === 'posting_date' && (
                <span className="text-blue-600">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </button>
            <button 
              onClick={() => handleSort('confidence')}
              className="col-span-1 flex items-center gap-1 hover:text-gray-900 text-left"
            >
              Score <ArrowUpDown className="h-3 w-3" />
              {sortBy === 'confidence' && (
                <span className="text-blue-600">
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </button>
          </div>

          {/* Jobs List */}
          <div className="flex-1 overflow-y-auto">
            {filteredJobs.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredJobs.map((job, index) => (
                  <div key={job.id || index} className={`px-6 py-4 hover:bg-gray-50 grid grid-cols-12 gap-4 items-start ${!job.is_active ? 'opacity-60' : ''}`}>
                    {/* Job Title with Status */}
                    <div className="col-span-4">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className={`font-medium leading-tight ${job.is_active ? 'text-gray-900' : 'text-gray-500'}`}>{job.title}</h3>
                        {/* Status Badge */}
                        {job.is_active ? (
                          job.days_remaining <= 3 ? (
                            <span className="inline-flex items-center px-1.5 py-0.5 bg-amber-100 text-amber-700 text-xs rounded font-medium flex-shrink-0">
                              {job.days_remaining}d left
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded font-medium flex-shrink-0">
                              Open
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded font-medium flex-shrink-0">
                            Closed
                          </span>
                        )}
                      </div>
                      {job.job_labels && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {job.job_labels}
                        </p>
                      )}
                      {job.url && (
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm inline-flex items-center gap-1"
                        >
                          View Job Ad <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>

                    {/* Agency */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-1 text-sm">
                        <Building className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-gray-900 truncate">
                          {job.short_agency || job.long_agency || 'Unknown'}
                        </span>
                      </div>
                    </div>

                    {/* Grade */}
                    <div className="col-span-1">
                      <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-medium">
                        {job.up_grade || 'N/A'}
                      </span>
                    </div>

                    {/* Location */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{job.duty_station}</span>
                      </div>
                    </div>

                    {/* Posted Date */}
                    <div className="col-span-2">
                      <div className="text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{formatDate(job.posting_date)}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Deadline: {formatDate(job.apply_until)}
                        </div>
                      </div>
                    </div>

                    {/* Classification Score */}
                    <div className="col-span-1">
                      <div 
                        className="flex items-center gap-1 cursor-help"
                        title={getConfidenceTooltip(job.classification_confidence || 0, job.classification_reasoning || [])}
                      >
                        {getConfidenceIcon(job.classification_confidence || 0)}
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(job.classification_confidence || 0)}`}>
                          {job.classification_confidence || 0}%
                        </span>
                      </div>
                      {job.is_ambiguous_category && (
                        <div className="text-xs text-yellow-600 mt-1">Ambiguous</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  {totalCount === 0 ? (
                    <>
                      <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-300" />
                      <p className="text-lg font-medium">No jobs found in this category</p>
                      <p className="text-sm mt-1">This might indicate a data classification issue</p>
                    </>
                  ) : (
                    <>
                      <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No jobs match your filters</p>
                      <p className="text-sm mt-1">Try adjusting your search terms or filters</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pagination */}
          {showPagination && (
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} jobs
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 rounded text-sm ${
                          page === currentPage
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default CategoryDrillDown;