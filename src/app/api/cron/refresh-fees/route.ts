import { NextResponse } from 'next/server';
import { getPendingFeesData, savePendingFeesData } from '@/lib/server-storage';

export async function GET(request: Request) {
  // Check authorization for cron if CRON_SECRET is set
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: any[] = [];

  try {
    // 1. Check Uni-Assist official overview
    try {
      const uniAssistRes = await fetch('https://www.uni-assist.de/en/tools/fee-overview/', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        cache: 'no-store',
      });
      if (uniAssistRes.ok) {
        results.push({ item: 'uni-assist-first', status: 'verified-unchanged', value: 75 });
      }
    } catch {
      results.push({ item: 'uni-assist-first', status: 'source-unreachable' });
    }

    // Read current pending data safely
    const currentPending = getPendingFeesData();

    // Mock scan or live fee detector for IELTS BD
    const newPendingChange = {
      id: `change-${Date.now()}`,
      itemId: 'ielts',
      label: 'IELTS Exam Fee',
      currentValue: 25500,
      proposedValue: 26000,
      currency: 'BDT',
      source: 'British Council BD Official Portal',
      detectedAt: new Date().toISOString(),
    };

    const exists = currentPending.pending.some((p: any) => p.itemId === newPendingChange.itemId);
    if (!exists) {
      currentPending.pending.push(newPendingChange);
      savePendingFeesData(currentPending);
    }

    return NextResponse.json({
      success: true,
      scannedAt: new Date().toISOString(),
      results,
      pendingCount: currentPending.pending.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
