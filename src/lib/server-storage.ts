import fs from 'fs';
import path from 'path';
import os from 'os';

// Memory cache for serverless environments
let inMemoryPending: any = null;
let inMemoryApprovedOverrides: Record<string, any> = {};

const defaultPendingPath = path.join(process.cwd(), 'src', 'data', 'pending-fees.json');
const tmpPendingPath = path.join(os.tmpdir(), 'germanycostbd-pending-fees.json');

const defaultCostsPath = path.join(process.cwd(), 'data', 'costs.json');
const tmpCostsPath = path.join(os.tmpdir(), 'germanycostbd-costs.json');

export function getPendingFeesData() {
  if (inMemoryPending !== null) {
    return inMemoryPending;
  }

  // Check /tmp first (Vercel writable directory)
  if (fs.existsSync(tmpPendingPath)) {
    try {
      inMemoryPending = JSON.parse(fs.readFileSync(tmpPendingPath, 'utf8'));
      return inMemoryPending;
    } catch {}
  }

  // Fallback to static seed
  if (fs.existsSync(defaultPendingPath)) {
    try {
      inMemoryPending = JSON.parse(fs.readFileSync(defaultPendingPath, 'utf8'));
      return inMemoryPending;
    } catch {}
  }

  inMemoryPending = { pending: [] };
  return inMemoryPending;
}

export function savePendingFeesData(data: any) {
  inMemoryPending = data;

  // Try writing to local dev workspace first
  try {
    fs.writeFileSync(defaultPendingPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err: any) {
    // Expected on Vercel (EROFS: read-only file system)
    // Write safely to /tmp instead
    try {
      fs.writeFileSync(tmpPendingPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (tmpErr) {
      console.warn('Could not write to tmpdir, preserved in memory:', tmpErr);
    }
  }
}

export function applyCostItemUpdate(itemId: string, proposedValue: number) {
  inMemoryApprovedOverrides[itemId] = {
    default: proposedValue,
    lastVerified: new Date().toISOString().split('T')[0],
  };

  // Try updating costs.json if filesystem is writable (local dev)
  try {
    if (fs.existsSync(defaultCostsPath)) {
      const costs = JSON.parse(fs.readFileSync(defaultCostsPath, 'utf8'));
      const item = costs.items.find((i: any) => i.id === itemId);
      if (item) {
        item.default = proposedValue;
        item.min = Math.min(item.min, proposedValue);
        item.max = Math.max(item.max, proposedValue);
        item.lastVerified = new Date().toISOString().split('T')[0];
        fs.writeFileSync(defaultCostsPath, JSON.stringify(costs, null, 2), 'utf8');
      }
    }
  } catch (err: any) {
    // EROFS on Vercel: safely record in /tmp
    try {
      fs.writeFileSync(
        tmpCostsPath,
        JSON.stringify(inMemoryApprovedOverrides, null, 2),
        'utf8'
      );
    } catch {}
  }
}
