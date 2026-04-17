export interface ExecutionContext {
  cmd: string[];
  stdinPath: string;
  timeLimitMs: number;
  memoryLimitMb?: number;
}

export interface ExecutionData {
  codeOrSignal: number | string;
  stdoutPath: string;
  stderrPath: string;
  timeMs: number;
  memoryMb?: number;
  isUserAborted: boolean;
}

export class ExecutionRejected extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'ExecutionRejected';
  }
}

export type ExecutionResult = ExecutionData | ExecutionRejected | Error;

interface InteractiveExecutionData {
  sol: ExecutionData;
  int: ExecutionData;
  feedbackPath: string;
}

export type InteractiveExecutionResult = InteractiveExecutionData | Error;
