import { ElementError, InternalError } from '@b/errors';
import type { SubmitData } from '@cpbuddy/core';

export abstract class BaseSubmitter {
  public abstract readonly supportedDomains: readonly string[];
  public abstract getSubmitUrl(data: SubmitData): string;
  public abstract fill(data: SubmitData): Promise<void>;

  protected waitFor(condition: () => boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      const result = condition();
      if (result) {
        resolve();
        return;
      }

      const deadline = Date.now() + 30000;
      const check = setInterval(() => {
        const result = condition();
        if (result) {
          clearInterval(check);
          resolve();
          return;
        }
        if (Date.now() >= deadline) {
          clearInterval(check);
          reject(new Error('Timeout waiting for condition'));
          return;
        }
      }, 100);
    });
  }

  protected async waitForElement<T extends Element>(selector: string): Promise<T> {
    let element: T | null = null;
    return this.waitFor(() => {
      element = document.querySelector<T>(selector);
      return !!element;
    })
      .then(() => {
        if (!element) throw new Error();
        return element;
      })
      .catch(() => {
        throw new ElementError(selector);
      });
  }

  public requireInteraction: (selector: string | null) => void = () => {
    throw new InternalError('This submitter does not support interaction');
  };
  protected clearInteraction() {
    this.requireInteraction(null);
  }
}
