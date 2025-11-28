import React from 'react';
import { MapPin, Clock, Building2, Target, Award } from 'lucide-react';
import { ProcessedJobData } from '../types';
import { JOB_CLASSIFICATION_DICTIONARY } from '../dictionary';
import FeedbackIntegration from './feedback/FeedbackIntegration';

interface JobDetailsCardProps {
  job: ProcessedJobData;
  showFeedback?: boolean;
}

export const JobDetailsCard: React.FC<JobDetailsCardProps> = ({ 
  job, 
  showFeedback = true 
}) => {
  const category = JOB_CLASSIFICATION_DICTIONARY.find(cat => cat.id === job.primary_category);
  const confidenceScore = job.classification_confidence ? Math.max(0, Math.min(100, Math.round(job.classification_confidence))) : 0;

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {job.title}
          </h3>
          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center space-x-1">
              <Building2 className="h-4 w-4" />
              <span>{job.short_agency}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4" />
              <span>{job.duty_station}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Award className="h-4 w-4" />
              <span>Grade {job.up_grade}</span>
            </div>
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
          <div className="flex flex-wrap gap-2">
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
            {job.secondary_categories.slice(0, 3).map(secCatId => {
              const secCategory = JOB_CLASSIFICATION_DICTIONARY.find(cat => cat.id === secCatId);
              return (
                <span 
                  key={secCatId}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                >
                  {secCategory?.name || secCatId}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-4 text-xs text-gray-500">
          {job.posting_date && (
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>Posted {new Date(job.posting_date).toLocaleDateString()}</span>
            </div>
          )}
          {job.apply_until && (
            <div className="flex items-center space-x-1">
              <Target className="h-3 w-3" />
              <span>Deadline {new Date(job.apply_until).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Feedback Integration */}
        {showFeedback && (
          <FeedbackIntegration job={job} showInline={true} />
        )}
      </div>
    </div>
  );
};
