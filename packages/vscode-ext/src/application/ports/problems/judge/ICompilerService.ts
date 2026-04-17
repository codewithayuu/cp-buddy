import type { LangCompileData } from '@/application/ports/problems/judge/langs/ILanguageStrategy';
import type { Problem } from '@/domain/entities/problem';

export type CompileData = {
  solution: LangCompileData;
  checker?: LangCompileData;
  interactor?: LangCompileData;
  stressTest?: {
    generator: LangCompileData;
    bruteForce: LangCompileData;
  };
};

export type CompileResult = CompileData | Error;

export interface ICompilerService {
  compileAll(
    problem: Problem,
    forceCompile: boolean | null,
    signal: AbortSignal,
  ): Promise<CompileResult>;
}
