'use client';

import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { calculateBudget, getEffectiveRate, applyScenario } from '@/lib/budget';
import { formatCurrency, toBanglaDigits, formatRelativeTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import costsData from '@/data/costs.json';
import { ProgressRing } from './ProgressRing';
import { Sparkles, Wallet, ShieldCheck, CheckCircle2, ArrowDownRight, TrendingUp } from 'lucide-react';

function AnimatedNumber({
  value,
  currency,
  language,
}: {
  value: number;
  currency: 'BDT' | 'EUR';
  language: 'bn' | 'en';
}) {
  const spring = useSpring(0, { stiffness: 60, damping: 22 });
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
  const [relativeTime, setRelativeTime] = useState<string>('');
  const [activePreset, setActivePreset] = useState<'budget' | 'standard' | 'comfortable'>('standard');

  useEffect(() => {
    setRelativeTime(formatRelativeTime(exchangeRate.timestamp, language));
  }, [exchangeRate.timestamp, language]);

  const categories = costsData.categories as any[];
  const presets = costsData.scenarios as Record<string, any>;

  const effectiveRate = getEffectiveRate(
    exchangeRate.manualOverride ? (exchangeRate.manualRate || exchangeRate.rate) : exchangeRate.rate,
    exchangeRate.bankMargin
  );

  const budget = calculateBudget(items, effectiveRate, 0, categories);
  const progressPercent = budget.totalCount > 0 ? Math.round((budget.arrangedCount / budget.totalCount) * 100) : 0;
  const remaining = budget.totalSelectedBDT - budget.totalActualBDT;

  const handleQuickPreset = (presetKey: 'budget' | 'standard' | 'comfortable') => {
    setActivePreset(presetKey);
    const preset = presets[presetKey];
    if (preset) {
      setItems(applyScenario(items, preset.multiplier));
    }
  };

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-card to-background border border-border/80 p-6 md:p-8 shadow-sm">
      {/* Decorative ambient gradient blooms */}
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-6">
        {/* Top Header & Presets Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs px-3 py-1 bg-background/80 font-medium border-primary/30 text-primary">
              <Sparkles className="h-3 w-3 mr-1.5 text-amber-500" />
              <span>{t('appTagline')}</span>
            </Badge>

            <span className="text-xs text-muted-foreground hidden md:inline">•</span>

            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t('blockedAccountNotice')}</span>
            </span>
          </div>

          {/* Quick Preset Selector */}
          <div className="flex items-center gap-1 bg-background/90 backdrop-blur p-1 rounded-xl border border-border/80 text-xs shrink-0 self-start sm:self-auto">
            <span className="text-[11px] font-semibold text-muted-foreground px-2 hidden sm:inline">
              {t('quickPresets')}:
            </span>
            {(['budget', 'standard', 'comfortable'] as const).map((key) => {
              const p = presets[key];
              const isSelected = activePreset === key;
              return (
                <button
                  key={key}
                  onClick={() => handleQuickPreset(key)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {language === 'bn' ? p?.labelBn : p?.labelEn}
                </button>
              );
            })}
          </div>
        </div>

        {/* Hero Budget Main Display */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <div>
              <p className="text-xs md:text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                {t('totalBudgetRange')}
              </p>
              <div className="flex items-baseline gap-2 md:gap-3 flex-wrap">
                <motion.div
                  className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight font-mono text-foreground"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <AnimatedNumber value={budget.totalMinBDT} currency="BDT" language={language} />
                </motion.div>
                <span className="text-muted-foreground/60 text-2xl md:text-3xl font-light">—</span>
                <motion.div
                  className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight font-mono text-foreground"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                >
                  <AnimatedNumber value={budget.totalMaxBDT} currency="BDT" language={language} />
                </motion.div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
              {language === 'bn'
                ? 'আইইএলটিএস, আবেদন ফি, বিমান টিকেট, প্রথম মাসের থাকা-খাওয়া এবং ১ বছরের ব্লকড একাউন্ট (€১১,৯০৪) সহ আনুমানিক পূর্ণাঙ্গ হিসাব।'
                : 'Complete estimated budget including IELTS, applications, flights, deposit, initial living costs, and 12-month blocked account (€11,904).'}
            </p>
          </div>

          {/* Progress Ring & Live Chip */}
          <div className="flex items-center gap-5 p-3 rounded-2xl bg-background/60 backdrop-blur border border-border/60 shrink-0">
            <ProgressRing
              percent={progressPercent}
              arranged={budget.arrangedCount}
              total={budget.totalCount}
              language={language}
              size={90}
            />

            <div className="space-y-1.5">
              <a
                href="#exchange-rate"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary font-mono text-sm font-bold hover:bg-primary/15 transition-all"
                title="View and adjust live exchange rate and margin"
              >
                <span>€1 = ৳{language === 'bn' ? toBanglaDigits(effectiveRate.toFixed(2)) : effectiveRate.toFixed(2)}</span>
                <ArrowDownRight className="h-3.5 w-3.5 text-primary" />
              </a>
              <p className="text-[11px] text-muted-foreground">
                {t('rateUpdated')}: {relativeTime || (language === 'bn' ? 'সম্প্রতি' : 'recently')}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="h-3 w-3" />
                <span>
                  {language === 'bn'
                    ? `${toBanglaDigits(String(budget.arrangedCount))}টি ধাপ প্রস্তুত`
                    : `${budget.arrangedCount} items arranged`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Selected Budget */}
          <div className="p-4 rounded-2xl bg-background/80 backdrop-blur border border-border/70 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">{t('selectedBudget')}</span>
              <Wallet className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xl md:text-2xl font-bold font-mono text-foreground">
              <AnimatedNumber value={budget.totalSelectedBDT} currency="BDT" language={language} />
            </p>
            <p className="text-[11px] text-muted-foreground">
              {language === 'bn' ? 'আপনার বর্তমান পছন্দের মোট খরচ' : 'Based on your custom estimates'}
            </p>
          </div>

          {/* Actual Spent */}
          <div className="p-4 rounded-2xl bg-emerald-500/5 backdrop-blur border border-emerald-500/20 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300">
              <span className="text-xs font-semibold">{t('actualSpent')}</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-xl md:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              <AnimatedNumber value={budget.totalActualBDT} currency="BDT" language={language} />
            </p>
            <p className="text-[11px] text-muted-foreground">
              {language === 'bn' ? 'যা ইতিমধ্যে পরিশোধ করা হয়েছে' : 'Total money already paid out'}
            </p>
          </div>

          {/* Remaining */}
          <div className="p-4 rounded-2xl bg-amber-500/5 backdrop-blur border border-amber-500/20 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-amber-700 dark:text-amber-300">
              <span className="text-xs font-semibold">{t('remaining')}</span>
              <TrendingUp className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-xl md:text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
              <AnimatedNumber value={Math.max(0, remaining)} currency="BDT" language={language} />
            </p>
            <p className="text-[11px] text-muted-foreground">
              {language === 'bn' ? 'আরও যত টাকা প্রস্তুত রাখা প্রয়োজন' : 'Funds still needed to arrange'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
