'use client';

import { motion } from 'framer-motion';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { calculateBudget, getEffectiveRate } from '@/lib/budget';
import { cn, toBanglaDigits } from '@/lib/utils';
import costsData from '@/data/costs.json';
import { Check, Sparkles, Filter, Eye } from 'lucide-react';
import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

const STEPS = costsData.categories;

export function JourneyStepper() {
  const t = useT();
  const { items, exchangeRate, activeStep, setActiveStep, language } = useStore();
  const prevCompletedRef = useRef<number[]>([]);

  const effectiveRate = getEffectiveRate(
    exchangeRate.manualOverride ? (exchangeRate.manualRate || exchangeRate.rate) : exchangeRate.rate,
    exchangeRate.bankMargin
  );
  const budget = calculateBudget(items, effectiveRate, 0, costsData.categories as any[]);

  // Trigger celebration confetti when newly completed
  useEffect(() => {
    const newlyCompleted = budget.completedSteps.filter(
      (s) => !prevCompletedRef.current.includes(s)
    );
    if (newlyCompleted.length > 0) {
      confetti({
        particleCount: 110,
        spread: 80,
        origin: { y: 0.65 },
        colors: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'],
      });
    }
    prevCompletedRef.current = budget.completedSteps;
  }, [budget.completedSteps]);

  const getStepProgress = (categoryId: string) => {
    const categoryItems = items.filter((i) => i.category === categoryId);
    if (categoryItems.length === 0) return 0;
    return Math.round((categoryItems.filter((i) => i.arranged).length / categoryItems.length) * 100);
  };

  const handleStepClick = (stepIndex: number) => {
    setActiveStep(activeStep === stepIndex ? null : stepIndex);
    const element = document.getElementById(`step-${stepIndex}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="py-4 space-y-3" id="journey-stepper">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg md:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>{t('journeySteps')}</span>
            <span className="text-xs font-normal text-muted-foreground hidden sm:inline">
              ({language === 'bn' ? 'ক্লিক করে যেকোনো ধাপের খরচ ফিল্টার করুন' : 'Click to filter checklist by step'})
            </span>
          </h2>
        </div>

        {activeStep !== null ? (
          <button
            onClick={() => setActiveStep(null)}
            className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>{language === 'bn' ? 'সব ধাপ দেখুন' : 'Show All Steps'}</span>
          </button>
        ) : (
          <span className="text-xs text-muted-foreground font-mono">
            {language === 'bn'
              ? `${toBanglaDigits(String(budget.arrangedCount))}/${toBanglaDigits(String(budget.totalCount))} সম্পন্ন`
              : `${budget.arrangedCount}/${budget.totalCount} completed`}
          </span>
        )}
      </div>

      {/* Stepper Grid / Horizontal Scroll for Mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {STEPS.map((step, idx) => {
          const progress = getStepProgress(step.id);
          const isCompleted = budget.completedSteps.includes(idx);
          const isActive = activeStep === idx;
          const stepNumber = language === 'bn' ? toBanglaDigits(String(idx + 1)) : String(idx + 1);

          return (
            <motion.button
              key={step.id}
              onClick={() => handleStepClick(idx)}
              className={cn(
                "relative flex items-center sm:flex-col sm:items-center text-left sm:text-center gap-3 sm:gap-2 p-3 rounded-2xl border transition-all duration-200 cursor-pointer",
                isActive
                  ? "bg-primary/10 border-primary ring-2 ring-primary/30 shadow-xs"
                  : isCompleted
                  ? "bg-emerald-500/10 border-emerald-500/30 text-foreground"
                  : "bg-card border-border/80 hover:border-primary/50 hover:bg-muted/40"
              )}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Icon Container with SVG progress border */}
              <div
                className={cn(
                  "relative w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 transition-all border",
                  isCompleted
                    ? "bg-emerald-500 border-emerald-500 text-white shadow-xs"
                    : isActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/60 border-border text-foreground"
                )}
              >
                {isCompleted ? <Check className="w-5 h-5 stroke-[2.5]" /> : step.icon}

                {/* Micro-badge step number */}
                <span
                  className={cn(
                    "absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center shadow-2xs font-mono",
                    isCompleted
                      ? "bg-emerald-700 text-white"
                      : isActive
                      ? "bg-primary-foreground text-primary"
                      : "bg-muted border border-border text-muted-foreground"
                  )}
                >
                  {stepNumber}
                </span>
              </div>

              {/* Title & Progress % */}
              <div className="min-w-0 flex-1 sm:w-full">
                <p className="text-xs font-semibold leading-snug truncate">
                  {language === 'bn' ? step.labelBn : step.labelEn}
                </p>
                <div className="flex items-center sm:justify-center gap-1.5 mt-0.5">
                  <div className="w-12 h-1 rounded-full bg-muted overflow-hidden hidden sm:block">
                    <div
                      className={cn(
                        "h-full transition-all duration-500",
                        isCompleted ? "bg-emerald-500" : "bg-primary"
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {language === 'bn' ? `${toBanglaDigits(String(progress))}%` : `${progress}%`}
                  </span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
