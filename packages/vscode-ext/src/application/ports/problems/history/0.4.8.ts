import type { UUID } from 'node:crypto';

interface ITcVerdict {
  name: string;
  fullName: string;
  color: string;
}

export interface ITcIo {
  useFile: boolean;
  data: string;
}

interface ITcResult {
  verdict: ITcVerdict;
  time?: number;
  memory?: number;
  stdout: ITcIo;
  stderr: ITcIo;
  msg: string[];
}
interface ITc {
  stdin: ITcIo;
  answer: ITcIo;
  isExpand: boolean;
  isDisabled: boolean;
  result?: ITcResult;
}

interface IFileWithHash {
  path: string;
  hash?: string;
}

interface IBfCompare {
  generator?: IFileWithHash;
  bruteForce?: IFileWithHash;
  running: boolean;
  msg: string;
}

interface ICompilationSettings {
  compiler?: string;
  compilerArgs?: string;
  runner?: string;
  runnerArgs?: string;
}

export interface IProblem {
  version: string;
  name: string;
  url?: string;
  tcs: Record<UUID, ITc>;
  tcOrder: UUID[];
  timeLimit: number;
  memoryLimit: number;
  src: IFileWithHash;
  checker?: IFileWithHash;
  interactor?: IFileWithHash;
  bfCompare?: IBfCompare;
  timeElapsed: number;
  compilationSettings?: ICompilationSettings;
}
