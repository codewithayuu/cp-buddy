import { injectable } from 'tsyringe';
import { commands } from 'vscode';
import type { IExtensionContext } from '@/application/ports/vscode/IExtensionContext';

@injectable()
export class ExtensionContextAdapter implements IExtensionContext {
  private _hasProblem: boolean = false;
  private _canImport: boolean = false;
  private _isRunning: boolean = false;

  private setContext(key: string, value: boolean) {
    commands.executeCommand('setContext', `cpbuddy.${key}`, value);
  }

  public get hasProblem() {
    return this._hasProblem;
  }
  public set hasProblem(value: boolean) {
    this.setContext('hasProblem', value);
    this._hasProblem = value;
  }
  public get canImport() {
    return this._canImport;
  }
  public set canImport(value: boolean) {
    this.setContext('canImport', value);
    this._canImport = value;
  }
  public get isRunning() {
    return this._isRunning;
  }
  public set isRunning(value: boolean) {
    this.setContext('isRunning', value);
    this._isRunning = value;
  }
}
