// The AI scan: questions, scoring formula and report, in English and Dutch.
// Pure: no DOM, no network. UITLEG is the formula as printed on the page; change both together.
// No promises: the scan shows what goes into a job now (hours, and euros at the visitor's own rate)
// and which share of it fits automation, as a range. It never states a saving.

const t = (en, nl) => ({ en, nl });
const WEET_NIET = t('I don\'t know', 'Weet ik niet');

// An answer option is [value, label] or [value, label, { open: 'text' | 'number', field }].
// An open option asks for a free value in answers[field]. multi: true takes an array of values.
export const QUESTIONS = [
  { id: 'taak', q: t('If one job could run by itself from Monday, which one would it be?', 'Als één klus vanaf maandag vanzelf kon gaan, welke zou dat zijn?'), a: [
    ['mail', t('Sorting and answering the inbox', 'De inbox sorteren en beantwoorden')],
    ['documenten', t('Filing and checking documents or case files', 'Documenten of dossiers ordenen en controleren')],
    ['facturen', t('Processing invoices, quotes or orders', 'Facturen, offertes of orders verwerken')],
    ['overtypen', t('Copying data from one program into another', 'Gegevens overtypen van het ene programma naar het andere')],
    ['planning', t('Scheduling jobs, people or appointments', 'Klussen, mensen of afspraken inplannen')],
    ['klantvragen', t('Answering customer questions', 'Klantvragen beantwoorden')],
    ['rapportage', t('Putting together reports and overviews', 'Rapportages en overzichten maken')],
    ['anders', t('Something else, namely...', 'Iets anders, namelijk...'), { open: 'text', field: 'taakTekst' }] ] },
  { id: 'volume', q: t('How many times does it happen in an average week, spread over the year?', 'Hoe vaak gebeurt het in een gemiddelde week, uitgesmeerd over het jaar?'), a: [
    ['<5', t('Fewer than 5', 'Minder dan 5 keer')], ['5-25', t('5 to 25', '5 tot 25 keer')],
    ['25-100', t('25 to 100', '25 tot 100 keer')], ['100+', t('More than 100', 'Meer dan 100 keer')],
    ['onbekend', WEET_NIET] ] },
  { id: 'ritme', q: t('Is it steady, or does it come in peaks?', 'Is het gelijkmatig, of komt het in pieken?'), a: [
    ['stabiel', t('About the same every week', 'Elke week ongeveer even veel')],
    ['piek', t('Peaks at month-end or quarter-end', 'Pieken aan het eind van de maand of het kwartaal')],
    ['seizoen', t('Busy in some months, quiet in others', 'Druk in sommige maanden, rustig in andere')],
    ['onregelmatig', t('No pattern, it comes when it comes', 'Geen patroon, het komt wanneer het komt')] ] },
  { id: 'duur', q: t('And how long does one take, start to finish?', 'En hoe lang duurt één keer, van begin tot eind?'), a: [
    ['<5', t('Under 5 minutes', 'Minder dan 5 minuten')], ['5-15', t('5 to 15 minutes', '5 tot 15 minuten')],
    ['15-60', t('15 minutes to an hour', 'Een kwartier tot een uur')], ['60+', t('More than an hour', 'Meer dan een uur')],
    ['onbekend', WEET_NIET] ] },
  { id: 'mensen', q: t('How many people spend time on it?', 'Hoeveel mensen zijn er tijd aan kwijt?'), a: [
    ['een', t('One (that may be me)', 'Eén (dat kan ik zelf zijn)')],
    ['2-3', t('Two or three', 'Twee of drie')], ['4+', t('Four or more', 'Vier of meer')] ] },
  { id: 'kosten', q: t('Roughly what does an hour of that person cost your business?', 'Wat kost een uur van die persoon jullie bedrijf, ongeveer?'), a: [
    ['<40', t('Under €40', 'Minder dan €40')], ['40-70', t('€40 to €70', '€40 tot €70')],
    ['70-100', t('€70 to €100', '€70 tot €100')], ['100+', t('Over €100', 'Meer dan €100')],
    ['bedrag', t('Another amount: €...', 'Een ander bedrag: €...'), { open: 'number', field: 'kostenBedrag' }],
    ['onbekend', WEET_NIET] ] },
  { id: 'standaard', q: t('Out of ten times, how many go exactly the usual way?', 'Van de tien keer, hoe vaak gaat het precies zoals altijd?'), a: [
    ['9-10', t('9 or 10', '9 of 10 keer')], ['6-8', t('6 to 8', '6 tot 8 keer')],
    ['3-5', t('3 to 5', '3 tot 5 keer')], ['0-2', t('2 or fewer', '2 keer of minder')],
    ['onbekend', WEET_NIET] ] },
  { id: 'regels', q: t('Could a new colleague do it from a one-page checklist?', 'Kan een nieuwe collega het doen met een checklist van één A4?'), a: [
    ['checklist', t('Yes, after a day', 'Ja, na een dag')],
    ['deels', t('Mostly, but they would ask now and then', 'Grotendeels, maar ze zouden af en toe iets vragen')],
    ['ervaring', t('No, it takes years of experience', 'Nee, daar is jaren ervaring voor nodig')] ] },
  { id: 'invoer', multi: true, q: t('How does the work come in? Pick all that apply.', 'Hoe komt het werk binnen? Kies alles wat klopt.'), a: [
    ['velden', t('Through a form or a system, in fixed fields', 'Via een formulier of systeem, in vaste velden')],
    ['digitaal', t('By email, PDF or Word', 'Per mail, pdf of Word')],
    ['scans', t('Scans, photos or handwriting', 'Scans, foto\'s of handschrift')],
    ['papier', t('On paper or by phone', 'Op papier of telefonisch')] ] },
  { id: 'vertrouwelijk', q: t('If this data leaked, what would that mean?', 'Als deze gegevens uitlekken, wat betekent dat dan?'), a: [
    ['geheim', t('A breach of professional secrecy or medical data', 'Schending van beroepsgeheim of medische gegevens')],
    ['persoonsgegevens', t('Personal data of clients is out', 'Persoonsgegevens van klanten liggen op straat')],
    ['laag', t('Annoying, not serious', 'Vervelend, niet ernstig')] ] },
];

