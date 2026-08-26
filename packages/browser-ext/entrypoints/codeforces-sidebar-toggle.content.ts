import { defineContentScript } from 'wxt/utils/define-content-script';

export default defineContentScript({
  matches: ['*://*.codeforces.com/*'],
  runAt: 'document_start',
  main() {
    // Inject CSS immediately to prevent blinking
    const style = document.createElement('style');
    style.textContent = `
      html.cpbuddy-sidebar-hidden #sidebar {
        display: none !important;
      }
      html.cpbuddy-sidebar-hidden #pageContent {
        margin-right: 1em !important;
        width: auto !important;
      }
      .lang-chooser > div:first-child {
        display: none !important;
      }
      .cpbuddy-sidebar-toggle-wrapper {
        display: flex;
        justify-content: flex-end;
        margin-top: 25px; /* Shifted further down towards search bar */
      }
      .cpbuddy-sidebar-toggle-btn {
        padding: 4px 8px; /* Smaller, compact button */
        font-size: 11px;
        background-color: #3b5998;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        font-weight: bold;
        z-index: 999;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        transition: opacity 0.2s, background-color 0.2s;
      }
      .cpbuddy-sidebar-toggle-btn:hover {
        opacity: 0.85;
      }
      /* AMOLED compatibility */
      html[data-theme="dark"] .cpbuddy-sidebar-toggle-btn {
        background-color: #1f6feb;
        color: #ffffff;
      }
      
      /* Box Collapse Styles */
      .cpbuddy-collapsed > *:not(.roundbox-lt):not(.roundbox-rt):not(.caption) {
        display: none !important;
      }
      .cpbuddy-box-toggle {
        cursor: pointer;
        font-size: 12px;
        color: #888;
        padding: 0 4px;
        margin-right: 4px;
        transition: color 0.2s;
        line-height: 1;
        display: inline-block;
      }
      .cpbuddy-box-toggle:hover {
        color: #333;
      }
      html[data-theme="dark"] .cpbuddy-box-toggle:hover {
        color: #fff;
      }
    `;
    (document.head || document.documentElement).appendChild(style);

    // Apply hidden class immediately based on storage
    const isHidden = localStorage.getItem('cpbuddy-sidebar-hidden') === 'true';
    if (isHidden) {
      document.documentElement.classList.add('cpbuddy-sidebar-hidden');
    }

    // Prevent FOUC for collapsed sidebar boxes
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            
            const processCaption = (caption: Element) => {
              const box = caption.closest('.roundbox.sidebox');
              if (box) {
                let rawTitle = caption.textContent?.replace(/▼|▲|›/g, '').trim() || '';
                const topLinks = caption.querySelector('.top-links');
                if (topLinks && topLinks.textContent) {
                  rawTitle = rawTitle.replace(topLinks.textContent.trim(), '').trim();
                }
                const titleText = rawTitle.replace(/[^a-zA-Z0-9]/g, '');
                if (titleText) {
                  const storageKey = `cpbuddy-collapsed-${titleText}`;
                  if (localStorage.getItem(storageKey) === 'true') {
                    box.classList.add('cpbuddy-collapsed');
                  }
                }
              }
            };

            if (el.classList?.contains('caption') && el.classList?.contains('titled')) {
              processCaption(el);
            } else if (el.querySelectorAll) {
              const captions = el.querySelectorAll('.caption.titled');
              captions.forEach(processCaption);
            }
          }
        }
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    // Wait for DOM to be ready to inject the button
    document.addEventListener('DOMContentLoaded', () => {
      observer.disconnect();
      const sidebar = document.getElementById('sidebar');
      if (!sidebar) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'cpbuddy-sidebar-toggle-wrapper';
      
      const btn = document.createElement('button');
      btn.className = 'cpbuddy-sidebar-toggle-btn';
      btn.innerHTML = isHidden ? 'Show' : 'Hide';
      
      wrapper.appendChild(btn);
      
      const langChooser = document.querySelector('.lang-chooser');
      if (langChooser) {
        langChooser.appendChild(wrapper);
      } else {
        sidebar.parentNode?.insertBefore(wrapper, sidebar);
        sidebar.style.clear = 'right';
      }

      btn.addEventListener('click', () => {
        const hiding = !document.documentElement.classList.contains('cpbuddy-sidebar-hidden');
        if (hiding) {
          document.documentElement.classList.add('cpbuddy-sidebar-hidden');
          btn.innerHTML = 'Show';
          localStorage.setItem('cpbuddy-sidebar-hidden', 'true');
        } else {
          document.documentElement.classList.remove('cpbuddy-sidebar-hidden');
          btn.innerHTML = 'Hide';
          localStorage.setItem('cpbuddy-sidebar-hidden', 'false');
        }
        window.dispatchEvent(new Event('resize'));
      });

      function setupBox(box: Element) {
        if (box.hasAttribute('data-cpbuddy-toggled')) return;
        box.setAttribute('data-cpbuddy-toggled', 'true');

        const caption = box.querySelector('.caption.titled');
        if (!caption) return;
        
        // Check if box is a known link-only box that shouldn't be collapsible
        const rawTitleForCheck = caption.textContent?.toLowerCase() || '';
        if (rawTitleForCheck.includes('virtual participation') || rawTitleForCheck.includes('clone contest to mashup') || rawTitleForCheck.includes('submit?')) {
          if (!rawTitleForCheck.includes('submit?')) {
             return; // Skip adding collapse logic to these boxes, except we still want it on submit. Wait, user specifically didn't want it on VP and Mashup.
          }
        }

        // Extract the title text to use as a storage key
        let rawTitle = caption.textContent?.replace(/▼|▲/g, '').trim() || '';
        // Remove top-links text from title
        const topLinks = caption.querySelector('.top-links');
        if (topLinks && topLinks.textContent) {
          rawTitle = rawTitle.replace(topLinks.textContent.trim(), '').trim();
        }
        const titleText = rawTitle.replace(/[^a-zA-Z0-9]/g, '');
        const storageKey = `cpbuddy-collapsed-${titleText}`;
        const isCollapsed = localStorage.getItem(storageKey) === 'true';
        
        if (isCollapsed) {
          box.classList.add('cpbuddy-collapsed');
        }

        const iconClassExpanded = 'sidebar-caption-icon las la-angle-down cpbuddy-box-toggle';
        const iconClassCollapsed = 'sidebar-caption-icon las la-angle-right cpbuddy-box-toggle';

        const toggleBtn = document.createElement('i');
        toggleBtn.className = isCollapsed ? iconClassCollapsed : iconClassExpanded;
        toggleBtn.title = isCollapsed ? 'Expand' : 'Minimize';
        toggleBtn.style.cursor = 'pointer';
        // Explicitly force float right
        toggleBtn.style.float = 'right';
        
        if (topLinks) {
          caption.insertBefore(toggleBtn, topLinks);
        } else {
          caption.appendChild(toggleBtn);
        }

        toggleBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const collapsing = !box.classList.contains('cpbuddy-collapsed');
          if (collapsing) {
            box.classList.add('cpbuddy-collapsed');
            toggleBtn.className = iconClassCollapsed;
            toggleBtn.title = 'Expand';
            localStorage.setItem(storageKey, 'true');
          } else {
            box.classList.remove('cpbuddy-collapsed');
            toggleBtn.className = iconClassExpanded;
            toggleBtn.title = 'Minimize';
            localStorage.setItem(storageKey, 'false');
          }
        });
      }

      // Add minimize buttons to all initial sidebar boxes
      const boxes = document.querySelectorAll('#sidebar .roundbox.sidebox');
      boxes.forEach((box) => setupBox(box));

      // Observe for new boxes (e.g. Live Solves, Problem Ratings added async)
      const sidebarObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node as HTMLElement;
              if (el.classList && el.classList.contains('sidebox')) {
                setupBox(el);
              }
            }
          });
        });
      });
      sidebarObserver.observe(sidebar, { childList: true });
    });
  },
});
