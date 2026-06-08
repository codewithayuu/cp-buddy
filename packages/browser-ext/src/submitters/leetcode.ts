import { ExtractError } from '@b/errors';
import { BaseSubmitter } from '@b/submitters/base';
import { submitterDomains } from '@b/submitters/domains';
import type { SubmitData } from '@cpbuddy/core';

export class LeetCodeSubmitter extends BaseSubmitter {
  public readonly supportedDomains = submitterDomains.leetcode;
  private readonly problemRegex = /^\/problems\/(?<problem>[\w-]+)/;

  public getSubmitUrl(data: SubmitData) {
    const url = new URL(data.url);
    const isProblem = url.pathname.match(this.problemRegex)?.groups;
    if (isProblem) {
      url.pathname = `/problems/${isProblem.problem}/`;
    } else throw new ExtractError('type');
    return url.toString();
  }

  public async fill(data: SubmitData) {
    // Wait for Monaco Editor to load by checking for the view-lines element
    await this.waitFor(() => document.querySelectorAll('.view-lines').length > 0);

    // Inject a script into the main world to interact with Monaco directly
    const script = document.createElement('script');
    script.textContent = `
      try {
        if (window.monaco && window.monaco.editor) {
          const models = window.monaco.editor.getModels();
          if (models.length > 0) {
            // Usually the first model or the active one
            models[0].setValue(${JSON.stringify(data.sourceCode)});
          }
        }
      } catch(e) {
        console.error('Failed to set Monaco value', e);
      }
    `;
    document.body.appendChild(script);
    script.remove();

    // Wait a brief moment for Monaco Editor/React state to register the pasted code
    await new Promise(resolve => setTimeout(resolve, 500));

    // Find and click the run button instead of submit as requested by the user
    // LeetCode Run button locator
    const runBtn = await this.waitForElement<HTMLButtonElement>('[data-e2e-locator="console-run-button"]');
    runBtn.click();
  }
}
