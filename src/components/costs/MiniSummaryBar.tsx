'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { calculateBudget, getEffectiveRate } from '@/lib/budget';
import { formatCurrency, toBanglaDigits } from '@/lib/utils';
import costsData from '@/data/costs.json';

export function MiniSummaryBar() {
  const t = useT();
  const { items, exchangeRate, language } = useStore();
  const [isVisible, setIsVisible] = useState(false);

  const effectiveRate = getEffectiveRate(
    exchangeRate.manualOverride ? (exchangeRate.manualRate || exchangeRate.rate) : exchangeRate.rate,
    exchangeRate.bankMargin
  );
  const budget = calculateBudget(items, effectiveRate, 0, costsData.categories as any[]);

  useEffect(() => {
    const handleScroll = () => {
      // Show when scrolled past 320px
      setIsVisible(window.scrollY > 320);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const remaining = budget.totalSelectedBDT - budget.totalActualBDT;
  const percentDone = budget.totalCount > 0 ? Math.round((budget.arrangedCount / budget.totalCount) * 100) : 0;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border shadow-lg md:hidden"
        >
          <div className="max-w-md mx-auto px-4 py-2.5 flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] text-muted-foreground leading-tight">{t('selectedBudget')}</p>
              <p className="font-bold font-mono text-sm text-foreground">
                {formatCurrency(budget.totalSelectedBDT, 'BDT', language)}
              </p>
            </div>

            <div className="text-center">
              <p className="text-[10px] text-muted-foreground leading-tight">{t('arranged')}</p>
              <p className="font-semibold text-xs text-foreground">
                {language === 'bn' ? `${toBanglaDigits(String(budget.arrangedCount))}/${toBanglaDigits(String(budget.totalCount))}` : `${budget.arrangedCount}/${budget.totalCount}`}
                <span className="text-[10px] text-muted-foreground ml-1">({percentDone}%)</span>
              </p>
            </div>

            <div className="text-right">
              <p className="text-[10px] text-muted-foreground leading-tight">{t('remaining')}</p>
              <p className="font-bold font-mono text-sm text-amber-600 dark:text-amber-400">
                {formatCurrency(Math.max(0, remaining), 'BDT', language)}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
