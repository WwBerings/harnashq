import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QUESTIONS, FORMULA, STAPPEN, PRIVACY, BANDS, CRITERIA, UITLEG, UREN_BANDEN, PLAFOND, DREMPEL, AANNAME_UURPRIJS,
  score, route, report, inzet, complete, mailBody, reportText, submissionText, uren, uurprijs, band, drivers, teVerifieren } from './scan.js';

const base = { taak: 'mail', volume: '25-100', ritme: 'stabiel', duur: '5-15', mensen: 'een', kosten: '40-70',
  standaard: '6-8', regels: 'deels', invoer: ['digitaal'], vertrouwelijk: 'laag' };
const p = (o) => ({ ...base, ...o });

// Profielen waarvan we weten waar ze horen: band en route. De laatste twee zijn randgevallen.
const FIXTURES = {
  'advocatenkantoor 12 mensen, dagelijks stukken in dossiers': [p({ taak: 'documenten', volume: '100+', duur: '5-15', mensen: '2-3', kosten: '40-70', standaard: '6-8', regels: 'deels', invoer: ['digitaal'], vertrouwelijk: 'geheim' }), 'sterk', 'gesprek'],
  'webwinkel van één persoon, klantvragen': [p({ taak: 'klantvragen', volume: '25-100', duur: '<5', mensen: 'een', kosten: '40-70', standaard: '9-10', regels: 'checklist', invoer: ['digitaal', 'velden'], vertrouwelijk: 'persoonsgegevens' }), 'laag', 'zelf'],
  'accountantskantoor 30 mensen, inkoopfacturen met kwartaalpiek': [p({ taak: 'facturen', volume: '100+', ritme: 'piek', duur: '5-15', mensen: '4+', kosten: '40-70', standaard: '6-8', regels: 'checklist', invoer: ['digitaal', 'scans'], vertrouwelijk: 'persoonsgegevens' }), 'zeersterk', 'gesprek'],
  'installateur 6 mensen, eigenaar plant via telefoon en mail': [p({ taak: 'planning', volume: '25-100', duur: '15-60', mensen: 'een', kosten: '70-100', standaard: '6-8', regels: 'deels', invoer: ['papier', 'digitaal'], vertrouwelijk: 'laag' }), 'sterk', 'gesprek'],
  'bureau 15 mensen, maatwerk op papier': [p({ taak: 'rapportage', volume: '5-25', ritme: 'onregelmatig', duur: '60+', mensen: '4+', kosten: '70-100', standaard: '0-2', regels: 'ervaring', invoer: ['papier'], vertrouwelijk: 'persoonsgegevens' }), 'laag', 'zelf'],
  'rand: eigen omschrijving, eigen uurprijs': [p({ taak: 'anders', taakTekst: 'Keuringsrapporten controleren', volume: '5-25', duur: '15-60', mensen: '2-3', kosten: 'bedrag', kostenBedrag: '65', standaard: '6-8', regels: 'deels', invoer: ['digitaal'] }), 'deels', 'zelf'],
  'rand: seizoensklus, duur en uurprijs onbekend': [p({ taak: 'facturen', volume: '5-25', ritme: 'seizoen', duur: 'onbekend', mensen: '2-3', kosten: 'onbekend', standaard: 'onbekend', regels: 'deels', invoer: ['digitaal'] }), 'deels', 'zelf'],
};

for (const [naam, [a, b, r]] of Object.entries(FIXTURES)) {
  test(`fixture: ${naam}`, () => {
    const s = score(a);
    assert.equal(band(s).id, b, `score ${s}`);
    assert.equal(route(a), r, `score ${s}, ${inzet(a).euroPerJaar} euro`);
  });
}

test('vrije taak: algemeen advies, eigen tekst in het rapport, gemarkeerd om te checken', () => {
  const [a] = FIXTURES['rand: eigen omschrijving, eigen uurprijs'];
  const r = report(a, 'nl');
  assert.equal(r.taak, 'Keuringsrapporten controleren');
  assert.deepEqual(r.stappen, STAPPEN.anders.map((x) => x.nl));
  assert.equal(r.uurprijs, 65); assert.equal(r.eigenPrijs, true);
  assert.ok(r.verifieer.some((x) => x.includes('omschrijving')));
  assert.ok(submissionText(a).includes('taakTekst: Keuringsrapporten controleren'));
});

test('vrije taak zonder tekst valt terug op het label en crasht niet', () => {
  assert.equal(report(p({ taak: 'anders' }), 'en').taak, 'Something else, namely...');
});

test('weet-ik-niet: nooit crashen, voorzichtig rekenen, altijd te checken', () => {
  const [a] = FIXTURES['rand: seizoensklus, duur en uurprijs onbekend'];
  const r = report(a, 'en');
  assert.equal(r.uurprijs, AANNAME_UURPRIJS); assert.equal(r.eigenPrijs, false);
  assert.ok(r.verifieer.length >= 4, r.verifieer.join(' | '));
  assert.ok(reportText(a, 'en').includes('an assumed'));
  // onbekende duur zet de uren-knock-out niet aan
  assert.ok(uren(a) < 5 && score(a) > PLAFOND);
});

