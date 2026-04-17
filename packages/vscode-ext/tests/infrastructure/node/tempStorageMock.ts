import { inject, injectable } from 'tsyringe';
import { expect } from 'vitest';
import type { IFileSystem } from '@/application/ports/node/IFileSystem';
import type { ITempStorage } from '@/application/ports/node/ITempStorage';
import type { ILogger } from '@/application/ports/vscode/ILogger';
import { TOKENS } from '@/composition/tokens';

@injectable()
export class TempStorageMock implements ITempStorage {
  private cnt: number = 0;
  private usingPaths: Map<string, string> = new Map();

  public constructor(
    @inject(TOKENS.logger) private readonly logger: ILogger,
    @inject(TOKENS.fileSystem) private readonly fs: IFileSystem,
  ) {
    this.logger = this.logger.withScope('tempStorage');
  }

  public static getPath(index: number): string {
    return `/tmp/cpbuddy/file-${index}`;
  }

  public async startMonitor(): Promise<void> {}

  public create(description: string): string {
    const path = TempStorageMock.getPath(this.cnt++);
    this.usingPaths.set(path, description);
    this.logger.trace('Creating new cached path', { path, description });
    if (!this.fs.existsSync(path)) this.fs.safeCreateFile(path);
    return path;
  }

  public dispose(paths: string | string[]): void {
    if (typeof paths === 'string') paths = [paths];
    this.logger.trace('Disposing cached paths', { paths });
    for (const path of paths) this.usingPaths.delete(path);
  }

  public checkFile(remainPaths: string[] = []): void {
    const usingPaths = Array.from(this.usingPaths.keys());

    const redundantPaths = remainPaths.filter((path) => !usingPaths.includes(path));
    const redundantMessage = [
      `Redundant temp storage paths found: `,
      ...redundantPaths.map((path) => `  ${path}`),
    ].join('\n');
    expect.assert(redundantPaths.length === 0, redundantMessage);

    const leakedPaths = usingPaths.filter((path) => !remainPaths.includes(path));
    const leakedMessage = [
      `Leaked temp storage paths found: `,
      ...leakedPaths.map((path) => `  ${path}: ${this.usingPaths.get(path)}`),
    ].join('\n');
    expect.assert(leakedPaths.length === 0, leakedMessage);
  }
}
