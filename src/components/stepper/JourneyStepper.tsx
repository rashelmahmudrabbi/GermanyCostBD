'use client';

import { motion } from 'framer-motion';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { calculateBudget, getEffectiveRate } from '@/lib/budget';
import { cn, formatNumber } from '@/lib/utils';
import costsData from '@/data/costs.json';
import { Check, Eye, FileText, GraduationCap, Building2, Stamp, Home, Plane, LucideIcon } from 'lucide-react';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  preparation: FileText,
  university: GraduationCap,
  'blocked-account': Building2,
  visa: Stamp,
  'housing-ticket': Home,
  arrival: Plane,
};

const STEPS = costsData.categories;

interface JourneyStepperProps {
  onStepSelect?: (stepIndex: number | null) => void;
}

export function JourneyStepper({ onStepSelect }: JourneyStepperProps) {
  const t = useT();
  const { items, exchangeRate, activeStep, setActiveStep, language } = useStore();

  const effectiveRate = getEffectiveRate(
    exchangeRate.manualOverride ? (exchangeRate.manualRate || exchangeRate.rate) : exchangeRate.rate,
    exchangeRate.bankMargin
  );
  const budget = calculateBudget(items, effectiveRate, 0, costsData.categories as any[]);

  const getStepProgress = (categoryId: string) => {
    const categoryItems = items.filter((i) => i.category === categoryId);
    if (categoryItems.length === 0) return 0;
    return Math.round((categoryItems.filter((i) => i.arranged).length / categoryItems.length) * 100);
  };

  const handleStepClick = (stepIndex: number) => {
    const nextStep = activeStep === stepIndex ? null : stepIndex;
    setActiveStep(nextStep);
    if (onStepSelect) {
      onStepSelect(nextStep);
    }
    const element = document.getElementById(`step-${stepIndex}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="space-y-3" id="journey-stepper">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <span>{t('journeySteps')}</span>
        </h2>

        {activeStep !== null && (
          <button
            onClick={() => {
              setActiveStep(null);
              if (onStepSelect) onStepSelect(null);
            }}
            className="text-xs text-primary font-medium hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>{language === 'bn' ? 'সব ধাপ দেখুন' : 'Show All Steps'}</span>
          </button>
        )}
      </div>

      {/* Stepper Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {STEPS.map((step, idx) => {
          const progress = getStepProgress(step.id);
          const isCompleted = budget.completedSteps.includes(idx);
          const isActive = activeStep === idx;
          const Icon = CATEGORY_ICONS[step.id] || FileText;

          return (
            <motion.button
              key={step.id}
              onClick={() => handleStepClick(idx)}
              className={cn(
                "relative flex items-center sm:flex-col sm:items-center text-left sm:text-center gap-2.5 p-3 rounded-2xl border transition-all duration-200 cursor-pointer",
                isActive
                  ? "bg-primary/10 border-primary ring-2 ring-primary/25 shadow-2xs"
                  : isCompleted
                  ? "bg-emerald-500/10 border-emerald-500/25 text-foreground"
                  : "bg-card border-border/70 hover:border-primary/40 hover:bg-muted/30"
              )}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Icon Container */}
              <div
                className={cn(
                  "relative w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all border",
                  isCompleted
                    ? "bg-emerald-600 border-emerald-600 text-white shadow-2xs"
                    : isActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/70 border-border/60 text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 stroke-[2.5]" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>

              {/* Title & Progress % */}
              <div className="min-w-0 flex-1 sm:w-full">
                <p className="text-xs font-semibold leading-tight truncate">
                  {language === 'bn' ? step.labelBn : step.labelEn}
                </p>
                <div className="flex items-center sm:justify-center gap-1.5 mt-1">
                  <div className="w-10 h-1 rounded-full bg-muted overflow-hidden hidden sm:block">
                    <div
                      className={cn(
                        "h-full transition-all duration-300",
                        isCompleted ? "bg-emerald-500" : "bg-primary"
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {formatNumber(progress, language)}%
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
