# AI scan: redesign

Status: proposal v2, 2026-10-23. This version takes in the founder's feedback: open options and edge cases, one money question, no promises of savings, and the report sent by hand. Nothing live is changed. The code in section 5 runs: its 31 tests pass under Node 24. I checked that on a scratch copy, not in `js/`.

## The idea in one paragraph

A consultant assesses a **process**, not a company. So the scan fixes on one job in question 1 and then asks what an automation assessor checks about that job: how often, in what rhythm, how long it takes, how many people, what an hour costs, how standard it is, how rule-based, how the work comes in, and how sensitive the data is. Hours are computed, not asked: times x minutes. People guess weekly totals badly but know counts and durations, which is the same "how often, how long, who" set as in the intake. The output never promises a saving. It shows what goes into the job now, at the visitor's own rate, and which share of it fits automation, as a range.

## What changed from v1

| Founder point | Change |
|---|---|
| Q1 needs an open option | "Something else, namely..." with a free-text field. The formula never scores the task, so a free-text task scores like any other. The visitor gets generic first steps and the item is marked "to verify in the call". |
| Questions too narrow, edge cases | **Bursts:** Q2 asks for the average over the year, and the new Q3 asks whether it is steady, has month-end peaks, is seasonal or has no pattern. **Split across people / one-person business:** the new Q5 asks how many people spend time on it, and the role question is gone. **Doesn't know:** "I don't know" on volume, duration, hourly cost and the usual-way share. **Several channels:** Q9 is multi-select. |
| No money question | The new Q6 asks what an hour of that person costs: four bands, a free amount, or "I don't know". It replaces the assumed role rates and the role question. |
| No promises | `besparing` becomes `inzet` (what goes in now). The automatable share is a range. The verdicts describe fit, never money. A test fails if the report says "save" or "besparing". |
| Report by hand | The send logic is gone. `reportText()` renders the one-page report for the founder to paste. `submissionText()` holds the raw answers plus the email address. `mailBody()` now returns the submission. |
| Dropped | The "how many programs" question. In v1 it could move the score by at most 1.5 points (weight 0.05, points 70 to 100), so it did not earn a slot once the 10-question budget was needed for rhythm, headcount and cost. It goes to the call. |

## 1. The questions (10)

"(?)" marks an option with "I don't know / Weet ik niet". "Open" marks a free-entry option.

