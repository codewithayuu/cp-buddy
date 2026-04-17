import type { BatchId } from './types';

// Router Config
export interface RouterConfig {
  port: number;
  logFile: string;
}

// Companion Problem
export interface CompanionProblem {
  name: string;
  group: string;
  url: string;
  interactive: boolean;
  memoryLimit: number;
  timeLimit: number;
  tests: {
    input: string;
    output: string;
  }[];
  testType: 'single' | 'multiNumber';
  input: {
    type: 'stdin' | 'file' | 'regex';
    fileName?: string;
    pattern?: string;
  };
  output: {
    type: 'stdout' | 'file';
    fileName?: string;
  };
  languages: {
    java: {
      mainClass: string;
      taskClass: string;
    };
  };
  batch: {
    id: BatchId;
    size: number;
  };
}

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';
export interface SubmitData {
  url: string;
  sourceCode: string;
}

// Router -> Client
export interface R2cMsg {
  readingBatch: (msg: { batchId: BatchId; count: number; size: number }) => void;
  batchAvailable: (msg: {
    batchId: BatchId;
    problems: CompanionProblem[];
    autoImport: boolean;
  }) => void;
  batchClaimed: (msg: { batchId: BatchId }) => void;
  log: (msg: { level: LogLevel; message: string; details?: unknown }) => void;
  browserStatus: (msg: { connected: boolean }) => void;
}

// Router -> Browser messages
export interface R2bMsg {
  submitRequest: (msg: SubmitData) => void;
  status: (msg: { isActive: boolean }) => void;
}

// Client -> Router Messages
export interface C2rMsg {
  cancelBatch: (msg: { batchId: BatchId }) => void;
  claimBatch: (msg: { batchId: BatchId }) => void;
  submit: (msg: SubmitData) => void;
  updateConfig: (msg: { config: Partial<RouterConfig> }) => void;
}

// Browser -> Router Messages
export interface B2rMsg {
  setActive: () => void;
}
