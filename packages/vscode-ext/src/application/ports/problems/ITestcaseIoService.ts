import type { TestcaseIo } from '@/domain/entities/testcaseIo';

export interface FilePathResult {
  path: string;
  needDispose: boolean;
}

export interface ITestcaseIoService {
  readContent(io: TestcaseIo): Promise<string>;
  writeContent(io: TestcaseIo, content: string): Promise<TestcaseIo>;
  ensureFilePath(io: TestcaseIo): Promise<FilePathResult>;
  tryInlining(io: TestcaseIo): Promise<TestcaseIo>;
  dispose(io: TestcaseIo): Promise<void>;
}
