// De AI-scan: vragen, scoreformule en rapport. Puur: geen DOM, geen netwerk.
// De formule staat ook leesbaar op de pagina; wijzig ze samen.

export const QUESTIONS = [
  { id: 'sector', q: 'In welke sector werk je?', a: [
    ['juridisch', 'Advocatuur of notariaat'],
    ['financieel', 'Accountancy of administratie'],
    ['zorg', 'Zorgpraktijk'],
    ['techniek', 'Installatie, bouw of techniek'],
    ['handel', 'Handel of webwinkel'],
    ['anders', 'Iets anders'] ] },
  { id: 'mensen', q: 'Hoeveel mensen werken er?', a: [
    ['1', 'Alleen ik'], ['2-9', '2 tot 9'], ['10-49', '10 tot 49'], ['50+', '50 of meer'] ] },
  { id: 'taak', q: 'Welk werk kost de meeste handmatige tijd?', a: [
    ['mail', 'Mail lezen, sorteren en beantwoorden'],
    ['documenten', 'Documenten of dossiers ordenen en controleren'],
    ['facturen', 'Offertes, facturen en administratie'],
    ['planning', 'Planning en afspraken'],
    ['klantvragen', 'Klantvragen via telefoon, chat of formulier'],
    ['rapportage', 'Rapportages en overzichten maken'] ] },
  { id: 'uren', q: 'Hoeveel uur per week gaat daar samen in zitten?', a: [
    ['<5', 'Minder dan 5'], ['5-15', '5 tot 15'], ['15-40', '15 tot 40'], ['40+', 'Meer dan 40'] ] },
  { id: 'frequentie', q: 'Hoe vaak komt dit werk terug?', a: [
    ['dagelijks', 'Elke dag'], ['wekelijks', 'Elke week'], ['maandelijks', 'Eens per maand of minder'] ] },
  { id: 'voorspelbaar', q: 'Hoe voorspelbaar is het?', a: [
    ['vast', 'Meestal dezelfde stappen'],
    ['uitzonderingen', 'Vaste stappen, maar veel uitzonderingen'],
    ['maatwerk', 'Elke keer anders'] ] },
  { id: 'systemen', q: 'Waar werken jullie vooral in?', a: [
    ['m365', 'Microsoft 365 (Outlook, SharePoint, Teams)'],
    ['google', 'Google Workspace (Gmail, Drive)'],
    ['branche', 'Een branchepakket (dossier, boekhouding, ERP)'],
    ['papier', 'Vooral papier en losse bestanden'] ] },
  { id: 'ai', q: 'Gebruiken jullie al AI?', a: [
    ['nee', 'Nee'],
    ['los', 'Een paar mensen, op eigen houtje'],
    ['beleid', 'Ja, met een tool en afspraken'] ] },
  { id: 'vertrouwelijk', q: 'Hoe gevoelig is de informatie in dat werk?', a: [
    ['geheim', 'Beroepsgeheim of medisch'],
    ['persoonsgegevens', 'Persoonsgegevens van klanten'],
    ['laag', 'Weinig gevoelig'] ] },
  { id: 'tempo', q: 'Wanneer wil je resultaat zien?', a: [
    ['kwartaal', 'Dit kwartaal'], ['jaar', 'Dit jaar'], ['orienterend', 'Ik oriënteer me nog'] ] },
];

// Punten per antwoord (0-100) en het gewicht van elk onderdeel. Gewichten tellen op tot 1.
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
  if (!complete(answers)) throw new Error('Niet alle vragen zijn beantwoord');
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

const STAPPEN = {
  mail: [
    'Tel een week lang hoeveel mails binnenkomen per soort: vraag, stuk, factuur, overig. Dan weet je wat je wint.',
    'Maak regels die mail per soort in een map zetten. In Outlook heet dat Regels, in Gmail Filters.',
    'Schrijf standaardantwoorden voor de vijf vragen die het vaakst terugkomen, en laat AI ze alleen aanpassen, nooit zelf versturen.',
  ],
  documenten: [
    'Spreek één mapstructuur en één bestandsnaam af, bijvoorbeeld datum, klant, soort stuk.',
    'Maak per soort dossier een lijst van stukken die er altijd in moeten zitten.',
    'Laat AI binnen je eigen zakelijke omgeving controleren welke stukken ontbreken. Een mens vraagt ze op.',
  ],
  facturen: [
    'Zet inkomende facturen op één vast mailadres en koppel dat aan je boekhoudpakket. Veel pakketten lezen facturen al zelf in.',
    'Maak een offertesjabloon met vaste blokken, zodat je alleen de variabele delen invult.',
    'Plan een vast moment per week voor controle, in plaats van elke factuur los af te handelen.',
  ],
  planning: [
    'Laat klanten zelf een tijd kiezen via de agenda die je al hebt. Outlook en Google hebben daar een boekingspagina voor.',
    'Stuur automatisch een herinnering een dag van tevoren.',
    'Leg vast wie wat plant, zodat er één bron van waarheid is.',
  ],
  klantvragen: [
    'Schrijf de tien meest gestelde vragen met antwoord op je site. Dat scheelt de helft van de telefoontjes.',
    'Zet een formulier neer met verplichte velden, zodat elke vraag compleet binnenkomt.',
    'Laat AI een conceptantwoord maken dat een medewerker controleert voordat het de deur uitgaat.',
  ],
  rapportage: [
    'Bepaal welke vijf cijfers er echt toe doen en waar ze vandaan komen.',
    'Zet die bronnen in één spreadsheet die zichzelf bijwerkt.',
    'Laat AI pas de tekst bij de cijfers schrijven als de cijfers kloppen, en lees hem altijd na.',
  ],
};

const PRIVACY = [
  'Gebruik geen gratis of persoonlijke AI-accounts voor klantinformatie. Kies een zakelijk abonnement dat je data niet gebruikt om te trainen.',
  'Weet waar de data staat en wie erbij kan. Leg dat vast.',
  'Sluit een verwerkersovereenkomst met elke partij die persoonsgegevens voor je verwerkt (AVG art. 28).',
  'Neem AI-uitvoer nooit ongecontroleerd over. Een mens tekent af.',
  'Vertel klanten dat en hoe je AI gebruikt.',
];

export function report(answers) {
  const s = score(answers);
  const { perWeek, perJaar } = besparing(answers);
  return {
    score: s,
    route: route(answers),
    perWeek,
    perJaar,
    stappen: STAPPEN[answers.taak],
    privacy: answers.vertrouwelijk === 'laag' ? [] : PRIVACY,
  };
}

const label = (id, v) => QUESTIONS.find((x) => x.id === id).a.find(([k]) => k === v)[1];

// Tekst voor de mail die de bezoeker zelf verstuurt. Alleen de antwoorden, niets anders.
export function mailBody(answers) {
  const r = report(answers);
  const lines = QUESTIONS.map(({ id, q }) => `${q} ${label(id, answers[id])}`);
  return [`Kansscore: ${r.score} van 100`, `Indicatie: ${r.perWeek} uur per week`, '', ...lines].join('\n');
}
