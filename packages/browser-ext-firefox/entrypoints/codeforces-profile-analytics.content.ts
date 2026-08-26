import { defineContentScript } from 'wxt/utils/define-content-script';
import Chart from 'chart.js/auto';
import zoomPlugin from 'chartjs-plugin-zoom';
import { sendMessage } from '@b/messaging';
import { browser } from 'wxt/browser';
import { showProfileAnalytics, enableGodMode, godModeTarget, godModeRating, godModeMaxRating, godModeProblems, godModeStreak, godModeRegistered, godModeContests } from '../src/settings';

Chart.register(zoomPlugin);

// AMOLED matching colors
const amoledColors = {
  text: '#e0e0e0',
  grid: '#222222',
  background: '#000000',
  border: '#333333',
  cardBg: '#000000',
  cardBorder: '#333333'
};

const tagColorArray = [
  '#ff867c','#ff77a9','#df78ef','#b085f5','#8e99f3',
  '#80d6ff','#73e8ff','#6ff9ff','#64d8cb','#98ee99',
  '#cfff95','#ffff89','#ffff8b','#fffd61','#ffd95b','#ffa270'
];

function ratingBackgroundColor(rating: number) {
  if (rating >= 3000) return 'rgba(170,0  ,0  ,0.9)';
  if (rating >= 2600) return 'rgba(255,51 ,51 ,0.9)';
  if (rating >= 2400) return 'rgba(255,119,119,0.9)';
  if (rating >= 2300) return 'rgba(255,187,85 ,0.9)';
  if (rating >= 2100) return 'rgba(255,204,136,0.9)';
  if (rating >= 1900) return 'rgba(255,136,255,0.9)';
  if (rating >= 1600) return 'rgba(170,170,255,0.9)';
  if (rating >= 1400) return 'rgba(119,221,187,0.9)';
  if (rating >= 1200) return 'rgba(119,255,119,0.9)';
  return 'rgba(204,204,204,0.9)';
}

function ratingSpanColorHex(rating: number) {
  if (rating >= 2400) return '#ff3333';
  if (rating >= 2100) return '#ff8800';
  if (rating >= 1900) return '#aa00aa';
  if (rating >= 1600) return '#0000ff';
  if (rating >= 1400) return '#03a89e';
  if (rating >= 1200) return '#008000';
  return '#808080';
}

let gmScaleRatio = 1.0;
let isGodModeActive = false;
let gmStreakVal = 0;
let gmProblemsVal = 0;

