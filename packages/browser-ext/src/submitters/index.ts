export { BaseSubmitter } from '@b/submitters/base';

import { AtCoderSubmitter } from '@b/submitters/atcoder';
import type { BaseSubmitter } from '@b/submitters/base';
import { CodeforcesSubmitter } from '@b/submitters/codeforces';
import { HydroSubmitter } from '@b/submitters/hydro';
import { LuoguSubmitter } from '@b/submitters/luogu';

const submitters: readonly BaseSubmitter[] = [
  new CodeforcesSubmitter(),
  new AtCoderSubmitter(),
  new LuoguSubmitter(),
  new HydroSubmitter(),
];

export const findSubmitter = ({ hostname }: URL): BaseSubmitter | null => {
  try {
    return submitters.find((s) => s.supportedDomains.includes(hostname)) ?? null;
  } catch {
    return null;
  }
};
