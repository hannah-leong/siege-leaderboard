import { fetchAllPlayerStats } from '@/lib/r6data';
import { PLAYERS } from '@/config/players';
import Leaderboard from '@/components/Leaderboard';

export const revalidate = 600;

export default async function Home() {
  if (!process.env.R6DATA_API_KEY || process.env.R6DATA_API_KEY === 'your_api_key_here') {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <p className="text-zinc-400 text-sm">
          Add your <code className="text-yellow-400">R6DATA_API_KEY</code> to{' '}
          <code className="text-zinc-300">.env.local</code> to load stats.
        </p>
      </main>
    );
  }

  const players = await fetchAllPlayerStats(PLAYERS);

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-1">Siege Leaderboard</h1>
          <p className="text-zinc-400 text-sm">
            Stats refresh every 10 minutes &middot; {players.length} player
            {players.length !== 1 ? 's' : ''}
          </p>
        </div>

        {players.length === 0 ? (
          <p className="text-zinc-400 text-center text-sm">
            No stats found. Check your player usernames in{' '}
            <code className="text-zinc-300">src/config/players.ts</code>.
          </p>
        ) : (
          <Leaderboard players={players} />
        )}
      </div>
    </main>
  );
}
