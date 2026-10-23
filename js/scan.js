// The AI scan: three questions, a score and an hours estimate. Pure: no DOM, no network.
// Every question has an open option; free text counts as "unknown" and is flagged to verify.

const t = (en, nl) => ({ en, nl });
const OTHER = { open: 'text' };

export const QUESTIONS = [
  { id: 'taak', q: t('Which job eats the most time?', 'Welke klus vreet de meeste tijd?'), a: [
    ['mail', t('Sorting and answering the inbox', 'De inbox sorteren en beantwoorden')],
    ['documenten', t('Filing and checking documents or case files', 'Documenten of dossiers ordenen en controleren')],
    ['facturen', t('Processing invoices, quotes or orders', 'Facturen, offertes of orders verwerken')],
    ['overtypen', t('Copying data from one program into another', 'Gegevens overtypen van het ene programma naar het andere')],
    ['planning', t('Scheduling jobs, people or appointments', 'Klussen, mensen of afspraken inplannen')],
    ['klantvragen', t('Answering customer questions', 'Klantvragen beantwoorden')],
    ['rapportage', t('Putting together reports and overviews', 'Rapportages en overzichten maken')],
    ['anders', t('Something else, namely', 'Iets anders, namelijk'), { ...OTHER, field: 'taakTekst' }] ] },
  { id: 'uren', q: t('How many hours a week go into it, everyone together?', 'Hoeveel uur per week gaat erin, iedereen samen?'), a: [
    ['<5', t('Under 5', 'Minder dan 5')], ['5-15', t('5 to 15', '5 tot 15')],
    ['15-40', t('15 to 40', '15 tot 40')], ['40+', t('More than 40', 'Meer dan 40')],
    ['anders', t('Something else, namely', 'Iets anders, namelijk'), { ...OTHER, field: 'urenTekst' }] ] },
  { id: 'standaard', q: t('Out of ten times, how often does it go exactly the usual way?', 'Van de tien keer, hoe vaak gaat het precies zoals altijd?'), a: [
    ['9-10', t('9 or 10', '9 of 10 keer')], ['6-8', t('6 to 8', '6 tot 8 keer')],
    ['3-5', t('3 to 5', '3 tot 5 keer')], ['0-2', t('2 or fewer', '2 keer of minder')],
    ['anders', t('Something else, namely', 'Iets anders, namelijk'), { ...OTHER, field: 'standaardTekst' }] ] },
];

const vraag = (id) => QUESTIONS.find((x) => x.id === id);
const geldig = (id, v) => vraag(id).a.some(([k]) => k === v);
const vrijeTekst = (s) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, 120);

export function complete(a) {
  return QUESTIONS.every(({ id, a: opts }) => {
    if (!geldig(id, a[id])) return false;
    const open = opts.find(([k]) => k === a[id])?.[2];
    return !open || vrijeTekst(a[open.field]).length > 0;
  });
}

// Points per answer. "anders" is a cautious middle value.
export const FORMULA = {
  uren:      { w: 0.5, p: { '<5': 10, '5-15': 45, '15-40': 80, '40+': 100, anders: 45 } },
  standaard: { w: 0.5, p: { '9-10': 100, '6-8': 70, '3-5': 40, '0-2': 10, anders: 55 } },
};
const UREN_MIDDEN = { '<5': 3, '5-15': 10, '15-40': 27, '40+': 50, anders: 10 };
const DEEL = { '9-10': [60, 85], '6-8': [40, 65], '3-5': [20, 45], '0-2': [0, 15], anders: [25, 65] };
export const WERKWEKEN = 46;
export const PLAFOND = 39;

// Try to read a number of hours from free text ("about 20 hours", "20u"); otherwise the middle value.
export function urenUitTekst(s) {
  const m = vrijeTekst(s).match(/(\d+(?:[.,]\d+)?)/);
  if (!m) return null;
  const n = parseFloat(m[1].replace(',', '.'));
  return n > 0 && n <= 400 ? n : null;
}

export function uren(a) {
  if (a.uren === 'anders') return urenUitTekst(a.urenTekst) ?? UREN_MIDDEN.anders;
  return UREN_MIDDEN[a.uren];
}

export function knockout(a) {
  return a.uren === '<5' || a.standaard === '0-2';
}

