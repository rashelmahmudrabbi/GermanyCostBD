'use client';

import { motion } from 'framer-motion';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { calculateBudget, getEffectiveRate } from '@/lib/budget';
import { cn } from '@/lib/utils';
import costsData from '@/data/costs.json';
import { Check } from 'lucide-react';
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

  // Track step completions and trigger confetti
  useEffect(() => {
    const newlyCompleted = budget.completedSteps.filter(
      s => !prevCompletedRef.current.includes(s)
    );
    if (newlyCompleted.length > 0) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'],
      });
    }
    prevCompletedRef.current = budget.completedSteps;
  }, [budget.completedSteps]);

  const getStepProgress = (categoryId: string) => {
    const categoryItems = items.filter(i => i.category === categoryId);
    if (categoryItems.length === 0) return 0;
    return Math.round((categoryItems.filter(i => i.arranged).length / categoryItems.length) * 100);
  };

  const handleStepClick = (step: number) => {
    setActiveStep(activeStep === step ? null : step);
    const element = document.getElementById(`step-${step}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="py-6" id="journey-stepper">
      <h2 className="text-xl font-bold mb-4">{t('journeySteps')}</h2>
      <div className="relative">
        {/* Connection line */}
        <div className="absolute top-6 left-6 right-6 h-0.5 bg-border hidden md:block" />
        
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-1">
          {STEPS.map((step, idx) => {
            const progress = getStepProgress(step.id);
            const isCompleted = budget.completedSteps.includes(idx);
            const isActive = activeStep === idx;
            
            return (
              <motion.button
                key={step.id}
                onClick={() => handleStepClick(idx)}
                className={cn(
                  "relative flex flex-col items-center gap-2 p-3 rounded-xl transition-all",
                  isActive && "bg-primary/10 ring-2 ring-primary",
                  isCompleted && "bg-emerald-500/10",
                  !isActive && !isCompleted && "hover:bg-muted/50"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={cn(
                  "relative w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all border-2",
                  isCompleted ? "bg-emerald-500 border-emerald-500 text-white" : "bg-background border-border",
                  isActive && !isCompleted && "border-primary"
                )}>
                  {isCompleted ? <Check className="w-5 h-5" /> : step.icon}
                  {/* Progress ring on icon */}
                  {!isCompleted && progress > 0 && (
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 48 48">
                      <circle
                        cx="24" cy="24" r="22"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeDasharray={`${2 * Math.PI * 22}`}
                        strokeDashoffset={`${2 * Math.PI * 22 * (1 - progress / 100)}`}
                        className="text-primary transition-all duration-500"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </div>
                <span className="text-xs font-medium text-center leading-tight">
                  {language === 'bn' ? step.labelBn : step.labelEn}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {progress}%
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
