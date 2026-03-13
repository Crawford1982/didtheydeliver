// ============================================================
// DID THEY DELIVER — Main JS
// All API calls, rendering, and interactivity
// ============================================================

'use strict';

// ── Clock ────────────────────────────────────────────────────
function startClock() {
  const el = document.getElementById('clock');
  if (!el) return;
  const tick = () => {
    el.textContent = new Date().toLocaleTimeString('en-GB');
  };
  tick();
  setInterval(tick, 1000);
}

// ── Counter animation ────────────────────────────────────────
function animateCount(el, target, duration = 1800) {
  const start = performance.now();
  const update = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(ease * target);
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = target;
  };
  requestAnimationFrame(update);
}

// ── ONS API: CPI Inflation ───────────────────────────────────
// Docs: https://api.beta.ons.gov.uk/v1
// Dataset: CZMI (CPIH), timeseries: L55O (CPI annual rate)
async function fetchCPI() {
  try {
    const url = 'https://api.beta.ons.gov.uk/v1/datasets/cpih01/editions/time-series/versions/25/observations?time=*&aggregate=cpih1dim1A0&geography=K02000001';
    // ONS API can be slow - use a static fallback while you wire a CF Worker
    // TODO: Replace with CF Worker endpoint to avoid CORS issues
    throw new Error('Use CF Worker for CORS'); // remove this line once Worker is set up
  } catch {
    // Static fallback — update monthly from https://www.ons.gov.uk/economy/inflationandpriceindices
    return {
      current: '3.0%',
      prev: '3.4%',
      peak: '11.1%',
      peakDate: 'Oct 2022',
      direction: 'down',
      // Simplified chart data: [year, value] from 1997
      chartData: [
        [1997,1.8],[1998,1.6],[1999,1.3],[2000,0.8],[2001,1.2],[2002,1.3],
        [2003,1.4],[2004,1.3],[2005,2.1],[2006,2.3],[2007,2.3],[2008,3.6],
        [2009,2.2],[2010,3.3],[2011,4.5],[2012,2.8],[2013,2.6],[2014,1.5],
        [2015,0.0],[2016,0.7],[2017,2.7],[2018,2.5],[2019,1.7],[2020,0.9],
        [2021,2.5],[2022,9.1],[2023,6.8],[2024,2.5],[2025,3.0]
      ]
    };
  }
}

// ── ONS API: Net Migration ───────────────────────────────────
// Source: https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/internationalmigration
async function fetchMigration() {
  // TODO: Wire to ONS migration API via CF Worker
  // ONS dataset: Long-term international migration provisional
  return {
    current: '204,000',
    currentRaw: 204000,
    year: 'YE Jun 2025',
    peak: '944,000',
    peakYear: '2023',
    bars: [
      { label: '2010 target', value: 10000, max: 944000, color: '#3182ce' },
      { label: 'Blair peak',  value: 185000, max: 944000, color: '#e53e3e' },
      { label: 'Cameron',     value: 330000, max: 944000, color: '#3182ce' },
      { label: '2023 peak',   value: 944000, max: 944000, color: '#ff3c5a' },
      { label: 'Now',         value: 204000, max: 944000, color: '#f59e0b' },
    ]
  };
}

// ── NHS Waiting List ─────────────────────────────────────────
// Source: https://www.england.nhs.uk/statistics/statistical-work-areas/rtt-waiting-times/
async function fetchNHS() {
  // TODO: Wire to NHS England stats API via CF Worker
  return {
    waiting: '7.54M',
    targetWeeks: 18,
    avgWeeks: 63,
    changeSince2010: '+350%',
    pmsMeetTarget: 0,
  };
}

