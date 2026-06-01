export class TelemetryTrustedValue<T = string> {
  public constructor(public readonly value: T) {}
}

export type TelemetryEventProp<T> = T | TelemetryTrustedValue<T>;

export interface TelemetryEventProps {
  readonly [key: string]: TelemetryEventProp<string | number | boolean | null | undefined>;
}

const TELEMETRY_EVENT_NAMES = ['activate'] as const;
export type TelemetryEventName = (typeof TELEMETRY_EVENT_NAMES)[number];
export const TELEMETRY_ERROR_NAMES = [
  'pipeFailed',
  'wrapperError',
  'parseRunnerError',
  'loadProblemError',
  'saveError',
  'deleteError',
  'compileError',
  'activationError',
] as const;
export type TelemetryErrorName = (typeof TELEMETRY_ERROR_NAMES)[number];
export type TelemetryName = TelemetryEventName | TelemetryErrorName;

export interface ITelemetry {
  event(name: TelemetryEventName, props?: TelemetryEventProps): void;
  error(name: TelemetryErrorName, error: unknown, props?: TelemetryEventProps): void;
  start(
    name: TelemetryEventName,
    props?: TelemetryEventProps,
  ): (endProps?: TelemetryEventProps) => void;
}