const vraag = (id) => QUESTIONS.find((x) => x.id === id);
const geldig = (id, v) => vraag(id).a.some(([k]) => k === v);
const lijst = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);

export function complete(a) {
  return QUESTIONS.every(({ id, multi }) => (multi
    ? lijst(a[id]).length > 0 && lijst(a[id]).every((v) => geldig(id, v))
    : geldig(id, a[id])));
}

// "I don't know" never crashes and never flatters: it takes a cautious middle value
// and is listed in the report as something to verify in the call.
const STANDAARDWAARDE = { volume: '5-25', duur: '5-15', kosten: '40-70', standaard: '3-5' };

// The hourly cost actually used: the visitor's own number, the middle of their band, or (don't know) an assumption.
const UURPRIJS = { '<40': 35, '40-70': 55, '70-100': 85, '100+': 120 };
export const AANNAME_UURPRIJS = 55;
export function uurprijs(a) {
  if (a.kosten === 'bedrag') {
    const n = Number(a.kostenBedrag);
    if (Number.isFinite(n) && n >= 10 && n <= 500) return { prijs: Math.round(n), eigen: true };
    return { prijs: AANNAME_UURPRIJS, eigen: false };
  }
  if (a.kosten === 'onbekend') return { prijs: AANNAME_UURPRIJS, eigen: false };
  return { prijs: UURPRIJS[a.kosten], eigen: true };
}
const kostenBand = (a) => {
  const { prijs } = uurprijs(a);
  return prijs < 40 ? '<40' : prijs < 70 ? '40-70' : prijs < 100 ? '70-100' : '100+';
};

