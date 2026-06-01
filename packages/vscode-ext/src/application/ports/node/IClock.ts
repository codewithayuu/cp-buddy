/** Interface for clock operations. */
export interface IClock {
  /**
   * Returns the current high-resolution real time in milliseconds.
   * @returns The current time in milliseconds.
   * @remarks This method returns the wall-clock time.
   */
  now(): number;
}
