'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { calculateBudget, getEffectiveRate } from '@/lib/budget';
import { formatCurrency, toBanglaDigits, formatRelativeTime } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import costsData from '@/data/costs.json';
import { ProgressRing } from './ProgressRing';

function AnimatedNumber({ value, currency, language }: { value: number; currency: 'BDT' | 'EUR'; language: 'bn' | 'en' }) {
  const spring = useSpring(0, { stiffness: 50, damping: 20 });
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
  const { items, exchangeRate, language } = useStore();
  const [relativeTime, setRelativeTime] = useState<string>('');

  useEffect(() => {
    setRelativeTime(formatRelativeTime(exchangeRate.timestamp, language));
  }, [exchangeRate.timestamp, language]);
  const categories = costsData.categories as any[];
  
  const effectiveRate = getEffectiveRate(
    exchangeRate.manualOverride ? (exchangeRate.manualRate || exchangeRate.rate) : exchangeRate.rate,
    exchangeRate.bankMargin
  );
  
  const budget = calculateBudget(items, effectiveRate, 0, categories);
  const progressPercent = budget.totalCount > 0 ? Math.round((budget.arrangedCount / budget.totalCount) * 100) : 0;
  const remaining = budget.totalSelectedBDT - budget.totalActualBDT;

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border p-6 md:p-8">
      {/* Background decorative elements */}
      <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-blue-500/5 blur-2xl" />
      
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          {/* Budget Range */}
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">{t('totalBudgetRange')}</p>
            <div className="flex items-baseline gap-2 flex-wrap">
              <motion.h1 
                className="text-3xl md:text-4xl font-bold tracking-tight font-mono"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <AnimatedNumber value={budget.totalMinBDT} currency="BDT" language={language} />
              </motion.h1>
              <span className="text-muted-foreground text-xl">—</span>
              <motion.h1 
                className="text-3xl md:text-4xl font-bold tracking-tight font-mono"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <AnimatedNumber value={budget.totalMaxBDT} currency="BDT" language={language} />
              </motion.h1>
            </div>
            
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="bg-background/80 backdrop-blur rounded-lg p-3 border">
                <p className="text-xs text-muted-foreground">{t('selectedBudget')}</p>
                <p className="text-lg font-semibold font-mono">
                  <AnimatedNumber value={budget.totalSelectedBDT} currency="BDT" language={language} />
                </p>
              </div>
              <div className="bg-background/80 backdrop-blur rounded-lg p-3 border">
                <p className="text-xs text-muted-foreground">{t('actualSpent')}</p>
                <p className="text-lg font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                  <AnimatedNumber value={budget.totalActualBDT} currency="BDT" language={language} />
                </p>
              </div>
              <div className="bg-background/80 backdrop-blur rounded-lg p-3 border col-span-2 md:col-span-1">
                <p className="text-xs text-muted-foreground">{t('remaining')}</p>
                <p className="text-lg font-semibold font-mono text-amber-600 dark:text-amber-400">
                  <AnimatedNumber value={Math.max(0, remaining)} currency="BDT" language={language} />
                </p>
              </div>
            </div>
          </div>
          
          {/* Progress Ring & Rate */}
          <div className="flex flex-row md:flex-col items-center gap-4 md:gap-3">
            <ProgressRing 
              percent={progressPercent} 
              arranged={budget.arrangedCount} 
              total={budget.totalCount}
              language={language}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Badge variant="info" className="text-sm px-3 py-1.5 font-mono whitespace-nowrap">
                €1 = ৳{language === 'bn' ? toBanglaDigits(effectiveRate.toFixed(2)) : effectiveRate.toFixed(2)}
              </Badge>
              <p className="text-[10px] text-muted-foreground text-center mt-1">
                {relativeTime || (language === 'bn' ? 'সম্প্রতি' : 'recently')}
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
