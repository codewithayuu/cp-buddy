import type { Uri } from 'vscode';

export interface WorkspaceFolder {
  uri: Uri;
  name: string;
  index: number;
}

export interface IWorkspace {
  getWorkspaceFolders(): WorkspaceFolder[];
}
