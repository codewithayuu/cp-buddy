import type { VerdictName } from '@cpbuddy/core';
import type { Promisable } from 'type-fest';
import type { TestcaseResult } from '@/domain/entities/testcase';

export interface IJudgeObserver {
  onStatusChange(verdict: VerdictName): void;
  onResult(result: Partial<TestcaseResult>): Promisable<void>;
  onError(error: Error): Promisable<void>;
}
