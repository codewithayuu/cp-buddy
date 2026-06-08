import { appendFileSync } from 'node:fs';
import type { LogLevel } from '@cpbuddy/core';
import { config } from '@/config';
import { broadcastLog } from '@/index';

export const writeLog = (level: LogLevel, message: string, ...args: unknown[]) => {
  const timeString = new Date().toISOString();
  const levelString = level.toUpperCase();
  const argsString = args
    .map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg)))
    .join(' ');
  const logLine = `[${timeString}] [${levelString}] ${message} ${argsString}`;
  try {
    appendFileSync(config.logFile, `${logLine}\n`);
  } catch {}
  console.log(logLine);
  broadcastLog(level, message, args);
};

export const trace = (message: string, ...args: unknown[]) => {
  writeLog('trace', message, ...args);
};
export const debug = (message: string, ...args: unknown[]) => {
  writeLog('debug', message, ...args);
};
export const info = (message: string, ...args: unknown[]) => {
  writeLog('info', message, ...args);
};
export const warn = (message: string, ...args: unknown[]) => {
  writeLog('warn', message, ...args);
};
export const error = (message: string, ...args: unknown[]) => {
  writeLog('error', message, ...args);
};
