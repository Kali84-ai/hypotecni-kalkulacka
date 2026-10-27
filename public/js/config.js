/*
 * Legislativní a tržní parametry kalkulačky na jednom místě.
 * Při změně legislativy nebo trhu stačí upravit tento soubor (a datum validAt).
 */
window.HK_CONFIG = {
  validAt: '27. 10. 2026',

  // Česká národní banka – makroobezřetnostní politika
  cnb: {
    ltv: {
      standard: 80,      // závazný limit LTV (OOP ČNB z 29. 11. 2023)
      young: 90,         // žadatelé mladší 36 let, úvěr na vlastní bydlení
      youngAgeLimit: 36,
      investment: 70     // doporučení ČNB pro investiční úvěry od 1. 4. 2026 (úřední sdělení z 27. 11. 2025)
    },
    dti: {
      investment: 7,     // doporučení ČNB pro investiční úvěry od 1. 4. 2026
      bankPractice: 8.5  // u vlastního bydlení je limit DTI deaktivován; orientační hranice z praxe bank
    },
    dsti: {
      warn: 45,          // u vlastního bydlení je limit DSTI deaktivován; orientační hranice z praxe bank
      comfort: 35        // bezpečná hranice pro rozpočet domácnosti
    },
    note: 'Pro úvěry na vlastní bydlení je závazný pouze limit LTV (80 %, pro žadatele do 36 let 90 %). Limity DTI a DSTI má ČNB deaktivované – banky však úvěruschopnost posuzují samy a podobné ukazatele interně používají. Pro investiční nemovitosti (pronájem, třetí a další nemovitost) ČNB od 1. 4. 2026 doporučuje LTV max. 70 % a DTI max. 7.',
    maxTermYears: 30     // ČNB splatnost číselně nelimituje; 30 let je běžné maximum bank
  },

  // Zákon č. 257/2016 Sb., o spotřebitelském úvěru
  law: {
    freePrepaymentShare: 25,           // § 117 odst. 3 – až 25 % celkové výše úvěru ročně (1 měsíc před výročím smlouvy)
    freePrepaymentFrom: '1. 9. 2024',
    prepaymentCapPerYear: 0.25,        // % za každý započatý rok do konce fixace
    prepaymentCapMax: 1,               // max. 1 % předčasně splacené částky
    prepaymentAdminMax: 1000,          // administrativní náklady max. 1 000 Kč
    reflectionDays: 14                 // § 111 – lhůta na rozmyšlenou
  },

  // Zákon č. 586/1992 Sb., o daních z příjmů, § 15 odst. 3
  tax: {
    interestLimit: 150000              // bytová potřeba řešená od 1. 1. 2021 (dříve 300 000 Kč)
  },

  fees: {
    cadastre: 2000,                    // správní poplatek za návrh na vklad (zákon č. 634/2004 Sb., položka 120)
    notaryEstimate: 1500               // ověření podpisů, výpisy – orientačně
  },

  market: {
    // Swiss Life Hypoindex, říjen 2026 (LTV do 80 %); 5 a 7 let = celkový průměr Hypoindexu
    rates: { 1: 5.42, 3: 5.53, 5: 5.79, 7: 5.79, 10: 6.35 },
    ratesSource: 'Swiss Life Hypoindex 10/2026',
    ltvPriceStep: 80,                  // nad tuto hranici LTV banky zvyšují sazbu
    ltvPremiumNote: '0,3 p. b. podle Hypoindexu',
    minLoan: 300000,
    maxAgeAtEnd: 70,
    reserveMonths: 6,
    rentGrowth: 3
  },

  stressSteps: [-1, 0, 1, 2, 3],

  // Výchozí hodnoty formuláře
  defaults: {
    price: 5000000,
    own: 1000000,
    collateral: '',
    purpose: 'own',
    age: 32,
    fix: '5',
    rate: '5,79',
    term: 30,
    feeProcessing: 0,
    feeAppraisal: 5000,
    feeAccount: 0,
    insProperty: 3000,
    insPropertyApr: true,
    insLife: 0,
    insLifeApr: false,
    agentFee: 0,
    income: 70000,
    otherPayments: 0,
    otherDebt: 0,
    taxRate: '0.15',
    extraYearly: 0,
    extraMode: 'term',
    rent: 18000,
    appreciation: '3'
  }
};
