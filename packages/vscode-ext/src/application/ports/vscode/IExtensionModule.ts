import type { Promisable } from 'type-fest';
import type { ExtensionContext } from 'vscode';

export interface IExtensionModule {
  setup(context: ExtensionContext): Promisable<void>;
  dispose?(): Promisable<void>;
}
