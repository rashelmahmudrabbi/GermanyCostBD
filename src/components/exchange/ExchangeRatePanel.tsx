'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { formatRelativeTime, toBanglaDigits } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ExchangeRatePanel() {
  const t = useT();
  const { exchangeRate, setExchangeRate, language } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [relativeTime, setRelativeTime] = useState<string>('');

  useEffect(() => {
    setRelativeTime(formatRelativeTime(exchangeRate.timestamp, language));
  }, [exchangeRate.timestamp, language]);

  const fetchRate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/rate');
      const data = await res.json();
      if (data.rate) {
        setExchangeRate({
          rate: data.rate,
          source: data.source || 'open.er-api.com',
          timestamp: Date.now(),
        });
      }
    } catch {
      setError(language === 'bn' ? 'রেট আপডেট করা যায়নি' : 'Failed to update rate');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayRate = exchangeRate.manualOverride 
    ? (exchangeRate.manualRate || exchangeRate.rate) 
    : exchangeRate.rate;
  const effectiveRate = displayRate * (1 + exchangeRate.bankMargin / 100);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{t('exchangeRate')}</CardTitle>
          <Button variant="ghost" size="icon" onClick={fetchRate} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">€1 =</span>
          <span className="text-2xl font-bold font-mono">
            ৳{language === 'bn' ? toBanglaDigits(effectiveRate.toFixed(2)) : effectiveRate.toFixed(2)}
          </span>
        </div>

        <div className="text-xs text-muted-foreground flex items-center justify-between">
          <span>{t('rateUpdated')}: {relativeTime || (language === 'bn' ? 'সম্প্রতি' : 'recently')}</span>
          <Badge variant="outline" className="text-[10px]">
            {exchangeRate.source}
          </Badge>
        </div>

        {/* Bank Margin Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">{t('bankMargin')}</Label>
            <span className="text-xs font-mono">{exchangeRate.bankMargin}%</span>
          </div>
          <Slider
            value={[exchangeRate.bankMargin]}
            onValueChange={([v]) => setExchangeRate({ bankMargin: v })}
            min={0}
            max={5}
            step={0.5}
          />
        </div>

        {/* Manual Override */}
        <div className="flex items-center justify-between">
          <Label className="text-xs">{t('manualRate')}</Label>
          <Switch
            checked={exchangeRate.manualOverride}
            onCheckedChange={(checked) => setExchangeRate({ manualOverride: checked })}
          />
        </div>

        {exchangeRate.manualOverride && (
          <Input
            type="number"
            value={exchangeRate.manualRate || ''}
            onChange={(e) => setExchangeRate({ manualRate: parseFloat(e.target.value) || 0 })}
            placeholder="128.50"
            className="font-mono"
          />
        )}
      </CardContent>
    </Card>
  );
}
