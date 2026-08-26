import { openLinksInNewTab } from '@b/settings';
import { defineContentScript } from 'wxt/utils/define-content-script';

export default defineContentScript({
  matches: ['*://*.codeforces.com/*'],
  main() {
    let isEnabled = false;

    // Load initial setting
    openLinksInNewTab.getValue().then((val) => {
      isEnabled = val;
    });

    // Listen for changes
    openLinksInNewTab.watch((newVal) => {
      isEnabled = newVal;
    });

    // Intercept clicks on links
    document.addEventListener('click', (e) => {
      if (!isEnabled) return;
      
      const target = e.target as Element;
      const anchor = target.closest('a');
      
      if (anchor && anchor.href && !anchor.href.startsWith('javascript:')) {
        // Ensure it opens in a new tab
        if (!anchor.hasAttribute('target') || anchor.getAttribute('target') !== '_blank') {
          anchor.setAttribute('target', '_blank');
        }
      }
    }, true); // use capture phase to catch clicks before navigation
  },
});
