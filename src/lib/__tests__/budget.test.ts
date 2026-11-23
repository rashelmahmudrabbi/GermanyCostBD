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
} from '../budget';
import costsData from '../../data/costs.json';
import { UserCostItem } from '@/types';

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

    it('aggregates totals, category breakdowns, and completed steps accurately', () => {
      const sampleCategories = [
        { id: 'cat1', step: 0 },
        { id: 'cat2', step: 1 },
      ];

      const sampleItems: UserCostItem[] = [
        {
          id: 'item1',
          category: 'cat1',
          labelBn: 'আইটেম ১',
          labelEn: 'Item 1',
          currency: 'EUR',
          min: 100,
          max: 200,
          default: 150,
          estimate: 150,
          actualPaid: 140,
          arranged: true,
          type: 'fee',
          noteBn: '',
          noteEn: '',
          sourceUrl: '',
          lastVerified: '2026-11-20',
          order: 0,
        },
        {
          id: 'item2',
          category: 'cat2',
          labelBn: 'আইটেম ২',
          labelEn: 'Item 2',
          currency: 'BDT',
          min: 5000,
          max: 10000,
          default: 8000,
          estimate: 8000,
          actualPaid: null,
          arranged: false,
          type: 'fee',
          noteBn: '',
          noteEn: '',
          sourceUrl: '',
          lastVerified: '2026-11-20',
          order: 1,
        },
      ];

      // Exchange rate: 100 BDT/EUR, 0% margin
      const summary = calculateBudget(sampleItems, 100, 0, sampleCategories);

      // item1: min 100 EUR = 10,000 BDT; item2: min 5,000 BDT => totalMin = 15,000 BDT
      expect(summary.totalMinBDT).toBe(15000);

      // item1: max 200 EUR = 20,000 BDT; item2: max 10,000 BDT => totalMax = 30,000 BDT
      expect(summary.totalMaxBDT).toBe(30000);

      // item1: estimate 150 EUR = 15,000 BDT; item2: estimate 8,000 BDT => totalSelected = 23,000 BDT
      expect(summary.totalSelectedBDT).toBe(23000);

      // item1: actualPaid 140 EUR = 14,000 BDT; item2: actualPaid null => totalActual = 14,000 BDT
      expect(summary.totalActualBDT).toBe(14000);

      // Arranged: item1 is true, item2 is false => 1 arranged
      expect(summary.arrangedCount).toBe(1);
      expect(summary.totalCount).toBe(2);

      // Category 1 is 100% arranged => completed step 0
      expect(summary.completedSteps).toContain(0);
      expect(summary.completedSteps).not.toContain(1);
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

  describe('Timeline & Calendar Export', () => {
    it('generates deadlines for winter intake starting October', () => {
      const deadlines = generateDeadlines({ type: 'winter', year: 2026 }, 'en');
      expect(deadlines.length).toBeGreaterThan(0);
      // Arrival should be in October 2026
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

  describe('Smart Insights Generation', () => {
    it('generates meaningful Bangla and English insights', () => {
      const mockSummary = {
        totalMin: 1000000,
        totalMax: 2000000,
        totalSelected: 2200000,
        totalActual: 500000,
        totalMinBDT: 1000000,
        totalMaxBDT: 2000000,
        totalSelectedBDT: 2200000,
        totalActualBDT: 500000,
        byCategory: {},
        arrangedCount: 5,
        totalCount: 15,
        completedSteps: [],
      };

      const bnInsights = generateInsights(mockSummary, 128, 2, 'bn');
      expect(bnInsights.length).toBeGreaterThan(0);
      expect(bnInsights.some((msg) => msg.includes('সঞ্চয় প্রয়োজন') || msg.includes('বেশি'))).toBe(true);

      const enInsights = generateInsights(mockSummary, 128, 2, 'en');
      expect(enInsights.length).toBeGreaterThan(0);
      expect(enInsights.some((msg) => msg.includes('savings') || msg.includes('over the standard'))).toBe(true);
    });
  });
});
