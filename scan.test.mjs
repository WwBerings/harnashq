import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QUESTIONS, FORMULA, score, route, report, besparing, complete, mailBody } from './scan.js';

const base = { sector: 'anders', mensen: '2-9', taak: 'mail', uren: '5-15', frequentie: 'wekelijks',
  voorspelbaar: 'uitzonderingen', systemen: 'm365', ai: 'nee', vertrouwelijk: 'laag', tempo: 'jaar' };
const p = (o) => ({ ...base, ...o });

// Profielen waarvan we weten waar ze heen moeten.
const GESPREK = {
  'advocatenkantoor 12 mensen, dossiers dagelijks': p({ sector: 'juridisch', mensen: '10-49', taak: 'documenten', uren: '15-40', frequentie: 'dagelijks', voorspelbaar: 'vast', vertrouwelijk: 'geheim' }),
  'accountantskantoor 30 mensen, facturen': p({ sector: 'financieel', mensen: '10-49', taak: 'facturen', uren: '40+', frequentie: 'dagelijks', voorspelbaar: 'uitzonderingen', vertrouwelijk: 'persoonsgegevens', tempo: 'kwartaal' }),
  'installateur 6 mensen, 20 uur planning': p({ sector: 'techniek', mensen: '2-9', taak: 'planning', uren: '15-40', frequentie: 'dagelijks', voorspelbaar: 'vast', systemen: 'google' }),
  'groothandel 60 mensen, klantvragen': p({ sector: 'handel', mensen: '50+', taak: 'klantvragen', uren: '40+', frequentie: 'dagelijks', voorspelbaar: 'uitzonderingen', systemen: 'branche', ai: 'los' }),
};
const ZELF = {
  'eenmanszaak, 3 uur mail': p({ mensen: '1', uren: '<5' }),
  'praktijk 4 mensen, 10 uur, wekelijks': p({ sector: 'zorg', mensen: '2-9', uren: '5-15', vertrouwelijk: 'geheim' }),
  'kantoor 15 mensen maar maatwerk op papier, maandelijks': p({ mensen: '10-49', uren: '<5', frequentie: 'maandelijks', voorspelbaar: 'maatwerk', systemen: 'papier', tempo: 'orienterend' }),
  'webwinkel 3 mensen, 8 uur rapportage': p({ sector: 'handel', mensen: '2-9', taak: 'rapportage', uren: '5-15', frequentie: 'maandelijks' }),
};

for (const [naam, a] of Object.entries(GESPREK)) test(`gesprek: ${naam}`, () => assert.equal(route(a), 'gesprek', `score ${score(a)}`));
for (const [naam, a] of Object.entries(ZELF)) test(`zelf: ${naam}`, () => assert.equal(route(a), 'zelf', `score ${score(a)}`));

test('gewichten tellen op tot 1', () => {
  const som = Object.values(FORMULA).reduce((s, { w }) => s + w, 0);
  assert.ok(Math.abs(som - 1) < 1e-9);
});

test('elke formule-sleutel bestaat als antwoord', () => {
  for (const [id, { p: punten }] of Object.entries(FORMULA)) {
    const opties = QUESTIONS.find((q) => q.id === id).a.map(([v]) => v).sort();
    assert.deepEqual(Object.keys(punten).sort(), opties, id);
  }
});

test('score ligt tussen 0 en 100 voor elke combinatie van formulevragen', () => {
  const ids = Object.keys(FORMULA);
  const walk = (i, a) => {
    if (i === ids.length) { const s = score(p(a)); assert.ok(s >= 0 && s <= 100); return; }
    for (const v of Object.keys(FORMULA[ids[i]].p)) walk(i + 1, { ...a, [ids[i]]: v });
  };
  walk(0, {});
});

test('meer uren geeft nooit een lagere score', () => {
  const volgorde = ['<5', '5-15', '15-40', '40+'];
  for (let i = 1; i < volgorde.length; i++) assert.ok(score(p({ uren: volgorde[i] })) >= score(p({ uren: volgorde[i - 1] })));
});

test('onvolledige antwoorden worden geweigerd', () => {
  const { tempo, ...rest } = base;
  assert.equal(complete(rest), false);
  assert.throws(() => score(rest));
  assert.throws(() => score(p({ uren: 'veel' })));
});

test('besparing is nooit meer dan de uren zelf', () => {
  const r = besparing(p({ uren: '40+', voorspelbaar: 'vast' }));
  assert.ok(r.perWeek <= 50 && r.perWeek > 0);
  assert.equal(r.perJaar, r.perWeek * 46);
});

test('privacychecklist alleen bij gevoelige data', () => {
  assert.equal(report(p({ vertrouwelijk: 'laag' })).privacy.length, 0);
  assert.ok(report(p({ vertrouwelijk: 'geheim' })).privacy.length > 0);
  assert.ok(report(p({ vertrouwelijk: 'persoonsgegevens' })).privacy.length > 0);
});

test('elke taak heeft drie stappen', () => {
  for (const [v] of QUESTIONS.find((q) => q.id === 'taak').a) assert.equal(report(p({ taak: v })).stappen.length, 3, v);
});

test('mailtekst bevat score en alle antwoorden', () => {
  const body = mailBody(base);
  assert.match(body, /Kansscore: \d+ van 100/);
  assert.equal(body.split('\n').length, 3 + QUESTIONS.length);
});
