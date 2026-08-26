import { defineContentScript } from 'wxt/utils/define-content-script';
import { enableAmoledTheme } from '@b/settings';
import amoledCss from '../assets/amoled.css?raw';

export default defineContentScript({
  matches: ['*://*.codeforces.com/*'],
  runAt: 'document_start',
  main() {
    let styleElement: HTMLStyleElement | null = null;

    const applyTheme = (enabled: boolean) => {
      if (enabled) {
        if (!styleElement) {
          styleElement = document.createElement('style');
          styleElement.id = 'cpbuddy-amoled-theme';
          styleElement.textContent = amoledCss;
          (document.head || document.documentElement).appendChild(styleElement);
        }
      } else {
        if (styleElement) {
          styleElement.remove();
          styleElement = null;
        }
      }
    };

    let observer: MutationObserver | null = null;
    const setupEnforcers = () => {
      if (observer) return; // already set up
      
      const enforceStyles = () => {
        if (observer) observer.disconnect();

        if (window.location.pathname.includes('/status') || window.location.pathname.includes('/submissions/')) {
            document.body.classList.add('page-status');
        }
        
        // Enforce red active tabs
        const activeTabs = document.querySelectorAll('.second-level-menu-list li.current a, .second-level-menu-list li.current span, li.current > a, li.current > span, li.active > a, li.active > span, li.selected > a, li.selected > span');
        activeTabs.forEach(tab => {
          if (tab instanceof HTMLElement) {
            tab.style.setProperty('color', '#ff0000', 'important');
          }
        });
        
        // Normalize inline backgrounds (Codeforces natively uses them for solving ANY problem, which user dislikes)
        document.querySelectorAll('.datatable td.state, .rtable td, .rtable tr, .datatable tr').forEach(el => {
            if (el instanceof HTMLElement && el.style.backgroundColor) {
                const bg = el.style.backgroundColor.replace(/\s+/g, '');
                
                // e4fce4 (light green) is Codeforces' native indicator for virtual participations or accepted problems
                if (bg.includes('228,252,228') || bg.includes('#e4fce4')) {
                    el.style.backgroundColor = '';
                } 
                // ddeeff (light blue) is for out-of-contest practice. User wants this hidden.
                else if (bg.includes('221,238,255') || bg.includes('#ddeeff')) {
                    el.style.backgroundColor = ''; 
                } 
                // e4f1fb (another light blue) is for current problem active row
                else if (bg.includes('228,241,251') || bg.includes('#e4f1fb')) {
                    el.style.backgroundColor = ''; 
                }
                else if (el.classList.contains('state') && bg !== 'transparent' && bg !== '') {
                    el.style.backgroundColor = '';
                }
            }
        });

        // Enforce formula image inversion for AMOLED mode (e.g. problem 433/B espresso images)
        document.querySelectorAll('img.tex-formula, img.tex-graphics, .problem-statement img, .ttypography img').forEach(img => {
            if (img instanceof HTMLImageElement) {
                const src = img.getAttribute('src') || '';
                if (img.classList.contains('tex-formula') || img.classList.contains('tex-graphics') || src.includes('espresso')) {
                    img.style.setProperty('filter', 'invert(1) brightness(1.2)', 'important');
                    img.style.setProperty('-webkit-filter', 'invert(1) brightness(1.2)', 'important');
                    img.style.setProperty('background', 'transparent', 'important');
                }
            }
        });

        // Enforce dark theme on current problem row directly
        document.querySelectorAll('.currentProblem').forEach(el => {
            const tr = el.closest('tr');
            if (tr) {
                tr.classList.add('cpbuddy-current-problem');
                tr.querySelectorAll('td').forEach(td => {
                    td.style.setProperty('background-color', '#0b1a2b', 'important');
                });
            }
        });

        if (observer) {
            observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
        }
      };
      
      const highlightParticipatedContests = async () => {
          if (!window.location.pathname.startsWith('/contests')) return;
          const handleLink = document.querySelector('.lang-chooser a[href^="/profile/"]');
          if (!handleLink) return;
          
          let handle = '';
          
          // 1. Best method: read the REAL username directly from CPBuddy's spoof settings
          try {
              const spoofCache = JSON.parse(localStorage.getItem('cpbuddy_spoof_cache') || '{}');
              if (spoofCache.isEnabled && spoofCache.target) {
                  handle = spoofCache.target; 
              }
          } catch(e) {}
          
          // 2. Fallback method: try to extract from href attribute
          if (!handle) {
              const href = handleLink.getAttribute('href') || '';
              handle = href.split('/profile/')[1];
              if (handle) {
                  handle = handle.replace(/[\/\?#].*$/, '').trim();
              }
          }
          
          // 3. Final fallback: read raw text on screen
          if (!handle) handle = handleLink.textContent?.trim() || '';
          if (!handle) return;
          
          try {
              const cacheKey = `cpbuddy_participated_v3_${handle}`;
              const cachedString = localStorage.getItem(cacheKey);
              let participatedSet = new Set<string>();
              
              if (cachedString) {
                  try {
                      const parsed = JSON.parse(cachedString);
                      if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
                          participatedSet = new Set((parsed.contests || []).map(String));
                      }
                  } catch(e) {}
              }
              
              if (participatedSet.size === 0) {
                  const res = await fetch(`https://codeforces.com/api/user.rating?handle=${handle}`);
                  const data = await res.json();
                  if (data.status === 'OK') {
                      const contests = data.result.map((r: any) => String(r.contestId));
                      participatedSet = new Set(contests);
                      localStorage.setItem(cacheKey, JSON.stringify({
                          timestamp: Date.now(),
                          contests: contests
                      }));
                  }
              }
              
              document.querySelectorAll('.datatable tr[data-contestid]').forEach(tr => {
                  const cid = tr.getAttribute('data-contestid');
                  if (cid && participatedSet.has(String(cid))) {
                      tr.classList.add('cpbuddy-row-green');
                      tr.querySelectorAll('td').forEach(td => {
                          td.style.setProperty('background-color', '#0b2411', 'important');
                      });
                  }
              });
          } catch (e) {
              console.error("Failed cache logic for highlights", e);
          }
      };
      
      const initObserver = () => {
        enforceStyles();
        highlightParticipatedContests();
        observer = new MutationObserver(enforceStyles);
        observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] });
      };

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initObserver);
      } else {
        initObserver();
      }
    };

    // Prevent FOUC by reading from synchronous localStorage cache
    const cacheKey = 'cpbuddy_cache_theme_enabled';
    const cachedState = localStorage.getItem(cacheKey);
    if (cachedState === 'true') {
      applyTheme(true);
      setupEnforcers();
    }

    // Initial load from extension storage (async)
    enableAmoledTheme.getValue().then((enabled) => {
      localStorage.setItem(cacheKey, String(enabled));
      if (cachedState !== String(enabled)) {
        applyTheme(enabled);
        if (enabled) setupEnforcers();
      }
    });

    // Watch for changes from options page
    enableAmoledTheme.watch((enabled) => {
      localStorage.setItem(cacheKey, String(enabled));
      applyTheme(enabled);
      if (enabled) setupEnforcers();
    });
  },
});