export function score(a) {
  if (!complete(a)) throw new Error('Not every question is answered');
  let total = 0;
  for (const [id, { w, p }] of Object.entries(FORMULA)) total += w * p[a[id]];
  const s = Math.round(total);
  return knockout(a) ? Math.min(s, PLAFOND) : s;
}

export function inzet(a) {
  const urenPerWeek = uren(a);
  const urenPerJaar = Math.round((urenPerWeek * WERKWEKEN) / 10) * 10;
  const deel = DEEL[a.standaard];
  const urenDeel = deel.map((pct) => Math.round((urenPerJaar * pct) / 100 / 10) * 10);
  return { urenPerWeek: Math.round(urenPerWeek), urenPerJaar, deel, urenDeel };
}

export const DREMPEL = { score: 60 };
export function route(a) { return score(a) >= DREMPEL.score ? 'gesprek' : 'zelf'; }

export const BANDS = [
  { id: 'zeersterk', min: 80, naam: t('Very strong', 'Zeer sterk'),
    oordeel: t('On every point we asked about, this job fits automation well.', 'Op elk punt dat we vroegen past deze klus goed bij automatisering.') },
  { id: 'sterk', min: 60, naam: t('Strong', 'Sterk'),
    oordeel: t('A good fit for an agent, with a person checking the exceptions.', 'Past goed bij een agent, met een mens die de uitzonderingen controleert.') },
  { id: 'deels', min: 40, naam: t('Partly', 'Deels'),
    oordeel: t('Part of it fits. The usual cases are the place to start.', 'Een deel past. De standaardgevallen zijn de plek om te beginnen.') },
  { id: 'laag', min: 0, naam: t('Low', 'Laag'),
    oordeel: t('Too small or too irregular to build for now. The steps below are a better start than software.', 'Te klein of te onregelmatig om nu voor te bouwen. De stappen hieronder zijn een betere start dan software.') },
];
export function band(s) { return BANDS.find((b) => s >= b.min); }

const VERIFIEER = {
  taak: t('Your own description of the job: the advice below is general, a conversation makes it specific.', 'Je eigen omschrijving van de klus: het advies hieronder is algemeen, een gesprek maakt het specifiek.'),
  uren: t('The hours: we read a number from your answer where we could, otherwise we counted 10 a week.', 'De uren: we lazen een getal uit je antwoord waar het kon, anders rekenden we met 10 per week.'),
  standaard: t('How often it goes the usual way: your own words, so the share is a wide range.', 'Hoe vaak het gaat zoals altijd: je eigen woorden, dus het deel is een brede range.'),
};
export function teVerifieren(a, lang = 'en') {
  return QUESTIONS.filter(({ id }) => a[id] === 'anders').map(({ id }) => VERIFIEER[id][lang]);
}

export const UITLEG = t(
  'Two answers score 0 to 100 and your score is their average: the hours a week that go into the job, and how often it goes the usual way. Under 5 hours a week, or when it goes the usual way 2 in 10 times or fewer, the score stops at 39. The hours a year are your own numbers times 46 working weeks; the part that fits automation is a range, not a promise.',
  'Twee antwoorden scoren 0 tot 100 en je score is het gemiddelde: de uren per week die in de klus gaan, en hoe vaak het gaat zoals altijd. Onder de 5 uur per week, of als het 2 op de 10 keer of minder gaat zoals altijd, stopt de score bij 39. De uren per jaar zijn je eigen cijfers maal 46 werkweken; het deel dat bij automatisering past is een range, geen belofte.',
);

