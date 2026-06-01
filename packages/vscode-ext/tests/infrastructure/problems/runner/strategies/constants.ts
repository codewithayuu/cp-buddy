import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { isWin } from '@t/check';
import { container } from 'tsyringe';
import { TOKENS } from '@/composition/tokens';
import type { ExecutionContext } from '@/domain/execution';

export const stdinPath = '/tmp/cpbuddy/stdin';
export const stdoutPath = '/tmp/cpbuddy/stdout';
export const stderrPath = '/tmp/cpbuddy/stderr';
export const solutionPath = '/tmp/cpbuddy/solution';
export const timeLimitMs = 100;
export const mockCtx: ExecutionContext = {
  cmd: ['echo', 'hello'],
  stdinPath,
  timeLimitMs,
};
export const mockCtxNoArg: ExecutionContext = {
  cmd: [solutionPath],
  stdinPath,
  timeLimitMs,
};
export const invalidJson = `{ invalid json `;
export const signal: AbortSignal = new AbortController().signal;
export const createCppExecutable = async (workspace: string, content: string): Promise<string> => {
  const path = join(workspace, 'code.cpp');
  const langs = container.resolve(TOKENS.languageRegistry);
  writeFileSync(path, content);
  const langCpp = langs.getLang(path);
  if (!langCpp) throw new Error('Internal error: can not resolve language for cpp');
  const res = await langCpp.compile({ path, hash: null }, signal, null, { canUseWrapper: true });
  if (res instanceof Error) throw res;
  return res.path;
};
export const createTestWorkspace = (): string => {
  const testWorkspace = join(tmpdir(), `cpbuddy-test-${Date.now()}`);
  mkdirSync(testWorkspace, { recursive: true });
  return testWorkspace;
};
export const cleanupTestWorkspace = (workspace: string): void => {
  rmSync(workspace, { recursive: true, force: true });
};
export const killed = isWin ? 1 : 'SIGTERM';
export const stackOverflow = isWin ? 0xc00000fd : 'SIGSEGV';