// Hours per week are derived, not asked: times per week x minutes per time, capped by headcount.
const KEER = { '<5': 3, '5-25': 15, '25-100': 50, '100+': 150 };
const MINUTEN = { '<5': 3, '5-15': 10, '15-60': 30, '60+': 90 };
const MAX_UREN = { een: 40, '2-3': 120, '4+': 200 };
export const UREN_BANDEN = [['<5', 5], ['5-10', 10], ['10-20', 20], ['20-40', 40], ['40+', Infinity]];
const echt = (id, a) => (a[id] === 'onbekend' ? STANDAARDWAARDE[id] : a[id]);

export function uren(a) {
  const h = (KEER[echt('volume', a)] * MINUTEN[echt('duur', a)]) / 60;
  return Math.min(h, MAX_UREN[a.mensen]);
}
export function urenBand(a) { const h = uren(a); return UREN_BANDEN.find(([, max]) => h < max)[0]; }

// Points per answer (0-100) and the weight of each criterion. Weights sum to 1.
// Fit for automation: volume, standaard, regels, invoer (0.60). Weight in the business: uren, kosten (0.40).
export const FORMULA = {
  volume:    { w: 0.15, p: { '<5': 10, '5-25': 45, '25-100': 80, '100+': 100 } },
  standaard: { w: 0.20, p: { '9-10': 100, '6-8': 70, '3-5': 35, '0-2': 10 } },
  regels:    { w: 0.15, p: { checklist: 100, deels: 60, ervaring: 15 } },
  invoer:    { w: 0.10, p: { velden: 100, digitaal: 85, scans: 45, papier: 10 } },
  uren:      { w: 0.25, p: { '<5': 10, '5-10': 40, '10-20': 65, '20-40': 85, '40+': 100 } },
  kosten:    { w: 0.15, p: { '<40': 40, '40-70': 65, '70-100': 85, '100+': 100 } },
};

function punten(a) {
  const pt = {};
  for (const [id, { p }] of Object.entries(FORMULA)) {
    if (id === 'uren') pt[id] = p[urenBand(a)];
    else if (id === 'kosten') pt[id] = p[kostenBand(a)];
    else if (id === 'invoer') { const v = lijst(a.invoer); pt[id] = v.reduce((s, x) => s + p[x], 0) / v.length; }
    else pt[id] = p[echt(id, a)];
  }
  return pt;
}

// Knock-out: too small (under 5 hours a week, only when both counts are known) or too irregular.
export const PLAFOND = 39;
export function knockout(a) {
  const urenBekend = a.volume !== 'onbekend' && a.duur !== 'onbekend';
  return (urenBekend && uren(a) < 5) || a.standaard === '0-2';
}

export function score(a) {
  if (!complete(a)) throw new Error('Not every question is answered');
  const pt = punten(a);
  let s = 0; // whole percent weights keep the sum exact
  for (const [id, { w }] of Object.entries(FORMULA)) s += Math.round(w * 100) * pt[id];
  s = Math.round(s / 100);
  return knockout(a) ? Math.min(s, PLAFOND) : s;
}

// What goes into this job now, from the visitor's own numbers. An indication, not a saving.
export const WERKWEKEN = 46;
// Share that fits automation, as a range: cases that go the usual way x the part that follows rules
// x how much of the input a machine can read. A person always checks, so the top is below 100%.
const DEEL_STANDAARD = { '9-10': [0.7, 0.9], '6-8': [0.5, 0.7], '3-5': [0.25, 0.45], '0-2': [0.05, 0.15], onbekend: [0.25, 0.7] };
const DEEL_REGELS = { checklist: [0.8, 0.95], deels: [0.55, 0.8], ervaring: [0.25, 0.5] };
const DEEL_INVOER = { velden: 1, digitaal: 1, scans: 0.8, papier: 0.4 };
const vijf = (x) => Math.round(x * 20) * 5; // to the nearest 5%

