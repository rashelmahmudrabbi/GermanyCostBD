'use client';

import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { calculateBudget, getEffectiveRate } from '@/lib/budget';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import costsData from '@/data/costs.json';
import { PieChart as PieIcon, BarChart2, Table } from 'lucide-react';

const PALETTE = [
  '#0284c7', // sky
  '#6366f1', // indigo
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ec4899', // pink
  '#14b8a6', // teal
];

export function BudgetCharts() {
  const t = useT();
  const { items, exchangeRate, language, setActiveStep, activeStep } = useStore();
  const [viewMode, setViewMode] = useState<'donut' | 'bar' | 'table'>('donut');

  const categories = costsData.categories;

  const effectiveRate = getEffectiveRate(
    exchangeRate.manualOverride ? (exchangeRate.manualRate || exchangeRate.rate) : exchangeRate.rate,
    exchangeRate.bankMargin
  );

  const budget = useMemo(() => {
    return calculateBudget(items, effectiveRate, 0, categories as any[]);
  }, [items, effectiveRate, categories]);

  // Donut chart data: category distribution for selected budget
  const donutData = useMemo(() => {
    return categories
      .map((cat, idx) => {
        const catBudget = budget.byCategory[cat.id];
        const value = catBudget ? Math.round(catBudget.selectedBDT) : 0;
        return {
          id: cat.id,
          step: idx,
          name: language === 'bn' ? cat.labelBn : cat.labelEn,
          value,
          color: PALETTE[idx % PALETTE.length],
        };
      })
      .filter((d) => d.value > 0);
  }, [categories, budget, language]);

  // Stacked Bar chart data
  const barData = useMemo(() => {
    return categories.map((cat, idx) => {
      const catBudget = budget.byCategory[cat.id];
      return {
        name: language === 'bn' ? cat.labelBn : cat.labelEn,
        step: idx,
        min: catBudget ? Math.round(catBudget.minBDT) : 0,
        selected: catBudget ? Math.round(catBudget.selectedBDT) : 0,
        actual: catBudget ? Math.round(catBudget.actualBDT) : 0,
        max: catBudget ? Math.round(catBudget.maxBDT) : 0,
      };
    });
  }, [categories, budget, language]);

  const handlePieClick = (entry: any) => {
    if (entry && typeof entry.step === 'number') {
      setActiveStep(activeStep === entry.step ? null : entry.step);
      const element = document.getElementById(`step-${entry.step}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <Card className="scroll-mt-24 border-border/70 shadow-xs" id="budget-charts">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base md:text-lg font-bold flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-primary" />
              <span>{t('navCharts')}</span>
            </CardTitle>
            <CardDescription className="text-xs">
              {language === 'bn'
                ? 'ক্যাটাগরি ভিত্তিক খরচের অনুপাত ও তুলনা'
                : 'Category expenditure distribution and comparison'}
            </CardDescription>
          </div>

          <div className="flex items-center bg-muted/60 p-0.5 rounded-xl border border-border/60 text-xs self-start sm:self-auto">
            <button
              onClick={() => setViewMode('donut')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'donut'
                  ? 'bg-background text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <PieIcon className="h-3 w-3" />
              <span>{language === 'bn' ? 'পাই' : 'Donut'}</span>
            </button>
            <button
              onClick={() => setViewMode('bar')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'bar'
                  ? 'bg-background text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChart2 className="h-3 w-3" />
              <span>{language === 'bn' ? 'বার' : 'Bar'}</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-background text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Table className="h-3 w-3" />
              <span>{language === 'bn' ? 'টেবিল' : 'Table'}</span>
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {/* Category breakdown highlight */}
        <div className="grid grid-cols-2 gap-2 mb-4 p-2.5 rounded-xl bg-muted/30 border border-border/40 text-xs">
          <div>
            <span className="text-[10px] text-muted-foreground block">{t('heroHeadline')}</span>
            <span className="font-bold font-mono text-sm text-foreground">
              {formatCurrency(budget.sunkSelectedBDT, 'BDT', language)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block">{t('retainedFunds')}</span>
            <span className="font-bold font-mono text-sm text-emerald-600 dark:text-emerald-400">
              {formatCurrency(budget.retainedSelectedBDT, 'BDT', language)}
            </span>
          </div>
        </div>

        {viewMode === 'donut' ? (
          <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4">
            <div className="md:col-span-7 h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                    onClick={handlePieClick}
                    cursor="pointer"
                  >
                    {donutData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke={activeStep === entry.step ? '#ffffff' : 'transparent'}
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(val: any) => [
                      formatCurrency(Number(val), 'BDT', language),
                      t('selectedBudget'),
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend list */}
            <div className="md:col-span-5 space-y-1.5 text-xs">
              {donutData.map((d) => {
                const percent =
                  budget.totalSelectedBDT > 0
                    ? Math.round((d.value / budget.totalSelectedBDT) * 100)
                    : 0;
                const isSelected = activeStep === d.step;

                return (
                  <button
                    key={d.id}
                    onClick={() => handlePieClick(d)}
                    className={`w-full flex items-center justify-between p-1.5 rounded-lg transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'bg-primary/10 ring-1 ring-primary'
                        : 'hover:bg-muted/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: d.color }}
                      />
                      <span className="truncate font-medium">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono shrink-0 ml-2">
                      <span>{formatCurrency(d.value, 'BDT', language)}</span>
                      <span className="text-muted-foreground w-7 text-right font-sans text-[11px]">
                        {formatNumber(percent, language)}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : viewMode === 'bar' ? (
          <div className="h-[270px] w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickFormatter={(val) => `৳${(val / 1000).toFixed(0)}k`}
                />
                <RechartsTooltip
                  formatter={(val: any, name: any) => [
                    formatCurrency(Number(val), 'BDT', language),
                    name === 'min'
                      ? t('minBudget')
                      : name === 'selected'
                      ? t('selectedBudget')
                      : name === 'actual'
                      ? t('actualSpent')
                      : t('maxBudget'),
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar dataKey="min" fill="#94a3b8" name={t('minBudget')} radius={[3, 3, 0, 0]} />
                <Bar dataKey="selected" fill="#0284c7" name={t('selectedBudget')} radius={[3, 3, 0, 0]} />
                <Bar dataKey="actual" fill="#10b981" name={t('actualSpent')} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          /* Accessible Table Fallback */
          <div className="overflow-x-auto text-xs pt-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/60 text-muted-foreground">
                  <th className="py-2 pr-3">{t('step')}</th>
                  <th className="py-2 px-2 text-right">{t('minBudget')}</th>
                  <th className="py-2 px-2 text-right">{t('selectedBudget')}</th>
                  <th className="py-2 pl-2 text-right">{t('actualSpent')}</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => {
                  const b = budget.byCategory[cat.id];
                  return (
                    <tr key={cat.id} className="border-b border-border/40 hover:bg-muted/20">
                      <td className="py-2 pr-3 font-medium">
                        {language === 'bn' ? cat.labelBn : cat.labelEn}
                      </td>
                      <td className="py-2 px-2 text-right font-mono">
                        {formatCurrency(b?.minBDT || 0, 'BDT', language)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-semibold">
                        {formatCurrency(b?.selectedBDT || 0, 'BDT', language)}
                      </td>
                      <td className="py-2 pl-2 text-right font-mono text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(b?.actualBDT || 0, 'BDT', language)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
