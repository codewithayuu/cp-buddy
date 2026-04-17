import type { UUID } from 'node:crypto';

/**
 * Interface for cryptographic operations.
 * @see {@link https://nodejs.org/api/crypto.html | Node.js Crypto API}
 */
export interface ICrypto {
  /**
   * Generates a random UUID.
   * @returns A randomly generated UUID string.
   */
  randomUUID(): UUID;

  /**
   * Hashes the input data using MD5 algorithm.
   * @returns HEX string of MD5 hash of the input data.
   */
  md5(data: string): string;
}
