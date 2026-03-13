// ============================================================
// DID THEY DELIVER — Data (PMs, Headlines, Channels, Stats)
// Sources: Full Fact, Channel 4 FactCheck, BBC, Hansard, ONS
// ============================================================

// Key stats — update in one place; lastUpdated for transparency
const STATS = {
  lastUpdated: '2026-01',
  brokenTotal: 247,
  nhsWaiting: '7.54M',
  nhsWaitingSrc: 'https://www.england.nhs.uk/statistics/statistical-work-areas/rtt-waiting-times/',
  netMigration: '204,000',
  netMigrationYear: 'YE Jun 2025',
  netMigrationSrc: 'https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/internationalmigration',
  cpi: '3.0%',
  cpiSrc: 'https://www.ons.gov.uk/economy/inflationandpriceindices',
  housePrice: '£285,000',
  housePriceSrc: 'https://www.ons.gov.uk/economy/inflationandpriceindices/housepriceindices',
  threatLevel: 'SUBSTANTIAL',
  threatSrc: 'https://www.mi5.gov.uk/threats-and-advice/terrorism-threat-levels',
  labourBroken: 119,
  conBroken: 128,
  pctKept: 38,
  pctPartial: 24,
  nhsAvgWeeks: 63,
  nhsTargetWeeks: 18,
  nhsChangeSince2010: '+350%',
  migTarget10k: '~10K',
  migPeak: '944K',
  migPeakYear: '2023'
};

