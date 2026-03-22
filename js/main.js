// ============================================================
// DID THEY DELIVER — Main app logic
// Map, PM panel, headlines, modal, MP lookup, data view, a11y
// ============================================================

'use strict';

let currentPMId = 'starmer';
let currentView = 'map';
let mapObj = null;
let constituenciesLayer = null;
let nhsMarkersLayer = null;
let promiseMarkersLayer = null;
let modalPreviousFocus = null;

document.addEventListener('DOMContentLoaded', () => {
  startClock();
  buildNavDropdown();
  buildPMSelect();
  applyUrlPM();
  loadPM(currentPMId);
  loadHeadlinesFromJSON();
  buildCPISpark();

  const total = typeof STATS !== 'undefined' ? STATS.brokenTotal : PMS.reduce((s, p) => s + p.broken, 0);
  animCount(document.getElementById('nav-broken'), total, 1500);
  animCount(document.getElementById('rc-broken'), total, 1800);

  switchView('map', document.getElementById('btn-view-map'));

  document.getElementById('map-retry').addEventListener('click', () => loadGeoJSON());
  document.getElementById('btn-sources').addEventListener('click', openSources);
  document.getElementById('sources-close-btn').addEventListener('click', closeSources);

  document.addEventListener('click', e => {
    if (!e.target.closest('.pm-wrap')) closeDrop();
  });
  document.getElementById('mbg').addEventListener('click', e => {
    if (e.target.id === 'mbg') closeMod();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (document.getElementById('pm-drop').classList.contains('open')) {
        closeDrop();
        document.getElementById('pm-btn').focus();
      } else if (document.getElementById('mbg').classList.contains('open')) {
        closeMod();
      } else if (!document.getElementById('sources-bg').classList.contains('hidden')) {
        closeSources();
      }
    }
  });

  trapModalFocus('mbg', 'modal-close-btn');
  trapModalFocus('sources-bg', 'sources-close-btn');

  initMobileBottomPanels();
  window.addEventListener('resize', initMobileBottomPanels);
});

function initMobileBottomPanels() {
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const newsPanel = document.getElementById('b-news');
  const pmPanel = document.getElementById('b-pm');
  const tabs = document.querySelectorAll('.bmt-tab');
  if (!isMobile) {
    newsPanel?.classList.remove('mobile-hidden');
    pmPanel?.classList.remove('mobile-hidden');
    return;
  }
  const activeTab = document.querySelector('.bmt-tab.active');
  const panel = activeTab?.dataset.panel || 'news';
  newsPanel?.classList.toggle('mobile-hidden', panel !== 'news');
  pmPanel?.classList.toggle('mobile-hidden', panel !== 'pm');
}

function switchBottomPanel(panel, el) {
  if (!window.matchMedia('(max-width: 768px)').matches) return;
  document.querySelectorAll('.bmt-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.bottom-panel').forEach(p => {
    p.classList.toggle('mobile-hidden', p.dataset.bottomPanel !== panel);
  });
}

function toggleSidebarMobile() {
  const sidebar = document.getElementById('sidebar');
  const btn = document.getElementById('sidebar-toggle');
  const overlay = document.getElementById('sidebar-overlay');
  if (!sidebar || !btn) return;
  const open = sidebar.classList.toggle('mobile-open');
  btn.setAttribute('aria-expanded', open);
  overlay?.classList.toggle('visible', open);
  if (overlay) overlay.setAttribute('aria-hidden', !open);
}

function closeSidebarMobile() {
  const sidebar = document.getElementById('sidebar');
  const btn = document.getElementById('sidebar-toggle');
  const overlay = document.getElementById('sidebar-overlay');
  if (sidebar) sidebar.classList.remove('mobile-open');
  if (btn) btn.setAttribute('aria-expanded', 'false');
  if (overlay) {
    overlay.classList.remove('visible');
    overlay.setAttribute('aria-hidden', 'true');
  }
}

function applyUrlPM() {
  const params = new URLSearchParams(window.location.search);
  const pm = params.get('pm');
  if (pm && PMS.some(p => p.id === pm)) {
    currentPMId = pm;
  }
}

