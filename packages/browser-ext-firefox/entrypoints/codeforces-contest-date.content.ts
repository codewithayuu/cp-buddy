import { defineContentScript } from 'wxt/utils/define-content-script';
import { showContestDate } from '@b/settings';
import { storage } from 'wxt/utils/storage';

export default defineContentScript({
  matches: ['*://*.codeforces.com/contest/*', '*://*.codeforces.com/gym/*', '*://*.codeforces.com/problemset/problem/*'],
  runAt: 'document_idle',
  main() {
    showContestDate.getValue().then((enabled) => {
      if (!enabled) return;

      const match = window.location.pathname.match(/\/(contest|gym|problemset\/problem)\/(\d+)/);
      if (!match) return;

      const contestId = match[2];

      // Find the sidebar contest table by looking for the contest link
      const sidebarTables = document.querySelectorAll('.roundbox.sidebox table, table.rtable');
      let targetTable: HTMLTableElement | null = null;
      let titleRow: HTMLTableRowElement | null = null;

      for (const table of sidebarTables) {
        const link = table.querySelector(`a[href*="/contest/${contestId}"], a[href*="/gym/${contestId}"]`);
        if (link) {
          targetTable = table as HTMLTableElement;
          titleRow = link.closest('tr');
          break;
        }
      }

      if (!targetTable || !titleRow) return;

      // Don't add twice
      if (document.getElementById('cpbuddy-contest-date-row')) return;

      function renderDate(startTimeSeconds: number) {
        const date = new Date(startTimeSeconds * 1000);
        
        // Format nicely
        const options: Intl.DateTimeFormatOptions = { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        };
        const formattedDate = date.toLocaleDateString('en-US', options);

        // Create row
        const tr = document.createElement('tr');
        tr.id = 'cpbuddy-contest-date-row';
        
        const td = document.createElement('td');
        td.colSpan = 2;
        td.className = 'left';
        td.style.textAlign = 'center';
        td.style.fontSize = '0.9em';
        td.style.color = '#888888';
        td.style.padding = '4px';
        td.style.borderBottom = '1px solid #222222';
        
        td.textContent = formattedDate;
        
        tr.appendChild(td);

        // Insert directly after the title row
        if (titleRow!.nextSibling) {
          titleRow!.parentNode?.insertBefore(tr, titleRow!.nextSibling);
        } else {
          titleRow!.parentNode?.appendChild(tr);
        }
      }

      const cacheKey = `local:cf_contest_date_${contestId}`;
      
      storage.getItem(cacheKey).then((cachedTime) => {
        if (cachedTime) {
          renderDate(cachedTime as number);
          return;
        }

        const isGym = window.location.pathname.includes('/gym/');
        const apiUrl = isGym 
          ? 'https://codeforces.com/api/contest.list?gym=true'
          : 'https://codeforces.com/api/contest.list?gym=false';

        fetch(apiUrl)
          .then(res => res.json())
          .then(data => {
            if (data.status === 'OK') {
              const contest = data.result.find((c: any) => c.id === Number(contestId));
              if (contest && contest.startTimeSeconds) {
                const startTimeSeconds = contest.startTimeSeconds;
                storage.setItem(cacheKey, startTimeSeconds);
                renderDate(startTimeSeconds);
              }
            }
          })
          .catch(err => {
            console.error('[CPBuddy] Failed to fetch contest date', err);
          });
      });
    });
  },
});
