// ============================================================
// DID THEY DELIVER — Live Stats Loader
// Fetches /data/live-stats.json (updated daily by GitHub Actions)
// and updates nav chips, scorecard widget, and data view.
// ============================================================

(function () {
  'use strict';

  const STAT_CHIP_MAP = {
    nhs_rtt:       'chip-nhs',
    net_migration: 'chip-migration',
    cpi:           'chip-cpi',
    house_prices:  'chip-house',
    boe_rate:      'chip-boe'
  };

  // Color classes for the nchip-v value element
  const COLOR_CLASS = { g: 'g', a: 'a', r: 'r', '': '' };

  function updateChip(id, display, color) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = display;
    el.className = 'nchip-v' + (color ? ' ' + COLOR_CLASS[color] : '');
  }

  function renderScorecard(data) {
    const el = document.getElementById('live-scorecard');
    if (!el) return;

    const updated = data.updated_readable || data.updated || '';
    const pledges = data.pledges || [];
    if (!pledges.length) { el.style.display = 'none'; return; }

    const statusLabel = { broken: 'BROKEN', kept: 'KEPT', partial: 'PARTIAL' };
    const statusColor = { broken: '#ef4444', kept: '#22c55e', partial: '#f59e0b' };

    const rows = pledges.map(p => {
      const sc = statusColor[p.status] || '#94a3b8';
      const sl = statusLabel[p.status] || p.status.toUpperCase();
      return `<tr class="sc-row">
        <td class="sc-pledge">${p.pledge}</td>
        <td class="sc-target">${p.target}</td>
        <td class="sc-current">${p.current}</td>
        <td class="sc-status" style="color:${sc}">${sl}</td>
      </tr>`;
    }).join('');

    const broken = pledges.filter(p => p.status === 'broken').length;
    const kept   = pledges.filter(p => p.status === 'kept').length;
    const partial = pledges.filter(p => p.status === 'partial').length;

    el.innerHTML = `
      <div class="sc-header">
        <div class="sc-title">CURRENT GOVERNMENT — LIVE PLEDGE TRACKER</div>
        <div class="sc-meta">
          <span class="sc-badge broken">${broken} BROKEN</span>
          <span class="sc-badge partial">${partial} PARTIAL</span>
          <span class="sc-badge kept">${kept} KEPT</span>
          <span class="sc-updated">Data updated: ${updated}</span>
        </div>
      </div>
      <div class="sc-table-wrap">
        <table class="sc-table" aria-label="Current government pledge tracker">
          <thead>
            <tr>
              <th>Pledge</th>
              <th>Target</th>
              <th>Current Position</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <div class="sc-source-note">Sources: ONS, NHS England, Ofgem, HM Treasury · Updated daily · <a href="/about/">Methodology</a></div>
    `;
    el.style.display = 'block';
  }

  function renderLiveDataPanel(data) {
    const el = document.getElementById('live-data-cards');
    if (!el || !data.stats) return;

    const statsToShow = [
      { key: 'cpi',           icon: '📈', context: 'Target: 2.0%' },
      { key: 'nhs_rtt',       icon: '🏥', context: 'Baseline: 7.54M (Jul 2024)' },
      { key: 'boe_rate',      icon: '🏦', context: 'Set by Bank of England' },
      { key: 'net_migration', icon: '🌍', context: 'Record peak: 764K (2023)' },
      { key: 'house_prices',  icon: '🏠', context: 'Up 63% since 2010' },
      { key: 'energy_cap',    icon: '⚡', context: 'Starmer pledged -£300' },
      { key: 'gdp_growth',    icon: '📊', context: 'Target: consistent growth' },
      { key: 'unemployment',  icon: '👷', context: 'Full employment ~4%' },
    ];

    const colorStyle = { g: '#22c55e', a: '#f59e0b', r: '#ef4444', '': '#94a3b8' };

    const cards = statsToShow.map(cfg => {
      const s = data.stats[cfg.key];
      if (!s) return '';
      const staleNote = s.stale ? ' <span class="stale-note">(prev)</span>' : '';
      return `<div class="live-card">
        <div class="live-card-icon">${cfg.icon}</div>
        <div class="live-card-body">
          <div class="live-card-label">${s.label}</div>
          <div class="live-card-value" style="color:${colorStyle[s.color] || '#94a3b8'}">${s.display}${staleNote}</div>
          <div class="live-card-period">${s.period}</div>
          <div class="live-card-context">${cfg.context}</div>
        </div>
      </div>`;
    }).join('');

    el.innerHTML = cards;
  }

  function applyToNavChips(stats) {
    if (stats.nhs_rtt)       updateChip('chip-nhs',       stats.nhs_rtt.display,       stats.nhs_rtt.color);
    if (stats.net_migration)  updateChip('chip-migration',  stats.net_migration.display,  stats.net_migration.color);
    if (stats.cpi)            updateChip('chip-cpi',        stats.cpi.display,            stats.cpi.color);
    if (stats.house_prices)   updateChip('chip-house',      stats.house_prices.display,   stats.house_prices.color);
  }

  function applyToDataView(stats) {
    // Update the dv-stats-grid with live stat blocks
    const grid = document.getElementById('dv-stats-grid');
    if (!grid || !stats) return;

    const s = stats;
    const items = [
      { label: 'CPI Inflation',     val: s.cpi?.display,          sub: `Target: 2.0% · ${s.cpi?.period || ''}`,          color: s.cpi?.color },
      { label: 'BoE Base Rate',     val: s.boe_rate?.display,      sub: `Set by MPC · ${s.boe_rate?.period || ''}`,        color: 'a' },
      { label: 'NHS Waiting',       val: s.nhs_rtt?.display,       sub: `RTT total · ${s.nhs_rtt?.period || ''}`,          color: s.nhs_rtt?.color },
      { label: 'Net Migration',     val: s.net_migration?.display, sub: `ONS LTIM · ${s.net_migration?.period || ''}`,     color: s.net_migration?.color },
      { label: 'Avg House Price',   val: s.house_prices?.display,  sub: `ONS UKHPI · ${s.house_prices?.period || ''}`,    color: 'a' },
      { label: 'Energy Price Cap',  val: s.energy_cap?.display,    sub: `Typical household · ${s.energy_cap?.period || ''}`, color: s.energy_cap?.color },
      { label: 'GDP Growth',        val: s.gdp_growth?.display,    sub: `QoQ · ${s.gdp_growth?.period || ''}`,             color: s.gdp_growth?.color },
      { label: 'Unemployment',      val: s.unemployment?.display,  sub: `LFS · ${s.unemployment?.period || ''}`,           color: s.unemployment?.color },
    ].filter(i => i.val);

    const colorHex = { g: '#22c55e', a: '#f59e0b', r: '#ef4444', '': '#94a3b8' };

    if (!grid.dataset.liveLoaded) {
      // Prepend live cards before any existing content
      const liveSection = document.createElement('div');
      liveSection.className = 'dv-live-section';
      liveSection.innerHTML = `<h2 class="dv-heading">Live UK Economic Indicators</h2>
        <div class="dv-live-grid">${items.map(i => `
          <div class="stat-block">
            <div class="sb-lbl">${i.label}</div>
            <div class="sb-big" style="color:${colorHex[i.color] || '#94a3b8'}">${i.val}</div>
            <div class="sb-sub">${i.sub}</div>
          </div>`).join('')}
        </div>`;
      grid.prepend(liveSection);
      grid.dataset.liveLoaded = '1';
    }
  }

  function updateLastUpdated(updated) {
    const el = document.getElementById('dv-last-updated');
    if (el && updated) {
      try {
        const d = new Date(updated);
        el.textContent = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      } catch (e) {
        el.textContent = updated;
      }
    }
  }

  function init() {
    fetch('/data/live-stats.json?_=' + Date.now())
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(data => {
        if (data.stats)   applyToNavChips(data.stats);
        if (data.stats)   applyToDataView(data.stats);
        if (data.pledges) renderScorecard(data);
        if (data.stats)   renderLiveDataPanel(data);
        if (data.updated) updateLastUpdated(data.updated);
      })
      .catch(err => {
        console.warn('[Did They Deliver] live-stats fetch failed:', err);
        // Chips keep their hardcoded fallback values — graceful degradation
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
