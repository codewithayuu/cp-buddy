import { createHash, randomUUID, type UUID } from 'node:crypto';
import { injectable } from 'tsyringe';
import type { ICrypto } from '@/application/ports/node/ICrypto';

@injectable()
export class CryptoAdapter implements ICrypto {
  public randomUUID(): UUID {
    return randomUUID();
  }

  public md5(data: string): string {
    return createHash('md5').update(data).digest('hex');
  }
}
