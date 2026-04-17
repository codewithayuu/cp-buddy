import type { CompileData } from '@/application/ports/problems/judge/ICompilerService';
import type { IJudgeObserver } from '@/application/ports/problems/judge/IJudgeObserver';
import type { Problem } from '@/domain/entities/problem';

export interface JudgeContext {
  problem: Problem;
  stdinPath: string;
  answerPath: string;
  artifacts: CompileData;
}

export interface IJudgeService {
  judge(ctx: JudgeContext, observer: IJudgeObserver, signal: AbortSignal): Promise<void>;
}
