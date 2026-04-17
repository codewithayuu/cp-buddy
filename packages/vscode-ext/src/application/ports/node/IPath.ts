/**
 * Interface for path operations.
 * @see {@link https://nodejs.org/api/path.html | Node.js Path API}
 */
export interface IPath {
  /** Joins all given path segments together using the platform-specific separator as a delimiter. */
  join(...paths: string[]): string;

  /** Returns the directory name of a path. */
  dirname(path: string): string;

  /**
   * Returns the last portion of a path.
   * @param suffix Suffix to remove from the base name.
   */
  basename(path: string, suffix?: string): string;

  /** Returns the extension name of a path. */
  extname(path: string): string;

  /** Resolves a sequence of paths or path segments into an absolute path. */
  resolve(...paths: string[]): string;

  /** Solve the relative path based on the current working directory. */
  relative(from: string, to: string): string;
}
