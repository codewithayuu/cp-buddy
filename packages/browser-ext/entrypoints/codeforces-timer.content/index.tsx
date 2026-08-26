import { defineContentScript } from 'wxt/utils/define-content-script';
import { enableProblemTimer } from '@b/settings';
import { createRoot, type Root } from 'react-dom/client';
import { TimerWidget } from './TimerWidget';
import React from 'react';

export default defineContentScript({
  matches: ['*://*.codeforces.com/*'],
  runAt: 'document_idle',
  main() {
    let root: Root | null = null;
    let container: HTMLDivElement | null = null;

    const getProblemId = () => {
      const contestMatch = window.location.pathname.match(/\/(contest|gym)\/(?<contest>\d+)\/problem\/(?<problem>[A-Za-z0-9]+)/);
      if (contestMatch?.groups) {
        return `${contestMatch.groups.contest}_${contestMatch.groups.problem}`;
      }
      const problemsetMatch = window.location.pathname.match(/\/problemset\/problem\/(?<contest>\d+)\/(?<problem>[A-Za-z0-9]+)/);
      if (problemsetMatch?.groups) {
        return `${problemsetMatch.groups.contest}_${problemsetMatch.groups.problem}`;
      }
      return null;
    };

    const mountTimer = (enabled: boolean) => {
      const problemId = getProblemId();
      if (!problemId) return;

      // Find where to mount it, usually in the second-level-menu or right above the problem
      let mountTarget = document.querySelector('.second-level-menu');
      
      if (enabled) {
        if (!container) {
          container = document.createElement('div');
          container.id = 'cpbuddy-timer-container';
          if (mountTarget) {
            mountTarget.appendChild(container);
          } else {
            // fallback
            const fallback = document.querySelector('.problem-statement') || document.getElementById('pageContent');
            if (fallback) fallback.parentElement?.insertBefore(container, fallback);
          }
          
          root = createRoot(container);
          root.render(<TimerWidget problemId={problemId} submitEvent={document} />);
        }
      } else {
        if (root) {
          root.unmount();
          root = null;
        }
        if (container) {
          container.remove();
          container = null;
        }
      }
    };

    enableProblemTimer.getValue().then(mountTimer);
    enableProblemTimer.watch(mountTimer);
  },
});
