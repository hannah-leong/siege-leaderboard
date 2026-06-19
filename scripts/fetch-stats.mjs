import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const players = JSON.parse(readFileSync(join(__dirname, '../src/config/players.json'), 'utf8'));

const API_BASE = 'https://api.r6data.com';
const BETWEEN_PLAYERS_DELAY = 2000;
const RETRY_DELAY = 5000;
const MAX_RETRIES = 5;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseStats(displayName, username, raw) {
  const rankedBoard = raw.platform_families_full_profiles?.[0]
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

async function fetchPlayer(player, retries = MAX_RETRIES) {
  const params = new URLSearchParams({
    type: 'stats',
    nameOnPlatform: player.username,
    platformType: player.platform,
    platform_families: 'pc',
  });

  const response = await fetch(`${API_BASE}/api/stats?${params}`, {
    headers: { 'api-key': process.env.R6DATA_API_KEY },
  });

  let data;
  try {
    data = await response.json();
  } catch {
    console.error(`  bad JSON response (status ${response.status}), retrying...`);
    if (retries > 0) {
      await sleep(RETRY_DELAY);
      return fetchPlayer(player, retries - 1);
    }
    return null;
  }

  if (response.status === 503 && retries > 0) {
    const delay = Math.max(data.retryAfter ?? RETRY_DELAY, RETRY_DELAY);
    console.log(`  throttled, retrying in ${delay}ms (${retries} retries left)...`);
    await sleep(delay);
    return fetchPlayer(player, retries - 1);
  }

  if (!response.ok) {
    console.error(`  failed: ${response.status}`);
    return null;
  }

  return parseStats(player.displayName, player.username, data);
}

async function main() {
  const stats = [];

  for (const player of players) {
    console.log(`Fetching ${player.displayName}...`);
    const result = await fetchPlayer(player);
    if (result) {
      stats.push(result);
      console.log(`  kd=${result.kd.toFixed(2)} winRate=${result.winRate.toFixed(1)}% rp=${result.rankPoints}`);
    }
    await sleep(BETWEEN_PLAYERS_DELAY);
  }

  console.log(`\nPosting ${stats.length} players to leaderboard...`);

  const response = await fetch(`https://${process.env.LEADERBOARD_URL}/api/update-stats`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-update-secret': process.env.UPDATE_SECRET,
    },
    body: JSON.stringify(stats),
  });

  const text = await response.text();
  console.log(`Response ${response.status}:`, text);

  if (!response.ok) {
    throw new Error(`Update failed: ${response.status} ${text}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
