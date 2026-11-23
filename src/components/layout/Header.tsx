'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { Moon, Sun, Shield, Layers, Calendar, CheckSquare, PieChart, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { toBanglaDigits } from '@/lib/utils';
import { getEffectiveRate } from '@/lib/budget';

export function Header() {
  const t = useT();
  const { language, setLanguage, exchangeRate } = useStore();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const effectiveRate = getEffectiveRate(
    exchangeRate.manualOverride ? (exchangeRate.manualRate || exchangeRate.rate) : exchangeRate.rate,
    exchangeRate.bankMargin
  );

  const navLinks = [
    { label: t('navChecklist'), href: '#cost-list', icon: CheckSquare },
    { label: t('navCharts'), href: '#budget-charts', icon: PieChart },
    { label: t('navScenarios'), href: '#scenario-compare', icon: Layers },
    { label: t('navTimeline'), href: '#timeline-view', icon: Calendar },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/90 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-primary to-amber-500 flex items-center justify-center text-white text-lg font-bold shadow-xs group-hover:scale-105 transition-transform">
            🇩🇪
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base md:text-lg tracking-tight text-foreground font-sans">
                GermanyCost<span className="text-emerald-600 dark:text-emerald-400">BD</span>
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground hidden lg:block leading-tight font-sans">
              {t('appTagline')}
            </p>
          </div>
        </Link>

        {/* Desktop Quick Nav Links */}
        <nav className="hidden md:flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/50 text-xs">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.href}
                href={item.href}
                className="px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/80 font-medium transition-all flex items-center gap-1.5"
              >
                <Icon className="h-3.5 w-3.5 text-primary" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-2">
          {/* Live rate chip on tablet/desktop */}
          <a
            href="#exchange-rate"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-medium hover:bg-emerald-500/15 transition-colors"
            title="Live effective EUR/BDT exchange rate"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>€1 = ৳{language === 'bn' ? toBanglaDigits(effectiveRate.toFixed(1)) : effectiveRate.toFixed(1)}</span>
          </a>

          {/* Segmented Language Switcher */}
          <div className="flex items-center bg-muted p-0.5 rounded-lg border border-border/60 text-xs">
            <button
              onClick={() => setLanguage('bn')}
              className={`px-2 py-1 rounded-md font-semibold transition-all ${
                language === 'bn'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              বাংলা
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 rounded-md font-semibold transition-all ${
                language === 'en'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              EN
            </button>
          </div>

          {/* Theme Toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-8 w-8 border-border/80"
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-primary" />
          </Button>

          {/* Admin link */}
          <Link
            href="/admin"
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors hidden sm:block"
            title="Admin Console"
          >
            <Shield className="h-4 w-4" />
          </Link>

          {/* Mobile Menu Hamburger */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="h-8 w-8 md:hidden text-muted-foreground"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Dropdown Nav Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur-md px-4 py-3 space-y-2 animate-in slide-in-from-top-2 duration-150">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 hover:bg-muted font-medium text-foreground transition-colors"
                >
                  <Icon className="h-4 w-4 text-primary" />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </div>

          <div className="pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-mono">
              €1 = ৳{language === 'bn' ? toBanglaDigits(effectiveRate.toFixed(2)) : effectiveRate.toFixed(2)}
            </span>
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Admin Panel</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