export const STAPPEN = {
  mail: [
    t('Count incoming mail by type for one week: question, document, invoice, other. Now you know the size.', 'Tel een week lang de binnenkomende mail per soort: vraag, stuk, factuur, overig. Dan weet je hoe groot het is.'),
    t('Add rules that file mail by type. Outlook calls them Rules, Gmail calls them Filters.', 'Maak regels die mail per soort in een map zetten. In Outlook heet dat Regels, in Gmail Filters.'),
    t('Write standard replies for your five most common questions. Let AI adapt them, never send them.', 'Schrijf standaardantwoorden voor je vijf meest gestelde vragen. Laat AI ze aanpassen, nooit zelf versturen.'),
  ],
  documenten: [
    t('Agree one folder structure and one file name: date, client, document type.', 'Spreek één mapstructuur en één bestandsnaam af: datum, klant, soort stuk.'),
    t('List the documents every type of file must contain.', 'Maak per soort dossier een lijst van stukken die er altijd in moeten zitten.'),
    t('Let AI inside your own business account flag what is missing. A person asks for it.', 'Laat AI binnen je eigen zakelijke omgeving controleren wat ontbreekt. Een mens vraagt het op.'),
  ],
  facturen: [
    t('Send all incoming invoices to one address linked to your accounting software. Most read invoices already.', 'Zet inkomende facturen op één mailadres gekoppeld aan je boekhoudpakket. Veel pakketten lezen ze al zelf in.'),
    t('Build a quote template with fixed blocks, so you only fill in what changes.', 'Maak een offertesjabloon met vaste blokken, zodat je alleen invult wat verandert.'),
    t('Check once a week at a fixed time instead of invoice by invoice.', 'Controleer één vast moment per week in plaats van per factuur.'),
  ],
  overtypen: [
    t('Write down which fields you copy, from where to where. That list is the whole specification.', 'Schrijf op welke velden je overtypt, van waar naar waar. Die lijst is de hele specificatie.'),
    t('Check whether both programs can export and import, or connect directly. Often they can and nobody switched it on.', 'Kijk of beide programma\'s kunnen exporteren en importeren, of direct koppelen. Vaak kan het en heeft niemand het aangezet.'),
    t('Until then, copy in one batch at a fixed moment, not one by one through the day.', 'Neem het tot die tijd in één keer over op een vast moment, niet los door de dag heen.'),
  ],
  planning: [
    t('Let clients pick a slot in the calendar you already have. Outlook and Google both offer a booking page.', 'Laat klanten zelf een tijd kiezen in je bestaande agenda. Outlook en Google hebben een boekingspagina.'),
    t('Send an automatic reminder the day before.', 'Stuur automatisch een herinnering een dag van tevoren.'),
    t('Decide who plans what, so there is one source of truth.', 'Leg vast wie wat plant, zodat er één bron van waarheid is.'),
  ],
  klantvragen: [
    t('Put your ten most asked questions and answers on your site. It cuts the calls.', 'Zet je tien meest gestelde vragen met antwoord op je site. Dat scheelt telefoontjes.'),
    t('Use a form with required fields so every question arrives complete.', 'Gebruik een formulier met verplichte velden, zodat elke vraag compleet binnenkomt.'),
    t('Let AI draft a reply that a colleague checks before it goes out.', 'Laat AI een conceptantwoord maken dat een collega controleert voordat het de deur uitgaat.'),
  ],
  rapportage: [
    t('Pick the five numbers that matter and where each one comes from.', 'Bepaal welke vijf cijfers ertoe doen en waar ze vandaan komen.'),
    t('Pull those sources into one spreadsheet that updates itself.', 'Zet die bronnen in één spreadsheet die zichzelf bijwerkt.'),
    t('Only let AI write the text once the numbers are right, and always read it.', 'Laat AI pas tekst schrijven als de cijfers kloppen, en lees hem altijd na.'),
  ],
  anders: [
    t('Write down the steps of one case exactly as you did it last time. That list is where every automation starts.', 'Schrijf de stappen van één keer op, precies zoals je het de laatste keer deed. Met die lijst begint elke automatisering.'),
    t('Mark each step: always the same, or does it depend? The "always the same" steps are the candidates.', 'Zet bij elke stap: altijd hetzelfde, of hangt het ervan af? De stappen die altijd hetzelfde zijn, zijn de kandidaten.'),
    t('Count for two weeks how often it happens and how long it takes. Then the numbers in this scan are yours, not estimates.', 'Tel twee weken hoe vaak het gebeurt en hoe lang het duurt. Dan zijn de cijfers in deze scan van jou, geen schattingen.'),
  ],
};

export const PRIVACY = [
  t('No free or personal AI accounts for client data. Use a business plan that does not train on your data.', 'Geen gratis of persoonlijke AI-accounts voor klantgegevens. Kies een zakelijk abonnement dat niet traint op je data.'),
  t('Know where the data lives and who can reach it. Write it down.', 'Weet waar de data staat en wie erbij kan. Leg dat vast.'),
  t('Sign a data processing agreement with every party that handles personal data (GDPR art. 28).', 'Sluit een verwerkersovereenkomst met elke partij die persoonsgegevens verwerkt (AVG art. 28).'),
  t('Never use AI output unchecked. A person signs off.', 'Neem AI-uitvoer nooit ongecontroleerd over. Een mens tekent af.'),
  t('Tell clients that, and how, you use AI.', 'Vertel klanten dat en hoe je AI gebruikt.'),
];

