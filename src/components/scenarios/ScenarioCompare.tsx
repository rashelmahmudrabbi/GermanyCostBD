'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { applyScenario, calculateBudget, getEffectiveRate } from '@/lib/budget';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import costsData from '@/data/costs.json';
import { Layers, Plus, Trash2, CheckCircle2 } from 'lucide-react';

export function ScenarioCompare() {
  const t = useT();
  const { items, setItems, exchangeRate, language, scenarios, addScenario, removeScenario } = useStore();

  const [selectedPreset, setSelectedPreset] = useState<'budget' | 'standard' | 'comfortable'>('standard');
  const [selectedCity, setSelectedCity] = useState<string>('berlin');

  const presets = costsData.scenarios as Record<string, any>;
  const cities = costsData.cityAdjustments as Record<string, any>;
  const categories = costsData.categories;

  const effectiveRate = getEffectiveRate(
    exchangeRate.manualOverride ? (exchangeRate.manualRate || exchangeRate.rate) : exchangeRate.rate,
    exchangeRate.bankMargin
  );

  // Apply to current items
  const handleApplyPresetAndCity = (presetKey: string, cityKey: string) => {
    const preset = presets[presetKey];
    const city = cities[cityKey];
    if (!preset) return;

    const newItems = applyScenario(items, preset.multiplier, city);
    setItems(newItems);
  };

  // Save current configuration as a scenario
  const handleSaveCurrentScenario = () => {
    if (scenarios.length >= 3) return;

    const presetName = language === 'bn' ? presets[selectedPreset]?.labelBn : presets[selectedPreset]?.labelEn;
    const cityName = language === 'bn' ? cities[selectedCity]?.labelBn : cities[selectedCity]?.labelEn;

    const newScenario = {
      id: `scenario-${Date.now()}`,
      name: `${presetName} (${cityName})`,
      preset: selectedPreset,
      city: selectedCity,
      items: JSON.parse(JSON.stringify(items)),
    };

    addScenario(newScenario);
  };

  // Pre-calculate budgets for comparison cards
  const currentBudget = calculateBudget(items, effectiveRate, 0, categories as any[]);

  return (
    <Card className="border-border/80 shadow-sm" id="scenario-compare">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg md:text-xl font-bold flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <span>{t('scenarioCompare')}</span>
            </CardTitle>
            <CardDescription className="text-xs">
              {language === 'bn'
                ? 'সাশ্রয়ী, মানসম্মত বা আরামদায়ক বাজেট এবং শহরের ভিত্তিতে খরচ তুলনা করুন'
                : 'Compare costs across Budget, Standard, or Comfortable living and various German cities'}
            </CardDescription>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleSaveCurrentScenario}
            disabled={scenarios.length >= 3}
            className="text-xs h-8 gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('addScenario')} ({scenarios.length}/3)
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Preset & City Configurator */}
        <div className="p-4 rounded-xl bg-muted/40 border border-border/60 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Preset Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {language === 'bn' ? 'বাজেট ধরণ নির্বাচন' : 'Preset Style'}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['budget', 'standard', 'comfortable'] as const).map((key) => {
                  const p = presets[key];
                  const isActive = selectedPreset === key;
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedPreset(key);
                        handleApplyPresetAndCity(key, selectedCity);
                      }}
                      className={`p-2 rounded-lg text-xs font-medium border text-center transition-all ${
                        isActive
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                          : 'bg-background hover:bg-muted text-foreground border-border'
                      }`}
                    >
                      <p className="font-semibold">{language === 'bn' ? p.labelBn : p.labelEn}</p>
                      <p className="text-[10px] opacity-80 mt-0.5">
                        {key === 'budget' ? '-15%' : key === 'standard' ? 'গড়' : '+25%'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* City Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {t('city')}
              </label>
              <Select
                value={selectedCity}
                onValueChange={(val) => {
                  setSelectedCity(val);
                  handleApplyPresetAndCity(selectedPreset, val);
                }}
              >
                <SelectTrigger className="h-9 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(cities).map(([key, c]: [string, any]) => (
                    <SelectItem key={key} value={key}>
                      <span className="font-medium">{language === 'bn' ? c.labelBn : c.labelEn}</span>
                      <span className="text-xs text-muted-foreground ml-2 font-mono">
                        (ভাড়া: {c.rentMultiplier > 1 ? `+${Math.round((c.rentMultiplier - 1) * 100)}%` : `${Math.round((c.rentMultiplier - 1) * 100)}%`})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                {language === 'bn'
                  ? 'শহরের বাড়িভাড়া ও জীবনযাত্রার খরচের তারতম্য স্বয়ংক্রিয়ভাবে সমন্বয় করা হয়।'
                  : 'Adjusts rent and living costs according to average municipal indexes.'}
              </p>
            </div>
          </div>
        </div>

        {/* Side-by-side comparison cards if scenarios saved */}
        {scenarios.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold flex items-center justify-between">
              <span>{language === 'bn' ? 'সংরক্ষিত পরিকল্পনাসমূহ' : 'Saved Scenarios Comparison'}</span>
              <span className="text-xs text-muted-foreground font-normal">
                {language === 'bn' ? 'সর্বোচ্চ ৩টি দৃশ্যপট একসাথে তুলনা করুন' : 'Compare up to 3 scenarios'}
              </span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {scenarios.map((sc) => {
                const scBudget = calculateBudget(sc.items, effectiveRate, 0, categories as any[]);
                const diffWithCurrent = scBudget.totalSelectedBDT - currentBudget.totalSelectedBDT;

                return (
                  <div
                    key={sc.id}
                    className="border rounded-xl p-3.5 bg-card hover:border-primary/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary" className="font-medium text-xs">
                          {sc.name}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeScenario(sc.id)}
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="space-y-1 my-3">
                        <p className="text-xs text-muted-foreground">{t('selectedBudget')}</p>
                        <p className="text-lg font-bold font-mono text-foreground">
                          {formatCurrency(scBudget.totalSelectedBDT, 'BDT', language)}
                        </p>
                        <p className="text-[11px] font-mono text-muted-foreground">
                          {diffWithCurrent === 0 ? (
                            <span className="text-emerald-600">✓ {language === 'bn' ? 'বর্তমানটির সমান' : 'Matches current'}</span>
                          ) : diffWithCurrent > 0 ? (
                            <span className="text-amber-600">+{formatCurrency(diffWithCurrent, 'BDT', language)} {language === 'bn' ? 'বেশি' : 'higher'}</span>
                          ) : (
                            <span className="text-emerald-600">-{formatCurrency(Math.abs(diffWithCurrent), 'BDT', language)} {language === 'bn' ? 'কম' : 'lower'}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setItems(sc.items)}
                      className="w-full text-xs h-7 mt-2"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {language === 'bn' ? 'এটি সক্রিয় করুন' : 'Load this scenario'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
