'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { generateDeadlines, generateICS, getNextUpcomingIntake } from '@/lib/budget';
import { formatDateLocalized, formatNumber } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Download, Clock, CheckCircle, Snowflake, Sun } from 'lucide-react';

export function TimelineView() {
  const t = useT();
  const { intake, setIntake, language } = useStore();

  const dynamicNext = getNextUpcomingIntake(new Date());
  const selectedType = intake?.type || dynamicNext.type;
  const selectedYear = intake?.year || dynamicNext.year;
  const [checkedMilestones, setCheckedMilestones] = useState<Record<string, boolean>>({});

  const deadlines = generateDeadlines({ type: selectedType, year: selectedYear }, language, new Date());

  const handleApplyIntake = (type: 'winter' | 'summer', year: number) => {
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

  return (
    <Card className="scroll-mt-24 border-border/70 shadow-xs" id="timeline">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base md:text-lg font-bold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span>{t('timeline')}</span>
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
            className="text-xs h-8 gap-1.5 shadow-2xs cursor-pointer w-fit"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{t('downloadCalendar')}</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Intake picker */}
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-2xl bg-muted/40 border border-border/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase">{t('intake')}:</span>
            <div className="flex items-center gap-1">
              <Button
                variant={selectedType === 'winter' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleApplyIntake('winter', selectedYear)}
                className="text-xs h-8 gap-1.5 cursor-pointer"
              >
                <Snowflake className="h-3.5 w-3.5" />
                <span>{t('winterSemester')} (Oct)</span>
              </Button>
              <Button
                variant={selectedType === 'summer' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleApplyIntake('summer', selectedYear)}
                className="text-xs h-8 gap-1.5 cursor-pointer"
              >
                <Sun className="h-3.5 w-3.5 text-amber-500" />
                <span>{t('summerSemester')} (Apr)</span>
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase">
              {language === 'bn' ? 'সাল' : 'Year'}:
            </span>
            <Select
              value={String(selectedYear)}
              onValueChange={(val) => handleApplyIntake(selectedType, parseInt(val, 10))}
            >
              <SelectTrigger className="w-24 h-8 text-xs bg-background font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[dynamicNext.year - 1, dynamicNext.year, dynamicNext.year + 1, dynamicNext.year + 2].map((yr) => (
                  <SelectItem key={yr} value={String(yr)} className="font-mono text-xs">
                    {formatNumber(yr, language)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Milestones list */}
        <div className="space-y-2">
          {deadlines.map((dl) => {
            const isChecked = !!checkedMilestones[dl.id];
            const isOverdue = dl.status === 'overdue';

            return (
              <div
                key={dl.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                  isChecked
                    ? 'bg-emerald-500/5 border-emerald-500/25'
                    : isOverdue
                    ? 'bg-destructive/5 border-destructive/25'
                    : 'bg-card border-border/70 hover:border-border'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => handleToggleMilestone(dl.id)}
                    aria-label={language === 'bn' ? dl.labelBn : dl.labelEn}
                    className="h-4.5 w-4.5 rounded-md cursor-pointer"
                  />

                  <div className="min-w-0 flex-1">
                    <p className={`text-xs sm:text-sm font-medium leading-snug truncate ${
                      isChecked ? 'line-through text-muted-foreground' : 'text-foreground'
                    }`}>
                      {language === 'bn' ? dl.labelBn : dl.labelEn}
                    </p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <Clock className="h-3 w-3" />
                      <span>{formatDateLocalized(dl.date.toISOString().split('T')[0], language)}</span>
                    </p>
                  </div>
                </div>

                <div className="shrink-0 ml-2">
                  {isChecked ? (
                    <Badge variant="success" className="text-[10px] gap-1 font-normal">
                      <CheckCircle className="h-3 w-3" />
                      <span>{t('completed')}</span>
                    </Badge>
                  ) : isOverdue ? (
                    <Badge variant="destructive" className="text-[10px] font-normal">
                      {t('overdue')}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground">
                      {t('upcoming')}
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
