import type { WithRevision } from './interfaces';
import type { ProblemId, TestcaseId } from './types';
import type {
  IWebviewBackgroundProblem,
  IWebviewFileWithHash,
  IWebviewProblem,
  IWebviewStressTest,
  IWebviewTestcase,
  IWebviewTestcaseResult,
} from './webview';

export interface WebviewConfig {
  confirmSubmit: boolean;
  showAcGif: boolean;
  hiddenStatuses: string[];
}

const WebviewEventName = {
  FULL_PROBLEM: 'FULL_PROBLEM',
  PATCH_META: 'PATCH_META',
  PATCH_STRESS_TEST: 'PATCH_STRESS_TEST',
  ADD_TESTCASE: 'ADD_TESTCASE',
  DELETE_TESTCASE: 'DELETE_TESTCASE',
  PATCH_TESTCASE: 'PATCH_TESTCASE',
  PATCH_TESTCASE_RESULT: 'PATCH_TESTCASE_RESULT',
  BACKGROUND: 'BACKGROUND',
  NO_PROBLEM: 'NO_PROBLEM',
  CONFIG_CHANGE: 'CONFIG_CHANGE',
  OPEN_SUBMIT_DIALOG: 'OPEN_SUBMIT_DIALOG',
} as const;

interface WebviewFullProblemEvent {
  type: typeof WebviewEventName.FULL_PROBLEM;
  problemId: ProblemId;
  payload: IWebviewProblem;
}
export type WebviewPatchMetaPayload = WithRevision<{
  checker?: IWebviewFileWithHash | null;
  interactor?: IWebviewFileWithHash | null;
}>;
interface WebviewPatchMetaEvent {
  type: typeof WebviewEventName.PATCH_META;
  problemId: ProblemId;
  payload: WebviewPatchMetaPayload;
}
export type WebviewPatchStressTestPayload = WithRevision<Partial<IWebviewStressTest>>;
interface WebviewPatchStressTestEvent {
  type: typeof WebviewEventName.PATCH_STRESS_TEST;
  problemId: ProblemId;
  payload: WebviewPatchStressTestPayload;
}
export type WebviewAddTestcasePayload = WithRevision<IWebviewTestcase>;
interface WebviewAddTestcaseEvent {
  type: typeof WebviewEventName.ADD_TESTCASE;
  problemId: ProblemId;
  testcaseId: TestcaseId;
  payload: WebviewAddTestcasePayload;
}
export type WebviewDeleteTestcasePayload = WithRevision<NonNullable<unknown>>;
interface WebviewDeleteTestcaseEvent {
  type: typeof WebviewEventName.DELETE_TESTCASE;
  problemId: ProblemId;
  testcaseId: TestcaseId;
  payload: WebviewDeleteTestcasePayload;
}
export type WebviewPatchTestcasePayload = WithRevision<Partial<IWebviewTestcase>>;
interface WebviewPatchTestcaseEvent {
  type: typeof WebviewEventName.PATCH_TESTCASE;
  problemId: ProblemId;
  testcaseId: TestcaseId;
  payload: WebviewPatchTestcasePayload;
}
export type WebviewPatchTestcaseResultPayload = WithRevision<Partial<IWebviewTestcaseResult>>;
interface WebviewPatchTestcaseResultEvent {
  type: typeof WebviewEventName.PATCH_TESTCASE_RESULT;
  problemId: ProblemId;
  testcaseId: TestcaseId;
  payload: WebviewPatchTestcaseResultPayload;
}
interface WebviewBackgroundEvent {
  type: typeof WebviewEventName.BACKGROUND;
  payload: IWebviewBackgroundProblem[];
}
interface WebviewNoProblemEvent {
  type: typeof WebviewEventName.NO_PROBLEM;
  canImport: boolean;
}
interface WebviewConfigChangeEvent {
  type: typeof WebviewEventName.CONFIG_CHANGE;
  payload: Partial<WebviewConfig>;
}
export interface WebviewOpenSubmitDialogEvent {
  type: typeof WebviewEventName.OPEN_SUBMIT_DIALOG;
  problemId: ProblemId;
}

export type WebviewEvent =
  | WebviewFullProblemEvent
  | WebviewPatchMetaEvent
  | WebviewPatchStressTestEvent
  | WebviewAddTestcaseEvent
  | WebviewDeleteTestcaseEvent
  | WebviewPatchTestcaseEvent
  | WebviewPatchTestcaseResultEvent
  | WebviewBackgroundEvent
  | WebviewNoProblemEvent
  | WebviewConfigChangeEvent
  | WebviewOpenSubmitDialogEvent;
