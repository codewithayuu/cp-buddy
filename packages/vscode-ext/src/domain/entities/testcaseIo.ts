import type { ITestcaseIo } from '@cpbuddy/core';

export class TestcaseIo {
  public readonly path?: string;
  public readonly data?: string;

  public constructor(o: ITestcaseIo) {
    if ('path' in o) {
      this.path = o.path;
      this.data = undefined;
    } else {
      this.data = o.data;
      this.path = undefined;
    }
  }

  public match<T>(onPath: (path: string) => T, onData: (data: string) => T): T {
    if (this.path !== undefined) return onPath(this.path);
    if (this.data !== undefined) return onData(this.data);
    throw new Error('TestcaseIo is empty');
  }
  public getDisposables(): string[] {
    if (!this.path) return [];
    return [this.path];
  }
}
