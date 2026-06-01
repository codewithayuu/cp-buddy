import { t } from '@b/i18n';

export class ElementError extends Error {
  public readonly name = 'elementError';
  public constructor(public readonly selector: string) {
    super();
  }
  public toString() {
    return t('elementErrorMessage', [this.selector]);
  }
}

export class ExtractError extends Error {
  public readonly name = 'extractError';
  public constructor(public readonly key: string) {
    super();
  }
  public toString() {
    return t('extractErrorMessage', [this.key]);
  }
}

export class InternalError extends Error {
  public readonly name = 'internalError';
  public constructor(public readonly message: string) {
    super();
  }
  public toString() {
    return `${t('internalErrorMessage')}\n\n${this.message}`;
  }
}