function trapModalFocus(bgId, firstFocusId) {
  const bg = document.getElementById(bgId);
  if (!bg) return;
  const focusables = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  bg.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const isOpen = bg.id === 'sources-bg' ? !bg.classList.contains('hidden') : bg.classList.contains('open');
    if (!isOpen) return;
    const container = bg.querySelector('.sources-modal') || bg.querySelector('#modal');
    if (!container) return;
    const els = Array.from(container.querySelectorAll(focusables));
    const first = els[0];
    const last = els[els.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  });
}

function startClock() {
  const clk = document.getElementById('nclock');
  const dt = document.getElementById('sit-dt');
  const tick = () => {
    const n = new Date();
    clk.textContent = n.toLocaleTimeString('en-GB');
    dt.textContent = n.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase() + ' ' + n.toLocaleTimeString('en-GB') + ' GMT';
  };
  tick();
  setInterval(tick, 1000);
}

function buildNavDropdown() {
  const drop = document.getElementById('pm-drop');
  PMS.forEach(pm => {
    const d = document.createElement('div');
    d.className = 'pm-opt' + (pm.id === currentPMId ? ' sel' : '');
    d.dataset.id = pm.id;
    d.setAttribute('role', 'option');
    d.tabIndex = 0;
    d.innerHTML = `<div class="od" style="background:${pm.cls === 'lab' ? 'var(--lab)' : 'var(--con)'}"></div><div class="on">${pm.fn} ${pm.ln}</div><div class="oy">${pm.years}</div>`;
    d.onclick = () => { loadPM(pm.id); closeDrop(); };
    d.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); loadPM(pm.id); closeDrop(); } };
    drop.appendChild(d);
  });
}

function toggleDrop(e) {
  e.stopPropagation();
  const btn = document.getElementById('pm-btn');
  const drop = document.getElementById('pm-drop');
  const open = !drop.classList.toggle('open');
  btn.classList.toggle('open', !open);
  btn.setAttribute('aria-expanded', !open);
}

function closeDrop() {
  document.getElementById('pm-btn').classList.remove('open');
  document.getElementById('pm-btn').setAttribute('aria-expanded', 'false');
  document.getElementById('pm-drop').classList.remove('open');
}

function buildPMSelect() {
  const sel = document.getElementById('pm-select');
  PMS.forEach(pm => {
    const opt = document.createElement('option');
    opt.value = pm.id;
    opt.textContent = `${pm.fn} ${pm.ln} (${pm.years})`;
    if (pm.id === currentPMId) opt.selected = true;
    sel.appendChild(opt);
  });
}

