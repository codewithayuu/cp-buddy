import type { TestcaseId } from './types';
import type { VerdictName } from './verdict';

export const StressTestState = {
  inactive: 'inactive',
  compiling: 'compiling',
  compilationError: 'compilationError',
  generating: 'generating',
  runningBruteForce: 'runningBruteForce',
  runningSolution: 'runningSolution',
  foundDifference: 'foundDifference',
  internalError: 'internalError',
} as const;
export type StressTestState = (typeof StressTestState)[keyof typeof StressTestState];

///////////////

export type WithRevision<T> = T & { revision: number };

export type ITestcaseIo = { data: string } | { path: string };

export interface ITestcaseResult {
  verdict: VerdictName;
  timeMs: number | null;
  memoryMb: number | null;
  stdout: ITestcaseIo | null;
  stderr: ITestcaseIo | null;
  msg: string | null;
}
export interface ITestcase {
  stdin: ITestcaseIo;
  answer: ITestcaseIo;
  isExpand: boolean;
  isDisabled: boolean;
  result: ITestcaseResult | null;
}

export interface IFileWithHash {
  path: string;
  hash: string | null;
}

export interface IStressTest {
  generator: IFileWithHash | null;
  bruteForce: IFileWithHash | null;
  cnt: number;
  state: StressTestState;
}

export interface IOverrides {
  timeLimitMs: number | null;
  memoryLimitMb: number | null;
  compiler: string | null;
  compilerArgs: string | null;
  runner: string | null;
  runnerArgs: string | null;
}

export interface IProblem {
  version: string;
  name: string;
  url: string | null;
  testcases: Record<TestcaseId, ITestcase>;
  testcaseOrder: TestcaseId[];
  src: IFileWithHash;
  checker: IFileWithHash | null;
  interactor: IFileWithHash | null;
  stressTest: IStressTest;
  timeElapsedMs: number;
  overrides: IOverrides;
}

export interface ICphProblem {
  name: string;
  url: string;
  tests: { id: number; input: string; output: string }[];
  interactive: boolean;
  memoryLimit: number;
  timeLimit: number;
  srcPath: string;
  group: string;
  local: boolean;
}
