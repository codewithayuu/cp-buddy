import { defineContentScript } from 'wxt/utils/define-content-script';
import { enableSpoof, spoofTarget, spoofAlias } from '../src/settings';

export default defineContentScript({
  matches: ['*://codeforces.com/*', '*://codeforces.ml/*'],
  runAt: 'document_start',
  async main() {
    const cacheKey = 'cpbuddy_spoof_cache';
    const cached = localStorage.getItem(cacheKey);
    let cachedIsEnabled = false;
    let cachedTarget = '';
    let cachedAlias = '';

    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        cachedIsEnabled = parsed.isEnabled;
        cachedTarget = parsed.target;
        cachedAlias = parsed.alias;
      } catch(e) {}
    }

    let observer: MutationObserver | null = null;

    const applySpoof = (target: string, alias: string) => {
      if (!target || !alias || target === alias) return;
      if (observer) return; // already applied

      const targetRegex = new RegExp(target, 'g');

    function replaceTextInNode(node: Node) {
      if (node.nodeType === 3) { // TEXT_NODE
        if (node.nodeValue && node.nodeValue.includes(target)) {
          node.nodeValue = node.nodeValue.replace(targetRegex, alias);
        }
      } else if (node.nodeType === 1) { // ELEMENT_NODE
        const el = node as HTMLElement;
        const tag = el.nodeName.toUpperCase();
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'INPUT') return;
        
        for (let i = 0; i < node.childNodes.length; i++) {
          replaceTextInNode(node.childNodes[i]);
        }
      }
    }

    function spoofTitle() {
      if (document.title.includes(target)) {
        document.title = document.title.replace(targetRegex, alias);
      }
    }

    // Initial run for anything already parsed
    replaceTextInNode(document.documentElement);
    spoofTitle();

    // Setup Mutation Observer for dynamically added content
    observer = new MutationObserver((mutations) => {
      let shouldSpoofTitle = false;
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          for (let i = 0; i < mutation.addedNodes.length; i++) {
            const addedNode = mutation.addedNodes[i];
            if (addedNode.nodeName.toUpperCase() === 'TITLE') {
              shouldSpoofTitle = true;
            } else {
              replaceTextInNode(addedNode);
            }
          }
        } else if (mutation.type === 'characterData') {
          if (mutation.target.nodeValue && mutation.target.nodeValue.includes(target)) {
             mutation.target.nodeValue = mutation.target.nodeValue.replace(targetRegex, alias);
          }
        }
      }
      if (shouldSpoofTitle) spoofTitle();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true
    });
    }; // end applySpoof

    if (cachedIsEnabled && cachedTarget && cachedAlias && cachedTarget !== cachedAlias) {
       applySpoof(cachedTarget, cachedAlias);
    }

    Promise.all([
      enableSpoof.getValue(),
      spoofTarget.getValue(),
      spoofAlias.getValue()
    ]).then(([en, tgt, al]) => {
      localStorage.setItem(cacheKey, JSON.stringify({ isEnabled: en, target: tgt, alias: al }));
      if (en && tgt && al && tgt !== al) {
         if (!cachedIsEnabled || tgt !== cachedTarget || al !== cachedAlias) {
             applySpoof(tgt, al);
         }
      } else if (cachedIsEnabled && !en) {
         location.reload(); // Reload to remove spoofing if disabled
      }
    });
  }
});
