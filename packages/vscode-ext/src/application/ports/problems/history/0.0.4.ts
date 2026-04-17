interface TestCaseVerdict {
  name: string;
  fullName: string;
  color: string;
}

type TestCaseIO = { useFile: true; path: string } | { useFile: false; data: string };

interface TestCaseResult {
  verdict: TestCaseVerdict;
  time: number;
  stdout: TestCaseIO;
  stderr: TestCaseIO;
  message: string;
}

interface TestCase {
  stdin: TestCaseIO;
  answer: TestCaseIO;
  isExpand: boolean;
  result?: TestCaseResult;
}

export interface Problem {
  name: string;
  url?: string;
  testCases: TestCase[];
  timeLimit: number;
  srcPath: string;
  srcHash?: string;
  isSpecialJudge?: boolean;
  checkerPath?: string;
  checkerHash?: string;
}
