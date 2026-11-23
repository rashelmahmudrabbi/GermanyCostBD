import { NextResponse } from 'next/server';
import {
  getPendingFeesData,
  savePendingFeesData,
  applyCostItemUpdate,
} from '@/lib/server-storage';

export async function GET() {
  const data = getPendingFeesData();
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password, changeId, action } = body;

    const expectedPassword = process.env.ADMIN_PASSWORD || 'germany2026';
    if (password !== expectedPassword) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
    }

    const data = getPendingFeesData();
    const change = data.pending.find((p: any) => p.id === changeId);

    if (!change) {
      return NextResponse.json({ error: 'Change not found' }, { status: 404 });
    }

    const verifiedDate = new Date().toISOString().split('T')[0];

    if (action === 'approve') {
      applyCostItemUpdate(change.itemId, change.proposedValue);
    }

    // Remove from pending
    data.pending = data.pending.filter((p: any) => p.id !== changeId);
    savePendingFeesData(data);

    return NextResponse.json({
      success: true,
      action,
      changeId,
      updatedItem: action === 'approve' ? {
        itemId: change.itemId,
        proposedValue: change.proposedValue,
        lastVerified: verifiedDate,
      } : null,
    });
  } catch (error: any) {
    console.error('Pending fee action error:', error);
    return NextResponse.json({ error: error.message || 'Operation failed' }, { status: 500 });
  }
}
