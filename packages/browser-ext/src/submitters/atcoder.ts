import { ExtractError } from '@b/errors';
import { BaseSubmitter } from '@b/submitters/base';
import { submitterDomains } from '@b/submitters/domains';
import type { SubmitData } from '@cpbuddy/core';

export class AtCoderSubmitter extends BaseSubmitter {
  public readonly supportedDomains = submitterDomains.atcoder;
  private readonly contestRegex = /^\/contests\/(?<contest>[\w-]+)\/tasks\/(?<problem>\w+)/;

  public getSubmitUrl(data: SubmitData) {
    const url = new URL(data.url);
    const isContest = url.pathname.match(this.contestRegex)?.groups;
    if (isContest) {
      url.pathname = `/contests/${isContest.contest}/submit`;
      url.searchParams.set('taskScreenName', isContest.problem);
    } else throw new ExtractError('type');
    return url.toString();
  }

  public async fill(data: SubmitData) {
    const languageEl = await this.waitForElement<HTMLSelectElement>('#select-lang > div > select');
    languageEl.value = '6017';

    const editorBtn = await this.waitForElement<HTMLButtonElement>(
      '.editor-buttons > button:nth-child(3)',
    );
    if (editorBtn.getAttribute('aria-pressed') !== 'true') editorBtn.click();

    const codeEl = await this.waitForElement<HTMLTextAreaElement>('#plain-textarea');
    await this.waitFor(() => codeEl.style.display !== 'none');
    codeEl.value = data.sourceCode;

    editorBtn.click();

    if (document.querySelector('.cf-challenge') !== null) {
      this.requireInteraction('.cf-challenge');
      const captchaEl = await this.waitForElement<HTMLInputElement>('.cf-challenge > div > input');
      await this.waitFor(() => captchaEl.value.trim() !== '');
      this.clearInteraction();
    }

    const submitBtn = await this.waitForElement<HTMLButtonElement>('#submit');
    submitBtn.click();
  }
}
