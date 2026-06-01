import { inject, injectable } from 'tsyringe';
import type { IFileSystem } from '@/application/ports/node/IFileSystem';
import type { IPathResolver } from '@/application/ports/services/IPathResolver';
import type { ITemplateRenderer } from '@/application/ports/services/ITemplateRenderer';
import type { ILogger } from '@/application/ports/vscode/ILogger';
import type { ISettings } from '@/application/ports/vscode/ISettings';
import type { ITranslator } from '@/application/ports/vscode/ITranslator';
import type { IUi } from '@/application/ports/vscode/IUi';
import { TOKENS } from '@/composition/tokens';
import type { Problem } from '@/domain/entities/problem';

@injectable()
export class TemplateRenderer implements ITemplateRenderer {
  public constructor(
    @inject(TOKENS.fileSystem) private readonly fs: IFileSystem,
    @inject(TOKENS.logger) private readonly logger: ILogger,
    @inject(TOKENS.pathResolver) private readonly pathResolver: IPathResolver,
    @inject(TOKENS.settings) private readonly settings: ISettings,
    @inject(TOKENS.translator) private readonly translator: ITranslator,
    @inject(TOKENS.ui) private readonly ui: IUi,
  ) {
    this.logger = this.logger.withScope('templateRenderer');
  }

  public async render(problem: Problem): Promise<{ header: string; template: string }> {
    const isPython = problem.src.path.endsWith('.py');
    const commentPrefix = isPython ? '#' : '//';
    const header = `${commentPrefix} Problem Name: ${problem.name}\n${commentPrefix} Problem URL: ${problem.url ?? ''}\n${commentPrefix}\n`;

    const templateFile = this.settings.problem.templateFile;
    if (!templateFile) {
      this.logger.debug('No template file configured');
      return { header, template: '' };
    }

    const templatePath = this.pathResolver.renderPathWithFile(templateFile, problem.src.path, true);
    if (!templatePath) {
      this.logger.warn('Failed to resolve template path');
      return { header, template: '' };
    }

    try {
      const templateStr = await this.fs.readFile(templatePath);
      const rendered = this.renderString(templateStr, [
        ['title', problem.name],
        ['timeLimit', problem.overrides?.timeLimitMs?.toString() ?? '0'],
        ['memoryLimit', problem.overrides?.memoryLimitMb?.toString() ?? '0'],
        ['url', problem.url ?? ''],
      ]);
      return { header, template: rendered };
    } catch (e) {
      this.logger.warn('Failed to read or render template', e);
      this.ui.alert(
        'warn',
        this.translator.t('Failed to use template file: {msg}, creating empty file instead', {
          msg: (e as Error).message,
        }),
      );
      return { header, template: '' };
    }
  }

  private renderString(original: string, replacements: [string, string][]): string {
    for (const [key, value] of replacements) {
      original = original.replaceAll(`\${${key}}`, value);
    }
    return original;
  }
}
