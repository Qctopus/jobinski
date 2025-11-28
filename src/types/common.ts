/**
 * Common type definitions for better type safety across the application
 */

// Utility types for better type safety
export type NonEmptyString = string & { readonly __brand: unique symbol };
export type PositiveNumber = number & { readonly __brand: unique symbol };
export type ISO8601Date = string & { readonly __brand: unique symbol };
export type Percentage = number & { readonly __brand: unique symbol }; // 0-100

// Result type for better error handling
export type Result<T, E = Error> = {
  success: true;
  data: T;
} | {
  success: false;
  error: E;
};

// Async result type
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

// Loading state types
export type LoadingState = 
  | { status: 'idle' }
  | { status: 'loading'; progress?: number }
  | { status: 'success' }
  | { status: 'error'; error: Error };

// Enhanced error types
export interface AppError extends Error {
  readonly code: string;
  readonly context?: Record<string, unknown>;
  readonly timestamp: Date;
  readonly recoverable: boolean;
}

export interface ValidationError extends AppError {
  readonly field: string;
  readonly value: unknown;
  readonly constraint: string;
}

export interface ProcessingError extends AppError {
  readonly stage: 'parsing' | 'transformation' | 'analysis' | 'calculation';
  readonly dataSize: number;
}

// Type guards
export const isNonEmptyString = (value: string): value is NonEmptyString => 
  value.length > 0;

export const isPositiveNumber = (value: number): value is PositiveNumber => 
  value > 0 && !isNaN(value) && isFinite(value);

export const isValidPercentage = (value: number): value is Percentage => 
  value >= 0 && value <= 100 && !isNaN(value) && isFinite(value);

export const isValidISO8601Date = (value: string): value is ISO8601Date => {
  const date = new Date(value);
  return !isNaN(date.getTime()) && date.toISOString().startsWith(value.split('T')[0]);
};

// Helper functions for creating branded types
export const createNonEmptyString = (value: string): NonEmptyString | null =>
  isNonEmptyString(value) ? value as NonEmptyString : null;

export const createPositiveNumber = (value: number): PositiveNumber | null =>
  isPositiveNumber(value) ? value as PositiveNumber : null;

export const createPercentage = (value: number): Percentage | null =>
  isValidPercentage(value) ? value as Percentage : null;

export const createISO8601Date = (value: string): ISO8601Date | null =>
  isValidISO8601Date(value) ? value as ISO8601Date : null;

// Error factory functions
export const createAppError = (
  message: string,
  code: string,
  recoverable: boolean = true,
  context?: Record<string, unknown>
): AppError => ({
  name: 'AppError',
  message,
  code,
  context,
  timestamp: new Date(),
  recoverable
});

export const createValidationError = (
  field: string,
  value: unknown,
  constraint: string,
  message?: string
): ValidationError => ({
  name: 'ValidationError',
  message: message || `Validation failed for field '${field}': ${constraint}`,
  code: 'VALIDATION_ERROR',
  field,
  value,
  constraint,
  timestamp: new Date(),
  recoverable: true
});

export const createProcessingError = (
  stage: ProcessingError['stage'],
  dataSize: number,
  message: string,
  context?: Record<string, unknown>
): ProcessingError => ({
  name: 'ProcessingError',
  message,
  code: 'PROCESSING_ERROR',
  stage,
  dataSize,
  context,
  timestamp: new Date(),
  recoverable: false
});

// Utility function to create successful results
export const success = <T>(data: T): Result<T, never> => ({
  success: true,
  data
});

// Utility function to create error results
export const failure = <E extends Error>(error: E): Result<never, E> => ({
  success: false,
  error
});

// Utility function to handle async operations with Result type
export const tryCatch = async <T>(
  operation: () => Promise<T>,
  errorTransform?: (error: unknown) => Error
): AsyncResult<T> => {
  try {
    const data = await operation();
    return success(data);
  } catch (error) {
    const transformedError = errorTransform 
      ? errorTransform(error)
      : error instanceof Error 
        ? error 
        : new Error(String(error));
    return failure(transformedError);
  }
};

// Type for component props that can have loading states
export interface WithLoadingState {
  loadingState: LoadingState;
}

// Type for component props that can have error states
export interface WithErrorState {
  error?: AppError | null;
  onRetry?: () => void;
}

// Combined loading and error state
export interface WithAsyncState extends WithLoadingState, WithErrorState {}

// Utility type for merging props with async state
export type WithAsyncProps<T> = T & WithAsyncState;
