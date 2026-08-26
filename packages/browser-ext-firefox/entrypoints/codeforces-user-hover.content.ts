import { defineContentScript } from 'wxt/utils/define-content-script';
import { showUserHoverCard } from '../src/settings';

interface UserInfo {
  handle: string;
  avatar: string;
  rank?: string;
  maxRank?: string;
  rating?: number;
  maxRating?: number;
  contribution?: number;
  friendOfCount?: number;
  lastOnlineTimeSeconds?: number;
  registrationTimeSeconds?: number;
  firstName?: string;
  lastName?: string;
  city?: string;
  country?: string;
  organization?: string;
}

export default defineContentScript({
  matches: ['*://codeforces.com/*', '*://codeforces.ml/*'],
  main() {
    let enabled = false;
    showUserHoverCard.getValue().then(val => { enabled = val; });
    showUserHoverCard.watch(val => { enabled = val; });

    const cache = new Map<string, UserInfo>();
    let hoverTimeout: number | null = null;
    let tooltip: HTMLDivElement | null = null;
    let activeElement: HTMLElement | null = null;

    function getRatingColor(rating: number | undefined): { color: string; legendary?: boolean } {
      if (rating === undefined) return { color: '#ffffff' };
      if (rating < 1200) return { color: '#ffffff' }; // Newbie
      if (rating < 1400) return { color: '#39ff14' }; // Pupil
      if (rating < 1600) return { color: '#00e5ff' }; // Specialist
      if (rating < 1900) return { color: '#00bfff' }; // Expert
      if (rating < 2100) return { color: '#e040fb' }; // Candidate Master
      if (rating < 2300) return { color: '#ff9100' }; // Master
      if (rating < 2400) return { color: '#ff9100' }; // International Master
      if (rating < 2600) return { color: '#ff1744' }; // Grandmaster
      if (rating < 3000) return { color: '#ff1744' }; // International Grandmaster
      return { color: '#ff1744', legendary: true }; // Legendary Grandmaster
    }

    function timeAgo(seconds: number) {
      const diff = Math.floor(Date.now() / 1000) - seconds;
      if (diff < 60) return `${diff} seconds ago`;
      const m = Math.floor(diff / 60);
      if (m < 60) return `${m} minutes ago`;
      const h = Math.floor(m / 60);
      if (h < 24) return `${h} hours ago`;
      const d = Math.floor(h / 24);
      if (d < 30) return `${d} days ago`;
      const mo = Math.floor(d / 30);
      if (mo < 12) return `${mo} months ago`;
      return `${Math.floor(mo / 12)} years ago`;
    }

    function createTooltip() {
      if (tooltip) return tooltip;
      tooltip = document.createElement('div');
      tooltip.id = 'cpbuddy-user-tooltip';
      tooltip.style.position = 'absolute';
      tooltip.style.zIndex = '999999';
      tooltip.style.backgroundColor = '#0a0a0a';
      tooltip.style.border = '1px solid #333';
      tooltip.style.borderRadius = '6px';
      tooltip.style.boxShadow = '0 4px 15px rgba(0,0,0,0.5)';
      tooltip.style.color = '#f8f8f8';
      tooltip.style.padding = '8px';
      tooltip.style.width = '280px';
      tooltip.style.fontFamily = 'sans-serif';
      tooltip.style.fontSize = '11px';
      tooltip.style.pointerEvents = 'none';
      tooltip.style.transition = 'opacity 0.2s ease';
      tooltip.style.opacity = '0';
      document.body.appendChild(tooltip);
      return tooltip;
    }

    function hideTooltip() {
      if (tooltip) {
        tooltip.style.opacity = '0';
        tooltip.style.pointerEvents = 'none';
      }
    }

    async function showTooltip(handle: string, e: MouseEvent) {
      const tt = createTooltip();
      tt.innerHTML = '<div style="color: #888">Loading...</div>';
      tt.style.opacity = '1';
      
      let left = e.pageX + 15;
      let top = e.pageY + 15;
      if (left + 310 > document.documentElement.scrollWidth) {
        left = e.pageX - 325;
      }
      tt.style.left = `${left}px`;
      tt.style.top = `${top}px`;

      let user: UserInfo | undefined;
      if (cache.has(handle.toLowerCase())) {
        user = cache.get(handle.toLowerCase());
      } else {
        try {
          const res = await fetch(`https://codeforces.com/api/user.info?handles=${handle}`);
          const data = await res.json();
          if (data.status === 'OK' && data.result.length > 0) {
            user = data.result[0];
            cache.set(handle.toLowerCase(), user!);
          }
        } catch (err) {
          console.error('Hover card fetch error:', err);
        }
      }

      if (!user) {
        tt.innerHTML = '<div style="color: #ff3333">Error loading user info</div>';
        return;
      }

      const { color, legendary } = getRatingColor(user.rating);
      let handleHtml = `<span style="color: ${color}">${user.handle}</span>`;
      if (legendary) {
        handleHtml = `<span style="color: #fff">${user.handle[0]}</span><span style="color: ${color}">${user.handle.slice(1)}</span>`;
      }

      const realNameParts = [user.firstName, user.lastName].filter(Boolean);
      const locParts = [user.city, user.country].filter(Boolean);
      const nameLine = realNameParts.length > 0 || locParts.length > 0 
        ? `<div style="color: #aaa; font-size: 10.5px; margin-bottom: 2px;">
             ${realNameParts.join(' ')}${realNameParts.length > 0 && locParts.length > 0 ? ', ' : ''}
             <span style="color: #4dd0e1">${locParts.join(', ')}</span>
           </div>`
        : '';
      const orgLine = user.organization 
        ? `<div style="color: #aaa; font-size: 10.5px;">From <span style="color: #4dd0e1">${user.organization}</span></div>` 
        : '';

      const contributionColor = (user.contribution || 0) >= 0 ? '#39ff14' : '#ff3333';
      const contributionSign = (user.contribution || 0) > 0 ? '+' : '';

      tt.innerHTML = `
        <div style="display: flex; margin-bottom: 6px;">
          <img src="${user.avatar.startsWith('http') ? user.avatar : 'https:' + user.avatar}" style="width: 48px; height: 48px; border-radius: 4px; margin-right: 8px; object-fit: cover;" />
          <div style="display: flex; flex-direction: column; justify-content: center;">
            <div style="font-weight: bold; font-size: 10px; text-transform: capitalize; color: ${color};">${user.rank || 'Unrated'}</div>
            <div style="font-size: 14px; font-weight: bold; margin: 0 0 2px 0;">${handleHtml}</div>
            ${nameLine}
            ${orgLine}
          </div>
        </div>
        <div style="display: flex; border-top: 1px solid #333; padding-top: 6px;">
          <div style="flex: 1; display: flex; flex-direction: column; gap: 3px;">
            <div><span style="color: #ccc;">Rating:</span> <span style="font-weight: bold; color: ${color};">${user.rating || 0}</span></div>
            <div><span style="color: #ccc;">Max:</span> <span style="font-weight: bold; color: ${getRatingColor(user.maxRating).color};">${user.maxRating || 0}</span></div>
            <div><span style="color: #ccc;">Contribution:</span> <span style="font-weight: bold; color: ${contributionColor};">${contributionSign}${user.contribution || 0}</span></div>
            <div><span style="color: #ccc;">Solved:</span> <span id="cpbuddy-hover-solved" style="color: #fff;">Loading...</span></div>
          </div>
          <div style="flex: 1; display: flex; flex-direction: column; gap: 3px;">
            <div><span style="color: #ccc;">Friend of:</span> <span style="color: #fff;">${user.friendOfCount || 0} users</span></div>
            <div><span style="color: #ccc;">Last visit:</span> <span style="color: #fff;">${user.lastOnlineTimeSeconds ? timeAgo(user.lastOnlineTimeSeconds) : 'N/A'}</span></div>
            <div><span style="color: #ccc;">Registered:</span> <span style="color: #fff;">${user.registrationTimeSeconds ? timeAgo(user.registrationTimeSeconds) : 'N/A'}</span></div>
            <div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 130px;"><span style="color: #ccc;">Last Sub:</span> <span id="cpbuddy-hover-sub" style="color: #fff;">Loading...</span></div>
          </div>
        </div>
      `;

      const cacheKey = `cpbuddy_hover_stats_${handle}`;
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const isReload = navEntry && navEntry.type === 'reload';

      browser.storage.local.get(cacheKey).then(cachedData => {
          const stats = cachedData[cacheKey];
          if (stats && !isReload && (Date.now() - stats.timestamp < 3600000)) {
              const elSolved = tt.querySelector('#cpbuddy-hover-solved');
              if (elSolved) elSolved.textContent = stats.count;
              const elSub = tt.querySelector('#cpbuddy-hover-sub');
              if (elSub) elSub.textContent = stats.lastSub ? timeAgo(stats.lastSub) : 'N/A';
              return;
          }

          fetch(`https://codeforces.com/api/user.status?handle=${handle}`)
            .then(res => res.json())
            .then(data => {
                if (data.status === 'OK' && data.result) {
                    const solvedIds = new Set();
                    for (const sub of data.result) {
                        if (sub.verdict === 'OK') {
                            solvedIds.add(sub.problem.contestId + '_' + sub.problem.index);
                        }
                    }
                    const count = solvedIds.size.toString();
                    const lastSub = data.result.length > 0 ? data.result[0].creationTimeSeconds : null;
                    
                    const elSolved = tt.querySelector('#cpbuddy-hover-solved');
                    if (elSolved) elSolved.textContent = count;
                    const elSub = tt.querySelector('#cpbuddy-hover-sub');
                    if (elSub) elSub.textContent = lastSub ? timeAgo(lastSub) : 'N/A';
                    
                    browser.storage.local.set({ [cacheKey]: { count, lastSub, timestamp: Date.now() } });
                }
            }).catch(() => {});
      });
    }

    document.addEventListener('mouseover', (e) => {
      if (!enabled) return;
      // Do not activate on profile pages, since the info is already there
      if (window.location.pathname.startsWith('/profile/')) return;
      
      const target = e.target as HTMLElement;
      const userLink = target.closest('.rated-user, a[href*="/profile/"]') as HTMLAnchorElement;
      if (userLink) {
        if (userLink.closest('#header')) return;
        
        // Remove native tooltip
        if (userLink.hasAttribute('title')) {
            userLink.dataset.originalTitle = userLink.getAttribute('title') || '';
            userLink.removeAttribute('title');
        }
        
        activeElement = userLink;
        // Extract handle from href because textContent might be spoofed!
        const href = userLink.getAttribute('href');
        let handle = '';
        if (href) {
          const match = href.match(/\/profile\/([^/?#]+)/);
          if (match && match[1]) {
            handle = match[1];
          }
        }
        
        if (handle) {
          if (hoverTimeout) window.clearTimeout(hoverTimeout);
          hoverTimeout = window.setTimeout(() => {
            if (activeElement === userLink) {
              showTooltip(handle, e);
            }
          }, 300);
        }
      }
    });

    document.addEventListener('mouseout', (e) => {
      if (!enabled) return;
      const target = e.target as HTMLElement;
      const userLink = target.closest('.rated-user, a[href*="/profile/"]') as HTMLAnchorElement;
      if (userLink) {
        if (hoverTimeout) {
          window.clearTimeout(hoverTimeout);
          hoverTimeout = null;
        }
        
        // Restore native tooltip just in case
        if (userLink.dataset.originalTitle) {
            userLink.setAttribute('title', userLink.dataset.originalTitle);
            delete userLink.dataset.originalTitle;
        }

        activeElement = null;
        hideTooltip();
      }
    });
  }
});
