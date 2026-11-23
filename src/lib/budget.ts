import { UserCostItem, BudgetSummary, CostItem, CostsData, TimelineIntake, TimelineDeadline, Language } from '@/types';
import { formatCurrency, toBanglaDigits } from './utils';

/**
 * Checks whether an item is a retained asset (blocked account or refundable deposit)
 * rather than a non-recoverable sunk fee.
 */
export function isRetainedFund(item: CostItem | UserCostItem): boolean {
  return item.type === 'released-monthly' || item.type === 'refundable';
}

/**
 * Convert an amount to BDT using exchange rate and bank margin
 */
export function convertToBDT(
  amount: number,
  currency: 'BDT' | 'EUR',
  rate: number,
  bankMarginPercent: number = 0
): number {
  if (currency === 'BDT') return amount;
  const effectiveRate = rate * (1 + bankMarginPercent / 100);
  return amount * effectiveRate;
}

/**
 * Convert an amount from BDT to EUR
 */
export function convertToEUR(
  amountBDT: number,
  rate: number,
  bankMarginPercent: number = 0
): number {
  const effectiveRate = rate * (1 + bankMarginPercent / 100);
  return amountBDT / effectiveRate;
}

/**
 * Calculate the effective exchange rate with bank margin
 */
export function getEffectiveRate(rate: number, bankMarginPercent: number): number {
  return rate * (1 + bankMarginPercent / 100);
}

/**
 * Calculates budget with two distinct buckets:
 * 1. Non-recoverable costs (sunk fees, flights, tests, initial expenses)
 * 2. Funds you still own (blocked account released monthly, refundable Kaution)
 * 3. Combined total funds
 */
export function calculateBudget(
  items: UserCostItem[],
  rate: number,
  bankMarginPercent: number,
  categories: { id: string; step: number }[]
): BudgetSummary {
  const byCategory: BudgetSummary['byCategory'] = {};

  let sunkMinBDT = 0;
  let sunkMaxBDT = 0;
  let sunkSelectedBDT = 0;
  let sunkActualBDT = 0;

  let retainedMinBDT = 0;
  let retainedMaxBDT = 0;
  let retainedSelectedBDT = 0;
  let retainedActualBDT = 0;

  let arrangedCount = 0;

  // Initialize categories
  for (const cat of categories) {
    byCategory[cat.id] = {
      min: 0, max: 0, selected: 0, actual: 0,
      minBDT: 0, maxBDT: 0, selectedBDT: 0, actualBDT: 0,
    };
  }

  for (const item of items) {
    const minBDT = convertToBDT(item.min, item.currency, rate, bankMarginPercent);
    const maxBDT = convertToBDT(item.max, item.currency, rate, bankMarginPercent);
    const selectedBDT = convertToBDT(item.estimate, item.currency, rate, bankMarginPercent);
    const actualBDT = item.actualPaid !== null
      ? convertToBDT(item.actualPaid, item.currency, rate, bankMarginPercent)
      : 0;

    const isRetained = isRetainedFund(item);

    if (isRetained) {
      retainedMinBDT += minBDT;
      retainedMaxBDT += maxBDT;
      retainedSelectedBDT += selectedBDT;
      retainedActualBDT += actualBDT;
    } else {
      sunkMinBDT += minBDT;
      sunkMaxBDT += maxBDT;
      sunkSelectedBDT += selectedBDT;
      sunkActualBDT += actualBDT;
    }

    if (item.arranged) arrangedCount++;

    if (byCategory[item.category]) {
      byCategory[item.category].min += item.min;
      byCategory[item.category].max += item.max;
      byCategory[item.category].selected += item.estimate;
      byCategory[item.category].actual += (item.actualPaid ?? 0);
      byCategory[item.category].minBDT += minBDT;
      byCategory[item.category].maxBDT += maxBDT;
      byCategory[item.category].selectedBDT += selectedBDT;
      byCategory[item.category].actualBDT += actualBDT;
    }
  }

  // Determine completed steps
  const completedSteps: number[] = [];
  for (const cat of categories) {
    const catItems = items.filter(i => i.category === cat.id);
    if (catItems.length > 0 && catItems.every(i => i.arranged)) {
      completedSteps.push(cat.step);
    }
  }

  const totalMinBDT = sunkMinBDT + retainedMinBDT;
  const totalMaxBDT = sunkMaxBDT + retainedMaxBDT;
  const totalSelectedBDT = sunkSelectedBDT + retainedSelectedBDT;
  const totalActualBDT = sunkActualBDT + retainedActualBDT;

  return {
    sunkMinBDT,
    sunkMaxBDT,
    sunkSelectedBDT,
    sunkActualBDT,

    retainedMinBDT,
    retainedMaxBDT,
    retainedSelectedBDT,
    retainedActualBDT,

    totalMinBDT,
    totalMaxBDT,
    totalSelectedBDT,
    totalActualBDT,

    totalMin: totalMinBDT,
    totalMax: totalMaxBDT,
    totalSelected: totalSelectedBDT,
    totalActual: totalActualBDT,

    byCategory,
    arrangedCount,
    totalCount: items.length,
    completedSteps,
  };
}

