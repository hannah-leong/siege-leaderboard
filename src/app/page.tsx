import { readStats } from '@/lib/stats-store';
import Leaderboard from '@/components/Leaderboard';

export const revalidate = 60;

export default async function Home() {
  const players = await readStats();

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-1">Siege Leaderboard</h1>
          {players && (
            <p className="text-zinc-400 text-sm">
              {players.length} player{players.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {!players ? (
          <p className="text-zinc-400 text-center text-sm">
            Stats not loaded yet — the first update is still running.
          </p>
        ) : (
          <Leaderboard players={players} />
        )}
      </div>
    </main>
  );
}
