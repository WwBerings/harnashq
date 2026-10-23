# HARNAS site spine (harnashq.com)

Vervangt de spine van harnas-site (augustus 2026, persoonlijke AI, Engels, met naam).
Besloten 2026-10-23. Wijzig dit bestand voordat je de pagina wijzigt.

## Voor wie

Nederlandse mkb-bedrijven met 2 tot 50 mensen die weten dat er werk is dat een systeem kan doen,
maar niet weten hoe ze het veilig aanpakken. Advocatuur is het eerste voorbeeld van een sector
met vertrouwelijke data, niet de enige doelgroep.

Bewijs dat het gat kennis is, niet geld (CBS 2025, microbedrijven die AI overwogen):
gebrek aan ervaring 71,6%, privacy 48,8%, kosten 20,3%. 13,8% van de microbedrijven gebruikt AI.

## Wat de pagina moet bereiken

Eén ding: de bezoeker doet de gratis AI-scan. Wie groot genoeg is, vraagt daarna een gesprek
aan. Wie kleiner is, krijgt een rapport waarmee hij zelf verder kan.

## Beeld (herzien 2026-10-23)

Niets middeleeuws meer. Het harnas is alleen nog het logo: een strak borstharnas uit vijf delen
(`brand/harnas-mark.svg`). Taal: Engels standaard, Nederlands via de schakelaar.

- **Hero:** realtime 3D (Three.js, lokaal gehost). Het stalen logo wordt uit vijf delen
  samengesteld terwijl een stroom data erin wordt opgenomen.
- **Scan:** na de laatste vraag ontsteekt het harnas. Score <50 smeult, 50-79 brandt, 80+ witheet,
  met vlammen, vonken en een schokgolf. De drie niveaus staan vooraf als beelden bij de scan.
- **Minder tekst:** de demo (inbox die zichzelf sorteert), de werkwijze (vier woorden en een balk
  die meevult) en het privacyschema (een agent die binnen je systemen blijft) laten het zien.
- Stills in `img/` worden gerenderd met `brand/render.html` in headless Chrome; ze tonen bij
  reduced motion en zolang 3D laadt.

## Volgorde (claim en bewijs)

1. **Kop.** Wat het is: AI-agents die handwerk overnemen, binnen de systemen die je al hebt.
   Bewijs: het harnas zelf, en de knop naar de scan.
2. **Inleiding.** Voor wie, wat, hoe, waarom nu. Bewijs: CBS-cijfers met bron.
3. **Werkwijze.** Scan of gesprek, kansenkaart binnen 48 uur, één taak tegen één vaste prijs,
   getest op 3 maanden eigen historie met minimaal 95% juist. Haalt hij dat niet, dan vervalt de
   laatste termijn.
4. **Data en privacy.** Data blijft in de systemen die je al gebruikt, niets wordt elders
   opgeslagen. Elke regel (AVG, NOvA, Gedragsregels, AI Act) met een link naar de bron.
5. **De scan.** 10 vragen, gescoord in de browser met een openbare formule. Antwoorden verlaten
   de pagina alleen als de bezoeker zelf op versturen drukt.
6. **Vragen.** Prijs, data, software, fouten, doorlooptijd, sectoren, scan-antwoorden.
7. **Slot.** Contact, bronnen, beeldcredits.

## Routering na de scan

- **Gesprek aangeboden** als (10 of meer mensen, of 15 of meer uur per week aan het werk) en de
  kansscore 50 of hoger is.
- **Anders een zelf-aan-de-slag-rapport**: drie stappen voor hun taak, met de software die ze al
  hebben, plus een privacychecklist als ze met vertrouwelijke data werken. Bruikbaar zonder ons.

## Regels

- Geen namen van personen, klanten of werkgevers. Geen verzonnen klanten, citaten of cijfers.
- Elke juridische claim linkt naar de primaire bron. Dit is onderzoek, geen juridisch advies.
- Geen em-dashes. Geen hypewoorden (revolutionair, game-changer, supercharge, 10x).
- Geen cookies, geen analytics, geen externe scripts of fonts.

## Voor livegang nog nodig

- Mailbox hallo@harnashq.com werkend (de scan verstuurt via mailto).
- KvK-nummer in de footer (verplicht voor een zakelijke site).
- Juridische toets van de privacysectie door een advocaat.
