import { executorMock } from '@t/infrastructure/node/processExecutorMock';
import {
  mockCtx,
  signal,
  stderrPath,
  stdoutPath,
} from '@t/infrastructure/problems/runner/strategies/constants';
import { settingsMock } from '@t/infrastructure/vscode/settingsMock';
import { container } from 'tsyringe';
import { beforeEach, describe, expect, it } from 'vitest';
import { anyNumber } from 'vitest-mock-extended';
import { AbortReason, type ProcessOutput } from '@/application/ports/node/IProcessExecutor';
import { TOKENS } from '@/composition/tokens';
import type { ExecutionData } from '@/domain/execution';
import { NormalStrategy } from '@/infrastructure/problems/judge/runner/strategies/normalStrategy';

describe('NormalStrategy', () => {
  let strategy: NormalStrategy;

  beforeEach(() => {
    container.registerInstance(TOKENS.processExecutor, executorMock);
    container.registerInstance(TOKENS.settings, settingsMock);
    strategy = container.resolve(NormalStrategy);
  });

  it('should call executor with correct command and include time addition in timeout', async () => {
    const processOutput = {
      codeOrSignal: 0,
      stdoutPath,
      stderrPath,
      timeMs: 450,
    } satisfies ProcessOutput;
    executorMock.execute.mockResolvedValue(processOutput);

    const result = await strategy.execute(mockCtx, signal);

    expect(executorMock.execute).toHaveBeenCalledWith({
      signal,
      cmd: mockCtx.cmd,
      timeoutMs: anyNumber(),
      stdinPath: mockCtx.stdinPath,
    });

    expect(result).not.toBeInstanceOf(Error);
    expect(result).toStrictEqual({
      codeOrSignal: 0,
      stdoutPath,
      stderrPath,
      timeMs: 450,
      isUserAborted: false,
    } satisfies ExecutionData);
  });

  it('should map isAborted to true when the process is aborted by user', async () => {
    executorMock.execute.mockResolvedValue({
      codeOrSignal: -1,
      stdoutPath,
      stderrPath,
      timeMs: 100,
      abortReason: AbortReason.UserAbort,
    });

    const result = await strategy.execute(mockCtx, signal);

    expect(result).not.toBeInstanceOf(Error);
    expect(result).toStrictEqual({
      codeOrSignal: -1,
      stdoutPath,
      stderrPath,
      timeMs: 100,
      isUserAborted: true,
    } satisfies ExecutionData);
  });

  it('should map isAborted to false when the process times out', async () => {
    executorMock.execute.mockResolvedValue({
      codeOrSignal: -1,
      stdoutPath,
      stderrPath,
      timeMs: 1200,
      abortReason: AbortReason.Timeout,
    });

    const result = await strategy.execute(mockCtx, signal);

    expect(result).not.toBeInstanceOf(Error);
    expect(result).toStrictEqual({
      codeOrSignal: -1,
      stdoutPath,
      stderrPath,
      timeMs: 1200,
      isUserAborted: false,
    } satisfies ExecutionData);
  });

  it('should passthrough the error if the executor returns an Error object', async () => {
    const executionError = new Error('Executable not found');
    executorMock.execute.mockResolvedValue(executionError);

    const result = await strategy.execute(mockCtx, signal);

    expect(result).toBeInstanceOf(Error);
    expect(result).toBe(executionError);
  });
});
