import { basename, dirname, extname, join, normalize, relative, resolve } from 'node:path';
import { injectable } from 'tsyringe';
import type { IPath } from '@/application/ports/node/IPath';

@injectable()
export class PathAdapter implements IPath {
  public normalize(path: string): string {
    return normalize(path);
  }

  public join(...paths: string[]): string {
    return join(...paths);
  }

  public dirname(path: string): string {
    return dirname(path);
  }

  public basename(path: string, suffix?: string): string {
    return basename(path, suffix);
  }

  public extname(path: string): string {
    return extname(path);
  }

  public resolve(...paths: string[]): string {
    return resolve(...paths);
  }

  public relative(from: string, to: string): string {
    return relative(from, to);
  }
}
