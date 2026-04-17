export interface IDocument {
  save(path: string): Promise<void>;
}
