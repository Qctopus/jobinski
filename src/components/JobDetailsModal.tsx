import React, { useState } from 'react';
import { X, ExternalLink, FileText } from 'lucide-react';
import { ProcessedJobData } from '../types';
import { JOB_CLASSIFICATION_DICTIONARY } from '../dictionary';
import { JobFeedback } from '../types/feedback';

interface JobDetailsModalProps {
  job: ProcessedJobData;
  isOpen: boolean;
  onClose: () => void;
  onFeedbackSubmit?: (feedback: JobFeedback) => void;
  isUserCorrected?: boolean;
}

export const JobDetailsModal: React.FC<JobDetailsModalProps> = ({ 
  job, 
  isOpen, 
  onClose, 
  onFeedbackSubmit,
  isUserCorrected = false 
}) => {
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [reclassificationFeedback, setReclassificationFeedback] = useState<string | null>(null);
  
  if (!isOpen) return null;

  const category = JOB_CLASSIFICATION_DICTIONARY.find(cat => cat.id === job.primary_category);
  const confidenceScore = job.classification_confidence ? Math.max(0, Math.min(100, Math.round(job.classification_confidence))) : 0;

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Format job description with basic structure
  const formatDescription = (description: string) => {
    if (!description) return '';
    
    // Split by common section headers and format
    const sections = description.split(/(?=\b(?:Responsibilities|Requirements|Qualifications|Experience|Education|Skills|Background|Duties|Functions|Key responsibilities|Essential requirements|Minimum requirements|Preferred qualifications)\b[:\s])/i);
    
    return sections.map((section, index) => {
      if (index === 0) return section.trim(); // First section (usually introduction)
      
      const lines = section.trim().split('\n');
      const header = lines[0];
      const content = lines.slice(1).join('\n');
      
      return (
        <div key={index} className="mb-4">
          <h4 className="font-semibold text-gray-800 mb-2">{header}</h4>
          <div className="text-gray-700 whitespace-pre-line">{content}</div>
        </div>
      );
    });
  };

  // Handle quick reclassification
  const handleQuickReclassify = (newCategoryId: string) => {
    if (!onFeedbackSubmit || newCategoryId === job.primary_category) {
      setShowCategorySelector(false);
      return;
    }

    // Create feedback object for the reclassification
    const feedback: JobFeedback = {
      id: `quick-feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      jobId: job.id?.toString() || 'unknown',
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
        correctedPrimary: newCategoryId,
        reason: 'incorrect_category',
        timestamp: new Date().toISOString(),
        userId: 'current-user'
      },
      
      learningStatus: 'pending',
      extractedKeywords: []
    };

    // Submit the feedback
    onFeedbackSubmit(feedback);
    
    // Show success feedback briefly
    const newCategory = JOB_CLASSIFICATION_DICTIONARY.find(cat => cat.id === newCategoryId);
    setReclassificationFeedback(`✓ Reclassified to ${newCategory?.name}`);
    setShowCategorySelector(false);
    
    // Auto-close modal after brief confirmation (1.5 seconds)
    setTimeout(() => {
      setReclassificationFeedback(null);
      onClose(); // Close the modal automatically
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-start pt-8">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 mb-8">
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{job.title}</h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span><strong>Agency:</strong> {job.long_agency}</span>
              <span><strong>Grade:</strong> {job.up_grade}</span>
              <span><strong>Location:</strong> {job.duty_station}, {job.duty_country}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2"
          >
            <X size={24} />
          </button>
        </div>

        {/* Success Feedback */}
        {reclassificationFeedback && (
          <div className="mx-6 mt-4 p-3 bg-green-100 border border-green-300 rounded-lg text-green-800 text-sm">
            {reclassificationFeedback}
          </div>
        )}

        {/* Classification Info - Interactive */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Current Classification</h3>
              <div className="flex items-center space-x-2">
                {job.url && (
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <ExternalLink size={16} />
                    <span>View Original</span>
                  </a>
                )}
              </div>
            </div>
            
            {/* Primary Category - Clickable */}
            <div className="flex items-center space-x-3 mb-3">
              <button 
                onClick={() => setShowCategorySelector(!showCategorySelector)}
                className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border-2 border-dashed hover:border-solid transition-all duration-200"
                style={{ 
                  backgroundColor: category?.color + '20', 
                  color: category?.color || '#6B7280',
                  borderColor: category?.color || '#6B7280'
                }}
              >
                {category?.name || 'Unknown Category'}
                <span className="ml-2 text-xs">✏️</span>
              </button>
              <span className={`text-sm px-3 py-1 rounded-full ${getConfidenceColor(confidenceScore)}`}>
                {confidenceScore}%
              </span>
              {isUserCorrected && (
                <span className="text-sm px-3 py-1 rounded-full bg-green-100 text-green-700 flex items-center">
                  <span className="mr-1">✓</span> Corrected
                </span>
              )}
            </div>

            {/* Quick Category Selector */}
            {showCategorySelector && (
              <div className="mb-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Select Correct Category:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {JOB_CLASSIFICATION_DICTIONARY.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleQuickReclassify(cat.id)}
                      className={`text-left px-3 py-2 rounded-lg border transition-all duration-200 hover:shadow-md ${
                        cat.id === job.primary_category 
                          ? 'border-2 border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={{ 
                        backgroundColor: cat.id === job.primary_category ? cat.color + '10' : 'white'
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: cat.color }}
                        ></div>
                        <span className="text-sm font-medium">{cat.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowCategorySelector(false)}
                  className="mt-3 text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Quick Secondary Category Switch */}
            {!showCategorySelector && job.secondary_categories && job.secondary_categories.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Quick Switch: <span className="text-xs text-gray-500">(click to promote to primary)</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {job.secondary_categories.map(catId => {
                    const secCategory = JOB_CLASSIFICATION_DICTIONARY.find(cat => cat.id === catId);
                    return (
                      <button
                        key={catId}
                        onClick={() => handleQuickReclassify(catId)}
                        className="text-sm px-3 py-1 rounded-full border-2 transition-all duration-200 hover:shadow-md hover:scale-105 hover:border-solid"
                        style={{
                          borderColor: secCategory?.color || '#D1D5DB',
                          color: secCategory?.color || '#6B7280',
                          backgroundColor: 'white',
                          borderStyle: 'dashed'
                        }}
                        title={`Click to make "${secCategory?.name}" the primary category`}
                      >
                        <span className="mr-1">↗️</span>
                        {secCategory?.name || catId}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {/* Skills & Keywords */}
          {job.job_labels && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Skills & Keywords ({job.job_labels.split(',').length} total)
              </h3>
              <div className="flex flex-wrap gap-2">
                {job.job_labels.split(',').map((label, idx) => (
                  <span 
                    key={idx} 
                    className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {label.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}


          {/* Job Description */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Job Description</h3>
              <button
                onClick={() => setShowFullDescription(true)}
                className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm"
              >
                <FileText size={16} />
                <span>View Full Description</span>
              </button>
            </div>
            <div className="prose prose-sm max-w-none">
              <div className="text-gray-700 line-clamp-6">
                {job.description || 'No description available'}
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <strong>Posted:</strong> {job.formatted_posting_date}
            </div>
            <div>
              <strong>Apply Until:</strong> {job.formatted_apply_until}
            </div>
            <div>
              <strong>Languages:</strong> {job.languages || 'Not specified'}
            </div>
            <div>
              <strong>Pipeline:</strong> {job.pipeline || 'Not specified'}
            </div>
          </div>
        </div>
      </div>

      {/* Full Description Modal */}
      {showFullDescription && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-60 flex justify-center items-start pt-8">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 mb-8">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Full Job Description</h2>
              <button
                onClick={() => setShowFullDescription(false)}
                className="text-gray-500 hover:text-gray-700 p-2"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{job.title}</h3>
                <p className="text-gray-600">{job.long_agency} - {job.duty_station}, {job.duty_country}</p>
              </div>
              
              <div className="prose prose-sm max-w-none">
                {formatDescription(job.description || '')}
              </div>
              
              {/* Ideal Candidate section if available */}
              {job.ideal_candidate && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Ideal Candidate Profile</h4>
                  <div className="text-blue-800 whitespace-pre-line">
                    {job.ideal_candidate}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => setShowFullDescription(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
