'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { Moon, Sun, Layers, Calendar, CheckSquare, BarChart3, Menu, X, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { formatExchangeRate } from '@/lib/utils';
import { getEffectiveRate } from '@/lib/budget';
import { ExchangeRateModal } from '@/components/exchange/ExchangeRateModal';

interface HeaderProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function Header({ activeTab = 'overview', onTabChange }: HeaderProps) {
  const t = useT();
  const { language, setLanguage, exchangeRate } = useStore();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [rateModalOpen, setRateModalOpen] = useState(false);

  const effectiveRate = getEffectiveRate(
    exchangeRate.manualOverride ? (exchangeRate.manualRate || exchangeRate.rate) : exchangeRate.rate,
    exchangeRate.bankMargin
  );

  const navItems = [
    { id: 'overview', label: t('navOverview'), icon: BarChart3 },
    { id: 'checklist', label: t('navChecklist'), icon: CheckSquare },
    { id: 'scenarios', label: t('navScenarios'), icon: Layers },
    { id: 'timeline', label: t('navTimeline'), icon: Calendar },
  ];

  const handleNavClick = (id: string) => {
    if (onTabChange) {
      onTabChange(id);
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-white dark:bg-[#09090b] shadow-xs transition-colors print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between gap-3">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 via-primary to-amber-500 flex items-center justify-center text-white text-sm font-bold shadow-2xs group-hover:scale-105 transition-transform">
              🇩🇪
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-foreground leading-tight">
                GermanyCost<span className="text-emerald-600 dark:text-emerald-400">BD</span>
              </span>
              <span className="text-[10px] text-muted-foreground hidden sm:block leading-none">
                {t('appName')}
              </span>
            </div>
          </Link>

          {/* Desktop Tab Navigation */}
          <nav className="hidden md:flex items-center bg-muted/50 p-1 rounded-xl border border-border/50 text-xs font-medium">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'bg-background text-foreground shadow-2xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Single Source of Truth Exchange Rate Chip */}
            <button
              onClick={() => setRateModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-xs font-mono font-semibold hover:bg-emerald-500/20 transition-all cursor-pointer"
              title={t('exchangeRate')}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>€1 = ৳{formatExchangeRate(effectiveRate, language)}</span>
              <ArrowUpRight className="h-3 w-3 opacity-60" />
            </button>

            {/* Segmented Language Switcher */}
            <div className="flex items-center bg-muted p-0.5 rounded-lg border border-border/60 text-xs">
              <button
                onClick={() => setLanguage('bn')}
                className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                  language === 'bn'
                    ? 'bg-background text-foreground shadow-2xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                বাং
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 rounded-md font-semibold transition-all ${
                  language === 'en'
                    ? 'bg-background text-foreground shadow-2xs'
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
              aria-label="Toggle dark/light theme"
            >
              <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
              <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-primary" />
            </Button>

            {/* Mobile Hamburger Menu */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="h-8 w-8 md:hidden text-muted-foreground"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Dropdown Nav Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background/98 px-4 py-3 space-y-2 animate-in slide-in-from-top-2 duration-150">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl font-medium text-left transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'bg-muted/40 text-foreground hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Global Rate Configurator Dialog */}
      <ExchangeRateModal open={rateModalOpen} onOpenChange={setRateModalOpen} />
    </>
  );
}
