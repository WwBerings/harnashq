import { QUESTIONS, complete, report, reportText, submissionText } from './scan.js';
import { getLang, saveLang, apply, tr } from './i18n.js';
import { sequence } from './seq.js';

const $ = (id) => document.getElementById(id);
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
let lang = getLang();

// ---------------- the emblem ----------------
sequence($('emblem'), { still });

// ---------------- language ----------------
function setLang(l) { lang = l; saveLang(l); apply(l); render(); }
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

function finish() {
  i = QUESTIONS.length;
  tabs.r.disabled = false; showTab('r');
  render();
}

function render() {
  if (i >= 0 && i < QUESTIONS.length) renderQuestion(false);
  if (i === -1) { go.textContent = tr('start', lang); go.disabled = false; }
  if (i !== QUESTIONS.length || !complete(answers)) return;
  const r = report(answers, lang);
  $('verdict').textContent = r.bandNaam;
  $('verdict-line').textContent = r.oordeel;
  $('hours-line').textContent = r.urenZin;
  $('first-line').textContent = r.eerst;
  $('verify-wrap').hidden = r.verifieer.length === 0; fill('verify', r.verifieer);
  $('f-job').value = r.auditVraag;
  $('f-answers').value = submissionText(answers, { lang }) + '\n\n---- result ----\n' + reportText(answers, lang);
  back.disabled = false; back.textContent = tr('again', lang);
  go.disabled = false; go.textContent = tr('ctaAudit', lang);
}

function fill(id, items) { const el = $(id); el.innerHTML = ''; for (const t of items) { const li = document.createElement('li'); li.textContent = t; el.appendChild(li); } }

go.addEventListener('click', () => {
  if (i === -1) { i = 0; showTab('q'); renderQuestion(true); return; }
  if (i === QUESTIONS.length) { $('audit').scrollIntoView({ behavior: still ? 'auto' : 'smooth' }); setTimeout(() => $('audit-form').email.focus({ preventScroll: true }), still ? 0 : 700); return; }
  next();
});
back.addEventListener('click', () => {
  if (i === QUESTIONS.length) {
    for (const k in answers) delete answers[k];
    $('f-answers').value = ''; $('f-job').value = '';
    tabs.r.disabled = true;
    i = 0; showTab('q'); renderQuestion(true); return;
  }
  if (i > 0) { i--; showTab('q'); renderQuestion(true); }
});

// ---------------- audit form: goes to the HARNAS mailbox ----------------
const form = $('audit-form');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = $('form-msg'); delete msg.dataset.t;
  const btn = form.querySelector('[type=submit]'); btn.disabled = true;
  $('f-lang').value = lang;
  try {
    const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(String(res.status));
    msg.textContent = tr('fSent', lang); form.email.value = ''; form.job.value = '';
  } catch { msg.textContent = tr('fFail', lang); }
  btn.disabled = false;
});

apply(lang); render();
