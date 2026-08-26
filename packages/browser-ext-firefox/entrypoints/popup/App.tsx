import { t } from '@b/i18n';
import { onMessage, type StatusResponse, sendMessage } from '@b/messaging';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useCallback, useEffect, useState } from 'react';
import { browser } from 'wxt/browser';

const theme = createTheme({ palette: { mode: 'dark' } });

interface SubmitLog {
  submissionId: string;
  success: boolean;
  message: string;
  timestamp: number;
}

import { enableCPBuddySubmit } from '@b/settings';

const PopupInner = () => {
  const [status, setStatus] = useState<StatusResponse>({
    connected: false,
    isActive: false,
    port: 27121,
  });
  const [portInput, setPortInput] = useState('27121');
  const [logs, setLogs] = useState<SubmitLog[]>([]);
  const [buddySubmitEnabled, setBuddySubmitEnabled] = useState(true);

  useEffect(() => {
    sendMessage('getStatus', undefined).then((res) => {
      setStatus(res);
      setPortInput(String(res.port));
    });
    enableCPBuddySubmit.getValue().then(setBuddySubmitEnabled);

    const removeStatusUpdate = onMessage('statusUpdate', ({ data }) => {
      setStatus({ connected: data.connected, isActive: data.isActive, port: data.port });
    });
    const removeSubmitResult = onMessage('submitResult', ({ data }) => {
      setLogs((prev) =>
        [
          {
            submissionId: data.submissionId,
            success: data.success,
            message: data.message,
            timestamp: Date.now(),
          },
          ...prev,
        ].slice(0, 20),
      );
    });

    return () => {
      removeStatusUpdate();
      removeSubmitResult();
    };
  }, []);

  const handleConnect = useCallback(() => {
    sendMessage('connect', undefined);
  }, []);
  const handleDisconnect = useCallback(() => {
    sendMessage('disconnect', undefined);
  }, []);
  const handleActivate = useCallback(() => {
    sendMessage('setActive', undefined);
  }, []);

  const handleSetPort = useCallback(() => {
    const port = Number.parseInt(portInput, 10);
    if (port > 0 && port < 65536) {
      sendMessage('setPort', { port });
    }
  }, [portInput]);

  const handleParseAndSend = useCallback(async () => {
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      if (!tab?.id) return;

      await browser.scripting.executeScript({
        target: { tabId: tab.id },
        args: [status.port],
        func: async (port) => {
          try {
            const hostname = window.location.hostname;
            const url = window.location.href;
            let payload: any = null;

            if (hostname.includes('codeforces.com')) {
              const name = document.querySelector('.problem-statement .header .title')?.textContent || 'Codeforces Problem';
              const timeLimitStr = document.querySelector('.time-limit')?.childNodes[1]?.textContent || '1000';
              const memoryLimitStr = document.querySelector('.memory-limit')?.childNodes[1]?.textContent || '256';
              const timeLimit = parseInt(timeLimitStr.replace(/[^0-9]/g, ''), 10) * 1000 || 1000;
              const memoryLimit = parseInt(memoryLimitStr.replace(/[^0-9]/g, ''), 10) || 256;

              const inputs = document.querySelectorAll('.input pre');
              const outputs = document.querySelectorAll('.output pre');

              const tests = [];
              for (let i = 0; i < inputs.length; i++) {
                tests.push({
                  input: (inputs[i] as HTMLElement).innerText,
                  output: (outputs[i] as HTMLElement).innerText,
                });
              }

              payload = { name, group: 'Codeforces', url, memoryLimit, timeLimit, tests, testType: 'single', input: { type: 'stdin' }, output: { type: 'stdout' }, languages: { java: { taskClass: 'Task' } }, batch: { id: crypto.randomUUID(), size: 1 } };
            } else if (hostname.includes('atcoder.jp')) {
              const name = document.querySelector('h2, .h2')?.textContent?.trim() || 'AtCoder Problem';
              // Time Limit is usually in the first p tag inside #task-statement, or in span
              const timeLimitStr = document.body.textContent?.match(/Time Limit: (\d+) sec/)?.[1] || '2';
              const memoryLimitStr = document.body.textContent?.match(/Memory Limit: (\d+) MB/)?.[1] || '1024';
              const timeLimit = parseInt(timeLimitStr, 10) * 1000 || 2000;
              const memoryLimit = parseInt(memoryLimitStr, 10) || 1024;

              const parts = document.querySelectorAll('.part h3');
              const inputs: string[] = [];
              const outputs: string[] = [];
              parts.forEach(part => {
                if (part.textContent?.includes('Input')) {
                  inputs.push(part.nextElementSibling?.textContent?.trim() || '');
                } else if (part.textContent?.includes('Output')) {
                  outputs.push(part.nextElementSibling?.textContent?.trim() || '');
                }
              });
              
              const tests = [];
              for (let i = 0; i < inputs.length; i++) {
                tests.push({ input: inputs[i] + '\n', output: outputs[i] + '\n' });
              }

              payload = { name, group: 'AtCoder', url, memoryLimit, timeLimit, tests, testType: 'single', input: { type: 'stdin' }, output: { type: 'stdout' }, languages: { java: { taskClass: 'Task' } }, batch: { id: crypto.randomUUID(), size: 1 } };
            } else if (hostname.includes('cses.fi')) {
              const name = document.querySelector('title')?.textContent?.replace('CSES - ', '') || 'CSES Problem';
              const timeLimitStr = document.querySelector('.title-block')?.textContent?.match(/Time limit:\s*([\d.]+) s/)?.[1] || '1';
              const memoryLimitStr = document.querySelector('.title-block')?.textContent?.match(/Memory limit:\s*(\d+) MB/)?.[1] || '512';
              const timeLimit = parseFloat(timeLimitStr) * 1000 || 1000;
              const memoryLimit = parseInt(memoryLimitStr, 10) || 512;

              const codeBlocks = document.querySelectorAll('.md pre, pre');
              const tests = [];
              for (let i = 0; i < codeBlocks.length; i += 2) {
                if (codeBlocks[i+1]) {
                  tests.push({ input: (codeBlocks[i] as HTMLElement).innerText, output: (codeBlocks[i+1] as HTMLElement).innerText });
                }
              }

              payload = { name, group: 'CSES', url, memoryLimit, timeLimit, tests, testType: 'single', input: { type: 'stdin' }, output: { type: 'stdout' }, languages: { java: { taskClass: 'Task' } }, batch: { id: crypto.randomUUID(), size: 1 } };
            } else if (hostname.includes('leetcode.com')) {
              const match = window.location.pathname.match(/\/problems\/([^/?#]+)/);
              if (!match) {
                alert('Please navigate to a specific LeetCode problem page.');
                return;
              }
              const slug = match[1];

              const query = `
                query selectProblem($titleSlug: String!) {
                  question(titleSlug: $titleSlug) {
                    questionId
                    title
                    content
                  }
                }
              `;
              const res = await fetch('https://leetcode.com/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, variables: { titleSlug: slug } }),
              });
              const data = await res.json();
              const question = data?.data?.question;
              if (!question) {
                alert('Failed to fetch LeetCode problem data via GraphQL.');
                return;
              }
              const name = question.title || 'LeetCode Problem';
              
              const outputs: string[] = [];
              const regex = /<strong>Output:?\s*<\/strong>\s*([^<\n]+)/gi;
              let m;
              while ((m = regex.exec(question.content)) !== null) {
                outputs.push(m[1].trim().replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'"));
              }
              
              const inputsMatch = question.content.match(/<strong>Input:?\s*<\/strong>\s*([^<\n]+)/gi) || [];
              const inputs = inputsMatch.map((str: string) => {
                const inner = str.replace(/<strong>Input:?\s*<\/strong>\s*/i, '');
                return inner.trim().replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'");
              });

              const tests = [];
              for (let i = 0; i < inputs.length; i++) {
                tests.push({ input: inputs[i], output: outputs[i] || '' });
              }
              payload = { name, group: 'LeetCode', url, memoryLimit: 256, timeLimit: 2000, tests, testType: 'single', input: { type: 'stdin' }, output: { type: 'stdout' }, languages: { java: { taskClass: 'Task' } }, batch: { id: crypto.randomUUID(), size: 1 } };
            } else if (hostname.includes('hackerrank.com')) {
              const name = document.querySelector('h1.page-label')?.textContent?.trim() || document.querySelector('h1')?.textContent?.trim() || document.title.split('|')[0].trim() || 'HackerRank Problem';
              const preBlocks = document.querySelectorAll('.challenge-body-html pre');
              const tests = [];
              for (let i = 0; i < preBlocks.length; i += 2) {
                if (preBlocks[i+1]) {
                  tests.push({ input: (preBlocks[i] as HTMLElement).innerText, output: (preBlocks[i+1] as HTMLElement).innerText });
                }
              }
              payload = { name, group: 'HackerRank', url, memoryLimit: 512, timeLimit: 2000, tests, testType: 'single', input: { type: 'stdin' }, output: { type: 'stdout' }, languages: { java: { taskClass: 'Task' } }, batch: { id: crypto.randomUUID(), size: 1 } };
            } else {
              alert('Currently only Codeforces, AtCoder, CSES, LeetCode, and HackerRank are supported for this feature.');
              return;
            }

            fetch(`http://localhost:${port}/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })
              .then(() => {
                const existing = document.getElementById('cpbuddy-action-pill');
                if (existing) existing.remove();

                const toast = document.createElement('div');
                toast.id = 'cpbuddy-action-pill';
                toast.textContent = 'Sent';
                Object.assign(toast.style, {
                  position: 'fixed',
                  bottom: '24px',
                  right: '24px',
                  padding: '5px 14px',
                  backgroundColor: '#000000',
                  color: '#50fa7b',
                  border: '1px solid rgba(80, 250, 123, 0.45)',
                  borderRadius: '9999px',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif',
                  fontSize: '12px',
                  fontWeight: '600',
                  letterSpacing: '0.03em',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.8), 0 0 12px rgba(80, 250, 123, 0.2)',
                  zIndex: '9999999',
                  opacity: '0',
                  transform: 'translateY(8px)',
                  transition: 'opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  pointerEvents: 'none',
                  userSelect: 'none',
                });
                document.body.appendChild(toast);
                requestAnimationFrame(() => {
                  toast.style.opacity = '1';
                  toast.style.transform = 'translateY(0)';
                });
                setTimeout(() => {
                  toast.style.opacity = '0';
                  toast.style.transform = 'translateY(8px)';
                  setTimeout(() => toast.remove(), 250);
                }, 2000);
              })
              .catch((e) => {
                console.error(e);
                alert(`Failed to send to VS Code. Is the CPBuddy extension running on port ${port}?`);
              });
          } catch (e) {
            console.error(e);
            alert(`Failed to parse problem: ${String(e)}`);
          }
        },
      });
    } catch (e) {
      console.error('Script injection failed', e);
    }
  }, [status.port]);

  return (
    <Box sx={{ width: 320, p: 1.5 }}>
      <Box sx={{ pb: 2 }}>
        <Typography variant='h6'>
          {t('appTitle')}
          <Chip
            label={
              status.connected
                ? status.isActive
                  ? t('statusConnected')
                  : t('statusInactive')
                : t('statusDisconnected')
            }
            color={status.connected ? (status.isActive ? 'success' : 'warning') : 'error'}
            size='small'
            variant='outlined'
            sx={{ marginLeft: 2 }}
          />
        </Typography>
      </Box>

      {buddySubmitEnabled ? (
        <Box>
          <Stack direction='row' sx={{ gap: 1 }}>
            <TextField
              label={t('labelPort')}
              type='number'
              value={portInput}
              onChange={(e) => setPortInput(e.target.value)}
              size='small'
              slotProps={{ htmlInput: { min: 1, max: 65535 } }}
              sx={{ width: 110 }}
            />
            <Button variant='outlined' onClick={handleSetPort}>
              {t('btnSet')}
            </Button>
          </Stack>

          <Stack direction='row' spacing={1} sx={{ mt: 1 }}>
            {status.connected ? (
              <Button variant='contained' color='error' size='small' onClick={handleDisconnect}>
                {t('btnDisconnect')}
              </Button>
            ) : (
              <Button variant='contained' color='primary' size='small' onClick={handleConnect}>
                {t('btnConnect')}
              </Button>
            )}
            {status.connected && !status.isActive && (
              <Button variant='contained' color='warning' size='small' onClick={handleActivate}>
                {t('btnActivate')}
              </Button>
            )}
          </Stack>

          <Box sx={{ mt: 2 }}>
            <Button
              variant='contained'
              color='secondary'
              size='small'
              fullWidth
              onClick={handleParseAndSend}
              disabled={!status.connected}
            >
              Send Problem
            </Button>
          </Box>
        </Box>
      ) : (
        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', mt: 2 }}>
          CPBuddy Core feature is disabled. You can enable it in the extension settings.
        </Typography>
      )}

      {logs.length > 0 && (
        <>
          <Divider />
          <Typography variant='subtitle2' sx={{ color: 'text.secondary' }}>
            {t('recentSubmissions')}
          </Typography>
          <List dense disablePadding>
            {logs.map((log) => (
              <ListItem
                key={`${log.submissionId}-${log.timestamp}`}
                disablePadding
                sx={{ py: 0.25 }}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>
                  {log.success ? (
                    <CheckCircleIcon fontSize='small' color='success' />
                  ) : (
                    <ErrorIcon fontSize='small' color='error' />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={log.message}
                  slotProps={{
                    primary: {
                      variant: 'body2',
                      noWrap: true,
                      title: log.message,
                    },
                  }}
                />
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Box>
  );
};

export const Popup = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <PopupInner />
  </ThemeProvider>
);
