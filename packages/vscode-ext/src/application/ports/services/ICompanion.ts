import type { Problem } from '@/domain/entities/problem';

export interface ICompanion {
  connect(): void;
  disconnect(): void;
  isBrowserExtConnected(): boolean;
  submit(problem: Problem): Promise<void>;
}
