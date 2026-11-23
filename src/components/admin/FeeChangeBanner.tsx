'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { AlertTriangle, ArrowRight, X } from 'lucide-react';

export function FeeChangeBanner() {
  const t = useT();
  const { language } = useStore();
  const [pendingChanges, setPendingChanges] = useState<any[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch('/api/admin/pending-fees')
      .then((res) => res.json())
      .then((data) => {
        if (data?.pending && Array.isArray(data.pending)) {
          setPendingChanges(data.pending);
        }
      })
      .catch(() => {});
  }, []);

  if (dismissed || pendingChanges.length === 0) return null;

  const firstChange = pendingChanges[0];

  return (
    <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl p-3 md:p-4 mb-6 text-amber-900 dark:text-amber-200">
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2.5">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
          <div className="text-xs md:text-sm">
            <span className="font-semibold">{t('feeChanged')}: </span>
            <span>
              {firstChange.label} {language === 'bn' ? 'সম্প্রতি পরিবর্তিত হয়েছে বলে শনাক্ত হয়েছে' : 'has a proposed fee update detected'} ({firstChange.currentValue} → {firstChange.proposedValue} {firstChange.currency}).
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-lg transition-colors"
          >
            <span>{language === 'bn' ? 'যাচাই ও অনুমোদন' : 'Review & Approve'}</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 hover:bg-amber-500/20 rounded-md text-amber-700 dark:text-amber-300"
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
