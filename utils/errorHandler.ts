export enum ErrorType {
  NETWORK = 'network',
  AUTH = 'auth',
  RATE_LIMIT = 'rate_limit',
  SERVER = 'server',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown',
}

export interface AppError {
  type: ErrorType;
  message: string;
  userMessage: string;
  isRetryable: boolean;
  originalError?: Error;
  code?: string;
}

export function categorizeError(error: any): AppError {
  if (!error) {
    return {
      type: ErrorType.UNKNOWN,
      message: 'Unknown error occurred',
      userMessage: 'Something went wrong. Please try again.',
      isRetryable: true,
    };
  }

  if (error.code === 'MESSAGE_LIMIT_REACHED' || error.status === 429) {
    return {
      type: ErrorType.RATE_LIMIT,
      message: 'Message limit reached',
      userMessage: 'You have reached your message limit. Please upgrade to continue.',
      isRetryable: false,
      code: error.code,
      originalError: error,
    };
  }

  if (error.message?.includes('No active session') || error.message?.includes('not authenticated')) {
    return {
      type: ErrorType.AUTH,
      message: error.message || 'Authentication error',
      userMessage: 'Your session has expired. Please log in again.',
      isRetryable: false,
      originalError: error,
    };
  }

  if (error.message?.includes('Failed to fetch') || error.message?.includes('Network request failed')) {
    return {
      type: ErrorType.NETWORK,
      message: error.message || 'Network error',
      userMessage: 'Unable to connect. Please check your internet connection and try again.',
      isRetryable: true,
      originalError: error,
    };
  }

  if (error.status >= 500) {
    return {
      type: ErrorType.SERVER,
      message: error.message || 'Server error',
      userMessage: 'Our servers are experiencing issues. Please try again in a moment.',
      isRetryable: true,
      originalError: error,
    };
  }

  if (error.status >= 400 && error.status < 500) {
    return {
      type: ErrorType.VALIDATION,
      message: error.message || 'Validation error',
      userMessage: error.message || 'There was a problem with your request. Please try again.',
      isRetryable: false,
      originalError: error,
    };
  }

  return {
    type: ErrorType.UNKNOWN,
    message: error.message || 'Unknown error',
    userMessage: error.message || 'An unexpected error occurred. Please try again.',
    isRetryable: true,
    originalError: error,
  };
}

export function getErrorRecoveryActions(errorType: ErrorType): string[] {
  switch (errorType) {
    case ErrorType.NETWORK:
      return [
        'Check your internet connection',
        'Try again in a few moments',
        'Switch to a different network if available',
      ];
    case ErrorType.AUTH:
      return [
        'Log out and log back in',
        'Clear your browser cache',
        'Contact support if the issue persists',
      ];
    case ErrorType.RATE_LIMIT:
      return [
        'Upgrade to Premium for unlimited messages',
        'Wait until your daily limit resets',
        'Review your subscription status',
      ];
    case ErrorType.SERVER:
      return [
        'Wait a few moments and try again',
        'Check our status page for updates',
        'Contact support if the issue continues',
      ];
    case ErrorType.VALIDATION:
      return [
        'Review your input and try again',
        'Make sure all required fields are filled',
        'Contact support if you need help',
      ];
    default:
      return [
        'Try refreshing the page',
        'Clear your browser cache',
        'Contact support if the problem persists',
      ];
  }
}

export function shouldShowRetryButton(error: AppError): boolean {
  return error.isRetryable;
}

export function formatErrorForDisplay(error: any): string {
  const appError = categorizeError(error);
  return appError.userMessage;
}

export class AppErrorBoundaryError extends Error {
  public readonly errorType: ErrorType;
  public readonly userMessage: string;
  public readonly isRetryable: boolean;

  constructor(appError: AppError) {
    super(appError.message);
    this.name = 'AppErrorBoundaryError';
    this.errorType = appError.type;
    this.userMessage = appError.userMessage;
    this.isRetryable = appError.isRetryable;
  }
}