/**
 * Initialize user items from seed data
 */
export function initializeItems(costsData: CostsData): UserCostItem[] {
  return costsData.items.map((item, index) => ({
    ...item,
    arranged: false,
    estimate: item.default,
    actualPaid: null,
    order: index,
  }));
}

/**
 * Apply scenario multiplier to items
 */
export function applyScenario(
  items: UserCostItem[],
  multiplier: number,
  cityAdjustment?: { rentMultiplier: number; livingMultiplier: number }
): UserCostItem[] {
  return items.map(item => {
    // Blocked account amount (€11,904) is statutory and never multiplied by scenario
    if (item.id === 'blocked-account') {
      return item;
    }

    let estimate = item.default * multiplier;

    if (cityAdjustment) {
      if (item.id === 'housing-deposit' || item.id === 'first-month-rent') {
        estimate *= cityAdjustment.rentMultiplier;
      } else if (item.id === 'pocket-money' || item.id === 'initial-shopping') {
        estimate *= cityAdjustment.livingMultiplier;
      }
    }

    return {
      ...item,
      estimate: Math.round(estimate),
    };
  });
}

/**
 * Dynamically computes the next upcoming intake based on current date
 */
export function getNextUpcomingIntake(referenceDate: Date = new Date()): TimelineIntake {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth(); // 0 = Jan, 6 = July

  // Summer intake starts in April (approx app deadline mid-January)
  // Winter intake starts in October (approx app deadline mid-July)
  if (month < 1 || (month === 1 && referenceDate.getDate() <= 15)) {
    // Before mid-Jan: Summer intake of current year is still upcoming
    return { type: 'summer', year };
  } else if (month <= 6 || (month === 6 && referenceDate.getDate() <= 15)) {
    // Between mid-Jan and mid-July: Winter intake of current year
    return { type: 'winter', year };
  } else {
    // After mid-July: Summer intake of next year
    return { type: 'summer', year: year + 1 };
  }
}

/**
 * Generate timeline milestones relative to chosen intake
 */
