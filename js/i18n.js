// Page copy. English by default; Dutch for Dutch browsers, the toggle or ?lang=nl.
export const STRINGS = {
  title: ['HARNAS · AI consultancy for small business', 'HARNAS · AI-consultancy voor het mkb'],
  desc: ['We find what saves your business time or money, and build it. Privacy by design. Book the audit or take the free scan.',
    'Wij vinden wat je bedrijf tijd of geld bespaart, en bouwen het. Privacy by design. Boek de audit of doe de gratis scan.'],
  navHow: ['How we work', 'Werkwijze'],
  navAudit: ['The audit', 'De audit'],
  navScan: ['Free scan', 'Gratis scan'],
  ctaAudit: ['Book the audit', 'Boek de audit'],
  ctaScan: ['Free scan', 'Gratis scan'],
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
  w1: ['Audit', 'Audit'], w1p: ['Two weeks. One process. A two-page map.', 'Twee weken. Eén proces. Een kaart van twee pagina’s.'],
  w2: ['Proposal', 'Voorstel'], w2p: ['One fixed price, before we start.', 'Eén vaste prijs, voordat we beginnen.'],
  w3: ['Build', 'Bouw'], w3p: ['Inside the tools you already have.', 'In de systemen die je al hebt.'],
  w4: ['Maintain', 'Beheer'], w4p: ['Optional, per month.', 'Optioneel, per maand.'],

  privH: ['Privacy by design.', 'Privacy by design.'],
  privP: ['Built to the rules that apply to your data.', 'Gebouwd naar de regels die voor jouw data gelden.'],
  m1: ['GDPR', 'AVG'], m2: ['EU AI Act', 'AI-verordening'], m3: ['NOvA guidance', 'NOvA-aanbevelingen'], m4: ['Rules of conduct', 'Gedragsregels'],

  scanH: ['Free scan', 'Gratis scan'],
  scanP: ['Three questions, thirty seconds. No email needed.', 'Drie vragen, dertig seconden. Geen e-mail nodig.'],
  tabQ: ['Questions', 'Vragen'], tabR: ['Result', 'Uitslag'], tabF: ['How we judge', 'Hoe we oordelen'],
  start: ['Start the scan', 'Start de scan'], back: ['Back', 'Vorige'], next: ['Next', 'Volgende'],
  pick: ['Pick an answer', 'Kies een antwoord'], again: ['Start over', 'Opnieuw'],
  left: ['{n} to go', 'nog {n}'], last: ['Last one', 'Laatste vraag'],
  otherPh: ['In your own words', 'In je eigen woorden'],
  judge: ['Two things decide it: how many hours a week go into the job, and how often it goes the usual way. Under three hours is too small to build for; a job that is different almost every time needs tidying up first. The rest is worth an audit.',
    'Twee dingen bepalen het: hoeveel uur per week in de klus gaat, en hoe vaak het gaat zoals altijd. Onder de drie uur is te klein om voor te bouwen; een klus die bijna elke keer anders gaat, moet eerst geordend. De rest is een audit waard.'],
  yours: ['We work inside your own accounts. Your data stays yours.', 'We werken in je eigen accounts. Je data blijft van jou.'],

  auditH: ['The audit', 'De audit'],
  auditP: ['Two weeks, one process. We take 20 to 50 real recent cases and bring back a two-page map: three options in hours, one recommended, with a fixed build price. The audit fee is credited in full if you build.',
    'Twee weken, één proces. We nemen 20 tot 50 echte recente gevallen en komen terug met een kaart van twee pagina’s: drie opties in uren, één aanbevolen, met een vaste bouwprijs. De auditprijs wordt volledig verrekend als je bouwt.'],
  auditKeep: ['Even if you never build, you keep the map.', 'Ook als je nooit bouwt, houd je de kaart.'],
  fEmail: ['Your email', 'Je e-mail'],
  fQ: ['Which job should we look at, and roughly how many hours a week go into it?', 'Welke klus moeten we bekijken, en ongeveer hoeveel uur per week gaat erin?'],
  fSend: ['Book the audit', 'Boek de audit'],
  fScan: ['Send my scan answers and result along.', 'Stuur mijn scanantwoorden en uitslag mee.'],
  fNote: ['No payment now. We reply within a working day with the price and a date for the intake.', 'Je betaalt nu niets. We antwoorden binnen een werkdag met de prijs en een datum voor de intake.'],
  fSent: ['Booked. You will hear from us within a working day.', 'Geboekt. Je hoort binnen een werkdag van ons.'],
  fFail: ['That did not work. Email us at info@harnashq.com.', 'Dat lukte niet. Mail ons op info@harnashq.com.'],

  footH: ['Book the audit.', 'Boek de audit.'],
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
  document.querySelectorAll('a[data-privacy]').forEach((a) => { a.href = lang === 'nl' ? 'privacy.html' : 'privacy-en.html'; });
}
