// Cost item types
export type CostType = 'fee' | 'refundable' | 'released-monthly' | 'optional';
export type Currency = 'BDT' | 'EUR';
export type Language = 'bn' | 'en';
export type Theme = 'light' | 'dark' | 'system';

export interface CostItem {
  id: string;
  category: string;
  labelBn: string;
  labelEn: string;
  currency: Currency;
  min: number;
  max: number;
  default: number;
  type: CostType;
  noteBn: string;
  noteEn: string;
  sourceUrl: string;
  lastVerified: string;
  isCustom?: boolean;
}

export interface UserCostItem extends CostItem {
  arranged: boolean;
  estimate: number;
  actualPaid: number | null;
  order: number;
}

export interface Category {
  id: string;
  step: number;
  labelBn: string;
  labelEn: string;
  icon: string;
}

export interface CostsData {
  version: string;
  lastUpdated: string;
  currency: {
    base: string;
    local: string;
    defaultRate: number;
    defaultBankMargin: number;
  };
  categories: Category[];
  items: CostItem[];
  scenarios: Record<string, ScenarioPreset>;
  cityAdjustments: Record<string, CityAdjustment>;
}

export interface ScenarioPreset {
  labelBn: string;
  labelEn: string;
  description_bn: string;
  description_en: string;
  multiplier: number;
}

export interface CityAdjustment {
  labelBn: string;
  labelEn: string;
  rentMultiplier: number;
  livingMultiplier: number;
}

export interface ExchangeRate {
  rate: number;
  source: string;
  timestamp: number;
  bankMargin: number;
  manualOverride: boolean;
  manualRate?: number;
}

export interface Scenario {
  id: string;
  name: string;
  preset: string;
  city: string;
  items: UserCostItem[];
}

export interface TimelineIntake {
  type: 'winter' | 'summer';
  year: number;
}

export interface TimelineDeadline {
  id: string;
  step: number;
  labelBn: string;
  labelEn: string;
  date: Date;
  completed: boolean;
  status: 'upcoming' | 'overdue' | 'completed';
  relativeMonths: number;
}

export interface BudgetSummary {
  // 1. Non-recoverable costs (fees, flight, prep, initial shopping, pocket money, insurance, etc.)
  sunkMinBDT: number;
  sunkMaxBDT: number;
  sunkSelectedBDT: number;
  sunkActualBDT: number;

  // 2. Funds you still own (blocked account released monthly, refundable housing deposit)
  retainedMinBDT: number;
  retainedMaxBDT: number;
  retainedSelectedBDT: number;
  retainedActualBDT: number;

  // 3. Combined total funds needed
  totalMinBDT: number;
  totalMaxBDT: number;
  totalSelectedBDT: number;
  totalActualBDT: number;

  totalMin: number;
  totalMax: number;
  totalSelected: number;
  totalActual: number;

  byCategory: Record<string, {
    min: number;
    max: number;
    selected: number;
    actual: number;
    minBDT: number;
    maxBDT: number;
    selectedBDT: number;
    actualBDT: number;
    isRetained?: boolean;
  }>;
  arrangedCount: number;
  totalCount: number;
  completedSteps: number[];
}

export interface StoreState {
  // Schema version for migrations
  schemaVersion: number;
  
  // Language & Theme
  language: Language;
  
  // Items
  items: UserCostItem[];
  
  // Exchange rate
  exchangeRate: ExchangeRate;
  
  // Scenarios
  scenarios: Scenario[];
  activeScenarioId: string | null;
  
  // Timeline
  intake: TimelineIntake | null;
  deadlines: TimelineDeadline[];
  
  // UI state
  activeStep: number | null;
  
  // Actions
  setLanguage: (lang: Language) => void;
  setItems: (items: UserCostItem[]) => void;
  updateItem: (id: string, updates: Partial<UserCostItem>) => void;
  addCustomItem: (item: CostItem) => void;
  deleteItem: (id: string) => void;
  reorderItems: (categoryId: string, startIndex: number, endIndex: number) => void;
  toggleArranged: (id: string) => void;
  setEstimate: (id: string, value: number) => void;
  setActualPaid: (id: string, value: number | null) => void;
  setExchangeRate: (rate: Partial<ExchangeRate>) => void;
  setActiveStep: (step: number | null) => void;
  setIntake: (intake: TimelineIntake | null) => void;
  addScenario: (scenario: Scenario) => void;
  removeScenario: (id: string) => void;
  resetToDefaults: () => void;
  importData: (data: string) => void;
  exportData: () => string;
}

export interface PendingFeeChange {
  itemId: string;
  field: 'min' | 'max' | 'default';
  oldValue: number;
  newValue: number;
  source: string;
  detectedAt: string;
  approved: boolean;
}
