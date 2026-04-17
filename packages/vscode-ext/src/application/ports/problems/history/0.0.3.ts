interface TestCaseStatus {
  name: string;
  fullName: string;
  color: string;
}

interface TestCase {
  input: string;
  inputFile: boolean;
  answer: string;
  answerFile: boolean;
  output?: string;
  outputFile?: boolean;
  error?: string;
  status?: TestCaseStatus;
  message?: string;
  time?: number;
  isExpand: boolean;
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
