'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserCostItem, ExchangeRate, Scenario, TimelineIntake, TimelineDeadline, Language, StoreState } from '@/types';
import costsData from '@/data/costs.json';
import { initializeItems, generateDeadlines, getNextUpcomingIntake } from '@/lib/budget';

const SCHEMA_VERSION = 3;

function getDefaultItems(): UserCostItem[] {
  return initializeItems(costsData as any);
}

function getDefaultExchangeRate(): ExchangeRate {
  return {
    rate: costsData.currency.defaultRate,
    source: 'open.er-api.com',
    timestamp: Date.now(),
    bankMargin: costsData.currency.defaultBankMargin,
    manualOverride: false,
  };
}

function getDefaultIntake(): TimelineIntake {
  return getNextUpcomingIntake(new Date());
}

// Safe schema migration logic
function migrateState(persistedState: any, version: number): any {
  let updatedItems = (persistedState.items || []).map((item: UserCostItem) => {
    if (item.id === 'semester-contribution') {
      return { ...item, category: 'university' };
    }
    if (item.id === 'health-insurance-travel') {
      return {
        ...item,
        labelBn: 'ট্র্যাভেল হেলথ ইন্সুরেন্স (ভিসা)',
        labelEn: 'Travel health insurance (visa)',
        category: 'visa',
      };
    }
    if (item.id === 'health-insurance-monthly') {
      return {
        ...item,
        labelBn: 'সরকারি স্বাস্থ্য বীমা (১ম মাস)',
        labelEn: 'Statutory health insurance (first month)',
        category: 'arrival',
      };
    }
    if (item.id === 'blocked-account') {
      return {
        ...item,
        noteBn: 'জার্মান ভিসার বাধ্যতামূলক তহবিল। €৯৯২ × ১২ মাস = €১১,৯০৪। প্রতি মাসে €৯৯২ করে নিজের জার্মান ব্যাংক একাউন্টে রিলিজ হবে।',
        noteEn: 'Mandatory visa living fund. €992 × 12 months = €11,904. Released monthly (€992/month) to your German checking account.',
      };
    }
    if (item.id === 'ielts') {
      const isOutdated = item.estimate === 25500 || item.estimate === 26000 || item.default === 25500;
      return {
        ...item,
        min: 31100,
        max: 31100,
        default: 31100,
        estimate: isOutdated ? 31100 : item.estimate,
        noteBn: 'ব্রিটিশ কাউন্সিল ও আইডিপি বাংলাদেশ IELTS একাডেমিক টেস্টের অফিসিয়াল ফি (৩১,১০০ টাকা)।',
        noteEn: 'Official British Council & IDP Bangladesh IELTS Academic test fee (BDT 31,100).',
        sourceUrl: 'https://www.britishcouncil.org.bd/en/exam/ielts/dates-fees-locations',
        lastVerified: '2026-11-23',
      };
    }
    return item;
  });

  if (!updatedItems || updatedItems.length === 0) {
    updatedItems = getDefaultItems();
  }

  const defaultIntake = getDefaultIntake();

  return {
    ...persistedState,
    schemaVersion: SCHEMA_VERSION,
    items: updatedItems,
    intake: persistedState.intake || defaultIntake,
    deadlines: generateDeadlines(persistedState.intake || defaultIntake, persistedState.language || 'bn'),
  };
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => {
      const initialIntake = getDefaultIntake();
      return {
        schemaVersion: SCHEMA_VERSION,
        language: 'bn' as Language,
        items: getDefaultItems(),
        exchangeRate: getDefaultExchangeRate(),
        scenarios: [],
        activeScenarioId: null,
        intake: initialIntake,
        deadlines: generateDeadlines(initialIntake, 'bn'),
        activeStep: null,

        setLanguage: (language: Language) => {
          set({ language });
          const currentIntake = get().intake;
          if (currentIntake) {
            set({ deadlines: generateDeadlines(currentIntake, language) });
          }
        },

        setItems: (items: UserCostItem[]) => set({ items }),

        updateItem: (id: string, updates: Partial<UserCostItem>) =>
          set((state) => ({
            items: state.items.map((item) =>
              item.id === id ? { ...item, ...updates } : item
            ),
          })),

        addCustomItem: (item) =>
          set((state) => ({
            items: [
              ...state.items,
              {
                ...item,
                isCustom: true,
                arranged: false,
                estimate: item.default,
                actualPaid: null,
                order: state.items.length,
              },
            ],
          })),

        deleteItem: (id: string) =>
          set((state) => ({
            items: state.items.filter((item) => item.id !== id),
          })),

        reorderItems: (categoryId: string, startIndex: number, endIndex: number) =>
          set((state) => {
            const categoryItems = state.items
              .filter((i) => i.category === categoryId)
              .sort((a, b) => a.order - b.order);
            const otherItems = state.items.filter((i) => i.category !== categoryId);

            const [moved] = categoryItems.splice(startIndex, 1);
            categoryItems.splice(endIndex, 0, moved);

            const reordered = categoryItems.map((item, idx) => ({
              ...item,
              order: idx,
            }));

            return { items: [...otherItems, ...reordered] };
          }),

        toggleArranged: (id: string) =>
          set((state) => ({
            items: state.items.map((item) =>
              item.id === id ? { ...item, arranged: !item.arranged } : item
            ),
          })),

        setEstimate: (id: string, value: number) =>
          set((state) => ({
            items: state.items.map((item) =>
              item.id === id ? { ...item, estimate: value } : item
            ),
          })),

        setActualPaid: (id: string, value: number | null) =>
          set((state) => ({
            items: state.items.map((item) =>
              item.id === id ? { ...item, actualPaid: value } : item
            ),
          })),

        setExchangeRate: (rate: Partial<ExchangeRate>) =>
          set((state) => ({
            exchangeRate: { ...state.exchangeRate, ...rate },
          })),

        setActiveStep: (step: number | null) => set({ activeStep: step }),

        setIntake: (intake: TimelineIntake | null) => {
          if (intake) {
            const deadlines = generateDeadlines(intake, get().language);
            set({ intake, deadlines });
          } else {
            set({ intake: null, deadlines: [] });
          }
        },

        addScenario: (scenario: Scenario) =>
          set((state) => ({
            scenarios: [...state.scenarios.slice(0, 2), scenario],
          })),

        removeScenario: (id: string) =>
          set((state) => ({
            scenarios: state.scenarios.filter((s) => s.id !== id),
          })),

        resetToDefaults: () => {
          const defaultIntake = getDefaultIntake();
          set({
            items: getDefaultItems(),
            exchangeRate: getDefaultExchangeRate(),
            scenarios: [],
            activeScenarioId: null,
            intake: defaultIntake,
            deadlines: generateDeadlines(defaultIntake, get().language),
            activeStep: null,
          });
        },

        importData: (jsonString: string) => {
          try {
            const data = JSON.parse(jsonString);
            if (data.items) {
              set({
                items: data.items,
                exchangeRate: data.exchangeRate || getDefaultExchangeRate(),
                scenarios: data.scenarios || [],
                intake: data.intake || getDefaultIntake(),
                deadlines: data.deadlines || generateDeadlines(data.intake || getDefaultIntake(), get().language),
              });
            }
          } catch (e) {
            console.error('Import failed:', e);
          }
        },

        exportData: () => {
          const state = get();
          return JSON.stringify(
            {
              version: SCHEMA_VERSION,
              exportedAt: new Date().toISOString(),
              items: state.items,
              exchangeRate: state.exchangeRate,
              scenarios: state.scenarios,
              intake: state.intake,
              deadlines: state.deadlines,
            },
            null,
            2
          );
        },
      };
    },
    {
      name: 'germanycostbd-storage',
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') {
          return localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      migrate: migrateState,
      partialize: (state) => ({
        schemaVersion: state.schemaVersion,
        language: state.language,
        items: state.items,
        exchangeRate: state.exchangeRate,
        scenarios: state.scenarios,
        activeScenarioId: state.activeScenarioId,
        intake: state.intake,
        deadlines: state.deadlines,
        activeStep: state.activeStep,
      }),
    }
  )
);
