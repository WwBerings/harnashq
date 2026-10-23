import { QUESTIONS, report, mailBody } from './scan.js';

const $ = (id) => document.getElementById(id);
const MAIL = 'hallo@harnashq.com';

// Binnenkomende delen van secties zichtbaar maken.
const io = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
}, { rootMargin: '0px 0px -10% 0px' });
document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));

// ---------------- scan ----------------
const answers = {};
let i = -1; // -1 = nog niet begonnen

const btnTerug = $('btn-terug');
const btnDoor = $('btn-door');
const tabs = { vragen: $('tab-vragen'), uitslag: $('tab-uitslag'), formule: $('tab-formule') };
const panes = { vragen: $('pane-vragen'), uitslag: $('pane-uitslag'), formule: $('pane-formule') };

function showTab(name) {
  for (const k of Object.keys(tabs)) {
    tabs[k].setAttribute('aria-selected', String(k === name));
    panes[k].hidden = k !== name;
  }
}
for (const [k, t] of Object.entries(tabs)) t.addEventListener('click', () => !t.disabled && showTab(k));

function renderQuestion() {
  const { id, q, a } = QUESTIONS[i];
  $('vraag-tekst').textContent = q;
  const box = $('opties');
  box.innerHTML = '';
  for (const [value, label] of a) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'opt';
    b.textContent = label;
    b.setAttribute('aria-pressed', String(answers[id] === value));
    b.addEventListener('click', () => { answers[id] = value; next(); });
    box.appendChild(b);
  }
  const rest = QUESTIONS.length - i - 1;
  $('rest').textContent = rest === 0 ? 'Laatste vraag.' : rest === 1 ? 'Nog één vraag hierna.' : `Nog ${rest} vragen hierna.`;
  btnTerug.disabled = i === 0;
  btnDoor.textContent = answers[id] ? 'Volgende' : 'Kies een antwoord';
  btnDoor.disabled = !answers[id];
  box.querySelector('[aria-pressed="true"], .opt')?.focus({ preventScroll: true });
}

function next() {
  if (i < QUESTIONS.length - 1) { i++; renderQuestion(); } else finish();
}

function finish() {
  const r = report(answers);
  const groot = r.route === 'gesprek';

  const sq = document.querySelector('.square');
  $('proof-num').textContent = r.score;
  sq.classList.remove('struck'); void sq.offsetWidth; sq.classList.add('struck');

  $('uitslag-kop').textContent = `Kansscore ${r.score} van 100`;
  $('uitslag-tekst').textContent = groot
    ? `Hier ligt genoeg om samen naar te kijken: ongeveer ${r.perWeek} uur per week dat een systeem kan overnemen. Plan een gesprek van 45 minuten; binnen 48 uur daarna heb je een kansenkaart.`
    : `Met deze omvang kun je zelf al veel winnen. Je rapport staat hieronder: drie stappen voor je eigen werk, met de software die je al hebt.`;
  tabs.uitslag.disabled = false;
  showTab('uitslag');

  $('rapport-lead').textContent = groot
    ? `Je score is ${r.score}. Er is genoeg herhaling en volume om een agent voor te bouwen. Deze drie stappen kun je nu al zetten; in een gesprek kijken we wat er daarna kan.`
    : `Je score is ${r.score}. Een maatwerkproject is voor jou waarschijnlijk niet de beste eerste stap. Begin met deze drie stappen; ze kosten je niets behalve een middag.`;
  $('rapport-uren').textContent = r.perWeek;
  fill('rapport-stappen', r.stappen);
  $('rapport-privacy').hidden = r.privacy.length === 0;
  fill('rapport-checklist', r.privacy);

  const subject = `AI-scan: kansscore ${r.score}`;
  const href = `mailto:${MAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(mailBody(answers))}`;
  const mail = $('btn-mail');
  mail.href = href;
  mail.textContent = groot ? 'Plan een gesprek' : 'Toch even mailen';
  mail.classList.toggle('ink', groot);
  mail.classList.toggle('tone', !groot);
  $('btn-print').classList.toggle('ink', !groot);
  $('btn-print').classList.toggle('tone', groot);
  $('rapport').hidden = false;

  btnTerug.textContent = 'Opnieuw';
  btnTerug.disabled = false;
  btnDoor.textContent = groot ? 'Plan een gesprek' : 'Lees je rapport';
  btnDoor.disabled = false;
  i = QUESTIONS.length; // klaar
  btnDoor.dataset.href = groot ? href : '#rapport';
}

function fill(id, items) {
  const el = $(id);
  el.innerHTML = '';
  for (const t of items) { const li = document.createElement('li'); li.textContent = t; el.appendChild(li); }
}

btnDoor.addEventListener('click', () => {
  if (i === -1) { i = 0; showTab('vragen'); renderQuestion(); return; }
  if (i === QUESTIONS.length) {
    const h = btnDoor.dataset.href;
    if (h.startsWith('#')) $('rapport').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    else location.href = h;
    return;
  }
  next();
});

btnTerug.addEventListener('click', () => {
  if (i === QUESTIONS.length) { // opnieuw
    for (const k of Object.keys(answers)) delete answers[k];
    document.querySelector('.square').classList.remove('struck');
    $('rapport').hidden = true;
    tabs.uitslag.disabled = true;
    btnTerug.textContent = 'Vorige vraag';
    i = 0; showTab('vragen'); renderQuestion(); return;
  }
  if (i > 0) { i--; showTab('vragen'); renderQuestion(); }
});
btnTerug.disabled = true;

$('btn-print').addEventListener('click', () => window.print());
