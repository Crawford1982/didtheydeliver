// ============================================================
// DID THEY DELIVER — PM Promise Data
// Sources: Full Fact, Channel 4 FactCheck, BBC, Hansard
// Update this file as new promises are broken/kept
// ============================================================

const PM_DATA = [
  {
    id: 'blair',
    name: 'Tony Blair',
    years: '1997–2007',
    party: 'Labour',
    tenure_days: 3651,
    image_initial: 'TB',
    total_promises: 47,
    kept: 18,
    broken: 22,
    partial: 7,
    delivery_score: 38,
    verdict: 'Iraq War. Tuition fees tripled. PFI debt still costing NHS billions.',
    key_promises: [
      { promise: 'Education, Education, Education — transform UK schools', kept: true, notes: 'Literacy/numeracy hours worked. But introduced tuition fees.' },
      { promise: 'Not raise income tax rates', kept: true, notes: 'Kept, though NI increased' },
      { promise: 'Reduce NHS waiting lists', kept: 'partial', notes: 'Improved significantly but targets often missed' },
      { promise: 'No tuition fees', kept: false, notes: 'Introduced £1,000 then raised to £3,000 fees' },
      { promise: 'Weapons of mass destruction — case for Iraq War', kept: false, notes: 'Chilcot: intelligence was flawed, public misled' },
      { promise: 'Tough on crime, tough on the causes of crime', kept: 'partial', notes: 'Crime fell but prison population ballooned' },
    ]
  },
  {
    id: 'brown',
    name: 'Gordon Brown',
    years: '2007–2010',
    party: 'Labour',
    tenure_days: 1049,
    image_initial: 'GB',
    total_promises: 22,
    kept: 6,
    broken: 13,
    partial: 3,
    delivery_score: 27,
    verdict: '"No more boom and bust." The 2008 financial crash happened on his watch.',
    key_promises: [
      { promise: 'No more boom and bust', kept: false, notes: 'Biggest economic crash since 1930s in 2008' },
      { promise: 'Referendum on EU treaty', kept: false, notes: 'Promised, then denied one was needed' },
      { promise: 'No snap election (then called none)', kept: 'partial', notes: 'Bottled 2007 election opportunity, damaged credibility' },
      { promise: 'Prudent with public finances', kept: false, notes: 'Deficit ballooned during crisis' },
    ]
  },
  {
    id: 'cameron',
    name: 'David Cameron',
    years: '2010–2016',
    party: 'Conservative',
    tenure_days: 2270,
    image_initial: 'DC',
    total_promises: 31,
    kept: 11,
    broken: 14,
    partial: 6,
    delivery_score: 35,
    verdict: 'Migration "tens of thousands" peaked at 330K. Gambled Brexit and lost.',
    key_promises: [
      { promise: 'Net migration to "tens of thousands"', kept: false, notes: 'Hit 330,000 at peak — 3x the target' },
      { promise: 'Eliminate the deficit by 2015', kept: false, notes: 'Pushed back repeatedly, never achieved' },
      { promise: 'No top-down reorganisation of the NHS', kept: false, notes: 'Massive Lansley reforms immediately after election' },
      { promise: 'Referendum on EU membership', kept: true, notes: 'Kept promise — lost the vote and resigned' },
      { promise: 'Protect NHS spending in real terms', kept: 'partial', notes: 'Nominally protected but real-terms fell' },
    ]
  },
  {
    id: 'may',
    name: 'Theresa May',
    years: '2016–2019',
    party: 'Conservative',
    tenure_days: 1107,
    image_initial: 'TM',
    total_promises: 24,
    kept: 7,
    broken: 13,
    partial: 4,
    delivery_score: 29,
    verdict: '"Strong and stable." Brexit rejected 3 times. Resigned in tears.',
    key_promises: [
      { promise: '"Strong and stable government"', kept: false, notes: 'Lost majority in snap election she called' },
      { promise: 'Brexit means Brexit — deliver the result', kept: false, notes: 'Deal rejected 3 times. Resigned.' },
      { promise: 'Reduce net migration to tens of thousands', kept: false, notes: 'Inherited Cameron\'s missed target, also missed it' },
      { promise: 'No snap election', kept: false, notes: 'Called one in 2017, lost majority' },
      { promise: 'Burning injustices — social reform agenda', kept: 'partial', notes: 'Race disparity audit done, little followed through' },
    ]
  },
  {
    id: 'johnson',
    name: 'Boris Johnson',
    years: '2019–2022',
    party: 'Conservative',
    tenure_days: 1087,
    image_initial: 'BJ',
    total_promises: 38,
    kept: 8,
    broken: 24,
    partial: 6,
    delivery_score: 21,
    verdict: '40 new hospitals: 0 built. Partygate. Resigned in disgrace.',
    key_promises: [
      { promise: '40 new hospitals by 2030', kept: false, notes: 'NAO: only 8 schemes qualify; none fully built' },
      { promise: 'Get Brexit Done', kept: 'partial', notes: 'Deal signed but NI protocol caused ongoing dispute' },
      { promise: 'No new checks on goods to Northern Ireland', kept: false, notes: 'Northern Ireland Protocol introduced exactly that' },
      { promise: 'Levelling up left-behind communities', kept: false, notes: 'Resigned before delivery; programme largely abandoned' },
      { promise: '50,000 more nurses', kept: 'partial', notes: 'Numbers disputed — includes retained nurses, not all new' },
      { promise: 'Rules are rules — Covid lockdown compliance', kept: false, notes: 'Partygate: multiple gatherings in No.10 during lockdown' },
      { promise: 'World-beating test and trace', kept: false, notes: 'NAO: no evidence it reduced transmission' },
    ]
  },
  {
    id: 'truss',
    name: 'Liz Truss',
    years: 'Sep–Oct 2022',
    party: 'Conservative',
    tenure_days: 49,
    image_initial: 'LT',
    total_promises: 12,
    kept: 1,
    broken: 10,
    partial: 1,
    delivery_score: 8,
    verdict: '49 days. Mini-budget crashed the pound. Mortgage rates spiked. Resigned.',
    key_promises: [
      { promise: 'Unfunded tax cuts without market disruption', kept: false, notes: 'Pound crashed to record low. Markets in chaos.' },
      { promise: 'Growth, growth, growth', kept: false, notes: 'Economy shrank. OBR forecasts ignored.' },
      { promise: 'Keep triple lock on pensions', kept: false, notes: 'U-turned within weeks' },
      { promise: 'No return to austerity', kept: false, notes: 'Successor immediately announced spending cuts' },
      { promise: 'Energy price guarantee', kept: 'partial', notes: 'Announced but she resigned before implementation' },
    ]
  },
  {
    id: 'sunak',
    name: 'Rishi Sunak',
    years: '2022–2024',
    party: 'Conservative',
    tenure_days: 693,
    image_initial: 'RS',
    total_promises: 28,
    kept: 12,
    broken: 11,
    partial: 5,
    delivery_score: 43,
    verdict: '5 pledges — mixed record. Lost 2024 election by historic landslide.',
    key_promises: [
      { promise: 'Halve inflation by end of 2023', kept: true, notes: 'Fell from 10.7% to 4.6% — largely BoE, not policy' },
      { promise: 'Grow the economy', kept: false, notes: 'Went into recession Q4 2023' },
      { promise: 'Reduce NHS backlogs', kept: false, notes: 'Waiting list hit 7.8m record high' },
      { promise: 'Stop the boats', kept: false, notes: 'Channel crossings at record levels when left office' },
      { promise: 'National service for young people', kept: false, notes: 'Announced in election campaign, lost before implementation' },
    ]
  },
  {
    id: 'starmer',
    name: 'Keir Starmer',
    years: '2024–Present',
    party: 'Labour',
    tenure_days: null, // calculated dynamically
    image_initial: 'KS',
    total_promises: 10,
    kept: 2,
    broken: 7,
    partial: 1,
    delivery_score: 20,
    verdict: '7 of 10 leadership pledges abandoned. Most unpopular PM since records began.',
    active: true,
    key_promises: [
      { promise: 'No tax rises on working people', kept: false, notes: 'NI increase — OBR says it falls on workers' },
      { promise: 'Freeze energy bills / cut by £300', kept: false, notes: 'Bills rose £170. £300 pledge quietly dropped.' },
      { promise: 'End hotel use for asylum seekers', kept: false, notes: '32,345 still in hotels as of March 2025' },
      { promise: 'Protect winter fuel payment for pensioners', kept: false, notes: 'Cut for 10 million pensioners Oct 2024' },
      { promise: 'Defend free movement', kept: false, notes: '"Red line for me" — now rules it out completely' },
      { promise: 'Nationalise rail, mail, energy, water', kept: 'partial', notes: 'Rail nationalisation begun; others stalled' },
      { promise: 'Abolish tuition fees', kept: false, notes: 'Dropped — "no money"' },
      { promise: 'Day-one unfair dismissal rights', kept: false, notes: 'Watered down after employer lobbying' },
      { promise: 'Workers\' Rights Bill — full delivery', kept: false, notes: 'Significantly weakened in passage' },
      { promise: 'Ethics and integrity commission', kept: false, notes: 'Downgraded to rebrand of existing watchdogs' },
    ]
  }
];

