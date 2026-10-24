import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QUESTIONS, FORMULA, BANDS, AUDIT_EERST, band, score, route, report, reportText, submissionText, complete, uren, urenUitTekst } from '../js/scan.js';

const p = (o) => ({ taak: 'mail', uren: '5-15', standaard: '6-8', ...o });

const CASES = [
  ['law firm, documents, 15-40h, usual 9-10', p({ taak: 'documenten', uren: '15-40', standaard: '9-10' }), 'klaar', 'audit'],
  ['installer, scheduling, 40+, usual 6-8', p({ taak: 'planning', uren: '40+', standaard: '6-8' }), 'klaar', 'audit'],
  ['webshop, questions, 5-15, usual 6-8', p({ taak: 'klantvragen' }), 'klaar', 'audit'],
  ['5-15 hours but usual 3-5', p({ standaard: '3-5' }), 'bekijken', 'audit'],
  ['one-person, under 5 hours', p({ uren: '<5', standaard: '9-10' }), 'teklein', 'zelf'],
  ['bespoke work, 15-40 but 0-2 usual', p({ uren: '15-40', standaard: '0-2' }), 'ordenen', 'zelf'],
  ['free text everywhere', p({ taak: 'anders', taakTekst: 'checking timesheets', uren: 'anders', urenTekst: 'about 20 hours', standaard: 'anders', standaardTekst: 'mostly' }), 'bekijken', 'audit'],
];
for (const [name, a, b, r] of CASES) test(name, () => {
  assert.equal(band(a).id, b);
  assert.equal(route(a), r);
  const s = score(a); assert.ok(s >= 0 && s <= 100);
});

test('weights sum to 1 and every option has points', () => {
  assert.ok(Math.abs(Object.values(FORMULA).reduce((s, { w }) => s + w, 0) - 1) < 1e-9);
  for (const [id, { p: pts }] of Object.entries(FORMULA)) {
    const opts = QUESTIONS.find((q) => q.id === id).a.map(([v]) => v).sort();
    assert.deepEqual(Object.keys(pts).sort(), opts, id);
  }
});

test('score within 0-100 for every combination', () => {
  for (const [u] of QUESTIONS[1].a) for (const [s] of QUESTIONS[2].a) {
    const v = score(p({ uren: u, urenTekst: 'x', standaard: s, standaardTekst: 'x' }));
    assert.ok(v >= 0 && v <= 100);
  }
});

test('incomplete or empty free text is refused', () => {
  assert.equal(complete({ taak: 'mail', uren: '5-15' }), false);
  assert.equal(complete(p({ taak: 'anders', taakTekst: '   ' })), false);
  assert.throws(() => score(p({ uren: 'veel' })));
});

test('hours read from free text, else the middle value', () => {
  assert.equal(urenUitTekst('about 20 hours'), 20);
  assert.equal(urenUitTekst('twee dagen'), null);
  assert.equal(uren(p({ uren: 'anders', urenTekst: 'twee dagen' })), 10);
  assert.equal(uren(p({ uren: 'anders', urenTekst: '12,5 uur' })), 12.5);
});

test('every task has an audit line and the report carries it', () => {
  for (const [v] of QUESTIONS[0].a) assert.ok(AUDIT_EERST[v].en && AUDIT_EERST[v].nl, v);
  const r = report(p());
  assert.equal(r.eerst, AUDIT_EERST.mail.en);
  assert.match(r.urenZin, /You said 10 hours a week/);
  assert.match(r.auditVraag, /about 10 hours a week/);
});

test('free text is flagged to verify and shows in the report', () => {
  const a = p({ taak: 'anders', taakTekst: 'Checking timesheets' });
  assert.equal(report(a).verifieer.length, 1);
  assert.match(reportText(a, 'en'), /Checking timesheets/);
  assert.match(submissionText(a, { email: 'x@y.z' }), /taak: anders \| Checking timesheets/);
});

test('verdicts never mention money, in both languages', () => {
  for (const b of BANDS) for (const l of ['en', 'nl']) assert.doesNotMatch(b.zin[l], /€|euro|money|geld|sav/i);
  assert.doesNotMatch(reportText(p(), 'en'), /€|save/i);
  assert.doesNotMatch(reportText(p(), 'nl'), /€|bespaar/i);
});

test('every text exists in EN and NL', () => {
  const all = [...QUESTIONS.flatMap(({ q, a }) => [q, ...a.map(([, l]) => l)]), ...Object.values(AUDIT_EERST), ...BANDS.flatMap((b) => [b.naam, b.zin])];
  for (const x of all) for (const l of ['en', 'nl']) assert.ok(typeof x[l] === 'string' && x[l].trim());
});
