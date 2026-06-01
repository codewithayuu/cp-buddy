import { inject, injectable } from 'tsyringe';
import type { BuildInfoData, IBuildInfo } from '@/application/ports/node/IBuildInfo';
import type { IFileSystem } from '@/application/ports/node/IFileSystem';
import type { IPath } from '@/application/ports/node/IPath';
import { TOKENS } from '@/composition/tokens';

@injectable()
export class BuildInfoAdapter implements IBuildInfo {
  private data: BuildInfoData | null = null;

  public constructor(
    @inject(TOKENS.extensionPath) private readonly extPath: string,
    @inject(TOKENS.path) private readonly path: IPath,
    @inject(TOKENS.fileSystem) private readonly fs: IFileSystem,
  ) {}

  public async load(): Promise<void> {
    const jsonPath = this.path.resolve(this.extPath, 'dist', 'generated.json');
    const content = await this.fs.readFile(jsonPath);
    this.data = JSON.parse(content);
  }

  public get commitHash(): string {
    return this.data?.commitHash || 'unknown';
  }

  public get buildTime(): string {
    return this.data?.buildTime || 'unknown';
  }

  public get buildBy(): string {
    return this.data?.buildBy || 'unknown';
  }

  public get buildType(): string {
    return this.data?.buildType || 'unknown';
  }
}
