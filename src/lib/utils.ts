import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Language } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const BANGLA_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const BANGLA_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];
const ENGLISH_MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Converts Western digits to Bengali digits
 */
export function toBanglaDigits(str: string | number): string {
  return String(str).replace(/[0-9]/g, (d) => BANGLA_DIGITS[parseInt(d, 10)]);
}

/**
 * Converts Bengali digits back to Western digits
 */
export function toEnglishDigits(str: string): string {
  const banglaDigitsStr = '০১২৩৪৫৬৭৮৯';
  return str.replace(/[০-৯]/g, (d) => String(banglaDigitsStr.indexOf(d)));
}

/**
 * Single source of truth currency formatter
 * Bengali: ৳১৫,০০,০০০ (Lakh format with Bengali digits)
 * English: ৳15,00,000 / €11,904
 */
export function formatCurrency(
  amount: number,
  currency: 'BDT' | 'EUR',
  language: Language = 'bn'
): string {
  const rounded = Math.round(amount);

  if (currency === 'BDT') {
    // South Asian lakh/crore grouping for BDT
    const formatted = rounded.toLocaleString('en-IN');
    if (language === 'bn') {
      return `৳${toBanglaDigits(formatted)}`;
    }
    return `৳${formatted}`;
  }

  // EUR formatting
  const formattedEur = rounded.toLocaleString('en-US');
  if (language === 'bn') {
    return `€${toBanglaDigits(formattedEur)}`;
  }
  return `€${formattedEur}`;
}

/**
 * General number formatting with localized digits
 */
export function formatNumber(num: number, language: Language = 'bn'): string {
  const formatted = num.toLocaleString('en-US');
  return language === 'bn' ? toBanglaDigits(formatted) : formatted;
}

/**
 * Exchange rate formatted to strictly 2 decimal places
 */
export function formatExchangeRate(rate: number, language: Language = 'bn'): string {
  const fixed = rate.toFixed(2);
  return language === 'bn' ? toBanglaDigits(fixed) : fixed;
}

/**
 * Relative time calculation with exact wording
 */
export function formatRelativeTime(timestamp: number, language: Language = 'bn'): string {
  const now = Date.now();
  const diffMs = Math.max(0, now - timestamp);
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (language === 'bn') {
    if (minutes < 1) return 'এইমাত্র';
    if (minutes < 60) return `${toBanglaDigits(minutes)} মিনিট আগে`;
    if (hours < 24) return `${toBanglaDigits(hours)} ঘণ্টা আগে`;
    if (days < 30) return `${toBanglaDigits(days)} দিন আগে`;
    const months = Math.floor(days / 30);
    return `${toBanglaDigits(months)} মাস আগে`;
  }

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`;
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? 's' : ''} ago`;
}

/**
 * Extracts clean domain from URL
 * e.g. "https://www.uni-assist.de/tools/" -> "uni-assist.de"
 */
export function extractDomain(url?: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
  }
}

/**
 * Freshness status of last verified date:
 * - fresh (< 30 days): green
 * - moderate (30–90 days): amber
 * - stale (> 90 days): gray
 */
export function getFreshnessStatus(dateStr?: string): {
  status: 'fresh' | 'moderate' | 'stale';
  days: number;
} {
  if (!dateStr) return { status: 'stale', days: 999 };
  const verified = new Date(dateStr).getTime();
  const now = Date.now();
  const diffDays = Math.max(0, Math.floor((now - verified) / (1000 * 60 * 60 * 24)));

  if (diffDays <= 30) return { status: 'fresh', days: diffDays };
  if (diffDays <= 90) return { status: 'moderate', days: diffDays };
  return { status: 'stale', days: diffDays };
}

/**
 * Format date string into localized human date
 * e.g. "2026-10-20" -> "২০ অক্টোবর ২০২৬" / "20 Oct 2026"
 */
export function formatDateLocalized(dateStr: string, language: Language = 'bn'): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    const day = d.getDate();
    const monthIdx = d.getMonth();
    const year = d.getFullYear();

    if (language === 'bn') {
      return `${toBanglaDigits(day)} ${BANGLA_MONTHS[monthIdx]} ${toBanglaDigits(year)}`;
    }
    return `${day} ${ENGLISH_MONTHS_SHORT[monthIdx]} ${year}`;
  } catch {
    return dateStr;
  }
}

export function isRetainedFund(itemId: string): boolean {
  return itemId === 'blocked-amount' || itemId === 'housing-deposit';
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
