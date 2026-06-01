import { VerdictName } from '@cpbuddy/core';
import { injectable } from 'tsyringe';

@injectable()
export class Grader {
  public compareStrings(
    actual: string,
    expected: string,
    stderr: string,
    config: { ignoreError: boolean; oleSize?: number; regardPEAsAC: boolean },
  ): VerdictName {
    if (!config.ignoreError && stderr.trim().length > 0) return VerdictName.runtimeError;

    const fix = (s: string) =>
      s
        .trimEnd()
        .split('\n')
        .map((l) => l.trimEnd())
        .join('\n');
    const fixedActual = fix(actual);
    const fixedExpected = fix(expected);

    if (config.oleSize && fixedActual.length > fixedExpected.length * config.oleSize)
      return VerdictName.outputLimitExceed;

    const compress = (s: string) => s.replace(/\s/g, '');
    if (compress(actual) !== compress(expected)) return VerdictName.wrongAnswer;

    if (fixedActual !== fixedExpected && !config.regardPEAsAC) return VerdictName.presentationError;

    return VerdictName.accepted;
  }

  public mapTestlibExitCode(code: number): VerdictName {
    const VerdictsMap: Record<number, VerdictName> = {
      0: VerdictName.accepted,
      1: VerdictName.wrongAnswer,
      2: VerdictName.presentationError,
      3: VerdictName.systemError,
      4: VerdictName.wrongAnswer,
      7: VerdictName.partiallyCorrect,
    };
    return VerdictsMap[code] ?? VerdictName.systemError;
  }
}
