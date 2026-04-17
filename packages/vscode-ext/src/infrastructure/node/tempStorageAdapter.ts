import { inject, injectable } from 'tsyringe';
import type { ICrypto } from '@/application/ports/node/ICrypto';
import type { IFileSystem } from '@/application/ports/node/IFileSystem';
import type { IPath } from '@/application/ports/node/IPath';
import type { ITempStorage } from '@/application/ports/node/ITempStorage';
import type { IPathResolver } from '@/application/ports/services/IPathResolver';
import type { ILogger } from '@/application/ports/vscode/ILogger';
import type { ISettings } from '@/application/ports/vscode/ISettings';
import { TOKENS } from '@/composition/tokens';

@injectable()
export class TempStorageAdapter implements ITempStorage {
  private usedPool: Map<string, string> = new Map();
  private freePool: Set<string> = new Set();
  private monitorInterval: NodeJS.Timeout | undefined;

  public constructor(
    @inject(TOKENS.crypto) private readonly crypto: ICrypto,
    @inject(TOKENS.path) private readonly path: IPath,
    @inject(TOKENS.logger) private readonly logger: ILogger,
    @inject(TOKENS.fileSystem) private readonly fs: IFileSystem,
    @inject(TOKENS.pathResolver) private readonly resolver: IPathResolver,
    @inject(TOKENS.settings) private readonly settings: ISettings,
  ) {
    this.logger = this.logger.withScope('tempStorage');
  }

  public async startMonitor(): Promise<void> {
    if (this.monitorInterval) {
      this.logger.warn('Already started monitoring');
      return;
    }
    this.monitorInterval = setInterval(() => {
      this.logger.debug(`Currently ${this.usedPool.size} used, ${this.freePool.size} free`);
      this.logger.trace('Used paths', Object.fromEntries(this.usedPool));
    }, 60000);
    this.logger.info('Monitor started');
  }

  public create(description: string): string {
    let path = this.freePool.values().next().value;
    if (path) {
      this.freePool.delete(path);
      this.logger.trace('Reusing cached path', path);
    } else {
      path = this.path.resolve(
        this.resolver.renderPath(this.settings.cache.directory),
        this.crypto.randomUUID(),
      );
      this.fs.safeCreateFile(path);
      this.logger.trace('Creating new cached path', path);
    }
    this.usedPool.set(path, description);
    // We do not actually create or empty the file here
    // Because the caller may want to write to it later
    return path;
  }

  public dispose(paths: string | string[]): void {
    if (typeof paths === 'string') paths = [paths];
    for (const path of paths) {
      if (this.freePool.has(path)) this.logger.warn('Duplicate dispose path', path);
      else if (this.usedPool.has(path)) {
        const description = this.usedPool.get(path);
        this.usedPool.delete(path);
        this.freePool.add(path);
        this.logger.trace('Disposing cached path', { path, description });
      } else this.logger.debug(`Path ${path} is not disposable`);
    }
  }
}