export function generateDeadlines(
  intake: TimelineIntake,
  language: Language,
  referenceDate: Date = new Date()
): TimelineDeadline[] {
  // Winter semester begins Oct 1; Summer semester begins Apr 1
  const startMonth = intake.type === 'winter' ? 9 : 3;
  const intakeStartDate = new Date(intake.year, startMonth, 1);

  const rawMilestones = [
    {
      id: 'ielts-prep',
      step: 0,
      labelBn: 'IELTS / ভাষা পরীক্ষার প্রস্তুতি ও স্কোর নিশ্চিতকরণ',
      labelEn: 'Take IELTS / language exam and secure target score',
      monthsBefore: 12,
    },
    {
      id: 'documents',
      step: 0,
      labelBn: 'একাডেমিক ট্রান্সক্রিপ্ট ও ডকুমেন্ট সত্যায়ন সম্পন্ন',
      labelEn: 'Complete academic documents collection & attestation',
      monthsBefore: 10,
    },
    {
      id: 'uni-research',
      step: 1,
      labelBn: 'বিশ্ববিদ্যালয় শর্টলিস্ট ও প্রফেসরের প্রয়োজনীয়তা যাচাই',
      labelEn: 'Shortlist universities & verify admission requirements',
      monthsBefore: 9,
    },
    {
      id: 'uni-apply',
      step: 1,
      labelBn: 'Uni-Assist ও পোর্টালে বিশ্ববিদ্যালয় আবেদন দাখিল',
      labelEn: 'Submit university applications via Uni-Assist / portal',
      monthsBefore: 7,
    },
    {
      id: 'admission-letter',
      step: 1,
      labelBn: 'ভর্তি পত্র (Zulassungsbescheid) সংগ্রহ',
      labelEn: 'Receive university admission letter (Zulassungsbescheid)',
      monthsBefore: 4,
    },
    {
      id: 'blocked-account-open',
      step: 2,
      labelBn: 'ব্লকড একাউন্ট খোলা (Expatrio / Coracle)',
      labelEn: 'Open blocked account with provider (Expatrio / Coracle)',
      monthsBefore: 3.5,
    },
    {
      id: 'blocked-account-fund',
      step: 2,
      labelBn: 'ব্যাংক স্টুডেন্ট ফাইলের মাধ্যমে ব্লকড ফান্ড (€১১,৯০৪) ট্রান্সফার',
      labelEn: 'Transfer blocked funds (€11,904) via bank student file',
      monthsBefore: 3,
    },
    {
      id: 'visa-apply',
      step: 3,
      labelBn: 'জার্মান দূতাবাসে স্টুডেন্ট ভিসা ইন্টারভিউ ও আবেদন জমা',
      labelEn: 'Submit visa application at German Embassy Dhaka',
      monthsBefore: 2.5,
    },
    {
      id: 'visa-receive',
      step: 3,
      labelBn: 'ভিসা পাসপোর্ট সংগ্রহ ও স্বাস্থ্য বীমা নিশ্চিতকরণ',
      labelEn: 'Collect visa passport with travel health insurance',
      monthsBefore: 1,
    },
    {
      id: 'book-housing',
      step: 4,
      labelBn: 'জার্মানিতে আবাসন / ডর্ম বুকিং ও চুক্তি নিশ্চিতকরণ',
      labelEn: 'Secure student dormitory / WG shared accommodation',
      monthsBefore: 1.5,
    },
    {
      id: 'book-flight',
      step: 4,
      labelBn: 'বিমান টিকেট সংগ্রহ ও প্যাকিং',
      labelEn: 'Book one-way flight ticket and packing',
      monthsBefore: 0.75,
    },
    {
      id: 'arrive',
      step: 5,
      labelBn: 'জার্মানিতে আগমন, সিটি রেজিস্ট্রেশন (Anmeldung) ও ব্যাংক এক্টিভেশন',
      labelEn: 'Arrive in Germany, city registration (Anmeldung) & bank activation',
      monthsBefore: 0,
    },
  ];

  const nowTime = referenceDate.getTime();
  const isPastIntake = intakeStartDate.getTime() < nowTime;

  return rawMilestones.map((m) => {
    const d = new Date(intakeStartDate);
    // Subtract monthsBefore
    const targetMonth = d.getMonth() - Math.floor(m.monthsBefore);
    const targetDateDays = d.getDate() - Math.round((m.monthsBefore % 1) * 30);
    d.setMonth(targetMonth);
    d.setDate(targetDateDays);

    let status: 'upcoming' | 'overdue' | 'completed' = 'upcoming';

    if (isPastIntake && d.getTime() < nowTime) {
      status = 'overdue';
    }

    return {
      id: m.id,
      step: m.step,
      labelBn: m.labelBn,
      labelEn: m.labelEn,
      date: d,
      completed: false,
      status,
      relativeMonths: m.monthsBefore,
    };
  });
}

/**
 * Generate ICS calendar content adhering to RFC 5545
 */
