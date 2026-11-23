'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { formatExchangeRate, formatRelativeTime, formatDateLocalized } from '@/lib/utils';
import { getEffectiveRate } from '@/lib/budget';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, Info } from 'lucide-react';

interface ExchangeRateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExchangeRateModal({ open, onOpenChange }: ExchangeRateModalProps) {
  const t = useT();
  const { exchangeRate, setExchangeRate, language } = useStore();
  const [loading, setLoading] = useState(false);
  const [relativeTime, setRelativeTime] = useState('');

  useEffect(() => {
    setRelativeTime(formatRelativeTime(exchangeRate.timestamp, language));
    const interval = setInterval(() => {
      setRelativeTime(formatRelativeTime(exchangeRate.timestamp, language));
    }, 60000);
    return () => clearInterval(interval);
  }, [exchangeRate.timestamp, language]);

  const fetchLiveRate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rate');
      const data = await res.json();
      if (data?.rate) {
        setExchangeRate({
          rate: data.rate,
          source: data.source || 'open.er-api.com',
          timestamp: Date.now(),
        });
      }
    } catch (e) {
      console.error('Failed to refresh rate', e);
    } finally {
      setLoading(false);
    }
  };

  const baseRate = exchangeRate.manualOverride
    ? (exchangeRate.manualRate || exchangeRate.rate)
    : exchangeRate.rate;
  const effectiveRate = getEffectiveRate(baseRate, exchangeRate.bankMargin);

  const exactFormattedDate = new Date(exchangeRate.timestamp).toLocaleString(
    language === 'bn' ? 'bn-BD' : 'en-US',
    { dateStyle: 'medium', timeStyle: 'short' }
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span>{t('exchangeRate')}</span>
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchLiveRate}
              disabled={loading}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Refresh live rate"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <DialogDescription className="text-xs">
            {t('effectiveRateNotice')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Main Rate Display */}
          <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 text-center space-y-1">
            <p className="text-xs text-muted-foreground font-medium">
              ১ ইউরো (EUR) =
            </p>
            <p className="text-3xl font-extrabold font-mono text-foreground tracking-tight">
              ৳{formatExchangeRate(effectiveRate, language)}
            </p>
            <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground pt-1">
              <span>{t('rateUpdated')}: {relativeTime}</span>
              <span>•</span>
              <span title={exactFormattedDate} className="cursor-help underline decoration-dotted">
                {exchangeRate.source}
              </span>
            </div>
          </div>

          {/* Bank Margin Slider */}
          <div className="space-y-2 p-3.5 rounded-xl bg-muted/40 dark:bg-muted/20 border border-border/60">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1">
                <span>{t('bankMargin')}</span>
                <span className="text-muted-foreground font-normal">
                  ({language === 'bn' ? 'স্টুডেন্ট ফাইলে ব্যাংক ফি' : 'TT & Bank spread'})
                </span>
              </span>
              <span className="font-mono font-bold text-primary">
                +{formatExchangeRate(exchangeRate.bankMargin, language)}%
              </span>
            </div>
            <Slider
              value={[exchangeRate.bankMargin]}
              onValueChange={([val]) => setExchangeRate({ bankMargin: val })}
              min={0}
              max={5}
              step={0.5}
            />
            <p className="text-[10px] text-muted-foreground">
              {language === 'bn'
                ? 'বাংলাদেশি ব্যাংকগুলো স্টুডেন্ট ফাইল ও রেমিট্যান্সে সাধারণত ২% মার্জিন হিসাব করে।'
                : 'Banks in Bangladesh typically charge a 2–3% foreign currency conversion spread.'}
            </p>
          </div>

          {/* Manual Rate Override */}
          <div className="p-3.5 rounded-xl bg-muted/40 dark:bg-muted/20 border border-border/60 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-semibold">{t('manualRate')}</Label>
                <p className="text-[10px] text-muted-foreground">
                  {language === 'bn' ? 'নির্দিষ্ট ব্যাংক কোটেশন অনুযায়ী রেট লিখুন' : 'Set your bank exact quote'}
                </p>
              </div>
              <Switch
                checked={exchangeRate.manualOverride}
                onCheckedChange={(checked) => setExchangeRate({ manualOverride: checked })}
              />
            </div>

            {exchangeRate.manualOverride && (
              <div className="pt-1">
                <Input
                  type="number"
                  step="0.01"
                  value={exchangeRate.manualRate || ''}
                  onChange={(e) => setExchangeRate({ manualRate: parseFloat(e.target.value) || 0 })}
                  placeholder="128.50"
                  className="font-mono text-sm h-8"
                />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