// ── Build CPI Chart ──────────────────────────────────────────
function buildCPIChart(data) {
  const svg = document.getElementById('cpi-svg');
  if (!svg || !data.chartData) return;

  const W = 280, H = 120;
  const pad = { t: 8, r: 8, b: 20, l: 28 };
  const iW = W - pad.l - pad.r;
  const iH = H - pad.t - pad.b;

  const vals = data.chartData.map(d => d[1]);
  const years = data.chartData.map(d => d[0]);
  const minV = 0, maxV = Math.max(...vals) * 1.1;
  const n = data.chartData.length;

  const x = i => pad.l + (i / (n - 1)) * iW;
  const y = v => pad.t + iH - ((v - minV) / (maxV - minV)) * iH;

  // Grid lines
  [0, 3, 6, 9].forEach(v => {
    const yy = y(v);
    svg.innerHTML += `<line x1="${pad.l}" y1="${yy}" x2="${W - pad.r}" y2="${yy}" stroke="#1a2d40" stroke-width="0.5"/>`;
    svg.innerHTML += `<text x="${pad.l - 3}" y="${yy + 3}" font-family="Share Tech Mono" font-size="7" fill="#334d63" text-anchor="end">${v}%</text>`;
  });

  // Area
  const pts = data.chartData.map((d, i) => `${x(i)},${y(d[1])}`).join(' ');
  const areaBottom = pad.t + iH;
  svg.innerHTML += `<defs>
    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ff3c5a" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#ff3c5a" stop-opacity="0"/>
    </linearGradient>
  </defs>`;
  svg.innerHTML += `<polygon points="${pts} ${x(n-1)},${areaBottom} ${x(0)},${areaBottom}" fill="url(#g1)"/>`;
  svg.innerHTML += `<polyline points="${pts}" fill="none" stroke="#ff3c5a" stroke-width="1.5" stroke-linejoin="round"/>`;

  // Peak marker
  const peakIdx = vals.indexOf(Math.max(...vals));
  const px = x(peakIdx), py = y(vals[peakIdx]);
  svg.innerHTML += `<circle cx="${px}" cy="${py}" r="3" fill="#ff3c5a"/>`;
  svg.innerHTML += `<text x="${px + 4}" y="${py - 3}" font-family="Share Tech Mono" font-size="7" fill="#ff3c5a">${data.peak}</text>`;

  // Year labels
  [0, Math.floor(n * 0.3), Math.floor(n * 0.7), n - 1].forEach(i => {
    svg.innerHTML += `<text x="${x(i)}" y="${H - 3}" font-family="Share Tech Mono" font-size="7" fill="#334d63" text-anchor="middle">${years[i]}</text>`;
  });
}

// ── Render PM Cards ──────────────────────────────────────────
function renderPMs() {
  const grid = document.getElementById('pm-grid');
  if (!grid) return;

  PM_DATA.forEach(pm => {
    const barColor = pm.delivery_score >= 40 ? '#f59e0b' : pm.delivery_score >= 25 ? '#ff9100' : '#ff3c5a';
    const partyClass = pm.party === 'Labour' ? 'lab' : 'con';
    const activeClass = pm.active ? 'active-pm' : '';
    const tenure = pm.active
      ? `${Math.floor((Date.now() - new Date('2024-07-05')) / 86400000)} days`
      : `${pm.tenure_days} days`;

    grid.innerHTML += `
      <div class="pm-card ${partyClass} ${activeClass}" onclick="openModal('${pm.id}')">
        <div class="pm-initial">${pm.image_initial}</div>
        <div class="pm-name">${pm.name}</div>
        <div class="pm-years">${pm.years} · ${tenure}</div>
        <div class="pm-party">${pm.party.toUpperCase()}</div>
        <div class="pm-scores">
          <div class="pm-score-box">
            <div class="pm-score-num" style="color:var(--accent2)">${pm.broken}</div>
            <div class="pm-score-lbl">Broken</div>
          </div>
          <div class="pm-score-box">
            <div class="pm-score-num" style="color:var(--green)">${pm.kept}</div>
            <div class="pm-score-lbl">Kept</div>
          </div>
        </div>
        <div class="pm-bar">
          <div class="pm-bar-fill" style="width:${pm.delivery_score}%;background:${barColor}"></div>
        </div>
        <div class="pm-verdict">${pm.verdict}</div>
      </div>`;
  });
}

