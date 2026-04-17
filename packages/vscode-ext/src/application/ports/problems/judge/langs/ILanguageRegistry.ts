import type { ILanguageStrategy } from '@/application/ports/problems/judge/langs/ILanguageStrategy';

export interface ILanguageRegistry {
  getLang(filePath: string): ILanguageStrategy | undefined;
}
