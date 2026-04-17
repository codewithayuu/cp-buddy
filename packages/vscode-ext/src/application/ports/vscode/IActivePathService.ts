export interface IActivePathService {
  getActivePath(): string | null;
  setActivePath(path: string | null): void;
}
