import { ExtractError } from '@b/errors';
import { BaseSubmitter } from '@b/submitters/base';
import { submitterDomains } from '@b/submitters/domains';
import type { SubmitData } from '@cpbuddy/core';

export class CodeforcesSubmitter extends BaseSubmitter {
  public readonly supportedDomains = submitterDomains.codeforces;
  private readonly contestRegex = /^\/contest\/(?<contest>\d+)\/problem\/(?<problem>[A-Za-z0-9]+)/;
  private readonly problemRegex = /^\/problemset\/problem\/(?<contest>\d+)\/(?<problem>[A-Za-z0-9]+)/;
  private readonly gymRegex = /^\/gym\/(?<contest>\d+)\/problem\/(?<problem>[A-Za-z0-9]+)/;

  public getSubmitUrl(data: SubmitData) {
    const url = new URL(data.url);
    const contest = url.pathname.match(this.contestRegex)?.groups;
    const problem = url.pathname.match(this.problemRegex)?.groups;
    const gym = url.pathname.match(this.gymRegex)?.groups;
    
    if (contest) {
      url.pathname = `/contest/${contest.contest}/submit`;
    } else if (gym) {
      url.pathname = `/gym/${gym.contest}/submit`;
    } else if (problem) {
      url.pathname = `/problemset/submit`;
    }
    
    return url.toString();
  }

  public async fill(data: SubmitData) {
    const url = new URL(data.url);
    const hostname = url.hostname;

    let sourceCodeEl = document.querySelector<HTMLTextAreaElement>('#sourceCodeTextarea, textarea[name="source"]');
    let fileInput = document.querySelector<HTMLInputElement>('input[type="file"][name="sourceFile"]');
    
    // Wait for either the textarea or the file input to appear (up to 30s)
    if (!sourceCodeEl && !fileInput) {
      try {
        await this.waitFor(() => {
          sourceCodeEl = document.querySelector<HTMLTextAreaElement>('#sourceCodeTextarea, textarea[name="source"]');
          fileInput = document.querySelector<HTMLInputElement>('input[type="file"][name="sourceFile"]');
          return !!(sourceCodeEl || fileInput);
        });
      } catch (e) {
        if (document.querySelector('a[href*="/enter"]')) {
          throw new Error(`You are not logged in to ${hostname}. Codeforces mirrors require you to log in separately!`);
        }
        throw new Error(`Could not find the submit form on the problem page. Make sure you are registered for the contest and logged in.`);
      }
    }

    let form: HTMLFormElement | null = null;

    if (sourceCodeEl) {
      sourceCodeEl.value = data.sourceCode;
      form = sourceCodeEl.closest('form');

      // Fix for Monaco Editor: Monaco overwrites the textarea on form submit.
      const script = document.createElement('script');
      script.textContent = `
        try {
          if (window.monaco && window.monaco.editor) {
            const models = window.monaco.editor.getModels();
            if (models.length > 0) models[0].setValue(${JSON.stringify(data.sourceCode)});
          }
        } catch (err) {}
      `;
      document.body.appendChild(script);
      script.remove();
    } else if (fileInput) {
      const file = new File([data.sourceCode], "solution.cpp", { type: "text/plain" });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInput.files = dataTransfer.files;
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      form = fileInput.closest('form');
    }



    // Now we must populate the problem index or code.
    const originalUrl = new URL(data.url);
    const contest = originalUrl.pathname.match(this.contestRegex)?.groups;
    const problem = originalUrl.pathname.match(this.problemRegex)?.groups;
    const gym = originalUrl.pathname.match(this.gymRegex)?.groups;

    if (!form) throw new Error('Could not find the form element wrapping the submit inputs.');

    if (contest || gym) {
      const problemIndex = (contest?.problem || gym?.problem)?.toUpperCase();
      const select = form.querySelector<HTMLSelectElement>('select[name="submittedProblemIndex"]');
      if (select && problemIndex) {
        // Find the option that matches the problem index
        for (let i = 0; i < select.options.length; i++) {
          if (select.options[i].value.toUpperCase() === problemIndex || select.options[i].text.toUpperCase().startsWith(problemIndex)) {
            select.selectedIndex = i;
            break;
          }
        }
      }
    } else if (problem) {
      const input = form.querySelector<HTMLInputElement>('input[name="submittedProblemCode"]');
      if (input) {
        input.value = `${problem.contest}${problem.problem}`.toUpperCase();
      }
    }
    
    const langSelect = form.querySelector<HTMLSelectElement>('select[name="programTypeId"]');
    if (langSelect) {
      for (let i = 0; i < langSelect.options.length; i++) {
        const text = langSelect.options[i].text.toUpperCase();
        if (text.includes('C++23')) {
          langSelect.selectedIndex = i;
          break;
        }
      }
    }
    
    const submitBtn = form.querySelector<HTMLButtonElement>('.submit, input[type="submit"]');
    if (!submitBtn) throw new Error('Could not find the submit button inside the form.');
    
    submitBtn.disabled = false;
    submitBtn.click();
  }
}
