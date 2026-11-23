import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const pendingFilePath = path.join(process.cwd(), 'src', 'data', 'pending-fees.json');
const costsFilePath = path.join(process.cwd(), 'data', 'costs.json');

function getPendingData() {
  if (fs.existsSync(pendingFilePath)) {
    return JSON.parse(fs.readFileSync(pendingFilePath, 'utf8'));
  }
  return { pending: [] };
}

export async function GET() {
  const data = getPendingData();
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

    const data = getPendingData();
    const change = data.pending.find((p: any) => p.id === changeId);

    if (!change) {
      return NextResponse.json({ error: 'Change not found' }, { status: 404 });
    }

    if (action === 'approve') {
      // Update data/costs.json if it exists
      if (fs.existsSync(costsFilePath)) {
        const costs = JSON.parse(fs.readFileSync(costsFilePath, 'utf8'));
        const item = costs.items.find((i: any) => i.id === change.itemId);
        if (item) {
          item.default = change.proposedValue;
          item.min = Math.min(item.min, change.proposedValue);
          item.max = Math.max(item.max, change.proposedValue);
          item.lastVerified = new Date().toISOString().split('T')[0];
          fs.writeFileSync(costsFilePath, JSON.stringify(costs, null, 2), 'utf8');
        }
      }
    }

    // Remove from pending
    data.pending = data.pending.filter((p: any) => p.id !== changeId);
    fs.writeFileSync(pendingFilePath, JSON.stringify(data, null, 2), 'utf8');

    return NextResponse.json({ success: true, action, changeId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
