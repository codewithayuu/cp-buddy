import { ExtractError } from '@b/errors';
import { BaseSubmitter } from '@b/submitters/base';
import { submitterDomains } from '@b/submitters/domains';
import type { SubmitData } from '@cpbuddy/core';

export class CSESSubmitter extends BaseSubmitter {
  public readonly supportedDomains = submitterDomains.cses;
  private readonly problemRegex = /^\/problemset\/task\/(?<problem>\w+)/;

  public getSubmitUrl(data: SubmitData) {
    const url = new URL(data.url);
    if (url.pathname.includes('/submit/')) return url.toString();
    if (url.pathname.includes('/task/')) {
      url.pathname = url.pathname.replace('/task/', '/submit/');
      return url.toString();
    }
    throw new ExtractError('type');
  }

  public async fill(data: SubmitData) {
    // CSES defaults to a file upload form.
    // Setting the file input directly is much more robust than relying on CodeMirror.
    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"][name="file"]');
    if (fileInput) {
      const file = new File([data.sourceCode], "solution.cpp", { type: "text/plain" });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInput.files = dataTransfer.files;
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      // Fallback to CodeMirror if the user is in editor mode and file input is missing
      const cmElement = await this.waitForElement<HTMLElement>('.CodeMirror');
      await this.waitFor(() => {
        const el = document.querySelector('.CodeMirror') as any;
        return el && el.CodeMirror;
      });
      const cm = (document.querySelector('.CodeMirror') as any).CodeMirror;
      cm.setValue(data.sourceCode);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const submitBtn = await this.waitForElement<HTMLInputElement>('input[type="submit"]');
    submitBtn.click();
  }
}
