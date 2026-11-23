import { describe, it, expect } from 'vitest';
import {
  convertToBDT,
  convertToEUR,
  getEffectiveRate,
  calculateBudget,
  initializeItems,
  applyScenario,
  generateDeadlines,
  generateICS,
  generateInsights,
  getNextUpcomingIntake,
} from '../budget';
import {
  formatCurrency,
  toBanglaDigits,
  extractDomain,
  getFreshnessStatus,
  isRetainedFund,
} from '../utils';
import costsData from '../../data/costs.json';
import { UserCostItem, BudgetSummary } from '@/types';

describe('Budget Calculation Engine', () => {
  describe('Exchange Rate Calculations', () => {
    it('correctly calculates effective rate with bank margin', () => {
      // 120 with 2% margin = 120 * 1.02 = 122.4
      const effectiveRate = getEffectiveRate(120, 2);
      expect(effectiveRate).toBeCloseTo(122.4, 2);
    });

    it('converts EUR to BDT correctly', () => {
      // 100 EUR at rate 125 with 0% margin = 12,500 BDT
      expect(convertToBDT(100, 'EUR', 125, 0)).toBe(12500);

      // 100 EUR at rate 125 with 2% margin = 125 * 1.02 * 100 = 12,750 BDT
      expect(convertToBDT(100, 'EUR', 125, 2)).toBeCloseTo(12750, 1);

      // BDT amount should not change
      expect(convertToBDT(5000, 'BDT', 125, 2)).toBe(5000);
    });

    it('converts BDT to EUR correctly', () => {
      // 12,500 BDT at rate 125 with 0% margin = 100 EUR
      expect(convertToEUR(12500, 125, 0)).toBe(100);
    });
  });

  describe('Item Initialization & Budget Aggregation', () => {
    it('initializes user items from seed costs data', () => {
      const items = initializeItems(costsData as any);
      expect(items.length).toBe(costsData.items.length);
      expect(items[0]).toHaveProperty('arranged', false);
      expect(items[0]).toHaveProperty('estimate');
      expect(items[0].estimate).toBe(items[0].default);
    });

    it('accurately splits budget into non-recoverable costs vs retained funds', () => {
      const sampleCategories = [
        { id: 'visa', step: 2 },
        { id: 'blocked-account', step: 2 },
      ];

      const sampleItems: UserCostItem[] = [
        {
          id: 'visa-fee',
          category: 'visa',
          labelBn: 'ভিসা ফি',
          labelEn: 'Visa fee',
          currency: 'EUR',
          min: 75,
          max: 75,
          default: 75,
          estimate: 75,
          actualPaid: 75,
          arranged: true,
          type: 'fee',
          noteBn: '',
          noteEn: '',
          sourceUrl: 'https://dhaka.diplo.de',
          lastVerified: '2026-11-20',
          order: 0,
        },
        {
          id: 'blocked-amount',
          category: 'blocked-account',
          labelBn: 'ব্লকড একাউন্ট ফান্ড',
          labelEn: 'Blocked account funds',
          currency: 'EUR',
          min: 11904,
          max: 11904,
          default: 11904,
          estimate: 11904,
          actualPaid: null,
          arranged: false,
          type: 'released-monthly',
          noteBn: '',
          noteEn: '',
          sourceUrl: 'https://www.auswaertiges-amt.de',
          lastVerified: '2026-11-20',
          order: 1,
        },
      ];

      // Rate: 100 BDT/EUR
      const summary = calculateBudget(sampleItems, 100, 0, sampleCategories);

      // Blocked amount is in retained funds (11,904 EUR * 100 = 1,190,400 BDT)
      expect(summary.retainedSelectedBDT).toBe(1190400);

      // Visa fee is non-recoverable (75 EUR * 100 = 7,500 BDT)
      expect(summary.sunkSelectedBDT).toBe(7500);

      // Combined total = 1,197,900 BDT
      expect(summary.totalSelectedBDT).toBe(1197900);
    });

    it('correctly identifies retained funds vs sunk costs', () => {
      expect(isRetainedFund('blocked-amount')).toBe(true);
      expect(isRetainedFund('housing-deposit')).toBe(true);
      expect(isRetainedFund('uni-assist-first')).toBe(false);
      expect(isRetainedFund('flight-ticket')).toBe(false);
      expect(isRetainedFund('visa-fee')).toBe(false);
    });
  });

  describe('Scenario Multipliers & City Adjustments', () => {
    it('applies preset multiplier and city adjustments to housing & living items', () => {
      const sampleItems: UserCostItem[] = [
        {
          id: 'housing-deposit',
          category: 'housing-ticket',
          labelBn: 'ভাড়া',
          labelEn: 'Deposit',
          currency: 'EUR',
          min: 500,
          max: 1000,
          default: 800,
          estimate: 800,
          actualPaid: null,
          arranged: false,
          type: 'refundable',
          noteBn: '',
          noteEn: '',
          sourceUrl: '',
          lastVerified: '',
          order: 0,
        },
        {
          id: 'passport',
          category: 'preparation',
          labelBn: 'পাসপোর্ট',
          labelEn: 'Passport',
          currency: 'BDT',
          min: 3000,
          max: 6000,
          default: 4000,
          estimate: 4000,
          actualPaid: null,
          arranged: false,
          type: 'fee',
          noteBn: '',
          noteEn: '',
          sourceUrl: '',
          lastVerified: '',
          order: 1,
        },
      ];

      // Multiplier 1.25, city adjustment for rent: 1.20
      const adjusted = applyScenario(sampleItems, 1.25, {
        rentMultiplier: 1.20,
        livingMultiplier: 1.10,
      });

      // Passport: 4000 * 1.25 = 5000 (not affected by city rent)
      expect(adjusted.find((i) => i.id === 'passport')?.estimate).toBe(5000);

      // Housing deposit: 800 * 1.25 * 1.20 = 1200
      expect(adjusted.find((i) => i.id === 'housing-deposit')?.estimate).toBe(1200);
    });
  });

  describe('Timeline & Dynamic Intake Engine', () => {
    it('dynamically computes next upcoming intake without showing past dates', () => {
      // In November 2026, the next intake is Summer 2027 (starts April 2027)
      const novDate = new Date(2026, 10, 20);
      const nextIntakeNov = getNextUpcomingIntake(novDate);
      expect(nextIntakeNov.type).toBe('summer');
      expect(nextIntakeNov.year).toBe(2027);

      // In March 2027, the next intake is Winter 2027 (starts October 2027)
      const marDate = new Date(2027, 2, 10);
      const nextIntakeMar = getNextUpcomingIntake(marDate);
      expect(nextIntakeMar.type).toBe('winter');
      expect(nextIntakeMar.year).toBe(2027);
    });

    it('generates deadlines for winter intake starting October', () => {
      const deadlines = generateDeadlines({ type: 'winter', year: 2026 }, 'en');
      expect(deadlines.length).toBeGreaterThan(0);
      const arrival = deadlines.find((d) => d.id === 'arrive');
      expect(arrival?.date.getMonth()).toBe(9); // 0-indexed: 9 = October
      expect(arrival?.date.getFullYear()).toBe(2026);
    });

    it('generates standard RFC 5545 ICS calendar content', () => {
      const sample = [
        { labelBn: 'IELTS পরীক্ষা', labelEn: 'IELTS Exam', date: new Date(2026, 4, 15) },
      ];
      const ics = generateICS(sample, 'en');
      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('VERSION:2.0');
      expect(ics).toContain('SUMMARY:IELTS Exam');
      expect(ics).toContain('END:VCALENDAR');
    });
  });

  describe('Formatting & Locales (P0 Consistency)', () => {
    it('formats BDT with Bengali digits and South Asian lakh grouping in bn', () => {
      const formatted = formatCurrency(1525000, 'BDT', 'bn');
      // Must contain Bengali currency symbol ৳ and Bengali digits
      expect(formatted).toContain('৳');
      expect(formatted).toContain('১৫,২৫,০০০');
    });

    it('formats BDT with Latin digits and standard notation in en', () => {
      const formatted = formatCurrency(1525000, 'BDT', 'en');
      expect(formatted).toContain('৳');
      expect(formatted).toContain('15,25,000');
    });

    it('converts Latin numbers to Bengali digits accurately', () => {
      expect(toBanglaDigits('0123456789')).toBe('০১২৩৪৫৬৭৮৯');
      expect(toBanglaDigits(42)).toBe('৪২');
    });

    it('extracts clean domain from source URLs', () => {
      expect(extractDomain('https://www.daad.de/en/study-and-research/')).toBe('daad.de');
      expect(extractDomain('https://dhaka.diplo.de/bd-en/service/visa')).toBe('dhaka.diplo.de');
      expect(extractDomain('')).toBe('');
    });

    it('evaluates freshness status correctly (<30d fresh, <90d moderate, >90d stale)', () => {
      const now = new Date();
      const freshDate = new Date(now.getTime() - 10 * 24 * 3600 * 1000).toISOString();
      const recentDate = new Date(now.getTime() - 45 * 24 * 3600 * 1000).toISOString();
      const staleDate = new Date(now.getTime() - 120 * 24 * 3600 * 1000).toISOString();

      expect(getFreshnessStatus(freshDate).status).toBe('fresh');
      expect(getFreshnessStatus(recentDate).status).toBe('moderate');
      expect(getFreshnessStatus(staleDate).status).toBe('stale');
    });
  });

  describe('Smart Insights Generation', () => {
    it('generates meaningful Bangla and English insights comparing like-with-like', () => {
      const mockSummary: BudgetSummary = {
        totalMin: 1500000,
        totalMax: 2000000,
        totalSelected: 2200000,
        totalActual: 500000,
        totalMinBDT: 1500000,
        totalMaxBDT: 2000000,
        totalSelectedBDT: 2200000,
        totalActualBDT: 500000,
        sunkMinBDT: 400000,
        sunkMaxBDT: 600000,
        sunkSelectedBDT: 700000,
        sunkActualBDT: 150000,
        retainedMinBDT: 1100000,
        retainedMaxBDT: 1400000,
        retainedSelectedBDT: 1500000,
        retainedActualBDT: 350000,
        byCategory: {},
        arrangedCount: 5,
        totalCount: 15,
        completedSteps: [],
      };

      const bnInsights = generateInsights(mockSummary, 128, 2, 'bn');
      expect(bnInsights.length).toBeGreaterThan(0);
      expect(bnInsights.some((msg) => msg.includes('তহবিল') || msg.includes('বেশি') || msg.includes('প্রস্তুত'))).toBe(true);

      const enInsights = generateInsights(mockSummary, 128, 2, 'en');
      expect(enInsights.length).toBeGreaterThan(0);
      expect(enInsights.some((msg) => msg.includes('own money') || msg.includes('baseline') || msg.includes('available cash'))).toBe(true);
    });
  });
});
