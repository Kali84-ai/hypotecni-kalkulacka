# Hypoteční kalkulačka

Orientační hypoteční kalkulačka běžící na localhostu. Je to čisté HTML/CSS/JavaScript bez knihoven a bez instalace. Server je napsaný v PowerShellu, který je součástí Windows.

## Spuštění

1. Dvojklikem spusťte `start.bat`. Případně můžete spustit příkaz:

   ```bash
   powershell -NoProfile -ExecutionPolicy Bypass -File server.ps1 -Port 8080
   ```

2. V prohlížeči otevřete **http://localhost:8080/**.
3. Testy výpočtů najdete na **http://localhost:8080/tests.html**.

Server ukončíte klávesami `Ctrl+C`. Poslouchá pouze na `localhost` a servíruje jen obsah složky `public/`.

## Co kalkulačka umí

**Splátka a náklady**
- Anuitní splátka, celková splatná částka a přeplatek.
- RPSN podle přílohy č. 1 zákona č. 257/2016 Sb. Řeší se rovnice současných hodnot metodou Newton–Raphson se záložní bisekcí. Měsíc se počítá jako 1/12 roku a výsledek se zaokrouhluje na 1 desetinné místo.
- Modelový příklad (obdoba reprezentativního příkladu podle § 91 zákona č. 257/2016 Sb.). Uvádí, které náklady jsou v RPSN zahrnuty (včetně poplatku za vklad zástavního práva) a které ne (vklad vlastnického práva, § 133).

**Limity ČNB a bonita**
- LTV s limitem 80 %, resp. 90 % pro žadatele do 36 let.
- U investičních nemovitostí doporučení ČNB od 1. 4. 2026: LTV 70 % a DTI 7.
- DSTI a DTI informativně, protože limity ČNB jsou pro vlastní bydlení deaktivované.
- Odhad maximální výše úvěru podle příjmu.

**Rizika a úspory**
- Stresový test po skončení fixace (sazba −1 až +3 p. b.).
- Mimořádné splátky v režimu zkrácení doby nebo snížení splátky. Kalkulačka upozorní na limit 25 % ročně bez sankce a na strop náhrady nákladů (§ 117 a § 117a).
- Daňový odpočet úroků podle § 15 ZDP, limit 150 000 Kč ročně.

**Plánování koupě**
- Jednorázové náklady koupě a doporučená finanční rezerva.
- Srovnání nájmu a hypotéky.

**Přehledy a export**
- Graf průběhu splácení a splátkový kalendář po letech i po měsících.
- Export kalendáře do CSV a tisk do PDF.
- Informační sekce:
  - ESIS a lhůta na rozmyšlenou,
  - předčasné splacení,
  - pojištění,
  - státní podpora,
  - postup sjednání a potřebné doklady,
  - slovník pojmů,
  - kde hledat pomoc.

Výpočet probíhá jen v prohlížeči a žádná data se nikam neodesílají. Zadané hodnoty se pro pohodlí ukládají do `localStorage`.

## Struktura

```
start.bat          spuštění serveru
server.ps1         statický HTTP server (PowerShell HttpListener)
public/index.html  uživatelské rozhraní
public/styles.css  vzhled (světlý/tmavý režim, mobil, tisk)
public/js/config.js  legislativní a tržní parametry na jednom místě (s datem platnosti)
public/js/calc.js    výpočetní jádro (čisté funkce)
public/js/app.js     napojení formuláře a vykreslení výsledků
public/js/info.js    informační texty
public/tests.html    testy výpočetního jádra
```

## Aktualizace údajů

Limity ČNB, daňové limity, poplatky a průměrné sazby jsou v souboru `public/js/config.js`, údaje jsou platné k 27. 10. 2026. Při změně legislativy nebo trhu upravte hodnoty a datum `validAt`.

## Zdroje

- Zákon č. 257/2016 Sb., o spotřebitelském úvěru: § 91, § 111, § 117, § 117a, § 133 a příloha č. 1 (https://www.zakonyprolidi.cz/cs/2016-257)
- ČNB, stanovení horní hranice úvěrových ukazatelů (https://www.cnb.cz/cs/financni-stabilita/makroobezretnostni-politika/stanoveni-horni-hranice-uverovych-ukazatelu/)
- Zákon č. 586/1992 Sb., o daních z příjmů, § 15 odst. 3
- ČÚZK, sazby správních poplatků (https://cuzk.gov.cz/Katastr-nemovitosti/Poplatky/Sazby-spravnich-poplatku.aspx)
- Swiss Life Hypoindex, říjen 2026

## Upozornění

Výsledky jsou orientační. Nejde o nabídku úvěru, předsmluvní informace (ESIS) ani o finanční poradenství.
