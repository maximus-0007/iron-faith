import {
  ErrorType,
  AppError,
  categorizeError,
  getErrorRecoveryActions,
  shouldShowRetryButton,
  formatErrorForDisplay,
  AppErrorBoundaryError,
} from '../errorHandler';

describe('errorHandler', () => {
  describe('categorizeError', () => {
    it('returns unknown error for null/undefined', () => {
      expect(categorizeError(null).type).toBe(ErrorType.UNKNOWN);
      expect(categorizeError(undefined).type).toBe(ErrorType.UNKNOWN);
    });

    it('categorizes rate limit errors (429)', () => {
      const error = { status: 429, message: 'Too many requests' };
      const result = categorizeError(error);

      expect(result.type).toBe(ErrorType.RATE_LIMIT);
      expect(result.isRetryable).toBe(false);
    });

    it('categorizes MESSAGE_LIMIT_REACHED code', () => {
      const error = { code: 'MESSAGE_LIMIT_REACHED' };
      const result = categorizeError(error);

      expect(result.type).toBe(ErrorType.RATE_LIMIT);
      expect(result.userMessage).toContain('upgrade');
    });

    it('categorizes authentication errors', () => {
      const sessionError = { message: 'No active session' };
      const authError = { message: 'not authenticated' };

      expect(categorizeError(sessionError).type).toBe(ErrorType.AUTH);
      expect(categorizeError(authError).type).toBe(ErrorType.AUTH);
      expect(categorizeError(sessionError).isRetryable).toBe(false);
    });

    it('categorizes network errors', () => {
      const fetchError = { message: 'Failed to fetch' };
      const networkError = { message: 'Network request failed' };

      expect(categorizeError(fetchError).type).toBe(ErrorType.NETWORK);
      expect(categorizeError(networkError).type).toBe(ErrorType.NETWORK);
      expect(categorizeError(fetchError).isRetryable).toBe(true);
    });

    it('categorizes server errors (5xx)', () => {
      const error = { status: 500, message: 'Internal server error' };
      const result = categorizeError(error);

      expect(result.type).toBe(ErrorType.SERVER);
      expect(result.isRetryable).toBe(true);
    });

    it('categorizes validation errors (4xx)', () => {
      const error = { status: 400, message: 'Bad request' };
      const result = categorizeError(error);

      expect(result.type).toBe(ErrorType.VALIDATION);
      expect(result.isRetryable).toBe(false);
    });

    it('preserves original error', () => {
      const originalError = new Error('Original message');
      const error = { status: 500, message: 'Server error' };
      Object.assign(error, originalError);

      const result = categorizeError(error);

      expect(result.originalError).toBeDefined();
    });
  });

  describe('getErrorRecoveryActions', () => {
    it('returns network recovery actions', () => {
      const actions = getErrorRecoveryActions(ErrorType.NETWORK);

      expect(actions).toContain('Check your internet connection');
      expect(actions.length).toBeGreaterThan(0);
    });

    it('returns auth recovery actions', () => {
      const actions = getErrorRecoveryActions(ErrorType.AUTH);

      expect(actions.some(a => a.toLowerCase().includes('log'))).toBe(true);
    });

    it('returns rate limit recovery actions', () => {
      const actions = getErrorRecoveryActions(ErrorType.RATE_LIMIT);

      expect(actions.some(a => a.toLowerCase().includes('upgrade') || a.toLowerCase().includes('premium'))).toBe(true);
    });

    it('returns server error recovery actions', () => {
      const actions = getErrorRecoveryActions(ErrorType.SERVER);

      expect(actions.some(a => a.toLowerCase().includes('wait') || a.toLowerCase().includes('try again'))).toBe(true);
    });

    it('returns validation recovery actions', () => {
      const actions = getErrorRecoveryActions(ErrorType.VALIDATION);

      expect(actions.some(a => a.toLowerCase().includes('input') || a.toLowerCase().includes('review'))).toBe(true);
    });

    it('returns default recovery actions for unknown errors', () => {
      const actions = getErrorRecoveryActions(ErrorType.UNKNOWN);

      expect(actions.length).toBeGreaterThan(0);
    });
  });

  describe('shouldShowRetryButton', () => {
    it('returns true for retryable errors', () => {
      const networkError: AppError = {
        type: ErrorType.NETWORK,
        message: 'Network error',
        userMessage: 'Connection failed',
        isRetryable: true,
      };

      expect(shouldShowRetryButton(networkError)).toBe(true);
    });

    it('returns false for non-retryable errors', () => {
      const authError: AppError = {
        type: ErrorType.AUTH,
        message: 'Auth error',
        userMessage: 'Please log in',
        isRetryable: false,
      };

      expect(shouldShowRetryButton(authError)).toBe(false);
    });
  });

  describe('formatErrorForDisplay', () => {
    it('returns user-friendly message', () => {
      const error = { message: 'Failed to fetch' };
      const formatted = formatErrorForDisplay(error);

      expect(formatted).not.toBe('Failed to fetch');
      expect(formatted.length).toBeGreaterThan(0);
    });

    it('handles null error', () => {
      const formatted = formatErrorForDisplay(null);

      expect(formatted).toBe('Something went wrong. Please try again.');
    });
  });

  describe('AppErrorBoundaryError', () => {
    it('creates error with correct properties', () => {
      const appError: AppError = {
        type: ErrorType.SERVER,
        message: 'Server error',
        userMessage: 'Something went wrong',
        isRetryable: true,
      };

      const boundaryError = new AppErrorBoundaryError(appError);

      expect(boundaryError.name).toBe('AppErrorBoundaryError');
      expect(boundaryError.errorType).toBe(ErrorType.SERVER);
      expect(boundaryError.userMessage).toBe('Something went wrong');
      expect(boundaryError.isRetryable).toBe(true);
      expect(boundaryError.message).toBe('Server error');
    });

    it('extends Error class', () => {
      const appError: AppError = {
        type: ErrorType.UNKNOWN,
        message: 'Test error',
        userMessage: 'Test',
        isRetryable: false,
      };

      const boundaryError = new AppErrorBoundaryError(appError);

      expect(boundaryError instanceof Error).toBe(true);
    });
  });
});
