import { defineContentScript } from 'wxt/utils/define-content-script';
import { enableLeetcodeAmoledTheme, enableLeetcodeFastIO } from '@b/settings';
import leetcodeAmoledCss from '../../assets/leetcode/amoled-blue.css?raw';

export default defineContentScript({
  matches: ['*://*.leetcode.com/*'],
  runAt: 'document_start',
  main() {
    if (!window.location.hostname.includes('leetcode.com')) return;

    // Fast I/O Setting Sync to DOM
    enableLeetcodeFastIO.getValue().then(enabled => {
      document.documentElement.dataset.cpbuddyFastIo = enabled ? 'true' : 'false';
    });
    enableLeetcodeFastIO.watch(enabled => {
      document.documentElement.dataset.cpbuddyFastIo = enabled ? 'true' : 'false';
    });

    let styleElement: HTMLStyleElement | null = null;
    let observer: MutationObserver | null = null;

    const ensureStyleAttached = () => {
      const target = document.head || document.documentElement || document.body;
      if (target && styleElement && styleElement.parentElement !== target) {
        target.appendChild(styleElement);
      }
    };

    const applyTheme = (enabled: boolean) => {
      if (enabled) {
        if (!styleElement) {
          styleElement = document.createElement('style');
          styleElement.id = 'cpbuddy-leetcode-amoled-theme';
          styleElement.textContent = leetcodeAmoledCss;
        }
        ensureStyleAttached();

        if (!observer) {
          observer = new MutationObserver(() => {
            if (!document.getElementById('cpbuddy-leetcode-amoled-theme') && styleElement) {
              ensureStyleAttached();
            }
          });
          if (document.documentElement) {
            observer.observe(document.documentElement, { childList: true, subtree: true });
          }
        }
      } else {
        if (observer) {
          observer.disconnect();
          observer = null;
        }
        const existing = document.getElementById('cpbuddy-leetcode-amoled-theme');
        if (existing) existing.remove();
        if (styleElement && styleElement.parentElement) {
          styleElement.remove();
        }
        styleElement = null;
      }
    };

    // Initial load
    enableLeetcodeAmoledTheme.getValue().then((enabled) => {
      applyTheme(enabled);
    });

    // Watch for changes from options page
    enableLeetcodeAmoledTheme.watch((enabled) => {
      applyTheme(enabled);
    });

    // Re-verify on DOMContentLoaded and load
    window.addEventListener('DOMContentLoaded', () => {
      enableLeetcodeAmoledTheme.getValue().then(applyTheme);
    });
  },
});
