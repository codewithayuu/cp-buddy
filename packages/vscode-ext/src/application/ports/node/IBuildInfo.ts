export type BuildInfoData = {
  commitHash: string;
  buildTime: string;
  buildBy: string;
  buildType: string;
};

/**
 * Interface for build information.
 * @see {@link BuildInfoData}
 */
export interface IBuildInfo {
  /**
   * Loads the build information asynchronously.
   * @remarks This method is optional and may not be implemented.
   */
  load?(): Promise<void>;

  /** The commit hash of the build. */
  get commitHash(): string;

  /** The build time as an ISO string. */
  get buildTime(): string;

  /** The user who built the application. */
  get buildBy(): string;

  /** The type of build. */
  get buildType(): string;
}
