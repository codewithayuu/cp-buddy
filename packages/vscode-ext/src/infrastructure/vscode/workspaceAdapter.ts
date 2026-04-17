import { injectable } from 'tsyringe';
import { workspace as vscodeWorkspace } from 'vscode';
import type { IWorkspace, WorkspaceFolder } from '@/application/ports/vscode/IWorkspace';

@injectable()
export class WorkspaceAdapter implements IWorkspace {
  public getWorkspaceFolders(): WorkspaceFolder[] {
    return Array.from(vscodeWorkspace.workspaceFolders ?? []);
  }
}
