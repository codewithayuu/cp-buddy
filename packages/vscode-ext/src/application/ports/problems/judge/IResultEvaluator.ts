import type { VerdictName } from '@cpbuddy/core';
import type { ExecutionData } from '@/domain/execution';

export interface JudgeRequest {
  executionResult: ExecutionData;
  inputPath: string;
  answerPath: string;
  checkerPath?: string;
  interactorResult?: {
    execution: ExecutionData;
    feedback: string;
  };
  timeLimitMs: number;
  memoryLimitMb?: number;
}

export interface FinalResult {
  verdict: VerdictName;
  timeMs?: number;
  memoryMb?: number;
  msg?: string;
}

export interface IResultEvaluator {
  judge(req: JudgeRequest, signal: AbortSignal): Promise<FinalResult>;
}
