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
}
