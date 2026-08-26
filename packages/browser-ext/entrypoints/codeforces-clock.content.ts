import { defineContentScript } from 'wxt/utils/define-content-script';
import { enableClock } from '@b/settings';

export default defineContentScript({
  matches: ['*://*.codeforces.com/*', '*://*.codeforces.ml/*'],
  runAt: 'document_start',
  main() {
    if (!window.location.hostname.includes('codeforces.')) return;

    let clockEl: HTMLDivElement | null = null;
    
    const renderClock = () => {
      if (!clockEl) {
        clockEl = document.createElement('div');
        clockEl.id = 'cpbuddy-clock';
        clockEl.style.position = 'absolute';
        clockEl.style.top = '10px';
        clockEl.style.left = '50%';
        clockEl.style.transform = 'translateX(-50%)';
        clockEl.style.zIndex = '999998';
        clockEl.style.fontFamily = 'Inter, "Segoe UI", Tahoma, sans-serif';
        clockEl.style.fontSize = '15px';
        clockEl.style.fontWeight = 'bold';
        // Cyan-ish blue that matches the AMOLED navbar links nicely, or looks good on light theme
        clockEl.style.color = '#4dd0e1'; 
        clockEl.style.backgroundColor = 'rgba(0,0,0,0.7)';
        clockEl.style.padding = '4px 14px';
        clockEl.style.borderRadius = '12px';
        clockEl.style.boxShadow = '0 2px 8px rgba(0,0,0,0.5)';
        clockEl.style.pointerEvents = 'none';
        clockEl.style.letterSpacing = '1px';
        clockEl.style.fontVariantNumeric = 'tabular-nums';
        
        if (document.documentElement) {
          document.documentElement.appendChild(clockEl);
        } else {
          return;
        }
      }
      
      const now = new Date();
      const hh = now.getHours().toString().padStart(2, '0');
      const mm = now.getMinutes().toString().padStart(2, '0');
      const ss = now.getSeconds().toString().padStart(2, '0');
      
      
      clockEl.textContent = `${hh}:${mm}:${ss}`;
    };

    let timer: number | null = null;
    
    const applySetting = (enabled: boolean) => {
      if (enabled) {
        if (!timer) {
          renderClock();
          timer = window.setInterval(renderClock, 1000);
        }
        if (clockEl) clockEl.style.display = 'block';
      } else {
        if (timer) {
          window.clearInterval(timer);
          timer = null;
        }
        if (clockEl) clockEl.style.display = 'none';
      }
    };

    enableClock.getValue().then(applySetting);
    enableClock.watch(applySetting);
  }
});
