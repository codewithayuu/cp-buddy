export interface IRunnerProvider {
  getRunnerPath(signal: AbortSignal): Promise<string>;
}
