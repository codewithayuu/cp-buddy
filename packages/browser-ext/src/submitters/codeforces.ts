import { ExtractError } from '@b/errors';
import { BaseSubmitter } from '@b/submitters/base';
import { submitterDomains } from '@b/submitters/domains';
import type { SubmitData } from '@cpbuddy/core';

export class CodeforcesSubmitter extends BaseSubmitter {
  public readonly supportedDomains = submitterDomains.codeforces;
  private readonly contestRegex = /^\/contest\/(?<contest>\d+)\/problem\/(?<problem>\w+)/;
  private readonly problemRegex = /^\/problemset\/problem\/(?<contest>\d+)\/(?<problem>\w+)/;

  public getSubmitUrl(data: SubmitData) {
    const url = new URL(data.url);
    const contest = url.pathname.match(this.contestRegex)?.groups;
    const problem = url.pathname.match(this.problemRegex)?.groups;
    if (contest) url.pathname = `/contest/${contest.contest}/submit`;
    else if (problem) url.pathname = `/problemset/submit`;
    else throw new ExtractError('type');
    return url.toString();
  }

  public async fill(data: SubmitData) {
    const sourceCodeEl = await this.waitForElement<HTMLTextAreaElement>('#sourceCodeTextarea');
    sourceCodeEl.value = data.sourceCode;

    const url = new URL(data.url);
    const contest = url.pathname.match(this.contestRegex)?.groups;
    if (contest) {
      const problemIndexEl = await this.waitForElement<HTMLSelectElement>(
        'select[name="submittedProblemIndex"]',
      );
      problemIndexEl.value = contest.problem;
    }

    const problem = url.pathname.match(this.problemRegex)?.groups;
    if (problem) {
      const problemNameEl = await this.waitForElement<HTMLInputElement>(
        'input[name="submittedProblemCode"]',
      );
      problemNameEl.value = `${problem.contest}${problem.problem}`;
    }

    const submitBtn = await this.waitForElement<HTMLButtonElement>('.submit');
    submitBtn.disabled = false;
    submitBtn.click();
  }
}
