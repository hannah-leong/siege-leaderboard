export interface PlayerConfig {
  displayName: string;
  username: string;
  platform: 'uplay' | 'psn' | 'xbl';
}

export interface PlayerStats {
  displayName: string;
  username: string;
  kd: number;
  kills: number;
  deaths: number;
  wins: number;
  losses: number;
  winRate: number;
  matchesPlayed: number;
  rankPoints: number;
}

export interface LeaderboardCategory {
  key: string;
  label: string;
  statKey: keyof PlayerStats;
  format: (value: number) => string;
  description: string;
}

export const CATEGORIES: LeaderboardCategory[] = [
  {
    key: 'kd',
    label: 'K/D Ratio',
    statKey: 'kd',
    format: (v) => v.toFixed(2),
    description: 'Kills per death',
  },
  {
    key: 'winRate',
    label: 'Win Rate',
    statKey: 'winRate',
    format: (v) => `${v.toFixed(1)}%`,
    description: 'Percentage of matches won',
  },
  {
    key: 'rankPoints',
    label: 'Rank (RP)',
    statKey: 'rankPoints',
    format: (v) => v.toLocaleString(),
    description: 'Current ranked points',
  },
];