// Media ownership data
const MEDIA_DATA = [
  { name: 'Guardian', owner: 'Scott Trust', nationality: 'UK Non-profit', lean: -0.7, leanLabel: 'LEFT', leanColor: '#fc8181' },
  { name: 'Mirror', owner: 'Reach plc', nationality: 'UK', lean: -0.5, leanLabel: 'LEFT', leanColor: '#fc8181' },
  { name: 'Independent', owner: 'Evgeny Lebedev', nationality: 'Russian-British', lean: -0.3, leanLabel: 'C-LEFT', leanColor: '#fbb6ce' },
  { name: 'BBC', owner: 'UK Gov Charter', nationality: 'State', lean: 0.0, leanLabel: 'CENTRE', leanColor: '#e2e8f0' },
  { name: 'Channel 4', owner: 'UK Government', nationality: 'State', lean: -0.1, leanLabel: 'C-LEFT', leanColor: '#fbb6ce' },
  { name: 'Sky News', owner: 'Comcast/NBC', nationality: 'American', lean: 0.1, leanLabel: 'CENTRE', leanColor: '#e2e8f0' },
  { name: 'Times', owner: 'News UK/Murdoch', nationality: 'Australian-American', lean: 0.5, leanLabel: 'C-RIGHT', leanColor: '#90cdf4' },
  { name: 'Sun', owner: 'News UK/Murdoch', nationality: 'Australian-American', lean: 0.65, leanLabel: 'RIGHT', leanColor: '#90cdf4' },
  { name: 'Daily Mail', owner: 'DMGT/Rothermere', nationality: 'UK (non-dom)', lean: 0.75, leanLabel: 'RIGHT', leanColor: '#90cdf4' },
  { name: 'Telegraph', owner: 'Axel Springer', nationality: 'German', lean: 0.7, leanLabel: 'RIGHT', leanColor: '#90cdf4' },
  { name: 'Express', owner: 'Reach plc', nationality: 'UK', lean: 0.6, leanLabel: 'RIGHT', leanColor: '#90cdf4' },
  { name: 'GB News', owner: 'Various/UAE-backed', nationality: 'Mixed Foreign', lean: 0.85, leanLabel: 'FAR-R', leanColor: '#f6ad55' },
];

// Terror threat levels
const THREAT_LEVELS = [
  { level: 'CRITICAL', desc: 'Attack imminent', color: '#ff1744' },
  { level: 'SEVERE', desc: 'Attack highly likely', color: '#ff6d00' },
  { level: 'SUBSTANTIAL', desc: 'Attack likely', color: '#ff9100' },
  { level: 'MODERATE', desc: 'Attack possible', color: '#68d391' },
  { level: 'LOW', desc: 'Attack unlikely', color: '#4a5568' },
];

// Current threat — update manually or via CF Worker scraping MI5 RSS
// Source: https://www.mi5.gov.uk/threat-levels
const CURRENT_THREAT = {
  national: 'SUBSTANTIAL',
  northern_ireland: 'SUBSTANTIAL',
  last_updated: '2025-03',
  source: 'MI5.GOV.UK / JTAC'
};
