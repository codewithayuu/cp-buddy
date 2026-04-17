import type { ProblemId, TestcaseId } from '@cpbuddy/core';
import type { Problem } from '@/domain/entities/problem';

export class BackgroundProblem {
  private _ac: AbortController | null = null;

  public constructor(
    public readonly problemId: ProblemId,
    public problem: Problem,
    private startTime: number,
  ) {}

  public get ac(): AbortController | null {
    return this._ac;
  }
  public set ac(value: AbortController) {
    this._ac?.abort();
    this._ac = value;
  }

  public abort(target?: TestcaseId) {
    const current = this._ac;
    if (target) current?.abort(target);
    else current?.abort();
    if (this._ac === current) {
      this._ac = null;
    }
  }

  public addTimeElapsed(now: number) {
    this.problem.addTimeElapsed(now - this.startTime);
    this.startTime = now;
  }
}
