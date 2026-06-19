import { NextResponse } from 'next/server';
import { writeStats } from '@/lib/stats-store';
import type { PlayerStats } from '@/types/stats';

export async function POST(request: Request) {
  const secret = request.headers.get('x-update-secret');
  if (secret !== process.env.UPDATE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let stats: PlayerStats[];
  try {
    stats = await request.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    await writeStats(stats);
  } catch (e) {
    console.error('writeStats failed:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }

  return NextResponse.json({ updated: stats.length, players: stats.map((s) => s.username) });
}
