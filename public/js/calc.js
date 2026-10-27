/*
 * Výpočetní jádro hypoteční kalkulačky.
 * Čisté funkce bez práce s DOM – lze je testovat samostatně (viz tests.html).
 */
(function (global) {
  'use strict';

  /** Anuitní měsíční splátka. rate = roční nominální sazba v % (např. 4.79). */
  function annuity(principal, ratePct, months) {
    if (principal <= 0 || months <= 0) return 0;
    var r = ratePct / 100 / 12;
    if (r === 0) return principal / months;
    return principal * r / (1 - Math.pow(1 + r, -months));
  }

  /**
   * Splátkový kalendář po měsících.
   * opts: { principal, rate, months, extraYearly, extraMode: 'term' | 'payment', extraFromYear }
   *  - extraYearly: mimořádná splátka hrazená vždy ve výročí (měsíc 12, 24, ...)
   *  - extraMode 'term'    = splátka zůstává, zkracuje se doba splácení
   *              'payment' = doba zůstává, snižuje se splátka
   */
  function schedule(opts) {
    var principal = opts.principal;
    var rate = opts.rate;
    var months = opts.months;
    var extraYearly = opts.extraYearly || 0;
    var extraMode = opts.extraMode || 'term';
    var extraFromYear = opts.extraFromYear || 1;
    var r = rate / 100 / 12;

    var balance = principal;
    var payment = annuity(principal, rate, months);
    var rows = [];

    for (var m = 1; m <= months && balance > 0.005; m++) {
      var interest = balance * r;
      var principalPart = Math.min(payment - interest, balance);
      var pay = interest + principalPart;
      balance -= principalPart;

      var extra = 0;
      if (extraYearly > 0 && m % 12 === 0 && m / 12 >= extraFromYear && balance > 0.005) {
        extra = Math.min(extraYearly, balance);
        balance -= extra;
        if (extraMode === 'payment' && balance > 0.005) {
          payment = annuity(balance, rate, months - m);
        }
      }
      if (balance < 0.005) balance = 0;

      rows.push({
        month: m,
        payment: pay,
        interest: interest,
        principal: principalPart,
        extra: extra,
        balance: balance
      });
    }
    return rows;
  }

  /** Agregace měsíčního kalendáře po letech. */
  function yearly(rows) {
    var out = [];
    rows.forEach(function (row) {
      var y = Math.ceil(row.month / 12);
      var item = out[y - 1];
      if (!item) {
        item = out[y - 1] = { year: y, payment: 0, interest: 0, principal: 0, extra: 0, balance: 0, months: [] };
      }
      item.payment += row.payment;
      item.interest += row.interest;
      item.principal += row.principal;
      item.extra += row.extra;
      item.balance = row.balance;
      item.months.push(row);
    });
    return out;
  }

  function sum(rows, key) {
    return rows.reduce(function (acc, row) { return acc + row[key]; }, 0);
  }

  /**
   * RPSN dle přílohy č. 1 zákona č. 257/2016 Sb.
   * Řeší rovnici  Σ C_k (1+X)^(-t_k) = Σ D_l (1+X)^(-s_l),
   * zde zapsanou jako jediný tok: čerpání kladně, platby spotřebitele záporně.
   * flows: [{ t: čas v letech od čerpání, amount: částka }]
   * Vrací RPSN v % (nezaokrouhlenou).
   */
  function apr(flows) {
    function f(x) {
      var s = 0;
      for (var i = 0; i < flows.length; i++) s += flows[i].amount * Math.pow(1 + x, -flows[i].t);
      return s;
    }
    function df(x) {
      var s = 0;
      for (var i = 0; i < flows.length; i++) s += -flows[i].t * flows[i].amount * Math.pow(1 + x, -flows[i].t - 1);
      return s;
    }

    // Newton–Raphson
    var x = 0.05;
    for (var it = 0; it < 100; it++) {
      var fx = f(x);
      var d = df(x);
      if (!isFinite(fx) || !isFinite(d) || d === 0) break;
      var next = x - fx / d;
      if (next <= -0.99 || !isFinite(next)) break;
      if (Math.abs(next - x) < 1e-12) return next * 100;
      x = next;
    }

    // Záchranná bisekce: f je pro kladné toky klesající v x
    var lo = -0.99, hi = 10;
    if (f(lo) * f(hi) > 0) return NaN;
    for (var j = 0; j < 300; j++) {
      var mid = (lo + hi) / 2;
      if (f(lo) * f(mid) <= 0) hi = mid; else lo = mid;
      if (hi - lo < 1e-12) break;
    }
    return (lo + hi) / 2 * 100;
  }

  /**
   * Peněžní toky pro výpočet RPSN.
   * Předpoklady přílohy č. 1: úvěr se čerpá jednorázově a celý, sazba a poplatky
   * zůstávají po celou dobu trvání smlouvy beze změny, splácí se dle dohodnutého kalendáře.
   * fees: { upfront: jednorázové náklady při čerpání,
   *         monthly: pravidelné měsíční náklady (vedení účtu, povinné pojištění) }
   */
  function aprFlows(principal, rate, months, fees) {
    var rows = schedule({ principal: principal, rate: rate, months: months });
    var flows = [{ t: 0, amount: principal - (fees.upfront || 0) }];
    rows.forEach(function (row) {
      flows.push({ t: row.month / 12, amount: -(row.payment + (fees.monthly || 0)) });
    });
    return flows;
  }

  /** RPSN zaokrouhlená na jedno desetinné místo (příloha č. 1 – alespoň na jedno desetinné místo). */
  function aprRounded(principal, rate, months, fees) {
    return Math.round(apr(aprFlows(principal, rate, months, fees)) * 10) / 10;
  }

  /** Zůstatek jistiny po zaplacení `paid` splátek (bez mimořádných splátek). */
  function balanceAfter(principal, rate, months, paid) {
    var r = rate / 100 / 12;
    if (paid >= months) return 0;
    if (r === 0) return principal * (1 - paid / months);
    var pmt = annuity(principal, rate, months);
    return principal * Math.pow(1 + r, paid) - pmt * (Math.pow(1 + r, paid) - 1) / r;
  }

  /** Maximální výše úvěru, kterou lze splácet danou měsíční splátkou. */
  function principalFromPayment(payment, ratePct, months) {
    if (payment <= 0 || months <= 0) return 0;
    var r = ratePct / 100 / 12;
    if (r === 0) return payment * months;
    return payment * (1 - Math.pow(1 + r, -months)) / r;
  }

  /** Úspora na dani z odpočtu úroků za jednotlivé roky (§ 15 odst. 3 ZDP). */
  function taxSavings(yearRows, limit, taxRate) {
    return yearRows.map(function (y) {
      return Math.min(y.interest, limit) * taxRate;
    });
  }

  var api = {
    annuity: annuity,
    schedule: schedule,
    yearly: yearly,
    sum: sum,
    apr: apr,
    aprFlows: aprFlows,
    aprRounded: aprRounded,
    balanceAfter: balanceAfter,
    principalFromPayment: principalFromPayment,
    taxSavings: taxSavings
  };

  global.HypoCalc = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : this);