| # | id | EN | NL | Options (EN / NL) | Why a consultant asks it |
|---|----|----|----|----|----|
| 1 | taak | If one job could run by itself from Monday, which one would it be? | Als één klus vanaf maandag vanzelf kon gaan, welke zou dat zijn? | Sorting and answering the inbox / De inbox sorteren en beantwoorden; Filing and checking documents or case files / Documenten of dossiers ordenen en controleren; Processing invoices, quotes or orders / Facturen, offertes of orders verwerken; Copying data from one program into another / Gegevens overtypen van het ene programma naar het andere; Scheduling jobs, people or appointments / Klussen, mensen of afspraken inplannen; Answering customer questions / Klantvragen beantwoorden; Putting together reports and overviews / Rapportages en overzichten maken; **Open:** Something else, namely... / Iets anders, namelijk... | You assess one process, not a company. The owner picks the job that hurts. |
| 2 | volume | How many times does it happen in an average week, spread over the year? | Hoe vaak gebeurt het in een gemiddelde week, uitgesmeerd over het jaar? | Fewer than 5 / Minder dan 5 keer; 5 to 25 / 5 tot 25 keer; 25 to 100 / 25 tot 100 keer; More than 100 / Meer dan 100 keer; (?) | Volume decides whether a build pays back and whether there is history to test on. "Spread over the year" makes month-end and seasonal work answerable. |
| 3 | ritme | Is it steady, or does it come in peaks? | Is het gelijkmatig, of komt het in pieken? | About the same every week / Elke week ongeveer even veel; Peaks at month-end or quarter-end / Pieken aan het eind van de maand of het kwartaal; Busy in some months, quiet in others / Druk in sommige maanden, rustig in andere; No pattern, it comes when it comes / Geen patroon, het komt wanneer het komt | An average hides the peak, and the peak is where overtime and errors sit. It does not change the score; it goes on the "to verify" list. |
| 4 | duur | And how long does one take, start to finish? | En hoe lang duurt één keer, van begin tot eind? | Under 5 minutes / Minder dan 5 minuten; 5 to 15 minutes / 5 tot 15 minuten; 15 minutes to an hour / Een kwartier tot een uur; More than an hour / Meer dan een uur; (?) | Times x minutes gives the hours, more reliably than asking for hours. |
| 5 | mensen | How many people spend time on it? | Hoeveel mensen zijn er tijd aan kwijt? | One (that may be me) / Eén (dat kan ik zelf zijn); Two or three / Twee of drie; Four or more / Vier of meer | Covers the one-person business and a job split across people. It caps the hours (one person can't spend 60 hours a week on one job), and with several people the hand-offs go on the "to verify" list. |
| 6 | kosten | Roughly what does an hour of that person cost your business? | Wat kost een uur van die persoon jullie bedrijf, ongeveer? | Under €40 / Minder dan €40; €40 to €70 / €40 tot €70; €70 to €100 / €70 tot €100; Over €100 / Meer dan €100; **Open:** Another amount: €... / Een ander bedrag: €...; (?) | The money input. Their own rate makes the euro figure theirs, not ours. With several people: "on average" (UI hint). |
| 7 | standaard | Out of ten times, how many go exactly the usual way? | Van de tien keer, hoe vaak gaat het precies zoals altijd? | 9 or 10 / 9 of 10 keer; 6 to 8 / 6 tot 8 keer; 3 to 5 / 3 tot 5 keer; 2 or fewer / 2 keer of minder; (?) | Standardisation and exception rate in one question. The exceptions are where projects die. |
| 8 | regels | Could a new colleague do it from a one-page checklist? | Kan een nieuwe collega het doen met een checklist van één A4? | Yes, after a day / Ja, na een dag; Mostly, but they would ask now and then / Grotendeels, maar ze zouden af en toe iets vragen; No, it takes years of experience / Nee, daar is jaren ervaring voor nodig | Rule-based versus judgement, asked so an owner can answer it honestly. No "I don't know": every owner knows whether a newcomer could do it. |
| 9 | invoer | How does the work come in? Pick all that apply. | Hoe komt het werk binnen? Kies alles wat klopt. | Through a form or a system, in fixed fields / Via een formulier of systeem, in vaste velden; By email, PDF or Word / Per mail, pdf of Word; Scans, photos or handwriting / Scans, foto's of handschrift; On paper or by phone / Op papier of telefonisch | Digital versus paper input. Multi-select, because most work arrives through several channels. Email and PDF score close to fixed fields, because reading free text is what AI added over classic RPA. |
| 10 | vertrouwelijk | If this data leaked, what would that mean? | Als deze gegevens uitlekken, wat betekent dat dan? | A breach of professional secrecy or medical data / Schending van beroepsgeheim of medische gegevens; Personal data of clients is out / Persoonsgegevens van klanten liggen op straat; Annoying, not serious / Vervelend, niet ernstig | Not scored. It decides the privacy checklist and how an agent must be built. |

**Criteria: asked or inferred**

| Criterion | How it is covered |
|---|---|
| Frequency / volume | Q2, with the rhythm from Q3 |
| Standardisation and exception rate | Q7 |
| Rule-based vs judgement | Q8 |
| Digital vs paper input | Q9 (average over the chosen channels) |
| Hours per week | Inferred: Q2 x Q4, capped by Q5 at 40 / 120 / 200 hours |
| Hourly cost | Asked: Q6 |
| Number of systems | To the call (see "What changed") |
| Sector, team size, AI use, timing | Dropped. Sector doesn't change the advice once task, cost and sensitivity are known. The rest are sales questions, not opportunity questions. |

### Edge cases and "I don't know"

| Situation | How the formula handles it | In the report |
|---|---|---|
| Task is free text | Not scored, so the score works as normal. Generic first steps (`STAPPEN.anders`). The text is trimmed to 80 characters; empty text falls back to the label. | Shown as their own words; "to verify" line |
| Volume unknown | Counted as 5 to 25 (15 a week) | "to verify", with the value used |
| Duration unknown | Counted as 5 to 15 minutes (10) | "to verify", with the value used |
| Volume or duration unknown | The under-5-hours knock-out does **not** fire, because a guess must not cap the score | (as above) |
| Usual-way share unknown | Points as 3 to 5 (35); share range widened to 25% to 70% | "to verify: the range is wide" |
| Hourly cost unknown, or a free amount that is empty, not a number or outside €10 to €500 | €55 assumed; points as €40 to €70 | Labelled "an assumed €55"; "to verify" |
| Peaks, seasonal, no pattern | Not scored; the volume is already the year average | Line per pattern (peak size; a year of history to test on) |
| Several people | Hours cap rises (120 / 200); not scored | "Hand-offs between them often take more time than the work" |
| One-person business | Q5 "One (that may be me)"; cap 40 hours; Q6 asks for their own hour | none |
| Several input channels | Points and share factor are the average over the chosen channels | Listed in the answers |
| Unanswered or invalid option | `complete()` is false and `score()` throws. The UI never lets this happen; it is a programming error, not a visitor state. | none |

## 2. The formula

### Opportunity score, 0 to 100

Weighted average of six criteria. The weights sum to 1: fit for automation 0.60, weight in the business 0.40.

| Criterion | Weight | Points per answer |
|---|---|---|
| volume (Q2) | 0.15 | fewer than 5: 10 · 5-25: 45 · 25-100: 80 · 100+: 100 |
| standaard (Q7) | 0.20 | 9-10: 100 · 6-8: 70 · 3-5: 35 · 0-2: 10 |
| regels (Q8) | 0.15 | checklist: 100 · mostly: 60 · experience: 15 |
| invoer (Q9, average) | 0.10 | fields: 100 · email/PDF/Word: 85 · scans: 45 · paper or phone: 10 |
| uren (Q2 x Q4) | 0.25 | under 5 h: 10 · 5-10: 40 · 10-20: 65 · 20-40: 85 · 40+: 100 |
| kosten (Q6) | 0.15 | under €40: 40 · €40-70: 65 · €70-100: 85 · over €100: 100 (a free amount falls in its band) |

**Knock-out:** the score is capped at 39 (the top of "Low") when the job takes under 5 hours a week, with both counts known, or when it goes the usual way 2 in 10 times or fewer.

### What goes in now (`inzet`): an indication, not a saving

- **Hours now per week** = midpoint times x midpoint minutes / 60. The midpoints are: times 3, 15, 50, 150; minutes 3, 10, 30, 90. Capped by Q5 at 40 (one person), 120 (two or three) or 200 (four or more).
- **Hours per year** = hours per week x 46 working weeks, rounded to 10.
- **Euros per year** = hours per year x the visitor's own hourly cost, rounded to €100. The cost is the free amount if given, otherwise the band midpoint: €35, €55, €85, €120. On "I don't know" it is an assumed €55, always labelled as such.
- **Share that fits automation**, as a range = usual-way share x rule share x input factor, using a low and a high for each:
  - Usual way: 9-10: 70-90% · 6-8: 50-70% · 3-5: 25-45% · 0-2: 5-15% · don't know: 25-70%
  - Rules: checklist 80-95% · mostly 55-80% · experience 25-50%
  - Input factor (average over channels): fields 1 · email/PDF 1 · scans 0.8 · paper or phone 0.4
  - Rounded to 5%. The top is always under 100%, because a person checks.
- The share is shown in **hours** (for example "350 to 630 hours a year that fit automation"), never in euros, and always with "Not a promise: the call and a test on your own history settle it."

### Routing

**Offer a call** when score >= 60 **and** at least €20,000 a year goes into the job now. Otherwise the visitor gets the **self-serve report**.
Why €20,000: with the plan's fixed price set from their value, a job with less going into it doesn't carry a build that is tested on their own history. It's the same bar as v1 (€10,000 saved at a typical share of about 45%), now expressed in what goes in rather than a promised saving. This is an assumption, to tune after the first ten scans.

### On the page, three sentences (`UITLEG`, replaces `formula` in `i18n.js`)

> Six of your answers score 0 to 100 and your score is their weighted average: 60% is how well the work fits automation (how often, how standard, how rule-based, how it comes in) and 40% is its weight in your business (hours a week and what an hour costs you). Under 5 hours a week, or when 2 in 10 times or fewer go the usual way, the score stops at 39; an "I don't know" counts as a cautious middle value and is marked to verify. The hours and euros are what goes into this job now, from your own numbers, and with a score of 60 or more and €20,000 a year or more going in, we offer a call.

## 3. Result screen and report

### Result screen

1. **Score** out of 100 with the band name.
2. **One-line verdict.** It describes fit and never mentions money; a test enforces that.

| Band | EN | NL |
|---|---|---|
| 80-100 Very strong | On every point we asked about, this job fits automation well. | Op elk punt dat we vroegen past deze klus goed bij automatisering. |
| 60-79 Strong | A good fit for an agent, with a person checking the exceptions. | Past goed bij een agent, met een mens die de uitzonderingen controleert. |
| 40-59 Partly | Part of it fits. The usual cases are the place to start. | Een deel past. De standaardgevallen zijn de plek om te beginnen. |
| 0-39 Low | Too small or too irregular to build for now. The steps below are a better start than software. | Te klein of te onregelmatig om nu voor te bouwen. De stappen hieronder zijn een betere start dan software. |

3. **What goes in now**, under the heading "Indication, based on your own numbers": "About 1,150 hours a year. At your own €55 an hour, that is about €63,300 a year. Between 30% and 55% of it goes the usual way and follows rules."
4. **Why:** the two criteria that lift the score most and the two that hold it back most (`drivers()`).
5. **To verify in a call:** every "I don't know" and every edge case (`teVerifieren()`). Hidden when empty.
6. **Action:** an email field, "Send me the one-page report", with a consent line. On the call route, "Book 15 minutes" comes first.

### The one-page report (`reportText`, plain text, at most 50 lines; tested)

The founder pastes it into a mail by hand.

1. Title with the job (their own words for a free-text task), score, band and verdict.
2. What goes into this job now: hours a year; euros a year at their own or an assumed rate; the share range in hours, with "not a promise".
3. Why this score: lifts it / holds it back.
4. To verify in a call (only when there is something).
5. Three steps they can take this week.
6. Privacy checklist (only when the data is sensitive).
7. Next step: the call offer or "start with the three steps".
8. Their answers, one line each.

### The submission (`submissionText`)

This lands in the founder's mailbox when the visitor leaves an email address. It holds the email, language, score, band, route, hours, rate (flagged when assumed), euros, the share range, the number of items to verify, and every raw answer, including the free text and the free amount. Example in the appendix.

**Still to do outside the module:**
- The form post needs a target: the founder's mailbox through a form service or an n8n webhook.
- The copy "Answers stay in your browser" must change.
- `privacy.html` needs a line on what is stored, and for how long.

## 4. Fixture profiles (5 + 2 edge cases)

Computed with the code below.

| Profile | Key answers | Hours/yr | Rate | Score | Band | In now / yr | Fits automation | Route |
|---|---|---|---|---|---|---|---|---|
| Law firm, 12 people, documents into case files daily | 100+ · 5-15 min · 2-3 people · €40-70 · 6-8 · mostly · email/PDF · secrecy | 1,150 | €55 | 78 | Strong | €63,300 | 30-55% (350-630 h) | call |
| One-person webshop, customer questions | 25-100 · under 5 min · one · €40-70 · 9-10 · checklist · email + form | 120 | €55 | 39 (knock-out: under 5 h/wk) | Low | €6,600 | 55-85% | self-serve |
| Accountancy, 30 people, purchase invoices, quarter peaks | 100+ · peaks · 5-15 min · 4+ · €40-70 · 6-8 · checklist · PDF + scans | 1,150 | €55 | 82 | Very strong | €63,300 | 35-60% | call |
| Installer, 6 people, owner schedules by phone and mail | 25-100 · 15-60 min · one · €70-100 · 6-8 · mostly · phone + email | 1,150 | €85 | 74 | Strong | €97,800 | 20-40% | call |
| 15-person firm, bespoke work on paper | 5-25 · no pattern · 60+ min · 4+ · €70-100 · 0-2 · experience · paper | 1,040 | €85 | 39 (knock-out: 0-2 usual) | Low | €88,400 | 0-5% | self-serve |
| **Edge:** free-text task ("Keuringsrapporten controleren"), own rate €65 | 5-25 · 15-60 min · 2-3 · €65 · 6-8 · mostly · email | 350 | €65 | 58 | Partly | €22,800 | 30-55% | self-serve (score under 60) |
| **Edge:** seasonal quotes, duration, rate and usual-way share unknown | 5-25 · seasonal · ? · 2-3 · ? · ? · mostly · email | 120 | €55 assumed | 44 (no knock-out: duration guessed) | Partly | €6,600 | 15-55% (wide) | self-serve, 5 items to verify |

What these show, on purpose:
- The webshop's job is very automatable but small (raw score 73). The knock-out keeps the scan from overselling it.
- The paper firm puts €88,400 a year into the job, but almost none of it is standard. Big money in is not an opportunity, and the 0-5% range says so.
- The seasonal visitor who doesn't know three answers gets a careful middle score, not a crash and not a zero, plus five concrete things to check.
- Extra test: an office job scoring 61 with €13,300 going in goes self-serve, which pins the second half of the routing rule.

## 5. Proposed `js/scan.js`

The export shape is the same as v1 (`QUESTIONS`, `FORMULA`, `score`, `route`, `report`, `mailBody`, `STAPPEN`, `PRIVACY`, `complete`) and so is the `{ en, nl }` pattern. It is pure, with no DOM.
- `besparing` is renamed to `inzet`.
- `reportEmail` is replaced by `reportText` and `submissionText`.
- Also exported: `uren`, `urenBand`, `uurprijs`, `knockout`, `band`, `BANDS`, `drivers`, `CRITERIA`, `teVerifieren`, `DREMPEL`, `AANNAME_UURPRIJS`, `WERKWEKEN`, `UITLEG`.

**app.js changes this implies (not made):**
- Render an option with `{ open }` as a text or number field, and a `multi` question as checkboxes.
- Show the tier from `report().bandNaam`.
- Show the `verifieer` list.
- Take the formula text from `UITLEG[lang]`.
- Post `submissionText(answers, { email, lang })` to the founder's mailbox instead of opening `mailto`.

```js
// The AI scan: questions, scoring formula and report, in English and Dutch.
// Pure: no DOM, no network. UITLEG is the formula as printed on the page; change both together.
// No promises: the scan shows what goes into a job now (hours, and euros at the visitor's own rate)
// and which share of it fits automation, as a range. It never states a saving.

const t = (en, nl) => ({ en, nl });
const WEET_NIET = t('I don\'t know', 'Weet ik niet');

// An answer option is [value, label] or [value, label, { open: 'text' | 'number', field }].
// An open option asks for a free value in answers[field]. multi: true takes an array of values.
export const QUESTIONS = [
  { id: 'taak', q: t('If one job could run by itself from Monday, which one would it be?', 'Als één klus vanaf maandag vanzelf kon gaan, welke zou dat zijn?'), a: [
    ['mail', t('Sorting and answering the inbox', 'De inbox sorteren en beantwoorden')],
    ['documenten', t('Filing and checking documents or case files', 'Documenten of dossiers ordenen en controleren')],
    ['facturen', t('Processing invoices, quotes or orders', 'Facturen, offertes of orders verwerken')],
    ['overtypen', t('Copying data from one program into another', 'Gegevens overtypen van het ene programma naar het andere')],
    ['planning', t('Scheduling jobs, people or appointments', 'Klussen, mensen of afspraken inplannen')],
    ['klantvragen', t('Answering customer questions', 'Klantvragen beantwoorden')],
    ['rapportage', t('Putting together reports and overviews', 'Rapportages en overzichten maken')],
    ['anders', t('Something else, namely...', 'Iets anders, namelijk...'), { open: 'text', field: 'taakTekst' }] ] },
  { id: 'volume', q: t('How many times does it happen in an average week, spread over the year?', 'Hoe vaak gebeurt het in een gemiddelde week, uitgesmeerd over het jaar?'), a: [
    ['<5', t('Fewer than 5', 'Minder dan 5 keer')], ['5-25', t('5 to 25', '5 tot 25 keer')],
    ['25-100', t('25 to 100', '25 tot 100 keer')], ['100+', t('More than 100', 'Meer dan 100 keer')],
    ['onbekend', WEET_NIET] ] },
  { id: 'ritme', q: t('Is it steady, or does it come in peaks?', 'Is het gelijkmatig, of komt het in pieken?'), a: [
    ['stabiel', t('About the same every week', 'Elke week ongeveer even veel')],
    ['piek', t('Peaks at month-end or quarter-end', 'Pieken aan het eind van de maand of het kwartaal')],
    ['seizoen', t('Busy in some months, quiet in others', 'Druk in sommige maanden, rustig in andere')],
    ['onregelmatig', t('No pattern, it comes when it comes', 'Geen patroon, het komt wanneer het komt')] ] },
  { id: 'duur', q: t('And how long does one take, start to finish?', 'En hoe lang duurt één keer, van begin tot eind?'), a: [
    ['<5', t('Under 5 minutes', 'Minder dan 5 minuten')], ['5-15', t('5 to 15 minutes', '5 tot 15 minuten')],
    ['15-60', t('15 minutes to an hour', 'Een kwartier tot een uur')], ['60+', t('More than an hour', 'Meer dan een uur')],
    ['onbekend', WEET_NIET] ] },
  { id: 'mensen', q: t('How many people spend time on it?', 'Hoeveel mensen zijn er tijd aan kwijt?'), a: [
    ['een', t('One (that may be me)', 'Eén (dat kan ik zelf zijn)')],
    ['2-3', t('Two or three', 'Twee of drie')], ['4+', t('Four or more', 'Vier of meer')] ] },
  { id: 'kosten', q: t('Roughly what does an hour of that person cost your business?', 'Wat kost een uur van die persoon jullie bedrijf, ongeveer?'), a: [
    ['<40', t('Under €40', 'Minder dan €40')], ['40-70', t('€40 to €70', '€40 tot €70')],
    ['70-100', t('€70 to €100', '€70 tot €100')], ['100+', t('Over €100', 'Meer dan €100')],
    ['bedrag', t('Another amount: €...', 'Een ander bedrag: €...'), { open: 'number', field: 'kostenBedrag' }],
    ['onbekend', WEET_NIET] ] },
  { id: 'standaard', q: t('Out of ten times, how many go exactly the usual way?', 'Van de tien keer, hoe vaak gaat het precies zoals altijd?'), a: [
    ['9-10', t('9 or 10', '9 of 10 keer')], ['6-8', t('6 to 8', '6 tot 8 keer')],
    ['3-5', t('3 to 5', '3 tot 5 keer')], ['0-2', t('2 or fewer', '2 keer of minder')],
    ['onbekend', WEET_NIET] ] },
  { id: 'regels', q: t('Could a new colleague do it from a one-page checklist?', 'Kan een nieuwe collega het doen met een checklist van één A4?'), a: [
    ['checklist', t('Yes, after a day', 'Ja, na een dag')],
    ['deels', t('Mostly, but they would ask now and then', 'Grotendeels, maar ze zouden af en toe iets vragen')],
    ['ervaring', t('No, it takes years of experience', 'Nee, daar is jaren ervaring voor nodig')] ] },
  { id: 'invoer', multi: true, q: t('How does the work come in? Pick all that apply.', 'Hoe komt het werk binnen? Kies alles wat klopt.'), a: [
    ['velden', t('Through a form or a system, in fixed fields', 'Via een formulier of systeem, in vaste velden')],
    ['digitaal', t('By email, PDF or Word', 'Per mail, pdf of Word')],
    ['scans', t('Scans, photos or handwriting', 'Scans, foto\'s of handschrift')],
    ['papier', t('On paper or by phone', 'Op papier of telefonisch')] ] },
  { id: 'vertrouwelijk', q: t('If this data leaked, what would that mean?', 'Als deze gegevens uitlekken, wat betekent dat dan?'), a: [
    ['geheim', t('A breach of professional secrecy or medical data', 'Schending van beroepsgeheim of medische gegevens')],
    ['persoonsgegevens', t('Personal data of clients is out', 'Persoonsgegevens van klanten liggen op straat')],
    ['laag', t('Annoying, not serious', 'Vervelend, niet ernstig')] ] },
];

const vraag = (id) => QUESTIONS.find((x) => x.id === id);
const geldig = (id, v) => vraag(id).a.some(([k]) => k === v);
const lijst = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);

export function complete(a) {
  return QUESTIONS.every(({ id, multi }) => (multi
    ? lijst(a[id]).length > 0 && lijst(a[id]).every((v) => geldig(id, v))
    : geldig(id, a[id])));
}

// "I don't know" never crashes and never flatters: it takes a cautious middle value
// and is listed in the report as something to verify in the call.
const STANDAARDWAARDE = { volume: '5-25', duur: '5-15', kosten: '40-70', standaard: '3-5' };

// The hourly cost actually used: the visitor's own number, the middle of their band, or (don't know) an assumption.
const UURPRIJS = { '<40': 35, '40-70': 55, '70-100': 85, '100+': 120 };
export const AANNAME_UURPRIJS = 55;
export function uurprijs(a) {
  if (a.kosten === 'bedrag') {
    const n = Number(a.kostenBedrag);
    if (Number.isFinite(n) && n >= 10 && n <= 500) return { prijs: Math.round(n), eigen: true };
    return { prijs: AANNAME_UURPRIJS, eigen: false };
  }
  if (a.kosten === 'onbekend') return { prijs: AANNAME_UURPRIJS, eigen: false };
  return { prijs: UURPRIJS[a.kosten], eigen: true };
}
const kostenBand = (a) => {
  const { prijs } = uurprijs(a);
  return prijs < 40 ? '<40' : prijs < 70 ? '40-70' : prijs < 100 ? '70-100' : '100+';
};

// Hours per week are derived, not asked: times per week x minutes per time, capped by headcount.
const KEER = { '<5': 3, '5-25': 15, '25-100': 50, '100+': 150 };
const MINUTEN = { '<5': 3, '5-15': 10, '15-60': 30, '60+': 90 };
const MAX_UREN = { een: 40, '2-3': 120, '4+': 200 };
export const UREN_BANDEN = [['<5', 5], ['5-10', 10], ['10-20', 20], ['20-40', 40], ['40+', Infinity]];
const echt = (id, a) => (a[id] === 'onbekend' ? STANDAARDWAARDE[id] : a[id]);

export function uren(a) {
  const h = (KEER[echt('volume', a)] * MINUTEN[echt('duur', a)]) / 60;
  return Math.min(h, MAX_UREN[a.mensen]);
}
export function urenBand(a) { const h = uren(a); return UREN_BANDEN.find(([, max]) => h < max)[0]; }

// Points per answer (0-100) and the weight of each criterion. Weights sum to 1.
// Fit for automation: volume, standaard, regels, invoer (0.60). Weight in the business: uren, kosten (0.40).
export const FORMULA = {
  volume:    { w: 0.15, p: { '<5': 10, '5-25': 45, '25-100': 80, '100+': 100 } },
  standaard: { w: 0.20, p: { '9-10': 100, '6-8': 70, '3-5': 35, '0-2': 10 } },
  regels:    { w: 0.15, p: { checklist: 100, deels: 60, ervaring: 15 } },
  invoer:    { w: 0.10, p: { velden: 100, digitaal: 85, scans: 45, papier: 10 } },
  uren:      { w: 0.25, p: { '<5': 10, '5-10': 40, '10-20': 65, '20-40': 85, '40+': 100 } },
  kosten:    { w: 0.15, p: { '<40': 40, '40-70': 65, '70-100': 85, '100+': 100 } },
};

function punten(a) {
  const pt = {};
  for (const [id, { p }] of Object.entries(FORMULA)) {
    if (id === 'uren') pt[id] = p[urenBand(a)];
    else if (id === 'kosten') pt[id] = p[kostenBand(a)];
    else if (id === 'invoer') { const v = lijst(a.invoer); pt[id] = v.reduce((s, x) => s + p[x], 0) / v.length; }
    else pt[id] = p[echt(id, a)];
  }
  return pt;
}

// Knock-out: too small (under 5 hours a week, only when both counts are known) or too irregular.
export const PLAFOND = 39;
export function knockout(a) {
  const urenBekend = a.volume !== 'onbekend' && a.duur !== 'onbekend';
  return (urenBekend && uren(a) < 5) || a.standaard === '0-2';
}

export function score(a) {
  if (!complete(a)) throw new Error('Not every question is answered');
  const pt = punten(a);
  let s = 0; // whole percent weights keep the sum exact
  for (const [id, { w }] of Object.entries(FORMULA)) s += Math.round(w * 100) * pt[id];
  s = Math.round(s / 100);
  return knockout(a) ? Math.min(s, PLAFOND) : s;
}

// What goes into this job now, from the visitor's own numbers. An indication, not a saving.
export const WERKWEKEN = 46;
// Share that fits automation, as a range: cases that go the usual way x the part that follows rules
// x how much of the input a machine can read. A person always checks, so the top is below 100%.
const DEEL_STANDAARD = { '9-10': [0.7, 0.9], '6-8': [0.5, 0.7], '3-5': [0.25, 0.45], '0-2': [0.05, 0.15], onbekend: [0.25, 0.7] };
const DEEL_REGELS = { checklist: [0.8, 0.95], deels: [0.55, 0.8], ervaring: [0.25, 0.5] };
const DEEL_INVOER = { velden: 1, digitaal: 1, scans: 0.8, papier: 0.4 };
const vijf = (x) => Math.round(x * 20) * 5; // to the nearest 5%

export function inzet(a) {
  const v = lijst(a.invoer);
  const inp = v.reduce((s, x) => s + DEEL_INVOER[x], 0) / v.length;
  const [sL, sH] = DEEL_STANDAARD[a.standaard];
  const [rL, rH] = DEEL_REGELS[a.regels];
  const deel = [vijf(sL * rL * inp), vijf(sH * rH * inp)];
  const urenPerWeek = uren(a);
  const urenPerJaar = Math.round((urenPerWeek * WERKWEKEN) / 10) * 10;
  const { prijs, eigen } = uurprijs(a);
  const euroPerJaar = Math.round((urenPerJaar * prijs) / 100) * 100;
  const urenDeel = deel.map((pct) => Math.round((urenPerJaar * pct) / 100 / 10) * 10);
  return { urenPerWeek: Math.round(urenPerWeek), urenPerJaar, uurprijs: prijs, eigenPrijs: eigen, euroPerJaar, deel, urenDeel };
}

// A call is worth both sides' time when the work fits and enough goes into it now.
export const DREMPEL = { score: 60, euro: 20000 };
export function route(a) {
  return score(a) >= DREMPEL.score && inzet(a).euroPerJaar >= DREMPEL.euro ? 'gesprek' : 'zelf';
}

// Verdicts describe fit, never money.
export const BANDS = [
  { id: 'zeersterk', min: 80, naam: t('Very strong', 'Zeer sterk'),
    oordeel: t('On every point we asked about, this job fits automation well.', 'Op elk punt dat we vroegen past deze klus goed bij automatisering.') },
  { id: 'sterk', min: 60, naam: t('Strong', 'Sterk'),
    oordeel: t('A good fit for an agent, with a person checking the exceptions.', 'Past goed bij een agent, met een mens die de uitzonderingen controleert.') },
  { id: 'deels', min: 40, naam: t('Partly', 'Deels'),
    oordeel: t('Part of it fits. The usual cases are the place to start.', 'Een deel past. De standaardgevallen zijn de plek om te beginnen.') },
  { id: 'laag', min: 0, naam: t('Low', 'Laag'),
    oordeel: t('Too small or too irregular to build for now. The steps below are a better start than software.', 'Te klein of te onregelmatig om nu voor te bouwen. De stappen hieronder zijn een betere start dan software.') },
];
export function band(s) { return BANDS.find((b) => s >= b.min); }

export const CRITERIA = {
  volume: t('how often it happens', 'hoe vaak het gebeurt'),
  standaard: t('how often it goes the usual way', 'hoe vaak het gaat zoals altijd'),
  regels: t('how rule-based it is', 'hoeveel het op regels draait'),
  invoer: t('how the work comes in', 'hoe het werk binnenkomt'),
  uren: t('the hours it takes', 'de uren die het kost'),
  kosten: t('what an hour costs', 'wat een uur kost'),
};

// The two criteria that lift the score most and the two that hold it back most (weighted).
export function drivers(a, lang = 'en') {
  const pt = punten(a);
  const r = Object.entries(FORMULA).map(([id, { w }]) => ({ id, plus: w * pt[id], min: w * (100 - pt[id]) }));
  const top = [...r].sort((x, y) => y.plus - x.plus).slice(0, 2).map((x) => x.id);
  const low = r.filter((x) => !top.includes(x.id)).sort((x, y) => y.min - x.min).slice(0, 2).map((x) => x.id);
  return { sterk: top.map((id) => CRITERIA[id][lang]), zwak: low.map((id) => CRITERIA[id][lang]) };
}

// What to verify in the call: every "I don't know", plus the situations a scan cannot see.
const VERIFIEER = {
  volume: t('How often it happens: you did not know, so we counted 15 times a week.', 'Hoe vaak het gebeurt: je wist het niet, dus we rekenden met 15 keer per week.'),
  duur: t('How long one takes: you did not know, so we counted 10 minutes.', 'Hoe lang één keer duurt: je wist het niet, dus we rekenden met 10 minuten.'),
  standaard: t('How often it goes the usual way: you did not know, so the share is a wide range.', 'Hoe vaak het gaat zoals altijd: je wist het niet, dus het deel is een brede range.'),
  kosten: t(`What an hour costs: we used an assumed €${AANNAME_UURPRIJS}.`, `Wat een uur kost: we rekenden met een aangenomen €${AANNAME_UURPRIJS}.`),
  piek: t('Peaks at month-end or quarter-end: how big the peak is and who absorbs it.', 'Pieken aan het eind van de maand of het kwartaal: hoe groot de piek is en wie hem opvangt.'),
  seizoen: t('Seasonal work: how many busy months, and whether there is a year of history to test on.', 'Seizoenswerk: hoeveel drukke maanden, en of er een jaar historie is om op te testen.'),
  onregelmatig: t('No pattern: whether the average holds over a year.', 'Geen patroon: of het gemiddelde over een jaar klopt.'),
  mensen: t('Several people do it: hand-offs between them often take more time than the work.', 'Meerdere mensen doen het: de overdracht tussen hen kost vaak meer tijd dan het werk.'),
  anders: t('Your own job description: we used general advice, the call makes it specific.', 'Je eigen omschrijving van de klus: we gaven algemeen advies, het gesprek maakt het specifiek.'),
};

export function teVerifieren(a, lang = 'en') {
  const out = [];
  if (a.taak === 'anders') out.push('anders');
  for (const id of ['volume', 'duur', 'standaard']) if (a[id] === 'onbekend') out.push(id);
  if (!uurprijs(a).eigen) out.push('kosten');
  if (VERIFIEER[a.ritme]) out.push(a.ritme);
  if (a.mensen !== 'een') out.push('mensen');
  return out.map((k) => VERIFIEER[k][lang]);
}

export const UITLEG = t(
  'Six of your answers score 0 to 100 and your score is their weighted average: 60% is how well the work fits automation (how often, how standard, how rule-based, how it comes in) and 40% is its weight in your business (hours a week and what an hour costs you). Under 5 hours a week, or when 2 in 10 times or fewer go the usual way, the score stops at 39; an "I don\'t know" counts as a cautious middle value and is marked to verify. The hours and euros are what goes into this job now, from your own numbers, and with a score of 60 or more and €20,000 a year or more going in, we offer a call.',
  'Zes van je antwoorden scoren 0 tot 100 en je score is het gewogen gemiddelde: 60% is hoe goed het werk bij automatisering past (hoe vaak, hoe standaard, hoeveel regels, hoe het binnenkomt) en 40% is het gewicht in je bedrijf (uren per week en wat een uur je kost). Onder de 5 uur per week, of als het 2 op de 10 keer of minder gaat zoals altijd, stopt de score bij 39; een "weet ik niet" telt als een voorzichtige middenwaarde en staat bij de punten om te checken. De uren en euro\'s zijn wat er nu in deze klus gaat, op basis van je eigen cijfers, en bij een score van 60 of meer en €20.000 per jaar of meer bieden we een gesprek aan.',
);

export const STAPPEN = {
  mail: [
    t('Count incoming mail by type for one week: question, document, invoice, other. Now you know the size.', 'Tel een week lang de binnenkomende mail per soort: vraag, stuk, factuur, overig. Dan weet je hoe groot het is.'),
    t('Add rules that file mail by type. Outlook calls them Rules, Gmail calls them Filters.', 'Maak regels die mail per soort in een map zetten. In Outlook heet dat Regels, in Gmail Filters.'),
    t('Write standard replies for your five most common questions. Let AI adapt them, never send them.', 'Schrijf standaardantwoorden voor je vijf meest gestelde vragen. Laat AI ze aanpassen, nooit zelf versturen.'),
  ],
  documenten: [
    t('Agree one folder structure and one file name: date, client, document type.', 'Spreek één mapstructuur en één bestandsnaam af: datum, klant, soort stuk.'),
    t('List the documents every type of file must contain.', 'Maak per soort dossier een lijst van stukken die er altijd in moeten zitten.'),
    t('Let AI inside your own business account flag what is missing. A person asks for it.', 'Laat AI binnen je eigen zakelijke omgeving controleren wat ontbreekt. Een mens vraagt het op.'),
  ],
  facturen: [
    t('Send all incoming invoices to one address linked to your accounting software. Most read invoices already.', 'Zet inkomende facturen op één mailadres gekoppeld aan je boekhoudpakket. Veel pakketten lezen ze al zelf in.'),
    t('Build a quote template with fixed blocks, so you only fill in what changes.', 'Maak een offertesjabloon met vaste blokken, zodat je alleen invult wat verandert.'),
    t('Check once a week at a fixed time instead of invoice by invoice.', 'Controleer één vast moment per week in plaats van per factuur.'),
  ],
  overtypen: [
    t('Write down which fields you copy, from where to where. That list is the whole specification.', 'Schrijf op welke velden je overtypt, van waar naar waar. Die lijst is de hele specificatie.'),
    t('Check whether both programs can export and import, or connect directly. Often they can and nobody switched it on.', 'Kijk of beide programma\'s kunnen exporteren en importeren, of direct koppelen. Vaak kan het en heeft niemand het aangezet.'),
    t('Until then, copy in one batch at a fixed moment, not one by one through the day.', 'Neem het tot die tijd in één keer over op een vast moment, niet los door de dag heen.'),
  ],
  planning: [
    t('Let clients pick a slot in the calendar you already have. Outlook and Google both offer a booking page.', 'Laat klanten zelf een tijd kiezen in je bestaande agenda. Outlook en Google hebben een boekingspagina.'),
    t('Send an automatic reminder the day before.', 'Stuur automatisch een herinnering een dag van tevoren.'),
    t('Decide who plans what, so there is one source of truth.', 'Leg vast wie wat plant, zodat er één bron van waarheid is.'),
  ],
  klantvragen: [
    t('Put your ten most asked questions and answers on your site. It cuts the calls.', 'Zet je tien meest gestelde vragen met antwoord op je site. Dat scheelt telefoontjes.'),
    t('Use a form with required fields so every question arrives complete.', 'Gebruik een formulier met verplichte velden, zodat elke vraag compleet binnenkomt.'),
    t('Let AI draft a reply that a colleague checks before it goes out.', 'Laat AI een conceptantwoord maken dat een collega controleert voordat het de deur uitgaat.'),
  ],
  rapportage: [
    t('Pick the five numbers that matter and where each one comes from.', 'Bepaal welke vijf cijfers ertoe doen en waar ze vandaan komen.'),
    t('Pull those sources into one spreadsheet that updates itself.', 'Zet die bronnen in één spreadsheet die zichzelf bijwerkt.'),
    t('Only let AI write the text once the numbers are right, and always read it.', 'Laat AI pas tekst schrijven als de cijfers kloppen, en lees hem altijd na.'),
  ],
  anders: [
    t('Write down the steps of one case exactly as you did it last time. That list is where every automation starts.', 'Schrijf de stappen van één keer op, precies zoals je het de laatste keer deed. Met die lijst begint elke automatisering.'),
    t('Mark each step: always the same, or does it depend? The "always the same" steps are the candidates.', 'Zet bij elke stap: altijd hetzelfde, of hangt het ervan af? De stappen die altijd hetzelfde zijn, zijn de kandidaten.'),
    t('Count for two weeks how often it happens and how long it takes. Then the numbers in this scan are yours, not estimates.', 'Tel twee weken hoe vaak het gebeurt en hoe lang het duurt. Dan zijn de cijfers in deze scan van jou, geen schattingen.'),
  ],
};

export const PRIVACY = [
  t('No free or personal AI accounts for client data. Use a business plan that does not train on your data.', 'Geen gratis of persoonlijke AI-accounts voor klantgegevens. Kies een zakelijk abonnement dat niet traint op je data.'),
  t('Know where the data lives and who can reach it. Write it down.', 'Weet waar de data staat en wie erbij kan. Leg dat vast.'),
  t('Sign a data processing agreement with every party that handles personal data (GDPR art. 28).', 'Sluit een verwerkersovereenkomst met elke partij die persoonsgegevens verwerkt (AVG art. 28).'),
  t('Never use AI output unchecked. A person signs off.', 'Neem AI-uitvoer nooit ongecontroleerd over. Een mens tekent af.'),
  t('Tell clients that, and how, you use AI.', 'Vertel klanten dat en hoe je AI gebruikt.'),
];

const label = (id, v, lang) => vraag(id).a.find(([k]) => k === v)[1][lang];
const vrijeTekst = (s) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);
const fmt = (n, lang) => new Intl.NumberFormat(lang === 'nl' ? 'nl-NL' : 'en-GB').format(n);
const euro = (n, lang) => new Intl.NumberFormat(lang === 'nl' ? 'nl-NL' : 'en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

function antwoord(id, a, lang) {
  if (id === 'taak' && a.taak === 'anders') return vrijeTekst(a.taakTekst) || label('taak', 'anders', lang);
  if (id === 'kosten' && a.kosten === 'bedrag' && uurprijs(a).eigen) return euro(uurprijs(a).prijs, lang);
  return lijst(a[id]).map((v) => label(id, v, lang)).join(', ');
}

export function report(a, lang = 'en') {
  const s = score(a);
  const b = band(s);
  const z = inzet(a);
  return {
    score: s, band: b.id, bandNaam: b.naam[lang], oordeel: b.oordeel[lang], route: route(a),
    taak: antwoord('taak', a, lang), ...z, euro: euro(z.euroPerJaar, lang), prijs: euro(z.uurprijs, lang),
    ...drivers(a, lang), verifieer: teVerifieren(a, lang),
    stappen: STAPPEN[a.taak].map((x) => x[lang]),
    privacy: a.vertrouwelijk === 'laag' ? [] : PRIVACY.map((x) => x[lang]),
  };
}

const TEKST = {
  en: { titel: 'HARNAS AI scan', cijfers: 'What goes into this job now (indication, based on your own numbers)',
    waarom: 'Why this score', plus: 'Lifts it', min: 'Holds it back', check: 'To verify in a call',
    stappen: 'Three steps you can take this week', privacy: 'Before any AI touches this data', volgende: 'Next step', antwoorden: 'Your answers',
    uren: (r, lang) => `About ${fmt(r.urenPerJaar, lang)} hours a year (${r.urenPerWeek} a week, ${WERKWEKEN} working weeks).`,
    geld: (r) => `At ${r.eigenPrijs ? 'your own' : 'an assumed'} ${r.prijs} an hour, that is about ${r.euro} a year.`,
    deel: (r, lang) => `Between ${r.deel[0]}% and ${r.deel[1]}% of it goes the usual way and follows rules: about ${fmt(r.urenDeel[0], lang)} to ${fmt(r.urenDeel[1], lang)} hours a year that fit automation. Not a promise: the call and a test on your own history settle it.`,
    gesprek: 'This is worth a 15-minute call. Reply with two times that suit you.',
    zelf: 'Start with the three steps. If a number above is off, reply and we look again.' },
  nl: { titel: 'HARNAS AI-scan', cijfers: 'Wat er nu in deze klus gaat (indicatie, op basis van je eigen cijfers)',
    waarom: 'Waarom deze score', plus: 'Trekt hem omhoog', min: 'Houdt hem tegen', check: 'Te checken in een gesprek',
    stappen: 'Drie stappen voor deze week', privacy: 'Voordat AI aan deze gegevens komt', volgende: 'Volgende stap', antwoorden: 'Je antwoorden',
    uren: (r, lang) => `Ongeveer ${fmt(r.urenPerJaar, lang)} uur per jaar (${r.urenPerWeek} per week, ${WERKWEKEN} werkweken).`,
    geld: (r) => `Tegen ${r.eigenPrijs ? 'je eigen' : 'een aangenomen'} ${r.prijs} per uur is dat ongeveer ${r.euro} per jaar.`,
    deel: (r, lang) => `Tussen ${r.deel[0]}% en ${r.deel[1]}% daarvan gaat zoals altijd en volgt regels: ongeveer ${fmt(r.urenDeel[0], lang)} tot ${fmt(r.urenDeel[1], lang)} uur per jaar die bij automatisering passen. Geen belofte: het gesprek en een test op je eigen historie wijzen het uit.`,
    gesprek: 'Dit is een gesprek van 15 minuten waard. Antwoord met twee tijden die je passen.',
    zelf: 'Begin met de drie stappen. Klopt een cijfer hierboven niet, antwoord dan en we kijken opnieuw.' },
};

// The one-page report as plain text. The founder pastes it into a mail by hand.
export function reportText(a, lang = 'en') {
  const r = report(a, lang);
  const T = TEKST[lang];
  return [
    `${T.titel}: ${r.taak}`,
    `Score: ${r.score} / 100 (${r.bandNaam}). ${r.oordeel}`,
    '',
    T.cijfers,
    `- ${T.uren(r, lang)}`,
    `- ${T.geld(r)}`,
    `- ${T.deel(r, lang)}`,
    '',
    T.waarom,
    `- ${T.plus}: ${r.sterk.join(', ')}.`,
    `- ${T.min}: ${r.zwak.join(', ')}.`,
    ...(r.verifieer.length ? ['', T.check, ...r.verifieer.map((x) => `- ${x}`)] : []),
    '',
    T.stappen,
    ...r.stappen.map((x, n) => `${n + 1}. ${x}`),
    ...(r.privacy.length ? ['', T.privacy, ...r.privacy.map((x) => `- ${x}`)] : []),
    '',
    T.volgende,
    r.route === 'gesprek' ? T.gesprek : T.zelf,
    '',
    T.antwoorden,
    ...QUESTIONS.map(({ id, q }) => `- ${q[lang]} ${antwoord(id, a, lang)}`),
  ].join('\n');
}

// What lands in the founder's mailbox: raw answers, the computed result, and the address to reply to.
export function submissionText(a, { email = '', lang = 'en' } = {}) {
  const r = report(a, lang);
  return [
    `email: ${vrijeTekst(email)}`,
    `lang: ${lang}`,
    `score: ${r.score} (${r.band}), route: ${r.route}`,
    `uren/jaar: ${r.urenPerJaar}, uurprijs: ${r.uurprijs}${r.eigenPrijs ? '' : ' (aanname)'}, euro/jaar: ${r.euroPerJaar}, deel: ${r.deel[0]}-${r.deel[1]}%`,
    `te checken: ${r.verifieer.length}`,
    '',
    ...QUESTIONS.map(({ id }) => `${id}: ${lijst(a[id]).join(',')}`),
    ...(a.taak === 'anders' ? [`taakTekst: ${vrijeTekst(a.taakTekst)}`] : []),
    ...(a.kosten === 'bedrag' ? [`kostenBedrag: ${vrijeTekst(a.kostenBedrag)}`] : []),
  ].join('\n');
}

// Kept for app.js: the body of the mail to HARNAS.
export function mailBody(a, lang = 'en') { return submissionText(a, { lang }); }
```

## 5b. Proposed `js/scan.test.mjs`

Replaces the current file. It covers the seven fixtures (band and route), the two edge cases in detail, and checks that must hold for any answers:
- the weights sum to 1;
- every answer combination, including every "I don't know", stays between 0 and 100, with a share range that rises from low to high and stays under 100%;
- a better answer never lowers the score;
- the knock-out cap and the routing threshold hold;
- the report never talks about savings;
- the report fits on one page, in both languages, with no dashes.

Run: `node --test js/scan.test.mjs`

```js
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
```

## Appendix A: report text, law firm fixture (NL)

```text
HARNAS AI-scan: Documenten of dossiers ordenen en controleren
Score: 78 / 100 (Sterk). Past goed bij een agent, met een mens die de uitzonderingen controleert.

Wat er nu in deze klus gaat (indicatie, op basis van je eigen cijfers)
- Ongeveer 1.150 uur per jaar (25 per week, 46 werkweken).
- Tegen je eigen € 55 per uur is dat ongeveer € 63.300 per jaar.
- Tussen 30% en 55% daarvan gaat zoals altijd en volgt regels: ongeveer 350 tot 630 uur per jaar die bij automatisering passen. Geen belofte: het gesprek en een test op je eigen historie wijzen het uit.

Waarom deze score
- Trekt hem omhoog: de uren die het kost, hoe vaak het gebeurt.
- Houdt hem tegen: hoe vaak het gaat zoals altijd, hoeveel het op regels draait.

Te checken in een gesprek
- Meerdere mensen doen het: de overdracht tussen hen kost vaak meer tijd dan het werk.

Drie stappen voor deze week
1. Spreek één mapstructuur en één bestandsnaam af: datum, klant, soort stuk.
2. Maak per soort dossier een lijst van stukken die er altijd in moeten zitten.
3. Laat AI binnen je eigen zakelijke omgeving controleren wat ontbreekt. Een mens vraagt het op.

Voordat AI aan deze gegevens komt
- Geen gratis of persoonlijke AI-accounts voor klantgegevens. Kies een zakelijk abonnement dat niet traint op je data.
- Weet waar de data staat en wie erbij kan. Leg dat vast.
- Sluit een verwerkersovereenkomst met elke partij die persoonsgegevens verwerkt (AVG art. 28).
- Neem AI-uitvoer nooit ongecontroleerd over. Een mens tekent af.
- Vertel klanten dat en hoe je AI gebruikt.

Volgende stap
Dit is een gesprek van 15 minuten waard. Antwoord met twee tijden die je passen.

Je antwoorden
- Als één klus vanaf maandag vanzelf kon gaan, welke zou dat zijn? Documenten of dossiers ordenen en controleren
- Hoe vaak gebeurt het in een gemiddelde week, uitgesmeerd over het jaar? Meer dan 100 keer
- Is het gelijkmatig, of komt het in pieken? Elke week ongeveer even veel
- En hoe lang duurt één keer, van begin tot eind? 5 tot 15 minuten
- Hoeveel mensen zijn er tijd aan kwijt? Twee of drie
- Wat kost een uur van die persoon jullie bedrijf, ongeveer? €40 tot €70
- Van de tien keer, hoe vaak gaat het precies zoals altijd? 6 tot 8 keer
- Kan een nieuwe collega het doen met een checklist van één A4? Grotendeels, maar ze zouden af en toe iets vragen
- Hoe komt het werk binnen? Kies alles wat klopt. Per mail, pdf of Word
- Als deze gegevens uitlekken, wat betekent dat dan? Schending van beroepsgeheim of medische gegevens
```

## Appendix B: submission, free-text edge case

```text
email: x@y.nl
lang: nl
score: 58 (deels), route: zelf
uren/jaar: 350, uurprijs: 65, euro/jaar: 22800, deel: 30-55%
te checken: 2

taak: anders
volume: 5-25
ritme: stabiel
duur: 15-60
mensen: 2-3
kosten: bedrag
standaard: 6-8
regels: deels
invoer: digitaal
vertrouwelijk: laag
taakTekst: Keuringsrapporten controleren
kostenBedrag: 65
```