// ── PM Detail Modal ──────────────────────────────────────────
function openModal(pmId) {
  const pm = PM_DATA.find(p => p.id === pmId);
  if (!pm) return;

  const partyColor = pm.party === 'Labour' ? 'var(--lab)' : 'var(--con)';

  document.getElementById('modal-title').textContent = pm.name;
  document.getElementById('modal-sub').innerHTML =
    `<span style="color:${partyColor}">${pm.party}</span> · ${pm.years} · 
     Delivery score: <span style="color:var(--accent2)">${pm.delivery_score}%</span>`;

  const list = document.getElementById('modal-promise-list');
  list.innerHTML = pm.key_promises.map(p => {
    const icon = p.kept === true ? '✓' : p.kept === false ? '✗' : '~';
    const color = p.kept === true ? 'var(--green)' : p.kept === false ? 'var(--accent2)' : 'var(--amber)';
    const label = p.kept === true ? 'KEPT' : p.kept === false ? 'BROKEN' : 'PARTIAL';
    return `
      <div class="promise-item">
        <div class="promise-icon" style="color:${color}">${icon}</div>
        <div>
          <div class="promise-text">${p.promise}</div>
          <div class="promise-note">
            <span style="color:${color};font-family:var(--mono);font-size:8px">${label}</span>
            — ${p.notes}
          </div>
        </div>
      </div>`;
  }).join('');

  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

// ── Render Media Bias ────────────────────────────────────────
function renderMedia() {
  const grid = document.getElementById('media-grid');
  if (!grid) return;

  MEDIA_DATA.forEach(m => {
    // Convert lean (-1 to 1) to percentage (0% to 100%)
    const pct = ((m.lean + 1) / 2) * 100;
    grid.innerHTML += `
      <div class="media-item">
        <div>
          <div class="media-name">${m.name}</div>
          <div class="media-owner">${m.owner}<br><span style="color:var(--text4)">${m.nationality}</span></div>
        </div>
        <div class="media-bar-wrap">
          <div class="media-bar-mid"></div>
          <div class="media-dot" style="left:${pct}%;background:${m.leanColor}"></div>
        </div>
        <div class="media-lean" style="color:${m.leanColor}">${m.leanLabel}</div>
      </div>`;
  });
}

// ── Render Threat Level ──────────────────────────────────────
function renderThreat() {
  const word = document.getElementById('threat-word');
  const ni = document.getElementById('threat-ni-word');
  if (word) word.textContent = CURRENT_THREAT.national;
  if (ni) ni.textContent = CURRENT_THREAT.northern_ireland;

  // Highlight active level
  document.querySelectorAll('.threat-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.level === CURRENT_THREAT.national) {
      item.classList.add('active');
    }
  });
}