export function inzet(a) {
  const v = lijst(a.invoer);
  const inp = v.reduce((s, x) => s + DEEL_INVOER[x], 0) / v.length;
  const [sL, sH] = DEEL_STANDAARD[a.standaard];
  const [rL, rH] = DEEL_REGELS[a.regels];
  const deel = [vijf(sL * rL * inp), vijf(sH * rH * inp)];
  const urenPerWeek = uren(a);
  const urenPerJaar = Math.round((urenPerWeek * WERKWEKEN) / 10) * 10;
  const { prijs, eigen } = uurprijs(a);
  const euroPerJaar = Math.round((urenPerJaar * prijs) / 100) * 100;
  const urenDeel = deel.map((pct) => Math.round((urenPerJaar * pct) / 100 / 10) * 10);
  return { urenPerWeek: Math.round(urenPerWeek), urenPerJaar, uurprijs: prijs, eigenPrijs: eigen, euroPerJaar, deel, urenDeel };
}

// A call is worth both sides' time when the work fits and enough goes into it now.
export const DREMPEL = { score: 60, euro: 20000 };
export function route(a) {
  return score(a) >= DREMPEL.score && inzet(a).euroPerJaar >= DREMPEL.euro ? 'gesprek' : 'zelf';
}

// Verdicts describe fit, never money.
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

export const CRITERIA = {
  volume: t('how often it happens', 'hoe vaak het gebeurt'),
  standaard: t('how often it goes the usual way', 'hoe vaak het gaat zoals altijd'),
  regels: t('how rule-based it is', 'hoeveel het op regels draait'),
  invoer: t('how the work comes in', 'hoe het werk binnenkomt'),
  uren: t('the hours it takes', 'de uren die het kost'),
  kosten: t('what an hour costs', 'wat een uur kost'),
};

// The two criteria that lift the score most and the two that hold it back most (weighted).
export function drivers(a, lang = 'en') {
  const pt = punten(a);
  const r = Object.entries(FORMULA).map(([id, { w }]) => ({ id, plus: w * pt[id], min: w * (100 - pt[id]) }));
  const top = [...r].sort((x, y) => y.plus - x.plus).slice(0, 2).map((x) => x.id);
  const low = r.filter((x) => !top.includes(x.id)).sort((x, y) => y.min - x.min).slice(0, 2).map((x) => x.id);
  return { sterk: top.map((id) => CRITERIA[id][lang]), zwak: low.map((id) => CRITERIA[id][lang]) };
}

// What to verify in the call: every "I don't know", plus the situations a scan cannot see.
const VERIFIEER = {
  volume: t('How often it happens: you did not know, so we counted 15 times a week.', 'Hoe vaak het gebeurt: je wist het niet, dus we rekenden met 15 keer per week.'),
  duur: t('How long one takes: you did not know, so we counted 10 minutes.', 'Hoe lang één keer duurt: je wist het niet, dus we rekenden met 10 minuten.'),
  standaard: t('How often it goes the usual way: you did not know, so the share is a wide range.', 'Hoe vaak het gaat zoals altijd: je wist het niet, dus het deel is een brede range.'),
  kosten: t(`What an hour costs: we used an assumed €${AANNAME_UURPRIJS}.`, `Wat een uur kost: we rekenden met een aangenomen €${AANNAME_UURPRIJS}.`),
  piek: t('Peaks at month-end or quarter-end: how big the peak is and who absorbs it.', 'Pieken aan het eind van de maand of het kwartaal: hoe groot de piek is en wie hem opvangt.'),
  seizoen: t('Seasonal work: how many busy months, and whether there is a year of history to test on.', 'Seizoenswerk: hoeveel drukke maanden, en of er een jaar historie is om op te testen.'),
  onregelmatig: t('No pattern: whether the average holds over a year.', 'Geen patroon: of het gemiddelde over een jaar klopt.'),
  mensen: t('Several people do it: hand-offs between them often take more time than the work.', 'Meerdere mensen doen het: de overdracht tussen hen kost vaak meer tijd dan het werk.'),
  anders: t('Your own job description: we used general advice, the call makes it specific.', 'Je eigen omschrijving van de klus: we gaven algemeen advies, het gesprek maakt het specifiek.'),
};

export function teVerifieren(a, lang = 'en') {
  const out = [];
  if (a.taak === 'anders') out.push('anders');
  for (const id of ['volume', 'duur', 'standaard']) if (a[id] === 'onbekend') out.push(id);
  if (!uurprijs(a).eigen) out.push('kosten');
  if (VERIFIEER[a.ritme]) out.push(a.ritme);
  if (a.mensen !== 'een') out.push('mensen');
  return out.map((k) => VERIFIEER[k][lang]);
}

