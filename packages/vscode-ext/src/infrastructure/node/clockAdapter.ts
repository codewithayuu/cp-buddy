import { injectable } from 'tsyringe';
import type { IClock } from '@/application/ports/node/IClock';

@injectable()
export class ClockAdapter implements IClock {
  public now(): number {
    return Date.now();
  }
}
