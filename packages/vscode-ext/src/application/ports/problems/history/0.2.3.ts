interface TCVerdict {
  name: string;
  fullName: string;
  color: string;
}

type TCIO = { useFile: true; path: string } | { useFile: false; data: string };

interface TCResult {
  verdict: TCVerdict;
  memory?: number;
  time: number;
  stdout: TCIO;
  stderr: TCIO;
  msg: string;
}

interface TC {
  stdin: TCIO;
  answer: TCIO;
  isExpand: boolean;
  result?: TCResult;
}

interface FileWithHash {
  path: string;
  hash?: string;
}

interface BFCompare {
  generator?: FileWithHash;
  bruteForce?: FileWithHash;
  running: boolean;
  msg: string;
}

export interface Problem {
  version: string;
  name: string;
  url?: string;
  tcs: TC[];
  timeLimit: number;
  memoryLimit: number;
  src: FileWithHash;
  checker?: FileWithHash;
  interactor?: FileWithHash;
  bfCompare?: BFCompare;
  timeElapsed: number;
}
