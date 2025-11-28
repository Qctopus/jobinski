import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, MessageSquare, Lightbulb } from 'lucide-react';
import { ProcessedJobData } from '../../types';
import { JobFeedback } from '../../types/feedback';
import { JOB_CLASSIFICATION_DICTIONARY } from '../../dictionary';

interface JobFeedbackModalProps {
  job: ProcessedJobData;
  isOpen: boolean;
  onClose: () => void;
  onSubmitFeedback: (feedback: JobFeedback) => void;
}

export const JobFeedbackModal: React.FC<JobFeedbackModalProps> = ({
  job,
  isOpen,
  onClose,
  onSubmitFeedback
}) => {
  const [selectedCategory, setSelectedCategory] = useState(job.primary_category || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentCategory = JOB_CLASSIFICATION_DICTIONARY.find(cat => cat.id === job.primary_category);
  const selectedCategoryInfo = JOB_CLASSIFICATION_DICTIONARY.find(cat => cat.id === selectedCategory);

  const handleSubmit = async () => {
    if (!selectedCategory) return;

    setIsSubmitting(true);

    const feedback: JobFeedback = {
      id: `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
        correctedPrimary: selectedCategory,
        reason: 'incorrect_category',
        timestamp: new Date().toISOString(),
        userId: 'current-user' // In a real app, get from auth context
      },
      
      learningStatus: 'pending',
      extractedKeywords: []
    };

    try {
      await onSubmitFeedback(feedback);
      onClose();
      setSelectedCategory(job.primary_category || '');
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isChanged = selectedCategory !== job.primary_category;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <MessageSquare className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Improve Classification</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Job Details */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-900 mb-2">{job.title}</h3>
          <div className="text-sm text-gray-600 mb-3">
            <strong>Agency:</strong> {job.short_agency} | <strong>Grade:</strong> {job.up_grade} | <strong>Location:</strong> {job.duty_station}
          </div>
          {job.job_labels && (
            <div className="text-sm">
              <strong className="text-gray-700">Skills & Keywords ({job.job_labels.split(',').length} total):</strong>
              <div className="mt-1 flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                {job.job_labels.split(',').map((label, idx) => (
                  <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    {label.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Current Classification */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <h4 className="font-medium text-gray-900">Current Classification</h4>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-orange-900">
                  {currentCategory?.name || 'Unknown Category'}
                </div>
                <div className="text-sm text-orange-700">
                  Confidence: {Math.round((job.classification_confidence || 0) * 100)}%
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-orange-600">
                  {job.secondary_categories && job.secondary_categories.length > 0 && (
                    <>Also considered: {job.secondary_categories.slice(0, 2).join(', ')}</>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Selection */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <h4 className="font-medium text-gray-900">Correct Category</h4>
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select the correct category...</option>
            {JOB_CLASSIFICATION_DICTIONARY.map(category => (
              <option key={category.id} value={category.id}>
                {category.name} - {category.description}
              </option>
            ))}
          </select>

          {selectedCategoryInfo && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm">
                <strong className="text-green-900">{selectedCategoryInfo.name}</strong>
                <p className="text-green-700 mt-1">{selectedCategoryInfo.description}</p>
                <div className="mt-2 text-xs text-green-600">
                  <strong>Key terms:</strong> {selectedCategoryInfo.coreKeywords.slice(0, 5).join(', ')}
                  {selectedCategoryInfo.coreKeywords.length > 5 && '...'}
                </div>
              </div>
            </div>
          )}
        </div>


        {/* Learning Impact */}
        {isChanged && (
          <div className="p-6 border-b border-gray-200 bg-blue-50">
            <div className="flex items-center space-x-2 mb-2">
              <Lightbulb className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium text-blue-900">How This Helps</h4>
            </div>
            <div className="text-sm text-blue-800">
              Your feedback will help improve the classification system by:
              <ul className="mt-1 ml-4 list-disc space-y-1">
                <li>Learning new keywords associated with {selectedCategoryInfo?.name}</li>
                <li>Improving confidence scores for similar jobs</li>
                <li>Helping other users get better classifications</li>
              </ul>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 bg-gray-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={!selectedCategory || isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Submit Feedback</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