function loadPM(id) {
  currentPMId = id;
  const pm = PMS.find(p => p.id === id);
  if (!pm) return;

  const url = new URL(window.location.href);
  url.searchParams.set('pm', id);
  history.replaceState(null, '', url.toString());

  // === SEO: Dynamic title, meta, canonical & H1 per PM ===
  const pmFull = pm.fn + ' ' + pm.ln;
  const titleTemplates = {
    starmer:  'Keir Starmer Broken Promises Tracker | Did They Deliver?',
    sunak:    'Rishi Sunak Promises & Record | Did They Deliver?',
    truss:    'Liz Truss Record | Did They Deliver?',
    johnson:  'Boris Johnson Broken Promises | Did They Deliver?',
    may:      'Theresa May Pledges & Record | Did They Deliver?',
    cameron:  'David Cameron Broken Promises | Did They Deliver?',
    brown:    'Gordon Brown Record | Did They Deliver?',
    blair:    'Tony Blair Broken Promises | Did They Deliver?'
  };
  const newTitle = titleTemplates[id] || (pmFull + ' — UK PM Pledge Tracker | Did They Deliver?');
  document.title = newTitle;

  const newDesc = pmFull + ' — ' + pm.broken + ' broken pledges, ' + pm.kept + ' kept. ' +
    'Independent, politically neutral UK accountability tracker. Data from ONS, NHS England, Parliament.uk.';
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', newDesc);

  const canonicalUrl = 'https://didtheydeliver.co.uk/?pm=' + id;
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.setAttribute('href', canonicalUrl);

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', newTitle);
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', newDesc);
  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) ogUrl.setAttribute('content', canonicalUrl);
  const twTitle = document.querySelector('meta[name="twitter:title"]');
  if (twTitle) twTitle.setAttribute('content', newTitle);
  const twDesc = document.querySelector('meta[name="twitter:description"]');
  if (twDesc) twDesc.setAttribute('content', newDesc);

  // Update visible H1 in SEO block
  const seoH = document.querySelector('.seo-h');
  if (seoH) seoH.textContent = pmFull + ' — UK Prime Minister Pledge Tracker';

  // Update BreadcrumbList JSON-LD dynamically
  const breadcrumbScript = document.getElementById('ld-breadcrumb');
  if (breadcrumbScript) {
    breadcrumbScript.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://didtheydeliver.co.uk/"},
        {"@type": "ListItem", "position": 2, "name": pmFull + " Promises", "item": canonicalUrl}
      ]
    });
  }
  // ========================================================

  document.getElementById('pm-btn-txt').textContent = pmFull.toUpperCase();
  document.querySelectorAll('.pm-opt').forEach(el => el.classList.toggle('sel', el.dataset.id === id));
  document.getElementById('pm-select').value = id;

  const days = pm.active ? Math.floor((Date.now() - new Date('2024-07-05')) / 86400000) : pm.days;
  const detail = document.getElementById('pm-detail');
  detail.innerHTML = `
    <div class="pm-name-big">
      <span class="pfn">${pm.fn}</span>${pm.ln}
      ${pm.active ? '<span style="font-family:var(--mono);font-size:8px;color:var(--red);letter-spacing:.1em;vertical-align:middle;margin-left:8px">IN OFFICE</span>' : ''}
    </div>
    <div class="pm-party-row">
      <div class="pm-ptag ${pm.cls}">${pm.party.toUpperCase()}</div>
      <div class="pm-days">${days.toLocaleString()} days · ${pm.years}</div>
    </div>
    <div class="pm-score-row">
      <div class="pm-sc"><div class="pm-sc-v" style="color:var(--red)">${pm.broken}</div><div class="pm-sc-l">Broken</div></div>
      <div class="pm-sc"><div class="pm-sc-v" style="color:var(--green)">${pm.kept}</div><div class="pm-sc-l">Kept</div></div>
      <div class="pm-sc"><div class="pm-sc-v" style="color:var(--amber)">${pm.score}%</div><div class="pm-sc-l">Score</div></div>
    </div>
    <div class="pm-approval">
      <div>
        <div class="pm-app-lbl">Net Approval Rating</div>
        <div class="pm-app-src">${pm.appSrc}</div>
        ${pm.appBadge ? `<div style="font-family:var(--mono);font-size:7px;color:var(--red);letter-spacing:.08em;margin-top:2px">${pm.appBadge}</div>` : ''}
      </div>
      <div class="pm-app-v">${pm.approval}</div>
    </div>
    <div class="pm-verdict">${pm.verdict}</div>`;
}

function loadHeadlinesFromJSON() {
  fetch('/data/headlines.json')
    .then(r => r.json())
    .then(data => renderHeadlinesFromJSON(data))
    .catch(() => {
      // Fallback to legacy SPECTRUM_HEADLINES if JSON fetch fails
      renderSpectrumHeadlines();
    });
}

function renderHeadlinesFromJSON(data) {
  const list = document.getElementById('spectrum-list');
  if (!list) return;

  const categories = [
    { key: 'government', label: 'Politics' },
    { key: 'economy', label: 'Economy' },
    { key: 'nhs', label: 'NHS' },
    { key: 'immigration', label: 'Immigration' },
    { key: 'housing', label: 'Housing' },
    { key: 'climate', label: 'Climate' },
    { key: 'education', label: 'Education' },
    { key: 'foreign_policy', label: 'Foreign Policy' }
  ];

  const allHeadlines = [];
  categories.forEach(cat => {
    const items = (data.headlines && data.headlines[cat.key]) || [];
    items.slice(0, 2).forEach(item => {
      allHeadlines.push({ ...item, catLabel: cat.label });
    });
  });

  if (allHeadlines.length === 0) {
    renderSpectrumHeadlines();
    return;
  }

  list.innerHTML = allHeadlines.map(h => {
    return `<article class="spec-card">
      <span class="spec-name">${escapeHtml(h.source)}</span>
      <span class="spec-lean centre">${escapeHtml(h.catLabel)}</span>
      <p class="spec-hl">${escapeHtml(h.title)}</p>
      <a class="spec-link" href="${escapeHtml(h.url)}" target="_blank" rel="noopener noreferrer">Read →</a>
    </article>`;
  }).join('');
}

