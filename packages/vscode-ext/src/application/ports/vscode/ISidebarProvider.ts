import type { WebviewViewProvider } from 'vscode';

export interface ISidebarProvider extends WebviewViewProvider {
  viewType: string;
  dispatchFullConfig(): void;
  flushPendingMessages(): void;
}
