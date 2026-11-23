import { NextResponse } from 'next/server';

// Memory cache fallback in case API fails
let cachedRate = 128.50;
let lastFetchedAt = Date.now();

export async function GET() {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/EUR', {
      next: { revalidate: 3600 },
      headers: {
        'User-Agent': 'GermanyCostBD/1.0',
      },
    });

    if (!res.ok) {
      throw new Error(`Upstream API failed with status ${res.status}`);
    }

    const data = await res.json();
    const bdtRate = data?.rates?.BDT;

    if (bdtRate && typeof bdtRate === 'number') {
      cachedRate = Number(bdtRate.toFixed(2));
      lastFetchedAt = Date.now();

      return NextResponse.json({
        success: true,
        rate: cachedRate,
        source: 'open.er-api.com',
        timestamp: lastFetchedAt,
        cached: false,
      });
    }

    throw new Error('BDT rate missing from response');
  } catch (error: any) {
    console.error('Failed to fetch live EUR rate, serving cached/fallback:', error?.message);

    return NextResponse.json({
      success: true,
      rate: cachedRate,
      source: 'fallback-cache',
      timestamp: lastFetchedAt,
      cached: true,
      warning: 'Live exchange rate temporarily unavailable; using last verified rate.',
    });
  }
}
