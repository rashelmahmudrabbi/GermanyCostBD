import { UserCostItem, BudgetSummary, CostItem, CostsData } from '@/types';

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
 * Calculate full budget summary from user items
 */
export function calculateBudget(
  items: UserCostItem[],
  rate: number,
  bankMarginPercent: number,
  categories: { id: string; step: number }[]
): BudgetSummary {
  const byCategory: BudgetSummary['byCategory'] = {};
  
  let totalMin = 0;
  let totalMax = 0;
  let totalSelected = 0;
  let totalActual = 0;
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
    
    totalMin += minBDT;
    totalMax += maxBDT;
    totalSelected += selectedBDT;
    totalActual += actualBDT;
    
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
  
  return {
    totalMin,
    totalMax,
    totalSelected,
    totalActual,
    totalMinBDT: totalMin,
    totalMaxBDT: totalMax,
    totalSelectedBDT: totalSelected,
    totalActualBDT: totalActual,
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
    let estimate = item.default * multiplier;
    
    if (cityAdjustment) {
      // Apply city-specific adjustments for housing and living costs
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
 * Generate smart insights based on budget data
 */
export function generateInsights(
  summary: BudgetSummary,
  rate: number,
  bankMargin: number,
  language: 'bn' | 'en'
): string[] {
  const insights: string[] = [];
  const standardBudget = summary.totalMax * 0.75; // Approximate standard
  
  if (language === 'bn') {
    // Over budget warning
    if (summary.totalSelected > standardBudget * 1.1) {
      const pct = Math.round(((summary.totalSelected - standardBudget) / standardBudget) * 100);
      insights.push(`আপনার নির্বাচিত বাজেট মানসম্মত বাজেটের চেয়ে ${pct}% বেশি।`);
    }
    
    // Savings needed
    const remaining = summary.totalSelected - summary.totalActual;
    if (remaining > 0) {
      insights.push(`আপনার নির্বাচিত বাজেটের জন্য আরও প্রায় ৳${Math.round(remaining).toLocaleString('en-IN')} সঞ্চয় প্রয়োজন।`);
    }
    
    // Progress
    if (summary.arrangedCount > 0) {
      const pct = Math.round((summary.arrangedCount / summary.totalCount) * 100);
      insights.push(`আপনি ${summary.totalCount}টি আইটেমের মধ্যে ${summary.arrangedCount}টি (${pct}%) সম্পন্ন করেছেন।`);
    }
    
    // Blocked account info
    insights.push(`ব্লকড একাউন্টের টাকা (€১১,৯০৪) প্রতি মাসে €৯৯২ করে রিলিজ হবে।`);
    
  } else {
    if (summary.totalSelected > standardBudget * 1.1) {
      const pct = Math.round(((summary.totalSelected - standardBudget) / standardBudget) * 100);
      insights.push(`Your selected budget is ${pct}% over the standard budget.`);
    }
    
    const remaining = summary.totalSelected - summary.totalActual;
    if (remaining > 0) {
      insights.push(`You need approximately ৳${Math.round(remaining).toLocaleString('en-IN')} more in savings for your selected budget.`);
    }
    
    if (summary.arrangedCount > 0) {
      const pct = Math.round((summary.arrangedCount / summary.totalCount) * 100);
      insights.push(`You've completed ${summary.arrangedCount} of ${summary.totalCount} items (${pct}%).`);
    }
    
    insights.push(`Blocked account funds (€11,904) will be released at €992/month.`);
  }
  
  return insights;
}

/**
 * Generate timeline deadlines based on intake
 */
export function generateDeadlines(
  intake: { type: 'winter' | 'summer'; year: number },
  language: 'bn' | 'en'
): { id: string; step: number; labelBn: string; labelEn: string; date: Date }[] {
  // Winter semester starts October, Summer starts April
  const startMonth = intake.type === 'winter' ? 9 : 3; // 0-indexed
  const startDate = new Date(intake.year, startMonth, 1);
  
  const deadlines = [
    {
      id: 'ielts-prep',
      step: 0,
      labelBn: 'IELTS পরীক্ষা দিন',
      labelEn: 'Take IELTS exam',
      monthsBefore: 12,
    },
    {
      id: 'documents',
      step: 0,
      labelBn: 'ডকুমেন্ট সংগ্রহ শুরু করুন',
      labelEn: 'Start collecting documents',
      monthsBefore: 11,
    },
    {
      id: 'uni-research',
      step: 1,
      labelBn: 'বিশ্ববিদ্যালয় গবেষণা ও শর্টলিস্ট',
      labelEn: 'Research & shortlist universities',
      monthsBefore: 10,
    },
    {
      id: 'uni-apply',
      step: 1,
      labelBn: 'বিশ্ববিদ্যালয়ে আবেদন করুন',
      labelEn: 'Apply to universities',
      monthsBefore: 8,
    },
    {
      id: 'admission-letter',
      step: 1,
      labelBn: 'ভর্তি পত্র পান',
      labelEn: 'Receive admission letter',
      monthsBefore: 5,
    },
    {
      id: 'blocked-account-open',
      step: 2,
      labelBn: 'ব্লকড একাউন্ট খুলুন',
      labelEn: 'Open blocked account',
      monthsBefore: 4,
    },
    {
      id: 'blocked-account-fund',
      step: 2,
      labelBn: 'ব্লকড একাউন্টে টাকা জমা দিন',
      labelEn: 'Fund blocked account',
      monthsBefore: 3,
    },
    {
      id: 'visa-apply',
      step: 3,
      labelBn: 'ভিসার জন্য আবেদন করুন',
      labelEn: 'Apply for visa',
      monthsBefore: 3,
    },
    {
      id: 'visa-receive',
      step: 3,
      labelBn: 'ভিসা পান',
      labelEn: 'Receive visa',
      monthsBefore: 1.5,
    },
    {
      id: 'book-housing',
      step: 4,
      labelBn: 'আবাসন বুক করুন',
      labelEn: 'Book housing',
      monthsBefore: 2,
    },
    {
      id: 'book-flight',
      step: 4,
      labelBn: 'বিমান টিকেট বুক করুন',
      labelEn: 'Book flight ticket',
      monthsBefore: 1,
    },
    {
      id: 'arrive',
      step: 5,
      labelBn: 'জার্মানিতে পৌঁছান',
      labelEn: 'Arrive in Germany',
      monthsBefore: 0,
    },
  ];
  
  return deadlines.map(d => {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() - d.monthsBefore);
    return {
      id: d.id,
      step: d.step,
      labelBn: d.labelBn,
      labelEn: d.labelEn,
      date,
    };
  });
}

/**
 * Generate ICS calendar content
 */
export function generateICS(
  deadlines: { labelEn: string; labelBn: string; date: Date }[],
  language: 'bn' | 'en'
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
    const label = language === 'bn' ? d.labelBn : d.labelEn;
    lines.push(
      'BEGIN:VEVENT',
      `DTSTART;VALUE=DATE:${dateStr.slice(0, 8)}`,
      `DTEND;VALUE=DATE:${dateStr.slice(0, 8)}`,
      `SUMMARY:${label}`,
      `DESCRIPTION:GermanyCostBD - Study Abroad Planner`,
      `UID:${d.date.getTime()}@germanycostbd`,
      'END:VEVENT'
    );
  }
  
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
