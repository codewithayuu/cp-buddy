import type { SubmitData } from '@cpbuddy/core';
import { defineExtensionMessaging } from '@webext-core/messaging';

export interface StatusResponse {
  connected: boolean;
  isActive: boolean;
  port: number;
}

export interface SubmitDoneData {
  success: boolean;
  message: string;
}

export interface StatusUpdateData {
  connected: boolean;
  isActive: boolean;
  port: number;
}

export interface SubmitResultData {
  submissionId: string;
  success: boolean;
  message: string;
}

interface ProtocolMap {
  getStatus(): StatusResponse;
  connect(): void;
  disconnect(): void;
  setPort(data: { port: number }): void;
  setActive(): void;
  pageReady(): SubmitData | null;
  submitDone(data: SubmitDoneData): void;
  statusUpdate(data: StatusUpdateData): void;
  submitResult(data: SubmitResultData): void;
  solveLuoguCaptcha(data: string): string;
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();
