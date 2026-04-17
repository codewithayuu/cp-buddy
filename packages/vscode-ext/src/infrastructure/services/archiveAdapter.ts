import AdmZip from 'adm-zip';
import { inject, injectable } from 'tsyringe';
import type { IFileSystem } from '@/application/ports/node/IFileSystem';
import type { IArchive } from '@/application/ports/services/IArchive';
import { TOKENS } from '@/composition/tokens';

@injectable()
export class ArchiveAdapter implements IArchive {
  public constructor(@inject(TOKENS.fileSystem) private readonly fs: IFileSystem) {}

  public async unzip(zipPath: string, destPath: string): Promise<void> {
    const zip = new AdmZip(zipPath);
    await this.fs.mkdir(destPath);
    zip.extractAllTo(destPath, true);
  }
}
