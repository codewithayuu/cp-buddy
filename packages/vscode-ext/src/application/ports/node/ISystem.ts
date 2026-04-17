export type SystemPlatform = 'win32' | 'linux' | 'darwin';

/** Interface for system operations. */
export interface ISystem {
  /**
   * Returns the current working directory.
   * @returns The current working directory path.
   */
  cwd(): string;

  /**
   * Returns the operating system's default directory for temporary files.
   * @returns The path to the temporary directory.
   */
  tmpdir(): string;

  /**
   * Returns the home directory of the current user.
   * @returns The path to the home directory.
   */
  homedir(): string;

  /**
   * Returns the operating system platform.
   * @returns The platform identifier.
   */
  platform(): SystemPlatform;

  /** Returns the operating system as a string. */
  release(): string;
}
