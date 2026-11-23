'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { calculateBudget, getEffectiveRate } from '@/lib/budget';
import { formatCurrency, formatExchangeRate, toBanglaDigits } from '@/lib/utils';
import costsData from '@/data/costs.json';
import { ArrowUp, ArrowUpRight } from 'lucide-react';
import { ExchangeRateModal } from '@/components/exchange/ExchangeRateModal';

export function MiniSummaryBar() {
  const t = useT();
  const { items, exchangeRate, language } = useStore();
  const [isVisible, setIsVisible] = useState(false);
  const [rateModalOpen, setRateModalOpen] = useState(false);

  const effectiveRate = getEffectiveRate(
    exchangeRate.manualOverride ? (exchangeRate.manualRate || exchangeRate.rate) : exchangeRate.rate,
    exchangeRate.bankMargin
  );
  const budget = calculateBudget(items, effectiveRate, 0, costsData.categories as any[]);

  useEffect(() => {
    const handleScroll = () => {
      // Show when scrolled past 280px
      setIsVisible(window.scrollY > 280);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const percentDone = budget.totalCount > 0 ? Math.round((budget.arrangedCount / budget.totalCount) * 100) : 0;
  const percentText = language === 'bn' ? `${toBanglaDigits(String(percentDone))}%` : `${percentDone}%`;
  const countText = language === 'bn'
    ? `${toBanglaDigits(String(budget.arrangedCount))}/${toBanglaDigits(String(budget.totalCount))}`
    : `${budget.arrangedCount}/${budget.totalCount}`;

  const scrollToHero = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border shadow-lg md:hidden print:hidden"
          >
            <div className="max-w-md mx-auto px-4 py-2 flex items-center justify-between gap-2">
              {/* Tap to scroll to Hero */}
              <button
                onClick={scrollToHero}
                className="text-left flex-1 min-w-0 flex items-center gap-2 cursor-pointer group"
                aria-label="Scroll to top budget summary"
              >
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <ArrowUp className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground leading-tight truncate">
                    {t('sunkFundsLabel')}
                  </p>
                  <p className="font-bold font-mono text-sm text-foreground leading-tight">
                    {formatCurrency(budget.sunkSelectedBDT, 'BDT', language)}
                  </p>
                  <p className="text-[9px] text-muted-foreground leading-none">
                    {t('combinedTotal')}: {formatCurrency(budget.totalSelectedBDT, 'BDT', language)}
                  </p>
                </div>
              </button>

              {/* Arranged Progress */}
              <div className="text-center px-2 shrink-0">
                <p className="text-[10px] text-muted-foreground leading-tight">{t('arranged')}</p>
                <p className="font-semibold text-xs text-foreground leading-tight">
                  {countText}
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold ml-1">
                    ({percentText})
                  </span>
                </p>
              </div>

              {/* Rate chip */}
              <button
                onClick={() => setRateModalOpen(true)}
                className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[11px] font-mono font-medium hover:bg-emerald-500/20 transition-colors"
                title={t('exchangeRate')}
              >
                <span>€1=৳{formatExchangeRate(effectiveRate, language)}</span>
                <ArrowUpRight className="h-3 w-3 opacity-60" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ExchangeRateModal open={rateModalOpen} onOpenChange={setRateModalOpen} />
    </>
  );
}
