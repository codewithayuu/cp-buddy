import type { TelemetryEventMeasurements, TelemetryReporter } from '@vscode/extension-telemetry';
import { inject, injectable } from 'tsyringe';
import { TelemetryTrustedValue as vsTelemetryTrustedValue } from 'vscode';
import type { IClock } from '@/application/ports/node/IClock';
import {
  type ITelemetry,
  TELEMETRY_ERROR_NAMES,
  type TelemetryErrorName,
  type TelemetryEventName,
  type TelemetryEventProps,
  type TelemetryName,
  TelemetryTrustedValue,
} from '@/application/ports/vscode/ITelemetry';
import { TOKENS } from '@/composition/tokens';

@injectable()
export class TelemetryAdapter implements ITelemetry {
  public constructor(
    @inject(TOKENS.telemetryReporter) private readonly reporter: TelemetryReporter,
    @inject(TOKENS.clock) private readonly clock: IClock,
  ) {}

  private isErrorName(name: TelemetryName): name is TelemetryErrorName {
    return (TELEMETRY_ERROR_NAMES as readonly string[]).includes(name);
  }

  private send(
    name: TelemetryName,
    props: TelemetryEventProps,
    measurements?: TelemetryEventMeasurements,
  ): void {
    const eventProps: {
      [key: string]: string | vsTelemetryTrustedValue<string>;
    } = {};
    for (const prop in props) {
      const value = props[prop];
      eventProps[prop] =
        value instanceof TelemetryTrustedValue
          ? new vsTelemetryTrustedValue(String(value.value))
          : String(value);
    }
    if (this.isErrorName(name))
      this.reporter.sendTelemetryErrorEvent(name, eventProps, measurements);
    else this.reporter.sendTelemetryEvent(name, eventProps, measurements);
  }

  public event(name: TelemetryEventName, props?: TelemetryEventProps): void {
    this.send(name, props ?? {});
  }

  public error(name: TelemetryErrorName, e: unknown, props?: TelemetryEventProps): void {
    const error = e instanceof Error ? e : new Error(String(e));
    this.send(name, {
      name: error.name,
      message: error.message,
      stack: error.stack ? new TelemetryTrustedValue(error.stack) : '',
      cause: String(error.cause),
      ...props,
    });
  }

  public start(
    name: TelemetryEventName,
    props?: TelemetryEventProps,
  ): (endProps?: TelemetryEventProps) => void {
    const startTime = this.clock.now();
    return (endProps?: TelemetryEventProps) => {
      const duration = this.clock.now() - startTime;
      this.send(name, { ...props, ...endProps }, { duration });
    };
  }
}
