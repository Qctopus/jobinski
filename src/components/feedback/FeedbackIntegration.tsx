import React, { useState } from 'react';
import { MessageSquare, CheckCircle } from 'lucide-react';
import { ProcessedJobData } from '../../types';
import { JobFeedback } from '../../types/feedback';
import { JobFeedbackModal } from './JobFeedbackModal';
import { unifiedLearningEngine } from '../../services/learning/UnifiedLearningEngine';

interface FeedbackIntegrationProps {
  job: ProcessedJobData;
  showInline?: boolean;
  onFeedbackSubmit?: (feedback: JobFeedback) => void;
}

export const FeedbackIntegration: React.FC<FeedbackIntegrationProps> = ({ 
  job, 
  showInline = false,
  onFeedbackSubmit
}) => {
  const [showModal, setShowModal] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const learningEngine = unifiedLearningEngine;

  const handleSubmitFeedback = async (feedback: JobFeedback) => {
    try {
      // If parent component provides feedback handler, use it
      if (onFeedbackSubmit) {
        onFeedbackSubmit(feedback);
      } else {
        // Otherwise, use the learning engine directly
        const suggestions = learningEngine.processFeedback(feedback);
        console.log('Feedback processed successfully, generated suggestions:', suggestions);
      }
      
      setFeedbackSubmitted(true);
      setShowModal(false);
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setFeedbackSubmitted(false), 3000);
    } catch (error) {
      console.error('Error processing feedback:', error);
    }
  };

  if (showInline) {
    return (
      <div className="flex items-center space-x-2">
        {feedbackSubmitted ? (
          <div className="flex items-center space-x-1 text-green-600 text-sm">
            <CheckCircle className="h-4 w-4" />
            <span>Thank you for your feedback!</span>
          </div>
        ) : (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm transition-colors"
            title="Improve this classification"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Improve</span>
          </button>
        )}
        
        <JobFeedbackModal
          job={job}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmitFeedback={handleSubmitFeedback}
        />
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center space-x-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-sm"
        title="Help improve job classification"
      >
        <MessageSquare className="h-4 w-4" />
        <span>Improve Classification</span>
      </button>
      
      <JobFeedbackModal
        job={job}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmitFeedback={handleSubmitFeedback}
      />
      
      {feedbackSubmitted && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 z-50">
          <CheckCircle className="h-4 w-4" />
          <span>Feedback submitted! Thank you for helping improve the system.</span>
        </div>
      )}
    </>
  );
};

export default FeedbackIntegration;
