'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { generateId } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import costsData from '@/data/costs.json';

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategory?: string;
}

export function AddItemDialog({ open, onOpenChange, defaultCategory }: AddItemDialogProps) {
  const t = useT();
  const { addCustomItem, language } = useStore();
  const [form, setForm] = useState({
    labelBn: '',
    labelEn: '',
    category: defaultCategory || 'preparation',
    currency: 'BDT' as 'BDT' | 'EUR',
    min: 0,
    max: 0,
    default: 0,
    type: 'fee' as 'fee' | 'refundable' | 'released-monthly',
    noteBn: '',
    noteEn: '',
  });

  const handleSubmit = () => {
    if (!form.labelBn.trim() && !form.labelEn.trim()) return;

    addCustomItem({
      id: generateId(),
      labelBn: form.labelBn.trim() || form.labelEn.trim(),
      labelEn: form.labelEn.trim() || form.labelBn.trim(),
      category: form.category,
      currency: form.currency,
      min: form.min,
      max: form.max >= form.min ? form.max : form.min,
      default: form.default || form.min,
      type: form.type,
      noteBn: form.noteBn,
      noteEn: form.noteEn,
      sourceUrl: '',
      lastVerified: new Date().toISOString().split('T')[0],
      isCustom: true,
    });

    setForm({
      labelBn: '',
      labelEn: '',
      category: defaultCategory || 'preparation',
      currency: 'BDT',
      min: 0,
      max: 0,
      default: 0,
      type: 'fee',
      noteBn: '',
      noteEn: '',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('addItem')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{language === 'bn' ? 'খরচের নাম (বাংলা)' : 'Name (Bangla)'}</Label>
              <Input
                value={form.labelBn}
                onChange={(e) => setForm((f) => ({ ...f, labelBn: e.target.value }))}
                placeholder="যেমন: পুলিশ ক্লিয়ারেন্স"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">{language === 'bn' ? 'খরচের নাম (English)' : 'Name (English)'}</Label>
              <Input
                value={form.labelEn}
                onChange={(e) => setForm((f) => ({ ...f, labelEn: e.target.value }))}
                placeholder="e.g. Police Clearance"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{language === 'bn' ? 'ধাপ / ক্যাটাগরি' : 'Category'}</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {costsData.categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {language === 'bn' ? cat.labelBn : cat.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{language === 'bn' ? 'মুদ্রা' : 'Currency'}</Label>
              <Select
                value={form.currency}
                onValueChange={(v: 'BDT' | 'EUR') => setForm((f) => ({ ...f, currency: v }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BDT">৳ BDT</SelectItem>
                  <SelectItem value="EUR">€ EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">{t('minBudget')}</Label>
              <Input
                type="number"
                value={form.min || ''}
                onChange={(e) => setForm((f) => ({ ...f, min: parseFloat(e.target.value) || 0 }))}
                className="mt-1 font-mono text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <Label className="text-xs">{t('maxBudget')}</Label>
              <Input
                type="number"
                value={form.max || ''}
                onChange={(e) => setForm((f) => ({ ...f, max: parseFloat(e.target.value) || 0 }))}
                className="mt-1 font-mono text-sm"
                placeholder="0"
              />
            </div>
            <div>
              <Label className="text-xs">{t('estimate')}</Label>
              <Input
                type="number"
                value={form.default || ''}
                onChange={(e) => setForm((f) => ({ ...f, default: parseFloat(e.target.value) || 0 }))}
                className="mt-1 font-mono text-sm"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">{language === 'bn' ? 'খরচের ধরন' : 'Cost Type'}</Label>
            <Select value={form.type} onValueChange={(v: any) => setForm((f) => ({ ...f, type: v }))}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fee">{t('fee')}</SelectItem>
                <SelectItem value="refundable">{t('refundable')}</SelectItem>
                <SelectItem value="released-monthly">{t('releasedMonthly')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">{language === 'bn' ? 'নোট বা মন্তব্য (ঐচ্ছিক)' : 'Note (Optional)'}</Label>
            <Input
              value={form.noteBn}
              onChange={(e) => setForm((f) => ({ ...f, noteBn: e.target.value, noteEn: e.target.value }))}
              placeholder={language === 'bn' ? 'খরচ সম্পর্কিত কোনো দরকারি তথ্য' : 'Useful details'}
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter className="flex items-center justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmit}>
            {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