test('ongeldig eigen bedrag telt als onbekend', () => {
  for (const v of ['', 'veel', '-5', '0', '100000', undefined]) {
    const a = p({ kosten: 'bedrag', kostenBedrag: v });
    assert.deepEqual(uurprijs(a), { prijs: AANNAME_UURPRIJS, eigen: false }, String(v));
    assert.doesNotThrow(() => reportText(a, 'nl'));
  }
});

test('invoer: meerdere kanalen tellen als gemiddelde, losse string wordt geaccepteerd', () => {
  const mix = score(p({ invoer: ['velden', 'papier'] }));
  assert.ok(mix < score(p({ invoer: ['velden'] })) && mix > score(p({ invoer: ['papier'] })));
  assert.equal(score(p({ invoer: 'digitaal' })), score(p({ invoer: ['digitaal'] })));
  assert.equal(complete(p({ invoer: [] })), false);
  assert.equal(complete(p({ invoer: ['digitaal', 'fax'] })), false);
});

test('gewichten tellen op tot 1, elk een heel procent', () => {
  const som = Object.values(FORMULA).reduce((s, { w }) => s + w, 0);
  assert.ok(Math.abs(som - 1) < 1e-9);
  for (const { w } of Object.values(FORMULA)) assert.ok(Math.abs(w * 100 - Math.round(w * 100)) < 1e-9);
});

test('elke formule-sleutel dekt de antwoorden (onbekend en open opties uitgezonderd)', () => {
  const banden = { uren: UREN_BANDEN.map(([v]) => v), kosten: ['<40', '40-70', '70-100', '100+'] };
  for (const [id, { p: punten }] of Object.entries(FORMULA)) {
    const opties = banden[id] ?? QUESTIONS.find((x) => x.id === id).a.map(([v]) => v).filter((v) => v !== 'onbekend');
    assert.deepEqual(Object.keys(punten).sort(), [...opties].sort(), id);
  }
});

test('maximaal 10 vragen, geen sectorvraag, elke open optie heeft een veld', () => {
  assert.ok(QUESTIONS.length <= 10);
  assert.ok(!QUESTIONS.some((q) => q.id === 'sector'));
  for (const q of QUESTIONS) for (const [, , extra] of q.a) if (extra) assert.ok(['text', 'number'].includes(extra.open) && extra.field);
});

// Every single-choice combination of the questions that feed the numbers, invoer one channel at a time.
const NUM = ['volume', 'duur', 'mensen', 'kosten', 'standaard', 'regels', 'invoer'];
function walk(fn, i = 0, a = {}) {
  if (i === NUM.length) return fn(p(a));
  const q = QUESTIONS.find((x) => x.id === NUM[i]);
  for (const [v] of q.a) {
    const extra = v === 'bedrag' ? { kostenBedrag: 80 } : {};
    walk(fn, i + 1, { ...a, ...extra, [NUM[i]]: q.multi ? [v] : v });
  }
}

test('elke combinatie: score 0-100, deel als oplopende range onder 100%, plafond bij knock-out, route volgt de drempel', () => {
  walk((a) => {
    const s = score(a); const z = inzet(a);
    assert.ok(s >= 0 && s <= 100, JSON.stringify(a));
    assert.ok(z.deel[0] <= z.deel[1] && z.deel[1] < 100 && z.deel[0] >= 0, JSON.stringify(a));
    assert.ok(z.urenDeel[1] <= z.urenPerJaar);
    if (a.standaard === '0-2') assert.ok(s <= PLAFOND);
    if (a.volume !== 'onbekend' && a.duur !== 'onbekend' && uren(a) < 5) assert.ok(s <= PLAFOND);
    if (route(a) === 'gesprek') assert.ok(s >= DREMPEL.score && z.euroPerJaar >= DREMPEL.euro);
  });
});

function oplopend(id, volgorde) {
  walk((a) => {
    for (let i = 1; i < volgorde.length; i++) {
      const v = (x) => (id === 'invoer' ? [x] : x);
      assert.ok(score({ ...a, [id]: v(volgorde[i]) }) >= score({ ...a, [id]: v(volgorde[i - 1]) }), `${id} ${JSON.stringify(a)}`);
    }
  });
}
test('vaker, langer, standaarder, meer regels, beter leesbaar of duurder geeft nooit een lagere score', () => {
  oplopend('volume', ['<5', '5-25', '25-100', '100+']);
  oplopend('duur', ['<5', '5-15', '15-60', '60+']);
  oplopend('standaard', ['0-2', '3-5', '6-8', '9-10']);
  oplopend('regels', ['ervaring', 'deels', 'checklist']);
  oplopend('invoer', ['papier', 'scans', 'digitaal', 'velden']);
  oplopend('kosten', ['<40', '40-70', '70-100', '100+']);
});

