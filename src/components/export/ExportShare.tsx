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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Print/PDF */}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="h-10 text-xs flex flex-col items-center justify-center gap-1 py-1"
          >
            <Printer className="h-4 w-4" />
            <span>{t('exportPDF')}</span>
          </Button>

          {/* Export JSON */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportJSON}
            className="h-10 text-xs flex flex-col items-center justify-center gap-1 py-1"
          >
            <Download className="h-4 w-4" />
            <span>{t('exportJSON')}</span>
          </Button>

          {/* Import JSON */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="h-10 text-xs flex flex-col items-center justify-center gap-1 py-1"
          >
            <Upload className="h-4 w-4" />
            <span>{t('importJSON')}</span>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Share Link */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateShareLink}
            className="h-10 text-xs flex flex-col items-center justify-center gap-1 py-1"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Share2 className="h-4 w-4" />}
            <span>{copied ? t('copied') : t('shareLink')}</span>
          </Button>
        </div>

        {/* Share link input if generated */}
        {shareUrl && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/60 border text-xs">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="bg-transparent flex-1 outline-none text-muted-foreground truncate font-mono text-[11px]"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="h-7 px-2 text-xs"
            >
              <Copy className="h-3.5 w-3.5 mr-1" />
              {t('copied')}
            </Button>
          </div>
        )}

        {/* Reset Button */}
        <div className="pt-2 border-t flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setResetDialogOpen(true)}
            className="text-xs text-muted-foreground hover:text-destructive h-8 gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t('resetDefaults')}
          </Button>
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
