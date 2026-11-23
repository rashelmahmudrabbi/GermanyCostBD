'use client';

import { createContext, useContext } from 'react';
import { Language } from '@/types';
import bn from '@/i18n/bn.json';
import en from '@/i18n/en.json';

const translations: Record<Language, Record<string, string>> = { bn, en };

export function t(key: string, language: Language): string {
  return translations[language]?.[key] || translations['en']?.[key] || key;
}

export const I18nContext = createContext<Language>('bn');

export function useLanguage(): Language {
  return useContext(I18nContext);
}

export function useT() {
  const lang = useLanguage();
  return (key: string, replacements?: Record<string, string | number>) => {
    let text = t(key, lang);
    if (replacements) {
      for (const [k, v] of Object.entries(replacements)) {
        text = text.replace(`{${k}}`, String(v));
      }
    }
    return text;
  };
}
