import logger, {
  debug,
  info,
  warn,
  error,
  createLogger,
  logOperation,
  logAsyncOperation,
} from '../logger';

describe('logger', () => {
  const originalConsole = {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
  };

  beforeEach(() => {
    console.debug = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    console.debug = originalConsole.debug;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  });

  describe('debug', () => {
    it('logs debug messages', () => {
      debug('Test debug message');

      expect(console.debug).toHaveBeenCalled();
    });

    it('includes context in output', () => {
      debug('Test message', { component: 'TestComponent', action: 'test' });

      const call = (console.debug as jest.Mock).mock.calls[0][0];
      expect(call).toContain('TestComponent');
    });
  });

  describe('info', () => {
    it('logs info messages', () => {
      info('Test info message');

      expect(console.info).toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    it('logs warning messages', () => {
      warn('Test warning message');

      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('logs error messages', () => {
      error('Test error message');

      expect(console.error).toHaveBeenCalled();
    });

    it('includes error object in output', () => {
      const testError = new Error('Test error');
      error('Error occurred', testError);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error occurred'),
        testError
      );
    });

    it('handles non-Error objects', () => {
      error('Error occurred', 'string error');

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('createLogger', () => {
    it('creates logger with component context', () => {
      const componentLogger = createLogger('MyComponent');

      componentLogger.info('Test message');

      const call = (console.info as jest.Mock).mock.calls[0][0];
      expect(call).toContain('MyComponent');
    });

    it('provides all log methods', () => {
      const componentLogger = createLogger('TestComponent');

      expect(componentLogger.debug).toBeDefined();
      expect(componentLogger.info).toBeDefined();
      expect(componentLogger.warn).toBeDefined();
      expect(componentLogger.error).toBeDefined();
    });

    it('merges additional context', () => {
      const componentLogger = createLogger('TestComponent');

      componentLogger.info('Test', { action: 'testAction' });

      const call = (console.info as jest.Mock).mock.calls[0][0];
      expect(call).toContain('TestComponent');
      expect(call).toContain('testAction');
    });
  });

  describe('logOperation', () => {
    it('logs start and completion of sync operation', () => {
      const result = logOperation('testOp', { component: 'Test' }, () => 'result');

      expect(result).toBe('result');
      expect(console.debug).toHaveBeenCalledTimes(2);
    });

    it('logs error on failure and rethrows', () => {
      const testError = new Error('Operation failed');

      expect(() => {
        logOperation('failOp', { component: 'Test' }, () => {
          throw testError;
        });
      }).toThrow(testError);

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('logAsyncOperation', () => {
    it('logs start and completion of async operation', async () => {
      const result = await logAsyncOperation(
        'asyncOp',
        { component: 'Test' },
        async () => 'async result'
      );

      expect(result).toBe('async result');
      expect(console.debug).toHaveBeenCalledTimes(2);
    });

    it('logs error on async failure and rethrows', async () => {
      const testError = new Error('Async operation failed');

      await expect(
        logAsyncOperation('failAsyncOp', { component: 'Test' }, async () => {
          throw testError;
        })
      ).rejects.toThrow(testError);

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('default export', () => {
    it('exports all functions', () => {
      expect(logger.debug).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.createLogger).toBeDefined();
      expect(logger.logOperation).toBeDefined();
      expect(logger.logAsyncOperation).toBeDefined();
    });
  });
});
