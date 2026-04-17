import { injectable } from 'tsyringe';
import type { IActivePathService } from '@/application/ports/vscode/IActivePathService';

@injectable()
export class ActivePathService implements IActivePathService {
  private _activePath: string | null = null;

  public getActivePath(): string | null {
    return this._activePath;
  }

  public setActivePath(path: string | null): void {
    this._activePath = path;
  }
}