export default defineContentScript({
  matches: ['*://*.codeforces.com/profile/*'],
  runAt: 'document_idle',
  async main() {
    if (!(await showProfileAnalytics.getValue())) return;
    if (!window.location.pathname.startsWith('/profile/')) return;
    // Only run on the main profile page (not friends, teams, etc)
    if (window.location.pathname.split('/').filter(Boolean).length > 2) return;
    
    const handle = window.location.pathname.split('/').pop()?.split('?')[0];
    if (!handle) return;

    const pageContent = document.getElementById('pageContent');
    if (!pageContent) return;

    // Fetch God Mode settings
    const gmEnabled = await enableGodMode.getValue();
    const gmTargetStr = await godModeTarget.getValue();
    gmProblemsVal = await godModeProblems.getValue();
    gmStreakVal = await godModeStreak.getValue();
    const gmRatingVal = await godModeRating.getValue();
    const gmMaxRatingVal = await godModeMaxRating.getValue();
    const gmContestsVal = await godModeContests.getValue();
    isGodModeActive = Boolean(gmEnabled && gmTargetStr && handle.toLowerCase() === gmTargetStr.toLowerCase());

    // Inject our UI
    const container = document.createElement('div');
    container.style.marginTop = '2em';
    
    container.innerHTML = `
      <style>
        .cfa-card {
           background-color: transparent;
           border: none;
           padding: 0;
           margin-bottom: 1.5em;
           color: ${amoledColors.text};
        }
        .cfa-header h4 {
           margin: 0;
           color: #fff;
           font-size: 1.1em;
        }
        
        /* Stats Summary Grid */
        .cfa-stats-grid {
           display: grid;
           grid-template-columns: repeat(6, 1fr);
           gap: 1em;
           margin-bottom: 2em;
           background: ${amoledColors.cardBg};
           border: 1px solid ${amoledColors.cardBorder};
           border-radius: 8px;
           padding: 1.5em;
        }
        .cfa-stat-box {
           background: transparent;
           border: none;
           border-radius: 8px;
           padding: 1em 0.5em;
           position: relative;
           overflow: hidden;
           text-align: center;
           display: flex;
           flex-direction: column;
           justify-content: center;
           align-items: center;
           box-shadow: 0 4px 6px rgba(0,0,0,0.3);
           transition: transform 0.2s, box-shadow 0.2s;
        }
        .cfa-stat-box::before {
           content: '';
           position: absolute;
           top: 0;
           left: 0;
           right: 0;
           height: 3px;
        }
        .cfa-stat-box:nth-child(1)::before { background: #4285f4; }
        .cfa-stat-box:nth-child(2)::before { background: #0f9d58; }
        .cfa-stat-box:nth-child(3)::before { background: #f4b400; }
        .cfa-stat-box:nth-child(4)::before { background: #db4437; }
        .cfa-stat-box:nth-child(5)::before { background: #ab47bc; }
        .cfa-stat-box:nth-child(6)::before { background: #ff7043; }
        
        .cfa-stat-title {
           font-size: 0.75em;
           text-transform: uppercase;
           letter-spacing: 0.5px;
           color: #888;
           margin-bottom: 0.5em;
        }
        .cfa-stat-value {
           font-size: 1.4em;
           font-weight: 800;
        }
        .cfa-stat-value.blue { color: #4fc3f7; }
        .cfa-stat-value.green { color: #81c784; }
        .cfa-stat-value.yellow { color: #ffd54f; }
        .cfa-stat-value.red { color: #e57373; }
        .cfa-stat-value.purple { color: #ce93d8; }
        .cfa-stat-value.orange { color: #ffb74d; }



        .cfa-chart-container {
           margin-bottom: 2em;
           background: ${amoledColors.cardBg};
           border: 1px solid ${amoledColors.cardBorder};
           border-radius: 8px;
           padding: 1.5em;
        }
        .cfa-chart-title {
           text-align: center;
           color: #aaa;
           font-size: 0.9em;
           margin-bottom: 1em;
        }

        .cfa-tags-container {
           display: flex;
           gap: 2em;
        }
        .cfa-chart-wrapper {
           flex: 1;
           min-width: 0;
        }
        .cfa-legend {
           width: 300px;
           max-height: 300px;
           overflow-y: auto;
           padding-right: 10px;
        }
        .cfa-legend ul {
           list-style: none;
           padding: 0;
           margin: 0;
        }
        .cfa-legend li {
           display: flex;
           align-items: center;
           gap: 8px;
           margin-bottom: 4px;
           font-size: 0.9em;
        }
        .cfa-legend-box {
           width: 12px;
           height: 12px;
           border: 1px solid #000;
        }
        .cfa-unsolved {
           display: flex;
           flex-wrap: wrap;
           gap: 6px;
        }
        .cfa-unsolved a {
           color: #4fc3f7;
           text-decoration: none;
           background: #121212;
           border: 1px solid #333;
           padding: 2px 6px;
           border-radius: 4px;
           font-size: 0.9em;
           transition: 0.2s;
        }
        .cfa-unsolved a:hover {
           background: #1a1a1a;
           color: #81d4fa;
        }
        .cfa-heatmap {
           display: grid;
           grid-template-rows: repeat(7, 15px);
           grid-auto-flow: column;
           gap: 3px;
           margin-top: 10px;
        }
        .cfa-heatmap-cell {
           width: 15px;
           height: 15px;
           border-radius: 2px;
           background-color: #161b22;
           position: relative;
           cursor: pointer;
        }
        .cfa-heatmap-cell:hover {
           outline: 1px solid #fff;
           z-index: 10;
        }
        .cfa-heatmap-labels {
           display: flex;
           font-size: 0.75em;
           color: #888;
           margin-bottom: 5px;
           padding-left: 30px;
           justify-content: space-between;
        }
        .cfa-heatmap-wrapper {
           display: flex;
           gap: 10px;
        }
        .cfa-heatmap-days {
           display: flex;
           flex-direction: column;
           justify-content: space-between;
           font-size: 0.75em;
           color: #888;
           padding-top: 10px;
           padding-bottom: 10px;
        }
      </style>
      <div class="cfa-card" style="position: relative;">
         
         <div id="cfa-chart-settings-menu" style="display: none; position: absolute; right: 15px; top: 60px; background: #1a1a1a; border: 1px solid #444; border-radius: 8px; padding: 15px; z-index: 100; min-width: 260px; box-shadow: 0 8px 24px rgba(0,0,0,0.6);">
             
             <div style="font-size: 0.85em; color: #888; margin-bottom: 8px; text-transform: uppercase; font-weight: bold;">Data Filters</div>
             <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                 <input type="number" id="cfa-min-rating" step="100" min="800" max="3500" placeholder="Min R" style="background:#000; color:#fff; border:1px solid #444; padding:6px; border-radius:4px; width: 100%; box-sizing: border-box;">
                 <input type="number" id="cfa-max-rating" step="100" min="800" max="3500" placeholder="Max R" style="background:#000; color:#fff; border:1px solid #444; padding:6px; border-radius:4px; width: 100%; box-sizing: border-box;">
                 <input type="date" id="cfa-min-date" style="background:#000; color:#fff; border:1px solid #444; padding:6px; border-radius:4px; width: 100%; box-sizing: border-box;">
                 <input type="date" id="cfa-max-date" style="background:#000; color:#fff; border:1px solid #444; padding:6px; border-radius:4px; width: 100%; box-sizing: border-box;">
             </div>
             <div style="display: flex; gap: 8px; margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 15px;">
                 <button id="cfa-apply-filters" style="flex: 1; background: #2c2c2c; color: #fff; border: 1px solid #555; padding: 6px; border-radius: 4px; cursor: pointer; transition: 0.2s;" onmouseover="this.style.background='#444'" onmouseout="this.style.background='#2c2c2c'">Apply</button>
                 <button id="cfa-reset-filters" style="flex: 1; background: #2c2c2c; color: #fff; border: 1px solid #555; padding: 6px; border-radius: 4px; cursor: pointer; transition: 0.2s;" onmouseover="this.style.background='#444'" onmouseout="this.style.background='#2c2c2c'">Reset</button>
             </div>
             
             <div style="font-size: 0.85em; color: #888; margin-bottom: 8px; text-transform: uppercase; font-weight: bold;">Visible Charts</div>
             <div id="cfa-chart-controls-container">
                 <div class="cfa-chart-control" data-id="moving-avg" style="display: flex; align-items: center; margin-bottom: 6px;">
                    <div style="display:flex; flex-direction:column; gap:2px; margin-right:6px;">
                        <button class="cfa-order-up" style="font-size:9px; padding:0 2px; cursor:pointer; background:transparent; border:none; color:#888;">▲</button>
                        <button class="cfa-order-down" style="font-size:9px; padding:0 2px; cursor:pointer; background:transparent; border:none; color:#888;">▼</button>
                    </div>
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; white-space: nowrap; margin: 0;"><input type="checkbox" class="cfa-toggle-cb" value="moving-avg" checked> Moving Average</label>
                 </div>
                 <div class="cfa-chart-control" data-id="ratings" style="display: flex; align-items: center; margin-bottom: 6px;">
                    <div style="display:flex; flex-direction:column; gap:2px; margin-right:6px;">
                        <button class="cfa-order-up" style="font-size:9px; padding:0 2px; cursor:pointer; background:transparent; border:none; color:#888;">▲</button>
                        <button class="cfa-order-down" style="font-size:9px; padding:0 2px; cursor:pointer; background:transparent; border:none; color:#888;">▼</button>
                    </div>
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; white-space: nowrap; margin: 0;"><input type="checkbox" class="cfa-toggle-cb" value="ratings"> Problem Ratings</label>
                 </div>
                 <div class="cfa-chart-control" data-id="weakness" style="display: flex; align-items: center; margin-bottom: 6px;">
                    <div style="display:flex; flex-direction:column; gap:2px; margin-right:6px;">
                        <button class="cfa-order-up" style="font-size:9px; padding:0 2px; cursor:pointer; background:transparent; border:none; color:#888;">▲</button>
                        <button class="cfa-order-down" style="font-size:9px; padding:0 2px; cursor:pointer; background:transparent; border:none; color:#888;">▼</button>
                    </div>
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; white-space: nowrap; margin: 0;"><input type="checkbox" class="cfa-toggle-cb" value="weakness"> Weakness Analysis</label>
                 </div>
                 <div class="cfa-chart-control" data-id="tags" style="display: flex; align-items: center; margin-bottom: 6px;">
                    <div style="display:flex; flex-direction:column; gap:2px; margin-right:6px;">
                        <button class="cfa-order-up" style="font-size:9px; padding:0 2px; cursor:pointer; background:transparent; border:none; color:#888;">▲</button>
                        <button class="cfa-order-down" style="font-size:9px; padding:0 2px; cursor:pointer; background:transparent; border:none; color:#888;">▼</button>
                    </div>
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; white-space: nowrap; margin: 0;"><input type="checkbox" class="cfa-toggle-cb" value="tags"> Tags Solved</label>
                 </div>
                 <div class="cfa-chart-control" data-id="speed-time" style="display: flex; align-items: center; margin-bottom: 6px;">
                    <div style="display:flex; flex-direction:column; gap:2px; margin-right:6px;">
                        <button class="cfa-order-up" style="font-size:9px; padding:0 2px; cursor:pointer; background:transparent; border:none; color:#888;">▲</button>
                        <button class="cfa-order-down" style="font-size:9px; padding:0 2px; cursor:pointer; background:transparent; border:none; color:#888;">▼</button>
                    </div>
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; white-space: nowrap; margin: 0;"><input type="checkbox" class="cfa-toggle-cb" value="speed-time"> Speed & Time</label>
                 </div>
                 <div class="cfa-chart-control" data-id="unsolved" style="display: flex; align-items: center; margin-bottom: 0px;">
                    <div style="display:flex; flex-direction:column; gap:2px; margin-right:6px;">
                        <button class="cfa-order-up" style="font-size:9px; padding:0 2px; cursor:pointer; background:transparent; border:none; color:#888;">▲</button>
                        <button class="cfa-order-down" style="font-size:9px; padding:0 2px; cursor:pointer; background:transparent; border:none; color:#888;">▼</button>
                    </div>
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; white-space: nowrap; margin: 0;"><input type="checkbox" class="cfa-toggle-cb" value="unsolved"> Unsolved Problems</label>
                 </div>
             </div>
         </div>

        <div class="cfa-chart-container" style="position: relative; padding: 12px 16px;">
           <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.8em;">
             <h4 style="margin:0; font-size:1.1em; color:#fff;">Rating-Based Heatmap</h4>
             <div style="display:flex; gap: 8px; align-items: center;">
                 <select id="cfa-heatmap-year" style="background:#111; color:#aaa; border:1px solid #333; padding:2px 6px; font-size:11px; border-radius:4px; outline:none; cursor:pointer; transition:0.2s;" onmouseover="this.style.color='#fff'; this.style.borderColor='#555'" onmouseout="this.style.color='#aaa'; this.style.borderColor='#333'">
                   <option>Choose year</option>
                 </select>
                 <div id="cfa-chart-settings-btn" title="Settings & Filters" style="padding: 4px; color: #888; background: transparent; border: none; cursor: pointer; user-select: none; transition: color 0.2s; display: flex; align-items: center; justify-content: center;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#888'">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
                         <circle cx="12" cy="12" r="3"></circle>
                         <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                     </svg>
                 </div>
             </div>
           </div>
           <div id="cfa-heatmap-container" style="overflow-x:auto;"></div>
        </div>

         <div class="cfa-stats-grid">
           <div class="cfa-stat-box">
             <div class="cfa-stat-title">Total Subs</div>
             <div class="cfa-stat-value blue" id="cfa-total-sub">0</div>
           </div>
           <div class="cfa-stat-box">
             <div class="cfa-stat-title">Solved</div>
             <div class="cfa-stat-value green" id="cfa-solved-prob">0</div>
           </div>
           <div class="cfa-stat-box">
             <div class="cfa-stat-title">Max Solved</div>
             <div class="cfa-stat-value yellow" id="cfa-max-streak">0 <span style="font-size:0.5em;color:#aaa">probs</span></div>
           </div>
           <div class="cfa-stat-box">
             <div class="cfa-stat-title">Points</div>
             <div class="cfa-stat-value red" id="cfa-points">0</div>
           </div>
           <div class="cfa-stat-box">
             <div class="cfa-stat-title">AC Rate</div>
             <div class="cfa-stat-value purple" id="cfa-ac-rate">0%</div>
           </div>
           <div class="cfa-stat-box">
             <div class="cfa-stat-title">Max Rating</div>
             <div class="cfa-stat-value orange" id="cfa-highest-rating">0</div>
           </div>
         </div>

        <div class="cfa-chart-container cfa-toggle-chart" id="cfa-container-moving-avg">
           <div class="cfa-chart-title">Moving Average Rating (Recent 20 ACs)</div>
           <canvas id="cfa-moving-avg-chart"></canvas>
        </div>

        <div class="cfa-chart-container cfa-toggle-chart" id="cfa-container-ratings" style="display: none;">
           <div class="cfa-chart-title">Problem Ratings</div>
           <canvas id="cfa-rating-chart"></canvas>
        </div>
        
        <div class="cfa-chart-container cfa-toggle-chart" id="cfa-container-weakness" style="display: none;">
           <div class="cfa-chart-title">Weakness Analysis (Average Tries per Tag)</div>
           <canvas id="cfa-weakness-chart"></canvas>
        </div>

        <div class="cfa-chart-container cfa-toggle-chart" id="cfa-container-tags" style="display: none;">
           <div class="cfa-tags-container">
             <div class="cfa-chart-wrapper">
               <div class="cfa-chart-title">Tags Solved</div>
               <canvas id="cfa-tag-chart"></canvas>
             </div>
             <div class="cfa-legend">
               <ul id="cfa-tag-legend"></ul>
             </div>
           </div>
        </div>
        
        <div class="cfa-toggle-chart" id="cfa-container-speed-time" style="display: none; gap: 2em; margin-bottom: 2em;">
            <div class="cfa-chart-container" style="flex:1; margin-bottom: 0;">
               <div class="cfa-chart-title">Contest Speed Analysis</div>
               <canvas id="cfa-speed-chart"></canvas>
            </div>
            <div class="cfa-chart-container" style="flex:1; margin-bottom: 0;">
               <div class="cfa-chart-title">Time of Day (Active Hours)</div>
               <canvas id="cfa-time-chart"></canvas>
            </div>
        </div>

        <div class="cfa-chart-container cfa-toggle-chart" id="cfa-container-unsolved" style="display: none; margin-bottom:0;">
           <div class="cfa-chart-title">Unsolved Problems (<span id="cfa-unsolved-count">0</span>)</div>
           <div class="cfa-unsolved" id="cfa-unsolved-list"></div>
        </div>
      </div>
    `;

    pageContent.appendChild(container);

    let ratingChart: Chart | null = null;
    let tagChart: Chart | null = null;
    let weaknessChart: Chart | null = null;
    let movingAvgChart: Chart | null = null;
    let speedChart: Chart | null = null;
    let timeChart: Chart | null = null;
    let submissions: any[] = [];

    // Global settings for AMOLED chart
    Chart.defaults.color = amoledColors.text;
    Chart.defaults.borderColor = amoledColors.grid;
    Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

    const heatmapData = new Map<string, {maxRating: number, solved: number, problems: Map<string, {name: string, rating: number}>}>();
    const availableYears = new Set<number>();
    let globalRatings: any = null;

    const processHeatmapData = () => {
        heatmapData.clear();
        availableYears.clear();
        for (let i = 0; i < submissions.length; i++) {
           const sub = submissions[i];
           if (sub.verdict !== "OK") continue;
           const d = new Date(sub.creationTimeSeconds * 1000);
           const yyyy = d.getFullYear();
           const mm = String(d.getMonth() + 1).padStart(2, '0');
           const dd = String(d.getDate()).padStart(2, '0');
           const dateKey = `${yyyy}-${mm}-${dd}`;
           availableYears.add(yyyy);
           
           let rating = sub.problem.rating;
           if (!rating && globalRatings) {
               const g = globalRatings[`${sub.problem.contestId}_${sub.problem.index}`];
               if (g) rating = g.rating;
           }
           rating = rating || 0;

           if (!heatmapData.has(dateKey)) {
               heatmapData.set(dateKey, {maxRating: rating, solved: 1, problems: new Map()});
           } else {
               const existing = heatmapData.get(dateKey)!;
               existing.solved++;
               if (rating > existing.maxRating) existing.maxRating = rating;
           }
           const problemId = sub.problem.contestId + '-' + sub.problem.index;
           heatmapData.get(dateKey)!.problems.set(problemId, {
               name: sub.problem.name,
               rating: rating
           });
        }
        
        const yearSelect = document.getElementById('cfa-heatmap-year') as HTMLSelectElement;
        if (yearSelect && availableYears.size > 0) {
            const sortedYears = Array.from(availableYears).sort((a, b) => b - a);
            yearSelect.innerHTML = `<option value="last_year" selected>Last 12 Months</option>` + sortedYears.map(y => `<option value="${y}">${y}</option>`).join('');
            renderHeatmap('last_year');
        }
    };

    const renderHeatmap = (yearStr: string) => {
        const container = document.getElementById('cfa-heatmap-container');
        if (!container) return;
        
        let startDate: Date;
        let endDate: Date;
        
        if (yearStr === 'last_year') {
            endDate = new Date();
            // Start date 365 days ago
            startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);
        } else {
            const year = parseInt(yearStr);
            startDate = new Date(year, 0, 1);
            const numDays = (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 366 : 365;
            endDate = new Date(year, 0, numDays);
        }
        
        let html = '<div class="cfa-heatmap-wrapper" style="justify-content: flex-end;">';
        html += '<div class="cfa-heatmap-days"><span>Mon</span><span>Wed</span><span>Fri</span></div>';
        
        html += '<div style="flex:1;">';
        
        // Months header
        html += '<div class="cfa-heatmap-labels">';
        const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        if (yearStr === 'last_year') {
            let m = startDate.getMonth();
            for (let i = 0; i < 12; i++) {
                html += `<div>${monthNames[(m + i) % 12]}</div>`;
            }
        } else {
            for(let m of monthNames) html += `<div>${m}</div>`;
        }
        html += '</div>';
        
        html += '<div class="cfa-heatmap">';
        
        const startDay = startDate.getDay(); // 0 = Sunday
        
        // Pad empty cells for the first week
        for (let i = 0; i < startDay; i++) {
            html += `<div class="cfa-heatmap-cell" style="visibility:hidden;"></div>`;
        }
        
        const numDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + (yearStr === 'last_year' ? 1 : 0);
        for (let i = 0; i < numDays; i++) {
            const current = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
            const yyyy = current.getFullYear();
            const mm = String(current.getMonth() + 1).padStart(2, '0');
            const dd = String(current.getDate()).padStart(2, '0');
            const key = `${yyyy}-${mm}-${dd}`;
            
            let bgColor = '#161b22';
            let cellContent = '';
            if (heatmapData.has(key)) {
                const data = heatmapData.get(key)!;
                bgColor = ratingSpanColorHex(data.maxRating);
                let count = data.problems.size;
                if (isGodModeActive) {
                    const noise = 1 + (Math.random() - 0.5) * 0.1;
                    count = Math.max(1, Math.round(count * gmScaleRatio * noise));
                }
                cellContent = `<span style="font-size: 8px; color: #000; font-weight: bold; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); line-height: 1;">${count}</span>`;
            }
            
            html += `<div class="cfa-heatmap-cell" style="background-color: ${bgColor};" data-date="${key}">${cellContent}</div>`;
        }
        
        html += '</div></div></div>';
        container.innerHTML = html;
    };

    const renderCharts = () => {
      const minRatingStr = (document.getElementById('cfa-min-rating') as HTMLInputElement).value;
      const maxRatingStr = (document.getElementById('cfa-max-rating') as HTMLInputElement).value;
      const minDateStr = (document.getElementById('cfa-min-date') as HTMLInputElement).value;
      const maxDateStr = (document.getElementById('cfa-max-date') as HTMLInputElement).value;

      const minRating = minRatingStr ? parseInt(minRatingStr) : -1;
      const maxRating = maxRatingStr ? parseInt(maxRatingStr) : -1;
      const minDate = minDateStr ? new Date(minDateStr).getTime() / 1000 : -1;
      const maxDate = maxDateStr ? new Date(maxDateStr).getTime() / 1000 : -1;

      const problems = new Map<string, any>();
      
      let totalSubmissions = 0;
      let totalACs = 0;
      let pointsEarned = 0;
      let highestRating = 0;

      // Map for weakness analysis: tag -> {tries: number, solvedCount: number}
      const tagTries = new Map<string, {tries: number, solvedCount: number}>();
      // Map for tracking tries per problem: problemId -> tries
      const probTries = new Map<string, number>();
      
      // For Time of Day (0-23)
      const hoursCount = new Array(24).fill(0);
      
      // For Moving Average (Recent 20 ACs)
      const acTimeline: {date: number, rating: number}[] = [];

      // For Contest Speed Analysis (0-10m, 10-30m, 30-60m, 1-2h, 2h+)
      const speedBuckets = [0, 0, 0, 0, 0];
      
      // Active Days set for Streak
      const solvedPerDay = new Map<string, number>();

      // submissions from Codeforces are ordered newest to oldest usually, so reverse to chronological
      const chronological = [...submissions].reverse();

      for (let i = 0; i < chronological.length; i++) {
        const sub = chronological[i];
        
        // Filter logic applies to whether a submission is processed at all? 
        // No, filters should usually apply to the charts, but let's apply them globally to the processed subset
        if (minRating !== -1 && (!sub.problem.rating || sub.problem.rating < minRating)) continue;
        if (maxRating !== -1 && (!sub.problem.rating || sub.problem.rating > maxRating)) continue;
        if (minDate !== -1 && sub.creationTimeSeconds < minDate) continue;
        if (maxDate !== -1 && sub.creationTimeSeconds > maxDate) continue;

        totalSubmissions++;
        
        const problemId = sub.problem.contestId + '-' + sub.problem.index;
        if (!probTries.has(problemId)) probTries.set(problemId, 0);
        
        if (!problems.has(problemId)) {
          let probRating = sub.problem.rating;
          if (!probRating && globalRatings) {
             const g = globalRatings[`${sub.problem.contestId}_${sub.problem.index}`];
             if (g) probRating = g.rating;
          }

          problems.set(problemId, {
            solved: false,
            rating: probRating,
            contestId: sub.problem.contestId,
            index: sub.problem.index,
            tags: sub.problem.tags,
            date: sub.creationTimeSeconds,
            firstAcTries: 0
          });
        }
        
        let obj = problems.get(problemId);
        
        if (!obj.solved) {
            probTries.set(problemId, probTries.get(problemId)! + 1);
        }

        const dateObj = new Date(sub.creationTimeSeconds * 1000);
        
        if (sub.verdict === "OK") {
          if (!obj.solved) {
            obj.solved = true;
            obj.firstAcTries = probTries.get(problemId)!;
            totalACs++;
            if (obj.rating) {
                pointsEarned += obj.rating;
                if (obj.rating > highestRating) highestRating = obj.rating;
                acTimeline.push({date: sub.creationTimeSeconds, rating: obj.rating});
            }
            
            // Contest Speed Analysis (only for in-contest submissions)
            if (sub.relativeTimeSeconds !== undefined && sub.relativeTimeSeconds >= 0 && sub.author?.participantType === "CONTESTANT") {
                const mins = sub.relativeTimeSeconds / 60;
                if (mins <= 10) speedBuckets[0]++;
                else if (mins <= 30) speedBuckets[1]++;
                else if (mins <= 60) speedBuckets[2]++;
                else if (mins <= 120) speedBuckets[3]++;
                else speedBuckets[4]++;
            }

            // Weakness Tracking
            if (obj.tags) {
                obj.tags.forEach((tag: string) => {
                    if (!tagTries.has(tag)) tagTries.set(tag, {tries: 0, solvedCount: 0});
                    const t = tagTries.get(tag)!;
                    t.tries += obj.firstAcTries;
                    t.solvedCount += 1;
                });
            }
            
            const yyyy = dateObj.getFullYear();
            const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
            const dd = String(dateObj.getDate()).padStart(2, '0');
            const dateKey = `${yyyy}-${mm}-${dd}`;
            solvedPerDay.set(dateKey, (solvedPerDay.get(dateKey) || 0) + 1);
          }
        }

        // Time of Day (all submissions)
        hoursCount[dateObj.getHours()]++;
      }

      // Max Solved calculation
      let maxSolved = 0;
      for (const count of solvedPerDay.values()) {
          if (count > maxSolved) maxSolved = count;
      }

      // God Mode Scaling Factor (Regression Logic)
      if (isGodModeActive && gmProblemsVal > 0) {
          totalSubmissions = Math.max(totalSubmissions, 1);
          totalACs = Math.max(totalACs, 1);
          gmScaleRatio = gmProblemsVal / totalACs;
          totalACs = gmProblemsVal;
          totalSubmissions = Math.round(totalSubmissions * gmScaleRatio);
          maxSolved = gmStreakVal;
          highestRating = Math.max(highestRating, gmRatingVal, gmMaxRatingVal);
      }

      // AC Rate
      const acRate = totalSubmissions > 0 ? ((totalACs / totalSubmissions) * 100).toFixed(1) : "0";

      // Update Summary Cards
      document.getElementById('cfa-total-sub')!.textContent = String(totalSubmissions);
      document.getElementById('cfa-solved-prob')!.textContent = String(totalACs);
      document.getElementById('cfa-max-streak')!.innerHTML = maxSolved.toString() + (isGodModeActive ? '' : ' <span style="font-size:0.5em;color:#aaa">probs</span>');
      document.getElementById('cfa-points')!.textContent = String(Math.round(pointsEarned * gmScaleRatio));
      document.getElementById('cfa-ac-rate')!.textContent = acRate + '%';
      document.getElementById('cfa-highest-rating')!.textContent = String(highestRating);

      // Gather Data for Standard Charts (Ratings & Tags)
      const ratings = new Map<number, number>();
      const tags = new Map<string, number>();
      let unsolvedCount = 0;
      const unsolvedHtml: string[] = [];

      problems.forEach(prob => {
          if (prob.rating && prob.solved) {
            ratings.set(prob.rating, (ratings.get(prob.rating) || 0) + 1);
          }
          if (!prob.solved) {
            unsolvedCount++;
            const url = (prob.contestId && prob.contestId <= 9999) 
              ? `https://codeforces.com/problemset/problem/${prob.contestId}/${prob.index}`
              : `https://codeforces.com/problemset/gymProblem/${prob.contestId}/${prob.index}`;
            unsolvedHtml.push(`<a href="${url}" target="_blank">${prob.contestId}-${prob.index}</a>`);
          }
          if (prob.solved) {
            prob.tags.forEach((tag: string) => {
              tags.set(tag, (tags.get(tag) || 0) + 1);
            });
          }
      });

      if (isGodModeActive) {
          // Apply regression scaling with realistic noise to problem rating distribution
          ratings.forEach((val, key) => {
              const noise = 1 + (Math.random() - 0.5) * 0.1; // +/- 5% noise
              ratings.set(key, Math.round(val * gmScaleRatio * noise));
          });
          // Apply regression scaling to tags distribution
          tags.forEach((val, key) => {
              const noise = 1 + (Math.random() - 0.5) * 0.1;
              tags.set(key, Math.round(val * gmScaleRatio * noise));
          });
          unsolvedCount = Math.round(unsolvedCount * gmScaleRatio);
      }

      document.getElementById('cfa-unsolved-count')!.textContent = unsolvedCount.toString();
      document.getElementById('cfa-unsolved-list')!.innerHTML = unsolvedHtml.join('');

      // Render Rating Chart
      const sortedRatings = [...ratings.entries()].sort((a, b) => a[0] - b[0]);
      if (ratingChart) ratingChart.destroy();
      const ratingCtx = document.getElementById('cfa-rating-chart') as HTMLCanvasElement;
      ratingChart = new Chart(ratingCtx, {
        type: 'bar',
        data: {
          labels: sortedRatings.map(x => x[0].toString()),
          datasets: [{
            data: sortedRatings.map(x => x[1]),
            backgroundColor: sortedRatings.map(x => ratingBackgroundColor(x[0])),
            borderWidth: 0,
            borderRadius: 4
          }]
        },
        options: {
          aspectRatio: 3,
          scales: {
            x: { grid: { color: amoledColors.grid, drawBorder: false } },
            y: { beginAtZero: true, grid: { color: amoledColors.grid, drawBorder: false } }
          },
          plugins: { legend: { display: false } },
          onClick: (event, elements) => {
            if (elements.length > 0) {
              const r = sortedRatings[elements[0].index][0];
              window.location.href = `https://codeforces.com/problemset?tags=${r}-${r}`;
            }
          }
        }
      });

      // Render Tag Chart & Legend
      const sortedTags = [...tags.entries()].sort((a, b) => b[1] - a[1]);
      if (tagChart) tagChart.destroy();
      const tagCtx = document.getElementById('cfa-tag-chart') as HTMLCanvasElement;
      tagChart = new Chart(tagCtx, {
        type: 'doughnut',
        data: {
          labels: sortedTags.map(x => x[0]),
          datasets: [{
            data: sortedTags.map(x => x[1]),
            backgroundColor: tagColorArray,
            borderWidth: 2,
            borderColor: amoledColors.cardBg
          }]
        },
        options: {
          aspectRatio: 2,
          plugins: { legend: { display: false } },
          cutout: '70%',
          onClick: (event, elements) => {
            if (elements.length > 0) {
              const t = sortedTags[elements[0].index][0];
              window.location.href = `https://codeforces.com/problemset?tags=${t}`;
            }
          }
        }
      });

      const legendHtml = sortedTags.map((tagObj, i) => {
        const color = tagColorArray[i % tagColorArray.length];
        return `<li>
            <div class="cfa-legend-box" style="background-color: ${color}; border:none; border-radius:3px;"></div>
            <span>${tagObj[0]} (${tagObj[1]})</span>
          </li>`;
      }).join('');
      document.getElementById('cfa-tag-legend')!.innerHTML = legendHtml;

      // Render Weakness Chart
      const weaknessData = [...tagTries.entries()]
        .map(x => ({ tag: x[0], avg: x[1].tries / x[1].solvedCount }))
        .filter(x => x.avg > 1.0)
        .sort((a, b) => b.avg - a.avg);

      if (weaknessChart) weaknessChart.destroy();
      const weaknessCtx = document.getElementById('cfa-weakness-chart') as HTMLCanvasElement;
      weaknessChart = new Chart(weaknessCtx, {
        type: 'bar',
        data: {
          labels: weaknessData.map(x => x.tag),
          datasets: [{
            data: weaknessData.map(x => x.avg.toFixed(2)),
            backgroundColor: '#ff867c',
            borderRadius: 4,
            borderWidth: 0
          }]
        },
        options: {
          indexAxis: 'y',
          aspectRatio: 2.5,
          scales: {
            x: { beginAtZero: true, grid: { color: amoledColors.grid, drawBorder: false } },
            y: { grid: { color: 'transparent', drawBorder: false } }
          },
          plugins: { 
            legend: { display: false },
            zoom: {
              pan: { enabled: true, mode: 'y' },
              zoom: { wheel: { enabled: true, modifierKey: 'ctrl' }, pinch: { enabled: true }, mode: 'y' }
            }
          }
        }
      });

      // Render Time of Day Chart
      if (timeChart) timeChart.destroy();
      const timeCtx = document.getElementById('cfa-time-chart') as HTMLCanvasElement;
      const timeLabels = hoursCount.map((_, i) => `${i}:00`);
      
      const timeGradient = timeCtx.getContext('2d')!.createLinearGradient(0, 0, 0, 400);
      timeGradient.addColorStop(0, '#4fc3f7');
      timeGradient.addColorStop(1, '#0288d1');

      timeChart = new Chart(timeCtx, {
        type: 'bar',
        data: {
          labels: timeLabels,
          datasets: [{
            data: hoursCount,
            backgroundColor: timeGradient,
            borderRadius: 4,
            borderWidth: 0
          }]
        },
        options: {
          aspectRatio: 1.5,
          scales: {
            x: { grid: { color: 'transparent', drawBorder: false }, ticks: {maxTicksLimit: 12} },
            y: { beginAtZero: true, grid: { color: amoledColors.grid, drawBorder: false } }
          },
          plugins: { legend: { display: false } }
        }
      });

      // Render Contest Speed Chart
      if (speedChart) speedChart.destroy();
      const speedCtx = document.getElementById('cfa-speed-chart') as HTMLCanvasElement;
      speedChart = new Chart(speedCtx, {
        type: 'bar',
        data: {
          labels: ['0-10m', '10-30m', '30-60m', '1-2h', '2h+'],
          datasets: [{
            data: speedBuckets,
            backgroundColor: '#64b5f6',
            borderRadius: 4,
            borderWidth: 0
          }]
        },
        options: {
          aspectRatio: 1.5,
          scales: {
            x: { grid: { color: 'transparent', drawBorder: false } },
            y: { beginAtZero: true, grid: { color: amoledColors.grid, drawBorder: false } }
          },
          plugins: { legend: { display: false } }
        }
      });

      // Render Moving Average Chart
      if (movingAvgChart) movingAvgChart.destroy();
      const maCtx = document.getElementById('cfa-moving-avg-chart') as HTMLCanvasElement;
      
      const windowSize = 20;
      const maData: number[] = [];
      const maLabels: string[] = [];
      let sum = 0;
      for (let i = 0; i < acTimeline.length; i++) {
          sum += acTimeline[i].rating;
          if (i >= windowSize) {
              sum -= acTimeline[i - windowSize].rating;
              maData.push(sum / windowSize);
              const d = new Date(acTimeline[i].date * 1000);
              maLabels.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
          } else {
              maData.push(sum / (i + 1));
              const d = new Date(acTimeline[i].date * 1000);
              maLabels.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`);
          }
      }

      const maGradient = maCtx.getContext('2d')!.createLinearGradient(0, 0, 0, 400);
      maGradient.addColorStop(0, 'rgba(255, 119, 169, 0.5)');
      maGradient.addColorStop(1, 'rgba(255, 119, 169, 0.0)');

      movingAvgChart = new Chart(maCtx, {
        type: 'line',
        data: {
          labels: maLabels,
          datasets: [{
            data: maData,
            borderColor: '#ff77a9',
            backgroundColor: maGradient,
            borderWidth: 2,
            fill: true,
            pointRadius: 0,
            pointHitRadius: 10,
            tension: 0.4
          }]
        },
        options: {
          aspectRatio: 3,
          scales: {
            x: { grid: { color: amoledColors.grid, drawBorder: false }, ticks: { maxTicksLimit: 10 } },
            y: { grid: { color: amoledColors.grid, drawBorder: false } }
          },
          plugins: { 
            legend: { display: false },
            zoom: {
              pan: { enabled: true, mode: 'x' },
              zoom: { wheel: { enabled: true, modifierKey: 'ctrl' }, pinch: { enabled: true }, mode: 'x' }
            }
          }
        }
      });

    };

    // Fetch and init
    try {
      const cacheKey = `cfa_subs_${handle}`;
      let cachedSubs: any[] = [];
      
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const isReload = navEntry && navEntry.type === 'reload';
      
      if (!isReload) {
          const cached = await browser.storage.local.get(cacheKey);
          cachedSubs = cached[cacheKey] || [];
      } else {
          // Clear old cache on reload to force a clean build
          await browser.storage.local.remove(cacheKey);
      }

      let fetchUrl = `https://codeforces.com/api/user.status?handle=${handle}`;
      if (cachedSubs.length > 0) {
          fetchUrl += `&from=1&count=200`; // Fetch recent 200 for incremental update
      }

      const minifySubmissions = (subs: any[]) => subs.map(s => ({
          id: s.id,
          creationTimeSeconds: s.creationTimeSeconds,
          verdict: s.verdict,
          relativeTimeSeconds: s.relativeTimeSeconds,
          author: { participantType: s.author?.participantType },
          problem: {
              contestId: s.problem?.contestId,
              index: s.problem?.index,
              name: s.problem?.name,
              rating: s.problem?.rating,
              tags: s.problem?.tags || []
          }
      }));

      const res = await fetch(fetchUrl);
      const data = await res.json();
      if (data.status === "OK") {
        const fetchedSubs = minifySubmissions(data.result);
        
        if (cachedSubs.length > 0) {
            // Check if there is a gap between the oldest fetched sub and the newest cached sub
            if (fetchedSubs.length === 200 && fetchedSubs[199].id > cachedSubs[0]?.id) {
                 // Too many new subs, there is a gap. Fetch all to be safe.
                 const fullRes = await fetch(`https://codeforces.com/api/user.status?handle=${handle}`);
                 const fullData = await fullRes.json();
                 submissions = minifySubmissions(fullData.result || fetchedSubs);
            } else {
                 // Merge fetchedSubs into cachedSubs (overwriting old entries with fresh data)
                 const subMap = new Map();
                 for (const sub of cachedSubs) {
                     subMap.set(sub.id, sub);
                 }
                 for (const sub of fetchedSubs) {
                     subMap.set(sub.id, sub); // Overwrites (e.g. TESTING -> OK)
                 }
                 // Sort descending by ID
                 submissions = Array.from(subMap.values()).sort((a, b) => b.id - a.id);
            }
        } else {
            submissions = fetchedSubs;
        }

        try {
            await browser.storage.local.set({ [cacheKey]: submissions });
        } catch(e) {
            console.warn('Cache quota exceeded for submissions', e);
        }

        try {
            globalRatings = await sendMessage('fetchProblemRatings', undefined);
        } catch(e) {
            console.error("Failed to fetch global ratings for prediction", e);
        }
        processHeatmapData();
        renderCharts();
      }
    } catch (e) {
      console.error("Failed to load user status for analytics", e);
    }

    // Attach event listeners
    document.getElementById('cfa-apply-filters')?.addEventListener('click', renderCharts);
    document.getElementById('cfa-reset-filters')?.addEventListener('click', () => {
      (document.getElementById('cfa-min-rating') as HTMLInputElement).value = '';
      (document.getElementById('cfa-max-rating') as HTMLInputElement).value = '';
      (document.getElementById('cfa-min-date') as HTMLInputElement).value = '';
      (document.getElementById('cfa-max-date') as HTMLInputElement).value = '';
      renderCharts();
    });

    // Chart visibility toggles
    const settingsBtn = document.getElementById('cfa-chart-settings-btn');
    const settingsMenu = document.getElementById('cfa-chart-settings-menu');
    
    settingsBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (settingsMenu) {
            settingsMenu.style.display = settingsMenu.style.display === 'none' ? 'block' : 'none';
        }
    });

    document.addEventListener('click', (e) => {
        if (settingsMenu && !settingsMenu.contains(e.target as Node) && e.target !== settingsBtn) {
            settingsMenu.style.display = 'none';
        }
    });

    // Load saved settings
    browser.storage.local.get(['cfa_visible_charts', 'cfa_chart_order']).then((res) => {
        const visibleCharts = res.cfa_visible_charts || ['moving-avg'];
        const chartOrder = res.cfa_chart_order || ['moving-avg', 'ratings', 'weakness', 'tags', 'speed-time', 'unsolved'];
        
        // Apply initial order
        const controlsContainer = document.getElementById('cfa-chart-controls-container');
        const cardContainer = document.querySelector('.cfa-card');
        
        if (controlsContainer && cardContainer) {
            chartOrder.forEach(id => {
                const control = controlsContainer.querySelector(`.cfa-chart-control[data-id="${id}"]`);
                if (control) controlsContainer.appendChild(control);
                
                const chart = document.getElementById(`cfa-container-${id}`);
                if (chart) cardContainer.appendChild(chart);
            });
        }

        // Apply visibility
        document.querySelectorAll('.cfa-toggle-cb').forEach(cb => {
            const target = cb as HTMLInputElement;
            target.checked = visibleCharts.includes(target.value);
            const container = document.getElementById(`cfa-container-${target.value}`);
            if (container) {
                if (target.checked) {
                    container.style.display = target.value === 'speed-time' ? 'flex' : 'block';
                } else {
                    container.style.display = 'none';
                }
            }
        });
    });

    const saveOrder = () => {
        const order = Array.from(document.querySelectorAll('.cfa-chart-control')).map(el => (el as HTMLElement).dataset.id);
        browser.storage.local.set({ cfa_chart_order: order });
    };

    document.querySelectorAll('.cfa-order-up').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const control = (e.target as HTMLElement).closest('.cfa-chart-control') as HTMLElement;
            if (control && control.previousElementSibling) {
                const prev = control.previousElementSibling as HTMLElement;
                control.parentNode?.insertBefore(control, prev);
                
                const id = control.dataset.id;
                const prevId = prev.dataset.id;
                const chart = document.getElementById(`cfa-container-${id}`);
                const prevChart = document.getElementById(`cfa-container-${prevId}`);
                
                if (chart && prevChart) {
                    chart.parentNode?.insertBefore(chart, prevChart);
                }
                saveOrder();
            }
        });
    });

    document.querySelectorAll('.cfa-order-down').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const control = (e.target as HTMLElement).closest('.cfa-chart-control') as HTMLElement;
            if (control && control.nextElementSibling) {
                const next = control.nextElementSibling as HTMLElement;
                control.parentNode?.insertBefore(next, control);
                
                const id = control.dataset.id;
                const nextId = next.dataset.id;
                const chart = document.getElementById(`cfa-container-${id}`);
                const nextChart = document.getElementById(`cfa-container-${nextId}`);
                
                if (chart && nextChart) {
                    chart.parentNode?.insertBefore(nextChart, chart);
                }
                saveOrder();
            }
        });
    });

    document.querySelectorAll('.cfa-toggle-cb').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            const container = document.getElementById(`cfa-container-${target.value}`);
            if (container) {
                if (target.checked) {
                    container.style.display = target.value === 'speed-time' ? 'flex' : 'block';
                } else {
                    container.style.display = 'none';
                }
            }
            
            // Save settings
            const visible = Array.from(document.querySelectorAll('.cfa-toggle-cb'))
                .filter((el) => (el as HTMLInputElement).checked)
                .map((el) => (el as HTMLInputElement).value);
            browser.storage.local.set({ cfa_visible_charts: visible });
        });
    });

    document.getElementById('cfa-heatmap-year')?.addEventListener('change', (e) => {
        const val = (e.target as HTMLSelectElement).value;
        if (val === 'last_year') {
            renderHeatmap('last_year');
        } else {
            const year = parseInt(val);
            if (!isNaN(year)) renderHeatmap(year.toString());
        }
    });

    // Custom Tooltip for Heatmap
    const tooltip = document.createElement('div');
    tooltip.id = 'cfa-heatmap-tooltip';
    tooltip.style.cssText = 'position: absolute; display: none; background: rgba(0, 0, 0, 0.9); backdrop-filter: blur(4px); border: 1px solid #444; padding: 10px; border-radius: 6px; z-index: 99999; color: #fff; font-size: 12px; pointer-events: none; min-width: 150px; max-width: 280px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); transition: opacity 0.1s; line-height: 1.4;';
    document.body.appendChild(tooltip);

    document.getElementById('cfa-heatmap-container')?.addEventListener('mouseover', (e) => {
        const target = (e.target as HTMLElement).closest('.cfa-heatmap-cell') as HTMLElement;
        if (target) {
            const dateStr = target.getAttribute('data-date');
            if (dateStr && heatmapData.has(dateStr)) {
                const data = heatmapData.get(dateStr)!;
                let html = `<strong style="display:block;margin-bottom:6px;color:#e0e0e0;border-bottom:1px solid #333;padding-bottom:4px;">${dateStr} (${data.problems.size} problems)</strong>`;
                
                const probs = Array.from(data.problems.values()).sort((a, b) => b.rating - a.rating);
                const maxProbs = 10;
                for (let i = 0; i < Math.min(probs.length, maxProbs); i++) {
                    const p = probs[i];
                    const color = ratingSpanColorHex(p.rating);
                    html += `<div style="margin-bottom:2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;"><span style="color:${color};font-weight:bold;display:inline-block;width:35px;">${p.rating || 'N/A'}</span> <span style="color:#aaa;">${p.name}</span></div>`;
                }
                if (probs.length > maxProbs) {
                    html += `<div style="color:#888;font-size:10px;margin-top:4px;">+ ${probs.length - maxProbs} more...</div>`;
                }
                
                tooltip.innerHTML = html;
                tooltip.style.display = 'block';
                
                const rect = target.getBoundingClientRect();
                tooltip.style.left = (rect.left + window.scrollX - tooltip.offsetWidth/2 + rect.width/2) + 'px';
                tooltip.style.top = (rect.top + window.scrollY - tooltip.offsetHeight - 8) + 'px';
            } else if (dateStr) {
                tooltip.innerHTML = `<strong style="color:#e0e0e0;">${dateStr}</strong><br/><span style="color:#888;">0 problems</span>`;
                tooltip.style.display = 'block';
                const rect = target.getBoundingClientRect();
                tooltip.style.left = (rect.left + window.scrollX - tooltip.offsetWidth/2 + rect.width/2) + 'px';
                tooltip.style.top = (rect.top + window.scrollY - tooltip.offsetHeight - 8) + 'px';
            }
        }
    });
    
    document.getElementById('cfa-heatmap-container')?.addEventListener('mouseout', (e) => {
        const target = (e.target as HTMLElement).closest('.cfa-heatmap-cell') as HTMLElement;
        if (target) {
            tooltip.style.display = 'none';
        }
    });

    // Submissions Modal
    const modal = document.createElement('div');
    modal.id = 'cfa-day-submissions-modal';
    modal.style.cssText = 'position: fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index: 100000; display:none; justify-content:center; align-items:center;';
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    document.getElementById('cfa-heatmap-container')?.addEventListener('click', (e) => {
        const target = (e.target as HTMLElement).closest('.cfa-heatmap-cell') as HTMLElement;
        if (target) {
            const dateStr = target.getAttribute('data-date');
            if (dateStr) {
                if (!document.getElementById('cfa-spin-style')) {
                    const style = document.createElement('style');
                    style.id = 'cfa-spin-style';
                    style.textContent = '@keyframes cfa-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
                    document.head.appendChild(style);
                }

                modal.innerHTML = `
                <div style="background:#000; border:1px solid #333; border-radius:8px; width:700px; max-height:80vh; display:flex; flex-direction:column; box-shadow: 0 10px 30px rgba(0,0,0,0.8);">
                    <div style="padding:15px 20px; border-bottom:1px solid #333; display:flex; justify-content:space-between; align-items:center;">
                        <h3 style="margin:0; color:#fff; font-size: 1.2em;">Submissions on ${dateStr}</h3>
                        <button id="cfa-modal-close" style="background:#222; border:1px solid #444; color:#fff; font-size:18px; cursor:pointer; line-height:1; padding:0; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center;">&times;</button>
                    </div>
                    <div id="cfa-modal-content" style="overflow-y:auto; flex:1; display:flex; justify-content:center; align-items:center; padding: 60px;">
                        <div style="width:30px; height:30px; border:3px solid #333; border-top:3px solid #4fc3f7; border-radius:50%; animation: cfa-spin 1s linear infinite;"></div>
                    </div>
                </div>`;
                
                modal.style.display = 'flex';
                document.getElementById('cfa-modal-close')?.addEventListener('click', () => {
                    modal.style.display = 'none';
                });

                setTimeout(() => {
                    const daySubs = submissions.filter(sub => {
                        const d = new Date(sub.creationTimeSeconds * 1000);
                        const yyyy = d.getFullYear();
                        const mm = String(d.getMonth() + 1).padStart(2, '0');
                        const dd = String(d.getDate()).padStart(2, '0');
                        return `${yyyy}-${mm}-${dd}` === dateStr;
                    });

                    if (daySubs.length === 0) {
                        const content = document.getElementById('cfa-modal-content');
                        if (content) content.innerHTML = '<div style="color:#888;">No submissions found.</div>';
                        return;
                    }

                    daySubs.sort((a, b) => b.creationTimeSeconds - a.creationTimeSeconds);

                    let rows = daySubs.map(sub => {
                        const d = new Date(sub.creationTimeSeconds * 1000);
                        const time = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
                        const probUrl = (sub.problem.contestId && sub.problem.contestId <= 9999) 
                            ? `/contest/${sub.problem.contestId}/submission/${sub.id}`
                            : `/gym/${sub.problem.contestId}/submission/${sub.id}`;
                        const verdictColor = sub.verdict === 'OK' ? '#81c784' : '#e57373';
                        const ratingStr = sub.problem.rating ? `<span style="color:${ratingSpanColorHex(sub.problem.rating)}; font-weight:bold; margin-right:8px; display:inline-block; width:35px;">${sub.problem.rating}</span>` : '';
                        
                        return `
                        <tr>
                            <td style="padding:10px 15px; border-bottom:1px solid #222; width: 60px; color:#888;">${time}</td>
                            <td style="padding:10px 15px; border-bottom:1px solid #222;">
                                <a href="${probUrl}" target="_blank" style="color:#4fc3f7; text-decoration:none;">${ratingStr}${sub.problem.name}</a>
                            </td>
                            <td style="padding:10px 15px; border-bottom:1px solid #222; color:${verdictColor}; font-weight:bold;">${sub.verdict}</td>
                        </tr>`;
                    }).join('');

                    const content = document.getElementById('cfa-modal-content');
                    if (content) {
                        content.style.display = 'block';
                        content.style.padding = '0';
                        content.innerHTML = `
                            <table style="width:100%; color:#e0e0e0; text-align:left; border-collapse:collapse; font-size: 0.95em;">
                                <thead style="background: #111; position: sticky; top: 0;">
                                    <tr>
                                        <th style="padding:12px 15px; border-bottom:1px solid #333; color:#aaa;">Time</th>
                                        <th style="padding:12px 15px; border-bottom:1px solid #333; color:#aaa;">Problem</th>
                                        <th style="padding:12px 15px; border-bottom:1px solid #333; color:#aaa;">Verdict</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${rows}
                                </tbody>
                            </table>`;
                    }
                }, 10);
            }
        }
    });

  }
});
