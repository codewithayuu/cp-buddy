import type { Except } from 'type-fest';
import type {
  MessageOptions,
  OpenDialogOptions,
  QuickPickItem,
  QuickPickOptions,
  SaveDialogOptions,
  Uri,
} from 'vscode';

export type CustomOpenDialogOptions = Except<OpenDialogOptions, 'defaultUri'> & {
  defaultPath?: string;
};

export type CustomSaveDialogOptions = Except<SaveDialogOptions, 'defaultUri'> & {
  defaultPath?: string;
};

export type CustomQuickPickItem<T> = Except<QuickPickItem, 'iconPath' | 'buttons'> & { value: T };
export type CustomQuickPickOptions = Except<QuickPickOptions, 'canPickMany'>;

export interface InputOptions {
  prompt?: string;
  value?: string;
  placeHolder?: string;
  password?: boolean;
}

export type AlertLevel = 'error' | 'warn' | 'info';
export type AlertArgs = [...items: string[]] | [options: MessageOptions, ...items: string[]];

export interface ProgressController {
  report: (data: { message?: string; increment?: number }) => void;
  done: () => void;
}

export interface StatusBarController {
  update(text: string, tooltip: string, color: 'normal' | 'warn' | 'error'): void;
  show(): void;
  hide(): void;
  dispose(): void;
}

export interface IUi {
  openDialog(options: CustomOpenDialogOptions): Promise<string | undefined>;
  saveDialog(options: CustomSaveDialogOptions): Promise<string | undefined>;
  confirm(title: string): Promise<boolean>;
  quickPick<T>(
    items: CustomQuickPickItem<T>[],
    options: CustomQuickPickOptions,
  ): Promise<T | undefined>;
  quickPickMany<T>(items: CustomQuickPickItem<T>[], options?: CustomQuickPickOptions): Promise<T[]>;
  chooseFolder(title: string): Promise<string | undefined>;
  input(options: InputOptions): Promise<string | undefined>;
  alert(level: AlertLevel, message: string, ...args: AlertArgs): Promise<string | undefined>;
  openFile(uri: Uri): void;
  openChat(topic: string): void;
  openSettings(item: string): void;
  compareFiles(left: Uri, right: Uri): void;
  showSidebar(): void;
  progress(title: string, onCancel?: () => void): ProgressController;
  showStatusbar(id: string, onClick: () => void): StatusBarController;
}
