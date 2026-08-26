import { defineContentScript } from 'wxt/utils/define-content-script';
import { problemRatingsData } from '@b/settings';
import { storage } from 'wxt/utils/storage';

export default defineContentScript({
  matches: ['*://*.codeforces.com/contest/*/problem/*', '*://*.codeforces.com/problemset/problem/*'],
  runAt: 'document_idle',
  main() {
    initProblemRating();
  },
});

function getProblemSignature(url: string) {
  // Try to extract contest ID and problem index
  const match = url.match(/(?:contest|gym)\/(\d+)\/problem\/([A-Za-z0-9]+)/) || 
                url.match(/problemset\/problem\/(\d+)\/([A-Za-z0-9]+)/);
  if (match) {
    return `${match[1]}-${match[2].toUpperCase()}`;
  }
  
  // Fallback: just return the normalized pathname
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    let cleanUrl = urlObj.hostname.replace('www.', '') + urlObj.pathname;
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    return cleanUrl.toLowerCase();
  } catch (e) {
    return url.toLowerCase().trim();
  }
}

async function getTimerTime(currentSig: string) {
  try {
    const timerId = currentSig.replace('-', '_');
    const timerData = await storage.getItem(`local:cftimer_${timerId}`);
    if (timerData && (timerData as any).elapsedMs) {
      const ms = (timerData as any).elapsedMs;
      const mins = Math.floor(ms / 60000);
      const secs = Math.floor((ms % 60000) / 1000);
      return `${mins}m ${secs}s`;
    }
  } catch (e) {
    // Ignore error
  }
  return null;
}

function scrapeProblemDetails() {
  const details: any = { url: window.location.href };
  
  const titleEl = document.querySelector('.problem-statement .header .title');
  if (titleEl) {
    details.problemName = titleEl.textContent?.trim();
  }
  
  const tagEl = document.querySelector('.tag-box[title="Difficulty"]');
  if (tagEl) {
    details.cfRating = tagEl.textContent?.replace('*', '').trim();
  }
  
  return details;
}

async function initProblemRating() {
  const url = window.location.href;
  const isProblemPage = url.match(/(?:contest|gym)\/\d+\/problem\/[A-Za-z0-9]+/) || 
                        url.match(/problemset\/problem\/\d+\/[A-Za-z0-9]+/);
  if (!isProblemPage) return;

  const currentSig = getProblemSignature(url);

  // Wait for sidebar to exist
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  // Prevent duplicate boxes
  if (document.querySelector('.cpbuddy-problem-rating')) return;

  const ratingsData = (await problemRatingsData.getValue()) || {};
  let problemInfo: any = null;
  
  for (const [key, value] of Object.entries(ratingsData)) {
    if (key === currentSig || getProblemSignature(key) === currentSig) {
      problemInfo = value;
      break;
    }
  }

  // If no problemInfo found, start with empty structure
  if (!problemInfo) {
    problemInfo = { rating: 0 };
  }

  // Create the widget
  const box = document.createElement('div');
  box.className = 'roundbox sidebox borderTopRound cpbuddy-problem-rating';
  
  const caption = document.createElement('div');
  caption.className = 'caption titled';
  caption.innerHTML = '&rarr; Difficulty';
  
  const topLinks = document.createElement('div');
  topLinks.className = 'top-links';
  caption.appendChild(topLinks);
  
  box.appendChild(caption);

  const content = document.createElement('div');
  content.style.padding = '0.2em 1em';
  content.style.display = 'flex';
  content.style.flexDirection = 'column';

  // Render Stars
  let ratingVal = typeof problemInfo.rating === 'number' ? problemInfo.rating : parseFloat(String(problemInfo.rating)) || 0;
  
  const starsContainer = document.createElement('div');
  starsContainer.style.display = 'flex';
  starsContainer.style.justifyContent = 'center';
  starsContainer.style.alignItems = 'center';
  starsContainer.style.padding = '0';
  
  const starsWrapper = document.createElement('div');
  starsWrapper.style.color = '#ff9800'; // Gold color for stars
  starsWrapper.style.fontSize = '2.5rem'; // Even bigger stars
  starsWrapper.style.display = 'flex';
  starsWrapper.style.gap = '12px'; // More spacing to fill width
  starsWrapper.style.cursor = 'pointer';
  starsWrapper.title = `${ratingVal} / 7`;
  starsWrapper.dataset.rating = String(ratingVal);

  const starElements: HTMLElement[] = [];

  function updateStars(rating: number) {
    starElements.forEach((s, idx) => {
      const starIndex = idx + 1;
      if (rating >= starIndex) {
        s.className = 'las la-star';
      } else if (rating >= starIndex - 0.5) {
        s.className = 'las la-star-half-alt';
      } else {
        s.className = 'lar la-star';
      }
    });
  }

  let currentHoverRating = ratingVal;

  for (let i = 1; i <= 7; i++) {
    const star = document.createElement('i');
    
    star.addEventListener('mousemove', (e) => {
      const isHalf = e.offsetX < star.offsetWidth / 2;
      currentHoverRating = isHalf ? i - 0.5 : i;
      updateStars(currentHoverRating);
    });

    star.addEventListener('click', async () => {
      const data = (await problemRatingsData.getValue()) || {};
      let existingInfo = problemInfo || { rating: 0 };
      
      const newRating = existingInfo.rating === currentHoverRating ? 0 : currentHoverRating;
      existingInfo.rating = newRating;
      
      // Merge in scraped details
      const scraped = scrapeProblemDetails();
      existingInfo = { ...existingInfo, ...scraped };
      
      if (!existingInfo.solvedAt) {
        existingInfo.solvedAt = new Date().toISOString();
      }
      
      // If we don't have time yet, pull it from timer
      if (!existingInfo.time) {
         const timerTime = await getTimerTime(currentSig);
         if (timerTime) {
           existingInfo.time = timerTime;
           problemInfo.time = timerTime;
         }
      }
      
      data[currentSig] = existingInfo;
      await problemRatingsData.setValue(data);
      problemInfo = existingInfo;
      
      starsWrapper.title = `${newRating} / 7`;
      starsWrapper.dataset.rating = String(newRating);
      
      // Update visual state immediately
      updateStars(newRating);
      
      // Provide visual feedback (brief color flash)
      starsWrapper.style.color = '#4CAF50'; // Green
      setTimeout(() => { starsWrapper.style.color = '#ff9800'; }, 300);
    });

    starsWrapper.appendChild(star);
    starElements.push(star);
  }
  
  updateStars(ratingVal);
  
  starsWrapper.addEventListener('mouseleave', () => {
    const currentRating = parseFloat(starsWrapper.dataset.rating || '0');
    updateStars(currentRating);
  });

  starsContainer.appendChild(starsWrapper);
  content.appendChild(starsContainer);

  // No time rendering in UI, just stars

  box.appendChild(content);

  // Insert below the first roundbox in the sidebar (usually contest info)
  const firstBox = sidebar.querySelector('.roundbox.sidebox');
  if (firstBox && firstBox.nextSibling) {
    sidebar.insertBefore(box, firstBox.nextSibling);
  } else {
    sidebar.prepend(box);
  }
}
