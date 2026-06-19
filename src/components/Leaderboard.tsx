'use client';

import { useState } from 'react';
import type { PlayerStats } from '@/types/stats';
import { CATEGORIES } from '@/types/stats';

const RANK_COLOURS = ['text-yellow-400', 'text-slate-400', 'text-amber-600'];
const RANK_BG = ['bg-yellow-400/10', 'bg-slate-400/5', 'bg-amber-600/5'];

export default function Leaderboard({ players }: { players: PlayerStats[] }) {
  const [activeCategoryKey, setActiveCategoryKey] = useState(CATEGORIES[0].key);

  const activeCategory = CATEGORIES.find((c) => c.key === activeCategoryKey)!;
  const otherCategories = CATEGORIES.filter((c) => c.key !== activeCategoryKey);

  const sorted = [...players].sort(
    (a, b) => (b[activeCategory.statKey] as number) - (a[activeCategory.statKey] as number),
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategoryKey(cat.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              cat.key === activeCategoryKey
                ? 'bg-yellow-400 text-zinc-950'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl overflow-hidden border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-zinc-900 text-zinc-400 text-xs uppercase tracking-wider">
              <th className="px-4 py-3 text-left w-14">Rank</th>
              <th className="px-4 py-3 text-left">Player</th>
              <th className="px-4 py-3 text-right text-yellow-400">{activeCategory.label}</th>
              {otherCategories.map((c) => (
                <th key={c.key} className="px-4 py-3 text-right hidden md:table-cell">
                  {c.label}
                </th>
              ))}
              <th className="px-4 py-3 text-right hidden md:table-cell">Matches</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((player, i) => (
              <tr
                key={player.username}
                className={`border-t border-zinc-800 transition-colors ${
                  i < 3 ? RANK_BG[i] : 'bg-zinc-950 hover:bg-zinc-900'
                }`}
              >
                <td className="px-4 py-3">
                  <span className={`text-base font-bold ${RANK_COLOURS[i] ?? 'text-zinc-500'}`}>
                    #{i + 1}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-white">{player.displayName}</td>
                <td className="px-4 py-3 text-right font-bold text-yellow-400">
                  {activeCategory.format(player[activeCategory.statKey] as number)}
                </td>
                {otherCategories.map((c) => (
                  <td key={c.key} className="px-4 py-3 text-right text-zinc-400 hidden md:table-cell">
                    {c.format(player[c.statKey] as number)}
                  </td>
                ))}
                <td className="px-4 py-3 text-right text-zinc-400 hidden md:table-cell">
                  {player.matchesPlayed.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
