import { ExtractError } from '@b/errors';
import { BaseSubmitter } from '@b/submitters/base';
import { submitterDomains } from '@b/submitters/domains';
import type { SubmitData } from '@cpbuddy/core';

export class HackerRankSubmitter extends BaseSubmitter {
  public readonly supportedDomains = submitterDomains.hackerrank;
  private readonly problemRegex = /^\/challenges\/(?<problem>[\w-]+)/;

  public getSubmitUrl(data: SubmitData) {
    const url = new URL(data.url);
    const isProblem = url.pathname.match(this.problemRegex)?.groups;
    if (isProblem) {
      url.pathname = `/challenges/${isProblem.problem}/problem`;
    } else throw new ExtractError('type');
    return url.toString();
  }

  public async fill(data: SubmitData) {
    // Wait for Editor's content area
    const editorEl = await this.waitForElement<HTMLElement>('.view-lines, .CodeMirror, .monaco-editor');
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

    // Find and click the submit button
    // HackerRank Submit button
    const submitBtn = await this.waitForElement<HTMLButtonElement>('.hr-monaco-submit');
    submitBtn.click();
  }
}
