'use client';

import * as React from 'react';
import { ThemeProvider } from 'next-themes';
import { ToastProvider } from '@/components/ui/toast';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ToastProvider>
        {children}
      </ToastProvider>
    </ThemeProvider>
  );
}
