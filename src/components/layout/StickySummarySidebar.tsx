'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { calculateBudget, getEffectiveRate } from '@/lib/budget';
import { formatCurrency, formatExchangeRate, toBanglaDigits } from '@/lib/utils';
import costsData from '@/data/costs.json';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, CheckCircle2, ShieldCheck, Wallet, RefreshCw } from 'lucide-react';
import { ExchangeRateModal } from '@/components/exchange/ExchangeRateModal';

export function StickySummarySidebar() {
  const t = useT();
  const { items, exchangeRate, language } = useStore();
  const [rateModalOpen, setRateModalOpen] = useState(false);

  const effectiveRate = getEffectiveRate(
    exchangeRate.manualOverride ? (exchangeRate.manualRate || exchangeRate.rate) : exchangeRate.rate,
    exchangeRate.bankMargin
  );
  const budget = calculateBudget(items, effectiveRate, 0, costsData.categories as any[]);

  const percentDone = budget.totalCount > 0 ? Math.round((budget.arrangedCount / budget.totalCount) * 100) : 0;
  const countText = language === 'bn'
    ? `${toBanglaDigits(String(budget.arrangedCount))}/${toBanglaDigits(String(budget.totalCount))}`
    : `${budget.arrangedCount}/${budget.totalCount}`;

  return (
    <>
      <Card className="border-border/80 shadow-sm bg-white dark:bg-[#121217]">
        <CardContent className="p-4 space-y-4">
          {/* Header & Rate */}
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('budgetSummary')}
            </span>
            <button
              onClick={() => setRateModalOpen(true)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-mono font-medium hover:bg-emerald-500/20 transition-colors cursor-pointer"
            >
              <span>€1 = ৳{formatExchangeRate(effectiveRate, language)}</span>
              <ArrowUpRight className="h-3 w-3 opacity-60" />
            </button>
          </div>

          {/* Group 1: Non-recoverable (Headline) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium">
                <Wallet className="h-3.5 w-3.5 text-amber-500" />
                {t('sunkFundsLabel')}
              </span>
              <span className="text-[10px] text-muted-foreground">
                ({t('sunkFundsDesc')})
              </span>
            </div>
            <p className="text-2xl font-black font-mono tracking-tight text-foreground">
              {formatCurrency(budget.sunkSelectedBDT, 'BDT', language)}
            </p>
          </div>

          {/* Group 2: Retained Funds */}
          <div className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15 space-y-1">
            <div className="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                {t('retainedFundsLabel')}
              </span>
              <span className="font-mono font-bold text-xs">
                {formatCurrency(budget.retainedSelectedBDT, 'BDT', language)}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              {t('retainedFundsDesc')}
            </p>
          </div>

          {/* Combined Total */}
          <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
            <span className="text-muted-foreground font-medium">{t('combinedTotal')}</span>
            <span className="font-mono font-bold text-foreground">
              {formatCurrency(budget.totalSelectedBDT, 'BDT', language)}
            </span>
          </div>

          {/* Progress / Arranged items */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                {t('arranged')}
              </span>
              <span className="font-semibold text-foreground font-mono">
                {countText} ({percentDone}%)
              </span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${percentDone}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <ExchangeRateModal open={rateModalOpen} onOpenChange={setRateModalOpen} />
    </>
  );
}
