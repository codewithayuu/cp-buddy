import type { CompanionProblem } from '@cpbuddy/core';

export interface WorkspaceFolderContext {
  index: number;
  name: string;
  path: string;
}

export interface IUserScriptService {
  /**
   * Execute user script to resolve paths for companion problems
   * @param problems Array of companion problems
   * @param workspaceFolders Available workspace folders
   * @returns Array of resolved paths (null if user cancelled or error)
   */
  resolvePaths(
    problems: CompanionProblem[],
    workspaceFolders: WorkspaceFolderContext[],
  ): Promise<(string | null)[] | undefined>;
}
