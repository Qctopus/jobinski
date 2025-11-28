import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AppError, createAppError } from '../../types/common';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: AppError, retry: () => void) => ReactNode;
  onError?: (error: AppError, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  resetOnPropsChange?: boolean;
  level?: 'application' | 'component' | 'section';
}

/**
 * Enhanced Error Boundary with retry logic and different error UI based on context
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Convert to AppError with additional context
    const appError = createAppError(
      error.message || 'An unexpected error occurred',
      'COMPONENT_ERROR',
      true,
      {
        originalError: error.name,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }
    );

    return {
      hasError: true,
      error: appError
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const appError = this.state.error || createAppError(
      error.message,
      'COMPONENT_ERROR'
    );

    this.setState({
      errorInfo
    });

    // Call custom error handler if provided
    this.props.onError?.(appError, errorInfo);

    // Log error for development/monitoring
    console.error('ErrorBoundary caught an error:', {
      error: appError,
      errorInfo,
      component: errorInfo.componentStack,
      retryCount: this.state.retryCount
    });

    // Report to error monitoring service (e.g., Sentry)
    if (process.env.NODE_ENV === 'production') {
      // window.errorReporting?.captureException(error, { extra: errorInfo });
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, children } = this.props;
    const { hasError } = this.state;

    // Reset error state if props changed and resetOnPropsChange is enabled
    if (hasError && resetOnPropsChange && prevProps.children !== children) {
      this.resetErrorBoundary();
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    });
  };

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));

      // Auto-reset after a delay if retry fails again
      this.resetTimeoutId = window.setTimeout(() => {
        this.resetErrorBoundary();
      }, 5000);
    } else {
      // Max retries reached, suggest page reload
      if (window.confirm('Multiple attempts failed. Would you like to reload the page?')) {
        window.location.reload();
      }
    }
  };

  renderApplicationError(error: AppError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-lg w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Application Error
            </h1>
            
            <p className="text-gray-600 mb-6">
              We're sorry, but something went wrong with the application. 
              Our team has been notified and we're working to fix this issue.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Error Details:</h3>
              <p className="text-sm text-gray-600 font-mono">{error.message}</p>
              {error.code && (
                <p className="text-xs text-gray-500 mt-1">Error Code: {error.code}</p>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </button>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  <Bug className="inline h-4 w-4 mr-1" />
                  Developer Details
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto text-gray-800">
                  {JSON.stringify({
                    error: {
                      message: error.message,
                      code: error.code,
                      timestamp: error.timestamp,
                      context: error.context
                    },
                    componentStack: this.state.errorInfo?.componentStack
                  }, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      </div>
    );
  }

  renderComponentError(error: AppError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">
              Component Error
            </h3>
            <p className="mt-1 text-sm text-red-700">
              {error.message}
            </p>
            <div className="mt-4">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderSectionError(error: AppError) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              This section couldn't load properly. {error.message}
            </p>
            <button
              onClick={this.handleRetry}
              className="mt-2 text-sm text-yellow-800 hover:text-yellow-900 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  render() {
    const { hasError, error, retryCount } = this.state;
    const { children, fallback, level = 'component', maxRetries = 3 } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, this.handleRetry);
      }

      // Show retry limit reached message
      if (retryCount >= maxRetries) {
        return (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong className="font-bold">Maximum retry attempts reached. </strong>
            <span>Please refresh the page or contact support if the problem persists.</span>
          </div>
        );
      }

      // Render appropriate error UI based on level
      switch (level) {
        case 'application':
          return this.renderApplicationError(error);
        case 'section':
          return this.renderSectionError(error);
        case 'component':
        default:
          return this.renderComponentError(error);
      }
    }

    return children;
  }
}

export default ErrorBoundary;

