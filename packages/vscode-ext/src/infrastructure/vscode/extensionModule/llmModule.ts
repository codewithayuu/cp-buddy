import { inject, injectable } from 'tsyringe';
import { type ExtensionContext, lm } from 'vscode';
import type { IExtensionModule } from '@/application/ports/vscode/IExtensionModule';
import type { ILogger } from '@/application/ports/vscode/ILogger';
import { TOKENS } from '@/composition/tokens';
import { LlmDataInspector } from '@/infrastructure/vscode/llmTools/llmDataInspector';
import { LlmProblemContext } from '@/infrastructure/vscode/llmTools/llmProblemContext';
import { LlmTestcaseRunner } from '@/infrastructure/vscode/llmTools/llmTcRunner';
import { LlmTestcaseEditor } from '@/infrastructure/vscode/llmTools/llmTestCaseEditor';

@injectable()
export class LlmModule implements IExtensionModule {
  public constructor(
    @inject(TOKENS.logger) private readonly logger: ILogger,
    @inject(LlmTestcaseRunner) private readonly tcRunner: LlmTestcaseRunner,
    @inject(LlmDataInspector) private readonly dataInspector: LlmDataInspector,
    @inject(LlmTestcaseEditor) private readonly tcEditor: LlmTestcaseEditor,
    @inject(LlmProblemContext) private readonly problemContext: LlmProblemContext,
  ) {
    this.logger = this.logger.withScope('llmModule');
  }

  public setup(context: ExtensionContext): void {
    this.logger.info('Registering VS Code Language Model Tools');

    const registrations = [
      lm.registerTool('cpbuddy_run_test_cases', this.tcRunner),
      lm.registerTool('cpbuddy_inspect_test_case', this.dataInspector),
      lm.registerTool('cpbuddy_upsert_test_case', this.tcEditor),
      lm.registerTool('cpbuddy_get_problem_context', this.problemContext),
    ];

    context.subscriptions.push(...registrations);
  }
}
