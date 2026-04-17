import type { TestcaseId } from '@cpbuddy/core';
import type { Problem } from '@/domain/entities/problem';
import type { Testcase } from '@/domain/entities/testcase';

export interface IProblemService {
  getDataPath(srcPath: string): string | null;
  getTestcasePath(srcPath: string, id: TestcaseId, ext: string): string | null;
  create(srcPath: string): Promise<Problem | null>;
  loadBySrc(srcPath: string): Promise<Problem | null>;
  loadTestcases(problem: Problem, file: boolean): Promise<void>;
  applyTestcases(problem: Problem, testcases: Testcase[]): void;
  save(problem: Problem): Promise<void>;
  delete(problem: Problem): Promise<void>;
  isRelated(problem: Problem, path: string): boolean;
  getLimits(problem: Problem): { timeLimitMs: number; memoryLimitMb: number };
}