export const UITLEG = t(
  'Six of your answers score 0 to 100 and your score is their weighted average: 60% is how well the work fits automation (how often, how standard, how rule-based, how it comes in) and 40% is its weight in your business (hours a week and what an hour costs you). Under 5 hours a week, or when 2 in 10 times or fewer go the usual way, the score stops at 39; an "I don\'t know" counts as a cautious middle value and is marked to verify. The hours and euros are what goes into this job now, from your own numbers, and with a score of 60 or more and €20,000 a year or more going in, we offer a call.',
  'Zes van je antwoorden scoren 0 tot 100 en je score is het gewogen gemiddelde: 60% is hoe goed het werk bij automatisering past (hoe vaak, hoe standaard, hoeveel regels, hoe het binnenkomt) en 40% is het gewicht in je bedrijf (uren per week en wat een uur je kost). Onder de 5 uur per week, of als het 2 op de 10 keer of minder gaat zoals altijd, stopt de score bij 39; een "weet ik niet" telt als een voorzichtige middenwaarde en staat bij de punten om te checken. De uren en euro\'s zijn wat er nu in deze klus gaat, op basis van je eigen cijfers, en bij een score van 60 of meer en €20.000 per jaar of meer bieden we een gesprek aan.',
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
const vrijeTekst = (s) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);
const fmt = (n, lang) => new Intl.NumberFormat(lang === 'nl' ? 'nl-NL' : 'en-GB').format(n);
const euro = (n, lang) => new Intl.NumberFormat(lang === 'nl' ? 'nl-NL' : 'en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

function antwoord(id, a, lang) {
  if (id === 'taak' && a.taak === 'anders') return vrijeTekst(a.taakTekst) || label('taak', 'anders', lang);
  if (id === 'kosten' && a.kosten === 'bedrag' && uurprijs(a).eigen) return euro(uurprijs(a).prijs, lang);
  return lijst(a[id]).map((v) => label(id, v, lang)).join(', ');
}

export function report(a, lang = 'en') {
  const s = score(a);
  const b = band(s);
  const z = inzet(a);
  return {
    score: s, band: b.id, bandNaam: b.naam[lang], oordeel: b.oordeel[lang], route: route(a),
    taak: antwoord('taak', a, lang), ...z, euro: euro(z.euroPerJaar, lang), prijs: euro(z.uurprijs, lang),
    ...drivers(a, lang), verifieer: teVerifieren(a, lang),
    stappen: STAPPEN[a.taak].map((x) => x[lang]),
    privacy: a.vertrouwelijk === 'laag' ? [] : PRIVACY.map((x) => x[lang]),
  };
}

const TEKST = {
  en: { titel: 'HARNAS AI scan', cijfers: 'What goes into this job now (indication, based on your own numbers)',
    waarom: 'Why this score', plus: 'Lifts it', min: 'Holds it back', check: 'To verify in a call',
    stappen: 'Three steps you can take this week', privacy: 'Before any AI touches this data', volgende: 'Next step', antwoorden: 'Your answers',
    uren: (r, lang) => `About ${fmt(r.urenPerJaar, lang)} hours a year (${r.urenPerWeek} a week, ${WERKWEKEN} working weeks).`,
    geld: (r) => `At ${r.eigenPrijs ? 'your own' : 'an assumed'} ${r.prijs} an hour, that is about ${r.euro} a year.`,
    deel: (r, lang) => `Between ${r.deel[0]}% and ${r.deel[1]}% of it goes the usual way and follows rules: about ${fmt(r.urenDeel[0], lang)} to ${fmt(r.urenDeel[1], lang)} hours a year that fit automation. Not a promise: the call and a test on your own history settle it.`,
    gesprek: 'This is worth a 15-minute call. Reply with two times that suit you.',
    zelf: 'Start with the three steps. If a number above is off, reply and we look again.' },
  nl: { titel: 'HARNAS AI-scan', cijfers: 'Wat er nu in deze klus gaat (indicatie, op basis van je eigen cijfers)',
    waarom: 'Waarom deze score', plus: 'Trekt hem omhoog', min: 'Houdt hem tegen', check: 'Te checken in een gesprek',
    stappen: 'Drie stappen voor deze week', privacy: 'Voordat AI aan deze gegevens komt', volgende: 'Volgende stap', antwoorden: 'Je antwoorden',
    uren: (r, lang) => `Ongeveer ${fmt(r.urenPerJaar, lang)} uur per jaar (${r.urenPerWeek} per week, ${WERKWEKEN} werkweken).`,
    geld: (r) => `Tegen ${r.eigenPrijs ? 'je eigen' : 'een aangenomen'} ${r.prijs} per uur is dat ongeveer ${r.euro} per jaar.`,
    deel: (r, lang) => `Tussen ${r.deel[0]}% en ${r.deel[1]}% daarvan gaat zoals altijd en volgt regels: ongeveer ${fmt(r.urenDeel[0], lang)} tot ${fmt(r.urenDeel[1], lang)} uur per jaar die bij automatisering passen. Geen belofte: het gesprek en een test op je eigen historie wijzen het uit.`,
    gesprek: 'Dit is een gesprek van 15 minuten waard. Antwoord met twee tijden die je passen.',
    zelf: 'Begin met de drie stappen. Klopt een cijfer hierboven niet, antwoord dan en we kijken opnieuw.' },
};

// The one-page report as plain text. The founder pastes it into a mail by hand.
export function reportText(a, lang = 'en') {
  const r = report(a, lang);
  const T = TEKST[lang];
  return [
    `${T.titel}: ${r.taak}`,
    `Score: ${r.score} / 100 (${r.bandNaam}). ${r.oordeel}`,
    '',
    T.cijfers,
    `- ${T.uren(r, lang)}`,
    `- ${T.geld(r)}`,
    `- ${T.deel(r, lang)}`,
    '',
    T.waarom,
    `- ${T.plus}: ${r.sterk.join(', ')}.`,
    `- ${T.min}: ${r.zwak.join(', ')}.`,
    ...(r.verifieer.length ? ['', T.check, ...r.verifieer.map((x) => `- ${x}`)] : []),
    '',
    T.stappen,
    ...r.stappen.map((x, n) => `${n + 1}. ${x}`),
    ...(r.privacy.length ? ['', T.privacy, ...r.privacy.map((x) => `- ${x}`)] : []),
    '',
    T.volgende,
    r.route === 'gesprek' ? T.gesprek : T.zelf,
    '',
    T.antwoorden,
    ...QUESTIONS.map(({ id, q }) => `- ${q[lang]} ${antwoord(id, a, lang)}`),
  ].join('\n');
}

// What lands in the founder's mailbox: raw answers, the computed result, and the address to reply to.
export function submissionText(a, { email = '', lang = 'en' } = {}) {
  const r = report(a, lang);
  return [
    `email: ${vrijeTekst(email)}`,
    `lang: ${lang}`,
    `score: ${r.score} (${r.band}), route: ${r.route}`,
    `uren/jaar: ${r.urenPerJaar}, uurprijs: ${r.uurprijs}${r.eigenPrijs ? '' : ' (aanname)'}, euro/jaar: ${r.euroPerJaar}, deel: ${r.deel[0]}-${r.deel[1]}%`,
    `te checken: ${r.verifieer.length}`,
    '',
    ...QUESTIONS.map(({ id }) => `${id}: ${lijst(a[id]).join(',')}`),
    ...(a.taak === 'anders' ? [`taakTekst: ${vrijeTekst(a.taakTekst)}`] : []),
    ...(a.kosten === 'bedrag' ? [`kostenBedrag: ${vrijeTekst(a.kostenBedrag)}`] : []),
  ].join('\n');
}

// Kept for app.js: the body of the mail to HARNAS.
export function mailBody(a, lang = 'en') { return submissionText(a, { lang }); }
