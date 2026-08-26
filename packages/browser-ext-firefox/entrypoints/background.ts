import { onMessage, sendMessage } from '@b/messaging';
import { findSubmitter } from '@b/submitters';
import type { B2rMsg, R2bMsg, SubmitData } from '@cpbuddy/core';
import { io, type Socket } from 'socket.io-client';
import { browser } from 'wxt/browser';
import { defineBackground } from 'wxt/utils/define-background';
import { storage } from 'wxt/utils/storage';

const CACHE: Record<string, { time: number; data: any }> = {};
const PENDING_REQUESTS: Record<string, Promise<any>> = {};
const RATE_LIMIT_MS = 2500;

async function fetchUserSubs(handle: string) {
  const key = `user:${handle}`;
  const now = Date.now();

  if (CACHE[key] && now - CACHE[key].time < RATE_LIMIT_MS) {
    return CACHE[key].data;
  }

  if (PENDING_REQUESTS[key]) {
    return PENDING_REQUESTS[key];
  }

  const promise = (async () => {
    try {
      const res = await fetch(
        `https://codeforces.com/api/user.status?handle=${handle}&from=1&count=30&_=${Date.now()}`
      );
      const json = await res.json();
      
      if (json && json.status === 'OK' && json.result) {
        CACHE[key] = {
          time: Date.now(),
          data: json.result
        };
        return json.result;
      }
      return CACHE[key] ? CACHE[key].data : null;
    } catch (err) {
      return CACHE[key] ? CACHE[key].data : null;
    } finally {
      delete PENDING_REQUESTS[key];
    }
  })();

  PENDING_REQUESTS[key] = promise;
  return promise;
}

const problemRatingsStore = storage.defineItem<Record<string, any>>('local:problemRatings', {
  fallback: {},
});
const problemRatingsTimeStore = storage.defineItem<number>('local:problemRatingsTime', {
  fallback: 0,
});
const PROBLEM_RATINGS_CACHE_MS = 1000 * 60 * 60 * 24; // 24 hours

async function fetchProblemRatings() {
  const now = Date.now();
  const cachedRatings = await problemRatingsStore.getValue();
  const cachedTime = await problemRatingsTimeStore.getValue();
  
  if (cachedRatings && Object.keys(cachedRatings).length > 0 && now - cachedTime < PROBLEM_RATINGS_CACHE_MS) {
    return cachedRatings;
  }

  try {
    const res = await fetch('https://codeforces.com/api/problemset.problems');
    const json = await res.json();
    if (json.status === 'OK') {
      const ratings: Record<string, any> = {};
      
      const stats = json.result.problemStatistics || [];
      const solvesMap: Record<string, number> = {};
      for (const s of stats) {
         if (s.contestId && s.index) {
           solvesMap[`${s.contestId}_${s.index}`] = s.solvedCount;
         }
      }

      for (const p of json.result.problems) {
        if (p.contestId && p.index) {
          const key = `${p.contestId}_${p.index}`;
          if (p.rating) {
             ratings[key] = { rating: p.rating, isPredicted: false };
          } else {
             const solves = solvesMap[key] || 0;
             if (solves > 0) {
                const predicted = Math.max(800, Math.round((4000 - 350 * Math.log(solves)) / 100) * 100);
                ratings[key] = { rating: predicted, isPredicted: true };
             }
          }
        }
      }
      
      await problemRatingsStore.setValue(ratings);
      await problemRatingsTimeStore.setValue(now);
      return ratings;
    }
  } catch (e) {
    console.error('Failed to fetch problemset problems', e);
  }
  return cachedRatings || {};
}

async function fetchContestSubs(contestId: number) {
  const key = `contest:${contestId}`;
  const now = Date.now();

  if (CACHE[key] && now - CACHE[key].time < RATE_LIMIT_MS) {
    return CACHE[key].data;
  }

  if (PENDING_REQUESTS[key]) {
    return PENDING_REQUESTS[key];
  }

  const promise = (async () => {
    try {
      const res = await fetch(
        `https://codeforces.com/api/contest.status?contestId=${contestId}&from=1&count=400&_=${Date.now()}`
      );
      const json = await res.json();
      
      if (json && json.status === 'OK' && json.result) {
        CACHE[key] = {
          time: Date.now(),
          data: json.result
        };
        return json.result;
      }
      return CACHE[key] ? CACHE[key].data : null;
    } catch (err) {
      return CACHE[key] ? CACHE[key].data : null;
    } finally {
      delete PENDING_REQUESTS[key];
    }
  })();

  PENDING_REQUESTS[key] = promise;
  return promise;
}

const routerPort = storage.defineItem<number>('local:routerPort', {
  fallback: 27121,
});
interface ConnectionState {
  socket: Socket<R2bMsg, B2rMsg> | null;
  port: number;
  connected: boolean;
  isActive: boolean;
}

const setupCaptchaRuntime = async (): Promise<void> => {
  // Firefox do not support offscreen documents
  if (import.meta.env.FIREFOX) return;

  const contexts = await browser.runtime.getContexts({
    contextTypes: [browser.runtime.ContextType.OFFSCREEN_DOCUMENT],
  });
  if (contexts.length !== 0)
    return console.log('[cpbuddy-submit] Offscreen document already exists, skipping creation');
  await browser.offscreen.createDocument({
    url: browser.runtime.getURL('/offscreen.html'),
    reasons: [browser.offscreen.Reason.WORKERS],
    justification: 'Keep Luogu captcha model loaded for low-latency ONNX inference.',
  });
};

