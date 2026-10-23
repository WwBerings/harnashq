// Page copy. English by default; Dutch for Dutch browsers, the toggle or ?lang=nl.
export const STRINGS = {
  title: ['HARNAS · AI consultancy for small business', 'HARNAS · AI-consultancy voor het mkb'],
  desc: ['We find what saves your business time or money, and build it. Privacy by design. Start with the free scan.',
    'Wij vinden wat je bedrijf tijd of geld bespaart, en bouwen het. Privacy by design. Begin met de gratis scan.'],
  navHow: ['How we work', 'Werkwijze'],
  navPrivacy: ['Privacy', 'Privacy'],
  navScan: ['AI scan', 'AI-scan'],
  cta: ['Take the scan', 'Doe de scan'],
  waitlist: ['Join the waitlist', 'Op de wachtlijst'],
  heroH: ['AI consultancy for small business.', 'AI-consultancy voor het mkb.'],
  heroP: ['We find what saves your business time or money, and build it. Privacy by design.', 'Wij vinden wat je bedrijf tijd of geld bespaart, en bouwen het. Privacy by design.'],

  posH: ['You know AI can help.', 'Je weet dat AI kan helpen.'],
  posH2: ['You don’t need to know how.', 'Hoe, hoef je niet te weten.'],
  p1q: ['Monday: copying numbers', 'Maandag: cijfers overtypen'], p1a: ['Runs at night.', 'Loopt ’s nachts.'],
  p2q: ['The same five questions', 'Dezelfde vijf vragen'], p2a: ['Drafted. You send.', 'Klaargezet. Jij verstuurt.'],
  p3q: ['Chasing documents', 'Stukken nabellen'], p3a: ['Asked for you.', 'Voor je opgevraagd.'],
  p4q: ['An evening per quote', 'Een avond per offerte'], p4a: ['Twenty minutes.', 'Twintig minuten.'],
  p5q: ['Month-end surprise', 'Verrassing eind van de maand'], p5a: ['Every Monday.', 'Elke maandag.'],
  p6q: ['Typing up voicemails', 'Voicemails uittikken'], p6a: ['In the file.', 'In het dossier.'],

  howH: ['How we work', 'Hoe we werken'],
  w1: ['Audit', 'Audit'], w1p: ['We look at how the work runs.', 'We kijken hoe het werk loopt.'],
  w2: ['Proposal', 'Voorstel'], w2p: ['One fixed price, before we start.', 'Eén vaste prijs, voordat we beginnen.'],
  w3: ['Build', 'Bouw'], w3p: ['Inside the tools you already have.', 'In de systemen die je al hebt.'],
  w4: ['Maintain', 'Beheer'], w4p: ['Optional, per month.', 'Optioneel, per maand.'],

  privH: ['Privacy by design.', 'Privacy by design.'],
  privP: ['Built to the rules that apply to your data.', 'Gebouwd naar de regels die voor jouw data gelden.'],
  m1: ['GDPR', 'AVG'], m2: ['EU AI Act', 'AI-verordening'], m3: ['NOvA guidance', 'NOvA-aanbevelingen'], m4: ['Rules of conduct', 'Gedragsregels'],

  scanH: ['Where does AI pay off in your business?', 'Waar loont AI in jouw bedrijf?'],
  scanP: ['Three questions, one minute. A score and an estimate from your own numbers.', 'Drie vragen, één minuut. Een score en een indicatie uit je eigen cijfers.'],
  tabQ: ['Questions', 'Vragen'], tabR: ['Result', 'Uitslag'], tabF: ['How we score', 'Hoe we scoren'],
  start: ['Start the scan', 'Start de scan'], back: ['Back', 'Vorige'], next: ['Next', 'Volgende'],
  pick: ['Pick an answer', 'Kies een antwoord'], again: ['Start over', 'Opnieuw'],
  left: ['{n} to go', 'nog {n}'], last: ['Last one', 'Laatste vraag'],
  otherPh: ['In your own words', 'In je eigen woorden'],
  scoreOf: ['out of 100', 'van 100'],
  hoursYr: ['hours a year go into this now', 'uur per jaar gaat hier nu in'],
  fitYr: ['hours a year that fit automation', 'uur per jaar die bij automatisering passen'],
  basis: ['Your own numbers. An indication, not a promise.', 'Je eigen cijfers. Een indicatie, geen belofte.'],
  verify: ['To verify', 'Te checken'],
  read: ['Read your report', 'Lees je rapport'],

  repSteps: ['What you can do yourself', 'Wat je zelf kunt doen'],
  repPriv: ['Before any AI touches this data', 'Voordat AI aan deze gegevens komt'],
  print: ['Save as PDF', 'Bewaar als pdf'],

  wlH: ['Join the waitlist', 'Op de wachtlijst'],
  wlP: ['A few businesses at a time. You hear from us personally.', 'Een paar bedrijven tegelijk. Je hoort persoonlijk van ons.'],
  wlScan: ['Your scan result comes with it.', 'Je scanuitslag gaat mee.'],
  fEmail: ['Your email', 'Je e-mail'],
  fQ: ['What work would you hand off tomorrow if you could?', 'Welk werk zou je morgen uit handen geven als dat kon?'],
  fSend: ['Join the waitlist', 'Zet me op de wachtlijst'], fSent: ['You are on the list. You will hear from us.', 'Je staat op de lijst. Je hoort van ons.'],
  fFail: ['That did not work. Email us at info@harnashq.com.', 'Dat lukte niet. Mail ons op info@harnashq.com.'],

  footH: ['Start with the scan.', 'Begin met de scan.'],
  legal: ['No cookies, no trackers', 'Geen cookies, geen trackers'], privacyLink: ['Privacy statement', 'Privacyverklaring'],
};

export function getLang() {
  const q = new URLSearchParams(location.search).get('lang');
  if (q === 'nl' || q === 'en') return q;
  try { const s = localStorage.getItem('lang'); if (s === 'nl' || s === 'en') return s; } catch {}
  const prefs = navigator.languages?.length ? navigator.languages : [navigator.language || 'en'];
  return prefs.some((l) => /^nl\b/i.test(l)) ? 'nl' : 'en';
}

export function saveLang(l) { try { localStorage.setItem('lang', l); } catch {} }

export const tr = (key, lang, vars = {}) =>
  STRINGS[key][lang === 'nl' ? 1 : 0].replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');

export function apply(lang) {
  document.documentElement.lang = lang;
  document.title = tr('title', lang);
  document.querySelector('meta[name="description"]')?.setAttribute('content', tr('desc', lang));
  document.querySelectorAll('[data-t]').forEach((el) => { el.textContent = tr(el.dataset.t, lang); });
  document.querySelectorAll('[data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang)));
}
