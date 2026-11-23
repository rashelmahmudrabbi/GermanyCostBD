'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { decodeShareState, formatCurrency, formatDateLocalized, isRetainedFund } from '@/lib/utils';
import { calculateBudget, getEffectiveRate } from '@/lib/budget';
import costsData from '@/data/costs.json';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/hero/HeroSection';
import { JourneyStepper } from '@/components/stepper/JourneyStepper';
import { CostList } from '@/components/costs/CostList';
import { BudgetCharts } from '@/components/charts/BudgetCharts';
import { ScenarioCompare } from '@/components/scenarios/ScenarioCompare';
import { TimelineView } from '@/components/timeline/TimelineView';
import { SmartInsights } from '@/components/insights/SmartInsights';
import { ExportShare } from '@/components/export/ExportShare';
import { MiniSummaryBar } from '@/components/costs/MiniSummaryBar';
import { StickySummarySidebar } from '@/components/layout/StickySummarySidebar';
import { FeeChangeBanner } from '@/components/admin/FeeChangeBanner';
import { AlertCircle, BarChart3, CheckSquare, Layers, Calendar } from 'lucide-react';

export default function HomePage() {
  const t = useT();
  const { items, setItems, exchangeRate, language } = useStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'checklist' | 'scenarios' | 'timeline'>('overview');
  const [isSharedMode, setIsSharedMode] = useState(false);
  const [printDate, setPrintDate] = useState<string>('');

  useEffect(() => {
    // Generate date only on client to avoid Next.js hydration/prerender mismatch
    setPrintDate(formatDateLocalized(new Date().toISOString(), language));
  }, [language]);

  // Check URL hash for shared configuration or initial tab on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.startsWith('#share=')) {
        const hashData = hash.replace('#share=', '');
        const decoded: any = decodeShareState(hashData);
        if (decoded && Array.isArray(decoded.items)) {
          setIsSharedMode(true);
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
      } else if (hash === '#checklist') {
        setActiveTab('checklist');
      } else if (hash === '#scenarios') {
        setActiveTab('scenarios');
      } else if (hash === '#timeline') {
        setActiveTab('timeline');
      }
    }
  }, []);

  const effectiveRate = getEffectiveRate(
    exchangeRate.manualOverride ? (exchangeRate.manualRate || exchangeRate.rate) : exchangeRate.rate,
    exchangeRate.bankMargin
  );

  const budget = calculateBudget(items, effectiveRate, 0, costsData.categories as any[]);

  const handleTabChange = (tabId: string) => {
    if (['overview', 'checklist', 'scenarios', 'timeline'].includes(tabId)) {
      setActiveTab(tabId as any);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navTabs = [
    { id: 'overview', label: t('navOverview'), icon: BarChart3 },
    { id: 'checklist', label: t('navChecklist'), icon: CheckSquare },
    { id: 'scenarios', label: t('navScenarios'), icon: Layers },
    { id: 'timeline', label: t('navTimeline'), icon: Calendar },
  ];

  // Partition items for print report
  const sunkItems = items.filter(it => !isRetainedFund(it.id));
  const retainedItems = items.filter(it => isRetainedFund(it.id));

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary/20">
      <Header activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Shared Read-Only Notification Banner */}
      {isSharedMode && (
        <div className="bg-blue-600 text-white text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2 print:hidden">
          <AlertCircle className="h-4 w-4" />
          <span>
            {language === 'bn'
              ? 'আপনি একটি শেয়ার করা বাজেট পরিকল্পনা দেখছেন (রিড-অনলি মোড)।'
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

      {/* =========================================================================
          PRINT-ONLY REPORT (Hidden on screen, renders cleanly in PDF / Print)
          P0 Requirement 2 & 7: 2-Group split + hidden on screen
         ========================================================================= */}
      <div className="hidden print:block p-8 text-black space-y-6">
        <div className="border-b pb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black tracking-tight">GermanyCostBD</h1>
            <span className="text-xs text-gray-500">germanycostbd.vercel.app</span>
          </div>
          <p className="text-sm font-semibold text-gray-700 mt-1">
            {language === 'bn' ? 'উচ্চশিক্ষা খরচ পরিকল্পনা ও প্রস্তুতি রিপোর্ট' : 'Study Abroad Cost Report & Budget Breakdown'}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {language === 'bn' ? 'তৈরির তারিখ' : 'Generated'}: {printDate}
          </p>
        </div>

        {/* 2-Group Summary Cards in Print */}
        <div className="grid grid-cols-3 gap-4 p-4 border border-gray-300 rounded-lg bg-gray-50">
          <div>
            <p className="text-xs font-bold text-gray-600 uppercase">{t('sunkFundsLabel')}</p>
            <p className="text-xl font-bold font-mono text-gray-900 mt-0.5">
              {formatCurrency(budget.sunkSelectedBDT, 'BDT', language)}
            </p>
            <p className="text-[10px] text-gray-500">
              {t('range')}: {formatCurrency(budget.sunkMinBDT, 'BDT', language)} – {formatCurrency(budget.sunkMaxBDT, 'BDT', language)}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-600 uppercase">{t('retainedFundsLabel')}</p>
            <p className="text-xl font-bold font-mono text-emerald-800 mt-0.5">
              {formatCurrency(budget.retainedSelectedBDT, 'BDT', language)}
            </p>
            <p className="text-[10px] text-gray-500">{t('retainedFundsDesc')}</p>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-600 uppercase">{t('combinedTotal')}</p>
            <p className="text-xl font-bold font-mono text-blue-900 mt-0.5">
              {formatCurrency(budget.totalSelectedBDT, 'BDT', language)}
            </p>
            <p className="text-[10px] text-gray-500">
              {t('arranged')}: {budget.arrangedCount}/{budget.totalCount} ({Math.round((budget.arrangedCount / budget.totalCount) * 100)}%)
            </p>
          </div>
        </div>

        {/* Group 1: Non-recoverable Costs Table */}
        <div className="space-y-2">
          <h2 className="text-base font-bold text-gray-900 border-b pb-1">
            ১. {t('sunkFundsLabel')} ({t('sunkFundsDesc')})
          </h2>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-300 bg-gray-100">
                <th className="py-1.5 px-2">{language === 'bn' ? 'খরচের খাত' : 'Item'}</th>
                <th className="py-1.5 px-2">{language === 'bn' ? 'ক্যাটাগরি' : 'Category'}</th>
                <th className="py-1.5 px-2 text-right">{language === 'bn' ? 'মূল কারেন্সি' : 'Original'}</th>
                <th className="py-1.5 px-2 text-right">{language === 'bn' ? 'বিডিটি সমতুল্য' : 'BDT Eq.'}</th>
                <th className="py-1.5 px-2 text-center">{language === 'bn' ? 'অবস্থা' : 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {sunkItems.map((item) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="py-1.5 px-2 font-medium">{language === 'bn' ? item.labelBn : item.labelEn}</td>
                  <td className="py-1.5 px-2 text-gray-600 capitalize">{item.category}</td>
                  <td className="py-1.5 px-2 text-right font-mono">{formatCurrency(item.estimate, item.currency, language)}</td>
                  <td className="py-1.5 px-2 text-right font-mono font-semibold">
                    {formatCurrency(item.currency === 'BDT' ? item.estimate : item.estimate * effectiveRate, 'BDT', language)}
                  </td>
                  <td className="py-1.5 px-2 text-center text-[10px]">
                    {item.arranged ? (language === 'bn' ? 'সংগৃহীত' : 'Arranged') : (language === 'bn' ? 'অপেক্ষমাণ' : 'Pending')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Group 2: Retained Funds Table */}
        <div className="space-y-2 pt-4">
          <h2 className="text-base font-bold text-gray-900 border-b pb-1">
            ২. {t('retainedFundsLabel')} ({t('retainedFundsDesc')})
          </h2>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-300 bg-gray-100">
                <th className="py-1.5 px-2">{language === 'bn' ? 'খাত' : 'Item'}</th>
                <th className="py-1.5 px-2">{language === 'bn' ? 'ক্যাটাগরি' : 'Category'}</th>
                <th className="py-1.5 px-2 text-right">{language === 'bn' ? 'মূল কারেন্সি' : 'Original'}</th>
                <th className="py-1.5 px-2 text-right">{language === 'bn' ? 'বিডিটি সমতুল্য' : 'BDT Eq.'}</th>
                <th className="py-1.5 px-2 text-center">{language === 'bn' ? 'অবস্থা' : 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {retainedItems.map((item) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="py-1.5 px-2 font-medium">{language === 'bn' ? item.labelBn : item.labelEn}</td>
                  <td className="py-1.5 px-2 text-gray-600 capitalize">{item.category}</td>
                  <td className="py-1.5 px-2 text-right font-mono">{formatCurrency(item.estimate, item.currency, language)}</td>
                  <td className="py-1.5 px-2 text-right font-mono font-semibold">
                    {formatCurrency(item.currency === 'BDT' ? item.estimate : item.estimate * effectiveRate, 'BDT', language)}
                  </td>
                  <td className="py-1.5 px-2 text-center text-[10px]">
                    {item.arranged ? (language === 'bn' ? 'সংগৃহীত' : 'Arranged') : (language === 'bn' ? 'অপেক্ষমাণ' : 'Pending')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-4 border-t text-[10px] text-gray-500 flex justify-between items-center">
          <span>{t('footerDisclaimer')}</span>
          <span>€1 = ৳{effectiveRate.toFixed(2)}</span>
        </div>
      </div>

      {/* =========================================================================
          SCREEN MAIN INTERFACE
         ========================================================================= */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 space-y-6 print:hidden">
        {/* Automated fee refresh notice if any */}
        <FeeChangeBanner />

        {/* In-page Tab Bar */}
        <div className="flex items-center justify-start sm:justify-center overflow-x-auto no-scrollbar gap-1.5 p-1 bg-muted/60 border border-border/60 rounded-xl">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-background text-foreground shadow-2xs border border-border/80'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: OVERVIEW (Hero, 2-group budget charts, smart insights) */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <HeroSection />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 space-y-6">
                <BudgetCharts />
                <SmartInsights />
              </div>
              <aside className="lg:col-span-4 space-y-6">
                <StickySummarySidebar />
                <ExportShare />
              </aside>
            </div>
          </div>
        )}

        {/* Tab 2: CHECKLIST (Journey stepper + Category accordions + Search & Filter) */}
        {activeTab === 'checklist' && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <JourneyStepper />
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 space-y-6">
                <CostList />
              </div>
              <aside className="lg:col-span-4 space-y-6">
                <StickySummarySidebar />
                <ExportShare />
              </aside>
            </div>
          </div>
        )}

        {/* Tab 3: PLAN & COMPARE (Scenarios, City selector, target intake) */}
        {activeTab === 'scenarios' && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 space-y-6">
                <ScenarioCompare />
              </div>
              <aside className="lg:col-span-4 space-y-6">
                <StickySummarySidebar />
                <ExportShare />
              </aside>
            </div>
          </div>
        )}

        {/* Tab 4: TIMELINE (Deadlines, status, calendar export) */}
        {activeTab === 'timeline' && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 space-y-6">
                <TimelineView />
              </div>
              <aside className="lg:col-span-4 space-y-6">
                <StickySummarySidebar />
                <ExportShare />
              </aside>
            </div>
          </div>
        )}
      </main>

      <Footer />
      <MiniSummaryBar />
    </div>
  );
}
