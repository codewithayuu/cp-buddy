import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { RouterConfig } from '@cpbuddy/core';
import { Command } from 'commander';
import { lock } from 'proper-lockfile';

const program = new Command();

program
  .requiredOption('-p, --port <number>', 'Port number (1-65535)', (val) => {
    const p = parseInt(val, 10);
    if (Number.isNaN(p) || p <= 0 || p > 65535) throw new Error('Invalid port');
    return p;
  })
  .requiredOption('-l, --log-file <path>', 'Path to the log file')
  .parse(process.argv);

const options = program.opts();

export const config: RouterConfig = {
  port: options.port,
  logFile: resolve(options.logFile),
};

const logFile = config.logFile;
const logDir = dirname(logFile);
if (!existsSync(logDir)) mkdirSync(logDir, { recursive: true });
if (!existsSync(logFile)) writeFileSync(logFile, '');
await lock(logFile);

export const updateConfig = (newConfig: Partial<RouterConfig>) => {
  Object.assign(config, newConfig);
};
