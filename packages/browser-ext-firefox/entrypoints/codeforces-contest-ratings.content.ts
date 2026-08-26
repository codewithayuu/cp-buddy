import { defineContentScript } from 'wxt/utils/define-content-script';
import { sendMessage } from '@b/messaging';

function getRatingColor(rating: number): string {
  if (rating < 1200) return '#CCCCCC'; // Gray
  if (rating < 1400) return '#77FF77'; // Green
  if (rating < 1600) return '#77DDBB'; // Cyan
  if (rating < 1900) return '#AAAAFF'; // Blue
  if (rating < 2100) return '#FF88FF'; // Violet
  if (rating < 2400) return '#FFCC88'; // Orange
  return '#FF7777'; // Red
}

export default defineContentScript({
  matches: ['*://*.codeforces.com/*'],
  runAt: 'document_idle',
  async main() {
    const allRatings = await sendMessage('fetchProblemRatings', undefined);
    if (!allRatings) return;

    // 1. Contest Dashboard Table
    const problemsTable = document.querySelector('table.problems');
    if (problemsTable) {
      const contestMatch = window.location.pathname.match(/\/(contest|gym)\/(\d+)/);
      if (contestMatch) {
        const contestId = parseInt(contestMatch[2], 10);
        
        const thead = problemsTable.querySelector('tr:first-child');
        if (thead) {
          const ratingTh = document.createElement('th');
          ratingTh.style.width = '4em';
          ratingTh.style.textAlign = 'center';
          ratingTh.innerHTML = '<span style="color: #888; font-size: 1.2rem;" title="Difficulty Rating">Rating</span>';
          thead.appendChild(ratingTh); // Appended at the end
        }

        const rows = problemsTable.querySelectorAll('tr:not(:first-child)');
        rows.forEach(row => {
          const idTd = row.querySelector('td.id a');
          const index = idTd?.textContent?.trim() || '';
          
          let rating: number | undefined;
          let isPredicted = false;
          
          const ratingObj = allRatings[`${contestId}_${index}`];
          if (ratingObj) {
             rating = ratingObj.rating;
             isPredicted = ratingObj.isPredicted;
          }
          
          if (!rating) {
            const tds = row.querySelectorAll('td');
            if (tds.length > 0) {
              const lastTd = tds[tds.length - 1];
              const match = lastTd.textContent?.match(/x?\s*(\d+)/);
              if (match) {
                const solves = parseInt(match[1], 10);
                if (solves > 0) {
                  rating = Math.max(800, Math.round((4000 - 350 * Math.log(solves)) / 100) * 100);
                  isPredicted = true;
                }
              }
            }
          }
          
          const ratingTd = document.createElement('td');
          ratingTd.style.textAlign = 'center';
          ratingTd.style.verticalAlign = 'middle';
          
          if (rating) {
            const span = document.createElement('span');
            span.innerHTML = isPredicted ? `${rating}<sup style="font-size: 0.8em; margin-left: 2px;">*</sup>` : rating.toString();
            span.style.color = getRatingColor(rating);
            span.style.fontWeight = 'bold';
            span.style.fontSize = '1.2rem';
            if (isPredicted) {
              span.title = 'Predicted Rating (based on solve count)';
            }
            ratingTd.appendChild(span);
          } else {
            const span = document.createElement('span');
            span.textContent = '-';
            span.style.color = '#555';
            span.style.fontSize = '1.2rem';
            ratingTd.appendChild(span);
          }
          
          row.appendChild(ratingTd); // Appended at the end
        });
      }
    }

    // 1b. Problemset Native Column Colorizer & Shifter
    const isProblemset = window.location.pathname.startsWith('/problemset');
    if (isProblemset && problemsTable) {
      const thead = problemsTable.querySelector('tr:first-child');
      if (thead) {
        const ths = Array.from(thead.querySelectorAll('th'));
        let diffIdx = -1;
        for (let i = 0; i < ths.length; i++) {
          if (ths[i].querySelector('a[href*="order=BY_RATING"]')) {
            diffIdx = i;
            break;
          }
        }
        
        if (diffIdx !== -1 && diffIdx < ths.length - 1) {
          thead.appendChild(ths[diffIdx]);
          
          const rows = problemsTable.querySelectorAll('tr:not(:first-child)');
          rows.forEach(row => {
            const tds = row.querySelectorAll('td');
            if (tds.length > diffIdx) {
              const diffTd = tds[diffIdx];
              row.appendChild(diffTd);
              
              const ratingText = diffTd.textContent?.trim();
              if (ratingText) {
                const rating = parseInt(ratingText, 10);
                // Problemset table natively shows official ratings. 
                // But just in case, we colorize it the same way.
                if (!isNaN(rating)) {
                  const color = getRatingColor(rating);
                  
                  diffTd.style.setProperty('color', color, 'important');
                  diffTd.style.setProperty('font-weight', 'bold', 'important');
                  diffTd.style.setProperty('font-size', '1.2rem', 'important');
                  
                  const span = diffTd.querySelector('span');
                  if (span) {
                    span.style.setProperty('color', color, 'important');
                    span.style.setProperty('font-weight', 'bold', 'important');
                    span.style.setProperty('font-size', '1.2rem', 'important');
                  }
                }
              }
            }
          });
        }
      }
    }

    // 2. Submissions / Status Table
    const statusTable = document.querySelector('table.status-frame-datatable');
    if (statusTable) {
      const thead = statusTable.querySelector('tr:first-child');
      if (thead) {
        const ratingTh = document.createElement('th');
        ratingTh.style.width = '4em';
        ratingTh.style.textAlign = 'center';
        ratingTh.innerHTML = 'Rating';
        thead.appendChild(ratingTh); // Appended at the end
      }

      const rows = statusTable.querySelectorAll('tr:not(:first-child)');
      rows.forEach(row => {
        const problemLink = row.querySelector('a[href*="/problem/"]');
        let rating: number | undefined;
        let isPredicted = false;

        if (problemLink) {
          const href = problemLink.getAttribute('href') || '';
          const match = href.match(/\/(contest|gym|problemset\/problem)\/(\d+)\/(problem\/)?([A-Za-z0-9]+)/);
          if (match) {
            const cId = match[2];
            const pIdx = match[4];
            const ratingObj = allRatings[`${cId}_${pIdx}`];
            if (ratingObj) {
              rating = ratingObj.rating;
              isPredicted = ratingObj.isPredicted;
            }
          }
        }
        
        const ratingTd = document.createElement('td');
        ratingTd.style.textAlign = 'center';
        ratingTd.style.verticalAlign = 'middle';
        
        if (rating) {
          const span = document.createElement('span');
          span.innerHTML = isPredicted ? `${rating}<sup style="font-size: 0.8em; margin-left: 1px;">*</sup>` : rating.toString();
          span.style.color = getRatingColor(rating);
          span.style.fontWeight = 'bold';
          if (isPredicted) {
            span.title = 'Predicted Rating (based on global solve count)';
          }
          ratingTd.appendChild(span);
        } else {
          ratingTd.textContent = '-';
        }
        
        row.appendChild(ratingTd); // Appended at the end
      });
    }
  }
});
