import { loggerMock } from '@t/infrastructure/vscode/loggerMock';
import { mock } from '@t/mock';
import type { ITelemetry } from '@/application/ports/vscode/ITelemetry';

const logger = loggerMock.withScope('TelemetryMock');
export const telemetryMock = mock<ITelemetry>();
telemetryMock.start.mockImplementation((name, props) => {
  logger.debug(`[Telemetry Start] ${name}`, props ?? '');

  return (endProps?: Record<string, unknown>) => {
    logger.debug(`[Telemetry End] ${name}`, {
      ...props,
      ...endProps,
    });
  };
});
telemetryMock.event.mockImplementation((name, props) => {
  logger.debug(`[Telemetry Event] ${name}`, props ?? '');
});
telemetryMock.error.mockImplementation((name, error, props) => {
  logger.error(`[Telemetry Error] ${name}`, {
    error,
    ...props,
  });
});
