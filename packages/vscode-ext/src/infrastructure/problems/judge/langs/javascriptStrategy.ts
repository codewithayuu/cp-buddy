import type { IOverrides } from '@cpbuddy/core';
import { inject, injectable } from 'tsyringe';
import type { ILanguageDefaultValues } from '@/application/ports/problems/judge/langs/ILanguageStrategy';
import type { ILogger } from '@/application/ports/vscode/ILogger';
import { TOKENS } from '@/composition/tokens';
import { LanguageStrategyContext } from '@/infrastructure/problems/judge/langs/languageStrategyContext';
import { AbstractLanguageStrategy } from './abstractLanguageStrategy';

@injectable()
export class LangJavascript extends AbstractLanguageStrategy {
  public override readonly name = 'JavaScript';
  public override readonly extensions = ['js'];
  public override readonly defaultValues;

  public constructor(
    @inject(LanguageStrategyContext) context: LanguageStrategyContext,
    @inject(TOKENS.logger) logger: ILogger,
  ) {
    super({ ...context, logger: logger.withScope('langsJavascript') });
    this.defaultValues = {
      runner: this.settings.languages.javascriptRunner,
      runnerArgs: this.settings.languages.javascriptRunnerArgs,
    } satisfies ILanguageDefaultValues;
    this.settings.languages.onChangeJavascriptRunner(
      (runner) => (this.defaultValues.runner = runner),
    );
    this.settings.languages.onChangeJavascriptRunnerArgs(
      (args) => (this.defaultValues.runnerArgs = args),
    );
  }

  public override async getRunCommand(target: string, overrides?: IOverrides): Promise<string[]> {
    this.logger.trace('runCommand', { target });
    const runner = overrides?.runner || this.defaultValues.runner;
    const runArgs = overrides?.runnerArgs || this.defaultValues.runnerArgs;
    const runArgsArray = runArgs.split(/\s+/).filter(Boolean);
    return [runner, ...runArgsArray, target];
  }
}
