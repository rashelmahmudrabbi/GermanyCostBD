'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { decodeShareState } from '@/lib/utils';
import { calculateBudget, getEffectiveRate } from '@/lib/budget';
import { formatCurrency } from '@/lib/utils';
import costsData from '@/data/costs.json';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/hero/HeroSection';
import { JourneyStepper } from '@/components/stepper/JourneyStepper';
import { CostList } from '@/components/costs/CostList';
import { BudgetCharts } from '@/components/charts/BudgetCharts';
import { ExchangeRatePanel } from '@/components/exchange/ExchangeRatePanel';
import { ScenarioCompare } from '@/components/scenarios/ScenarioCompare';
import { TimelineView } from '@/components/timeline/TimelineView';
import { SmartInsights } from '@/components/insights/SmartInsights';
import { ExportShare } from '@/components/export/ExportShare';
import { MiniSummaryBar } from '@/components/costs/MiniSummaryBar';
import { FeeChangeBanner } from '@/components/admin/FeeChangeBanner';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

export default function HomePage() {
  const t = useT();
  const { items, setItems, exchangeRate, language } = useStore();
  const [isSharedMode, setIsSharedMode] = useState(false);
  const [mountedDate, setMountedDate] = useState<string>('');

  useEffect(() => {
    setMountedDate(new Date().toLocaleDateString());
  }, []);

  // Check URL hash for shared configuration on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash.startsWith('#share=')) {
      const hashData = window.location.hash.replace('#share=', '');
      const decoded: any = decodeShareState(hashData);
      if (decoded && Array.isArray(decoded.items)) {
        setIsSharedMode(true);
        // Apply shared values to items
        setItems(
          items.map((it) => {
            const sharedItem = decoded.items.find((si: any) => si.id === it.id);
            if (sharedItem) {
              return {
                ...it,
                estimate: sharedItem.estimate,
                actualPaid: sharedItem.actualPaid,
                arranged: sharedItem.arranged,
              };
            }
            return it;
          })
        );
      }
    }
  }, []);

  const effectiveRate = getEffectiveRate(
    exchangeRate.manualOverride ? (exchangeRate.manualRate || exchangeRate.rate) : exchangeRate.rate,
    exchangeRate.bankMargin
  );

  const budget = calculateBudget(items, effectiveRate, 0, costsData.categories as any[]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary/20">
      <Header />

      {/* Shared Read-Only Notification Banner */}
      {isSharedMode && (
        <div className="bg-blue-600 text-white text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2 print:hidden">
          <AlertCircle className="h-4 w-4" />
          <span>
            {language === 'bn'
              ? 'আপনি একটি শেয়ার করা বাজেট পরিকল্পনা দেখছেন (Read-only view)।'
              : 'You are viewing a shared budget plan (Read-only view).'}
          </span>
          <button
            onClick={() => {
              window.location.hash = '';
              setIsSharedMode(false);
            }}
            className="underline ml-2 hover:opacity-80"
          >
            {language === 'bn' ? 'আমার ডেটায় ফিরুন' : 'Exit to my planner'}
          </button>
        </div>
      )}

      {/* Print-Only Header (for PDF export) */}
      <div className="hidden print:block p-8 border-b text-black">
        <h1 className="text-2xl font-bold">GermanyCostBD — Study Abroad Cost Report</h1>
        <p className="text-sm text-gray-600 mt-1">Generated: {mountedDate || 'Recently'}</p>
        <div className="grid grid-cols-3 gap-4 mt-4 p-4 border rounded">
          <div>
            <p className="text-xs text-gray-500">{t('totalBudgetRange')}</p>
            <p className="text-lg font-bold font-mono">
              {formatCurrency(budget.totalMinBDT, 'BDT', language)} – {formatCurrency(budget.totalMaxBDT, 'BDT', language)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">{t('selectedBudget')}</p>
            <p className="text-lg font-bold font-mono text-blue-700">
              {formatCurrency(budget.totalSelectedBDT, 'BDT', language)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">{t('arranged')}</p>
            <p className="text-lg font-bold font-mono text-green-700">
              {budget.arrangedCount} / {budget.totalCount} items
            </p>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Live fee refresh notification banner if any */}
        <div className="print:hidden">
          <FeeChangeBanner />
        </div>

        {/* Hero Section */}
        <div className="print:hidden">
          <HeroSection />
        </div>

        {/* Journey Stepper */}
        <div className="print:hidden">
          <JourneyStepper />
        </div>

        {/* Main Content Layout: Costs List + Side Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Costs Checklist & Items */}
          <div className="lg:col-span-8 space-y-8">
            <CostList />

            {/* Smart Insights */}
            <div className="print:hidden">
              <SmartInsights />
            </div>

            {/* Scenario Compare */}
            <div className="print:hidden">
              <ScenarioCompare />
            </div>

            {/* Timeline View */}
            <div className="print:hidden">
              <TimelineView />
            </div>
          </div>

          {/* Right Sidebar: Rate Panel, Charts, Export/Share */}
          <aside className="lg:col-span-4 space-y-6 print:hidden lg:sticky lg:top-20">
            <ExchangeRatePanel />
            <BudgetCharts />
            <ExportShare />
          </aside>
        </div>

        {/* Printable Full Breakdown Table for PDF Export */}
        <div className="hidden print:block space-y-4 pt-6">
          <h2 className="text-xl font-bold border-b pb-2">Full Cost Items Breakdown</h2>
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-2">Item</th>
                <th className="py-2">Category</th>
                <th className="py-2 text-right">Estimate</th>
                <th className="py-2 text-right">BDT Equivalent</th>
                <th className="py-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="py-1.5 font-medium">{item.labelEn}</td>
                  <td className="py-1.5 text-xs text-gray-500 capitalize">{item.category}</td>
                  <td className="py-1.5 text-right font-mono">{formatCurrency(item.estimate, item.currency, 'en')}</td>
                  <td className="py-1.5 text-right font-mono">
                    {formatCurrency(
                      item.currency === 'BDT' ? item.estimate : item.estimate * effectiveRate,
                      'BDT',
                      'en'
                    )}
                  </td>
                  <td className="py-1.5 text-center font-mono text-xs">
                    {item.arranged ? 'Arranged' : 'Pending'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      <Footer />
      <MiniSummaryBar />
    </div>
  );
}
