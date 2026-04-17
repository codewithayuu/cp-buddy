import { inject, injectable } from 'tsyringe';
import type { IFileSystem } from '@/application/ports/node/IFileSystem';
import type { IProcessExecutor } from '@/application/ports/node/IProcessExecutor';
import type { ITempStorage } from '@/application/ports/node/ITempStorage';
import type {
  CheckerOptions,
  CheckerResult,
  ICheckerRunner,
} from '@/application/ports/problems/judge/ICheckerRunner';
import type { ILogger } from '@/application/ports/vscode/ILogger';
import { TOKENS } from '@/composition/tokens';

@injectable()
export class CheckerRunnerAdapter implements ICheckerRunner {
  public constructor(
    @inject(TOKENS.fileSystem) private readonly fs: IFileSystem,
    @inject(TOKENS.logger) private readonly logger: ILogger,
    @inject(TOKENS.processExecutor) private readonly executor: IProcessExecutor,
    @inject(TOKENS.tempStorage) private readonly tmp: ITempStorage,
  ) {
    this.logger = this.logger.withScope('checkerRunner');
  }

  public async run(options: CheckerOptions, signal: AbortSignal): Promise<CheckerResult> {
    this.logger.trace('Running checker', options);

    // checker <InputFile> <OutputFile> <AnswerFile>
    // https://github.com/MikeMirzayanov/testlib?tab=readme-ov-file#checker
    const result = await this.executor.execute({
      cmd: [options.checkerPath, options.inputPath, options.outputPath, options.answerPath],
      signal,
    });
    this.logger.debug('Checker completed', result);
    if (result instanceof Error) return result;

    const message = await this.fs.readFile(result.stderrPath);
    this.tmp.dispose([result.stdoutPath, result.stderrPath]);
    if (typeof result.codeOrSignal === 'string')
      return new Error(`Checker run failed ${result.codeOrSignal}: ${message.trim()}`);
    return {
      exitCode: result.codeOrSignal,
      msg: message.trim(),
    };
  }
}
