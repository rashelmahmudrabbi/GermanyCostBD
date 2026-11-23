'use client';

import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { calculateBudget, generateInsights, getEffectiveRate } from '@/lib/budget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, CheckCircle2 } from 'lucide-react';
import costsData from '@/data/costs.json';

export function SmartInsights() {
  const t = useT();
  const { items, exchangeRate, language } = useStore();

  const effectiveRate = getEffectiveRate(
    exchangeRate.manualOverride ? (exchangeRate.manualRate || exchangeRate.rate) : exchangeRate.rate,
    exchangeRate.bankMargin
  );

  const budget = calculateBudget(items, effectiveRate, 0, costsData.categories as any[]);
  const insights = generateInsights(budget, effectiveRate, exchangeRate.bankMargin, language);

  // Extra currency trend tip
  const currencyTip = language === 'bn'
    ? 'ইউরো রেট সাম্প্রতিক সময়ে অস্থির থাকলে ব্যাংক স্টুডেন্ট ফাইল আগে থেকেই প্রস্তুত রাখুন।'
    : 'EUR exchange rates fluctuate; prepare your student file and account early to lock favorable timings.';

  return (
    <Card className="border-border/80 shadow-sm bg-gradient-to-br from-primary/5 via-card to-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base md:text-lg font-bold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <span>{t('smartInsights')}</span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((insight, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 rounded-xl bg-background/80 border border-border/60 shadow-xs"
            >
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                {idx === 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : idx === 1 ? (
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                )}
              </div>
              <p className="text-xs md:text-sm text-foreground leading-relaxed">
                {insight}
              </p>
            </div>
          ))}

          {/* FX Insight */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-background/80 border border-border/60 shadow-xs">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 shrink-0 mt-0.5">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <p className="text-xs md:text-sm text-foreground leading-relaxed">
              {currencyTip}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
