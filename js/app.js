import { QUESTIONS, report, mailBody } from './scan.js';
import { getLang, saveLang, apply, tr } from './i18n.js';

const $ = (id) => document.getElementById(id);
const MAIL = 'hallo@harnashq.com';
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
let lang = getLang();

// ---------------- taal ----------------
function setLang(l) { lang = l; saveLang(l); apply(l); render(); }
document.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));

// ---------------- binnenkomst ----------------
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' });
document.querySelectorAll('[data-reveal], .flow, .vault, .track li').forEach((el) => io.observe(el));

// Werkwijze: de balk vult mee met het scrollen.
const fill = $('fill'), how = $('how');
function onScroll() {
  const r = how.getBoundingClientRect();
  const k = Math.min(1, Math.max(0, (innerHeight * 0.8 - r.top) / (r.height + innerHeight * 0.3)));
  fill.style.transform = `scaleX(${k})`;
}
addEventListener('scroll', onScroll, { passive: true }); onScroll();

// ---------------- 3D ----------------
let lvl = null;
// De stills staan er meteen; 3D start pas na de eerste paint, het scanharnas pas als je in de buurt bent.
if (!still) {
  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 300));
  idle(() => import('./hero3d.js').then((m) => m.hero($('hero-gl'))).then((ok) => ok && document.body.classList.add('gl-hero')).catch(() => {}), { timeout: 1200 });
  const near = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    near.disconnect();
    import('./level.js').then((m) => m.level($('level-gl'))).then((l) => {
      if (!l) return;
      lvl = l; document.body.classList.add('gl-level');
      if (last) lvl.set(last.score, true);
    }).catch(() => {});
  }, { rootMargin: '800px 0px' });
  near.observe($('scan'));
}

// ---------------- scan ----------------
const answers = {};
let i = -1;                // -1 = not started, QUESTIONS.length = done
let last = null;           // last report
const back = $('btn-back'), go = $('btn-go');
const tabs = { q: $('tab-q'), r: $('tab-r'), f: $('tab-f') };
const panes = { q: $('pane-q'), r: $('pane-r'), f: $('pane-f') };

function showTab(k) { for (const n in tabs) { tabs[n].setAttribute('aria-selected', String(n === k)); panes[n].hidden = n !== k; } }
for (const [k, b] of Object.entries(tabs)) b.addEventListener('click', () => !b.disabled && showTab(k));

function renderQuestion(focus) {
  const { id, q, a } = QUESTIONS[i];
  $('q-text').textContent = q[lang];
  const box = $('opts'); box.innerHTML = '';
  for (const [v, l] of a) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'opt'; b.textContent = l[lang];
    b.setAttribute('aria-pressed', String(answers[id] === v));
    b.addEventListener('click', () => { answers[id] = v; next(); });
    box.appendChild(b);
  }
  const n = QUESTIONS.length - i - 1;
  $('rest').textContent = n === 0 ? tr('last', lang) : tr('left', lang, { n });
  back.disabled = i === 0; back.dataset.t = 'back'; back.textContent = tr('back', lang);
  go.disabled = !answers[id]; go.textContent = tr(answers[id] ? 'next' : 'pick', lang);
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
  last = report(answers, lang);
  const tierN = last.score >= 80 ? 3 : last.score >= 50 ? 2 : 1;
  document.querySelector('.scan').dataset.tier = tierN;
  countUp($('score-num'), last.score);
  lvl?.set(last.score);
  if (!lvl) document.querySelector('.level-still').src = `img/level-${tierN}.webp`;
  tabs.r.disabled = false; showTab('r');
  $('report').hidden = false;
  render();
}

function render() {
  if (i >= 0 && i < QUESTIONS.length) renderQuestion(false);
  if (i === -1) { go.textContent = tr('start', lang); go.disabled = false; }
  if (i !== QUESTIONS.length) return;
  last = report(answers, lang);
  const call = last.route === 'gesprek';
  const tierKey = last.score >= 80 ? 't3' : last.score >= 50 ? 't2' : 't1';
  $('res-h').textContent = `${last.score} / 100 · ${tr(tierKey, lang)}`;
  $('res-p').textContent = tr(call ? 'resCall' : 'resSelf', lang, { h: last.perWeek });
  $('rep-lead').textContent = tr(call ? 'repCall' : 'repSelf', lang, { s: last.score });
  $('rep-hours').textContent = last.perWeek;
  fill_('rep-steps', last.stappen);
  $('rep-priv').hidden = last.privacy.length === 0;
  fill_('rep-check', last.privacy);
  const href = `mailto:${MAIL}?subject=${encodeURIComponent(tr('subject', lang, { s: last.score }))}&body=${encodeURIComponent(mailBody(answers, lang))}`;
  const mail = $('btn-mail'); mail.href = href; mail.textContent = tr(call ? 'book' : 'mailAnyway', lang);
  back.disabled = false; back.textContent = tr('again', lang);
  go.disabled = false; go.textContent = tr(call ? 'book' : 'read', lang);
  go.dataset.href = call ? href : '#report';
}

function fill_(id, items) { const el = $(id); el.innerHTML = ''; for (const t of items) { const li = document.createElement('li'); li.textContent = t; el.appendChild(li); } }

go.addEventListener('click', () => {
  if (i === -1) { i = 0; showTab('q'); renderQuestion(true); return; }
  if (i === QUESTIONS.length) {
    const h = go.dataset.href;
    if (h.startsWith('#')) $('report').scrollIntoView({ behavior: still ? 'auto' : 'smooth' }); else location.href = h;
    return;
  }
  next();
});
back.addEventListener('click', () => {
  if (i === QUESTIONS.length) {
    for (const k in answers) delete answers[k];
    lvl?.reset(); $('score-num').textContent = ''; delete document.querySelector('.scan').dataset.tier;
    $('report').hidden = true; tabs.r.disabled = true;
    i = 0; showTab('q'); renderQuestion(true); return;
  }
  if (i > 0) { i--; showTab('q'); renderQuestion(true); }
});
$('btn-print').addEventListener('click', () => print());

apply(lang); render();
