import type { ChooseTestcaseFileMsg } from '@cpbuddy/core';
import { inject, injectable } from 'tsyringe';
import type { IProblemRepository } from '@/application/ports/problems/IProblemRepository';
import type { ISettings } from '@/application/ports/vscode/ISettings';
import type { ITranslator } from '@/application/ports/vscode/ITranslator';
import type { IUi } from '@/application/ports/vscode/IUi';
import { BaseProblemUseCase } from '@/application/useCases/webview/problem/BaseProblemUseCase';
import { TOKENS } from '@/composition/tokens';
import type { BackgroundProblem } from '@/domain/entities/backgroundProblem';
import { TestcaseIo } from '@/domain/entities/testcaseIo';

@injectable()
export class ChooseTestcaseFile extends BaseProblemUseCase<ChooseTestcaseFileMsg> {
  public constructor(
    @inject(TOKENS.problemRepository) protected readonly repo: IProblemRepository,
    @inject(TOKENS.settings) private readonly settings: ISettings,
    @inject(TOKENS.ui) private readonly ui: IUi,
    @inject(TOKENS.translator) private readonly translator: ITranslator,
  ) {
    super(repo);
  }

  protected async performAction(
    { problem }: BackgroundProblem,
    msg: ChooseTestcaseFileMsg,
  ): Promise<void> {
    const isInput = msg.label === 'stdin';
    const mainExt = isInput
      ? this.settings.problem.inputFileExtensionList
      : this.settings.problem.outputFileExtensionList;
    const path = await this.ui.openDialog({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      title: this.translator.t('Choose {type} file', {
        type: isInput ? this.translator.t('stdin') : this.translator.t('answer'),
      }),
      filters: {
        [this.translator.t('Text files')]: mainExt.map((ext) => ext.substring(1)),
        [this.translator.t('All files')]: ['*'],
      },
    });
    if (!path?.length) return;
    const testcase = problem.getTestcase(msg.testcaseId);
    const testcaseIo = new TestcaseIo({ path });
    if (isInput) testcase.stdin = testcaseIo;
    else testcase.answer = testcaseIo;
  }
}
