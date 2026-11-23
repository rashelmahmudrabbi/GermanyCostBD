'use client';

import { useT } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import { ShieldCheck, Heart, ExternalLink } from 'lucide-react';

export function Footer() {
  const t = useT();
  const { language } = useStore();

  return (
    <footer className="mt-16 border-t bg-muted/20 text-muted-foreground print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="space-y-1">
            <p className="font-semibold text-sm text-foreground">
              GermanyCostBD — {language === 'bn' ? 'বাংলাদেশি শিক্ষার্থীদের স্টাডি কস্ট প্ল্যানার' : 'Study in Germany Cost Planner'}
            </p>
            <p className="text-xs text-muted-foreground flex items-center justify-center md:justify-start gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t('dataPrivacy')} (Zero tracking, 100% localStorage)</span>
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <a
              href="https://dhaka.diplo.de"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <span>{language === 'bn' ? 'জার্মান দূতাবাস ঢাকা' : 'German Embassy Dhaka'}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="https://www.daad.de"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <span>DAAD Germany</span>
              <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="https://facebook.com/groups/BSAAG"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <span>BSAAG Community</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="p-3.5 rounded-xl bg-muted/60 border border-border/50 text-xs text-center leading-relaxed">
          {t('disclaimer')}
        </div>

        <div className="text-center text-[11px] text-muted-foreground/80 flex items-center justify-center gap-1">
          <span>{t('madeWith')}</span>
        </div>
      </div>
    </footer>
  );
}
