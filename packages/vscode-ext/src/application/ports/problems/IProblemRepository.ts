import type { ProblemId } from '@cpbuddy/core';
import type { BackgroundProblem } from '@/domain/entities/backgroundProblem';

export interface IProblemRepository {
  fireBackgroundEvent(): void;
  loadByPath(srcPath: string, allowCreate?: boolean): Promise<BackgroundProblem | null>;
  get(problemId?: ProblemId): Promise<BackgroundProblem | undefined>;
  persist(problemId: ProblemId): Promise<boolean>;
  unload(problemId: ProblemId): Promise<boolean>;
  dispose(): Promise<void>;
}
