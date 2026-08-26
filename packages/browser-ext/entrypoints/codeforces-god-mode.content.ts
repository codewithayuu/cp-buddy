import { defineContentScript } from 'wxt/utils/define-content-script';
import { enableGodMode, godModeTarget, godModeRating, godModeMaxRating, godModeRegistered, godModeContests, godModeProblems, godModeStreak } from '../src/settings';

export default defineContentScript({
  matches: ['*://codeforces.com/profile/*', '*://codeforces.ml/profile/*'],
  runAt: 'document_idle',
  async main() {
    const isEnabled = await enableGodMode.getValue();
    if (!isEnabled) return;

    const target = await godModeTarget.getValue();
    if (!target) return;

    // Check if we are on the target's profile
    const currentHandle = window.location.pathname.split('/').pop()?.split('?')[0];
    if (!currentHandle || currentHandle.toLowerCase() !== target.toLowerCase()) return;

    const rating = await godModeRating.getValue();
    const maxRating = await godModeMaxRating.getValue();
    const registered = await godModeRegistered.getValue();
    const contests = await godModeContests.getValue();

    function getRank(r: number) {
      if (r >= 3000) return { title: 'Legendary Grandmaster', cls: 'user-legendary', color: '' };
      if (r >= 2600) return { title: 'International Grandmaster', cls: 'user-red', color: '' };
      if (r >= 2400) return { title: 'Grandmaster', cls: 'user-red', color: '' };
      if (r >= 2300) return { title: 'International Master', cls: 'user-orange', color: '' };
      if (r >= 2100) return { title: 'Master', cls: 'user-orange', color: '' };
      if (r >= 1900) return { title: 'Candidate Master', cls: 'user-violet', color: '' };
      if (r >= 1600) return { title: 'Expert', cls: 'user-blue', color: '' };
      if (r >= 1400) return { title: 'Specialist', cls: 'user-cyan', color: '' };
      if (r >= 1200) return { title: 'Pupil', cls: 'user-green', color: '' };
      return { title: 'Newbie', cls: 'user-gray', color: '' };
    }

    const currentRank = getRank(rating);
    const maxRankConfig = getRank(maxRating);

    // 1. Update Title and Handle colors in the main content
    const titleDiv = document.querySelector('.info .user-rank');
    if (titleDiv) {
        titleDiv.textContent = currentRank.title;
        titleDiv.className = `user-rank ${currentRank.cls}`;
    }

    const mainHandle = document.querySelector('.info .main-info h1 a');
    if (mainHandle) {
        mainHandle.className = `rated-user ${currentRank.cls}`;
    }

    // 2. Update Sidebar properties (.info ul)
    const infoList = document.querySelector('.info ul');
    if (infoList) {
        const lis = infoList.querySelectorAll('li');
        lis.forEach(li => {
            const text = li.textContent || '';
            
            // Contest rating
            if (text.includes('Contest rating:')) {
                li.innerHTML = `<img style="vertical-align:middle;margin-right:0.5em;" src="//codeforces.org/s/0/images/icons/rating-24x24.png" alt="User''s contest rating." title="User''s contest rating.">Contest rating: <span style="font-weight:bold;" class="${currentRank.cls}">${rating}</span> (max. <span style="font-weight:bold;" class="${maxRankConfig.cls}">${maxRankConfig.title}, ${maxRating}</span>)`;
            }
            
            // Registered
            if (text.includes('Registered:')) {
                li.innerHTML = `<img style="vertical-align:middle;margin-right:0.5em;" src="//codeforces.org/s/0/images/icons/star_blue_24.png" alt="Registered" title="Registered">Registered: <span class="format-humantime" title="Spoofed Registration">${registered}</span>`;
            }
        });
    }

    // 2.5 Update Sidebar Rating (The top right logged-in user box)
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        // Find any span inside the sidebar that has a user color class and is next to "Rating:"
        const walker = document.createTreeWalker(sidebar, NodeFilter.SHOW_TEXT, null);
        let node;
        while(node = walker.nextNode()) {
            if (node.nodeValue?.trim() === 'Rating:') {
                // The actual rating is usually in a span right after this text node
                let ratingSpan = node.nextSibling;
                // Skip any empty text nodes (e.g. spaces/newlines)
                while (ratingSpan && ratingSpan.nodeType === 3 && ratingSpan.nodeValue?.trim() === '') {
                    ratingSpan = ratingSpan.nextSibling;
                }
                if (ratingSpan && ratingSpan.nodeType === 1) { // Element node
                    const el = ratingSpan as HTMLElement;
                    el.className = `user-${currentRank.cls.replace('user-', '')}`;
                    el.textContent = rating.toString();
                    el.style.fontWeight = 'bold';
                }
            }
        }
    }

    // 3. Update top-right stats box (Number of Contests)
    const contestsBox = Array.from(document.querySelectorAll('._UserActivityFrame_counterValue')).find(el => {
        const prev = el.previousElementSibling;
        return prev && prev.textContent?.includes('contests');
    });
    if (contestsBox) {
        contestsBox.textContent = contests.toString();
    }

    // 4. Update Native Codeforces Heatmap Text (e.g. "X problems", "Y days")
    const problems = await godModeProblems.getValue();
    const streak = await godModeStreak.getValue();

    // Directly update the Codeforces native heatmap stats (using MutationObserver since it renders dynamically via React/AJAX)
    const observeStats = new MutationObserver((mutations, obs) => {
        const counters = document.querySelectorAll('._UserActivityFrame_counter');
        if (counters.length > 0) {
            counters.forEach(counter => {
                const valDiv = counter.querySelector('._UserActivityFrame_counterValue');
                const descDiv = counter.querySelector('._UserActivityFrame_counterDescription');
                if (!valDiv || !descDiv) return;

                const text = descDiv.textContent || '';
                
                // Prevent infinite loop by checking if we already spoofed it
                if (valDiv.getAttribute('data-spoofed') === 'true') return;

                // Problems solved spoofing
                if (text.includes('problems') || text.includes('solved for all time') || text.includes('solved for the last year')) {
                    valDiv.textContent = `${problems} problems`;
                    valDiv.setAttribute('data-spoofed', 'true');
                }
                else if (text.includes('solved for the last month')) {
                    valDiv.textContent = `${Math.round(problems / 12)} problems`;
                    valDiv.setAttribute('data-spoofed', 'true');
                }

                // Streak spoofing
                if (text.includes('in a row max.') || text.includes('in a row for the last year')) {
                    valDiv.textContent = `${streak} days`;
                    valDiv.setAttribute('data-spoofed', 'true');
                }
                else if (text.includes('in a row for the last month')) {
                    valDiv.textContent = `${Math.min(streak, 31)} days`;
                    valDiv.setAttribute('data-spoofed', 'true');
                }
            });
            // We do NOT disconnect the observer because the user can change the "What activity will be shown" dropdown, which triggers a re-render!
        }
    });
    observeStats.observe(document.body, { childList: true, subtree: true });

    // 5. Spoof the Native Flot Rating Graph
    const scriptTags = Array.from(document.querySelectorAll('script'));
    const graphScript = scriptTags.find(s => s.textContent?.includes('usersRatingGraphPlaceholder') && s.textContent?.includes('var data = [];'));
    if (graphScript && graphScript.textContent) {
        let scriptText = graphScript.textContent;
        const injection = `
            if (typeof data !== 'undefined' && data && data.length > 0 && data[0].data && data[0].data.length > 0) {
                let actualCurrent = data[0].data[data[0].data.length - 1][1] || 1;
                let scale = ${rating} / actualCurrent;
                let maxScaled = 0;
                let maxIdx = -1;
                for (let i = 0; i < data[0].data.length; i++) {
                    data[0].data[i][1] = Math.round(data[0].data[i][1] * scale);
                    if (data[0].data[i][1] > maxScaled) {
                        maxScaled = data[0].data[i][1];
                        maxIdx = i;
                    }
                }
                
                // Ensure the peak is exactly godModeMaxRating
                if (maxIdx !== -1) {
                    let diff = ${maxRating} - maxScaled;
                    if (diff > 0) {
                       data[0].data[maxIdx][1] += diff; 
                    }
                }
                
                // Fix the "highest rating" dot array (if it exists)
                if (data[1] && data[1].data && data[1].data.length > 0) {
                    data[1].data[0][1] = ${maxRating};
                }
            }
        `;
        
        // Inject right before $.plot so 'data' is fully assembled
        let modifiedScript = scriptText.replace('$.plot($("#usersRatingGraphPlaceholder")', injection + '\n$.plot($("#usersRatingGraphPlaceholder")');
        
        // Adjust the max rating in the flot options
        modifiedScript = modifiedScript.replace(/max:\s*\d+,/, `max: ${maxRating + 200},`);
        // Remove ticks to allow auto-scaling to look clean
        modifiedScript = modifiedScript.replace(/ticks:\s*\[.*?\]\s*,/, '');
        
        const newScript = document.createElement('script');
        newScript.textContent = modifiedScript;
        document.body.appendChild(newScript);
    }
  }
});
