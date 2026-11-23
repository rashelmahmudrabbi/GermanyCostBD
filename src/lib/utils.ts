import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currency: 'BDT' | 'EUR',
  language: 'bn' | 'en' = 'bn'
): string {
  if (language === 'bn') {
    const formatted = toBanglaDigits(Math.round(amount).toLocaleString('en-IN'));
    return currency === 'BDT' ? `৳${formatted}` : `€${formatted}`;
  }
  return currency === 'BDT' 
    ? `৳${Math.round(amount).toLocaleString('en-IN')}` 
    : `€${Math.round(amount).toLocaleString('en-US')}`;
}

export function toBanglaDigits(str: string): string {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return str.replace(/[0-9]/g, (d) => banglaDigits[parseInt(d)]);
}

export function toEnglishDigits(str: string): string {
  const banglaDigits = '০১২৩৪৫৬৭৮৯';
  return str.replace(/[০-৯]/g, (d) => String(banglaDigits.indexOf(d)));
}

export function formatRelativeTime(timestamp: number, language: 'bn' | 'en', currentTimestamp?: number): string {
  if (typeof window === 'undefined' && !currentTimestamp) {
    return language === 'bn' ? 'সম্প্রতি' : 'recently';
  }
  const now = currentTimestamp || Date.now();
  const diff = Math.max(0, now - timestamp);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  
  if (language === 'bn') {
    if (minutes < 1) return 'এইমাত্র';
    if (minutes < 60) return `${toBanglaDigits(String(minutes))} মিনিট আগে`;
    if (hours < 24) return `${toBanglaDigits(String(hours))} ঘণ্টা আগে`;
    return `${toBanglaDigits(String(Math.floor(hours / 24)))} দিন আগে`;
  }
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return `${Math.floor(hours / 24)} day${Math.floor(hours / 24) > 1 ? 's' : ''} ago`;
}

export function generateId(): string {
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function encodeShareState(data: object): string {
  return btoa(encodeURIComponent(JSON.stringify(data)));
}

export function decodeShareState(hash: string): object | null {
  try {
    return JSON.parse(decodeURIComponent(atob(hash)));
  } catch {
    return null;
  }
}
