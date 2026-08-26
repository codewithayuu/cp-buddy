import { defineContentScript } from 'wxt/utils/define-content-script';
import { enableSpoof, spoofTarget, spoofAlias } from '../src/settings';

export default defineContentScript({
  matches: ['*://codeforces.com/*', '*://codeforces.ml/*'],
  runAt: 'document_start',
  async main() {
    const isEnabled = await enableSpoof.getValue();
    if (!isEnabled) return;

    const target = await spoofTarget.getValue();
    const alias = await spoofAlias.getValue();

    if (!target || !alias || target === alias) return;

    // Fast regex for exact target replacement
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
    const observer = new MutationObserver((mutations) => {
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
  }
});
