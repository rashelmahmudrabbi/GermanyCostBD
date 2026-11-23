'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { UserCostItem } from '@/types';
import { convertToBDT, getEffectiveRate } from '@/lib/budget';
import { formatCurrency, toBanglaDigits } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ExternalLink, Trash2, Info, ChevronDown, ChevronUp, Edit3 } from 'lucide-react';

interface CostItemCardProps {
  item: UserCostItem;
  onOpenMobileEdit?: (item: UserCostItem) => void;
}

export function CostItemCard({ item, onOpenMobileEdit }: CostItemCardProps) {
  const t = useT();
  const { toggleArranged, setEstimate, setActualPaid, deleteItem, exchangeRate, language } = useStore();
  const [expanded, setExpanded] = useState(false);

  const effectiveRate = getEffectiveRate(
    exchangeRate.manualOverride ? (exchangeRate.manualRate || exchangeRate.rate) : exchangeRate.rate,
    exchangeRate.bankMargin
  );

  const bdtEstimate = convertToBDT(item.estimate, item.currency, effectiveRate, 0);
  const bdtActual = item.actualPaid !== null ? convertToBDT(item.actualPaid, item.currency, effectiveRate, 0) : null;

  const typeVariants: Record<string, 'default' | 'success' | 'info' | 'secondary'> = {
    fee: 'default',
    refundable: 'success',
    'released-monthly': 'info',
  };

  const typeLabels: Record<string, string> = {
    fee: t('fee'),
    refundable: t('refundable'),
    'released-monthly': t('releasedMonthly'),
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className={`group border rounded-xl p-4 transition-all duration-200 ${
        item.arranged
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : 'bg-card border-border hover:border-primary/40 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Arranged Checkbox with Tooltip */}
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="pt-0.5">
                <Checkbox
                  checked={item.arranged}
                  onCheckedChange={() => toggleArranged(item.id)}
                  aria-label={`${item.labelEn} - ${t('arranged')}`}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs text-xs">
              <p>{t('arrangedTooltip')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h4 className={`font-medium text-sm md:text-base leading-snug transition-colors ${
                item.arranged ? 'line-through text-muted-foreground' : 'text-foreground'
              }`}>
                {language === 'bn' ? item.labelBn : item.labelEn}
              </h4>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <Badge variant={typeVariants[item.type] || 'secondary'} className="text-[10px] px-2 py-0 font-normal">
                  {typeLabels[item.type] || item.type}
                </Badge>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {formatCurrency(item.min, item.currency, language)} – {formatCurrency(item.max, item.currency, language)}
                </span>
                {item.sourceUrl ? (
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-[11px] text-primary hover:underline"
                    aria-label={t('viewSource')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : null}
                {item.lastVerified && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-muted-foreground/30 text-muted-foreground">
                    ✓ {item.lastVerified}
                  </Badge>
                )}
              </div>
            </div>

            {/* Estimate display */}
            <div className="text-right shrink-0">
              <p className="font-bold font-mono text-sm md:text-base text-foreground">
                {formatCurrency(item.estimate, item.currency, language)}
              </p>
              {item.currency === 'EUR' && (
                <p className="text-[11px] text-muted-foreground font-mono">
                  ≈ {formatCurrency(bdtEstimate, 'BDT', language)}
                </p>
              )}
              {item.actualPaid !== null && (
                <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                  {t('actualPaid')}: {formatCurrency(item.actualPaid, item.currency, language)}
                </p>
              )}
            </div>
          </div>

          {/* Action Row: Expand / Mobile Edit */}
          <div className="flex items-center justify-between mt-2 pt-1 border-t border-border/40">
            <button
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {expanded ? (language === 'bn' ? 'সংক্ষেপ করুন' : 'Collapse') : (language === 'bn' ? 'সম্পাদনা ও বিবরণ' : 'Edit & Details')}
            </button>

            {onOpenMobileEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenMobileEdit(item)}
                className="h-7 px-2 text-xs md:hidden text-muted-foreground hover:text-foreground"
              >
                <Edit3 className="h-3 w-3 mr-1" />
                {language === 'bn' ? 'দ্রুত সম্পাদনা' : 'Quick edit'}
              </Button>
            )}
          </div>

          {/* Expanded Inline Editor & Notes */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 space-y-3 pt-2 overflow-hidden"
              >
                {/* Note Banner */}
                {(item.noteBn || item.noteEn) && (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/60 rounded-lg p-2.5 border border-border/50">
                    <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                    <span>{language === 'bn' ? item.noteBn : item.noteEn}</span>
                  </div>
                )}

                {/* Editable Inputs: Estimate & Actual Paid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/30 p-3 rounded-lg border border-border/50">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      {t('estimate')} ({item.currency})
                    </label>
                    <Input
                      type="number"
                      value={item.estimate}
                      onChange={(e) => setEstimate(item.id, parseFloat(e.target.value) || 0)}
                      className="h-8 text-sm font-mono bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">
                      {t('actualPaid')} ({item.currency})
                    </label>
                    <Input
                      type="number"
                      value={item.actualPaid ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setActualPaid(item.id, val === '' ? null : parseFloat(val) || 0);
                      }}
                      className="h-8 text-sm font-mono bg-background"
                      placeholder={language === 'bn' ? 'পরিশোধিত অর্থ' : 'Amount paid'}
                    />
                  </div>
                </div>

                {/* BDT Equivalents summary */}
                <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                  <span>
                    {t('bdtEquivalent')}: <span className="font-mono font-semibold text-foreground">{formatCurrency(bdtEstimate, 'BDT', language)}</span>
                  </span>
                  {bdtActual !== null && (
                    <span>
                      {t('actualSpent')}: <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(bdtActual, 'BDT', language)}</span>
                    </span>
                  )}
                </div>

                {/* Delete button if custom */}
                {item.isCustom && (
                  <div className="pt-1 flex justify-end">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteItem(item.id)}
                      className="h-7 text-xs"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      {t('deleteItem')}
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
