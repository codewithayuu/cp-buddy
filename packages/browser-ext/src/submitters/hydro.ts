import { BaseSubmitter } from '@b/submitters/base';
import { submitterDomains } from '@b/submitters/domains';
import type { SubmitData } from '@cpbuddy/core';

export class HydroSubmitter extends BaseSubmitter {
  public readonly supportedDomains = submitterDomains.hydro;

  public getSubmitUrl(data: SubmitData) {
    const url = new URL(data.url);
    url.pathname += '/submit';
    return url.toString();
  }

  public async fill({ sourceCode }: SubmitData): Promise<void> {
    const sourceCodeEl = await this.waitForElement<HTMLTextAreaElement>('textarea');
    sourceCodeEl.value = sourceCode;

    const submitBtn = await this.waitForElement<HTMLButtonElement>('input[type="submit"]');
    submitBtn.click();
  }
}
