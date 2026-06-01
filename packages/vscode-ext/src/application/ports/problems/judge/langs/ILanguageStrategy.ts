import type { IFileWithHash, IOverrides } from '@cpbuddy/core';

export interface CompileAdditionalData {
  canUseWrapper: boolean;
  overrides?: IOverrides;
}

export interface LangCompileData {
  path: string;
  hash: string | null;
}

export interface ILanguageDefaultValues {
  compiler?: string;
  compilerArgs?: string;
  runner?: string;
  runnerArgs?: string;
}

export class CompileError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'CompileError';
  }
}

export class CompileAborted extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'CompileAborted';
  }
}

export type LangCompileResult = LangCompileData | CompileError | CompileAborted | Error;

export interface ILanguageStrategy {
  readonly name: string;
  readonly extensions: string[];
  readonly enableRunner: boolean;
  readonly defaultValues: ILanguageDefaultValues;

  compile(
    src: IFileWithHash,
    signal: AbortSignal,
    forceCompile: boolean | null,
    additionalData?: CompileAdditionalData,
  ): Promise<LangCompileResult>;

  getRunCommand(target: string, overrides?: IOverrides): Promise<string[]>;
}
