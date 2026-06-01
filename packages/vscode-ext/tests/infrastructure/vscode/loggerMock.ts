import { type MockProxy, mock } from 'vitest-mock-extended';
import type { ILogger } from '@/application/ports/vscode/ILogger';

const LogLevels = ['info', 'warn', 'error', 'debug', 'trace'] as const;
type LogLevel = (typeof LogLevels)[number];
const consoleMap: Record<LogLevel, (...args: unknown[]) => void> = {
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
  trace: console.debug,
};

interface MockContext {
  readonly root: MockProxy<ILogger>;
  isTracking: boolean;
}

const createLoggerMockInternal = (scope: string, context?: MockContext): MockProxy<ILogger> => {
  const logger = mock<ILogger>();
  const currentContext: MockContext = context ?? {
    root: logger,
    isTracking: false,
  };
  logger.withScope.mockImplementation((name: string) =>
    createLoggerMockInternal(name, currentContext),
  );
  LogLevels.forEach((level) => {
    logger[level].mockImplementation((message: string, ...args: unknown[]) => {
      if (currentContext.isTracking) return;
      consoleMap[level](`[${level.toUpperCase()}]`, `[${scope}]`, message, ...args);
      if (currentContext.root !== logger) {
        currentContext.isTracking = true;
        currentContext.root[level](message, ...args);
        currentContext.isTracking = false;
      }
    });
  });
  return logger;
};

export const loggerMock = createLoggerMockInternal('base');