const PMS = [
  { id: 'starmer', fn: 'Keir', ln: 'Starmer', years: '2024–Present', party: 'Labour', cls: 'lab', active: true, days: null, broken: 7, kept: 2, partial: 1, score: 20, approval: '−66', appSrc: 'Ipsos Feb 2026', appBadge: 'MOST UNPOPULAR PM ON RECORD',
    verdict: '7 of 10 leadership pledges abandoned. Most unpopular PM since records began (Ipsos, Feb 2026).',
    pledges: [
      { p: 'No tax rises on working people', k: false, n: 'NI increase — OBR confirms it falls on workers via lower wages' },
      { p: 'Freeze energy bills / cut by £300', k: false, n: 'Bills rose £170. The £300 pledge was quietly dropped.' },
      { p: 'End hotel use for asylum seekers', k: false, n: '32,345 still in hotels March 2025 — higher than inherited' },
      { p: 'Protect winter fuel payment for pensioners', k: false, n: 'Cut for 10 million pensioners, October 2024' },
      { p: 'Defend free movement', k: false, n: '"Red line for me" — now rules it out completely' },
      { p: 'Nationalise rail, mail, energy, water', k: 'p', n: 'Rail nationalisation begun; mail, energy and water stalled' },
      { p: 'Abolish tuition fees', k: false, n: 'Dropped — cited "no money"' },
      { p: 'Day-one unfair dismissal rights', k: false, n: 'Watered down significantly after employer lobbying' },
      { p: 'Ethics and integrity commission', k: false, n: 'Downgraded to rebrand of existing watchdogs' },
      { p: 'Reduce NHS waiting times', k: false, n: 'List still at 7.54M — target nowhere near met' }
    ]
  },
  { id: 'sunak', fn: 'Rishi', ln: 'Sunak', years: '2022–2024', party: 'Conservative', cls: 'con', days: 693, broken: 11, kept: 12, partial: 5, score: 43, approval: '−40', appSrc: '2024 election', appBadge: '',
    verdict: 'Mixed record on 5 pledges. Lost 2024 election by historic landslide.',
    pledges: [
      { p: 'Halve inflation by end of 2023', k: true, n: 'Fell from 10.7% to 4.6% — primarily Bank of England, not policy' },
      { p: 'Grow the economy', k: false, n: 'UK went into recession Q4 2023' },
      { p: 'Reduce NHS backlogs', k: false, n: 'Waiting list hit record 7.8 million under his watch' },
      { p: 'Stop the boats', k: false, n: 'Channel crossings at record levels when he left office' },
      { p: 'Cut debt as percentage of GDP', k: false, n: 'Debt rose throughout his tenure' }
    ]
  },
  { id: 'truss', fn: 'Liz', ln: 'Truss', years: 'Sep–Oct 2022', party: 'Conservative', cls: 'con', days: 49, broken: 10, kept: 1, partial: 1, score: 8, approval: '−60', appSrc: '49 days', appBadge: 'SHORTEST-SERVING PM IN HISTORY',
    verdict: '49 days. Mini-budget crashed the pound. Mortgage rates spiked across the UK. Resigned.',
    pledges: [
      { p: 'Unfunded tax cuts without market disruption', k: false, n: 'Pound crashed to record low. Gilt markets in chaos. £30bn cost.' },
      { p: 'Growth, growth, growth', k: false, n: 'Economy shrank. OBR forecasts were publicly ignored.' },
      { p: 'No return to austerity', k: false, n: 'Successor Sunak immediately announced significant spending cuts' },
      { p: 'Energy price guarantee', k: 'p', n: 'Announced but she resigned before full implementation' }
    ]
  },
  { id: 'johnson', fn: 'Boris', ln: 'Johnson', years: '2019–2022', party: 'Conservative', cls: 'con', days: 1087, broken: 24, kept: 8, partial: 6, score: 21, approval: '−35', appSrc: 'Partygate 2022', appBadge: '',
    verdict: '40 hospitals: 0 built. Partygate. Resigned in disgrace July 2022.',
    pledges: [
      { p: '40 new hospitals by 2030', k: false, n: 'NAO: only 8 schemes qualify and none are fully built' },
      { p: 'Get Brexit Done', k: 'p', n: 'Deal signed but NI Protocol created ongoing dispute' },
      { p: 'No checks on goods to Northern Ireland', k: false, n: 'Northern Ireland Protocol introduced exactly those checks' },
      { p: '50,000 more nurses', k: 'p', n: 'Numbers disputed — includes retained staff, not all new hires' },
      { p: 'Rules are rules — Covid compliance', k: false, n: 'Partygate: multiple gatherings in No.10 during lockdown' },
      { p: 'World-beating Test and Trace', k: false, n: 'NAO found no evidence it reduced transmission' }
    ]
  },
  { id: 'may', fn: 'Theresa', ln: 'May', years: '2016–2019', party: 'Conservative', cls: 'con', days: 1107, broken: 13, kept: 7, partial: 4, score: 29, approval: '−30', appSrc: 'Exit 2019', appBadge: '',
    verdict: '"Strong and stable government." Lost majority in snap election. Brexit rejected 3 times. Resigned.',
    pledges: [
      { p: '"Strong and stable government"', k: false, n: 'Called snap election 2017, lost overall majority — opposite result' },
      { p: 'Deliver Brexit', k: false, n: 'Withdrawal Agreement rejected by Parliament three times. Resigned.' },
      { p: 'No snap election', k: false, n: 'Called one in 2017 after explicitly ruling it out' },
      { p: 'Burning injustices — social reform', k: 'p', n: 'Race disparity audit completed; little followed through in practice' }
    ]
  },
  { id: 'cameron', fn: 'David', ln: 'Cameron', years: '2010–2016', party: 'Conservative', cls: 'con', days: 2270, broken: 14, kept: 11, partial: 6, score: 35, approval: '+3', appSrc: '2015 election', appBadge: '',
    verdict: 'Net migration peaked at 330K against "tens of thousands" target. Gambled Brexit referendum and resigned.',
    pledges: [
      { p: 'Net migration to "tens of thousands"', k: false, n: 'Hit 330,000 — three times the stated target' },
      { p: 'Eliminate the deficit by 2015', k: false, n: 'Target repeatedly delayed and never achieved' },
      { p: 'No top-down NHS reorganisation', k: false, n: 'Massive Lansley reforms introduced almost immediately after election' },
      { p: 'EU referendum', k: true, n: 'Delivered the vote — but lost it, and resigned' },
      { p: 'Protect NHS spending in real terms', k: 'p', n: 'Nominally ring-fenced but real-terms quality declined' }
    ]
  },
  { id: 'brown', fn: 'Gordon', ln: 'Brown', years: '2007–2010', party: 'Labour', cls: 'lab', days: 1049, broken: 13, kept: 6, partial: 3, score: 27, approval: '−35', appSrc: '2010 election', appBadge: '',
    verdict: '"No more boom and bust." Worst financial crash since the 1930s happened on his watch.',
    pledges: [
      { p: '"No more boom and bust"', k: false, n: '2008: worst financial crash in 80 years on his watch' },
      { p: 'EU Treaty referendum', k: false, n: 'Promised it then denied one was necessary' },
      { p: 'Prudent public finances', k: false, n: 'Budget deficit ballooned sharply during the financial crisis' },
      { p: 'Full employment as central goal', k: false, n: 'Unemployment rose sharply from 2008 to 2010' }
    ]
  },
  { id: 'blair', fn: 'Tony', ln: 'Blair', years: '1997–2007', party: 'Labour', cls: 'lab', days: 3651, broken: 22, kept: 18, partial: 7, score: 38, approval: '+30', appSrc: 'Peak 2001', appBadge: '',
    verdict: 'Iraq War. Tuition fees introduced then trebled. PFI debt still costing the NHS billions today.',
    pledges: [
      { p: 'Education, Education, Education — transform schools', k: true, n: 'Literacy and numeracy improved. But introduced tuition fees.' },
      { p: 'No tuition fees', k: false, n: 'Introduced £1,000 fees, then raised to £3,000' },
      { p: 'Tough on crime and the causes of crime', k: 'p', n: 'Crime fell but prison population ballooned substantially' },
      { p: 'Iraq: weapons of mass destruction', k: false, n: 'Chilcot Inquiry: intelligence flawed, Parliament misled' },
      { p: 'Not raise income tax rates', k: true, n: 'Kept — though National Insurance was increased' },
      { p: 'Reduce NHS waiting times', k: 'p', n: 'Improved significantly but targets frequently missed' }
    ]
  }
];

// One headline per outlet, ordered left → right. Kept to 6 so the spectrum is clear without overload.
const SPECTRUM_HEADLINES = [
  { name: 'Guardian',    lean: 'left',   headline: 'Cost of living: real wages fall for fifth month as energy bills rise',     url: 'https://www.theguardian.com/politics' },
  { name: 'Independent', lean: 'c-left', headline: 'Starmer faces backlash over welfare and public sector pay',                url: 'https://www.independent.co.uk/news/uk/politics' },
  { name: 'BBC News',    lean: 'centre', headline: 'Starmer under pressure as poll ratings hit record low ahead of elections',  url: 'https://www.bbc.co.uk/news/politics' },
  { name: 'Telegraph',   lean: 'right',  headline: "Labour's net zero plans face £28bn funding gap, analysis finds",         url: 'https://www.telegraph.co.uk/politics' },
  { name: 'Daily Mail',  lean: 'right',  headline: 'Channel crossings up 34% as Home Office blames inherited chaos',           url: 'https://www.dailymail.co.uk/news' },
  { name: 'GB News',     lean: 'far-r',  headline: 'Cabinet ministers privately questioning Starmer leadership, sources say',   url: 'https://www.gbnews.com/news/politics' }
];
