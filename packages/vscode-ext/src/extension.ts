import 'reflect-metadata';
import { install } from 'source-map-support';
import { container } from 'tsyringe';
import type { ExtensionContext } from 'vscode';
import { setupContainer } from '@/composition/container';
import { ExtensionManager } from '@/infrastructure/vscode/extensionManager';

install();
let extensionManager: ExtensionManager | null = null;
export const activate = async (context: ExtensionContext) => {
  await setupContainer(context);
  extensionManager = container.resolve(ExtensionManager);
  await extensionManager.activate(context);
};
export const deactivate = async () => {
  await extensionManager?.deactivate();
};
