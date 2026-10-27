/*
 * Informační sekce „Co byste měli vědět“. Obsah je v HTML (jen statický text z tohoto souboru).
 */
(function () {
  'use strict';

  var CFG = window.HK_CONFIG;
  var kc = function (v) { return new Intl.NumberFormat('cs-CZ').format(v) + ' Kč'; };

  var items = [
    {
      title: 'RPSN a reprezentativní příklad',
      open: true,
      body:
        '<p><strong>RPSN</strong> (roční procentní sazba nákladů) vyjadřuje celkové náklady úvěru v procentech ročně – kromě úroku zahrnuje i povinné poplatky a pojištění. Pro srovnání nabídek je vhodnější než samotná úroková sazba.</p>' +
        '<p>Pokud věřitel v reklamě uvede jakýkoli číselný údaj o ceně úvěru, musí podle § 91 zákona č. 257/2016 Sb. uvést také RPSN, úrokovou sazbu, celkovou výši úvěru, výši splátek, celkovou splatnou částku a dobu trvání formou reprezentativního příkladu.</p>' +
        '<p>Do RPSN se zahrnuje i poplatek za návrh na vklad zástavního práva. Nezahrnuje se poplatek za vklad vlastnického práva do katastru ani náklady, které byste platili i bez úvěru.</p>' +
        '<p>Kalkulačka není reklamou věřitele, proto výsledek označuje jako <em>modelový příklad</em> – obsahuje stejné údaje jako reprezentativní příklad.</p>'
    },
    {
      title: 'ESIS a ' + CFG.law.reflectionDays + 'denní lhůta na rozmyšlenou',
      body:
        '<p>Před uzavřením smlouvy musí věřitel předat <strong>ESIS</strong> (Evropský standardizovaný informační přehled) s konkrétními podmínkami úvěru – je to nejlepší podklad pro srovnání bank.</p>' +
        '<p>Závazný návrh smlouvy o úvěru na bydlení nesmí banka <strong>' + CFG.law.reflectionDays + ' dní</strong> změnit ani odvolat (§ 111). Máte tak čas nabídky porovnat a v klidu se rozhodnout.</p>' +
        '<p>Pozor: u úvěru na bydlení zákon neposkytuje obecné právo odstoupit od již uzavřené smlouvy do 14 dnů – rozmýšlejte se tedy před podpisem.</p>'
    },
    {
      title: 'Předčasné a mimořádné splacení',
      body:
        '<p>Bez jakékoli náhrady můžete úvěr splatit (§ 117 zákona č. 257/2016 Sb.):</p>' +
        '<ul>' +
        '<li>do 3 měsíců od oznámení nové sazby (konec fixace) a v období bez pevné sazby,</li>' +
        '<li>až ' + CFG.law.freePrepaymentShare + ' % celkové výše úvěru ročně, v měsíci před výročím smlouvy,</li>' +
        '<li>při prodeji nemovitosti po 24 měsících od uzavření smlouvy,</li>' +
        '<li>při vypořádání společného jmění manželů po 24 měsících,</li>' +
        '<li>při úmrtí, dlouhodobé nemoci či invaliditě dlužníka nebo jeho manžela/partnera,</li>' +
        '<li>z plnění pojištění schopnosti splácet.</li>' +
        '</ul>' +
        '<p>V ostatních případech smí banka požadovat jen skutečné náklady (administrativa do ' + kc(CFG.law.prepaymentAdminMax) + ' a úrokový rozdíl podle § 117a), celkem nejvýše ' + String(CFG.law.prepaymentCapPerYear).replace('.', ',') + ' % předčasně splacené částky za každý započatý rok zbývající do konce fixace, max. ' + CFG.law.prepaymentCapMax + ' %. Platí pro smlouvy uzavřené od ' + CFG.law.freePrepaymentFrom + ' a pro starší smlouvy od první nové fixace po tomto datu.</p>'
    },
    {
      title: 'Limity ČNB: LTV, DTI, DSTI',
      body:
        '<ul>' +
        '<li><strong>LTV</strong> – poměr úvěru k hodnotě zajištění: max. ' + CFG.cnb.ltv.standard + ' %, pro žadatele mladší ' + CFG.cnb.ltv.youngAgeLimit + ' let max. ' + CFG.cnb.ltv.young + ' % (závazný limit).</li>' +
        '<li><strong>DTI</strong> – celkový dluh / roční čistý příjem a <strong>DSTI</strong> – splátky / měsíční čistý příjem: limity jsou pro vlastní bydlení deaktivované, banky je ale při posouzení bonity sledují.</li>' +
        '<li><strong>Investiční nemovitosti</strong> (pronájem, třetí a další byt): od 1. 4. 2026 ČNB doporučuje LTV max. ' + CFG.cnb.ltv.investment + ' % a DTI max. ' + CFG.cnb.dti.investment + '.</li>' +
        '</ul>' +
        '<p>Aktuální stav: <a href="https://www.cnb.cz/cs/financni-stabilita/makroobezretnostni-politika/stanoveni-horni-hranice-uverovych-ukazatelu/" target="_blank" rel="noopener">cnb.cz – horní hranice úvěrových ukazatelů</a>.</p>'
    },
    {
      title: 'Pojištění',
      body:
        '<p><strong>Pojištění nemovitosti</strong> je u hypotéky prakticky vždy povinné – pojistné plnění se vinkuluje ve prospěch banky. Pojistku můžete obvykle sjednat i jinde než u banky.</p>' +
        '<p><strong>Pojištění schopnosti splácet</strong> (nebo životní pojištění) bývá dobrovolné, ale banky za něj často dávají slevu ze sazby. Porovnejte, zda sleva převýší cenu pojištění. Pokud je pojištění podmínkou úvěru, musí být zahrnuto v RPSN.</p>'
    },
    {
      title: 'Daňový odpočet úroků',
      body:
        '<p>Zaplacené úroky z úvěru na vlastní bydlení si můžete odečíst ze základu daně (§ 15 odst. 3 zákona o daních z příjmů) – nejvýše <strong>' + kc(CFG.tax.interestLimit) + ' ročně</strong> na domácnost, pokud bytovou potřebu řešíte od 1. 1. 2021 (dříve 300 000 Kč). Při sazbě daně 15 % to znamená úsporu až ' + kc(CFG.tax.interestLimit * 0.15) + ' ročně.</p>' +
        '<p>Potvrzení o zaplacených úrocích vystaví banka; uplatníte je v ročním zúčtování u zaměstnavatele nebo v daňovém přiznání. Od roku 2026 se odpočet rozšiřuje i na anuity členů bytových družstev.</p>'
    },
    {
      title: 'Státní podpora a alternativy',
      body:
        '<ul>' +
        '<li><strong>Stavební spoření</strong> – státní podpora 5 % z ročních vkladů, max. 1 000 Kč ročně. Úvěr ze stavebního spoření se hodí i na menší částky a rekonstrukce.</li>' +
        '<li><strong>Nová zelená úsporám</strong> – bezúročný úvěr na renovace rodinných domů (až 2 mil. Kč na komplexní renovaci), dotace pro zranitelné domácnosti.</li>' +
        '<li><strong>Státní fond podpory investic</strong> – aktuální programy a jejich dostupnost ověřte na <a href="https://www.sfpi.cz/" target="_blank" rel="noopener">sfpi.cz</a>.</li>' +
        '</ul>' +
        '<p class="small">Daň z nabytí nemovitých věcí byla zrušena (vklady od 1. 12. 2019), při koupi ji tedy neplatíte.</p>'
    },
    {
      title: 'Jak probíhá sjednání hypotéky',
      body:
        '<ol style="padding-left:1.2em;margin:.4em 0">' +
        '<li>Spočítejte si rozpočet a vlastní zdroje (včetně rezervy).</li>' +
        '<li>Porovnejte nabídky bank, vyžádejte si ESIS.</li>' +
        '<li>Podejte žádost a doložte příjmy; banka ověří bonitu a registry dlužníků.</li>' +
        '<li>Odhad nemovitosti – určí hodnotu zajištění pro výpočet LTV.</li>' +
        '<li>Schválení, podpis úvěrové a zástavní smlouvy, pojištění nemovitosti.</li>' +
        '<li>Vklad zástavního práva do katastru, splnění podmínek čerpání.</li>' +
        '<li>Čerpání úvěru (často přes úschovu) a zahájení splácení.</li>' +
        '</ol>'
    },
    {
      title: 'Doklady, které budete potřebovat',
      body:
        '<ul>' +
        '<li>Doklad totožnosti (občanský průkaz, případně druhý doklad).</li>' +
        '<li>Potvrzení o příjmu od zaměstnavatele nebo daňové přiznání (OSVČ) a výpisy z účtu.</li>' +
        '<li>Kupní smlouva nebo smlouva o smlouvě budoucí, rezervační smlouva.</li>' +
        '<li>Výpis z katastru nemovitostí, u novostavby stavební povolení a rozpočet.</li>' +
        '<li>Doklad o vlastních zdrojích.</li>' +
        '</ul>'
    },
    {
      title: 'Slovník pojmů',
      body:
        '<ul>' +
        '<li><strong>Fixace</strong> – období, po které se nemění úroková sazba.</li>' +
        '<li><strong>Anuitní splátka</strong> – stejná měsíční splátka; na začátku tvoří většinu úroky, později jistina.</li>' +
        '<li><strong>Jistina</strong> – dosud nesplacená část půjčené částky.</li>' +
        '<li><strong>Refixace</strong> – stanovení nové sazby po konci fixace.</li>' +
        '<li><strong>Refinancování</strong> – převedení hypotéky k jiné bance, nejlépe ke konci fixace.</li>' +
        '<li><strong>Úschova</strong> – bezpečné předání kupní ceny přes advokáta, notáře nebo banku.</li>' +
        '</ul>'
    },
    {
      title: 'Kde hledat pomoc',
      body:
        '<ul>' +
        '<li><a href="https://www.financniarbitr.cz/" target="_blank" rel="noopener">Finanční arbitr</a> – bezplatné řešení sporů se spotřebitelskými úvěry.</li>' +
        '<li><a href="https://www.cnb.cz/cs/dohled-financni-trh/ochrana-spotrebitele/" target="_blank" rel="noopener">ČNB – ochrana spotřebitele</a> – stížnosti na banky a zprostředkovatele, registr oprávněných zprostředkovatelů.</li>' +
        '<li>Bezplatné dluhové poradny – pokud byste se dostali do potíží se splácením, řešte to s bankou včas.</li>' +
        '</ul>'
    }
  ];

  document.addEventListener('DOMContentLoaded', function () {
    var grid = document.getElementById('infoGrid');
    grid.innerHTML = items.map(function (it) {
      return '<details class="info"' + (it.open ? ' open' : '') + '><summary>' + it.title + '</summary>' + it.body + '</details>';
    }).join('');
  });
})();