// ── MP Postcode Lookup ───────────────────────────────────────
// Uses UK Parliament Members API — completely free, no key needed
// Docs: https://members-api.parliament.uk/
async function lookupMP() {
  const input = document.getElementById('mp-postcode');
  const result = document.getElementById('mp-result');
  if (!input || !result) return;

  const postcode = input.value.trim().toUpperCase().replace(/\s+/g, '');
  if (!postcode) return;

  result.innerHTML = '<div style="font-family:var(--mono);font-size:9px;color:var(--text2)">Searching...</div>';

  try {
    // Step 1: postcode → constituency via postcodes.io (free, no key)
    const pcRes = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`);
    const pcData = await pcRes.json();

    if (pcData.status !== 200) throw new Error('Invalid postcode');

    const constituency = pcData.result.parliamentary_constituency;
    const constituency25 = pcData.result.parliamentary_constituency_2025;
    const consName = constituency25 || constituency;

    // Step 2: constituency name → MP via Parliament Members API
    const mpRes = await fetch(
      `https://members-api.parliament.uk/api/Members/Search?constituency=${encodeURIComponent(consName)}&house=1&IsCurrentMember=true`
    );
    const mpData = await mpRes.json();

    if (!mpData.items || mpData.items.length === 0) throw new Error('MP not found');

    const mp = mpData.items[0].value;
    const party = mp.latestParty?.name || 'Unknown';
    const partyColor = party.includes('Labour') ? 'var(--lab)' :
                       party.includes('Conservative') ? 'var(--con)' :
                       party.includes('SNP') ? '#f59e0b' :
                       party.includes('Liberal') ? '#d4a017' : 'var(--text)';

    result.innerHTML = `
      <div class="mp-result-name">${mp.nameDisplayAs}</div>
      <div class="mp-result-detail">
        <span style="color:${partyColor}">${party}</span>
      </div>
      <div class="mp-result-detail">${consName}</div>
      <div class="mp-result-detail" style="margin-top:6px">
        <a class="mp-result-link" href="https://www.theyworkforyou.com/search/?q=${encodeURIComponent(mp.nameDisplayAs)}" target="_blank" rel="noopener">
          → Voting record (TheyWorkForYou)
        </a>
      </div>
      <div class="mp-result-detail" style="margin-top:4px">
        <a class="mp-result-link" href="https://members.parliament.uk/member/${mp.id}/contact" target="_blank" rel="noopener">
          → Contact your MP
        </a>
      </div>`;

  } catch (err) {
    result.innerHTML = `<div style="color:var(--accent2);font-family:var(--mono);font-size:9px">
      ${err.message === 'Invalid postcode' ? 'Invalid postcode — try e.g. SW1A 1AA' : 'Could not find MP. Check postcode.'}
    </div>`;
  }
}

// ── News Tabs ────────────────────────────────────────────────
// TODO: Replace static news with RSS feeds via CF Worker
// Worker should fetch and return JSON from:
// BBC: https://feeds.bbci.co.uk/news/politics/rss.xml
// Guardian: https://www.theguardian.com/politics/rss
// Mail: https://www.dailymail.co.uk/news/index.rss
// Telegraph: https://www.telegraph.co.uk/rss.xml
// Sky: https://feeds.skynews.com/feeds/rss/politics.xml

function initNewsTabs() {
  document.querySelectorAll('.news-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.news-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      // TODO: filter news feed by source
    });
  });
}

// ── Init ─────────────────────────────────────────────────────
async function init() {
  startClock();
  renderPMs();
  renderMedia();
  renderThreat();
  initNewsTabs();

  // Animate broken promise counter
  const counterEl = document.getElementById('counter-num');
  if (counterEl) {
    const total = PM_DATA.reduce((sum, pm) => sum + pm.broken, 0);
    document.getElementById('header-promises').textContent = total;
    animateCount(counterEl, total, 2000);
  }

  // Load live data
  const [cpi, migration, nhs] = await Promise.all([
    fetchCPI(),
    fetchMigration(),
    fetchNHS()
  ]);

  // CPI
  buildCPIChart(cpi);
  document.getElementById('cpi-current').textContent = cpi.current;
  document.getElementById('cpi-peak').textContent = cpi.peak;

  // Migration
  document.getElementById('mig-num').textContent = migration.current;
  const barsEl = document.getElementById('mig-bars');
  if (barsEl) {
    migration.bars.forEach(b => {
      const pct = Math.round((b.value / b.max) * 100);
      barsEl.innerHTML += `
        <div class="mig-row">
          <div class="mig-lbl">${b.label}</div>
          <div class="mig-track">
            <div class="mig-fill" style="width:${pct}%;background:${b.color}"></div>
          </div>
          <div class="mig-val" style="color:${b.color}">${(b.value / 1000).toFixed(0)}K</div>
        </div>`;
    });
  }

  // NHS
  document.getElementById('nhs-num').textContent = nhs.waiting;
}

// Modal close on overlay click
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay') closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
  init();
});
