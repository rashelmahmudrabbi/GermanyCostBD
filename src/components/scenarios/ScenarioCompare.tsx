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
import { Layers, Plus, Trash2, CheckCircle2, BookmarkPlus, Sparkles } from 'lucide-react';

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

  const handleApplyPresetAndCity = (presetKey: string, cityKey: string) => {
    const preset = presets[presetKey];
    const city = cities[cityKey];
    if (!preset) return;

    const newItems = applyScenario(items, preset.multiplier, city);
    setItems(newItems);
  };

  const handleSaveCurrentScenario = () => {
    if (scenarios.length >= 3) return;

    const presetName = language === 'bn' ? presets[selectedPreset]?.labelBn : presets[selectedPreset]?.labelEn;
    const cityName = language === 'bn' ? cities[selectedCity]?.labelBn : cities[selectedCity]?.labelEn;

    const newScenario = {
      id: `scenario-${Date.now()}`,
      name: `${presetName} · ${cityName}`,
      preset: selectedPreset,
      city: selectedCity,
      items: JSON.parse(JSON.stringify(items)),
    };

    addScenario(newScenario);
  };

  const currentBudget = calculateBudget(items, effectiveRate, 0, categories as any[]);

  return (
    <Card className="scroll-mt-24 border-border/70 shadow-xs" id="scenarios">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base md:text-lg font-bold flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span>{t('scenarioCompare')}</span>
            </CardTitle>
            <CardDescription className="text-xs">
              {language === 'bn'
                ? 'সাশ্রয়ী, মানসম্মত বা আরামদায়ক লাইফস্টাইল এবং শহরভেদে খরচের প্রভাব তুলনা করুন'
                : 'Compare costs across Budget, Standard, or Comfortable living and various German cities'}
            </CardDescription>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleSaveCurrentScenario}
            disabled={scenarios.length >= 3}
            className="text-xs h-8 gap-1.5 cursor-pointer w-fit"
          >
            <BookmarkPlus className="h-3.5 w-3.5" />
            <span>{t('addScenario')} ({scenarios.length}/3)</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Presets & City Configurator */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Preset Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                {language === 'bn' ? 'বাজেট ধরন' : 'Budget Style'}
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
                      className={`p-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                        isActive
                          ? 'bg-primary text-primary-foreground border-primary shadow-2xs font-semibold'
                          : 'bg-background hover:bg-muted/80 text-foreground border-border/60'
                      }`}
                    >
                      <p>{language === 'bn' ? p.labelBn : p.labelEn}</p>
                      <p className="text-[10px] opacity-75 mt-0.5 font-mono">
                        {key === 'budget' ? '-15%' : key === 'standard' ? '1.0x' : '+25%'}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* City Selector */}
            <div className="space-y-1.5">
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
                <SelectTrigger className="h-9 bg-background font-medium text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(cities).map(([key, c]: [string, any]) => (
                    <SelectItem key={key} value={key} className="text-xs">
                      <span>{language === 'bn' ? c.labelBn : c.labelEn}</span>
                      <span className="text-[11px] text-muted-foreground ml-2 font-mono">
                        ({c.rentMultiplier > 1 ? `+${Math.round((c.rentMultiplier - 1) * 100)}%` : `${Math.round((c.rentMultiplier - 1) * 100)}%`})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                {language === 'bn'
                  ? 'শহরভেদে বাসাভাড়া ও জীবনযাত্রার খরচের গড় হিসাব সমন্বয় করা হয়।'
                  : 'Adjusts local rent and daily living expenses per city cost index.'}
              </p>
            </div>
          </div>
        </div>

        {/* Saved Scenarios Comparison Cards */}
        {scenarios.length === 0 ? (
          <div className="text-center py-8 px-4 border border-dashed rounded-2xl bg-muted/20 text-muted-foreground space-y-2">
            <Sparkles className="h-6 w-6 mx-auto text-primary opacity-60" />
            <p className="font-semibold text-xs text-foreground">
              {language === 'bn' ? 'কোনো দৃশ্যপট সংরক্ষিত নেই' : 'No saved scenarios yet'}
            </p>
            <p className="text-[11px] max-w-sm mx-auto">
              {language === 'bn'
                ? 'বিভিন্ন শহর ও বাজেটের মধ্যে সরাসরি তুলনা দেখতে উপরের "+ দৃশ্যপট যোগ করুন" বাটনে ক্লিক করুন।'
                : 'Click "+ Add Scenario" above to save and compare up to 3 customized budget variations.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {scenarios.map((sc) => {
                const scBudget = calculateBudget(sc.items, effectiveRate, 0, categories as any[]);
                const diffSunk = scBudget.sunkSelectedBDT - currentBudget.sunkSelectedBDT;

                return (
                  <div
                    key={sc.id}
                    className="border rounded-2xl p-3.5 bg-card hover:border-primary/40 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
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

                      <div className="space-y-1">
                        <span className="text-[10px] text-muted-foreground block">{t('heroHeadline')}</span>
                        <p className="text-base font-bold font-mono text-foreground">
                          {formatCurrency(scBudget.sunkSelectedBDT, 'BDT', language)}
                        </p>
                        <p className="text-[11px] font-mono">
                          {diffSunk === 0 ? (
                            <span className="text-muted-foreground">
                              {language === 'bn' ? 'বর্তমানটির সমান' : 'Matches current'}
                            </span>
                          ) : diffSunk > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400 font-semibold">
                              +{formatCurrency(diffSunk, 'BDT', language)} {language === 'bn' ? 'বেশি' : 'more'}
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              -{formatCurrency(Math.abs(diffSunk), 'BDT', language)} {language === 'bn' ? 'কম' : 'less'}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setItems(sc.items)}
                      className="w-full text-xs h-7.5 gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{language === 'bn' ? 'এটি সক্রিয় করুন' : 'Load Plan'}</span>
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
