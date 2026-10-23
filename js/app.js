import { QUESTIONS, complete, report, submissionText, UITLEG } from './scan.js';
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
  if (qd.multi) return Array.isArray(v) && v.length > 0;
  if (!v) return false;
  const opt = qd.a.find(([k]) => k === v)?.[2];
  if (opt?.open === 'text') return !!(answers[opt.field] || '').trim();
  return true;
};

function renderQuestion(focus) {
  const qd = QUESTIONS[i];
  const { id, q, a, multi } = qd;
  $('q-text').textContent = q[lang];
  $('q-hint').textContent = multi ? tr('pickAll', lang) : id === 'kosten' && answers.mensen !== 'een' ? tr('avgHint', lang) : '';
  const box = $('opts'); box.innerHTML = '';
  for (const [v, l, opt] of a) {
    const pressed = multi ? (answers[id] || []).includes(v) : answers[id] === v;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'opt'; b.textContent = l[lang];
    b.setAttribute('aria-pressed', String(pressed));
    b.addEventListener('click', () => {
      if (multi) {
        const set = new Set(answers[id] || []); set.has(v) ? set.delete(v) : set.add(v);
        answers[id] = [...set]; renderQuestion(false); return;
      }
      answers[id] = v;
      if (opt?.open) { renderQuestion(false); box.querySelector('input')?.focus(); return; }
      next();
    });
    if (opt?.open && answers[id] === v) {
      const wrap = document.createElement('div'); wrap.className = 'opt-free'; wrap.appendChild(b);
      const inp = document.createElement('input');
      inp.type = opt.open === 'number' ? 'number' : 'text'; inp.inputMode = opt.open === 'number' ? 'decimal' : 'text';
      inp.placeholder = tr(opt.open === 'number' ? 'numPh' : 'otherPh', lang); inp.value = answers[opt.field] || ''; inp.maxLength = 120;
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
  const call = r.route === 'gesprek';
  $('verdict').textContent = `${r.bandNaam}. ${r.oordeel}`;
  $('impact').hidden = false;
  $('hours-yr').textContent = r.urenPerJaar.toLocaleString(lang === 'nl' ? 'nl-NL' : 'en-GB');
  $('cost-yr').textContent = r.euro;
  fill('lifts', r.sterk); fill('holds', r.zwak);
  $('verify-wrap').hidden = r.verifieer.length === 0; fill('verify', r.verifieer);
  fill('rep-steps', r.stappen);
  $('rep-priv').hidden = r.privacy.length === 0; fill('rep-check', r.privacy);
  $('f-score').value = r.score; $('f-lang').value = lang;
  $('f-answers').value = submissionText(answers, { lang });
  back.disabled = false; back.textContent = tr('again', lang);
  go.disabled = false; go.textContent = tr(call ? 'book' : 'read', lang);
}

function fill(id, items) { const el = $(id); el.innerHTML = ''; for (const t of items) { const li = document.createElement('li'); li.textContent = t; el.appendChild(li); } }

go.addEventListener('click', () => {
  if (i === -1) { i = 0; showTab('q'); renderQuestion(true); return; }
  if (i === QUESTIONS.length) { $('report').scrollIntoView({ behavior: still ? 'auto' : 'smooth' }); $('rep-form').querySelector('input[type=email]').focus({ preventScroll: true }); return; }
  next();
});
back.addEventListener('click', () => {
  if (i === QUESTIONS.length) {
    for (const k in answers) delete answers[k];
    $('score-num').textContent = ''; $('gauge-arc').style.strokeDashoffset = '276.46'; $('verdict').textContent = ''; $('impact').hidden = true;
    $('report').hidden = true; tabs.r.disabled = true; delete document.querySelector('.scan').dataset.done;
    i = 0; showTab('q'); renderQuestion(true); return;
  }
  if (i > 0) { i--; showTab('q'); renderQuestion(true); }
});
$('btn-print').addEventListener('click', () => print());

// ---------------- form: the submission goes to the HARNAS mailbox ----------------
const form = $('rep-form');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = $('form-msg'); msg.textContent = '';
  const btn = form.querySelector('[type=submit]'); btn.disabled = true;
  if (form.action.includes('FORM_ID')) { // no form service yet: open a prefilled mail instead
    const body = `${form.email.value}\n${form.company.value}\n\n${$('f-answers').value}`;
    location.href = `mailto:info@harnashq.com?subject=${encodeURIComponent('AI scan ' + $('f-score').value)}&body=${encodeURIComponent(body)}`;
    btn.disabled = false; return;
  }
  try {
    const res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(String(res.status));
    msg.textContent = tr('fSent', lang); form.querySelector('input[type=email]').value = '';
  } catch { msg.textContent = tr('fFail', lang); }
  btn.disabled = false;
});

apply(lang); $('formula-text').textContent = UITLEG[lang]; render();
