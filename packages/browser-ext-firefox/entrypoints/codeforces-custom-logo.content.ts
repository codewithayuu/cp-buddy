import { defineContentScript } from 'wxt/utils/define-content-script';
import { customLogoData, customLogoType } from '@b/settings';

export default defineContentScript({
  matches: ['*://*.codeforces.com/*'],
  runAt: 'document_start',
  async main() {
    // Hide logo immediately to prevent blinking
    const style = document.createElement('style');
    style.textContent = `#header a[href="/"] > img, #header .logo img { visibility: hidden !important; }`;
    (document.head || document.documentElement).appendChild(style);

    const cacheKey = 'cpbuddy_logo_cache';
    const cacheTypeKey = 'cpbuddy_logo_type_cache';
    let finalData = localStorage.getItem(cacheKey);
    let finalType = localStorage.getItem(cacheTypeKey);
    let logoApplied = false;

    const applyWhenReady = () => {
      if (logoApplied) return true;
      const headerImg = document.querySelector('#header .logo img') as HTMLImageElement || 
                        document.querySelector('#header > div:first-child > a > img') as HTMLImageElement ||
                        document.querySelector('#header a[href="/"] > img') as HTMLImageElement;
                        
      if (headerImg) {
        if (!finalData || !finalType) {
          style.remove();
          logoApplied = true;
          return true;
        }

        if (finalType === 'video') {
           const video = document.createElement('video');
           video.src = finalData;
           video.autoplay = true;
           video.loop = true;
           video.muted = true;
           video.defaultMuted = true;
           video.playsInline = true;
           video.disablePictureInPicture = true;
           (video as any).disableRemotePlayback = true;
           video.style.height = '70px';
           video.style.width = '294px';
           video.style.objectFit = 'fill';
           
           if (headerImg.parentNode) {
               headerImg.parentNode.replaceChild(video, headerImg);
           }
        } else {
           headerImg.src = finalData;
           headerImg.srcset = ''; // Clear srcset if CF uses one
           headerImg.style.height = '70px';
           headerImg.style.width = '294px';
           headerImg.style.objectFit = 'fill';
        }
        style.remove(); // Restore visibility
        logoApplied = true;
        return true;
      }
      return false;
    };
    
    const setupLogoObserver = () => {
       if (applyWhenReady()) return;
       const observer = new MutationObserver((mutations, obs) => {
         if (applyWhenReady()) {
           obs.disconnect();
         }
       });
       observer.observe(document.documentElement, { childList: true, subtree: true });
       
       document.addEventListener('DOMContentLoaded', () => {
           if (applyWhenReady()) observer.disconnect();
       });
    };

    if (finalData && finalType) {
        setupLogoObserver();
    }

    Promise.all([customLogoData.getValue(), customLogoType.getValue()]).then(([data, type]) => {
        if (data && type) {
            try {
                localStorage.setItem(cacheKey, data);
                localStorage.setItem(cacheTypeKey, type);
            } catch(e) {
                // Quota exceeded
                localStorage.removeItem(cacheKey);
                localStorage.removeItem(cacheTypeKey);
            }
        } else {
            localStorage.removeItem(cacheKey);
            localStorage.removeItem(cacheTypeKey);
        }
        
        if (finalData !== data || finalType !== type) {
            finalData = data;
            finalType = type;
            if (!logoApplied) {
                setupLogoObserver();
            } else {
                location.reload(); // Reload to apply updated logo
            }
        }
    });
    
    customLogoData.watch((newVal) => {
        if (newVal) {
            location.reload();
        }
    });
  }
});
