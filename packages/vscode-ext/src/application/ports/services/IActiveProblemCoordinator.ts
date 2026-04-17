export interface IActiveProblemCoordinator {
  dispatchFullData(): Promise<void>;
  onActiveEditorChanged(): Promise<void>;
}
