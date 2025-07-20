import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { FilterOptions, ProcessedJobData } from '../types';

interface FilterPanelProps {
  data: ProcessedJobData[];
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onClearFilters: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ 
  data, 
  filters, 
  onFiltersChange, 
  onClearFilters 
}) => {
  // Extract unique values for filter options
  const agencies = [...new Set(data.map(job => job.short_agency || job.long_agency || 'Unknown'))].sort();
  const grades = [...new Set(data.map(job => job.up_grade).filter(Boolean))].sort();
  const countries = [...new Set(data.map(job => job.duty_country).filter(Boolean))].sort();
  const continents = [...new Set(data.map(job => job.duty_continent).filter(Boolean))].sort();

  const handleAgencyChange = (agency: string, checked: boolean) => {
    const newAgencies = checked
      ? [...filters.agencies, agency]
      : filters.agencies.filter(a => a !== agency);
    
    onFiltersChange({
      ...filters,
      agencies: newAgencies
    });
  };

  const handleGradeChange = (grade: string, checked: boolean) => {
    const newGrades = checked
      ? [...filters.grades, grade]
      : filters.grades.filter(g => g !== grade);
    
    onFiltersChange({
      ...filters,
      grades: newGrades
    });
  };

  const handleCountryChange = (country: string, checked: boolean) => {
    const newCountries = checked
      ? [...filters.countries, country]
      : filters.countries.filter(c => c !== country);
    
    onFiltersChange({
      ...filters,
      countries: newCountries
    });
  };

  const handleContinentChange = (continent: string, checked: boolean) => {
    const newContinents = checked
      ? [...filters.continents, continent]
      : filters.continents.filter(c => c !== continent);
    
    onFiltersChange({
      ...filters,
      continents: newContinents
    });
  };

  const handleSearchChange = (searchTerm: string) => {
    onFiltersChange({
      ...filters,
      searchTerm
    });
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    onFiltersChange({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [field]: value
      }
    });
  };

  const hasActiveFilters = 
    filters.agencies.length > 0 ||
    filters.grades.length > 0 ||
    filters.countries.length > 0 ||
    filters.continents.length > 0 ||
    filters.searchTerm.length > 0 ||
    filters.dateRange.start ||
    filters.dateRange.end;

  return (
    <div className="card space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Filter className="h-5 w-5 mr-2 text-un-blue" />
          Filters
        </h3>
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All
          </button>
        )}
      </div>

      {/* Search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search Jobs
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={filters.searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by title, description, location..."
            className="filter-input pl-10"
          />
        </div>
      </div>

      {/* Date Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Posting Date Range
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={filters.dateRange.start}
            onChange={(e) => handleDateRangeChange('start', e.target.value)}
            className="filter-input"
            placeholder="Start date"
          />
          <input
            type="date"
            value={filters.dateRange.end}
            onChange={(e) => handleDateRangeChange('end', e.target.value)}
            className="filter-input"
            placeholder="End date"
          />
        </div>
      </div>

      {/* Agencies */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Agencies ({filters.agencies.length} selected)
        </label>
        <div className="max-h-40 overflow-y-auto space-y-2 border border-gray-200 rounded-md p-2">
          {agencies.slice(0, 20).map((agency) => (
            <label key={agency} className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={filters.agencies.includes(agency)}
                onChange={(e) => handleAgencyChange(agency, e.target.checked)}
                className="rounded border-gray-300 text-un-blue focus:ring-un-blue"
              />
              <span className="truncate">{agency}</span>
            </label>
          ))}
          {agencies.length > 20 && (
            <p className="text-xs text-gray-500 pt-2 border-t">
              Showing top 20 agencies. Use search to find specific agencies.
            </p>
          )}
        </div>
      </div>

      {/* Grades */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Grade Levels ({filters.grades.length} selected)
        </label>
        <div className="max-h-32 overflow-y-auto space-y-2 border border-gray-200 rounded-md p-2">
          {grades.map((grade) => (
            <label key={grade} className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={filters.grades.includes(grade)}
                onChange={(e) => handleGradeChange(grade, e.target.checked)}
                className="rounded border-gray-300 text-un-blue focus:ring-un-blue"
              />
              <span>{grade}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Continents */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Continents ({filters.continents.length} selected)
        </label>
        <div className="space-y-2">
          {continents.map((continent) => (
            <label key={continent} className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={filters.continents.includes(continent)}
                onChange={(e) => handleContinentChange(continent, e.target.checked)}
                className="rounded border-gray-300 text-un-blue focus:ring-un-blue"
              />
              <span>{continent}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Countries */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Countries ({filters.countries.length} selected)
        </label>
        <div className="max-h-40 overflow-y-auto space-y-2 border border-gray-200 rounded-md p-2">
          {countries.slice(0, 30).map((country) => (
            <label key={country} className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={filters.countries.includes(country)}
                onChange={(e) => handleCountryChange(country, e.target.checked)}
                className="rounded border-gray-300 text-un-blue focus:ring-un-blue"
              />
              <span className="truncate">{country}</span>
            </label>
          ))}
          {countries.length > 30 && (
            <p className="text-xs text-gray-500 pt-2 border-t">
              Showing top 30 countries. Use search to find specific countries.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterPanel; 