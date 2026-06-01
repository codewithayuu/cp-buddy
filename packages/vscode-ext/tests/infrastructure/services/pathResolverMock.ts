import { inject, injectable } from 'tsyringe';
import type { IPath } from '@/application/ports/node/IPath';
import type { ISystem } from '@/application/ports/node/ISystem';
import type { IPathResolver } from '@/application/ports/services/IPathResolver';
import { TOKENS } from '@/composition/tokens';

@injectable()
export class PathResolverMock implements IPathResolver {
  public constructor(
    @inject(TOKENS.extensionPath) private readonly extPath: string,
    @inject(TOKENS.path) private readonly path: IPath,
    @inject(TOKENS.system) private readonly sys: ISystem,
  ) {}

  public renderString(original: string, replacements: [string, string][]): string {
    let result = original;
    for (const [key, value] of replacements) {
      result = result.replaceAll(`\${${key}}`, value);
    }
    return result;
  }

  public renderPath(original: string): string {
    return this.path.resolve(
      this.renderString(original, [
        ['tmp', this.sys.tmpdir()],
        ['home', this.sys.homedir()],
        ['extensionPath', this.extPath],
      ]),
    );
  }

  public async renderWorkspacePath(_original: string): Promise<string | null> {
    throw new Error('Not implemented');
  }

  public renderPathWithFile(
    _original: string,
    _filePath: string,
    _ignoreError: boolean = false,
  ): string | null {
    throw new Error('Not implemented');
  }

  public renderUnzipFolder(_srcPath: string, _zipPath: string): string | null {
    throw new Error('Not implemented');
  }
}
