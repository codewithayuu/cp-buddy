import type TypedEventEmitter from 'typed-emitter';
import type { FileSystemProvider, Uri } from 'vscode';
import type { ProblemFsEvents } from '@/infrastructure/vscode/problemFs';

export interface IProblemFs extends FileSystemProvider {
  scheme: string;
  signals: TypedEventEmitter<ProblemFsEvents>;
  getUri(srcPath: string, path: string): Uri;
}
