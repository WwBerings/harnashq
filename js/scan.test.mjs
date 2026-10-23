import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QUESTIONS, FORMULA, STAPPEN, PRIVACY, BANDS, score, route, report, reportText, submissionText, complete, uren, urenUitTekst } from './scan.js';

const p = (o) => ({ taak: 'mail', uren: '5-15', standaard: '6-8', ...o });

const CASES = [
  ['law firm, documents, 15-40h, usual 9-10', p({ taak: 'documenten', uren: '15-40', standaard: '9-10' }), [80, 100], 'gesprek'],
  ['installer, scheduling, 40+, usual 6-8', p({ taak: 'planning', uren: '40+', standaard: '6-8' }), [80, 100], 'gesprek'],
  ['webshop, questions, 5-15, usual 6-8', p({ taak: 'klantvragen' }), [40, 79], 'zelf'],
  ['one-person, under 5 hours', p({ uren: '<5', standaard: '9-10' }), [0, 39], 'zelf'],
  ['bespoke work, 15-40 but 0-2 usual', p({ uren: '15-40', standaard: '0-2' }), [0, 39], 'zelf'],
  ['free text everywhere', p({ taak: 'anders', taakTekst: 'checking timesheets', uren: 'anders', urenTekst: 'about 20 hours', standaard: 'anders', standaardTekst: 'mostly' }), [40, 79], 'zelf'],
];
for (const [name, a, [lo, hi], r] of CASES) test(name, () => {
  const s = score(a);
  assert.ok(s >= lo && s <= hi, `score ${s} not in ${lo}-${hi}`);
  assert.equal(route(a), r);
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

test('every task has three steps and the report has them', () => {
  for (const [v] of QUESTIONS[0].a) assert.equal(STAPPEN[v].length, 3, v);
  assert.equal(report(p()).stappen.length, 3);
  assert.equal(report(p()).privacy.length, PRIVACY.length);
});

test('free text is flagged to verify and shows in the report', () => {
  const a = p({ taak: 'anders', taakTekst: 'Checking timesheets' });
  assert.equal(report(a).verifieer.length, 1);
  assert.match(reportText(a, 'en'), /Checking timesheets/);
  assert.match(submissionText(a, { email: 'x@y.z' }), /taak: anders \| Checking timesheets/);
});

test('verdicts never mention money, in both languages', () => {
  for (const b of BANDS) for (const l of ['en', 'nl']) assert.doesNotMatch(b.oordeel[l], /€|euro|money|geld|sav/i);
  assert.doesNotMatch(reportText(p(), 'en'), /€|save/i);
  assert.doesNotMatch(reportText(p(), 'nl'), /€|bespaar/i);
});

test('every text exists in EN and NL', () => {
  const all = [...QUESTIONS.flatMap(({ q, a }) => [q, ...a.map(([, l]) => l)]), ...Object.values(STAPPEN).flat(), ...PRIVACY];
  for (const x of all) for (const l of ['en', 'nl']) assert.ok(typeof x[l] === 'string' && x[l].trim());
});
