import { orderBy } from 'natural-orderby';
import { inject, injectable } from 'tsyringe';
import type { IPath } from '@/application/ports/node/IPath';
import type { ISettings } from '@/application/ports/vscode/ISettings';
import { TOKENS } from '@/composition/tokens';

export interface FilePair {
  input?: string;
  answer?: string;
}

@injectable()
export class TestcaseMatcher {
  public constructor(
    @inject(TOKENS.settings) private readonly settings: ISettings,
    @inject(TOKENS.path) private readonly path: IPath,
  ) {}

  public matchPairs(filePaths: string[]): FilePair[] {
    const pairs: FilePair[] = [];
    const usedOutputs = new Set<string>();
    const { inputFileExtensionList: inputExts, outputFileExtensionList: outputExts } =
      this.settings.problem;

    const inputFiles = filePaths.filter((p) =>
      inputExts.includes(this.path.extname(p).toLowerCase()),
    );

    for (const input of inputFiles) {
      const dir = this.path.dirname(input);
      const nameWithoutExt = this.path.basename(input, this.path.extname(input));

      let answer: string | undefined;
      for (const outExt of outputExts) {
        const potentialOutput = this.path.join(dir, nameWithoutExt + outExt);
        if (filePaths.includes(potentialOutput)) {
          answer = potentialOutput;
          usedOutputs.add(potentialOutput);
          break;
        }
      }
      pairs.push({ input, answer });
    }

    const orphanedOutputs = filePaths.filter(
      (p) => outputExts.includes(this.path.extname(p).toLowerCase()) && !usedOutputs.has(p),
    );
    for (const answer of orphanedOutputs) pairs.push({ answer });

    return orderBy(pairs, [
      (p) => (p.input ? 0 : 1),
      (p) => this.path.basename(p.input || p.answer || ''),
    ]);
  }
}
