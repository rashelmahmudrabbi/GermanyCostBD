'use client';

import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { Moon, Sun, Globe, Shield, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export function Header() {
  const t = useT();
  const { language, setLanguage } = useStore();
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-primary to-amber-500 flex items-center justify-center text-white text-lg font-bold shadow-sm group-hover:scale-105 transition-transform">
            🇩🇪
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base md:text-lg tracking-tight text-foreground">
                GermanyCost<span className="text-emerald-600 dark:text-emerald-400">BD</span>
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground hidden sm:block leading-tight">
              {t('appTagline')}
            </p>
          </div>
        </Link>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
            className="h-8 px-2.5 text-xs font-medium gap-1.5 border-border/80"
            title="Toggle language (বাংলা / English)"
          >
            <Globe className="h-3.5 w-3.5 text-primary" />
            <span className="font-semibold">{language === 'bn' ? 'English' : 'বাংলা'}</span>
          </Button>

          {/* Theme Toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-8 w-8 border-border/80"
            aria-label="Toggle theme"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* Admin link */}
          <Link
            href="/admin"
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg transition-colors hidden sm:block"
            title="Fee Verification Admin"
          >
            <Shield className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
