'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserCostItem, ExchangeRate, Scenario, TimelineIntake, TimelineDeadline, Language, StoreState } from '@/types';
import costsData from '@/data/costs.json';
import { initializeItems, generateDeadlines } from '@/lib/budget';

const SCHEMA_VERSION = 1;

function getDefaultItems(): UserCostItem[] {
  return initializeItems(costsData as any);
}

function getDefaultExchangeRate(): ExchangeRate {
  return {
    rate: costsData.currency.defaultRate,
    source: 'default',
    timestamp: Date.now(),
    bankMargin: costsData.currency.defaultBankMargin,
    manualOverride: false,
  };
}

// Schema migration logic
function migrateState(persistedState: any, version: number): any {
  if (version === 0) {
    // Migration from version 0 to 1
    return {
      ...persistedState,
      schemaVersion: SCHEMA_VERSION,
    };
  }
  return persistedState;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      schemaVersion: SCHEMA_VERSION,
      language: 'bn' as Language,
      items: getDefaultItems(),
      exchangeRate: getDefaultExchangeRate(),
      scenarios: [],
      activeScenarioId: null,
      intake: null,
      deadlines: [],
      activeStep: null,

      setLanguage: (language: Language) => set({ language }),

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
          const deadlines = generateDeadlines(intake, get().language).map((d) => ({
            ...d,
            completed: false,
          }));
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

      resetToDefaults: () =>
        set({
          items: getDefaultItems(),
          exchangeRate: getDefaultExchangeRate(),
          scenarios: [],
          activeScenarioId: null,
          intake: null,
          deadlines: [],
          activeStep: null,
        }),

      importData: (jsonString: string) => {
        try {
          const data = JSON.parse(jsonString);
          if (data.items) {
            set({
              items: data.items,
              exchangeRate: data.exchangeRate || getDefaultExchangeRate(),
              scenarios: data.scenarios || [],
              intake: data.intake || null,
              deadlines: data.deadlines || [],
            });
          }
        } catch (e) {
          console.error('Import failed:', e);
        }
      },

      exportData: () => {
        const state = get();
        return JSON.stringify({
          version: SCHEMA_VERSION,
          exportedAt: new Date().toISOString(),
          items: state.items,
          exchangeRate: state.exchangeRate,
          scenarios: state.scenarios,
          intake: state.intake,
          deadlines: state.deadlines,
        }, null, 2);
      },
    }),
    {
      name: 'germanycostbd-storage',
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') {
          return localStorage;
        }
        // SSR fallback
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
