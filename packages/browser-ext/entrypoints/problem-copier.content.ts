import { onMessage } from '@b/messaging';
import { defineContentScript } from 'wxt/utils/define-content-script';

export default defineContentScript({
  matches: ['*://*.codeforces.com/*'],
  main() {
    const copyProblem = async () => {
      const problemStatement = document.querySelector('.problem-statement') as HTMLElement;
      if (!problemStatement) {
        showToast('No problem statement found on this page.', true);
        return;
      }

      try {
          const clone = problemStatement.cloneNode(true) as HTMLElement;
          
          // Restore original TeX from script tags
          clone.querySelectorAll('script[type^="math/tex"]').forEach(script => {
            const isBlock = script.getAttribute('type')?.includes('mode=display');
            const tex = script.textContent || '';
            const textNode = document.createTextNode(isBlock ? `\n$$${tex}$$\n` : `$${tex}$`);
            script.parentNode?.replaceChild(textNode, script);
          });

          // Remove all MathJax visual renders to prevent duplicate math text
          clone.querySelectorAll('[class*="MathJax"]').forEach(el => el.remove());

          // Temporarily append to DOM to get accurate innerText with layout/newlines
          clone.style.position = 'absolute';
          clone.style.left = '-99999px';
          clone.style.top = '-99999px';
          document.body.appendChild(clone);
          
          const textToCopy = clone.innerText;
          document.body.removeChild(clone);

        try {
          await navigator.clipboard.writeText(textToCopy);
          showToast('Copied');
        } catch (err) {
          // Fallback for when document is not focused (especially via extension shortcuts)
          try {
            const textArea = document.createElement('textarea');
            textArea.value = textToCopy;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            if (successful) {
              showToast('Copied');
            } else {
              throw new Error('Fallback copy failed');
            }
          } catch (fallbackErr) {
            showToast('Failed', true);
            console.error('CPBuddy: Failed to copy text', err, fallbackErr);
          }
        }
      } catch (err) {
        showToast('Failed', true);
        console.error('CPBuddy: Failed to copy text', err);
      }
    };

    window.addEventListener('keydown', async (e) => {
      // Keep the DOM listener as a fallback
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        await copyProblem();
      }
    });

    onMessage('copyProblemShortcut', async () => {
      await copyProblem();
    });

    function showToast(message: string, isError = false) {
      const existing = document.getElementById('cpbuddy-action-pill');
      if (existing) existing.remove();

      const toast = document.createElement('div');
      toast.id = 'cpbuddy-action-pill';
      toast.textContent = message;
      Object.assign(toast.style, {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        padding: '5px 14px',
        backgroundColor: '#000000',
        color: isError ? '#ff5555' : '#50fa7b',
        border: `1px solid ${isError ? 'rgba(255, 85, 85, 0.45)' : 'rgba(80, 250, 123, 0.45)'}`,
        borderRadius: '9999px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif',
        fontSize: '12px',
        fontWeight: '600',
        letterSpacing: '0.03em',
        boxShadow: `0 4px 20px rgba(0, 0, 0, 0.8), 0 0 12px ${isError ? 'rgba(255, 85, 85, 0.2)' : 'rgba(80, 250, 123, 0.2)'}`,
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
    }
  },
});
