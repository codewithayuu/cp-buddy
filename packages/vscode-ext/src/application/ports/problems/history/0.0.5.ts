interface TCVerdict {
  name: string;
  fullName: string;
  color: string;
}

type TCIO = { useFile: true; path: string } | { useFile: false; data: string };

interface TCResult {
  verdict: TCVerdict;
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

export interface Problem {
  name: string;
  url?: string;
  tcs: TC[];
  timeLimit: number;
  srcPath: string;
  srcHash?: string;
  isSpecialJudge?: boolean;
  checkerPath?: string;
  checkerHash?: string;
}