export default defineBackground(() => {
  void setupCaptchaRuntime();

  routerPort.getValue().then((port) => {
    const state: ConnectionState = {
      socket: null,
      port,
      connected: false,
      isActive: false,
    };

    const broadcastStatus = () => {
      sendMessage('statusUpdate', {
        connected: state.connected,
        isActive: state.isActive,
        port: state.port,
      });

      let badgeColor = '#F44336';
      if (state.connected) badgeColor = state.isActive ? '#4CAF50' : '#9E9E9E';
      try {
        const actionApi = browser.browserAction || browser.action;
        if (actionApi) {
          actionApi.setBadgeText({ text: '•' });
          actionApi.setBadgeBackgroundColor({ color: badgeColor });
        }
      } catch (e) {
        console.warn('Failed to set badge', e);
      }
    };

    const connect = () => {
      if (state.socket?.connected) return;
      if (state.socket) state.socket.close();

      state.socket = io(`ws://localhost:${state.port}`, {
        path: '/ws',
        query: { type: 'browser' },
        transports: ['websocket'],
        reconnectionDelay: 3000,
        autoConnect: true,
      });
      broadcastStatus();

      state.socket.on('connect', () => {
        state.connected = true;
        console.log('[cpbuddy-submit] Connected to router');
        broadcastStatus();
      });
      state.socket.on('disconnect', () => {
        state.connected = false;
        state.isActive = false;
        console.log('[cpbuddy-submit] Disconnected from router');
        broadcastStatus();
      });
      state.socket.on('status', ({ isActive }) => {
        state.isActive = isActive;
        console.log('[cpbuddy-submit] Active status changed:', isActive);
        broadcastStatus();
      });
      state.socket.on('submitRequest', (request) => {
        console.log('[cpbuddy-submit] Received submit request:', request);
        handleSubmitRequest(request);
      });
    };

    const pendingSubmissions = new Map<number, SubmitData>();

    const handleSubmitRequest = (request: SubmitData) => {
      const submitter = findSubmitter(new URL(request.url));
      if (!submitter) {
        showError(`No submitter found for URL: ${request.url}`);
        return;
      }

      try {
        browser.tabs.create({ url: submitter.getSubmitUrl(request), active: false }, (tab) => {
          if (browser.runtime.lastError || tab.id === undefined) {
            showError('Failed to open tab');
            return;
          }
          pendingSubmissions.set(tab.id, request);
        });
      } catch (e) {
        showError(e?.toString() || String(e));
      }
    };

    onMessage('getStatus', () => ({
      connected: state.connected,
      port: state.port,
      isActive: state.isActive,
    }));

    onMessage('setActive', () => {
      state.socket?.emit('setActive');
    });

    onMessage('connect', () => {
      connect();
    });

    onMessage('disconnect', () => {
      state.socket?.disconnect();
      state.socket = null;
    });

    onMessage('setPort', ({ data }) => {
      state.port = data.port;
      routerPort.setValue(data.port);
      connect();
    });

    onMessage('pageReady', ({ sender }): SubmitData | null => {
      if (sender.tab?.id !== undefined) {
        const pending = pendingSubmissions.get(sender.tab.id);
        return pending ? pending : null;
      }
      return null;
    });

    onMessage('submitDone', ({ data, sender }) => {
      if (!data.success) showError(data.message);
      if (sender.tab?.id !== undefined) pendingSubmissions.delete(sender.tab.id);

      browser.tabs.query({ url: '*://*.codeforces.com/*' }).then(tabs => {
        tabs.forEach(t => {
          if (t.id) sendMessage('notifySubmit', undefined, t.id).catch(() => {});
        });
      });
    });

    onMessage('fetchUserSubs', async ({ data }) => {
      try {
        return await fetchUserSubs(data as any as string);
      } catch (e) {
        return null;
      }
    });

    onMessage('fetchContestSubs', async ({ data }) => {
      try {
        return await fetchContestSubs(data as any as number);
      } catch (e) {
        return null;
      }
    });

    onMessage('fetchProblemRatings', async () => {
      return await fetchProblemRatings();
    });

    browser.commands.onCommand.addListener(async (command) => {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      const tabId = tabs[0]?.id;
      if (tabId === undefined) return;

      if (command === 'copy-problem') {
        sendMessage('copyProblemShortcut', undefined, tabId).catch(() => {});
      } else if (command === 'open-submissions') {
        const username = await storage.getItem<string>('local:spoofTarget') || 'tourist';
        browser.tabs.create({ url: `https://codeforces.com/submissions/${username}` });
      } else if (command === 'send-to-sublime') {
        if (!state.connected) {
          showError('CPBuddy is not connected.');
          return;
        }

        try {
          await browser.scripting.executeScript({
            target: { tabId },
            args: [state.port],
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
      }
    });

    const showError = (message: string) => {
      browser.notifications.create({
        type: 'basic',
        iconUrl: '/icons/128.png',
        title: 'CPBuddy Submit Error',
        message,
        priority: 2,
      });
    };
    
    import('@b/settings').then(({ enableCPBuddySubmit }) => {
      enableCPBuddySubmit.getValue().then((enabled) => {
        if (enabled) connect();
      });
    });
  });
});
