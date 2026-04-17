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

const PopupInner = () => {
  const [status, setStatus] = useState<StatusResponse>({
    connected: false,
    isActive: false,
    port: 27121,
  });
  const [portInput, setPortInput] = useState('27121');
  const [logs, setLogs] = useState<SubmitLog[]>([]);

  useEffect(() => {
    sendMessage('getStatus', undefined).then((res) => {
      setStatus(res);
      setPortInput(String(res.port));
    });

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
        func: (port) => {
          try {
            const isCF = window.location.hostname.includes('codeforces.com');
            if (!isCF) {
              alert('Currently only Codeforces is supported for this feature.');
              return;
            }

            const name =
              document.querySelector('.problem-statement .header .title')?.textContent ||
              'Codeforces Problem';
            const url = window.location.href;
            const timeLimitStr =
              document.querySelector('.time-limit')?.childNodes[1]?.textContent || '1000';
            const memoryLimitStr =
              document.querySelector('.memory-limit')?.childNodes[1]?.textContent || '256';
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

            const payload = {
              name,
              group: 'Codeforces',
              url,
              memoryLimit,
              timeLimit,
              tests,
              testType: 'single',
              input: { type: 'stdin' },
              output: { type: 'stdout' },
              languages: { java: { taskClass: 'Task' } },
              batch: { id: crypto.randomUUID(), size: 1 },
            };

            fetch(`http://localhost:${port}/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })
              .then(() => {
                // Create a visual indicator on the page
                const toast = document.createElement('div');
                toast.textContent = 'Problem sent to VS Code!';
                Object.assign(toast.style, {
                  position: 'fixed',
                  top: '20px',
                  right: '20px',
                  padding: '10px 20px',
                  background: '#4CAF50',
                  color: 'white',
                  borderRadius: '4px',
                  zIndex: '9999',
                  fontFamily: 'sans-serif',
                });
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 3000);
              })
              .catch((e) => {
                console.error(e);
                alert(
                  `Failed to send to VS Code. Is the CPBuddy extension running on port ${port}?`,
                );
              });
          } catch (e) {
            console.error(e);
            alert(`Failed to parse Codeforces problem: ${String(e)}`);
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
            Send Problem to VS Code
          </Button>
        </Box>
      </Box>

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
