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

    const data = await customLogoData.getValue();
    const type = await customLogoType.getValue();

    const applyWhenReady = () => {
      const headerImg = document.querySelector('#header .logo img') as HTMLImageElement || 
                        document.querySelector('#header > div:first-child > a > img') as HTMLImageElement ||
                        document.querySelector('#header a[href="/"] > img') as HTMLImageElement;
                        
      if (headerImg) {
        if (!data || !type) {
          style.remove();
          return true;
        }

        if (type === 'video') {
           const video = document.createElement('video');
           video.src = data;
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
           headerImg.src = data;
           headerImg.srcset = ''; // Clear srcset if CF uses one
           headerImg.style.height = '70px';
           headerImg.style.width = '294px';
           headerImg.style.objectFit = 'fill';
        }
        style.remove(); // Restore visibility
        return true;
      }
      return false;
    };
    
    if (!applyWhenReady()) {
       const observer = new MutationObserver((mutations, obs) => {
         if (applyWhenReady()) {
           obs.disconnect();
         }
       });
       observer.observe(document.documentElement, { childList: true, subtree: true });
       
       document.addEventListener('DOMContentLoaded', () => {
           if (applyWhenReady()) observer.disconnect();
       });
    }
    
    customLogoData.watch((newVal) => {
        if (newVal) {
            location.reload();
        }
    });
  }
});
