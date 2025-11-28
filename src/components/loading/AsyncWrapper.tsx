import React, { ReactNode } from 'react';
import { LoadingState, AppError } from '../../types/common';
import LoadingSpinner from './LoadingSpinner';
import LoadingSkeleton from './LoadingSkeleton';
import ErrorBoundary from '../error-boundaries/ErrorBoundary';

interface AsyncWrapperProps {
  loadingState: LoadingState;
  error?: AppError | null;
  children: ReactNode;
  loadingComponent?: ReactNode;
  errorComponent?: (error: AppError, retry?: () => void) => ReactNode;
  skeletonType?: 'spinner' | 'skeleton' | 'custom';
  skeletonVariant?: 'text' | 'rectangle' | 'circle' | 'card' | 'chart' | 'table' | 'dashboard';
  showProgress?: boolean;
  onRetry?: () => void;
  className?: string;
  minimumLoadingTime?: number; // Minimum time to show loading state (prevents flashing)
}

/**
 * Wrapper component that handles async states (loading, error, success) with proper UI states
 */
export const AsyncWrapper: React.FC<AsyncWrapperProps> = ({
  loadingState,
  error,
  children,
  loadingComponent,
  errorComponent,
  skeletonType = 'skeleton',
  skeletonVariant = 'rectangle',
  showProgress = false,
  onRetry,
  className = '',
  minimumLoadingTime = 200
}) => {
  const [showLoading, setShowLoading] = React.useState(false);
  const [startTime, setStartTime] = React.useState<number | null>(null);

  // Handle minimum loading time to prevent loading flash
  React.useEffect(() => {
    if (loadingState.status === 'loading') {
      if (!startTime) {
        setStartTime(Date.now());
        setShowLoading(true);
      }
    } else if (loadingState.status === 'success' && startTime) {
      const elapsed = Date.now() - startTime;
      if (elapsed < minimumLoadingTime) {
        setTimeout(() => {
          setShowLoading(false);
          setStartTime(null);
        }, minimumLoadingTime - elapsed);
      } else {
        setShowLoading(false);
        setStartTime(null);
      }
    } else {
      setShowLoading(false);
      setStartTime(null);
    }
  }, [loadingState.status, startTime, minimumLoadingTime]);

  const renderLoadingState = () => {
    if (loadingComponent) {
      return loadingComponent;
    }

    const progress = loadingState.status === 'loading' ? loadingState.progress : undefined;

    switch (skeletonType) {
      case 'spinner':
        return (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner
              size="lg"
              variant="analytics"
              message="Loading data..."
              progress={progress}
              showProgress={showProgress && progress !== undefined}
            />
          </div>
        );

      case 'skeleton':
        return (
          <div className="animate-pulse">
            <LoadingSkeleton variant={skeletonVariant} />
          </div>
        );

      case 'custom':
      default:
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingSpinner
              size="xl"
              variant="data"
              message="Processing job analytics..."
              progress={progress}
              showProgress={showProgress}
            />
          </div>
        );
    }
  };

  const renderErrorState = () => {
    if (error && errorComponent) {
      return errorComponent(error, onRetry);
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-4">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
              <p className="text-sm text-red-700 mt-1">{error.message}</p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="mt-3 text-sm text-red-800 hover:text-red-900 underline focus:outline-none"
                >
                  Try again
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // Determine what to render based on state
  const shouldShowLoading = showLoading || loadingState.status === 'loading';
  const shouldShowError = loadingState.status === 'error' || error;

  return (
    <div className={className}>
      <ErrorBoundary level="component">
        {shouldShowError ? (
          renderErrorState()
        ) : shouldShowLoading ? (
          renderLoadingState()
        ) : (
          children
        )}
      </ErrorBoundary>
    </div>
  );
};

// Higher-order component version for easier usage
export const withAsyncState = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    skeletonType?: AsyncWrapperProps['skeletonType'];
    skeletonVariant?: AsyncWrapperProps['skeletonVariant'];
    showProgress?: boolean;
  }
) => {
  return (props: P & {
    loadingState: LoadingState;
    error?: AppError | null;
    onRetry?: () => void;
  }) => {
    const { loadingState, error, onRetry, ...componentProps } = props;
    
    return (
      <AsyncWrapper
        loadingState={loadingState}
        error={error}
        onRetry={onRetry}
        skeletonType={options?.skeletonType}
        skeletonVariant={options?.skeletonVariant}
        showProgress={options?.showProgress}
      >
        <Component {...componentProps as P} />
      </AsyncWrapper>
    );
  };
};

export default AsyncWrapper;