function renderSpectrumHeadlines() {
  const list = document.getElementById('spectrum-list');
  if (!list || typeof SPECTRUM_HEADLINES === 'undefined') return;
  list.innerHTML = SPECTRUM_HEADLINES.map(h => {
    const leanLabel = (h.lean === 'c-left') ? 'Centre-left' : (h.lean === 'far-r') ? 'Far right' : h.lean.charAt(0).toUpperCase() + h.lean.slice(1);
    return `<article class="spec-card">
      <span class="spec-name">${escapeHtml(h.name)}</span>
      <span class="spec-lean ${h.lean}">${escapeHtml(leanLabel)}</span>
      <p class="spec-hl">${escapeHtml(h.headline)}</p>
      <a class="spec-link" href="${escapeHtml(h.url)}" target="_blank" rel="noopener">Read on site →</a>
    </article>`;
  }).join('');
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function switchView(v, el) {
  currentView = v;
  const main = document.getElementById('main');
  const dataView = document.getElementById('data-view');
  const btnMap = document.getElementById('btn-view-map');
  const btnData = document.getElementById('btn-view-data');

  document.querySelectorAll('.sbtn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  btnMap.setAttribute('aria-selected', v === 'map');
  btnData.setAttribute('aria-selected', v === 'data');

  if (v === 'map') {
    main.classList.remove('hidden');
    main.setAttribute('aria-hidden', 'false');
    dataView.classList.add('hidden');
    dataView.setAttribute('aria-hidden', 'true');
    if (!mapObj) initMap();
    else mapObj.invalidateSize();
  } else {
    main.classList.add('hidden');
    main.setAttribute('aria-hidden', 'true');
    dataView.classList.remove('hidden');
    dataView.setAttribute('aria-hidden', 'false');
    buildDataView();
  }
}

function buildDataView() {
  const s = typeof STATS !== 'undefined' ? STATS : {
    brokenTotal: PMS.reduce((sum, p) => sum + p.broken, 0),
    nhsWaiting: '7.54M', netMigration: '204,000', cpi: '3.0%', housePrice: '£285,000',
    threatLevel: 'SUBSTANTIAL', labourBroken: 119, conBroken: 128, pctKept: 38, pctPartial: 24,
    nhsAvgWeeks: 63, nhsTargetWeeks: 18, nhsChangeSince2010: '+350%', migTarget10k: '~10K', migPeak: '944K',
    lastUpdated: '—'
  };
  const grid = document.getElementById('dv-stats-grid');
  grid.innerHTML = `
    <div class="stat-block"><div class="sb-lbl">Broken promises (all PMs)</div><div class="sb-big" style="color:var(--red)">${s.brokenTotal}</div><div class="sb-sub">Labour ${s.labourBroken} · Conservative ${s.conBroken}</div><div class="sb-mini-row"><div class="sbm"><div class="sbm-v" style="color:var(--green)">${s.pctKept}%</div><div class="sbm-l">Kept</div></div><div class="sbm"><div class="sbm-v" style="color:var(--amber)">${s.pctPartial}%</div><div class="sbm-l">Partial</div></div></div></div>
    <div class="stat-block"><div class="sb-lbl">NHS waiting list</div><div class="sb-big" style="color:#38bdf8">${s.nhsWaiting}</div><div class="sb-sub">Avg ${s.nhsAvgWeeks}wks · Target ${s.nhsTargetWeeks}wks</div><div class="sb-mini-row"><div class="sbm"><div class="sbm-v" style="color:var(--red)">${s.nhsChangeSince2010}</div><div class="sbm-l">Since 2010</div></div></div></div>
    <div class="stat-block"><div class="sb-lbl">Net migration</div><div class="sb-big" style="color:var(--amber)">${s.netMigration}</div><div class="sb-sub">Peak ${s.migPeak} · Target ${s.migTarget10k}</div></div>
    <div class="stat-block"><div class="sb-lbl">CPI inflation</div><div class="sb-big" style="color:var(--green)">${s.cpi}</div></div>
    <div class="stat-block"><div class="sb-lbl">House price</div><div class="sb-big" style="color:#a855f7">${s.housePrice}</div></div>
    <div class="stat-block"><div class="sb-lbl">Terror threat</div><div class="sb-big" style="color:var(--amber);font-size:20px">${s.threatLevel}</div></div>`;
  const tbody = document.getElementById('dv-pm-tbody');
  tbody.innerHTML = PMS.map(pm => `<tr><td>${pm.fn} ${pm.ln}</td><td>${pm.party}</td><td>${pm.years}</td><td style="color:var(--red)">${pm.broken}</td><td style="color:var(--green)">${pm.kept}</td><td>${pm.score}%</td></tr>`).join('');
  document.getElementById('dv-last-updated').textContent = s.lastUpdated || '—';
}

function openSources() {
  document.getElementById('sources-last-updated').textContent = typeof STATS !== 'undefined' ? STATS.lastUpdated : '—';
  document.getElementById('sources-bg').classList.remove('hidden');
  document.getElementById('sources-bg').setAttribute('aria-hidden', 'false');
  document.getElementById('sources-close-btn').focus();
}

function closeSources() {
  document.getElementById('sources-bg').classList.add('hidden');
  document.getElementById('sources-bg').setAttribute('aria-hidden', 'true');
}

function openModal(id) {
  const pm = PMS.find(p => p.id === id);
  if (!pm) return;
  modalPreviousFocus = document.activeElement;
  const pc = pm.cls === 'lab' ? 'var(--lab)' : 'var(--con)';
  document.getElementById('m-name').textContent = pm.fn + ' ' + pm.ln;
  document.getElementById('m-sub').innerHTML = `<span style="color:${pc}">${pm.party}</span> · ${pm.years} · Delivery score: <span style="color:var(--red)">${pm.score}%</span> · ${pm.verdict}`;
  document.getElementById('m-pledges').innerHTML = pm.pledges.map(p => {
    const icon = p.k === true ? '✓' : p.k === false ? '✗' : '~';
    const col = p.k === true ? 'var(--green)' : p.k === false ? 'var(--red)' : 'var(--amber)';
    const lbl = p.k === true ? 'KEPT' : p.k === false ? 'BROKEN' : 'PARTIAL';
    return `<div class="pledge-item">
      <div class="pi-icon" style="color:${col}">${icon}</div>
      <div>
        <div class="pi-txt">${p.p}</div>
        <div class="pi-note"><span style="color:${col};font-size:8px;font-family:var(--mono)">${lbl}</span> — ${p.n}</div>
      </div>
    </div>`;
  }).join('');
  const mbg = document.getElementById('mbg');
  mbg.classList.add('open');
  mbg.setAttribute('aria-hidden', 'false');
  document.getElementById('modal-close-btn').focus();
}

function closeMod() {
  document.getElementById('mbg').classList.remove('open');
  document.getElementById('mbg').setAttribute('aria-hidden', 'true');
  if (modalPreviousFocus && modalPreviousFocus.focus) modalPreviousFocus.focus();
}

function initMap() {
  mapObj = L.map('ukmap', {
    center: [54.8, -3.2],
    zoom: 5,
    zoomControl: false,
    attributionControl: false
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors © CARTO'
  }).addTo(mapObj);

  L.control.zoom({ position: 'topright' }).addTo(mapObj);
  L.control.attribution({ prefix: false, position: 'bottomright' }).addTo(mapObj);

  constituenciesLayer = L.layerGroup().addTo(mapObj);
  nhsMarkersLayer = L.layerGroup().addTo(mapObj);
  promiseMarkersLayer = L.layerGroup().addTo(mapObj);

  syncLayerVisibility();
  loadGeoJSON();
  addDataMarkers();
}

function partyColour(party) {
  const p = (party || '').toLowerCase();
  if (p.includes('labour')) return { fill: '#cc2936', op: 0.5 };
  if (p.includes('conservative')) return { fill: '#1565c0', op: 0.5 };
  if (p.includes('liberal')) return { fill: '#fa8c00', op: 0.55 };
  if (p.includes('snp')) return { fill: '#f5c518', op: 0.55 };
  if (p.includes('green')) return { fill: '#22c55e', op: 0.55 };
  if (p.includes('plaid')) return { fill: '#3ec47c', op: 0.55 };
  if (p.includes('reform')) return { fill: '#00cfff', op: 0.55 };
  if (p.includes('sinn')) return { fill: '#1a7a4a', op: 0.55 };
  if (p.includes('dup')) return { fill: '#d4351c', op: 0.5 };
  if (p.includes('independent')) return { fill: '#888888', op: 0.5 };
  return { fill: '#334155', op: 0.4 };
}

async function loadGeoJSON() {
  const loadingEl = document.getElementById('map-loading');
  const statusEl = document.getElementById('map-status');
  const errorEl = document.getElementById('map-error');
  if (!mapObj) return;
  loadingEl.classList.remove('hidden');
  errorEl.hidden = true;
  statusEl.textContent = 'Loading UK constituency map…';
  try {
    const resp = await fetch('https://raw.githubusercontent.com/martinjc/UK-GeoJSON/master/json/electoral/gb/wpc.json');
    if (!resp.ok) throw new Error('GeoJSON fetch failed');
    const geo = await resp.json();
    const res2024 = get2024Results();
    constituenciesLayer.clearLayers();

    L.geoJSON(geo, {
      style: feat => {
        const name = feat.properties.PCON13NM || feat.properties.name || '';
        const party = res2024[name] || guessParty(name);
        const col = partyColour(party);
        return { fillColor: col.fill, fillOpacity: col.op, color: '#071018', weight: 0.5, opacity: 0.7 };
      },
      onEachFeature: (feat, layer) => {
        const name = feat.properties.PCON13NM || feat.properties.name || '';
        const party = res2024[name] || guessParty(name);
        const col = partyColour(party);
        layer.bindPopup(makePopup(name, party, col.fill), { className: '', maxWidth: 240 });
        layer.on('mouseover', function () { this.setStyle({ fillOpacity: 0.85, weight: 1.2, color: '#ffffff44' }); });
        layer.on('mouseout', function () { this.setStyle({ fillOpacity: col.op, weight: 0.5, color: '#071018' }); });
      }
    }).addTo(constituenciesLayer);

    loadingEl.classList.add('hidden');
    statusEl.textContent = 'UK Constituencies — 2024 General Election Results · Click any constituency to explore';
  } catch (e) {
    loadingEl.classList.add('hidden');
    statusEl.textContent = 'Map failed to load.';
    errorEl.hidden = false;
    console.warn('GeoJSON load failed:', e);
  }
}

function makePopup(name, party, col) {
  return `<div>
    <div class="pu-title">${name}</div>
    <div class="pu-party" style="color:${col}">${party} — 2024 Result</div>
    <div class="pu-row"><span>NHS avg wait</span><span class="pu-v" style="color:#ff2d4e">Above 18wk target</span></div>
    <div class="pu-row"><span>Source</span><span class="pu-v" style="color:#3d6b88">Electoral Commission</span></div>
    <a class="pu-link" href="https://www.theyworkforyou.com/search/?q=${encodeURIComponent(name)}" target="_blank" rel="noopener">→ Find MP voting record (TheyWorkForYou)</a>
  </div>`;
}

function guessParty(name) {
  const n = name.toLowerCase();
  if (n.includes('highland') || n.includes('perth') || n.includes('angus') || n.includes('moray') || n.includes('invern')) return 'SNP';
  if (n.includes('cornw') || n.includes('twicken') || n.includes('richmond') || n.includes('kingston') || n.includes('guildford')) return 'Liberal Democrats';
  if (n.includes('kensing') || n.includes('esher') || n.includes('solihull')) return 'Conservative';
  return 'Labour';
}

function get2024Results() {
  return {
    'Cities of London and Westminster': 'Labour',
    'Islington North': 'Independent',
    'Brighton Pavilion': 'Green',
    'Bath': 'Liberal Democrats',
    'Orkney and Shetland': 'Liberal Democrats',
    'Richmond Park': 'Liberal Democrats',
    'Twickenham': 'Liberal Democrats',
    'Kingston and Surbiton': 'Liberal Democrats',
    'Wimbledon': 'Labour',
    'Sutton and Cheam': 'Liberal Democrats',
    'Mid Dorset and North Poole': 'Liberal Democrats'
  };
}

function addDataMarkers() {
  if (!nhsMarkersLayer || !promiseMarkersLayer) return;
  nhsMarkersLayer.clearLayers();
  promiseMarkersLayer.clearLayers();

  const nhs = [
    { lat: 51.51, lng: -0.12, city: 'London', wait: '58wks avg' },
    { lat: 53.48, lng: -2.24, city: 'Manchester', wait: '67wks avg' },
    { lat: 53.80, lng: -1.55, city: 'Leeds', wait: '71wks avg' },
    { lat: 52.48, lng: -1.90, city: 'Birmingham', wait: '74wks avg' },
    { lat: 51.45, lng: -2.60, city: 'Bristol', wait: '62wks avg' },
    { lat: 54.97, lng: -1.62, city: 'Newcastle', wait: '78wks avg' },
    { lat: 55.86, lng: -4.25, city: 'Glasgow', wait: '81wks avg' },
    { lat: 53.40, lng: -2.98, city: 'Liverpool', wait: '69wks avg' }
  ];
  nhs.forEach(p => {
    const icon = L.divIcon({
      html: '<div style="width:9px;height:9px;border-radius:50%;background:#38bdf8;border:1.5px solid rgba(255,255,255,.5);box-shadow:0 0 8px rgba(56,189,248,.8);"></div>',
      className: '', iconSize: [9, 9], iconAnchor: [4, 4]
    });
    L.marker([p.lat, p.lng], { icon }).bindPopup(`<div>
      <div class="pu-title" style="color:#38bdf8">NHS — ${p.city}</div>
      <div class="pu-row"><span>Average wait</span><span class="pu-v" style="color:#ff2d4e">${p.wait}</span></div>
      <div class="pu-row"><span>18-week target</span><span class="pu-v" style="color:#ff9500">MISSED</span></div>
      <div class="pu-row"><span>Source</span><span class="pu-v" style="color:#3d6b88">NHS England</span></div>
    </div>`, { maxWidth: 220 }).addTo(nhsMarkersLayer);
  });

  const promises = [
    { lat: 51.50, lng: -0.13, pm: 'Starmer', p: 'Winter fuel cut', r: '10M pensioners affected' },
    { lat: 52.96, lng: -1.15, pm: 'Johnson', p: '40 new hospitals', r: '0 of 40 fully built' },
    { lat: 54.00, lng: -2.00, pm: 'Cameron', p: '"Tens of thousands"', r: 'Migration hit 330K' },
    { lat: 51.50, lng: -0.20, pm: 'Truss', p: 'Growth plan', r: 'Crashed pound in 49 days' }
  ];
  promises.forEach(p => {
    const icon = L.divIcon({
      html: '<div style="width:9px;height:9px;border-radius:50%;background:#ff2d4e;border:1.5px solid rgba(255,255,255,.5);box-shadow:0 0 8px rgba(255,45,78,.8);"></div>',
      className: '', iconSize: [9, 9], iconAnchor: [4, 4]
    });
    L.marker([p.lat, p.lng], { icon }).bindPopup(`<div>
      <div class="pu-title" style="color:#ff2d4e">Broken Pledge</div>
      <div class="pu-party">${p.pm}</div>
      <div class="pu-row"><span>Promise</span><span class="pu-v">${p.p}</span></div>
      <div class="pu-row"><span>Reality</span><span class="pu-v" style="color:#ff2d4e">${p.r}</span></div>
      <div class="pu-row"><span>Source</span><span class="pu-v" style="color:#3d6b88">Full Fact / BBC</span></div>
    </div>`, { maxWidth: 220 }).addTo(promiseMarkersLayer);
  });

  syncLayerVisibility();
}

function syncLayerVisibility() {
  if (!mapObj) return;
  const on = id => document.querySelector(`.li[data-lid="${id}"]`)?.classList.contains('on');
  if (constituenciesLayer) (on('parties') ? mapObj.addLayer(constituenciesLayer) : mapObj.removeLayer(constituenciesLayer));
  if (nhsMarkersLayer) (on('nhs') ? mapObj.addLayer(nhsMarkersLayer) : mapObj.removeLayer(nhsMarkersLayer));
  if (promiseMarkersLayer) (on('promises') ? mapObj.addLayer(promiseMarkersLayer) : mapObj.removeLayer(promiseMarkersLayer));
}

function toggleLayer(el) {
  el.classList.toggle('on');
  el.querySelector('.li-chk').textContent = el.classList.contains('on') ? '✓' : '';
  syncLayerVisibility();
}

function toggleAll() {
  const allOn = document.querySelectorAll('.li.on').length === document.querySelectorAll('.li').length;
  document.querySelectorAll('.li').forEach(el => {
    if (allOn) {
      el.classList.remove('on');
      el.querySelector('.li-chk').textContent = '';
    } else {
      el.classList.add('on');
      el.querySelector('.li-chk').textContent = '✓';
    }
  });
  syncLayerVisibility();
}

function buildCPISpark() {
  const svg = document.getElementById('cpi-spark');
  if (!svg) return;
  const data = [1.8, 1.6, 1.3, 0.8, 1.2, 1.3, 1.4, 1.3, 2.1, 2.3, 2.3, 3.6, 2.2, 3.3, 4.5, 2.8, 2.6, 1.5, 0.0, 0.7, 2.7, 2.5, 1.7, 0.9, 2.5, 9.1, 6.8, 2.5, 3.0];
  const W = 240, H = 48, n = data.length, maxV = Math.max(...data) * 1.1;
  const x = i => (i / (n - 1)) * W;
  const y = v => H - (v / maxV) * H;
  const pts = data.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  svg.innerHTML = `<defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ff2d4e" stop-opacity=".4"/><stop offset="100%" stop-color="#ff2d4e" stop-opacity="0"/></linearGradient></defs>
  <polygon points="${pts} ${W},${H} 0,${H}" fill="url(#sg)"/>
  <polyline points="${pts}" fill="none" stroke="#ff2d4e" stroke-width="1.5"/>
  <circle cx="${x(25)}" cy="${y(9.1)}" r="2.5" fill="#ff2d4e"/>
  <text x="${x(25) + 4}" y="${y(9.1) - 2}" font-family="Share Tech Mono" font-size="7" fill="#ff2d4e">11.1% peak</text>`;
}

async function doMP() {
  const inp = document.getElementById('mp-in');
  const res = document.getElementById('mp-res');
  const pc = inp.value.trim().toUpperCase().replace(/\s+/g, '');
  if (!pc) return;
  res.innerHTML = '<span style="color:var(--t3)">Searching…</span>';
  try {
    const r1 = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(pc)}`);
    const d1 = await r1.json();
    if (d1.status !== 200) throw new Error('invalid');
    const cons = d1.result.parliamentary_constituency_2025 || d1.result.parliamentary_constituency;

    if (mapObj && d1.result.latitude) {
      mapObj.setView([d1.result.latitude, d1.result.longitude], 9, { animate: true, duration: 0.8 });
    }

    const r2 = await fetch(`https://members-api.parliament.uk/api/Members/Search?constituency=${encodeURIComponent(cons)}&house=1&IsCurrentMember=true`);
    const d2 = await r2.json();
    if (!d2.items || d2.items.length === 0) throw new Error('notfound');
    const mp = d2.items[0].value;
    const party = mp.latestParty?.name || '';
    const pc2 = party.includes('Labour') ? 'var(--lab)' : party.includes('Conservative') ? 'var(--con)' : party.includes('SNP') ? 'var(--snp)' : 'var(--t1)';
    res.innerHTML = `<span style="color:#fff;font-weight:700">${mp.nameDisplayAs}</span><br>
      <span style="color:${pc2}">${party}</span><br>
      <span style="color:var(--t3)">${cons}</span><br>
      <a href="https://www.theyworkforyou.com/search/?q=${encodeURIComponent(mp.nameDisplayAs)}" target="_blank" style="color:var(--accent)">→ Voting record ↗</a>`;
    res.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (e) {
    const msg = e.message === 'invalid' ? 'Invalid postcode. Try e.g. SW1A 1AA' : 'Could not find an MP for this postcode.';
    res.innerHTML = `<span style="color:var(--red)">${msg}</span>`;
  }
}

function animCount(el, target, dur) {
  if (!el) return;
  const s = performance.now();
  const u = now => {
    const p = Math.min((now - s) / dur, 1);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.floor(e * target);
    if (p < 1) requestAnimationFrame(u);
    else el.textContent = target;
  };
  requestAnimationFrame(u);
}