export function generateICS(
  deadlines: { labelEn: string; labelBn: string; date: Date }[],
  language: Language
): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//GermanyCostBD//Study Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const d of deadlines) {
    const dateStr = d.date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const summary = language === 'bn' ? d.labelBn : d.labelEn;
    lines.push(
      'BEGIN:VEVENT',
      `DTSTART;VALUE=DATE:${dateStr.slice(0, 8)}`,
      `DTEND;VALUE=DATE:${dateStr.slice(0, 8)}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:GermanyCostBD - Study in Germany milestone reminder`,
      `UID:${d.date.getTime()}-${Math.random().toString(36).slice(2, 7)}@germanycostbd.com`,
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Generate smart financial insights comparing like-with-like
 */
export function generateInsights(
  summary: BudgetSummary,
  rate: number,
  bankMargin: number,
  language: Language
): string[] {
  const insights: string[] = [];

  // Compare non-recoverable with standard non-recoverable baseline (~৳4,50,000 to ৳5,50,000)
  const standardSunkBaseline = (summary.sunkMinBDT + summary.sunkMaxBDT) / 2;

  if (language === 'bn') {
    // 1. Clarification between sunk cost vs retained funds
    insights.push(
      `আপনার মোট বাজেটের প্রায় ${toBanglaDigits(Math.round((summary.retainedSelectedBDT / summary.totalSelectedBDT) * 100))}% অর্থ (ব্লকড একাউন্ট ও জামানত) সম্পূর্ণ আপনার নিজের তহবিল, যা প্রতি মাসে জার্মানিতে খরচ হিসেবে রিলিজ হবে।`
    );

    // 2. Budget status
    if (summary.sunkSelectedBDT > standardSunkBaseline * 1.15) {
      const pct = Math.round(((summary.sunkSelectedBDT - standardSunkBaseline) / standardSunkBaseline) * 100);
      insights.push(
        `আপনার পছন্দের অফেরতযোগ্য খরচ মানসম্মত ব্যয়ের চেয়ে ${toBanglaDigits(pct)}% বেশি। ডর্ম বা আগাম টিকেটের মাধ্যমে এটি সাশ্রয় করা সম্ভব।`
      );
    } else {
      insights.push(
        `আপনার অফেরতযোগ্য খরচের পরিকল্পনা বাস্তবসম্মত ও সুষম সীমার মধ্যে রয়েছে।`
      );
    }

    // 3. Progress tracking
    if (summary.arrangedCount > 0) {
      const pct = Math.round((summary.arrangedCount / summary.totalCount) * 100);
      insights.push(
        `আপনি ইতিমধ্যে ${toBanglaDigits(summary.totalCount)}টি আইটেমের মধ্যে ${toBanglaDigits(summary.arrangedCount)}টি (${toBanglaDigits(pct)}%) ব্যবস্থা সম্পন্ন করেছেন।`
      );
    }

    // 4. Savings still needed for non-recoverable
    const sunkRemaining = Math.max(0, summary.sunkSelectedBDT - summary.sunkActualBDT);
    if (sunkRemaining > 0) {
      insights.push(
        `প্রাথমিক খরচ পরিশোধের জন্য আরও প্রায় ${formatCurrency(sunkRemaining, 'BDT', 'bn')} প্রস্তুত রাখতে হবে।`
      );
    }
  } else {
    insights.push(
      `About ${Math.round((summary.retainedSelectedBDT / summary.totalSelectedBDT) * 100)}% of your total budget (blocked account & deposit) remains your own money, released monthly (€992/mo) in Germany.`
    );

    if (summary.sunkSelectedBDT > standardSunkBaseline * 1.15) {
      const pct = Math.round(((summary.sunkSelectedBDT - standardSunkBaseline) / standardSunkBaseline) * 100);
      insights.push(
        `Your non-recoverable estimate is ${pct}% above the standard baseline. Early flight and dorm booking can help reduce this.`
      );
    } else {
      insights.push(
        `Your non-recoverable budget plan is balanced and aligned with average student expenses.`
      );
    }

    if (summary.arrangedCount > 0) {
      const pct = Math.round((summary.arrangedCount / summary.totalCount) * 100);
      insights.push(
        `You have confirmed plans for ${summary.arrangedCount} of ${summary.totalCount} items (${pct}%).`
      );
    }

    const sunkRemaining = Math.max(0, summary.sunkSelectedBDT - summary.sunkActualBDT);
    if (sunkRemaining > 0) {
      insights.push(
        `You need approximately ${formatCurrency(sunkRemaining, 'BDT', 'en')} more in available cash to cover immediate upfront costs.`
      );
    }
  }

  return insights;
}
