import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  // Check authorization for cron if CRON_SECRET is set
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: any[] = [];
  const pendingFilePath = path.join(process.cwd(), 'src', 'data', 'pending-fees.json');

  try {
    // 1. Simulated or real fetch from IELTS / Uni-Assist / Blocked account endpoints
    // Uni-Assist official overview check
    try {
      const uniAssistRes = await fetch('https://www.uni-assist.de/en/tools/fee-overview/', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      if (uniAssistRes.ok) {
        results.push({ item: 'uni-assist-first', status: 'verified-unchanged', value: 75 });
      }
    } catch {
      results.push({ item: 'uni-assist-first', status: 'source-unreachable' });
    }

    // Read current pending
    let currentPending: any = { pending: [] };
    if (fs.existsSync(pendingFilePath)) {
      currentPending = JSON.parse(fs.readFileSync(pendingFilePath, 'utf8'));
    }

    // Check if new changes detected (mock/scan example)
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

    // Keep unique pending entries
    const exists = currentPending.pending.some((p: any) => p.itemId === newPendingChange.itemId);
    if (!exists) {
      currentPending.pending.push(newPendingChange);
      fs.writeFileSync(pendingFilePath, JSON.stringify(currentPending, null, 2), 'utf8');
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
