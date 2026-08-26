import { defineContentScript } from 'wxt/utils/define-content-script';
import { showLiveSolves } from '@b/settings';

export default defineContentScript({
  matches: ['*://*.codeforces.com/*', '*://codeforces.com/*'],
  main() {
    const match = window.location.pathname.match(/\/(?:contest|gym)\/(\d+)\/problem\//);
    if (!match) return;
    const contestId = match[1];
    const isGym = window.location.pathname.includes('/gym/');

    let solvesBox: HTMLDivElement | null = null;
    let solvesTbody: HTMLTableSectionElement | null = null;
    let timer: any = null;

    function createBox() {
      const sidebar = document.getElementById('sidebar');
      if (!sidebar) return;

      if (document.getElementById('cpbuddy-live-solves-box')) {
        solvesBox = document.getElementById('cpbuddy-live-solves-box') as HTMLDivElement;
        solvesTbody = document.getElementById('cpbuddy-live-solves-tbody') as HTMLTableSectionElement;
        return;
      }

      solvesBox = document.createElement('div');
      solvesBox.id = 'cpbuddy-live-solves-box';
      solvesBox.className = 'roundbox sidebox borderTopRound cpbuddy-live-solves';
      solvesBox.style.marginTop = '1em';

      solvesBox.innerHTML = `
        <div class="caption titled">&rarr; Live Solves<div class="top-links"></div></div>
        <table class="rtable">
          <tbody id="cpbuddy-live-solves-tbody">
            <tr><th class="left">#</th><th>Solves</th></tr>
            <tr><td colspan="2" style="text-align: center; color: #888;">Loading...</td></tr>
          </tbody>
        </table>
      `;

      solvesTbody = solvesBox.querySelector('#cpbuddy-live-solves-tbody');

      const firstBox = sidebar.querySelector('.roundbox');
      if (firstBox) {
        sidebar.insertBefore(solvesBox, firstBox.nextSibling);
      } else {
        sidebar.appendChild(solvesBox);
      }
    }

    function removeBox() {
      if (solvesBox) {
        solvesBox.remove();
        solvesBox = null;
        solvesTbody = null;
      } else {
        const el = document.getElementById('cpbuddy-live-solves-box');
        if (el) el.remove();
      }
    }

    function updateBox(solves: Record<string, number>) {
      if (!solvesTbody || !document.body.contains(solvesTbody)) {
        createBox();
      }
      if (!solvesTbody) return;

      let html = '<tr><th class="left">#</th><th>Solves</th></tr>';

      const keys = Object.keys(solves).sort();
      if (keys.length === 0) {
        html += '<tr><td colspan="2" style="text-align: center; color: #888;">No data</td></tr>';
      } else {
        for (const key of keys) {
          html += `
            <tr>
              <td class="left" style="font-weight: bold; width: 30%;">${key}</td>
              <td style="color: #2196F3; font-weight: bold;">
                <span style="font-size: 1.1em; margin-right: 4px;">&#128100;</span>
                x${solves[key]}
              </td>
            </tr>
          `;
        }
      }

      solvesTbody.innerHTML = html;
    }

    async function fetchSolves() {
      try {
        const url = `${window.location.origin}${isGym ? '/gym/' : '/contest/'}${contestId}`;
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) return;
        const html = await res.text();

        const doc = new DOMParser().parseFromString(html, 'text/html');
        const rows = doc.querySelectorAll('table.problems tr');

        const solves: Record<string, number> = {};

        rows.forEach((row) => {
          const idEl = row.querySelector('td.id a') || row.querySelector('td.id');
          if (!idEl) return;
          const id = idEl.textContent?.trim() || '';
          if (!id) return;

          const tds = row.querySelectorAll('td');
          if (tds.length > 0) {
            const lastTd = tds[tds.length - 1];
            const text = lastTd.textContent?.trim() || '';
            const match = text.match(/\d+/);
            solves[id] = match ? parseInt(match[0], 10) : 0;
          } else {
            solves[id] = 0;
          }
        });

        if (Object.keys(solves).length > 0) {
          updateBox(solves);
        }
      } catch (err) {
        console.error('[CPBuddy] Failed to fetch live solves:', err);
      }
    }

    const startFeature = () => {
      createBox();
      fetchSolves();
      if (!timer) {
        timer = setInterval(fetchSolves, 10000);
      }
    };

    const stopFeature = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      removeBox();
    };

    showLiveSolves.getValue().then((enabled) => {
      if (enabled) startFeature();
    });

    showLiveSolves.watch((enabled) => {
      if (enabled) startFeature();
      else stopFeature();
    });
  },
});
