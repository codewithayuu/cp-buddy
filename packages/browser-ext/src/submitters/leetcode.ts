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
    // Wait for Monaco Editor's content area
    await this.waitFor(() => document.querySelectorAll('.view-lines').length > 0);
    const viewLines = document.querySelectorAll<HTMLElement>('.view-lines');
    // LeetCode's main code editor is typically the last .view-lines (after notes editor)
    const editorEl = viewLines[viewLines.length - 1];
    if (!editorEl) throw new Error('Editor not found');

    // Focus the editor
    editorEl.click();
    
    // Select all existing code
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const ctrlKey = isMac ? 'metaKey' : 'ctrlKey';
    
    const keydownEvent = new KeyboardEvent('keydown', {
      key: 'a',
      code: 'KeyA',
      bubbles: true,
      cancelable: true,
      [ctrlKey]: true
    });
    editorEl.dispatchEvent(keydownEvent);
    
    // Simulate pasting the new code
    const dataTransfer = new DataTransfer();
    dataTransfer.setData('text/plain', data.sourceCode);
    const pasteEvent = new ClipboardEvent('paste', {
      clipboardData: dataTransfer,
      bubbles: true,
      cancelable: true,
    });
    editorEl.dispatchEvent(pasteEvent);

    // Wait a brief moment for Monaco Editor/React state to register the pasted code
    await new Promise(resolve => setTimeout(resolve, 500));

    // Find and click the run button instead of submit as requested by the user
    // LeetCode Run button locator
    const runBtn = await this.waitForElement<HTMLButtonElement>('[data-e2e-locator="console-run-button"]');
    runBtn.click();
  }
}