test('één persoon kan niet meer dan 40 uur per week aan één klus kwijt zijn', () => {
  assert.equal(uren(p({ mensen: 'een', volume: '100+', duur: '60+' })), 40);
  assert.ok(uren(p({ mensen: '4+', volume: '100+', duur: '60+' })) > 40);
});

test('hoge score maar weinig inzet gaat naar zelf', () => {
  const a = p({ invoer: ['velden'], kosten: '<40' });
  assert.ok(score(a) >= DREMPEL.score);
  assert.ok(inzet(a).euroPerJaar < DREMPEL.euro);
  assert.equal(route(a), 'zelf');
});

test('onvolledige of onbekende antwoorden worden geweigerd', () => {
  const { vertrouwelijk, ...rest } = base;
  assert.equal(complete(rest), false);
  assert.throws(() => score(rest));
  assert.throws(() => score(p({ volume: 'veel' })));
});

test('banden dekken 0-100 zonder gat, en geen oordeel belooft geld', () => {
  for (let s = 0; s <= 100; s++) assert.ok(band(s), String(s));
  for (const b of BANDS) for (const l of ['en', 'nl']) assert.ok(!/€|sav|bespa|euro|wint|win /i.test(b.oordeel[l]), b.oordeel[l]);
});

test('het rapport noemt nergens een besparing', () => {
  for (const [a] of Object.values(FIXTURES)) for (const l of ['en', 'nl']) {
    assert.ok(!/sav(e|ing)|bespa(ar|ring)/i.test(reportText(a, l)), l);
  }
});

test('drivers: twee sterke en twee zwakke, nooit dezelfde', () => {
  for (const [a] of Object.values(FIXTURES)) {
    const d = drivers(a, 'en');
    assert.equal(d.sterk.length, 2); assert.equal(d.zwak.length, 2);
    assert.equal(new Set([...d.sterk, ...d.zwak]).size, 4);
  }
});

test('te checken: leeg bij een volledig bekend, stabiel eenmansprofiel', () => {
  assert.deepEqual(teVerifieren(base, 'en'), []);
});

test('privacychecklist alleen bij gevoelige data', () => {
  assert.equal(report(p({ vertrouwelijk: 'laag' })).privacy.length, 0);
  assert.ok(report(p({ vertrouwelijk: 'geheim' })).privacy.length > 0);
});

test('elke taak heeft drie stappen', () => {
  for (const [v] of QUESTIONS.find((q) => q.id === 'taak').a) assert.equal(report(p({ taak: v })).stappen.length, 3, v);
});

test('rapporttekst: score, uren, euro, stappen, alle antwoorden, past op één pagina', () => {
  for (const [a] of Object.values(FIXTURES)) for (const l of ['en', 'nl']) {
    const body = reportText(a, l); const r = report(a, l);
    for (const x of [`${r.score} / 100`, r.euro, ...r.stappen, ...r.verifieer]) assert.ok(body.includes(x), x);
    assert.ok(body.includes(l === 'nl' ? 'indicatie' : 'indication'));
    assert.ok(body.split('\n').length <= 50, `${body.split('\n').length} regels`);
  }
});

test('inzending bevat e-mail, ruwe antwoorden en het resultaat', () => {
  const [a] = FIXTURES['installateur 6 mensen, eigenaar plant via telefoon en mail'];
  const s = submissionText(a, { email: '  jan@example.nl ', lang: 'nl' });
  assert.match(s, /^email: jan@example\.nl$/m);
  assert.match(s, /^invoer: papier,digitaal$/m);
  assert.match(s, new RegExp(`^score: ${score(a)} `, 'm'));
  assert.equal(mailBody(a, 'nl'), submissionText(a, { lang: 'nl' }));
});

test('geen gedachtestreepjes in de teksten', () => {
  for (const [a] of Object.values(FIXTURES)) for (const l of ['en', 'nl']) assert.ok(!/[\u2013\u2014]/.test(reportText(a, l)));
  for (const l of ['en', 'nl']) assert.ok(!/[\u2013\u2014]/.test(UITLEG[l]));
});

test('elke scantekst bestaat in EN en NL en is niet leeg', () => {
  const all = [...QUESTIONS.flatMap(({ q, a }) => [q, ...a.map(([, l]) => l)]), ...Object.values(STAPPEN).flat(), ...PRIVACY,
    ...BANDS.flatMap((b) => [b.naam, b.oordeel]), ...Object.values(CRITERIA), UITLEG];
  for (const x of all) for (const l of ['en', 'nl']) assert.ok(typeof x[l] === 'string' && x[l].trim(), JSON.stringify(x));
});

test('rapport komt in de gevraagde taal', () => {
  assert.notEqual(report(base, 'en').stappen[0], report(base, 'nl').stappen[0]);
  assert.notEqual(reportText(base, 'en'), reportText(base, 'nl'));
});
