import { homedir, platform, release, tmpdir } from 'node:os';
import { cwd } from 'node:process';
import { injectable } from 'tsyringe';
import type { ISystem, SystemPlatform } from '@/application/ports/node/ISystem';

@injectable()
export class SystemAdapter implements ISystem {
  public cwd(): string {
    return cwd();
  }
  public tmpdir(): string {
    return tmpdir();
  }
  public homedir(): string {
    return homedir();
  }
  public platform(): SystemPlatform {
    return platform() as SystemPlatform;
  }
  public release(): string {
    return release();
  }
}
