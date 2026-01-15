type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: Error;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const isDevelopment = __DEV__ ?? process.env.NODE_ENV === 'development';
const minLogLevel: LogLevel = isDevelopment ? 'debug' : 'warn';

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[minLogLevel];
}

function formatLogEntry(entry: LogEntry): string {
  const { level, message, timestamp, context } = entry;
  const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
}

function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error
): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
    error,
  };
}

function logToConsole(entry: LogEntry): void {
  const formatted = formatLogEntry(entry);

  switch (entry.level) {
    case 'debug':
      console.debug(formatted);
      break;
    case 'info':
      console.info(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'error':
      console.error(formatted, entry.error || '');
      break;
  }
}

export function debug(message: string, context?: LogContext): void {
  if (!shouldLog('debug')) return;
  const entry = createLogEntry('debug', message, context);
  logToConsole(entry);
}

export function info(message: string, context?: LogContext): void {
  if (!shouldLog('info')) return;
  const entry = createLogEntry('info', message, context);
  logToConsole(entry);
}

export function warn(
  message: string,
  err?: Error | unknown,
  context?: LogContext
): void {
  if (!shouldLog('warn')) return;
  const errorObj = err instanceof Error ? err : undefined;
  const entry = createLogEntry('warn', message, context, errorObj);
  logToConsole(entry);
}

export function error(
  message: string,
  err?: Error | unknown,
  context?: LogContext
): void {
  if (!shouldLog('error')) return;
  const errorObj = err instanceof Error ? err : undefined;
  const entry = createLogEntry('error', message, context, errorObj);
  logToConsole(entry);
}

export function logOperation<T>(
  operation: string,
  context: LogContext,
  fn: () => T
): T {
  debug(`Starting: ${operation}`, context);
  try {
    const result = fn();
    debug(`Completed: ${operation}`, context);
    return result;
  } catch (err) {
    error(`Failed: ${operation}`, err, context);
    throw err;
  }
}

export async function logAsyncOperation<T>(
  operation: string,
  context: LogContext,
  fn: () => Promise<T>
): Promise<T> {
  debug(`Starting: ${operation}`, context);
  try {
    const result = await fn();
    debug(`Completed: ${operation}`, context);
    return result;
  } catch (err) {
    error(`Failed: ${operation}`, err, context);
    throw err;
  }
}

export function createLogger(component: string) {
  return {
    debug: (message: string, context?: Omit<LogContext, 'component'>) =>
      debug(message, { ...context, component }),
    info: (message: string, context?: Omit<LogContext, 'component'>) =>
      info(message, { ...context, component }),
    warn: (message: string, err?: Error | unknown, context?: Omit<LogContext, 'component'>) =>
      warn(message, err, { ...context, component }),
    error: (message: string, err?: Error | unknown, context?: Omit<LogContext, 'component'>) =>
      error(message, err, { ...context, component }),
  };
}

const logger = {
  debug,
  info,
  warn,
  error,
  logOperation,
  logAsyncOperation,
  createLogger,
};

export default logger;
