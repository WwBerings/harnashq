// The AI scan: questions, scoring formula and report, in English and Dutch.
// Pure: no DOM, no network. The formula is also printed on the page; change both together.

const t = (en, nl) => ({ en, nl });

export const QUESTIONS = [
  { id: 'sector', q: t('What do you do?', 'Wat doe je?'), a: [
    ['juridisch', t('Law or notary', 'Advocatuur of notariaat')],
    ['financieel', t('Accounting or admin', 'Accountancy of administratie')],
    ['zorg', t('Healthcare practice', 'Zorgpraktijk')],
    ['techniek', t('Trades, building or engineering', 'Installatie, bouw of techniek')],
    ['handel', t('Retail or e-commerce', 'Handel of webwinkel')],
    ['anders', t('Something else', 'Iets anders')] ] },
  { id: 'mensen', q: t('How many people work there?', 'Hoeveel mensen werken er?'), a: [
    ['1', t('Just me', 'Alleen ik')], ['2-9', t('2 to 9', '2 tot 9')], ['10-49', t('10 to 49', '10 tot 49')], ['50+', t('50 or more', '50 of meer')] ] },
  { id: 'taak', q: t('What eats the most manual time?', 'Wat kost de meeste handmatige tijd?'), a: [
    ['mail', t('Reading, sorting and answering email', 'Mail lezen, sorteren en beantwoorden')],
    ['documenten', t('Filing and checking documents', 'Documenten of dossiers ordenen en controleren')],
    ['facturen', t('Quotes, invoices and admin', 'Offertes, facturen en administratie')],
    ['planning', t('Scheduling and appointments', 'Planning en afspraken')],
    ['klantvragen', t('Customer questions by phone, chat or form', 'Klantvragen via telefoon, chat of formulier')],
    ['rapportage', t('Reports and overviews', 'Rapportages en overzichten')] ] },
  { id: 'uren', q: t('Hours per week, all together?', 'Hoeveel uur per week, samen?'), a: [
    ['<5', t('Under 5', 'Minder dan 5')], ['5-15', t('5 to 15', '5 tot 15')], ['15-40', t('15 to 40', '15 tot 40')], ['40+', t('Over 40', 'Meer dan 40')] ] },
  { id: 'frequentie', q: t('How often does it come back?', 'Hoe vaak komt het terug?'), a: [
    ['dagelijks', t('Every day', 'Elke dag')], ['wekelijks', t('Every week', 'Elke week')], ['maandelijks', t('Monthly or less', 'Eens per maand of minder')] ] },
  { id: 'voorspelbaar', q: t('How predictable is it?', 'Hoe voorspelbaar is het?'), a: [
    ['vast', t('Mostly the same steps', 'Meestal dezelfde stappen')],
    ['uitzonderingen', t('Same steps, many exceptions', 'Vaste stappen, veel uitzonderingen')],
    ['maatwerk', t('Different every time', 'Elke keer anders')] ] },
  { id: 'systemen', q: t('Where do you mostly work?', 'Waar werken jullie vooral in?'), a: [
    ['m365', t('Microsoft 365', 'Microsoft 365')],
    ['google', t('Google Workspace', 'Google Workspace')],
    ['branche', t('Industry software (case, accounting, ERP)', 'Branchepakket (dossier, boekhouding, ERP)')],
    ['papier', t('Mostly paper and loose files', 'Vooral papier en losse bestanden')] ] },
  { id: 'ai', q: t('Do you use AI yet?', 'Gebruiken jullie al AI?'), a: [
    ['nee', t('No', 'Nee')], ['los', t('A few people, on their own', 'Een paar mensen, op eigen houtje')], ['beleid', t('Yes, with a tool and rules', 'Ja, met een tool en afspraken')] ] },
  { id: 'vertrouwelijk', q: t('How sensitive is the data?', 'Hoe gevoelig is de informatie?'), a: [
    ['geheim', t('Professional secrecy or medical', 'Beroepsgeheim of medisch')],
    ['persoonsgegevens', t('Personal data of clients', 'Persoonsgegevens van klanten')],
    ['laag', t('Not very', 'Weinig gevoelig')] ] },
  { id: 'tempo', q: t('When do you want results?', 'Wanneer wil je resultaat?'), a: [
    ['kwartaal', t('This quarter', 'Dit kwartaal')], ['jaar', t('This year', 'Dit jaar')], ['orienterend', t('Just exploring', 'Ik oriënteer me nog')] ] },
];

