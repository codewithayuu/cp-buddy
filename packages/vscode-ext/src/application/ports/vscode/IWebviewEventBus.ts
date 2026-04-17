import type {
  IWebviewBackgroundProblem,
  IWebviewProblem,
  ProblemId,
  TestcaseId,
  WebviewAddTestcasePayload,
  WebviewConfig,
  WebviewDeleteTestcasePayload,
  WebviewEvent,
  WebviewPatchMetaPayload,
  WebviewPatchStressTestPayload,
  WebviewPatchTestcasePayload,
  WebviewPatchTestcaseResultPayload,
} from '@cpbuddy/core';

export interface IWebviewEventBus {
  onMessage(callback: (data: WebviewEvent) => void): void;
  openSubmitDialog(problemId: ProblemId): void;
  fullProblem(problemId: ProblemId, payload: IWebviewProblem): void;
  patchMeta(problemId: ProblemId, payload: WebviewPatchMetaPayload): void;
  patchStressTest(problemId: ProblemId, payload: WebviewPatchStressTestPayload): void;
  addTestcase(
    problemId: ProblemId,
    testcaseId: TestcaseId,
    payload: WebviewAddTestcasePayload,
  ): void;
  deleteTestcase(
    problemId: ProblemId,
    testcaseId: TestcaseId,
    payload: WebviewDeleteTestcasePayload,
  ): void;
  patchTestcase(
    problemId: ProblemId,
    testcaseId: TestcaseId,
    payload: WebviewPatchTestcasePayload,
  ): void;
  patchTestcaseResult(
    problemId: ProblemId,
    testcaseId: TestcaseId,
    payload: WebviewPatchTestcaseResultPayload,
  ): void;
  background(payload: IWebviewBackgroundProblem[]): void;
  noProblem(canImport: boolean): void;
  configChange(payload: Partial<WebviewConfig>): void;
}
