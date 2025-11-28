import React from 'react';
import { Loader2, BarChart3, Database, TrendingUp } from 'lucide-react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'dots' | 'pulse' | 'bars' | 'data' | 'analytics';
  message?: string;
  progress?: number; // 0-100
  showProgress?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
};

const messageClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl'
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  message,
  progress,
  showProgress = false,
  className = ''
}) => {
  const baseClasses = `inline-block animate-spin text-indigo-600 ${sizeClasses[size]} ${className}`;

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`bg-indigo-600 rounded-full ${sizeClasses[size]} animate-pulse`}
                style={{
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        );

      case 'pulse':
        return (
          <div className={`bg-indigo-600 rounded-full ${sizeClasses[size]} animate-pulse`} />
        );

      case 'bars':
        return (
          <div className="flex items-end space-x-1">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-indigo-600 rounded-sm w-1 animate-pulse"
                style={{
                  height: `${16 + (i % 2) * 8}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '1.2s'
                }}
              />
            ))}
          </div>
        );

      case 'data':
        return (
          <div className="relative">
            <Database className={`${baseClasses} animate-pulse`} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full animate-ping" />
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="relative">
            <BarChart3 className={baseClasses} />
            <TrendingUp className={`absolute -top-1 -right-1 h-3 w-3 text-green-500 animate-bounce`} />
          </div>
        );

      default:
        return <Loader2 className={baseClasses} />;
    }
  };

  const renderProgressBar = () => {
    if (!showProgress || progress === undefined) return null;

    return (
      <div className="mt-3 w-full">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Processing...</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center">
      {renderSpinner()}
      {message && (
        <p className={`mt-2 text-gray-600 text-center ${messageClasses[size]}`}>
          {message}
        </p>
      )}
      {renderProgressBar()}
    </div>
  );
};

export default LoadingSpinner;

