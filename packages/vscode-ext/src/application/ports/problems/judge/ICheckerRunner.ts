export interface CheckerOptions {
  checkerPath: string;
  inputPath: string;
  outputPath: string;
  answerPath: string;
}

interface CheckerData {
  exitCode: number;
  msg: string;
}

export type CheckerResult = CheckerData | Error;

export interface ICheckerRunner {
  run(options: CheckerOptions, signal: AbortSignal): Promise<CheckerResult>;
}
