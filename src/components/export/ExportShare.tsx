'use client';

import { useState, useRef } from 'react';
import { useStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { encodeShareState } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Printer, Download, Upload, Share2, RotateCcw, Check, Copy } from 'lucide-react';

export function ExportShare() {
  const t = useT();
  const { items, setItems, exchangeRate, exportData, importData, resetToDefaults, language } = useStore();
  const { addToast } = useToast();

  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Snapshot before reset for Undo functionality
  const [prevBackup, setPrevBackup] = useState<string | null>(null);

  // 1. PDF / Print Export
  const handlePrint = () => {
    window.print();
  };

  // 2. JSON Backup Download
  const handleExportJSON = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `germanycostbd-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast({
      title: language === 'bn' ? 'ব্যাকআপ সফল' : 'Backup downloaded',
      variant: 'success',
    });
  };

  // 3. JSON Import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        importData(text);
        addToast({
          title: language === 'bn' ? 'ডেটা সফলভাবে ইমপোর্ট হয়েছে' : 'Data imported successfully',
          variant: 'success',
        });
      } catch (err) {
        addToast({
          title: language === 'bn' ? 'ফাইল সঠিক নয়' : 'Invalid backup file',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  // 4. Shareable Read-Only Link (encoded in URL hash)
  const handleGenerateShareLink = () => {
    const stateToShare = {
      items: items.map(i => ({
        id: i.id,
        estimate: i.estimate,
        actualPaid: i.actualPaid,
        arranged: i.arranged,
      })),
      rate: exchangeRate.rate,
      margin: exchangeRate.bankMargin,
      createdAt: Date.now(),
    };

    const encoded = encodeShareState(stateToShare);
    const fullUrl = `${window.location.origin}${window.location.pathname}#share=${encoded}`;
    setShareUrl(fullUrl);

    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      addToast({
        title: t('linkCopied'),
        variant: 'success',
      });
    });
  };

  // 5. Reset to defaults with confirmation & Undo toast
  const handleConfirmReset = () => {
    // Save snapshot for undo
    const backup = exportData();
    setPrevBackup(backup);

    resetToDefaults();
    setResetDialogOpen(false);

    addToast({
      title: t('resetSuccess'),
      description: language === 'bn' ? 'ডিফল্ট মান পুনরুদ্ধার করা হয়েছে।' : 'Restored default numbers.',
      action: {
        label: t('undo'),
        onClick: () => {
          if (backup) {
            importData(backup);
            addToast({
              title: language === 'bn' ? 'পূর্বাবস্থায় ফিরে গেছে' : 'Changes undone',
              variant: 'success',
            });
          }
        },
      },
    });
  };

  return (
    <Card className="border-border/80 shadow-sm print:hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base md:text-lg font-bold flex items-center gap-2">
          <Share2 className="h-5 w-5 text-primary" />
          <span>{language === 'bn' ? 'এক্সপোর্ট, শেয়ার ও ব্যাকআপ' : 'Export, Share & Backup'}</span>
        </CardTitle>
        <CardDescription className="text-xs">
          {language === 'bn'
            ? 'আপনার খরচ পরিকল্পনা সেভ করুন, প্রিন্ট করুন বা বন্ধুদের সাথে শেয়ার করুন'
            : 'Export print-ready PDF, back up your local dataset, or create a shareable link'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Special Action Buttons Grid */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {/* 1. PDF / Print Button */}
          <button
            onClick={handlePrint}
            className="group relative flex items-center gap-3 p-3 rounded-xl border border-border/80 bg-card hover:bg-blue-500/5 hover:border-blue-500/40 transition-all duration-200 text-left cursor-pointer active:scale-[0.98] shadow-2xs hover:shadow-xs min-h-[60px]"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-blue-500/20 transition-all">
              <Printer className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-foreground leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {t('exportPDF')}
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 truncate">
                {language === 'bn' ? 'প্রিন্ট ও রিপোর্ট' : 'Printable PDF'}
              </p>
            </div>
          </button>

          {/* 2. Export JSON Button */}
          <button
            onClick={handleExportJSON}
            className="group relative flex items-center gap-3 p-3 rounded-xl border border-border/80 bg-card hover:bg-emerald-500/5 hover:border-emerald-500/40 transition-all duration-200 text-left cursor-pointer active:scale-[0.98] shadow-2xs hover:shadow-xs min-h-[60px]"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-emerald-500/20 transition-all">
              <Download className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-foreground leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {t('exportJSON')}
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 truncate">
                {language === 'bn' ? 'ব্যাকআপ সেভ' : 'Download JSON'}
              </p>
            </div>
          </button>

          {/* 3. Import JSON Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="group relative flex items-center gap-3 p-3 rounded-xl border border-border/80 bg-card hover:bg-amber-500/5 hover:border-amber-500/40 transition-all duration-200 text-left cursor-pointer active:scale-[0.98] shadow-2xs hover:shadow-xs min-h-[60px]"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-amber-500/20 transition-all">
              <Upload className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-foreground leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                {t('importJSON')}
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 truncate">
                {language === 'bn' ? 'ফাইল আপলোড' : 'Restore JSON'}
              </p>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* 4. Share Link Button */}
          <button
            onClick={handleGenerateShareLink}
            className="group relative flex items-center gap-3 p-3 rounded-xl border border-border/80 bg-card hover:bg-violet-500/5 hover:border-violet-500/40 transition-all duration-200 text-left cursor-pointer active:scale-[0.98] shadow-2xs hover:shadow-xs min-h-[60px]"
          >
            <div className="w-9 h-9 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-violet-500/20 transition-all">
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Share2 className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-foreground leading-snug group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                {copied ? t('copied') : t('shareLink')}
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 truncate">
                {language === 'bn' ? 'লিংক তৈরি করুন' : 'Read-only link'}
              </p>
            </div>
          </button>
        </div>

        {/* Share link input if generated */}
        {shareUrl && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/60 border border-border/70 text-xs">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="bg-transparent flex-1 outline-none text-muted-foreground truncate font-mono text-[11px]"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="h-7 px-2.5 text-xs font-medium cursor-pointer"
            >
              <Copy className="h-3.5 w-3.5 mr-1" />
              {t('copied')}
            </Button>
          </div>
        )}

        {/* Reset Action */}
        <div className="pt-3 border-t border-border/60 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            {language === 'bn' ? 'সবকিছু ডিফল্ট করতে চান?' : 'Need a fresh start?'}
          </span>
          <button
            onClick={() => setResetDialogOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{t('resetDefaults')}</span>
          </button>
        </div>
      </CardContent>

      {/* Confirmation Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('resetDefaults')}</DialogTitle>
            <DialogDescription className="text-xs">
              {t('resetConfirm')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex items-center justify-end gap-2 pt-3">
            <Button variant="outline" size="sm" onClick={() => setResetDialogOpen(false)}>
              {t('cancel')}
            </Button>
            <Button variant="destructive" size="sm" onClick={handleConfirmReset}>
              {t('confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