const label = (id, v, lang) => vraag(id).a.find(([k]) => k === v)[1][lang];
const fmt = (n, lang) => new Intl.NumberFormat(lang === 'nl' ? 'nl-NL' : 'en-GB').format(n);
const FIELD = { taak: 'taakTekst', uren: 'urenTekst', standaard: 'standaardTekst' };

function antwoord(id, a, lang) {
  if (a[id] === 'anders') return vrijeTekst(a[FIELD[id]]) || label(id, 'anders', lang);
  return label(id, a[id], lang);
}

export function report(a, lang = 'en') {
  const s = score(a);
  const b = band(s);
  const z = inzet(a);
  return {
    score: s, band: b.id, bandNaam: b.naam[lang], oordeel: b.oordeel[lang], route: route(a),
    taak: antwoord('taak', a, lang), ...z, verifieer: teVerifieren(a, lang),
    stappen: STAPPEN[a.taak].map((x) => x[lang]),
    privacy: PRIVACY.map((x) => x[lang]),
  };
}

const TEKST = {
  en: { titel: 'HARNAS AI scan', uren: 'Hours', check: 'To verify', stappen: 'Three steps you can take this week', privacy: 'Before any AI touches this data', antwoorden: 'Your answers',
    inzet: (r, l) => `About ${fmt(r.urenPerJaar, l)} hours a year go into this now (${r.urenPerWeek} a week, ${WERKWEKEN} working weeks). Between ${r.deel[0]}% and ${r.deel[1]}% of it goes the usual way: about ${fmt(r.urenDeel[0], l)} to ${fmt(r.urenDeel[1], l)} hours a year that fit automation. Not a promise.` },
  nl: { titel: 'HARNAS AI-scan', uren: 'Uren', check: 'Te checken', stappen: 'Drie stappen voor deze week', privacy: 'Voordat AI aan deze gegevens komt', antwoorden: 'Je antwoorden',
    inzet: (r, l) => `Ongeveer ${fmt(r.urenPerJaar, l)} uur per jaar gaat hier nu in (${r.urenPerWeek} per week, ${WERKWEKEN} werkweken). Tussen ${r.deel[0]}% en ${r.deel[1]}% daarvan gaat zoals altijd: ongeveer ${fmt(r.urenDeel[0], l)} tot ${fmt(r.urenDeel[1], l)} uur per jaar die bij automatisering passen. Geen belofte.` },
};

// The one-page report as plain text. The founder pastes it into a mail by hand.
export function reportText(a, lang = 'en') {
  const r = report(a, lang);
  const T = TEKST[lang];
  const lines = [
    `${T.titel}: ${r.taak}`,
    `${r.score}/100, ${r.bandNaam}. ${r.oordeel}`,
    '',
    `${T.uren}: ${T.inzet(r, lang)}`,
  ];
  if (r.verifieer.length) lines.push('', `${T.check}:`, ...r.verifieer.map((x) => `- ${x}`));
  lines.push('', `${T.stappen}:`, ...r.stappen.map((x, i) => `${i + 1}. ${x}`));
  lines.push('', `${T.privacy}:`, ...r.privacy.map((x) => `- ${x}`));
  lines.push('', `${T.antwoorden}:`, ...QUESTIONS.map(({ q, id }) => `${q[lang]} ${antwoord(id, a, lang)}`));
  return lines.join('\n');
}

export function submissionText(a, { email = '', lang = 'en' } = {}) {
  const r = report(a, lang);
  return [
    `email: ${vrijeTekst(email)}`,
    `lang: ${lang}`,
    `score: ${r.score} (${r.band}), route: ${r.route}`,
    `uren/jaar: ${r.urenPerJaar}, deel: ${r.deel[0]}-${r.deel[1]}%`,
    '',
    ...QUESTIONS.map(({ id }) => `${id}: ${a[id]}${a[id] === 'anders' ? ' | ' + vrijeTekst(a[FIELD[id]]) : ''}`),
  ].join('\n');
}

export function mailBody(a, lang = 'en') { return submissionText(a, { lang }); }
