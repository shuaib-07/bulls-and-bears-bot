"use client";

import { motion } from "motion/react";
import { Trophy } from "lucide-react";
import type { ScoresAnnouncement } from "@/src/lib/final-scores";
import { formatCurrency } from "@/src/lib/utils";

export function FinalResults({ announcement }: { announcement: ScoresAnnouncement }) {
  const { teams, revealedCount } = announcement;
  const current = teams[teams.length - revealedCount];
  const revealed = teams.slice(teams.length - revealedCount);
  const complete = revealedCount === teams.length;

  return (
    <main className="responsive-page min-h-dvh bg-[#030303] text-white p-4 sm:p-8 font-mono cyber-grid">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#27272a] pb-4">
          <div>
            <p className="text-xs text-amber-400 uppercase tracking-widest">Bulls &amp; Bears · Official final scores</p>
            <h1 className="font-display text-xl sm:text-3xl font-bold mt-2">{complete ? "Final Standings" : "The Final Countdown"}</h1>
          </div>
          <p className="text-xs text-[#a1a1aa]">{revealedCount} / {teams.length} teams announced · Scores frozen</p>
        </header>

        {!current ? (
          <div className="py-20 text-center space-y-4">
            <Trophy className="w-12 h-12 mx-auto text-amber-400" />
            <h2 className="text-xl sm:text-3xl font-display">Results are ready</h2>
            <p className="text-sm text-[#a1a1aa]">Waiting for the host to reveal the first team. Last place to first.</p>
          </div>
        ) : (
          <motion.section key={current.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className={`p-4 sm:p-6 rounded-2xl border space-y-5 ${current.rank === 1 ? "border-amber-500 bg-amber-500/5" : "border-[#27272a] bg-[#09090b]"}`}>
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-3xl sm:text-5xl font-display font-bold text-amber-400">#{current.rank}</span>
              <div>
                <p className="text-xs uppercase tracking-widest text-[#a1a1aa]">{current.rank === 1 ? "First place" : "Official placement"}</p>
                <h2 className="text-2xl sm:text-4xl font-display font-bold break-words">{current.teamName}</h2>
              </div>
            </div>
            <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                ["Final score / net worth", current.totalValue],
                ["Cash balance", current.cashBalance],
                ["Stock holdings value", current.holdingsValue],
                ["Profit / loss", current.profit],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0 rounded-lg bg-black/40 p-3 border border-[#27272a]">
                  <dt className="text-[10px] uppercase text-[#a1a1aa]">{label}</dt>
                  <dd className="text-sm min-[400px]:text-lg sm:text-xl font-bold text-emerald-400 mt-2 break-words">{formatCurrency(Number(value))}</dd>
                </div>
              ))}
            </dl>
            <div>
              <h3 className="font-bold text-sm mb-3">Final stock holdings</h3>
              {!current.holdings.length ? <p className="text-sm text-[#a1a1aa]">No stocks held. Final score consists of cash.</p> : (
                <div className="overflow-x-auto rounded-lg border border-[#27272a]">
                  <table className="w-full min-w-[440px] text-xs text-left">
                    <thead className="text-[#a1a1aa] bg-black/40"><tr><th scope="col" className="p-3">Stock</th><th scope="col" className="p-3 text-right">Shares</th><th scope="col" className="p-3 text-right">Final price</th><th scope="col" className="p-3 text-right">Holding value</th></tr></thead>
                    <tbody>{current.holdings.map((holding) => <tr key={holding.ticker} className="border-t border-[#27272a]"><th scope="row" className="p-3">{holding.ticker}<span className="block font-normal text-[#71717a] mt-1">{holding.name}</span></th><td className="p-3 text-right">{holding.quantity}</td><td className="p-3 text-right">{formatCurrency(holding.price)}</td><td className="p-3 text-right text-emerald-400">{formatCurrency(holding.value)}</td></tr>)}</tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.section>
        )}

        {revealed.length > 0 && (
          <section className="rounded-xl border border-[#27272a] p-4 bg-[#09090b]">
            <h2 className="font-bold text-sm mb-3">{complete ? "All final scores" : "Teams announced so far"}</h2>
            <ol className="space-y-2">{revealed.map((team) => <li key={team.id} className="flex flex-wrap justify-between gap-2 border-t border-[#1e1e1e] py-2 text-sm"><span className="break-words">#{team.rank} · {team.teamName}</span><strong className="text-emerald-400">{formatCurrency(team.totalValue)}</strong></li>)}</ol>
          </section>
        )}
      </div>
    </main>
  );
}
