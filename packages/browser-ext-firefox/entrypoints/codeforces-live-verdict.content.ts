import { defineContentScript } from 'wxt/utils/define-content-script';
import { enableLiveVerdict } from '@b/settings';
import { sendMessage, onMessage } from '@b/messaging';

export default defineContentScript({
  matches: ['*://*.codeforces.com/*'],
  runAt: 'document_idle',
  main() {
    enableLiveVerdict.getValue().then((enabled) => {
      if (!enabled) return;

      const POLL_INTERVAL = 2500;
      const MAX_QUEUE = 1000;
      const STABLE_OK_BREAK = 20;
      const DRAG_THRESHOLD = 6;
      const STORAGE_KEY = 'cpbuddy_lastVerdict';
      const POS_KEY = 'cpbuddy_badgePos';
      const MIN_KEY = 'cpbuddy_badgeMinimized';

      let badge: HTMLDivElement | null = null;
      let badgeText: HTMLSpanElement | null = null;
      let timer: number | null = null;
      let currentSubLink: string | null = null;
      let dismissed = false;
      let submitTime = 0;
      
      // Track the ID of the last submission we dismissed
      let currentSubId: number | null = null;

      function getDismissedSubId() {
        try {
          return Number(localStorage.getItem('cpbuddy_dismissedSubId')) || 0;
        } catch {
          return 0;
        }
      }

      function pollNow() {
        if (dismissed) return;
        poll();
      }

      window.addEventListener('pagehide', () => {
        if (timer) window.clearInterval(timer);
      });

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          if (timer) window.clearInterval(timer);
        } else {
          if (!dismissed) {
            pollNow();
            timer = window.setInterval(poll, POLL_INTERVAL);
          }
        }
      });

      document.addEventListener('submit', (e) => {
        const form = e.target as HTMLFormElement;
        if (form && !form.querySelector('input[name="sourceFile"], textarea[name="source"]')) {
          return;
        }
        dismissed = false;
        submitTime = Date.now();
        showBadge('Submitting...', 'pending', '');
        saveLastVerdict({ text: 'Submitting...', cls: 'pending', subLink: '' });
        pollNow();
      }, true);

      onMessage('notifySubmit', () => {
        dismissed = false;
        submitTime = Date.now();
        showBadge('Submitting...', 'pending', '');
        saveLastVerdict({ text: 'Submitting...', cls: 'pending', subLink: '' });
        document.dispatchEvent(new CustomEvent('cpbuddy-submit-triggered'));
        pollNow();
      });

      window.addEventListener('storage', (e) => {
        if (e.key === 'cpbuddy_dismissedSubId') {
          if (currentSubId && currentSubId <= getDismissedSubId()) {
            dismissed = true;
            if (badge) badge.style.display = 'none';
            if (timer) window.clearInterval(timer);
          }
        } else if (e.key === STORAGE_KEY && !e.newValue) {
          dismissed = true;
          if (badge) badge.style.display = 'none';
          if (timer) window.clearInterval(timer);
        }
      });

      function getHandle() {
        const el = document.querySelector("a[href^='/profile/']");
        return el ? el.textContent?.trim() : null;
      }

      function saveLastVerdict(data: any) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }

      function loadLastVerdict() {
        try {
          const val = localStorage.getItem(STORAGE_KEY);
          return val ? JSON.parse(val) : null;
        } catch {
          return null;
        }
      }

      function savePos(left: number, top: number) {
        localStorage.setItem(POS_KEY, JSON.stringify({ left, top }));
      }

      function loadPos() {
        try {
          const val = localStorage.getItem(POS_KEY);
          return val ? JSON.parse(val) : null;
        } catch {
          return null;
        }
      }

      function setMinimized(val: boolean) {
        localStorage.setItem(MIN_KEY, val ? '1' : '0');
      }

      function isMinimized() {
        return localStorage.getItem(MIN_KEY) === '1';
      }

      function ensureBadge() {
        if (badge) return;

        badge = document.createElement('div');
        badge.id = 'cpbuddy-live-verdict';
        badge.className = 'cpbuddy-verdict-badge';
        
        badgeText = document.createElement('span');

        const closeBtn = document.createElement('div');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cssText = 'margin-left: 8px; font-size: 14px; cursor: pointer; color: rgba(255,255,255,0.45); line-height: 1; padding: 0 3px; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: color 0.2s, background 0.2s;';
        closeBtn.onmouseenter = () => {
          closeBtn.style.color = '#fff';
          closeBtn.style.background = 'rgba(255,255,255,0.15)';
        };
        closeBtn.onmouseleave = () => {
          closeBtn.style.color = 'rgba(255,255,255,0.45)';
          closeBtn.style.background = 'transparent';
        };
        closeBtn.onclick = (e) => {
          e.stopPropagation();
          dismissed = true;
          if (currentSubId) {
            localStorage.setItem('cpbuddy_dismissedSubId', currentSubId.toString());
          }
          localStorage.removeItem(STORAGE_KEY);
          if (badge) badge.style.display = 'none';
          if (timer) window.clearInterval(timer);
        };

        badge.appendChild(badgeText);
        badge.appendChild(closeBtn);
        document.body.appendChild(badge);

        badge.addEventListener('click', () => {
          if (currentSubLink) window.open(currentSubLink, '_blank');
        });
      }

      function showBadge(text: string, cls: string, subLink: string) {
        if (dismissed) return;
        ensureBadge();
        if (badge) badge.style.display = 'flex';
        if (badgeText) badgeText.textContent = text;
        if (badge) badge.className = `cpbuddy-verdict-badge ${cls}`;
        currentSubLink = subLink;
      }

      const handle = getHandle();
      if (!handle) return;

      const cached = loadLastVerdict();
      if (cached) {
        showBadge(cached.text, cached.cls, cached.subLink);
      }

      function poll() {
        if (dismissed) return;

        fetch(`/problemset/status?my=on`).then(res => res.text()).then(html => {
          const trMatch = html.match(/<tr[^>]*data-submission-id="(\d+)"[^>]*>([\s\S]*?)<\/tr>/);
          if (!trMatch) return;
          
          const tr = trMatch[0];
          const idMatch = tr.match(/data-submission-id="(\d+)"/);
          const verdictMatch = tr.match(/submissionVerdict="([^"]*)"/); 
          const aMatch = tr.match(/<a href="\/[^\/]+\/(\d+)\/problem\/([^"]+)"/);
          
          const spanMatch = tr.match(/<span class="verdict-[^>]*>([\s\S]*?)<\/span>/);
          let verdictText = spanMatch ? spanMatch[1].replace(/<[^>]*>/g, '').trim() : '';
          
          let verdict = verdictMatch ? verdictMatch[1] : '';
          if (!verdict && verdictText) {
             if (verdictText.toLowerCase().includes('in queue')) verdict = 'TESTING';
             else if (verdictText.toLowerCase().includes('testing')) verdict = 'TESTING';
          }
          
          if (!idMatch || !aMatch) return;

          const mySub = {
            id: parseInt(idMatch[1]),
            contestId: parseInt(aMatch[1]),
            problem: { index: aMatch[2], contestId: parseInt(aMatch[1]) },
            verdict: verdict,
            verdictText: verdictText,
            passedTestCount: 0 // Cannot easily parse this from HTML without more regex, but verdictText will contain "Testing on test X"
          };

          currentSubId = mySub.id;

          if (mySub.id <= getDismissedSubId()) {
            if (submitTime && Date.now() - submitTime > 2500) {
              const txt = 'In queue';
              showBadge(txt, 'pending', '');
              saveLastVerdict({ text: txt, cls: 'pending', subLink: '' });
            }
            return; // We already dismissed this submission or a newer one
          }

          function formatVerdict(v: string) {
            if (!v) return 'In queue';
            if (v === 'OK') return 'Accepted';
            if (v === 'TESTING') return 'Testing';
            return v.split('_').map((w, i) => i === 0 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase()).join(' ');
          }

          const isPending = !mySub.verdict || mySub.verdict === 'TESTING';

          let text = '';
          if (mySub.verdict === 'TESTING' && mySub.verdictText) {
            text = mySub.verdictText;
          } else if (mySub.verdict === 'TESTING') {
            text = 'Testing...';
          } else if (!mySub.verdict) {
            text = 'In queue';
          } else {
            text = formatVerdict(mySub.verdict);
          }

          if (mySub.problem?.index) {
            text = `[${mySub.problem.index}] ${text}`;
          }

          const cls =
            mySub.verdict === 'OK'
              ? 'ok'
              : isPending
              ? 'pending'
              : 'fail';

          const subContestId = mySub.contestId;
          const subLink = subContestId
            ? `https://codeforces.com/contest/${subContestId}/submission/${mySub.id}`
            : `https://codeforces.com/problemset/submission/${mySub.id}`;

          const problemId = mySub.problem ? `${mySub.problem.contestId}_${mySub.problem.index}` : '';
          saveLastVerdict({ text, cls, subLink });
          document.dispatchEvent(new CustomEvent('cpbuddy-verdict', { detail: { cls, problemId } }));

          showBadge(text, cls, subLink);
        });
      }

      poll();
      timer = window.setInterval(poll, POLL_INTERVAL);
    });
  },
});
