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
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import costsData from '@/data/costs.json';

const CATEGORY_COLORS = [
  '#3b82f6', // blue (preparation)
  '#8b5cf6', // purple (university)
  '#10b981', // emerald (blocked account)
  '#f59e0b', // amber (visa)
  '#ec4899', // pink (housing-ticket)
  '#06b6d4', // cyan (arrival)
];

export function BudgetCharts() {
  const t = useT();
  const { items, exchangeRate, language, setActiveStep, activeStep } = useStore();
  const [activeTab, setActiveTab] = useState<'donut' | 'bar'>('donut');

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
    return categories.map((cat, idx) => {
      const catBudget = budget.byCategory[cat.id];
      const value = catBudget ? Math.round(catBudget.selectedBDT) : 0;
      return {
        id: cat.id,
        step: idx,
        name: language === 'bn' ? cat.labelBn : cat.labelEn,
        value,
        color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
      };
    }).filter(d => d.value > 0);
  }, [categories, budget, language]);

  // Stacked Bar chart data: Min, Selected, Actual, Max comparison by category
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
    <Card className="border-border/80 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg md:text-xl font-bold flex items-center gap-2">
              <span>📊</span>
              <span>{language === 'bn' ? 'বাজেট ভিজ্যুয়ালাইজেশন' : 'Budget Visualization'}</span>
            </CardTitle>
            <CardDescription className="text-xs">
              {language === 'bn'
                ? 'ক্যাটাগরি ভিত্তিক খরচের অনুপাত ও তুলনা (স্লাইসে ক্লিক করে ফিল্টার করুন)'
                : 'Category expenditure distribution and comparison (click slice to filter)'}
            </CardDescription>
          </div>

          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-auto">
            <TabsList className="h-8">
              <TabsTrigger value="donut" className="text-xs px-3">
                {language === 'bn' ? 'অনুপাত পাই' : 'Donut'}
              </TabsTrigger>
              <TabsTrigger value="bar" className="text-xs px-3">
                {language === 'bn' ? 'তুলনা বার' : 'Comparison'}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {activeTab === 'donut' ? (
          <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4">
            <div className="md:col-span-7 h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                    onClick={handlePieClick}
                    cursor="pointer"
                  >
                    {donutData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke={activeStep === entry.step ? '#000' : 'transparent'}
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(val: any) => [formatCurrency(Number(val), 'BDT', language), t('selectedBudget')]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend list */}
            <div className="md:col-span-5 space-y-1.5 text-xs">
              <p className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px] mb-1">
                {t('byCategory')}
              </p>
              {donutData.map((d) => {
                const percent = budget.totalSelectedBDT > 0
                  ? Math.round((d.value / budget.totalSelectedBDT) * 100)
                  : 0;
                const isSelected = activeStep === d.step;

                return (
                  <button
                    key={d.id}
                    onClick={() => handlePieClick(d)}
                    className={`w-full flex items-center justify-between p-1.5 rounded-lg transition-all text-left ${
                      isSelected ? 'bg-primary/10 ring-1 ring-primary' : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: d.color }}
                      />
                      <span className="truncate font-medium">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono shrink-0 ml-2">
                      <span>{formatCurrency(d.value, 'BDT', language)}</span>
                      <span className="text-muted-foreground w-8 text-right font-sans text-[11px]">
                        {percent}%
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="h-[280px] w-full pt-2">
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
                    name === 'min' ? t('minBudget') : name === 'selected' ? t('selectedBudget') : name === 'actual' ? t('actualSpent') : t('maxBudget')
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="min" fill="#94a3b8" name={t('minBudget')} radius={[4, 4, 0, 0]} />
                <Bar dataKey="selected" fill="#3b82f6" name={t('selectedBudget')} radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" fill="#10b981" name={t('actualSpent')} radius={[4, 4, 0, 0]} />
                <Bar dataKey="max" fill="#cbd5e1" name={t('maxBudget')} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
