'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { generateDeadlines, generateICS } from '@/lib/budget';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Download, Clock, CheckCircle } from 'lucide-react';

export function TimelineView() {
  const t = useT();
  const { intake, setIntake, language } = useStore();

  const baseYear = 2026;
  const [selectedType, setSelectedType] = useState<'winter' | 'summer'>(intake?.type || 'winter');
  const [selectedYear, setSelectedYear] = useState<number>(intake?.year || baseYear);
  const [checkedMilestones, setCheckedMilestones] = useState<Record<string, boolean>>({});

  const deadlines = generateDeadlines({ type: selectedType, year: selectedYear }, language);

  const handleApplyIntake = (type: 'winter' | 'summer', year: number) => {
    setSelectedType(type);
    setSelectedYear(year);
    setIntake({ type, year });
  };

  const handleToggleMilestone = (id: string) => {
    setCheckedMilestones((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleDownloadICS = () => {
    const icsContent = generateICS(deadlines, language);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `germany-study-deadlines-${selectedType}-${selectedYear}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatDate = (d: Date) => {
    return d.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Card className="scroll-mt-24 border-border/80 shadow-sm" id="timeline-view">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg md:text-xl font-bold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <span>{t('timeline')} & {t('reminders')}</span>
            </CardTitle>
            <CardDescription className="text-xs">
              {language === 'bn'
                ? 'আপনার ইনটেক বেছে নিন এবং সঠিক সময়ের ডেডলাইন দেখুন ও ক্যালেন্ডারে যোগ করুন'
                : 'Select your target semester and get structured preparation milestones with .ics export'}
            </CardDescription>
          </div>

          <Button
            size="sm"
            onClick={handleDownloadICS}
            className="text-xs h-8 gap-1.5 shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            {t('downloadCalendar')} (.ics)
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Intake picker */}
        <div className="flex flex-wrap items-center gap-3 p-3.5 rounded-xl bg-muted/40 border">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase">{t('intake')}:</span>
            <div className="flex items-center gap-1">
              <Button
                variant={selectedType === 'winter' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleApplyIntake('winter', selectedYear)}
                className="text-xs h-8"
              >
                ❄️ {t('winterSemester')} (Oct)
              </Button>
              <Button
                variant={selectedType === 'summer' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleApplyIntake('summer', selectedYear)}
                className="text-xs h-8"
              >
                ☀️ {t('summerSemester')} (Apr)
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              {language === 'bn' ? 'সাল' : 'Year'}:
            </span>
            <Select
              value={String(selectedYear)}
              onValueChange={(val) => handleApplyIntake(selectedType, parseInt(val))}
            >
              <SelectTrigger className="w-24 h-8 text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[baseYear, baseYear + 1, baseYear + 2].map((yr) => (
                  <SelectItem key={yr} value={String(yr)}>
                    {yr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Milestones timeline list */}
        <div className="space-y-2.5">
          {deadlines.map((dl, idx) => {
            const isChecked = !!checkedMilestones[dl.id];
            const isNear = idx < 3;

            return (
              <div
                key={dl.id}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  isChecked
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-card hover:border-primary/40'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => handleToggleMilestone(dl.id)}
                    aria-label={language === 'bn' ? dl.labelBn : dl.labelEn}
                  />

                  <div className="min-w-0">
                    <p className={`text-sm font-medium leading-snug truncate ${
                      isChecked ? 'line-through text-muted-foreground' : 'text-foreground'
                    }`}>
                      {language === 'bn' ? dl.labelBn : dl.labelEn}
                    </p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <Clock className="h-3 w-3" />
                      <span className="font-mono">{formatDate(dl.date)}</span>
                    </p>
                  </div>
                </div>

                <div className="shrink-0 ml-2">
                  {isChecked ? (
                    <Badge variant="success" className="text-[10px]">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {t('completed')}
                    </Badge>
                  ) : (
                    <Badge variant={isNear ? 'warning' : 'outline'} className="text-[10px]">
                      {isNear ? (language === 'bn' ? 'জরুরি' : 'Upcoming') : (language === 'bn' ? 'পরিকল্পিত' : 'Scheduled')}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
