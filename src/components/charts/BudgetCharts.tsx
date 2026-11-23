'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { calculateBudget, getEffectiveRate } from '@/lib/budget';
import { formatCurrency, formatNumber } from '@/lib/utils';
import costsData from '@/data/costs.json';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, Legend } from 'recharts';
import { PieChart as PieIcon, BarChart2, Table } from 'lucide-react';

interface BudgetChartsProps {
  categories?: any[];
}

export function BudgetCharts({ categories = costsData.categories }: BudgetChartsProps) {
  const t = useT();
  const { items, exchangeRate, activeStep, setActiveStep, language } = useStore();
  const [viewMode, setViewMode] = useState<'donut' | 'bar' | 'table'>('donut');

  const effectiveRate = getEffectiveRate(
    exchangeRate.manualOverride ? (exchangeRate.manualRate || exchangeRate.rate) : exchangeRate.rate,
    exchangeRate.bankMargin
  );

  const budget = calculateBudget(items, effectiveRate, 0, categories);

  // Palette matching design tokens
  const categoryColors: Record<string, string> = {
    preparation: '#0284c7', // Sky
    university: '#6366f1',  // Indigo
    'blocked-account': '#10b981', // Emerald
    visa: '#f59e0b',        // Amber
    'housing-ticket': '#ec4899', // Pink
    arrival: '#14b8a6',     // Teal
  };

  const donutData = useMemo(() => {
    return categories
      .map((cat) => {
        const catBudget = budget.byCategory[cat.id];
        return {
          id: cat.id,
          step: cat.step,
          name: language === 'bn' ? cat.labelBn : cat.labelEn,
          value: catBudget ? catBudget.selectedBDT : 0,
          color: categoryColors[cat.id] || '#64748b',
        };
      })
      .filter((d) => d.value > 0);
  }, [categories, budget, language]);

  const barData = useMemo(() => {
    return categories.map((cat) => {
      const catBudget = budget.byCategory[cat.id];
      return {
        id: cat.id,
        name: language === 'bn' ? cat.labelBn : cat.labelEn,
        min: catBudget?.minBDT || 0,
        selected: catBudget?.selectedBDT || 0,
        actual: catBudget?.actualBDT || 0,
        max: catBudget?.maxBDT || 0,
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

  // Modern tailored Tooltip for Donut Chart
  const CustomDonutTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percent =
        budget.totalSelectedBDT > 0
          ? Math.round((data.value / budget.totalSelectedBDT) * 100)
          : 0;
      return (
        <div className="bg-popover/95 backdrop-blur-md border border-border px-3 py-2 rounded-xl shadow-lg text-xs pointer-events-none z-50 animate-in fade-in-50">
          <div className="flex items-center gap-1.5 font-semibold text-foreground mb-0.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: data.color }} />
            <span>{data.name}</span>
          </div>
          <div className="flex items-center justify-between gap-3 font-mono">
            <span className="text-primary font-bold">{formatCurrency(data.value, 'BDT', language)}</span>
            <span className="text-muted-foreground text-[11px]">({formatNumber(percent, language)}%)</span>
          </div>
        </div>
      );
    }
    return null;
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

          {/* Mode Switcher Buttons */}
          <div className="flex items-center bg-muted/60 p-0.5 rounded-xl border border-border/60 text-xs self-start sm:self-auto">
            <button
              onClick={() => setViewMode('donut')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'donut'
                  ? 'bg-background text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <PieIcon className="h-3.5 w-3.5 text-primary" />
              <span>{language === 'bn' ? 'পাই' : 'Donut'}</span>
            </button>
            <button
              onClick={() => setViewMode('bar')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'bar'
                  ? 'bg-background text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChart2 className="h-3.5 w-3.5 text-indigo-500" />
              <span>{language === 'bn' ? 'বার' : 'Bar'}</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-background text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Table className="h-3.5 w-3.5 text-emerald-500" />
              <span>{language === 'bn' ? 'টেবিল' : 'Table'}</span>
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {/* Category breakdown highlight summary */}
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
            {/* Donut Chart with Perfectly Centered Summary Label */}
            <div className="md:col-span-7 h-[250px] w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={92}
                    paddingAngle={3}
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
                  <RechartsTooltip content={<CustomDonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              {/* Seamless Center Badge inside Donut Hole */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none text-center px-2">
                <span className="text-[10px] font-medium text-muted-foreground leading-none">
                  {t('selectedBudget')}
                </span>
                <span className="text-sm sm:text-base font-black font-mono text-foreground mt-1 leading-tight tracking-tight">
                  {formatCurrency(budget.totalSelectedBDT, 'BDT', language)}
                </span>
              </div>
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
                    className={`w-full flex items-center justify-between p-2 rounded-xl transition-all text-left cursor-pointer ${
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
                      <span className="font-semibold">{formatCurrency(d.value, 'BDT', language)}</span>
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
                  contentStyle={{
                    borderRadius: '0.75rem',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--card)',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar dataKey="min" fill="#94a3b8" name={t('minBudget')} radius={[4, 4, 0, 0]} />
                <Bar dataKey="selected" fill="#0284c7" name={t('selectedBudget')} radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" fill="#10b981" name={t('actualSpent')} radius={[4, 4, 0, 0]} />
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
