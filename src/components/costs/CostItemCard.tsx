'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { UserCostItem } from '@/types';
import { convertToBDT, getEffectiveRate } from '@/lib/budget';
import {
  formatCurrency,
  extractDomain,
  getFreshnessStatus,
  formatDateLocalized,
} from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ExternalLink,
  Trash2,
  Info,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';

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

  // Freshness & Domain extraction
  const domain = extractDomain(item.sourceUrl);
  const freshness = getFreshnessStatus(item.lastVerified);

  const freshnessColor = {
    fresh: 'bg-emerald-500',
    moderate: 'bg-amber-500',
    stale: 'bg-zinc-400 dark:bg-zinc-600',
  }[freshness.status];

  // Meaningful status badges ONLY (no generic "fee" badge)
  const isSpecialType = item.type === 'refundable' || item.type === 'released-monthly' || item.type === 'optional';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className={`border rounded-xl p-3 sm:p-3.5 transition-colors ${
        item.arranged
          ? 'bg-emerald-500/5 border-emerald-500/25'
          : 'bg-card border-border/70 hover:border-border'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: Checkbox + Title + Domain Source */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Arranged Checkbox with min 44px target area */}
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center p-1 cursor-pointer">
                  <Checkbox
                    checked={item.arranged}
                    onCheckedChange={() => toggleArranged(item.id)}
                    aria-label={`${item.labelEn} - ${t('arranged')}`}
                    className="h-4.5 w-4.5 rounded-md"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs text-xs">
                <p>{t('arrangedTooltip')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                onClick={() => toggleArranged(item.id)}
                className={`text-xs sm:text-sm font-medium leading-tight cursor-pointer transition-colors ${
                  item.arranged
                    ? 'line-through text-muted-foreground'
                    : 'text-foreground hover:text-primary'
                }`}
              >
                {language === 'bn' ? item.labelBn : item.labelEn}
              </span>

              {/* Show badge ONLY for meaningful types */}
              {isSpecialType && (
                <Badge
                  variant={item.type === 'refundable' ? 'success' : item.type === 'released-monthly' ? 'info' : 'secondary'}
                  className="text-[10px] px-1.5 py-0 font-normal shrink-0"
                >
                  {item.type === 'refundable'
                    ? t('refundable')
                    : item.type === 'released-monthly'
                    ? t('releasedMonthly')
                    : t('optional')}
                </Badge>
              )}
            </div>

            {/* Source domain + freshness link */}
            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${freshnessColor}`} />

              {domain ? (
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 hover:underline text-muted-foreground hover:text-foreground"
                >
                  <span>{domain}</span>
                  <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                  {item.lastVerified && (
                    <span className="opacity-70 font-mono ml-1">
                      · {formatDateLocalized(item.lastVerified, language)}
                    </span>
                  )}
                </a>
              ) : (
                <span className="opacity-70">
                  {t('personalEstimate')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Amounts & Secondary Menu */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="font-bold font-mono text-xs sm:text-sm text-foreground">
              {formatCurrency(item.estimate, item.currency, language)}
            </p>
            {item.currency === 'EUR' && (
              <p className="text-[11px] text-muted-foreground font-mono">
                ≈ {formatCurrency(bdtEstimate, 'BDT', language)}
              </p>
            )}
            {item.actualPaid !== null && (
              <p className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                {t('actualPaid')}: {formatCurrency(item.actualPaid, item.currency, language)}
              </p>
            )}
          </div>

          {/* Secondary Action ⋯ Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (onOpenMobileEdit && window.innerWidth < 768) {
                onOpenMobileEdit(item);
              } else {
                setExpanded(!expanded);
              }
            }}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label="More actions"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <MoreHorizontal className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Inline Quick Drawer on Desktop */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-border/50 space-y-3 overflow-hidden text-xs"
          >
            {/* Note banner */}
            {(item.noteBn || item.noteEn) && (
              <div className="flex items-start gap-2 bg-muted/50 p-2.5 rounded-lg border border-border/40 text-muted-foreground">
                <Info className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
                <span>{language === 'bn' ? item.noteBn : item.noteEn}</span>
              </div>
            )}

            {/* Editable inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-muted/30 p-2.5 rounded-lg border border-border/40">
              <div>
                <label className="text-[11px] font-semibold text-foreground block mb-1">
                  {t('estimate')} ({item.currency})
                </label>
                <Input
                  type="number"
                  value={item.estimate}
                  onChange={(e) => setEstimate(item.id, parseFloat(e.target.value) || 0)}
                  className="h-8 text-xs font-mono bg-background"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-foreground block mb-1">
                  {t('actualPaid')} ({item.currency})
                </label>
                <Input
                  type="number"
                  value={item.actualPaid ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setActualPaid(item.id, val === '' ? null : parseFloat(val) || 0);
                  }}
                  className="h-8 text-xs font-mono bg-background"
                  placeholder="—"
                />
              </div>
            </div>

            {/* Custom item delete */}
            {item.isCustom && (
              <div className="flex justify-end pt-1">
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
    </motion.div>
  );
}
