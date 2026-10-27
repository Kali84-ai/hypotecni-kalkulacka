/*
 * Napojení formuláře na výpočetní jádro (calc.js) a vykreslení výsledků.
 * Legislativní a tržní parametry se berou z config.js (window.HK_CONFIG).
 */
(function () {
  'use strict';

  var C = window.HypoCalc;
  var CFG = window.HK_CONFIG;
  var $ = function (id) { return document.getElementById(id); };

  var fmtKc = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 });
  var fmtPct1 = new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  var fmtPct2 = new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function kc(v) { return fmtKc.format(Math.round(v)) + ' Kč'; }
  function pct(v) { return fmtPct1.format(v) + ' %'; }
  function pct2(v) { return fmtPct2.format(v) + ' %'; }
  function years(n) { return n === 1 ? '1 rok' : (n >= 2 && n <= 4 ? n + ' roky' : n + ' let'); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- Vstupy ---------- */

  // Čísla zadávaná s mezerami (1 000 000) a desetinnou čárkou
  function num(id) {
    var el = $(id);
    if (!el) return 0;
    var v = parseFloat(String(el.value).replace(/\s| /g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'));
    return isFinite(v) ? v : 0;
  }
  function pos(id) { return Math.max(0, num(id)); }
  function checked(id) { return $(id) && $(id).checked; }

  function formatInput(el) {
    if (el.dataset.format !== 'kc') return;
    var v = parseFloat(String(el.value).replace(/\s| /g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'));
    if (isFinite(v)) el.value = fmtKc.format(Math.round(v));
  }

  function readInputs() {
    var price = Math.max(0, num('price'));
    var own = Math.min(Math.max(0, num('own')), price);
    return {
      price: price,
      own: own,
      loan: Math.max(0, price - own),
      collateral: num('collateral') > 0 ? num('collateral') : price,
      purpose: $('purpose').value,
      age: pos('age'),
      rate: pos('rate'),
      fixYears: parseInt($('fix').value, 10) || 5,
      termYears: Math.min(50, Math.max(1, Math.round(num('term')) || 1)),
      feeProcessing: pos('feeProcessing'),
      feeAppraisal: pos('feeAppraisal'),
      feeAccount: pos('feeAccount'),
      insProperty: pos('insProperty'),
      insPropertyApr: checked('insPropertyApr'),
      insLife: pos('insLife'),
      insLifeApr: checked('insLifeApr'),
      income: pos('income'),
      otherPayments: pos('otherPayments'),
      otherDebt: pos('otherDebt'),
      extraYearly: pos('extraYearly'),
      extraMode: $('extraMode').value === 'payment' ? 'payment' : 'term',
      agentFee: pos('agentFee'),
      taxRate: parseFloat($('taxRate').value) || 0.15,
      rent: pos('rent'),
      appreciation: num('appreciation')
    };
  }

  /* ---------- Výpočet ---------- */

  function compute(i) {
    var months = i.termYears * 12;
    var fixMonths = Math.min(i.fixYears * 12, months);

    // Náklady zahrnované do RPSN (§ 133 a příloha č. 1 – povinné náklady známé věřiteli; nezahrnují se poplatky katastru)
    var monthlyAprCosts = i.feeAccount + (i.insPropertyApr ? i.insProperty / 12 : 0) + (i.insLifeApr ? i.insLife : 0);
    // Poplatek za vklad zástavního práva vzniká jen kvůli úvěru → patří do RPSN (§ 133 vylučuje jen vklad vlastnického práva)
    var upfrontAprCosts = i.feeProcessing + i.feeAppraisal + (i.loan > 0 ? CFG.fees.cadastre : 0);

    var payment = C.annuity(i.loan, i.rate, months);
    var rows = C.schedule({ principal: i.loan, rate: i.rate, months: months });
    var yrs = C.yearly(rows);
    var totalInterest = C.sum(rows, 'interest');
    var totalFees = upfrontAprCosts + monthlyAprCosts * rows.length;
    var totalPayable = i.loan + totalInterest + totalFees;
    var aprValue = i.loan > 0 && months > 0 ? C.aprRounded(i.loan, i.rate, months, { upfront: upfrontAprCosts, monthly: monthlyAprCosts }) : 0;

    // Mimořádné splátky
    var extraRows = i.extraYearly > 0 ? C.schedule({ principal: i.loan, rate: i.rate, months: months, extraYearly: i.extraYearly, extraMode: i.extraMode }) : null;

    // Konec fixace
    var balanceFix = C.balanceAfter(i.loan, i.rate, months, fixMonths);
    var paidFix = rows.slice(0, fixMonths);
    var interestFix = C.sum(paidFix, 'interest');
    var principalFix = C.sum(paidFix, 'principal');

    // Ukazatele ČNB
    var ltv = i.collateral > 0 ? i.loan / i.collateral * 100 : 0;
    var monthlyAllCosts = payment + i.feeAccount + i.insLife + i.insProperty / 12;
    var dsti = i.income > 0 ? (payment + i.otherPayments) / i.income * 100 : null;
    var dti = i.income > 0 ? (i.loan + i.otherDebt) / (i.income * 12) : null;

    var tax = C.taxSavings(yrs, CFG.tax.interestLimit, i.taxRate);

    return {
      months: months, fixMonths: fixMonths, payment: payment, rows: rows, yrs: yrs,
      totalInterest: totalInterest, totalFees: totalFees, totalPayable: totalPayable,
      monthlyAprCosts: monthlyAprCosts, upfrontAprCosts: upfrontAprCosts, apr: aprValue,
      extraRows: extraRows, balanceFix: balanceFix, interestFix: interestFix, principalFix: principalFix,
      ltv: ltv, dsti: dsti, dti: dti, monthlyAllCosts: monthlyAllCosts, tax: tax
    };
  }

  /* ---------- Varování ---------- */

  function ltvLimit(i) {
    if (i.purpose === 'investment') return CFG.cnb.ltv.investment;
    return i.age > 0 && i.age < CFG.cnb.ltv.youngAgeLimit ? CFG.cnb.ltv.young : CFG.cnb.ltv.standard;
  }

  function alerts(i, r) {
    var out = [];
    var limit = ltvLimit(i);
    if (i.loan <= 0) out.push(['warn', 'Výše úvěru je nulová – vlastní zdroje pokrývají celou cenu nemovitosti.']);
    if (i.loan > 0 && i.loan < CFG.market.minLoan) out.push(['warn', 'Banky obvykle poskytují hypotéku od ' + kc(CFG.market.minLoan) + '. Pro nižší částky zvažte úvěr ze stavebního spoření nebo neúčelový úvěr.']);
    if (r.ltv > limit) {
      out.push(['bad', 'LTV ' + pct(r.ltv) + ' překračuje ' + (i.purpose === 'investment' ? 'doporučení' : 'limit') + ' ČNB ' + limit + ' % pro váš případ. Banka bude požadovat více vlastních zdrojů (cca ' + kc(i.loan - i.collateral * limit / 100) + ' navíc) nebo zajištění další nemovitostí.']);
    } else if (r.ltv > CFG.market.ltvPriceStep) {
      out.push(['warn', 'Při LTV nad ' + CFG.market.ltvPriceStep + ' % banky obvykle účtují vyšší úrokovou sazbu (přirážka cca ' + CFG.market.ltvPremiumNote + ').']);
    }
    if (i.termYears > CFG.cnb.maxTermYears) out.push(['warn', 'Splatnost nad ' + CFG.cnb.maxTermYears + ' let většina bank neposkytuje. Delší splatnost snižuje splátku, ale výrazně zvyšuje zaplacené úroky.']);
    if (i.termYears < 5) out.push(['warn', 'Banky obvykle poskytují hypotéku se splatností nejméně 5 let.']);
    if (i.age > 0 && i.age + i.termYears > CFG.market.maxAgeAtEnd) out.push(['warn', 'Úvěr byste spláceli do ' + (i.age + i.termYears) + ' let věku. Banky obvykle vyžadují splacení do ' + CFG.market.maxAgeAtEnd + ' let; zvažte kratší splatnost nebo spolužadatele.']);
    if (r.dsti !== null && r.dsti > CFG.cnb.dsti.warn) out.push(['bad', 'Splátky dluhů tvoří ' + pct(r.dsti) + ' čistého příjmu (DSTI). Banky běžně požadují do ' + CFG.cnb.dsti.warn + ' % a hypotéku v této výši pravděpodobně neposkytnou.']);
    else if (r.dsti !== null && r.dsti > CFG.cnb.dsti.comfort) out.push(['warn', 'Splátky dluhů tvoří ' + pct(r.dsti) + ' čistého příjmu. Doporučujeme mít rezervu – za bezpečné se považuje do cca ' + CFG.cnb.dsti.comfort + ' %.']);
    var dtiLimit = i.purpose === 'investment' ? CFG.cnb.dti.investment : CFG.cnb.dti.bankPractice;
    if (r.dti !== null && dtiLimit && r.dti > dtiLimit) out.push([i.purpose === 'investment' ? 'bad' : 'warn', 'Celkový dluh odpovídá ' + fmtPct1.format(r.dti) + '× ročního čistého příjmu (DTI). ' + (i.purpose === 'investment' ? 'ČNB pro investiční úvěry doporučuje max. ' + fmtPct1.format(dtiLimit) + '×.' : 'Limit ČNB je deaktivován, banky ale obvykle posuzují hranici kolem ' + fmtPct1.format(dtiLimit) + '×.')]);
    if (i.fixYears * 12 >= r.months) out.push(['warn', 'Délka fixace je stejná nebo delší než splatnost – úvěr bude splacen v rámci fixace.']);
    if (!out.length && i.loan > 0) out.push(['ok', 'Zadané parametry nepřekračují limity ČNB zohledněné v kalkulačce. Nejde o posouzení vaší úvěruschopnosti.']);
    return out;
  }

  /* ---------- Vykreslení ---------- */

  function renderCards(i, r) {
    $('outPayment').textContent = kc(r.payment);
    $('outPaymentSub').textContent = 'vč. poplatků a pojištění ' + kc(r.monthlyAllCosts) + ' měsíčně';
    $('outApr').textContent = isFinite(r.apr) ? pct(r.apr) : '–';
    $('outAprSub').textContent = 'úroková sazba ' + pct2(i.rate) + ' p.a.';
    $('outTotal').textContent = kc(r.totalPayable);
    $('outTotalSub').textContent = r.rows.length + ' splátek';
    $('outOver').textContent = kc(r.totalInterest + r.totalFees);
    $('outOverSub').textContent = 'úroky ' + kc(r.totalInterest) + ' + náklady ' + kc(r.totalFees);
    $('outLoan').textContent = kc(i.loan);
    $('outLtv').textContent = pct(r.ltv);
  }

  function renderAlerts(i, r) {
    $('alerts').innerHTML = alerts(i, r).map(function (a) { return '<li class="' + a[0] + '">' + esc(a[1]) + '</li>'; }).join('');
  }

  function renderRepExample(i, r) {
    if (i.loan <= 0) { $('repText').textContent = 'Zadejte výši úvěru.'; return; }
    var costs = ['poplatek za návrh na vklad zástavního práva do katastru ' + kc(CFG.fees.cadastre)];
    if (i.feeProcessing) costs.push('poplatek za zpracování ' + kc(i.feeProcessing));
    if (i.feeAppraisal) costs.push('odhad nemovitosti ' + kc(i.feeAppraisal));
    if (i.feeAccount) costs.push('vedení úvěrového účtu ' + kc(i.feeAccount) + ' měsíčně');
    if (i.insPropertyApr && i.insProperty) costs.push('pojištění nemovitosti ' + kc(i.insProperty) + ' ročně');
    if (i.insLifeApr && i.insLife) costs.push('pojištění schopnosti splácet ' + kc(i.insLife) + ' měsíčně');
    var notIncluded = ['poplatek za návrh na vklad vlastnického práva do katastru (' + kc(CFG.fees.cadastre) + ')', 'náklady, které byste platili i bez úvěru'];
    if (!i.insPropertyApr && i.insProperty) notIncluded.push('pojištění nemovitosti (pokud je podmínkou úvěru, RPSN je podhodnocená)');
    if (!i.insLifeApr && i.insLife) notIncluded.push('pojištění schopnosti splácet (není podmínkou úvěru)');

    var fixText = i.fixYears * 12 >= r.months
      ? 'pevná po celou dobu trvání úvěru'
      : 'pevná po dobu ' + years(i.fixYears) + '; pro výpočet RPSN se předpokládá, že po skončení fixace bude sazba stejná jako v okamžiku výpočtu, ne nižší než sjednaná pevná sazba';

    $('repText').innerHTML =
      '<p><strong>Modelový příklad:</strong> Celková výše úvěru ' + kc(i.loan) +
      ', úroková sazba ' + pct2(i.rate) + ' p.a. (' + fixText + '), doba trvání úvěru ' + years(i.termYears) +
      ', počet měsíčních anuitních splátek ' + r.rows.length + ', výše měsíční splátky ' + kc(r.payment) +
      ', <strong>RPSN ' + pct(r.apr) + '</strong>, celková částka splatná spotřebitelem ' + kc(r.totalPayable) + '.</p>' +
      '<p>Úvěr je zajištěn zástavním právem k nemovitosti v hodnotě ' + kc(i.collateral) + ' (LTV ' + pct(r.ltv) + '). ' +
      'Do RPSN a celkové splatné částky jsou zahrnuty: ' + (costs.length ? esc(costs.join(', ')) : 'žádné další poplatky') + '. ' +
      'Nejsou zahrnuty: ' + esc(notIncluded.join(', ')) + '.</p>' +
      '<p class="small muted">Úvěr se čerpá jednorázově v plné výši. Po skončení fixace se úroková sazba může změnit, a tím i výše splátky a RPSN.</p>';
  }

  function statusBadge(cls, text) { return '<span class="status ' + cls + '">' + esc(text) + '</span>'; }

  function renderIndicators(i, r) {
    var limit = ltvLimit(i);
    var ltvCls = r.ltv > limit ? 'bad' : (r.ltv > CFG.market.ltvPriceStep ? 'warn' : 'ok');
    var rowsHtml = '<tr><td class="text"><strong>LTV</strong><br><span class="small muted">výše úvěru / hodnota zajištění</span></td><td>' + pct(r.ltv) +
      '</td><td>max. ' + limit + ' %' + (i.purpose === 'investment' ? ' (investiční)' : (limit === CFG.cnb.ltv.young ? ' (do ' + CFG.cnb.ltv.youngAgeLimit + ' let)' : '')) +
      '</td><td>' + statusBadge(ltvCls, ltvCls === 'ok' ? 'v pořádku' : (ltvCls === 'warn' ? 'vyšší sazba' : 'nad limitem')) + '</td></tr>';

    if (r.dsti === null) {
      rowsHtml += '<tr><td class="text"><strong>DSTI</strong><br><span class="small muted">splátky dluhů / čistý měsíční příjem</span></td><td>–</td><td>banky cca ' + CFG.cnb.dsti.warn + ' %</td><td>' + statusBadge('info', 'zadejte příjem') + '</td></tr>';
      rowsHtml += '<tr><td class="text"><strong>DTI</strong><br><span class="small muted">celkový dluh / roční čistý příjem</span></td><td>–</td><td>–</td><td>' + statusBadge('info', 'zadejte příjem') + '</td></tr>';
    } else {
      var dstiCls = r.dsti > CFG.cnb.dsti.warn ? 'bad' : (r.dsti > CFG.cnb.dsti.comfort ? 'warn' : 'ok');
      rowsHtml += '<tr><td class="text"><strong>DSTI</strong><br><span class="small muted">splátky dluhů / čistý měsíční příjem</span></td><td>' + pct(r.dsti) +
        '</td><td>banky cca ' + CFG.cnb.dsti.warn + ' %</td><td>' + statusBadge(dstiCls, dstiCls === 'ok' ? 'v pořádku' : (dstiCls === 'warn' ? 'napjaté' : 'vysoké')) + '</td></tr>';
      var dtiLimit = i.purpose === 'investment' ? CFG.cnb.dti.investment : CFG.cnb.dti.bankPractice;
      var dtiCls = dtiLimit && r.dti > dtiLimit ? (i.purpose === 'investment' ? 'bad' : 'warn') : 'ok';
      rowsHtml += '<tr><td class="text"><strong>DTI</strong><br><span class="small muted">celkový dluh / roční čistý příjem</span></td><td>' + fmtPct1.format(r.dti) + '×' +
        '</td><td>' + (i.purpose === 'investment' ? 'max. ' + fmtPct1.format(dtiLimit) + '× (ČNB doporučení)' : 'banky cca ' + fmtPct1.format(dtiLimit) + '×') + '</td><td>' + statusBadge(dtiCls, dtiCls === 'ok' ? 'v pořádku' : 'vysoké') + '</td></tr>';
    }
    $('indicators').innerHTML = rowsHtml;
    $('cnbNote').textContent = CFG.cnb.note;

    // Kolik si mohu půjčit při daném příjmu
    if (i.income > 0) {
      var maxPay = Math.max(0, i.income * CFG.cnb.dsti.warn / 100 - i.otherPayments);
      var byDsti = C.principalFromPayment(maxPay, i.rate, r.months);
      var byDti = CFG.cnb.dti.bankPractice ? i.income * 12 * (i.purpose === 'investment' ? CFG.cnb.dti.investment : CFG.cnb.dti.bankPractice) - i.otherDebt : Infinity;
      var byLtv = i.collateral * limit / 100;
      var max = Math.max(0, Math.min(byDsti, byDti, byLtv));
      $('affordability').innerHTML = 'Orientační maximální výše úvěru při vašem příjmu: <strong>' + kc(max) + '</strong> ' +
        '<span class="muted">(nejpřísnější z: splátka do ' + CFG.cnb.dsti.warn + ' % příjmu → ' + kc(byDsti) +
        (isFinite(byDti) ? '; DTI → ' + kc(Math.max(0, byDti)) : '') + '; LTV → ' + kc(byLtv) + ')</span>';
    } else {
      $('affordability').textContent = 'Zadejte čistý měsíční příjem domácnosti a zjistíte, kolik si můžete orientačně půjčit.';
    }
  }

  function renderStress(i, r) {
    if (r.fixMonths >= r.months || i.loan <= 0) {
      $('stress').innerHTML = '<tr><td class="text" colspan="4">Úvěr bude splacen v rámci fixace – riziko změny sazby nevzniká.</td></tr>';
      $('fixSummary').textContent = '';
      return;
    }
    var remaining = r.months - r.fixMonths;
    $('fixSummary').innerHTML = 'Za ' + years(i.fixYears) + ' fixace zaplatíte na úrocích <strong>' + kc(r.interestFix) + '</strong> a splatíte jistinu <strong>' + kc(r.principalFix) +
      '</strong>. Po skončení fixace zbývá splatit <strong>' + kc(r.balanceFix) + '</strong> za ' + years(Math.round(remaining / 12)) + '.';
    $('stress').innerHTML = CFG.stressSteps.map(function (d) {
      var rate = Math.max(0, i.rate + d);
      var pay = C.annuity(r.balanceFix, rate, remaining);
      var diff = pay - r.payment;
      var cls = d < 0 ? 'ok' : (d === 0 ? 'info' : (d >= 2 ? 'bad' : 'warn'));
      var share = i.income > 0 ? pct((pay + i.otherPayments) / i.income * 100) : '–';
      return '<tr><td>' + statusBadge(cls, (d > 0 ? '+' : '') + fmtPct1.format(d) + ' p. b.') + '</td><td>' + pct2(rate) + '</td><td>' + kc(pay) +
        '</td><td>' + (diff >= 0 ? '+' : '') + kc(diff) + '</td><td>' + share + '</td></tr>';
    }).join('');
  }

  function renderExtra(i, r) {
    var box = $('extraResult');
    if (!r.extraRows) {
      box.innerHTML = '<span class="muted">Zadejte částku mimořádné splátky ve formuláři a uvidíte, kolik ušetříte. Bez sankce lze ročně splatit až ' + CFG.law.freePrepaymentShare + ' % celkové výše úvěru, a to v měsíci před výročím smlouvy (u smluv uzavřených či refixovaných od ' + CFG.law.freePrepaymentFrom + ').</span>';
      return;
    }
    var baseInterest = r.totalInterest;
    var newInterest = C.sum(r.extraRows, 'interest');
    var saved = baseInterest - newInterest;
    if (saved < 1) {
      box.innerHTML = '<span class="muted">Mimořádná splátka se při této splatnosti neuplatní – úvěr je v té době už splacen.</span>';
      return;
    }
    var html = 'Úspora na úrocích: <strong>' + kc(saved) + '</strong>. ';
    if (i.extraMode === 'term') {
      var m = r.extraRows.length;
      var shorter = r.months - m;
      html += 'Úvěr splatíte o <strong>' + years(Math.floor(shorter / 12)) + ' a ' + (shorter % 12) + ' měs.</strong> dříve (za ' + years(Math.floor(m / 12)) + ' a ' + (m % 12) + ' měs.).';
    } else {
      var last = r.extraRows[r.extraRows.length - 1];
      var idx = Math.min(r.extraRows.length - 1, 12 * 5);
      var y5 = r.extraRows[idx];
      html += 'Splátka se postupně snižuje – v ' + (Math.floor(idx / 12) + 1) + '. roce na <strong>' + kc(y5.payment) + '</strong> (původně ' + kc(r.payment) + ').';
      if (last.month < r.months) html += ' Úvěr bude splacen již v ' + Math.ceil(last.month / 12) + '. roce.';
    }
    var limit = i.loan * CFG.law.freePrepaymentShare / 100;
    if (i.extraYearly > limit) {
      // První mimořádná splátka je po 12 měsících → do konce fixace zbývá (fixace − 1) započatých let
      var cap = Math.min(Math.max(1, i.fixYears - 1) * CFG.law.prepaymentCapPerYear, CFG.law.prepaymentCapMax);
      html += '<br><span class="status warn">pozor</span> Částka přesahuje ' + CFG.law.freePrepaymentShare + ' % celkové výše úvěru ročně. Za část nad tento limit může banka mimo konec fixace požadovat jen skutečné náklady (administrativa do ' + kc(CFG.law.prepaymentAdminMax) + ' a úrokový rozdíl podle § 117a), celkem nejvýše ' +
        fmtPct2.format(CFG.law.prepaymentCapPerYear) + ' % předčasně splacené částky za každý započatý rok zbývající do konce fixace, max. ' + CFG.law.prepaymentCapMax + ' % – u první mimořádné splátky tedy až ' + kc((i.extraYearly - limit) * cap / 100) + '.';
    }
    box.innerHTML = html;
  }

  function renderTax(i, r) {
    var first = r.tax[0] || 0;
    var fix = r.tax.slice(0, i.fixYears).reduce(function (a, b) { return a + b; }, 0);
    var total = r.tax.reduce(function (a, b) { return a + b; }, 0);
    $('taxResult').innerHTML =
      '<tr><td class="text">1. rok splácení</td><td>' + kc(first) + '</td></tr>' +
      '<tr><td class="text">Za dobu fixace (' + years(i.fixYears) + ')</td><td>' + kc(fix) + '</td></tr>' +
      '<tr><td class="text">Za celou dobu splácení</td><td>' + kc(total) + '</td></tr>';
    $('taxNote').textContent = 'Úroky lze odečíst do ' + kc(CFG.tax.interestLimit) + ' ročně na domácnost, pokud jste bytovou potřebu nabyli od 1. 1. 2021 (dříve 300 000 Kč), pouze při financování vlastní bytové potřeby; při úročení jen část roku se limit krátí. Výpočet předpokládá sazbu daně ' + Math.round(i.taxRate * 100) + ' %' + (i.taxRate > 0.15 ? ' (ve skutečnosti se uplatní jen na příjmy nad hranicí)' : '') + ' a dostatečný základ daně.';
    $('taxBlock').hidden = i.purpose === 'investment';
    $('taxInvestNote').hidden = i.purpose !== 'investment';
  }

  function renderUpfront(i, r) {
    var items = [
      ['Vlastní zdroje (akontace)', i.own, 'rozdíl mezi cenou a výší úvěru'],
      ['Poplatek za zpracování úvěru', i.feeProcessing, 'mnoho bank dnes neúčtuje'],
      ['Odhad (ocenění) nemovitosti', i.feeAppraisal, 'často hradí banka nebo vrací'],
      ['Návrh na vklad vlastnického práva', CFG.fees.cadastre, 'správní poplatek katastru'],
      ['Návrh na vklad zástavního práva', CFG.fees.cadastre, 'správní poplatek katastru'],
      ['Ověření podpisů, výpisy z KN', CFG.fees.notaryEstimate, 'orientačně'],
      ['Pojištění nemovitosti (1. rok)', i.insProperty, 'povinné pro zástavu'],
      ['Provize realitní kanceláře', i.agentFee, 'pokud ji hradí kupující'],
      ['Daň z nabytí nemovitých věcí', 0, 'zrušena (návrhy na vklad od 12/2019)']
    ];
    var total = items.reduce(function (a, it) { return a + it[1]; }, 0);
    $('upfront').innerHTML = items.map(function (it) {
      return '<tr><td class="text">' + esc(it[0]) + '<br><span class="small muted">' + esc(it[2]) + '</span></td><td>' + kc(it[1]) + '</td></tr>';
    }).join('');
    $('upfrontTotal').textContent = kc(total);
    $('reserve').innerHTML = 'Doporučená finanční rezerva po koupi (min. ' + CFG.market.reserveMonths + ' měsíčních výdajů na bydlení): <strong>' + kc(r.monthlyAllCosts * CFG.market.reserveMonths) + '</strong>';
  }

  function renderRentVsBuy(i, r) {
    if (!i.rent || i.loan <= 0) {
      $('rentResult').innerHTML = '<span class="muted">Zadejte výši nájemného za srovnatelné bydlení.</span>';
      return;
    }
    var horizon = Math.min(i.termYears, 10);
    var paidInterest = C.sum(r.rows.slice(0, horizon * 12), 'interest');
    var fees = r.monthlyAprCosts * horizon * 12 + r.upfrontAprCosts;
    var rentTotal = 0, rent = i.rent;
    for (var y = 0; y < horizon; y++) { rentTotal += rent * 12; rent *= 1 + CFG.market.rentGrowth / 100; }
    var value = i.price * Math.pow(1 + i.appreciation / 100, horizon);
    var html = '<table><tbody>' +
      '<tr><td class="text">Zaplacené nájemné za ' + years(horizon) + ' (růst ' + CFG.market.rentGrowth + ' % ročně)</td><td>' + kc(rentTotal) + '</td></tr>' +
      '<tr><td class="text">Zaplacené úroky a poplatky hypotéky za ' + years(horizon) + '</td><td>' + kc(paidInterest + fees) + '</td></tr>' +
      '<tr><td class="text">Hodnota nemovitosti za ' + years(horizon) + ' (růst ' + fmtPct1.format(i.appreciation) + ' % ročně)</td><td>' + kc(value) + '</td></tr>' +
      '<tr><td class="text">Zbývající dluh za ' + years(horizon) + '</td><td>' + kc(C.balanceAfter(i.loan, i.rate, r.months, horizon * 12)) + '</td></tr>' +
      '</tbody></table>';
    var verdict = rentTotal > paidInterest + fees
      ? 'Nájemné by za tuto dobu převýšilo „ztracené“ náklady hypotéky (úroky a poplatky) o ' + kc(rentTotal - paidInterest - fees) + '.'
      : 'Úroky a poplatky hypotéky by za tuto dobu převýšily nájemné o ' + kc(paidInterest + fees - rentTotal) + '.';
    $('rentResult').innerHTML = html + '<p class="small">' + esc(verdict) + ' Nezahrnuje náklady údržby, fond oprav ani ušlý výnos z vlastních zdrojů.</p>';
  }

  /* ---------- Graf (SVG) ---------- */

  var chartData = null;

  function renderChart(i, r) {
    var svg = $('chart');
    var yrs = r.yrs;
    chartData = yrs;
    if (!yrs.length) { svg.innerHTML = ''; return; }
    var W = 760, H = 300, pl = 64, pr = 64, pt = 12, pb = 28;
    var cw = W - pl - pr, ch = H - pt - pb;
    var maxPay = Math.max.apply(null, yrs.map(function (y) { return y.interest + y.principal; })) * 1.08;
    var maxBal = i.loan * 1.02;
    var bw = cw / yrs.length;
    var parts = [];

    // Mřížka a osy
    for (var g = 0; g <= 4; g++) {
      var gy = pt + ch - ch * g / 4;
      parts.push('<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + gy + '" y2="' + gy + '" stroke="var(--border)" stroke-width="1"/>');
      parts.push('<text x="' + (pl - 6) + '" y="' + (gy + 4) + '" text-anchor="end" font-size="11" fill="var(--muted)">' + fmtKc.format(Math.round(maxPay * g / 4 / 1000)) + ' tis.</text>');
      parts.push('<text x="' + (W - pr + 6) + '" y="' + (gy + 4) + '" font-size="11" fill="var(--balance)">' + fmtKc.format(Math.round(maxBal * g / 4 / 1e6 * 10) / 10) + ' mil.</text>');
    }

    // Sloupce: jistina + úrok za rok
    yrs.forEach(function (y, idx) {
      var x = pl + idx * bw + bw * 0.12;
      var w = bw * 0.76;
      var hp = ch * y.principal / maxPay;
      var hi = ch * y.interest / maxPay;
      parts.push('<rect x="' + x + '" y="' + (pt + ch - hp) + '" width="' + w + '" height="' + hp + '" fill="var(--principal)" rx="1"/>');
      parts.push('<rect x="' + x + '" y="' + (pt + ch - hp - hi) + '" width="' + w + '" height="' + hi + '" fill="var(--interest)" rx="1"/>');
      if (yrs.length <= 15 || (idx + 1) % 5 === 0 || idx === 0) {
        parts.push('<text x="' + (x + w / 2) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="11" fill="var(--muted)">' + y.year + '</text>');
      }
    });

    // Konec fixace
    if (r.fixMonths < r.months) {
      var fx = pl + (r.fixMonths / 12) * bw;
      parts.push('<line x1="' + fx + '" x2="' + fx + '" y1="' + pt + '" y2="' + (pt + ch) + '" stroke="var(--text)" stroke-dasharray="4 4" stroke-width="1"/>');
      parts.push('<text x="' + (fx + 4) + '" y="' + (pt + 12) + '" font-size="11" fill="var(--text)">konec fixace</text>');
    }

    // Křivka zůstatku
    var pts = ['M' + pl + ' ' + (pt + ch - ch * i.loan / maxBal)];
    yrs.forEach(function (y, idx) { pts.push('L' + (pl + (idx + 1) * bw) + ' ' + (pt + ch - ch * y.balance / maxBal)); });
    parts.push('<path d="' + pts.join(' ') + '" fill="none" stroke="var(--balance)" stroke-width="2.5"/>');

    // Neviditelné zóny pro tooltip
    yrs.forEach(function (y, idx) {
      parts.push('<rect class="hit" data-i="' + idx + '" x="' + (pl + idx * bw) + '" y="' + pt + '" width="' + bw + '" height="' + ch + '" fill="transparent"/>');
    });

    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.innerHTML = parts.join('');
  }

  function bindChartTooltip() {
    var svg = $('chart'), tip = $('chartTip'), box = svg.parentNode;
    svg.addEventListener('mousemove', function (e) {
      var t = e.target;
      if (!t.classList || !t.classList.contains('hit') || !chartData) { tip.style.display = 'none'; return; }
      var y = chartData[+t.dataset.i];
      tip.innerHTML = '<strong>' + y.year + '. rok</strong><br>Jistina: ' + kc(y.principal) + '<br>Úroky: ' + kc(y.interest) + '<br>Zůstatek: ' + kc(y.balance);
      var rect = box.getBoundingClientRect();
      var x = e.clientX - rect.left + 12;
      if (x > rect.width - 170) x = e.clientX - rect.left - 170;
      tip.style.left = x + 'px';
      tip.style.top = (e.clientY - rect.top + 12) + 'px';
      tip.style.display = 'block';
    });
    svg.addEventListener('mouseleave', function () { tip.style.display = 'none'; });
  }

  /* ---------- Splátkový kalendář ---------- */

  var lastResult = null;

  function renderSchedule(i, r) {
    var html = [];
    r.yrs.forEach(function (y) {
      var fixEnd = y.year * 12 === r.fixMonths && r.fixMonths < r.months;
      html.push('<tr class="year-row' + (fixEnd ? ' fix-end' : '') + '" data-year="' + y.year + '" tabindex="0" aria-expanded="false"><td>' + y.year + '. rok' + (fixEnd ? ' <span class="status info">konec fixace</span>' : '') +
        '</td><td>' + kc(y.payment) + '</td><td>' + kc(y.principal) + '</td><td>' + kc(y.interest) + '</td><td>' + kc(y.balance) + '</td></tr>');
    });
    $('schedule').innerHTML = html.join('');
    $('scheduleFoot').innerHTML = '<tr><td>Celkem</td><td>' + kc(C.sum(r.rows, 'payment')) + '</td><td>' + kc(C.sum(r.rows, 'principal')) + '</td><td>' + kc(r.totalInterest) + '</td><td></td></tr>';
  }

  function toggleYear(tr) {
    var year = +tr.dataset.year;
    var open = tr.classList.toggle('open');
    tr.setAttribute('aria-expanded', open);
    var next = tr.nextElementSibling;
    while (next && next.classList.contains('month-row')) { var n = next.nextElementSibling; next.remove(); next = n; }
    if (!open) return;
    var y = lastResult.r.yrs[year - 1];
    var frag = y.months.map(function (m) {
      return '<tr class="month-row"><td>' + m.month + '. splátka</td><td>' + kc(m.payment) + '</td><td>' + kc(m.principal) + '</td><td>' + kc(m.interest) + '</td><td>' + kc(m.balance) + '</td></tr>';
    }).join('');
    tr.insertAdjacentHTML('afterend', frag);
  }

  function exportCsv() {
    if (!lastResult) return;
    var lines = ['Splátka;Rok;Splátka (Kč);Jistina (Kč);Úrok (Kč);Zůstatek (Kč)'];
    var f = function (v) { return v.toFixed(2).replace('.', ','); };
    lastResult.r.rows.forEach(function (m) {
      lines.push([m.month, Math.ceil(m.month / 12), f(m.payment), f(m.principal), f(m.interest), f(m.balance)].join(';'));
    });
    var blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'splatkovy-kalendar.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 0);
  }

  /* ---------- Synchronizace vstupů ---------- */

  function syncDerived() {
    var price = num('price'), own = num('own');
    var loan = Math.max(0, price - Math.min(own, price));
    $('loanDerived').textContent = kc(loan);
    $('ownShare').textContent = price > 0 ? pct(Math.min(own, price) / price * 100) : '–';
    $('termValue').textContent = years(Math.round(num('term')));
    $('ownRange').max = price;
    $('ownRange').value = Math.min(own, price);
    $('termRange').value = num('term');
  }

  function update() {
    syncDerived();
    var i = readInputs();
    var r = compute(i);
    lastResult = { i: i, r: r };
    renderCards(i, r);
    renderAlerts(i, r);
    renderRepExample(i, r);
    renderIndicators(i, r);
    renderStress(i, r);
    renderExtra(i, r);
    renderTax(i, r);
    renderUpfront(i, r);
    renderRentVsBuy(i, r);
    renderChart(i, r);
    renderSchedule(i, r);
    saveState();
  }

  /* ---------- Uložení stavu (jen pohodlí uživatele) ---------- */

  var STORE_KEY = 'hypokalk-v1';
  function saveState() {
    try {
      var state = {};
      document.querySelectorAll('#form [id]').forEach(function (el) {
        if (el.type === 'range') return;
        state[el.id] = el.type === 'checkbox' ? el.checked : el.value;
      });
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (e) { /* úložiště nedostupné */ }
  }
  function loadState() {
    try {
      var state = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (!state) return;
      Object.keys(state).forEach(function (id) {
        var el = $(id);
        if (!el) return;
        // Volba, která po změně config.js už v selectu není, se ignoruje
        if (el.tagName === 'SELECT' && ![].some.call(el.options, function (o) { return o.value === String(state[id]); })) return;
        if (el.type === 'checkbox') el.checked = state[id]; else el.value = state[id];
      });
    } catch (e) { /* ignorovat */ }
  }

  function applyDefaults() {
    var d = CFG.defaults;
    Object.keys(d).forEach(function (id) {
      var el = $(id);
      if (!el) return;
      if (el.type === 'checkbox') el.checked = d[id];
      else { el.value = d[id]; formatInput(el); }
    });
  }

  function setRateFromFix() {
    var rate = CFG.market.rates[$('fix').value];
    if (rate) $('rate').value = fmtPct2.format(rate);
  }

  function init() {
    // Možnosti fixace
    $('fix').innerHTML = Object.keys(CFG.market.rates).map(function (k) {
      return '<option value="' + k + '">' + years(+k) + ' (orientačně ' + pct2(CFG.market.rates[k]) + ')</option>';
    }).join('');
    $('termRange').max = CFG.cnb.maxTermYears + 10;
    $('validAt').textContent = CFG.validAt;
    $('rateSource').textContent = CFG.market.ratesSource;

    applyDefaults();
    loadState();
    document.querySelectorAll('[data-format=kc]').forEach(formatInput);

    var form = $('form');
    form.addEventListener('input', function (e) {
      if (e.target.id === 'ownRange') { $('own').value = fmtKc.format(+e.target.value); }
      if (e.target.id === 'termRange') { $('term').value = e.target.value; }
      update();
    });
    form.addEventListener('change', function (e) {
      if (e.target.id === 'fix') setRateFromFix();
      formatInput(e.target);
      update();
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    $('reset').addEventListener('click', function () {
      try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignorovat */ }
      applyDefaults();
      update();
    });

    $('schedule').addEventListener('click', function (e) {
      var tr = e.target.closest('.year-row');
      if (tr) toggleYear(tr);
    });
    $('schedule').addEventListener('keydown', function (e) {
      var tr = e.target.closest('.year-row');
      if (tr && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); toggleYear(tr); }
    });
    $('csv').addEventListener('click', exportCsv);
    $('print').addEventListener('click', function () { window.print(); });
    bindChartTooltip();

    update();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
