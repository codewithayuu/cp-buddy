export interface ITranslator {
  t(message: string, args?: Record<string, unknown>): string;
}
