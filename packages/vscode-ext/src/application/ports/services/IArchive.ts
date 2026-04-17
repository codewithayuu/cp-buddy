export interface IArchive {
  unzip(zipPath: string, destPath: string): Promise<void>;
}