// Points per answer (0-100) and the weight of each part. Weights sum to 1.
export const FORMULA = {
  uren:         { w: 0.35, p: { '<5': 10, '5-15': 45, '15-40': 80, '40+': 100 } },
  voorspelbaar: { w: 0.25, p: { vast: 100, uitzonderingen: 60, maatwerk: 20 } },
  frequentie:   { w: 0.20, p: { dagelijks: 100, wekelijks: 70, maandelijks: 30 } },
  systemen:     { w: 0.10, p: { m365: 100, google: 100, branche: 80, papier: 25 } },
  ai:           { w: 0.05, p: { nee: 50, los: 70, beleid: 100 } },
  tempo:        { w: 0.05, p: { kwartaal: 100, jaar: 70, orienterend: 40 } },
};

const UREN_MIDDEN = { '<5': 3, '5-15': 10, '15-40': 27, '40+': 50 };
const AANDEEL = { vast: 0.6, uitzonderingen: 0.4, maatwerk: 0.15 };
const WERKWEKEN = 46;

export function complete(answers) {
  return QUESTIONS.every(({ id, a }) => a.some(([v]) => v === answers[id]));
}

export function score(answers) {
  if (!complete(answers)) throw new Error('Not every question is answered');
  let total = 0;
  for (const [id, { w, p }] of Object.entries(FORMULA)) total += w * p[answers[id]];
  return Math.round(total);
}

export function besparing(answers) {
  const perWeek = Math.round(UREN_MIDDEN[answers.uren] * AANDEEL[answers.voorspelbaar]);
  return { perWeek, perJaar: perWeek * WERKWEKEN };
}

export function route(answers) {
  const groot = ['10-49', '50+'].includes(answers.mensen) || ['15-40', '40+'].includes(answers.uren);
  return groot && score(answers) >= 50 ? 'gesprek' : 'zelf';
}

export const STAPPEN = {
  mail: [
    t('Count incoming mail by type for one week: question, document, invoice, other. Now you know the prize.', 'Tel een week lang de binnenkomende mail per soort: vraag, stuk, factuur, overig. Dan weet je wat je wint.'),
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
};

export const PRIVACY = [
  t('No free or personal AI accounts for client data. Use a business plan that does not train on your data.', 'Geen gratis of persoonlijke AI-accounts voor klantgegevens. Kies een zakelijk abonnement dat niet traint op je data.'),
  t('Know where the data lives and who can reach it. Write it down.', 'Weet waar de data staat en wie erbij kan. Leg dat vast.'),
  t('Sign a data processing agreement with every party that handles personal data (GDPR art. 28).', 'Sluit een verwerkersovereenkomst met elke partij die persoonsgegevens verwerkt (AVG art. 28).'),
  t('Never use AI output unchecked. A person signs off.', 'Neem AI-uitvoer nooit ongecontroleerd over. Een mens tekent af.'),
  t('Tell clients that, and how, you use AI.', 'Vertel klanten dat en hoe je AI gebruikt.'),
];

export function report(answers, lang = 'en') {
  const s = score(answers);
  const { perWeek, perJaar } = besparing(answers);
  return {
    score: s, route: route(answers), perWeek, perJaar,
    stappen: STAPPEN[answers.taak].map((x) => x[lang]),
    privacy: answers.vertrouwelijk === 'laag' ? [] : PRIVACY.map((x) => x[lang]),
  };
}

const label = (id, v, lang) => QUESTIONS.find((x) => x.id === id).a.find(([k]) => k === v)[1][lang];

// Body of the email the visitor sends themselves. Only their answers.
export function mailBody(answers, lang = 'en') {
  const r = report(answers, lang);
  const L = lang === 'nl' ? ['Kansscore', 'van 100', 'Indicatie', 'uur per week'] : ['Opportunity score', 'out of 100', 'Estimate', 'hours per week'];
  const lines = QUESTIONS.map(({ id, q }) => `${q[lang]} ${label(id, answers[id], lang)}`);
  return [`${L[0]}: ${r.score} ${L[1]}`, `${L[2]}: ${r.perWeek} ${L[3]}`, '', ...lines].join('\n');
}
