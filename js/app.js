import { QUESTIONS, complete, report, reportText, submissionText, UITLEG } from './scan.js';
import { getLang, saveLang, apply, tr } from './i18n.js';

const $ = (id) => document.getElementById(id);
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
let lang = getLang();

// ---------------- language ----------------
function setLang(l) { lang = l; saveLang(l); apply(l); $('formula-text').textContent = UITLEG[l]; render(); }
document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));

// ---------------- reveal on entry ----------------
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' });
document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));

// ---------------- scan ----------------
const answers = {};
let i = -1;                 // -1 = not started, QUESTIONS.length = done
const back = $('btn-back'), go = $('btn-go');
const tabs = { q: $('tab-q'), r: $('tab-r'), f: $('tab-f') };
const panes = { q: $('pane-q'), r: $('pane-r'), f: $('pane-f') };

function showTab(k) { for (const n in tabs) { tabs[n].setAttribute('aria-selected', String(n === k)); panes[n].hidden = n !== k; } }
for (const [k, b] of Object.entries(tabs)) b.addEventListener('click', () => !b.disabled && showTab(k));

const answered = (qd) => {
  const v = answers[qd.id];
  if (!v) return false;
  const opt = qd.a.find(([k]) => k === v)?.[2];
  return !opt?.open || !!(answers[opt.field] || '').trim();
};

function renderQuestion(focus) {
  const qd = QUESTIONS[i];
  const { id, q, a } = qd;
  $('q-text').textContent = q[lang];
  const box = $('opts'); box.innerHTML = '';
  for (const [v, l, opt] of a) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'opt'; b.textContent = l[lang];
    b.setAttribute('aria-pressed', String(answers[id] === v));
    b.addEventListener('click', () => {
      answers[id] = v;
      if (opt?.open) { renderQuestion(false); box.querySelector('input')?.focus(); return; }
      next();
    });
    if (opt?.open && answers[id] === v) {
      const wrap = document.createElement('div'); wrap.className = 'opt-free'; wrap.appendChild(b);
      const inp = document.createElement('input');
      inp.type = 'text'; inp.placeholder = tr('otherPh', lang); inp.value = answers[opt.field] || ''; inp.maxLength = 120;
      inp.setAttribute('aria-label', l[lang]);
      inp.addEventListener('input', () => { answers[opt.field] = inp.value; go.disabled = !answered(qd); go.textContent = tr(answered(qd) ? 'next' : 'pick', lang); });
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && answered(qd)) { e.preventDefault(); next(); } });
      wrap.appendChild(inp); box.appendChild(wrap);
    } else box.appendChild(b);
  }
  const n = QUESTIONS.length - i - 1;
  $('rest').textContent = n === 0 ? tr('last', lang) : tr('left', lang, { n });
  back.disabled = i === 0; back.textContent = tr('back', lang);
  go.disabled = !answered(qd); go.textContent = tr(answered(qd) ? 'next' : 'pick', lang);
  if (focus) box.querySelector('.opt')?.focus({ preventScroll: true });
}

function next() { if (i < QUESTIONS.length - 1) { i++; renderQuestion(true); } else finish(); }

function countUp(el, to) {
  if (still) { el.textContent = to; return; }
  const t0 = performance.now(), d = 1400;
  const step = (now) => { const k = Math.min(1, (now - t0) / d); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}

function finish() {
  i = QUESTIONS.length;
  document.querySelector('.scan').dataset.done = '1';
  tabs.r.disabled = false; showTab('r');
  $('report').hidden = false;
  render();
  const r = report(answers, lang);
  countUp($('score-num'), r.score);
  $('gauge-arc').style.strokeDashoffset = String(276.46 * (1 - r.score / 100));
}

function render() {
  if (i >= 0 && i < QUESTIONS.length) renderQuestion(false);
  if (i === -1) { go.textContent = tr('start', lang); go.disabled = false; }
  if (i !== QUESTIONS.length || !complete(answers)) return;
  const r = report(answers, lang);
  const n = (x) => x.toLocaleString(lang === 'nl' ? 'nl-NL' : 'en-GB');
  $('verdict').textContent = `${r.bandNaam}. ${r.oordeel}`;
  $('impact').hidden = false;
  $('hours-yr').textContent = n(r.urenPerJaar);
  $('fit-yr').textContent = `${n(r.urenDeel[0])} – ${n(r.urenDeel[1])}`;
  $('verify-wrap').hidden = r.verifieer.length === 0; fill('verify', r.verifieer);
  fill('rep-steps', r.stappen); fill('rep-check', r.privacy);
  $('f-score').value = r.score; $('f-lang').value = lang;
  $('f-answers').value = submissionText(answers, { lang }) + '\n\n---- report ----\n' + reportText(answers, lang);
  $('wl-scan').hidden = false;
  back.disabled = false; back.textContent = tr('again', lang);
  go.disabled = false; go.textContent = tr(r.route === 'gesprek' ? 'waitlist' : 'read', lang);
  go.dataset.target = r.route === 'gesprek' ? '#waitlist' : '#report';
}

function fill(id, items) { const el = $(id); el.innerHTML = ''; for (const t of items) { const li = document.createElement('li'); li.textContent = t; el.appendChild(li); } }

go.addEventListener('click', () => {
  if (i === -1) { i = 0; showTab('q'); renderQuestion(true); return; }
  if (i === QUESTIONS.length) { document.querySelector(go.dataset.target).scrollIntoView({ behavior: still ? 'auto' : 'smooth' }); return; }
  next();
});
back.addEventListener('click', () => {
  if (i === QUESTIONS.length) {
    for (const k in answers) delete answers[k];
    $('score-num').textContent = ''; $('gauge-arc').style.strokeDashoffset = '276.46'; $('verdict').textContent = ''; $('impact').hidden = true;
    $('report').hidden = true; $('wl-scan').hidden = true; $('f-answers').value = ''; $('f-score').value = '';
    tabs.r.disabled = true; delete document.querySelector('.scan').dataset.done;
    i = 0; showTab('q'); renderQuestion(true); return;
  }
  if (i > 0) { i--; showTab('q'); renderQuestion(true); }
});
$('btn-print').addEventListener('click', () => print());

// ---------------- waitlist: the submission goes to the HARNAS mailbox ----------------
const form = $('wl-form');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = $('form-msg'); msg.textContent = '';
  const btn = form.querySelector('[type=submit]'); btn.disabled = true;
  try {
    const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(String(res.status));
    msg.textContent = tr('fSent', lang); form.email.value = ''; form.work.value = '';
  } catch { msg.textContent = tr('fFail', lang); }
  btn.disabled = false;
});

apply(lang); $('formula-text').textContent = UITLEG[lang]; render();
