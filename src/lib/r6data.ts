import type { PlayerConfig, PlayerStats } from '@/types/stats';

const API_BASE = 'https://api.r6data.com';

interface RankedProfile {
  rank_points: number;
}

interface SeasonStatistics {
  kills: number;
  deaths: number;
  match_outcomes: {
    wins: number;
    losses: number;
  };
}

interface FullProfile {
  profile: RankedProfile;
  season_statistics: SeasonStatistics;
}

interface BoardProfile {
  board_id: string;
  full_profiles: FullProfile[];
}

interface PlatformProfile {
  board_ids_full_profiles: BoardProfile[];
}

function parseStats(displayName: string, username: string, raw: unknown): PlayerStats {
  const data = raw as { platform_families_full_profiles?: PlatformProfile[] };

  const rankedBoard = data.platform_families_full_profiles?.[0]
    ?.board_ids_full_profiles
    ?.find((b) => b.board_id === 'ranked');

  const fullProfile = rankedBoard?.full_profiles?.[0];
  const profile = fullProfile?.profile;
  const seasonStats = fullProfile?.season_statistics;

  const kills = seasonStats?.kills ?? 0;
  const deaths = seasonStats?.deaths ?? 0;
  const wins = seasonStats?.match_outcomes?.wins ?? 0;
  const losses = seasonStats?.match_outcomes?.losses ?? 0;
  const matchesPlayed = wins + losses;

  return {
    displayName,
    username,
    kills,
    deaths,
    kd: deaths > 0 ? kills / deaths : kills,
    wins,
    losses,
    winRate: matchesPlayed > 0 ? (wins / matchesPlayed) * 100 : 0,
    matchesPlayed,
    rankPoints: profile?.rank_points ?? 0,
  };
}

const BETWEEN_PLAYERS_DELAY = 2000;
const RETRY_DELAY = 5000;
const MAX_RETRIES = 5;

async function fetchPlayerStats(player: PlayerConfig, retries = MAX_RETRIES): Promise<PlayerStats | null> {
  const apiKey = process.env.R6DATA_API_KEY;
  if (!apiKey) throw new Error('R6DATA_API_KEY is not set in .env.local');

  const params = new URLSearchParams({
    type: 'stats',
    nameOnPlatform: player.username,
    platformType: player.platform,
    platform_families: player.platform === 'uplay' ? 'pc' : 'console',
  });

  try {
    // cache: 'no-store' prevents Next.js from caching 503s, letting retries hit the network
    const response = await fetch(`${API_BASE}/api/stats?${params}`, {
      headers: { 'api-key': apiKey },
      cache: 'no-store',
    });

    if (response.status === 503 && retries > 0) {
      const errorData = await response.json().catch(() => ({})) as { retryAfter?: number };
      const delay = Math.max(errorData.retryAfter ?? RETRY_DELAY, RETRY_DELAY);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchPlayerStats(player, retries - 1);
    }

    if (!response.ok) {
      console.error(`Failed to fetch stats for ${player.username}: ${response.status}`);
      return null;
    }

    const raw = await response.json();
    return parseStats(player.displayName, player.username, raw);
  } catch (error) {
    console.error(`Error fetching stats for ${player.username}:`, error);
    return null;
  }
}

export async function fetchAllPlayerStats(players: PlayerConfig[]): Promise<PlayerStats[]> {
  const results: PlayerStats[] = [];
  for (const player of players) {
    const stats = await fetchPlayerStats(player);
    if (stats) results.push(stats);
    await new Promise((resolve) => setTimeout(resolve, BETWEEN_PLAYERS_DELAY));
  }
  return results;
}
