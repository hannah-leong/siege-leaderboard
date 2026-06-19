import { put, head } from '@vercel/blob';
import type { PlayerStats } from '@/types/stats';

const BLOB_PATHNAME = 'player-stats.json';
const token = process.env.BLOB_READ_WRITE_TOKEN!;

export async function writeStats(stats: PlayerStats[]): Promise<void> {
  await put(BLOB_PATHNAME, JSON.stringify(stats), {
    access: 'private',
    contentType: 'application/json',
    addRandomSuffix: false,
    allowOverwrite: true,
    token,
  });
}

export async function readStats(): Promise<PlayerStats[] | null> {
  try {
    const metadata = await head(BLOB_PATHNAME, { token }).catch(() => null);
    if (!metadata) return null;

    const response = await fetch(metadata.downloadUrl, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;

    return response.json() as Promise<PlayerStats[]>;
  } catch {
    return null;
  }
}
