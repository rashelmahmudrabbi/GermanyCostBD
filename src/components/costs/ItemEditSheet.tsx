'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { UserCostItem } from '@/types';
import { convertToBDT, getEffectiveRate } from '@/lib/budget';
import { formatCurrency } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';

interface ItemEditSheetProps {
  item: UserCostItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ItemEditSheet({ item, open, onOpenChange }: ItemEditSheetProps) {
  const t = useT();
  const { setEstimate, setActualPaid, toggleArranged, deleteItem, exchangeRate, language } = useStore();

  const [estimate, setLocalEstimate] = useState<number>(0);
  const [actualPaid, setLocalActualPaid] = useState<string>('');
  const [arranged, setLocalArranged] = useState<boolean>(false);

  useEffect(() => {
    if (item) {
      setLocalEstimate(item.estimate);
      setLocalActualPaid(item.actualPaid !== null ? String(item.actualPaid) : '');
      setLocalArranged(item.arranged);
    }
  }, [item]);

  if (!item) return null;

  const effectiveRate = getEffectiveRate(
    exchangeRate.manualOverride ? (exchangeRate.manualRate || exchangeRate.rate) : exchangeRate.rate,
    exchangeRate.bankMargin
  );

  const bdtEstimate = convertToBDT(estimate, item.currency, effectiveRate, 0);

  const handleSave = () => {
    setEstimate(item.id, estimate);
    setActualPaid(item.id, actualPaid === '' ? null : parseFloat(actualPaid) || 0);
    if (arranged !== item.arranged) {
      toggleArranged(item.id);
    }
    onOpenChange(false);
  };

  const handleDelete = () => {
    deleteItem(item.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed bottom-0 top-auto sm:top-[50%] sm:bottom-auto w-full max-w-lg translate-y-0 sm:translate-y-[-50%] rounded-t-2xl sm:rounded-xl p-6 shadow-2xl">
        <DialogHeader className="text-left pb-2 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-semibold leading-normal">
              {language === 'bn' ? item.labelBn : item.labelEn}
            </DialogTitle>
            <Badge variant="outline" className="font-mono text-xs">
              {item.currency}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Arranged toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border">
            <div>
              <Label className="text-sm font-medium">{t('arranged')}</Label>
              <p className="text-[11px] text-muted-foreground">{t('arrangedTooltip')}</p>
            </div>
            <Switch
              checked={arranged}
              onCheckedChange={setLocalArranged}
            />
          </div>

          {/* Estimate */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-medium">{t('estimate')} ({item.currency})</Label>
              <span className="text-xs text-muted-foreground font-mono">
                {language === 'bn' ? 'পরিসীমা' : 'Range'}: {formatCurrency(item.min, item.currency, language)} – {formatCurrency(item.max, item.currency, language)}
              </span>
            </div>
            <Input
              type="number"
              value={estimate}
              onChange={(e) => setLocalEstimate(parseFloat(e.target.value) || 0)}
              className="font-mono text-base"
            />
            {item.currency === 'EUR' && (
              <p className="text-xs text-muted-foreground font-mono">
                ≈ {formatCurrency(bdtEstimate, 'BDT', language)}
              </p>
            )}
          </div>

          {/* Actual paid */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">{t('actualPaid')} ({item.currency})</Label>
            <Input
              type="number"
              value={actualPaid}
              onChange={(e) => setLocalActualPaid(e.target.value)}
              placeholder={language === 'bn' ? 'ঐচ্ছিক: কত টাকা পরিশোধ করেছেন' : 'Optional: actual paid'}
              className="font-mono text-base"
            />
          </div>

          {/* Note if any */}
          {(item.noteBn || item.noteEn) && (
            <p className="text-xs text-muted-foreground bg-muted/50 p-2.5 rounded-lg border">
              ℹ️ {language === 'bn' ? item.noteBn : item.noteEn}
            </p>
          )}
        </div>

        <DialogFooter className="flex flex-row justify-between items-center sm:justify-between pt-2 border-t gap-2">
          {item.isCustom ? (
            <Button variant="destructive" size="sm" onClick={handleDelete} className="text-xs">
              <Trash2 className="h-4 w-4 mr-1" />
              {t('deleteItem')}
            </Button>
          ) : <div />}

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              {t('cancel')}
            </Button>
            <Button size="sm" onClick={handleSave}>
              {t('save')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
