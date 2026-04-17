import type { TestcaseId } from './types';
import type { Verdict } from './verdict';

export type IWebviewTestcaseIo =
  | { type: 'string'; data: string }
  | { type: 'file'; path: string; base: string };

export interface IWebviewTestcaseResult {
  verdict: Verdict;
  timeMs: number | null;
  memoryMb: number | null;
  stdout: IWebviewTestcaseIo | null;
  stderr: IWebviewTestcaseIo | null;
  msg: string | null;
}
export interface IWebviewTestcase {
  stdin: IWebviewTestcaseIo;
  answer: IWebviewTestcaseIo;
  isExpand: boolean;
  isDisabled: boolean;
  result: IWebviewTestcaseResult | null;
}

export interface IWebviewFileWithHash {
  path: string;
  base: string;
}

export interface IWebviewStressTest {
  generator: IWebviewFileWithHash | null;
  bruteForce: IWebviewFileWithHash | null;
  isRunning: boolean;
  msg: string;
}

export interface IWebviewOverride<T> {
  defaultValue: T;
  override: T | null;
}

export interface IWebviewOverrides {
  timeLimitMs: IWebviewOverride<number>;
  memoryLimitMb: IWebviewOverride<number>;
  compiler?: IWebviewOverride<string>;
  compilerArgs?: IWebviewOverride<string>;
  runner?: IWebviewOverride<string>;
  runnerArgs?: IWebviewOverride<string>;
}

export interface IWebviewProblem {
  name: string;
  url: string | null;
  revision: number;
  testcases: Record<TestcaseId, IWebviewTestcase>;
  testcaseOrder: TestcaseId[];
  src: IWebviewFileWithHash;
  checker: IWebviewFileWithHash | null;
  interactor: IWebviewFileWithHash | null;
  stressTest: IWebviewStressTest;
  timeElapsedMs: number;
  overrides: IWebviewOverrides;
}

export interface IWebviewBackgroundProblem {
  name: string;
  srcPath: string;
}
