import { defineContentScript } from 'wxt/utils/define-content-script';
import { hideTopicTags } from '@b/settings';
import { sendMessage } from '@b/messaging';

export default defineContentScript({
  matches: ['*://*.codeforces.com/*'],
  async main() {
    const isEnabled = await hideTopicTags.getValue();

    // Use extremely high specificity and CSS variables to beat Dark Reader
    function getRatingColor(rating: number): string {
      if (rating < 1200) return '#CCCCCC'; // Gray
      if (rating < 1400) return '#77FF77'; // Green
      if (rating < 1600) return '#77DDBB'; // Cyan
      if (rating < 1900) return '#AAAAFF'; // Blue
      if (rating < 2100) return '#FF88FF'; // Violet
      if (rating < 2400) return '#FFCC88'; // Orange
      return '#FF7777'; // Red
    }

    const tagBoxes = document.querySelectorAll('.roundbox.sidebox span.tag-box');
    
    let hiddenTags: HTMLElement[] = [];
    let tagsContainer: HTMLElement | null = null;
    let hasDifficultyTag = false;

    if (tagBoxes.length > 0) {
      tagBoxes.forEach((tagBox) => {
        const el = tagBox as HTMLElement;
        const title = el.getAttribute('title');
        const text = el.textContent?.trim() || '';
        
        // Keep difficulty tags (title is Difficulty or text starts with *)
        const isDifficulty = title === 'Difficulty' || text.startsWith('*');
        
        if (!isDifficulty) {
          if (isEnabled) {
            el.style.setProperty('display', 'none', 'important');
            hiddenTags.push(el);
          }
        } else {
          hasDifficultyTag = true;
          // Just make it the normal button, but bigger and colored
          const match = text.match(/\d+/);
          if (match) {
            const rating = parseInt(match[0], 10);
            const color = getRatingColor(rating);
            el.style.setProperty('color', color, 'important');
            el.style.setProperty('font-size', '14px', 'important');
            el.style.setProperty('font-weight', 'bold', 'important');
            el.innerHTML = rating.toString();
          }
        }
        
        tagsContainer = el.closest('div') || el.parentElement;
      });
    }

    if (!hasDifficultyTag) {
      const allRatings = await sendMessage('fetchProblemRatings', undefined);
      if (allRatings) {
        const href = window.location.href;
        const match = href.match(/\/(contest|gym|problemset\/problem)\/(\d+)\/(problem\/)?([A-Za-z0-9]+)/);
        if (match) {
          const cId = match[2];
          const pIdx = match[4];
          const ratingObj = allRatings[`${cId}_${pIdx}`];
          if (ratingObj) {
            const el = document.createElement('span');
            el.className = 'tag-box';
            el.title = ratingObj.isPredicted ? 'Difficulty (Predicted)' : 'Difficulty';
            el.innerHTML = ratingObj.isPredicted ? `${ratingObj.rating}<sup style="font-size: 0.8em; margin-left: 2px;">*</sup>` : `*${ratingObj.rating}`;
            
            const color = getRatingColor(ratingObj.rating);
            el.style.setProperty('color', color, 'important');
            el.style.setProperty('font-size', '14px', 'important');
            el.style.setProperty('font-weight', 'bold', 'important');
            el.style.setProperty('margin-left', '4px', 'important');
            el.style.setProperty('display', 'inline-block', 'important');
            
            if (tagsContainer) {
              const lastTagBox = tagBoxes[tagBoxes.length - 1];
              const tagsGroupDiv = lastTagBox?.closest('div');
              
              const wrapperDiv = document.createElement('div');
              if (tagsGroupDiv) {
                  wrapperDiv.style.cssText = tagsGroupDiv.style.cssText;
                  wrapperDiv.className = tagsGroupDiv.className;
              } else {
                  wrapperDiv.style.float = 'right';
                  wrapperDiv.style.clear = 'both';
                  wrapperDiv.style.textAlign = 'right';
                  wrapperDiv.style.marginTop = '4px';
              }
              
              wrapperDiv.appendChild(el);
              
              if (tagsGroupDiv && tagsGroupDiv.parentNode) {
                  tagsGroupDiv.parentNode.insertBefore(wrapperDiv, tagsGroupDiv.nextSibling);
              } else if (lastTagBox && lastTagBox.parentNode) {
                  lastTagBox.parentNode.insertBefore(wrapperDiv, lastTagBox.nextSibling);
              }
            } else {
              // Tags container doesn't exist natively. We should create the "Problem tags" sidebar box.
              const sidebar = document.getElementById('sidebar');
              if (sidebar) {
                const newBox = document.createElement('div');
                newBox.className = 'roundbox sidebox';
                newBox.innerHTML = `
                  <div class="roundbox-lt">&nbsp;</div>
                  <div class="roundbox-rt">&nbsp;</div>
                  <div class="caption titled">&rarr; Problem tags</div>
                  <div style="padding:0.5em;">
                    <div style="text-align: center; margin-bottom: 8px;" class="cpbuddy-injected-tags"></div>
                  </div>
                `;
                newBox.querySelector('.cpbuddy-injected-tags')?.appendChild(el);
                sidebar.appendChild(newBox);
                // Also set tagsContainer so the rest of the script knows it's there, although there are no hidden topic tags anyway
                tagsContainer = newBox.querySelector('.cpbuddy-injected-tags');
              }
            }
          }
        }
      }
    }

    if (hiddenTags.length > 0 && tagsContainer) {
      const showButtonWrapper = document.createElement('div');
      showButtonWrapper.style.marginTop = '12px';
      showButtonWrapper.style.textAlign = 'right';
      
      const showButton = document.createElement('button');
      showButton.textContent = 'Show Topics';
      showButton.style.background = 'transparent';
      showButton.style.border = '1px solid #777';
      showButton.style.borderRadius = '4px';
      showButton.style.padding = '4px 8px';
      showButton.style.color = '#777';
      showButton.style.cursor = 'pointer';
      showButton.style.fontSize = '12px';
      
      // Hover effect
      showButton.addEventListener('mouseenter', () => {
          showButton.style.color = '#ccc';
          showButton.style.borderColor = '#ccc';
      });
      showButton.addEventListener('mouseleave', () => {
          showButton.style.color = '#777';
          showButton.style.borderColor = '#777';
      });

      let isHidden = true;
      showButton.addEventListener('click', () => {
        if (isHidden) {
          hiddenTags.forEach(el => el.style.setProperty('display', 'inline-block', 'important'));
          showButton.textContent = 'Hide Topics';
          isHidden = false;
        } else {
          hiddenTags.forEach(el => el.style.setProperty('display', 'none', 'important'));
          showButton.textContent = 'Show Topics';
          isHidden = true;
        }
      });

      showButtonWrapper.appendChild(showButton);
      tagsContainer.parentElement?.appendChild(showButtonWrapper);
    }
  },
});
