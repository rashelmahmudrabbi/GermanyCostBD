'use client';

import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { calculateBudget, getEffectiveRate, applyScenario } from '@/lib/budget';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import costsData from '@/data/costs.json';
import { ShieldCheck, CheckCircle2, Wallet, ArrowRight, HelpCircle } from 'lucide-react';

function AnimatedNumber({
  value,
  currency,
  language,
}: {
  value: number;
  currency: 'BDT' | 'EUR';
  language: 'bn' | 'en';
}) {
  const spring = useSpring(0, { stiffness: 65, damping: 24 });
  const display = useTransform(spring, (v) => formatCurrency(Math.round(v), currency, language));
  const [displayValue, setDisplayValue] = useState(formatCurrency(0, currency, language));

  useEffect(() => {
    spring.set(value);
    const unsubscribe = display.on('change', (v) => setDisplayValue(v));
    return () => unsubscribe();
  }, [value, spring, display]);

  return <span>{displayValue}</span>;
}

export function HeroSection() {
  const t = useT();
  const { items, setItems, exchangeRate, language } = useStore();
  const [activePreset, setActivePreset] = useState<'budget' | 'standard' | 'comfortable'>('standard');

  const categories = costsData.categories as any[];
  const presets = costsData.scenarios as Record<string, any>;

  const effectiveRate = getEffectiveRate(
    exchangeRate.manualOverride ? (exchangeRate.manualRate || exchangeRate.rate) : exchangeRate.rate,
    exchangeRate.bankMargin
  );

  const budget = calculateBudget(items, effectiveRate, 0, categories);
  const progressPercent = budget.totalCount > 0 ? Math.round((budget.arrangedCount / budget.totalCount) * 100) : 0;
  const sunkRemaining = Math.max(0, budget.sunkSelectedBDT - budget.sunkActualBDT);

  const handleQuickPreset = (presetKey: 'budget' | 'standard' | 'comfortable') => {
    setActivePreset(presetKey);
    const preset = presets[presetKey];
    if (preset) {
      setItems(applyScenario(items, preset.multiplier));
    }
  };

  return (
    <section className="relative overflow-hidden rounded-3xl bg-card border border-border/70 p-5 sm:p-7 shadow-xs">
      <div className="relative z-10 space-y-5">
        {/* Top Control Bar: Category indicator & Quick Preset Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-border/40">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">
              {t('heroHeadline')}
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">
              {t('heroHeadlineDesc')}
            </span>
          </div>

          {/* Unified Preset Switcher */}
          <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/60 text-xs self-start sm:self-auto">
            <span className="text-[11px] font-medium text-muted-foreground px-2 hidden sm:inline">
              {t('quickPresets')}:
            </span>
            {(['budget', 'standard', 'comfortable'] as const).map((key) => {
              const p = presets[key];
              const isSelected = activePreset === key;
              return (
                <button
                  key={key}
                  onClick={() => handleQuickPreset(key)}
                  className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-background text-foreground shadow-2xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/40'
                  }`}
                >
                  {language === 'bn' ? p?.labelBn : p?.labelEn}
                </button>
              );
            })}
          </div>
        </div>

        {/* PRIMARY HEADLINE: Non-Recoverable Sunk Costs */}
        <div className="space-y-2">
          <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-4">
            <div className="flex items-baseline gap-2 md:gap-3 flex-wrap">
              <motion.div
                className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight font-mono text-foreground"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <AnimatedNumber value={budget.sunkMinBDT} currency="BDT" language={language} />
              </motion.div>
              <span className="text-muted-foreground/50 text-2xl font-light">—</span>
              <motion.div
                className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight font-mono text-foreground"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
              >
                <AnimatedNumber value={budget.sunkMaxBDT} currency="BDT" language={language} />
              </motion.div>
            </div>

            <Badge variant="secondary" className="font-mono text-xs font-semibold px-2.5 py-0.5 w-fit">
              {language === 'bn' ? 'নির্বাচিত: ' : 'Selected: '}
              <AnimatedNumber value={budget.sunkSelectedBDT} currency="BDT" language={language} />
            </Badge>
          </div>

          {/* Micro Disclaimer under hero total */}
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-0.5">
            <span>{t('disclaimerShort')}</span>
          </p>
        </div>

        {/* SECONDARY ROW: Funds You Still Own vs Combined Total */}
        <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-semibold text-foreground">{t('retainedFunds')}: </span>
              <span className="font-mono font-bold text-foreground">
                <AnimatedNumber value={budget.retainedSelectedBDT} currency="BDT" language={language} />
              </span>
              <span className="text-muted-foreground ml-1.5">
                ({t('retainedFundsDesc')})
              </span>
            </div>
          </div>

          <div className="pt-2 md:pt-0 border-t md:border-t-0 border-border/40 flex items-center gap-2 shrink-0">
            <span className="text-muted-foreground">{t('combinedTotal')}:</span>
            <span className="font-mono font-bold text-sm text-foreground">
              <AnimatedNumber value={budget.totalSelectedBDT} currency="BDT" language={language} />
            </span>
          </div>
        </div>

        {/* Thin Progress Bar for preparation */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">
              {language === 'bn' ? 'প্রস্তুতি অগ্রগতি' : 'Preparation Progress'}
            </span>
            <span className="font-mono">
              {language === 'bn'
                ? `${formatNumber(budget.arrangedCount, language)} / ${formatNumber(budget.totalCount, language)} (${formatNumber(progressPercent, language)}%)`
                : `${budget.arrangedCount} / ${budget.totalCount} (${progressPercent}%)`}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full transition-all duration-500"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* 3 Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-background border border-border/60 space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">{t('selectedBudget')}</span>
              <Wallet className="h-3.5 w-3.5 text-primary" />
            </div>
            <p className="text-lg font-bold font-mono text-foreground">
              <AnimatedNumber value={budget.sunkSelectedBDT} currency="BDT" language={language} />
            </p>
            <p className="text-[10px] text-muted-foreground">
              {language === 'bn' ? 'অফেরতযোগ্য মূল খরচ' : 'Direct upfront costs'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-background border border-border/60 space-y-1">
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
              <span className="text-xs font-medium">{t('actualSpent')}</span>
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
            <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
              <AnimatedNumber value={budget.sunkActualBDT} currency="BDT" language={language} />
            </p>
            <p className="text-[10px] text-muted-foreground">
              {language === 'bn' ? 'ইতিমধ্যে পরিশোধিত' : 'Paid out so far'}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-background border border-border/60 space-y-1">
            <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
              <span className="text-xs font-medium">{t('remaining')}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
            <p className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
              <AnimatedNumber value={sunkRemaining} currency="BDT" language={language} />
            </p>
            <p className="text-[10px] text-muted-foreground">
              {language === 'bn' ? 'আরও জোগাড় করতে হবে' : 'Pending to arrange'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
