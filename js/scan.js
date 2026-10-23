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

// The verdict is words, checked top-down. Hours and "usual way" decide it; the score is only logged.
export const BANDS = [
  { id: 'teklein', naam: t('Too small to build for', 'Te klein om voor te bouwen'),
    zin: t('Too few hours to build for. Check what your current software can already do.', 'Te weinig uren om voor te bouwen. Kijk wat je huidige software al kan.'), audit: false },
  { id: 'ordenen', naam: t('Tidy up first', 'Eerst ordenen'),
    zin: t('This job is different almost every time. Write down the steps first, then try the scan again.', 'Deze klus gaat bijna elke keer anders. Schrijf eerst de stappen op en doe de scan daarna opnieuw.'), audit: false },
  { id: 'klaar', naam: t('Ready to hand over', 'Klaar om uit handen te geven'),
    zin: t('This job is regular and big enough to hand over. An audit shows how.', 'Deze klus is regelmatig en groot genoeg om uit handen te geven. Een audit laat zien hoe.'), audit: true },
  { id: 'bekijken', naam: t('Worth a closer look', 'Het onderzoeken waard'),
    zin: t('Part of this job could go. An audit shows which part.', 'Een deel van deze klus kan eruit. Een audit laat zien welk deel.'), audit: true },
];
const USUAL = { '9-10': 9.5, '6-8': 7, '3-5': 4, '0-2': 1, anders: null };
export function band(a) {
  const h = uren(a), u = USUAL[a.standaard];
  if (a.uren === '<5' || (a.uren === 'anders' && urenUitTekst(a.urenTekst) !== null && h < 3)) return BANDS[0];
  if (u !== null && u <= 2) return BANDS[1];
  if (a.uren !== 'anders' && u !== null && h >= 10 && u >= 6) return BANDS[2];
  return BANDS[3];
}
export function route(a) { return band(a).audit ? 'audit' : 'zelf'; }

// What an audit checks first for this task: the one line that replaces the tips.
export const AUDIT_EERST = {
  mail: t('An audit checks first which mails come back every week, and which ones a person must keep answering.', 'Een audit kijkt eerst welke mails elke week terugkomen, en welke een mens moet blijven beantwoorden.'),
  documenten: t('An audit checks first which documents every file must contain, and how often one is missing.', 'Een audit kijkt eerst welke stukken elk dossier moet bevatten, en hoe vaak er een ontbreekt.'),
  facturen: t('An audit checks first where invoices and quotes come in, and how many need a correction by hand.', 'Een audit kijkt eerst waar facturen en offertes binnenkomen, en hoeveel er met de hand gecorrigeerd worden.'),
  overtypen: t('An audit checks first which fields get copied, and whether the two programs can already talk to each other.', 'Een audit kijkt eerst welke velden worden overgetypt, en of de twee programma\'s al met elkaar kunnen praten.'),
  planning: t('An audit checks first how requests come in and how often a slot is moved.', 'Een audit kijkt eerst hoe aanvragen binnenkomen en hoe vaak een afspraak verzet wordt.'),
  klantvragen: t('An audit checks first which ten questions make up most of the volume, and where the answers already exist.', 'Een audit kijkt eerst welke tien vragen het meeste volume maken, en waar de antwoorden al staan.'),
  rapportage: t('An audit checks first which numbers you really use, and where each one comes from.', 'Een audit kijkt eerst welke cijfers je echt gebruikt, en waar elk cijfer vandaan komt.'),
  anders: t('An audit checks first how often the job happens and which steps are the same each time.', 'Een audit kijkt eerst hoe vaak de klus voorkomt en welke stappen elke keer hetzelfde zijn.'),
};

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

const label = (id, v, lang) => vraag(id).a.find(([k]) => k === v)[1][lang];
const fmt = (n, lang) => new Intl.NumberFormat(lang === 'nl' ? 'nl-NL' : 'en-GB').format(n);
const FIELD = { taak: 'taakTekst', uren: 'urenTekst', standaard: 'standaardTekst' };

function antwoord(id, a, lang) {
  if (a[id] === 'anders') return vrijeTekst(a[FIELD[id]]) || label(id, 'anders', lang);
  return label(id, a[id], lang);
}

export function report(a, lang = 'en') {
  const b = band(a);
  const z = inzet(a);
  return {
    score: score(a), band: b.id, bandNaam: b.naam[lang], oordeel: b.zin[lang], route: route(a),
    taak: antwoord('taak', a, lang), ...z, verifieer: teVerifieren(a, lang),
    eerst: AUDIT_EERST[a.taak][lang],
    urenZin: lang === 'nl'
      ? `Je zei ${a.uren === 'anders' ? 'ongeveer ' : ''}${z.urenPerWeek} uur per week: zo'n ${fmt(z.urenPerJaar, lang)} uur per jaar.`
      : `You said ${a.uren === 'anders' ? 'about ' : ''}${z.urenPerWeek} hours a week: about ${fmt(z.urenPerJaar, lang)} hours a year.`,
    auditVraag: lang === 'nl' ? `${antwoord('taak', a, lang)}, ongeveer ${z.urenPerWeek} uur per week` : `${antwoord('taak', a, lang)}, about ${z.urenPerWeek} hours a week`,
  };
}

// The result as plain text, for the founder's mailbox.
export function reportText(a, lang = 'en') {
  const r = report(a, lang);
  return [`${lang === 'nl' ? 'HARNAS AI-scan' : 'HARNAS AI scan'}: ${r.taak}`, `${r.bandNaam}. ${r.oordeel}`, r.urenZin, r.eerst,
    ...(r.verifieer.length ? ['', ...r.verifieer] : []),
    '', ...QUESTIONS.map(({ q, id }) => `${q[lang]} ${antwoord(id, a, lang)}`)].join('\n');
}

export function submissionText(a, { email = '', lang = 'en' } = {}) {
  const r = report(a, lang);
  return [
    `email: ${vrijeTekst(email)}`,
    `lang: ${lang}`,
    `score: ${r.score} (${r.band}), route: ${r.route}`,
    `uren/jaar: ${r.urenPerJaar}`,
    '',
    ...QUESTIONS.map(({ id }) => `${id}: ${a[id]}${a[id] === 'anders' ? ' | ' + vrijeTekst(a[FIELD[id]]) : ''}`),
  ].join('\n');
}

export function mailBody(a, lang = 'en') { return submissionText(a, { lang }); }
