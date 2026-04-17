export interface IPathResolver {
  renderString(original: string, replacements: [string, string][]): string;
  renderPath(original: string): string;
  renderWorkspacePath(original: string): Promise<string | null>;
  renderPathWithFile(original: string, filePath: string, ignoreError?: boolean): string | null;
  renderUnzipFolder(srcPath: string, zipPath: string): string | null;
}
