import React, { Component, ReactNode } from 'react';
import { Database, RefreshCw, AlertCircle, Download } from 'lucide-react';
import { AppError, createProcessingError } from '../../types/common';

interface DataErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
  isRetrying: boolean;
}

interface DataErrorBoundaryProps {
  children: ReactNode;
  onRetry?: () => Promise<void>;
  fallbackData?: any;
  showFallback?: boolean;
}

/**
 * Specialized error boundary for data-related errors
 * Provides specific handling for data loading, processing, and transformation errors
 */
export class DataErrorBoundary extends Component<DataErrorBoundaryProps, DataErrorBoundaryState> {
  constructor(props: DataErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isRetrying: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<DataErrorBoundaryState> {
    // Create a processing error for data-related issues
    const appError = createProcessingError(
      'analysis', // Default stage
      0, // Will be updated with actual data size if available
      error.message || 'Data processing failed',
      {
        originalError: error.name,
        stack: error.stack?.substring(0, 500), // Limit stack trace size
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }
    );

    return {
      hasError: true,
      error: appError
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('DataErrorBoundary caught a data processing error:', {
      error,
      errorInfo,
      timestamp: new Date().toISOString(),
      url: window.location.href
    });

    // Report data errors to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Analytics or error reporting
      // window.analytics?.track('Data Processing Error', {
      //   error: error.message,
      //   component: errorInfo.componentStack,
      //   stage: 'rendering'
      // });
    }
  }

  handleRetry = async () => {
    const { onRetry } = this.props;
    
    this.setState({ isRetrying: true });

    try {
      if (onRetry) {
        await onRetry();
      }
      
      // Reset error state on successful retry
      this.setState({
        hasError: false,
        error: null,
        isRetrying: false
      });
    } catch (retryError) {
      console.error('Retry failed:', retryError);
      
      // Update error with retry failure information
      const updatedError = createProcessingError(
        'analysis',
        0,
        `Retry failed: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`,
        {
          originalError: this.state.error?.message,
          retryAttempt: true,
          retryError: retryError instanceof Error ? retryError.message : String(retryError)
        }
      );

      this.setState({
        error: updatedError,
        isRetrying: false
      });
    }
  };

  downloadErrorReport = () => {
    const { error } = this.state;
    if (!error) return;

    const errorReport = {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        code: error.code,
        stage: (error as any).stage,
        context: error.context
      },
      userAgent: navigator.userAgent,
      url: window.location.href,
      localStorage: Object.keys(localStorage).reduce((acc, key) => {
        try {
          acc[key] = localStorage.getItem(key);
        } catch {
          acc[key] = '[Unable to access]';
        }
        return acc;
      }, {} as Record<string, string | null>)
    };

    const blob = new Blob([JSON.stringify(errorReport, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  renderErrorState() {
    const { error, isRetrying } = this.state;
    const { fallbackData, showFallback } = this.props;

    if (!error) return null;

    const isProcessingError = error.name === 'ProcessingError';
    const stage = (error as any).stage || 'unknown';

    return (
      <div className="bg-white border border-red-200 rounded-lg p-6 mx-4 my-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
              <Database className="h-6 w-6 text-red-600" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Data Processing Error
            </h3>
            
            <p className="text-gray-600 mb-4">
              We encountered an issue while processing the job data. This might be due to:
            </p>
            
            <ul className="list-disc list-inside text-sm text-gray-600 mb-4 space-y-1">
              <li>Temporary network connectivity issues</li>
              <li>Data format inconsistencies</li>
              <li>Large dataset processing timeouts</li>
              <li>Browser memory limitations</li>
            </ul>
            
            {isProcessingError && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                <div className="flex">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">Processing Stage: {stage}</p>
                    <p className="text-yellow-700 mt-1">{error.message}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={this.handleRetry}
                disabled={isRetrying}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Retrying...' : 'Retry Data Loading'}
              </button>
              
              {showFallback && fallbackData && (
                <button
                  onClick={() => {
                    // This would trigger showing fallback data
                    console.log('Using fallback data:', fallbackData);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Use Cached Data
                </button>
              )}
              
              <button
                onClick={this.downloadErrorReport}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Error Report
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4">
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                  Developer Information
                </summary>
                <div className="mt-2 bg-gray-100 rounded p-3">
                  <pre className="text-xs text-gray-800 overflow-auto">
                    {JSON.stringify({
                      error: {
                        message: error.message,
                        code: error.code,
                        context: error.context
                      },
                      timestamp: error.timestamp,
                      recoverable: error.recoverable
                    }, null, 2)}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      </div>
    );
  }

  render() {
    const { hasError } = this.state;
    const { children } = this.props;

    if (hasError) {
      return this.renderErrorState();
    }

    return children;
  }
}

export default DataErrorBoundary;

