import type { RmOptions } from 'node:fs';
import type { Readable, Writable } from 'node:stream';

/**
 * Interface for file system operations.
 * @see {@link https://nodejs.org/api/fs.html | Node.js File System API}
 */
export interface IFileSystem {
  /**
   * Reads the entire contents of a file as a raw buffer.
   * @throws {@link Error} If the file cannot be read.
   * @returns The file contents as a Buffer.
   */
  readRawFile(path: string): Promise<Buffer<ArrayBuffer>>;

  /**
   * Reads the entire contents of a file.
   * @param encoding The file encoding, default is 'utf-8'.
   * @throws {@link Error} If the file cannot be read.
   * @returns The file contents as a string.
   */
  readFile(path: string, encoding?: BufferEncoding): Promise<string>;

  /**
   * Writes data to a file.
   * @remarks If the directories in the path do not exist, they will be created recursively.
   * @throws {@link Error} If the file cannot be written.
   */
  safeWriteFile(path: string, data: string | Uint8Array): Promise<void>;

  /**
   * Creates an empty file.
   * @remarks If the directories in the path do not exist, they will be created recursively.
   * @throws {@link Error} If the file cannot be created.
   */
  safeCreateFile(path: string): void;

  /** Checks if a file or directory exists. */
  exists(path: string): Promise<boolean>;

  /** Checks if a file or directory exists. */
  existsSync(path: string): boolean;

  /** Recursive creates a directory. */
  mkdir(path: string): Promise<void>;

  /** Reads the contents of a directory. */
  readdir(path: string): Promise<string[]>;

  /** Get the status of a file or directory. */
  stat(path: string): Promise<{ size: number; isFile(): boolean; isDirectory(): boolean }>;

  /** Asynchronously copies `src` to `dest`. `dest` is overwritten if it already exists. */
  copyFile(src: string, dest: string): Promise<void>;

  /** Removes a file. */
  rm(path: string, options?: RmOptions): Promise<void>;

  /** Walks through a directory. */
  walk(path: string): Promise<string[]>;

  /** Create a readable stream of a file. */
  createReadStream(path: string): Readable;

  /** Create a writeable stream of a file. */
  safeCreateWriteStream(path: string): Writable;
}
