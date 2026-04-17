/**
 * Interface for temporary storage management.
 * @remarks This interface provides methods to create and dispose of temporary storage paths.
 * The temporary storage paths are being reused after disposed.
 */
export interface ITempStorage {
  /**
   * Starts the monitor for temporary storage.
   * @remarks This method should be called before using other methods of this interface.
   * It can detect temporary storage leaks and report them to the user.
   */
  startMonitor(): Promise<void>;

  /**
   * Creates a temporary storage path.
   * @param description A description for the temporary storage path,
   * used for monitoring purposes.
   * @returns The path to the created temporary storage.
   */
  create(description: string): string;

  /**
   * Disposes of temporary storage paths.
   * @param paths A path or an array of paths to dispose.
   * @remarks
   * WARNING: Disposed paths are returned to the pool immediately.
   * Any subsequent access to these paths will cause unpredictable behavior
   * or data corruption in concurrent processes.
   */
  dispose(paths: string | string[]): void;
}
