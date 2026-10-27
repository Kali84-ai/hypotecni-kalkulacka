# Seznam změn

Všechny podstatné změny projektu se zapisují do tohoto souboru.
Formát vychází z [Keep a Changelog](https://keepachangelog.com/cs/1.1.0/), verze se číslují podle [sémantického verzování](https://semver.org/lang/cs/).

## [Nevydáno]

## [1.0.0] – 2026-10-27

První verze hypoteční kalkulačky.

### Přidáno

**Spuštění a provoz**
- Statický server v PowerShellu (`server.ps1`) na `http://localhost:8080/`, spuštění přes `start.bat`. Není potřeba nic instalovat.
- Server servíruje jen složku `public/` a odmítá průchod mimo ni (`../`, zástupné znaky).
- Frontend je čisté HTML, CSS a JavaScript bez knihoven a bez build kroku.

**Výpočty**
- Anuitní splátka, celková splatná částka, přeplatek a splátkový kalendář po letech i po měsících.
- RPSN podle přílohy č. 1 zákona č. 257/2016 Sb. (Newton–Raphson se záložní bisekcí, zaokrouhlení na 1 desetinné místo).
- Modelový příklad, obdoba reprezentativního příkladu podle § 91. Uvádí náklady zahrnuté i nezahrnuté v RPSN.
- Mimořádné splátky ve dvou režimech: zkrácení doby nebo snížení splátky. Upozorní na limit 25 % ročně a na strop náhrady (§ 117, § 117a).
- Stresový test splátky po konci fixace (sazba −1 až +3 p. b.).
- Odhad daňové úspory z odpočtu úroků (§ 15 odst. 3 ZDP, limit 150 000 Kč).

**Limity a bonita**
- Ukazatele ČNB: LTV (80 %, 90 % do 36 let), DTI a DSTI informativně. Pro investiční nemovitosti doporučení od 1. 4. 2026: LTV 70 %, DTI 7.
- Kontrola věku na konci splatnosti a odhad maximální výše úvěru podle příjmu.

**Plánování koupě**
- Přehled jednorázových nákladů koupě a doporučená finanční rezerva.
- Srovnání nájmu a hypotéky na 10 let.

**Přehledy a výstupy**
- SVG graf průběhu splácení.
- Export kalendáře do CSV.
- Tisková verze a uložení do PDF.

**Informace pro zájemce**
- Informační sekce:
  - RPSN,
  - ESIS a lhůta 14 dní,
  - předčasné splacení,
  - limity ČNB,
  - pojištění,
  - daně,
  - státní podpora,
  - postup sjednání,
  - doklady,
  - slovník,
  - kde hledat pomoc.
- Právní upozornění: kalkulačka není nabídkou úvěru ani posouzením úvěruschopnosti.

**Konfigurace, vzhled a testy**
- Všechny legislativní a tržní parametry jsou na jednom místě v `public/js/config.js` (platnost k 27. 10. 2026).
- Světlý a tmavý režim, mobilní zobrazení, uložení zadaných hodnot v prohlížeči.
- 18 testů výpočetního jádra (`public/tests.html`).

### Opraveno (po oponentuře před vydáním)

**Výpočty a texty podle zákona**
- Do RPSN a celkové splatné částky se nově počítá poplatek za vklad zástavního práva.
- Opravený popis náhrady za předčasné splacení. Náhrada je celkem nejvýše 0,25 % za každý započatý rok zbývající do konce fixace, max. 1 %. Strop se počítá ze zbývajících let fixace.
- Opravená podmínka daňového odpočtu: limit se váže na bytovou potřebu nabytou od 1. 1. 2021.
- Opravené datum zrušení daně z nabytí nemovitých věcí.

**Ošetření vstupů**
- Prázdná nebo nulová splatnost už nevypisuje RPSN „NaN %“.
- Záporné vstupy se ořezávají na nulu.
- Čísla s tečkami jako oddělovačem tisíců („4.000.000“) se čtou správně.
- Uložený stav s volbou, která v novém nastavení neexistuje, už nerozbije výpočet.
- U velmi krátké splatnosti se nevypisuje nesmyslný text o mimořádné splátce.

### Změněno

**Texty a označení**
- „Reprezentativní příklad“ je přejmenovaný na „Modelový příklad“, protože kalkulačka nemá věřitele. Přibyl předpoklad sazby po fixaci podle přílohy č. 1.
- Rozšířené právní upozornění a neutrální znění hlášek.
- Upřesněný popisek pojištění nemovitosti a investičního účelu.

[Nevydáno]: #
[1.0.0]: #
